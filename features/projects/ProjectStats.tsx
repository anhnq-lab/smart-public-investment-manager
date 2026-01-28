import React from 'react';
import { Project, ProjectStatus, ProjectGroup } from '../../types';
import { Wallet, TrendingUp, FolderOpen, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../mockData';

interface ProjectStatsProps {
    projects: Project[];
}

export const ProjectStats: React.FC<ProjectStatsProps> = ({ projects }) => {
    // Calculate Stats
    const totalProjects = projects.length;
    const totalCapital = projects.reduce((sum, p) => sum + p.TotalInvestment, 0);
    const avgDisbursement = totalProjects > 0
        ? projects.reduce((sum, p) => sum + (p.PaymentProgress || 0), 0) / totalProjects
        : 0;

    const activeProjects = projects.filter(p => p.Status === ProjectStatus.Execution).length;
    const preparingProjects = projects.filter(p => p.Status === ProjectStatus.Preparation).length;

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <FolderOpen className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Tổng số dự án</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-2xl font-black text-gray-800">{totalProjects}</h3>
                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                            {activeProjects} đang chạy
                        </span>
                    </div>
                </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Wallet className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Tổng vốn đầu tư</p>
                    <h3 className="text-2xl font-black text-gray-800 tracking-tight">{formatCurrency(totalCapital)}</h3>
                </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                    <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Giải ngân TB</p>
                    <h3 className="text-2xl font-black text-gray-800">{avgDisbursement.toFixed(1)}%</h3>
                </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                    <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Chuẩn bị đầu tư</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-2xl font-black text-gray-800">{preparingProjects}</h3>
                        <span className="text-xs text-gray-400">dự án</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
