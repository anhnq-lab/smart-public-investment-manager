/**
 * FacilityManagementPanel — Operations management asset list
 * Displays building assets/equipment with CRUD operations
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Plus, Search, X, Wrench, AlertTriangle, CheckCircle2,
    Trash2, Edit3, ChevronDown, Settings2, MapPin, Calendar,
    Package, Filter, XCircle, Save, Loader2, Download
} from 'lucide-react';
import {
    FacilityAsset, FacilityAssetInsert, FacilityAssetUpdate,
    ASSET_CATEGORIES,
    getProjectAssets, createAsset, updateAsset, deleteAsset
} from '../../../../lib/facilityAssetService';
import { useBimContext } from './context/BimContext';

// ── Types ────────────────────────────────────────────
type AssetStatus = FacilityAsset['status'];
type AssetCondition = FacilityAsset['condition'];

// ── Status config ────────────────────────────────────
const STATUS_CONFIG: Record<AssetStatus, { label: string; color: string; darkColor: string; icon: React.ReactNode }> = {
    Active: { label: 'Hoạt động', color: 'bg-emerald-100 text-emerald-700', darkColor: 'bg-emerald-500/20 text-emerald-400', icon: <CheckCircle2 className="w-3 h-3" /> },
    Maintenance: { label: 'Bảo trì', color: 'bg-amber-100 text-amber-700', darkColor: 'bg-amber-500/20 text-amber-400', icon: <Wrench className="w-3 h-3" /> },
    Broken: { label: 'Hỏng', color: 'bg-red-100 text-red-700', darkColor: 'bg-red-500/20 text-red-400', icon: <AlertTriangle className="w-3 h-3" /> },
    Retired: { label: 'Ngừng SD', color: 'bg-gray-100 text-gray-500', darkColor: 'bg-slate-600/30 text-slate-400', icon: <XCircle className="w-3 h-3" /> },
};

const CONDITION_CONFIG: Record<AssetCondition, { label: string; color: string; darkColor: string }> = {
    Good: { label: 'Tốt', color: 'text-emerald-600', darkColor: 'text-emerald-400' },
    Fair: { label: 'Khá', color: 'text-blue-600', darkColor: 'text-blue-400' },
    Poor: { label: 'Kém', color: 'text-amber-600', darkColor: 'text-amber-400' },
    Critical: { label: 'Nguy hiểm', color: 'text-red-600', darkColor: 'text-red-400' },
};

// ── Empty form defaults ──────────────────────────────
const EMPTY_FORM: Partial<FacilityAssetInsert> = {
    asset_name: '',
    asset_code: '',
    category: '',
    location: '',
    manufacturer: '',
    model: '',
    status: 'Active',
    condition: 'Good',
    notes: '',
    maintenance_cycle_days: null,
    bim_element_id: null,
};

// ── Component ────────────────────────────────────────
export const FacilityManagementPanel: React.FC = () => {
    const {
        projectID: projectId,
        isDarkMode,
        isMobile,
        opRefreshTrigger: refreshTrigger,
        handleExtractFromBIM: onExtractFromBIM,
        tools,
        selection,
        engine,
        upload
    } = useBimContext();

    const onLocationClick = useCallback(async (asset: FacilityAsset) => {
        if (!asset.bim_element_id) return;
        const expressId = parseInt(asset.bim_element_id, 10);
        if (isNaN(expressId)) return;

        console.log(`[FacilityMgmt] Navigating to expressId: ${expressId} (${asset.asset_name})`);

        try {
            // Step 1: Select element first (highlights + loads properties)
            tools.toggleRightPanel('properties');
            await selection.handleSelectElementFromTree(expressId);

            // Step 2: Zoom to the element (BEFORE isolate, so bounding box is computed with full materials)
            await engine.zoomToExpressId(expressId);

            // Step 3: Isolate the model containing this equipment (fade others)
            upload.isolateModelByExpressId(expressId);
        } catch (err) {
            console.warn('[FacilityMgmt] Error navigating to asset:', err);
        }
    }, [selection, engine, tools, upload]);
    const [assets, setAssets] = useState<FacilityAsset[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [extracting, setExtracting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingAsset, setEditingAsset] = useState<FacilityAsset | null>(null);
    const [form, setForm] = useState<Partial<FacilityAssetInsert>>(EMPTY_FORM);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // ── Load assets ──────────────────────────
    const loadAssets = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getProjectAssets(projectId);
            setAssets(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => { loadAssets(); }, [loadAssets, refreshTrigger]);

    // ── Filter assets ────────────────────────
    const filteredAssets = useMemo(() => {
        let result = assets;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(a =>
                a.asset_name.toLowerCase().includes(q) ||
                a.asset_code?.toLowerCase().includes(q) ||
                a.category?.toLowerCase().includes(q) ||
                a.location?.toLowerCase().includes(q)
            );
        }
        if (filterCategory) result = result.filter(a => a.category === filterCategory);
        if (filterStatus) result = result.filter(a => a.status === filterStatus);
        return result;
    }, [assets, searchQuery, filterCategory, filterStatus]);

    // ── Stats ────────────────────────────────
    const stats = useMemo(() => ({
        total: assets.length,
        active: assets.filter(a => a.status === 'Active').length,
        maintenance: assets.filter(a => a.status === 'Maintenance').length,
        broken: assets.filter(a => a.status === 'Broken').length,
    }), [assets]);

    // ── Form handlers ────────────────────────
    const openAddForm = () => {
        setEditingAsset(null);
        setForm({ ...EMPTY_FORM });
        setShowForm(true);
    };

    const openEditForm = (asset: FacilityAsset) => {
        setEditingAsset(asset);
        setForm({
            asset_name: asset.asset_name,
            asset_code: asset.asset_code || '',
            category: asset.category || '',
            location: asset.location || '',
            manufacturer: asset.manufacturer || '',
            model: asset.model || '',
            status: asset.status,
            condition: asset.condition,
            notes: asset.notes || '',
            maintenance_cycle_days: asset.maintenance_cycle_days,
            bim_element_id: asset.bim_element_id,
        });
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!form.asset_name?.trim()) return;
        setSaving(true);
        try {
            if (editingAsset) {
                const updates: FacilityAssetUpdate = { ...form };
                await updateAsset(editingAsset.asset_id, updates);
            } else {
                await createAsset({
                    ...form,
                    project_id: projectId,
                    asset_name: form.asset_name!,
                    status: (form.status as AssetStatus) || 'Active',
                    condition: (form.condition as AssetCondition) || 'Good',
                } as FacilityAssetInsert);
            }
            setShowForm(false);
            setEditingAsset(null);
            await loadAssets();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (assetId: string) => {
        if (!confirm('Bạn chắc chắn muốn xóa tài sản này? Thao tác không thể hoàn tác.')) return;
        try {
            await deleteAsset(assetId);
            await loadAssets();
            setSuccessMsg('Đã xóa tài sản');
            setTimeout(() => setSuccessMsg(null), 3000);
        } catch (err: any) {
            setError(err.message);
        }
    };

    // ── Format date ──────────────────────────
    const fmtDate = (d: string | null) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('vi-VN');
    };

    // ── Style helpers ────────────────────────
    const inputCls = `w-full px-3 py-2 text-xs rounded-lg border outline-none transition-colors ${isDarkMode
        ? 'bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500'
        : 'bg-white border-gray-300 text-gray-800 placeholder:text-gray-400 focus:border-blue-500'
        }`;

    const selectCls = `${inputCls} appearance-none`;

    // ── RENDER ────────────────────────────────
    return (
        <div className="w-full">
            {/* Error toast */}
            {error && (
                <div className="mx-4 mt-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError(null)}><X className="w-3 h-3" /></button>
                </div>
            )}
            {successMsg && (
                <div className={`mx-4 mt-2 px-3 py-2 rounded-lg text-xs flex items-center justify-between ${isDarkMode ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border border-emerald-200 text-emerald-600'}`}>
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" />{successMsg}</span>
                    <button onClick={() => setSuccessMsg(null)}><X className="w-3 h-3" /></button>
                </div>
            )}

            {/* Stats bar */}
            <div className={`flex items-center gap-3 px-3 py-1.5 text-[11px] font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                <span className="flex items-center gap-1.5">
                    <Package className={`w-3.5 h-3.5 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                    <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{stats.total}</span> tài sản
                </span>
                <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    {stats.active}
                </span>
                <span className="flex items-center gap-1">
                    <Wrench className="w-3 h-3 text-amber-500" />
                    {stats.maintenance}
                </span>
                {stats.broken > 0 && (
                    <span className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-red-500" />
                        {stats.broken}
                    </span>
                )}
                <div className="flex-1" />
                {onExtractFromBIM && (
                    <button
                        onClick={async () => {
                            if (extracting) return;
                            setExtracting(true);
                            setError(null);
                            setSuccessMsg(null);
                            try {
                                const count = await onExtractFromBIM();
                                if (count > 0) {
                                    await loadAssets();
                                    setSuccessMsg(`Đã tìm thấy và lưu ${count} tài sản từ mô hình BIM`);
                                    setTimeout(() => setSuccessMsg(null), 5000);
                                } else {
                                    setSuccessMsg('Không tìm thấy thiết bị mới (có thể đã quét trước đó)');
                                    setTimeout(() => setSuccessMsg(null), 4000);
                                }
                            } catch (err: any) {
                                setError(`Lỗi: ${err.message}`);
                            } finally {
                                setExtracting(false);
                            }
                        }}
                        disabled={extracting}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors mr-1.5 ${extracting
                            ? 'opacity-50 cursor-wait'
                            : isDarkMode
                                ? 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30'
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                            }`}
                        title="Quét thiết bị từ mô hình IFC đã tải"
                    >
                        {extracting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                        {extracting ? 'Đang quét...' : 'Quét từ BIM'}
                    </button>
                )}
                <button
                    onClick={openAddForm}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-[11px] font-bold transition-colors"
                >
                    <Plus className="w-3 h-3" /> Thêm tài sản
                </button>
            </div>

            {/* Search & Filters */}
            <div className={`flex items-center gap-2 px-3 pb-1.5 ${isMobile ? 'flex-wrap' : ''}`}>
                <div className={`flex items-center gap-2 flex-1 min-w-[160px] px-2.5 py-1.5 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-100'}`}>
                    <Search className={`w-3.5 h-3.5 shrink-0 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`} />
                    <input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Tìm tài sản..."
                        className={`flex-1 text-xs bg-transparent outline-none ${isDarkMode ? 'text-white placeholder:text-slate-500' : 'text-gray-800 placeholder:text-gray-400'}`}
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className={isDarkMode ? 'text-slate-500 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600'}>
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>
                <select
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                    className={`text-xs px-2 py-1.5 rounded-lg border ${isDarkMode ? 'bg-slate-700/50 border-slate-600 text-slate-300' : 'bg-white border-gray-200 text-gray-600'}`}
                >
                    <option value="">Tất cả loại</option>
                    {ASSET_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className={`text-xs px-2 py-1.5 rounded-lg border ${isDarkMode ? 'bg-slate-700/50 border-slate-600 text-slate-300' : 'bg-white border-gray-200 text-gray-600'}`}
                >
                    <option value="">Tất cả TT</option>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className={`w-5 h-5 animate-spin ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                </div>
            )}

            {/* Asset table */}
            {!loading && (
                <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar">
                    <table className="w-full text-[11px]">
                        <thead className={`sticky top-0 z-10 ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
                            <tr className={isDarkMode ? 'text-slate-500' : 'text-gray-400'}>
                                <th className="text-left px-3 py-1.5 font-semibold bg-inherit">Mã TS</th>
                                <th className="text-left px-3 py-1.5 font-semibold bg-inherit">Tên tài sản</th>
                                <th className="text-left px-3 py-1.5 font-semibold bg-inherit">Phân loại</th>
                                <th className="text-left px-3 py-1.5 font-semibold bg-inherit">Vị trí</th>
                                <th className="text-left px-3 py-1.5 font-semibold bg-inherit">Trạng thái</th>
                                <th className="text-left px-3 py-1.5 font-semibold bg-inherit">Tình trạng</th>
                                <th className="text-left px-3 py-1.5 font-semibold bg-inherit">Bảo trì kế tiếp</th>
                                <th className="px-3 py-1.5 bg-inherit"></th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700/30' : 'divide-gray-100'}`}>
                            {filteredAssets.map(asset => {
                                const sc = STATUS_CONFIG[asset.status];
                                const cc = CONDITION_CONFIG[asset.condition];
                                return (
                                    <tr
                                        key={asset.asset_id}
                                        className={`transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
                                    >
                                        <td className={`px-3 py-1.5 font-mono ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                            {asset.asset_code || '—'}
                                        </td>
                                        <td className={`px-3 py-1.5 font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                            {asset.asset_name}
                                            {asset.manufacturer && (
                                                <span className={`ml-1.5 text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                                                    ({asset.manufacturer}{asset.model ? ` ${asset.model}` : ''})
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-3 py-1.5">
                                            {asset.category ? (
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${isDarkMode ? 'bg-slate-700/50 text-slate-300' : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    <Settings2 className="w-2.5 h-2.5" />
                                                    {asset.category}
                                                </span>
                                            ) : '—'}
                                        </td>
                                        <td className={`px-3 py-1.5 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                            {asset.location ? (
                                                asset.bim_element_id && onLocationClick ? (
                                                    <button
                                                        onClick={() => onLocationClick(asset)}
                                                        className={`flex items-center gap-1 hover:underline transition-colors ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                                                            }`}
                                                        title="Xem vị trí trên mô hình BIM"
                                                    >
                                                        <MapPin className="w-3 h-3" />
                                                        {asset.location}
                                                    </button>
                                                ) : (
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="w-3 h-3" />
                                                        {asset.location}
                                                    </span>
                                                )
                                            ) : '—'}
                                        </td>
                                        <td className="px-3 py-1.5">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${isDarkMode ? sc.darkColor : sc.color}`}>
                                                {sc.icon} {sc.label}
                                            </span>
                                        </td>
                                        <td className={`px-3 py-1.5 text-[10px] font-medium ${isDarkMode ? cc.darkColor : cc.color}`}>
                                            {cc.label}
                                        </td>
                                        <td className={`px-3 py-1.5 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                            {asset.next_maintenance ? (
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {fmtDate(asset.next_maintenance)}
                                                </span>
                                            ) : '—'}
                                        </td>
                                        <td className="px-3 py-1.5">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => openEditForm(asset)}
                                                    className={`p-1 rounded transition-colors ${isDarkMode ? 'text-slate-500 hover:text-blue-400 hover:bg-blue-500/10' : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'}`}
                                                    title="Sửa"
                                                >
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(asset.asset_id)}
                                                    className={`p-1 rounded transition-colors ${isDarkMode ? 'text-slate-500 hover:text-red-400 hover:bg-red-500/10' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
                                                    title="Xóa"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {/* Empty state */}
                    {filteredAssets.length === 0 && !loading && (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-100'}`}>
                                <Package className={`w-6 h-6 ${isDarkMode ? 'text-slate-600' : 'text-gray-300'}`} />
                            </div>
                            <p className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                {assets.length === 0 ? 'Chưa có tài sản' : 'Không tìm thấy'}
                            </p>
                            <p className={`text-xs mb-3 ${isDarkMode ? 'text-slate-600' : 'text-gray-400'}`}>
                                {assets.length === 0
                                    ? (onExtractFromBIM
                                        ? 'Bấm "Quét từ BIM" để tự động trích xuất thiết bị từ mô hình IFC'
                                        : 'Tải mô hình IFC trước, sau đó quét thiết bị từ BIM'
                                    )
                                    : 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
                                }
                            </p>
                            <div className="flex items-center gap-2">
                                {assets.length === 0 && onExtractFromBIM && (
                                    <button
                                        onClick={async () => {
                                            if (extracting) return;
                                            setExtracting(true);
                                            setSuccessMsg(null);
                                            try {
                                                const count = await onExtractFromBIM();
                                                if (count > 0) {
                                                    await loadAssets();
                                                    setSuccessMsg(`Đã trích xuất ${count} tài sản từ BIM`);
                                                    setTimeout(() => setSuccessMsg(null), 5000);
                                                }
                                            } catch { /* ignore */ }
                                            finally { setExtracting(false); }
                                        }}
                                        disabled={extracting}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isDarkMode
                                            ? 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30'
                                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                                            }`}
                                    >
                                        {extracting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                                        {extracting ? 'Đang quét...' : 'Quét từ BIM'}
                                    </button>
                                )}
                                {assets.length === 0 && (
                                    <button
                                        onClick={openAddForm}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-colors"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Thêm thủ công
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Add/Edit Modal */}
            {showForm && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className={`w-full max-w-lg mx-4 rounded-2xl shadow-2xl border overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
                        }`}>
                        {/* Modal header */}
                        <div className={`flex items-center justify-between px-5 py-3.5 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                            <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                {editingAsset ? 'Chỉnh sửa tài sản' : 'Thêm tài sản mới'}
                            </h3>
                            <button onClick={() => setShowForm(false)} className={`p-1 rounded-lg ${isDarkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-gray-400 hover:bg-gray-100'}`}>
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Modal body */}
                        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
                            {/* Row 1: Code + Name */}
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className={`block text-[10px] font-bold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Mã tài sản</label>
                                    <input
                                        value={form.asset_code || ''}
                                        onChange={e => setForm(f => ({ ...f, asset_code: e.target.value }))}
                                        placeholder="VD: TB-001"
                                        className={inputCls}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className={`block text-[10px] font-bold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                        Tên tài sản <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        value={form.asset_name || ''}
                                        onChange={e => setForm(f => ({ ...f, asset_name: e.target.value }))}
                                        placeholder="VD: Thang máy số 1"
                                        className={inputCls}
                                    />
                                </div>
                            </div>

                            {/* Row 2: Category + Location */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={`block text-[10px] font-bold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Phân loại</label>
                                    <select
                                        value={form.category || ''}
                                        onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                        className={selectCls}
                                    >
                                        <option value="">Chọn phân loại</option>
                                        {ASSET_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={`block text-[10px] font-bold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Vị trí</label>
                                    <input
                                        value={form.location || ''}
                                        onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                                        placeholder="VD: Tầng 1 - Sảnh chính"
                                        className={inputCls}
                                    />
                                </div>
                            </div>

                            {/* Row 3: Manufacturer + Model */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={`block text-[10px] font-bold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Nhà sản xuất</label>
                                    <input
                                        value={form.manufacturer || ''}
                                        onChange={e => setForm(f => ({ ...f, manufacturer: e.target.value }))}
                                        placeholder="VD: Mitsubishi"
                                        className={inputCls}
                                    />
                                </div>
                                <div>
                                    <label className={`block text-[10px] font-bold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Model</label>
                                    <input
                                        value={form.model || ''}
                                        onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
                                        placeholder="VD: NEXIEZ-LITE"
                                        className={inputCls}
                                    />
                                </div>
                            </div>

                            {/* Row 4: Status + Condition */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={`block text-[10px] font-bold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Trạng thái</label>
                                    <select
                                        value={form.status || 'Active'}
                                        onChange={e => setForm(f => ({ ...f, status: e.target.value as AssetStatus }))}
                                        className={selectCls}
                                    >
                                        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                                            <option key={k} value={k}>{v.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className={`block text-[10px] font-bold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Tình trạng</label>
                                    <select
                                        value={form.condition || 'Good'}
                                        onChange={e => setForm(f => ({ ...f, condition: e.target.value as AssetCondition }))}
                                        className={selectCls}
                                    >
                                        {Object.entries(CONDITION_CONFIG).map(([k, v]) => (
                                            <option key={k} value={k}>{v.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Row 5: Maintenance cycle */}
                            <div>
                                <label className={`block text-[10px] font-bold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Chu kỳ bảo trì (ngày)</label>
                                <input
                                    type="number"
                                    value={form.maintenance_cycle_days || ''}
                                    onChange={e => setForm(f => ({ ...f, maintenance_cycle_days: e.target.value ? parseInt(e.target.value) : null }))}
                                    placeholder="VD: 90"
                                    className={inputCls}
                                />
                            </div>

                            {/* Row 6: Notes */}
                            <div>
                                <label className={`block text-[10px] font-bold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Ghi chú</label>
                                <textarea
                                    value={form.notes || ''}
                                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                    rows={2}
                                    placeholder="Ghi chú thêm..."
                                    className={inputCls}
                                />
                            </div>
                        </div>

                        {/* Modal footer */}
                        <div className={`flex items-center justify-end gap-2 px-5 py-3 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                            <button
                                onClick={() => setShowForm(false)}
                                className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${isDarkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-gray-500 hover:bg-gray-100'
                                    }`}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !form.asset_name?.trim()}
                                className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors"
                            >
                                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                {editingAsset ? 'Cập nhật' : 'Thêm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
