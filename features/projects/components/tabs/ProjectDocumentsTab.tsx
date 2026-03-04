import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
    FileText, ChevronRight, ChevronDown,
    Upload, Search, FolderOpen,
    CheckCircle2, AlertCircle, Clock,
    Target, Building2, HardHat, RefreshCw,
    Plus, X, FileCheck, ClipboardList
} from 'lucide-react';
import {
    ProjectStage, InvestmentPolicyDecision, FeasibilityStudy,
    Document, DocCategory, ISO19650Status
} from '@/types';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/lib/supabase';
import { FilePreviewModal } from '../FilePreviewModal';
import { getFileIcon } from '@/utils/fileIcons';
import { getStageColor } from '@/utils/stageColors';
import { formatCurrency } from '@/utils/format';

// Sub-components
import { useProjectDocuments } from '../../hooks/useProjectDocuments';
import { VersionHistoryModal } from '../documents/VersionHistoryModal';
import { DocMetadataPanel } from '../documents/DocMetadataPanel';
import { CdeExplorer } from '../documents/CdeExplorer';

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
            { name: 'QĐ Chủ trương đầu tư', keywords: ['chủ trương', 'qđ chủ trương'] },
            { name: 'QĐ phê duyệt Quy hoạch', keywords: ['quy hoạch'] },
            { name: 'Báo cáo NCKT (F/S)', keywords: ['nghiên cứu khả thi', 'nckt', 'f/s', 'bcnckt'] },
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
            { name: 'TKBVTC', keywords: ['bản vẽ thi công', 'tkbvtc'] },
            { name: 'Dự toán', keywords: ['dự toán'] },
            { name: 'QĐ Phê duyệt TK-DT', keywords: ['phê duyệt thiết kế', 'phê duyệt dự toán'] },
            { name: 'HSMT / HSYC', keywords: ['hồ sơ mời thầu', 'hsmt', 'hồ sơ yêu cầu', 'hsyc'] },
            { name: 'QĐ Phê duyệt KQLCNT', keywords: ['kết quả lựa chọn', 'kqlcnt'] },
            { name: 'Hợp đồng XD', keywords: ['hợp đồng xây dựng', 'hđ xd'] },
            { name: 'GPXD', keywords: ['giấy phép xây dựng', 'gpxd'] },
            { name: 'PCCC', keywords: ['pccc', 'phòng cháy'] },
        ]
    },
    {
        stage: ProjectStage.Completion,
        label: 'Kết thúc xây dựng',
        color: 'blue',
        icon: HardHat,
        docs: [
            { name: 'Biên bản nghiệm thu', keywords: ['nghiệm thu'] },
            { name: 'QĐ Quyết toán', keywords: ['quyết toán'] },
            { name: 'Biên bản bàn giao', keywords: ['bàn giao'] },
            { name: 'Sổ tay vận hành', keywords: ['vận hành', 'sổ tay'] },
        ]
    }
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

    // Modal states
    const [previewFile, setPreviewFile] = useState<any>(null);
    const [historyDoc, setHistoryDoc] = useState<Document | null>(null);

    // Upload
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [pendingDocType, setPendingDocType] = useState<string>('');

    // Doc metadata editing
    const [expandedDocIdx, setExpandedDocIdx] = useState<string | null>(null);
    const [editingMeta, setEditingMeta] = useState<Record<string, any>>({});
    const [savingMeta, setSavingMeta] = useState(false);
    const [extractingDoc, setExtractingDoc] = useState<string | null>(null);

    // Data from custom hook
    const {
        folders, documents, dbDocs, setDbDocs,
        uploadedDocs, setUploadedDocs,
        isLoading, stats, matchDocToCategory, folderDocCount,
    } = useProjectDocuments(projectID, projectStage);

    // Search filter
    const filteredDocuments = useMemo(() => {
        if (!searchQuery.trim()) return documents;
        const q = searchQuery.toLowerCase();
        return documents.filter(d => d.DocName.toLowerCase().includes(q));
    }, [documents, searchQuery]);

    // Toggle category expansion
    const toggleCategory = (stage: string) => {
        setExpandedCategories(prev =>
            prev.includes(stage) ? prev.filter(s => s !== stage) : [...prev, stage]
        );
    };

    /** Extract document metadata using Gemini AI */
    const extractDocMetadata = async (file: File): Promise<Record<string, string>> => {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY
            || (typeof process !== 'undefined' && (process.env as any)?.GEMINI_API_KEY)
            || 'AIzaSyD0gKHf3JCjPRRnlv7HddHxrhfAJe2pOQY';
        if (!apiKey) return {};
        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
            const buffer = await file.arrayBuffer();
            const base64 = btoa(
                new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
            );
            const result = await model.generateContent([
                { inlineData: { mimeType: file.type || 'application/pdf', data: base64 } },
                {
                    text: `Bạn là chuyên gia pháp lý xây dựng Việt Nam. Đọc văn bản đính kèm và trích xuất thông tin.

Trả về JSON object với đúng các key:
{
  "document_number": "Số hiệu văn bản (VD: 123/QĐ-TTg)",
  "issue_date": "Ngày ban hành dạng YYYY-MM-DD",
  "issuing_authority": "Đơn vị / cơ quan ban hành",
  "notes": "Tóm tắt ngắn gọn nội dung chính (1-2 câu)"
}

Nếu không tìm thấy, để giá trị rỗng "". CHỈ TRẢ VỀ JSON, KHÔNG markdown.` },
            ]);
            const text = result.response.text().trim();
            const jsonStr = text.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '');
            return JSON.parse(jsonStr);
        } catch (err) {
            console.error('Gemini extract error:', err);
            return {};
        }
    };

    // Upload handler
    const handleUpload = (docTypeName?: string, docKey?: string) => {
        if (docTypeName) setPendingDocType(docTypeName);
        if (docKey) setExtractingDoc(docKey);
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        for (const file of Array.from(files) as File[]) {
            try {
                const ext = file.name.split('.').pop();
                const path = `${projectID}/docs/${Date.now()}.${ext}`;
                const { error: uploadError } = await supabase.storage
                    .from('task-attachments').upload(path, file);
                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage.from('task-attachments').getPublicUrl(path);
                const finalDocName = pendingDocType ? `${pendingDocType} - ${file.name}` : file.name;

                const { data: insertedDoc } = await (supabase.from('documents') as any).insert({
                    project_id: projectID,
                    doc_name: finalDocName,
                    storage_path: urlData.publicUrl,
                    size: `${(file.size / 1024).toFixed(0)} KB`,
                    category: 0,
                    source: 'manual',
                    is_digitized: true,
                    doc_type: pendingDocType || null,
                }).select('doc_id').single();

                const docId = insertedDoc?.doc_id || Math.floor(Math.random() * 100000);

                const newDoc: any = {
                    DocID: docId, ReferenceID: projectID, ProjectID: projectID,
                    Category: DocCategory.Legal,
                    DocName: finalDocName,
                    StoragePath: urlData.publicUrl, IsDigitized: true,
                    UploadDate: new Date().toLocaleDateString('vi-VN'),
                    Version: 'P01.01', Size: `${(file.size / 1024).toFixed(0)} KB`,
                    ISOStatus: ISO19650Status.S0, source: 'manual',
                };
                setDbDocs(prev => [newDoc, ...prev]);

                // AI extraction
                const currentDocKey = extractingDoc;
                if (currentDocKey) {
                    try {
                        const extracted = await extractDocMetadata(file);
                        if (extracted && Object.keys(extracted).length > 0) {
                            const metaUpdate: any = {};
                            if (extracted.document_number) metaUpdate.document_number = extracted.document_number;
                            if (extracted.issue_date) metaUpdate.issue_date = extracted.issue_date;
                            if (extracted.issuing_authority) metaUpdate.issuing_authority = extracted.issuing_authority;
                            if (extracted.notes) metaUpdate.notes = extracted.notes;
                            if (Object.keys(metaUpdate).length > 0) {
                                await (supabase.from('documents') as any).update(metaUpdate).eq('doc_id', docId);
                            }
                            setDbDocs(prev => prev.map(d => d.DocID === docId ? { ...d, ...metaUpdate } : d));
                            setEditingMeta(prev => ({ ...prev, [currentDocKey]: { ...extracted } }));
                            setExpandedDocIdx(currentDocKey);
                        }
                    } catch { /* user can fill manually */ }
                    setExtractingDoc(null);
                }
            } catch (err) {
                console.error('Upload failed:', err);
            }
        }
        e.target.value = '';
        setPendingDocType('');
        setExtractingDoc(null);
    };

    // Save document metadata
    const handleSaveMetadata = async (docId: number, meta: Record<string, any>) => {
        setSavingMeta(true);
        try {
            const updateData: any = {};
            if (meta.document_number !== undefined) updateData.document_number = meta.document_number;
            if (meta.issue_date !== undefined) updateData.issue_date = meta.issue_date || null;
            if (meta.issuing_authority !== undefined) updateData.issuing_authority = meta.issuing_authority;
            if (meta.updated_by !== undefined) updateData.updated_by = meta.updated_by;
            if (meta.notes !== undefined) updateData.notes = meta.notes;

            await (supabase.from('documents') as any).update(updateData).eq('doc_id', docId);
            setDbDocs(prev => prev.map(d => d.DocID === docId ? { ...d, ...meta } : d));
            setExpandedDocIdx(null);
            setEditingMeta({});
        } catch (err) {
            console.error('Save metadata failed:', err);
        } finally {
            setSavingMeta(false);
        }
    };

    // Stat cards using real data
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
                type="file" ref={fileInputRef} className="hidden" multiple
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
                                type="text" placeholder="Tìm kiếm..."
                                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-8 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm w-64 focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all dark:text-slate-200 dark:placeholder-slate-400"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                        <button
                            onClick={() => handleUpload()}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm shadow-blue-200"
                        >
                            <Upload className="w-4 h-4" /> Tải lên
                        </button>
                    </div>
                </div>
            </div>

            {/* ═══ LEGAL DOCUMENTS VIEW ═══ */}
            {activeView === 'legal' && (
                <div className="space-y-4">
                    {/* Quick Stats */}
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
                                            {isExpanded ? <ChevronDown className={`w-4 h-4 ${colors.text}`} /> : <ChevronRight className={`w-4 h-4 ${colors.text}`} />}
                                        </div>
                                        <div className="text-left">
                                            <div className="flex items-center gap-2">
                                                <CategoryIcon className={`w-4 h-4 ${colors.text}`} />
                                                <p className={`text-sm font-bold ${colors.text}`}>{category.label}</p>
                                                {isCurrent && <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full uppercase">Hiện tại</span>}
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{totalCount} loại văn bản</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-xs font-bold ${matchedCount === totalCount ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-slate-400'}`}>
                                            {matchedCount}/{totalCount}
                                        </span>
                                        <div className="w-24 h-2 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full transition-all duration-500 ${matchedCount === totalCount ? 'bg-emerald-500' : progressPercent > 0 ? `bg-${category.color}-500` : 'bg-gray-300'}`} style={{ width: `${progressPercent}%` }} />
                                        </div>
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div className="px-5 py-4 border-t border-gray-100 dark:border-slate-700 space-y-2">
                                        {/* Investment Policy */}
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

                                        {/* Feasibility Study */}
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

                                        {/* Document type list */}
                                        {category.docs.map((docType, idx) => {
                                            const matchedDoc = matchDocToCategory(docType.keywords);
                                            const hasDoc = !!matchedDoc;
                                            const fileInfo = hasDoc ? getFileIcon(matchedDoc!.DocName) : null;
                                            const docKey = `${category.stage}-${idx}`;
                                            const isDocExpanded = expandedDocIdx === docKey;
                                            const currentMeta = editingMeta[docKey] || {};

                                            return (
                                                <div key={idx} className="rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-slate-600 transition-all">
                                                    {/* Main row */}
                                                    <div
                                                        className={`flex items-center justify-between py-2.5 px-3 rounded-lg transition-all ${hasDoc ? 'hover:bg-blue-50/50 dark:hover:bg-slate-700 cursor-pointer' : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'}`}
                                                        onClick={() => {
                                                            if (hasDoc) {
                                                                setExpandedDocIdx(isDocExpanded ? null : docKey);
                                                                if (!isDocExpanded) {
                                                                    const md = matchedDoc as any;
                                                                    setEditingMeta(prev => ({
                                                                        ...prev,
                                                                        [docKey]: {
                                                                            document_number: md?.document_number || '',
                                                                            issue_date: md?.issue_date || '',
                                                                            issuing_authority: md?.issuing_authority || '',
                                                                            updated_by: md?.updated_by || '',
                                                                            notes: md?.notes || '',
                                                                        }
                                                                    }));
                                                                }
                                                            }
                                                        }}
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                                            {hasDoc && fileInfo ? (
                                                                <div className={`w-8 h-8 rounded-lg ${fileInfo.bg} flex items-center justify-center shrink-0`}>
                                                                    <fileInfo.icon className={`w-4 h-4 ${fileInfo.color}`} />
                                                                </div>
                                                            ) : (
                                                                <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-slate-700 border border-dashed border-gray-200 dark:border-slate-600 flex items-center justify-center shrink-0">
                                                                    <FileText className="w-4 h-4 text-gray-300 dark:text-slate-500" />
                                                                </div>
                                                            )}
                                                            <div className="min-w-0">
                                                                <span className={`text-sm ${hasDoc ? 'text-gray-800 dark:text-slate-100 font-medium' : 'text-gray-500 dark:text-slate-400'}`}>{docType.name}</span>
                                                                {hasDoc && (
                                                                    <p className="text-[11px] text-gray-400 dark:text-slate-500 truncate mt-0.5">
                                                                        {(matchedDoc as any)?.document_number && <span className="font-semibold text-gray-500 dark:text-slate-400">{(matchedDoc as any).document_number} • </span>}
                                                                        {(matchedDoc as any)?.issuing_authority && <span>{(matchedDoc as any).issuing_authority} • </span>}
                                                                        {(matchedDoc as any)?.issue_date || matchedDoc!.UploadDate || ''}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            {hasDoc ? (
                                                                <>
                                                                    {(matchedDoc as any)?.source && (
                                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${(matchedDoc as any).source === 'task'
                                                                            ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                                                                            : (matchedDoc as any).source === 'tt24'
                                                                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                                                            }`}>
                                                                            {(matchedDoc as any).source === 'task' ? <><ClipboardList className="w-3 h-3 inline" /> Công việc</>
                                                                                : (matchedDoc as any).source === 'tt24' ? <><FileText className="w-3 h-3 inline" /> TT24</>
                                                                                    : (matchedDoc as any).source === 'manual' ? <><Upload className="w-3 h-3 inline" /> Tải lên</> : ''}
                                                                        </span>
                                                                    )}
                                                                    <span className="text-xs px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg font-bold flex items-center gap-1">
                                                                        <CheckCircle2 className="w-3 h-3" /> Đã có
                                                                    </span>
                                                                    {isDocExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <span className="text-xs px-2.5 py-1 bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500 rounded-lg font-medium">Chưa có</span>
                                                                    {extractingDoc === docKey ? (
                                                                        <span className="text-xs px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg font-bold flex items-center gap-1.5 animate-pulse">
                                                                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Đang trích xuất...
                                                                        </span>
                                                                    ) : (
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); handleUpload(docType.name, docKey); }}
                                                                            className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                                                                            title="Tải lên văn bản"
                                                                        >
                                                                            <Plus className="w-4 h-4" />
                                                                        </button>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Expanded metadata panel */}
                                                    {isDocExpanded && hasDoc && (
                                                        <DocMetadataPanel
                                                            doc={matchedDoc!}
                                                            meta={currentMeta}
                                                            onMetaChange={(field, value) => setEditingMeta(prev => ({ ...prev, [docKey]: { ...prev[docKey], [field]: value } }))}
                                                            onSave={() => handleSaveMetadata(matchedDoc!.DocID, currentMeta)}
                                                            onClose={() => setExpandedDocIdx(null)}
                                                            onPreview={() => setPreviewFile(matchedDoc)}
                                                            savingMeta={savingMeta}
                                                        />
                                                    )}
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
                                            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold uppercase">Mới</span>
                                            <span className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold">WIP</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ═══ CDE VIEW — Extracted to CdeExplorer ═══ */}
            {activeView === 'cde' && (
                <CdeExplorer
                    folders={folders}
                    documents={documents}
                    filteredDocuments={filteredDocuments}
                    isLoading={isLoading}
                    activeFolderId={activeFolderId}
                    setActiveFolderId={setActiveFolderId}
                    searchQuery={searchQuery}
                    folderDocCount={folderDocCount}
                    onPreview={(doc) => setPreviewFile(doc)}
                    onHistory={(doc) => setHistoryDoc(doc)}
                    onUpload={() => handleUpload()}
                />
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
