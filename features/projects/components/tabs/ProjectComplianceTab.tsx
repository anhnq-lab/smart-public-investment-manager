import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Project, ProjectGroup, CostBreakdown } from '@/types';
import { ProjectService } from '@/services/ProjectService';
import {
    ChevronDown, ChevronUp, Upload, FileText, Download, Eye, X,
    CheckCircle2, AlertCircle, Clock, RefreshCw, Database, Save,
    FileCheck, Pencil, ExternalLink, Trash2
} from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/lib/supabase';

// ══════════════════════════════════════════════════════════════
//  Types
// ══════════════════════════════════════════════════════════════

interface ProjectComplianceTabProps {
    project: Project;
    onUpdate: (updated: Partial<Project>) => void;
}

/** Loại mục: data = tự lấy từ DA, document = cần upload VB, heading = tiêu đề nhóm */
type ItemType = 'heading' | 'data' | 'document' | 'cost_breakdown';

/** Mỗi dòng trong bảng TT24 */
interface TT24Row {
    stt: string;               // Mã STT theo thông tư (I, 1, 2, 3.1, ...)
    label: string;             // Nội dung dữ liệu
    type: ItemType;
    depth: number;             // 0 = heading, 1 = level 1, 2 = sub-item
    projectKey?: keyof Project;       // Key trong Project để auto-fill
    templateFile?: string;     // Tên file biểu mẫu trong /templates
    templateLabel?: string;    // Tên biểu mẫu hiển thị
    extractPrompt?: string;    // Prompt cho Gemini khi trích xuất từ VB
    groups: ProjectGroup[];    // Áp dụng cho nhóm nào
    subFields?: { key: keyof Project | string; label: string }[];  // Các trường con trích xuất
}

/** State upload cho mỗi dòng */
interface UploadState {
    file?: File;
    fileName?: string;
    status: 'empty' | 'uploading' | 'extracting' | 'done' | 'error';
    extractedData?: Record<string, string>;
    errorMsg?: string;
}

// ══════════════════════════════════════════════════════════════
//  TT24 Phần A + B — Bảng số 01:  Mục lục đầy đủ
// ══════════════════════════════════════════════════════════════

const ALL = [ProjectGroup.QN, ProjectGroup.A, ProjectGroup.B, ProjectGroup.C];
const AB = [ProjectGroup.QN, ProjectGroup.A, ProjectGroup.B];
const ABC_NOT_C = [ProjectGroup.QN, ProjectGroup.A, ProjectGroup.B]; // riêng C dùng BCKTKT

