import React from 'react';
import { Project, ProjectStage, Employee, BiddingPackage } from '@/types';
import { Landmark, FileBarChart, FileCheck, RefreshCw } from 'lucide-react';
import { SyncResult } from '@/services/NationalGatewayService';
import { LifecycleStepper } from '../LifecycleStepper';
import { DualProgressCard } from '../DualProgressCard';
import { KeyMetricsHeader } from '../KeyMetricsHeader';
import { ProjectTeamSection } from '../ProjectTeamSection';
import { ContractorsListSection } from '../ContractorsListSection';

interface ProjectInfoTabProps {
    project: Project & {
        Stage?: ProjectStage;
        PhysicalProgress?: number;
        FinancialProgress?: number;
        RequiresBIM?: boolean;
        BIMStatus?: string;
    };
    projectMembers: Employee[];
    projectPackages: BiddingPackage[];
    isSyncing: boolean;
    syncResult: SyncResult | null;
    isGeneratingReport: boolean;
    onGenerateReport: (type: 'Monitoring' | 'Settlement') => void;
    onViewMember?: (employeeId: string) => void;
    onViewPackage?: (packageId: string) => void;
}

export const ProjectInfoTab: React.FC<ProjectInfoTabProps> = ({
    project,
    projectMembers,
    projectPackages,
    isSyncing,
    syncResult,
    isGeneratingReport,
    onGenerateReport,
    onViewMember,
    onViewPackage
}) => {
    // Calculate disbursed amount from financial progress
    const disbursedAmount = (project.FinancialProgress ?? 0) * project.TotalInvestment / 100;

    return (
        <div className="animate-in slide-in-from-bottom-2 duration-500 space-y-6 py-4">

            {/* LIFECYCLE STEPPER - Full Width */}
            <LifecycleStepper
                currentStage={project.Stage || ProjectStage.Preparation}
                stageHistory={[]}
            />

            {/* KEY METRICS HEADER - Full Width */}
            <KeyMetricsHeader
                totalInvestment={project.TotalInvestment}
                disbursedAmount={disbursedAmount}
                physicalProgress={project.PhysicalProgress ?? 0}
            />

            {/* National Gateway Section - Compact */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-100 overflow-hidden">
                <div className="px-5 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${project.SyncStatus?.IsSynced || syncResult?.success ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                            <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <Landmark className="w-4 h-4 text-blue-600" />
                                <h3 className="font-bold text-blue-800 text-xs uppercase">Cổng CSDLQG (NĐ 111)</h3>
                            </div>
                            <p className="text-sm font-bold text-gray-800 mt-0.5">
                                {isSyncing ? 'Đang kết nối...' : (
                                    (project.SyncStatus?.IsSynced || syncResult?.success)
                                        ? `✓ Mã: ${syncResult?.nationalCode || project.SyncStatus?.NationalProjectCode || 'ND111-2024'}`
                                        : 'Chưa đồng bộ'
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => onGenerateReport('Monitoring')}
                            disabled={isGeneratingReport}
                            className="px-3 py-1.5 bg-white text-blue-700 text-xs font-bold rounded-md border border-blue-200 hover:bg-blue-50 flex items-center gap-2 transition-all shadow-sm"
                        >
                            <FileBarChart className="w-3.5 h-3.5" /> Báo cáo GS
                        </button>
                        <button
                            onClick={() => onGenerateReport('Settlement')}
                            disabled={isGeneratingReport}
                            className="px-3 py-1.5 bg-white text-blue-700 text-xs font-bold rounded-md border border-blue-200 hover:bg-blue-50 flex items-center gap-2 transition-all shadow-sm"
                        >
                            <FileCheck className="w-3.5 h-3.5" /> Báo cáo QT
                        </button>
                    </div>
                </div>
            </div>

            {/* 2-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT COLUMN - 2/3 width */}
                <div className="lg:col-span-2 space-y-6">
                    {/* General Info Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                            <h3 className="font-bold text-gray-800 text-xs uppercase">Thông tin chung</h3>
                        </div>
                        <div className="p-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                                <InfoItem label="Số dự án" value={project.ProjectNumber || project.ProjectID} />
                                <InfoItem label="Nhóm dự án" value={`Nhóm ${project.GroupCode}`} highlight />
                                <InfoItem label="Tên dự án" value={project.ProjectName} span2 />
                                <InfoItem label="Chủ đầu tư" value={project.InvestorName} />
                                <InfoItem label="Địa điểm" value={project.LocationCode} />
                                <InfoItem label="Thời gian thực hiện" value={project.Duration || '5 Năm'} />
                                <InfoItem label="Hình thức quản lý" value={project.ManagementForm || 'Chủ đầu tư trực tiếp quản lý'} />
                                <InfoItem label="Nguồn vốn" value={project.CapitalSource || 'Ngân sách tỉnh'} />
                            </div>
                        </div>
                    </div>

                    {/* Project Team Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-5">
                        <ProjectTeamSection
                            members={projectMembers}
                            onViewMember={onViewMember}
                        />
                    </div>
                </div>

                {/* RIGHT SIDEBAR - 1/3 width */}
                <div className="space-y-6">
                    {/* Progress Card */}
                    <DualProgressCard
                        physicalProgress={project.PhysicalProgress ?? 0}
                        financialProgress={project.FinancialProgress ?? 0}
                    />

                    {/* Contractors List */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-5">
                        <ContractorsListSection
                            contractors={[]}
                            packages={projectPackages}
                            onViewPackage={onViewPackage}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper Component
const InfoItem: React.FC<{
    label: string;
    value: string;
    highlight?: boolean;
    span2?: boolean;
}> = ({ label, value, highlight, span2 }) => (
    <div className={`flex flex-col ${span2 ? 'md:col-span-2' : ''}`}>
        <span className="text-xs text-gray-500 mb-1">{label}</span>
        <span className={`text-sm font-medium ${highlight ? 'text-blue-700 font-bold' : 'text-gray-900'}`}>
            {value}
        </span>
    </div>
);
