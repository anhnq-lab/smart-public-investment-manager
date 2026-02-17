import { supabase } from './supabase';
import * as tus from 'tus-js-client';

export interface BimModel {
    id: string;
    project_id: string;
    file_name: string;
    file_size: number | null;
    discipline: string | null;
    ifc_path: string | null;
    frag_path: string | null;
    properties_path: string | null;
    status: 'uploading' | 'converting' | 'ready' | 'error';
    element_count: number | null;
    error_message: string | null;
    uploaded_by: string | null;
    created_at: string;
    updated_at: string | null;
}

const BUCKET = 'bim-models';
const RESUMABLE_THRESHOLD = 6 * 1024 * 1024; // 6MB — use resumable upload above this

function requireSupabase() {
    if (!supabase) throw new Error('Supabase chưa được cấu hình. Vui lòng thiết lập VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY trong file .env');
    return supabase;
}

/**
 * Detect discipline from filename
 */
function detectDiscipline(fileName: string): string | null {
    const upper = fileName.toUpperCase();
    const disciplines = ['ARCH', 'STRU', 'ELEC', 'HVAC', 'PLUM', 'FIRE', 'LAND', 'COMBINE', 'MEP'];
    for (const d of disciplines) {
        if (upper.includes(`_${d}_`) || upper.includes(`_${d}.`) || upper.endsWith(`_${d}`)) {
            return d;
        }
    }
    return null;
}

/**
 * Resumable upload using TUS protocol — for files > 6MB
 * Splits file into chunks, auto-retries on failure, reports progress.
 */
async function resumableUpload(
    storagePath: string,
    file: File,
    onProgress?: (percent: number) => void
): Promise<void> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    // Use auth session token if available, otherwise fall back to anon key
    let token = anonKey;
    try {
        const { data: { session } } = await supabase!.auth.getSession();
        if (session?.access_token) {
            token = session.access_token;
        }
    } catch {
        // No auth session — use anon key for public bucket
    }

    return new Promise((resolve, reject) => {
        const upload = new tus.Upload(file, {
            endpoint: `${supabaseUrl}/storage/v1/upload/resumable`,
            retryDelays: [0, 1000, 3000, 5000],
            headers: {
                authorization: `Bearer ${token}`,
                'x-upsert': 'true',
            },
            uploadDataDuringCreation: true,
            removeFingerprintOnSuccess: true,
            metadata: {
                bucketName: BUCKET,
                objectName: storagePath,
                contentType: 'application/octet-stream',
                cacheControl: '3600',
            },
            chunkSize: 6 * 1024 * 1024, // 6MB chunks
            onError: (error) => {
                console.error('Resumable upload error:', error);
                reject(new Error(`Upload error: ${error.message}`));
            },
            onProgress: (bytesUploaded, bytesTotal) => {
                const pct = Math.round((bytesUploaded / bytesTotal) * 100);
                onProgress?.(pct);
            },
            onSuccess: () => {
                onProgress?.(100);
                resolve();
            },
        });

        // Check for previous uploads to resume
        upload.findPreviousUploads().then((previousUploads) => {
            if (previousUploads.length > 0) {
                upload.resumeFromPreviousUpload(previousUploads[0]);
            }
            upload.start();
        });
    });
}

/**
 * Upload an IFC file to Supabase Storage and create database record
 * Uses standard upload for small files, resumable TUS upload for large files.
 */
