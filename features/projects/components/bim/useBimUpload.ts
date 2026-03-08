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
    // Model isolation
    isolateModelByExpressId: (expressId: number) => void;
    restoreAllModels: () => void;
    isIsolated: boolean;
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
    // Follows EXACT same pattern as handleDeleteModel (which works):
    // 1) Access disciplineModels + worldRef directly (not inside updater)
    // 2) Manipulate scene
    // 3) Then update React state
    const toggleDisciplineVisibility = useCallback((index: number) => {
        const dm = disciplineModels[index];
        if (!dm?.fragModel || !worldRef.current) return;

        const newVisible = !dm.visible;
        const obj = (dm.fragModel as any).object || dm.fragModel;

        if (newVisible) {
            // Show: add back to scene (same as how models are initially loaded)
            worldRef.current.scene.three.add(obj);
            // Force fragment renderer update
            try {
                const fragments = componentsRef.current?.get(OBC.FragmentsManager);
                if (fragments?.core) fragments.core.update(true);
            } catch { /* */ }
        } else {
            // Hide: remove from scene (same pattern as delete)
            worldRef.current.scene.three.remove(obj);
        }

        setDisciplineModels(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], visible: newVisible };
            return updated;
        });
    }, [disciplineModels, worldRef, componentsRef]);

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

    // ── Model-level isolation ─────────────────────────
    // FADE other models (low opacity via material cloning),
    // keep target model fully visible.
    const [isIsolated, setIsIsolated] = useState(false);
    const fadedMaterialsRef = useRef<Map<string, { mesh: any; original: any }>>(new Map());
    const savedCameraRef = useRef<{ position: THREE.Vector3; target: THREE.Vector3 } | null>(null);

    const isolateModelByExpressId = useCallback((expressId: number) => {
        if (!worldRef.current) return;

        // Save current camera state for Back button
        const cam = worldRef.current.camera;
        if (cam && (cam as any).controls) {
            const controls = (cam as any).controls;
            savedCameraRef.current = {
                position: new THREE.Vector3().copy(controls.camera.position),
                target: new THREE.Vector3().copy(controls.target || new THREE.Vector3()),
            };
        }

        // Restore previous isolation if any
        if (fadedMaterialsRef.current.size > 0) {
            for (const [, { mesh, original }] of fadedMaterialsRef.current) {
                mesh.material = original;
            }
            fadedMaterialsRef.current.clear();
        }

        // Find target model by checking FragmentsManager
        const fragments = componentsRef.current?.get(OBC.FragmentsManager);
        let targetFragModelId: string | null = null;

        if (fragments) {
            for (const [modelId, model] of fragments.list) {
                let found = false;

                // Strategy 1: Try getFragmentMap API (ThatOpen v2)
                try {
                    if (typeof (model as any).getFragmentMap === 'function') {
                        const fragMap = (model as any).getFragmentMap([expressId]);
                        if (fragMap && Object.keys(fragMap).length > 0) {
                            found = true;
                        }
                    }
                } catch { /* skip */ }

                // Strategy 2: Scan model meshes
                if (!found) {
                    const modelObj = (model as any).object || model;
                    if (modelObj && typeof modelObj.traverse === 'function') {
                        modelObj.traverse((child: any) => {
                            if (found) return;
                            // ThatOpen v2: fragment.items is Map<number, number[]>
                            const items = child.fragment?.items;
                            if (items instanceof Map && items.has(expressId)) {
                                found = true;
                                return;
                            }
                            // Legacy: itemIDs Set
                            const ids = child.itemIDs || child.fragment?.ids || child.userData?.itemIDs;
                            if (ids instanceof Set && ids.has(expressId)) {
                                found = true;
                                return;
                            }
                            // InstancedMesh
                            if (child.isInstancedMesh && child.fragment?.ids instanceof Set && child.fragment.ids.has(expressId)) {
                                found = true;
                            }
                        });
                    }
                }

                if (found) {
                    targetFragModelId = modelId;
                    break;
                }
            }
        }

        // Map FragmentsManager modelId → disciplineModel index
        let targetDmIndex = -1;
        if (targetFragModelId) {
            for (let i = 0; i < disciplineModels.length; i++) {
                const dm = disciplineModels[i];
                if (!dm.fragModel) continue;
                const dmModelId = (dm.fragModel as any).modelId;
                if (dmModelId === targetFragModelId) {
                    targetDmIndex = i;
                    break;
                }
            }
        }

        // FADE other models via material cloning (null-safe)
        disciplineModels.forEach((dm, i) => {
            if (i === targetDmIndex || !dm.fragModel || !dm.visible) return;
            const obj = (dm.fragModel as any).object || dm.fragModel;
            if (!obj || typeof obj.traverse !== 'function') return;

            obj.traverse((child: any) => {
                if (!child.isMesh || !child.material) return;
                const key = child.uuid;
                if (fadedMaterialsRef.current.has(key)) return;

                // Save original material
                const original = child.material;
                fadedMaterialsRef.current.set(key, { mesh: child, original });

                // Clone and fade (null-safe)
                try {
                    if (Array.isArray(original)) {
                        child.material = original.map((mat: THREE.Material) => {
                            if (!mat || typeof mat.clone !== 'function') return mat;
                            const c = mat.clone();
                            (c as any).transparent = true;
                            (c as any).opacity = 0.1;
                            (c as any).depthWrite = false;
                            c.needsUpdate = true;
                            return c;
                        });
                    } else if (original && typeof original.clone === 'function') {
                        const c = original.clone();
                        (c as any).transparent = true;
                        (c as any).opacity = 0.1;
                        (c as any).depthWrite = false;
                        c.needsUpdate = true;
                        child.material = c;
                    }
                } catch (matErr) {
                    // Skip materials that can't be cloned
                    console.warn('[Upload] Material clone error:', matErr);
                }
            });
        });

        setIsIsolated(true);
    }, [disciplineModels, worldRef, componentsRef]);

    const restoreAllModels = useCallback(() => {
        // Restore original materials
        for (const [, { mesh, original }] of fadedMaterialsRef.current) {
            // Dispose cloned materials
            if (Array.isArray(mesh.material)) {
                mesh.material.forEach((m: THREE.Material) => m.dispose());
            } else if (mesh.material) {
                mesh.material.dispose();
            }
            mesh.material = original;
        }
        fadedMaterialsRef.current.clear();

        // Restore camera position
        if (savedCameraRef.current && worldRef.current) {
            const cam = worldRef.current.camera;
            if (cam && (cam as any).controls) {
                const controls = (cam as any).controls;
                controls.setLookAt(
                    savedCameraRef.current.position.x,
                    savedCameraRef.current.position.y,
                    savedCameraRef.current.position.z,
                    savedCameraRef.current.target.x,
                    savedCameraRef.current.target.y,
                    savedCameraRef.current.target.z,
                    true // animate
                );
            }
            savedCameraRef.current = null;
        }

        setIsIsolated(false);
    }, [worldRef]);

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
        isolateModelByExpressId,
        restoreAllModels,
        isIsolated,
    };
}
