import React from 'react';
import { Project, ProjectStatus, ProjectGroup } from '../../types';
import { MapPin, Building, ArrowRight, Wallet, Users, Calendar, Layers } from 'lucide-react';
import { formatCurrency } from '../../mockData';
import { getGroupGradient, requiresBIM } from '../../utils/projectCompliance';

interface ProjectCardProps {
    project: Project;
    onClick: () => void;
    layout?: 'grid' | 'list';
}

const getStatusLabel = (status: ProjectStatus) => {
    switch (status) {
        case ProjectStatus.Preparation: return 'Chuẩn bị đầu tư';
        case ProjectStatus.Execution: return 'Thực hiện đầu tư';
        case ProjectStatus.Finished: return 'Kết thúc đầu tư';
        case ProjectStatus.Operation: return 'Vận hành khai thác';
        default: return 'Không xác định';
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

const getStatusIconStyles = (status: ProjectStatus) => {
    switch (status) {
        case ProjectStatus.Preparation: return { bg: 'bg-amber-50', text: 'text-amber-600' };
        case ProjectStatus.Execution: return { bg: 'bg-blue-50', text: 'text-blue-600' };
        case ProjectStatus.Finished: return { bg: 'bg-emerald-50', text: 'text-emerald-600' };
        case ProjectStatus.Operation: return { bg: 'bg-violet-50', text: 'text-violet-600' };
        default: return { bg: 'bg-gray-50', text: 'text-gray-500' };
    }
};

// StageIndicator removed - redundant since status badge shows current stage

const ProgressBar: React.FC<{ value: number; colorClass: string }> = ({ value, colorClass }) => (
    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div
            className={`h-full rounded-full ${colorClass} transition-all duration-500`}
            style={{ width: `${value}%` }}
        ></div>
    </div>
);

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick, layout = 'grid' }) => {
    // Determine status badge color
    const badgeColor = getStatusColor(project.Status);
    const disbursedAmount = (project.TotalInvestment * (project.PaymentProgress || 0)) / 100;

    if (layout === 'list') {
        return (
            <div
                onClick={onClick}
                className="group flex flex-col md:flex-row bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all cursor-pointer"
            >
                <div className="w-full md:w-64 h-40 md:h-auto relative shrink-0">
                    <img
                        src={project.ImageUrl || "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=600&auto=format&fit=crop"}
                        alt={project.ProjectName}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                        <span className={`${badgeColor} text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide shadow-sm`}>
                            {getStatusLabel(project.Status)}
                        </span>
                    </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">
                                    {project.ProjectName}
                                </h3>
                                <p className="text-xs text-gray-500 font-mono mt-0.5">{project.ProjectID}</p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Tổng mức ĐT</p>
                                <p className="text-sm font-bold text-blue-600 font-mono">{formatCurrency(project.TotalInvestment)}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 mb-4">
                            <div className="flex items-center gap-2">
                                <Building className="w-3.5 h-3.5 text-gray-400" />
                                <span className="truncate">{project.InvestorName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                <span>{project.LocationCode}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 items-end">
                        <div>
                            <div className="flex justify-between text-[10px] mb-1.5">
                                <span className="text-gray-500">Tiến độ</span>
                                <span className="font-bold text-blue-600">{project.Progress || 0}%</span>
                            </div>
                            <ProgressBar value={project.Progress || 0} colorClass="bg-blue-500" />
                        </div>
                        <div>
                            <div className="flex justify-between text-[10px] mb-1.5">
                                <span className="text-gray-500">Giải ngân</span>
                                <span className="font-bold text-emerald-600">{project.PaymentProgress || 0}%</span>
                            </div>
                            <ProgressBar value={project.PaymentProgress || 0} colorClass="bg-emerald-500" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Default Grid Layout
    return (
        <div
            onClick={onClick}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group flex flex-col h-full cursor-pointer hover:-translate-y-1"
        >
            {/* Image Header */}
            <div className="relative h-48 w-full overflow-hidden">
                <img
                    src={project.ImageUrl || "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=600&auto=format&fit=crop"}
                    alt={project.ProjectName}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

                {/* Top badges row */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                    {/* Group Badge - Left */}
                    <span className={`${getGroupGradient(project.GroupCode)} text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide shadow-md`}>
                        {project.GroupCode === 'QN' ? 'QT Quốc gia' : `Nhóm ${project.GroupCode}`}
                    </span>

                    {/* Status Badge - Right */}
                    <span className={`${badgeColor} text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wide shadow-sm`}>
                        {getStatusLabel(project.Status)}
                    </span>
                </div>

                {/* Bottom info */}
                <div className="absolute bottom-4 left-4 right-4 text-white">
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="font-extrabold text-lg leading-tight truncate flex-1" style={{ textShadow: '0 2px 6px rgba(0,0,0,0.6)' }} title={project.ProjectName}>{project.ProjectName}</h3>
                        {/* BIM indicator - Dự án bắt buộc BIM theo NĐ 175/2024 */}
                        {project.RequiresBIM && (
                            <span className={`ml-2 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded shadow-md ${project.BIMStatus === 'Active' ? 'bg-green-500 text-white' : 'bg-amber-400 text-amber-900'
                                }`} title="Dự án bắt buộc BIM theo NĐ 175/2024">
                                <Layers className="w-3 h-3" />
                                BIM
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-100">
                        <MapPin className="w-3.5 h-3.5" />
                        <span style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>{project.LocationCode}</span>
                    </div>
                </div>
            </div>

            {/* Content Body */}
            <div className="p-5 flex-1 flex flex-col">
                {/* Contractor Info */}
                <div className="flex items-center gap-3 mb-5">
                    {(() => {
                        const iconStyles = getStatusIconStyles(project.Status);
                        return (
                            <div className={`w-9 h-9 rounded-full ${iconStyles.bg} flex items-center justify-center ${iconStyles.text} shrink-0 ring-2 ring-white shadow-sm`}>
                                <Building className="w-5 h-5" />
                            </div>
                        );
                    })()}
                    <div className="overflow-hidden">
                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">NHÀ THẦU CHÍNH</p>
                        <p className="text-sm font-medium text-gray-700 truncate" title={project.MainContractorName}>{project.MainContractorName || "Đang lựa chọn"}</p>
                    </div>
                    <span className="ml-auto text-xs text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded">
                        {(project.ProjectID || '').slice(-5)}
                    </span>
                </div>

                {/* Progress Stats */}
                <div className="space-y-3 mb-5">
                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600 font-medium">Tiến độ dự án</span>
                            <span className="font-bold text-blue-600 tabular-nums">{project.Progress || 0}%</span>
                        </div>
                        <ProgressBar value={project.Progress || 0} colorClass="bg-gradient-to-r from-blue-400 to-blue-600" />
                    </div>

                    {/* Disbursement with Tooltip */}
                    <div className="group/tooltip relative">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600 font-medium">Tỷ lệ giải ngân</span>
                            <span className="font-bold text-emerald-600 tabular-nums">{project.PaymentProgress || 0}%</span>
                        </div>
                        <ProgressBar value={project.PaymentProgress || 0} colorClass="bg-gradient-to-r from-emerald-400 to-emerald-600" />

                        {/* Hover Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/tooltip:block z-10 w-max animate-in fade-in zoom-in-95 duration-200">
                            <div className="bg-slate-800 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg shadow-xl border border-slate-700 relative">
                                Đã giải ngân: {formatCurrency(disbursedAmount)}
                                <div className="w-2 h-2 bg-slate-800 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2 border-r border-b border-slate-700"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-auto pt-4 border-t border-gray-100/80 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">NGÂN SÁCH</p>
                        <p className="text-lg font-bold text-gray-900 font-mono truncate">{formatCurrency(project.TotalInvestment)}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shrink-0 shadow-sm">
                        <ArrowRight className="w-5 h-5" />
                    </div>
                </div>
            </div>
        </div>
    );
};
