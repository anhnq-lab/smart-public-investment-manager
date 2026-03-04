/**
 * BimToolbar — Professional floating toolbar for BIM Viewer
 * Grouped tools: Navigate, Section, Measure, Display, Actions
 * Fixed: dropdown close-on-outside, proper cursor, clear active states
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    MousePointer2, Move3D, Maximize, Scissors, Ruler, Eye,
    Camera, MoreHorizontal, Box, ArrowUp, Square as SquareIcon,
    ArrowRight, Grid3X3, Axis3D, Sun, Moon, RotateCcw,
    EyeOff, Focus, Download, Trash2, CircleDot, PenTool,
    Layers, TreePine, PanelLeft, PanelRight, ChevronDown, ChevronUp,
    Slice, ScanLine, BoxSelect, Pipette, Waypoints, FileUp, Crosshair, GripVertical,
    Activity, ShieldAlert, Zap
} from 'lucide-react';
import { useBimContext } from './context/BimContext';

interface BimToolbarProps {
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
}

// ── Tool Button with Rich Tooltip ───────────────────
const ToolBtn: React.FC<{
    active?: boolean;
    onClick?: () => void;
    title: string;
    shortcut?: string;
    children: React.ReactNode;
    disabled?: boolean;
    isDark: boolean;
    danger?: boolean;
    badge?: number;
}> = ({ active, onClick, title, shortcut, children, disabled, isDark, danger, badge }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleEnter = () => {
        timerRef.current = setTimeout(() => setShowTooltip(true), 350);
    };
    const handleLeave = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setShowTooltip(false);
    };

    return (
        <div className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
            <button
                onClick={onClick}
                disabled={disabled}
                className={`
                    relative w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200 ease-out
                    ${active
                        ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/15 text-blue-400 ring-1 ring-blue-400/50 shadow-[0_0_14px_rgba(59,130,246,0.25)] hover:shadow-[0_0_20px_rgba(59,130,246,0.35)] dark:from-cyan-500/20 dark:to-blue-500/15 dark:text-cyan-400 dark:ring-cyan-400/50 dark:shadow-[0_0_16px_rgba(34,211,238,0.25)]'
                        : danger
                            ? isDark ? 'text-red-400 hover:bg-red-500/15 hover:text-red-300' : 'text-red-500 hover:bg-red-50 hover:text-red-600'
                            : isDark ? 'text-slate-400 hover:bg-white/8 hover:text-slate-200' : 'text-gray-500 hover:bg-gray-100/80 hover:text-gray-800'
                    }
                    ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                    hover:scale-105 active:scale-95
                `}
            >
                {children}
                {badge !== undefined && badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-cyan-500 text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                        {badge}
                    </span>
                )}
            </button>

            {/* Rich Tooltip */}
            {showTooltip && !disabled && (
                <div
                    className={`
                        absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg
                        whitespace-nowrap text-[11px] font-medium pointer-events-none z-50
                        animate-[tooltipFadeIn_0.2s_cubic-bezier(0.16,1,0.3,1)]
                        shadow-xl border backdrop-blur-xl
                        ${isDark
                            ? 'bg-slate-800/95 text-slate-200 border-slate-600/40'
                            : 'bg-gray-800/95 text-white border-gray-600/30'
                        }
                    `}
                >
                    <div className="flex items-center gap-2">
                        <span>{title}</span>
                        {shortcut && (
                            <kbd className={`
                                px-1.5 py-0.5 rounded text-[9px] font-mono font-bold leading-none
                                ${isDark
                                    ? 'bg-slate-700/80 text-slate-400 border border-slate-600/50'
                                    : 'bg-gray-700/80 text-gray-300 border border-gray-600/50'
                                }
                            `}>
                                {shortcut}
                            </kbd>
                        )}
                    </div>
                    {/* Arrow */}
                    <div className={`
                        absolute top-full left-1/2 -translate-x-1/2 w-0 h-0
                        border-l-[5px] border-l-transparent
                        border-r-[5px] border-r-transparent
                        border-t-[5px]
                        ${isDark ? 'border-t-slate-800/95' : 'border-t-gray-800/95'}
                    `} />
                </div>
            )}
        </div>
    );
};

