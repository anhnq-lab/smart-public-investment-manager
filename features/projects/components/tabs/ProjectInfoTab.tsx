import React from 'react';
import { Project, Task, ProjectStage } from '@/types';
import { Landmark, FileBarChart, FileCheck, RefreshCw, ChevronDown } from 'lucide-react';
import { SyncResult } from '@/services/NationalGatewayService';
import { LifecycleStepper } from '../LifecycleStepper';
import { ComplianceChecklist } from '../ComplianceChecklist';
import { DualProgressCard } from '../DualProgressCard';

interface ProjectInfoTabProps {
    project: Project & {
        Stage?: ProjectStage;
        PhysicalProgress?: number;
        FinancialProgress?: number;
        RequiresBIM?: boolean;
        BIMStatus?: string;
    };
    isSyncing: boolean;
    syncResult: SyncResult | null;
    isGeneratingReport: boolean;
    onGenerateReport: (type: 'Monitoring' | 'Settlement') => void;
}

export const ProjectInfoTab: React.FC<ProjectInfoTabProps> = ({
    project, isSyncing, syncResult, isGeneratingReport, onGenerateReport
}) => {
    return (
        <div className="animate-in slide-in-from-bottom-2 duration-500 space-y-6 max-w-6xl mx-auto py-4">

            {/* LIFECYCLE STEPPER - Full Width */}
            <LifecycleStepper
                currentStage={project.Stage || ProjectStage.Preparation}
                stageHistory={[]}
            />

            {/* 2-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT COLUMN - 2/3 width */}
                <div className="lg:col-span-2 space-y-6">
                    {/* National Gateway Section */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-100 overflow-hidden">
                        <div className="px-5 py-3 border-b border-blue-100 flex justify-between items-center">
                            <h3 className="font-bold text-blue-800 text-xs uppercase flex items-center gap-2">
                                <Landmark className="w-4 h-4" /> Cổng kết nối Quốc gia (NĐ 111)
                            </h3>
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
                        <div className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${project.SyncStatus?.IsSynced || syncResult?.success ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                                        <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">
                                            {isSyncing ? 'Đang kết nối...' : (
                                                (project.SyncStatus?.IsSynced || syncResult?.success)
                                                    ? `✓ Mã CSDLQG: ${syncResult?.nationalCode || project.SyncStatus?.NationalProjectCode || 'ND111-PR2400-2025'}`
                                                    : 'Chưa đồng bộ'
                                            )}
                                        </p>
                                        {(project.SyncStatus?.LastSyncDate || syncResult?.timestamp) && (
                                            <p className="text-[10px] text-gray-400 mt-0.5">
                                                Cập nhật: {syncResult?.timestamp ? new Date(syncResult.timestamp).toLocaleString('vi-VN') : project.SyncStatus?.LastSyncDate}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

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
                                <InfoItem
                                    label="Tổng mức đầu tư"
                                    value={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(project.TotalInvestment)}
                                    highlight
                                />
                                <InfoItem label="Nguồn vốn" value={project.CapitalSource || 'Ngân sách tỉnh'} />
                            </div>

                            {/* Decision Info */}
                            <div className="mt-5 pt-4 border-t border-gray-100">
                                <label className="text-xs font-bold text-gray-400 uppercase mb-3 block">Quyết định phê duyệt</label>
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 grid grid-cols-3 gap-4">
                                    <div>
                                        <span className="text-xs text-gray-500 block">Số quyết định</span>
                                        <span className="text-sm font-bold text-gray-900">{project.DecisionNumber || '—'}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 block">Ngày quyết định</span>
                                        <span className="text-sm font-bold text-gray-900">{project.DecisionDate || '—'}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 block">Cơ quan ban hành</span>
                                        <span className="text-sm font-bold text-gray-900">{project.DecisionAuthority || 'UBND Tỉnh'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDEBAR - 1/3 width */}
                <div className="space-y-6">
                    {/* Progress Card */}
                    <DualProgressCard
                        physicalProgress={project.PhysicalProgress ?? 0}
                        financialProgress={project.FinancialProgress ?? 0}
                    />

                    {/* Compliance Checklist */}
                    <ComplianceChecklist project={project} />
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

