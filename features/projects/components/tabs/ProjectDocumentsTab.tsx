import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
    Folder as FolderIcon, FileText, ChevronRight, ChevronDown,
    Upload, Search, Eye, Download, FolderOpen, MoreVertical,
    Calendar, Building2, Target, Coins, Filter, CheckCircle2,
    Clock, AlertCircle, Plus, FileCheck, X, History, PenTool,
    FileSpreadsheet, FileImage, File as FileIcon, ExternalLink, RefreshCw
} from 'lucide-react';
import {
    Document, Folder, ISO19650Status, ProjectStage,
    InvestmentPolicyDecision, FeasibilityStudy, DocCategory
} from '@/types';
import { DocumentService } from '@/services/DocumentService';
import { useFolders, useDocuments } from '@/hooks/useDocuments';
import FilePreviewModal from '../FilePreviewModal';
import { supabase } from '@/lib/supabase';
import { DOC_CROSS_REFS } from '@/utils/docStepMapping';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
    const [pendingDocType, setPendingDocType] = useState<string>('');

    // Doc metadata editing
    const [expandedDocIdx, setExpandedDocIdx] = useState<string | null>(null);
    const [editingMeta, setEditingMeta] = useState<Record<string, any>>({});
    const [savingMeta, setSavingMeta] = useState(false);
    const [extractingDoc, setExtractingDoc] = useState<string | null>(null); // docKey being extracted

    // Data hooks
    const { data: folders = [] } = useFolders(projectID);
    const { data: documents = [], isLoading } = useDocuments(activeFolderId);

    // Load real documents from Supabase
    const [dbDocs, setDbDocs] = useState<Document[]>([]);
    useEffect(() => {
        if (!projectID) return;
        const loadDocs = async () => {
            const { data } = await supabase
                .from('documents')
                .select('*')
                .eq('project_id', projectID)
                .order('upload_date', { ascending: false }) as any;
            if (data) {
                const mapped = (data as any[]).map((row: any) => ({
                    DocID: row.doc_id,
                    ReferenceID: row.reference_id || projectID,
                    ProjectID: row.project_id,
                    Category: row.category || 0,
                    DocName: row.doc_name,
                    StoragePath: row.storage_path,
                    IsDigitized: row.is_digitized ?? true,
                    UploadDate: row.upload_date ? new Date(row.upload_date).toLocaleDateString('vi-VN') : '',
                    Version: row.version || 'P01.01',
                    Size: row.size || '',
                    ISOStatus: 'S0' as any,
                    source: row.source,
                    task_id: row.task_id,
                    tt24_field: row.tt24_field,
                    // Metadata fields
                    document_number: row.document_number || '',
                    issue_date: row.issue_date || '',
                    issuing_authority: row.issuing_authority || '',
                    updated_by: row.updated_by || '',
                    notes: row.notes || '',
                } as Document & { source?: string; task_id?: string; tt24_field?: string; document_number?: string; issue_date?: string; issuing_authority?: string; updated_by?: string; notes?: string }));
                setDbDocs(mapped);
            }
        };
        loadDocs();
    }, [projectID]);

    // All project documents (mock + real from DB)
    const projectDocuments = useMemo(() => {
        return [...DocumentService.getDocumentsByProject(projectID), ...uploadedDocs, ...dbDocs];
    }, [projectID, uploadedDocs, dbDocs]);

    // Dynamic stats
    const stats = useMemo(() => {
        const base = DocumentService.getDocumentStats(projectID);
        const extraCount = uploadedDocs.length + dbDocs.length;
        return {
            total: base.total + extraCount,
            approved: base.approved,
            inProgress: base.inProgress,
            wip: base.wip + extraCount,
        };
    }, [projectID, uploadedDocs, dbDocs]);

    // Search filter
    const filteredDocuments = useMemo(() => {
        if (!searchQuery.trim()) return documents;
        const q = searchQuery.toLowerCase();
        return documents.filter(d => d.DocName.toLowerCase().includes(q));
    }, [documents, searchQuery]);

    // Match documents to legal categories — enhanced with cross-ref mapping
    const matchDocToCategory = useCallback((keywords: string[]): (Document & { source?: string }) | undefined => {
        // 1. Try direct keyword match in doc names (covers all sources)
        const byKeyword = projectDocuments.find(doc => {
            const name = doc.DocName.toLowerCase();
            return keywords.some(kw => name.includes(kw.toLowerCase()));
        });
        if (byKeyword) return byKeyword as any;

        // 2. Try cross-ref mapping: find the mapping entry for these keywords,
        //    then look for docs with matching tt24_field
        const crossRef = DOC_CROSS_REFS.find(ref =>
            ref.legalKeywords.some(kw =>
                keywords.some(k => k.toLowerCase().includes(kw.toLowerCase()) || kw.toLowerCase().includes(k.toLowerCase()))
            )
        );
        if (crossRef) {
            // Check if any DB doc has a tt24_field that matches this cross-ref
            const tt24Key = `doc_${crossRef.tt24Stt}_${crossRef.tt24Label}`;
            const byTT24 = projectDocuments.find((doc: any) =>
                doc.tt24_field === tt24Key
            );
            if (byTT24) return byTT24 as any;
        }

        return undefined;
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

    // Upload handler — saves to Supabase Storage + documents table + AI extraction
    const handleUpload = (docTypeName?: string, docKey?: string) => {
        if (docTypeName) setPendingDocType(docTypeName);
        if (docKey) setExtractingDoc(docKey); // track which row
        fileInputRef.current?.click();
    };
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        for (const file of Array.from(files)) {
            try {
                const ext = file.name.split('.').pop();
                const path = `${projectID}/docs/${Date.now()}.${ext}`;
                const { error: uploadError } = await supabase.storage
                    .from('task-attachments')
                    .upload(path, file);
                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from('task-attachments')
                    .getPublicUrl(path);

                // Use doc type name as prefix for keyword matching
                const finalDocName = pendingDocType
                    ? `${pendingDocType} - ${file.name}`
                    : file.name;

                // Insert into DB first
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

                // Add to local state for immediate display
                const newDoc: any = {
                    DocID: docId,
                    ReferenceID: projectID,
                    ProjectID: projectID,
                    Category: DocCategory.Legal,
                    DocName: pendingDocType ? `${pendingDocType} - ${file.name}` : file.name,
                    StoragePath: urlData.publicUrl,
                    IsDigitized: true,
                    UploadDate: new Date().toLocaleDateString('vi-VN'),
                    Version: 'P01.01',
                    Size: `${(file.size / 1024).toFixed(0)} KB`,
                    ISOStatus: ISO19650Status.S0,
                    source: 'manual',
                };
                setDbDocs(prev => [newDoc, ...prev]);

                // AI extraction — run in background
                const currentDocKey = extractingDoc;
                if (currentDocKey) {
                    setExtractingDoc(currentDocKey); // show spinner
                    try {
                        const extracted = await extractDocMetadata(file);
                        if (extracted && Object.keys(extracted).length > 0) {
                            // Save extracted metadata to DB
                            const metaUpdate: any = {};
                            if (extracted.document_number) metaUpdate.document_number = extracted.document_number;
                            if (extracted.issue_date) metaUpdate.issue_date = extracted.issue_date;
                            if (extracted.issuing_authority) metaUpdate.issuing_authority = extracted.issuing_authority;
                            if (extracted.notes) metaUpdate.notes = extracted.notes;

                            if (Object.keys(metaUpdate).length > 0) {
                                await (supabase.from('documents') as any)
                                    .update(metaUpdate)
                                    .eq('doc_id', docId);
                            }

                            // Update local state & expand
                            setDbDocs(prev => prev.map(d =>
                                d.DocID === docId ? { ...d, ...metaUpdate } : d
                            ));
                            setEditingMeta(prev => ({ ...prev, [currentDocKey]: { ...extracted } }));
                            setExpandedDocIdx(currentDocKey);
                        }
                    } catch {
                        // Extraction failed — user can fill manually
                    }
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

            await (supabase.from('documents') as any)
                .update(updateData)
                .eq('doc_id', docId);

            // Update local dbDocs state
            setDbDocs(prev => prev.map(d =>
                d.DocID === docId ? { ...d, ...meta } : d
            ));

            setExpandedDocIdx(null);
            setEditingMeta({});
        } catch (err) {
            console.error('Save metadata failed:', err);
        } finally {
            setSavingMeta(false);
        }
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
                            onClick={() => handleUpload()}
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

                                        {/* Document type list with expandable metadata */}
                                        {category.docs.map((docType, idx) => {
                                            const matchedDoc = matchDocToCategory(docType.keywords);
                                            const hasDoc = !!matchedDoc;
                                            const fileInfo = hasDoc ? getFileIcon(matchedDoc!.DocName) : null;
                                            const docKey = `${category.stage}-${idx}`;
                                            const isExpanded = expandedDocIdx === docKey;
                                            const currentMeta = editingMeta[docKey] || {};

                                            return (
                                                <div key={idx} className="rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-slate-600 transition-all">
                                                    {/* Main row */}
                                                    <div
                                                        className={`flex items-center justify-between py-2.5 px-3 rounded-lg transition-all ${hasDoc
                                                            ? 'hover:bg-blue-50/50 dark:hover:bg-slate-700 cursor-pointer'
                                                            : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'
                                                            }`}
                                                        onClick={() => {
                                                            if (hasDoc) {
                                                                setExpandedDocIdx(isExpanded ? null : docKey);
                                                                if (!isExpanded) {
                                                                    // Pre-fill metadata from matched doc
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
                                                                    {/* Source badge */}
                                                                    {(matchedDoc as any)?.source && (
                                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${(matchedDoc as any).source === 'task'
                                                                            ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                                                                            : (matchedDoc as any).source === 'tt24'
                                                                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                                                            }`}>
                                                                            {(matchedDoc as any).source === 'task' ? '📋 Công việc'
                                                                                : (matchedDoc as any).source === 'tt24' ? '📄 TT24'
                                                                                    : (matchedDoc as any).source === 'manual' ? '📤 Tải lên' : ''}
                                                                        </span>
                                                                    )}
                                                                    <span className="text-xs px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg font-bold flex items-center gap-1">
                                                                        <CheckCircle2 className="w-3 h-3" /> Đã có
                                                                    </span>
                                                                    {isExpanded ? (
                                                                        <ChevronDown className="w-4 h-4 text-gray-400" />
                                                                    ) : (
                                                                        <ChevronRight className="w-4 h-4 text-gray-400" />
                                                                    )}
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
                                                    {isExpanded && hasDoc && (
                                                        <div className="mx-3 mb-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-gray-100 dark:border-slate-700 space-y-3 animate-in slide-in-from-top-2 duration-200">
                                                            {/* File info row */}
                                                            <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-slate-700">
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-xs text-gray-500 dark:text-slate-400">Tệp đính kèm</p>
                                                                    <p className="text-sm font-medium text-gray-800 dark:text-slate-100 truncate">{matchedDoc!.DocName}</p>
                                                                </div>
                                                                <div className="flex items-center gap-1.5">
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); setPreviewFile(matchedDoc); }}
                                                                        className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                                                                        title="Xem"
                                                                    >
                                                                        <Eye className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); /* download */ }}
                                                                        className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all"
                                                                        title="Tải về"
                                                                    >
                                                                        <Download className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {/* Metadata grid */}
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <div>
                                                                    <label className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Số hiệu văn bản</label>
                                                                    <input
                                                                        type="text"
                                                                        value={currentMeta.document_number || ''}
                                                                        onChange={e => setEditingMeta(prev => ({ ...prev, [docKey]: { ...prev[docKey], document_number: e.target.value } }))}
                                                                        placeholder="VD: 123/QĐ-TTg"
                                                                        className="mt-1 w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-300 dark:focus:border-blue-700 transition-all"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Ngày ban hành</label>
                                                                    <input
                                                                        type="date"
                                                                        value={currentMeta.issue_date || ''}
                                                                        onChange={e => setEditingMeta(prev => ({ ...prev, [docKey]: { ...prev[docKey], issue_date: e.target.value } }))}
                                                                        className="mt-1 w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-300 dark:focus:border-blue-700 transition-all"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Đơn vị ban hành</label>
                                                                    <input
                                                                        type="text"
                                                                        value={currentMeta.issuing_authority || ''}
                                                                        onChange={e => setEditingMeta(prev => ({ ...prev, [docKey]: { ...prev[docKey], issuing_authority: e.target.value } }))}
                                                                        placeholder="VD: Thủ tướng Chính phủ"
                                                                        className="mt-1 w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-300 dark:focus:border-blue-700 transition-all"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Người cập nhật</label>
                                                                    <input
                                                                        type="text"
                                                                        value={currentMeta.updated_by || ''}
                                                                        onChange={e => setEditingMeta(prev => ({ ...prev, [docKey]: { ...prev[docKey], updated_by: e.target.value } }))}
                                                                        placeholder="VD: Nguyễn Văn A"
                                                                        className="mt-1 w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-300 dark:focus:border-blue-700 transition-all"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Ghi chú</label>
                                                                <textarea
                                                                    value={currentMeta.notes || ''}
                                                                    onChange={e => setEditingMeta(prev => ({ ...prev, [docKey]: { ...prev[docKey], notes: e.target.value } }))}
                                                                    placeholder="Nhập ghi chú..."
                                                                    rows={2}
                                                                    className="mt-1 w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-300 dark:focus:border-blue-700 transition-all resize-none"
                                                                />
                                                            </div>

                                                            {/* Action buttons */}
                                                            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-700">
                                                                <div className="text-[11px] text-gray-400 dark:text-slate-500">
                                                                    {matchedDoc!.Size && <span>Kích thước: {matchedDoc!.Size}</span>}
                                                                    {matchedDoc!.Version && <span className="ml-3">Phiên bản: {matchedDoc!.Version}</span>}
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); setExpandedDocIdx(null); }}
                                                                        className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                                                                    >
                                                                        Đóng
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleSaveMetadata(matchedDoc!.DocID, currentMeta);
                                                                        }}
                                                                        disabled={savingMeta}
                                                                        className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                                                                    >
                                                                        <FileCheck className="w-3.5 h-3.5" />
                                                                        {savingMeta ? 'Đang lưu...' : 'Lưu thông tin'}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
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
                                            onClick={() => handleUpload()}
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
