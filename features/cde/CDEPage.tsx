import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
    FolderOpen, FileText, ChevronRight, Upload, Search, Eye, Download,
    CheckCircle2, Clock, AlertCircle, X, History, PenTool,
    Archive, Share2,
    ChevronDown, Shield, Box, Loader2, ArrowRight, RefreshCw,
    FolderTree, BarChart3, Users, Building2
} from 'lucide-react';
import { CDEService, CDEFolder, CDEDocument, CDEWorkflowStep, CDE_WORKFLOW_STEPS, CDE_CONTAINERS } from '../../services/CDEService';
import { useCDEFolders, useCDEDocuments, useCDEStats, useCDEWorkflowHistory, useUploadCDE, useProcessWorkflowStep } from '../../hooks/useCDE';
import { useProjects } from '../../hooks/useProjects';
import FilePreviewModal from '../projects/components/FilePreviewModal';
import { getFileIcon } from '@/utils/fileIcons';

// ═══════════════════════════════════════════════════════════════
// CDEPage — Môi trường dữ liệu chung (ISO 19650)
// ═══════════════════════════════════════════════════════════════

// Container icon mapping
const containerIcons: Record<string, React.ElementType> = {
    WIP: Clock,
    SHARED: Share2,
    PUBLISHED: CheckCircle2,
    ARCHIVED: Archive,
};

