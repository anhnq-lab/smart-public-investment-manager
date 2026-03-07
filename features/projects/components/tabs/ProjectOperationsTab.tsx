/**
 * ProjectOperationsTab — Full-page Operations Management dashboard
 * Inspired by Autodesk Tandem Twin Operator workflow
 *
 * Features:
 * - Dashboard KPI cards (total assets, status breakdown, maintenance alerts)
 * - Asset charts (by category, by status, by floor)
 * - Full asset inventory table with filters and grouping
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../../../../context/ThemeContext';
import {
    Building2, Wrench, AlertTriangle, CheckCircle2, XCircle,
    Search, Filter, ChevronDown, ChevronRight, ArrowUpDown,
    Calendar, Shield, Package, Layers, BarChart3, PieChart,
    Clock, TrendingUp, RefreshCw, Download, FileText, ClipboardList
} from 'lucide-react';
import {
    FacilityAsset,
    getProjectAssets,
    ASSET_CATEGORIES
} from '../../../../lib/facilityAssetService';

interface Props {
    projectID: string;
}

// ── Status / Condition config ──
const STATUS_CONFIG = {
    Active: { label: 'Hoạt động', color: 'emerald', icon: CheckCircle2 },
    Maintenance: { label: 'Bảo trì', color: 'amber', icon: Wrench },
    Broken: { label: 'Hỏng', color: 'red', icon: XCircle },
    Retired: { label: 'Ngừng SD', color: 'gray', icon: Package },
} as const;

const CONDITION_CONFIG = {
    Good: { label: 'Tốt', color: 'emerald' },
    Fair: { label: 'Khá', color: 'blue' },
    Poor: { label: 'Kém', color: 'amber' },
    Critical: { label: 'Nguy hiểm', color: 'red' },
} as const;

// ── Simple bar chart component ──
const MiniBar: React.FC<{ label: string; value: number; max: number; color: string; isDark: boolean }> = ({ label, value, max, color, isDark }) => (
    <div className="flex items-center gap-2 text-xs">
        <span className={`w-20 truncate ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{label}</span>
        <div className={`flex-1 h-4 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
            <div
                className={`h-full rounded-full bg-${color}-500 transition-all duration-500`}
                style={{ width: max > 0 ? `${(value / max) * 100}%` : '0%' }}
            />
        </div>
        <span className={`w-6 text-right font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{value}</span>
    </div>
);

export const ProjectOperationsTab: React.FC<Props> = ({ projectID }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [assets, setAssets] = useState<FacilityAsset[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [groupBy, setGroupBy] = useState<'none' | 'category' | 'location' | 'status'>('category');
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    // ── Fetch assets ──
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            try {
                const data = await getProjectAssets(projectID);
                if (!cancelled) setAssets(data);
            } catch (err) {
                console.error('Failed to load assets:', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [projectID]);

    // ── Derived stats ──
    const stats = useMemo(() => {
        const total = assets.length;
        const byStatus = { Active: 0, Maintenance: 0, Broken: 0, Retired: 0 };
        const byCategory: Record<string, number> = {};
        const byLocation: Record<string, number> = {};
        let hasBim = 0;
        let warrantyExpiringSoon = 0;
        let maintenanceOverdue = 0;
        const now = new Date();

        assets.forEach(a => {
            byStatus[a.status] = (byStatus[a.status] || 0) + 1;
            if (a.category) byCategory[a.category] = (byCategory[a.category] || 0) + 1;
            if (a.location) byLocation[a.location] = (byLocation[a.location] || 0) + 1;
            if (a.bim_element_id) hasBim++;
            if (a.warranty_expiry) {
                const exp = new Date(a.warranty_expiry);
                const daysLeft = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
                if (daysLeft > 0 && daysLeft < 90) warrantyExpiringSoon++;
            }
            if (a.next_maintenance) {
                const nm = new Date(a.next_maintenance);
                if (nm < now) maintenanceOverdue++;
            }
        });

        return { total, byStatus, byCategory, byLocation, hasBim, warrantyExpiringSoon, maintenanceOverdue };
    }, [assets]);

    // ── Filtered + grouped assets ──
    const filteredAssets = useMemo(() => {
        return assets.filter(a => {
            if (statusFilter !== 'all' && a.status !== statusFilter) return false;
            if (categoryFilter !== 'all' && a.category !== categoryFilter) return false;
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                return (
                    a.asset_name.toLowerCase().includes(q) ||
                    (a.asset_code || '').toLowerCase().includes(q) ||
                    (a.location || '').toLowerCase().includes(q) ||
                    (a.manufacturer || '').toLowerCase().includes(q)
                );
            }
            return true;
        });
    }, [assets, statusFilter, categoryFilter, searchQuery]);

    const groupedAssets = useMemo(() => {
        if (groupBy === 'none') return { 'Tất cả': filteredAssets };
        const groups: Record<string, FacilityAsset[]> = {};
        filteredAssets.forEach(a => {
            const key = groupBy === 'category' ? (a.category || 'Khác')
                : groupBy === 'location' ? (a.location || 'Không xác định')
                    : a.status;
            if (!groups[key]) groups[key] = [];
            groups[key].push(a);
        });
        return groups;
    }, [filteredAssets, groupBy]);

    // Toggle group expand
    const toggleGroup = (key: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    };

    // Expand all by default
    useEffect(() => {
        setExpandedGroups(new Set(Object.keys(groupedAssets)));
    }, [groupBy, Object.keys(groupedAssets).join(',')]);

    const categoryValues = Object.values(stats.byCategory) as number[];
    const maxCategory = Math.max(...categoryValues, 1);

    // ── Maintenance timeline ──
    const maintenanceTimeline = useMemo(() => {
        const now = new Date();
        const items: { asset: FacilityAsset; date: Date; overdue: boolean; daysUntil: number }[] = [];
        assets.forEach(a => {
            if (a.next_maintenance) {
                const d = new Date(a.next_maintenance);
                const daysUntil = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                items.push({ asset: a, date: d, overdue: daysUntil < 0, daysUntil });
            }
        });
        return items.sort((a, b) => a.date.getTime() - b.date.getTime());
    }, [assets]);

    // ── RENDER ──
    return (
        <div className={`h-full overflow-y-auto ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}>
            <div className="max-w-[1400px] mx-auto p-6 space-y-6">
                {/* ── Header ── */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            <Building2 className="w-5 h-5 text-emerald-500" />
                            Quản lý vận hành
                        </h1>
                        <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                            Tổng quan tài sản và thiết bị tòa nhà
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => window.location.reload()}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors
                                ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700' : 'bg-white hover:bg-gray-50 text-gray-600 border border-gray-200'}
                            `}
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Làm mới
                        </button>
                    </div>
                </div>

                {/* ── KPI Cards ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Total assets */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 shadow-xl ring-1 ring-white/10 hover:scale-[1.02] hover:shadow-2xl transition-all duration-200">
                        <Package className="absolute -right-3 -top-3 w-20 h-20 text-white opacity-[0.12]" />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-white/90">Tổng tài sản</span>
                                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center"><Package className="w-4 h-4 text-white" /></div>
                            </div>
                            <div className="text-3xl font-black tracking-tight text-white drop-shadow-sm">{stats.total}</div>
                            <div className="text-[10px] mt-1 text-white/80">{stats.hasBim} đã gắn BIM</div>
                        </div>
                    </div>

                    {/* Active */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 shadow-xl ring-1 ring-white/10 hover:scale-[1.02] hover:shadow-2xl transition-all duration-200">
                        <CheckCircle2 className="absolute -right-3 -top-3 w-20 h-20 text-white opacity-[0.12]" />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-white/90">Hoạt động</span>
                                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-white" /></div>
                            </div>
                            <div className="text-3xl font-black tracking-tight text-white drop-shadow-sm">{stats.byStatus.Active}</div>
                            <div className="text-[10px] mt-1 text-white/80">{stats.total > 0 ? Math.round((stats.byStatus.Active / stats.total) * 100) : 0}% tổng số</div>
                        </div>
                    </div>

                    {/* Maintenance overdue */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 shadow-xl ring-1 ring-white/10 hover:scale-[1.02] hover:shadow-2xl transition-all duration-200">
                        <AlertTriangle className="absolute -right-3 -top-3 w-20 h-20 text-white opacity-[0.12]" />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-white/90">Quá hạn bảo trì</span>
                                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center"><AlertTriangle className="w-4 h-4 text-white" /></div>
                            </div>
                            <div className="text-3xl font-black tracking-tight text-white drop-shadow-sm">{stats.maintenanceOverdue}</div>
                            <div className="text-[10px] mt-1 text-white/80">Cần xử lý ngay</div>
                        </div>
                    </div>

                    {/* Warranty expiring */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-5 shadow-xl ring-1 ring-white/10 hover:scale-[1.02] hover:shadow-2xl transition-all duration-200">
                        <Shield className="absolute -right-3 -top-3 w-20 h-20 text-white opacity-[0.12]" />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-white/90">Sắp hết bảo hành</span>
                                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center"><Shield className="w-4 h-4 text-white" /></div>
                            </div>
                            <div className="text-3xl font-black tracking-tight text-white drop-shadow-sm">{stats.warrantyExpiringSoon}</div>
                            <div className="text-[10px] mt-1 text-white/80">Trong 90 ngày tới</div>
                        </div>
                    </div>
                </div>

                {/* ── Charts Row ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Chart: By Category */}
                    <div className={`rounded-xl p-4 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} shadow-sm`}>
                        <div className="flex items-center gap-2 mb-3">
                            <BarChart3 className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
                            <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>Theo danh mục</span>
                        </div>
                        <div className="space-y-2">
                            {Object.entries(stats.byCategory).length > 0 ? (
                                Object.entries(stats.byCategory)
                                    .sort(([, a], [, b]) => (b as number) - (a as number))
                                    .map(([cat, count]) => (
                                        <MiniBar key={cat} label={cat} value={count as number} max={maxCategory} color="blue" isDark={isDark} />
                                    ))
                            ) : (
                                <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Chưa có dữ liệu</p>
                            )}
                        </div>
                    </div>

                    {/* Chart: By Status */}
                    <div className={`rounded-xl p-4 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} shadow-sm`}>
                        <div className="flex items-center gap-2 mb-3">
                            <PieChart className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-500'}`} />
                            <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>Theo trạng thái</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                                const count = stats.byStatus[key as keyof typeof stats.byStatus] || 0;
                                const Icon = cfg.icon;
                                return (
                                    <div key={key} className={`flex items-center gap-2 p-2 rounded-lg ${isDark ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
                                        <Icon className={`w-4 h-4 text-${cfg.color}-500`} />
                                        <div>
                                            <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{count}</div>
                                            <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{cfg.label}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ── Maintenance Timeline ── */}
                <div className={`rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} shadow-sm overflow-hidden`}>
                    <div className={`px-4 py-3 border-b flex items-center justify-between ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
                        <div className="flex items-center gap-2">
                            <Calendar className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
                            <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>Lịch bảo trì</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-gray-100 text-gray-500'}`}>
                                {maintenanceTimeline.length} mục
                            </span>
                        </div>
                    </div>
                    <div className="max-h-[280px] overflow-y-auto">
                        {maintenanceTimeline.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-2">
                                <Calendar className={`w-6 h-6 ${isDark ? 'text-slate-600' : 'text-gray-300'}`} />
                                <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Chưa có lịch bảo trì</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-800/30">
                                {maintenanceTimeline.map((item, idx) => (
                                    <div
                                        key={item.asset.asset_id}
                                        className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${isDark ? 'hover:bg-slate-800/30' : 'hover:bg-blue-50/30'}`}
                                    >
                                        {/* Timeline dot */}
                                        <div className="flex flex-col items-center gap-0.5 shrink-0">
                                            <div className={`w-2.5 h-2.5 rounded-full ${item.overdue ? 'bg-red-500 animate-pulse'
                                                : item.daysUntil <= 7 ? 'bg-amber-500'
                                                    : item.daysUntil <= 30 ? 'bg-blue-500'
                                                        : 'bg-emerald-500'
                                                }`} />
                                            {idx < maintenanceTimeline.length - 1 && (
                                                <div className={`w-px h-3 ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`} />
                                            )}
                                        </div>
                                        {/* Date */}
                                        <div className="w-20 shrink-0">
                                            <div className={`text-xs font-bold ${item.overdue ? 'text-red-500' : isDark ? 'text-slate-200' : 'text-gray-800'}`}>
                                                {item.date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                                            </div>
                                            <div className={`text-[10px] ${item.overdue ? 'text-red-400 font-semibold'
                                                : item.daysUntil <= 7 ? 'text-amber-500'
                                                    : isDark ? 'text-slate-500' : 'text-gray-400'
                                                }`}>
                                                {item.overdue ? `Quá ${Math.abs(item.daysUntil)} ngày` : item.daysUntil === 0 ? 'Hôm nay' : `${item.daysUntil} ngày nữa`}
                                            </div>
                                        </div>
                                        {/* Asset info */}
                                        <div className="flex-1 min-w-0">
                                            <div className={`text-xs font-medium truncate ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
                                                {item.asset.asset_name}
                                            </div>
                                            <div className={`text-[10px] truncate ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                                                {item.asset.category && <span>{item.asset.category}</span>}
                                                {item.asset.location && <span> · {item.asset.location}</span>}
                                            </div>
                                        </div>
                                        {/* Status badge */}
                                        {item.overdue && (
                                            <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-500">
                                                <AlertTriangle className="w-3 h-3" /> Quá hạn
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Asset Inventory ── */}
                <div className={`rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} shadow-sm overflow-hidden`}>
                    {/* Inventory header — sticky */}
                    <div className={`px-4 py-3 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-3 sticky top-0 z-10
                        ${isDark ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'}
                    `}>
                        <div className="flex items-center gap-2">
                            <Layers className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-500'}`} />
                            <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                Danh sách tài sản
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-gray-100 text-gray-500'}`}>
                                {filteredAssets.length} / {stats.total}
                            </span>
                        </div>

                        {/* Filters */}
                        <div className="flex items-center gap-2 flex-wrap">
                            {/* Search */}
                            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border
                                ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-gray-200 text-gray-600'}
                            `}>
                                <Search className="w-3.5 h-3.5 opacity-50" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="bg-transparent outline-none w-32 placeholder-current opacity-60"
                                />
                            </div>

                            {/* Status filter */}
                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs border cursor-pointer
                                    ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-gray-200 text-gray-600'}
                                `}
                            >
                                <option value="all">Tất cả trạng thái</option>
                                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                    <option key={key} value={key}>{cfg.label}</option>
                                ))}
                            </select>

                            {/* Category filter */}
                            <select
                                value={categoryFilter}
                                onChange={e => setCategoryFilter(e.target.value)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs border cursor-pointer
                                    ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-gray-200 text-gray-600'}
                                `}
                            >
                                <option value="all">Tất cả danh mục</option>
                                {ASSET_CATEGORIES.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>

                            {/* Group by */}
                            <select
                                value={groupBy}
                                onChange={e => setGroupBy(e.target.value as any)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs border cursor-pointer
                                    ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-gray-200 text-gray-600'}
                                `}
                            >
                                <option value="none">Không nhóm</option>
                                <option value="category">Nhóm theo danh mục</option>
                                <option value="location">Nhóm theo vị trí</option>
                                <option value="status">Nhóm theo trạng thái</option>
                            </select>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-16">
                                <RefreshCw className={`w-6 h-6 animate-spin ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                            </div>
                        ) : filteredAssets.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-2">
                                <Package className={`w-8 h-8 ${isDark ? 'text-slate-600' : 'text-gray-300'}`} />
                                <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                                    {assets.length === 0 ? 'Chưa có tài sản nào' : 'Không tìm thấy tài sản phù hợp'}
                                </p>
                            </div>
                        ) : (
                            <table className="w-full text-xs">
                                <thead className="sticky top-0 z-[5]">
                                    <tr className={isDark ? 'bg-slate-800' : 'bg-gray-50'}>
                                        <th className={`px-3 py-2 text-left font-bold ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Mã TS</th>
                                        <th className={`px-3 py-2 text-left font-bold ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Tên tài sản</th>
                                        <th className={`px-3 py-2 text-left font-bold ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Danh mục</th>
                                        <th className={`px-3 py-2 text-left font-bold ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Vị trí</th>
                                        <th className={`px-3 py-2 text-left font-bold ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Trạng thái</th>
                                        <th className={`px-3 py-2 text-left font-bold ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Tình trạng</th>
                                        <th className={`px-3 py-2 text-left font-bold ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Bảo trì tiếp</th>
                                        <th className={`px-3 py-2 text-left font-bold ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Ghi chú</th>
                                        <th className={`px-3 py-2 text-left font-bold ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>BIM</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(groupedAssets).map(([group, items]: [string, FacilityAsset[]]) => (
                                        <React.Fragment key={group}>
                                            {/* Group header */}
                                            {groupBy !== 'none' && (
                                                <tr
                                                    className={`cursor-pointer ${isDark ? 'bg-slate-800/30 hover:bg-slate-800/50' : 'bg-gray-50 hover:bg-gray-100'}`}
                                                    onClick={() => toggleGroup(group)}
                                                >
                                                    <td colSpan={9} className={`px-3 py-2 font-bold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                                                        <div className="flex items-center gap-1.5">
                                                            {expandedGroups.has(group) ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                                            {group}
                                                            <span className={`ml-1 text-[10px] font-normal ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                                                                ({items.length})
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                            {/* Items */}
                                            {(groupBy === 'none' || expandedGroups.has(group)) && items.map((a: FacilityAsset) => {
                                                const statusCfg = STATUS_CONFIG[a.status];
                                                const condCfg = CONDITION_CONFIG[a.condition];
                                                const isOverdue = a.next_maintenance && new Date(a.next_maintenance) < new Date();
                                                return (
                                                    <tr
                                                        key={a.asset_id}
                                                        className={`border-t transition-colors ${isDark ? 'border-slate-800/50 hover:bg-slate-800/30' : 'border-gray-50 hover:bg-blue-50/30'}`}
                                                    >
                                                        <td className={`px-3 py-2 font-mono ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                                            {a.asset_code || '—'}
                                                        </td>
                                                        <td className={`px-3 py-2 font-medium ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
                                                            {a.asset_name}
                                                            {a.manufacturer && (
                                                                <span className={`ml-1.5 text-[10px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                                                                    {a.manufacturer}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className={`px-3 py-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                                            {a.category || '—'}
                                                        </td>
                                                        <td className={`px-3 py-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                                            {a.location || '—'}
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-${statusCfg.color}-500/10 text-${statusCfg.color}-500`}>
                                                                <statusCfg.icon className="w-3 h-3" />
                                                                {statusCfg.label}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded bg-${condCfg.color}-500/10 text-${condCfg.color}-500`}>
                                                                {condCfg.label}
                                                            </span>
                                                        </td>
                                                        <td className={`px-3 py-2 ${isOverdue ? 'text-red-500 font-semibold' : isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                                            {a.next_maintenance
                                                                ? new Date(a.next_maintenance).toLocaleDateString('vi-VN')
                                                                : '—'}
                                                            {isOverdue && <AlertTriangle className="w-3 h-3 inline ml-1" />}
                                                        </td>
                                                        <td className={`px-3 py-2 max-w-[120px] ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                                            {a.notes ? (
                                                                <span className="flex items-center gap-1 truncate" title={a.notes}>
                                                                    <FileText className="w-3 h-3 shrink-0" />
                                                                    <span className="truncate text-[10px]">{a.notes}</span>
                                                                </span>
                                                            ) : '—'}
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            {a.bim_element_id ? (
                                                                <span className="text-emerald-500 text-[10px] font-bold">Có</span>
                                                            ) : (
                                                                <span className={`text-[10px] ${isDark ? 'text-slate-600' : 'text-gray-300'}`}>—</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
