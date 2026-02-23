import React from 'react';
import { Project, ProjectStatus, ProjectGroup } from '../../types';
import { Wallet, TrendingUp, FolderOpen, AlertCircle } from 'lucide-react';
import { formatShortCurrency as formatCurrency } from '../../utils/format';

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
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl ring-2 ring-blue-100 dark:ring-blue-800">
                    <FolderOpen className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Tổng số dự án</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-2xl font-black text-gray-800 dark:text-slate-100">{totalProjects}</h3>
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">
                            {activeProjects} đang chạy
                        </span>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-4">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl ring-2 ring-emerald-100 dark:ring-emerald-800">
                    <Wallet className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Tổng vốn đầu tư</p>
                    <h3 className="text-2xl font-black text-gray-800 dark:text-slate-100 tracking-tight">{formatCurrency(totalCapital)}</h3>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-4">
                <div className="p-3 bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-xl ring-2 ring-violet-100 dark:ring-violet-800">
                    <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Giải ngân TB</p>
                    <h3 className="text-2xl font-black text-gray-800 dark:text-slate-100">{avgDisbursement.toFixed(1)}%</h3>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl ring-2 ring-amber-100 dark:ring-amber-800">
                    <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Chuẩn bị dự án</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-2xl font-black text-gray-800 dark:text-slate-100">{preparingProjects}</h3>
                        <span className="text-xs text-gray-400 dark:text-slate-500">dự án</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
