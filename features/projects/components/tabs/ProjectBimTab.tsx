import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as OBC from '@thatopen/components';
import * as OBCF from '@thatopen/components-front';
import * as THREE from 'three';
import {
    Upload, Loader2, Box, ArrowUp, Square,
    ArrowRight as ArrowRightIcon, Building2, PanelLeft,
    Sun, Moon, AlertCircle, CheckCircle,
    ChevronDown, ChevronRight, Copy, FolderTree, Trash2,
    Eye, EyeOff, Layers, RotateCcw, ZoomIn, Crosshair,
    FileUp
} from 'lucide-react';
import {
    uploadIFCFile, uploadFragments, getProjectModels,
    getStorageUrl, downloadFile, deleteModel, updateModelStatus,
    type BimModel
} from '../../../../lib/bimStorage';

// ── Types ───────────────────────────────────────────
interface ProjectBimTabProps {
    projectID: string;
}

interface PropertyItem {
    name: string;
    value: string;
    type?: string;
}

interface PropertySetGroup {
    name: string;
    properties: PropertyItem[];
}

interface SpatialNode {
    name: string;
    type: string;
    isCurrent?: boolean;
}

interface SelectedElement {
    id: string;
    name: string;
    type: string;
    globalId?: string;
    propertySets: PropertySetGroup[];
    materials: string[];
    spatialHierarchy: SpatialNode[];
}

type LoadStatus = 'idle' | 'initializing' | 'loading' | 'processing' | 'converting' | 'success' | 'error';

interface DisciplineModel {
    model: BimModel;
    visible: boolean;
    fragmentGroup?: any; // FragmentsGroup reference
}

