import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Search, Plus, X, Crown, Users, Award, Loader2, Check,
    Building2, ChevronDown, Save, Trash2, UserPlus
} from 'lucide-react';
import { Contractor } from '../../../types';
import { useContractors } from '../../../hooks/useContractors';
import { supabase } from '../../../lib/supabase';

// ========================================
// WINNING CONTRACTOR SELECTOR
// Supports consortium (liên danh) — multiple contractors per package
// ========================================

interface WinningMember {
    id?: string;
    contractor_id: string;
    contractor?: Contractor;
    role: 'lead' | 'member';
    share_percent?: number;
}

interface WinningContractorSelectorProps {
    packageId: string;
    onSaved?: () => void;
}

export const WinningContractorSelector: React.FC<WinningContractorSelectorProps> = ({
    packageId,
    onSaved,
}) => {
    const queryClient = useQueryClient();
    const { contractors } = useContractors();
    const [isEditing, setIsEditing] = useState(false);
    const [members, setMembers] = useState<WinningMember[]>([]);
    const [searchText, setSearchText] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    // Fetch existing winning contractors
    const { data: existingMembers, isLoading } = useQuery({
        queryKey: ['package-winning-contractors', packageId],
        queryFn: async () => {
            // @ts-ignore — table not yet in generated types
            const { data, error } = await (supabase as any)
                .from('package_winning_contractors')
                .select('*')
                .eq('package_id', packageId)
                .order('role', { ascending: true });
            if (error) throw error;
            return (data || []) as { id: string; contractor_id: string; role: 'lead' | 'member'; share_percent: number | null }[];
        },
    });

    // Sync existing data when loaded
    useEffect(() => {
        if (existingMembers && contractors.length > 0) {
            setMembers(existingMembers.map(m => ({
                id: m.id,
                contractor_id: m.contractor_id,
                contractor: contractors.find(c => c.ContractorID === m.contractor_id),
                role: m.role,
                share_percent: m.share_percent ?? undefined,
            })));
        }
    }, [existingMembers, contractors]);

    // Save mutation
    const saveMutation = useMutation({
        mutationFn: async (newMembers: WinningMember[]) => {
            // Delete all existing records
            // @ts-ignore — table not yet in generated types
            await (supabase as any)
                .from('package_winning_contractors')
                .delete()
                .eq('package_id', packageId);

            // Insert new ones
            if (newMembers.length > 0) {
                const rows = newMembers.map(m => ({
                    package_id: packageId,
                    contractor_id: m.contractor_id,
                    role: m.role,
                    share_percent: m.share_percent ?? null,
                }));
                // @ts-ignore — table not yet in generated types
                const { error } = await (supabase as any)
                    .from('package_winning_contractors')
                    .insert(rows);
                if (error) throw error;

                // Also update winning_contractor_id on bidding_packages (backward compat — use lead)
                const leadContractor = newMembers.find(m => m.role === 'lead') || newMembers[0];
                await supabase
                    .from('bidding_packages')
                    .update({ winning_contractor_id: leadContractor.contractor_id })
                    .eq('package_id', packageId);
            } else {
                // Clear winning_contractor_id
                await supabase
                    .from('bidding_packages')
                    .update({ winning_contractor_id: null })
                    .eq('package_id', packageId);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['package-winning-contractors', packageId] });
            queryClient.invalidateQueries({ queryKey: ['project-packages'] });
            setIsEditing(false);
            onSaved?.();
        },
    });

    // Filter contractors for search
    const filteredContractors = useMemo(() => {
        const selectedIds = new Set(members.map(m => m.contractor_id));
        return contractors
            .filter(c => !selectedIds.has(c.ContractorID))
            .filter(c => {
                if (!searchText.trim()) return true;
                const search = searchText.toLowerCase();
                return (
                    c.FullName?.toLowerCase().includes(search) ||
                    c.ContractorID?.toLowerCase().includes(search) ||
                    c.TaxCode?.toLowerCase().includes(search)
                );
            })
            .slice(0, 10);
    }, [contractors, members, searchText]);

    // Click outside to close dropdown
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const addContractor = (c: Contractor) => {
        const role = members.length === 0 ? 'lead' : 'member';
        setMembers(prev => [...prev, {
            contractor_id: c.ContractorID,
            contractor: c,
            role,
        }]);
        setSearchText('');
        setIsDropdownOpen(false);
    };

    const removeContractor = (contractorId: string) => {
        setMembers(prev => {
            const next = prev.filter(m => m.contractor_id !== contractorId);
            // Auto-promote first member to lead if lead was removed
            if (next.length > 0 && !next.some(m => m.role === 'lead')) {
                next[0].role = 'lead';
            }
            return next;
        });
    };

    const toggleRole = (contractorId: string) => {
        setMembers(prev => prev.map(m => {
            if (m.contractor_id === contractorId) {
                return { ...m, role: m.role === 'lead' ? 'member' : 'lead' };
            }
            // If switching to lead, demote others
            if (m.role === 'lead') {
                return { ...m, role: 'member' };
            }
            return m;
        }));
    };

    const handleSave = () => {
        saveMutation.mutate(members);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            </div>
        );
    }

    // View mode — display consortium
    if (!isEditing && members.length > 0) {
        return (
            <div className="space-y-3">
                {members.length > 1 && (
                    <div className="flex items-center gap-2 px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                        <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                            Liên danh {members.length} nhà thầu
                        </span>
                    </div>
                )}
                {members.map(m => (
                    <div
                        key={m.contractor_id}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${m.role === 'lead'
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                            : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700'
                            }`}
                    >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${m.role === 'lead'
                            ? 'bg-green-100 dark:bg-green-900/40'
                            : 'bg-gray-100 dark:bg-slate-700'
                            }`}>
                            {m.role === 'lead' ? (
                                <Crown className="w-5 h-5 text-amber-500" />
                            ) : (
                                <Building2 className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 dark:text-slate-100 text-sm truncate">
                                {m.contractor?.FullName || m.contractor_id}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px] text-gray-500 dark:text-slate-400">
                                    MST: {m.contractor?.TaxCode || m.contractor_id}
                                </span>
                                {m.role === 'lead' && (
                                    <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded font-medium">
                                        Đứng đầu liên danh
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                <button
                    onClick={() => setIsEditing(true)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg border border-dashed border-blue-300 dark:border-blue-700 transition-colors"
                >
                    <UserPlus className="w-3.5 h-3.5" />
                    Chỉnh sửa
                </button>
            </div>
        );
    }

    // Edit mode / Empty state
    return (
        <div className="space-y-3">
            {/* Selected members */}
            {members.map(m => (
                <div
                    key={m.contractor_id}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border ${m.role === 'lead'
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700'
                        }`}
                >
                    <button
                        onClick={() => toggleRole(m.contractor_id)}
                        title={m.role === 'lead' ? 'Đứng đầu liên danh' : 'Click để đặt làm đứng đầu liên danh'}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${m.role === 'lead'
                            ? 'bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 dark:hover:bg-amber-900/60'
                            : 'bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600'
                            }`}
                    >
                        {m.role === 'lead' ? (
                            <Crown className="w-4 h-4 text-amber-600" />
                        ) : (
                            <Building2 className="w-4 h-4 text-gray-400" />
                        )}
                    </button>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-slate-200 truncate">
                            {m.contractor?.FullName || m.contractor_id}
                        </p>
                        <span className="text-[10px] text-gray-500 dark:text-slate-400">
                            {m.role === 'lead' ? '⭐ Đứng đầu liên danh' : 'Thành viên liên danh'}
                        </span>
                    </div>
                    <button
                        onClick={() => removeContractor(m.contractor_id)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            ))}

            {/* Search & Add */}
            <div ref={dropdownRef} className="relative">
                <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-400">
                    <Search className="w-4 h-4 text-gray-400 dark:text-slate-500 shrink-0" />
                    <input
                        ref={searchRef}
                        type="text"
                        placeholder="Tìm nhà thầu (tên, mã số thuế)..."
                        value={searchText}
                        onChange={(e) => {
                            setSearchText(e.target.value);
                            setIsDropdownOpen(true);
                        }}
                        onFocus={() => setIsDropdownOpen(true)}
                        className="flex-1 bg-transparent text-sm text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 outline-none"
                    />
                    {searchText && (
                        <button onClick={() => { setSearchText(''); setIsDropdownOpen(false); }}>
                            <X className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                    )}
                </div>

                {/* Dropdown results */}
                {isDropdownOpen && (
                    <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                        {filteredContractors.length > 0 ? (
                            filteredContractors.map(c => (
                                <button
                                    key={c.ContractorID}
                                    onClick={() => addContractor(c)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 dark:hover:bg-slate-700 text-left transition-colors border-b border-gray-50 dark:border-slate-750 last:border-0"
                                >
                                    <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center shrink-0">
                                        <Building2 className="w-4 h-4 text-blue-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800 dark:text-slate-200 truncate">{c.FullName}</p>
                                        <p className="text-[10px] text-gray-500 dark:text-slate-400">MST: {c.TaxCode || c.ContractorID}</p>
                                    </div>
                                    <Plus className="w-4 h-4 text-blue-400 shrink-0" />
                                </button>
                            ))
                        ) : (
                            <div className="px-3 py-4 text-center text-sm text-gray-400 dark:text-slate-500">
                                {searchText ? 'Không tìm thấy nhà thầu' : 'Nhập tên hoặc MST để tìm kiếm'}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Actions */}
            {(members.length > 0 || existingMembers && existingMembers.length > 0) && (
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-slate-700">
                    {isEditing && (
                        <button
                            onClick={() => {
                                // Reset to existing data
                                if (existingMembers && contractors.length > 0) {
                                    setMembers(existingMembers.map(m => ({
                                        id: m.id,
                                        contractor_id: m.contractor_id,
                                        contractor: contractors.find(c => c.ContractorID === m.contractor_id),
                                        role: m.role,
                                        share_percent: m.share_percent ?? undefined,
                                    })));
                                }
                                setIsEditing(false);
                            }}
                            className="px-3 py-1.5 text-xs text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            Hủy
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={saveMutation.isPending}
                        className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 transition-colors"
                    >
                        {saveMutation.isPending ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <Save className="w-3.5 h-3.5" />
                        )}
                        Lưu kết quả
                    </button>
                </div>
            )}

            {/* Empty hint */}
            {members.length === 0 && !isEditing && (
                <div className="text-center py-2">
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                        Tìm và chọn nhà thầu trúng thầu từ danh sách. Hỗ trợ liên danh.
                    </p>
                </div>
            )}
        </div>
    );
};

export default WinningContractorSelector;