// ── Dropdown Menu ───────────────────────────────────
const ToolDropdown: React.FC<{
    trigger: React.ReactNode;
    items: Array<{
        id: string;
        icon: React.ReactNode;
        label: string;
        shortcut?: string;
        active?: boolean;
        onClick: () => void;
        divider?: boolean;
        danger?: boolean;
    }>;
    isDark: boolean;
    disabled?: boolean;
}> = ({ trigger, items, isDark, disabled }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent | TouchEvent) => {
            if (open && ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        document.addEventListener('touchstart', handler);
        return () => {
            document.removeEventListener('mousedown', handler);
            document.removeEventListener('touchstart', handler);
        };
    }, [open]);

    return (
        <div className="relative" ref={ref}>
            <div
                role="button"
                tabIndex={0}
                onClick={() => !disabled && setOpen(!open)}
                onKeyDown={(e) => {
                    if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        setOpen(!open);
                    }
                }}
                className={`
                    flex items-center gap-0.5 rounded-lg transition-all outline-none
                    ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                `}
            >
                <div className="pointer-events-none">{trigger}</div>
                <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''} ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
            </div>
            {open && (
                <div className={`
                    absolute bottom-full left-1/2 -translate-x-1/2 mb-2 min-w-[210px] rounded-xl border shadow-2xl z-50
                    py-1.5 overflow-hidden backdrop-blur-2xl
                    animate-[dropdownIn_0.2s_cubic-bezier(0.16,1,0.3,1)]
                    ${isDark ? 'bg-slate-800/95 border-slate-600/40' : 'bg-white/98 border-gray-200'}
                `}>
                    {items.map((item, i) => (
                        <React.Fragment key={item.id}>
                            {item.divider && i > 0 && (
                                <div className={`my-1 h-px ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`} />
                            )}
                            <button
                                onClick={() => { item.onClick(); setOpen(false); }}
                                className={`
                                    w-full flex items-center gap-3 px-3 py-2 text-sm transition-all duration-150
                                    ${item.active
                                        ? isDark ? 'bg-cyan-500/10 text-cyan-400 font-medium border-l-2 border-cyan-400 pl-2.5' : 'bg-blue-50 text-blue-700 font-medium border-l-2 border-blue-500 pl-2.5'
                                        : item.danger
                                            ? isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-500 hover:bg-red-50'
                                            : isDark ? 'text-slate-300 hover:bg-white/5 hover:pl-4' : 'text-gray-700 hover:bg-gray-50 hover:pl-4'}
                                `}
                            >
                                <span className="w-5 h-5 flex items-center justify-center shrink-0">{item.icon}</span>
                                <span className="flex-1 text-left">{item.label}</span>
                                {item.active && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                                )}
                                {item.shortcut && (
                                    <kbd className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isDark ? 'bg-slate-700 text-slate-400' : 'bg-gray-100 text-gray-400'}`}>
                                        {item.shortcut}
                                    </kbd>
                                )}
                            </button>
                        </React.Fragment>
                    ))}
                </div>
            )}
        </div>
    );
};

// ── Divider with optional group label ────────────────
const Divider: React.FC<{ isDark: boolean; label?: string }> = ({ isDark, label }) => (
    <div className="flex flex-col items-center mx-1 gap-0.5 shrink-0">
        {label && (
            <span className={`text-[8px] font-bold uppercase tracking-wider leading-none select-none
                ${isDark ? 'text-slate-600' : 'text-gray-300'}`}>
                {label}
            </span>
        )}
        <div className={`w-px h-5 ${isDark ? 'bg-slate-700/60' : 'bg-gray-200'}`} />
    </div>
);

// ── Main Toolbar ────────────────────────────────────
export const BimToolbar: React.FC<BimToolbarProps> = ({
    isCollapsed = false, onToggleCollapse,
}) => {
    const {
        isDarkMode,
        isMobile,
        tools,
        engine,
        upload,
        selection,
        section,
        measure,
        operations
    } = useBimContext();

    const { activeTool, renderMode, leftPanel, rightPanel } = tools;
    const hasModels = upload.disciplineModels.length > 0;
    const disabled = !engine.viewerReady || !hasModels;

    const onFitAll = () => { engine.resetIsolation(); engine.fitAll(); };
    const onSetView = (view: string) => engine.setView(view);
    const onScreenshot = () => engine.takeScreenshot();
    const onIsolateSelected = () => selection.handleIsolateSelected();
    const onHideSelected = () => selection.handleHideSelected();
    const onShowAll = () => selection.handleShowAll();
    const onUpload = upload.handleFileUpload;

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

    // ── Drag state ──
    const toolbarRef = React.useRef<HTMLDivElement>(null);
    const [dragPos, setDragPos] = React.useState<{ x: number; y: number } | null>(null);
    const dragState = React.useRef<{ dragging: boolean; startX: number; startY: number; origX: number; origY: number }>({
        dragging: false, startX: 0, startY: 0, origX: 0, origY: 0,
    });

    const handleDragStart = React.useCallback((e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const el = toolbarRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        dragState.current = {
            dragging: true,
            startX: e.clientX,
            startY: e.clientY,
            origX: rect.left,
            origY: rect.top,
        };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }, []);

    const handleDragMove = React.useCallback((e: React.PointerEvent) => {
        if (!dragState.current.dragging) return;
        const dx = e.clientX - dragState.current.startX;
        const dy = e.clientY - dragState.current.startY;
        setDragPos({
            x: dragState.current.origX + dx,
            y: dragState.current.origY + dy,
        });
    }, []);

    const handleDragEnd = React.useCallback((e: React.PointerEvent) => {
        dragState.current.dragging = false;
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }, []);

    const resetPosition = React.useCallback(() => {
        setDragPos(null);
    }, []);

    if (isMobile) {
        return (
            <div className={`
                absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1.5 rounded-2xl z-30
                backdrop-blur-xl shadow-2xl border
                ${isDarkMode ? 'bg-slate-800/95 border-slate-700/50' : 'bg-white/95 border-gray-200'}
            `}>
                <ToolBtn isDark={isDarkMode} active={activeTool === 'select'} onClick={() => tools.activateTool('select')} title="Select">
                    <MousePointer2 className="w-5 h-5" />
                </ToolBtn>
                <ToolBtn isDark={isDarkMode} onClick={onFitAll} title="Fit All" disabled={disabled}>
                    <Maximize className="w-5 h-5" />
                </ToolBtn>
                <ToolBtn isDark={isDarkMode} active={leftPanel === 'tree'} onClick={() => tools.toggleLeftPanel('tree')} title="Model Tree">
                    <TreePine className="w-5 h-5" />
                </ToolBtn>
                <ToolBtn isDark={isDarkMode} active={rightPanel === 'properties'} onClick={() => tools.toggleRightPanel('properties')} title="Properties">
                    <PanelRight className="w-5 h-5" />
                </ToolBtn>
                <Divider isDark={isDarkMode} />
                <ToolBtn isDark={isDarkMode} active={activeTool?.startsWith('clip') || activeTool === 'section-box'} onClick={() => handleSectionAction('clip-x')} title="Section" disabled={disabled} badge={section.clipPlaneCount}>
                    <Scissors className="w-5 h-5" />
                </ToolBtn>
                <ToolBtn isDark={isDarkMode} active={activeTool?.startsWith('measure')} onClick={() => handleMeasureAction('length')} title="Measure" disabled={disabled} badge={measure.measurementCount}>
                    <Ruler className="w-5 h-5" />
                </ToolBtn>
                <Divider isDark={isDarkMode} />
                <label className={`
                    flex items-center justify-center w-9 h-9 rounded-xl cursor-pointer
                    transition-all duration-150
                    ${isDarkMode ? 'text-slate-400 hover:bg-slate-700/50 hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'}
                `} title="Upload IFC">
                    <FileUp className="w-5 h-5" />
                    <input type="file" accept=".ifc" className="hidden" onChange={onUpload} />
                </label>
            </div>
        );
    }

    // Collapsed state
    if (isCollapsed) {
        return (
            <button
                onClick={onToggleCollapse}
                className={`
                    absolute bottom-12 left-1/2 -translate-x-1/2 z-30
                    flex items-center gap-1.5 px-3 py-1.5 rounded-full
                    backdrop-blur-xl shadow-lg border cursor-pointer
                    transition-all hover:scale-105
                    ${isDarkMode ? 'bg-slate-800/90 border-slate-700/50 text-slate-400 hover:text-white' : 'bg-white/90 border-gray-200 text-gray-500 hover:text-gray-800'}
                `}
                title="Show Toolbar (T)"
            >
                <ChevronUp className="w-3.5 h-3.5" />
                <span className="text-[10px] font-semibold uppercase tracking-wider">Tools</span>
            </button>
        );
    }

    return (
        <div
            ref={toolbarRef}
            className={`
                ${dragPos ? 'fixed' : 'absolute bottom-12 left-1/2 -translate-x-1/2'}
                flex items-center gap-1 px-2.5 py-2 rounded-2xl z-30
                backdrop-blur-2xl shadow-[0_8px_32px_rgb(0,0,0,0.12),0_0_0_1px_rgba(255,255,255,0.05)] border transition-all duration-300
                hover:shadow-[0_12px_40px_rgb(0,0,0,0.18),0_0_0_1px_rgba(255,255,255,0.08)]
                ${isDarkMode ? 'bg-slate-800/85 border-slate-600/30' : 'bg-white/92 border-gray-200/80'}
            `}
            style={dragPos ? { left: dragPos.x, top: dragPos.y } : undefined}
        >
            {/* ── Drag Handle ──── */}
            <div
                onPointerDown={handleDragStart}
                onPointerMove={handleDragMove}
                onPointerUp={handleDragEnd}
                onDoubleClick={resetPosition}
                className={`
                    flex items-center justify-center w-5 h-9 rounded-lg cursor-grab active:cursor-grabbing
                    transition-colors mr-0.5 shrink-0
                    ${isDarkMode ? 'text-slate-600 hover:text-slate-400 hover:bg-white/5' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'}
                `}
                title="Kéo di chuyển (double-click để reset)"
            >
                <GripVertical className="w-3.5 h-3.5" />
            </div>

            {/* ── Navigate ──── */}
            <ToolBtn isDark={isDarkMode} active={activeTool === 'select'} onClick={() => tools.activateTool('select')} title="Select" shortcut="V">
                <MousePointer2 className="w-5 h-5" />
            </ToolBtn>
            <ToolBtn isDark={isDarkMode} onClick={onFitAll} title="Fit All" shortcut="F" disabled={disabled}>
                <Maximize className="w-5 h-5" />
            </ToolBtn>

            <ToolDropdown
                isDark={isDarkMode}
                disabled={disabled}
                trigger={
                    <ToolBtn isDark={isDarkMode} title="Camera Views" disabled={disabled}>
                        <Box className="w-5 h-5" />
                    </ToolBtn>
                }
                items={[
                    { id: 'iso', icon: <Box className="w-5 h-5" />, label: 'Isometric', shortcut: '0', onClick: () => onSetView('iso') },
                    { id: 'top', icon: <ArrowUp className="w-5 h-5" />, label: 'Top', shortcut: '5', onClick: () => onSetView('top') },
                    { id: 'front', icon: <SquareIcon className="w-5 h-5" />, label: 'Front', shortcut: '1', onClick: () => onSetView('front') },
                    { id: 'right', icon: <ArrowRight className="w-5 h-5" />, label: 'Right', shortcut: '4', onClick: () => onSetView('right') },
                    { id: 'back', icon: <SquareIcon className="w-5 h-5" />, label: 'Back', shortcut: '2', onClick: () => onSetView('back') },
                    { id: 'left', icon: <ArrowRight className="w-5 h-5 rotate-180" />, label: 'Left', shortcut: '3', onClick: () => onSetView('left') },
                    { id: 'bottom', icon: <ArrowUp className="w-5 h-5 rotate-180" />, label: 'Bottom', shortcut: '6', onClick: () => onSetView('bottom') },
                ]}
            />

            <Divider isDark={isDarkMode} label="CUT" />

            {/* ── Section ──── */}
            <ToolDropdown
                isDark={isDarkMode}
                disabled={disabled}
                trigger={
                    <ToolBtn isDark={isDarkMode} active={activeTool?.startsWith('clip') || activeTool === 'section-box' || activeTool === 'section-plane'} title="Section Tools" disabled={disabled} badge={section.clipPlaneCount}>
                        <Scissors className="w-5 h-5" />
                    </ToolBtn>
                }
                items={[
                    { id: 'section-plane', icon: <Crosshair className="w-5 h-5 text-amber-400" />, label: 'Section Plane (Click Surface)', active: activeTool === 'section-plane', onClick: () => handleSectionAction('section-plane') },
                    { id: 'clip-x', icon: <ScanLine className="w-5 h-5 text-red-400" />, label: 'Clip X (YZ Plane)', active: activeTool === 'clip-x', onClick: () => handleSectionAction('clip-x') },
                    { id: 'clip-y', icon: <ScanLine className="w-5 h-5 text-green-400" />, label: 'Clip Y (XZ Plane)', active: activeTool === 'clip-y', onClick: () => handleSectionAction('clip-y') },
                    { id: 'clip-z', icon: <ScanLine className="w-5 h-5 text-blue-400" />, label: 'Clip Z (XY Plane)', active: activeTool === 'clip-z', onClick: () => handleSectionAction('clip-z') },
                    { id: 'section-box', icon: <BoxSelect className="w-5 h-5 text-amber-400" />, label: 'Section Box', active: activeTool === 'section-box', onClick: () => handleSectionAction('section-box') },
                    { id: 'clear-sections', icon: <Trash2 className="w-5 h-5" />, label: 'Clear All Sections', divider: true, danger: true, onClick: () => handleSectionAction('clear') },
                ]}
            />

            {/* ── Measure ──── */}
            <ToolDropdown
                isDark={isDarkMode}
                disabled={disabled}
                trigger={
                    <ToolBtn isDark={isDarkMode} active={activeTool?.startsWith('measure')} title="Measure Tools" disabled={disabled} badge={measure.measurementCount}>
                        <Ruler className="w-5 h-5" />
                    </ToolBtn>
                }
                items={[
                    { id: 'measure-length', icon: <Waypoints className="w-5 h-5 text-cyan-400" />, label: 'Length', active: activeTool === 'measure-length', onClick: () => handleMeasureAction('length') },
                    { id: 'measure-area', icon: <PenTool className="w-5 h-5 text-emerald-400" />, label: 'Area', active: activeTool === 'measure-area', onClick: () => handleMeasureAction('area') },
                    { id: 'clear-measures', icon: <Trash2 className="w-5 h-5" />, label: 'Clear Measurements', divider: true, danger: true, onClick: () => handleMeasureAction('clear') },
                ]}
            />

            <Divider isDark={isDarkMode} label="VIEW" />

            {/* ── Display ──── */}
            <ToolDropdown
                isDark={isDarkMode}
                disabled={disabled}
                trigger={
                    <ToolBtn isDark={isDarkMode} title="Display Mode" disabled={disabled}>
                        <Eye className="w-5 h-5" />
                    </ToolBtn>
                }
                items={[
                    { id: 'shading', icon: <CircleDot className="w-5 h-5" />, label: 'Shading', active: renderMode === 'shading', onClick: () => tools.setRenderMode('shading') },
                    { id: 'wireframe', icon: <Grid3X3 className="w-5 h-5" />, label: 'Wireframe', active: renderMode === 'wireframe', onClick: () => tools.setRenderMode('wireframe') },
                    { id: 'xray', icon: <ScanLine className="w-5 h-5" />, label: 'X-Ray', active: renderMode === 'xray', onClick: () => tools.setRenderMode('xray') },
                    { id: 'ghosting', icon: <Pipette className="w-5 h-5" />, label: 'Ghosting', active: renderMode === 'ghosting', divider: true, onClick: () => tools.setRenderMode('ghosting') },
                    { id: 'edge-outline', icon: <Layers className="w-5 h-5" />, label: 'Edge Outline', active: engine.edgeOutlineEnabled, onClick: () => engine.toggleEdgeOutline(!engine.edgeOutlineEnabled) },
                    { id: 'ssao', icon: <Sun className="w-5 h-5" />, label: 'Ambient Occlusion', active: engine.aoEnabled, onClick: () => engine.toggleAO(!engine.aoEnabled) },
                ]}
            />

            {/* ── Visibility ──── */}
            <ToolDropdown
                isDark={isDarkMode}
                disabled={disabled}
                trigger={
                    <ToolBtn isDark={isDarkMode} title="Visibility" disabled={disabled}>
                        <Focus className="w-5 h-5" />
                    </ToolBtn>
                }
                items={[
                    { id: 'isolate', icon: <Focus className="w-5 h-5 text-amber-400" />, label: 'Isolate Selected', shortcut: 'I', onClick: onIsolateSelected },
                    { id: 'hide', icon: <EyeOff className="w-5 h-5" />, label: 'Hide Selected', shortcut: 'H', onClick: onHideSelected },
                    { id: 'show-all', icon: <Eye className="w-5 h-5 text-emerald-400" />, label: 'Show All', shortcut: 'Shift+H', divider: true, onClick: onShowAll },
                ]}
            />

            <Divider isDark={isDarkMode} label="OPS" />

            {/* ── Operations (Heatmap & System) ──── */}
            <ToolBtn
                isDark={isDarkMode}
                active={operations.heatmapActive}
                onClick={operations.toggleHeatmap}
                title="Asset Heatmap (Status)"
                disabled={disabled}
            >
                <Activity className={`w-5 h-5 ${operations.heatmapActive ? 'text-rose-400' : ''}`} />
            </ToolBtn>

            <ToolDropdown
                isDark={isDarkMode}
                disabled={disabled}
                trigger={
                    <ToolBtn isDark={isDarkMode} active={operations.activeSystem !== null} title="MEP Systems" disabled={disabled}>
                        <Zap className="w-5 h-5" />
                    </ToolBtn>
                }
                items={[
                    { id: 'sys-hvac', icon: <Box className="w-5 h-5 text-blue-400" />, label: 'HVAC System', active: operations.activeSystem === 'HVAC', onClick: () => operations.toggleSystemMapping('HVAC') },
                    { id: 'sys-elec', icon: <Zap className="w-5 h-5 text-yellow-400" />, label: 'Electrical System', active: operations.activeSystem === 'Electrical', onClick: () => operations.toggleSystemMapping('Electrical') },
                    { id: 'sys-plumb', icon: <Activity className="w-5 h-5 text-cyan-400" />, label: 'Plumbing System', active: operations.activeSystem === 'Plumbing', onClick: () => operations.toggleSystemMapping('Plumbing') },
                    { id: 'sys-fire', icon: <ShieldAlert className="w-5 h-5 text-red-400" />, label: 'Fire Protection', active: operations.activeSystem === 'Fire', onClick: () => operations.toggleSystemMapping('Fire') },
                    { id: 'sys-clear', icon: <Trash2 className="w-5 h-5" />, label: 'Clear System Filter', divider: true, danger: true, onClick: () => operations.toggleSystemMapping(null) },
                ]}
            />

            <Divider isDark={isDarkMode} />

            {/* ── Extras ──── */}
            <label
                className={`
                    relative w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-150 cursor-pointer
                    ${isDarkMode ? 'text-slate-400 hover:bg-white/10 hover:text-white' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-800'}
                `}
                title="Upload IFC"
            >
                <FileUp className="w-5 h-5" />
                <input type="file" accept=".ifc" className="hidden" onChange={onUpload} />
            </label>
            <ToolBtn isDark={isDarkMode} onClick={onScreenshot} title="Screenshot" disabled={disabled}>
                <Camera className="w-5 h-5" />
            </ToolBtn>

            {/* ── Collapse ──── */}
            <Divider isDark={isDarkMode} />
            <ToolBtn isDark={isDarkMode} onClick={onToggleCollapse} title="Hide Toolbar (T)">
                <ChevronDown className="w-5 h-5" />
            </ToolBtn>
        </div>
    );
};
