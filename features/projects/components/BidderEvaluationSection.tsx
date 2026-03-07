import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Search, Plus, X, Users, Loader2, Building2, Save, Upload,
    FileText, Trophy, Medal, Hash, Banknote, BarChart3, AlertCircle, Check, Trash2
} from 'lucide-react';
import { Contractor } from '../../../types';
import { useContractors } from '../../../hooks/useContractors';
import { supabase } from '../../../lib/supabase';
import { formatCurrency } from '../../../utils/format';

// ========================================
// BIDDER & EVALUATION SECTION
// "Nhà thầu tham gia" + "Đánh giá HSDT" combined
// ========================================

interface Bidder {
    id?: string;
    contractor_id: string;
    contractor?: Contractor;
    bid_price?: number;
    technical_score?: number;
    financial_score?: number;
    combined_score?: number;
    rank?: number;
    status: string;
    evaluation_file_url?: string;
    evaluation_file_name?: string;
    notes?: string;
}

interface BidderEvaluationSectionProps {
    packageId: string;
}

// ────────────────────────────────────────
// 1) SECTION: Nhà thầu tham gia
// ────────────────────────────────────────
export const BidderListSection: React.FC<BidderEvaluationSectionProps> = ({ packageId }) => {
    const queryClient = useQueryClient();
    const { contractors } = useContractors();
    const [isAdding, setIsAdding] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [editingBidder, setEditingBidder] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch bidders
    const { data: bidders = [], isLoading } = useQuery({
        queryKey: ['package-bidders', packageId],
        queryFn: async () => {
            // @ts-ignore
            const { data, error } = await (supabase as any)
                .from('package_bidders')
                .select('*')
                .eq('package_id', packageId)
                .order('rank', { ascending: true, nullsFirst: false });
            if (error) throw error;
            return (data || []).map((b: any) => ({
                ...b,
                contractor: contractors.find((c: Contractor) => c.ContractorID === b.contractor_id),
            })) as Bidder[];
        },
        enabled: contractors.length > 0,
    });

    // Add bidder mutation
    const addMutation = useMutation({
        mutationFn: async (contractorId: string) => {
            // @ts-ignore
            const { error } = await (supabase as any)
                .from('package_bidders')
                .insert({ package_id: packageId, contractor_id: contractorId, status: 'submitted' });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['package-bidders', packageId] });
            setSearchText('');
            setIsDropdownOpen(false);
        },
    });

    // Update bidder mutation
    const updateMutation = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Bidder> }) => {
            // @ts-ignore
            const { error } = await (supabase as any)
                .from('package_bidders')
                .update(updates)
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['package-bidders', packageId] });
            setEditingBidder(null);
        },
    });

    // Delete bidder mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            // @ts-ignore
            const { error } = await (supabase as any)
                .from('package_bidders')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['package-bidders', packageId] });
        },
    });

    // Filter contractors for search
    const filteredContractors = useMemo(() => {
        const bidderIds = new Set(bidders.map(b => b.contractor_id));
        return contractors
            .filter(c => !bidderIds.has(c.ContractorID))
            .filter(c => {
                if (!searchText.trim()) return true;
                const s = searchText.toLowerCase();
                return c.FullName?.toLowerCase().includes(s) || c.TaxCode?.toLowerCase().includes(s);
            })
            .slice(0, 8);
    }, [contractors, bidders, searchText]);

    // Click outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsDropdownOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const statusLabels: Record<string, { label: string; color: string }> = {
        submitted: { label: 'Đã nộp', color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' },
        valid: { label: 'Hợp lệ', color: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400' },
        invalid: { label: 'Không hợp lệ', color: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' },
        winner: { label: 'Trúng thầu', color: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' },
    };

    if (isLoading) {
        return <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-blue-500 animate-spin" /></div>;
    }

    return (
        <div className="space-y-3">
            {/* Bidder list */}
            {bidders.length > 0 ? (
                <div className="space-y-2">
                    {bidders.map((b, idx) => (
                        <div key={b.id || b.contractor_id} className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
                            {/* Bidder header */}
                            <div
                                className="flex items-center gap-2 p-2.5 bg-white dark:bg-slate-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-750"
                                onClick={() => setEditingBidder(editingBidder === b.id ? null : b.id!)}
                            >
                                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0 text-xs font-bold text-blue-600 dark:text-blue-400">
                                    {b.rank || idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 dark:text-slate-200 truncate">
                                        {b.contractor?.FullName || b.contractor_id}
                                    </p>
                                </div>
                                {b.bid_price ? (
                                    <span className="text-xs font-medium text-gray-600 dark:text-slate-300">{formatCurrency(b.bid_price)}</span>
                                ) : null}
                                {b.combined_score ? (
                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{b.combined_score}đ</span>
                                ) : null}
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${statusLabels[b.status]?.color || statusLabels.submitted.color}`}>
                                    {statusLabels[b.status]?.label || b.status}
                                </span>
                            </div>

                            {/* Editable details */}
                            {editingBidder === b.id && (
                                <EditBidderRow
                                    bidder={b}
                                    onSave={(updates) => updateMutation.mutate({ id: b.id!, updates })}
                                    onDelete={() => b.id && deleteMutation.mutate(b.id)}
                                    isSaving={updateMutation.isPending}
                                />
                            )}
                        </div>
                    ))}
                </div>
            ) : !isAdding ? (
                <div className="text-center py-4">
                    <Users className="w-8 h-8 text-gray-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-slate-400">Chưa có nhà thầu tham gia</p>
                </div>
            ) : null}

            {/* Add bidder search */}
            {isAdding ? (
                <div ref={dropdownRef} className="relative">
                    <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-600 rounded-lg ring-2 ring-blue-500/20">
                        <Search className="w-4 h-4 text-blue-400 shrink-0" />
                        <input
                            autoFocus
                            type="text"
                            placeholder="Tìm nhà thầu (tên, MST)..."
                            value={searchText}
                            onChange={(e) => { setSearchText(e.target.value); setIsDropdownOpen(true); }}
                            onFocus={() => setIsDropdownOpen(true)}
                            className="flex-1 bg-transparent text-sm text-gray-800 dark:text-slate-200 placeholder-gray-400 outline-none"
                        />
                        <button onClick={() => { setIsAdding(false); setSearchText(''); setIsDropdownOpen(false); }}>
                            <X className="w-4 h-4 text-gray-400" />
                        </button>
                    </div>
                    {isDropdownOpen && (
                        <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl max-h-40 overflow-y-auto">
                            {filteredContractors.length > 0 ? filteredContractors.map(c => (
                                <button
                                    key={c.ContractorID}
                                    onClick={() => addMutation.mutate(c.ContractorID)}
                                    disabled={addMutation.isPending}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-blue-50 dark:hover:bg-slate-700 text-left border-b border-gray-50 dark:border-slate-750 last:border-0"
                                >
                                    <Building2 className="w-4 h-4 text-blue-500 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800 dark:text-slate-200 truncate">{c.FullName}</p>
                                        <p className="text-[10px] text-gray-500 dark:text-slate-400">MST: {c.TaxCode || c.ContractorID}</p>
                                    </div>
                                    <Plus className="w-4 h-4 text-blue-400 shrink-0" />
                                </button>
                            )) : (
                                <div className="px-3 py-3 text-center text-sm text-gray-400">
                                    {searchText ? 'Không tìm thấy' : 'Nhập tên hoặc MST'}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <button
                    onClick={() => setIsAdding(true)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg border border-dashed border-blue-300 dark:border-blue-700 transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Thêm nhà thầu
                </button>
            )}

            {/* Summary */}
            {bidders.length > 0 && (
                <div className="flex items-center justify-between px-2 py-1.5 bg-gray-50 dark:bg-slate-800 rounded text-xs text-gray-500 dark:text-slate-400">
                    <span>{bidders.length} nhà thầu tham gia</span>
                    {bidders.filter(b => b.status === 'valid' || b.status === 'winner').length > 0 && (
                        <span className="text-green-600 dark:text-green-400">
                            {bidders.filter(b => b.status === 'valid' || b.status === 'winner').length} hợp lệ
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

// ────────────────────────────────────────
// Inline Edit Row for a bidder
// ────────────────────────────────────────
const EditBidderRow: React.FC<{
    bidder: Bidder;
    onSave: (updates: Partial<Bidder>) => void;
    onDelete: () => void;
    isSaving: boolean;
}> = ({ bidder, onSave, onDelete, isSaving }) => {
    const [form, setForm] = useState({
        bid_price: bidder.bid_price ?? '',
        technical_score: bidder.technical_score ?? '',
        financial_score: bidder.financial_score ?? '',
        combined_score: bidder.combined_score ?? '',
        rank: bidder.rank ?? '',
        status: bidder.status,
        notes: bidder.notes ?? '',
    });

    const handleSave = () => {
        onSave({
            bid_price: form.bid_price ? Number(form.bid_price) : undefined,
            technical_score: form.technical_score ? Number(form.technical_score) : undefined,
            financial_score: form.financial_score ? Number(form.financial_score) : undefined,
            combined_score: form.combined_score ? Number(form.combined_score) : undefined,
            rank: form.rank ? Number(form.rank) : undefined,
            status: form.status,
            notes: form.notes || undefined,
        });
    };

    const inputClass = "w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-800 dark:text-slate-200";
    const labelClass = "text-[10px] font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1";

    return (
        <div className="p-3 bg-gray-50 dark:bg-slate-850 border-t border-gray-200 dark:border-slate-700 space-y-3">
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className={labelClass}>Giá dự thầu (VND)</label>
                    <input
                        type="number"
                        value={form.bid_price}
                        onChange={e => setForm(p => ({ ...p, bid_price: e.target.value }))}
                        placeholder="0"
                        className={inputClass}
                    />
                </div>
                <div>
                    <label className={labelClass}>Trạng thái</label>
                    <select
                        value={form.status}
                        onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                        className={inputClass}
                    >
                        <option value="submitted">Đã nộp HSDT</option>
                        <option value="valid">Hợp lệ</option>
                        <option value="invalid">Không hợp lệ</option>
                        <option value="winner">Trúng thầu</option>
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
                <div>
                    <label className={labelClass}>Điểm kỹ thuật</label>
                    <input type="number" step="0.01" value={form.technical_score} onChange={e => setForm(p => ({ ...p, technical_score: e.target.value }))} placeholder="0" className={inputClass} />
                </div>
                <div>
                    <label className={labelClass}>Điểm tài chính</label>
                    <input type="number" step="0.01" value={form.financial_score} onChange={e => setForm(p => ({ ...p, financial_score: e.target.value }))} placeholder="0" className={inputClass} />
                </div>
                <div>
                    <label className={labelClass}>Điểm tổng hợp</label>
                    <input type="number" step="0.01" value={form.combined_score} onChange={e => setForm(p => ({ ...p, combined_score: e.target.value }))} placeholder="0" className={inputClass} />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className={labelClass}>Xếp hạng</label>
                    <input type="number" value={form.rank} onChange={e => setForm(p => ({ ...p, rank: e.target.value }))} placeholder="1" className={inputClass} />
                </div>
                <div>
                    <label className={labelClass}>Ghi chú</label>
                    <input type="text" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Ghi chú..." className={inputClass} />
                </div>
            </div>
            <div className="flex items-center justify-between pt-1">
                <button
                    onClick={onDelete}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors"
                >
                    <Trash2 className="w-3 h-3" /> Xóa
                </button>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition-colors"
                >
                    {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    Lưu
                </button>
            </div>
        </div>
    );
};

// ────────────────────────────────────────
// 2) SECTION: Đánh giá HSDT
// ────────────────────────────────────────
export const EvaluationSection: React.FC<BidderEvaluationSectionProps> = ({ packageId }) => {
    const queryClient = useQueryClient();
    const { contractors } = useContractors();

    // Fetch bidders with scores
    const { data: bidders = [], isLoading } = useQuery({
        queryKey: ['package-bidders', packageId],
        queryFn: async () => {
            // @ts-ignore
            const { data, error } = await (supabase as any)
                .from('package_bidders')
                .select('*')
                .eq('package_id', packageId)
                .order('rank', { ascending: true, nullsFirst: false });
            if (error) throw error;
            return (data || []).map((b: any) => ({
                ...b,
                contractor: contractors.find((c: Contractor) => c.ContractorID === b.contractor_id),
            })) as Bidder[];
        },
        enabled: contractors.length > 0,
    });

    // File upload mutation
    const uploadMutation = useMutation({
        mutationFn: async ({ bidderId, file }: { bidderId: string; file: File }) => {
            // Upload to Supabase Storage
            const fileName = `evaluations/${packageId}/${bidderId}_${file.name}`;
            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(fileName, file, { upsert: true });
            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from('documents')
                .getPublicUrl(fileName);

            // Update bidder record
            // @ts-ignore
            const { error } = await (supabase as any)
                .from('package_bidders')
                .update({
                    evaluation_file_url: urlData.publicUrl,
                    evaluation_file_name: file.name,
                })
                .eq('id', bidderId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['package-bidders', packageId] });
        },
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadingFor, setUploadingFor] = useState<string | null>(null);

    const handleFileSelect = (bidderId: string) => {
        setUploadingFor(bidderId);
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && uploadingFor) {
            uploadMutation.mutate({ bidderId: uploadingFor, file });
        }
        e.target.value = '';
    };

    const scoredBidders = bidders.filter(b => b.technical_score || b.financial_score || b.combined_score);
    const hasAnyScores = scoredBidders.length > 0;

    if (isLoading) {
        return <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-blue-500 animate-spin" /></div>;
    }

    if (bidders.length === 0) {
        return (
            <div className="space-y-4">
                {/* Upload overall evaluation report */}
                <div className="border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-lg p-4 text-center hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
                    <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.doc,.docx,.xls,.xlsx" />
                    <Upload className="w-8 h-8 text-gray-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-600 dark:text-slate-300">Tải lên Báo cáo đánh giá HSDT</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">PDF, Word, Excel</p>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-3 px-4 py-1.5 text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                    >
                        Chọn file
                    </button>
                </div>
                <p className="text-center text-[10px] text-gray-400 dark:text-slate-500">
                    Thêm nhà thầu tham gia ở bên trái để nhập điểm đánh giá chi tiết
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.doc,.docx,.xls,.xlsx" />

            {/* Score table */}
            {hasAnyScores ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400">
                                <th className="text-left py-2 px-2 font-medium">Nhà thầu</th>
                                <th className="text-right py-2 px-1 font-medium">Giá dự thầu</th>
                                <th className="text-center py-2 px-1 font-medium">KT</th>
                                <th className="text-center py-2 px-1 font-medium">TC</th>
                                <th className="text-center py-2 px-1 font-medium">TH</th>
                                <th className="text-center py-2 px-1 font-medium">Hạng</th>
                                <th className="text-center py-2 px-1 font-medium">File</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bidders.map((b, idx) => (
                                <tr key={b.id} className={`border-b border-gray-50 dark:border-slate-800 ${b.status === 'winner' ? 'bg-amber-50 dark:bg-amber-950/20' : ''}`}>
                                    <td className="py-2 px-2">
                                        <div className="flex items-center gap-1.5">
                                            {b.status === 'winner' && <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                                            <span className="font-medium text-gray-800 dark:text-slate-200 truncate max-w-[120px]">
                                                {b.contractor?.FullName?.split(' ').slice(-3).join(' ') || b.contractor_id}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="text-right py-2 px-1 text-gray-600 dark:text-slate-300 whitespace-nowrap">
                                        {b.bid_price ? formatCurrency(b.bid_price) : '-'}
                                    </td>
                                    <td className="text-center py-2 px-1 font-medium text-gray-700 dark:text-slate-300">{b.technical_score ?? '-'}</td>
                                    <td className="text-center py-2 px-1 font-medium text-gray-700 dark:text-slate-300">{b.financial_score ?? '-'}</td>
                                    <td className="text-center py-2 px-1 font-bold text-blue-600 dark:text-blue-400">{b.combined_score ?? '-'}</td>
                                    <td className="text-center py-2 px-1">
                                        {b.rank ? (
                                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${b.rank === 1 ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' :
                                                'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400'
                                                }`}>{b.rank}</span>
                                        ) : '-'}
                                    </td>
                                    <td className="text-center py-2 px-1">
                                        {b.evaluation_file_url ? (
                                            <a href={b.evaluation_file_url} target="_blank" rel="noopener noreferrer" title={b.evaluation_file_name}>
                                                <FileText className="w-3.5 h-3.5 text-blue-500 inline" />
                                            </a>
                                        ) : (
                                            <button
                                                onClick={() => handleFileSelect(b.id!)}
                                                disabled={uploadMutation.isPending}
                                                className="text-gray-400 hover:text-blue-500 transition-colors"
                                            >
                                                <Upload className="w-3.5 h-3.5 inline" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="space-y-2">
                    {bidders.map(b => (
                        <div key={b.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-800 rounded-lg">
                            <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                                <span className="text-sm text-gray-700 dark:text-slate-300 truncate">{b.contractor?.FullName || b.contractor_id}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {b.bid_price && <span className="text-xs text-gray-500">{formatCurrency(b.bid_price)}</span>}
                                <button
                                    onClick={() => handleFileSelect(b.id!)}
                                    disabled={uploadMutation.isPending}
                                    className="flex items-center gap-1 px-2 py-1 text-[10px] text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded transition-colors"
                                >
                                    <Upload className="w-3 h-3" />
                                    {b.evaluation_file_url ? 'Đổi file' : 'Upload'}
                                </button>
                            </div>
                        </div>
                    ))}
                    <p className="text-center text-[10px] text-gray-400 dark:text-slate-500 pt-1">
                        Nhập điểm đánh giá ở phần "Nhà thầu tham gia" → click vào nhà thầu
                    </p>
                </div>
            )}
        </div>
    );
};

export default { BidderListSection, EvaluationSection };
