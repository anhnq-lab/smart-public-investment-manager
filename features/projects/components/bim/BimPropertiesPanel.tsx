/**
 * BimPropertiesPanel — Professional tabbed properties panel
 * Tabs: Properties | Relations | Classification
 * Features: search, copy, quantity formatting, collapsible groups
 */
import React, { useState, useMemo } from 'react';
import {
    ChevronDown, ChevronRight, Copy, Search, X,
    Crosshair, Layers, Link2, Tag, Hash, Box,
    Ruler, Square, Maximize, Weight, ChevronsUpDown, Download, Check
} from 'lucide-react';
import { useBimContext } from './context/BimContext';

// ── Types ────────────────────────────────────────────
export interface PropertyItem {
    name: string;
    value: string;
}

export interface PropertySetGroup {
    name: string;
    properties: PropertyItem[];
}

export interface SelectedElement {
    id: string;
    name: string;
    type: string;
    globalId?: string;
    propertySets: PropertySetGroup[];
    materials: string[];
    // Extended info
    spatialContainer?: string;    // e.g., "Tầng 1"
    typeInfo?: string;            // e.g., "IfcWallType: W-200"
    relations?: RelationItem[];
    classifications?: ClassificationItem[];
}

export interface RelationItem {
    type: string;      // e.g., "ContainedIn", "ConnectsTo", "VoidsElement"
    targetName: string;
    targetType: string;
    targetId: string;
}

export interface ClassificationItem {
    system: string;  // e.g., "UniClass", "OmniClass"
    code: string;
    name: string;
}

type PropertiesTab = 'properties' | 'relations' | 'classification';

interface BimPropertiesPanelProps {
    isBottomPanel?: boolean;
}

// ── Quantity unit detection ──────────────────────────
function formatQuantityValue(name: string, value: string): string {
    if (!value || value === '—' || value === 'undefined') return '—';

    const num = parseFloat(value);
    if (isNaN(num)) return value;

    const lower = name.toLowerCase();
    if (lower.includes('volume') || lower.includes('khối')) return `${num.toFixed(3)} m³`;
    if (lower.includes('area') || lower.includes('diện tích') || lower.includes('sidearea') || lower.includes('crosssection')) return `${num.toFixed(2)} m²`;
    if (lower.includes('length') || lower.includes('width') || lower.includes('height') || lower.includes('depth') || lower.includes('perimeter') || lower.includes('dài') || lower.includes('rộng') || lower.includes('cao')) return `${num.toFixed(3)} m`;
    if (lower.includes('weight') || lower.includes('mass') || lower.includes('trọng')) return `${num.toFixed(1)} kg`;
    if (lower.includes('angle') || lower.includes('góc')) return `${num.toFixed(1)}°`;
    if (lower.includes('count') || lower.includes('số')) return `${Math.round(num)}`;

    return value;
}

// Detect if a property set contains quantities
function isQuantitySet(name: string): boolean {
    const lower = name.toLowerCase();
    return lower.includes('quantity') || lower.includes('quantities') || lower.includes('baseq') || lower.includes('khối lượng');
}

// Icon for quantity type
function getQuantityIcon(name: string) {
    const lower = name.toLowerCase();
    if (lower.includes('volume')) return <Box className="w-3 h-3 text-purple-400" />;
    if (lower.includes('area')) return <Square className="w-3 h-3 text-emerald-400" />;
    if (lower.includes('length') || lower.includes('width') || lower.includes('height')) return <Ruler className="w-3 h-3 text-cyan-400" />;
    if (lower.includes('weight') || lower.includes('mass')) return <Weight className="w-3 h-3 text-amber-400" />;
    return <Hash className="w-3 h-3 text-slate-400" />;
}

// ── Search highlight helper ──────────────────────────
function highlightMatch(text: string, query: string, isDarkMode: boolean): React.ReactNode {
    if (!query.trim()) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + query.length);
    const after = text.slice(idx + query.length);
    return (
        <>
            {before}
            <span className={`font-bold ${isDarkMode ? 'text-cyan-400' : 'text-blue-600'}`}>{match}</span>
            {after}
        </>
    );
}

