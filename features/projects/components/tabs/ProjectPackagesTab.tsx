import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ProjectService from '../../../../services/ProjectService';
import ApiClient from '../../../../services/api';
import { BiddingPackage, PackageStatus, Project } from '../../../../types';
import { formatCurrency, formatDate } from '../../../../utils/format';
import { BiddingPackageModal } from '../BiddingPackageModal';
import { BiddingPackageDetail } from '../BiddingPackageDetail';
import { BiddingImportModal } from '../BiddingImportModal';
import { KHLCNTExportModal } from '../KHLCNTExportModal';
import { getMSCSummary, countPendingRequirements, getMSCPlanLink, getMSCPackageLink } from '../../../../utils/mscCompliance';
import { exportBiddingPackagesToExcel } from '../../../../utils/biddingExcelIO';
import { supabase } from '../../../../lib/supabase';
import { biddingPackageToDb } from '../../../../lib/dbMappers';
import {
    Briefcase, CheckCircle2, FileText, Search, Plus,
    MoreVertical, Eye, Edit, Trash2, ExternalLink,
    Copy, X, AlertTriangle, Loader2, Clock, Circle, Download, Upload,
    GripVertical, ChevronDown, ChevronRight, Globe, Bell, Link2
} from 'lucide-react';

// ========================================
// PROJECT PACKAGES TAB - Grouped by KHLCNT + Drag Reorder + MSC Compliance
// ========================================

interface ProjectPackagesTabProps {
    projectID: string;
    project?: Project | null;
}

interface PlanGroup {
    key: string;
    name: string;
    decisionNumber?: string;
    decisionDate?: string;
    mscPlanCode?: string;
    packages: BiddingPackage[];
}

