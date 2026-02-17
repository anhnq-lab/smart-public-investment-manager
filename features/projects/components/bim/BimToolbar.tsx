/**
 * BimToolbar — Professional floating toolbar for BIM Viewer
 * Grouped tools: Navigate, Section, Measure, Display, Actions
 * Fixed: dropdown close-on-outside, proper cursor, clear active states
 */
import React, { useState, useRef, useEffect } from 'react';
import {
    MousePointer2, Move3D, Maximize, Scissors, Ruler, Eye,
    Camera, MoreHorizontal, Box, ArrowUp, Square as SquareIcon,
    ArrowRight, Grid3X3, Axis3D, Sun, Moon, RotateCcw,
    EyeOff, Focus, Download, Trash2, CircleDot, PenTool,
    Layers, TreePine, PanelLeft, PanelRight, ChevronDown, ChevronUp,
    Slice, ScanLine, BoxSelect, Pipette, Waypoints, FileUp
} from 'lucide-react';
import { useTheme } from '../../../../context/ThemeContext';
import type { ActiveTool, RenderMode, PanelView, BimToolsAPI } from './useBimTools';

interface BimToolbarProps {
    tools: BimToolsAPI;
    viewerReady: boolean;
    hasModels: boolean;
    onSetView: (view: string) => void;
    onFitAll: () => void;
    onScreenshot: () => void;
    onIsolateSelected: () => void;
    onHideSelected: () => void;
    onShowAll: () => void;
    isMobile: boolean;
    clipPlaneCount?: number;
    measurementCount?: number;
    onSectionAction?: (action: string) => void;
    onMeasureAction?: (action: string) => void;
    onUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
}

