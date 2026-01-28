import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, MapPin } from 'lucide-react';
import { Project, ProjectStatus } from '@/types';

interface ProjectHeaderProps {
    project: Project;
    onSync: () => void;
    isSyncing: boolean;
    syncResult: any;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({ project, onSync, isSyncing, syncResult }) => {
    const navigate = useNavigate();

    return (
        <div className="space-y-6 animate-in fade-in duration-300 relative bg-[#F8FAFC]">
            {/* Header Section */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-gray-200 bg-white shadow-sm">
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">{project.ProjectName}</h1>
                        <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${project.Status === ProjectStatus.Finished ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                            {project.Status === ProjectStatus.Finished ? 'ĐÃ KẾT THÚC' : 'ĐANG TRIỂN KHAI'}
                        </span>
                    </div>
                    {/* Sync Button */}
                    <button
                        onClick={onSync}
                        disabled={isSyncing}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all mt-1 ${project.SyncStatus?.IsSynced || syncResult?.success
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                            }`}
                        title={project.SyncStatus?.LastSyncDate ? `Đồng bộ lần cuối: ${project.SyncStatus.LastSyncDate}` : 'Chưa đồng bộ'}
                    >
                        <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'Đang đồng bộ...' : (project.SyncStatus?.IsSynced || syncResult?.success ? 'Đã đồng bộ QG' : 'Đồng bộ QG')}
                    </button>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500 mt-1 ml-auto">
                    <span className="font-mono bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-xs font-bold">{project.ProjectID}</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span className="font-semibold text-gray-600">Nhóm {project.GroupCode}</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-red-400" /> {project.LocationCode}</span>
                </div>
            </div>
        </div>
    );
};
