import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Viewer } from '@xeokit/xeokit-sdk/src/viewer/Viewer';
import { WebIFCLoaderPlugin } from '@xeokit/xeokit-sdk/src/plugins/WebIFCLoaderPlugin/WebIFCLoaderPlugin';
import { NavCubePlugin } from '@xeokit/xeokit-sdk/src/plugins/NavCubePlugin/NavCubePlugin';
import { TreeViewPlugin } from '@xeokit/xeokit-sdk/src/plugins/TreeViewPlugin/TreeViewPlugin';
import { SectionPlanesPlugin } from '@xeokit/xeokit-sdk/src/plugins/SectionPlanesPlugin/SectionPlanesPlugin';
import {
    Box, Maximize2, RotateCcw, Loader2, Upload,
    Layers, X, Ruler, ArrowUp, ArrowRight as ArrowRightIcon,
    List, Square, MousePointer, Grid3X3, Slice, Target, Home,
    Focus, Settings2, ZoomIn, ZoomOut, Move
} from 'lucide-react';

interface XeokitViewerProps {
    projectId: string;
}

interface SelectedElement {
    id: string;
    name: string;
    type: string;
    properties: Record<string, any>;
}

export const XeokitViewer: React.FC<XeokitViewerProps> = ({ projectId }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const navCubeCanvasRef = useRef<HTMLCanvasElement>(null);
    const treeContainerRef = useRef<HTMLDivElement>(null);

    const viewerRef = useRef<Viewer | null>(null);
    const ifcLoaderRef = useRef<WebIFCLoaderPlugin | null>(null);
    const sectionPlanesRef = useRef<SectionPlanesPlugin | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [modelLoaded, setModelLoaded] = useState(false);
    const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
    const [showGrid, setShowGrid] = useState(true);
    const [showModelTree, setShowModelTree] = useState(false);
    const [sectionEnabled, setSectionEnabled] = useState(false);
    const [objectCount, setObjectCount] = useState(0);
    const [activeView, setActiveView] = useState('iso');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Initialize xeokit viewer
    useEffect(() => {
        if (!canvasRef.current) return;

        // Create viewer
        const viewer = new Viewer({
            canvasId: canvasRef.current.id,
            transparent: true,
            saoEnabled: true, // Ambient occlusion
            pbrEnabled: true, // Physically-based rendering
        });

        viewer.scene.camera.eye = [30, 25, 35];
        viewer.scene.camera.look = [0, 5, 0];
        viewer.scene.camera.up = [0, 1, 0];

        // Set background gradient
        viewer.scene.canvas.canvas.style.background =
            'linear-gradient(180deg, #1a1f2e 0%, #0f1419 100%)';

        viewerRef.current = viewer;

        // Add NavCube
        if (navCubeCanvasRef.current) {
            new NavCubePlugin(viewer, {
                canvasId: navCubeCanvasRef.current.id,
                visible: true,
                size: 200,
                alignment: 'bottomRight',
                bottomMargin: 100,
                rightMargin: 10,
            });
        }

        // Add WebIFC Loader
        const ifcLoader = new WebIFCLoaderPlugin(viewer, {
            wasmPath: '/wasm/',
        });
        ifcLoaderRef.current = ifcLoader;

        // Add Section Planes
        const sectionPlanes = new SectionPlanesPlugin(viewer, {
            overviewVisible: false,
        });
        sectionPlanesRef.current = sectionPlanes;

        // Add TreeView if container exists
        if (treeContainerRef.current) {
            new TreeViewPlugin(viewer, {
                containerElement: treeContainerRef.current,
                autoExpandDepth: 1,
                hierarchy: 'types',
            });
        }

        // Handle element picking
        viewer.scene.input.on('picked', (hit: any) => {
            if (hit && hit.entity) {
                const entity = hit.entity;
                const metaObject = viewer.metaScene.metaObjects[entity.id];

                setSelectedElement({
                    id: entity.id,
                    name: metaObject?.name || entity.id,
                    type: metaObject?.type || 'Unknown',
                    properties: metaObject?.propertySet || {},
                });

                // Highlight selected
                viewer.scene.setObjectsHighlighted(viewer.scene.highlightedObjectIds, false);
                entity.highlighted = true;
            }
        });

        viewer.scene.input.on('pickedNothing', () => {
            setSelectedElement(null);
            viewer.scene.setObjectsHighlighted(viewer.scene.highlightedObjectIds, false);
        });

        // Cleanup
        return () => {
            viewer.destroy();
        };
    }, []);

    // Handle file upload
    const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !ifcLoaderRef.current || !viewerRef.current) return;

        setIsLoading(true);
        setLoadingProgress(0);
        setErrorMessage(null);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const ifcData = new Uint8Array(arrayBuffer);

            const model = ifcLoaderRef.current.load({
                id: `model-${Date.now()}`,
                src: URL.createObjectURL(new Blob([ifcData])),
                edges: true,
            });

            model.on('loading', (progress: number) => {
                setLoadingProgress(Math.round(progress));
            });

            model.on('loaded', () => {
                setModelLoaded(true);
                setIsLoading(false);
                setObjectCount(Object.keys(viewerRef.current!.scene.objects).length);

                // Fit camera to model
                viewerRef.current!.cameraFlight.flyTo({
                    aabb: model.aabb,
                    duration: 0.5,
                });
            });

            model.on('error', (err: Error) => {
                setErrorMessage(`Lỗi load model: ${err.message}`);
                setIsLoading(false);
            });

        } catch (error: any) {
            setErrorMessage(`Lỗi đọc file: ${error.message}`);
            setIsLoading(false);
        }
    }, []);

    // Camera controls
    const setCameraView = useCallback((view: string) => {
        if (!viewerRef.current) return;

        const camera = viewerRef.current.scene.camera;
        const aabb = viewerRef.current.scene.aabb;
        const center = [
            (aabb[0] + aabb[3]) / 2,
            (aabb[1] + aabb[4]) / 2,
            (aabb[2] + aabb[5]) / 2,
        ];
        const size = Math.max(aabb[3] - aabb[0], aabb[4] - aabb[1], aabb[5] - aabb[2]);
        const distance = size * 1.5;

        const views: Record<string, { eye: number[], up: number[] }> = {
            top: { eye: [center[0], center[1] + distance, center[2] + 0.01], up: [0, 0, -1] },
            front: { eye: [center[0], center[1], center[2] + distance], up: [0, 1, 0] },
            right: { eye: [center[0] + distance, center[1], center[2]], up: [0, 1, 0] },
            iso: { eye: [center[0] + distance * 0.7, center[1] + distance * 0.5, center[2] + distance * 0.7], up: [0, 1, 0] },
        };

        const viewConfig = views[view] || views.iso;

        viewerRef.current.cameraFlight.flyTo({
            eye: viewConfig.eye,
            look: center,
            up: viewConfig.up,
            duration: 0.5,
        });

        setActiveView(view);
    }, []);

    // Toggle section plane
    const toggleSection = useCallback(() => {
        if (!sectionPlanesRef.current || !viewerRef.current) return;

        if (sectionEnabled) {
            sectionPlanesRef.current.clear();
        } else {
            const aabb = viewerRef.current.scene.aabb;
            const centerY = (aabb[1] + aabb[4]) / 2;

            sectionPlanesRef.current.createSectionPlane({
                id: 'horizontalSection',
                pos: [0, centerY, 0],
                dir: [0, -1, 0],
            });
        }
        setSectionEnabled(!sectionEnabled);
    }, [sectionEnabled]);

    // Fit to view
    const fitToView = useCallback(() => {
        if (!viewerRef.current) return;
        viewerRef.current.cameraFlight.flyTo({
            aabb: viewerRef.current.scene.aabb,
            duration: 0.5,
        });
    }, []);

    // Tool button component
    const ToolBtn = ({ active, onClick, title, children }: {
        active?: boolean;
        onClick?: () => void;
        title: string;
        children: React.ReactNode
    }) => (
        <button
            onClick={onClick}
            title={title}
            className={`p-2 rounded-lg transition-all ${active
                    ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                    : 'text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
        >
            {children}
        </button>
    );

    return (
        <div className="rounded-2xl overflow-hidden flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 shadow-2xl"
            style={{ height: 'calc(100vh - 260px)', minHeight: '550px', maxHeight: '850px' }}>

            {/* HEADER */}
            <div className="h-12 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700/50 flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 rounded-lg border border-slate-600/30">
                        <div className={`w-2 h-2 rounded-full ${modelLoaded ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">xeokit BIM</span>
                    </div>
                    <div className="h-4 w-px bg-slate-700" />
                    <span className="text-[10px] text-slate-500 font-mono">{objectCount} objects</span>
                </div>

                <div className="flex items-center gap-2">
                    {/* View buttons */}
                    <div className="flex bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/50">
                        {[
                            { view: 'top', icon: ArrowUp },
                            { view: 'front', icon: Square },
                            { view: 'right', icon: ArrowRightIcon },
                            { view: 'iso', icon: Box }
                        ].map(({ view, icon: IconComp }) => (
                            <button
                                key={view}
                                onClick={() => setCameraView(view)}
                                className={`p-1.5 rounded-md transition-all ${activeView === view
                                        ? 'bg-cyan-500 text-white'
                                        : 'text-slate-400 hover:text-white'
                                    }`}
                                title={view}
                            >
                                <IconComp className="w-3.5 h-3.5" />
                            </button>
                        ))}
                    </div>

                    {/* Upload button */}
                    <label className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white text-[11px] font-bold rounded-lg cursor-pointer transition-all shadow-lg shadow-cyan-500/20">
                        <Upload className="w-3.5 h-3.5" /> Upload IFC
                        <input type="file" accept=".ifc" className="hidden" onChange={handleFileUpload} />
                    </label>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* LEFT TOOLBAR */}
                <div className="w-12 bg-slate-800/50 border-r border-slate-700/30 flex flex-col items-center py-3 gap-1 shrink-0">
                    <ToolBtn active title="Select"><MousePointer className="w-4 h-4" /></ToolBtn>
                    <ToolBtn onClick={fitToView} title="Fit to View"><Home className="w-4 h-4" /></ToolBtn>
                    <div className="h-px w-6 bg-slate-700/50 my-1" />
                    <ToolBtn active={sectionEnabled} onClick={toggleSection} title="Section"><Slice className="w-4 h-4" /></ToolBtn>
                    <ToolBtn title="Measure"><Ruler className="w-4 h-4" /></ToolBtn>
                    <ToolBtn onClick={fitToView} title="Focus"><Focus className="w-4 h-4" /></ToolBtn>
                    <div className="h-px w-6 bg-slate-700/50 my-1" />
                    <ToolBtn active={showModelTree} onClick={() => setShowModelTree(!showModelTree)} title="Tree"><List className="w-4 h-4" /></ToolBtn>
                    <div className="flex-1" />
                    <ToolBtn title="Settings"><Settings2 className="w-4 h-4" /></ToolBtn>
                </div>

                {/* MODEL TREE */}
                {showModelTree && (
                    <div className="w-56 bg-slate-800/80 border-r border-slate-700/30 flex flex-col shrink-0">
                        <div className="p-2.5 border-b border-slate-700/30 flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wide">Model Tree</span>
                            <button onClick={() => setShowModelTree(false)} className="text-slate-500 hover:text-white p-0.5">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div
                            ref={treeContainerRef}
                            className="flex-1 overflow-y-auto p-1 text-[11px] text-slate-400"
                        >
                            {!modelLoaded && (
                                <div className="p-4 text-center text-slate-500">
                                    Upload IFC để xem cấu trúc model
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 3D CANVAS */}
                <div className="flex-1 relative">
                    <canvas
                        ref={canvasRef}
                        id="xeokit-canvas"
                        className="w-full h-full"
                    />

                    {/* NavCube canvas */}
                    <canvas
                        ref={navCubeCanvasRef}
                        id="navCubeCanvas"
                        className="absolute bottom-3 right-3 w-24 h-24"
                    />

                    {/* Loading overlay */}
                    {isLoading && (
                        <div className="absolute inset-0 bg-slate-900/90 flex items-center justify-center z-10 backdrop-blur-sm">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
                                <p className="text-sm font-medium text-cyan-300">Loading model...</p>
                                <div className="w-48 h-2 bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                                        style={{ width: `${loadingProgress}%` }}
                                    />
                                </div>
                                <p className="text-[10px] text-slate-500">{loadingProgress}%</p>
                            </div>
                        </div>
                    )}

                    {/* Error message */}
                    {errorMessage && (
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-4 py-2 rounded-lg text-sm z-10">
                            {errorMessage}
                            <button onClick={() => setErrorMessage(null)} className="ml-2 hover:text-red-200">×</button>
                        </div>
                    )}

                    {/* Model loaded badge */}
                    {modelLoaded && !isLoading && (
                        <div className="absolute top-3 right-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5 shadow-lg shadow-emerald-500/30">
                            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Model Loaded
                        </div>
                    )}

                    {/* Empty state */}
                    {!modelLoaded && !isLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                            <Box className="w-16 h-16 text-slate-700 mb-4" />
                            <p className="text-lg font-medium mb-2">Chưa có model</p>
                            <p className="text-sm text-slate-600">Click "Upload IFC" để tải file IFC</p>
                        </div>
                    )}

                    {/* View indicator */}
                    <div className="absolute bottom-3 left-3 text-[9px] text-slate-500 uppercase tracking-widest">
                        {activeView.toUpperCase()} VIEW
                    </div>
                </div>

                {/* PROPERTIES PANEL */}
                <div className="w-64 bg-slate-800/80 border-l border-slate-700/30 flex flex-col shrink-0">
                    <div className="p-3 border-b border-slate-700/30 bg-gradient-to-r from-slate-800 to-slate-800/50">
                        <h3 className="text-[11px] font-bold text-slate-300 uppercase tracking-wide">Properties</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto text-[11px]">
                        {selectedElement ? (
                            <div className="divide-y divide-slate-700/30">
                                <div className="p-3 bg-gradient-to-r from-cyan-500/10 to-transparent">
                                    <p className="text-[9px] font-bold text-cyan-400 uppercase mb-1">Element</p>
                                    <p className="font-bold text-white">{selectedElement.name}</p>
                                </div>
                                <div className="p-3">
                                    <p className="text-[9px] font-bold text-slate-500 uppercase mb-2">Identity</p>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">ID</span>
                                            <span className="text-slate-300 font-mono text-[9px]">{selectedElement.id}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">IFC Type</span>
                                            <span className="text-cyan-300">{selectedElement.type}</span>
                                        </div>
                                    </div>
                                </div>
                                {Object.keys(selectedElement.properties).length > 0 && (
                                    <div className="p-3">
                                        <p className="text-[9px] font-bold text-slate-500 uppercase mb-2">Properties</p>
                                        <div className="space-y-1.5">
                                            {Object.entries(selectedElement.properties).map(([key, value]) => (
                                                <div key={key} className="flex justify-between">
                                                    <span className="text-slate-500 truncate max-w-[80px]">{key}</span>
                                                    <span className="text-slate-300 truncate max-w-[100px]">{String(value)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 p-4">
                                <Target className="w-8 h-8 text-slate-700 mb-2" />
                                <p className="text-sm font-medium">Select Element</p>
                                <p className="text-[10px] text-slate-600 mt-1">Click on model to view properties</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* FOOTER */}
            <div className="h-9 bg-gradient-to-r from-slate-800 to-slate-900 border-t border-slate-700/50 flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-3">
                    <span className="text-[9px] text-slate-500">
                        Powered by <span className="text-cyan-400">xeokit SDK</span>
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <button className="p-1.5 text-slate-500 hover:text-white transition-colors" onClick={fitToView}>
                        <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 text-slate-500 hover:text-white transition-colors">
                        <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default XeokitViewer;
