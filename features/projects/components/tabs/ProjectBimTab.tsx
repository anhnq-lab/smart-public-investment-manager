import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { Upload, Loader2, Building2, AlertCircle, CheckCircle, Maximize2, Minimize2 } from 'lucide-react';
import { useTheme } from '../../../../context/ThemeContext';

// BIM hooks
import { useBimTools } from '../bim/useBimTools';
import { useBimEngine } from '../bim/useBimEngine';
import { useBimUpload } from '../bim/useBimUpload';
import { useBimSelection } from '../bim/useBimSelection';
import { useBimSection } from '../bim/useBimSection';
import { useBimMeasure } from '../bim/useBimMeasure';

// BIM components
import { BimToolbar } from '../bim/BimToolbar';
import { BimPropertiesPanel } from '../bim/BimPropertiesPanel';
import { BimModelTree } from '../bim/BimModelTree';
import { BimViewCube } from '../bim/BimViewCube';
import { BimShortcutsModal } from '../bim/BimShortcutsModal';
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

// ── Component ───────────────────────────────────────
export const ProjectBimTab: React.FC<ProjectBimTabProps> = ({ projectID }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // ── State ──────────────────────────────
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [toolbarCollapsed, setToolbarCollapsed] = useState(false);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const originalMaterialsRef = useRef(new WeakMap<THREE.Material, THREE.Material>());

    // ── Hooks ──────────────────────────────
    const tools = useBimTools();
    const engine = useBimEngine(containerRef, isDark);
    const upload = useBimUpload(
        projectID, engine.componentsRef, engine.worldRef, engine.ifcLoaderRef,
        (ifcData) => selection.buildSpatialTree(ifcData),
    );
    const selection = useBimSelection(
        engine.componentsRef, engine.worldRef, engine.ifcLoaderRef, upload.ifcDataMapRef,
        () => tools.toggleRightPanel('properties'),
    );
    const section = useBimSection(engine.worldRef, containerRef, tools.activeTool);
    const measure = useBimMeasure(engine.worldRef, containerRef, tools.activeTool);

    const hasModels = upload.disciplineModels.length > 0;
    const cursorClass = getCursorClass(tools.activeTool);

    // ── Responsive check ───────────────────
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

    // ── Measurement + Section Plane click handler ──────────
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const onClick = (e: MouseEvent) => {
            if (tools.activeTool === 'measure-length' || tools.activeTool === 'measure-area') {
                measure.handleMeasureClick(e);
            }

            // Section Plane: click on model surface to create clip plane
            if (tools.activeTool === 'section-plane') {
                const rect = container.getBoundingClientRect();
                const ndc = new THREE.Vector2(
                    ((e.clientX - rect.left) / rect.width) * 2 - 1,
                    -((e.clientY - rect.top) / rect.height) * 2 + 1,
                );
                const camera = engine.worldRef.current?.camera?.three;
                const scene = engine.worldRef.current?.scene?.three;
                if (!camera || !scene) return;

                const raycaster = new THREE.Raycaster();
                raycaster.setFromCamera(ndc, camera);

                // Collect model meshes only (skip helpers, handles, etc)
                const meshes: THREE.Mesh[] = [];
                scene.traverse((obj: THREE.Object3D) => {
                    if (obj.userData?.isSectionBox || obj.userData?.isSectionHandle || obj.userData?.isClipHelper) return;
                    if (obj.userData?.isMeasurement || obj.userData?.isGrid || obj.userData?.isViewCube) return;
                    if ((obj as any).isMesh && obj.visible) meshes.push(obj as THREE.Mesh);
                });

                const intersects = raycaster.intersectObjects(meshes, false);
                if (intersects.length > 0) {
                    const hit = intersects[0];
                    if (hit.face) {
                        // Get world-space face normal
                        const normalMatrix = new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld);
                        const worldNormal = hit.face.normal.clone().applyMatrix3(normalMatrix).normalize();
                        section.createFreeClipPlane(hit.point, worldNormal);
                        tools.activateTool('select'); // Switch back to select after placing
                    }
                }
            }
        };

        container.addEventListener('click', onClick);
        return () => container.removeEventListener('click', onClick);
    }, [tools.activeTool, measure.handleMeasureClick, engine.worldRef, section, tools]);

    // ── Render mode switching (with material caching) ──
    useEffect(() => {
        const scene = engine.worldRef.current?.scene?.three;
        if (!scene) return;
        const cache = originalMaterialsRef.current;

        scene.traverse((obj: any) => {
            if (!obj.isMesh || !obj.material) return;

            // Cache original material on first use
            if (!cache.has(obj.material) && tools.renderMode !== 'shading') {
                cache.set(obj.material, obj.material);
            }

            if (tools.renderMode === 'shading') {
                // Restore original
                const original = cache.get(obj.material);
                if (original && original !== obj.material) {
                    obj.material.dispose();
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
            if (obj.material !== orig) obj.material.dispose();
            obj.material = cloned;
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
        const handleChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
            // Force renderer resize after fullscreen toggle
            setTimeout(() => {
                const renderer = (engine.worldRef.current?.renderer as any)?.three;
                const camera = engine.worldRef.current?.camera?.three;
                const container = containerRef.current;
                if (renderer && container) {
                    const w = container.clientWidth;
                    const h = container.clientHeight;
                    renderer.setSize(w, h);
                    if (camera && 'aspect' in camera) {
                        (camera as THREE.PerspectiveCamera).aspect = w / h;
                        (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
                    }
                }
            }, 100);
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

    // ── Section tool handlers for toolbar ──
    const handleSectionAction = useCallback((action: string) => {
        switch (action) {
            case 'clip-x': tools.activateTool('clip-x'); break;
            case 'clip-y': tools.activateTool('clip-y'); break;
            case 'clip-z': tools.activateTool('clip-z'); break;
            case 'section-box': tools.activateTool('section-box'); break;
            case 'section-plane': tools.activateTool('section-plane'); break;
            case 'clear':
                section.clearAllClipPlanes();
                tools.activateTool('select');
                break;
        }
    }, [tools, section]);

    const handleMeasureAction = useCallback((action: string) => {
        switch (action) {
            case 'length': tools.activateTool('measure-length'); break;
            case 'area': tools.activateTool('measure-area'); break;
            case 'clear':
                measure.clearAllMeasurements();
                tools.activateTool('select');
                break;
        }
    }, [tools, measure]);

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
    return (
        <div
            ref={wrapperRef}
            className={`relative w-full overflow-hidden ${cursorClass} ${isFullscreen ? '' : 'h-full'} ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}
            style={isFullscreen ? { width: '100vw', height: '100vh' } : undefined}
        >
            {/* Active tool indicator bar */}
            {activeToolLabel && (
                <div className={`
                    absolute top-2 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 rounded-full
                    flex items-center gap-2 text-xs font-medium
                    backdrop-blur-md shadow-lg border
                    ${isDark ? 'bg-blue-900/60 text-blue-300 border-blue-700/50' : 'bg-blue-50/90 text-blue-700 border-blue-200'}
                `}>
                    <span>{activeToolLabel}</span>
                    <button
                        onClick={() => tools.activateTool('select')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors
                            ${isDark ? 'bg-slate-700/80 hover:bg-slate-600 text-slate-300' : 'bg-white hover:bg-gray-100 text-gray-600'}
                        `}
                    >
                        ESC
                    </button>
                </div>
            )}

            {/* Status bar */}
            {upload.status !== 'idle' && !activeToolLabel && (
                <div className={`
                    absolute top-2 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-xl flex items-center gap-2
                    shadow-lg backdrop-blur-md text-xs font-medium
                    ${isDark ? 'bg-slate-800/90 text-slate-300 border border-slate-700' : 'bg-white/90 text-gray-700 border border-gray-200'}
                `}>
                    <StatusIcon />
                    <span>{upload.statusMessage}</span>
                    {(upload.status === 'loading' || upload.status === 'converting') && (
                        <div className={`w-20 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${upload.loadingProgress}%` }} />
                        </div>
                    )}
                </div>
            )}

            {/* Left Panel — Model Tree */}
            {tools.leftPanel === 'tree' && !isMobile && (
                <div className={`
                    absolute left-2 top-2 bottom-10 z-20
                    ${isTablet ? 'w-64' : 'w-72'}
                `}>
                    <BimModelTree
                        spatialTree={selection.spatialTree}
                        typeGroups={selection.typeGroups}
                        disciplineModels={upload.disciplineModels}
                        isDarkMode={isDark}
                        viewerReady={engine.viewerReady}
                        onSelectElement={selection.handleSelectElementFromTree}
                        onToggleVisibility={upload.toggleDisciplineVisibility}
                        onToggleTypeVisibility={selection.toggleTypeVisibility}
                        onUpload={upload.handleFileUpload}
                        onDeleteModel={upload.handleDeleteModel}
                        onClose={() => tools.toggleLeftPanel('none')}
                    />
                </div>
            )}

            {/* 3D Viewer */}
            <div ref={containerRef} className="absolute inset-0 z-0" />

            {/* ViewCube */}
            {engine.viewerReady && !isMobile && (
                <BimViewCube
                    cameraRotation={engine.cameraRotation}
                    isDarkMode={isDark}
                    onSetView={engine.setView}
                />
            )}

            {/* Fullscreen toggle button */}
            {engine.viewerReady && (
                <button
                    onClick={toggleFullscreen}
                    title={isFullscreen ? 'Thoát toàn màn hình (F11)' : 'Xem toàn màn hình (F11)'}
                    className={`
                        absolute top-2 right-2 z-30 w-9 h-9 flex items-center justify-center rounded-xl
                        backdrop-blur-md shadow-lg border transition-all duration-200
                        ${tools.rightPanel === 'properties' && !isMobile ? 'right-[21rem]' : 'right-2'}
                        ${isFullscreen
                            ? 'bg-blue-500/20 text-blue-400 border-blue-500/50 hover:bg-blue-500/30'
                            : isDark
                                ? 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-700/80 hover:text-white'
                                : 'bg-white/80 text-gray-500 border-gray-200 hover:bg-gray-100 hover:text-gray-800'
                        }
                    `}
                >
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
            )}

            {/* Toolbar */}
            {engine.viewerReady && (
                <BimToolbar
                    tools={tools}
                    viewerReady={engine.viewerReady}
                    hasModels={hasModels}
                    onSetView={engine.setView}
                    onFitAll={engine.fitAll}
                    onScreenshot={engine.takeScreenshot}
                    onIsolateSelected={selection.handleIsolateSelected}
                    onHideSelected={selection.handleHideSelected}
                    onShowAll={selection.handleShowAll}
                    isMobile={isMobile}
                    clipPlaneCount={section.clipPlaneCount}
                    measurementCount={measure.measurementCount}
                    onSectionAction={handleSectionAction}
                    onMeasureAction={handleMeasureAction}
                    onUpload={upload.handleFileUpload}
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

            {/* Section Box Controls Panel */}
            {section.sectionBoxActive && !isMobile && (
                <BimSectionPanel
                    sectionBoxBounds={section.sectionBoxBounds}
                    onUpdatePlane={section.updateSectionPlane}
                    onReset={section.resetSectionBox}
                    onRemove={() => {
                        section.removeSectionBox();
                        tools.activateTool('select');
                    }}
                    onClose={() => {
                        section.removeSectionBox();
                        tools.activateTool('select');
                    }}
                />
            )}

            {/* Right Panel — Properties */}
            {tools.rightPanel === 'properties' && !isMobile && (
                <div className={`
                    absolute right-2 top-2 bottom-10 z-20
                    ${isTablet ? 'w-72' : 'w-80'}
                `}>
                    <BimPropertiesPanel
                        selectedElement={selection.selectedElement}
                        isDarkMode={isDark}
                        isMobile={isMobile}
                        onClose={() => tools.toggleRightPanel('none')}
                        onHighlightElement={(id) => selection.handleSelectElementFromTree(Number(id))}
                    />
                </div>
            )}

            {/* Empty state */}
            {engine.viewerReady && !hasModels && upload.status === 'idle' && (
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                    <div className={`
                        text-center p-8 rounded-2xl pointer-events-auto
                        ${isDark ? 'bg-slate-800/80' : 'bg-white/80'} backdrop-blur-md
                        border ${isDark ? 'border-slate-700' : 'border-gray-200'}
                    `}>
                        <Building2 className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-slate-500' : 'text-gray-300'}`} />
                        <h3 className={`text-sm font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                            Chưa có mô hình BIM
                        </h3>
                        <p className={`text-xs mb-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                            Upload file IFC để bắt đầu
                        </p>
                        <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg cursor-pointer text-xs transition-colors">
                            <Upload className="w-4 h-4" />
                            Upload IFC
                            <input
                                type="file"
                                accept=".ifc"
                                className="hidden"
                                onChange={upload.handleFileUpload}
                            />
                        </label>
                    </div>
                </div>
            )}

            {/* Loading skeleton */}
            {!engine.viewerReady && !engine.initError && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="text-center">
                        <Loader2 className={`w-10 h-10 mx-auto mb-3 animate-spin ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
                        <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                            Đang khởi tạo BIM Engine...
                        </p>
                    </div>
                </div>
            )}

            {/* Init error */}
            {engine.initError && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="text-center p-8 rounded-2xl bg-red-500/10 border border-red-500/30">
                        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
                        <p className="text-sm text-red-300">{engine.initError}</p>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className={`
                absolute bottom-0 left-0 right-0 z-20 h-8 flex items-center justify-between px-3
                text-[10px] border-t
                ${isDark ? 'bg-slate-900/90 text-slate-500 border-slate-800' : 'bg-white/90 text-gray-400 border-gray-200'}
            `}>
                <div className="flex items-center gap-3">
                    <span>🏗️ That Open Engine v3</span>
                    {section.clipPlaneCount > 0 && (
                        <span className="text-cyan-400">✂ {section.clipPlaneCount} clips</span>
                    )}
                    {measure.measurementCount > 0 && (
                        <span className="text-cyan-400">📐 {measure.measurementCount} measures</span>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    {hasModels && (
                        <span>📦 {upload.disciplineModels.length} models</span>
                    )}
                    <button
                        onClick={toggleFullscreen}
                        className={`flex items-center gap-1 transition-colors ${isDark ? 'hover:text-slate-300' : 'hover:text-gray-600'}`}
                    >
                        {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                        <span>{isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}</span>
                    </button>
                    <span className="opacity-50">Press <kbd className="bg-gray-600 px-1 rounded">?</kbd> for shortcuts</span>
                </div>
            </div>
        </div>
    );
};
