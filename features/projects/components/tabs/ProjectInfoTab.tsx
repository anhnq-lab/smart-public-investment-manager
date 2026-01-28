import React from 'react';
import { Project, Task } from '@/types';
import { Landmark, FileBarChart, FileCheck, RefreshCw, ChevronDown } from 'lucide-react';
import { SyncResult } from '@/services/NationalGatewayService';

interface ProjectInfoTabProps {
    project: Project;
    isSyncing: boolean;
    syncResult: SyncResult | null;
    isGeneratingReport: boolean;
    onGenerateReport: (type: 'Monitoring' | 'Settlement') => void;
}

export const ProjectInfoTab: React.FC<ProjectInfoTabProps> = ({
    project, isSyncing, syncResult, isGeneratingReport, onGenerateReport
}) => {
    return (
        <div className="animate-in slide-in-from-bottom-2 duration-500 space-y-8 max-w-5xl mx-auto py-4">

            {/* National Gateway Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm border border-blue-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-blue-100 flex justify-between items-center">
                    <h3 className="font-bold text-blue-800 text-sm uppercase flex items-center gap-2">
                        <Landmark className="w-4 h-4" /> Cổng kết nối Quốc gia (Nghị định 111/ND-CP)
                    </h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => onGenerateReport('Monitoring')}
                            disabled={isGeneratingReport}
                            className="px-3 py-1.5 bg-white text-blue-700 text-xs font-bold rounded-md border border-blue-200 hover:bg-blue-50 flex items-center gap-2 transition-all shadow-sm"
                        >
                            <FileBarChart className="w-3.5 h-3.5" /> Báo cáo giám sát
                        </button>
                        <button
                            onClick={() => onGenerateReport('Settlement')}
                            disabled={isGeneratingReport}
                            className="px-3 py-1.5 bg-white text-blue-700 text-xs font-bold rounded-md border border-blue-200 hover:bg-blue-50 flex items-center gap-2 transition-all shadow-sm"
                        >
                            <FileCheck className="w-3.5 h-3.5" /> Báo cáo quyết toán
                        </button>
                    </div>
                </div>
                <div className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${project.SyncStatus?.IsSynced || syncResult?.success ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                                <RefreshCw className={`w-6 h-6 ${isSyncing ? 'animate-spin' : ''}`} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-800">Trạng thái đồng bộ CSDL Quốc gia</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {isSyncing ? 'Đang kết nối đến cổng...' : (
                                        (project.SyncStatus?.IsSynced || syncResult?.success)
                                            ? `Đã đồng bộ. Mã dự án QG: ${syncResult?.nationalCode || project.SyncStatus?.NationalProjectCode || 'ND111-PR2400-2025'}`
                                            : 'Chưa đồng bộ hoặc có lỗi.'
                                    )}
                                </p>
                                {(project.SyncStatus?.LastSyncDate || syncResult?.timestamp) && (
                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                        Cập nhật lần cuối: {syncResult?.timestamp ? new Date(syncResult.timestamp).toLocaleString('vi-VN') : project.SyncStatus?.LastSyncDate}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs font-medium text-gray-500 mb-1">Cơ quan quản lý</div>
                            <div className="text-sm font-bold text-blue-900">BỘ XÂY DỰNG</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* General Info Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <h3 className="font-bold text-gray-800 text-sm uppercase">Thông tin chung</h3>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                        {/* Left Column */}
                        <div className="space-y-4">
                            <InfoItem label="Số dự án" value={project.ProjectNumber || project.ProjectID} />
                            <div className="flex flex-col border-b border-gray-100 pb-2">
                                <span className="text-xs text-gray-500 mb-1">Phiên bản thay đổi</span>
                                <span className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                    {project.Version || '00'}
                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                </span>
                            </div>
                            <InfoItem label="Trạng thái đăng tải" value="Đã đăng tải" />
                            <InfoItem label="Tên dự án" value={project.ProjectName} />
                            <InfoItem label="Mục tiêu đầu tư" value={project.Objective || 'Chưa cập nhật'} justify />
                            <InfoItem label="Chủ đầu tư" value={project.InvestorName} />
                        </div>

                        {/* Right Column */}
                        <div className="space-y-4">
                            <InfoItem label="Người có thẩm quyền" value={project.CompetentAuthority || 'UBND TỈNH'} uppercase />
                            <InfoItem label="Thời gian thực hiện dự án" value={project.Duration || '5 Năm'} />
                            <InfoItem label="Nhóm dự án" value={`Nhóm ${project.GroupCode}`} />
                            <InfoItem label="Hình thức quản lý dự án" value={project.ManagementForm || 'Chủ đầu tư trực tiếp quản lý dự án'} />
                            <InfoItem label="Địa điểm" value={project.LocationCode} />
                            {/* Decision Info */}
                            <div className="pt-2">
                                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Quyết định phê duyệt</label>
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-xs text-gray-500">Số quyết định:</span>
                                        <span className="text-xs font-bold text-gray-900">{project.DecisionNumber || 'Đang cập nhật'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-xs text-gray-500">Ngày quyết định:</span>
                                        <span className="text-xs font-bold text-gray-900">{project.DecisionDate || 'Đang cập nhật'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-xs text-gray-500">Cơ quan ban hành:</span>
                                        <span className="text-xs font-bold text-gray-900">{project.DecisionAuthority || 'UBND Tỉnh'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper Component for Info Items
const InfoItem: React.FC<{ label: string; value: string; uppercase?: boolean; justify?: boolean }> = ({ label, value, uppercase, justify }) => (
    <div className="flex flex-col border-b border-gray-100 pb-2">
        <span className="text-xs text-gray-500 mb-1">{label}</span>
        <span className={`text-sm font-medium text-gray-900 ${uppercase ? 'uppercase' : ''} ${justify ? 'text-justify leading-relaxed' : ''}`}>
            {value}
        </span>
    </div>
);
