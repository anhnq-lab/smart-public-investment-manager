import React, { useState } from 'react';
import { Project, ProjectStage, Employee, BiddingPackage } from '@/types';
import {
    Landmark, FileBarChart, FileCheck, RefreshCw, Settings,
    Clock, CheckCircle2, AlertCircle, ExternalLink, ChevronDown, ChevronUp
} from 'lucide-react';
import { SyncResult } from '@/services/NationalGatewayService';
import { LifecycleStepper, StageHistoryEntry } from '../LifecycleStepper';
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
        StageHistory?: StageHistoryEntry[];
    };
    projectMembers: Employee[];
    projectPackages: BiddingPackage[];
    isSyncing: boolean;
    syncResult: SyncResult | null;
    isGeneratingReport: boolean;
    onGenerateReport: (type: 'Monitoring' | 'Settlement') => void;
    onViewMember?: (employeeId: string) => void;
    onViewPackage?: (packageId: string) => void;
    onStageChange?: (newStage: ProjectStage, entry: StageHistoryEntry) => void;
    onHistoryUpdate?: (history: StageHistoryEntry[]) => void;
    canEditLifecycle?: boolean;
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
    onViewPackage,
    onStageChange,
    onHistoryUpdate,
    canEditLifecycle = true
}) => {
    const [showSyncDetails, setShowSyncDetails] = useState(false);

    // Calculate disbursed amount from financial progress
    const disbursedAmount = (project.FinancialProgress ?? 0) * project.TotalInvestment / 100;

    // Determine sync status
    const isSynced = project.SyncStatus?.IsSynced || syncResult?.success;
    const nationalCode = syncResult?.nationalCode || project.SyncStatus?.NationalProjectCode;
    const lastSyncTime = project.SyncStatus?.LastSyncTime;

    return (
        <div className="animate-in slide-in-from-bottom-2 duration-500 space-y-6 py-4">

            {/* LIFECYCLE STEPPER - Full Width with Edit Support */}
            <LifecycleStepper
                currentStage={project.Stage || ProjectStage.Preparation}
                stageHistory={project.StageHistory || []}
                editable={canEditLifecycle}
                onStageChange={onStageChange}
                onHistoryUpdate={onHistoryUpdate}
            />

            {/* KEY METRICS HEADER - Full Width */}
            <KeyMetricsHeader
                totalInvestment={project.TotalInvestment}
                disbursedAmount={disbursedAmount}
                physicalProgress={project.PhysicalProgress ?? 0}
            />

            {/* National Gateway Section - Enhanced */}
            <div className={`rounded-xl shadow-sm border overflow-hidden transition-all ${isSynced
                    ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200'
                    : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
                }`}>
                <div className="px-5 py-4">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${isSynced
                                    ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white'
                                    : 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
                                }`}>
                                {isSyncing ? (
                                    <RefreshCw className="w-6 h-6 animate-spin" />
                                ) : isSynced ? (
                                    <CheckCircle2 className="w-6 h-6" />
                                ) : (
                                    <AlertCircle className="w-6 h-6" />
                                )}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <Landmark className="w-4 h-4 text-gray-600" />
                                    <h3 className="font-black text-gray-800 text-sm uppercase tracking-wide">
                                        Cổng CSDLQG về Đầu tư công
                                    </h3>
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Theo Nghị định 111/2024/NĐ-CP • TT 24/2023/TT-BKHĐT
                                </p>

                                {/* Status Row */}
                                <div className="flex items-center gap-3 mt-2">
                                    {isSyncing ? (
                                        <span className="flex items-center gap-1.5 text-sm font-bold text-blue-700">
                                            <Clock className="w-4 h-4 animate-pulse" />
                                            Đang đồng bộ...
                                        </span>
                                    ) : isSynced ? (
                                        <>
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                Đã đồng bộ
                                            </span>
                                            <span className="text-sm font-mono font-bold text-gray-800">
                                                Mã: {nationalCode || 'ND111-2024-XXXX'}
                                            </span>
                                        </>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                                            <AlertCircle className="w-3.5 h-3.5" />
                                            Chưa đồng bộ
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col items-end gap-2">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onGenerateReport('Monitoring')}
                                    disabled={isGeneratingReport}
                                    className="px-3 py-2 bg-white text-blue-700 text-xs font-bold rounded-lg border border-blue-200 hover:bg-blue-50 flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
                                >
                                    <FileBarChart className="w-3.5 h-3.5" />
                                    BC Giám sát
                                </button>
                                <button
                                    onClick={() => onGenerateReport('Settlement')}
                                    disabled={isGeneratingReport}
                                    className="px-3 py-2 bg-white text-blue-700 text-xs font-bold rounded-lg border border-blue-200 hover:bg-blue-50 flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
                                >
                                    <FileCheck className="w-3.5 h-3.5" />
                                    BC Quyết toán
                                </button>
                            </div>

                            <button
                                onClick={() => setShowSyncDetails(!showSyncDetails)}
                                className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-700"
                            >
                                Chi tiết đồng bộ
                                {showSyncDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sync Details Panel */}
                {showSyncDetails && (
                    <div className="px-5 py-3 bg-white/50 border-t border-gray-200">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                            <div>
                                <span className="text-gray-500">Lần đồng bộ cuối</span>
                                <p className="font-bold text-gray-800 mt-0.5">
                                    {lastSyncTime
                                        ? new Date(lastSyncTime).toLocaleString('vi-VN')
                                        : 'Chưa có'
                                    }
                                </p>
                            </div>
                            <div>
                                <span className="text-gray-500">Schema version</span>
                                <p className="font-bold text-gray-800 mt-0.5 font-mono">v2024.1</p>
                            </div>
                            <div>
                                <span className="text-gray-500">API Endpoint</span>
                                <p className="font-bold text-gray-800 mt-0.5">Production</p>
                            </div>
                            <div>
                                <span className="text-gray-500">Trạng thái kết nối</span>
                                <p className="font-bold text-emerald-600 mt-0.5 flex items-center gap-1">
                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                    Online
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                            <a
                                href="https://csdlqg.mpi.gov.vn"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[10px] text-blue-600 hover:underline"
                            >
                                <ExternalLink className="w-3 h-3" />
                                Truy cập Cổng CSDLQG
                            </a>
                        </div>
                    </div>
                )}
            </div>

            {/* 2-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT COLUMN - 2/3 width */}
                <div className="lg:col-span-2 space-y-6">
                    {/* General Info Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="font-bold text-gray-800 text-xs uppercase">Thông tin chung</h3>
                            <button className="flex items-center gap-1 text-[10px] text-blue-600 hover:underline">
                                <Settings className="w-3 h-3" />
                                Chỉnh sửa
                            </button>
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

export default ProjectInfoTab;