// ── Tool Button ─────────────────────────────────────
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
}> = ({ active, onClick, title, shortcut, children, disabled, isDark, danger, badge }) => (
    <button
        onClick={onClick}
        title={`${title}${shortcut ? ` (${shortcut})` : ''}`}
        disabled={disabled}
        className={`
            relative w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-150
            ${active
                ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/50 shadow-[0_0_8px_rgba(59,130,246,0.2)]'
                : danger
                    ? isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-500 hover:bg-red-50'
                    : isDark ? 'text-slate-400 hover:bg-white/10 hover:text-white' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-800'
            }
            ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
        `}
    >
        {children}
        {badge !== undefined && badge > 0 && (
            <span className="absolute -top-1 -right-1 bg-cyan-500 text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                {badge}
            </span>
        )}
    </button>
);

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
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        // Use setTimeout to avoid immediate close on the click that opened
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handler);
        }, 10);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handler);
        };
    }, [open]);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => !disabled && setOpen(!open)}
                disabled={disabled}
                className={`
                    flex items-center gap-0.5 rounded-lg transition-all
                    ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                `}
            >
                {trigger}
                <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''} ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
            </button>
            {open && (
                <div className={`
                    absolute bottom-full left-1/2 -translate-x-1/2 mb-2 min-w-[200px] rounded-xl border shadow-2xl z-50
                    py-1 overflow-hidden
                    ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}
                `}>
                    {items.map((item, i) => (
                        <React.Fragment key={item.id}>
                            {item.divider && i > 0 && (
                                <div className={`my-1 h-px ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`} />
                            )}
                            <button
                                onClick={() => { item.onClick(); setOpen(false); }}
                                className={`
                                    w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors
                                    ${item.active
                                        ? isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'
                                        : item.danger
                                            ? isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-500 hover:bg-red-50'
                                            : isDark ? 'text-slate-300 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-50'}
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

// ── Divider ─────────────────────────────────────────
const Divider: React.FC<{ isDark: boolean }> = ({ isDark }) => (
    <div className={`w-px h-6 mx-0.5 ${isDark ? 'bg-slate-700/60' : 'bg-gray-200'}`} />
);

// ── Main Toolbar ────────────────────────────────────
export const BimToolbar: React.FC<BimToolbarProps> = ({
    tools, viewerReady, hasModels, onSetView, onFitAll,
    onScreenshot, onIsolateSelected, onHideSelected, onShowAll, isMobile,
    clipPlaneCount = 0, measurementCount = 0,
    onSectionAction, onMeasureAction,
    onUpload,
    isCollapsed = false, onToggleCollapse,
}) => {
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark';
    const { activeTool, renderMode, leftPanel, rightPanel } = tools;
    const disabled = !viewerReady || !hasModels;

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
                <ToolBtn isDark={isDarkMode} active={activeTool?.startsWith('clip') || activeTool === 'section-box'} onClick={() => onSectionAction?.('clip-x')} title="Section" disabled={disabled} badge={clipPlaneCount}>
                    <Scissors className="w-5 h-5" />
                </ToolBtn>
                <ToolBtn isDark={isDarkMode} active={activeTool?.startsWith('measure')} onClick={() => onMeasureAction?.('length')} title="Measure" disabled={disabled} badge={measurementCount}>
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
        <div className={`
            absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-0.5 px-2 py-1.5 rounded-xl z-30
            backdrop-blur-xl shadow-2xl border transition-all
            ${isDarkMode ? 'bg-slate-800/95 border-slate-700/50' : 'bg-white/95 border-gray-200'}
        `}>
            {/* ── Navigate ──── */}
            <ToolBtn isDark={isDarkMode} active={activeTool === 'select'} onClick={() => tools.activateTool('select')} title="Select" shortcut="V">
                <MousePointer2 className="w-4 h-4" />
            </ToolBtn>
            <ToolBtn isDark={isDarkMode} onClick={onFitAll} title="Fit All" shortcut="F" disabled={disabled}>
                <Maximize className="w-4 h-4" />
            </ToolBtn>

            <ToolDropdown
                isDark={isDarkMode}
                disabled={disabled}
                trigger={
                    <ToolBtn isDark={isDarkMode} title="Camera Views" disabled={disabled}>
                        <Box className="w-4 h-4" />
                    </ToolBtn>
                }
                items={[
                    { id: 'iso', icon: <Box className="w-4 h-4" />, label: 'Isometric', shortcut: '0', onClick: () => onSetView('iso') },
                    { id: 'top', icon: <ArrowUp className="w-4 h-4" />, label: 'Top', shortcut: '5', onClick: () => onSetView('top') },
                    { id: 'front', icon: <SquareIcon className="w-4 h-4" />, label: 'Front', shortcut: '1', onClick: () => onSetView('front') },
                    { id: 'right', icon: <ArrowRight className="w-4 h-4" />, label: 'Right', shortcut: '4', onClick: () => onSetView('right') },
                    { id: 'back', icon: <SquareIcon className="w-4 h-4" />, label: 'Back', shortcut: '2', onClick: () => onSetView('back') },
                    { id: 'left', icon: <ArrowRight className="w-4 h-4 rotate-180" />, label: 'Left', shortcut: '3', onClick: () => onSetView('left') },
                    { id: 'bottom', icon: <ArrowUp className="w-4 h-4 rotate-180" />, label: 'Bottom', shortcut: '6', onClick: () => onSetView('bottom') },
                ]}
            />

            <Divider isDark={isDarkMode} />

            {/* ── Section ──── */}
            <ToolDropdown
                isDark={isDarkMode}
                disabled={disabled}
                trigger={
                    <ToolBtn isDark={isDarkMode} active={activeTool?.startsWith('clip') || activeTool === 'section-box'} title="Section Tools" disabled={disabled} badge={clipPlaneCount}>
                        <Scissors className="w-4 h-4" />
                    </ToolBtn>
                }
                items={[
                    { id: 'clip-x', icon: <ScanLine className="w-4 h-4 text-red-400" />, label: 'Clip X (YZ Plane)', active: activeTool === 'clip-x', onClick: () => onSectionAction?.('clip-x') },
                    { id: 'clip-y', icon: <ScanLine className="w-4 h-4 text-green-400" />, label: 'Clip Y (XZ Plane)', active: activeTool === 'clip-y', onClick: () => onSectionAction?.('clip-y') },
                    { id: 'clip-z', icon: <ScanLine className="w-4 h-4 text-blue-400" />, label: 'Clip Z (XY Plane)', active: activeTool === 'clip-z', onClick: () => onSectionAction?.('clip-z') },
                    { id: 'section-box', icon: <BoxSelect className="w-4 h-4 text-amber-400" />, label: 'Section Box', active: activeTool === 'section-box', onClick: () => onSectionAction?.('section-box') },
                    { id: 'clear-sections', icon: <Trash2 className="w-4 h-4" />, label: 'Clear All Sections', divider: true, danger: true, onClick: () => onSectionAction?.('clear') },
                ]}
            />

            {/* ── Measure ──── */}
            <ToolDropdown
                isDark={isDarkMode}
                disabled={disabled}
                trigger={
                    <ToolBtn isDark={isDarkMode} active={activeTool?.startsWith('measure')} title="Measure Tools" disabled={disabled} badge={measurementCount}>
                        <Ruler className="w-4 h-4" />
                    </ToolBtn>
                }
                items={[
                    { id: 'measure-length', icon: <Waypoints className="w-4 h-4 text-cyan-400" />, label: 'Length', active: activeTool === 'measure-length', onClick: () => onMeasureAction?.('length') },
                    { id: 'measure-area', icon: <PenTool className="w-4 h-4 text-emerald-400" />, label: 'Area', active: activeTool === 'measure-area', onClick: () => onMeasureAction?.('area') },
                    { id: 'clear-measures', icon: <Trash2 className="w-4 h-4" />, label: 'Clear Measurements', divider: true, danger: true, onClick: () => onMeasureAction?.('clear') },
                ]}
            />

            <Divider isDark={isDarkMode} />

            {/* ── Display ──── */}
            <ToolDropdown
                isDark={isDarkMode}
                disabled={disabled}
                trigger={
                    <ToolBtn isDark={isDarkMode} title="Display Mode" disabled={disabled}>
                        <Eye className="w-4 h-4" />
                    </ToolBtn>
                }
                items={[
                    { id: 'shading', icon: <CircleDot className="w-4 h-4" />, label: 'Shading', active: renderMode === 'shading', onClick: () => tools.setRenderMode('shading') },
                    { id: 'wireframe', icon: <Grid3X3 className="w-4 h-4" />, label: 'Wireframe', active: renderMode === 'wireframe', onClick: () => tools.setRenderMode('wireframe') },
                    { id: 'xray', icon: <ScanLine className="w-4 h-4" />, label: 'X-Ray', active: renderMode === 'xray', onClick: () => tools.setRenderMode('xray') },
                    { id: 'ghosting', icon: <Pipette className="w-4 h-4" />, label: 'Ghosting', active: renderMode === 'ghosting', onClick: () => tools.setRenderMode('ghosting') },
                ]}
            />

            {/* ── Visibility ──── */}
            <ToolDropdown
                isDark={isDarkMode}
                disabled={disabled}
                trigger={
                    <ToolBtn isDark={isDarkMode} title="Visibility" disabled={disabled}>
                        <Focus className="w-4 h-4" />
                    </ToolBtn>
                }
                items={[
                    { id: 'isolate', icon: <Focus className="w-4 h-4 text-amber-400" />, label: 'Isolate Selected', shortcut: 'I', onClick: onIsolateSelected },
                    { id: 'hide', icon: <EyeOff className="w-4 h-4" />, label: 'Hide Selected', shortcut: 'H', onClick: onHideSelected },
                    { id: 'show-all', icon: <Eye className="w-4 h-4 text-emerald-400" />, label: 'Show All', shortcut: 'Shift+H', divider: true, onClick: onShowAll },
                ]}
            />

            <Divider isDark={isDarkMode} />

            {/* ── Panels ──── */}
            <ToolBtn isDark={isDarkMode} active={leftPanel === 'tree'} onClick={() => tools.toggleLeftPanel('tree')} title="Model Tree">
                <TreePine className="w-4 h-4" />
            </ToolBtn>
            <ToolBtn isDark={isDarkMode} active={rightPanel === 'properties'} onClick={() => tools.toggleRightPanel('properties')} title="Properties Panel">
                <PanelRight className="w-4 h-4" />
            </ToolBtn>

            <Divider isDark={isDarkMode} />

            {/* ── Extras ──── */}
            <label
                className={`
                    relative w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-150 cursor-pointer
                    ${isDarkMode ? 'text-slate-400 hover:bg-white/10 hover:text-white' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-800'}
                `}
                title="Upload IFC"
            >
                <FileUp className="w-4 h-4" />
                <input type="file" accept=".ifc" className="hidden" onChange={onUpload} />
            </label>
            <ToolBtn isDark={isDarkMode} onClick={onScreenshot} title="Screenshot" disabled={disabled}>
                <Camera className="w-4 h-4" />
            </ToolBtn>

            {/* ── Collapse ──── */}
            <Divider isDark={isDarkMode} />
            <ToolBtn isDark={isDarkMode} onClick={onToggleCollapse} title="Hide Toolbar (T)">
                <ChevronDown className="w-4 h-4" />
            </ToolBtn>
        </div>
    );
};