const containerColors: Record<string, { bg: string; text: string; border: string; dot: string; lightBg: string; badge: string }> = {
    WIP: { bg: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-700', dot: 'bg-amber-500', lightBg: 'bg-amber-50 dark:bg-amber-900/20', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
    SHARED: { bg: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-700', dot: 'bg-blue-500', lightBg: 'bg-blue-50 dark:bg-blue-900/20', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
    PUBLISHED: { bg: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-700', dot: 'bg-emerald-500', lightBg: 'bg-emerald-50 dark:bg-emerald-900/20', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
    ARCHIVED: { bg: 'bg-purple-500', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-700', dot: 'bg-purple-500', lightBg: 'bg-purple-50 dark:bg-purple-900/20', badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
};

// getFileIcon imported from @/utils/fileIcons

const CDEPage: React.FC = () => {
    const { projects } = useProjects();
    const defaultProject = projects.find(p => p.ProjectID === '0121131131600') || projects[0];
    const [selectedProjectId, setSelectedProjectId] = useState<string>(defaultProject?.ProjectID || '');
    const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
    const [selectedDoc, setSelectedDoc] = useState<CDEDocument | null>(null);
    const [previewFile, setPreviewFile] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Update project when default loads
    useEffect(() => {
        if (!selectedProjectId && defaultProject?.ProjectID) {
            setSelectedProjectId(defaultProject.ProjectID);
        }
    }, [defaultProject]);

    // Data
    const { data: folders = [], isLoading: foldersLoading } = useCDEFolders(selectedProjectId);
    const { data: docs = [], isLoading: docsLoading } = useCDEDocuments(activeFolderId);
    const { data: stats } = useCDEStats(selectedProjectId);
    const { data: workflowHistory = [] } = useCDEWorkflowHistory(selectedDoc?.doc_id || null);

    // Mutations
    const uploadMutation = useUploadCDE();
    const processStepMutation = useProcessWorkflowStep();

    // Set first WIP container as default when folders load
    useEffect(() => {
        if (folders.length > 0 && !activeFolderId) {
            const wipFolder = folders.find(f => f.container_type === 'WIP' && !f.parent_id);
            if (wipFolder) setActiveFolderId(wipFolder.id);
        }
    }, [folders, activeFolderId]);

    // Root containers (no parent)
    const rootContainers = useMemo(() =>
        folders.filter(f => !f.parent_id).sort((a, b) => a.sort_order - b.sort_order),
        [folders]
    );

    // Active folder info
    const activeFolder = useMemo(() => folders.find(f => f.id === activeFolderId), [folders, activeFolderId]);

    // Count docs per folder  
    const folderDocCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        docs.forEach(d => {
            if (d.cde_folder_id) {
                counts[d.cde_folder_id] = (counts[d.cde_folder_id] || 0) + 1;
            }
        });
        return counts;
    }, [docs]);

    // Breadcrumbs
    const breadcrumbs = useMemo(() => {
        const path: CDEFolder[] = [];
        let current = activeFolder;
        while (current) {
            path.unshift(current);
            if (!current.parent_id) break;
            current = folders.find(f => f.id === current!.parent_id);
        }
        return path;
    }, [activeFolder, folders]);

    // Filtered docs
    const filteredDocs = useMemo(() => {
        if (!searchQuery.trim()) return docs;
        const q = searchQuery.toLowerCase();
        return docs.filter(d => d.doc_name.toLowerCase().includes(q));
    }, [docs, searchQuery]);

    // Next workflow step for selected doc
    const [nextStep, setNextStep] = useState<any>(null);
    useEffect(() => {
        if (!selectedDoc) { setNextStep(null); return; }

        if (workflowHistory.length === 0) {
            setNextStep(CDE_WORKFLOW_STEPS[0]);
            return;
        }

        const last = workflowHistory[workflowHistory.length - 1];
        if (last.status === 'Rejected') { setNextStep(CDE_WORKFLOW_STEPS[0]); return; }
        if (last.status === 'Pending') {
            setNextStep(CDE_WORKFLOW_STEPS.find(s => s.name === last.step_name));
            return;
        }

        const idx = CDE_WORKFLOW_STEPS.findIndex(s => s.name === last.step_name);
        if (idx === -1 || idx === CDE_WORKFLOW_STEPS.length - 1) { setNextStep(null); return; }
        setNextStep(CDE_WORKFLOW_STEPS[idx + 1]);
    }, [selectedDoc, workflowHistory]);

    // Upload handler
    const handleUpload = () => fileInputRef.current?.click();
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0 || !activeFolderId) return;

        for (const file of Array.from(files)) {
            await uploadMutation.mutateAsync({
                file,
                folderId: activeFolderId,
                projectId: selectedProjectId,
            });
        }
        e.target.value = '';
    };

    // Process workflow step
    const handleProcessStep = async (status: 'Approved' | 'Rejected') => {
        if (!selectedDoc || !nextStep) return;
        const comment = status === 'Approved'
            ? `Đã duyệt: ${nextStep.name}`
            : `Yêu cầu chỉnh sửa tại: ${nextStep.name}`;

        await processStepMutation.mutateAsync({
            docId: selectedDoc.doc_id,
            stepName: nextStep.name,
            status,
            comment,
            actorId: 'CURRENT_USER',
            actorName: 'Ban QLDA',
        });
        setSelectedDoc(null);
    };

    // Render folder tree
    const renderFolderTree = (parentId: string | null, level = 0) => {
        const children = folders
            .filter(f => f.parent_id === parentId)
            .sort((a, b) => a.sort_order - b.sort_order);

        if (children.length === 0) return null;

        return (
            <div className={`space-y-0.5 ${level > 0 ? 'ml-5 pl-3 border-l-2 border-gray-100 dark:border-slate-700' : ''}`}>
                {children.map(folder => {
                    const isActive = folder.id === activeFolderId;
                    const hasChildren = folders.some(f => f.parent_id === folder.id);
                    const isRoot = !folder.parent_id;
                    const containerColor = containerColors[folder.container_type];
                    const ContainerIcon = containerIcons[folder.container_type] || FolderOpen;

                    return (
                        <div key={folder.id}>
                            <div
                                onClick={() => { setActiveFolderId(folder.id); setSelectedDoc(null); }}
                                className={`flex items-center gap-2.5 py-2.5 px-3 rounded-xl cursor-pointer transition-all text-sm group ${isActive
                                    ? `${containerColor.lightBg} ${containerColor.text} font-bold shadow-sm ${containerColor.border} border`
                                    : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                                    }`}
                            >
                                {isRoot ? (
                                    <div className={`w-6 h-6 rounded-lg ${isActive ? containerColor.bg : 'bg-gray-200 dark:bg-slate-600'} flex items-center justify-center`}>
                                        <ContainerIcon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-gray-500 dark:text-slate-400'}`} />
                                    </div>
                                ) : (
                                    <FolderOpen className={`w-4 h-4 shrink-0 ${isActive ? containerColor.text : 'text-gray-400 dark:text-slate-500'}`} />
                                )}
                                <span className="truncate flex-1 text-[13px]">{folder.name}</span>
                            </div>
                            {hasChildren && renderFolderTree(folder.id, level + 1)}
                        </div>
                    );
                })}
            </div>
        );
    };

    // Stat cards
    const statCards = [
        { label: 'Tổng hồ sơ', value: stats?.total || 0, icon: FileText, color: containerColors.SHARED },
        { label: 'Đang xử lý', value: stats?.wip || 0, icon: Clock, color: containerColors.WIP },
        { label: 'Đã chia sẻ', value: stats?.shared || 0, icon: Share2, color: containerColors.SHARED },
        { label: 'Phát hành', value: stats?.published || 0, icon: CheckCircle2, color: containerColors.PUBLISHED },
    ];

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] animate-in fade-in duration-300">
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                onChange={handleFileChange}
                accept=".pdf,.docx,.doc,.xlsx,.xls,.png,.jpg,.jpeg,.ifc"
            />

            {/* ─── Header ──────────────────────────────────────────── */}
            <div className="flex-none mb-6">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 dark:text-slate-100 tracking-tight flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-blue-900/30">
                                <FolderTree className="w-5 h-5 text-white" />
                            </div>
                            Môi trường dữ liệu chung
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 ml-[52px]">
                            CDE — Common Data Environment (ISO 19650)
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Project Selector */}
                        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 flex items-center gap-3 min-w-[320px]">
                            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                            <select
                                value={selectedProjectId}
                                onChange={(e) => { setSelectedProjectId(e.target.value); setActiveFolderId(null); setSelectedDoc(null); }}
                                className="flex-1 text-sm font-semibold text-gray-800 dark:text-slate-200 outline-none bg-transparent cursor-pointer truncate"
                            >
                                {projects.map(p => (
                                    <option key={p.ProjectID} value={p.ProjectID}>{p.ProjectName}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={handleUpload}
                            disabled={!activeFolderId || uploadMutation.isPending}
                            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-blue-200 dark:hover:shadow-blue-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {uploadMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Upload className="w-4 h-4" />
                            )}
                            Tải lên
                        </button>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-4 gap-4">
                    {statCards.map((stat, idx) => (
                        <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-slate-400 font-medium mb-1">{stat.label}</p>
                                    <p className="text-2xl font-black text-gray-800 dark:text-slate-100">{stat.value}</p>
                                </div>
                                <div className={`w-10 h-10 rounded-xl ${stat.color.lightBg} flex items-center justify-center`}>
                                    <stat.icon className={`w-5 h-5 ${stat.color.text}`} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ─── Main Content ─────────────────────────────────────── */}
            <div className="flex flex-1 gap-4 overflow-hidden min-h-0">
                {/* Folder Tree Sidebar */}
                <div className="w-[280px] bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col overflow-hidden shrink-0">
                    <div className="px-4 py-3.5 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/80">
                        <h3 className="text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                            <FolderOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            Cấu trúc CDE
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                        {foldersLoading ? (
                            <div className="flex items-center justify-center h-32 text-gray-400">
                                <Loader2 className="w-5 h-5 animate-spin" />
                            </div>
                        ) : (
                            renderFolderTree(null)
                        )}
                    </div>
                    <div className="px-4 py-2.5 border-t border-gray-100 dark:border-slate-700 bg-gray-50/80 dark:bg-slate-800/80">
                        <p className="text-[9px] text-gray-400 dark:text-slate-500 text-center font-bold uppercase tracking-wider">
                            ISO 19650 Compliant
                        </p>
                    </div>
                </div>

                {/* Document List */}
                <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col overflow-hidden min-w-0">
                    {/* Toolbar */}
                    <div className="px-5 py-3 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/80">
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400 min-w-0">
                            {breadcrumbs.map((f, i) => (
                                <React.Fragment key={f.id}>
                                    {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-slate-600 shrink-0" />}
                                    <span
                                        className={`truncate ${i === breadcrumbs.length - 1 ? 'font-bold text-gray-800 dark:text-slate-100' : 'hover:text-blue-600 cursor-pointer text-xs'}`}
                                        onClick={() => setActiveFolderId(f.id)}
                                    >
                                        {f.name}
                                    </span>
                                </React.Fragment>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-8 pr-3 py-1.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-xs w-48 focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all dark:text-slate-200"
                                />
                            </div>
                            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-700 px-2.5 py-1 rounded-lg">
                                {filteredDocs.length} tài liệu
                            </span>
                        </div>
                    </div>

                    {/* Document Table */}
                    <div className="flex-1 overflow-y-auto">
                        {docsLoading ? (
                            <div className="flex items-center justify-center h-full text-gray-400">
                                <Loader2 className="w-6 h-6 animate-spin" />
                            </div>
                        ) : filteredDocs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full p-8 text-gray-400">
                                <div className="w-20 h-20 bg-gray-50 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-4">
                                    <FolderOpen className="w-10 h-10 text-gray-200 dark:text-slate-500" />
                                </div>
                                <h3 className="text-base font-bold text-gray-600 dark:text-slate-300 mb-1">Thư mục trống</h3>
                                <p className="text-sm text-gray-400 dark:text-slate-500 mb-4">Tải lên tài liệu đầu tiên vào thư mục này</p>
                                <button
                                    onClick={handleUpload}
                                    className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-bold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                                >
                                    <Upload className="w-4 h-4 inline mr-2" />Tải lên ngay
                                </button>
                            </div>
                        ) : (
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white dark:bg-slate-800 text-[10px] uppercase font-bold text-gray-400 dark:text-slate-500 sticky top-0 z-10 border-b border-gray-100 dark:border-slate-700 tracking-wider">
                                    <tr>
                                        <th className="px-5 py-3.5">Tên tài liệu</th>
                                        <th className="px-5 py-3.5 w-28 text-center">Phiên bản</th>
                                        <th className="px-5 py-3.5 w-40">Trạng thái</th>
                                        <th className="px-5 py-3.5 w-36">Ngày tải lên</th>
                                        <th className="px-5 py-3.5 w-20 text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                                    {filteredDocs.map((doc) => {
                                        const fileInfo = getFileIcon(doc.doc_name);
                                        const FileTypeIcon = fileInfo.icon;
                                        const isSelected = selectedDoc?.doc_id === doc.doc_id;
                                        const statusColor = CDEService.getStatusColor(doc.cde_status || 'S0');

                                        return (
                                            <tr
                                                key={doc.doc_id}
                                                onClick={() => setSelectedDoc(doc)}
                                                className={`hover:bg-blue-50/40 dark:hover:bg-slate-700/40 cursor-pointer transition-all group ${isSelected ? 'bg-blue-50/70 dark:bg-blue-900/20' : ''}`}
                                            >
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-xl ${fileInfo.bg} shrink-0`}>
                                                            <FileTypeIcon className={`w-5 h-5 ${fileInfo.color}`} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-gray-800 dark:text-slate-100 text-sm truncate">{doc.doc_name}</p>
                                                            <p className="text-[10px] text-gray-400 dark:text-slate-500 font-medium mt-0.5">
                                                                {doc.size || '—'} {doc.submitted_by ? `• ${doc.submitted_by}` : ''}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 text-center">
                                                    <span className="text-[11px] font-bold text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-700 px-2.5 py-1 rounded-full font-mono">
                                                        {doc.version || 'P01.01'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: statusColor }}></span>
                                                        <span className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                                                            {CDEService.getStatusLabel(doc.cde_status || 'S0')}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-slate-400 font-medium">
                                                    {doc.upload_date ? new Date(doc.upload_date).toLocaleDateString('vi-VN') : '—'}
                                                </td>
                                                <td className="px-5 py-3.5 text-right">
                                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setPreviewFile(doc); }}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                            title="Xem"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            className="p-1.5 text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                            title="Tải xuống"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Workflow Panel — shows when a doc is selected */}
                {selectedDoc && (
                    <div className="w-[340px] bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col overflow-hidden shrink-0 animate-in slide-in-from-right-4 duration-300">
                        <div className="px-4 py-3.5 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/80">
                            <span className="text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-[0.15em]">Phê duyệt hồ sơ</span>
                            <button onClick={() => setSelectedDoc(null)} className="text-gray-400 hover:text-red-500 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-5">
                            {/* Doc Info */}
                            <div className="flex items-start gap-3 pb-4 border-b border-gray-100 dark:border-slate-700">
                                <div className="w-11 h-11 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-sm font-bold text-gray-800 dark:text-slate-100 line-clamp-2">{selectedDoc.doc_name}</h4>
                                    <p className="text-[10px] font-mono text-gray-400 mt-1">
                                        v{selectedDoc.version || 'P01.01'} • {selectedDoc.size}
                                    </p>
                                </div>
                            </div>

                            {/* Workflow Progress */}
                            <div>
                                <h5 className="text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">Tiến trình duyệt</h5>
                                <div className="flex justify-between mb-2">
                                    {CDE_WORKFLOW_STEPS.map((step, idx) => {
                                        const isCompleted = workflowHistory.some(h => h.step_name === step.name && h.status === 'Approved');
                                        const isCurrent = nextStep?.id === step.id;

                                        return (
                                            <div key={idx} className="flex flex-col items-center gap-1.5 flex-1 relative">
                                                {idx < CDE_WORKFLOW_STEPS.length - 1 && (
                                                    <div className={`absolute left-1/2 right-[-50%] top-3 h-0.5 z-0 ${isCompleted ? 'bg-emerald-500' : 'bg-gray-100 dark:bg-slate-700'}`}></div>
                                                )}
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 text-[9px] font-black border-2 transition-all ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' :
                                                    isCurrent ? 'bg-white dark:bg-slate-800 border-blue-600 text-blue-600 ring-2 ring-blue-100 dark:ring-blue-900/40' :
                                                        'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 text-gray-300 dark:text-slate-500'
                                                    }`}>
                                                    {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : (idx + 1)}
                                                </div>
                                                <span className={`text-[8px] font-bold text-center leading-tight ${isCompleted ? 'text-emerald-600 dark:text-emerald-400' :
                                                    isCurrent ? 'text-blue-600 dark:text-blue-400 font-extrabold' :
                                                        'text-gray-400 dark:text-slate-500'
                                                    }`}>
                                                    {step.name.split(' ').pop()}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Current Status */}
                            <div className={`rounded-xl p-3.5 border ${containerColors[CDEService.getContainerFromStatus(selectedDoc.cde_status || 'S0')].lightBg} ${containerColors[CDEService.getContainerFromStatus(selectedDoc.cde_status || 'S0')].border}`}>
                                <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase mb-1.5">Trạng thái hiện tại</p>
                                <div className="flex items-center gap-2.5">
                                    <div className="p-1.5 bg-white/80 dark:bg-slate-700/80 rounded-lg">
                                        <Shield className={`w-4 h-4 ${containerColors[CDEService.getContainerFromStatus(selectedDoc.cde_status || 'S0')].text}`} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-800 dark:text-slate-100">
                                            {CDEService.getStatusLabel(selectedDoc.cde_status || 'S0')}
                                        </p>
                                        {nextStep && (
                                            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                                                Đang chờ: {nextStep.name}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Workflow History */}
                            {workflowHistory.length > 0 && (
                                <div>
                                    <h5 className="text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                        <History className="w-3 h-3" /> Lịch sử luân chuyển
                                    </h5>
                                    <div className="relative pl-4 space-y-3 before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100 dark:before:bg-slate-700">
                                        {[...workflowHistory].reverse().map((hist, idx) => (
                                            <div key={idx} className="relative">
                                                <div className={`absolute -left-[19px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-800 ${hist.status === 'Approved' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                                <div>
                                                    <p className="text-xs font-bold text-gray-800 dark:text-slate-100">{hist.step_name}</p>
                                                    <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">
                                                        {hist.actor_name} • {new Date(hist.created_at).toLocaleString('vi-VN')}
                                                    </p>
                                                    {hist.comment && (
                                                        <p className={`text-[10px] mt-1 p-2 rounded border italic ${hist.status === 'Approved'
                                                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800'
                                                            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-100 dark:border-red-800'
                                                            }`}>
                                                            "{hist.comment}"
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50/80 dark:bg-slate-800/80">
                            {nextStep ? (
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <button
                                            disabled={processStepMutation.isPending}
                                            onClick={() => handleProcessStep('Rejected')}
                                            className="flex-1 py-2.5 bg-white dark:bg-slate-700 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                                        >
                                            <X className="w-3.5 h-3.5" /> Từ chối
                                        </button>
                                        <button
                                            disabled={processStepMutation.isPending}
                                            onClick={() => handleProcessStep('Approved')}
                                            className="flex-[2] py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-md shadow-emerald-200 dark:shadow-emerald-900/30 flex items-center justify-center gap-1.5"
                                        >
                                            {processStepMutation.isPending ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <>
                                                    {nextStep.id === 'LEADER_SIGN' ? <PenTool className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                                    {nextStep.name}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <p className="text-[9px] text-gray-400 dark:text-slate-500 text-center font-medium">
                                        Quyền hạn: {nextStep.role}
                                    </p>
                                </div>
                            ) : (
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl flex items-center gap-2.5 text-emerald-700 dark:text-emerald-300">
                                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                                    <p className="text-[11px] font-bold">Hồ sơ đã hoàn tất quy trình phê duyệt.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Preview Modal */}
            {previewFile && (
                <FilePreviewModal file={{
                    DocName: previewFile.doc_name,
                    Version: previewFile.version,
                    Size: previewFile.size,
                    StoragePath: previewFile.storage_path,
                }} onClose={() => setPreviewFile(null)} />
            )}
        </div>
    );
};

export default CDEPage;
