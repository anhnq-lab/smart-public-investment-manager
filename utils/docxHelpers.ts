/**
 * Shared DOCX Helpers
 * ==================
 * Reusable building blocks for generating Vietnamese government documents.
 * Used by khlcntExport.ts, templateEngine.ts, and future exporters.
 * 
 * Dependencies: docx, file-saver
 */

import {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    WidthType, AlignmentType, BorderStyle,
    convertMillimetersToTwip, PageOrientation, SectionType,
    VerticalAlign, TableLayoutType,
} from 'docx';
import { saveAs } from 'file-saver';

// ========================================
// BORDERS
// ========================================

export const THIN_BORDER = {
    top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
    left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
    right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
} as const;

export const NO_BORDER = {
    top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
} as const;

// ========================================
// PAGE PROPERTIES
// ========================================

export const PORTRAIT_A4 = {
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
}

// ========================================
// PARAGRAPH HELPERS
// ========================================

/**
 * Create a single-run paragraph
 */
export function p(text: string, opts: {
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

/**
 * Create a multi-run paragraph (mixed bold/italic/etc within one paragraph)
 */
export function pMulti(runs: RunOpts[], opts: {
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
            font: r.font || 'Times New Roman',
        })),
        alignment: opts.alignment || AlignmentType.LEFT,
        indent: opts.indent ? { firstLine: convertMillimetersToTwip(opts.indent) } : undefined,
        spacing: { after: opts.after ?? 60, before: opts.before },
    });
}

/**
 * Empty paragraph (spacer)
 */
export function pEmpty(after = 100): Paragraph {
    return new Paragraph({ spacing: { after }, children: [] });
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
            children: [new TextRun({ text, size: 18, font: 'Times New Roman', bold })],
            alignment,
            spacing: { before: 20, after: 20 },
        })],
        borders: THIN_BORDER,
        verticalAlign: VerticalAlign.TOP,
    });
}

/**
 * No-border cell (for layout tables)
 */
export function layoutCell(
    children: Paragraph[],
    width?: number,
    alignment?: typeof AlignmentType[keyof typeof AlignmentType],
): TableCell {
    return new TableCell({
        children,
        borders: NO_BORDER,
        width: width ? { size: width, type: WidthType.DXA } : undefined,
        verticalAlign: VerticalAlign.TOP,
    });
}

// ========================================
// DOCUMENT STRUCTURE BLOCKS
// ========================================

/**
 * Build standard Vietnamese government document header
 * Two-column layout table per NĐ 30/2020:
 * Left: Cơ quan ban hành | Right: Quốc hiệu, tiêu ngữ
 */
export function buildDocumentHeader(
    orgName: string,
    docNumber: string,
    dateStr: string,
    locationName = 'Hà Nội',
): (Paragraph | Table)[] {
    const elements: (Paragraph | Table)[] = [];

    // Two-column header table (no borders)
    const headerTable = new Table({
        rows: [
            // Row 1: Tên cơ quan | Quốc hiệu
            new TableRow({
                children: [
                    layoutCell([
                        p(orgName.toUpperCase(), { bold: true, size: 24, alignment: AlignmentType.CENTER, after: 0 }),
                    ], 4200),
                    layoutCell([
                        p('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', { bold: true, size: 26, alignment: AlignmentType.CENTER, after: 0 }),
                    ], 5400),
                ],
            }),
            // Row 2: Gạch ngang | Tiêu ngữ
            new TableRow({
                children: [
                    layoutCell([
                        p('───────', { size: 20, alignment: AlignmentType.CENTER, after: 20 }),
                    ], 4200),
                    layoutCell([
                        p('Độc lập - Tự do - Hạnh phúc', { bold: true, size: 26, alignment: AlignmentType.CENTER, after: 0, underline: true }),
                    ], 5400),
                ],
            }),
            // Row 3: Số văn bản | Gạch ngang
            new TableRow({
                children: [
                    layoutCell([
                        p(`Số: ${docNumber}`, { size: 24, alignment: AlignmentType.CENTER, after: 0 }),
                    ], 4200),
                    layoutCell([
                        pEmpty(0),
                    ], 5400),
                ],
            }),
        ],
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
    });

    elements.push(headerTable);

    // Địa danh, ngày tháng (right-aligned below table)
    elements.push(p(`${locationName}, ${formatDateVN(dateStr)}`, {
        italics: true, size: 26, alignment: AlignmentType.CENTER, after: 300, before: 200,
    }));

    return elements;
}

/**
 * Build signature block as two-column layout table (Nơi nhận left + Ký tên right)
 * Per NĐ 30/2020 standard
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
                        pMulti([
                            { text: 'Nơi nhận:', bold: true, italics: true, size: 20 },
                        ], { after: 20 }),
                        ...recipientList.map(r => p(`- ${r};`, { size: 20, after: 10 })),
                        p('- Lưu: VT.', { size: 20, after: 0 }),
                    ], 4200),
                    // Right: Ký tên
                    layoutCell([
                        p(signerTitle.toUpperCase(), { bold: true, size: 24, alignment: AlignmentType.CENTER, after: 20 }),
                        p('(Ký, ghi rõ họ tên, chức vụ và đóng dấu)', { italics: true, size: 20, alignment: AlignmentType.CENTER, after: 600 }),
                        p(signerName || '', { bold: true, size: 24, alignment: AlignmentType.CENTER }),
                    ], 5400),
                ],
            }),
        ],
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
    });
}

/**
 * Build signature block (Nơi nhận + Ký tên)
 */
export function buildSignatureBlock(
    title: string,
    signerName: string,
    _signerTitle?: string,
): Paragraph[] {
    const paragraphs: Paragraph[] = [];

    paragraphs.push(p('Nơi nhận:', { bold: true, italics: true, size: 20, after: 40 }));
    paragraphs.push(p('- Như trên;', { size: 20, after: 20 }));
    paragraphs.push(p('- Lưu: VT.', { size: 20, after: 100 }));

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
// DATE & CURRENCY FORMATTERS
// ========================================

export function formatDateVN(dateStr: string): string {
    if (!dateStr) return 'ngày … tháng … năm …..';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'ngày … tháng … năm …..';
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `ngày ${day} tháng ${month} năm ${year}`;
}

export function formatDateShort(dateStr: string): string {
    if (!dateStr) return '…/…/……';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr; // Return as-is if not parseable (e.g. "Quý IV, 2023")
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
}

export function formatCurrencyVN(amount: number): string {
    return amount.toLocaleString('vi-VN');
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
 * Build a Document and save as DOCX file
 */
export async function exportDocx(
    fileName: string,
    sections: { children: (Paragraph | Table)[]; landscape?: boolean }[],
): Promise<void> {
    const doc = new Document({
        sections: sections.map((s, i) => ({
            properties: {
                type: i === 0 ? undefined : SectionType.NEXT_PAGE,
                ...(s.landscape ? LANDSCAPE_A4 : PORTRAIT_A4),
            },
            children: s.children,
        })),
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, fileName);
}
