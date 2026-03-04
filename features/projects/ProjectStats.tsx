import React from 'react';
import { Project, ProjectStatus } from '../../types';
import { Wallet, TrendingUp, FolderOpen, AlertCircle } from 'lucide-react';
import { formatShortCurrency as formatCurrency } from '../../utils/format';
import { StatCard } from '../../components/common/StatCard';

interface ProjectStatsProps {
    projects: Project[];
}

export const ProjectStats: React.FC<ProjectStatsProps> = ({ projects }) => {
    const totalProjects = projects.length;
    const totalCapital = projects.reduce((sum, p) => sum + p.TotalInvestment, 0);
    const avgDisbursement = totalProjects > 0
        ? projects.reduce((sum, p) => sum + (p.PaymentProgress || 0), 0) / totalProjects
        : 0;

    const activeProjects = projects.filter(p => p.Status === ProjectStatus.Execution).length;
    const preparingProjects = projects.filter(p => p.Status === ProjectStatus.Preparation).length;

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
                label="Tổng số dự án"
                value={totalProjects}
                icon={<FolderOpen className="w-6 h-6" />}
                color="blue"
                sublabel={`${activeProjects} đang chạy`}
            />
            <StatCard
                label="Tổng vốn đầu tư"
                value={formatCurrency(totalCapital)}
                icon={<Wallet className="w-6 h-6" />}
                color="emerald"
            />
            <StatCard
                label="Giải ngân TB"
                value={`${avgDisbursement.toFixed(1)}%`}
                icon={<TrendingUp className="w-6 h-6" />}
                color="violet"
            />
            <StatCard
                label="Chuẩn bị dự án"
                value={preparingProjects}
                icon={<AlertCircle className="w-6 h-6" />}
                color="amber"
                sublabel="dự án"
            />
        </div>
    );
};
