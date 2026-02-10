import {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    WidthType, AlignmentType, BorderStyle,
    convertMillimetersToTwip, PageOrientation, SectionType,
    VerticalAlign, TableLayoutType
} from 'docx';
import { saveAs } from 'file-saver';
import { BiddingPackage } from '../types';

// ========================================
// KHLCNT EXPORT — Xuất Tờ trình & QĐ phê duyệt KHLCNT ra file DOCX
// Theo Mẫu 07 (TT 22/2024/TT-BKHĐT) và Mẫu 09 (TT 22/2024/TT-BKHĐT)
// ========================================

export interface KHLCNTExportData {
    // Thông tin QĐ
    decisionNumber: string;
    decisionDate: string;
    signerName: string;
    signerTitle: string;

    // Thông tin dự án (auto-fill từ Project)
    projectName: string;
    investmentDecision: string;     // Số QĐ phê duyệt dự án
    investmentDecisionDate: string; // Ngày QĐ phê duyệt dự án
    totalInvestment: number;
    fundingSource: string;
    investorName: string;           // Chủ đầu tư

    // Cơ quan ban hành (QĐ) / Cơ quan trình (Tờ trình)
    issuingAuthority: string;       // VD: UBND TỈNH HẢI DƯƠNG
    issuingDepartment: string;      // VD: CHỦ TỊCH

    // Tờ trình
    submissionNumber: string;       // Số tờ trình
    submissionDate: string;         // Ngày tờ trình
    recipientAuthority: string;     // Kính gửi (người có thẩm quyền)

    // Danh sách gói thầu (đã chọn)
    packages: BiddingPackage[];
}

// Vietnamese label mappings
const FIELD_LABELS: Record<string, string> = {
    Construction: 'Xây lắp',
    Consultancy: 'Tư vấn',
    NonConsultancy: 'Phi tư vấn',
    Goods: 'Hàng hóa',
    Mixed: 'Hỗn hợp',
};

const METHOD_LABELS: Record<string, string> = {
    OpenBidding: 'Đấu thầu rộng rãi',
    LimitedBidding: 'Đấu thầu hạn chế',
    Appointed: 'Chỉ định thầu',
    CompetitiveShopping: 'Chào hàng cạnh tranh',
    DirectProcurement: 'Mua sắm trực tiếp',
    SelfExecution: 'Tự thực hiện',
    CommunityParticipation: 'Cộng đồng tham gia',
};

const PROCEDURE_LABELS: Record<string, string> = {
    OneStageOneEnvelope: 'Một giai đoạn, một túi hồ sơ',
    OneStageTwoEnvelope: 'Một giai đoạn, hai túi hồ sơ',
    TwoStageOneEnvelope: 'Hai giai đoạn, một túi hồ sơ',
    TwoStageTwoEnvelope: 'Hai giai đoạn, hai túi hồ sơ',
    Reduced: 'Rút gọn',
    Normal: 'Thông thường',
};

const CONTRACT_LABELS: Record<string, string> = {
    LumpSum: 'Hợp đồng trọn gói',
    UnitPrice: 'Đơn giá cố định',
    AdjustableUnitPrice: 'Đơn giá điều chỉnh',
    TimeBased: 'Theo thời gian',
    Percentage: 'Theo tỷ lệ phần trăm',
    Mixed: 'Hỗn hợp',
};

function formatCurrency(amount: number): string {
    return amount.toLocaleString('vi-VN');
}

function formatDateVN(dateStr: string): string {
    if (!dateStr) return '...../...../20.....';
    const d = new Date(dateStr);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `ngày ${day} tháng ${month} năm ${year}`;
}

function formatDateShort(dateStr: string): string {
    if (!dateStr) return '...../...../......';
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
}

// ========================================
// HELPERS: Styled cells & paragraphs
// ========================================

const THIN_BORDER = {
    top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
    left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
    right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
} as const;

const NO_BORDER = {
    top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
} as const;

function headerCell(text: string, width?: number, rowSpan?: number, columnSpan?: number): TableCell {
    return new TableCell({
        children: [new Paragraph({
            children: [new TextRun({ text, bold: true, size: 18, font: 'Times New Roman' })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 40, after: 40 },
        })],
        borders: THIN_BORDER,
        verticalAlign: VerticalAlign.CENTER,
        width: width ? { size: width, type: WidthType.DXA } : undefined,
        rowSpan,
        columnSpan,
        shading: { fill: 'E8E8E8' },
    });
}

