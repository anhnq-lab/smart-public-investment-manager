import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, MapPin, Trash2, Pencil, Building2, Hash, Calendar } from 'lucide-react';
import { Project, ProjectStatus, ProjectGroup } from '@/types';
import { formatShortCurrency } from '@/utils/format';

interface ProjectHeaderProps {
    project: Project;
    onSync: () => void;
    isSyncing: boolean;
    syncResult: any;
    onDelete?: () => void;
    onEdit?: () => void;
    compact?: boolean;
}

const getGroupBadge = (group: ProjectGroup) => {
    switch (group) {
        case ProjectGroup.QN: return { label: 'Quan trọng QG', bg: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' };
        case ProjectGroup.A: return { label: 'Nhóm A', bg: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800' };
        case ProjectGroup.B: return { label: 'Nhóm B', bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' };
        case ProjectGroup.C: return { label: 'Nhóm C', bg: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800' };
        default: return { label: group, bg: 'bg-gray-50 text-gray-700 border-gray-200' };
    }
};

const getStatusConfig = (status: ProjectStatus) => {
    switch (status) {
        case ProjectStatus.Preparation: return { label: 'CHUẨN BỊ DỰ ÁN', bg: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-800' };
        case ProjectStatus.Execution: return { label: 'ĐANG TRIỂN KHAI', bg: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-100 dark:border-orange-800' };
        case ProjectStatus.Completion: return { label: 'ĐÃ KẾT THÚC', bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800' };
        default: return { label: 'N/A', bg: 'bg-gray-50 text-gray-700' };
    }
};

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({ project, onSync, isSyncing, syncResult, onDelete, onEdit, compact }) => {
    const navigate = useNavigate();
    const groupBadge = getGroupBadge(project.GroupCode);
    const statusConfig = getStatusConfig(project.Status);

    // Progress bar mini
    const progress = project.Progress || 0;

    // ── Compact mode: single-line header for BIM tab ──
    if (compact) {
        return (
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-2 flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-all shrink-0"
                    >
                        <ArrowLeft className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                    </button>
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {project.ProjectName}
                    </h2>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase shrink-0 ${statusConfig.bg}`}>
                        {statusConfig.label}
                    </span>
                    <div className="hidden sm:flex items-center gap-2 text-[11px] text-gray-400 dark:text-slate-500 shrink-0">
                        <Hash className="w-3 h-3" />
                        <span className="font-mono">{project.ProjectNumber || project.ProjectID}</span>
                    </div>
                    <span className={`hidden md:inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold border shrink-0 ${groupBadge.bg}`}>
                        {groupBadge.label}
                    </span>
                    <span className="hidden md:inline-flex text-[11px] font-bold text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-slate-700 shrink-0">
                        {formatShortCurrency(project.TotalInvestment)}
                    </span>
                    <div className="flex-1" />
                    {onEdit && (
                        <button
                            onClick={onEdit}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold shadow-sm transition-all shrink-0"
                            title="Chỉnh sửa thông tin dự án"
                        >
                            <Pencil className="w-3 h-3" />
                            Chỉnh sửa
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={onDelete}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all text-gray-400 hover:text-red-600 dark:hover:text-red-400 shrink-0"
                            title="Xoá dự án"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            {/* Top section - Header */}
            <div className="px-6 py-6 border-b border-gray-50 dark:border-slate-800/50">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all border border-transparent hover:border-gray-200 dark:hover:border-slate-600 bg-white dark:bg-slate-800 shadow-sm"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-slate-400" />
                        </button>
                        <div className="flex-1 min-w-0">
                            {/* Title + Status Badge */}
                            <div className="flex flex-wrap items-center gap-3 mb-1">
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
                                    {project.ProjectName}
                                </h2>
                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest uppercase ${statusConfig.bg}`}>
                                    {statusConfig.label}
                                </span>
                            </div>

                            {/* Metadata Row */}
                            <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
                                {/* Project ID */}
                                <div className="flex items-center gap-2 group cursor-help">
                                    <Hash className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />
                                    <span className="text-gray-400 font-mono text-[11px] group-hover:text-blue-500 transition-colors">
                                        {project.ProjectNumber || project.ProjectID}
                                    </span>
                                </div>
                                {/* Location */}
                                {project.LocationCode && (
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <MapPin className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />
                                        <span className="text-xs">{project.LocationCode}</span>
                                    </div>
                                )}
                                {/* Investor */}
                                {project.InvestorName && (
                                    <div className="flex items-center gap-2 text-gray-500 dark:text-slate-400">
                                        <Building2 className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />
                                        <span className="text-xs truncate max-w-[200px]">{project.InvestorName}</span>
                                    </div>
                                )}
                                {/* Group Badge */}
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${groupBadge.bg}`}>
                                    {groupBadge.label}
                                </span>
                                {/* Budget */}
                                <span className="text-xs font-bold text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-gray-200 dark:border-slate-700">
                                    {formatShortCurrency(project.TotalInvestment)}
                                </span>
                            </div>

                            {/* Sync Button */}
                            <button
                                onClick={onSync}
                                disabled={isSyncing}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all mt-1 ${project.SyncStatus?.IsSynced || syncResult?.success
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700'
                                    }`}
                                title={project.SyncStatus?.LastSyncDate ? `Đồng bộ lần cuối: ${project.SyncStatus.LastSyncDate}` : 'Chưa đồng bộ'}
                            >
                                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                                {isSyncing ? 'Đang đồng bộ...' : (project.SyncStatus?.IsSynced || syncResult?.success ? 'Đã đồng bộ QG' : 'Đồng bộ QG')}
                            </button>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 mt-auto">
                        {onEdit && (
                            <button
                                onClick={onEdit}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-200 dark:shadow-blue-900/30 transition-all hover:-translate-y-0.5"
                                title="Chỉnh sửa thông tin dự án"
                            >
                                <Pencil className="w-3.5 h-3.5" />
                                Chỉnh sửa
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={onDelete}
                                className="ml-auto p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all border border-transparent hover:border-red-200 dark:hover:border-red-800 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                title="Xoá dự án"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
