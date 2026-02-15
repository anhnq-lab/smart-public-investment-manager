import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
    Folder as FolderIcon, FileText, ChevronRight, ChevronDown,
    Upload, Search, Eye, Download, FolderOpen, MoreVertical,
    Calendar, Building2, Target, Coins, Filter, CheckCircle2,
    Clock, AlertCircle, Plus, FileCheck, X, History, PenTool,
    FileSpreadsheet, FileImage, File as FileIcon, ExternalLink
} from 'lucide-react';
import {
    Document, Folder, ISO19650Status, ProjectStage,
    InvestmentPolicyDecision, FeasibilityStudy, DocCategory
} from '@/types';
import { DocumentService } from '@/services/DocumentService';
import { useFolders, useDocuments } from '@/hooks/useDocuments';
import FilePreviewModal from '../FilePreviewModal';

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

// Legal document types by project stage — with matching keywords for auto-detection
const LEGAL_DOC_CATEGORIES = [
    {
        stage: ProjectStage.Preparation,
        label: 'Chuẩn bị dự án',
        color: 'amber',
        icon: Target,
        docs: [
            { name: 'QĐ Phê duyệt chủ trương', keywords: ['chủ trương', 'phê duyệt chủ trương'] },
            { name: 'Tờ trình', keywords: ['tờ trình'] },
            { name: 'Báo cáo tiền khả thi', keywords: ['tiền khả thi', 'pre-feasibility'] },
            { name: 'Báo cáo NCKT (F/S)', keywords: ['nghiên cứu khả thi', 'nckt', 'f/s', 'báo cáo nckt'] },
            { name: 'QĐ Phê duyệt dự án', keywords: ['phê duyệt dự án', 'quyết định phê duyệt'] },
            { name: 'Thiết kế cơ sở', keywords: ['thiết kế cơ sở', 'tkcs'] },
            { name: 'ĐTM', keywords: ['đánh giá tác động', 'đtm', 'môi trường'] },
        ]
    },
    {
        stage: ProjectStage.Execution,
        label: 'Thực hiện dự án',
        color: 'emerald',
        icon: Building2,
        docs: [
            { name: 'TKKT', keywords: ['thiết kế kỹ thuật', 'tkkt'] },
            { name: 'Thiết kế BVTC', keywords: ['bản vẽ thi công', 'bvtc', 'tkbvtc'] },
            { name: 'Dự toán', keywords: ['dự toán'] },
            { name: 'KHLCNT', keywords: ['kế hoạch lựa chọn', 'khlcnt'] },
            { name: 'Hợp đồng', keywords: ['hợp đồng', 'contract'] },
        ]
    },
    {
        stage: ProjectStage.Completion,
        label: 'Kết thúc xây dựng',
        color: 'purple',
        icon: CheckCircle2,
        docs: [
            { name: 'BB Nghiệm thu', keywords: ['nghiệm thu', 'biên bản nghiệm thu'] },
            { name: 'Hồ sơ hoàn công', keywords: ['hoàn công'] },
            { name: 'QĐ Quyết toán', keywords: ['quyết toán'] },
            { name: 'Biên bản bàn giao', keywords: ['bàn giao'] },
            { name: 'Sổ tay vận hành', keywords: ['vận hành', 'sổ tay'] },
        ]
    }
];

// CDE folder structure per ISO 19650
const CDE_CONTAINERS = [
    { id: 'WIP', name: 'WIP - Đang xử lý', status: 'S0', color: 'gray', icon: Clock },
    { id: 'SHARED', name: 'SHARED - Chia sẻ', status: 'S1-S3', color: 'blue', icon: FolderOpen },
    { id: 'PUBLISHED', name: 'PUBLISHED - Phát hành', status: 'A1-A3', color: 'emerald', icon: CheckCircle2 },
    { id: 'ARCHIVED', name: 'ARCHIVED - Lưu trữ', status: 'B1', color: 'purple', icon: FileCheck },
];

