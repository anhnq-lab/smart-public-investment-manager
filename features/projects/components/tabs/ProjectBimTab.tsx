import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as OBC from '@thatopen/components';
import * as OBCF from '@thatopen/components-front';
import * as THREE from 'three';
import {
    Upload, Loader2, Building2, AlertCircle, CheckCircle
} from 'lucide-react';
import {
    uploadIFCFile, uploadFragments, getProjectModels,
    downloadFile, deleteModel, updateModelStatus,
    type BimModel
} from '../../../../lib/bimStorage';

// Sub-components
import { useBimTools } from '../bim/useBimTools';
import { BimToolbar } from '../bim/BimToolbar';
import { BimPropertiesPanel, type SelectedElement, type PropertySetGroup, type PropertyItem } from '../bim/BimPropertiesPanel';
import { BimModelTree, type SpatialNode, type TypeGroup } from '../bim/BimModelTree';
import { BimViewCube } from '../bim/BimViewCube';

// ── Types ───────────────────────────────────────────
interface ProjectBimTabProps {
    projectID: string;
}

type LoadStatus = 'idle' | 'initializing' | 'loading' | 'converting' | 'success' | 'error';

interface DisciplineModel {
    model: BimModel;
    visible: boolean;
    fragModel?: any;
}

// ── Component ───────────────────────────────────────
export const ProjectBimTab: React.FC<ProjectBimTabProps> = ({ projectID }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const componentsRef = useRef<OBC.Components | null>(null);
    const worldRef = useRef<OBC.World | null>(null);
    const ifcLoaderRef = useRef<OBC.IfcLoader | null>(null);

    // Tools hook
    const tools = useBimTools();

    // State
    const [status, setStatus] = useState<LoadStatus>('idle');
    const [statusMessage, setStatusMessage] = useState('');
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
    const [viewerReady, setViewerReady] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const [disciplineModels, setDisciplineModels] = useState<DisciplineModel[]>([]);
    const [objectCount, setObjectCount] = useState(0);
    const [spatialTree, setSpatialTree] = useState<SpatialNode[]>([]);
    const [typeGroups, setTypeGroups] = useState<TypeGroup[]>([]);
    const [cameraRotation, setCameraRotation] = useState({ x: -30, y: 45, z: 0 });

    // Store original materials for render mode switching
    const originalMaterialsRef = useRef<Map<string, THREE.Material>>(new Map());

    // Map IFC file data for property lookups (modelId → raw IFC data)
    const ifcDataMapRef = useRef<Map<string, Uint8Array>>(new Map());

    // ── Responsive check ────────────────────────────
    useEffect(() => {
        const check = () => {
            const w = window.innerWidth;
            setIsMobile(w < 768);
            setIsTablet(w >= 768 && w < 1024);
            if (w < 1024) {
                tools.toggleRightPanel('none');
                tools.toggleLeftPanel('none');
            }
        };
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    // ── Initialize That Open Engine ─────────────────
    useEffect(() => {
        if (!containerRef.current) return;
        let disposed = false;

        const init = async () => {
            try {
                setStatus('initializing');
                setStatusMessage('Đang khởi tạo BIM viewer...');

                const components = new OBC.Components();
                componentsRef.current = components;

                const worlds = components.get(OBC.Worlds);
                const world = worlds.create<
                    OBC.SimpleScene,
                    OBC.SimpleCamera,
                    OBCF.PostproductionRenderer
                >();
                worldRef.current = world;

                world.scene = new OBC.SimpleScene(components);
                world.scene.setup();
                (world.scene.three as THREE.Scene).background = new THREE.Color(
                    tools.isDarkMode ? 0x0f172a : 0xf1f5f9
                );

                world.renderer = new OBCF.PostproductionRenderer(components, containerRef.current!);
                world.camera = new OBC.SimpleCamera(components);
                (world.camera as OBC.SimpleCamera).controls.setLookAt(15, 15, 15, 0, 0, 0);

                await components.init();

                const grids = components.get(OBC.Grids);
                grids.create(world);

                // Initialize FragmentsManager with worker
                const fragments = components.get(OBC.FragmentsManager);
                const workerGithubUrl = 'https://thatopen.github.io/engine_fragment/resources/worker.mjs';
                const fetchedWorker = await fetch(workerGithubUrl);
                const workerBlob = await fetchedWorker.blob();
                const workerFile = new File([workerBlob], 'worker.mjs', { type: 'text/javascript' });
                const workerUrl = URL.createObjectURL(workerFile);
                fragments.init(workerUrl);

                // Camera update for fragments
                world.camera.controls.addEventListener('update', () => fragments.core.update());

                // Auto-add loaded models to scene
                fragments.list.onItemSet.add(({ value: model }: any) => {
                    model.useCamera(world.camera.three);
                    world.scene.three.add(model.object);
                    fragments.core.update(true);
                });

                // Remove z-fighting on materials
                fragments.core.models.materials.list.onItemSet.add(({ value: material }: any) => {
                    if (!('isLodMaterial' in material && material.isLodMaterial)) {
                        material.polygonOffset = true;
                        material.polygonOffsetUnits = 1;
                        material.polygonOffsetFactor = Math.random();
                    }
                });

                // Setup IFC loader with WASM config
                const ifcLoader = components.get(OBC.IfcLoader);
                await ifcLoader.setup({
                    autoSetWasm: false,
                    wasm: {
                        path: '/wasm/',
                        absolute: true,
                    },
                });

                // Setup Highlighter
                const highlighter = components.get(OBCF.Highlighter);
                highlighter.setup({ world });

                // Listen to selection events
                highlighter.events.select.onHighlight.add((modelIdMap: any) => {
                    if (disposed) return;
                    handleElementSelection(modelIdMap);
                });

                highlighter.events.select.onClear.add(() => {
                    if (!disposed) setSelectedElement(null);
                });

                // Store ifcLoader ref
                ifcLoaderRef.current = ifcLoader;

                // Track camera rotation for ViewCube
                world.camera.controls.addEventListener('update', () => {
                    if (disposed) return;
                    const cam = world.camera.three;
                    const euler = new THREE.Euler().setFromQuaternion(cam.quaternion, 'YXZ');
                    setCameraRotation({
                        x: THREE.MathUtils.radToDeg(euler.x),
                        y: THREE.MathUtils.radToDeg(euler.y),
                        z: THREE.MathUtils.radToDeg(euler.z),
                    });
                });

                if (!disposed) {
                    setViewerReady(true);
                    setStatus('idle');
                    setStatusMessage('');
                    loadExistingModels();
                }
            } catch (err: any) {
                console.error('Viewer init error:', err);
                if (!disposed) {
                    setStatus('error');
                    setStatusMessage(`Lỗi khởi tạo: ${err.message}`);
                }
            }
        };

        init();

        return () => {
            disposed = true;
            ifcLoaderRef.current = null;
            if (componentsRef.current) {
                componentsRef.current.dispose();
                componentsRef.current = null;
            }
        };
    }, []);

    // ── Dark mode sync ──────────────────────────────
    useEffect(() => {
        if (worldRef.current?.scene) {
            (worldRef.current.scene.three as THREE.Scene).background = new THREE.Color(
                tools.isDarkMode ? 0x0f172a : 0xf1f5f9
            );
        }
    }, [tools.isDarkMode]);

    // ── Render mode switching ───────────────────────
    useEffect(() => {
        const scene = worldRef.current?.scene?.three;
        if (!scene) return;

        scene.traverse((obj: any) => {
            if (obj.isMesh && obj.material) {
                const matId = obj.uuid;
                // Store original material on first encounter
                if (!originalMaterialsRef.current.has(matId) && tools.renderMode !== 'shading') {
                    originalMaterialsRef.current.set(matId, obj.material.clone());
                }

                switch (tools.renderMode) {
                    case 'shading':
                        // Restore original materials
                        if (originalMaterialsRef.current.has(matId)) {
                            obj.material = originalMaterialsRef.current.get(matId)!;
                            originalMaterialsRef.current.delete(matId);
                        }
                        break;
                    case 'wireframe':
                        if (obj.material.wireframe !== undefined) {
                            obj.material = obj.material.clone();
                            obj.material.wireframe = true;
                        }
                        break;
                    case 'xray':
                        obj.material = obj.material.clone();
                        obj.material.transparent = true;
                        obj.material.opacity = 0.3;
                        obj.material.depthWrite = false;
                        break;
                    case 'ghosting':
                        obj.material = obj.material.clone();
                        obj.material.transparent = true;
                        obj.material.opacity = 0.08;
                        obj.material.depthWrite = false;
                        break;
                }
            }
        });
    }, [tools.renderMode]);

    // ── Keyboard shortcuts ──────────────────────────
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            // Don't capture if typing in input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            switch (e.key) {
                case '0': setView('iso'); break;
                case '1': setView('front'); break;
                case '2': setView('back'); break;
                case '3': setView('left'); break;
                case '4': setView('right'); break;
                case '5': setView('top'); break;
                case '6': setView('bottom'); break;
                case 'f': case 'F': fitAll(); break;
                case 'v': case 'V': tools.activateTool('select'); break;
                case 'i': case 'I': handleIsolateSelected(); break;
                case 'h':
                    if (e.shiftKey) handleShowAll();
                    else handleHideSelected();
                    break;
                case 'H':
                    if (e.shiftKey) handleShowAll();
                    else handleHideSelected();
                    break;
                case 'Escape':
                    tools.activateTool('select');
                    setSelectedElement(null);
                    break;
                case 'Delete':
                    tools.clearClipPlanes();
                    tools.clearMeasurements();
                    break;
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    // ── Handle element selection from Highlighter ───
    const handleElementSelection = useCallback(async (modelIdMap: Record<string, Set<number>>) => {
        try {
            const ifcLoader = ifcLoaderRef.current;
            if (!ifcLoader) return;

            for (const [modelId, expressIDs] of Object.entries(modelIdMap)) {
                if (!expressIDs || expressIDs.size === 0) continue;
                const expressID = Array.from(expressIDs)[0];

                const ifcData = ifcDataMapRef.current.get(modelId);
                if (!ifcData) {
                    setSelectedElement({
                        id: String(expressID),
                        name: `Element #${expressID}`,
                        type: 'Unknown',
                        propertySets: [],
                        materials: [],
                    });
                    // Auto-show properties panel
                    if (tools.rightPanel !== 'properties') tools.toggleRightPanel('properties');
                    return;
                }

                const modelID = ifcLoader.webIfc.OpenModel(ifcData, { COORDINATE_TO_ORIGIN: false });
                try {
                    await extractPropertiesFromWebIfc(ifcLoader.webIfc, modelID, expressID);
                } finally {
                    ifcLoader.webIfc.CloseModel(modelID);
                }
                // Auto-show properties panel
                if (tools.rightPanel !== 'properties') tools.toggleRightPanel('properties');
                break;
            }
        } catch (err) {
            console.warn('Selection error:', err);
        }
    }, [tools.rightPanel]);

    // ── Extract properties using web-ifc ────────────
    const extractPropertiesFromWebIfc = useCallback(async (
        ifcApi: any,
        modelID: number,
        expressID: number
    ) => {
        const line = ifcApi.GetLine(modelID, expressID, false, true);
        const name = line?.Name?.value || line?.LongName?.value || `Element #${expressID}`;
        const typeCode = line?.type;
        let type = 'Unknown';
        try { type = ifcApi.GetNameFromTypeCode(typeCode) || 'Unknown'; } catch { /* ignore */ }
        const globalId = line?.GlobalId?.value;

        const propertySets: PropertySetGroup[] = [];
        const materials: string[] = [];

        // Traverse inverse relations to find IfcRelDefinesByProperties
        try {
            const IFCRELDEFINESBYPROPERTIES = 4186316022;
            const relIds = ifcApi.GetLineIDsWithType(modelID, IFCRELDEFINESBYPROPERTIES);
            for (let i = 0; i < relIds.size(); i++) {
                const relId = relIds.get(i);
                const rel = ifcApi.GetLine(modelID, relId, false);
                if (!rel?.RelatedObjects) continue;

                const related = Array.isArray(rel.RelatedObjects) ? rel.RelatedObjects : [rel.RelatedObjects];
                const isRelated = related.some((r: any) => {
                    const val = r?.value ?? r;
                    return val === expressID;
                });
                if (!isRelated) continue;

                const psetId = rel.RelatingPropertyDefinition?.value;
                if (!psetId) continue;
                const pset = ifcApi.GetLine(modelID, psetId, false);
                if (!pset) continue;

                const psetName = pset.Name?.value || 'PropertySet';
                const items: PropertyItem[] = [];

                // PropertySet with HasProperties
                if (pset.HasProperties) {
                    const props = Array.isArray(pset.HasProperties) ? pset.HasProperties : [pset.HasProperties];
                    for (const propRef of props) {
                        const propId = propRef?.value ?? propRef;
                        if (!propId) continue;
                        try {
                            const prop = ifcApi.GetLine(modelID, propId, false);
                            if (!prop) continue;
                            const propName = prop.Name?.value || '';
                            let propValue = '';
                            if (prop.NominalValue !== undefined && prop.NominalValue !== null) {
                                propValue = String(prop.NominalValue?.value ?? prop.NominalValue ?? '');
                            }
                            if (propName) items.push({ name: propName, value: propValue });
                        } catch { /* skip bad prop */ }
                    }
                }

                // QuantitySet with Quantities
                if (pset.Quantities) {
                    const quantities = Array.isArray(pset.Quantities) ? pset.Quantities : [pset.Quantities];
                    for (const qRef of quantities) {
                        const qId = qRef?.value ?? qRef;
                        if (!qId) continue;
                        try {
                            const q = ifcApi.GetLine(modelID, qId, false);
                            if (!q) continue;
                            const qName = q.Name?.value || '';
                            const qVal = q.LengthValue?.value ?? q.AreaValue?.value ?? q.VolumeValue?.value ?? q.WeightValue?.value ?? q.CountValue?.value ?? '';
                            if (qName) items.push({ name: qName, value: String(qVal) });
                        } catch { /* skip bad quantity */ }
                    }
                }

                if (items.length > 0) {
                    propertySets.push({ name: psetName, properties: items });
                }
            }
        } catch (err) {
            console.warn('Property set extraction error:', err);
        }

        // Get materials via IfcRelAssociatesMaterial
        try {
            const IFCRELASSOCIATESMATERIAL = 2655215786;
            const matRelIds = ifcApi.GetLineIDsWithType(modelID, IFCRELASSOCIATESMATERIAL);
            for (let i = 0; i < matRelIds.size(); i++) {
                const relId = matRelIds.get(i);
                const rel = ifcApi.GetLine(modelID, relId, false);
                if (!rel?.RelatedObjects) continue;

                const related = Array.isArray(rel.RelatedObjects) ? rel.RelatedObjects : [rel.RelatedObjects];
                const isRelated = related.some((r: any) => (r?.value ?? r) === expressID);
                if (!isRelated) continue;

                const matId = rel.RelatingMaterial?.value;
                if (!matId) continue;
                try {
                    const mat = ifcApi.GetLine(modelID, matId, false);
                    if (mat?.Name?.value) materials.push(mat.Name.value);
                    if (mat?.ForLayerSet?.value) {
                        const layerSet = ifcApi.GetLine(modelID, mat.ForLayerSet.value, false);
                        if (layerSet?.MaterialLayers) {
                            const layers = Array.isArray(layerSet.MaterialLayers) ? layerSet.MaterialLayers : [layerSet.MaterialLayers];
                            for (const layerRef of layers) {
                                const layer = ifcApi.GetLine(modelID, layerRef?.value ?? layerRef, false);
                                if (layer?.Material?.value) {
                                    const material = ifcApi.GetLine(modelID, layer.Material.value, false);
                                    if (material?.Name?.value) materials.push(material.Name.value);
                                }
                            }
                        }
                    }
                } catch { /* material extraction error */ }
            }
        } catch { /* materials might not exist */ }

        setSelectedElement({
            id: String(expressID),
            name,
            type,
            globalId,
            propertySets,
            materials: [...new Set(materials)],
        });
    }, []);

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
        }
    }, [projectID]);

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
            ifcDataMapRef.current.set((model as any).modelId || file.name, uint8Array);

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

            // Build spatial tree from IFC data
            buildSpatialTree(uint8Array);

            // Fit camera to model
            const camera = worldRef.current.camera as OBC.SimpleCamera;
            const box = new THREE.Box3().setFromObject((model as any).object || worldRef.current.scene.three);
            const sphere = new THREE.Sphere();
            box.getBoundingSphere(sphere);
            camera.controls.fitToSphere(sphere, true);

            setStatus('success');
            setStatusMessage(`✅ ${file.name} loaded`);
            setLoadingProgress(100);
            setTimeout(() => { setStatus('idle'); setStatusMessage(''); }, 3000);
        } catch (err: any) {
            console.error('Upload/convert error:', err);
            setStatus('error');
            setStatusMessage(`Lỗi: ${err.message}`);
        }
    }, [projectID]);

    // ── Build spatial tree from IFC data ─────────────
    const buildSpatialTree = useCallback((ifcData: Uint8Array) => {
        try {
            const ifcLoader = ifcLoaderRef.current;
            if (!ifcLoader) return;

            const modelID = ifcLoader.webIfc.OpenModel(ifcData, { COORDINATE_TO_ORIGIN: false });
            try {
                // IFC type codes
                const IFC_TYPES = {
                    IFCPROJECT: 103090709,
                    IFCSITE: 4097777520,
                    IFCBUILDING: 4031249490,
                    IFCBUILDINGSTOREY: 3124254112,
                    IFCRELAGGREGATES: 160246688,
                    IFCRELCONTAINEDINSPATIALSTRUCTURE: 3242617779,
                };

                // Build spatial hierarchy
                const buildNode = (expressID: number, ifcApi: any): SpatialNode => {
                    const line = ifcApi.GetLine(modelID, expressID, false);
                    const name = line?.Name?.value || line?.LongName?.value || `#${expressID}`;
                    let type = 'Unknown';
                    try { type = ifcApi.GetNameFromTypeCode(line?.type) || 'Unknown'; } catch { }

                    const children: SpatialNode[] = [];

                    // Find aggregated children (IfcRelAggregates)
                    const aggRelIds = ifcApi.GetLineIDsWithType(modelID, IFC_TYPES.IFCRELAGGREGATES);
                    for (let i = 0; i < aggRelIds.size(); i++) {
                        const relId = aggRelIds.get(i);
                        const rel = ifcApi.GetLine(modelID, relId, false);
                        if (!rel?.RelatingObject) continue;
                        const relObjId = rel.RelatingObject?.value ?? rel.RelatingObject;
                        if (relObjId !== expressID) continue;

                        const relatedObjects = Array.isArray(rel.RelatedObjects) ? rel.RelatedObjects : [rel.RelatedObjects];
                        for (const obj of relatedObjects) {
                            const childId = obj?.value ?? obj;
                            if (childId) children.push(buildNode(childId, ifcApi));
                        }
                    }

                    // Count contained elements (for stories)
                    let elementCount = 0;
                    const containRelIds = ifcApi.GetLineIDsWithType(modelID, IFC_TYPES.IFCRELCONTAINEDINSPATIALSTRUCTURE);
                    for (let i = 0; i < containRelIds.size(); i++) {
                        const relId = containRelIds.get(i);
                        const rel = ifcApi.GetLine(modelID, relId, false);
                        if (!rel?.RelatingStructure) continue;
                        const structId = rel.RelatingStructure?.value ?? rel.RelatingStructure;
                        if (structId !== expressID) continue;

                        const contained = Array.isArray(rel.RelatedElements) ? rel.RelatedElements : [rel.RelatedElements];
                        elementCount += contained.length;
                    }

                    return { id: expressID, name, type, children, elementCount };
                };

                // Find root IfcProject
                const projectIds = ifcLoader.webIfc.GetLineIDsWithType(modelID, IFC_TYPES.IFCPROJECT);
                const tree: SpatialNode[] = [];
                for (let i = 0; i < projectIds.size(); i++) {
                    tree.push(buildNode(projectIds.get(i), ifcLoader.webIfc));
                }
                setSpatialTree(tree);

                // Build type groups
                const typeMap = new Map<string, { id: number; name: string }[]>();
                const commonTypes = [
                    { code: 3512223829, name: 'IfcWallStandardCase' },
                    { code: 2391406531, name: 'IfcWall' },
                    { code: 1529196076, name: 'IfcSlab' },
                    { code: 843113511, name: 'IfcColumn' },
                    { code: 753842376, name: 'IfcBeam' },
                    { code: 395920057, name: 'IfcDoor' },
                    { code: 3304561284, name: 'IfcWindow' },
                    { code: 331165859, name: 'IfcStair' },
                    { code: 2262370178, name: 'IfcRailing' },
                    { code: 1281925730, name: 'IfcCovering' },
                    { code: 2058353004, name: 'IfcRoof' },
                    { code: 3856911033, name: 'IfcSpace' },
                    { code: 979105199, name: 'IfcBuildingElementProxy' },
                    { code: 1687234759, name: 'IfcPile' },
                    { code: 1335981549, name: 'IfcDiscreteAccessory' },
                    { code: 1051757585, name: 'IfcCurtainWall' },
                    { code: 4105962743, name: 'IfcMember' },
                    { code: 3758799889, name: 'IfcPlate' },
                    { code: 900683007, name: 'IfcFooting' },
                ];

                for (const ct of commonTypes) {
                    try {
                        const ids = ifcLoader.webIfc.GetLineIDsWithType(modelID, ct.code);
                        if (ids.size() === 0) continue;
                        const elements: { id: number; name: string }[] = [];
                        for (let j = 0; j < ids.size(); j++) {
                            const id = ids.get(j);
                            try {
                                const el = ifcLoader.webIfc.GetLine(modelID, id, false);
                                elements.push({ id, name: el?.Name?.value || `#${id}` });
                            } catch { elements.push({ id, name: `#${id}` }); }
                        }
                        typeMap.set(ct.name, elements);
                    } catch { /* type not found */ }
                }

                const groups: TypeGroup[] = [];
                typeMap.forEach((elements, type) => {
                    groups.push({ type, count: elements.length, elements, visible: true });
                });
                groups.sort((a, b) => b.count - a.count);
                setTypeGroups(groups);

            } finally {
                ifcLoader.webIfc.CloseModel(modelID);
            }
        } catch (err) {
            console.warn('Spatial tree build error:', err);
        }
    }, []);

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
            await deleteModel(dm.model);
            setDisciplineModels(prev => prev.filter((_, i) => i !== index));
            setObjectCount(prev => prev - (dm.model.element_count || 0));
        } catch (err: any) {
            console.error('Delete error:', err);
        }
    }, [disciplineModels]);

    // ── Camera views ────────────────────────────────
    const setView = useCallback((view: string) => {
        const camera = worldRef.current?.camera as OBC.SimpleCamera | undefined;
        if (!camera) return;
        const d = 30;
        switch (view) {
            case 'iso': camera.controls.setLookAt(d, d, d, 0, 0, 0, true); break;
            case 'top': camera.controls.setLookAt(0, d * 2, 0, 0, 0, 0, true); break;
            case 'bottom': camera.controls.setLookAt(0, -d * 2, 0, 0, 0, 0, true); break;
            case 'front': camera.controls.setLookAt(0, 0, d * 2, 0, 0, 0, true); break;
            case 'back': camera.controls.setLookAt(0, 0, -d * 2, 0, 0, 0, true); break;
            case 'right': camera.controls.setLookAt(d * 2, 0, 0, 0, 0, 0, true); break;
            case 'left': camera.controls.setLookAt(-d * 2, 0, 0, 0, 0, 0, true); break;
        }
    }, []);

    const fitAll = useCallback(() => {
        const camera = worldRef.current?.camera as OBC.SimpleCamera | undefined;
        const scene = worldRef.current?.scene;
        if (!camera || !scene) return;
        const box = new THREE.Box3().setFromObject(scene.three);
        const sphere = new THREE.Sphere();
        box.getBoundingSphere(sphere);
        camera.controls.fitToSphere(sphere, true);
    }, []);

    // ── Visibility actions ──────────────────────────
    const handleIsolateSelected = useCallback(() => {
        if (!selectedElement || !worldRef.current) return;
        // Hide all, show only selected
        worldRef.current.scene.three.traverse((obj: any) => {
            if (obj.isMesh) {
                obj.visible = false;
            }
        });
        // The highlighter already shows the selected element
    }, [selectedElement]);

    const handleHideSelected = useCallback(() => {
        // Works via highlighter — placeholder
        console.log('Hide selected');
    }, []);

    const handleShowAll = useCallback(() => {
        if (!worldRef.current) return;
        worldRef.current.scene.three.traverse((obj: any) => {
            if (obj.isMesh) obj.visible = true;
        });
    }, []);

    // ── Screenshot ──────────────────────────────────
    const handleScreenshot = useCallback(() => {
        const renderer = worldRef.current?.renderer;
        if (!renderer) return;
        try {
            const canvas = (renderer as any).three?.domElement;
            if (canvas) {
                const link = document.createElement('a');
                link.download = `bim-screenshot-${Date.now()}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            }
        } catch (err) {
            console.warn('Screenshot error:', err);
        }
    }, []);

    // ── Select element from tree ────────────────────
    const handleSelectElementFromTree = useCallback((expressId: number) => {
        // Try to highlight the element; for now set basic info
        setSelectedElement({
            id: String(expressId),
            name: `Element #${expressId}`,
            type: 'Unknown',
            propertySets: [],
            materials: [],
        });
        if (tools.rightPanel !== 'properties') tools.toggleRightPanel('properties');
    }, [tools.rightPanel]);

    // ── Status classes ──────────────────────────────
    const getStatusClasses = () => {
        switch (status) {
            case 'loading': case 'converting': case 'initializing':
                return tools.isDarkMode ? 'bg-blue-500/10 border-blue-500/30 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-700';
            case 'success':
                return tools.isDarkMode ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-green-50 border-green-200 text-green-700';
            case 'error':
                return tools.isDarkMode ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-red-50 border-red-200 text-red-700';
            default:
                return tools.isDarkMode ? 'bg-slate-800/50 border-slate-700 text-slate-400' : 'bg-gray-50 border-gray-200 text-gray-600';
        }
    };

    // ── Render ───────────────────────────────────────
    const hasModels = disciplineModels.length > 0;

    return (
        <div className={`flex flex-col overflow-hidden rounded-xl border ${tools.isDarkMode ? 'bg-slate-900 border-slate-700/50' : 'bg-gray-100 border-gray-200'}`}
            style={{ height: isMobile ? 'calc(100vh - 120px)' : 'calc(100vh - 200px)', minHeight: isMobile ? '400px' : '600px', touchAction: 'none' }}>

            {/* HEADER — Compact info bar */}
            <div className={`h-10 ${tools.isDarkMode ? 'bg-slate-800/90 border-slate-700/50' : 'bg-white border-gray-200'} border-b flex items-center justify-between px-3 shrink-0`}>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                        <Building2 className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wide">BIM Viewer Pro</span>
                    </div>
                    <div className={`h-4 w-px ${tools.isDarkMode ? 'bg-slate-700' : 'bg-gray-300'}`} />
                    <div className="flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${viewerReady ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                        <span className="text-[9px] text-slate-500">{viewerReady ? 'Ready' : 'Loading'}</span>
                    </div>
                    {objectCount > 0 && (
                        <>
                            <div className={`h-4 w-px ${tools.isDarkMode ? 'bg-slate-700' : 'bg-gray-300'}`} />
                            <span className="text-[9px] text-slate-500 font-mono">{objectCount.toLocaleString()} elements</span>
                        </>
                    )}
                    {tools.renderMode !== 'shading' && (
                        <>
                            <div className={`h-4 w-px ${tools.isDarkMode ? 'bg-slate-700' : 'bg-gray-300'}`} />
                            <span className="text-[9px] text-amber-400 font-mono uppercase">{tools.renderMode}</span>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-1.5">
                    {!isMobile && (
                        <label className={`flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white text-[10px] font-bold rounded-md cursor-pointer transition-all shadow-lg shadow-blue-500/25 ${status === 'loading' || status === 'converting' ? 'opacity-50 pointer-events-none' : ''}`}>
                            <Upload className="w-3 h-3" /><span>Upload IFC</span>
                            <input type="file" accept=".ifc" className="hidden" onChange={handleFileUpload} disabled={status === 'loading' || status === 'converting'} />
                        </label>
                    )}
                </div>
            </div>

            {/* STATUS BAR */}
            {status !== 'idle' && statusMessage && (
                <div className={`px-4 py-2 border-b flex items-center gap-3 ${getStatusClasses()}`}>
                    {(status === 'loading' || status === 'initializing' || status === 'converting') && <Loader2 className="w-4 h-4 animate-spin" />}
                    {status === 'success' && <CheckCircle className="w-4 h-4" />}
                    {status === 'error' && <AlertCircle className="w-4 h-4" />}
                    <span className="text-sm font-medium flex-1">{statusMessage}</span>
                    {(status === 'loading' || status === 'converting') && (
                        <div className="flex items-center gap-2 min-w-[120px]">
                            <div className="flex-1 bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-blue-500 h-full transition-all duration-300" style={{ width: `${loadingProgress}%` }} />
                            </div>
                            <span className="text-xs font-mono w-8">{Math.round(loadingProgress)}%</span>
                        </div>
                    )}
                    {status === 'error' && (
                        <button onClick={() => { setStatus('idle'); setStatusMessage(''); }} className="text-red-400 hover:text-red-300 text-sm">Đóng</button>
                    )}
                </div>
            )}

            {/* MAIN */}
            <div className="flex-1 flex overflow-hidden relative">

                {/* LEFT PANEL — Model Tree */}
                {tools.leftPanel === 'tree' && (
                    <BimModelTree
                        isDarkMode={tools.isDarkMode}
                        isMobile={isMobile}
                        onClose={() => tools.toggleLeftPanel('none')}
                        spatialTree={spatialTree}
                        typeGroups={typeGroups}
                        disciplineModels={disciplineModels}
                        onSelectElement={handleSelectElementFromTree}
                        onToggleVisibility={() => { }}
                        onToggleTypeVisibility={() => { }}
                        onToggleDiscipline={toggleDisciplineVisibility}
                        onDeleteDiscipline={handleDeleteModel}
                        onUploadIFC={handleFileUpload}
                        isLoading={status === 'loading' || status === 'converting'}
                    />
                )}

                {/* 3D VIEWER */}
                <div className="flex-1 relative">
                    <div ref={containerRef} className="absolute inset-0" style={{ touchAction: 'none' }} />

                    {/* Floating Toolbar */}
                    <BimToolbar
                        tools={tools}
                        viewerReady={viewerReady}
                        hasModels={hasModels}
                        onSetView={setView}
                        onFitAll={fitAll}
                        onScreenshot={handleScreenshot}
                        onIsolateSelected={handleIsolateSelected}
                        onHideSelected={handleHideSelected}
                        onShowAll={handleShowAll}
                        isMobile={isMobile}
                    />

                    {/* ViewCube */}
                    {!isMobile && viewerReady && (
                        <BimViewCube
                            isDarkMode={tools.isDarkMode}
                            cameraRotation={cameraRotation}
                            onSetView={setView}
                        />
                    )}

                    {/* Empty state */}
                    {viewerReady && !hasModels && status === 'idle' && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                            <div className={`text-center p-8 rounded-2xl ${tools.isDarkMode ? 'bg-slate-800/80' : 'bg-white/80'} backdrop-blur-xl border ${tools.isDarkMode ? 'border-slate-700/50' : 'border-gray-200'} pointer-events-auto`}>
                                <Building2 className="w-16 h-16 text-blue-500/50 mx-auto mb-4" />
                                <h3 className={`text-lg font-bold mb-2 ${tools.isDarkMode ? 'text-white' : 'text-gray-800'}`}>BIM Viewer Pro</h3>
                                <p className={`text-sm mb-4 ${tools.isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                    Upload file IFC để xem mô hình 3D BIM.<br />Hỗ trợ multi-discipline (ARCH, STRU, MEP...)
                                </p>
                                <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white text-sm font-semibold rounded-xl cursor-pointer transition-all shadow-lg shadow-blue-500/25">
                                    <Upload className="w-4 h-4" />Chọn file IFC
                                    <input type="file" accept=".ifc" className="hidden" onChange={handleFileUpload} />
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT PANEL — Properties */}
                {tools.rightPanel === 'properties' && (
                    <BimPropertiesPanel
                        selectedElement={selectedElement}
                        isDarkMode={tools.isDarkMode}
                        isMobile={isMobile}
                        onClose={() => tools.toggleRightPanel('none')}
                    />
                )}
            </div>

            {/* FOOTER */}
            <div className={`h-7 ${tools.isDarkMode ? 'bg-slate-800/90 border-slate-700/50 text-slate-500' : 'bg-white border-gray-200 text-gray-400'} border-t flex items-center justify-between px-3 text-[9px] shrink-0`}>
                <div className="flex items-center gap-3">
                    <span>Powered by <strong className="text-blue-400">That Open Engine</strong></span>
                    {tools.activeTool && tools.activeTool !== 'select' && (
                        <>
                            <div className={`h-3 w-px ${tools.isDarkMode ? 'bg-slate-700' : 'bg-gray-300'}`} />
                            <span className="text-amber-400 font-semibold uppercase">{tools.activeTool.replace('-', ' ')}</span>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <span>{disciplineModels.filter(d => d.visible).length}/{disciplineModels.length} models</span>
                    <span>Press <kbd className={`px-1 py-0.5 rounded text-[8px] font-mono ${tools.isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>?</kbd> for shortcuts</span>
                </div>
            </div>
        </div>
    );
};