export const ProjectPackagesTab: React.FC<ProjectPackagesTabProps> = ({ projectID, project }) => {
    const queryClient = useQueryClient();

    const { data: packages, isLoading, error } = useQuery({
        queryKey: ['project-packages', projectID],
        queryFn: () => ProjectService.getPackagesByProject(projectID)
    });

    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isDeleteAllConfirmOpen, setIsDeleteAllConfirmOpen] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState<BiddingPackage | null>(null);

    // Dropdown state
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    // Checkbox selection for KHLCNT export
    const [selectedPackageIds, setSelectedPackageIds] = useState<Set<string>>(new Set());

    // Accordion state for plan groups
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['__ungrouped__']));

    // Drag state
    const [draggedPkgId, setDraggedPkgId] = useState<string | null>(null);
    const [dragOverPkgId, setDragOverPkgId] = useState<string | null>(null);

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (packageId: string) => ApiClient.delete(`/api/bidding-packages/${packageId}`, () => { }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-packages', projectID] });
            setIsDeleteConfirmOpen(false);
            setSelectedPackage(null);
        },
    });

    // Delete ALL packages mutation
    const deleteAllMutation = useMutation({
        mutationFn: async () => {
            await (supabase.from('bidding_packages') as any)
                .delete()
                .eq('project_id', projectID);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-packages', projectID] });
            setIsDeleteAllConfirmOpen(false);
        },
    });

    // Sort order mutation
    const updateSortMutation = useMutation({
        mutationFn: async (updates: { packageId: string; sortOrder: number }[]) => {
            for (const u of updates) {
                await (supabase.from('bidding_packages') as any)
                    .update({ sort_order: u.sortOrder })
                    .eq('package_id', u.packageId);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-packages', projectID] });
        },
    });

    const getStatusColor = (status: PackageStatus) => {
        switch (status) {
            case PackageStatus.Planning: return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600';
            case PackageStatus.Posted: return 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-800';
            case PackageStatus.Bidding: return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800';
            case PackageStatus.Evaluating: return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-800';
            case PackageStatus.Awarded: return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800';
            case PackageStatus.Cancelled: return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800';
            default: return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600';
        }
    };

    const getStatusLabel = (status: PackageStatus) => {
        switch (status) {
            case PackageStatus.Planning: return 'Trong kế hoạch';
            case PackageStatus.Posted: return 'Đã đăng tải';
            case PackageStatus.Bidding: return 'Đang mời thầu';
            case PackageStatus.Evaluating: return 'Đang xét thầu';
            case PackageStatus.Awarded: return 'Đã có kết quả';
            case PackageStatus.Cancelled: return 'Hủy thầu';
            default: return status;
        }
    };

    const filteredPackages = packages?.filter(pkg => {
        const matchesStatus = filterStatus === 'all' || pkg.Status === filterStatus;
        const matchesSearch = pkg.PackageName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pkg.PackageNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (pkg.NotificationCode?.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesStatus && matchesSearch;
    });

    // Group packages by KHLCNT plan
    const planGroups = useMemo((): PlanGroup[] => {
        if (!filteredPackages) return [];

        const groups = new Map<string, PlanGroup>();

        for (const pkg of filteredPackages) {
            const key = pkg.PlanDecisionNumber || pkg.KHLCNTCode || '__ungrouped__';
            if (!groups.has(key)) {
                groups.set(key, {
                    key,
                    name: pkg.PlanGroupName || (key === '__ungrouped__' ? '' : `KHLCNT: ${key}`),
                    decisionNumber: pkg.PlanDecisionNumber || pkg.DecisionNumber,
                    decisionDate: pkg.PlanDecisionDate || pkg.DecisionDate,
                    mscPlanCode: pkg.MSCPlanCode || pkg.KHLCNTCode,
                    packages: [],
                });
            }
            groups.get(key)!.packages.push(pkg);
        }

        // Sort: grouped first, ungrouped last
        const sorted = Array.from(groups.values()).sort((a, b) => {
            if (a.key === '__ungrouped__') return 1;
            if (b.key === '__ungrouped__') return -1;
            return (a.decisionDate || '').localeCompare(b.decisionDate || '');
        });

        return sorted;
    }, [filteredPackages]);

    // MSC Summary for alert
    const mscSummary = useMemo(() => {
        if (!packages) return null;
        return getMSCSummary(packages);
    }, [packages]);

    // Auto-expand all groups on load
    useEffect(() => {
        if (planGroups.length > 0) {
            setExpandedGroups(new Set(planGroups.map(g => g.key)));
        }
    }, [planGroups.length]);

    // Handlers
    const handleView = (pkg: BiddingPackage) => {
        setSelectedPackage(pkg);
        setIsDetailModalOpen(true);
        setOpenDropdownId(null);
    };

    const handleEdit = (pkg: BiddingPackage) => {
        setSelectedPackage(pkg);
        setIsEditModalOpen(true);
        setOpenDropdownId(null);
    };

    const handleDelete = (pkg: BiddingPackage) => {
        setSelectedPackage(pkg);
        setIsDeleteConfirmOpen(true);
        setOpenDropdownId(null);
    };

    const handleCopyTBMT = (code: string) => {
        navigator.clipboard.writeText(getMSCPackageLink(code));
        setOpenDropdownId(null);
    };

    const confirmDelete = () => {
        if (selectedPackage) {
            deleteMutation.mutate(selectedPackage.PackageID);
        }
    };

    const toggleGroup = (key: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    // Drag & Drop handlers
    const handleDragStart = (e: React.DragEvent, pkgId: string) => {
        e.dataTransfer.effectAllowed = 'move';
        setDraggedPkgId(pkgId);
    };

    const handleDragOver = (e: React.DragEvent, pkgId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverPkgId(pkgId);
    };

    const handleDragLeave = () => {
        setDragOverPkgId(null);
    };

    const handleDrop = (e: React.DragEvent, targetPkgId: string, groupPackages: BiddingPackage[]) => {
        e.preventDefault();
        if (!draggedPkgId || draggedPkgId === targetPkgId) {
            setDraggedPkgId(null);
            setDragOverPkgId(null);
            return;
        }

        const fromIdx = groupPackages.findIndex(p => p.PackageID === draggedPkgId);
        const toIdx = groupPackages.findIndex(p => p.PackageID === targetPkgId);
        if (fromIdx === -1 || toIdx === -1) return;

        // Reorder
        const reordered = [...groupPackages];
        const [moved] = reordered.splice(fromIdx, 1);
        reordered.splice(toIdx, 0, moved);

        // Update sort orders
        const updates = reordered.map((pkg, idx) => ({
            packageId: pkg.PackageID,
            sortOrder: idx + 1,
        }));

        updateSortMutation.mutate(updates);
        setDraggedPkgId(null);
        setDragOverPkgId(null);
    };

    const handleDragEnd = () => {
        setDraggedPkgId(null);
        setDragOverPkgId(null);
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500 dark:text-slate-400">Đang tải dữ liệu gói thầu...</div>;
    if (error) return <div className="p-8 text-center text-red-500 dark:text-red-400">Không thể tải dữ liệu gói thầu</div>;

    return (
        <div className="space-y-6">
            {/* Header / Statistics */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm p-5">
                {/* Main Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Total Packages */}
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                            <Briefcase size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-slate-400">Tổng gói thầu</p>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-slate-100 tabular-nums">{packages?.length || 0}</h3>
                        </div>
                    </div>

                    {/* Total Value */}
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
                            <FileText size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-slate-400">Tổng giá trị (DT)</p>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-slate-100 tabular-nums">
                                {formatCurrency(packages?.reduce((sum, p) => sum + (p.Price || 0), 0) || 0)}
                            </h3>
                        </div>
                    </div>

                    {/* Awarded Packages */}
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                            <CheckCircle2 size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-slate-400">Đã có kết quả</p>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-slate-100 tabular-nums">
                                {packages?.filter(p => p.Status === PackageStatus.Awarded).length || 0}
                                <span className="text-sm font-normal text-gray-400 dark:text-slate-500">/{packages?.length || 0}</span>
                            </h3>
                        </div>
                    </div>

                    {/* In Progress */}
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400">
                            <Clock size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-slate-400">Đang thực hiện</p>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-slate-100 tabular-nums">
                                {packages?.filter(p => p.Status === PackageStatus.Bidding || p.Status === PackageStatus.Evaluating).length || 0}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-6 pt-5 border-t border-gray-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Tiến độ hoàn thành đấu thầu</span>
                        <span className="text-sm font-bold text-gray-800 dark:text-slate-100 tabular-nums">
                            {packages?.length! > 0
                                ? Math.round((packages!.filter(p => p.Status === PackageStatus.Awarded).length / packages!.length) * 100)
                                : 0}%
                        </span>
                    </div>
                    <div className="h-3 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden flex">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-green-600 transition-all" style={{ width: `${packages?.length! > 0 ? (packages!.filter(p => p.Status === PackageStatus.Awarded).length / packages!.length) * 100 : 0}%` }} title="Đã có kết quả" />
                        <div className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 transition-all" style={{ width: `${packages?.length! > 0 ? (packages!.filter(p => p.Status === PackageStatus.Evaluating).length / packages!.length) * 100 : 0}%` }} title="Đang xét thầu" />
                        <div className="h-full bg-gradient-to-r from-blue-400 to-blue-500 transition-all" style={{ width: `${packages?.length! > 0 ? (packages!.filter(p => p.Status === PackageStatus.Bidding).length / packages!.length) * 100 : 0}%` }} title="Đang mời thầu" />
                        <div className="h-full bg-gradient-to-r from-indigo-300 to-indigo-400 transition-all" style={{ width: `${packages?.length! > 0 ? (packages!.filter(p => p.Status === PackageStatus.Posted).length / packages!.length) * 100 : 0}%` }} title="Đã đăng tải" />
                    </div>
                    <div className="flex flex-wrap gap-4 mt-3 text-xs">
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span><span className="text-gray-600 dark:text-slate-400">Đã có kết quả ({packages?.filter(p => p.Status === PackageStatus.Awarded).length || 0})</span></span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span><span className="text-gray-600 dark:text-slate-400">Đang xét thầu ({packages?.filter(p => p.Status === PackageStatus.Evaluating).length || 0})</span></span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span><span className="text-gray-600 dark:text-slate-400">Đang mời thầu ({packages?.filter(p => p.Status === PackageStatus.Bidding).length || 0})</span></span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span><span className="text-gray-600 dark:text-slate-400">Đã đăng tải ({packages?.filter(p => p.Status === PackageStatus.Posted).length || 0})</span></span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-300"></span><span className="text-gray-600 dark:text-slate-400">Trong kế hoạch ({packages?.filter(p => p.Status === PackageStatus.Planning).length || 0})</span></span>
                    </div>
                </div>
            </div>

            {/* MSC Compliance Alert */}
            {mscSummary && mscSummary.packagesNeedAction > 0 && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                            <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-amber-800 dark:text-amber-200">
                                Cần đăng tải lên muasamcong.vn
                            </h4>
                            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                                <span className="font-bold">{mscSummary.packagesNeedAction}</span> gói thầu có tài liệu cần đăng tải
                                ({mscSummary.totalPending} tài liệu). Theo Luật Đấu thầu 2023, CDT phải đăng tải đúng thời hạn.
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {mscSummary.details.slice(0, 3).map((d, i) => (
                                    <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 rounded text-[10px] font-medium">
                                        <AlertTriangle className="w-3 h-3" />
                                        {d.packageName.length > 30 ? d.packageName.slice(0, 30) + '...' : d.packageName}: {d.items.join(', ')}
                                    </span>
                                ))}
                                {mscSummary.details.length > 3 && (
                                    <span className="text-[10px] text-amber-600 dark:text-amber-400">
                                        +{mscSummary.details.length - 3} gói khác...
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Controls */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm gói thầu..."
                            className="pl-9 pr-4 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-64 bg-white dark:bg-slate-700 dark:text-slate-200 dark:placeholder-slate-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-700 dark:text-slate-200"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value={PackageStatus.Planning}>Trong kế hoạch</option>
                        <option value={PackageStatus.Posted}>Đã đăng tải</option>
                        <option value={PackageStatus.Bidding}>Đang mời thầu</option>
                        <option value={PackageStatus.Evaluating}>Đang xét thầu</option>
                        <option value={PackageStatus.Awarded}>Đã có kết quả</option>
                    </select>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsExportModalOpen(true)}
                        disabled={selectedPackageIds.size === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                        <Download size={16} />
                        <span>Xuất VB KHLCNT {selectedPackageIds.size > 0 && `(${selectedPackageIds.size})`}</span>
                    </button>
                    <button
                        onClick={() => packages && packages.length > 0 && exportBiddingPackagesToExcel(packages, project?.ProjectName || 'DuAn')}
                        disabled={!packages || packages.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-emerald-300 dark:border-emerald-600 text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                        <Download size={16} />
                        <span>Export Excel</span>
                    </button>
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-400 rounded-lg hover:bg-amber-50 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
                    >
                        <Upload size={16} />
                        <span>Import Excel</span>
                    </button>
                    <button
                        onClick={() => setIsDeleteAllConfirmOpen(true)}
                        disabled={!packages || packages.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                        <Trash2 size={16} />
                        <span>Xóa tất cả</span>
                    </button>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium shadow-sm shadow-primary-200"
                    >
                        <Plus size={16} />
                        <span>Thêm gói thầu</span>
                    </button>
                </div>
            </div>

            {/* Grouped Package Tables */}
            <div className="space-y-4">
                {planGroups.map((group) => (
                    <div key={group.key} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        {/* Group Header */}
                        {group.key !== '__ungrouped__' ? (
                            <button
                                onClick={() => toggleGroup(group.key)}
                                className="w-full flex items-center justify-between px-5 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border-b border-blue-100 dark:border-blue-800 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-950/60 dark:hover:to-indigo-950/60 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    {expandedGroups.has(group.key) ? (
                                        <ChevronDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    ) : (
                                        <ChevronRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    )}
                                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    <div className="text-left">
                                        <span className="text-sm font-bold text-blue-900 dark:text-blue-200">
                                            {group.name || `Kế hoạch LCNT`}
                                        </span>
                                        {group.decisionNumber && (
                                            <span className="text-xs text-blue-600 dark:text-blue-400 ml-2">
                                                QĐ: {group.decisionNumber}
                                                {group.decisionDate && ` (${new Date(group.decisionDate).toLocaleDateString('vi-VN')})`}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {/* MSC Plan Link */}
                                    {group.mscPlanCode && (
                                        <a
                                            href={getMSCPlanLink(group.mscPlanCode)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 rounded hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors"
                                        >
                                            <Globe className="w-3 h-3" />
                                            {group.mscPlanCode}
                                        </a>
                                    )}
                                    <span className="px-2 py-1 text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                                        {group.packages.length} gói
                                    </span>
                                    <span className="text-xs font-bold text-blue-800 dark:text-blue-200 tabular-nums">
                                        {formatCurrency(group.packages.reduce((s, p) => s + p.Price, 0))}
                                    </span>
                                </div>
                            </button>
                        ) : planGroups.length > 1 ? (
                            <button
                                onClick={() => toggleGroup(group.key)}
                                className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 dark:bg-slate-750 border-b border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    {expandedGroups.has(group.key) ? (
                                        <ChevronDown className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                                    ) : (
                                        <ChevronRight className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                                    )}
                                    <span className="text-sm font-medium text-gray-600 dark:text-slate-300 italic">
                                        Chưa phân nhóm kế hoạch
                                    </span>
                                </div>
                                <span className="px-2 py-1 text-xs font-bold text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 rounded-full">
                                    {group.packages.length} gói
                                </span>
                            </button>
                        ) : null}

                        {/* Package Table */}
                        {expandedGroups.has(group.key) && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs border-collapse">
                                    <thead>
                                        {/* Row 1 - Main headers with rowSpan=2 */}
                                        <tr className="bg-slate-100 dark:bg-slate-700">
                                            <th rowSpan={2} className="border border-slate-300 dark:border-slate-600 px-1 py-2 text-center w-8"></th>
                                            <th rowSpan={2} className="border border-slate-300 dark:border-slate-600 px-2 py-2 text-center w-10">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                    checked={group.packages.length > 0 && group.packages.every(p => selectedPackageIds.has(p.PackageID))}
                                                    onChange={(e) => {
                                                        const newSet = new Set(selectedPackageIds);
                                                        if (e.target.checked) {
                                                            group.packages.forEach(p => newSet.add(p.PackageID));
                                                        } else {
                                                            group.packages.forEach(p => newSet.delete(p.PackageID));
                                                        }
                                                        setSelectedPackageIds(newSet);
                                                    }}
                                                />
                                            </th>
                                            <th rowSpan={2} className="border border-slate-300 dark:border-slate-600 px-2 py-2 text-center font-bold text-slate-700 dark:text-slate-200 w-10">TT</th>
                                            <th colSpan={2} className="border border-slate-300 dark:border-slate-600 px-2 py-2 text-center font-bold text-slate-700 dark:text-slate-200">Tên gói thầu</th>
                                            <th rowSpan={2} className="border border-slate-300 dark:border-slate-600 px-2 py-2 text-center font-bold text-slate-700 dark:text-slate-200 w-[110px]">Giá gói thầu<br />(đồng)</th>
                                            <th rowSpan={2} className="border border-slate-300 dark:border-slate-600 px-2 py-2 text-center font-bold text-slate-700 dark:text-slate-200 min-w-[100px]">Nguồn vốn</th>
                                            <th rowSpan={2} className="border border-slate-300 dark:border-slate-600 px-2 py-2 text-center font-bold text-slate-700 dark:text-slate-200">Hình thức<br />lựa chọn<br />nhà thầu</th>
                                            <th rowSpan={2} className="border border-slate-300 dark:border-slate-600 px-2 py-2 text-center font-bold text-slate-700 dark:text-slate-200">Phương thức<br />lựa chọn<br />nhà thầu</th>
                                            <th rowSpan={2} className="border border-slate-300 dark:border-slate-600 px-2 py-2 text-center font-bold text-slate-700 dark:text-slate-200 w-[90px]">Thời gian<br />tổ chức<br />LCNT</th>
                                            <th rowSpan={2} className="border border-slate-300 dark:border-slate-600 px-2 py-2 text-center font-bold text-slate-700 dark:text-slate-200 w-[90px]">Thời gian<br />bắt đầu<br />tổ chức<br />LCNT</th>
                                            <th rowSpan={2} className="border border-slate-300 dark:border-slate-600 px-2 py-2 text-center font-bold text-slate-700 dark:text-slate-200">Loại<br />hợp đồng</th>
                                            <th rowSpan={2} className="border border-slate-300 dark:border-slate-600 px-2 py-2 text-center font-bold text-slate-700 dark:text-slate-200 w-[90px]">Thời gian<br />thực hiện<br />gói thầu</th>
                                            <th rowSpan={2} className="border border-slate-300 dark:border-slate-600 px-2 py-2 text-center font-bold text-slate-700 dark:text-slate-200 w-[60px]">Tùy chọn<br />mua thêm</th>
                                            <th rowSpan={2} className="border border-slate-300 dark:border-slate-600 px-2 py-2 text-center font-bold text-slate-700 dark:text-slate-200 w-[90px]">Trạng thái</th>
                                            <th rowSpan={2} className="border border-slate-300 dark:border-slate-600 px-2 py-2 text-center font-bold text-slate-700 dark:text-slate-200 w-[60px]">MSC</th>
                                            <th rowSpan={2} className="border border-slate-300 dark:border-slate-600 px-2 py-2 text-center font-bold text-slate-700 dark:text-slate-200 w-10">TT</th>
                                        </tr>
                                        {/* Row 2 - Sub-headers for Tên gói thầu */}
                                        <tr className="bg-slate-100 dark:bg-slate-700">
                                            <th className="border border-slate-300 dark:border-slate-600 px-2 py-1 text-center font-bold text-slate-700 dark:text-slate-200 min-w-[120px]">Tên gói thầu</th>
                                            <th className="border border-slate-300 dark:border-slate-600 px-2 py-1 text-center font-bold text-slate-700 dark:text-slate-200 min-w-[140px]">Tóm tắt công việc<br />chính của gói thầu</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {group.packages.map((pkg, index) => {
                                            const pendingMSC = countPendingRequirements(pkg);
                                            return (
                                                <tr
                                                    key={pkg.PackageID}
                                                    className={`hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors cursor-pointer ${draggedPkgId === pkg.PackageID ? 'opacity-40' : ''
                                                        } ${dragOverPkgId === pkg.PackageID ? 'border-t-2 border-t-blue-500' : ''}`}
                                                    onClick={() => handleView(pkg)}
                                                    draggable
                                                    onDragStart={(e) => { e.stopPropagation(); handleDragStart(e, pkg.PackageID); }}
                                                    onDragOver={(e) => handleDragOver(e, pkg.PackageID)}
                                                    onDragLeave={handleDragLeave}
                                                    onDrop={(e) => handleDrop(e, pkg.PackageID, group.packages)}
                                                    onDragEnd={handleDragEnd}
                                                >
                                                    {/* Drag Handle */}
                                                    <td className="border border-slate-200 dark:border-slate-700 px-1 py-3 text-center cursor-grab active:cursor-grabbing" onClick={(e) => e.stopPropagation()}>
                                                        <GripVertical className="w-3.5 h-3.5 text-gray-300 dark:text-slate-600 mx-auto" />
                                                    </td>

                                                    {/* Checkbox */}
                                                    <td className="border border-slate-200 dark:border-slate-700 px-2 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                        <input
                                                            type="checkbox"
                                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                            checked={selectedPackageIds.has(pkg.PackageID)}
                                                            onChange={(e) => {
                                                                const newSet = new Set(selectedPackageIds);
                                                                if (e.target.checked) newSet.add(pkg.PackageID);
                                                                else newSet.delete(pkg.PackageID);
                                                                setSelectedPackageIds(newSet);
                                                            }}
                                                        />
                                                    </td>

                                                    {/* TT */}
                                                    <td className="border border-slate-200 dark:border-slate-700 px-2 py-3 text-center text-slate-600 dark:text-slate-300 font-medium">
                                                        {index + 1}
                                                    </td>

                                                    {/* Tên gói thầu */}
                                                    <td className="border border-slate-200 dark:border-slate-700 px-2 py-3 align-top">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="font-bold text-slate-900 dark:text-slate-100">{pkg.PackageNumber}</span>
                                                            <span className="text-slate-700 dark:text-slate-300 leading-relaxed">{pkg.PackageName}</span>
                                                            {pkg.NotificationCode && (
                                                                <a
                                                                    href={getMSCPackageLink(pkg.NotificationCode)}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-1 text-[10px] font-mono text-blue-600 dark:text-blue-400 hover:underline mt-1 w-fit"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <Link2 className="w-3 h-3" />
                                                                    TBMT: {pkg.NotificationCode}
                                                                </a>
                                                            )}
                                                            {pkg.MSCPlanCode && !pkg.NotificationCode && (
                                                                <span className="text-[10px] font-mono text-gray-500 dark:text-slate-500">
                                                                    KHLCNT: {pkg.MSCPlanCode}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Tóm tắt công việc chính */}
                                                    <td className="border border-slate-200 dark:border-slate-700 px-2 py-3 text-slate-600 dark:text-slate-400 align-top">
                                                        {pkg.Description || '-'}
                                                    </td>

                                                    {/* Giá gói thầu */}
                                                    <td className="border border-slate-200 dark:border-slate-700 px-2 py-3 text-right font-bold text-slate-900 dark:text-slate-100 align-top whitespace-nowrap">
                                                        {formatCurrency(pkg.Price)}
                                                    </td>

                                                    {/* Nguồn vốn */}
                                                    <td className="border border-slate-200 dark:border-slate-700 px-2 py-3 text-slate-700 dark:text-slate-300 align-top">
                                                        {pkg.FundingSource || 'NSNN'}
                                                    </td>

                                                    {/* Hình thức LCNT */}
                                                    <td className="border border-slate-200 dark:border-slate-700 px-2 py-3 text-slate-700 dark:text-slate-300 align-top">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="font-medium">
                                                                {pkg.SelectionMethod === 'OpenBidding' ? 'Đấu thầu rộng rãi' :
                                                                    pkg.SelectionMethod === 'LimitedBidding' ? 'Đấu thầu hạn chế' :
                                                                        pkg.SelectionMethod === 'Appointed' ? 'Chỉ định thầu' :
                                                                            pkg.SelectionMethod === 'CompetitiveShopping' ? 'Chào hàng cạnh tranh' :
                                                                                pkg.SelectionMethod === 'DirectProcurement' ? 'Mua sắm trực tiếp' :
                                                                                    pkg.SelectionMethod}
                                                            </span>
                                                            <span className={`text-[10px] ${pkg.BidType === 'Online' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                                                {pkg.BidType === 'Online' ? '(qua mạng)' : '(trực tiếp)'}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Phương thức LCNT */}
                                                    <td className="border border-slate-200 dark:border-slate-700 px-2 py-3 text-slate-600 dark:text-slate-400 align-top">
                                                        {pkg.SelectionProcedure === 'OneStageOneEnvelope' ? '1GĐ 1 túi HS' :
                                                            pkg.SelectionProcedure === 'OneStageTwoEnvelope' ? '1GĐ 2 túi HS' :
                                                                pkg.SelectionProcedure === 'TwoStageOneEnvelope' ? '2 giai đoạn' :
                                                                    pkg.SelectionProcedure === 'Reduced' ? 'Rút gọn' :
                                                                        pkg.SelectionProcedure === 'Normal' ? 'Thường' : '-'}
                                                    </td>

                                                    {/* Thời gian tổ chức LCNT */}
                                                    <td className="border border-slate-200 dark:border-slate-700 px-2 py-3 text-center text-slate-700 dark:text-slate-300 align-top">
                                                        {pkg.SelectionDuration || '45 ngày'}
                                                    </td>

                                                    {/* Thời gian bắt đầu tổ chức LCNT */}
                                                    <td className="border border-slate-200 dark:border-slate-700 px-2 py-3 text-center text-slate-700 dark:text-slate-300 align-top">
                                                        {pkg.SelectionStartDate || '-'}
                                                    </td>

                                                    {/* Loại hợp đồng */}
                                                    <td className="border border-slate-200 dark:border-slate-700 px-2 py-3 text-center text-slate-700 dark:text-slate-300 align-top">
                                                        {pkg.ContractType === 'LumpSum' ? 'Trọn gói' :
                                                            pkg.ContractType === 'UnitPrice' ? 'Đơn giá CĐ' :
                                                                pkg.ContractType === 'AdjustableUnitPrice' ? 'Đơn giá ĐC' :
                                                                    pkg.ContractType === 'Mixed' ? 'Hỗn hợp' :
                                                                        pkg.ContractType || '-'}
                                                    </td>

                                                    {/* Thời gian thực hiện gói thầu */}
                                                    <td className="border border-slate-200 dark:border-slate-700 px-2 py-3 text-center text-slate-700 dark:text-slate-300 align-top font-medium">
                                                        {pkg.Duration || '-'}
                                                    </td>

                                                    {/* Tùy chọn mua thêm */}
                                                    <td className="border border-slate-200 dark:border-slate-700 px-2 py-3 text-center text-slate-700 dark:text-slate-300 align-top">
                                                        {pkg.HasOption ? 'Có' : 'Không'}
                                                    </td>

                                                    {/* Trạng thái */}
                                                    <td className="border border-slate-200 dark:border-slate-700 px-2 py-3 text-center align-top">
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold ${getStatusColor(pkg.Status)}`}>
                                                                {pkg.Status === PackageStatus.Planning && <Circle className="w-2.5 h-2.5" />}
                                                                {pkg.Status === PackageStatus.Posted && <FileText className="w-2.5 h-2.5" />}
                                                                {pkg.Status === PackageStatus.Bidding && <Clock className="w-2.5 h-2.5 animate-pulse" />}
                                                                {pkg.Status === PackageStatus.Evaluating && <AlertTriangle className="w-2.5 h-2.5" />}
                                                                {pkg.Status === PackageStatus.Awarded && <CheckCircle2 className="w-2.5 h-2.5" />}
                                                                {getStatusLabel(pkg.Status)}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* MSC Status */}
                                                    <td className="border border-slate-200 dark:border-slate-700 px-2 py-3 text-center align-top" onClick={(e) => e.stopPropagation()}>
                                                        {pendingMSC > 0 ? (
                                                            <button
                                                                onClick={() => handleView(pkg)}
                                                                className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-[10px] font-bold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                                                title={`${pendingMSC} tài liệu cần đăng tải`}
                                                            >
                                                                <AlertTriangle className="w-3 h-3" />
                                                                {pendingMSC}
                                                            </button>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-[10px]" title="Đã hoàn thành đăng tải">
                                                                <CheckCircle2 className="w-3 h-3" />
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Action */}
                                                    <td className="border border-slate-200 dark:border-slate-700 px-2 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                        <ActionDropdown
                                                            pkg={pkg}
                                                            isOpen={openDropdownId === pkg.PackageID}
                                                            onToggle={() => setOpenDropdownId(openDropdownId === pkg.PackageID ? null : pkg.PackageID)}
                                                            onClose={() => setOpenDropdownId(null)}
                                                            onView={handleView}
                                                            onEdit={handleEdit}
                                                            onDelete={handleDelete}
                                                            onCopyTBMT={handleCopyTBMT}
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    {/* Group Total */}
                                    {group.packages.length > 0 && (
                                        <tfoot>
                                            <tr className="bg-slate-50 dark:bg-slate-750 font-bold">
                                                <td colSpan={5} className="border border-slate-300 dark:border-slate-600 px-3 py-2 text-right text-slate-700 dark:text-slate-200 text-xs">
                                                    Tổng ({group.packages.length} gói):
                                                </td>
                                                <td className="border border-slate-300 dark:border-slate-600 px-2 py-2 text-right text-slate-900 dark:text-slate-100 tabular-nums text-xs">
                                                    {formatCurrency(group.packages.reduce((sum, pkg) => sum + pkg.Price, 0))}
                                                </td>
                                                <td colSpan={11} className="border border-slate-300 dark:border-slate-600"></td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        )}
                    </div>
                ))}

                {/* Empty State */}
                {planGroups.length === 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-12 text-center">
                        <FileText className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto" />
                        <p className="text-gray-500 dark:text-slate-400 mt-2">Không tìm thấy gói thầu nào</p>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            <BiddingPackageModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                projectId={projectID}
            />

            {/* Edit Modal */}
            <BiddingPackageModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedPackage(null);
                }}
                projectId={projectID}
                packageToEdit={selectedPackage}
            />

            {/* Detail Modal */}
            <BiddingPackageDetail
                isOpen={isDetailModalOpen}
                onClose={() => {
                    setIsDetailModalOpen(false);
                    setSelectedPackage(null);
                }}
                package_data={selectedPackage}
                onEdit={(pkg) => {
                    setIsDetailModalOpen(false);
                    handleEdit(pkg);
                }}
            />

            {/* Delete Confirmation */}
            {isDeleteConfirmOpen && selectedPackage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsDeleteConfirmOpen(false)} />
                    <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6 animate-scale-in">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">Xác nhận xóa</h3>
                                <p className="text-sm text-gray-500 dark:text-slate-400">Hành động này không thể hoàn tác</p>
                            </div>
                        </div>
                        <p className="text-gray-600 dark:text-slate-300 mb-6">
                            Bạn có chắc chắn muốn xóa gói thầu <strong>{selectedPackage.PackageNumber}</strong>?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setIsDeleteConfirmOpen(false)}
                                className="px-4 py-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={deleteMutation.isPending}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                                {deleteMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete ALL Confirmation */}
            {isDeleteAllConfirmOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsDeleteAllConfirmOpen(false)} />
                    <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6 animate-scale-in">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">Xóa tất cả gói thầu</h3>
                                <p className="text-sm text-gray-500 dark:text-slate-400">Hành động này không thể hoàn tác</p>
                            </div>
                        </div>
                        <p className="text-gray-600 dark:text-slate-300 mb-6">
                            Bạn có chắc chắn muốn xóa <strong className="text-red-600">{packages?.length || 0} gói thầu</strong> của dự án này?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setIsDeleteAllConfirmOpen(false)}
                                className="px-4 py-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={() => deleteAllMutation.mutate()}
                                disabled={deleteAllMutation.isPending}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                                {deleteAllMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                                Xóa tất cả
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* KHLCNT Export Modal */}
            <KHLCNTExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                packages={(packages || []).filter(p => selectedPackageIds.has(p.PackageID))}
                project={project}
            />

            {/* Import Modal */}
            <BiddingImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                projectId={projectID}
            />
        </div>
    );
};

// Action Dropdown Component
interface ActionDropdownProps {
    pkg: BiddingPackage;
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
    onView: (pkg: BiddingPackage) => void;
    onEdit: (pkg: BiddingPackage) => void;
    onDelete: (pkg: BiddingPackage) => void;
    onCopyTBMT: (code: string) => void;
}

const ActionDropdown: React.FC<ActionDropdownProps> = ({
    pkg, isOpen, onToggle, onClose, onView, onEdit, onDelete, onCopyTBMT
}) => {
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={onToggle}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-500 dark:text-slate-400 transition-colors"
            >
                <MoreVertical size={16} />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-100 dark:border-slate-600 py-1 z-20 animate-fade-in">
                    <button
                        onClick={() => onView(pkg)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                    >
                        <Eye className="w-4 h-4" />
                        Xem chi tiết
                    </button>
                    <button
                        onClick={() => onEdit(pkg)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                    >
                        <Edit className="w-4 h-4" />
                        Chỉnh sửa
                    </button>
                    {pkg.NotificationCode && (
                        <>
                            <hr className="my-1 border-gray-100 dark:border-slate-700" />
                            <a
                                href={getMSCPackageLink(pkg.NotificationCode)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Xem trên MSC
                            </a>
                            <button
                                onClick={() => onCopyTBMT(pkg.NotificationCode!)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                            >
                                <Copy className="w-4 h-4" />
                                Sao chép link TBMT
                            </button>
                        </>
                    )}
                    <hr className="my-1 border-gray-100 dark:border-slate-700" />
                    <button
                        onClick={() => onDelete(pkg)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                        <Trash2 className="w-4 h-4" />
                        Xóa
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProjectPackagesTab;