// --- DOC ACTION DROPDOWN ---
const DocActionMenu: React.FC<{
    onView: () => void;
    onDownload: () => void;
    onHistory: () => void;
}> = ({ onView, onDownload, onHistory }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Close on outside click
    React.useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        if (open) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
            >
                <MoreVertical className="w-4 h-4" />
            </button>
            {open && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-600 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <button onClick={() => { onView(); setOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-blue-700 dark:hover:text-blue-400 transition-colors">
                        <Eye className="w-4 h-4" /> Xem tài liệu
                    </button>
                    <button onClick={() => { onDownload(); setOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                        <Download className="w-4 h-4" /> Tải xuống
                    </button>
                    <div className="border-t border-gray-100 dark:border-slate-700 my-1" />
                    <button onClick={() => { onHistory(); setOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-700 hover:text-amber-700 dark:hover:text-amber-400 transition-colors">
                        <History className="w-4 h-4" /> Lịch sử phiên bản
                    </button>
                </div>
            )}
        </div>
    );
};

// --- FILE TYPE ICON ---
const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf') return { icon: FileText, color: 'text-red-500', bg: 'bg-red-50' };
    if (['doc', 'docx'].includes(ext)) return { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' };
    if (['xls', 'xlsx', 'csv'].includes(ext)) return { icon: FileSpreadsheet, color: 'text-emerald-600', bg: 'bg-emerald-50' };
    if (['png', 'jpg', 'jpeg', 'gif'].includes(ext)) return { icon: FileImage, color: 'text-violet-500', bg: 'bg-violet-50' };
    return { icon: FileIcon, color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-slate-700' };
};

// --- VERSION HISTORY MODAL ---
const VersionHistoryModal: React.FC<{ doc: Document; onClose: () => void }> = ({ doc, onClose }) => {
    const history = [
        { version: doc.Version || 'P01.01', date: doc.UploadDate, user: 'Ban QLDA', isCurrent: true },
        ...(doc.WorkflowHistory || []).map((wh, i) => ({
            version: `P01.${String(i + 1).padStart(2, '0')}`,
            date: wh.Timestamp ? new Date(wh.Timestamp).toLocaleDateString('vi-VN') : '',
            user: wh.ActorID || '',
            isCurrent: false,
        }))
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-5 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white dark:from-slate-700 dark:to-slate-800">
                    <div className="min-w-0">
                        <h3 className="text-base font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
                            <History className="w-5 h-5 text-amber-500" /> Lịch sử phiên bản
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 truncate">{doc.DocName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-slate-700 text-xs uppercase font-bold text-gray-500 dark:text-slate-400 sticky top-0">
                            <tr>
                                <th className="px-5 py-3">Phiên bản</th>
                                <th className="px-5 py-3">Ngày</th>
                                <th className="px-5 py-3">Người cập nhật</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                            {history.map((h, idx) => (
                                <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-slate-700">
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${h.isCurrent ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                                                {h.version}
                                            </span>
                                            {h.isCurrent && <span className="text-[10px] uppercase font-bold text-emerald-600">Hiện tại</span>}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-gray-600 dark:text-slate-400 text-xs">{h.date}</td>
                                    <td className="px-5 py-3 text-gray-700 dark:text-slate-300 font-medium text-xs">{h.user}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {history.length <= 1 && (
                        <div className="p-8 text-center text-gray-400 dark:text-slate-500 text-sm">
                            Tài liệu này chưa có bản cập nhật nào.
                        </div>
                    )}
                </div>
                <div className="p-4 bg-gray-50 dark:bg-slate-700 border-t border-gray-100 dark:border-slate-600 text-right">
                    <button onClick={onClose} className="px-4 py-2 bg-white dark:bg-slate-600 border border-gray-200 dark:border-slate-500 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-500 transition-colors dark:text-slate-200">
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

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

    // Modal states
    const [previewFile, setPreviewFile] = useState<any>(null);
    const [historyDoc, setHistoryDoc] = useState<Document | null>(null);

    // Upload
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadedDocs, setUploadedDocs] = useState<Document[]>([]);

    // Data hooks
    const { data: folders = [] } = useFolders(projectID);
    const { data: documents = [], isLoading } = useDocuments(activeFolderId);

    // All project documents (from service)
    const projectDocuments = useMemo(() => {
        return [...DocumentService.getDocumentsByProject(projectID), ...uploadedDocs];
    }, [projectID, uploadedDocs]);

    // Dynamic stats
    const stats = useMemo(() => {
        const base = DocumentService.getDocumentStats(projectID);
        return {
            total: base.total + uploadedDocs.length,
            approved: base.approved,
            inProgress: base.inProgress,
            wip: base.wip + uploadedDocs.length,
        };
    }, [projectID, uploadedDocs]);

    // Search filter
    const filteredDocuments = useMemo(() => {
        if (!searchQuery.trim()) return documents;
        const q = searchQuery.toLowerCase();
        return documents.filter(d => d.DocName.toLowerCase().includes(q));
    }, [documents, searchQuery]);

    // Match documents to legal categories
    const matchDocToCategory = useCallback((keywords: string[]): Document | undefined => {
        return projectDocuments.find(doc => {
            const name = doc.DocName.toLowerCase();
            return keywords.some(kw => name.includes(kw.toLowerCase()));
        });
    }, [projectDocuments]);

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

    // Upload handler
    const handleUpload = () => fileInputRef.current?.click();
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        Array.from(files).forEach(file => {
            const newDoc: Document = {
                DocID: Math.floor(Math.random() * 100000),
                ReferenceID: projectID,
                ProjectID: projectID,
                Category: DocCategory.Legal,
                DocName: file.name,
                StoragePath: `/uploads/${file.name}`,
                IsDigitized: true,
                UploadDate: new Date().toISOString().split('T')[0],
                Version: 'P01.01',
                Size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
                ISOStatus: ISO19650Status.S0,
                isLocal: true,
                fileObj: file,
            };
            setUploadedDocs(prev => [newDoc, ...prev]);
        });
        e.target.value = '';
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

    // Count docs per folder
    const folderDocCount = useCallback((folderId: string) => {
        return projectDocuments.filter(d => d.FolderID === folderId).length;
    }, [projectDocuments]);

    // Render folder tree for CDE
    const renderFolderTree = (parentId: string | undefined, level = 0) => {
        const children = folders.filter(f => f.ParentID === parentId);
        if (children.length === 0) return null;

        return (
            <div className={`space-y-0.5 ${level > 0 ? 'ml-4 border-l border-gray-200/50 dark:border-slate-600/50 pl-2' : ''}`}>
                {children.map(folder => {
                    const isActive = folder.FolderID === activeFolderId;
                    const hasChildren = folders.some(f => f.ParentID === folder.FolderID);
                    const docCount = folderDocCount(folder.FolderID);

                    return (
                        <div key={folder.FolderID}>
                            <div
                                onClick={() => setActiveFolderId(folder.FolderID)}
                                className={`flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-all text-sm group ${isActive
                                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold shadow-sm'
                                    : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                                    }`}
                            >
                                <FolderIcon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400 fill-blue-100 dark:fill-blue-900/40' : 'text-gray-400 dark:text-slate-500 group-hover:text-gray-500 dark:group-hover:text-slate-400'}`} />
                                <span className="truncate flex-1">{folder.Name}</span>
                                {docCount > 0 && (
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'}`}>
                                        {docCount}
                                    </span>
                                )}
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
        const colors: Record<string, { bg: string; text: string; border: string; iconBg: string }> = {
            blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800', iconBg: 'bg-blue-100 dark:bg-blue-900/40' },
            amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800', iconBg: 'bg-amber-100 dark:bg-amber-900/40' },
            emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800', iconBg: 'bg-emerald-100 dark:bg-emerald-900/40' },
            purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800', iconBg: 'bg-purple-100 dark:bg-purple-900/40' },
            violet: { bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-200 dark:border-violet-800', iconBg: 'bg-violet-100 dark:bg-violet-900/40' },
            gray: { bg: 'bg-gray-50 dark:bg-slate-800', text: 'text-gray-700 dark:text-slate-300', border: 'border-gray-200 dark:border-slate-700', iconBg: 'bg-gray-100 dark:bg-slate-700' },
            red: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300', border: 'border-red-200 dark:border-red-800', iconBg: 'bg-red-100 dark:bg-red-900/40' },
        };
        return colors[color] || colors.gray;
    };

    // Stat card configs using real data
    const statCards = [
        { label: 'Tổng văn bản', value: stats.total, icon: FileText, color: 'blue' },
        { label: 'Đã phê duyệt', value: stats.approved, icon: CheckCircle2, color: 'emerald' },
        { label: 'Đang xử lý', value: stats.inProgress, icon: Clock, color: 'amber' },
        { label: 'WIP / Mới tải', value: stats.wip, icon: AlertCircle, color: 'orange' },
    ];

    return (
        <div className="animate-in slide-in-from-bottom-2 duration-500">
            {/* Hidden file input */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                onChange={handleFileChange}
                accept=".pdf,.docx,.doc,.xlsx,.xls,.png,.jpg,.jpeg"
            />

            {/* Header with View Toggle */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 mb-6 overflow-hidden">
                <div className="px-5 py-3 flex justify-between items-center border-b border-gray-100 dark:border-slate-700">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveView('legal')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeView === 'legal'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900'
                                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                                }`}
                        >
                            <FileText className="w-4 h-4" />
                            Văn bản pháp lý
                        </button>
                        <button
                            onClick={() => setActiveView('cde')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeView === 'cde'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900'
                                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
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
                                className="pl-9 pr-8 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm w-64 focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all dark:text-slate-200 dark:placeholder-slate-400"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                        <button
                            onClick={handleUpload}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm shadow-blue-200"
                        >
                            <Upload className="w-4 h-4" />
                            Tải lên
                        </button>
                    </div>
                </div>
            </div>

            {/* LEGAL DOCUMENTS VIEW */}
            {activeView === 'legal' && (
                <div className="space-y-4">
                    {/* Quick Stats — DYNAMIC */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        {statCards.map((stat, idx) => {
                            const colors = getStageColor(stat.color);
                            return (
                                <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-slate-400 mb-1 font-medium">{stat.label}</p>
                                            <p className="text-2xl font-black text-gray-800 dark:text-slate-100">{stat.value}</p>
                                        </div>
                                        <div className={`w-10 h-10 rounded-xl ${colors.iconBg} flex items-center justify-center`}>
                                            <stat.icon className={`w-5 h-5 ${colors.text}`} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Documents by Stage */}
                    {LEGAL_DOC_CATEGORIES.map((category) => {
                        const isExpanded = expandedCategories.includes(category.stage);
                        const isCurrent = category.stage === projectStage;
                        const colors = getStageColor(category.color);
                        const CategoryIcon = category.icon;

                        // Compute how many docs in this category exist
                        const matchedCount = category.docs.filter(d => matchDocToCategory(d.keywords)).length;
                        const totalCount = category.docs.length;
                        const progressPercent = totalCount > 0 ? Math.round((matchedCount / totalCount) * 100) : 0;

                        return (
                            <div key={category.stage} className={`bg-white dark:bg-slate-800 rounded-xl border overflow-hidden shadow-sm transition-all ${isCurrent ? 'ring-2 ring-blue-200 dark:ring-blue-700' : 'border-gray-100 dark:border-slate-700 hover:border-gray-200 dark:hover:border-slate-600'}`}>
                                <button
                                    onClick={() => toggleCategory(category.stage)}
                                    className={`w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors ${colors.bg}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-lg ${colors.iconBg} border ${colors.border} flex items-center justify-center`}>
                                            {isExpanded ? (
                                                <ChevronDown className={`w-4 h-4 ${colors.text}`} />
                                            ) : (
                                                <ChevronRight className={`w-4 h-4 ${colors.text}`} />
                                            )}
                                        </div>
                                        <div className="text-left">
                                            <div className="flex items-center gap-2">
                                                <CategoryIcon className={`w-4 h-4 ${colors.text}`} />
                                                <p className={`text-sm font-bold ${colors.text}`}>{category.label}</p>
                                                {isCurrent && (
                                                    <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full uppercase">
                                                        Hiện tại
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{totalCount} loại văn bản</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-xs font-bold ${matchedCount === totalCount ? 'text-emerald-600' : 'text-gray-500'}`}>
                                            {matchedCount}/{totalCount}
                                        </span>
                                        <div className="w-24 h-2 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${matchedCount === totalCount
                                                    ? 'bg-emerald-500'
                                                    : progressPercent > 0 ? `bg-${category.color}-500` : 'bg-gray-300'
                                                    }`}
                                                style={{ width: `${progressPercent}%` }}
                                            />
                                        </div>
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div className="px-5 py-4 border-t border-gray-100 dark:border-slate-700 space-y-2">
                                        {/* Investment Policy - if available */}
                                        {category.stage === ProjectStage.Preparation && investmentPolicy && (
                                            <div className="bg-blue-50/80 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800 mb-3">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                                                        <FileCheck className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-gray-800 dark:text-slate-100">QĐ Chủ trương đầu tư</p>
                                                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{investmentPolicy.DecisionNumber} • {investmentPolicy.DecisionDate}</p>
                                                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                                                            <div><span className="text-gray-500 dark:text-slate-400">Cơ quan:</span> <span className="font-medium dark:text-slate-200">{investmentPolicy.Authority}</span></div>
                                                            <div><span className="text-gray-500 dark:text-slate-400">Sơ bộ TMĐT:</span> <span className="font-bold text-blue-700 dark:text-blue-400">{formatCurrency(investmentPolicy.PreliminaryInvestment)}</span></div>
                                                        </div>
                                                    </div>
                                                    <span className="px-2 py-0.5 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-[10px] font-bold rounded-full uppercase shrink-0">Đã có</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Feasibility Study - if available */}
                                        {category.stage === ProjectStage.Preparation && feasibilityStudy && (
                                            <div className="bg-emerald-50/80 dark:bg-emerald-900/20 rounded-lg p-4 border border-emerald-100 dark:border-emerald-800 mb-3">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                                                        <FileCheck className="w-5 h-5 text-emerald-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-gray-800 dark:text-slate-100">Báo cáo NCKT (F/S)</p>
                                                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{feasibilityStudy.ApprovalNumber} • {feasibilityStudy.ApprovalDate}</p>
                                                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                                                            <div><span className="text-gray-500 dark:text-slate-400">Tổng mức ĐT:</span> <span className="font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(feasibilityStudy.TotalInvestment)}</span></div>
                                                            <div><span className="text-gray-500 dark:text-slate-400">Số bước TK:</span> <span className="font-medium dark:text-slate-200">{feasibilityStudy.DesignPhases} bước</span></div>
                                                        </div>
                                                    </div>
                                                    <span className="px-2 py-0.5 bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200 text-[10px] font-bold rounded-full uppercase shrink-0">Đã có</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Document type list with real matching */}
                                        {category.docs.map((docType, idx) => {
                                            const matchedDoc = matchDocToCategory(docType.keywords);
                                            const hasDoc = !!matchedDoc;
                                            const fileInfo = hasDoc ? getFileIcon(matchedDoc!.DocName) : null;

                                            return (
                                                <div
                                                    key={idx}
                                                    className={`flex items-center justify-between py-2.5 px-3 rounded-lg transition-all ${hasDoc
                                                        ? 'hover:bg-blue-50/50 dark:hover:bg-slate-700 cursor-pointer'
                                                        : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'
                                                        }`}
                                                    onClick={() => hasDoc && setPreviewFile(matchedDoc)}
                                                >
                                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                                        {hasDoc && fileInfo ? (
                                                            <div className={`w-8 h-8 rounded-lg ${fileInfo.bg} flex items-center justify-center shrink-0`}>
                                                                <fileInfo.icon className={`w-4 h-4 ${fileInfo.color}`} />
                                                            </div>
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-lg bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center shrink-0">
                                                                <FileText className="w-4 h-4 text-gray-300" />
                                                            </div>
                                                        )}
                                                        <div className="min-w-0">
                                                            <span className={`text-sm ${hasDoc ? 'text-gray-800 dark:text-slate-100 font-medium' : 'text-gray-500 dark:text-slate-400'}`}>{docType.name}</span>
                                                            {hasDoc && (
                                                                <p className="text-[11px] text-gray-400 truncate mt-0.5">
                                                                    {matchedDoc!.DocName} • {matchedDoc!.UploadDate}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        {hasDoc ? (
                                                            <>
                                                                <span className="text-xs px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg font-bold flex items-center gap-1">
                                                                    <CheckCircle2 className="w-3 h-3" /> Đã có
                                                                </span>
                                                                {matchedDoc!.Version && (
                                                                    <span className="text-[10px] font-mono bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 px-1.5 py-0.5 rounded">
                                                                        {matchedDoc!.Version}
                                                                    </span>
                                                                )}
                                                                <DocActionMenu
                                                                    onView={() => setPreviewFile(matchedDoc)}
                                                                    onDownload={() => {/* download logic */ }}
                                                                    onHistory={() => setHistoryDoc(matchedDoc!)}
                                                                />
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-400 rounded-lg font-medium">Chưa có</span>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                                                                    className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 transition-all"
                                                                    title="Tải lên văn bản"
                                                                >
                                                                    <Plus className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Recently uploaded docs */}
                    {uploadedDocs.length > 0 && (
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
                            <div className="px-5 py-3 bg-gradient-to-r from-emerald-50 to-white dark:from-emerald-900/30 dark:to-slate-800 border-b border-emerald-100 dark:border-emerald-800 flex items-center gap-2">
                                <Upload className="w-4 h-4 text-emerald-600" />
                                <span className="text-sm font-bold text-emerald-800 dark:text-emerald-400">Mới tải lên ({uploadedDocs.length})</span>
                            </div>
                            <div className="divide-y divide-gray-50 dark:divide-slate-700">
                                {uploadedDocs.map((doc) => {
                                    const fIcon = getFileIcon(doc.DocName);
                                    return (
                                        <div key={doc.DocID} className="flex items-center gap-3 px-5 py-3 hover:bg-blue-50/30 dark:hover:bg-slate-700 transition-colors">
                                            <div className={`w-8 h-8 rounded-lg ${fIcon.bg} flex items-center justify-center ring-2 ring-emerald-200`}>
                                                <fIcon.icon className={`w-4 h-4 ${fIcon.color}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800 dark:text-slate-100 truncate">{doc.DocName}</p>
                                                <p className="text-[11px] text-gray-400 dark:text-slate-500">{doc.Size} • {doc.UploadDate}</p>
                                            </div>
                                            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold uppercase">Mới</span>
                                            <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">WIP</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* CDE VIEW */}
            {activeView === 'cde' && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden flex h-[600px]">
                    {/* Folder Tree Sidebar */}
                    <div className="w-[280px] border-r border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50 flex flex-col">
                        <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                            <h3 className="text-xs font-black text-gray-800 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
                                <FolderOpen className="w-4 h-4 text-blue-600" />
                                Cấu trúc CDE
                            </h3>
                        </div>

                        {/* Container Quick Access */}
                        <div className="p-3 space-y-1 border-b border-gray-100 dark:border-slate-700">
                            {CDE_CONTAINERS.map(container => {
                                const colors = getStageColor(container.color);
                                const ContainerIcon = container.icon;
                                return (
                                    <button
                                        key={container.id}
                                        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-all ${colors.bg} hover:opacity-80`}
                                    >
                                        <ContainerIcon className={`w-4 h-4 ${colors.text}`} />
                                        <div className="flex-1 min-w-0">
                                            <span className={`text-xs font-bold ${colors.text} block truncate`}>{container.name}</span>
                                        </div>
                                        <span className={`text-[10px] font-mono ${colors.text} shrink-0`}>{container.status}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Folder Tree */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {renderFolderTree(undefined)}
                            {folders.length === 0 && (
                                <div className="text-center text-gray-400 text-xs py-8">
                                    <FolderIcon className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                                    Chưa có cấu trúc thư mục
                                </div>
                            )}
                        </div>

                        <div className="p-3 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-gray-400 dark:text-slate-500 text-center flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3" />
                            ISO 19650 Compliant
                        </div>
                    </div>

                    {/* Document List Area */}
                    <div className="flex-1 flex flex-col">
                        {/* Breadcrumb */}
                        <div className="px-5 py-3 border-b border-gray-100 dark:border-slate-700 flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400 bg-white dark:bg-slate-800">
                            <FolderIcon className="w-4 h-4 text-gray-300" />
                            {breadcrumbs.map((f, i) => (
                                <React.Fragment key={f.FolderID}>
                                    {i > 0 && <ChevronRight className="w-4 h-4 text-gray-300" />}
                                    <span
                                        className={`${i === breadcrumbs.length - 1 ? 'font-bold text-gray-900 dark:text-slate-100' : 'hover:text-blue-600 cursor-pointer transition-colors'}`}
                                        onClick={() => setActiveFolderId(f.FolderID)}
                                    >
                                        {f.Name}
                                    </span>
                                </React.Fragment>
                            ))}
                        </div>

                        {/* Document List */}
                        <div className="flex-1 overflow-y-auto p-5 bg-gray-50/30 dark:bg-slate-900/30">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full gap-3 text-gray-400 text-sm">
                                    <div className="w-5 h-5 border-2 border-blue-300 border-t-transparent rounded-full animate-spin" />
                                    Đang tải...
                                </div>
                            ) : filteredDocuments.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                                        <FolderOpen className="w-10 h-10 text-gray-200" />
                                    </div>
                                    <p className="text-sm font-bold text-gray-500 dark:text-slate-400 mb-1">Thư mục trống</p>
                                    <p className="text-xs text-gray-400 dark:text-slate-500 mb-4">
                                        {searchQuery ? 'Không tìm thấy tài liệu phù hợp' : 'Tải lên tài liệu đầu tiên vào thư mục này'}
                                    </p>
                                    {!searchQuery && (
                                        <button
                                            onClick={handleUpload}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                                        >
                                            <Upload className="w-3.5 h-3.5" /> Tải lên ngay
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50/80 dark:bg-slate-700/80 text-gray-500 dark:text-slate-400 font-bold text-[11px] uppercase border-b border-gray-100 dark:border-slate-600">
                                            <tr>
                                                <th className="px-5 py-3 w-10"></th>
                                                <th className="px-5 py-3">Tên tài liệu</th>
                                                <th className="px-5 py-3 w-28">Phiên bản</th>
                                                <th className="px-5 py-3 w-48">Trạng thái</th>
                                                <th className="px-5 py-3 text-right w-28">Ngày</th>
                                                <th className="px-5 py-3 w-16"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                                            {filteredDocuments.map((doc) => {
                                                const fIcon = getFileIcon(doc.DocName);
                                                return (
                                                    <tr
                                                        key={doc.DocID}
                                                        className="hover:bg-blue-50/50 dark:hover:bg-slate-700 cursor-pointer transition-colors group"
                                                        onClick={() => setPreviewFile(doc)}
                                                    >
                                                        <td className="px-5 py-3 text-center">
                                                            <div className={`w-8 h-8 rounded-lg ${fIcon.bg} flex items-center justify-center`}>
                                                                <fIcon.icon className={`w-4 h-4 ${fIcon.color}`} />
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-3">
                                                            <p className="font-medium text-gray-800 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">{doc.DocName}</p>
                                                            <p className="text-[10px] text-gray-400 uppercase font-mono mt-0.5">{doc.DocID}</p>
                                                        </td>
                                                        <td className="px-5 py-3">
                                                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 rounded text-[10px] font-bold font-mono">
                                                                {doc.Version || 'P01.01'}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <span
                                                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                                                    style={{ backgroundColor: DocumentService.getStatusColor(doc.ISOStatus!) }}
                                                                />
                                                                <span className="text-[11px] font-bold text-gray-600 dark:text-slate-400">
                                                                    {DocumentService.getStatusLabel(doc.ISOStatus!)}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-3 text-right text-xs text-gray-500 dark:text-slate-400 font-mono">{doc.UploadDate}</td>
                                                        <td className="px-5 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                            <DocActionMenu
                                                                onView={() => setPreviewFile(doc)}
                                                                onDownload={() => { }}
                                                                onHistory={() => setHistoryDoc(doc)}
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODALS */}
            {previewFile && (
                <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
            )}
            {historyDoc && (
                <VersionHistoryModal doc={historyDoc} onClose={() => setHistoryDoc(null)} />
            )}
        </div>
    );
};
