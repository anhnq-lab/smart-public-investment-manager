import React, { useState, useMemo } from 'react';
import {
    Folder as FolderIcon, FileText, ChevronRight, ChevronDown,
    Upload, Search, Eye, Download, FolderOpen, MoreVertical,
    Calendar, Building2, Target, Coins, Filter, CheckCircle2,
    Clock, AlertCircle, Plus, FileCheck
} from 'lucide-react';
import {
    Document, Folder, ISO19650Status, ProjectStage,
    InvestmentPolicyDecision, FeasibilityStudy
} from '@/types';
import { DocumentService } from '@/services/DocumentService';
import { useFolders, useDocuments } from '@/hooks/useDocuments';

interface ProjectDocumentsTabProps {
    projectID: string;
    projectStage?: ProjectStage;
    investmentPolicy?: InvestmentPolicyDecision;
    feasibilityStudy?: FeasibilityStudy;
    approvalDecision?: {
        number: string;
        date: string;
        authority: string;
    };
}

// Legal document types by project stage
const LEGAL_DOC_CATEGORIES = [
    {
        stage: ProjectStage.InvestmentPolicy,
        label: 'Chủ trương đầu tư',
        color: 'blue',
        docs: ['QĐ Phê duyệt chủ trương', 'Tờ trình', 'Báo cáo tiền khả thi']
    },
    {
        stage: ProjectStage.Preparation,
        label: 'Chuẩn bị đầu tư',
        color: 'amber',
        docs: ['Báo cáo NCKT (F/S)', 'QĐ Phê duyệt dự án', 'Thiết kế cơ sở', 'ĐTM']
    },
    {
        stage: ProjectStage.Execution,
        label: 'Thực hiện đầu tư',
        color: 'emerald',
        docs: ['TKKT', 'Thiết kế BVTC', 'Dự toán', 'KHLCNT', 'Hợp đồng']
    },
    {
        stage: ProjectStage.Completion,
        label: 'Kết thúc đầu tư',
        color: 'purple',
        docs: ['BB Nghiệm thu', 'Hồ sơ hoàn công', 'QĐ Quyết toán']
    },
    {
        stage: ProjectStage.Operation,
        label: 'Vận hành',
        color: 'violet',
        docs: ['Biên bản bàn giao', 'Sổ tay vận hành']
    }
];

// CDE folder structure per ISO 19650
const CDE_CONTAINERS = [
    { id: 'WIP', name: 'WIP - Đang xử lý', status: 'S0', color: 'gray' },
    { id: 'SHARED', name: 'SHARED - Chia sẻ', status: 'S1-S3', color: 'blue' },
    { id: 'PUBLISHED', name: 'PUBLISHED - Phát hành', status: 'A1-A3', color: 'emerald' },
    { id: 'ARCHIVED', name: 'ARCHIVED - Lưu trữ', status: 'B1', color: 'purple' }
];