export async function uploadIFCFile(
    projectId: string,
    file: File,
    onProgress?: (percent: number) => void
): Promise<BimModel> {
    const sb = requireSupabase();
    const storagePath = `${projectId}/${file.name}`;
    const discipline = detectDiscipline(file.name);

    const { data: record, error: dbError } = await sb
        .from('bim_models')
        .insert({
            project_id: projectId,
            file_name: file.name,
            file_size: file.size,
            discipline,
            ifc_path: storagePath,
            status: 'uploading',
        })
        .select()
        .single();

    if (dbError) throw new Error(`Database error: ${dbError.message}`);

    try {
        if (file.size > RESUMABLE_THRESHOLD) {
            // Large file → TUS resumable upload (chunked, retryable)
            console.log(`📦 Using resumable upload for ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`);
            await resumableUpload(storagePath, file, onProgress);
        } else {
            // Small file → standard upload
            const { error: uploadError } = await sb.storage
                .from(BUCKET)
                .upload(storagePath, file, { cacheControl: '3600', upsert: true });

            if (uploadError) throw uploadError;
            onProgress?.(100);
        }
    } catch (err: any) {
        await sb.from('bim_models').update({ status: 'error', error_message: err.message }).eq('id', record.id);
        throw new Error(`Upload error: ${err.message}`);
    }

    await sb.from('bim_models').update({ status: 'converting' }).eq('id', record.id);
    return record as BimModel;
}

/**
 * Upload converted Fragments binary to Storage
 */
export async function uploadFragments(
    modelId: string,
    projectId: string,
    fragData: Uint8Array,
    fileName: string
): Promise<void> {
    const sb = requireSupabase();
    const fragPath = `${projectId}/${fileName.replace(/\.ifc$/i, '.frag')}`;

    const { error } = await sb.storage
        .from(BUCKET)
        .upload(fragPath, fragData, { cacheControl: '31536000', upsert: true, contentType: 'application/octet-stream' });

    if (error) throw new Error(`Fragment upload error: ${error.message}`);

    await sb.from('bim_models').update({ frag_path: fragPath, status: 'ready' }).eq('id', modelId);
}

/**
 * Upload properties JSON to Storage
 */
export async function uploadProperties(
    modelId: string,
    projectId: string,
    propertiesJson: string,
    fileName: string
): Promise<void> {
    const sb = requireSupabase();
    const propsPath = `${projectId}/${fileName.replace(/\.ifc$/i, '-properties.json')}`;

    const { error } = await sb.storage
        .from(BUCKET)
        .upload(propsPath, propertiesJson, { cacheControl: '31536000', upsert: true, contentType: 'application/json' });

    if (error) throw new Error(`Properties upload error: ${error.message}`);

    await sb.from('bim_models').update({ properties_path: propsPath }).eq('id', modelId);
}

/**
 * Get all BIM models for a project
 */
export async function getProjectModels(projectId: string): Promise<BimModel[]> {
    if (!supabase) return []; // Gracefully return empty if not configured
    const { data, error } = await supabase
        .from('bim_models')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

    if (error) throw new Error(`Fetch error: ${error.message}`);
    return (data || []) as BimModel[];
}

/**
 * Get public URL for a file in storage
 */
export function getStorageUrl(path: string): string {
    const sb = requireSupabase();
    const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
}

/**
 * Download a file from storage as ArrayBuffer
 */
export async function downloadFile(path: string): Promise<ArrayBuffer> {
    const sb = requireSupabase();
    const { data, error } = await sb.storage.from(BUCKET).download(path);
    if (error) throw new Error(`Download error: ${error.message}`);
    return await data.arrayBuffer();
}

/**
 * Delete a BIM model and its files
 */
export async function deleteModel(model: BimModel): Promise<void> {
    const sb = requireSupabase();
    const filesToDelete: string[] = [];
    if (model.ifc_path) filesToDelete.push(model.ifc_path);
    if (model.frag_path) filesToDelete.push(model.frag_path);
    if (model.properties_path) filesToDelete.push(model.properties_path);

    if (filesToDelete.length > 0) {
        await sb.storage.from(BUCKET).remove(filesToDelete);
    }
    await sb.from('bim_models').delete().eq('id', model.id);
}

/**
 * Update model status and optional fields
 */
export async function updateModelStatus(
    modelId: string,
    status: BimModel['status'],
    extra?: Partial<BimModel>
): Promise<void> {
    const sb = requireSupabase();
    await sb.from('bim_models')
        .update({ status, ...extra, updated_at: new Date().toISOString() } as any)
        .eq('id', modelId);
}
