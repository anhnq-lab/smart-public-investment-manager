/**
 * Shared DOCX Helpers — Vietnamese Government Document Standard
 * ==============================================================
 * Professional building blocks per NĐ 30/2020/NĐ-CP:
 *   - Font: Times New Roman Unicode
 *   - Quốc hiệu: IN HOA, 12-13pt, đứng đậm
 *   - Tiêu ngữ: thường, 13-14pt, đứng đậm, gạch chân
 *   - Tên cơ quan: IN HOA, 12-13pt, đứng đậm
 *   - Tên loại VB: IN HOA, 13-14pt, đứng đậm
 *   - Nội dung: 13-14pt (size 26-28 half-pts)
 *   - Lùi đầu dòng: 1.27 cm
 *   - Khoảng cách dòng: 1.5 lines (exactly 22pt)
 *   - Khoảng cách đoạn: tối thiểu 6pt trước/sau
 *   - Lề: trái 30mm, phải 20mm, trên 20mm, dưới 20mm
 * 
 * Dependencies: docx, file-saver
 */

import {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    WidthType, AlignmentType, BorderStyle,
    convertMillimetersToTwip, PageOrientation, SectionType,
    VerticalAlign, TableLayoutType, Footer, Header, PageNumber,
    UnderlineType,
} from 'docx';
import { saveAs } from 'file-saver';

// ========================================
// CONSTANTS — NĐ 30/2020 Standard
// ========================================

const FONT = 'Times New Roman';

// Half-point sizes (multiply pt × 2)
const SZ = {
    QUOC_HIEU: 26,     // 13pt — Quốc hiệu
    TIEU_NGU: 28,       // 14pt — Tiêu ngữ
    TEN_CO_QUAN: 26,    // 13pt — Tên cơ quan ban hành
    SO_VAN_BAN: 26,     // 13pt — Số, ký hiệu
    DIA_DANH: 28,       // 14pt — Địa danh, ngày tháng
    TEN_LOAI_VB: 28,    // 14pt — Tên loại văn bản
    TRICH_YEU: 28,      // 14pt — Trích yếu nội dung
    NOI_DUNG: 28,       // 14pt — Nội dung
    NOI_NHAN: 22,       // 11pt — Nơi nhận
    KY_TEN: 28,         // 14pt — Ký tên
    GHI_CHU: 24,        // 12pt — Ghi chú nhỏ
};

// Line spacing in 240ths of a line (1.5 lines = 360)
const LINE_SPACING = {
    SINGLE: 240,
    ONE_HALF: 360,   // NĐ 30: 1.5 lines
    DOUBLE: 480,
    EXACT_20PT: 400, // Exactly 20pt
    EXACT_22PT: 440, // Exactly 22pt  
};

// Indent
const INDENT_MM = 12.7; // 1.27cm standard indent

// ========================================
// BORDERS
// ========================================

export const THIN_BORDER = {
    top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    right: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
} as const;

export const NO_BORDER = {
    top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
} as const;

// Bottom-only border for separator lines
const BOTTOM_BORDER = {
    top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
} as const;

// ========================================
// PAGE PROPERTIES — A4 per NĐ 30/2020
// ========================================

export const PORTRAIT_A4 = {
    page: {
        size: {
            width: convertMillimetersToTwip(210),
            height: convertMillimetersToTwip(297),
        },
        margin: {
            top: convertMillimetersToTwip(20),    // 2cm
            bottom: convertMillimetersToTwip(20),  // 2cm
            left: convertMillimetersToTwip(30),    // 3cm (NĐ 30: 3-3.5cm)
            right: convertMillimetersToTwip(20),   // 2cm (NĐ 30: 1.5-2cm)
        },
    },
};

