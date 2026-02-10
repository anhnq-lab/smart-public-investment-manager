import { supabase } from './supabase';

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
    created_at: string;
}

const BUCKET = 'bim-models';

/**
 * Detect discipline from filename
 * e.g. "25032-CRCVN_CIC_ARCH_ZZ_ZZ" → "ARCH"
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
 * Upload an IFC file to Supabase Storage and create database record
 */
export async function uploadIFCFile(
    projectId: string,
    file: File,
    onProgress?: (percent: number) => void
): Promise<BimModel> {
    const storagePath = `${projectId}/${file.name}`;
    const discipline = detectDiscipline(file.name);

    // Create database record first
    const { data: record, error: dbError } = await supabase
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

    // Upload file to storage
    const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: true,
        });

    if (uploadError) {
        // Update status to error on failure
        await supabase.from('bim_models').update({ status: 'error', error_message: uploadError.message }).eq('id', record.id);
        throw new Error(`Upload error: ${uploadError.message}`);
    }

    // Mark as converting
    await supabase.from('bim_models').update({ status: 'converting' }).eq('id', record.id);

    onProgress?.(100);
    return record;
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
    const fragPath = `${projectId}/${fileName.replace(/\.ifc$/i, '.frag')}`;

    const { error } = await supabase.storage
        .from(BUCKET)
        .upload(fragPath, fragData, {
            cacheControl: '31536000', // 1 year cache (immutable)
            upsert: true,
            contentType: 'application/octet-stream',
        });

    if (error) throw new Error(`Fragment upload error: ${error.message}`);

    // Update record with frag path and set ready
    await supabase
        .from('bim_models')
        .update({ frag_path: fragPath, status: 'ready' })
        .eq('id', modelId);
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
    const propsPath = `${projectId}/${fileName.replace(/\.ifc$/i, '-properties.json')}`;

    const { error } = await supabase.storage
        .from(BUCKET)
        .upload(propsPath, propertiesJson, {
            cacheControl: '31536000',
            upsert: true,
            contentType: 'application/json',
        });

    if (error) throw new Error(`Properties upload error: ${error.message}`);

    await supabase
        .from('bim_models')
        .update({ properties_path: propsPath })
        .eq('id', modelId);
}

/**
 * Get all BIM models for a project
 */
export async function getProjectModels(projectId: string): Promise<BimModel[]> {
    const { data, error } = await supabase
        .from('bim_models')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

    if (error) throw new Error(`Fetch error: ${error.message}`);
    return data || [];
}

/**
 * Get public URL for a file in storage
 */
export function getStorageUrl(path: string): string {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
}

/**
 * Download a file from storage as ArrayBuffer
 */
export async function downloadFile(path: string): Promise<ArrayBuffer> {
    const { data, error } = await supabase.storage.from(BUCKET).download(path);
    if (error) throw new Error(`Download error: ${error.message}`);
    return await data.arrayBuffer();
}

/**
 * Delete a BIM model and its files
 */
export async function deleteModel(model: BimModel): Promise<void> {
    const filesToDelete: string[] = [];
    if (model.ifc_path) filesToDelete.push(model.ifc_path);
    if (model.frag_path) filesToDelete.push(model.frag_path);
    if (model.properties_path) filesToDelete.push(model.properties_path);

    if (filesToDelete.length > 0) {
        await supabase.storage.from(BUCKET).remove(filesToDelete);
    }

    await supabase.from('bim_models').delete().eq('id', model.id);
}

/**
 * Update model status and optional fields
 */
export async function updateModelStatus(
    modelId: string,
    status: BimModel['status'],
    extra?: Partial<BimModel>
): Promise<void> {
    await supabase
        .from('bim_models')
        .update({ status, ...extra, updated_at: new Date().toISOString() })
        .eq('id', modelId);
}