const TT24_ROWS: TT24Row[] = [
    // ─── PHẦN A.I — DỮ LIỆU CHUNG ───
    { stt: 'I', label: 'DỮ LIỆU CHUNG', type: 'heading', depth: 0, groups: ALL },
    { stt: '1', label: 'Tên dự án', type: 'data', depth: 1, projectKey: 'ProjectName', groups: ALL },
    { stt: '2', label: 'Nhóm dự án', type: 'data', depth: 1, projectKey: 'GroupCode', groups: ALL },
    { stt: '3', label: 'Địa điểm xây dựng', type: 'data', depth: 1, projectKey: 'LocationCode', groups: ALL },
    { stt: '4', label: 'Người quyết định đầu tư', type: 'data', depth: 1, projectKey: 'CompetentAuthority', groups: ALL },
    { stt: '5', label: 'Chủ đầu tư', type: 'data', depth: 1, projectKey: 'InvestorName', groups: ALL },
    { stt: '6', label: 'Mục tiêu đầu tư', type: 'data', depth: 1, projectKey: 'Objective', groups: ALL },
    { stt: '7', label: 'Quy mô đầu tư (diện tích, công suất, quy mô)', type: 'data', depth: 1, projectKey: 'InvestmentScale', groups: ALL },

    // ─── PHẦN A.II — DỮ LIỆU CHI TIẾT ───
    { stt: 'II', label: 'DỮ LIỆU CHI TIẾT', type: 'heading', depth: 0, groups: ALL },

    // 1. Chủ trương đầu tư
    {
        stt: '1', label: 'Văn bản chủ trương đầu tư', type: 'document', depth: 1,
        groups: ALL,
        templateFile: 'mau-05-to-trinh-qd-chu-truong-dt.md',
        templateLabel: 'Mẫu 05',
        extractPrompt: 'Trích xuất: Số quyết định, Ngày ban hành, Cơ quan ban hành từ văn bản chủ trương đầu tư',
        subFields: [
            { key: 'ApprovalDecisionNumber', label: 'Số QĐ' },
            { key: 'ApprovalDate', label: 'Ngày' },
            { key: 'ApprovalAgency', label: 'CQ ban hành' },
        ],
    },

    // 2. QH liên quan
    {
        stt: '2', label: 'Quyết định phê duyệt Quy hoạch có liên quan', type: 'document', depth: 1,
        groups: ALL,
        extractPrompt: 'Trích xuất: Số quyết định, Ngày phê duyệt quy hoạch',
        subFields: [
            { key: 'PlanningApprovalNumber', label: 'Số QĐ' },
            { key: 'PlanningApprovalDate', label: 'Ngày' },
        ],
    },

    // 3. PCCC, MT
    { stt: '3', label: 'Kết quả thực hiện thủ tục về PCCC, bảo vệ môi trường', type: 'heading', depth: 1, groups: ALL },
    {
        stt: '3.1', label: 'Văn bản kết quả thực hiện thủ tục về PCCC', type: 'document', depth: 2,
        groups: ALL,
        extractPrompt: 'Trích xuất: Số văn bản, Ngày cấp, Cơ quan cấp phép PCCC',
        subFields: [
            { key: 'PCCCApprovalNumber', label: 'Số VB' },
            { key: 'PCCCApprovalDate', label: 'Ngày' },
            { key: 'PCCCApprovalAgency', label: 'CQ cấp' },
        ],
    },
    {
        stt: '3.2', label: 'Văn bản kết quả thực hiện thủ tục về bảo vệ môi trường', type: 'document', depth: 2,
        groups: ALL,
        extractPrompt: 'Trích xuất: Loại thủ tục (ĐTM hoặc Kế hoạch bảo vệ MT), Số văn bản, Ngày cấp',
        subFields: [
            { key: 'EnvApprovalType', label: 'Loại' },
            { key: 'EnvApprovalNumber', label: 'Số VB' },
            { key: 'EnvApprovalDate', label: 'Ngày' },
        ],
    },

    // 4. Thẩm định BCNCKT — Nhóm A,B dùng BCNCKT; Nhóm C dùng BCKTKT
    {
        stt: '4', label: 'Thông báo kết quả thẩm định Báo cáo nghiên cứu khả thi', type: 'document', depth: 1,
        groups: ABC_NOT_C,
        templateFile: 'mau-04-bc-ket-qua-tham-dinh-chu-truong.md',
        templateLabel: 'Mẫu 04',
        extractPrompt: 'Trích xuất: Số thông báo, Ngày thẩm định, Cơ quan thẩm định',
        subFields: [
            { key: 'AppraisalResultNumber', label: 'Số TB' },
            { key: 'AppraisalResultDate', label: 'Ngày' },
            { key: 'AppraisalAgency', label: 'CQ thẩm định' },
        ],
    },
    {
        stt: '4', label: 'Thông báo kết quả thẩm định Báo cáo kinh tế - kỹ thuật', type: 'document', depth: 1,
        groups: [ProjectGroup.C],
        templateFile: 'thong-bao-ket-qua-tham-dinh-bcktkt.md',
        templateLabel: 'TB KQ thẩm định',
        extractPrompt: 'Trích xuất: Số thông báo, Ngày thẩm định, Cơ quan thẩm định từ kết quả thẩm định BCKTKT',
        subFields: [
            { key: 'AppraisalResultNumber', label: 'Số TB' },
            { key: 'AppraisalResultDate', label: 'Ngày' },
            { key: 'AppraisalAgency', label: 'CQ thẩm định' },
        ],
    },

    // 5. QĐ phê duyệt dự án
    {
        stt: '5', label: 'Quyết định phê duyệt dự án (BCNCKT)', type: 'document', depth: 1,
        groups: ABC_NOT_C,
        templateFile: 'quyet-dinh-phe-duyet-du-an-bcnckt.md',
        templateLabel: 'QĐ phê duyệt DA',
        extractPrompt: 'Trích xuất: Số quyết định, Ngày phê duyệt, Cơ quan phê duyệt, Tổng mức đầu tư',
        subFields: [
            { key: 'ApprovalDecisionNumber', label: 'Số QĐ' },
            { key: 'ApprovalDate', label: 'Ngày' },
            { key: 'ApprovalAgency', label: 'CQ phê duyệt' },
            { key: 'TotalInvestment', label: 'Tổng mức ĐT' },
        ],
    },
    {
        stt: '5', label: 'Quyết định phê duyệt dự án (BCKTKT)', type: 'document', depth: 1,
        groups: [ProjectGroup.C],
        templateFile: 'quyet-dinh-phe-duyet-du-an-bcktkt.md',
        templateLabel: 'QĐ phê duyệt DA',
        extractPrompt: 'Trích xuất: Số quyết định, Ngày phê duyệt, Cơ quan phê duyệt, Tổng mức đầu tư',
        subFields: [
            { key: 'ApprovalDecisionNumber', label: 'Số QĐ' },
            { key: 'ApprovalDate', label: 'Ngày' },
            { key: 'ApprovalAgency', label: 'CQ phê duyệt' },
            { key: 'TotalInvestment', label: 'Tổng mức ĐT' },
        ],
    },

    // 6. Nhà thầu
    { stt: '6', label: 'Nhà thầu tham gia', type: 'heading', depth: 1, groups: ALL },
    {
        stt: '6.1', label: 'Nhà thầu lập Báo cáo NCKT / BCKTKT', type: 'data', depth: 2,
        projectKey: 'FeasibilityContractor', groups: ALL,
    },
    {
        stt: '6.2', label: 'Nhà thầu khảo sát xây dựng', type: 'data', depth: 2,
        projectKey: 'SurveyContractor', groups: ALL,
    },
    {
        stt: '6.3', label: 'Nhà thầu thẩm tra', type: 'data', depth: 2,
        projectKey: 'ReviewContractor', groups: ALL,
    },

    // 7. Nội dung chính
    { stt: '7', label: 'Nội dung chính QĐ phê duyệt dự án', type: 'heading', depth: 1, groups: ALL },
    {
        stt: '7.1', label: 'Loại công trình', type: 'data', depth: 2,
        projectKey: 'ConstructionType', groups: ALL,
    },
    {
        stt: '7.2', label: 'Cấp công trình', type: 'data', depth: 2,
        projectKey: 'ConstructionGrade', groups: ALL,
    },
    {
        stt: '7.3', label: 'Tổng mức đầu tư', type: 'data', depth: 2,
        projectKey: 'TotalInvestment', groups: ALL,
    },
    {
        stt: '7.4', label: 'Chi tiết tổng mức đầu tư', type: 'cost_breakdown', depth: 2,
        groups: ALL,
    },
    {
        stt: '7.5', label: 'Nguồn vốn đầu tư', type: 'data', depth: 2,
        projectKey: 'CapitalSource', groups: ALL,
    },
    {
        stt: '7.6', label: 'Thời gian thực hiện dự án', type: 'data', depth: 2,
        projectKey: 'Duration', groups: ALL,
    },
    {
        stt: '7.7', label: 'Hình thức quản lý dự án', type: 'data', depth: 2,
        projectKey: 'ManagementForm', groups: ALL,
    },

    // ═════════════════════════════════════════════════════════════
    //  PHẦN B — THIẾT KẾ XÂY DỰNG TRIỂN KHAI SAU THIẾT KẾ CƠ SỞ
    //  (Chỉ áp dụng Nhóm QN, A, B — Nhóm C dùng BCKTKT, TK 1 bước)
    // ═════════════════════════════════════════════════════════════

    // ─── PHẦN B.I — DỮ LIỆU CHUNG ───
    { stt: 'B', label: 'PHẦN B — THIẾT KẾ XÂY DỰNG TRIỂN KHAI', type: 'heading', depth: 0, groups: ABC_NOT_C },

    { stt: 'I', label: 'DỮ LIỆU CHUNG', type: 'heading', depth: 0, groups: ABC_NOT_C },
    {
        stt: '1', label: 'Liên kết mã số thông tin dự án', type: 'data', depth: 1,
        projectKey: 'ProjectID', groups: ABC_NOT_C,
    },
    {
        stt: '2', label: 'Tên công trình', type: 'data', depth: 1,
        projectKey: 'ProjectName', groups: ABC_NOT_C,
    },
    {
        stt: '3', label: 'Loại công trình', type: 'data', depth: 1,
        projectKey: 'ConstructionType', groups: ABC_NOT_C,
    },
    {
        stt: '4', label: 'Cấp công trình', type: 'data', depth: 1,
        projectKey: 'ConstructionGrade', groups: ABC_NOT_C,
    },
    {
        stt: '5', label: 'Địa điểm xây dựng', type: 'data', depth: 1,
        projectKey: 'LocationCode', groups: ABC_NOT_C,
    },
    {
        stt: '6', label: 'Quy mô công trình', type: 'data', depth: 1,
        projectKey: 'InvestmentScale', groups: ABC_NOT_C,
    },

    // ─── PHẦN B.II — DỮ LIỆU CHI TIẾT ───
    { stt: 'II', label: 'DỮ LIỆU CHI TIẾT', type: 'heading', depth: 0, groups: ABC_NOT_C },

    // 1. PCCC, MT ở cấp công trình
    { stt: '1', label: 'Thủ tục về PCCC, bảo vệ môi trường (cấp công trình)', type: 'heading', depth: 1, groups: ABC_NOT_C },
    {
        stt: '1.1', label: 'Kết quả thủ tục về PCCC (cấp công trình)', type: 'document', depth: 2,
        groups: ABC_NOT_C,
        extractPrompt: 'Trích xuất: Số văn bản PCCC, Ngày cấp, Cơ quan cấp ở cấp công trình',
        subFields: [
            { key: 'PCCCApprovalNumber', label: 'Số VB' },
            { key: 'PCCCApprovalDate', label: 'Ngày' },
            { key: 'PCCCApprovalAgency', label: 'CQ cấp' },
        ],
    },
    {
        stt: '1.2', label: 'Kết quả thủ tục bảo vệ môi trường (cấp công trình)', type: 'document', depth: 2,
        groups: ABC_NOT_C,
        extractPrompt: 'Trích xuất: Loại thủ tục MT, Số văn bản, Ngày cấp',
        subFields: [
            { key: 'EnvApprovalType', label: 'Loại' },
            { key: 'EnvApprovalNumber', label: 'Số VB' },
            { key: 'EnvApprovalDate', label: 'Ngày' },
        ],
    },

    // 2. Thẩm định thiết kế XD triển khai
    {
        stt: '2', label: 'Thông báo kết quả thẩm định thiết kế xây dựng triển khai', type: 'document', depth: 1,
        groups: ABC_NOT_C,
        templateFile: 'bao-cao-ket-qua-tham-tra-thiet-ke-xay-dung.md',
        templateLabel: 'BC thẩm tra TKXD',
        extractPrompt: 'Trích xuất: Số thông báo thẩm định, Ngày thẩm định, Cơ quan thẩm định thiết kế xây dựng',
        subFields: [
            { key: 'DesignAppraisalNumber', label: 'Số TB' },
            { key: 'DesignAppraisalDate', label: 'Ngày' },
        ],
    },

    // 3. QĐ phê duyệt TK
    {
        stt: '3', label: 'Quyết định phê duyệt thiết kế xây dựng triển khai', type: 'document', depth: 1,
        groups: ABC_NOT_C,
        templateFile: 'quyet-dinh-phe-duyet-thiet-ke-xay-dung.md',
        templateLabel: 'QĐ phê duyệt TK',
        extractPrompt: 'Trích xuất: Số quyết định phê duyệt thiết kế, Ngày phê duyệt, Cơ quan phê duyệt',
        subFields: [
            { key: 'DesignApprovalNumber', label: 'Số QĐ' },
            { key: 'DesignApprovalDate', label: 'Ngày' },
            { key: 'DesignApprovalAuthority', label: 'CQ phê duyệt' },
        ],
    },

    // 4. Nhà thầu thiết kế
    { stt: '4', label: 'Nhà thầu tham gia (giai đoạn thiết kế)', type: 'heading', depth: 1, groups: ABC_NOT_C },
    {
        stt: '4.1', label: 'Nhà thầu thiết kế xây dựng', type: 'data', depth: 2,
        projectKey: 'DesignContractor', groups: ABC_NOT_C,
    },
    {
        stt: '4.2', label: 'Nhà thầu thẩm tra thiết kế', type: 'data', depth: 2,
        projectKey: 'ReviewContractor', groups: ABC_NOT_C,
    },
];

