import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Viewer } from '@xeokit/xeokit-sdk/src/viewer/Viewer';
import { XKTLoaderPlugin } from '@xeokit/xeokit-sdk/src/plugins/XKTLoaderPlugin/XKTLoaderPlugin';
import { NavCubePlugin } from '@xeokit/xeokit-sdk/src/plugins/NavCubePlugin/NavCubePlugin';
import { TreeViewPlugin } from '@xeokit/xeokit-sdk/src/plugins/TreeViewPlugin/TreeViewPlugin';
import { SectionPlanesPlugin } from '@xeokit/xeokit-sdk/src/plugins/SectionPlanesPlugin/SectionPlanesPlugin';
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
    const xktLoaderRef = useRef<XKTLoaderPlugin | null>(null);
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

                // Add XKT Loader (for loading XKT files converted from IFC by backend)
                const xktLoader = new XKTLoaderPlugin(viewer);
                xktLoaderRef.current = xktLoader;

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
        if (!file || !xktLoaderRef.current || !viewerRef.current) {
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
        setStatusMessage(`Đang upload "${file.name}" (${fileSizeMB.toFixed(1)}MB)...`);
        setLoadingProgress(0);

        try {
            // Step 1: Upload IFC to backend for conversion
            const formData = new FormData();
            formData.append('file', file);

            setLoadingProgress(10);
            const uploadResponse = await fetch(`${IFC_CONVERTER_API}/convert`, {
                method: 'POST',
                body: formData,
            });

            if (!uploadResponse.ok) {
                throw new Error(`Upload failed: ${uploadResponse.statusText}`);
            }

            const { jobId: conversionId } = await uploadResponse.json();
            setStatusMessage(`Đang convert "${file.name}" sang XKT...`);
            setLoadingProgress(30);

            // Step 2: Poll for conversion status
            let xktUrl = '';
            let attempts = 0;
            const maxAttempts = 60; // 2 minutes max

            while (attempts < maxAttempts) {
                const statusResponse = await fetch(`${IFC_CONVERTER_API}/status/${conversionId}`);
                const statusData = await statusResponse.json();

                if (statusData.status === 'completed') {
                    xktUrl = `${IFC_CONVERTER_API}/download/${conversionId}`;
                    break;
                } else if (statusData.status === 'failed') {
                    throw new Error(statusData.error || 'Conversion failed');
                }

                // Update progress
                setLoadingProgress(30 + Math.min(attempts * 1, 50));
                await new Promise(resolve => setTimeout(resolve, 2000));
                attempts++;
            }

            if (!xktUrl) {
                throw new Error('Conversion timeout - vui lòng thử lại');
            }

            setStatusMessage(`Đang tải mô hình 3D...`);
            setLoadingProgress(85);

            // Step 3: Load XKT model
            const model = xktLoaderRef.current.load({
                id: `model-${Date.now()}`,
                src: xktUrl,
                edges: true,
            });

            model.on('loaded', () => {
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
            });

            model.on('error', (err: any) => {
                console.error('XKT load error:', err);
                setStatus('error');
                const errorMsg = err?.message || 'Lỗi không xác định khi load XKT';
                setStatusMessage(`Lỗi load model: ${errorMsg}`);
            });

        } catch (error: any) {
            console.error('Upload/conversion error:', error);
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

    // Tool button component - iPad-friendly with min 48px touch target
    const ToolBtn = ({ active, onClick, title, children, disabled, size = 'md' }: {
        active?: boolean;
        onClick?: () => void;
        title: string;
        children: React.ReactNode;
        disabled?: boolean;
        size?: 'sm' | 'md' | 'lg';
    }) => {
        const sizeClasses = {
            sm: 'w-10 h-10',
            md: 'w-12 h-12',
            lg: 'w-14 h-14'
        };
        return (
            <button
                onClick={onClick}
                title={title}
                disabled={disabled}
                className={`${sizeClasses[size]} flex items-center justify-center rounded-xl transition-all backdrop-blur-sm ${active
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/40'
                    : disabled
                        ? 'text-slate-600 cursor-not-allowed bg-slate-800/30'
                        : 'text-slate-300 bg-slate-800/60 hover:bg-slate-700/80 hover:text-white active:scale-95'
                    }`}
            >
                {children}
            </button>
        );
    };

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
                    {/* View buttons - Desktop only (tablet has floating bar) */}
                    {!isTablet && !isMobile && (
                        <div className="flex bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/50">
                            <ViewBtn view="iso" icon={Box} label="3D" />
                            <ViewBtn view="top" icon={ArrowUp} label="Top" />
                            <ViewBtn view="front" icon={Square} label="Front" />
                            <ViewBtn view="right" icon={ArrowRightIcon} label="Right" />
                        </div>
                    )}

                    {/* Upload button - Desktop only (tablet has floating bar) */}
                    {!isTablet && !isMobile && (
                        <>
                            <div className="h-5 w-px bg-slate-700" />
                            <label className={`flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white text-xs font-semibold rounded-lg cursor-pointer transition-all shadow-lg shadow-blue-500/25 ${status === 'loading' ? 'opacity-50 pointer-events-none' : ''}`}>
                                <Upload className="w-3.5 h-3.5" />
                                <span>Upload IFC</span>
                                <input
                                    type="file"
                                    accept=".ifc"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    disabled={status === 'loading'}
                                />
                            </label>
                        </>
                    )}

                    {/* Theme toggle - Always visible */}
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
                    <div className={`${isMobile || isTablet ? 'absolute left-0 top-0 bottom-0 z-30 w-72' : 'w-72'} ${isDarkMode ? 'bg-slate-900/98 border-slate-700/50' : 'bg-white/98 border-gray-200'} ${isMobile || isTablet ? 'backdrop-blur-xl shadow-2xl' : ''} border-r flex flex-col shrink-0`}>
                        {/* Header with close button */}
                        <div className="p-3 border-b border-slate-700/30 flex items-center justify-between bg-gradient-to-r from-blue-500/10 to-transparent">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                    <Layers className="w-4 h-4 text-blue-400" />
                                </div>
                                <div>
                                    <span className="text-sm font-bold text-white">Model Tree</span>
                                    {modelLoaded && (
                                        <p className="text-[10px] text-slate-500">{objectCount} objects</p>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => setShowModelTree(false)}
                                className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-white rounded-lg hover:bg-white/10 transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Tree content */}
                        <div
                            ref={treeContainerRef}
                            className="flex-1 overflow-y-auto p-2 xeokit-tree-view"
                            style={{
                                fontSize: '12px',
                                color: isDarkMode ? '#94a3b8' : '#475569',
                            }}
                        >
                            {!modelLoaded && (
                                <div className="flex flex-col items-center justify-center h-full text-slate-500 p-6">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4">
                                        <Cuboid className="w-8 h-8 text-slate-600" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-400">No model loaded</p>
                                    <p className="text-[11px] text-slate-600 mt-1 text-center">
                                        Upload an IFC file to view structure
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* LEFT TOOLBAR - Hidden on iPad, show on desktop only */}
                {!isTablet && !isMobile && (
                    <div className={`w-14 ${isDarkMode ? 'bg-slate-800/50 border-slate-700/30' : 'bg-gray-50 border-gray-200'} border-r flex flex-col items-center py-3 gap-2 shrink-0`}>
                        <ToolBtn onClick={fitToView} title="Fit to View" size="sm">
                            <Home className="w-5 h-5" />
                        </ToolBtn>
                        <ToolBtn onClick={fitToView} title="Focus" disabled={!modelLoaded} size="sm">
                            <Focus className="w-5 h-5" />
                        </ToolBtn>

                        <div className="h-px w-8 bg-slate-700/50 my-1" />

                        <ToolBtn active={sectionEnabled} onClick={toggleSection} title="Section" disabled={!modelLoaded} size="sm">
                            <Slice className="w-5 h-5" />
                        </ToolBtn>
                        <ToolBtn title="Measure" disabled={!modelLoaded} size="sm">
                            <Ruler className="w-5 h-5" />
                        </ToolBtn>

                        <div className="flex-1" />

                        <ToolBtn onClick={() => setIsDarkMode(!isDarkMode)} title="Theme" size="sm">
                            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </ToolBtn>
                    </div>
                )}

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
                    <div className="absolute top-4 left-4 text-[11px] text-slate-400 uppercase tracking-widest font-mono bg-slate-800/60 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                        {activeView.toUpperCase()} VIEW
                    </div>

                    {/* FLOATING ACTION BAR - iPad Optimized */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl">
                        {/* Navigation Group */}
                        <div className="flex items-center gap-1.5">
                            <ToolBtn onClick={fitToView} title="Fit to View" size="md">
                                <Home className="w-5 h-5" />
                            </ToolBtn>
                            <ToolBtn onClick={() => setCameraView('iso')} active={activeView === 'iso'} title="3D View" size="md">
                                <Box className="w-5 h-5" />
                            </ToolBtn>
                        </div>

                        <div className="w-px h-8 bg-slate-700" />

                        {/* Tools Group */}
                        <div className="flex items-center gap-1.5">
                            <ToolBtn active={sectionEnabled} onClick={toggleSection} title="Section Cut" disabled={!modelLoaded} size="md">
                                <Slice className="w-5 h-5" />
                            </ToolBtn>
                            <ToolBtn title="Measure" disabled={!modelLoaded} size="md">
                                <Ruler className="w-5 h-5" />
                            </ToolBtn>
                        </div>

                        <div className="w-px h-8 bg-slate-700" />

                        {/* Panels Group */}
                        <div className="flex items-center gap-1.5">
                            <ToolBtn active={showModelTree} onClick={() => setShowModelTree(!showModelTree)} title="Model Tree" size="md">
                                <Layers className="w-5 h-5" />
                            </ToolBtn>
                            <ToolBtn active={showProperties} onClick={() => setShowProperties(!showProperties)} title="Properties" size="md">
                                <Info className="w-5 h-5" />
                            </ToolBtn>
                        </div>

                        <div className="w-px h-8 bg-slate-700" />

                        {/* Upload Button - Primary Action */}
                        <label className={`w-12 h-12 flex items-center justify-center rounded-xl cursor-pointer transition-all ${status === 'loading'
                            ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                            : 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 active:scale-95'
                            }`}>
                            <Upload className="w-5 h-5" />
                            <input
                                type="file"
                                accept=".ifc"
                                className="hidden"
                                onChange={handleFileUpload}
                                disabled={status === 'loading'}
                            />
                        </label>
                    </div>

                    {/* Zoom Controls - Right Side */}
                    <div className="absolute bottom-4 right-4 flex flex-col gap-1.5">
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
                            className="w-11 h-11 flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white transition-all border border-slate-700/50 backdrop-blur-sm active:scale-95"
                        >
                            <Plus className="w-5 h-5" />
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
                            className="w-11 h-11 flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white transition-all border border-slate-700/50 backdrop-blur-sm active:scale-95"
                        >
                            <Minus className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* RIGHT SIDEBAR / BOTTOM SHEET - Properties (iPad: Bottom Sheet) */}
                {showProperties && (
                    <>
                        {/* Desktop: Right Sidebar */}
                        {!isMobile && !isTablet && (
                            <div className={`w-80 ${isDarkMode ? 'bg-slate-900/98 border-slate-700/50' : 'bg-white/98 border-gray-200'} border-l flex flex-col shrink-0`}>
                                <div className="p-3 border-b border-slate-700/30 flex items-center justify-between bg-gradient-to-r from-cyan-500/10 to-transparent">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                                            <Info className="w-4 h-4 text-cyan-400" />
                                        </div>
                                        <span className="text-sm font-bold text-white">Properties</span>
                                    </div>
                                    <button
                                        onClick={() => setShowProperties(false)}
                                        className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-white rounded-lg hover:bg-white/10 transition-all"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    {selectedElement ? (
                                        <div className="divide-y divide-slate-700/30">
                                            <div className="p-3 bg-gradient-to-r from-blue-500/10 to-transparent">
                                                <p className="text-[10px] font-bold text-blue-400 uppercase mb-1">{selectedElement.type}</p>
                                                <p className="font-bold text-white text-sm">{selectedElement.name}</p>
                                            </div>
                                            <div className="p-3">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-wide">Identity</p>
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
                                            <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4">
                                                <Target className="w-8 h-8 text-slate-600" />
                                            </div>
                                            <p className="text-sm font-medium text-slate-400">Select an element</p>
                                            <p className="text-[11px] text-slate-600 text-center">
                                                Click on a model element to view properties
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* iPad/Mobile: Bottom Sheet */}
                        {(isMobile || isTablet) && (
                            <div className="absolute bottom-0 left-0 right-0 z-30 bg-slate-900/98 backdrop-blur-xl rounded-t-3xl border-t border-slate-700/50 shadow-2xl max-h-[60%] flex flex-col">
                                {/* Drag Handle */}
                                <div className="flex justify-center py-3">
                                    <div className="w-12 h-1.5 rounded-full bg-slate-600" />
                                </div>

                                {/* Header */}
                                <div className="px-4 pb-3 flex items-center justify-between border-b border-slate-700/30">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                                            <Info className="w-5 h-5 text-cyan-400" />
                                        </div>
                                        <div>
                                            <span className="text-base font-bold text-white">Properties</span>
                                            {selectedElement && (
                                                <p className="text-xs text-slate-500">{selectedElement.type}</p>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowProperties(false)}
                                        className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-white rounded-xl hover:bg-white/10 transition-all"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="flex-1 overflow-y-auto p-4">
                                    {selectedElement ? (
                                        <div className="space-y-4">
                                            <div className="bg-blue-500/10 rounded-xl p-4">
                                                <p className="text-xs font-bold text-blue-400 uppercase mb-1">{selectedElement.type}</p>
                                                <p className="font-bold text-white text-lg">{selectedElement.name}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-slate-800/50 rounded-xl p-3">
                                                    <p className="text-[10px] text-slate-500 uppercase mb-1">ID</p>
                                                    <p className="text-xs text-slate-300 font-mono truncate">{selectedElement.id}</p>
                                                </div>
                                                <div className="bg-slate-800/50 rounded-xl p-3">
                                                    <p className="text-[10px] text-slate-500 uppercase mb-1">IFC Type</p>
                                                    <p className="text-xs text-cyan-400">{selectedElement.type}</p>
                                                </div>
                                            </div>
                                            {Object.keys(selectedElement.properties).length > 0 && (
                                                <div className="bg-slate-800/30 rounded-xl p-3">
                                                    <p className="text-xs font-bold text-slate-500 uppercase mb-3">Properties</p>
                                                    <div className="space-y-2">
                                                        {Object.entries(selectedElement.properties).slice(0, 8).map(([key, value]) => (
                                                            <div key={key} className="flex justify-between py-1">
                                                                <span className="text-sm text-slate-500">{key}</span>
                                                                <span className="text-sm text-slate-300">{String(value)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                                            <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4">
                                                <Target className="w-8 h-8 text-slate-600" />
                                            </div>
                                            <p className="text-base font-medium text-slate-400">Select an element</p>
                                            <p className="text-sm text-slate-600 mt-1">Tap on a model element</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* FOOTER STATUS BAR - Desktop only (iPad hides for max 3D space) */}
            {!isMobile && !isTablet && (
                <div className={`h-8 ${isDarkMode ? 'bg-slate-800/90 border-slate-700/50' : 'bg-white border-gray-200'} border-t flex items-center justify-between px-4 text-[11px] text-slate-500 shrink-0`}>
                    <div className="flex items-center gap-4">
                        <span>Viewer: <span className="text-cyan-400 font-medium">xeokit SDK</span></span>
                        <span className="text-slate-700">•</span>
                        <span>{modelLoaded ? `${fileName} | ${objectCount} elements` : 'No model loaded'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                        <span>LMB: Rotate</span>
                        <span>•</span>
                        <span>RMB: Pan</span>
                        <span>•</span>
                        <span>Scroll: Zoom</span>
                    </div>
                </div>
            )}
        </div>
    );
};
