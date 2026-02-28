/**
 * BimModelTree — IFC Spatial Structure Tree Browser
 * Two modes: Spatial (Site→Building→Storey) and Types (by IfcWall, IfcSlab, etc.)
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
    ChevronDown, ChevronRight, Eye, EyeOff, Search, X,
    Building2, Layers, TreePine, MapPin, FolderOpen, Box,
    Hash, Columns3, Square, CircleDot, Upload, Loader2,
    FileUp, Trash2, MoreVertical, Crosshair
} from 'lucide-react';
import type { BimModel } from '../../../../lib/bimStorage';
import { useBimContext } from './context/BimContext';

// ── Types ────────────────────────────────────────────
export interface SpatialNode {
    id: number;
    name: string;
    type: string;       // 'IfcProject' | 'IfcSite' | 'IfcBuilding' | 'IfcBuildingStorey' | element type
    children: SpatialNode[];
    elementCount?: number;
    visible?: boolean;
}

export interface TypeGroup {
    type: string;
    count: number;
    elements: Array<{ id: number; name: string }>;
    visible: boolean;
}

interface DisciplineModel {
    model: BimModel;
    visible: boolean;
    fragModel?: any;
}

type TreeMode = 'spatial' | 'types' | 'disciplines';

// ── Icons for IFC types ──────────────────────────────
function getTypeIcon(type: string) {
    const t = type.toLowerCase();
    if (t.includes('project')) return <TreePine className="w-3.5 h-3.5 text-blue-400" />;
    if (t.includes('site')) return <MapPin className="w-3.5 h-3.5 text-green-400" />;
    if (t.includes('building') && !t.includes('storey')) return <Building2 className="w-3.5 h-3.5 text-amber-400" />;
    if (t.includes('storey')) return <Layers className="w-3.5 h-3.5 text-purple-400" />;
    if (t.includes('wall')) return <Square className="w-3.5 h-3.5 text-orange-400" />;
    if (t.includes('slab') || t.includes('floor')) return <Columns3 className="w-3.5 h-3.5 text-teal-400" />;
    if (t.includes('column')) return <Box className="w-3.5 h-3.5 text-red-400" />;
    if (t.includes('beam')) return <Columns3 className="w-3.5 h-3.5 text-cyan-400" />;
    if (t.includes('door')) return <Square className="w-3.5 h-3.5 text-amber-400" />;
    if (t.includes('window')) return <Square className="w-3.5 h-3.5 text-sky-400" />;
    if (t.includes('stair')) return <Layers className="w-3.5 h-3.5 text-rose-400" />;
    if (t.includes('roof')) return <Square className="w-3.5 h-3.5 text-indigo-400" />;
    if (t.includes('space') || t.includes('room')) return <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />;
    return <CircleDot className="w-3.5 h-3.5 text-slate-400" />;
}

// Discipline color
function getDisciplineColor(d: string | null) {
    const c: Record<string, string> = {
        ARCH: 'bg-blue-500', STRU: 'bg-red-500', ELEC: 'bg-yellow-500',
        HVAC: 'bg-green-500', PLUM: 'bg-cyan-500', FIRE: 'bg-orange-500',
        LAND: 'bg-emerald-500', MEP: 'bg-purple-500', COMBINE: 'bg-slate-400',
    };
    return c[d || ''] || 'bg-slate-500';
}

// ── Component ────────────────────────────────────────
export const BimModelTree: React.FC = () => {
    const {
        isDarkMode,
        isMobile,
        tools,
        selection: { spatialTree, typeGroups, handleSelectElementFromTree, toggleTypeVisibility },
        upload: { disciplineModels, toggleDisciplineVisibility, handleFileUpload, handleDeleteModel },
        engine: { viewerReady, zoomToExpressId }
    } = useBimContext();

    const onClose = () => tools.toggleLeftPanel('none');
    const onSelectElement = handleSelectElementFromTree;
    const onToggleVisibility = toggleDisciplineVisibility;
    const onToggleTypeVisibility = toggleTypeVisibility;
    const onUpload = handleFileUpload;
    const onDeleteModel = handleDeleteModel;
    const [mode, setMode] = useState<TreeMode>('disciplines');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));

    const toggleNode = useCallback((id: string) => {
        setExpandedNodes(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    }, []);

    // ── Tab Button ────────────────────────────────
    const TabBtn: React.FC<{ tab: TreeMode; icon: React.ReactNode; label: string }> = ({ tab, icon, label }) => (
        <button
            onClick={() => setMode(tab)}
            className={`
                relative flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide rounded-md transition-all duration-200
                ${mode === tab
                    ? isDarkMode
                        ? 'bg-cyan-500/10 text-cyan-400'
                        : 'bg-blue-50 text-blue-600'
                    : isDarkMode ? 'text-slate-500 hover:text-slate-300 hover:bg-white/5' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }
            `}
        >
            {icon}
            <span>{label}</span>
            {mode === tab && (
                <span className={`absolute bottom-0 left-2 right-2 h-0.5 rounded-full ${isDarkMode ? 'bg-cyan-400' : 'bg-blue-500'}`} />
            )}
        </button>
    );

    // ── Render Spatial Tree Node ──────────────────
    const renderSpatialNode = (node: SpatialNode, level: number = 0) => {
        const hasChildren = node.children.length > 0;
        const isExpanded = expandedNodes.has(`spatial-${node.id}`);
        const matchesSearch = !searchQuery || node.name.toLowerCase().includes(searchQuery.toLowerCase());

        // If searching, only show matching nodes
        if (searchQuery && !matchesSearch && !node.children.some(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))) {
            return null;
        }

        return (
            <div key={`spatial-${node.id}`}>
                <div
                    className={`
                        flex items-center gap-1 py-1 pr-2 rounded-md cursor-pointer transition-colors
                        ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-100'}
                    `}
                    style={{ paddingLeft: `${level * 16 + 8}px` }}
                    onClick={() => {
                        if (hasChildren) toggleNode(`spatial-${node.id}`);
                        else onSelectElement(node.id);
                    }}
                    onDoubleClick={() => {
                        onSelectElement(node.id);
                        zoomToExpressId(node.id);
                    }}
                >
                    {hasChildren ? (
                        <button onClick={(e) => { e.stopPropagation(); toggleNode(`spatial-${node.id}`); }} className="p-0.5">
                            {isExpanded ? <ChevronDown className="w-3 h-3 text-slate-500" /> : <ChevronRight className="w-3 h-3 text-slate-500" />}
                        </button>
                    ) : (
                        <span className="w-4" />
                    )}
                    {getTypeIcon(node.type)}
                    <span className={`text-xs flex-1 truncate ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>{node.name}</span>
                    {node.elementCount !== undefined && node.elementCount > 0 && (
                        <span className={`text-[9px] font-mono px-1 rounded ${isDarkMode ? 'text-slate-600' : 'text-gray-400'}`}>
                            {node.elementCount}
                        </span>
                    )}
                </div>
                {isExpanded && hasChildren && node.children.map(child => renderSpatialNode(child, level + 1))}
            </div>
        );
    };

    // ── Render Type Groups ────────────────────────
    const renderTypeGroups = () => {
        const filtered = searchQuery
            ? typeGroups.filter(g => g.type.toLowerCase().includes(searchQuery.toLowerCase()))
            : typeGroups;

        return (
            <div className="space-y-0.5">
                {filtered.map(group => {
                    const isExpanded = expandedNodes.has(`type-${group.type}`);
                    return (
                        <div key={group.type}>
                            <div
                                className={`flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-100'}`}
                                onClick={() => toggleNode(`type-${group.type}`)}
                            >
                                {isExpanded ? <ChevronDown className="w-3 h-3 text-slate-500" /> : <ChevronRight className="w-3 h-3 text-slate-500" />}
                                {getTypeIcon(group.type)}
                                <span className={`text-xs flex-1 truncate ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                                    {group.type.replace('Ifc', '')}
                                </span>
                                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-slate-700/40 text-slate-500' : 'bg-gray-100 text-gray-400'}`}>
                                    {group.count}
                                </span>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onToggleTypeVisibility(group.type); }}
                                    className={`p-0.5 rounded ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-200'}`}
                                >
                                    {group.visible
                                        ? <Eye className="w-3.5 h-3.5 text-emerald-400" />
                                        : <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                                    }
                                </button>
                            </div>
                            {isExpanded && (
                                <div className="ml-6">
                                    {group.elements.slice(0, 50).map(el => (
                                        <div
                                            key={el.id}
                                            onClick={() => onSelectElement(el.id)}
                                            onDoubleClick={() => {
                                                onSelectElement(el.id);
                                                zoomToExpressId(el.id);
                                            }}
                                            className={`
                                                flex items-center gap-2 py-1 px-2 rounded cursor-pointer text-xs truncate
                                                ${isDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-white/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}
                                            `}
                                            title="Double-click to zoom"
                                        >
                                            <CircleDot className="w-2.5 h-2.5 shrink-0" />
                                            {el.name || `#${el.id}`}
                                        </div>
                                    ))}
                                    {group.elements.length > 50 && (
                                        <p className={`text-[10px] px-2 py-1 ${isDarkMode ? 'text-slate-600' : 'text-gray-400'}`}>
                                            ...and {group.elements.length - 50} more
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    // ── Render Disciplines ───────────────────────
    const renderDisciplines = () => (
        <div className="space-y-1">
            {disciplineModels.length === 0 ? (
                <div className="text-center py-8">
                    <FileUp className={`w-10 h-10 mx-auto mb-3 ${isDarkMode ? 'text-slate-600' : 'text-gray-300'}`} />
                    <p className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>No models loaded</p>
                    <p className={`text-xs mb-4 ${isDarkMode ? 'text-slate-600' : 'text-gray-400'}`}>Upload IFC files to begin</p>
                    <label className={`
                        inline-flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer text-sm font-semibold transition-all
                        bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white shadow-lg shadow-blue-500/20
                    `}>
                        <Upload className="w-4 h-4" />
                        Upload IFC
                        <input type="file" accept=".ifc" className="hidden" onChange={onUpload} disabled={!viewerReady} />
                    </label>
                </div>
            ) : (
                disciplineModels.map((dm, idx) => (
                    <div key={dm.model.id} className={`group flex items-center gap-2.5 p-2 rounded-lg transition-all duration-200 ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-100'}`}>
                        <div className={`w-3 h-3 rounded-full ${getDisciplineColor(dm.model.discipline)} shrink-0 ring-2 ring-offset-1 ${isDarkMode ? 'ring-offset-slate-800 ring-white/10' : 'ring-offset-white ring-black/5'}`} />
                        <div className="flex-1 min-w-0">
                            <p className={`text-xs truncate ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                                {dm.model.discipline || dm.model.file_name.slice(0, 25)}
                            </p>
                            <p className={`text-[9px] ${isDarkMode ? 'text-slate-600' : 'text-gray-400'}`}>
                                {dm.model.status === 'ready'
                                    ? (dm.model.element_count && dm.model.element_count > 0
                                        ? `${dm.model.element_count.toLocaleString()} elements`
                                        : 'Ready')
                                    : dm.model.status}
                            </p>
                        </div>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {dm.model.status === 'ready' && (
                                <button
                                    onClick={() => onToggleVisibility(idx)}
                                    className={`p-1 rounded ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-200'}`}
                                    title={dm.visible ? 'Hide' : 'Show'}
                                >
                                    {dm.visible ? <Eye className="w-3.5 h-3.5 text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
                                </button>
                            )}
                            <button
                                onClick={() => onDeleteModel(idx)}
                                className={`p-1 rounded ${isDarkMode ? 'hover:bg-red-500/20' : 'hover:bg-red-50'}`}
                                title="Delete"
                            >
                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );

    return (
        <div className={`
            ${isMobile ? 'absolute inset-y-0 left-0 z-30 w-72 border-r' : 'w-full h-full'}
            ${isDarkMode ? 'bg-slate-800/95 border-slate-700/50' : 'bg-white border-gray-200'}
            flex flex-col shrink-0 backdrop-blur-xl
        `}>
            {/* Header */}
            <div className={`p-3 border-b flex items-center justify-between ${isDarkMode ? 'border-slate-700/30' : 'border-gray-200'}`}>
                <div className="flex items-center gap-2">
                    <TreePine className="w-4 h-4 text-blue-400" />
                    <span className={`text-xs font-bold uppercase tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Model Browser</span>
                </div>
                <button onClick={onClose} className={`p-1 rounded-lg ${isDarkMode ? 'text-slate-500 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}>
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Mode Tabs */}
            <div className={`flex gap-1 p-2 border-b ${isDarkMode ? 'border-slate-700/30' : 'border-gray-200'}`}>
                <TabBtn tab="disciplines" icon={<Layers className="w-3 h-3" />} label="Models" />
                <TabBtn tab="spatial" icon={<Building2 className="w-3 h-3" />} label="Spatial" />
                <TabBtn tab="types" icon={<Hash className="w-3 h-3" />} label="Types" />
            </div>

            {/* Search (spatial + types only) */}
            {(mode === 'spatial' || mode === 'types') && (
                <div className={`p-2 border-b ${isDarkMode ? 'border-slate-700/30' : 'border-gray-200'}`}>
                    <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all ${isDarkMode ? 'bg-slate-700/50 focus-within:ring-1 focus-within:ring-cyan-500/30' : 'bg-gray-100 focus-within:ring-1 focus-within:ring-blue-300'}`}>
                        <Search className={`w-3.5 h-3.5 shrink-0 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`} />
                        <input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search elements..."
                            className={`flex-1 text-xs bg-transparent outline-none ${isDarkMode ? 'text-white placeholder:text-slate-500' : 'text-gray-800 placeholder:text-gray-400'}`}
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')}>
                                <X className={`w-3 h-3 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`} />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-2">
                {mode === 'disciplines' && renderDisciplines()}
                {mode === 'spatial' && (
                    spatialTree.length > 0 ? (
                        <div className="space-y-0.5">
                            {spatialTree.map(node => renderSpatialNode(node))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Building2 className={`w-8 h-8 mx-auto mb-2 ${isDarkMode ? 'text-slate-600' : 'text-gray-300'}`} />
                            <p className={`text-sm ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>No spatial data</p>
                            <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-600' : 'text-gray-400'}`}>Load an IFC model first</p>
                        </div>
                    )
                )}
                {mode === 'types' && (
                    typeGroups.length > 0 ? renderTypeGroups() : (
                        <div className="text-center py-12">
                            <Hash className={`w-8 h-8 mx-auto mb-2 ${isDarkMode ? 'text-slate-600' : 'text-gray-300'}`} />
                            <p className={`text-sm ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>No type data</p>
                            <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-600' : 'text-gray-400'}`}>Load an IFC model first</p>
                        </div>
                    )
                )}
            </div>

            {/* Footer: Upload button */}
            {disciplineModels.length > 0 && mode === 'disciplines' && (
                <div className={`p-2 border-t ${isDarkMode ? 'border-slate-700/30' : 'border-gray-200'}`}>
                    <label className={`
                        flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg cursor-pointer text-xs font-semibold transition-all border
                        ${!viewerReady ? 'opacity-50 pointer-events-none' : ''}
                        ${isDarkMode
                            ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/20'
                            : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200'}
                    `}>
                        {!viewerReady ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        <span>{!viewerReady ? 'Loading...' : 'Add IFC Model'}</span>
                        <input type="file" accept=".ifc" className="hidden" onChange={onUpload} disabled={!viewerReady} />
                    </label>
                </div>
            )}
        </div>
    );
};