// ── Component ───────────────────────────────────────
export const ProjectBimTab: React.FC<ProjectBimTabProps> = ({ projectID }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    // Engine refs
    const worldRef = useRef<OBC.World | null>(null);
    const componentsRef = useRef<OBC.Components | null>(null);
    const ifcLoaderRef = useRef<OBC.IfcLoader | null>(null);
    const fragmentsRef = useRef<OBC.FragmentsManager | null>(null);

    // State
    const [status, setStatus] = useState<LoadStatus>('idle');
    const [statusMessage, setStatusMessage] = useState('');
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
    const [showProperties, setShowProperties] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [viewerReady, setViewerReady] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const [expandedSets, setExpandedSets] = useState<Record<string, boolean>>({});
    const [disciplineModels, setDisciplineModels] = useState<DisciplineModel[]>([]);
    const [objectCount, setObjectCount] = useState(0);
    const [showDisciplinePanel, setShowDisciplinePanel] = useState(false);

    // ── Helpers ──────────────────────────────────────
    const toggleSet = (name: string) => {
        setExpandedSets(prev => ({ ...prev, [name]: !prev[name] }));
    };

    const copyValue = (value: string) => {
        navigator.clipboard.writeText(value).catch(() => { });
    };

    // Auto-expand property sets when element selected
    useEffect(() => {
        if (selectedElement) {
            const initial: Record<string, boolean> = { identity: true };
            selectedElement.propertySets.slice(0, 2).forEach(ps => {
                initial[ps.name] = true;
            });
            if (selectedElement.materials.length > 0) initial['material'] = true;
            if (selectedElement.spatialHierarchy.length > 0) initial['hierarchy'] = true;
            setExpandedSets(initial);
        }
    }, [selectedElement]);

    // Responsive
    useEffect(() => {
        const check = () => {
            const w = window.innerWidth;
            setIsMobile(w < 768);
            setIsTablet(w >= 768 && w < 1024);
            if (w < 1024) setShowProperties(false);
        };
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    // ── Initialize That Open Engine ──────────────────
    useEffect(() => {
        if (!containerRef.current) return;
        let disposed = false;

        const init = async () => {
            try {
                setStatus('initializing');
                setStatusMessage('Đang khởi tạo BIM viewer...');

                // Create components
                const components = new OBC.Components();
                componentsRef.current = components;

                // Create world with scene, camera, renderer
                const worlds = components.get(OBC.Worlds);
                const world = worlds.create<
                    OBC.SimpleScene,
                    OBC.SimpleCamera,
                    OBCF.PostproductionRenderer
                >();
                worldRef.current = world;

                // Setup scene
                world.scene = new OBC.SimpleScene(components);
                world.scene.setup();
                (world.scene.three as any).background = new THREE.Color(isDarkMode ? 0x0f172a : 0xf1f5f9);

                // Setup renderer
                world.renderer = new OBCF.PostproductionRenderer(components, containerRef.current!);

                // Setup camera
                world.camera = new OBC.SimpleCamera(components);
                world.camera.controls.setLookAt(15, 15, 15, 0, 0, 0);

                // Init components
                await components.init();

                // Setup grid
                const grids = components.get(OBC.Grids);
                grids.create(world);

                // Setup IFC loader
                const ifcLoader = components.get(OBC.IfcLoader);
                await ifcLoader.setup();
                ifcLoaderRef.current = ifcLoader;

                // Configure for web
                ifcLoader.settings.wasm = {
                    path: 'https://unpkg.com/web-ifc@0.0.68/',
                    absolute: true,
                };
                ifcLoader.settings.webIfc.COORDINATE_TO_ORIGIN = true;

                // Setup fragments manager
                const fragments = components.get(OBC.FragmentsManager);
                fragmentsRef.current = fragments;

                // Setup highlighter for selection
                const highlighter = components.get(OBCF.Highlighter);
                highlighter.setup({ world });

                // Handle element selection
                highlighter.events.select.onHighlight.add((data: any) => {
                    if (disposed) return;
                    const fragmentIdMap = data;
                    if (!fragmentIdMap || Object.keys(fragmentIdMap).length === 0) return;

                    // Get the first selected element
                    const indexer = components.get(OBC.IfcRelationsIndexer);
                    const classifier = components.get(OBC.Classifier);

                    for (const fragID in fragmentIdMap) {
                        const expressIDs = fragmentIdMap[fragID];
                        if (!expressIDs || expressIDs.size === 0) continue;

                        const fragment = fragments.list.get(fragID);
                        if (!fragment) continue;

                        const model = fragment.group;
                        if (!model) continue;

                        const expressID = Array.from(expressIDs)[0] as number;

                        // Extract properties
                        extractElementProperties(components, model, expressID);
                        break; // Only first selected
                    }
                });

                highlighter.events.select.onClear.add(() => {
                    if (!disposed) setSelectedElement(null);
                });

                if (!disposed) {
                    setViewerReady(true);
                    setStatus('idle');
                    setStatusMessage('');

                    // Load existing models from Supabase
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
            if (componentsRef.current) {
                componentsRef.current.dispose();
                componentsRef.current = null;
            }
        };
    }, []);

    // Update background color when dark mode changes
    useEffect(() => {
        if (worldRef.current?.scene) {
            (worldRef.current.scene.three as any).background = new THREE.Color(
                isDarkMode ? 0x0f172a : 0xf1f5f9
            );
        }
    }, [isDarkMode]);

    // ── Extract element properties ──────────────────
    const extractElementProperties = useCallback(async (
        components: OBC.Components,
        model: any, // FragmentsGroup
        expressID: number
    ) => {
        try {
            const indexer = components.get(OBC.IfcRelationsIndexer);

            // Get element properties from the model
            const props = model.getLocalProperties();
            if (!props) return;

            const elementProps = props[expressID];
            if (!elementProps) return;

            const name = elementProps.Name?.value || elementProps.LongName?.value || `Element #${expressID}`;
            const type = elementProps.type || 'Unknown';
            const globalId = elementProps.GlobalId?.value || undefined;

            // Extract all property sets
            const propertySets: PropertySetGroup[] = [];
            const materials: string[] = [];
            const spatialHierarchy: SpatialNode[] = [];

            // Get property sets via relations
            const psetRelations = indexer.getEntityRelations(model, expressID, 'IsDefinedBy');
            if (psetRelations) {
                for (const psetId of psetRelations) {
                    const psetProps = props[psetId];
                    if (!psetProps) continue;

                    const psetName = psetProps.Name?.value || `PropertySet_${psetId}`;
                    const items: PropertyItem[] = [];

                    // HasProperties relation
                    if (psetProps.HasProperties) {
                        for (const propRef of psetProps.HasProperties) {
                            const propId = propRef.value;
                            const prop = props[propId];
                            if (!prop) continue;

                            const propName = prop.Name?.value || '';
                            let propValue = '';

                            if (prop.NominalValue !== undefined && prop.NominalValue !== null) {
                                propValue = String(prop.NominalValue.value ?? prop.NominalValue ?? '');
                            } else if (prop.Value !== undefined) {
                                propValue = String(prop.Value.value ?? prop.Value ?? '');
                            }

                            if (propName) {
                                items.push({ name: propName, value: propValue });
                            }
                        }
                    }

                    // Quantities 
                    if (psetProps.Quantities) {
                        for (const qRef of psetProps.Quantities) {
                            const qId = qRef.value;
                            const q = props[qId];
                            if (!q) continue;

                            const qName = q.Name?.value || '';
                            const qValue = q.LengthValue?.value ?? q.AreaValue?.value ?? q.VolumeValue?.value ?? q.WeightValue?.value ?? q.CountValue?.value ?? '';

                            if (qName) {
                                items.push({ name: qName, value: String(qValue), type: 'quantity' });
                            }
                        }
                    }

                    if (items.length > 0) {
                        propertySets.push({ name: psetName, properties: items });
                    }
                }
            }

            // Get materials
            const materialRelations = indexer.getEntityRelations(model, expressID, 'HasAssociations');
            if (materialRelations) {
                for (const matId of materialRelations) {
                    const matProps = props[matId];
                    if (matProps?.Name?.value) {
                        materials.push(matProps.Name.value);
                    }
                    if (matProps?.RelatingMaterial) {
                        const relMat = props[matProps.RelatingMaterial.value];
                        if (relMat?.Name?.value) {
                            materials.push(relMat.Name.value);
                        }
                    }
                }
            }

            // Build spatial hierarchy
            const containedRels = indexer.getEntityRelations(model, expressID, 'ContainedInStructure');
            if (containedRels) {
                for (const relId of containedRels) {
                    const buildSpatialChain = (id: number, chain: SpatialNode[]) => {
                        const p = props[id];
                        if (!p) return;
                        chain.unshift({
                            name: p.Name?.value || p.LongName?.value || `#${id}`,
                            type: p.type || '',
                            isCurrent: false,
                        });
                        // Walk up
                        const parentRels = indexer.getEntityRelations(model, id, 'ContainedInStructure');
                        if (parentRels && parentRels.length > 0) {
                            buildSpatialChain(parentRels[0] as number, chain);
                        }
                        const decompRels = indexer.getEntityRelations(model, id, 'Decomposes');
                        if (decompRels && decompRels.length > 0) {
                            buildSpatialChain(decompRels[0] as number, chain);
                        }
                    };
                    const chain: SpatialNode[] = [];
                    buildSpatialChain(relId as number, chain);
                    chain.push({ name, type, isCurrent: true });
                    spatialHierarchy.push(...chain);
                }
            }

            setSelectedElement({
                id: String(expressID),
                name,
                type,
                globalId,
                propertySets,
                materials: [...new Set(materials)],
                spatialHierarchy,
            });
        } catch (err) {
            console.warn('Property extraction error:', err);
        }
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

            for (let i = 0; i < readyModels.length; i++) {
                const m = readyModels[i];
                setLoadingProgress(((i) / readyModels.length) * 100);
                setStatusMessage(`Đang tải: ${m.file_name} (${i + 1}/${readyModels.length})`);

                try {
                    const fragData = await downloadFile(m.frag_path!);
                    const fragments = componentsRef.current?.get(OBC.FragmentsManager);
                    if (fragments && worldRef.current) {
                        const fragGroup = fragments.load(new Uint8Array(fragData));
                        worldRef.current.scene.three.add(fragGroup);

                        newDisciplineModels.push({
                            model: m,
                            visible: true,
                            fragmentGroup: fragGroup,
                        });
                    }
                } catch (err) {
                    console.warn(`Failed to load ${m.file_name}:`, err);
                    newDisciplineModels.push({ model: m, visible: false });
                }
            }

            // Also add non-ready models
            models.filter(m => m.status !== 'ready' || !m.frag_path).forEach(m => {
                newDisciplineModels.push({ model: m, visible: false });
            });

            setDisciplineModels(newDisciplineModels);

            // Count objects
            const total = newDisciplineModels.reduce((sum, dm) => {
                return sum + (dm.model.element_count || 0);
            }, 0);
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
        if (!file || !componentsRef.current || !ifcLoaderRef.current || !worldRef.current) return;

        // Reset input
        e.target.value = '';

        try {
            // Step 1: Upload IFC to Supabase
            setStatus('loading');
            setStatusMessage(`Đang upload ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)...`);
            setLoadingProgress(10);

            const record = await uploadIFCFile(projectID, file, (p) => {
                setLoadingProgress(10 + p * 0.2); // 10-30%
            });

            // Step 2: Convert IFC → Fragments (client-side)
            setStatus('converting');
            setStatusMessage(`Đang convert ${file.name} → Fragments...`);
            setLoadingProgress(30);

            const ifcLoader = ifcLoaderRef.current;
            const buffer = await file.arrayBuffer();
            const uint8Array = new Uint8Array(buffer);

            // Load IFC and convert to fragments
            const model = await ifcLoader.load(uint8Array, worldRef.current);
            setLoadingProgress(70);

            // Index relations for property queries
            const indexer = componentsRef.current.get(OBC.IfcRelationsIndexer);
            await indexer.process(model);

            // Export fragments for caching
            const fragments = componentsRef.current.get(OBC.FragmentsManager);
            const fragData = fragments.export(model);
            setLoadingProgress(80);

            // Step 3: Upload fragments to Supabase
            setStatusMessage('Đang lưu Fragments lên server...');
            await uploadFragments(record.id, projectID, fragData, file.name);
            setLoadingProgress(90);

            // Count elements
            let elementCount = 0;
            const localProps = model.getLocalProperties();
            if (localProps) {
                elementCount = Object.keys(localProps).length;
            }

            await updateModelStatus(record.id, 'ready', { element_count: elementCount });

            // Add to discipline panel
            setDisciplineModels(prev => [...prev, {
                model: { ...record, status: 'ready', element_count: elementCount },
                visible: true,
                fragmentGroup: model,
            }]);

            setObjectCount(prev => prev + elementCount);

            // Fit camera to model
            const camera = worldRef.current.camera as OBC.SimpleCamera;
            camera.controls.fitToSphere(model, true);

            setStatus('success');
            setStatusMessage(`✅ ${file.name} — ${elementCount} elements loaded`);
            setLoadingProgress(100);
            setTimeout(() => { setStatus('idle'); setStatusMessage(''); }, 3000);
        } catch (err: any) {
            console.error('Upload/convert error:', err);
            setStatus('error');
            setStatusMessage(`Lỗi: ${err.message}`);
        }
    }, [projectID]);

    // ── Toggle discipline visibility ────────────────
    const toggleDisciplineVisibility = useCallback((index: number) => {
        setDisciplineModels(prev => {
            const updated = [...prev];
            const dm = updated[index];
            if (dm.fragmentGroup) {
                dm.visible = !dm.visible;
                dm.fragmentGroup.visible = dm.visible;
            }
            return updated;
        });
    }, []);

    // ── Delete a model ──────────────────────────────
    const handleDeleteModel = useCallback(async (index: number) => {
        const dm = disciplineModels[index];
        if (!dm) return;

        try {
            // Remove from scene
            if (dm.fragmentGroup && worldRef.current) {
                worldRef.current.scene.three.remove(dm.fragmentGroup);
                const fragments = componentsRef.current?.get(OBC.FragmentsManager);
                if (fragments) {
                    fragments.dispose();
                }
            }

            // Delete from Supabase
            await deleteModel(dm.model);

            setDisciplineModels(prev => prev.filter((_, i) => i !== index));
            setObjectCount(prev => prev - (dm.model.element_count || 0));
        } catch (err: any) {
            console.error('Delete error:', err);
        }
    }, [disciplineModels]);

    // ── Camera Views ────────────────────────────────
    const setView = useCallback((view: string) => {
        const camera = worldRef.current?.camera as OBC.SimpleCamera | undefined;
        if (!camera) return;

        const dist = 30;
        switch (view) {
            case 'iso':
                camera.controls.setLookAt(dist, dist, dist, 0, 0, 0, true);
                break;
            case 'top':
                camera.controls.setLookAt(0, dist * 2, 0, 0, 0, 0, true);
                break;
            case 'front':
                camera.controls.setLookAt(0, 0, dist * 2, 0, 0, 0, true);
                break;
            case 'right':
                camera.controls.setLookAt(dist * 2, 0, 0, 0, 0, 0, true);
                break;
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

    // ── Status Classes ──────────────────────────────
    const getStatusClasses = () => {
        switch (status) {
            case 'loading': case 'processing': case 'converting': case 'initializing':
                return isDarkMode
                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                    : 'bg-blue-50 border-blue-200 text-blue-700';
            case 'success':
                return isDarkMode
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-green-50 border-green-200 text-green-700';
            case 'error':
                return isDarkMode
                    ? 'bg-red-500/10 border-red-500/30 text-red-300'
                    : 'bg-red-50 border-red-200 text-red-700';
            default:
                return isDarkMode ? 'bg-slate-800/50 border-slate-700 text-slate-400' : 'bg-gray-50 border-gray-200 text-gray-600';
        }
    };

    // ── Tool Button ─────────────────────────────────
    const ToolBtn = ({ active, onClick, title, children, disabled }: {
        active?: boolean; onClick?: () => void; title: string; children: React.ReactNode; disabled?: boolean;
    }) => (
        <button
            onClick={onClick}
            title={title}
            disabled={disabled}
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${active
                ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/50'
                : isDarkMode
                    ? 'text-slate-400 hover:bg-white/10 hover:text-white'
                    : 'text-gray-500 hover:bg-gray-200 hover:text-gray-800'
                } ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
        >
            {children}
        </button>
    );

    // ── View Button ─────────────────────────────────
    const ViewBtn = ({ view, icon: Icon, label }: { view: string; icon: any; label: string }) => (
        <button
            onClick={() => setView(view)}
            className={`px-2 py-1 text-[10px] font-semibold rounded-md transition-all flex items-center gap-1 
                ${isDarkMode
                    ? 'text-slate-400 hover:bg-slate-700 hover:text-white'
                    : 'text-gray-500 hover:bg-gray-200 hover:text-gray-800'
                }`}
        >
            <Icon className="w-3 h-3" />
            {label}
        </button>
    );

    // ── Discipline Color ────────────────────────────
    const getDisciplineColor = (discipline: string | null) => {
        const colors: Record<string, string> = {
            ARCH: 'bg-blue-500', STRU: 'bg-red-500', ELEC: 'bg-yellow-500',
            HVAC: 'bg-green-500', PLUM: 'bg-cyan-500', FIRE: 'bg-orange-500',
            LAND: 'bg-emerald-500', MEP: 'bg-purple-500', COMBINE: 'bg-slate-400',
        };
        return colors[discipline || ''] || 'bg-slate-500';
    };

    // ── Render ───────────────────────────────────────
    return (
        <div className={`flex flex-col overflow-hidden rounded-xl border ${isDarkMode ? 'bg-slate-900 border-slate-700/50' : 'bg-gray-100 border-gray-200'}`}
            style={{
                height: isMobile ? 'calc(100vh - 120px)' : 'calc(100vh - 200px)',
                minHeight: isMobile ? '400px' : '600px',
                touchAction: 'none',
            }}>

            {/* HEADER TOOLBAR */}
            <div className={`${isMobile ? 'h-14' : 'h-12'} ${isDarkMode ? 'bg-slate-800/90 border-slate-700/50' : 'bg-white border-gray-200'} border-b flex items-center justify-between ${isMobile ? 'px-2' : 'px-3'} shrink-0`}>
                <div className="flex items-center gap-2">
                    {/* Logo */}
                    <div className={`${isMobile ? 'hidden' : 'flex'} items-center gap-2 px-2 py-1 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20`}>
                        <Building2 className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-bold text-blue-400 uppercase tracking-wide">BIM Viewer</span>
                    </div>

                    <div className={`h-5 w-px ${isDarkMode ? 'bg-slate-700' : 'bg-gray-300'}`} />

                    {/* Status */}
                    <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${viewerReady ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                        <span className="text-[10px] text-slate-500">
                            {viewerReady ? 'Ready' : 'Loading...'}
                        </span>
                    </div>

                    {objectCount > 0 && (
                        <>
                            <div className={`h-5 w-px ${isDarkMode ? 'bg-slate-700' : 'bg-gray-300'}`} />
                            <span className="text-[10px] text-slate-500 font-mono">
                                {objectCount.toLocaleString()} elements
                            </span>
                        </>
                    )}

                    {disciplineModels.length > 0 && (
                        <>
                            <div className={`h-5 w-px ${isDarkMode ? 'bg-slate-700' : 'bg-gray-300'}`} />
                            <span className="text-[10px] text-slate-500">
                                {disciplineModels.length} models
                            </span>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    {/* View buttons */}
                    {!isMobile && (
                        <div className={`flex ${isDarkMode ? 'bg-slate-800/80 border-slate-700/50' : 'bg-gray-100 border-gray-200'} rounded-lg p-0.5 border`}>
                            <ViewBtn view="iso" icon={Box} label="3D" />
                            <ViewBtn view="top" icon={ArrowUp} label="Top" />
                            <ViewBtn view="front" icon={Square} label="Front" />
                            <ViewBtn view="right" icon={ArrowRightIcon} label="Right" />
                        </div>
                    )}

                    {/* Fit all */}
                    <ToolBtn onClick={fitAll} title="Fit All">
                        <ZoomIn className="w-4 h-4" />
                    </ToolBtn>

                    {/* Discipline Panel Toggle */}
                    <ToolBtn active={showDisciplinePanel} onClick={() => setShowDisciplinePanel(!showDisciplinePanel)} title="Disciplines">
                        <Layers className="w-4 h-4" />
                    </ToolBtn>

                    {/* Properties Toggle */}
                    {!isMobile && (
                        <ToolBtn active={showProperties} onClick={() => setShowProperties(!showProperties)} title="Properties">
                            <PanelLeft className="w-4 h-4" />
                        </ToolBtn>
                    )}

                    {/* Upload */}
                    {!isMobile && (
                        <>
                            <div className={`h-5 w-px ${isDarkMode ? 'bg-slate-700' : 'bg-gray-300'}`} />
                            <label className={`flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white text-xs font-semibold rounded-lg cursor-pointer transition-all shadow-lg shadow-blue-500/25 ${status === 'loading' || status === 'converting' ? 'opacity-50 pointer-events-none' : ''}`}>
                                <Upload className="w-3.5 h-3.5" />
                                <span>Upload IFC</span>
                                <input
                                    type="file"
                                    accept=".ifc"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    disabled={status === 'loading' || status === 'converting'}
                                    multiple
                                />
                            </label>
                        </>
                    )}

                    {/* Theme */}
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-white/10 hover:text-white transition-all"
                    >
                        {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* STATUS BAR */}
            {status !== 'idle' && statusMessage && (
                <div className={`px-4 py-2 border-b flex items-center gap-3 ${getStatusClasses()}`}>
                    {(status === 'loading' || status === 'processing' || status === 'initializing' || status === 'converting') && (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    )}
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

            {/* MAIN CONTENT */}
            <div className="flex-1 flex overflow-hidden relative">

                {/* Discipline Panel (Left) */}
                {showDisciplinePanel && (
                    <div className={`${isMobile ? 'absolute inset-y-0 left-0 z-30' : 'relative'} ${isDarkMode ? 'bg-slate-800/95 border-slate-700/50' : 'bg-white border-gray-200'} border-r w-56 flex flex-col shrink-0 backdrop-blur-xl`}>
                        <div className="p-3 border-b border-slate-700/30 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Layers className="w-4 h-4 text-blue-400" />
                                <span className="text-xs font-bold text-slate-400 uppercase">Disciplines</span>
                            </div>
                            {(isMobile || isTablet) && (
                                <button onClick={() => setShowDisciplinePanel(false)} className="text-slate-500 hover:text-white">✕</button>
                            )}
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {disciplineModels.length === 0 ? (
                                <div className="text-center py-8">
                                    <FileUp className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                                    <p className="text-xs text-slate-500">Upload IFC files</p>
                                    <p className="text-[10px] text-slate-600 mt-1">Hỗ trợ multi-discipline</p>
                                </div>
                            ) : (
                                disciplineModels.map((dm, idx) => (
                                    <div key={dm.model.id} className={`group flex items-center gap-2 p-2 rounded-lg transition-all ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-100'}`}>
                                        <div className={`w-3 h-3 rounded-sm ${getDisciplineColor(dm.model.discipline)} shrink-0`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-slate-300 truncate" title={dm.model.file_name}>
                                                {dm.model.discipline || dm.model.file_name.slice(0, 20)}
                                            </p>
                                            <p className="text-[9px] text-slate-600">
                                                {dm.model.status === 'ready'
                                                    ? `${(dm.model.element_count || 0).toLocaleString()} el.`
                                                    : dm.model.status
                                                }
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {dm.model.status === 'ready' && (
                                                <button onClick={() => toggleDisciplineVisibility(idx)}
                                                    className="p-1 rounded hover:bg-white/10" title={dm.visible ? 'Ẩn' : 'Hiện'}>
                                                    {dm.visible
                                                        ? <Eye className="w-3.5 h-3.5 text-emerald-400" />
                                                        : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
                                                </button>
                                            )}
                                            <button onClick={() => handleDeleteModel(idx)}
                                                className="p-1 rounded hover:bg-red-500/20" title="Xóa">
                                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Upload button in discipline panel */}
                        <div className="p-2 border-t border-slate-700/30">
                            <label className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-lg cursor-pointer transition-all border border-blue-500/20">
                                <Upload className="w-3.5 h-3.5" />
                                <span>Thêm IFC</span>
                                <input
                                    type="file"
                                    accept=".ifc"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    disabled={status === 'loading' || status === 'converting'}
                                />
                            </label>
                        </div>
                    </div>
                )}

                {/* 3D VIEWER */}
                <div className="flex-1 relative">
                    <div
                        ref={containerRef}
                        className="absolute inset-0"
                        style={{ touchAction: 'none' }}
                    />

                    {/* Empty state */}
                    {viewerReady && disciplineModels.length === 0 && status === 'idle' && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                            <div className={`text-center p-8 rounded-2xl ${isDarkMode ? 'bg-slate-800/80' : 'bg-white/80'} backdrop-blur-xl border ${isDarkMode ? 'border-slate-700/50' : 'border-gray-200'} pointer-events-auto`}>
                                <Building2 className="w-16 h-16 text-blue-500/50 mx-auto mb-4" />
                                <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                    BIM Viewer
                                </h3>
                                <p className={`text-sm mb-4 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                    Upload file IFC để xem mô hình 3D BIM.<br />
                                    Hỗ trợ multi-discipline (ARCH, STRU, MEP...)
                                </p>
                                <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white text-sm font-semibold rounded-xl cursor-pointer transition-all shadow-lg shadow-blue-500/25">
                                    <Upload className="w-4 h-4" />
                                    Chọn file IFC
                                    <input
                                        type="file"
                                        accept=".ifc"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                        multiple
                                    />
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Mobile floating toolbar */}
                    {(isMobile || isTablet) && viewerReady && (
                        <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 p-2 rounded-2xl ${isDarkMode ? 'bg-slate-800/95 border-slate-700/50' : 'bg-white/95 border-gray-200'} border shadow-2xl backdrop-blur-xl z-20`}>
                            <ToolBtn onClick={() => setView('iso')} title="3D"><Box className="w-5 h-5" /></ToolBtn>
                            <ToolBtn onClick={fitAll} title="Fit All"><ZoomIn className="w-5 h-5" /></ToolBtn>
                            <ToolBtn active={showDisciplinePanel} onClick={() => setShowDisciplinePanel(!showDisciplinePanel)} title="Layers"><Layers className="w-5 h-5" /></ToolBtn>
                            <ToolBtn active={showProperties} onClick={() => setShowProperties(!showProperties)} title="Properties"><Crosshair className="w-5 h-5" /></ToolBtn>
                            <label className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-500 text-white cursor-pointer">
                                <Upload className="w-5 h-5" />
                                <input type="file" accept=".ifc" className="hidden" onChange={handleFileUpload} />
                            </label>
                        </div>
                    )}
                </div>

                {/* PROPERTIES PANEL (Right) */}
                {showProperties && (
                    <div className={`${isMobile ? 'absolute inset-y-0 right-0 z-30 w-72' : 'relative w-64'} ${isDarkMode ? 'bg-slate-800/95 border-slate-700/50' : 'bg-white border-gray-200'} border-l flex flex-col shrink-0 backdrop-blur-xl`}>
                        <div className="p-3 border-b border-slate-700/30 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-400 uppercase">Properties</span>
                            {(isMobile || isTablet) && (
                                <button onClick={() => setShowProperties(false)} className="text-slate-500 hover:text-white">✕</button>
                            )}
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {selectedElement ? (
                                <div className="divide-y divide-slate-700/30">
                                    {/* Element Header */}
                                    <div className="p-3 bg-gradient-to-r from-blue-500/10 to-transparent">
                                        <p className="text-[10px] font-bold text-blue-400 uppercase mb-1">{selectedElement.type}</p>
                                        <p className="font-bold text-white text-sm">{selectedElement.name}</p>
                                    </div>

                                    {/* Identity */}
                                    <div>
                                        <button onClick={() => toggleSet('identity')}
                                            className="w-full p-3 flex items-center gap-2 hover:bg-white/5 transition-colors">
                                            {expandedSets['identity']
                                                ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                                                : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Identity</span>
                                        </button>
                                        {expandedSets['identity'] && (
                                            <div className="px-3 pb-3 space-y-2">
                                                <div className="flex justify-between items-start">
                                                    <span className="text-xs text-slate-500">Express ID</span>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-xs text-slate-300 font-mono bg-slate-700/50 px-1.5 py-0.5 rounded truncate max-w-[140px]">{selectedElement.id}</span>
                                                        <button onClick={() => copyValue(selectedElement.id)} className="text-slate-600 hover:text-slate-300 p-0.5" title="Copy"><Copy className="w-3 h-3" /></button>
                                                    </div>
                                                </div>
                                                {selectedElement.globalId && (
                                                    <div className="flex justify-between items-start">
                                                        <span className="text-xs text-slate-500">GlobalId</span>
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-xs text-slate-300 font-mono bg-slate-700/50 px-1.5 py-0.5 rounded truncate max-w-[140px]">{selectedElement.globalId}</span>
                                                            <button onClick={() => copyValue(selectedElement.globalId!)} className="text-slate-600 hover:text-slate-300 p-0.5" title="Copy"><Copy className="w-3 h-3" /></button>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="flex justify-between">
                                                    <span className="text-xs text-slate-500">IFC Type</span>
                                                    <span className="text-xs text-cyan-400">{selectedElement.type}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* All Property Sets */}
                                    {selectedElement.propertySets.map((pset) => (
                                        <div key={pset.name}>
                                            <button onClick={() => toggleSet(pset.name)}
                                                className="w-full p-3 flex items-center justify-between hover:bg-white/5 transition-colors">
                                                <div className="flex items-center gap-2">
                                                    {expandedSets[pset.name]
                                                        ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                                                        : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide truncate max-w-[150px]">{pset.name}</span>
                                                </div>
                                                <span className="text-[9px] text-slate-600 bg-slate-700/40 px-1.5 py-0.5 rounded">{pset.properties.length}</span>
                                            </button>
                                            {expandedSets[pset.name] && (
                                                <div className="px-3 pb-3 space-y-1.5">
                                                    {pset.properties.map((prop, idx) => (
                                                        <div key={`${pset.name}-${idx}`} className="flex justify-between items-start group">
                                                            <span className="text-xs text-slate-500 truncate max-w-[120px]" title={prop.name}>{prop.name}</span>
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-xs text-slate-300 truncate max-w-[130px]" title={prop.value}>{prop.value || '—'}</span>
                                                                <button onClick={() => copyValue(prop.value)}
                                                                    className="text-slate-700 hover:text-slate-300 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity" title="Copy">
                                                                    <Copy className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {/* Materials */}
                                    {selectedElement.materials.length > 0 && (
                                        <div>
                                            <button onClick={() => toggleSet('material')}
                                                className="w-full p-3 flex items-center gap-2 hover:bg-white/5 transition-colors">
                                                {expandedSets['material']
                                                    ? <ChevronDown className="w-3.5 h-3.5 text-amber-500" />
                                                    : <ChevronRight className="w-3.5 h-3.5 text-amber-500" />}
                                                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wide">Material</span>
                                            </button>
                                            {expandedSets['material'] && (
                                                <div className="px-3 pb-3 space-y-1.5">
                                                    {selectedElement.materials.map((mat, idx) => (
                                                        <div key={idx} className="flex items-center gap-2">
                                                            <div className="w-3 h-3 rounded-sm bg-amber-500/30 border border-amber-500/50 shrink-0" />
                                                            <span className="text-xs text-slate-300">{mat}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Spatial Hierarchy */}
                                    {selectedElement.spatialHierarchy.length > 0 && (
                                        <div>
                                            <button onClick={() => toggleSet('hierarchy')}
                                                className="w-full p-3 flex items-center gap-2 hover:bg-white/5 transition-colors">
                                                {expandedSets['hierarchy']
                                                    ? <ChevronDown className="w-3.5 h-3.5 text-emerald-500" />
                                                    : <ChevronRight className="w-3.5 h-3.5 text-emerald-500" />}
                                                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wide">Spatial Hierarchy</span>
                                            </button>
                                            {expandedSets['hierarchy'] && (
                                                <div className="px-3 pb-3">
                                                    {selectedElement.spatialHierarchy.map((node, idx) => (
                                                        <div key={idx} className="flex items-center gap-1" style={{ paddingLeft: `${idx * 12}px` }}>
                                                            <FolderTree className={`w-3 h-3 shrink-0 ${node.isCurrent ? 'text-emerald-400' : 'text-slate-600'}`} />
                                                            <span className={`text-xs ${node.isCurrent ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
                                                                {node.name}
                                                            </span>
                                                            <span className="text-[9px] text-slate-600 ml-1">{node.type}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                                    <Crosshair className="w-8 h-8 text-slate-600 mb-3" />
                                    <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                        Select an element
                                    </p>
                                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-600' : 'text-gray-400'}`}>
                                        Click on a model element to view all properties
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* FOOTER */}
            <div className={`h-7 ${isDarkMode ? 'bg-slate-800/90 border-slate-700/50 text-slate-500' : 'bg-white border-gray-200 text-gray-400'} border-t flex items-center justify-between px-3 text-[10px] shrink-0`}>
                <div className="flex items-center gap-3">
                    <span>Powered by <strong className="text-blue-400">That Open Engine</strong></span>
                    <span>•</span>
                    <span>{disciplineModels.filter(d => d.visible).length}/{disciplineModels.length} visible</span>
                </div>
                <div className="flex items-center gap-3">
                    {objectCount > 0 && <span>{objectCount.toLocaleString()} elements</span>}
                </div>
            </div>
        </div>
    );
};