function dataCell(text: string, alignment: typeof AlignmentType[keyof typeof AlignmentType] = AlignmentType.LEFT, bold = false): TableCell {
    return new TableCell({
        children: [new Paragraph({
            children: [new TextRun({ text, size: 18, font: 'Times New Roman', bold })],
            alignment,
            spacing: { before: 20, after: 20 },
        })],
        borders: THIN_BORDER,
        verticalAlign: VerticalAlign.TOP,
    });
}

function p(text: string, opts: {
    bold?: boolean; italics?: boolean; size?: number;
    alignment?: typeof AlignmentType[keyof typeof AlignmentType];
    indent?: number; after?: number; before?: number;
    underline?: boolean;
} = {}): Paragraph {
    return new Paragraph({
        children: [new TextRun({
            text,
            bold: opts.bold,
            italics: opts.italics,
            underline: opts.underline ? {} : undefined,
            size: opts.size || 24,
            font: 'Times New Roman',
        })],
        alignment: opts.alignment || AlignmentType.LEFT,
        indent: opts.indent ? { firstLine: convertMillimetersToTwip(opts.indent) } : undefined,
        spacing: { after: opts.after ?? 60, before: opts.before },
    });
}

function pMulti(runs: { text: string; bold?: boolean; italics?: boolean; size?: number; underline?: boolean }[], opts: {
    alignment?: typeof AlignmentType[keyof typeof AlignmentType];
    indent?: number; after?: number; before?: number;
} = {}): Paragraph {
    return new Paragraph({
        children: runs.map(r => new TextRun({
            text: r.text,
            bold: r.bold,
            italics: r.italics,
            underline: r.underline ? {} : undefined,
            size: r.size || 24,
            font: 'Times New Roman',
        })),
        alignment: opts.alignment || AlignmentType.LEFT,
        indent: opts.indent ? { firstLine: convertMillimetersToTwip(opts.indent) } : undefined,
        spacing: { after: opts.after ?? 60, before: opts.before },
    });
}

// ========================================
// SHARED: Bảng KHLCNT (dùng chung cho cả Tờ trình và QĐ)
// ========================================

function buildKHLCNTTable(data: KHLCNTExportData): Table {
    const headerRow1 = new TableRow({
        children: [
            headerCell('STT', 500, 2),
            headerCell('Tên gói thầu', 2500, 2),
            headerCell('Giá gói thầu\n(VNĐ)', 1600, 2),
            headerCell('Nguồn vốn', 1200, 2),
            headerCell('Hình thức\nLCNT', 1200, 2),
            headerCell('Phương thức\nLCNT', 1200, 2),
            headerCell('Thời gian\nbắt đầu\ntổ chức\nLCNT', 1000, 2),
            headerCell('Loại\nhợp đồng', 1200, 2),
            headerCell('Thời gian\nthực hiện\nhợp đồng', 1000, 2),
        ],
        tableHeader: true,
    });

    const totalPrice = data.packages.reduce((sum, pkg) => sum + (pkg.Price || 0), 0);

    const dataRows = data.packages.map((pkg, idx) => new TableRow({
        children: [
            dataCell(`${idx + 1}`, AlignmentType.CENTER),
            dataCell(pkg.PackageName || ''),
            dataCell(pkg.Price ? formatCurrency(pkg.Price) : '', AlignmentType.RIGHT),
            dataCell(pkg.FundingSource || data.fundingSource || ''),
            dataCell(METHOD_LABELS[pkg.SelectionMethod] || pkg.SelectionMethod || ''),
            dataCell(PROCEDURE_LABELS[pkg.SelectionProcedure || ''] || pkg.SelectionProcedure || ''),
            dataCell(pkg.SelectionStartDate ? formatDateShort(pkg.SelectionStartDate) : '', AlignmentType.CENTER),
            dataCell(CONTRACT_LABELS[pkg.ContractType] || pkg.ContractType || ''),
            dataCell(pkg.Duration || '', AlignmentType.CENTER),
        ],
    }));

    // Total row
    const totalRow = new TableRow({
        children: [
            new TableCell({
                children: [new Paragraph({
                    children: [new TextRun({ text: 'Tổng cộng', bold: true, size: 18, font: 'Times New Roman' })],
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 40, after: 40 },
                })],
                borders: THIN_BORDER,
                columnSpan: 2,
            }),
            new TableCell({
                children: [new Paragraph({
                    children: [new TextRun({ text: formatCurrency(totalPrice), bold: true, size: 18, font: 'Times New Roman' })],
                    alignment: AlignmentType.RIGHT,
                    spacing: { before: 40, after: 40 },
                })],
                borders: THIN_BORDER,
            }),
            new TableCell({
                children: [new Paragraph({ children: [] })],
                borders: THIN_BORDER,
                columnSpan: 6,
            }),
        ],
    });

    return new Table({
        rows: [headerRow1, ...dataRows, totalRow],
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
    });
}

