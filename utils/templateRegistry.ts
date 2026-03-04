/**
 * Template Registry
 * =================
 * Maps 55 templates to their data context, auto-fill fields, and category.
 * Each template knows what project data it needs and how to fill placeholders.
 */

import { Project, BiddingPackage, Contract, Payment } from '@/types';

// ========================================
// TYPES
// ========================================

export type TemplateCategory =
    | 'preparation'   // Chuẩn bị DA (Mẫu 01-06)
    | 'appraisal'     // Thẩm định, phê duyệt
    | 'bidding'       // Đấu thầu (Mẫu 07-09, 46-65)
    | 'permit'        // Giấy phép XD (PL-II)
    | 'construction'  // Thi công (Mẫu 16-20)
    | 'payment'       // Thanh toán (Mẫu 21-31)
    | 'settlement'    // Quyết toán (Mẫu 32-41)
    | 'contract';     // Hợp đồng (Mẫu 42-45)

export type DataContextKey = 'project' | 'contract' | 'payment' | 'contractor' | 'package';

export interface TemplateField {
    key: string;
    label: string;
    type: 'text' | 'date' | 'number' | 'select' | 'textarea';
    required?: boolean;
    placeholder?: string;
    options?: string[];                              // For select type
    autoFillFrom?: (ctx: ExportDataContext) => string; // Auto-fill function
}

export interface ExportDataContext {
    project?: Project | null;
    contract?: Contract | null;
    payment?: Payment | null;
    packages?: BiddingPackage[];
    signerName?: string;
    signerTitle?: string;
    documentNumber?: string;
    documentDate?: string;
    recipientAuthority?: string;
    issuingAuthority?: string;
    locationName?: string;
}

export interface TemplateConfig {
    templatePath: string;
    label: string;
    shortLabel: string;
    category: TemplateCategory;
    dataContext: DataContextKey[];
    fields: TemplateField[];
    legalBasis?: string;
    description?: string;
    icon?: string; // emoji
}

// ========================================
// COMMON AUTO-FILL FUNCTIONS
// ========================================

const autoProject = {
    name: (ctx: ExportDataContext) => ctx.project?.ProjectName || '',
    id: (ctx: ExportDataContext) => ctx.project?.ProjectID || '',
    group: (ctx: ExportDataContext) => ctx.project?.GroupCode || '',
    totalInvestment: (ctx: ExportDataContext) =>
        ctx.project?.TotalInvestment ? ctx.project.TotalInvestment.toLocaleString('vi-VN') : '',
    capitalSource: (ctx: ExportDataContext) => {
        const raw = (ctx.project?.CapitalSource || '').trim();
        // Normalize: match against common options
        if (!raw) return 'Ngân sách Nhà nước';
        if (raw.includes('Trung ương')) return 'Ngân sách Trung ương';
        if (raw.includes('địa phương')) return 'Ngân sách địa phương';
        if (raw.includes('ODA')) return 'Vốn ODA';
        if (raw.includes('vay') || raw.includes('ưu đãi')) return 'Vốn vay ưu đãi';
        if (raw.includes('hỗn hợp')) return 'Vốn hỗn hợp';
        return 'Ngân sách Nhà nước';
    },
    investorName: (ctx: ExportDataContext) => ctx.project?.InvestorName || '',
    decisionNumber: (ctx: ExportDataContext) => ctx.project?.DecisionNumber || '',
    decisionDate: (ctx: ExportDataContext) => ctx.project?.DecisionDate || '',
    decisionAuthority: (ctx: ExportDataContext) => ctx.project?.DecisionAuthority || '',
    duration: (ctx: ExportDataContext) => ctx.project?.Duration || '',
    objective: (ctx: ExportDataContext) => ctx.project?.Objective || '',
    location: (ctx: ExportDataContext) => ctx.project?.LocationCode || '',
    constructionType: (ctx: ExportDataContext) => ctx.project?.ConstructionType || '',
    constructionGrade: (ctx: ExportDataContext) => ctx.project?.ConstructionGrade || '',
    managementForm: (ctx: ExportDataContext) => ctx.project?.ManagementForm || '',
};

const autoSigner = {
    name: (ctx: ExportDataContext) => ctx.signerName || '',
    title: (ctx: ExportDataContext) => ctx.signerTitle || '',
    authority: (ctx: ExportDataContext) => ctx.issuingAuthority || ctx.project?.DecisionAuthority || '',
};

// ========================================
// COMMON FIELD DEFINITIONS
// ========================================