// ── Component ────────────────────────────────────────
export const BimPropertiesPanel: React.FC<BimPropertiesPanelProps> = ({
    isBottomPanel = false
}) => {
    const {
        isDarkMode,
        isMobile,
        tools,
        selection: { selectedElement, handleSelectElementFromTree }
    } = useBimContext();

    const onClose = () => tools.toggleRightPanel('none');
    const onHighlightElement = (id: string) => handleSelectElementFromTree(Number(id));

    const [activeTab, setActiveTab] = useState<PropertiesTab>('properties');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedSets, setExpandedSets] = useState<Record<string, boolean>>({});
    const [copyToast, setCopyToast] = useState<string | null>(null);
    const [allExpanded, setAllExpanded] = useState(false);

    // Auto-expand first few sets when element changes
    React.useEffect(() => {
        if (selectedElement) {
            const initial: Record<string, boolean> = { identity: true };
            selectedElement.propertySets.slice(0, 2).forEach(ps => {
                initial[ps.name] = true;
            });
            if (selectedElement.materials.length > 0) initial['materials'] = true;
            setExpandedSets(initial);
            setSearchQuery('');
        }
    }, [selectedElement]);

    const toggleSet = (name: string) => {
        setExpandedSets(prev => ({ ...prev, [name]: !prev[name] }));
    };

    const copyValue = (value: string) => {
        navigator.clipboard.writeText(value).then(() => {
            setCopyToast(value.length > 20 ? value.slice(0, 20) + '...' : value);
            setTimeout(() => setCopyToast(null), 1500);
        }).catch(() => { });
    };

    // Total property count
    const totalPropertyCount = useMemo(() => {
        if (!selectedElement) return 0;
        return selectedElement.propertySets.reduce((sum, ps) => sum + ps.properties.length, 0);
    }, [selectedElement]);

    // Toggle all expand/collapse
    const toggleAllSets = () => {
        if (!selectedElement) return;
        const next = !allExpanded;
        setAllExpanded(next);
        const newState: Record<string, boolean> = { identity: next };
        selectedElement.propertySets.forEach(ps => { newState[ps.name] = next; });
        if (selectedElement.materials.length > 0) newState['materials'] = next;
        setExpandedSets(newState);
    };

    // Export element properties as JSON
    const exportProperties = () => {
        if (!selectedElement) return;
        const data = {
            id: selectedElement.id,
            name: selectedElement.name,
            type: selectedElement.type,
            globalId: selectedElement.globalId,
            propertySets: selectedElement.propertySets,
            materials: selectedElement.materials,
            relations: selectedElement.relations,
            classifications: selectedElement.classifications,
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bim-properties-${selectedElement.type}-${selectedElement.id}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    // Filter properties by search
    const filteredPsets = useMemo(() => {
        if (!selectedElement || !searchQuery.trim()) return selectedElement?.propertySets || [];
        const q = searchQuery.toLowerCase();
        return selectedElement.propertySets
            .map(ps => ({
                ...ps,
                properties: ps.properties.filter(p =>
                    (p.name || '').toLowerCase().includes(q) || (p.value || '').toLowerCase().includes(q)
                )
            }))
            .filter(ps => ps.properties.length > 0 || ps.name.toLowerCase().includes(q));
    }, [selectedElement, searchQuery]);

    // Tab button
    const TabBtn: React.FC<{ tab: PropertiesTab; icon: React.ReactNode; label: string; count?: number }> = ({ tab, icon, label, count }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`
                flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all
                ${activeTab === tab
                    ? isDarkMode
                        ? 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30'
                        : 'bg-blue-50 text-blue-600 ring-1 ring-blue-200'
                    : isDarkMode ? 'text-slate-400 hover:text-slate-300 hover:bg-white/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }
            `}
        >
            {icon}
            <span>{label}</span>
            {count !== undefined && count > 0 && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono ${isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-gray-200 text-gray-500'}`}>
                    {count}
                </span>
            )}
        </button>
    );

    // Property row
    const PropRow: React.FC<{ name: string; value: string; isQuantity?: boolean }> = ({ name, value, isQuantity }) => (
        <div className={`flex justify-between items-start group py-1 px-0.5 rounded ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
            <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-500'} truncate max-w-[45%] flex items-center gap-1.5`} title={name}>
                {isQuantity && getQuantityIcon(name)}
                {searchQuery ? highlightMatch(name, searchQuery, isDarkMode) : name}
            </span>
            <div className="flex items-center gap-1">
                <span className={`text-xs ${isDarkMode ? 'text-slate-300' : 'text-gray-700'} truncate max-w-[140px] text-right font-mono`} title={isQuantity ? formatQuantityValue(name, value) : value}>
                    {isQuantity ? formatQuantityValue(name, value) : (searchQuery ? highlightMatch(value || '—', searchQuery, isDarkMode) : (value || '—'))}
                </span>
                <button
                    onClick={() => copyValue(isQuantity ? formatQuantityValue(name, value) : value)}
                    className={`p-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${isDarkMode ? 'text-slate-600 hover:text-slate-300' : 'text-gray-300 hover:text-gray-600'}`}
                    title="Copy"
                >
                    <Copy className="w-3 h-3" />
                </button>
            </div>
        </div>
    );

    return (
        <div className={`
            ${isBottomPanel ? 'w-full' : isMobile ? 'absolute inset-y-0 right-0 z-30 w-80' : 'w-full h-full'}
            ${isBottomPanel ? '' : isDarkMode ? 'bg-slate-800/95 border-slate-700/50' : 'bg-white border-gray-200'}
            flex flex-col shrink-0 ${isBottomPanel ? '' : 'backdrop-blur-xl'}
        `}>
            {/* Header — hidden in bottom panel mode */}
            {!isBottomPanel && (
                <div className={`p-3 border-b flex items-center justify-between ${isDarkMode ? 'border-slate-700/30' : 'border-gray-200'}`}>
                    <span className={`text-xs font-bold uppercase tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Properties</span>
                    <button onClick={onClose} className={`p-1 rounded-lg ${isDarkMode ? 'text-slate-500 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}>
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {selectedElement ? (
                <>
                    {/* Element Header */}
                    <div className={`p-3 ${isDarkMode ? 'bg-gradient-to-r from-blue-500/10 to-transparent border-b border-slate-700/30' : 'bg-gradient-to-r from-blue-50 to-transparent border-b border-gray-200'}`}>
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                                {selectedElement.type}
                            </span>
                            {selectedElement.spatialContainer && (
                                <span className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                                    @ {selectedElement.spatialContainer}
                                </span>
                            )}
                        </div>
                        <p className={`font-bold text-sm truncate ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{selectedElement.name}</p>
                    </div>

                    {/* Tabs + Actions */}
                    <div className={`flex items-center gap-1 p-2 border-b ${isDarkMode ? 'border-slate-700/30' : 'border-gray-200'}`}>
                        <TabBtn tab="properties" icon={<Layers className="w-3.5 h-3.5" />} label="Props" count={selectedElement.propertySets.length} />
                        <TabBtn tab="relations" icon={<Link2 className="w-3.5 h-3.5" />} label="Rels" count={selectedElement.relations?.length} />
                        <TabBtn tab="classification" icon={<Tag className="w-3.5 h-3.5" />} label="Class" count={selectedElement.classifications?.length} />
                        <div className="flex-1" />
                        {activeTab === 'properties' && (
                            <>
                                <button
                                    onClick={toggleAllSets}
                                    className={`p-1 rounded transition-colors ${isDarkMode ? 'text-slate-500 hover:text-slate-300 hover:bg-white/5' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                                    title={allExpanded ? 'Thu gọn tất cả' : 'Mở rộng tất cả'}
                                >
                                    <ChevronsUpDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={exportProperties}
                                    className={`p-1 rounded transition-colors ${isDarkMode ? 'text-slate-500 hover:text-slate-300 hover:bg-white/5' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                                    title="Export properties (JSON)"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Search (Properties tab only) */}
                    {activeTab === 'properties' && (
                        <div className={`p-2 border-b ${isDarkMode ? 'border-slate-700/30' : 'border-gray-200'}`}>
                            <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-100'}`}>
                                <Search className={`w-3.5 h-3.5 shrink-0 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`} />
                                <input
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search properties..."
                                    className={`flex-1 text-xs bg-transparent outline-none ${isDarkMode ? 'text-white placeholder:text-slate-500' : 'text-gray-800 placeholder:text-gray-400'}`}
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} className={`${isDarkMode ? 'text-slate-500 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600'}`}>
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto">
                        {activeTab === 'properties' && (
                            <div className={`divide-y ${isDarkMode ? 'divide-slate-700/30' : 'divide-gray-100'}`}>
                                {/* Identity */}
                                <div>
                                    <button onClick={() => toggleSet('identity')} className={`w-full p-3 flex items-center gap-2 transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                                        {expandedSets['identity'] ? <ChevronDown className="w-3.5 h-3.5 text-blue-400" /> : <ChevronRight className="w-3.5 h-3.5 text-blue-400" />}
                                        <Hash className="w-3.5 h-3.5 text-blue-400" />
                                        <span className={`text-[10px] font-bold uppercase tracking-wide ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>Identity</span>
                                    </button>
                                    {expandedSets['identity'] && (
                                        <div className="px-3 pb-3 space-y-0.5">
                                            <PropRow name="Express ID" value={selectedElement.id} />
                                            {selectedElement.globalId && <PropRow name="GlobalId" value={selectedElement.globalId} />}
                                            <PropRow name="IFC Type" value={selectedElement.type} />
                                            {selectedElement.typeInfo && <PropRow name="Type Name" value={selectedElement.typeInfo} />}
                                        </div>
                                    )}
                                </div>

                                {/* Property Sets */}
                                {filteredPsets.map(pset => {
                                    const isQty = isQuantitySet(pset.name);
                                    return (
                                        <div key={pset.name}>
                                            <button onClick={() => toggleSet(pset.name)} className={`w-full p-3 flex items-center justify-between transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                                                <div className="flex items-center gap-2">
                                                    {expandedSets[pset.name] ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
                                                    {isQty ? <Ruler className="w-3.5 h-3.5 text-cyan-400" /> : <Layers className="w-3.5 h-3.5 text-slate-500" />}
                                                    <span className={`text-[10px] font-bold uppercase tracking-wide truncate max-w-[150px] ${isQty ? (isDarkMode ? 'text-cyan-400' : 'text-cyan-600') : (isDarkMode ? 'text-slate-500' : 'text-gray-500')}`}>
                                                        {pset.name}
                                                    </span>
                                                </div>
                                                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-slate-700/40 text-slate-500' : 'bg-gray-100 text-gray-400'}`}>
                                                    {pset.properties.length}
                                                </span>
                                            </button>
                                            {expandedSets[pset.name] && (
                                                <div className="px-3 pb-3 space-y-0.5">
                                                    {pset.properties.map((prop, idx) => (
                                                        <PropRow key={`${pset.name}-${idx}`} name={prop.name} value={prop.value} isQuantity={isQty} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Materials */}
                                {selectedElement.materials.length > 0 && (
                                    <div>
                                        <button onClick={() => toggleSet('materials')} className={`w-full p-3 flex items-center gap-2 transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                                            {expandedSets['materials'] ? <ChevronDown className="w-3.5 h-3.5 text-amber-500" /> : <ChevronRight className="w-3.5 h-3.5 text-amber-500" />}
                                            <Box className="w-3.5 h-3.5 text-amber-500" />
                                            <span className={`text-[10px] font-bold uppercase tracking-wide ${isDarkMode ? 'text-amber-500' : 'text-amber-600'}`}>Materials</span>
                                            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-slate-700/40 text-slate-500' : 'bg-gray-100 text-gray-400'}`}>
                                                {selectedElement.materials.length}
                                            </span>
                                        </button>
                                        {expandedSets['materials'] && (
                                            <div className="px-3 pb-3 space-y-1.5">
                                                {selectedElement.materials.map((mat, idx) => (
                                                    <div key={idx} className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-sm bg-amber-500/30 border border-amber-500/50 shrink-0" />
                                                        <span className={`text-xs ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>{mat}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Empty filter state */}
                                {searchQuery && filteredPsets.length === 0 && (
                                    <div className="p-8 text-center">
                                        <Search className={`w-8 h-8 mx-auto mb-2 ${isDarkMode ? 'text-slate-600' : 'text-gray-300'}`} />
                                        <p className={`text-sm ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>No matching properties</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'relations' && (
                            <div className="p-3">
                                {selectedElement.relations && selectedElement.relations.length > 0 ? (
                                    <div className="space-y-2">
                                        {selectedElement.relations.map((rel, i) => (
                                            <button
                                                key={i}
                                                onClick={() => onHighlightElement?.(rel.targetId)}
                                                className={`
                                                    w-full text-left p-2.5 rounded-lg border transition-all
                                                    ${isDarkMode ? 'bg-slate-700/30 border-slate-700/50 hover:bg-slate-700/60' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}
                                                `}
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Link2 className="w-3 h-3 text-blue-400" />
                                                    <span className={`text-[10px] font-bold uppercase ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{rel.type}</span>
                                                </div>
                                                <p className={`text-xs truncate ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>{rel.targetName}</p>
                                                <p className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>{rel.targetType}</p>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <Link2 className={`w-8 h-8 mx-auto mb-2 ${isDarkMode ? 'text-slate-600' : 'text-gray-300'}`} />
                                        <p className={`text-sm ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>No relations found</p>
                                        <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-600' : 'text-gray-400'}`}>Relations require IFC data parsing</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'classification' && (
                            <div className="p-3">
                                {selectedElement.classifications && selectedElement.classifications.length > 0 ? (
                                    <div className="space-y-2">
                                        {selectedElement.classifications.map((cls, i) => (
                                            <div key={i} className={`p-2.5 rounded-lg border ${isDarkMode ? 'bg-slate-700/30 border-slate-700/50' : 'bg-gray-50 border-gray-200'}`}>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Tag className="w-3 h-3 text-purple-400" />
                                                    <span className={`text-[10px] font-bold uppercase ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>{cls.system}</span>
                                                </div>
                                                <p className={`text-xs font-mono ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>{cls.code}</p>
                                                <p className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>{cls.name}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <Tag className={`w-8 h-8 mx-auto mb-2 ${isDarkMode ? 'text-slate-600' : 'text-gray-300'}`} />
                                        <p className={`text-sm ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>No classifications</p>
                                        <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-600' : 'text-gray-400'}`}>Classification data from IFC</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </>
            ) : (
                /* Empty state */
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-100'}`}>
                        <Crosshair className={`w-8 h-8 ${isDarkMode ? 'text-slate-600' : 'text-gray-300'}`} />
                    </div>
                    <p className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>No element selected</p>
                    <p className={`text-xs ${isDarkMode ? 'text-slate-600' : 'text-gray-400'}`}>Click on a model element to<br />view its properties</p>
                </div>
            )}

            {/* Copy toast */}
            {copyToast && (
                <div className={`absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium shadow-lg transition-all animate-[fadeSlideIn_0.2s_ease-out] ${isDarkMode ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
                    <Check className="w-3 h-3" />
                    Copied!
                </div>
            )}
        </div>
    );
};
