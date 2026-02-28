/**
 * useBimUpload — Upload IFC files, convert to model, load existing models
 * Handles: upload → load → cache. Error recovery with retry.
 */
import React, { useRef, useState, useCallback } from 'react';
import * as OBC from '@thatopen/components';
import * as THREE from 'three';
import {
    uploadIFCFile, getProjectModels,
    downloadFile, deleteModel, updateModelStatus,
    type BimModel
} from '../../../../lib/bimStorage';


export type LoadStatus = 'idle' | 'initializing' | 'loading' | 'converting' | 'success' | 'error';

export interface DisciplineModel {
    model: BimModel;
    visible: boolean;
    fragModel?: any;
}

export interface BimUploadAPI {
    status: LoadStatus;
    statusMessage: string;
    loadingProgress: number;
    disciplineModels: DisciplineModel[];
    objectCount: number;
    ifcDataMapRef: React.MutableRefObject<Map<string, Uint8Array>>;
    // Actions
    handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleMultiFileUpload: (files: FileList) => void;
    loadExistingModels: () => Promise<void>;
    toggleDisciplineVisibility: (index: number) => void;
    handleDeleteModel: (index: number) => void;
    retryFailedModel: (index: number) => void;
    clearStatus: () => void;
    cancelUpload: () => void;
    validationError: string | null;
}