const projectInfoFields: TemplateField[] = [
    { key: 'projectName', label: 'Tên dự án', type: 'text', required: true, autoFillFrom: autoProject.name },
    { key: 'projectGroup', label: 'Nhóm dự án', type: 'select', options: ['A', 'B', 'C', 'QN'], autoFillFrom: autoProject.group },
    { key: 'totalInvestment', label: 'Tổng mức đầu tư (VNĐ)', type: 'text', autoFillFrom: autoProject.totalInvestment },
    { key: 'capitalSource', label: 'Nguồn vốn', type: 'select', autoFillFrom: autoProject.capitalSource, options: ['Ngân sách Nhà nước', 'Ngân sách Trung ương', 'Ngân sách địa phương', 'Vốn ODA', 'Vốn vay ưu đãi', 'Vốn hỗn hợp'] },
    { key: 'investorName', label: 'Chủ đầu tư', type: 'text', autoFillFrom: autoProject.investorName },
    { key: 'location', label: 'Địa điểm xây dựng', type: 'text', autoFillFrom: autoProject.location },
];

const decisionFields: TemplateField[] = [
    { key: 'decisionNumber', label: 'Số QĐ phê duyệt', type: 'text', autoFillFrom: autoProject.decisionNumber },
    { key: 'decisionDate', label: 'Ngày phê duyệt', type: 'date', autoFillFrom: autoProject.decisionDate },
    { key: 'decisionAuthority', label: 'Cơ quan ban hành', type: 'text', autoFillFrom: autoProject.decisionAuthority },
];

const signerFields: TemplateField[] = [
    { key: 'signerName', label: 'Họ tên người ký', type: 'text', autoFillFrom: autoSigner.name },
    { key: 'signerTitle', label: 'Chức danh', type: 'select', autoFillFrom: autoSigner.title, options: ['GIÁM ĐỐC', 'KT. GIÁM ĐỐC / PHÓ GIÁM ĐỐC', 'CHỦ TỊCH', 'KT. CHỦ TỊCH / PHÓ CHỦ TỊCH'] },
    { key: 'issuingAuthority', label: 'Cơ quan ban hành', type: 'text', autoFillFrom: autoSigner.authority },
];

const documentFields: TemplateField[] = [
    { key: 'documentNumber', label: 'Số văn bản', type: 'text', placeholder: '…/…-…' },
    { key: 'documentDate', label: 'Ngày văn bản', type: 'date' },
    { key: 'recipientAuthority', label: 'Kính gửi', type: 'text' },
];

// ========================================
// TEMPLATE REGISTRY
// ========================================