// ========================================
// SHARED: Document Header (2-column layout)
// ========================================

function buildDocumentHeader(leftTitle: string, docNumber: string, dateStr: string): Paragraph[] {
    const paragraphs: Paragraph[] = [];

    // Two-column header using a table with no borders
    // Left: CƠ QUAN | Right: CỘNG HÒA...

    paragraphs.push(p(leftTitle.toUpperCase(), {
        bold: true, size: 24, alignment: AlignmentType.CENTER, after: 20,
    }));
    paragraphs.push(p('_______________', {
        size: 20, alignment: AlignmentType.CENTER, after: 40,
    }));
    paragraphs.push(p(`Số: ${docNumber}`, {
        size: 24, alignment: AlignmentType.CENTER, after: 200,
    }));

    // CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
    paragraphs.push(p('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', {
        bold: true, size: 26, alignment: AlignmentType.CENTER, after: 20,
    }));
    paragraphs.push(p('Độc lập - Tự do - Hạnh phúc', {
        bold: true, size: 24, alignment: AlignmentType.CENTER, after: 20,
    }));
    paragraphs.push(p('_______________', {
        size: 20, alignment: AlignmentType.CENTER, after: 200,
    }));

    // Địa danh, ngày tháng
    paragraphs.push(p(`Hải Dương, ${formatDateVN(dateStr)}`, {
        italics: true, size: 24, alignment: AlignmentType.RIGHT, after: 300,
    }));

    return paragraphs;
}

// ========================================
// SHARED: Signature Block (Nơi nhận + Ký tên)
// ========================================

function buildSignatureBlock(title: string, signerName: string, signerTitle: string): Paragraph[] {
    const paragraphs: Paragraph[] = [];

    // Nơi nhận
    paragraphs.push(p('Nơi nhận:', { bold: true, italics: true, size: 20, after: 40 }));
    paragraphs.push(p('- Như trên;', { size: 20, after: 20 }));
    paragraphs.push(p('- Lưu: VT.', { size: 20, after: 100 }));

    // Ký tên (right-aligned)
    paragraphs.push(p(title.toUpperCase(), {
        bold: true, size: 24, alignment: AlignmentType.RIGHT, after: 20,
    }));
    paragraphs.push(p('(Ký, ghi rõ họ tên, đóng dấu)', {
        italics: true, size: 20, alignment: AlignmentType.RIGHT, after: 600,
    }));
    paragraphs.push(p(signerName || '.....................', {
        bold: true, size: 24, alignment: AlignmentType.RIGHT,
    }));

    return paragraphs;
}

// ========================================
// MẪU 07: TỜ TRÌNH PHÊ DUYỆT KHLCNT
// (Theo Mẫu số 02A - TT 22/2024/TT-BKHĐT)
// ========================================