export function useBimUpload(
    projectID: string,
    componentsRef: React.MutableRefObject<OBC.Components | null>,
    worldRef: React.MutableRefObject<OBC.World | null>,
    ifcLoaderRef: React.MutableRefObject<OBC.IfcLoader | null>,
    onModelLoaded?: (ifcData: Uint8Array) => void,
): BimUploadAPI {
    const [status, setStatus] = useState<LoadStatus>('idle');
    const [statusMessage, setStatusMessage] = useState('');
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [disciplineModels, setDisciplineModels] = useState<DisciplineModel[]>([]);
    const [objectCount, setObjectCount] = useState(0);

    // Store raw IFC data for property lookups
    const ifcDataMapRef = useRef<Map<string, Uint8Array>>(new Map());
    const abortControllerRef = useRef<AbortController | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);

    // ── File validation ────────────────────────
    const MAX_FILE_SIZE = 150 * 1024 * 1024; // 150MB
    const validateFile = useCallback((file: File): string | null => {
        const ext = file.name.toLowerCase().split('.').pop();
        if (ext !== 'ifc') {
            return `"${file.name}" không phải file IFC. Chỉ chấp nhận file .ifc`;
        }
        if (file.size > MAX_FILE_SIZE) {
            return `"${file.name}" quá lớn (${(file.size / 1024 / 1024).toFixed(0)}MB). Giới hạn ${MAX_FILE_SIZE / 1024 / 1024}MB`;
        }
        if (file.size < 100) {
            return `"${file.name}" quá nhỏ, có thể bị lỗi`;
        }
        return null;
    }, []);

    // ── Load existing models from Supabase ──────────
    const loadExistingModels = useCallback(async () => {
        try {
            const models = await getProjectModels(projectID);
            if (models.length === 0) return;

            // Filter models that are ready and have an IFC path
            const readyModels = models.filter(m => m.status === 'ready' && m.ifc_path);
            if (readyModels.length === 0) {
                setDisciplineModels(models.map(m => ({ model: m, visible: false })));
                return;
            }

            setStatus('loading');
            setStatusMessage(`Đang tải ${readyModels.length} mô hình...`);

            const newDisciplineModels: DisciplineModel[] = [];
            const ifcLoader = ifcLoaderRef.current;
            let completed = 0;

            // Load models in parallel for speed
            const loadPromises = readyModels.map(async (m) => {
                try {
                    const ifcBuffer = await downloadFile(m.ifc_path!);
                    const uint8Array = new Uint8Array(ifcBuffer);

                    if (ifcLoader && worldRef.current) {
                        const model = await ifcLoader.load(uint8Array, true, m.file_name);
                        const groupUuid = (model as any).uuid || (model as any).id;
                        if (groupUuid) ifcDataMapRef.current.set(groupUuid, uint8Array);
                        ifcDataMapRef.current.set(m.file_name, uint8Array);
                        onModelLoaded?.(uint8Array);

                        completed++;
                        setLoadingProgress((completed / readyModels.length) * 100);
                        setStatusMessage(`Đã tải ${completed}/${readyModels.length}: ${m.file_name}`);

                        return { model: m, visible: true, fragModel: model } as DisciplineModel;
                    }
                    return { model: m, visible: false } as DisciplineModel;
                } catch (err) {
                    console.warn(`Failed to load ${m.file_name}:`, err);
                    completed++;
                    setLoadingProgress((completed / readyModels.length) * 100);
                    return { model: m, visible: false } as DisciplineModel;
                }
            });

            const results = await Promise.allSettled(loadPromises);
            results.forEach(r => {
                if (r.status === 'fulfilled') newDisciplineModels.push(r.value);
            });

            // Add non-ready models
            models.filter(m => m.status !== 'ready' || !m.ifc_path).forEach(m => {
                newDisciplineModels.push({ model: m, visible: false });
            });

            setDisciplineModels(newDisciplineModels);
            const total = newDisciplineModels.reduce((sum, dm) => sum + (dm.model.element_count || 0), 0);
            setObjectCount(total);

            setStatus('success');
            setStatusMessage(`Đã tải ${readyModels.length} mô hình thành công`);
            setLoadingProgress(100);
            setTimeout(() => { setStatus('idle'); setStatusMessage(''); }, 3000);


        } catch (err: any) {
            console.warn('Load models error:', err);
            setStatus('error');
            setStatusMessage(`Lỗi tải models: ${err.message}`);
        }
    }, [projectID, componentsRef, worldRef, ifcLoaderRef, onModelLoaded]);

    // ── Upload & Convert IFC ────────────────────────
    const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !componentsRef.current || !worldRef.current) return;
        e.target.value = '';

        // Validate
        const error = validateFile(file);
        if (error) {
            setValidationError(error);
            setTimeout(() => setValidationError(null), 5000);
            return;
        }
        setValidationError(null);

        try {
            setStatus('loading');
            setStatusMessage(`Đang upload ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)...`);
            setLoadingProgress(5);

            // Pass progress callback for real-time tracking (especially for large files)
            const record = await uploadIFCFile(projectID, file, (pct) => {
                // Upload phase takes 0-60% of total progress
                setLoadingProgress(Math.round(pct * 0.6));
                setStatusMessage(`Đang upload ${file.name}... ${pct}%`);
            });
            setLoadingProgress(60);

            setStatus('converting');
            setStatusMessage(`Đang convert ${file.name}...`);

            const ifcLoader = componentsRef.current.get(OBC.IfcLoader);
            const buffer = await file.arrayBuffer();
            const uint8Array = new Uint8Array(buffer);

            const model = await ifcLoader.load(uint8Array, true, file.name);
            setLoadingProgress(85);

            // Store IFC data using FragmentsGroup UUID (matches Highlighter events)
            const groupUuid = (model as any).uuid || (model as any).id;
            if (groupUuid) ifcDataMapRef.current.set(groupUuid, uint8Array);
            ifcDataMapRef.current.set(file.name, uint8Array);

            // Calculate element count from fragments safely
            let elementCount = (model as any).elementCount || 0;
            if (elementCount === 0 && (model as any).children) {
                const ids = new Set<number>();
                (model as any).children.forEach((child: any) => {
                    if (child.itemIDs && typeof child.itemIDs.forEach === 'function') {
                        child.itemIDs.forEach((id: number) => ids.add(id));
                    } else if (Array.isArray(child.items)) {
                        child.items.forEach((id: number) => ids.add(id));
                    }
                });
                elementCount = ids.size;
            }

            // Mark model as ready
            await updateModelStatus(record.id, 'ready', { element_count: elementCount });
            setLoadingProgress(90);



            setDisciplineModels(prev => [...prev, {
                model: { ...record, status: 'ready', element_count: elementCount },
                visible: true,
                fragModel: model,
            }]);
            setObjectCount(prev => prev + elementCount);

            // Notify parent to build spatial tree
            onModelLoaded?.(uint8Array);

            // Fit camera to model
            const camera = worldRef.current.camera as OBC.SimpleCamera;
            let targetObj = (model as any).object || model; // In TOC v2, model itself is a THREE.Group
            try {
                if (targetObj instanceof THREE.Object3D) {
                    const box = new THREE.Box3().setFromObject(targetObj);
                    if (!box.isEmpty()) {
                        const sphere = new THREE.Sphere();
                        box.getBoundingSphere(sphere);
                        camera.controls.fitToSphere(sphere, true);
                    }
                }
            } catch (err) {
                console.warn('Could not fit camera to model automatically:', err);
            }

            setStatus('success');
            setStatusMessage(`✅ ${file.name} loaded`);
            setLoadingProgress(100);
            setTimeout(() => { setStatus('idle'); setStatusMessage(''); }, 3000);
        } catch (err: any) {
            console.error('Upload/convert error:', err);
            setStatus('error');
            setStatusMessage(`Lỗi: ${err.message}`);
        }
    }, [projectID, componentsRef, worldRef, ifcLoaderRef, onModelLoaded]);

    // ── Toggle visibility ───────────────────────────
    const toggleDisciplineVisibility = useCallback((index: number) => {
        setDisciplineModels(prev => {
            const updated = [...prev];
            const dm = updated[index];
            if (dm.fragModel) {
                dm.visible = !dm.visible;
                const obj = (dm.fragModel as any).object || dm.fragModel;
                if (obj) obj.visible = dm.visible;
            }
            return updated;
        });
    }, []);

    // ── Delete model ────────────────────────────────
    const handleDeleteModel = useCallback(async (index: number) => {
        const dm = disciplineModels[index];
        if (!dm) return;
        try {
            if (dm.fragModel && worldRef.current) {
                const obj = (dm.fragModel as any).object || dm.fragModel;
                worldRef.current.scene.three.remove(obj);
            }
            // Free IFC data from memory
            const modelId = (dm.fragModel as any)?.modelId || dm.model.file_name;
            ifcDataMapRef.current.delete(modelId);

            await deleteModel(dm.model);
            setDisciplineModels(prev => prev.filter((_, i) => i !== index));
            setObjectCount(prev => prev - (dm.model.element_count || 0));
        } catch (err: any) {
            console.error('Delete error:', err);
        }
    }, [disciplineModels, worldRef]);

    // ── Retry failed model ──────────────────────────
    const retryFailedModel = useCallback(async (index: number) => {
        const dm = disciplineModels[index];
        if (!dm || dm.model.status !== 'error') return;
        try {
            await deleteModel(dm.model);
            setDisciplineModels(prev => prev.filter((_, i) => i !== index));
            setStatusMessage('Model đã bị xóa. Hãy upload lại file IFC.');
            setStatus('idle');
        } catch (err: any) {
            console.error('Retry cleanup error:', err);
        }
    }, [disciplineModels]);

    const clearStatus = useCallback(() => {
        setStatus('idle');
        setStatusMessage('');
        setValidationError(null);
    }, []);

    // ── Cancel upload ──────────────────────────
    const cancelUpload = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setStatus('idle');
        setStatusMessage('Upload bị hủy');
        setLoadingProgress(0);
        setTimeout(() => setStatusMessage(''), 3000);
    }, []);

    // ── Multi-file upload (drag & drop) ────────
    const handleMultiFileUpload = useCallback(async (files: FileList) => {
        if (!componentsRef.current || !worldRef.current) return;
        const validFiles: File[] = [];
        for (const file of Array.from(files)) {
            const err = validateFile(file);
            if (err) {
                setValidationError(err);
                setTimeout(() => setValidationError(null), 5000);
            } else {
                validFiles.push(file);
            }
        }
        if (validFiles.length === 0) return;

        // Upload files sequentially to avoid overwhelming the engine
        for (let i = 0; i < validFiles.length; i++) {
            const file = validFiles[i];
            const fakeEvent = { target: { files: [file], value: '' } } as any;
            // Reuse single file upload logic
            try {
                setStatusMessage(`Đang xử lý ${i + 1}/${validFiles.length}: ${file.name}`);
                await handleFileUpload(fakeEvent);
            } catch { /* individual errors handled in handleFileUpload */ }
        }
    }, [componentsRef, worldRef, validateFile, handleFileUpload]);

    return {
        status,
        statusMessage,
        loadingProgress,
        disciplineModels,
        objectCount,
        ifcDataMapRef,
        handleFileUpload,
        handleMultiFileUpload,
        loadExistingModels,
        toggleDisciplineVisibility,
        handleDeleteModel,
        retryFailedModel,
        clearStatus,
        cancelUpload,
        validationError,
    };
}
