/**
 * useBimUpload — Upload IFC files, convert to Fragments, load existing models
 * Handles: upload → convert → cache → load. Error recovery with retry.
 */
import { useRef, useState, useCallback } from 'react';
import * as OBC from '@thatopen/components';
import * as THREE from 'three';
import {
    uploadIFCFile, uploadFragments, getProjectModels,
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
    loadExistingModels: () => void;
    toggleDisciplineVisibility: (index: number) => void;
    handleDeleteModel: (index: number) => void;
    retryFailedModel: (index: number) => void;
    clearStatus: () => void;
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

    // ── Load existing models from Supabase ──────────
    const loadExistingModels = useCallback(async () => {
        try {
            const models = await getProjectModels(projectID);
            if (models.length === 0) return;

            const readyModels = models.filter(m => m.status === 'ready' && m.frag_path);
            if (readyModels.length === 0) {
                setDisciplineModels(models.map(m => ({ model: m, visible: false })));
                return;
            }

            setStatus('loading');
            setStatusMessage(`Đang tải ${readyModels.length} mô hình...`);

            const newDisciplineModels: DisciplineModel[] = [];
            const fragments = componentsRef.current?.get(OBC.FragmentsManager);

            for (let i = 0; i < readyModels.length; i++) {
                const m = readyModels[i];
                setLoadingProgress(((i) / readyModels.length) * 100);
                setStatusMessage(`Đang tải: ${m.file_name} (${i + 1}/${readyModels.length})`);

                try {
                    const fragData = await downloadFile(m.frag_path!);
                    if (fragments && worldRef.current) {
                        const fragModel = (fragments as any).load(new Uint8Array(fragData));
                        worldRef.current.scene.three.add((fragModel as any).object || fragModel);
                        newDisciplineModels.push({ model: m, visible: true, fragModel });
                    }
                } catch (err) {
                    console.warn(`Failed to load ${m.file_name}:`, err);
                    newDisciplineModels.push({ model: m, visible: false });
                }
            }

            // Add non-ready models to the list
            models.filter(m => m.status !== 'ready' || !m.frag_path).forEach(m => {
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
    }, [projectID, componentsRef, worldRef]);

    // ── Upload & Convert IFC ────────────────────────
    const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !componentsRef.current || !worldRef.current) return;
        e.target.value = '';

        try {
            setStatus('loading');
            setStatusMessage(`Đang upload ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)...`);
            setLoadingProgress(10);

            const record = await uploadIFCFile(projectID, file);
            setLoadingProgress(30);

            setStatus('converting');
            setStatusMessage(`Đang convert ${file.name} → Fragments...`);

            const ifcLoader = componentsRef.current.get(OBC.IfcLoader);
            const buffer = await file.arrayBuffer();
            const uint8Array = new Uint8Array(buffer);

            const model = await ifcLoader.load(uint8Array, true, file.name);
            setLoadingProgress(70);

            // Store raw IFC data for property lookups
            const modelId = (model as any).modelId || file.name;
            ifcDataMapRef.current.set(modelId, uint8Array);

            // Export fragments for caching
            const fragments = componentsRef.current.get(OBC.FragmentsManager);
            const fragData = (fragments as any).export(model);
            setLoadingProgress(80);

            setStatusMessage('Đang lưu Fragments lên server...');
            await uploadFragments(record.id, projectID, fragData, file.name);
            setLoadingProgress(90);

            const elementCount = (model as any).elementCount || 0;
            await updateModelStatus(record.id, 'ready', { element_count: elementCount });

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
            const box = new THREE.Box3().setFromObject((model as any).object || worldRef.current.scene.three);
            if (!box.isEmpty()) {
                const sphere = new THREE.Sphere();
                box.getBoundingSphere(sphere);
                camera.controls.fitToSphere(sphere, true);
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
    }, [projectID, componentsRef, worldRef, onModelLoaded]);

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
    }, []);

    return {
        status,
        statusMessage,
        loadingProgress,
        disciplineModels,
        objectCount,
        ifcDataMapRef,
        handleFileUpload,
        loadExistingModels,
        toggleDisciplineVisibility,
        handleDeleteModel,
        retryFailedModel,
        clearStatus,
    };
}