function buildToTrinhSection(data: KHLCNTExportData): Paragraph[] {
    const paragraphs: Paragraph[] = [];
    const totalPrice = data.packages.reduce((sum, pkg) => sum + (pkg.Price || 0), 0);

    // Header
    paragraphs.push(...buildDocumentHeader(
        data.investorName || 'CƠ QUAN TRÌNH',
        data.submissionNumber || '...../TTr-...',
        data.submissionDate || data.decisionDate,
    ));

    // Title
    paragraphs.push(p('TỜ TRÌNH', {
        bold: true, size: 28, alignment: AlignmentType.CENTER, after: 20,
    }));
    paragraphs.push(p('Phê duyệt kế hoạch lựa chọn nhà thầu', {
        bold: true, size: 24, alignment: AlignmentType.CENTER, after: 20,
    }));
    paragraphs.push(p(`Dự án: ${data.projectName}`, {
        bold: true, size: 24, alignment: AlignmentType.CENTER, after: 300,
    }));

    // Kính gửi
    paragraphs.push(pMulti([
        { text: 'Kính gửi: ', bold: true },
        { text: data.recipientAuthority || data.issuingAuthority || '(Người có thẩm quyền)', italics: true },
    ], { after: 200 }));

    // I. CĂN CỨ LẬP KẾ HOẠCH
    paragraphs.push(p('I. CĂN CỨ LẬP KẾ HOẠCH', { bold: true, after: 100 }));
    paragraphs.push(p('Căn cứ Luật Đấu thầu số 22/2023/QH15 ngày 23 tháng 6 năm 2023;', { indent: 12, after: 60 }));
    paragraphs.push(p('Căn cứ Nghị định số 24/2024/NĐ-CP ngày 27/02/2024 quy định chi tiết một số điều và biện pháp thi hành Luật Đấu thầu;', { indent: 12, after: 60 }));
    paragraphs.push(p('Căn cứ Nghị định số 214/2025/NĐ-CP sửa đổi, bổ sung Nghị định 24/2024/NĐ-CP;', { indent: 12, after: 60 }));
    paragraphs.push(pMulti([
        { text: `1. Dự án đã được phê duyệt theo QĐ số: ${data.investmentDecision || '...../QĐ-......'} ${data.investmentDecisionDate ? formatDateVN(data.investmentDecisionDate) : 'ngày ..... tháng ..... năm .....'}` },
    ], { indent: 12, after: 60 }));
    paragraphs.push(p(`2. Nguồn vốn: ${data.fundingSource || '.....................'}`, { indent: 12, after: 60 }));
    paragraphs.push(p(`3. Tổng mức đầu tư: ${formatCurrency(data.totalInvestment)} đồng`, { indent: 12, after: 200 }));

    // II. PHẦN CÔNG VIỆC ĐÃ THỰC HIỆN
    paragraphs.push(p('II. PHẦN CÔNG VIỆC ĐÃ THỰC HIỆN', { bold: true, after: 100 }));
    paragraphs.push(p('(Nêu những gói thầu đã hoàn thành lựa chọn nhà thầu - nếu có)', { italics: true, indent: 12, after: 200 }));

    // III. PHẦN CÔNG VIỆC KHÔNG ÁP DỤNG HÌNH THỨC LCNT
    paragraphs.push(p('III. PHẦN CÔNG VIỆC KHÔNG ÁP DỤNG HÌNH THỨC LỰA CHỌN NHÀ THẦU', { bold: true, after: 100 }));
    paragraphs.push(p('(Nêu những phần việc tự thực hiện hoặc không cần lựa chọn nhà thầu - nếu có)', { italics: true, indent: 12, after: 200 }));

    // IV. PHẦN KẾ HOẠCH LỰA CHỌN NHÀ THẦU
    paragraphs.push(p('IV. PHẦN KẾ HOẠCH LỰA CHỌN NHÀ THẦU', { bold: true, after: 100 }));
    paragraphs.push(p(`Kế hoạch lựa chọn nhà thầu gồm ${data.packages.length} gói thầu với tổng giá trị ${formatCurrency(totalPrice)} đồng, cụ thể:`, { indent: 12, after: 200 }));

    // V. KIẾN NGHỊ
    paragraphs.push(p('V. KIẾN NGHỊ', { bold: true, after: 100, before: 300 }));
    paragraphs.push(pMulti([
        { text: `${data.investorName || 'Chủ đầu tư'} kính trình ${data.recipientAuthority || data.issuingAuthority || '(Người có thẩm quyền)'} xem xét, phê duyệt Kế hoạch lựa chọn nhà thầu dự án "${data.projectName}" với nội dung nêu trên./.` },
    ], { indent: 12, after: 300 }));

    // Ký tên
    paragraphs.push(...buildSignatureBlock(
        'CHỦ ĐẦU TƯ',
        data.signerName,
        '',
    ));

    return paragraphs;
}

// ========================================
// MẪU 09: QĐ PHÊ DUYỆT KHLCNT
// (Theo Mẫu số 02C - TT 22/2024/TT-BKHĐT)
// ========================================