export const TEMPLATE_REGISTRY: Record<string, TemplateConfig> = {
    // ═══════════════════════════════════
    // CHUẨN BỊ DỰ ÁN (Mẫu 01-06)
    // ═══════════════════════════════════

    'mau-01-to-trinh-tham-dinh-bc-nctkt.md': {
        templatePath: 'mau-01-to-trinh-tham-dinh-bc-nctkt.md',
        label: 'Tờ trình thẩm định BC nghiên cứu tiền khả thi',
        shortLabel: 'Mẫu 01 – Tờ trình TĐ BCNCTKT',
        category: 'preparation',
        dataContext: ['project'],
        icon: '📋',
        legalBasis: 'Mẫu số 05 - Phụ lục 2, NĐ 40/2020',
        fields: [...projectInfoFields, ...documentFields, ...signerFields],
    },

    'mau-02-bc-nctkt-du-an-nhom-a.md': {
        templatePath: 'mau-02-bc-nctkt-du-an-nhom-a.md',
        label: 'BC nghiên cứu tiền khả thi dự án nhóm A',
        shortLabel: 'Mẫu 02 – BC NCTKT nhóm A',
        category: 'preparation',
        dataContext: ['project'],
        icon: '📊',
        fields: [...projectInfoFields],
    },

    'mau-03-bc-de-xuat-chu-truong-dt.md': {
        templatePath: 'mau-03-bc-de-xuat-chu-truong-dt.md',
        label: 'BC đề xuất chủ trương đầu tư (Nhóm B, C)',
        shortLabel: 'Mẫu 04 – BC ĐX CTĐT',
        category: 'preparation',
        dataContext: ['project'],
        icon: '📑',
        legalBasis: 'Mẫu số 04, Phụ lục 2 Luật ĐTC 58/2024',
        description: 'Báo cáo đề xuất chủ trương đầu tư dự án nhóm B, nhóm C theo Điều 34-35 Luật ĐTC 58/2024',
        fields: [
            // === Thông tin văn bản ===
            { key: 'tenCoQuan', label: 'Tên cơ quan lập', type: 'text', required: true, autoFillFrom: autoProject.investorName, placeholder: 'Ban QLDA ĐTXD chuyên ngành' },
            { key: 'documentNumber', label: 'Số văn bản', type: 'text', placeholder: '…/BC-BQLDA' },
            { key: 'documentDate', label: 'Ngày văn bản', type: 'date' },
            { key: 'locationName', label: 'Nơi lập', type: 'text', placeholder: 'Hà Nội' },
            { key: 'kinhGui', label: 'Kính gửi (cơ quan QĐ CTĐT)', type: 'text', required: true, autoFillFrom: autoProject.decisionAuthority, placeholder: 'Giám đốc Học viện CTQG HCM' },
            // === Phần I: Thông tin chung ===
            { key: 'projectName', label: 'Tên dự án', type: 'text', required: true, autoFillFrom: autoProject.name },
            { key: 'projectGroup', label: 'Nhóm dự án (B/C)', type: 'select', options: ['B', 'C'], autoFillFrom: autoProject.group },
            { key: 'capQuyetDinh', label: 'Cấp QĐ đầu tư', type: 'text', autoFillFrom: autoProject.decisionAuthority, placeholder: 'Giám đốc Học viện CTQG HCM' },
            { key: 'investorName', label: 'Chủ đầu tư', type: 'text', autoFillFrom: autoProject.investorName },
            { key: 'location', label: 'Địa điểm thực hiện', type: 'text', autoFillFrom: autoProject.location },
            { key: 'totalInvestment', label: 'Tổng mức đầu tư (VNĐ)', type: 'text', autoFillFrom: autoProject.totalInvestment },
            { key: 'capitalSource', label: 'Nguồn vốn', type: 'select', autoFillFrom: autoProject.capitalSource, options: ['Ngân sách Nhà nước', 'Ngân sách Trung ương', 'Ngân sách địa phương', 'Vốn ODA', 'Vốn hỗn hợp'] },
            { key: 'duration', label: 'Thời gian thực hiện', type: 'text', autoFillFrom: autoProject.duration },
            // === Phần II: Nội dung chủ yếu (Điều 35) ===
            { key: 'suCanThiet', label: 'Sự cần thiết đầu tư', type: 'textarea', autoFillFrom: autoProject.objective },
            { key: 'mucTieu', label: 'Mục tiêu đầu tư', type: 'textarea' },
            { key: 'quyMo', label: 'Quy mô đầu tư', type: 'textarea' },
            // === Người ký ===
            ...signerFields,
        ],
    },

    'mau-04-bc-ket-qua-tham-dinh-chu-truong.md': {
        templatePath: 'mau-04-bc-ket-qua-tham-dinh-chu-truong.md',
        label: 'BC kết quả thẩm định chủ trương',
        shortLabel: 'Mẫu 04 – BC KQTĐ CT',
        category: 'appraisal',
        dataContext: ['project'],
        icon: '🔍',
        fields: [...projectInfoFields, ...signerFields],
    },

    'mau-05-to-trinh-qd-chu-truong-dt.md': {
        templatePath: 'mau-05-to-trinh-qd-chu-truong-dt.md',
        label: 'Tờ trình QĐ chủ trương đầu tư',
        shortLabel: 'Mẫu 05 – Tờ trình QĐ CTĐT',
        category: 'preparation',
        dataContext: ['project'],
        icon: '📋',
        legalBasis: 'K2 Đ25,27,28 Luật ĐTC 58',
        fields: [...projectInfoFields, ...documentFields, ...signerFields],
    },

    'mau-06-nghi-quyet-chu-truong-dt.md': {
        templatePath: 'mau-06-nghi-quyet-chu-truong-dt.md',
        label: 'Nghị quyết chủ trương đầu tư',
        shortLabel: 'Mẫu 06 – NQ CTĐT',
        category: 'preparation',
        dataContext: ['project'],
        icon: '📜',
        legalBasis: 'K2 Đ25,27,28 Luật ĐTC 58',
        fields: [...projectInfoFields, ...signerFields],
    },

    // ═══════════════════════════════════
    // ĐẤU THẦU (Mẫu 07-09)
    // ═══════════════════════════════════

    'mau-07-van-ban-trinh-duyet-khlcnt.md': {
        templatePath: 'mau-07-van-ban-trinh-duyet-khlcnt.md',
        label: 'Văn bản trình duyệt KHLCNT',
        shortLabel: 'Mẫu 07 – VB trình KHLCNT',
        category: 'bidding',
        dataContext: ['project', 'package'],
        icon: '📝',
        legalBasis: 'TT 22/2024/TT-BKHĐT',
        fields: [...projectInfoFields, ...documentFields, ...signerFields],
    },

    'mau-08-bc-tham-dinh-khlcnt.md': {
        templatePath: 'mau-08-bc-tham-dinh-khlcnt.md',
        label: 'BC thẩm định KHLCNT',
        shortLabel: 'Mẫu 08 – BC TĐ KHLCNT',
        category: 'bidding',
        dataContext: ['project', 'package'],
        icon: '🔍',
        legalBasis: 'K3 Đ45 Luật ĐT 2023',
        fields: [...projectInfoFields, ...signerFields],
    },

    'mau-09-qd-phe-duyet-khlcnt.md': {
        templatePath: 'mau-09-qd-phe-duyet-khlcnt.md',
        label: 'QĐ phê duyệt KHLCNT',
        shortLabel: 'Mẫu 09 – QĐ PD KHLCNT',
        category: 'bidding',
        dataContext: ['project', 'package'],
        icon: '📜',
        legalBasis: 'Đ40 Luật ĐT 2023',
        fields: [...projectInfoFields, ...decisionFields, ...signerFields],
    },

    // ═══════════════════════════════════
    // THI CÔNG (Mẫu 16-20)
    // ═══════════════════════════════════

    'mau-16-thong-bao-khoi-cong.md': {
        templatePath: 'mau-16-thong-bao-khoi-cong.md',
        label: 'Thông báo khởi công xây dựng',
        shortLabel: 'Mẫu 16 – TB khởi công',
        category: 'construction',
        dataContext: ['project', 'contractor'],
        icon: '🏗️',
        legalBasis: 'Phụ lục V, NĐ 06/2021',
        fields: [
            ...projectInfoFields,
            { key: 'constructionPermit', label: 'Số GPXD', type: 'text' },
            { key: 'contractorName', label: 'Nhà thầu thi công', type: 'text', autoFillFrom: (ctx) => ctx.project?.MainContractorName || '' },
            { key: 'supervisorName', label: 'Tổ chức giám sát', type: 'text' },
            { key: 'designerName', label: 'Tổ chức thiết kế', type: 'text' },
            { key: 'startDate', label: 'Ngày khởi công', type: 'date' },
            { key: 'expectedEndDate', label: 'Dự kiến hoàn thành', type: 'date' },
            ...documentFields,
        ],
    },

    'mau-17-bc-dinh-ky-giam-sat-thi-cong.md': {
        templatePath: 'mau-17-bc-dinh-ky-giam-sat-thi-cong.md',
        label: 'BC định kỳ giám sát thi công',
        shortLabel: 'Mẫu 17 – BC GS thi công',
        category: 'construction',
        dataContext: ['project'],
        icon: '📊',
        legalBasis: 'K1 Đ120 Luật XD; K1 Đ19 NĐ 06',
        fields: [...projectInfoFields, ...documentFields],
    },

    'mau-18-bc-hoan-thanh-giam-sat-thi-cong.md': {
        templatePath: 'mau-18-bc-hoan-thanh-giam-sat-thi-cong.md',
        label: 'BC hoàn thành giám sát thi công',
        shortLabel: 'Mẫu 18 – BC HT GS',
        category: 'construction',
        dataContext: ['project'],
        icon: '✅',
        fields: [...projectInfoFields, ...documentFields],
    },

    'mau-19-ho-so-de-nghi-kiem-tra-nghiem-thu.md': {
        templatePath: 'mau-19-ho-so-de-nghi-kiem-tra-nghiem-thu.md',
        label: 'Hồ sơ đề nghị kiểm tra nghiệm thu',
        shortLabel: 'Mẫu 19 – HS KT nghiệm thu',
        category: 'construction',
        dataContext: ['project', 'contractor'],
        icon: '📂',
        fields: [...projectInfoFields, ...documentFields],
    },

    'mau-20-thong-bao-kq-kiem-tra-nghiem-thu.md': {
        templatePath: 'mau-20-thong-bao-kq-kiem-tra-nghiem-thu.md',
        label: 'Thông báo KQ kiểm tra nghiệm thu',
        shortLabel: 'Mẫu 20 – TB KQ KT NT',
        category: 'construction',
        dataContext: ['project'],
        icon: '📢',
        legalBasis: 'Đ123 Luật XD; Đ24 NĐ 06; Đ123 NĐ 175',
        fields: [...projectInfoFields, ...signerFields, ...documentFields],
    },

    // ═══════════════════════════════════
    // THANH TOÁN (Mẫu 21-31)
    // ═══════════════════════════════════

    'mau-21-giay-dk-su-dung-tk-mau-dau.md': {
        templatePath: 'mau-21-giay-dk-su-dung-tk-mau-dau.md',
        label: 'Giấy ĐK sử dụng tài khoản, mẫu dấu',
        shortLabel: 'Mẫu 21 – ĐK tài khoản',
        category: 'payment',
        dataContext: ['project'],
        icon: '🏦',
        fields: [...projectInfoFields.slice(0, 3), ...signerFields],
    },

    'mau-23-giay-de-nghi-cam-ket-chi-nsnn.md': {
        templatePath: 'mau-23-giay-de-nghi-cam-ket-chi-nsnn.md',
        label: 'Giấy đề nghị cam kết chi NSNN',
        shortLabel: 'Mẫu 23 – ĐN cam kết chi',
        category: 'payment',
        dataContext: ['project'],
        icon: '💰',
        fields: [...projectInfoFields, ...documentFields],
    },

    'mau-25-giay-de-nghi-thanh-toan-von.md': {
        templatePath: 'mau-25-giay-de-nghi-thanh-toan-von.md',
        label: 'Giấy đề nghị thanh toán vốn đầu tư',
        shortLabel: 'Mẫu 25 – ĐN thanh toán',
        category: 'payment',
        dataContext: ['project', 'contract', 'payment'],
        icon: '💳',
        legalBasis: 'Mẫu 04.a/TT, NĐ 99/2021',
        fields: [
            ...projectInfoFields.slice(0, 3),
            { key: 'treasuryName', label: 'KBNN', type: 'text', placeholder: 'Tên Kho bạc Nhà nước' },
            { key: 'projectCode', label: 'Mã dự án', type: 'text', autoFillFrom: autoProject.id },
            ...decisionFields,
            ...signerFields,
        ],
    },

    'mau-26-giay-de-nghi-rut-von.md': {
        templatePath: 'mau-26-giay-de-nghi-rut-von.md',
        label: 'Giấy đề nghị rút vốn',
        shortLabel: 'Mẫu 26 – ĐN rút vốn',
        category: 'payment',
        dataContext: ['project'],
        icon: '💸',
        fields: [...projectInfoFields.slice(0, 3), ...signerFields],
    },

    'mau-27-giay-de-nghi-thu-hoi-von-tam-ung.md': {
        templatePath: 'mau-27-giay-de-nghi-thu-hoi-von-tam-ung.md',
        label: 'Giấy đề nghị thu hồi vốn tạm ứng',
        shortLabel: 'Mẫu 27 – Thu hồi tạm ứng',
        category: 'payment',
        dataContext: ['project', 'payment'],
        icon: '🔄',
        fields: [...projectInfoFields.slice(0, 3), ...signerFields],
    },

    'mau-28-bang-xac-dinh-gia-tri-klcv-hoan-thanh.md': {
        templatePath: 'mau-28-bang-xac-dinh-gia-tri-klcv-hoan-thanh.md',
        label: 'Bảng xác định giá trị KLCV hoàn thành',
        shortLabel: 'Mẫu 28 – XĐ KLCV HT',
        category: 'payment',
        dataContext: ['project', 'contract'],
        icon: '📐',
        fields: [...projectInfoFields.slice(0, 3), ...signerFields],
    },

    // ═══════════════════════════════════
    // QUYẾT TOÁN (Mẫu 32-41)
    // ═══════════════════════════════════

    'mau-32-bc-tong-hop-quyet-toan-da.md': {
        templatePath: 'mau-32-bc-tong-hop-quyet-toan-da.md',
        label: 'BC tổng hợp quyết toán dự án hoàn thành',
        shortLabel: 'Mẫu 32 – BC QT DA',
        category: 'settlement',
        dataContext: ['project', 'contract', 'payment'],
        icon: '📊',
        legalBasis: 'Mẫu 01/QTDA, TT 96/2021/TT-BTC',
        fields: [...projectInfoFields, ...signerFields],
    },

    'mau-33-41-bieu-mau-quyet-toan-da.md': {
        templatePath: 'mau-33-41-bieu-mau-quyet-toan-da.md',
        label: 'Biểu mẫu quyết toán dự án (Mẫu 33-41)',
        shortLabel: 'Mẫu 33-41 – BM QT',
        category: 'settlement',
        dataContext: ['project', 'contract', 'payment'],
        icon: '📑',
        fields: [...projectInfoFields, ...signerFields],
    },

    // ═══════════════════════════════════
    // HỢP ĐỒNG (Mẫu 42-45)
    // ═══════════════════════════════════

    'mau-42-45-hop-dong-xay-dung.md': {
        templatePath: 'mau-42-45-hop-dong-xay-dung.md',
        label: 'Hợp đồng xây dựng',
        shortLabel: 'Mẫu 42-45 – HĐ XD',
        category: 'contract',
        dataContext: ['project', 'contract', 'contractor'],
        icon: '📝',
        fields: [...projectInfoFields.slice(0, 3), ...signerFields],
    },

    // ═══════════════════════════════════
    // THẨM ĐỊNH (Detailed templates)
    // ═══════════════════════════════════

    'to-trinh-tham-dinh-bcnckt.md': {
        templatePath: 'to-trinh-tham-dinh-bcnckt.md',
        label: 'Tờ trình thẩm định BCNCKT',
        shortLabel: 'TT thẩm định BCNCKT',
        category: 'appraisal',
        dataContext: ['project'],
        icon: '📋',
        legalBasis: 'NĐ 175/2024',
        fields: [...projectInfoFields, ...documentFields, ...signerFields,
        { key: 'feasibilityContractor', label: 'Nhà thầu lập BCNCKT', type: 'text', autoFillFrom: (ctx) => ctx.project?.FeasibilityContractor || '' },
        { key: 'surveyContractor', label: 'Nhà thầu khảo sát', type: 'text', autoFillFrom: (ctx) => ctx.project?.SurveyContractor || '' },
        ],
    },

    'to-trinh-tham-dinh-thiet-ke-xay-dung.md': {
        templatePath: 'to-trinh-tham-dinh-thiet-ke-xay-dung.md',
        label: 'Tờ trình thẩm định thiết kế xây dựng',
        shortLabel: 'TT thẩm định TKXD',
        category: 'appraisal',
        dataContext: ['project'],
        icon: '📋',
        fields: [...projectInfoFields, ...documentFields, ...signerFields],
    },

    'thong-bao-ket-qua-tham-dinh-bcnckt.md': {
        templatePath: 'thong-bao-ket-qua-tham-dinh-bcnckt.md',
        label: 'Thông báo kết quả thẩm định BCNCKT',
        shortLabel: 'TB KQTĐ BCNCKT',
        category: 'appraisal',
        dataContext: ['project'],
        icon: '📢',
        legalBasis: 'K1 Đ22 NĐ 175',
        fields: [...projectInfoFields, ...signerFields],
    },

    'thong-bao-ket-qua-tham-dinh-bcnckt-nqddt.md': {
        templatePath: 'thong-bao-ket-qua-tham-dinh-bcnckt-nqddt.md',
        label: 'TB KQTĐ BCNCKT (NQĐĐT)',
        shortLabel: 'TB KQTĐ NQĐĐT',
        category: 'appraisal',
        dataContext: ['project'],
        icon: '📢',
        fields: [...projectInfoFields, ...signerFields],
    },

    'thong-bao-ket-qua-tham-dinh-bcktkt.md': {
        templatePath: 'thong-bao-ket-qua-tham-dinh-bcktkt.md',
        label: 'TB kết quả thẩm định BCKTKT',
        shortLabel: 'TB KQTĐ BCKTKT',
        category: 'appraisal',
        dataContext: ['project'],
        icon: '📢',
        fields: [...projectInfoFields, ...signerFields],
    },

    'thong-bao-ket-qua-tham-dinh-thiet-ke-xay-dung.md': {
        templatePath: 'thong-bao-ket-qua-tham-dinh-thiet-ke-xay-dung.md',
        label: 'TB kết quả thẩm định TKXD',
        shortLabel: 'TB KQTĐ TKXD',
        category: 'appraisal',
        dataContext: ['project'],
        icon: '📢',
        fields: [...projectInfoFields, ...signerFields],
    },

    'bao-cao-ket-qua-tham-tra-bcnckt.md': {
        templatePath: 'bao-cao-ket-qua-tham-tra-bcnckt.md',
        label: 'BC kết quả thẩm tra BCNCKT',
        shortLabel: 'BC KQTT BCNCKT',
        category: 'appraisal',
        dataContext: ['project'],
        icon: '🔍',
        fields: [...projectInfoFields, ...signerFields],
    },

    'bao-cao-ket-qua-tham-tra-thiet-ke-xay-dung.md': {
        templatePath: 'bao-cao-ket-qua-tham-tra-thiet-ke-xay-dung.md',
        label: 'BC kết quả thẩm tra TKXD',
        shortLabel: 'BC KQTT TKXD',
        category: 'appraisal',
        dataContext: ['project'],
        icon: '🔍',
        fields: [...projectInfoFields, ...signerFields],
    },

    'quyet-dinh-phe-duyet-du-an-bcnckt.md': {
        templatePath: 'quyet-dinh-phe-duyet-du-an-bcnckt.md',
        label: 'QĐ phê duyệt dự án (BCNCKT)',
        shortLabel: 'QĐ PD DA (BCNCKT)',
        category: 'appraisal',
        dataContext: ['project'],
        icon: '📜',
        fields: [...projectInfoFields, ...decisionFields, ...signerFields,
        { key: 'constructionType', label: 'Loại công trình', type: 'text', autoFillFrom: autoProject.constructionType },
        { key: 'constructionGrade', label: 'Cấp công trình', type: 'text', autoFillFrom: autoProject.constructionGrade },
        { key: 'managementForm', label: 'Hình thức QLDA', type: 'text', autoFillFrom: autoProject.managementForm },
        { key: 'objective', label: 'Mục tiêu đầu tư', type: 'textarea', autoFillFrom: autoProject.objective },
        ],
    },

    'quyet-dinh-phe-duyet-du-an-bcktkt.md': {
        templatePath: 'quyet-dinh-phe-duyet-du-an-bcktkt.md',
        label: 'QĐ phê duyệt dự án (BCKTKT)',
        shortLabel: 'QĐ PD DA (BCKTKT)',
        category: 'appraisal',
        dataContext: ['project'],
        icon: '📜',
        fields: [...projectInfoFields, ...decisionFields, ...signerFields],
    },

    'quyet-dinh-phe-duyet-thiet-ke-xay-dung.md': {
        templatePath: 'quyet-dinh-phe-duyet-thiet-ke-xay-dung.md',
        label: 'QĐ phê duyệt thiết kế xây dựng',
        shortLabel: 'QĐ PD TKXD',
        category: 'appraisal',
        dataContext: ['project'],
        icon: '📜',
        fields: [...projectInfoFields, ...decisionFields, ...signerFields],
    },

    // ═══════════════════════════════════
    // ĐẤU THẦU NHÓM (Mẫu 46-71)
    // ═══════════════════════════════════

    'mau-46-55-dau-thau-nhom-1.md': {
        templatePath: 'mau-46-55-dau-thau-nhom-1.md',
        label: 'Biểu mẫu đấu thầu nhóm 1',
        shortLabel: 'Mẫu 46-55 – ĐT nhóm 1',
        category: 'bidding',
        dataContext: ['project', 'package'],
        icon: '📋',
        fields: [...projectInfoFields.slice(0, 3), ...signerFields],
    },

    'mau-56-65-dau-thau-nhom-2.md': {
        templatePath: 'mau-56-65-dau-thau-nhom-2.md',
        label: 'Biểu mẫu đấu thầu nhóm 2',
        shortLabel: 'Mẫu 56-65 – ĐT nhóm 2',
        category: 'bidding',
        dataContext: ['project', 'package'],
        icon: '📋',
        fields: [...projectInfoFields.slice(0, 3), ...signerFields],
    },

    'mau-66-71-dau-thau-tai-chinh-tai-san-cong.md': {
        templatePath: 'mau-66-71-dau-thau-tai-chinh-tai-san-cong.md',
        label: 'Đấu thầu tài chính, tài sản công',
        shortLabel: 'Mẫu 66-71 – TCTSCC',
        category: 'bidding',
        dataContext: ['project'],
        icon: '🏛️',
        fields: [...projectInfoFields.slice(0, 3), ...signerFields],
    },

    // ═══════════════════════════════════
    // GIẤY PHÉP XD (PL-II)
    // ═══════════════════════════════════

    'phu-luc-II-01-don-de-nghi-cap-gpxd.md': {
        templatePath: 'phu-luc-II-01-don-de-nghi-cap-gpxd.md',
        label: 'Đơn đề nghị cấp GPXD',
        shortLabel: 'PL-II-01 – ĐN cấp GPXD',
        category: 'permit',
        dataContext: ['project'],
        icon: '🏗️',
        fields: [...projectInfoFields, ...documentFields],
    },

    // Other payment templates (simplified fields)
    'mau-22-giay-de-nghi-thay-doi-mau-dau.md': {
        templatePath: 'mau-22-giay-de-nghi-thay-doi-mau-dau.md',
        label: 'Giấy đề nghị thay đổi mẫu dấu',
        shortLabel: 'Mẫu 22 – Thay đổi mẫu dấu',
        category: 'payment',
        dataContext: ['project'],
        icon: '🔏',
        fields: [...projectInfoFields.slice(0, 3), ...signerFields],
    },

    'mau-24-giay-de-nghi-dieu-chinh-cam-ket-chi.md': {
        templatePath: 'mau-24-giay-de-nghi-dieu-chinh-cam-ket-chi.md',
        label: 'Giấy đề nghị điều chỉnh cam kết chi',
        shortLabel: 'Mẫu 24 – ĐC cam kết chi',
        category: 'payment',
        dataContext: ['project'],
        icon: '📝',
        fields: [...projectInfoFields.slice(0, 3), ...signerFields],
    },

    'mau-29-bang-ke-xac-nhan-klcv-boi-thuong.md': {
        templatePath: 'mau-29-bang-ke-xac-nhan-klcv-boi-thuong.md',
        label: 'Bảng kê xác nhận KLCV bồi thường',
        shortLabel: 'Mẫu 29 – XN KLCV BT',
        category: 'payment',
        dataContext: ['project'],
        icon: '📋',
        fields: [...projectInfoFields.slice(0, 3), ...signerFields],
    },

    'mau-30-bang-xac-dinh-klcv-phat-sinh-ngoai-hd.md': {
        templatePath: 'mau-30-bang-xac-dinh-klcv-phat-sinh-ngoai-hd.md',
        label: 'Bảng xác định KLCV phát sinh ngoài HĐ',
        shortLabel: 'Mẫu 30 – KLCV ngoài HĐ',
        category: 'payment',
        dataContext: ['project', 'contract'],
        icon: '📊',
        fields: [...projectInfoFields.slice(0, 3), ...signerFields],
    },

    'mau-31-bang-phan-bo-cp-qlda.md': {
        templatePath: 'mau-31-bang-phan-bo-cp-qlda.md',
        label: 'Bảng phân bổ CP QLDA',
        shortLabel: 'Mẫu 31 – PB CP QLDA',
        category: 'payment',
        dataContext: ['project'],
        icon: '💼',
        fields: [...projectInfoFields.slice(0, 3), ...signerFields],
    },
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Get template config by path
 */
export function getTemplateConfig(templatePath: string): TemplateConfig | undefined {
    return TEMPLATE_REGISTRY[templatePath];
}

/**
 * Get all templates for a category
 */
export function getTemplatesByCategory(category: TemplateCategory): TemplateConfig[] {
    return Object.values(TEMPLATE_REGISTRY).filter(t => t.category === category);
}

/**
 * Get category label in Vietnamese
 */
export function getCategoryLabel(category: TemplateCategory): string {
    const labels: Record<TemplateCategory, string> = {
        preparation: '📁 Chuẩn bị dự án',
        appraisal: '🔍 Thẩm định & Phê duyệt',
        bidding: '📝 Đấu thầu',
        permit: '🏗️ Giấy phép xây dựng',
        construction: '🔨 Thi công',
        payment: '💰 Thanh toán',
        settlement: '📊 Quyết toán',
        contract: '📝 Hợp đồng',
    };
    return labels[category];
}

/**
 * Get category color
 */
export function getCategoryColor(category: TemplateCategory): string {
    const colors: Record<TemplateCategory, string> = {
        preparation: 'from-blue-500 to-indigo-500',
        appraisal: 'from-purple-500 to-violet-500',
        bidding: 'from-amber-500 to-orange-500',
        permit: 'from-teal-500 to-cyan-500',
        construction: 'from-emerald-500 to-green-500',
        payment: 'from-rose-500 to-pink-500',
        settlement: 'from-slate-500 to-gray-500',
        contract: 'from-sky-500 to-blue-500',
    };
    return colors[category];
}

/**
 * Auto-fill all fields from context
 */
export function autoFillFields(
    config: TemplateConfig,
    context: ExportDataContext,
): Record<string, string> {
    const result: Record<string, string> = {};
    for (const field of config.fields) {
        if (field.autoFillFrom) {
            const value = field.autoFillFrom(context);
            if (value) result[field.key] = value;
        }
    }
    // Always fill document date to today if not set
    if (!result.documentDate) {
        result.documentDate = new Date().toISOString().split('T')[0];
    }
    return result;
}