export const LANDSCAPE_A4 = {
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
// TEXT RUN OPTIONS
// ========================================

export interface RunOpts {
    text: string;
    bold?: boolean;
    italics?: boolean;
    size?: number;
    underline?: boolean;
    font?: string;
    color?: string;
}

// ========================================
// PARAGRAPH HELPERS
// ========================================

/**
 * Create a single-run paragraph with proper NĐ 30/2020 spacing
 */
export function p(text: string, opts: {
    bold?: boolean; italics?: boolean; size?: number;
    alignment?: typeof AlignmentType[keyof typeof AlignmentType];
    indent?: number; after?: number; before?: number;
    underline?: boolean; color?: string;
    lineSpacing?: number;
} = {}): Paragraph {
    return new Paragraph({
        children: [new TextRun({
            text,
            bold: opts.bold,
            italics: opts.italics,
            underline: opts.underline ? { type: UnderlineType.SINGLE } : undefined,
            size: opts.size || SZ.NOI_DUNG,
            font: FONT,
            color: opts.color,
        })],
        alignment: opts.alignment || AlignmentType.JUSTIFIED,
        indent: opts.indent ? { firstLine: convertMillimetersToTwip(opts.indent) } : undefined,
        spacing: {
            after: opts.after ?? 120,
            before: opts.before ?? 0,
            line: opts.lineSpacing ?? LINE_SPACING.ONE_HALF,
        },
    });
}

/**
 * Create a multi-run paragraph (mixed bold/italic/etc within one paragraph)
 */
export function pMulti(runs: RunOpts[], opts: {
    alignment?: typeof AlignmentType[keyof typeof AlignmentType];
    indent?: number; after?: number; before?: number;
    lineSpacing?: number;
} = {}): Paragraph {
    return new Paragraph({
        children: runs.map(r => new TextRun({
            text: r.text,
            bold: r.bold,
            italics: r.italics,
            underline: r.underline ? { type: UnderlineType.SINGLE } : undefined,
            size: r.size || SZ.NOI_DUNG,
            font: r.font || FONT,
            color: r.color,
        })),
        alignment: opts.alignment || AlignmentType.JUSTIFIED,
        indent: opts.indent ? { firstLine: convertMillimetersToTwip(opts.indent) } : undefined,
        spacing: {
            after: opts.after ?? 120,
            before: opts.before ?? 0,
            line: opts.lineSpacing ?? LINE_SPACING.ONE_HALF,
        },
    });
}

/**
 * Empty paragraph (spacer)
 */
export function pEmpty(after = 200): Paragraph {
    return new Paragraph({ spacing: { after, line: LINE_SPACING.SINGLE }, children: [] });
}

/**
 * Bold heading (section title like "I. THÔNG TIN CHUNG")
 */
export function pHeading(text: string, opts: {
    alignment?: typeof AlignmentType[keyof typeof AlignmentType];
    before?: number; after?: number;
} = {}): Paragraph {
    return p(text, {
        bold: true,
        size: SZ.NOI_DUNG,
        alignment: opts.alignment || AlignmentType.LEFT,
        indent: INDENT_MM,
        before: opts.before ?? 200,
        after: opts.after ?? 120,
    });
}

/**
 * Body paragraph with standard indent  
 */
export function pBody(text: string, opts: {
    bold?: boolean; italics?: boolean; after?: number;
} = {}): Paragraph {
    return p(text, {
        size: SZ.NOI_DUNG,
        indent: INDENT_MM,
        bold: opts.bold,
        italics: opts.italics,
        after: opts.after ?? 120,
    });
}

// ========================================
// TABLE CELL HELPERS
// ========================================

/**
 * Header cell with gray background
 */
export function headerCell(text: string, width?: number, rowSpan?: number, columnSpan?: number): TableCell {
    return new TableCell({
        children: [new Paragraph({
            children: [new TextRun({ text, bold: true, size: 22, font: FONT })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 60, after: 60 },
        })],
        borders: THIN_BORDER,
        verticalAlign: VerticalAlign.CENTER,
        width: width ? { size: width, type: WidthType.DXA } : undefined,
        rowSpan,
        columnSpan,
        shading: { fill: 'D9E2F3' },
    });
}

/**
 * Data cell (normal content)
 */
export function dataCell(
    text: string,
    alignment: typeof AlignmentType[keyof typeof AlignmentType] = AlignmentType.LEFT,
    bold = false,
): TableCell {
    return new TableCell({
        children: [new Paragraph({
            children: [new TextRun({ text, size: 22, font: FONT, bold })],
            alignment,
            spacing: { before: 40, after: 40 },
        })],
        borders: THIN_BORDER,
        verticalAlign: VerticalAlign.TOP,
    });
}

/**
 * No-border cell (for layout tables like header/signature)
 */
export function layoutCell(
    children: Paragraph[],
    width?: number,
    _alignment?: typeof AlignmentType[keyof typeof AlignmentType],
): TableCell {
    return new TableCell({
        children,
        borders: NO_BORDER,
        width: width ? { size: width, type: WidthType.DXA } : undefined,
        verticalAlign: VerticalAlign.TOP,
    });
}

// ========================================
// DOCUMENT STRUCTURE: HEADER
// ========================================

/**
 * Build document header matching organizational format.
 * 
 * Layout per reference document:
 *   Left:  CƠ QUAN CHỦ QUẢN (regular) → TÊN ĐƠN VỊ (bold) → * → Số:
 *   Right: ĐẢNG CỘNG SẢN VIỆT NAM (bold) → Địa danh, ngày tháng (italic)
 * 
 * @param orgName - Tên đơn vị (e.g., "BAN QUẢN LÝ DỰ ÁN")
 * @param docNumber - Số văn bản
 * @param dateStr - Ngày ban hành
 * @param locationName - Địa danh (default: "Hà Nội")
 * @param opts - Additional options
 */
export function buildDocumentHeader(
    orgName: string,
    docNumber: string,
    dateStr: string,
    locationName = 'Hà Nội',
    opts: {
        parentOrg?: string;      // Cơ quan chủ quản (e.g., "HỌC VIỆN CHÍNH TRỊ QUỐC GIA HỒ CHÍ MINH")
        rightTitle?: string;     // Tiêu đề bên phải (default: "ĐẢNG CỘNG SẢN VIỆT NAM")
    } = {},
): (Paragraph | Table)[] {
    const elements: (Paragraph | Table)[] = [];

    const leftW = 4000;
    const rightW = 5800;
    const rightTitle = opts.rightTitle || 'ĐẢNG CỘNG SẢN VIỆT NAM';

    // Build left-side paragraphs
    const leftParagraphs: Paragraph[] = [];

    // Parent org (if provided) - regular weight
    if (opts.parentOrg) {
        leftParagraphs.push(new Paragraph({
            children: [new TextRun({ text: opts.parentOrg.toUpperCase(), size: SZ.TEN_CO_QUAN, font: FONT })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 0, line: LINE_SPACING.SINGLE },
        }));
    }

    // Org name - BOLD
    leftParagraphs.push(new Paragraph({
        children: [new TextRun({ text: orgName.toUpperCase(), bold: true, size: SZ.TEN_CO_QUAN, font: FONT })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 0, line: LINE_SPACING.SINGLE },
    }));

    // Star separator *
    leftParagraphs.push(new Paragraph({
        children: [new TextRun({ text: '*', size: SZ.TEN_CO_QUAN, font: FONT })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 0, line: LINE_SPACING.SINGLE },
    }));

    // Document number: Số: .../...
    leftParagraphs.push(new Paragraph({
        children: [new TextRun({ text: `Số: ${docNumber}`, size: SZ.SO_VAN_BAN, font: FONT })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 20, after: 0 },
    }));

    // Build right-side paragraphs
    const rightParagraphs: Paragraph[] = [];

    // Right title (ĐẢNG CỘNG SẢN VIỆT NAM) - BOLD
    rightParagraphs.push(new Paragraph({
        children: [new TextRun({ text: rightTitle, bold: true, size: SZ.QUOC_HIEU, font: FONT })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 0, line: LINE_SPACING.SINGLE },
    }));

    // Empty spacer to push date down to align with Số:
    rightParagraphs.push(new Paragraph({ spacing: { after: 0 }, children: [] }));

    // Location + date (italic)
    rightParagraphs.push(new Paragraph({
        children: [new TextRun({ text: `${locationName}, ${formatDateVN(dateStr)}`, italics: true, size: SZ.DIA_DANH, font: FONT })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 20, after: 0 },
    }));

    // Main header table
    const headerTable = new Table({
        rows: [
            new TableRow({
                children: [
                    layoutCell(leftParagraphs, leftW),
                    layoutCell(rightParagraphs, rightW),
                ],
            }),
        ],
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
    });

    elements.push(headerTable);
    elements.push(pEmpty(200));

    return elements;
}

// ========================================
// DOCUMENT STRUCTURE: TITLE BLOCK
// ========================================

/**
 * Build document title block (tên loại VB + trích yếu)
 * Per NĐ 30/2020: IN HOA, bold, centered, 14pt
 */
export function buildTitleBlock(
    docType: string,     // e.g. 'BÁO CÁO', 'TỜ TRÌNH', 'QUYẾT ĐỊNH'
    subtitle: string,    // e.g. 'Đề xuất chủ trương đầu tư dự án …'
): Paragraph[] {
    return [
        new Paragraph({
            children: [new TextRun({ text: docType.toUpperCase(), bold: true, size: SZ.TEN_LOAI_VB, font: FONT })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 60, before: 0 },
        }),
        new Paragraph({
            children: [new TextRun({ text: subtitle, bold: true, size: SZ.TRICH_YEU, font: FONT })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
        }),
    ];
}

// ========================================
// DOCUMENT STRUCTURE: SIGNATURE BLOCK
// ========================================

/**
 * Build signature block as two-column layout table
 * Per NĐ 30/2020:
 *   Left:  Nơi nhận (11pt, italic, bold header, list of recipients)
 *   Right: Chức danh (CAPS bold 14pt) + "Ký, ghi rõ…" + tên (bold 14pt)
 */
export function buildSignatureBlockTable(
    recipientList: string[],
    signerTitle: string,
    signerName: string,
): Table {
    return new Table({
        rows: [
            new TableRow({
                children: [
                    // Left: Nơi nhận
                    layoutCell([
                        new Paragraph({
                            children: [new TextRun({ text: 'Nơi nhận:', bold: true, italics: true, size: SZ.NOI_NHAN, font: FONT })],
                            spacing: { after: 40, line: LINE_SPACING.SINGLE },
                        }),
                        ...recipientList.map(r => new Paragraph({
                            children: [new TextRun({ text: `- ${r};`, size: SZ.NOI_NHAN, font: FONT })],
                            spacing: { after: 20, line: LINE_SPACING.SINGLE },
                        })),
                        new Paragraph({
                            children: [new TextRun({ text: '- Lưu: VT.', size: SZ.NOI_NHAN, font: FONT })],
                            spacing: { after: 0, line: LINE_SPACING.SINGLE },
                        }),
                    ], 4200),
                    // Right: Ký tên
                    layoutCell([
                        new Paragraph({
                            children: [new TextRun({ text: signerTitle.toUpperCase(), bold: true, size: SZ.KY_TEN, font: FONT })],
                            alignment: AlignmentType.CENTER,
                            spacing: { after: 40 },
                        }),
                        new Paragraph({
                            children: [new TextRun({ text: '(Ký, ghi rõ họ tên, chức vụ và đóng dấu)', italics: true, size: SZ.GHI_CHU, font: FONT })],
                            alignment: AlignmentType.CENTER,
                            spacing: { after: 1200 }, // ~= 5-6 blank lines for stamp
                        }),
                        new Paragraph({
                            children: [new TextRun({ text: signerName || '', bold: true, size: SZ.KY_TEN, font: FONT })],
                            alignment: AlignmentType.CENTER,
                            spacing: { after: 0 },
                        }),
                    ], 5600),
                ],
            }),
        ],
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
    });
}

/**
 * Build signature block (simple, non-table version)
 */
export function buildSignatureBlock(
    title: string,
    signerName: string,
    _signerTitle?: string,
): Paragraph[] {
    const paragraphs: Paragraph[] = [];
    paragraphs.push(p('Nơi nhận:', { bold: true, italics: true, size: SZ.NOI_NHAN, after: 40 }));
    paragraphs.push(p('- Như trên;', { size: SZ.NOI_NHAN, after: 20 }));
    paragraphs.push(p('- Lưu: VT.', { size: SZ.NOI_NHAN, after: 200 }));
    paragraphs.push(p(title.toUpperCase(), { bold: true, size: SZ.KY_TEN, alignment: AlignmentType.RIGHT, after: 40 }));
    paragraphs.push(p('(Ký, ghi rõ họ tên, đóng dấu)', { italics: true, size: SZ.GHI_CHU, alignment: AlignmentType.RIGHT, after: 1200 }));
    paragraphs.push(p(signerName || '.....................', { bold: true, size: SZ.KY_TEN, alignment: AlignmentType.RIGHT }));
    return paragraphs;
}

// ========================================
// FOOTER WITH PAGE NUMBER
// ========================================

export function buildPageFooter(): Footer {
    return new Footer({
        children: [
            new Paragraph({
                children: [
                    new TextRun({ children: [PageNumber.CURRENT], size: 20, font: FONT }),
                    new TextRun({ text: '/', size: 20, font: FONT }),
                    new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 20, font: FONT }),
                ],
                alignment: AlignmentType.CENTER,
            }),
        ],
    });
}