function buildQuyetDinhSection(data: KHLCNTExportData): Paragraph[] {
    const paragraphs: Paragraph[] = [];
    const totalPrice = data.packages.reduce((sum, pkg) => sum + (pkg.Price || 0), 0);

    // Header
    paragraphs.push(...buildDocumentHeader(
        data.issuingAuthority || 'CƠ QUAN BAN HÀNH',
        data.decisionNumber || '...../QĐ-UBND',
        data.decisionDate,
    ));

    // Title
    paragraphs.push(p('QUYẾT ĐỊNH', {
        bold: true, size: 28, alignment: AlignmentType.CENTER, after: 20,
    }));
    paragraphs.push(p(`Phê duyệt kế hoạch lựa chọn nhà thầu dự án ${data.projectName}`, {
        bold: true, size: 24, alignment: AlignmentType.CENTER, after: 300,
    }));

    // Chức danh (VD: CHỦ TỊCH UBND TỈNH HẢI DƯƠNG)
    paragraphs.push(p((data.issuingDepartment || 'NGƯỜI CÓ THẨM QUYỀN').toUpperCase(), {
        bold: true, size: 24, alignment: AlignmentType.CENTER, after: 200,
    }));

    // Căn cứ pháp lý
    paragraphs.push(p('Căn cứ:', { bold: true, after: 60 }));
    const legalBases = [
        'Luật Đấu thầu số 22/2023/QH15 ngày 23 tháng 6 năm 2023;',
        'Nghị định số 24/2024/NĐ-CP ngày 27/02/2024 quy định chi tiết một số điều và biện pháp thi hành Luật Đấu thầu;',
        'Nghị định số 214/2025/NĐ-CP sửa đổi, bổ sung Nghị định 24/2024/NĐ-CP;',
        'Luật Đầu tư công số 58/2024/QH15 ngày 27 tháng 11 năm 2024;',
        `Quyết định phê duyệt dự án số ${data.investmentDecision || '...../QĐ-......'} ${data.investmentDecisionDate ? formatDateVN(data.investmentDecisionDate) : 'ngày ..... tháng ..... năm .....'};`,
        `Xét đề nghị của ${data.investorName || '.....................'} tại Tờ trình số ${data.submissionNumber || '...../TTr-...'};`,
    ];
    legalBases.forEach(text => {
        paragraphs.push(p(`- ${text}`, { indent: 12, after: 60 }));
    });

    paragraphs.push(new Paragraph({ spacing: { after: 100 }, children: [] }));

    // QUYẾT ĐỊNH:
    paragraphs.push(p('QUYẾT ĐỊNH:', {
        bold: true, size: 24, alignment: AlignmentType.CENTER, after: 200,
    }));

    // Điều 1
    paragraphs.push(pMulti([
        { text: 'Điều 1. ', bold: true },
        { text: `Phê duyệt kế hoạch lựa chọn nhà thầu dự án "${data.projectName}" với ${data.packages.length} gói thầu, tổng giá trị ${formatCurrency(totalPrice)} đồng, nội dung chi tiết tại bảng dưới đây:` },
    ], { indent: 12, after: 200 }));

    // Điều 2
    paragraphs.push(pMulti([
        { text: 'Điều 2. ', bold: true },
        { text: 'Tổ chức thực hiện' },
    ], { indent: 12, after: 60, before: 300 }));
    paragraphs.push(p(`Giao ${data.investorName || '.....................'} tổ chức lựa chọn nhà thầu theo kế hoạch được duyệt, đảm bảo tuân thủ quy định của Luật Đấu thầu và các văn bản hướng dẫn thi hành.`, { indent: 12, after: 120 }));

    // Điều 3
    paragraphs.push(pMulti([
        { text: 'Điều 3. ', bold: true },
        { text: 'Hiệu lực thi hành' },
    ], { indent: 12, after: 60 }));
    paragraphs.push(p('Chánh Văn phòng, Giám đốc các Sở, ngành liên quan và Thủ trưởng các cơ quan, đơn vị có liên quan căn cứ Quyết định thi hành./.', { indent: 12, after: 300 }));

    // Ký tên
    paragraphs.push(...buildSignatureBlock(
        data.issuingDepartment || 'NGƯỜI CÓ THẨM QUYỀN',
        data.signerName,
        data.signerTitle,
    ));

    return paragraphs;
}

