import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import * as OBC from '@thatopen/components';
import { Upload, Loader2, Building2, AlertCircle, CheckCircle, Maximize2, Minimize2, Info, LocateFixed, EyeOff, Focus, FileUp } from 'lucide-react';
import { useTheme } from '../../../../context/ThemeContext';

// BIM hooks and context
import { BimProvider, useBimContext } from '../bim/context/BimContext';

// BIM components
import { BimToolbar } from '../bim/BimToolbar';
import { BimPropertiesPanel } from '../bim/BimPropertiesPanel';
import { BimModelTree } from '../bim/BimModelTree';
import { BimViewCube } from '../bim/BimViewCube';
import { BimShortcutsModal } from '../bim/BimShortcutsModal';
import { FacilityManagementPanel } from '../bim/FacilityManagementPanel';
import { BimSectionPanel } from '../bim/BimSectionPanel';

// ── Types ───────────────────────────────────────────
interface ProjectBimTabProps {
    projectID: string;
}

// ── Cursor class for active tool ────────────────────
function getCursorClass(activeTool: string | null): string {
    if (!activeTool) return '';
    if (activeTool.startsWith('clip') || activeTool === 'section-box') return 'cursor-crosshair';
    if (activeTool.startsWith('measure')) return 'cursor-crosshair';
    if (activeTool === 'select') return 'cursor-default';
    return '';
}



