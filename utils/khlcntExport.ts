import {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    WidthType, AlignmentType, BorderStyle, HeadingLevel,
    convertMillimetersToTwip, PageOrientation, SectionType,
    VerticalAlign, TableLayoutType
} from 'docx';
import { saveAs } from 'file-saver';
import { BiddingPackage } from '../types';

// ========================================
// KHLCNT EXPORT — Xuất QĐ phê duyệt KHLCNT ra file DOCX
// ========================================

export interface KHLCNTExportData {
    // Thông tin QĐ
    decisionNumber: string;
    decisionDate: string;
    signerName: string;
    signerTitle: string;

    // Thông tin dự án
    projectName: string;
    investmentDecision: string;
    totalInvestment: number;
    fundingSource: string;
    investorName: string;

    // Cơ quan ban hành
    issuingAuthority: string;
    issuingDepartment: string;

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

const BID_TYPE_LABELS: Record<string, string> = {
    Online: 'Qua mạng',
    Offline: 'Trực tiếp',
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
    return `${day}/${month}/${year}`;
}

// ========================================
// HELPERS: Create styled cells/paragraphs
// ========================================

const THIN_BORDER = {
    top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
    left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
    right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
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

// ========================================
// DECISION PAGE (Trang quyết định)
// ========================================

function buildDecisionSection(data: KHLCNTExportData): Paragraph[] {
    const paragraphs: Paragraph[] = [];

    // Header: Cơ quan ban hành
    paragraphs.push(new Paragraph({
        children: [new TextRun({ text: data.issuingAuthority.toUpperCase(), bold: true, size: 26, font: 'Times New Roman' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
    }));

    // Dấu gạch ngang
    paragraphs.push(new Paragraph({
        children: [new TextRun({ text: '_______________', size: 22, font: 'Times New Roman' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
    }));

    // Số QĐ
    paragraphs.push(new Paragraph({
        children: [new TextRun({ text: `Số: ${data.decisionNumber || '...../QĐ-UBND'}`, size: 24, font: 'Times New Roman' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
    }));

    // CỘNG HOÀ... header
    paragraphs.push(new Paragraph({
        children: [new TextRun({ text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', bold: true, size: 26, font: 'Times New Roman' })],
        alignment: AlignmentType.CENTER,
    }));
    paragraphs.push(new Paragraph({
        children: [new TextRun({ text: 'Độc lập - Tự do - Hạnh phúc', bold: true, size: 24, font: 'Times New Roman' })],
        alignment: AlignmentType.CENTER,
    }));
    paragraphs.push(new Paragraph({
        children: [new TextRun({ text: '_______________', size: 22, font: 'Times New Roman' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
    }));

    // Địa danh, ngày tháng
    paragraphs.push(new Paragraph({
        children: [new TextRun({
            text: `Hải Dương, ngày ${formatDateVN(data.decisionDate)}`,
            italics: true, size: 24, font: 'Times New Roman'
        })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
    }));

    // Tiêu đề QĐ
    paragraphs.push(new Paragraph({
        children: [new TextRun({ text: 'QUYẾT ĐỊNH', bold: true, size: 28, font: 'Times New Roman' })],
        alignment: AlignmentType.CENTER,
    }));
    paragraphs.push(new Paragraph({
        children: [new TextRun({
            text: 'Về việc phê duyệt Kế hoạch lựa chọn nhà thầu',
            bold: true, size: 24, font: 'Times New Roman'
        })],
        alignment: AlignmentType.CENTER,
    }));
    paragraphs.push(new Paragraph({
        children: [new TextRun({
            text: `Dự án: ${data.projectName}`,
            bold: true, size: 24, font: 'Times New Roman'
        })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
    }));

    // Chức danh
    paragraphs.push(new Paragraph({
        children: [new TextRun({
            text: data.issuingDepartment.toUpperCase(),
            bold: true, size: 24, font: 'Times New Roman'
        })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
    }));

    // Căn cứ pháp lý
    const legalBases = [
        'Căn cứ Luật Đấu thầu số 22/2023/QH15 ngày 23 tháng 6 năm 2023;',
        'Căn cứ Nghị định số 24/2024/NĐ-CP ngày 27 tháng 02 năm 2024 quy định chi tiết một số điều và biện pháp thi hành Luật Đấu thầu về lựa chọn nhà thầu;',
        'Căn cứ Nghị định số 214/2025/NĐ-CP sửa đổi, bổ sung Nghị định 24/2024/NĐ-CP;',
        'Căn cứ Luật Đầu tư công số 58/2024/QH15 ngày 27 tháng 11 năm 2024;',
        `Căn cứ Quyết định số ${data.investmentDecision || '...../QĐ-UBND'} về việc phê duyệt dự án đầu tư xây dựng;`,
        `Xét đề nghị của ${data.investorName || '.....................'} tại Tờ trình số .....;`,
    ];

    legalBases.forEach(text => {
        paragraphs.push(new Paragraph({
            children: [new TextRun({ text, italics: true, size: 24, font: 'Times New Roman' })],
            indent: { firstLine: convertMillimetersToTwip(12) },
            spacing: { after: 60 },
        }));
    });

    paragraphs.push(new Paragraph({ spacing: { after: 100 }, children: [] }));

    // QUYẾT ĐỊNH:
    paragraphs.push(new Paragraph({
        children: [new TextRun({ text: 'QUYẾT ĐỊNH:', bold: true, size: 24, font: 'Times New Roman' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
    }));

    // Điều 1
    const totalPrice = data.packages.reduce((sum, pkg) => sum + (pkg.Price || 0), 0);
    paragraphs.push(new Paragraph({
        children: [new TextRun({
            text: `Điều 1. Phê duyệt Kế hoạch lựa chọn nhà thầu dự án "${data.projectName}" với ${data.packages.length} gói thầu, tổng giá trị ${formatCurrency(totalPrice)} đồng (Chi tiết tại Phụ lục kèm theo).`,
            size: 24, font: 'Times New Roman',
        })],
        indent: { firstLine: convertMillimetersToTwip(12) },
        spacing: { after: 120 },
    }));

    // Điều 2
    paragraphs.push(new Paragraph({
        children: [new TextRun({
            text: `Điều 2. Giao ${data.investorName || '.....................'} tổ chức lựa chọn nhà thầu theo kế hoạch được duyệt, đảm bảo tuân thủ quy định của Luật Đấu thầu và các văn bản hướng dẫn thi hành.`,
            size: 24, font: 'Times New Roman',
        })],
        indent: { firstLine: convertMillimetersToTwip(12) },
        spacing: { after: 120 },
    }));

    // Điều 3
    paragraphs.push(new Paragraph({
        children: [new TextRun({
            text: 'Điều 3. Chánh Văn phòng UBND tỉnh, Giám đốc các Sở: Kế hoạch và Đầu tư, Tài chính, Xây dựng; Giám đốc Kho bạc Nhà nước tỉnh và Thủ trưởng các cơ quan, đơn vị liên quan căn cứ Quyết định thi hành./.',
            size: 24, font: 'Times New Roman',
        })],
        indent: { firstLine: convertMillimetersToTwip(12) },
        spacing: { after: 300 },
    }));

    // Nơi nhận & Ký tên
    paragraphs.push(new Paragraph({
        children: [
            new TextRun({ text: 'Nơi nhận:', bold: true, italics: true, size: 20, font: 'Times New Roman' }),
        ],
        spacing: { after: 40 },
    }));

    const recipients = ['- Như Điều 3;', '- Lưu: VT, KT&HT.'];
    recipients.forEach(r => {
        paragraphs.push(new Paragraph({
            children: [new TextRun({ text: r, size: 20, font: 'Times New Roman' })],
            spacing: { after: 20 },
        }));
    });

    paragraphs.push(new Paragraph({ spacing: { after: 100 }, children: [] }));

    // Signature block (aligned right)
    paragraphs.push(new Paragraph({
        children: [new TextRun({ text: data.signerTitle || 'CHỦ TỊCH', bold: true, size: 24, font: 'Times New Roman' })],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 600 },
    }));

    paragraphs.push(new Paragraph({
        children: [new TextRun({ text: data.signerName || '.....................', bold: true, size: 24, font: 'Times New Roman' })],
        alignment: AlignmentType.RIGHT,
    }));

    return paragraphs;
}

// ========================================
// APPENDIX TABLE (Phụ lục KHLCNT)
// ========================================

function buildAppendixSection(data: KHLCNTExportData): (Paragraph | Table)[] {
    const elements: (Paragraph | Table)[] = [];

    // PHỤ LỤC title
    elements.push(new Paragraph({
        children: [new TextRun({ text: 'PHỤ LỤC', bold: true, size: 26, font: 'Times New Roman' })],
        alignment: AlignmentType.CENTER,
    }));
    elements.push(new Paragraph({
        children: [new TextRun({ text: 'KẾ HOẠCH LỰA CHỌN NHÀ THẦU', bold: true, size: 24, font: 'Times New Roman' })],
        alignment: AlignmentType.CENTER,
    }));
    elements.push(new Paragraph({
        children: [new TextRun({
            text: `(Kèm theo Quyết định số ${data.decisionNumber || '...../QĐ-UBND'} ngày ${formatDateVN(data.decisionDate)})`,
            italics: true, size: 22, font: 'Times New Roman',
        })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
    }));

    // Project info
    elements.push(new Paragraph({
        children: [
            new TextRun({ text: 'Tên dự án: ', bold: true, size: 22, font: 'Times New Roman' }),
            new TextRun({ text: data.projectName, size: 22, font: 'Times New Roman' }),
        ],
        spacing: { after: 60 },
    }));
    elements.push(new Paragraph({
        children: [
            new TextRun({ text: 'Chủ đầu tư: ', bold: true, size: 22, font: 'Times New Roman' }),
            new TextRun({ text: data.investorName || '.....................', size: 22, font: 'Times New Roman' }),
        ],
        spacing: { after: 200 },
    }));

    // Table headers (2-row header)
    const headerRow1 = new TableRow({
        children: [
            headerCell('TT', 500, 2),
            headerCell('Tên gói thầu', 2500, 2),
            headerCell('Giá gói thầu\n(VNĐ)', 1600, 2),
            headerCell('Nguồn vốn', 1400, 2),
            headerCell('Lĩnh vực', 900, 2),
            headerCell('Hình thức\nLCNT', 1200, 2),
            headerCell('Phương thức\nLCNT', 1200, 2),
            headerCell('Hình thức\nđấu thầu', 900, 2),
            headerCell('Loại HĐ', 1200, 2),
            headerCell('Thời gian\nTH HĐ', 900, 2),
            headerCell('Thời gian tổ chức LCNT', 1600, undefined, 2),
            headerCell('Tùy chọn', 700, 2),
        ],
        tableHeader: true,
    });

    const headerRow2 = new TableRow({
        children: [
            headerCell('Thời gian', 800),
            headerCell('Bắt đầu', 800),
        ],
        tableHeader: true,
    });

    // Data rows
    const totalPrice = data.packages.reduce((sum, pkg) => sum + (pkg.Price || 0), 0);

    const dataRows = data.packages.map((pkg, idx) => new TableRow({
        children: [
            dataCell(`${idx + 1}`, AlignmentType.CENTER),
            dataCell(pkg.PackageName || ''),
            dataCell(pkg.Price ? formatCurrency(pkg.Price) : '', AlignmentType.RIGHT),
            dataCell(pkg.FundingSource || data.fundingSource || ''),
            dataCell(FIELD_LABELS[pkg.Field || ''] || pkg.Field || ''),
            dataCell(METHOD_LABELS[pkg.SelectionMethod] || pkg.SelectionMethod || ''),
            dataCell(PROCEDURE_LABELS[pkg.SelectionProcedure || ''] || pkg.SelectionProcedure || ''),
            dataCell(BID_TYPE_LABELS[pkg.BidType] || pkg.BidType || ''),
            dataCell(CONTRACT_LABELS[pkg.ContractType] || pkg.ContractType || ''),
            dataCell(pkg.Duration || '', AlignmentType.CENTER),
            dataCell(pkg.SelectionDuration || '', AlignmentType.CENTER),
            dataCell(pkg.SelectionStartDate || '', AlignmentType.CENTER),
            dataCell(pkg.HasOption ? 'Có' : 'Không', AlignmentType.CENTER),
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
                columnSpan: 10,
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
// MAIN EXPORT FUNCTION
// ========================================

export async function exportKHLCNT(data: KHLCNTExportData): Promise<void> {
    const decisionParagraphs = buildDecisionSection(data);
    const appendixElements = buildAppendixSection(data);

    const doc = new Document({
        sections: [
            {
                // Page 1: Quyết Định (Portrait A4)
                properties: {
                    type: SectionType.NEXT_PAGE,
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
                },
                children: decisionParagraphs,
            },
            {
                // Page 2: Phụ lục (Landscape A4 for wide table)
                properties: {
                    type: SectionType.NEXT_PAGE,
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
                },
                children: appendixElements,
            },
        ],
    });

    const blob = await Packer.toBlob(doc);
    const fileName = `QD_KHLCNT_${data.projectName.replace(/[^a-zA-Z0-9\u00C0-\u1EF9]/g, '_').substring(0, 50)}.docx`;
    saveAs(blob, fileName);
}