// ========================================
// APPENDIX TABLE (Phụ lục kèm QĐ - landscape)
// ========================================

function buildAppendixSection(data: KHLCNTExportData): (Paragraph | Table)[] {
    const elements: (Paragraph | Table)[] = [];

    elements.push(p('PHỤ LỤC', { bold: true, size: 26, alignment: AlignmentType.CENTER, after: 20 }));
    elements.push(p('KẾ HOẠCH LỰA CHỌN NHÀ THẦU', { bold: true, size: 24, alignment: AlignmentType.CENTER, after: 20 }));
    elements.push(p(
        `(Kèm theo Quyết định số ${data.decisionNumber || '...../QĐ-UBND'} ${formatDateVN(data.decisionDate)})`,
        { italics: true, size: 22, alignment: AlignmentType.CENTER, after: 200 },
    ));

    // Project info
    elements.push(pMulti([
        { text: 'Tên dự án: ', bold: true, size: 22 },
        { text: data.projectName, size: 22 },
    ], { after: 60 }));
    elements.push(pMulti([
        { text: 'Chủ đầu tư: ', bold: true, size: 22 },
        { text: data.investorName || '.....................', size: 22 },
    ], { after: 60 }));
    elements.push(pMulti([
        { text: 'Tổng mức đầu tư: ', bold: true, size: 22 },
        { text: `${formatCurrency(data.totalInvestment)} đồng`, size: 22 },
    ], { after: 60 }));
    elements.push(pMulti([
        { text: 'Nguồn vốn: ', bold: true, size: 22 },
        { text: data.fundingSource || '.....................', size: 22 },
    ], { after: 200 }));

    // Full 13-column table for appendix (landscape)
    const headerRow1 = new TableRow({
        children: [
            headerCell('TT', 400, 2),
            headerCell('Tên chủ\nđầu tư', 1000, 2),
            headerCell('Tên gói thầu', 2000, undefined, 2),
            headerCell('Giá gói thầu\n(VNĐ)', 1100, 2),
            headerCell('Nguồn vốn', 900, 2),
            headerCell('Hình thức\nLCNT', 1000, 2),
            headerCell('Phương thức\nLCNT', 1000, 2),
            headerCell('Loại\nhợp đồng', 1000, 2),
            headerCell('Thời gian\nTH HĐ', 700, 2),
            headerCell('Thời gian tổ chức LCNT', 1200, undefined, 2),
            headerCell('Tùy chọn\nmua thêm', 600, 2),
        ],
        tableHeader: true,
    });

    const headerRow2 = new TableRow({
        children: [
            headerCell('Tên gói thầu', 1000),
            headerCell('Tóm tắt công việc\nchính', 1000),
            headerCell('Thời gian', 600),
            headerCell('Bắt đầu', 600),
        ],
        tableHeader: true,
    });

    const dataRows = data.packages.map((pkg, idx) => new TableRow({
        children: [
            dataCell(`${idx + 1}`, AlignmentType.CENTER),
            dataCell(data.investorName || '', AlignmentType.LEFT),
            dataCell(pkg.PackageName || ''),
            dataCell(pkg.Description || ''),
            dataCell(pkg.Price ? formatCurrency(pkg.Price) : '', AlignmentType.RIGHT),
            dataCell(pkg.FundingSource || data.fundingSource || ''),
            dataCell(METHOD_LABELS[pkg.SelectionMethod] || pkg.SelectionMethod || ''),
            dataCell(PROCEDURE_LABELS[pkg.SelectionProcedure || ''] || pkg.SelectionProcedure || ''),
            dataCell(CONTRACT_LABELS[pkg.ContractType] || pkg.ContractType || ''),
            dataCell(pkg.Duration || '', AlignmentType.CENTER),
            dataCell(pkg.SelectionDuration || '', AlignmentType.CENTER),
            dataCell(pkg.SelectionStartDate ? formatDateShort(pkg.SelectionStartDate) : '', AlignmentType.CENTER),
            dataCell(pkg.HasOption ? 'Có' : 'Không', AlignmentType.CENTER),
        ],
    }));

    const totalPrice = data.packages.reduce((sum, pkg) => sum + (pkg.Price || 0), 0);
    const totalRow = new TableRow({
        children: [
            new TableCell({
                children: [new Paragraph({
                    children: [new TextRun({ text: 'Tổng cộng', bold: true, size: 18, font: 'Times New Roman' })],
                    alignment: AlignmentType.CENTER,
                })],
                borders: THIN_BORDER,
                columnSpan: 4,
            }),
            new TableCell({
                children: [new Paragraph({
                    children: [new TextRun({ text: formatCurrency(totalPrice), bold: true, size: 18, font: 'Times New Roman' })],
                    alignment: AlignmentType.RIGHT,
                })],
                borders: THIN_BORDER,
            }),
            new TableCell({
                children: [new Paragraph({ children: [] })],
                borders: THIN_BORDER,
                columnSpan: 8,
            }),
        ],
    });

    const table = new Table({
        rows: [headerRow1, headerRow2, ...dataRows, totalRow],
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
    });

    elements.push(table);
    return elements;
}

