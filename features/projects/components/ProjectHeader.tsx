import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, MapPin, Trash2 } from 'lucide-react';
import { Project, ProjectStatus } from '@/types';

interface ProjectHeaderProps {
    project: Project;
    onSync: () => void;
    isSyncing: boolean;
    syncResult: any;
    onDelete?: () => void;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({ project, onSync, isSyncing, syncResult, onDelete }) => {
    const navigate = useNavigate();

    return (
        <div className="space-y-6 animate-in fade-in duration-300 relative bg-[#F8FAFC] dark:bg-slate-900">
            {/* Header Section */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all border border-transparent hover:border-gray-200 dark:hover:border-slate-600 bg-white dark:bg-slate-800 shadow-sm">
                    <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-slate-400" />
                </button>
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-extrabold text-gray-800 dark:text-slate-100 tracking-tight">{project.ProjectName}</h1>
                        <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${project.Status === ProjectStatus.Completion ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                            {project.Status === ProjectStatus.Completion ? 'ĐÃ KẾT THÚC' : 'ĐANG TRIỂN KHAI'}
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

                {/* Delete Button */}
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
    );
};
