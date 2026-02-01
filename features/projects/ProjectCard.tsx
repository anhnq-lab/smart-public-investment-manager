import React from 'react';
import { Project, ProjectStatus, ProjectGroup } from '../../types';
import { MapPin, Building, Layers } from 'lucide-react';
import { formatCurrency } from '../../mockData';
import { getGroupGradient, requiresBIM } from '../../utils/projectCompliance';

interface ProjectCardProps {
    project: Project;
    onClick: () => void;
    layout?: 'grid' | 'list';
}

const getStatusLabel = (status: ProjectStatus) => {
    switch (status) {
        case ProjectStatus.Preparation: return 'Chuẩn bị ĐT';
        case ProjectStatus.Execution: return 'Thực hiện ĐT';
        case ProjectStatus.Finished: return 'Hoàn thành';
        case ProjectStatus.Operation: return 'Vận hành';
        default: return 'N/A';
    }
};

const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
        case ProjectStatus.Preparation: return 'bg-gradient-to-r from-amber-400 to-orange-500';
        case ProjectStatus.Execution: return 'bg-gradient-to-r from-blue-500 to-blue-600';
        case ProjectStatus.Finished: return 'bg-gradient-to-r from-emerald-500 to-emerald-600';
        case ProjectStatus.Operation: return 'bg-gradient-to-r from-violet-500 to-purple-600';
        default: return 'bg-gray-400';
    }
};

const ProgressBar: React.FC<{ value: number; colorClass: string }> = ({ value, colorClass }) => (
    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div
            className={`h-full rounded-full ${colorClass} transition-all duration-500`}
            style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        ></div>
    </div>
);

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick, layout = 'grid' }) => {
    const badgeColor = getStatusColor(project.Status);

    if (layout === 'list') {
        return (
            <div
                onClick={onClick}
                className="group flex flex-col md:flex-row bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all cursor-pointer"
            >
                <div className="w-full md:w-56 h-32 md:h-auto relative shrink-0">
                    <img
                        src={project.ImageUrl || "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=600&auto=format&fit=crop"}
                        alt={project.ProjectName}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 right-2 flex justify-between">
                        <span className={`${getGroupGradient(project.GroupCode)} text-[9px] font-bold px-2 py-0.5 rounded-full uppercase`}>
                            Nhóm {project.GroupCode}
                        </span>
                        <span className={`${badgeColor} text-white text-[9px] font-bold px-2 py-0.5 rounded-full`}>
                            {getStatusLabel(project.Status)}
                        </span>
                    </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                        <h3 className="font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors mb-1">
                            {project.ProjectName}
                        </h3>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                            <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {project.LocationCode}
                            </span>
                            <span className="font-mono">#{(project.ProjectID || '').slice(-5)}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 items-end">
                        <div>
                            <div className="flex justify-between text-[10px] mb-1">
                                <span className="text-gray-500">Tiến độ</span>
                                <span className="font-bold text-blue-600">{project.Progress || 0}%</span>
                            </div>
                            <ProgressBar value={project.Progress || 0} colorClass="bg-blue-500" />
                        </div>
                        <div>
                            <div className="flex justify-between text-[10px] mb-1">
                                <span className="text-gray-500">Giải ngân</span>
                                <span className="font-bold text-emerald-600">{project.PaymentProgress || 0}%</span>
                            </div>
                            <ProgressBar value={project.PaymentProgress || 0} colorClass="bg-emerald-500" />
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-gray-400 uppercase">Ngân sách</p>
                            <p className="text-sm font-bold text-gray-900 tabular-nums">{formatCurrency(project.TotalInvestment)}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Grid Layout - Clean & Compact
    return (
        <div
            onClick={onClick}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all group flex flex-col cursor-pointer"
        >
            {/* Image - Only badges */}
            <div className="relative h-32 w-full overflow-hidden">
                <img
                    src={project.ImageUrl || "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=600&auto=format&fit=crop"}
                    alt={project.ProjectName}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Badges */}
                <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
                    <span className={`${getGroupGradient(project.GroupCode)} text-[9px] font-bold px-2 py-0.5 rounded-full uppercase shadow`}>
                        Nhóm {project.GroupCode}
                    </span>
                    <span className={`${badgeColor} text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow`}>
                        {getStatusLabel(project.Status)}
                    </span>
                </div>

                {/* BIM Badge */}
                {project.RequiresBIM && (
                    <div className="absolute bottom-2 right-2">
                        <span className={`flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded shadow ${project.BIMStatus === 'Active' ? 'bg-green-500 text-white' : 'bg-amber-400 text-amber-900'
                            }`} title="Bắt buộc BIM (NĐ 175)">
                            <Layers className="w-2.5 h-2.5" />
                            BIM
                        </span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-3 flex-1 flex flex-col">
                {/* Title */}
                <h3 className="font-bold text-sm text-gray-900 leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors mb-1.5" title={project.ProjectName}>
                    {project.ProjectName}
                </h3>

                {/* Location + ID */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        {project.LocationCode}
                    </span>
                    <span className="font-mono text-[10px] bg-gray-50 px-1.5 py-0.5 rounded">
                        #{(project.ProjectID || '').slice(-5)}
                    </span>
                </div>

                {/* Progress */}
                <div className="space-y-2 mb-3">
                    <div>
                        <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-gray-500">Tiến độ</span>
                            <span className="font-bold text-blue-600 tabular-nums">{project.Progress || 0}%</span>
                        </div>
                        <ProgressBar value={project.Progress || 0} colorClass="bg-gradient-to-r from-blue-400 to-blue-600" />
                    </div>
                    <div>
                        <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-gray-500">Giải ngân</span>
                            <span className="font-bold text-emerald-600 tabular-nums">{project.PaymentProgress || 0}%</span>
                        </div>
                        <ProgressBar value={project.PaymentProgress || 0} colorClass="bg-gradient-to-r from-emerald-400 to-emerald-600" />
                    </div>
                </div>

                {/* Total Investment Footer */}
                <div className="mt-auto pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">Tổng mức ĐT</span>
                        <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tabular-nums">{formatCurrency(project.TotalInvestment)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