// ========================================
// PAGE PROPERTIES
// ========================================

const PORTRAIT_A4 = {
    page: {
        size: {
            width: convertMillimetersToTwip(210),
            height: convertMillimetersToTwip(297),
        },
        margin: {
            top: convertMillimetersToTwip(20),
            bottom: convertMillimetersToTwip(20),
            left: convertMillimetersToTwip(30),
            right: convertMillimetersToTwip(20),
        },
    },
};

const LANDSCAPE_A4 = {
    page: {
        size: {
            width: convertMillimetersToTwip(297),
            height: convertMillimetersToTwip(210),
            orientation: PageOrientation.LANDSCAPE,
        },
        margin: {
            top: convertMillimetersToTwip(15),
            bottom: convertMillimetersToTwip(15),
            left: convertMillimetersToTwip(15),
            right: convertMillimetersToTwip(10),
        },
    },
};

// ========================================
// EXPORT: Tờ trình phê duyệt KHLCNT (Mẫu 07)
// ========================================

export async function exportToTrinh(data: KHLCNTExportData): Promise<void> {
    const toTrinhParagraphs = buildToTrinhSection(data);
    const table = buildKHLCNTTable(data);

    const doc = new Document({
        sections: [
            {
                properties: {
                    type: SectionType.NEXT_PAGE,
                    ...PORTRAIT_A4,
                },
                children: toTrinhParagraphs,
            },
            {
                // Bảng KHLCNT (landscape cho bảng rộng)
                properties: {
                    type: SectionType.NEXT_PAGE,
                    ...LANDSCAPE_A4,
                },
                children: [
                    p('BẢNG KẾ HOẠCH LỰA CHỌN NHÀ THẦU', {
                        bold: true, size: 24, alignment: AlignmentType.CENTER, after: 20,
                    }),
                    p(`(Kèm theo Tờ trình số ${data.submissionNumber || '...../TTr-...'} ${formatDateVN(data.submissionDate || data.decisionDate)})`, {
                        italics: true, size: 22, alignment: AlignmentType.CENTER, after: 200,
                    }),
                    table,
                ],
            },
        ],
    });

    const blob = await Packer.toBlob(doc);
    const fileName = `ToTrinh_KHLCNT_${data.projectName.replace(/[^a-zA-Z0-9\u00C0-\u1EF9]/g, '_').substring(0, 50)}.docx`;
    saveAs(blob, fileName);
}

// ========================================
// EXPORT: QĐ phê duyệt KHLCNT (Mẫu 09)
// ========================================

export async function exportKHLCNT(data: KHLCNTExportData): Promise<void> {
    const decisionParagraphs = buildQuyetDinhSection(data);
    const appendixElements = buildAppendixSection(data);

    const doc = new Document({
        sections: [
            {
                // Trang 1: Quyết Định (Portrait A4)
                properties: {
                    type: SectionType.NEXT_PAGE,
                    ...PORTRAIT_A4,
                },
                children: decisionParagraphs,
            },
            {
                // Trang 2: Phụ lục (Landscape A4)
                properties: {
                    type: SectionType.NEXT_PAGE,
                    ...LANDSCAPE_A4,
                },
                children: appendixElements,
            },
        ],
    });

    const blob = await Packer.toBlob(doc);
    const fileName = `QD_KHLCNT_${data.projectName.replace(/[^a-zA-Z0-9\u00C0-\u1EF9]/g, '_').substring(0, 50)}.docx`;
    saveAs(blob, fileName);
}