// ══════════════════════════════════════════════════════════════
//  Helpers
// ══════════════════════════════════════════════════════════════

const getGroupLabel = (g: string) => {
    switch (g) {
        case ProjectGroup.QN: return 'Quan trọng QG';
        case ProjectGroup.A: return 'Nhóm A';
        case ProjectGroup.B: return 'Nhóm B';
        case ProjectGroup.C: return 'Nhóm C';
        default: return g;
    }
};

const formatCurrency = (n?: number) => {
    if (!n) return '—';
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)} tỷ đồng`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)} triệu đồng`;
    return n.toLocaleString('vi-VN') + ' đồng';
};

const formatDate = (d?: string) => {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString('vi-VN'); }
    catch { return d; }
};

/** Trích xuất dữ liệu từ file bằng Gemini */
const extractWithGemini = async (file: File, prompt: string, subFields: { key: string; label: string }[]): Promise<Record<string, string>> => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    if (!apiKey) throw new Error('Thiếu API key Gemini');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Convert file to base64
    const buffer = await file.arrayBuffer();
    const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    const fieldsList = subFields.map(f => `"${f.key}": "${f.label}"`).join(', ');

    const result = await model.generateContent([
        {
            inlineData: {
                mimeType: file.type || 'application/pdf',
                data: base64,
            },
        },
        {
            text: `Bạn là một chuyên gia pháp lý xây dựng Việt Nam. Hãy đọc văn bản đính kèm và ${prompt}.

Trả về KẾT QUẢ DƯỚI DẠNG JSON object với đúng các key sau: {${fieldsList}}.
Nếu không tìm thấy thông tin cho field nào, để giá trị là chuỗi rỗng "".
CHỈ TRẢ VỀ JSON, KHÔNG có markdown hay text khác.`,
        },
    ]);

    const text = result.response.text().trim();
    // Parse JSON from response (strip markdown code fences if present)
    const jsonStr = text.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '');
    try {
        return JSON.parse(jsonStr);
    } catch {
        console.error('AI parse error:', text);
        return {};
    }
};