// ── Inner Component ───────────────────────────────────────
const ProjectBimTabContent: React.FC = () => {
    const {
        projectID,
        isDarkMode: isDark,
        isMobile,
        containerRef,
        tools,
        engine,
        upload,
        selection,
        section,
        measure,
        opRefreshTrigger,
        handleExtractFromBIM,
        contextMenu,
        setContextMenu
    } = useBimContext();

    // ── State ──────────────────────────────
    const [isTablet, setIsTablet] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [toolbarCollapsed, setToolbarCollapsed] = useState(false);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [bottomTab, setBottomTab] = useState<'properties' | 'operations'>('properties');
    const [isDraggingFile, setIsDraggingFile] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const contextMenuRef = useRef<HTMLDivElement>(null);
    const originalMaterialsRef = useRef(new WeakMap<THREE.Material, THREE.Material>());

    // Debug mount/unmount
    useEffect(() => {
        console.log('[BimTab] ✅ MOUNTED ProjectBimTabContent');
        return () => console.log('[BimTab] ❌ UNMOUNTED ProjectBimTabContent');
    }, []);

    const hasModels = upload.disciplineModels.length > 0;



    const cursorClass = getCursorClass(tools.activeTool);


    // ── Responsive check ───────────────────
    useEffect(() => {
        const check = () => {
            const w = window.innerWidth;
            setIsTablet(w >= 768 && w < 1024);
            if (w < 1024) {
                tools.toggleRightPanel('none');
                tools.toggleLeftPanel('none');
            }
        };
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, [tools]);

    // ── Load existing models + fit camera ──
    useEffect(() => {
        if (engine.viewerReady && !modelsLoaded) {
            setModelsLoaded(true);
            (async () => {
                await upload.loadExistingModels();
                // Fit camera after models are loaded
                setTimeout(() => engine.fitAll(), 500);
            })();
        }
    }, [engine.viewerReady, modelsLoaded]);

    // ── Auto-open model tree when models exist ──
    useEffect(() => {
        if (hasModels && !isMobile && tools.leftPanel === 'none') {
            tools.toggleLeftPanel('tree');
        }
    }, [hasModels]);

    // ── Setup highlighter events ───────────
    useEffect(() => {
        if (engine.viewerReady) {
            const cleanup = selection.setupHighlighterEvents();
            return cleanup;
        }
    }, [engine.viewerReady]);

    // ── Double-click: Measure + Section Plane ──────────
    // Measure uses OBC LengthMeasurement.create() per OBC docs
    // Section Plane uses OBC Clipper
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const onDblClick = async (e: MouseEvent) => {
            // Measure tools: dblclick → create()
            if (tools.activeTool === 'measure-length' || tools.activeTool === 'measure-area') {
                e.preventDefault();
                e.stopPropagation();
                measure.handleMeasureClick(e);
                return;
            }

            // Section Plane
            if (tools.activeTool === 'section-plane') {
                const components = engine.componentsRef.current;
                const world = engine.worldRef.current;
                if (!components || !world) return;
                try {
                    const clipper = components.get(OBC.Clipper);
                    const plane = await clipper.create(world);
                    if (plane) tools.activateTool('select');
                } catch (err) {
                    console.warn('Section plane creation error:', err);
                }
            }
        };

        // Delete/Backspace → delete last measurement
        const onKeyDown = (e: KeyboardEvent) => {
            if ((e.code === 'Delete' || e.code === 'Backspace') &&
                (tools.activeTool === 'measure-length' || tools.activeTool === 'measure-area')) {
                // OBC will delete measurement under cursor
            }
        };

        container.addEventListener('dblclick', onDblClick);
        window.addEventListener('keydown', onKeyDown);
        return () => {
            container.removeEventListener('dblclick', onDblClick);
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [tools.activeTool, measure.handleMeasureClick, engine.worldRef, engine.componentsRef, tools]);

    // ── Render mode switching (with material caching) ──
    useEffect(() => {
        const scene = engine.worldRef.current?.scene?.three;
        if (!scene) return;
        const cache = originalMaterialsRef.current;

        scene.traverse((obj: any) => {
            if (!obj.isMesh || !obj.material) return;

            // Skip non-standard materials (LOD materials, custom shaders without clone)
            if (typeof obj.material.clone !== 'function') return;

            // Cache original material on first use
            if (!cache.has(obj.material) && tools.renderMode !== 'shading') {
                cache.set(obj.material, obj.material);
            }

            if (tools.renderMode === 'shading') {
                // Restore original
                const original = cache.get(obj.material);
                if (original && original !== obj.material) {
                    try { obj.material.dispose(); } catch { }
                    obj.material = original;
                } else {
                    obj.material.wireframe = false;
                    obj.material.opacity = 1;
                    obj.material.transparent = false;
                    obj.material.depthWrite = true;
                }
                return;
            }

            // Clone only if not already cloned for this mode
            const orig = cache.get(obj.material) || obj.material;
            if (!cache.has(orig)) cache.set(orig, orig);

            try {
                const cloned = orig.clone();
                switch (tools.renderMode) {
                    case 'wireframe':
                        cloned.wireframe = true;
                        cloned.opacity = 1;
                        cloned.transparent = false;
                        break;
                    case 'xray':
                        cloned.wireframe = false;
                        cloned.opacity = 0.15;
                        cloned.transparent = true;
                        cloned.depthWrite = false;
                        break;
                    case 'ghosting':
                        cloned.wireframe = false;
                        cloned.opacity = 0.35;
                        cloned.transparent = true;
                        cloned.depthWrite = false;
                        break;
                }
                // Dispose previous clone if it's not the original
                if (obj.material !== orig) {
                    try { obj.material.dispose(); } catch { }
                }
                obj.material = cloned;
            } catch (err) {
                // Fallback: apply properties directly without cloning
                console.warn('[RenderMode] Cannot clone material, applying in-place:', err);
                switch (tools.renderMode) {
                    case 'wireframe':
                        obj.material.wireframe = true;
                        break;
                    case 'xray':
                        obj.material.opacity = 0.15;
                        obj.material.transparent = true;
                        obj.material.depthWrite = false;
                        break;
                    case 'ghosting':
                        obj.material.opacity = 0.35;
                        obj.material.transparent = true;
                        obj.material.depthWrite = false;
                        break;
                }
            }
        });
    }, [tools.renderMode, engine.viewerReady]);

    // ── Fullscreen toggle ──────────────────
    const toggleFullscreen = useCallback(async () => {
        try {
            if (!document.fullscreenElement) {
                await wrapperRef.current?.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch { /* user denied or not supported */ }
    }, []);

    useEffect(() => {
        const forceResize = () => {
            const container = containerRef.current;
            if (!container) return;
            const w = container.clientWidth;
            const h = container.clientHeight;
            if (w === 0 || h === 0) return;

            const rendererObj = engine.worldRef.current?.renderer as any;
            const threeRenderer = rendererObj?.three;
            const camera = engine.worldRef.current?.camera?.three;

            // Resize Three.js renderer
            if (threeRenderer) threeRenderer.setSize(w, h);

            // Directly resize canvas elements
            container.querySelectorAll('canvas').forEach((c: HTMLCanvasElement) => {
                c.width = w * (window.devicePixelRatio || 1);
                c.height = h * (window.devicePixelRatio || 1);
                c.style.width = '100%';
                c.style.height = '100%';
            });

            // Update camera
            if (camera && 'aspect' in camera) {
                (camera as THREE.PerspectiveCamera).aspect = w / h;
                (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
            }

            // Try OBC resize
            if (rendererObj?.resize) rendererObj.resize();
        };

        const handleChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
            // Multiple attempts to handle browser transition timing
            setTimeout(forceResize, 50);
            setTimeout(forceResize, 200);
            setTimeout(forceResize, 500);
            // Also dispatch window resize for any OBC internal listeners
            setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
        };
        document.addEventListener('fullscreenchange', handleChange);
        return () => document.removeEventListener('fullscreenchange', handleChange);
    }, [engine.worldRef]);

    // ── Keyboard shortcuts ─────────────────
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            // F11 for fullscreen
            if (e.key === 'F11') {
                e.preventDefault();
                toggleFullscreen();
                return;
            }

            switch (e.key) {
                case '0': engine.setView('iso'); break;
                case '1': engine.setView('front'); break;
                case '2': engine.setView('back'); break;
                case '3': engine.setView('left'); break;
                case '4': engine.setView('right'); break;
                case '5': engine.setView('top'); break;
                case '6': engine.setView('bottom'); break;
                case 'f': case 'F': engine.fitAll(); break;
                case 'v': case 'V': tools.activateTool('select'); break;
                case 'i': case 'I': selection.handleIsolateSelected(); break;
                case 'h':
                    if (e.shiftKey) selection.handleShowAll();
                    else selection.handleHideSelected();
                    break;
                case 'H':
                    if (e.shiftKey) selection.handleShowAll();
                    else selection.handleHideSelected();
                    break;
                case 'Escape':
                    tools.activateTool('select');
                    selection.clearSelection();
                    setShowShortcuts(false);
                    break;
                case 'Delete':
                    section.clearAllClipPlanes();
                    measure.clearAllMeasurements();
                    break;
                case '?':
                    setShowShortcuts(prev => !prev);
                    break;
                case 't': case 'T':
                    setToolbarCollapsed(prev => !prev);
                    break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [engine, tools, selection, section, measure, toggleFullscreen]);


    // ── Click-outside to close context menu ──────
    useEffect(() => {
        if (!contextMenu.visible) return;
        const handler = (e: MouseEvent) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
                setContextMenu(prev => ({ ...prev, visible: false }));
            }
        };
        const escHandler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setContextMenu(prev => ({ ...prev, visible: false }));
        };
        document.addEventListener('mousedown', handler);
        document.addEventListener('keydown', escHandler);
        return () => {
            document.removeEventListener('mousedown', handler);
            document.removeEventListener('keydown', escHandler);
        };
    }, [contextMenu.visible, setContextMenu]);

    // ── Context Menu ──────────────────────────────
    const handleContextMenu = useCallback(async (e: React.MouseEvent) => {
        e.preventDefault();
        setContextMenu(prev => ({ ...prev, visible: false }));

        if (!engine.worldRef.current || !engine.componentsRef.current) return;

        const raycasters = engine.componentsRef.current.get(OBC.Raycasters);
        const raycaster = raycasters.get(engine.worldRef.current);
        const result = await raycaster.castRay();

        if (result && result.object && 'fragment' in result.object) {
            const fragment = (result.object as any).fragment;
            const modelId = fragment.model.uuid;
            const expressId = fragment.getItemID(result.faceIndex ?? result.instanceId);

            if (expressId !== null && expressId !== undefined) {
                selection.handleSelectElementFromTree(expressId);
                // Clamp menu position to viewport
                const menuW = 200, menuH = 180;
                const x = Math.min(e.clientX, window.innerWidth - menuW);
                const y = Math.min(e.clientY, window.innerHeight - menuH);
                setContextMenu({ visible: true, x, y, modelId, expressId });
            }
        }
    }, [engine, selection, setContextMenu]);

    // ── Drag & Drop Upload ───────────────────────
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.types.includes('Files')) setIsDraggingFile(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingFile(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingFile(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.name.toLowerCase().endsWith('.ifc')) {
            // Create a synthetic event for the upload handler
            const dt = new DataTransfer();
            dt.items.add(file);
            const input = document.createElement('input');
            input.type = 'file';
            input.files = dt.files;
            const syntheticEvent = { target: input } as any;
            upload.handleFileUpload(syntheticEvent);
        }
    }, [upload]);


    // ── Status icon ────────────────────────
    const StatusIcon = () => {
        switch (upload.status) {
            case 'loading': case 'initializing': case 'converting':
                return <Loader2 className="w-4 h-4 animate-spin text-blue-400" />;
            case 'success':
                return <CheckCircle className="w-4 h-4 text-green-400" />;
            case 'error':
                return <AlertCircle className="w-4 h-4 text-red-400" />;
            default: return null;
        }
    };

    // ── Active tool indicator ──────────────
    const activeToolLabel = useMemo(() => {
        switch (tools.activeTool) {
            case 'clip-x': return '✂ Clip X';
            case 'clip-y': return '✂ Clip Y';
            case 'clip-z': return '✂ Clip Z';
            case 'section-box': return '📦 Section Box';
            case 'section-plane': return '✂ Section Plane — Click bề mặt mô hình';
            case 'measure-length': return '📏 Measure Length — Click to add points';
            case 'measure-area': return '📐 Measure Area — Click to add points';
            default: return null;
        }
    }, [tools.activeTool]);

    // ── RENDER ──────────────────────────────
    const showLeftPanel = hasModels && !isMobile && tools.leftPanel === 'tree';
    const showBottomPanel = engine.viewerReady && hasModels;

    return (
        <div
            ref={wrapperRef}
            className={`w-full overflow-hidden ${isFullscreen ? '' : 'h-full'} ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}
            style={{
                ...(isFullscreen ? { width: '100vw', height: '100vh', position: 'fixed' as const, top: 0, left: 0, zIndex: 9999 } : {}),
                display: 'grid',
                gridTemplateColumns: showLeftPanel ? '280px 1fr' : '1fr',
                gridTemplateRows: showBottomPanel ? '1fr 240px' : '1fr',
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* ─── LEFT SIDEBAR ─── */}
            {showLeftPanel && (
                <div
                    className={`flex flex-col border-r overflow-hidden ${isDark ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'}`}
                    style={{ gridRow: '1 / -1' }}
                >
                    {/* Top: Model Tree */}
                    <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                        <BimModelTree />
                    </div>
                    {/* Divider */}
                    <div className={`h-px shrink-0 ${isDark ? 'bg-slate-800' : 'bg-gray-200'}`} />
                    {/* Bottom: Properties */}
                    <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                        <BimPropertiesPanel isBottomPanel={false} />
                    </div>
                </div>
            )}

            {/* ─── MAIN 3D CANVAS ─── */}
            <div className={`relative flex flex-col min-h-0 min-w-0 ${cursorClass}`}>
                {/* Active tool indicator */}
                {activeToolLabel && (
                    <div className={`
                        absolute top-3 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 rounded-full
                        flex items-center gap-2 text-xs font-medium
                        backdrop-blur-xl shadow-lg border
                        ${isDark ? 'bg-slate-900/80 text-blue-300 border-slate-700/60' : 'bg-white/90 text-blue-700 border-blue-200'}
                    `}>
                        <span>{activeToolLabel}</span>
                        <button
                            onClick={() => tools.activateTool('select')}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer
                                ${isDark ? 'bg-slate-700/80 hover:bg-slate-600 text-slate-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}
                            `}
                        >
                            ESC
                        </button>
                    </div>
                )}

                {/* Status bar */}
                {upload.status !== 'idle' && !activeToolLabel && (
                    <div className={`
                        absolute top-3 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-xl flex items-center gap-2
                        shadow-lg backdrop-blur-xl text-xs font-medium
                        ${isDark ? 'bg-slate-900/90 text-slate-300 border border-slate-700/60' : 'bg-white/95 text-gray-700 border border-gray-200'}
                    `}>
                        <StatusIcon />
                        <span>{upload.statusMessage}</span>
                        {(upload.status === 'loading' || upload.status === 'converting') && (
                            <div className={`w-20 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                                <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${upload.loadingProgress}%` }} />
                            </div>
                        )}
                    </div>
                )}

                {/* Mobile: Model Tree */}
                {tools.leftPanel === 'tree' && isMobile && (
                    <BimModelTree />
                )}

                {/* Mobile: Properties */}
                {tools.rightPanel === 'properties' && isMobile && hasModels && (
                    <BimPropertiesPanel isBottomPanel={false} />
                )}

                {/* 3D Canvas */}
                <div
                    ref={containerRef}
                    className="w-full h-full absolute inset-0 outline-none z-0"
                    tabIndex={0}
                    style={{ isolation: 'isolate', touchAction: 'none' }}
                    onContextMenu={handleContextMenu}
                />

                {/* Drag & Drop overlay */}
                {isDraggingFile && (
                    <div className="absolute inset-0 z-40 flex items-center justify-center backdrop-blur-sm border-2 border-dashed border-blue-400/60 rounded-lg bg-blue-500/5">
                        <div className="text-center">
                            <FileUp className="w-12 h-12 mx-auto mb-2 text-blue-400 animate-bounce" />
                            <p className="text-sm font-medium text-blue-400">Thả file IFC vào đây</p>
                        </div>
                    </div>
                )}

                {/* ViewCube */}
                {engine.viewerReady && !isMobile && (
                    <BimViewCube />
                )}

                {/* Fullscreen toggle */}
                {engine.viewerReady && (
                    <button
                        onClick={toggleFullscreen}
                        title={isFullscreen ? 'Thoát toàn màn hình (F11)' : 'Toàn màn hình (F11)'}
                        className={`
                            absolute top-3 right-3 z-30 p-2 rounded-lg backdrop-blur-xl shadow-lg border
                            hidden md:flex items-center justify-center transition-colors cursor-pointer
                            ${isFullscreen
                                ? 'bg-blue-500/20 text-blue-400 border-blue-500/40 hover:bg-blue-500/30'
                                : isDark
                                    ? 'bg-slate-900/80 text-slate-400 border-slate-700/60 hover:bg-slate-800 hover:text-white'
                                    : 'bg-white/90 text-gray-500 border-gray-200 hover:bg-gray-100 hover:text-gray-800'
                            }
                        `}
                    >
                        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                )}

                {/* Toolbar */}
                {engine.viewerReady && (
                    <BimToolbar
                        isCollapsed={toolbarCollapsed}
                        onToggleCollapse={() => setToolbarCollapsed(prev => !prev)}
                    />
                )}

                {/* Shortcuts Modal */}
                <BimShortcutsModal
                    isOpen={showShortcuts}
                    onClose={() => setShowShortcuts(false)}
                    isDarkMode={isDark}
                />

                {/* Section Box Controls */}
                {section.sectionBoxActive && !isMobile && (
                    <BimSectionPanel
                        sectionBoxBounds={section.sectionBoxBounds}
                        onUpdatePlane={section.updateSectionPlane}
                        onReset={section.resetSectionBox}
                        onRemove={() => { section.removeSectionBox(); tools.activateTool('select'); }}
                        onClose={() => { section.removeSectionBox(); tools.activateTool('select'); }}
                    />
                )}

                {/* Empty state */}
                {engine.viewerReady && !hasModels && upload.status === 'idle' && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                        <div className={`
                            text-center p-10 rounded-2xl pointer-events-auto max-w-sm
                            ${isDark ? 'bg-slate-900/95' : 'bg-white/95'} backdrop-blur-xl
                            border ${isDark ? 'border-slate-800' : 'border-gray-200'}
                            shadow-2xl
                        `}>
                            <div className={`w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center
                                ${isDark ? 'bg-emerald-500/10' : 'bg-blue-50'}
                            `}>
                                <Building2 className={`w-8 h-8 ${isDark ? 'text-emerald-400' : 'text-blue-500'}`} />
                            </div>
                            <h3 className={`text-base font-bold mb-2 ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                                Chưa có mô hình BIM
                            </h3>
                            <p className={`text-xs mb-5 leading-relaxed ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                Upload hoặc kéo thả file IFC để bắt đầu xem mô hình 3D
                            </p>
                            <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl cursor-pointer text-sm font-medium transition-all hover:shadow-lg hover:shadow-emerald-500/25">
                                <Upload className="w-4 h-4" />
                                Upload IFC
                                <input
                                    type="file"
                                    accept=".ifc"
                                    className="hidden"
                                    onChange={upload.handleFileUpload}
                                />
                            </label>
                            <p className={`text-[10px] mt-3 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                                Hoặc kéo thả file .ifc vào đây
                            </p>
                        </div>
                    </div>
                )}

                {/* Loading skeleton */}
                {!engine.viewerReady && !engine.initError && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                        <div className="text-center">
                            <Loader2 className={`w-10 h-10 mx-auto mb-3 animate-spin ${isDark ? 'text-emerald-400' : 'text-blue-500'}`} />
                            <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                Đang khởi tạo BIM Engine...
                            </p>
                        </div>
                    </div>
                )}

                {/* Init error */}
                {engine.initError && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                        <div className={`text-center p-8 rounded-2xl ${isDark ? 'bg-red-500/10 border border-red-500/30' : 'bg-red-50 border border-red-200'}`}>
                            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
                            <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-600'}`}>{engine.initError}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* ─── BOTTOM PANEL: Operations Management ─── */}
            {showBottomPanel && (
                <div
                    className={`flex flex-col overflow-hidden border-t z-20
                        ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}
                    `}
                    style={{ gridColumn: showLeftPanel ? '2' : '1' }}
                >
                    {/* Panel header */}
                    <div className={`
                        flex items-center justify-between px-3 shrink-0 h-8
                        text-[11px] font-medium border-b
                        ${isDark ? 'text-slate-400 border-slate-800/80 bg-slate-900' : 'text-gray-500 border-gray-100 bg-gray-50/80'}
                    `}>
                        <div className="flex items-center gap-2">
                            <span className={`
                                flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold
                                ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-50 text-blue-600'}
                            `}>
                                <Building2 className="w-3 h-3" />
                                Quản lý vận hành
                            </span>
                            <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                                {upload.disciplineModels.length} models
                            </span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-auto">
                        <FacilityManagementPanel />
                    </div>
                </div>
            )}

            {/* Footer when no models */}
            {(!engine.viewerReady || !hasModels) && (
                <div className={`
                    absolute bottom-0 w-full h-7 border-t flex items-center px-4 z-10
                    ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}
                `}>
                    <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                        Kéo thả file IFC hoặc bấm Upload để bắt đầu
                    </span>
                </div>
            )}

            {/* Context Menu */}
            {contextMenu.visible && (
                <div
                    ref={contextMenuRef}
                    className={`fixed z-[99999] w-44 py-1 rounded-lg shadow-2xl border backdrop-blur-xl
                        ${isDark ? 'bg-slate-900/98 border-slate-700/80 text-slate-200' : 'bg-white/98 border-gray-200 text-gray-800'}
                    `}
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center gap-2 cursor-pointer
                            ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}
                        `}
                        onClick={() => {
                            if (contextMenu.expressId !== null) {
                                selection.handleSelectElementFromTree(contextMenu.expressId);
                                tools.toggleRightPanel('properties');
                            }
                            setContextMenu(prev => ({ ...prev, visible: false }));
                        }}
                    >
                        <Info className="w-3.5 h-3.5 text-blue-400" />
                        <span>Xem thuộc tính</span>
                    </button>
                    <button
                        className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center gap-2 cursor-pointer
                            ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}
                        `}
                        onClick={() => {
                            if (contextMenu.expressId !== null) engine.zoomToExpressId(contextMenu.expressId);
                            setContextMenu(prev => ({ ...prev, visible: false }));
                        }}
                    >
                        <LocateFixed className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Phóng to đối tượng</span>
                    </button>
                    <div className={`my-0.5 h-px ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`} />
                    <button
                        className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center gap-2 cursor-pointer
                            ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}
                        `}
                        onClick={() => {
                            selection.handleHideSelected();
                            setContextMenu(prev => ({ ...prev, visible: false }));
                        }}
                    >
                        <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                        <span>Ẩn đối tượng</span>
                    </button>
                    <button
                        className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center gap-2 cursor-pointer
                            ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}
                        `}
                        onClick={() => {
                            selection.handleIsolateSelected();
                            setContextMenu(prev => ({ ...prev, visible: false }));
                        }}
                    >
                        <Focus className="w-3.5 h-3.5 text-purple-400" />
                        <span>Cô lập đối tượng</span>
                    </button>
                </div>
            )}
        </div>
    );
};

// ── Wrapper Component ───────────────────────────────────────
export const ProjectBimTab: React.FC<ProjectBimTabProps> = ({ projectID }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [isMobile, setIsMobile] = useState(
        typeof window !== 'undefined' ? window.innerWidth < 768 : false
    );

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        <BimProvider
            projectID={projectID}
            isDarkMode={isDark}
            isMobile={isMobile}
            key="bim-provider-persist"
        >
            <ProjectBimTabContent />
        </BimProvider>
    );
};
