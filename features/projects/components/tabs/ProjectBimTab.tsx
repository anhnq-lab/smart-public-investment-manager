import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Viewer } from '@xeokit/xeokit-sdk/src/viewer/Viewer';
import { WebIFCLoaderPlugin } from '@xeokit/xeokit-sdk/src/plugins/WebIFCLoaderPlugin/WebIFCLoaderPlugin';
import { NavCubePlugin } from '@xeokit/xeokit-sdk/src/plugins/NavCubePlugin/NavCubePlugin';
import { TreeViewPlugin } from '@xeokit/xeokit-sdk/src/plugins/TreeViewPlugin/TreeViewPlugin';
import { SectionPlanesPlugin } from '@xeokit/xeokit-sdk/src/plugins/SectionPlanesPlugin/SectionPlanesPlugin';
import * as WebIFC from 'web-ifc';
import {
    Box, Maximize2, RotateCcw, Loader2, Upload, Eye, EyeOff,
    Layers, X, ChevronRight, ChevronDown, Ruler, ZoomIn, ZoomOut,
    ArrowUp, ArrowRight as ArrowRightIcon, List, Square, RotateCw,
    MousePointer, Grid3X3, Slice, Target, Home, Move, Crosshair,
    Focus, Settings2, Info, Building2, Cuboid, Minus, Plus,
    PanelLeftClose, PanelRightClose, PanelLeft, PanelRight,
    Sun, Moon, AlertCircle, CheckCircle, Menu, Smartphone
} from 'lucide-react';

// IFC Converter API URL
const IFC_CONVERTER_API = 'https://smart-public-investment-manager.onrender.com';

interface ProjectBimTabProps {
    projectID: string;
}

interface SelectedElement {
    id: string;
    name: string;
    type: string;
    properties: Record<string, any>;
}

type LoadStatus = 'idle' | 'initializing' | 'loading' | 'processing' | 'success' | 'error';