// ══════════════════════════════════════════════════════════════
//  COST BREAKDOWN inline component
// ══════════════════════════════════════════════════════════════

const CostBreakdownDisplay: React.FC<{
    breakdown: CostBreakdown;
    editing: boolean;
    onChange: (cb: CostBreakdown) => void;
}> = ({ breakdown, editing, onChange }) => {
    const fields: { key: keyof CostBreakdown; label: string }[] = [
        { key: 'construction', label: 'Chi phí xây dựng' },
        { key: 'equipment', label: 'Chi phí thiết bị' },
        { key: 'management', label: 'Chi phí QLDA' },
        { key: 'consultancy', label: 'Chi phí TVXD' },
        { key: 'other', label: 'Chi phí khác' },
        { key: 'contingency', label: 'Dự phòng' },
    ];
    const total = Object.values(breakdown).reduce((s, v) => s + (v || 0), 0);

    return (
        <div className="space-y-2">
            {fields.map(f => (
                <div key={f.key} className="flex items-center gap-3 text-xs">
                    <span className="w-32 text-gray-500 dark:text-slate-400">{f.label}:</span>
                    {editing ? (
                        <input
                            type="number"
                            value={breakdown[f.key] || ''}
                            onChange={e => onChange({ ...breakdown, [f.key]: Number(e.target.value) || 0 })}
                            className="flex-1 px-2 py-1 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-200 text-xs"
                            placeholder="0"
                        />
                    ) : (
                        <span className="font-medium text-gray-800 dark:text-slate-200">{formatCurrency(breakdown[f.key])}</span>
                    )}
                </div>
            ))}
            <div className="pt-1 border-t border-gray-200 dark:border-slate-600 flex items-center gap-3 text-xs font-bold">
                <span className="w-32 text-gray-700 dark:text-slate-300">Tổng cộng:</span>
                <span className="text-blue-700 dark:text-blue-400">{formatCurrency(total)}</span>
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════════════════════════

export const ProjectComplianceTab: React.FC<ProjectComplianceTabProps> = ({ project, onUpdate }) => {
    const projectGroup = (project.GroupCode as ProjectGroup) || ProjectGroup.B;

    // Filter rows by project group
    const rows = useMemo(() =>
        TT24_ROWS.filter(r => r.groups.includes(projectGroup)),
        [projectGroup]);

    // Upload states
    const [uploads, setUploads] = useState<Record<string, UploadState>>({});
    const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    // Editing state for data fields
    const [editingData, setEditingData] = useState(false);
    const [dataEdits, setDataEdits] = useState<Partial<Project>>({});
    const [costBreakdown, setCostBreakdown] = useState<CostBreakdown>(project.CostBreakdown || {});
    const [saving, setSaving] = useState(false);

    // Expand sections
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['I', 'II', 'B']));

    const toggleSection = (stt: string) => {
        setExpandedSections(prev => {
            const next = new Set(prev);
            if (next.has(stt)) next.delete(stt);
            else next.add(stt);
            return next;
        });
    };

    // Calculate completion
    const completionPct = useMemo(() => {
        const docRows = rows.filter(r => r.type === 'document');
        const dataRows = rows.filter(r => r.type === 'data' && r.projectKey);
        const total = docRows.length + dataRows.length;
        if (total === 0) return 100;

        let filled = 0;
        dataRows.forEach(r => {
            const v = project[r.projectKey!];
            if (v !== undefined && v !== '' && v !== null && v !== 0) filled++;
        });
        docRows.forEach(r => {
            const key = `doc_${r.stt}_${r.label}`;
            if (uploads[key]?.status === 'done') filled++;
        });
        return Math.round((filled / total) * 100);
    }, [rows, project, uploads]);

    // Get data value
    const getDataValue = useCallback((key: keyof Project): any => {
        if (key in dataEdits) return dataEdits[key];
        return project[key] ?? '';
    }, [project, dataEdits]);

    // Handle file upload
    const handleFileSelect = async (row: TT24Row, file: File) => {
        const key = `doc_${row.stt}_${row.label}`;
        setUploads(prev => ({ ...prev, [key]: { file, fileName: file.name, status: 'extracting' } }));

        // Upload file to Supabase Storage and save to documents table
        try {
            const ext = file.name.split('.').pop();
            const storagePath = `${project.ProjectID}/tt24/${row.stt}_${Date.now()}.${ext}`;
            const { error: uploadErr } = await supabase.storage
                .from('task-attachments')
                .upload(storagePath, file);
            if (!uploadErr) {
                const { data: urlData } = supabase.storage
                    .from('task-attachments')
                    .getPublicUrl(storagePath);
                await (supabase.from('documents') as any).insert({
                    project_id: project.ProjectID,
                    doc_name: `[TT24] ${row.label} - ${file.name}`,
                    storage_path: urlData.publicUrl,
                    size: `${(file.size / 1024).toFixed(0)} KB`,
                    category: row.stt ? parseInt(row.stt.split('.')[0]) || 0 : 0,
                    source: 'tt24',
                    tt24_field: key,
                    is_digitized: true,
                });
            }
        } catch (storageErr) {
            console.warn('TT24 file storage failed (non-critical):', storageErr);
        }

        if (row.extractPrompt && row.subFields) {
            try {
                const extracted = await extractWithGemini(file, row.extractPrompt, row.subFields as { key: string; label: string }[]);
                setUploads(prev => ({
                    ...prev,
                    [key]: { file, fileName: file.name, status: 'done', extractedData: extracted },
                }));

                // Auto-save extracted data to project
                const projectUpdate: Record<string, any> = {};
                for (const [fieldKey, value] of Object.entries(extracted)) {
                    if (value && fieldKey in project) {
                        projectUpdate[fieldKey] = value;
                    }
                }
                if (Object.keys(projectUpdate).length > 0) {
                    await ProjectService.update(project.ProjectID, projectUpdate as Partial<Project>);
                    onUpdate(projectUpdate as Partial<Project>);
                }
            } catch (err) {
                console.error('Extract error:', err);
                setUploads(prev => ({
                    ...prev,
                    [key]: { file, fileName: file.name, status: 'error', errorMsg: 'Lỗi trích xuất, vui lòng nhập thủ công.' },
                }));
            }
        } else {
            setUploads(prev => ({ ...prev, [key]: { file, fileName: file.name, status: 'done' } }));
        }
    };

    // Save data edits
    const handleSaveData = async () => {
        setSaving(true);
        try {
            const toSave: Partial<Project> = { ...dataEdits, CostBreakdown: costBreakdown };
            await ProjectService.update(project.ProjectID, toSave);
            onUpdate(toSave);
            setEditingData(false);
            setDataEdits({});
        } catch (err) {
            console.error('Save error:', err);
            alert('Lỗi khi lưu dữ liệu');
        } finally {
            setSaving(false);
        }
    };

    const removeUpload = (key: string) => {
        setUploads(prev => {
            const next = { ...prev };
            delete next[key];
            return next;
        });
    };

    // ── Render helpers ──

    const renderStatusBadge = (status: UploadState['status']) => {
        switch (status) {
            case 'done':
                return <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full"><CheckCircle2 className="w-3 h-3" />Đã có</span>;
            case 'extracting':
                return <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full"><RefreshCw className="w-3 h-3 animate-spin" />Trích xuất...</span>;
            case 'error':
                return <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full"><AlertCircle className="w-3 h-3" />Lỗi</span>;
            default:
                return <span className="inline-flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500 px-2 py-0.5"><Clock className="w-3 h-3" />Chưa có</span>;
        }
    };

    const renderDataValue = (row: TT24Row) => {
        if (!row.projectKey) return null;
        const val = getDataValue(row.projectKey);

        if (editingData) {
            if (row.projectKey === 'ConstructionType') {
                return (
                    <select value={String(val)} onChange={e => setDataEdits(prev => ({ ...prev, [row.projectKey!]: e.target.value }))}
                        className="w-full px-2 py-1.5 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs text-gray-900 dark:text-slate-200">
                        <option value="">— Chọn —</option>
                        <option value="Dân dụng">Dân dụng</option>
                        <option value="Công nghiệp">Công nghiệp</option>
                        <option value="Giao thông">Giao thông</option>
                        <option value="Hạ tầng kỹ thuật">Hạ tầng kỹ thuật</option>
                        <option value="Nông nghiệp & PTNT">Nông nghiệp & PTNT</option>
                    </select>
                );
            }
            if (row.projectKey === 'ConstructionGrade') {
                return (
                    <select value={String(val)} onChange={e => setDataEdits(prev => ({ ...prev, [row.projectKey!]: e.target.value }))}
                        className="w-full px-2 py-1.5 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs text-gray-900 dark:text-slate-200">
                        <option value="">— Chọn —</option>
                        <option value="Đặc biệt">Đặc biệt</option>
                        <option value="I">Cấp I</option>
                        <option value="II">Cấp II</option>
                        <option value="III">Cấp III</option>
                        <option value="IV">Cấp IV</option>
                    </select>
                );
            }
            if (row.projectKey === 'ManagementForm') {
                return (
                    <select value={String(val)} onChange={e => setDataEdits(prev => ({ ...prev, [row.projectKey!]: e.target.value }))}
                        className="w-full px-2 py-1.5 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs text-gray-900 dark:text-slate-200">
                        <option value="">— Chọn —</option>
                        <option value="Ban QLDA chuyên ngành">Ban QLDA chuyên ngành</option>
                        <option value="Ban QLDA khu vực">Ban QLDA khu vực</option>
                        <option value="CĐT trực tiếp quản lý">CĐT trực tiếp quản lý</option>
                        <option value="Tư vấn QLDA">Thuê Tư vấn QLDA</option>
                    </select>
                );
            }
            if (row.projectKey === 'TotalInvestment') {
                return (
                    <input type="number" value={val || ''} onChange={e => setDataEdits(prev => ({ ...prev, [row.projectKey!]: Number(e.target.value) }))}
                        className="w-full px-2 py-1.5 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs text-gray-900 dark:text-slate-200" placeholder="VNĐ" />
                );
            }
            return (
                <input type="text" value={String(val)} onChange={e => setDataEdits(prev => ({ ...prev, [row.projectKey!]: e.target.value }))}
                    className="w-full px-2 py-1.5 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs text-gray-900 dark:text-slate-200" />
            );
        }

        // Display mode
        if (row.projectKey === 'TotalInvestment') {
            return <span className="text-xs font-semibold text-gray-800 dark:text-slate-200">{formatCurrency(Number(val)) || '—'}</span>;
        }
        if (row.projectKey === 'GroupCode') {
            return <span className="text-xs font-semibold text-gray-800 dark:text-slate-200">{getGroupLabel(String(val))}</span>;
        }
        return <span className={`text-xs ${val ? 'font-medium text-gray-800 dark:text-slate-200' : 'text-gray-300 dark:text-slate-600 italic'}`}>{String(val) || '— chưa có —'}</span>;
    };

    const renderDocRow = (row: TT24Row) => {
        const key = `doc_${row.stt}_${row.label}`;
        const upload = uploads[key] || { status: 'empty' as const };

        return (
            <div className="space-y-2">
                {/* Upload area */}
                <div className="flex items-center gap-2 flex-wrap">
                    {upload.status === 'empty' ? (
                        <button
                            onClick={() => fileInputRefs.current[key]?.click()}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 transition-all"
                        >
                            <Upload className="w-3.5 h-3.5" /> Upload VB ký số
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg px-3 py-1.5">
                            <FileCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                            <span className="text-xs text-gray-700 dark:text-slate-300 truncate max-w-[200px]">{upload.fileName}</span>
                            {renderStatusBadge(upload.status)}
                            <button onClick={() => removeUpload(key)} className="ml-1 text-gray-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                        </div>
                    )}
                    <input
                        ref={el => { fileInputRefs.current[key] = el; }}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={e => {
                            const f = e.target.files?.[0];
                            if (f) handleFileSelect(row, f);
                            e.target.value = '';
                        }}
                    />
                </div>

                {/* Extracted data */}
                {upload.extractedData && Object.entries(upload.extractedData).length > 0 && (
                    <div className="ml-1 pl-3 border-l-2 border-emerald-300 dark:border-emerald-600 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">Dữ liệu trích xuất tự động</span>
                        {row.subFields?.map(sf => (
                            <div key={sf.key} className="flex items-center gap-2 text-xs">
                                <span className="text-gray-500 dark:text-slate-400 w-20 flex-shrink-0">{sf.label}:</span>
                                <span className="font-medium text-gray-800 dark:text-slate-200">{upload.extractedData?.[sf.key] || '—'}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Error message */}
                {upload.errorMsg && (
                    <p className="text-xs text-red-500 ml-1">{upload.errorMsg}</p>
                )}

                {/* Auto-fill from project data when no upload */}
                {upload.status === 'empty' && row.subFields && (
                    <div className="ml-1 pl-3 border-l-2 border-gray-200 dark:border-slate-600 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-gray-400 dark:text-slate-500 tracking-wider">Dữ liệu từ hệ thống</span>
                        {row.subFields.map(sf => {
                            const v = (project as any)[sf.key];
                            const displayVal = sf.label.includes('Ngày') ? formatDate(v) : (sf.key === 'TotalInvestment' ? formatCurrency(Number(v)) : String(v || ''));
                            return (
                                <div key={sf.key} className="flex items-center gap-2 text-xs">
                                    <span className="text-gray-500 dark:text-slate-400 w-20 flex-shrink-0">{sf.label}:</span>
                                    <span className={`${displayVal ? 'font-medium text-gray-600 dark:text-slate-300' : 'text-gray-300 dark:text-slate-600 italic'}`}>
                                        {displayVal || '— chưa có —'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    // ── Main render ──

    // Group rows by heading
    let currentSection = '';

    return (
        <div className="animate-in slide-in-from-bottom-2 duration-500 space-y-5 py-4">

            {/* ── Header ── */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white shadow-lg">
                <div className="flex items-start justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                            <Database className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-base font-black tracking-wide">
                                TT24/2025/TT-BXD — Phụ lục III, Bảng số 01
                            </h2>
                            <p className="text-blue-200 text-xs mt-0.5">
                                Phần A + B — Dữ liệu dự án & thiết kế xây dựng • {getGroupLabel(projectGroup)}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {!editingData ? (
                            <button onClick={() => setEditingData(true)}
                                className="px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all">
                                <Pencil className="w-3.5 h-3.5" /> Chỉnh sửa dữ liệu
                            </button>
                        ) : (
                            <>
                                <button onClick={() => { setEditingData(false); setDataEdits({}); }}
                                    className="px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur rounded-xl text-xs font-bold transition-all">
                                    Hủy
                                </button>
                                <button onClick={handleSaveData} disabled={saving}
                                    className="px-4 py-2 bg-white text-blue-700 hover:bg-blue-50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50">
                                    {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                    {saving ? 'Lưu...' : 'Lưu thay đổi'}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Progress */}
                <div className="mt-4">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-blue-200">Hoàn thành dữ liệu</span>
                        <span className="text-sm font-black">{completionPct}%</span>
                    </div>
                    <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${completionPct >= 80 ? 'bg-emerald-400' : completionPct >= 50 ? 'bg-amber-400' : 'bg-red-400'
                            }`} style={{ width: `${completionPct}%` }} />
                    </div>
                </div>
            </div>

            {/* ── Table ── */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">

                {/* Table Header */}
                <div className="grid grid-cols-[56px_1fr_130px_1fr] gap-0 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-600 text-xs font-bold text-gray-600 dark:text-slate-300 uppercase tracking-wider">
                    <div className="px-3 py-3 text-center">STT</div>
                    <div className="px-3 py-3 border-l border-gray-200 dark:border-slate-600">Nội dung dữ liệu</div>
                    <div className="px-3 py-3 border-l border-gray-200 dark:border-slate-600 text-center">Biểu mẫu / Upload</div>
                    <div className="px-3 py-3 border-l border-gray-200 dark:border-slate-600">Giá trị / Dữ liệu trích xuất</div>
                </div>

                {/* Table Body */}
                {rows.map((row, idx) => {
                    const isHeading = row.type === 'heading';
                    const isMainHeading = row.depth === 0;
                    const key = `row_${row.stt}_${idx}`;
                    const docKey = `doc_${row.stt}_${row.label}`;
                    const upload = uploads[docKey];

                    if (isMainHeading) {
                        currentSection = row.stt;
                    }

                    // Check if section is collapsed
                    if (!isMainHeading && row.depth === 0) {
                        // skip
                    }

                    return (
                        <div
                            key={key}
                            className={`grid grid-cols-[56px_1fr_130px_1fr] gap-0 border-b border-gray-100 dark:border-slate-700 transition-colors ${isMainHeading
                                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-700 cursor-pointer hover:from-blue-100 hover:to-indigo-100 dark:hover:from-slate-600 dark:hover:to-slate-600'
                                : isHeading
                                    ? 'bg-gray-50/50 dark:bg-slate-750'
                                    : 'hover:bg-gray-50 dark:hover:bg-slate-750'
                                }`}
                            onClick={isMainHeading ? () => toggleSection(row.stt) : undefined}
                        >
                            {/* STT */}
                            <div className={`px-3 py-3 text-center text-xs ${isMainHeading ? 'font-black text-blue-700 dark:text-blue-400' :
                                isHeading ? 'font-bold text-gray-600 dark:text-slate-300' :
                                    'text-gray-500 dark:text-slate-400'
                                }`} style={{ paddingLeft: `${8 + row.depth * 12}px` }}>
                                {isMainHeading && (
                                    expandedSections.has(row.stt) ? <ChevronUp className="w-3.5 h-3.5 inline mr-1" /> : <ChevronDown className="w-3.5 h-3.5 inline mr-1" />
                                )}
                                {row.stt}
                            </div>

                            {/* Label */}
                            <div className={`px-3 py-3 border-l border-gray-100 dark:border-slate-700 text-xs ${isMainHeading ? 'font-black text-blue-800 dark:text-blue-300 tracking-wider' :
                                isHeading ? 'font-bold text-gray-700 dark:text-slate-200' :
                                    'text-gray-700 dark:text-slate-300'
                                }`} style={{ paddingLeft: `${12 + row.depth * 16}px` }}>
                                {row.label}
                                {row.type === 'document' && !upload && (
                                    <span className="ml-2 inline-flex items-center gap-0.5 text-[10px] text-amber-500">
                                        <AlertCircle className="w-2.5 h-2.5" /> Cần upload
                                    </span>
                                )}
                            </div>

                            {/* Biểu mẫu / Upload */}
                            <div className="px-3 py-3 border-l border-gray-100 dark:border-slate-700 text-center">
                                {isMainHeading || isHeading ? null : row.type === 'document' ? (
                                    <div className="flex flex-col items-center gap-1">
                                        {row.templateFile && (
                                            <a href={`/templates/${row.templateFile}`} target="_blank" rel="noopener"
                                                className="inline-flex items-center gap-1 text-[10px] text-violet-600 dark:text-violet-400 hover:underline">
                                                <Download className="w-3 h-3" />{row.templateLabel || 'Biểu mẫu'}
                                            </a>
                                        )}
                                        {renderStatusBadge(upload?.status || 'empty')}
                                    </div>
                                ) : null}
                            </div>

                            {/* Value / Extracted Data */}
                            <div className="px-3 py-3 border-l border-gray-100 dark:border-slate-700">
                                {isMainHeading || isHeading ? null :
                                    row.type === 'data' ? renderDataValue(row) :
                                        row.type === 'cost_breakdown' ? (
                                            <CostBreakdownDisplay
                                                breakdown={costBreakdown}
                                                editing={editingData}
                                                onChange={setCostBreakdown}
                                            />
                                        ) :
                                            row.type === 'document' ? renderDocRow(row) :
                                                null
                                }
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Footer Note ── */}
            <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
                <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                    <strong>Ghi chú:</strong> Khi upload văn bản ký số (PDF/ảnh), hệ thống sử dụng AI để tự động trích xuất dữ liệu.
                    Các dữ liệu không có trong văn bản sẽ tự động lấy từ thông tin dự án đã nhập.
                    Danh sách hiển thị theo <strong>{getGroupLabel(projectGroup)}</strong> — đúng theo TT24/2025/TT-BXD Phụ lục III, Bảng số 01.
                </p>
            </div>
        </div>
    );
};

export default ProjectComplianceTab;