// ========================================
// DATE & CURRENCY FORMATTERS
// ========================================

export function formatDateVN(dateStr: string): string {
    if (!dateStr) return 'ngày …… tháng …… năm ……';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'ngày …… tháng …… năm ……';
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `ngày ${day} tháng ${month} năm ${year}`;
}

export function formatDateShort(dateStr: string): string {
    if (!dateStr) return '…/…/……';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
}

export function formatCurrencyVN(amount: number): string {
    return amount.toLocaleString('vi-VN') + ' đồng';
}

/**
 * Format amount in words (Vietnamese)
 */
export function amountInWords(amount: number): string {
    if (amount >= 1_000_000_000_000) {
        const val = amount / 1_000_000_000_000;
        return `${val.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} nghìn tỷ đồng`;
    }
    if (amount >= 1_000_000_000) {
        const val = amount / 1_000_000_000;
        return `${val.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tỷ đồng`;
    }
    if (amount >= 1_000_000) {
        const val = amount / 1_000_000;
        return `${val.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} triệu đồng`;
    }
    return `${amount.toLocaleString('vi-VN')} đồng`;
}

// ========================================
// DOCX EXPORT UTILITY
// ========================================

/**
 * Build a Document and save as DOCX file with proper footer
 */
export async function exportDocx(
    fileName: string,
    sections: { children: (Paragraph | Table)[]; landscape?: boolean }[],
): Promise<void> {
    const doc = new Document({
        styles: {
            default: {
                document: {
                    run: { font: FONT, size: SZ.NOI_DUNG },
                },
            },
        },
        sections: sections.map((s, i) => ({
            properties: {
                type: i === 0 ? undefined : SectionType.NEXT_PAGE,
                ...(s.landscape ? LANDSCAPE_A4 : PORTRAIT_A4),
            },
            footers: { default: buildPageFooter() },
            children: s.children,
        })),
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, fileName);
}

// Re-export constants for use by templateEngine
export { SZ, LINE_SPACING, INDENT_MM, FONT };