export const ProjectDocumentsTab: React.FC<ProjectDocumentsTabProps> = ({
    projectID,
    projectStage = ProjectStage.Execution,
    investmentPolicy,
    feasibilityStudy,
    approvalDecision
}) => {
    // View modes
    const [activeView, setActiveView] = useState<'legal' | 'cde'>('legal');
    const [activeFolderId, setActiveFolderId] = useState<string>('FLD-ROOT');
    const [expandedCategories, setExpandedCategories] = useState<string[]>([projectStage]);
    const [searchQuery, setSearchQuery] = useState('');

    // Data hooks
    const { data: folders = [] } = useFolders(projectID);
    const { data: documents = [], isLoading } = useDocuments(activeFolderId);

    // Toggle category expansion
    const toggleCategory = (stage: string) => {
        setExpandedCategories(prev =>
            prev.includes(stage)
                ? prev.filter(s => s !== stage)
                : [...prev, stage]
        );
    };

    // Format currency
    const formatCurrency = (value: number) => {
        if (value >= 1_000_000_000) {
            return `${(value / 1_000_000_000).toFixed(1)} tỷ VND`;
        }
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    };

    // Breadcrumb calculation for CDE
    const activeFolder = folders.find(f => f.FolderID === activeFolderId);
    const breadcrumbs = useMemo(() => {
        const path: Folder[] = [];
        let current = activeFolder;
        while (current) {
            path.unshift(current);
            if (!current.ParentID) break;
            current = folders.find(f => f.FolderID === current!.ParentID);
        }
        return path;
    }, [activeFolder, folders]);

    // Render folder tree for CDE
    const renderFolderTree = (parentId: string | undefined, level = 0) => {
        const children = folders.filter(f => f.ParentID === parentId);
        if (children.length === 0) return null;

        return (
            <div className={`space-y-1 ${level > 0 ? 'ml-4 border-l border-gray-100 pl-2' : ''}`}>
                {children.map(folder => {
                    const isActive = folder.FolderID === activeFolderId;
                    const hasChildren = folders.some(f => f.ParentID === folder.FolderID);

                    return (
                        <div key={folder.FolderID}>
                            <div
                                onClick={() => setActiveFolderId(folder.FolderID)}
                                className={`flex items-center gap-2 py-1.5 px-3 rounded-lg cursor-pointer transition-colors text-sm ${isActive ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                <FolderIcon className={`w-4 h-4 ${isActive ? 'text-blue-600 fill-blue-100' : 'text-gray-400'}`} />
                                <span className="truncate">{folder.Name}</span>
                            </div>
                            {hasChildren && renderFolderTree(folder.FolderID, level + 1)}
                        </div>
                    );
                })}
            </div>
        );
    };

    // Get stage color
    const getStageColor = (color: string) => {
        const colors: Record<string, { bg: string; text: string; border: string }> = {
            blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
            amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
            emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
            purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
            violet: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
            gray: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' }
        };
        return colors[color] || colors.gray;
    };

    return (
        <div className="animate-in slide-in-from-bottom-2 duration-500">
            {/* Header with View Toggle */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
                <div className="px-5 py-3 flex justify-between items-center border-b border-gray-100">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveView('legal')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeView === 'legal'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            <FileText className="w-4 h-4" />
                            Văn bản pháp lý
                        </button>
                        <button
                            onClick={() => setActiveView('cde')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeView === 'cde'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            <FolderOpen className="w-4 h-4" />
                            Hồ sơ CDE (ISO 19650)
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-64 focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                            />
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm shadow-blue-200">
                            <Upload className="w-4 h-4" />
                            Tải lên
                        </button>
                    </div>
                </div>
            </div>

            {/* LEGAL DOCUMENTS VIEW */}
            {activeView === 'legal' && (
                <div className="space-y-4">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        {[
                            { label: 'Tổng văn bản', value: '24', icon: FileText, color: 'blue' },
                            { label: 'Đã phê duyệt', value: '18', icon: CheckCircle2, color: 'emerald' },
                            { label: 'Đang xử lý', value: '4', icon: Clock, color: 'amber' },
                            { label: 'Cần bổ sung', value: '2', icon: AlertCircle, color: 'red' }
                        ].map((stat, idx) => (
                            <div key={idx} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                                        <p className="text-2xl font-black text-gray-800">{stat.value}</p>
                                    </div>
                                    <div className={`w-10 h-10 rounded-xl bg-${stat.color}-100 flex items-center justify-center`}>
                                        <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Documents by Stage */}
                    {LEGAL_DOC_CATEGORIES.map((category) => {
                        const isExpanded = expandedCategories.includes(category.stage);
                        const isCurrent = category.stage === projectStage;
                        const colors = getStageColor(category.color);

                        return (
                            <div key={category.stage} className={`bg-white rounded-xl border overflow-hidden shadow-sm ${isCurrent ? 'ring-2 ring-blue-200' : 'border-gray-100'}`}>
                                <button
                                    onClick={() => toggleCategory(category.stage)}
                                    className={`w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${colors.bg}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center`}>
                                            {isExpanded ? (
                                                <ChevronDown className={`w-4 h-4 ${colors.text}`} />
                                            ) : (
                                                <ChevronRight className={`w-4 h-4 ${colors.text}`} />
                                            )}
                                        </div>
                                        <div className="text-left">
                                            <p className={`text-sm font-bold ${colors.text}`}>{category.label}</p>
                                            <p className="text-xs text-gray-500">{category.docs.length} loại văn bản</p>
                                        </div>
                                        {isCurrent && (
                                            <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full uppercase">
                                                Giai đoạn hiện tại
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500">3/5 văn bản</span>
                                        <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                            <div className={`h-full bg-${category.color}-500 rounded-full`} style={{ width: '60%' }}></div>
                                        </div>
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div className="px-5 py-4 border-t border-gray-100 space-y-3">
                                        {/* Investment Policy - if available */}
                                        {category.stage === ProjectStage.InvestmentPolicy && investmentPolicy && (
                                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                                                        <FileCheck className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-bold text-gray-800">QĐ Chủ trương đầu tư</p>
                                                        <p className="text-xs text-gray-500 mt-0.5">{investmentPolicy.DecisionNumber} • {investmentPolicy.DecisionDate}</p>
                                                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                                                            <div><span className="text-gray-500">Cơ quan:</span> <span className="font-medium">{investmentPolicy.Authority}</span></div>
                                                            <div><span className="text-gray-500">Sơ bộ TMĐT:</span> <span className="font-bold text-blue-700">{formatCurrency(investmentPolicy.PreliminaryInvestment)}</span></div>
                                                        </div>
                                                    </div>
                                                    <button className="p-2 hover:bg-blue-100 rounded-lg transition-colors">
                                                        <Download className="w-4 h-4 text-blue-600" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Feasibility Study - if available */}
                                        {category.stage === ProjectStage.Preparation && feasibilityStudy && (
                                            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                                                        <FileCheck className="w-5 h-5 text-emerald-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-bold text-gray-800">Báo cáo NCKT (F/S)</p>
                                                        <p className="text-xs text-gray-500 mt-0.5">{feasibilityStudy.ApprovalNumber} • {feasibilityStudy.ApprovalDate}</p>
                                                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                                                            <div><span className="text-gray-500">Tổng mức ĐT:</span> <span className="font-bold text-emerald-700">{formatCurrency(feasibilityStudy.TotalInvestment)}</span></div>
                                                            <div><span className="text-gray-500">Số bước TK:</span> <span className="font-medium">{feasibilityStudy.DesignPhases} bước</span></div>
                                                        </div>
                                                    </div>
                                                    <button className="p-2 hover:bg-emerald-100 rounded-lg transition-colors">
                                                        <Download className="w-4 h-4 text-emerald-600" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Generic document list */}
                                        {category.docs.map((docType, idx) => (
                                            <div key={idx} className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded-lg transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <FileText className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm text-gray-700">{docType}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded">Chưa có</span>
                                                    <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600 transition-colors">
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* CDE VIEW */}
            {activeView === 'cde' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex h-[600px]">
                    {/* Folder Tree Sidebar */}
                    <div className="w-[280px] border-r border-gray-200 bg-gray-50/50 flex flex-col">
                        <div className="p-4 border-b border-gray-200 bg-white">
                            <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                                <FolderOpen className="w-4 h-4 text-blue-600" />
                                Cấu trúc CDE
                            </h3>
                        </div>

                        {/* Container Quick Access */}
                        <div className="p-3 space-y-1 border-b border-gray-100">
                            {CDE_CONTAINERS.map(container => {
                                const colors = getStageColor(container.color);
                                return (
                                    <button
                                        key={container.id}
                                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${colors.bg} hover:opacity-80`}
                                    >
                                        <FolderIcon className={`w-4 h-4 ${colors.text}`} />
                                        <div className="flex-1">
                                            <span className={`text-xs font-bold ${colors.text}`}>{container.name}</span>
                                        </div>
                                        <span className={`text-[10px] ${colors.text}`}>{container.status}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Folder Tree */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {renderFolderTree(undefined)}
                        </div>

                        <div className="p-3 border-t border-gray-200 bg-white text-xs text-gray-400 text-center">
                            ISO 19650 Compliant
                        </div>
                    </div>

                    {/* Document List Area */}
                    <div className="flex-1 flex flex-col">
                        {/* Breadcrumb */}
                        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2 text-sm text-gray-500">
                            {breadcrumbs.map((f, i) => (
                                <React.Fragment key={f.FolderID}>
                                    {i > 0 && <ChevronRight className="w-4 h-4 text-gray-300" />}
                                    <span
                                        className={i === breadcrumbs.length - 1 ? 'font-bold text-gray-900' : 'hover:text-blue-600 cursor-pointer'}
                                        onClick={() => setActiveFolderId(f.FolderID)}
                                    >
                                        {f.Name}
                                    </span>
                                </React.Fragment>
                            ))}
                        </div>

                        {/* Document List */}
                        <div className="flex-1 overflow-y-auto p-5 bg-gray-50/30">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                                    Đang tải...
                                </div>
                            ) : documents.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <FolderOpen className="w-16 h-16 text-gray-200 mb-4" />
                                    <p className="text-sm font-medium">Thư mục trống</p>
                                    <p className="text-xs mt-1">Tải lên tài liệu đầu tiên</p>
                                </div>
                            ) : (
                                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50/80 text-gray-500 font-bold text-[11px] uppercase border-b border-gray-100">
                                            <tr>
                                                <th className="px-5 py-3 w-10"></th>
                                                <th className="px-5 py-3">Tên tài liệu</th>
                                                <th className="px-5 py-3">Phiên bản</th>
                                                <th className="px-5 py-3">Trạng thái</th>
                                                <th className="px-5 py-3 text-right">Ngày</th>
                                                <th className="px-5 py-3 w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {documents.map((doc) => (
                                                <tr key={doc.DocID} className="hover:bg-blue-50/50 cursor-pointer transition-colors">
                                                    <td className="px-5 py-3 text-center">
                                                        <FileText className={`w-5 h-5 ${doc.DocName.endsWith('.pdf') ? 'text-red-500' : 'text-blue-500'}`} />
                                                    </td>
                                                    <td className="px-5 py-3 font-medium text-gray-800">
                                                        {doc.DocName}
                                                        <div className="text-[10px] text-gray-400 uppercase font-mono mt-0.5">{doc.DocID}</div>
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-bold font-mono">
                                                            {doc.Version || 'P01.01'}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className="w-2.5 h-2.5 rounded-full"
                                                                style={{ backgroundColor: DocumentService.getStatusColor(doc.ISOStatus!) }}
                                                            ></span>
                                                            <span className="text-[11px] font-bold text-gray-600">
                                                                {DocumentService.getStatusLabel(doc.ISOStatus!)}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3 text-right text-xs text-gray-500 font-mono">{doc.UploadDate}</td>
                                                    <td className="px-5 py-3 text-center">
                                                        <button className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