export const ProjectBimTab: React.FC<ProjectBimTabProps> = ({ projectID }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const navCubeCanvasRef = useRef<HTMLCanvasElement>(null);
    const treeContainerRef = useRef<HTMLDivElement>(null);

    const viewerRef = useRef<Viewer | null>(null);
    const ifcLoaderRef = useRef<WebIFCLoaderPlugin | null>(null);
    const sectionPlanesRef = useRef<SectionPlanesPlugin | null>(null);

    const [status, setStatus] = useState<LoadStatus>('initializing');
    const [statusMessage, setStatusMessage] = useState('Đang khởi tạo viewer...');
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [modelLoaded, setModelLoaded] = useState(false);
    const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
    const [showModelTree, setShowModelTree] = useState(true);
    const [showProperties, setShowProperties] = useState(true);
    const [sectionEnabled, setSectionEnabled] = useState(false);
    const [objectCount, setObjectCount] = useState(0);
    const [activeView, setActiveView] = useState('iso');
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [fileName, setFileName] = useState('');
    const [viewerReady, setViewerReady] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);

    // Detect screen size for responsive layout
    useEffect(() => {
        const checkScreenSize = () => {
            const width = window.innerWidth;
            setIsMobile(width < 768);
            setIsTablet(width >= 768 && width < 1024);

            // Auto-hide sidebars on tablet/mobile
            if (width < 1024) {
                setShowModelTree(false);
                setShowProperties(false);
            }
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // Initialize xeokit viewer
    useEffect(() => {
        if (!canvasRef.current) {
            console.warn('Canvas ref not ready');
            return;
        }

        // Ensure canvas has valid dimensions
        const canvas = canvasRef.current;
        if (!canvas.offsetWidth || !canvas.offsetHeight) {
            console.warn('Canvas has no dimensions yet, retrying...');
            const timer = setTimeout(() => {
                // Force re-render
                setViewerReady(false);
            }, 100);
            return () => clearTimeout(timer);
        }

        let viewer: any = null;
        let cancelled = false;

        const initViewer = async () => {
            try {
                setStatus('initializing');
                setStatusMessage('Đang khởi tạo xeokit viewer...');

                // Create viewer with canvas element directly
                viewer = new Viewer({
                    canvasElement: canvas,
                    transparent: false,
                    saoEnabled: true,
                    pbrEnabled: false,
                });

                // Set initial camera
                viewer.scene.camera.eye = [50, 35, 50];
                viewer.scene.camera.look = [0, 5, 0];
                viewer.scene.camera.up = [0, 1, 0];

                // Background
                canvas.style.background = isDarkMode
                    ? 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)'
                    : 'linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)';

                viewerRef.current = viewer;

                // Add NavCube
                if (navCubeCanvasRef.current) {
                    new NavCubePlugin(viewer, {
                        canvasElement: navCubeCanvasRef.current,
                        visible: true,
                        size: 250,
                        alignment: 'bottomRight',
                        bottomMargin: 80,
                        rightMargin: 10,
                    });
                }

                // Initialize IfcAPI (required by WebIFCLoaderPlugin)
                setStatusMessage('Đang tải WebIFC module...');
                const ifcAPI = new WebIFC.IfcAPI();
                ifcAPI.SetWasmPath('https://cdn.jsdelivr.net/npm/web-ifc@0.0.66/');

                await ifcAPI.Init();

                if (cancelled) return;

                // Add WebIFC Loader with initialized IfcAPI
                const ifcLoader = new WebIFCLoaderPlugin(viewer, {
                    WebIFC: WebIFC,
                    IfcAPI: ifcAPI,
                });
                ifcLoaderRef.current = ifcLoader;

                // Add Section Planes
                const sectionPlanes = new SectionPlanesPlugin(viewer, {
                    overviewVisible: false,
                });
                sectionPlanesRef.current = sectionPlanes;

                // Add TreeView
                if (treeContainerRef.current) {
                    new TreeViewPlugin(viewer, {
                        containerElement: treeContainerRef.current,
                        autoExpandDepth: 2,
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
                            properties: metaObject?.propertySets?.[0]?.properties || {},
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

                if (!cancelled) {
                    setViewerReady(true);
                    setStatus('idle');
                    setStatusMessage('');
                    console.log('xeokit viewer initialized successfully');
                }

            } catch (error: any) {
                if (!cancelled) {
                    console.error('Viewer init error:', error);
                    setStatus('error');
                    const errorMsg = error?.message || error?.toString?.() || 'Unknown initialization error';
                    setStatusMessage(`Lỗi khởi tạo: ${errorMsg}`);
                }
            }
        };

        initViewer();

        return () => {
            cancelled = true;
            if (viewer) {
                try {
                    viewer.destroy();
                } catch (e) {
                    console.warn('Error destroying viewer:', e);
                }
            }
        };
    }, [isDarkMode, viewerReady]);

    // Handle file upload
    const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !ifcLoaderRef.current || !viewerRef.current) {
            setStatus('error');
            setStatusMessage('Viewer chưa sẵn sàng. Vui lòng tải lại trang.');
            return;
        }

        // Validate file
        if (!file.name.toLowerCase().endsWith('.ifc')) {
            setStatus('error');
            setStatusMessage('Định dạng không hợp lệ. Vui lòng chọn file .IFC');
            return;
        }

        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > 200) {
            setStatus('error');
            setStatusMessage(`File quá lớn (${fileSizeMB.toFixed(1)}MB). Giới hạn 200MB`);
            return;
        }

        setFileName(file.name);
        setStatus('loading');
        setStatusMessage(`Đang tải "${file.name}" (${fileSizeMB.toFixed(1)}MB)...`);
        setLoadingProgress(0);

        try {
            // Create object URL for the file
            const fileUrl = URL.createObjectURL(file);

            // Load the IFC model
            const model = ifcLoaderRef.current.load({
                id: `model-${Date.now()}`,
                src: fileUrl,
                edges: true,
                excludeTypes: [], // Load all types
            });

            // Track loading progress
            let progressInterval = setInterval(() => {
                setLoadingProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + Math.random() * 10;
                });
            }, 500);

            model.on('loaded', () => {
                clearInterval(progressInterval);
                setLoadingProgress(100);
                setModelLoaded(true);
                setStatus('success');
                setStatusMessage(`✓ Đã tải "${file.name}" thành công!`);

                // Count objects
                const count = Object.keys(viewerRef.current!.scene.objects).length;
                setObjectCount(count);

                // Fit camera to model
                viewerRef.current!.cameraFlight.flyTo({
                    aabb: model.aabb,
                    duration: 1,
                });

                // Hide success message after 3s
                setTimeout(() => {
                    setStatus('idle');
                    setStatusMessage('');
                }, 3000);

                // Cleanup URL
                URL.revokeObjectURL(fileUrl);
            });

            model.on('error', (err: Error) => {
                clearInterval(progressInterval);
                console.error('IFC load error:', err);
                setStatus('error');
                setStatusMessage(`Lỗi load model: ${err.message || 'File không hợp lệ'}`);
                URL.revokeObjectURL(fileUrl);
            });

        } catch (error: any) {
            console.error('Upload error:', error);
            setStatus('error');
            setStatusMessage(`Lỗi: ${error.message}`);
        }
    }, []);

    // Camera controls
    const setCameraView = useCallback((view: string) => {
        if (!viewerRef.current) return;

        const aabb = viewerRef.current.scene.aabb;
        const center = [
            (aabb[0] + aabb[3]) / 2,
            (aabb[1] + aabb[4]) / 2,
            (aabb[2] + aabb[5]) / 2,
        ];
        const size = Math.max(aabb[3] - aabb[0], aabb[4] - aabb[1], aabb[5] - aabb[2]) || 50;
        const distance = size * 1.5;

        const views: Record<string, { eye: number[], up: number[] }> = {
            top: { eye: [center[0], center[1] + distance, center[2] + 0.01], up: [0, 0, -1] },
            front: { eye: [center[0], center[1], center[2] + distance], up: [0, 1, 0] },
            right: { eye: [center[0] + distance, center[1], center[2]], up: [0, 1, 0] },
            back: { eye: [center[0], center[1], center[2] - distance], up: [0, 1, 0] },
            left: { eye: [center[0] - distance, center[1], center[2]], up: [0, 1, 0] },
            iso: { eye: [center[0] + distance * 0.7, center[1] + distance * 0.5, center[2] + distance * 0.7], up: [0, 1, 0] },
        };

        const viewConfig = views[view] || views.iso;

        viewerRef.current.cameraFlight.flyTo({
            eye: viewConfig.eye,
            look: center,
            up: viewConfig.up,
            duration: 0.8,
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
            duration: 0.8,
        });
    }, []);

    // Get status color classes
    const getStatusClasses = () => {
        switch (status) {
            case 'loading':
            case 'processing':
            case 'initializing':
                return 'bg-blue-500/20 border-blue-500/30 text-blue-400';
            case 'success':
                return 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400';
            case 'error':
                return 'bg-red-500/20 border-red-500/30 text-red-400';
            default:
                return '';
        }
    };

    // Tool button component
    const ToolBtn = ({ active, onClick, title, children, disabled }: {
        active?: boolean;
        onClick?: () => void;
        title: string;
        children: React.ReactNode;
        disabled?: boolean;
    }) => (
        <button
            onClick={onClick}
            title={title}
            disabled={disabled}
            className={`p-2 rounded-lg transition-all ${active
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                : disabled
                    ? 'text-slate-600 cursor-not-allowed'
                    : 'text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
        >
            {children}
        </button>
    );

    // View button component
    const ViewBtn = ({ view, icon: Icon, label }: { view: string; icon: any; label: string }) => (
        <button
            onClick={() => setCameraView(view)}
            className={`px-2 py-1 rounded text-[10px] font-medium transition-all flex items-center gap-1 ${activeView === view
                ? 'bg-blue-500 text-white'
                : 'text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
            title={label}
        >
            <Icon className="w-3 h-3" />
            <span className="hidden xl:inline">{label}</span>
        </button>
    );

    return (
        <div className={`flex flex-col overflow-hidden rounded-xl border ${isDarkMode ? 'bg-slate-900 border-slate-700/50' : 'bg-gray-100 border-gray-200'}`}
            style={{
                height: isMobile ? 'calc(100vh - 120px)' : 'calc(100vh - 200px)',
                minHeight: isMobile ? '400px' : '600px',
                touchAction: 'none' // Better touch handling for 3D
            }}>

            {/* HEADER TOOLBAR - Responsive */}
            <div className={`${isMobile ? 'h-14' : 'h-12'} ${isDarkMode ? 'bg-slate-800/90 border-slate-700/50' : 'bg-white border-gray-200'} border-b flex items-center justify-between ${isMobile ? 'px-2' : 'px-3'} shrink-0`}>
                <div className="flex items-center gap-2">
                    {/* Toggle sidebars on mobile/tablet */}
                    {(isMobile || isTablet) && (
                        <button
                            onClick={() => setShowModelTree(!showModelTree)}
                            className={`p-2 rounded-lg transition-all ${showModelTree ? 'bg-blue-500 text-white' : 'text-slate-400 hover:bg-white/10'}`}
                            title="Model Tree"
                        >
                            <PanelLeft className="w-5 h-5" />
                        </button>
                    )}

                    {/* Logo/Title - Hidden on mobile */}
                    <div className={`${isMobile ? 'hidden' : 'flex'} items-center gap-2 px-2 py-1 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20`}>
                        <Building2 className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-bold text-blue-400 uppercase tracking-wide">xeokit BIM</span>
                    </div>

                    <div className="h-5 w-px bg-slate-700" />

                    {/* Status indicator */}
                    <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${viewerReady ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                        <span className="text-[10px] text-slate-500">
                            {viewerReady ? 'Ready' : 'Loading...'}
                        </span>
                    </div>

                    {modelLoaded && (
                        <>
                            <div className="h-5 w-px bg-slate-700" />
                            <span className="text-[10px] text-slate-500 font-mono">
                                {objectCount} objects
                            </span>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* View buttons */}
                    <div className="flex bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/50">
                        <ViewBtn view="iso" icon={Box} label="3D" />
                        <ViewBtn view="top" icon={ArrowUp} label="Trên" />
                        <ViewBtn view="front" icon={Square} label="Trước" />
                        <ViewBtn view="right" icon={ArrowRightIcon} label="Phải" />
                    </div>

                    <div className="h-5 w-px bg-slate-700" />

                    {/* Upload button - Touch friendly */}
                    <label className={`flex items-center gap-1.5 ${isMobile ? 'px-3 py-2' : 'px-3 py-1.5'} bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white ${isMobile ? 'text-sm' : 'text-xs'} font-semibold rounded-lg cursor-pointer transition-all shadow-lg shadow-blue-500/25 ${status === 'loading' ? 'opacity-50 pointer-events-none' : ''}`}>
                        <Upload className={isMobile ? 'w-5 h-5' : 'w-3.5 h-3.5'} />
                        <span className={isMobile ? 'hidden sm:inline' : ''}>{isMobile ? '' : 'Upload IFC'}</span>
                        <input
                            type="file"
                            accept=".ifc"
                            className="hidden"
                            onChange={handleFileUpload}
                            disabled={status === 'loading'}
                        />
                    </label>

                    {/* Toggle properties on mobile/tablet */}
                    {(isMobile || isTablet) && (
                        <button
                            onClick={() => setShowProperties(!showProperties)}
                            className={`p-2 rounded-lg transition-all ${showProperties ? 'bg-blue-500 text-white' : 'text-slate-400 hover:bg-white/10'}`}
                            title="Properties"
                        >
                            <PanelRight className="w-5 h-5" />
                        </button>
                    )}

                    {/* Theme toggle */}
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-all"
                    >
                        {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* STATUS BAR */}
            {status !== 'idle' && statusMessage && (
                <div className={`px-4 py-2 border-b flex items-center gap-3 ${getStatusClasses()}`}>
                    {(status === 'loading' || status === 'processing' || status === 'initializing') && (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    {status === 'success' && <CheckCircle className="w-4 h-4" />}
                    {status === 'error' && <AlertCircle className="w-4 h-4" />}

                    <span className="text-sm font-medium flex-1">{statusMessage}</span>

                    {(status === 'loading' || status === 'processing') && (
                        <div className="flex items-center gap-2 min-w-[120px]">
                            <div className="flex-1 bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="bg-blue-500 h-full transition-all duration-300"
                                    style={{ width: `${loadingProgress}%` }}
                                />
                            </div>
                            <span className="text-xs font-mono w-8">{Math.round(loadingProgress)}%</span>
                        </div>
                    )}

                    {status === 'error' && (
                        <button
                            onClick={() => { setStatus('idle'); setStatusMessage(''); }}
                            className="text-red-400 hover:text-red-300 text-sm"
                        >
                            Đóng
                        </button>
                    )}
                </div>
            )}

            <div className="flex-1 flex overflow-hidden">
                {/* LEFT SIDEBAR - Model Tree (Responsive) */}
                {showModelTree && (
                    <div className={`${isMobile ? 'absolute left-0 top-0 bottom-0 z-20 w-64' : isTablet ? 'absolute left-0 top-0 bottom-0 z-20 w-56' : 'w-64'} ${isDarkMode ? 'bg-slate-800/95 border-slate-700/30' : 'bg-white/95 border-gray-200'} ${isMobile || isTablet ? 'backdrop-blur-sm shadow-2xl' : ''} border-r flex flex-col shrink-0`}>
                        <div className="p-2.5 border-b border-slate-700/30 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Layers className="w-4 h-4 text-blue-400" />
                                <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">Model Tree</span>
                            </div>
                            <button
                                onClick={() => setShowModelTree(false)}
                                className="text-slate-500 hover:text-white p-1 rounded hover:bg-white/10"
                            >
                                <PanelLeftClose className="w-4 h-4" />
                            </button>
                        </div>
                        <div
                            ref={treeContainerRef}
                            className="flex-1 overflow-y-auto p-1 xeokit-tree-view"
                            style={{
                                fontSize: '11px',
                                color: isDarkMode ? '#94a3b8' : '#475569',
                            }}
                        >
                            {!modelLoaded && (
                                <div className="flex flex-col items-center justify-center h-full text-slate-500 p-4">
                                    <Cuboid className="w-10 h-10 text-slate-700 mb-3" />
                                    <p className="text-sm font-medium">Chưa có model</p>
                                    <p className="text-[10px] text-slate-600 mt-1 text-center">
                                        Upload file IFC để xem cấu trúc
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* LEFT TOOLBAR */}
                <div className={`w-12 ${isDarkMode ? 'bg-slate-800/50 border-slate-700/30' : 'bg-gray-50 border-gray-200'} border-r flex flex-col items-center py-2 gap-1 shrink-0`}>
                    <ToolBtn onClick={fitToView} title="Về góc nhìn mặc định (Home)">
                        <Home className="w-4 h-4" />
                    </ToolBtn>
                    <ToolBtn onClick={fitToView} title="Zoom vừa màn hình (F)" disabled={!modelLoaded}>
                        <Focus className="w-4 h-4" />
                    </ToolBtn>

                    <div className="h-px w-6 bg-slate-700/50 my-1" />

                    <ToolBtn
                        active={sectionEnabled}
                        onClick={toggleSection}
                        title="Cắt mặt bằng (C)"
                        disabled={!modelLoaded}
                    >
                        <Slice className="w-4 h-4" />
                    </ToolBtn>
                    <ToolBtn title="Đo khoảng cách (M)" disabled={!modelLoaded}>
                        <Ruler className="w-4 h-4" />
                    </ToolBtn>

                    <div className="h-px w-6 bg-slate-700/50 my-1" />

                    <ToolBtn
                        active={showModelTree}
                        onClick={() => setShowModelTree(!showModelTree)}
                        title="Cây model (T)"
                    >
                        <List className="w-4 h-4" />
                    </ToolBtn>
                    <ToolBtn
                        active={showProperties}
                        onClick={() => setShowProperties(!showProperties)}
                        title="Properties (P)"
                    >
                        <Info className="w-4 h-4" />
                    </ToolBtn>

                    <div className="flex-1" />

                    <ToolBtn title="Cài đặt">
                        <Settings2 className="w-4 h-4" />
                    </ToolBtn>
                </div>

                {/* 3D CANVAS */}
                <div className="flex-1 relative">
                    <canvas
                        ref={canvasRef}
                        id="xeokit-canvas"
                        className="w-full h-full"
                        style={{
                            background: isDarkMode
                                ? 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)'
                                : 'linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)'
                        }}
                    />

                    {/* NavCube canvas */}
                    <canvas
                        ref={navCubeCanvasRef}
                        id="navCubeCanvas"
                        className="absolute bottom-3 right-3"
                        style={{ width: '100px', height: '100px' }}
                    />

                    {/* Loading overlay */}
                    {status === 'loading' && (
                        <div className="absolute inset-0 bg-slate-900/95 flex items-center justify-center z-20 backdrop-blur-sm">
                            <div className="flex flex-col items-center gap-4 w-80 bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700">
                                <div className="relative w-20 h-20">
                                    <svg className="w-full h-full -rotate-90">
                                        <circle cx="40" cy="40" r="36" fill="none" stroke="#334155" strokeWidth="6" />
                                        <circle
                                            cx="40" cy="40" r="36" fill="none"
                                            stroke="url(#gradient)"
                                            strokeWidth="6"
                                            strokeLinecap="round"
                                            strokeDasharray={`${loadingProgress * 2.26} 226`}
                                            className="transition-all duration-300"
                                        />
                                        <defs>
                                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#3b82f6" />
                                                <stop offset="100%" stopColor="#22d3ee" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-lg font-bold text-white">{Math.round(loadingProgress)}%</span>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <p className="text-white font-semibold mb-1">Đang xử lý IFC model...</p>
                                    <p className="text-slate-400 text-sm">{fileName}</p>
                                </div>
                                <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300"
                                        style={{ width: `${loadingProgress}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Empty state */}
                    {!modelLoaded && status !== 'loading' && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="bg-slate-800/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-slate-700/50 text-center max-w-md">
                                <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Building2 className="w-10 h-10 text-blue-400" />
                                </div>
                                <h3 className="text-white font-bold text-lg mb-2">xeokit BIM Viewer</h3>
                                <p className="text-slate-400 text-sm mb-4">
                                    Tải lên file .IFC để xem mô hình 3D BIM. Sử dụng WebIFC để load trực tiếp trong browser.
                                </p>
                                <label className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white text-sm font-semibold rounded-lg cursor-pointer transition-all shadow-lg shadow-blue-500/25 pointer-events-auto">
                                    <Upload className="w-4 h-4" />
                                    <span>Chọn file IFC</span>
                                    <input type="file" accept=".ifc" className="hidden" onChange={handleFileUpload} />
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Model loaded badge */}
                    {modelLoaded && status !== 'loading' && (
                        <div className="absolute top-3 right-3 flex items-center gap-2">
                            <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Model loaded
                            </div>
                        </div>
                    )}

                    {/* View indicator */}
                    <div className="absolute bottom-3 left-3 text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                        {activeView.toUpperCase()} VIEW
                    </div>

                    {/* Zoom controls */}
                    <div className="absolute bottom-3 right-28 flex flex-col gap-1">
                        <button
                            onClick={() => {
                                if (viewerRef.current) {
                                    const camera = viewerRef.current.scene.camera;
                                    const eye = camera.eye;
                                    const look = camera.look;
                                    const dir = [eye[0] - look[0], eye[1] - look[1], eye[2] - look[2]];
                                    camera.eye = [look[0] + dir[0] * 0.8, look[1] + dir[1] * 0.8, look[2] + dir[2] * 0.8];
                                }
                            }}
                            className="p-2 bg-slate-800/80 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all border border-slate-700/50"
                        >
                            <ZoomIn className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => {
                                if (viewerRef.current) {
                                    const camera = viewerRef.current.scene.camera;
                                    const eye = camera.eye;
                                    const look = camera.look;
                                    const dir = [eye[0] - look[0], eye[1] - look[1], eye[2] - look[2]];
                                    camera.eye = [look[0] + dir[0] * 1.2, look[1] + dir[1] * 1.2, look[2] + dir[2] * 1.2];
                                }
                            }}
                            className="p-2 bg-slate-800/80 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all border border-slate-700/50"
                        >
                            <ZoomOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* RIGHT SIDEBAR - Properties (Responsive) */}
                {showProperties && (
                    <div className={`${isMobile ? 'absolute right-0 top-0 bottom-0 z-20 w-64' : isTablet ? 'absolute right-0 top-0 bottom-0 z-20 w-60' : 'w-72'} ${isDarkMode ? 'bg-slate-800/95 border-slate-700/30' : 'bg-white/95 border-gray-200'} ${isMobile || isTablet ? 'backdrop-blur-sm shadow-2xl' : ''} border-l flex flex-col shrink-0`}>
                        <div className="p-2.5 border-b border-slate-700/30 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Info className="w-4 h-4 text-blue-400" />
                                <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">Properties</span>
                            </div>
                            <button
                                onClick={() => setShowProperties(false)}
                                className="text-slate-500 hover:text-white p-1 rounded hover:bg-white/10"
                            >
                                <PanelRightClose className="w-4 h-4" />
                            </button>
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
                                    <div className="p-3">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-wide">Định danh</p>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-start">
                                                <span className="text-xs text-slate-500">ID</span>
                                                <span className="text-xs text-slate-300 font-mono bg-slate-700/50 px-1.5 py-0.5 rounded truncate max-w-[150px]">{selectedElement.id}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-xs text-slate-500">IFC Type</span>
                                                <span className="text-xs text-cyan-400">{selectedElement.type}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Properties */}
                                    {Object.keys(selectedElement.properties).length > 0 && (
                                        <div className="p-3">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-wide">Properties</p>
                                            <div className="space-y-2">
                                                {Object.entries(selectedElement.properties).slice(0, 10).map(([key, value]) => (
                                                    <div key={key} className="flex justify-between">
                                                        <span className="text-xs text-slate-500 truncate max-w-[100px]">{key}</span>
                                                        <span className="text-xs text-slate-300 truncate max-w-[120px]">{String(value)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500 p-6">
                                    <Target className="w-12 h-12 text-slate-700 mb-3" />
                                    <p className="text-sm font-medium mb-1">Chọn phần tử</p>
                                    <p className="text-[11px] text-slate-600 text-center">
                                        Click vào một phần tử trong model để xem thuộc tính
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* FOOTER STATUS BAR - Responsive */}
            <div className={`${isMobile ? 'h-10' : 'h-8'} ${isDarkMode ? 'bg-slate-800/90 border-slate-700/50' : 'bg-white border-gray-200'} border-t flex items-center justify-between ${isMobile ? 'px-2' : 'px-3'} text-[10px] text-slate-500 shrink-0`}>
                <div className="flex items-center gap-2 md:gap-4">
                    <span className="hidden md:inline">Viewer: <span className="text-cyan-400">xeokit SDK</span></span>
                    <span className="hidden md:inline">•</span>
                    <span className="truncate max-w-[150px] md:max-w-none">{modelLoaded ? `${fileName} | ${objectCount} elements` : 'No model'}</span>
                </div>
                <div className="flex items-center gap-2 md:gap-4">
                    {isMobile || isTablet ? (
                        <span className="text-[9px]">Touch: Rotate • 2-finger: Pan/Zoom</span>
                    ) : (
                        <>
                            <span>LMB: Rotate</span>
                            <span>•</span>
                            <span>RMB: Pan</span>
                            <span>•</span>
                            <span>Scroll: Zoom</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
