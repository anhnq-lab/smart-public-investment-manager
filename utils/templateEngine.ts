/**
 * Template Engine
 * ===============
 * Converts Markdown templates into DOCX documents with smart data binding.
 * 
 * Features:
 * - Parse markdown → detect structure (headings, paragraphs, tables, lists)
 * - Replace placeholders with project data
 * - Generate DOCX with proper Vietnamese government document formatting
 */

import {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    WidthType, AlignmentType, SectionType, TableLayoutType,
} from 'docx';
import { saveAs } from 'file-saver';
import {
    p, pMulti, headerCell, dataCell, THIN_BORDER, PORTRAIT_A4, LANDSCAPE_A4,
    buildDocumentHeader, buildTitleBlock, buildSignatureBlock, buildSignatureBlockTable,
    layoutCell, formatDateVN, formatCurrencyVN, pEmpty, pBody, pHeading,
    buildPageFooter,
} from './docxHelpers';
import { ExportDataContext, TemplateConfig, autoFillFields } from './templateRegistry';

// ========================================
// CITY NAME EXTRACTION
// ========================================

/**
 * Extract city/province name from full Vietnamese address
 * e.g. "Phường Xuân Đỉnh, quận Bắc Từ Liêm, Thành phố Hà Nội" → "Hà Nội"
 * e.g. "Hà Nội" → "Hà Nội"
 */
function extractCityName(address: string): string {
    if (!address) return '';
    // Direct city names
    const cities = ['Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ'];
    for (const city of cities) {
        if (address.includes(city)) return city;
    }
    // Try to extract "Thành phố X" or "Tỉnh X" pattern
    const tpMatch = address.match(/(?:Thành phố|TP\.?\s*|tỉnh)\s*([^,]+)/i);
    if (tpMatch) return tpMatch[1].trim();
    // If short enough, use as-is
    if (address.length <= 20) return address;
    // Fallback: take last segment after comma
    const parts = address.split(',');
    const lastPart = parts[parts.length - 1].trim();
    return lastPart.replace(/^(Thành phố|TP\.?\s*|tỉnh)\s*/i, '').trim() || address;
}

/**
 * Extract parent organization name from project context
 * e.g., project "Xây dựng cơ sở mới của Học viện Chính trị quốc gia HCM"
 *   → parent org: "HỌC VIỆN CHÍNH TRỊ QUỐC GIA HỒ CHÍ MINH"
 */
function extractParentOrg(context: ExportDataContext): string {
    const name = context.project?.ProjectName || '';
    // Try to detect Học viện CTQG HCM
    if (name.includes('Học viện Chính trị') || name.includes('Học viện CTQG')) {
        return 'HỌC VIỆN CHÍNH TRỊ QUỐC GIA HỒ CHÍ MINH';
    }
    // Try to extract "của [Org Name]" pattern
    const cuaMatch = name.match(/của\s+(.+?)(?:\s*[-,.]|$)/i);
    if (cuaMatch) return cuaMatch[1].trim();
    // Fallback: empty (no parent org shown)
    return '';
}

/**
 * Replace common placeholders in template content
 */
export function replacePlaceholders(
    content: string,
    formData: Record<string, string>,
    context: ExportDataContext,
): string {
    let result = content;

    // Replace direct placeholders
    const replacements: Record<string, string> = {
        // Project info
        '(tên dự án)': formData.projectName || '…………………',
        '(tên dự án….)': formData.projectName || '…………………',
        '(tên công trình/dự án)': formData.projectName || '…………………',
        'tên dự án ………': formData.projectName || '…………………',
        'Tên dự án: ...': `Tên dự án: ${formData.projectName || '…………………'}`,
        'Tên công trình: ...': `Tên công trình: ${formData.projectName || '…………………'}`,
        'Tên chủ đầu tư: ...': `Tên chủ đầu tư: ${formData.investorName || '…………………'}`,
        'Chủ đầu tư: ...': `Chủ đầu tư: ${formData.investorName || '…………………'}`,

        // Location & dates
        '…………, ngày … tháng … năm …..': `${formData.locationName || 'Hà Nội'}, ${formatDateVN(formData.documentDate || '')}`,
        '…………, ngày … tháng … năm 20…..': `${formData.locationName || 'Hà Nội'}, ${formatDateVN(formData.documentDate || '')}`,
        'ngày … tháng … năm …..': formatDateVN(formData.documentDate || ''),

        // Document numbers
        'Số: .../TTr-...': `Số: ${formData.documentNumber || '…/TTr-…'}`,
        'Số: .../TB-...': `Số: ${formData.documentNumber || '…/TB-…'}`,
        'Số: ……….....': `Số: ${formData.documentNumber || '…………'}`,
        'Số: ...': `Số: ${formData.documentNumber || '…………'}`,

        // Total investment
        'Tổng mức đầu tư dự kiến: ...': `Tổng mức đầu tư dự kiến: ${formData.totalInvestment ? formatCurrencyVN(parseFloat(formData.totalInvestment)) + ' đồng' : '…………………'}`,
        'Giá trị tổng mức đầu tư:': `Giá trị tổng mức đầu tư: ${formData.totalInvestment ? formatCurrencyVN(parseFloat(formData.totalInvestment)) + ' đồng' : ''}`,

        // Capital source
        'Nguồn vốn đầu tư:': `Nguồn vốn đầu tư: ${formData.capitalSource || ''}`,
        'Nguồn vốn: ...': `Nguồn vốn: ${formData.capitalSource || '…………………'}`,

        // Group
        '(A/B/C)': formData.projectGroup || '(A/B/C)',
        'Nhóm dự án:': `Nhóm dự án: ${formData.projectGroup || ''}`,

        // Authority
        '(Cơ quan có thẩm quyền thẩm định)': formData.recipientAuthority || '(Cơ quan có thẩm quyền thẩm định)',
        '(Cơ quan chuyên môn về xây dựng)': formData.recipientAuthority || '(Cơ quan chuyên môn về xây dựng)',
        '**CƠ QUAN PHÊ DUYỆT**': `**${(formData.issuingAuthority || 'CƠ QUAN PHÊ DUYỆT').toUpperCase()}**`,
        '**CƠ QUAN TRÌNH**': `**${(formData.issuingAuthority || 'CƠ QUAN TRÌNH').toUpperCase()}**`,
        '**TÊN TỔ CHỨC**': `**${(formData.issuingAuthority || 'TÊN TỔ CHỨC').toUpperCase()}**`,
        '**ĐẠI DIỆN TỔ CHỨC**': `**${(formData.signerTitle || 'ĐẠI DIỆN TỔ CHỨC').toUpperCase()}**`,
        '**CHỦ ĐẦU TƯ**': `**${(formData.investorName || 'CHỦ ĐẦU TƯ').toUpperCase()}**`,

        // Signer
        '*(Ký, ghi rõ họ tên, đóng dấu)*': formData.signerName
            ? `*(Ký, ghi rõ họ tên, đóng dấu)*\n\n**${formData.signerName}**`
            : '*(Ký, ghi rõ họ tên, đóng dấu)*',
        '*(Ký, ghi rõ họ tên, chức vụ và đóng dấu)*': formData.signerName
            ? `*(Ký, ghi rõ họ tên, chức vụ và đóng dấu)*\n\n**${formData.signerName}**`
            : '*(Ký, ghi rõ họ tên, chức vụ và đóng dấu)*',
    };

    for (const [placeholder, value] of Object.entries(replacements)) {
        result = result.replaceAll(placeholder, value);
    }

    // Replace remaining "..." with field values where possible
    if (formData.projectName) {
        result = result.replace(/Tên dự án:\s*$/gm, `Tên dự án: ${formData.projectName}`);
    }
    if (formData.investorName) {
        result = result.replace(/Chủ đầu tư:\s*$/gm, `Chủ đầu tư: ${formData.investorName}`);
    }

    // ── Generic {{placeholder}} replacement ──
    // Handles new template format with {{key}} placeholders
    // Special date fields from documentDate
    if (formData.documentDate) {
        const d = new Date(formData.documentDate);
        if (!isNaN(d.getTime())) {
            result = result.replaceAll('{{ngay}}', String(d.getDate()));
            result = result.replaceAll('{{thang}}', String(d.getMonth() + 1));
            result = result.replaceAll('{{nam}}', String(d.getFullYear()));
        }
    }
    // Special: format totalInvestment with currency
    if (formData.totalInvestment) {
        const num = parseFloat(formData.totalInvestment.replace(/[,.]/g, ''));
        if (!isNaN(num)) {
            result = result.replaceAll('{{tongMucDauTu}}', formatCurrencyVN(num) + ' đồng');
        }
    }
    // Map form field keys to template placeholder names
    const fieldMapping: Record<string, string> = {
        tenDuAn: formData.projectName || '',
        nhomDuAn: formData.projectGroup ? `Nhóm ${formData.projectGroup}` : '',
        chuDauTu: formData.investorName || '',
        diaDiemDuAn: formData.location || '',
        nguonVon: formData.capitalSource || '',
        thoiGianThucHien: formData.duration || '',
        tenCoQuan: formData.tenCoQuan || formData.investorName || '',
        soVanBan: formData.documentNumber || '……',
        diaDiem: formData.locationName || 'Hà Nội',
        kinhGui: formData.kinhGui || formData.recipientAuthority || '',
        capQuyetDinh: formData.capQuyetDinh || '',
        suCanThiet: formData.suCanThiet || '...',
        mucTieu: formData.mucTieu || '...',
        quyMo: formData.quyMo || '...',
        phanLoaiDuAn: formData.projectGroup ? `Nhóm ${formData.projectGroup}` : '...',
        chucDanh: formData.signerTitle || 'ĐẠI DIỆN CƠ QUAN',
        nguoiKy: formData.signerName || '',
        // Optional fields - default to "..."
        phanKyDauTu: formData.phanKyDauTu || '...',
        duKienBoTriVon: formData.duKienBoTriVon || '...',
        thongTinKhac: formData.thongTinKhac || '',
        canCuPhapLyKhac: formData.canCuPhapLyKhac || 'Các căn cứ pháp lý khác (có liên quan);',
        phuongAnThietKe: formData.phuongAnThietKe || '...',
        soBoTongMuc: formData.soBoTongMuc || '...',
        tienDo: formData.tienDo || '...',
        hieuQuaDauTu: formData.hieuQuaDauTu || '...',
        tacDongMoiTruong: formData.tacDongMoiTruong || '...',
        phuongAnThuHoiVon: formData.phuongAnThuHoiVon || '...',
    };
    for (const [key, value] of Object.entries(fieldMapping)) {
        result = result.replaceAll(`{{${key}}}`, value || '………');
    }

    // Catch any remaining {{...}} placeholders not handled above
    result = result.replace(/\{\{[a-zA-Z]+\}\}/g, '………');

    return result;
}

// ========================================
// MARKDOWN TO DOCX CONVERTER
// ========================================

interface ParsedLine {
    type: 'h1' | 'h2' | 'h3' | 'paragraph' | 'bold_paragraph' | 'list_item' | 'hr' | 'empty' | 'table_row' | 'html';
    content: string;
    indent?: number;
}

function parseLine(line: string): ParsedLine {
    const trimmed = line.trim();

    if (trimmed === '' || trimmed === '\r') return { type: 'empty', content: '' };
    if (trimmed === '---' || trimmed === '___') return { type: 'hr', content: '' };
    if (trimmed.startsWith('# ')) return { type: 'h1', content: trimmed.substring(2) };
    if (trimmed.startsWith('## ')) return { type: 'h2', content: trimmed.substring(3) };
    if (trimmed.startsWith('### ')) return { type: 'h3', content: trimmed.substring(4) };
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) return { type: 'table_row', content: trimmed };
    if (trimmed.startsWith('<')) return { type: 'html', content: trimmed };
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return { type: 'list_item', content: trimmed.substring(2) };
    }
    if (/^\d+\.\s/.test(trimmed)) {
        return { type: 'list_item', content: trimmed, indent: 1 };
    }
    if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        return { type: 'bold_paragraph', content: trimmed.replace(/\*\*/g, '') };
    }
    return { type: 'paragraph', content: trimmed };
}

function stripMarkdown(text: string): string {
    return text
        .replace(/\*\*([^*]+)\*\*/g, '$1')  // Bold
        .replace(/\*([^*]+)\*/g, '$1')       // Italic
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
        .replace(/<[^>]+>/g, '')              // HTML tags
        .replace(/`([^`]+)`/g, '$1')          // Code
        .replace(/\\_/g, '_')                 // Escaped underscores
        .replace(/<sup>[^<]+<\/sup>/g, '');    // Footnotes
}

function hasBold(text: string): boolean {
    return /\*\*[^*]+\*\*/.test(text);
}

function textRunsFromMarkdown(text: string, baseSize = 24): TextRun[] {
    const runs: TextRun[] = [];
    const parts = text.split(/(\*\*[^*]+\*\*)/g);

    for (const part of parts) {
        if (part.startsWith('**') && part.endsWith('**')) {
            runs.push(new TextRun({
                text: part.slice(2, -2),
                bold: true,
                size: baseSize,
                font: 'Times New Roman',
            }));
        } else if (part) {
            // Handle italic within non-bold
            const italicParts = part.split(/(\*[^*]+\*)/g);
            for (const ip of italicParts) {
                if (ip.startsWith('*') && ip.endsWith('*') && !ip.startsWith('**')) {
                    runs.push(new TextRun({
                        text: ip.slice(1, -1),
                        italics: true,
                        size: baseSize,
                        font: 'Times New Roman',
                    }));
                } else if (ip) {
                    runs.push(new TextRun({
                        text: stripMarkdown(ip),
                        size: baseSize,
                        font: 'Times New Roman',
                    }));
                }
            }
        }
    }

    return runs.length > 0 ? runs : [new TextRun({ text: stripMarkdown(text), size: baseSize, font: 'Times New Roman' })];
}

/**
 * Convert table rows (markdown format) into a docx Table
 */
function parseTableRows(rows: string[]): Table | null {
    if (rows.length < 2) return null;

    // Filter out separator rows (|---|---|)
    const dataRows = rows.filter(r => !r.match(/^\|[\s\-|:]+\|$/));
    if (dataRows.length === 0) return null;

    const tableRows = dataRows.map((row, rowIdx) => {
        const cells = row.split('|').filter(c => c.trim() !== '' || row.startsWith('|'));
        // Clean empty leading/trailing cells from pipe split
        const cleanCells = cells.filter((_, i) => i > 0 || cells[0].trim() !== '').map(c => c.trim());

        return new TableRow({
            children: cleanCells.map(cellText => {
                const isBold = cellText.startsWith('**') && cellText.endsWith('**');
                const isItalic = cellText.startsWith('*') && cellText.endsWith('*') && !isBold;
                const cleanText = stripMarkdown(cellText);

                return new TableCell({
                    children: [new Paragraph({
                        children: [new TextRun({
                            text: cleanText,
                            bold: isBold || rowIdx === 0,
                            italics: isItalic,
                            size: 20,
                            font: 'Times New Roman',
                        })],
                        spacing: { before: 30, after: 30 },
                    })],
                    borders: THIN_BORDER,
                });
            }),
        });
    });

    return new Table({
        rows: tableRows,
        width: { size: 100, type: WidthType.PERCENTAGE },
    });
}

/**
 * Convert filled markdown content into DOCX paragraphs/tables
 */
export function markdownToDocxElements(markdown: string): (Paragraph | Table)[] {
    const lines = markdown.split('\n');
    const elements: (Paragraph | Table)[] = [];
    let tableBuffer: string[] = [];
    let skipHtml = false;

    const flushTable = () => {
        if (tableBuffer.length > 0) {
            const table = parseTableRows(tableBuffer);
            if (table) elements.push(table);
            tableBuffer = [];
        }
    };

    for (let i = 0; i < lines.length; i++) {
        const parsed = parseLine(lines[i]);

        // Table accumulation
        if (parsed.type === 'table_row') {
            tableBuffer.push(parsed.content);
            continue;
        } else {
            flushTable();
        }

        // Skip HTML blocks (like <div>, <p>)
        if (parsed.type === 'html') {
            const content = parsed.content;
            if (content.includes('align="center"') && content.includes('<h')) {
                // Extract heading from HTML
                const match = content.match(/>([^<]+)</);
                if (match) {
                    elements.push(p(match[1], { bold: true, size: 26, alignment: AlignmentType.CENTER, after: 100 }));
                }
            } else if (content.includes('align="right"')) {
                const match = content.match(/>([^<]+)</);
                if (match) {
                    elements.push(p(stripMarkdown(match[1]), { italics: true, size: 24, alignment: AlignmentType.RIGHT, after: 100 }));
                }
            }
            // Skip other HTML
            continue;
        }

        switch (parsed.type) {
            case 'h1':
                elements.push(p(stripMarkdown(parsed.content), {
                    bold: true, size: 28, alignment: AlignmentType.CENTER, after: 100, before: 200,
                }));
                break;

            case 'h2':
                elements.push(p(stripMarkdown(parsed.content), {
                    bold: true, size: 26, alignment: AlignmentType.LEFT, after: 80, before: 200,
                }));
                break;

            case 'h3':
                elements.push(p(stripMarkdown(parsed.content), {
                    bold: true, size: 24, alignment: AlignmentType.LEFT, after: 60, before: 150,
                }));
                break;

            case 'bold_paragraph':
                elements.push(p(stripMarkdown(parsed.content), {
                    bold: true, size: 24, after: 60,
                }));
                break;

            case 'list_item': {
                const prefix = parsed.content.match(/^(\d+\.\s)/) ? '' : '- ';
                elements.push(new Paragraph({
                    children: textRunsFromMarkdown(`${prefix}${parsed.content}`),
                    indent: { firstLine: 720 },
                    spacing: { after: 40 },
                }));
                break;
            }

            case 'paragraph':
                if (parsed.content) {
                    elements.push(new Paragraph({
                        children: textRunsFromMarkdown(parsed.content),
                        spacing: { after: 60 },
                    }));
                }
                break;

            case 'hr':
                elements.push(pEmpty(100));
                break;

            case 'empty':
                // Don't add too many empty lines
                break;
        }
    }

    flushTable();
    return elements;
}

// ========================================
// EXPORT TEMPLATE AS DOCX — NĐ 30/2020
// ========================================
/**
 * Export a template as DOCX with auto-filled data
 * Uses proper Vietnamese government document formatting (NĐ 30/2020)
 *
 * NĐ 30/2020/NĐ-CP specs:
 *   - Font: Times New Roman, Unicode
 *   - Quốc hiệu: IN HOA, cỡ 12-13pt, đứng đậm
 *   - Tiêu ngữ: in thường, cỡ 13-14pt, đứng đậm, gạch chân
 *   - Tên cơ quan: IN HOA, cỡ 12-13pt, đứng đậm
 *   - Tên loại VB: IN HOA, cỡ 13-14pt, đứng đậm
 *   - Nội dung: cỡ 13-14pt (28 half-pts)
 *   - Lùi đầu dòng: 1,27 cm
 *   - Khoảng cách dòng: 1.5 lines (exactly 22pt)
 *   - Khoảng cách đoạn: tối thiểu 6pt
 *   - Lề: trái 3cm, phải 2cm, trên/dưới 2cm
 */
export async function exportTemplateAsDocx(
    config: TemplateConfig,
    formData: Record<string, string>,
    context: ExportDataContext,
): Promise<void> {
    // 1. Fetch template to replace placeholders for body content
    const response = await fetch(`/templates/${config.templatePath}`);
    if (!response.ok) throw new Error(`Template not found: ${config.templatePath}`);
    const rawContent = await response.text();

    // 2. Replace placeholders
    const filledContent = replacePlaceholders(rawContent, formData, context);

    // 3. Detect template type
    const isNewStyleTemplate = rawContent.includes('{{tenCoQuan}}') || rawContent.includes('{{tenDuAn}}');

    if (!isNewStyleTemplate) {
        // Old-style: use improved markdown conversion
        const elements = markdownToDocxElements(filledContent);
        const doc = new Document({
            styles: { default: { document: { run: { font: 'Times New Roman', size: 28 } } } },
            sections: [{
                properties: { ...PORTRAIT_A4 },
                footers: { default: buildPageFooter() },
                children: elements,
            }],
        });
        const blob = await Packer.toBlob(doc);
        saveAs(blob, `${config.shortLabel}.docx`);
        return;
    }

    // ── New-style template: Build entire document programmatically per NĐ 30/2020 ──
    const children: (Paragraph | Table)[] = [];

    // === Extract form values with proper key mapping ===
    const fd = (key: string, ...alt: string[]) => {
        if (formData[key]) return formData[key];
        for (const a of alt) if (formData[a]) return formData[a];
        return '';
    };

    const orgName = fd('tenCoQuan', 'investorName', 'issuingAuthority') || 'BAN QLDA ĐTXD CN';
    const docNumber = fd('documentNumber') || '……/BC-BQLDA';
    const docDate = fd('documentDate') || '';
    // Location: extract city/province for header, full address for body
    const fullLocation = fd('location', 'diaDiemDuAn') || '';
    const headerLocation = extractCityName(fd('locationName') || fullLocation) || 'Hà Nội';
    const kinhGui = fd('kinhGui', 'recipientAuthority') || '(Cơ quan quyết định chủ trương đầu tư dự án)';
    const tenDuAn = fd('projectName') || '………………';
    const nhomDuAn = fd('projectGroup') ? `Nhóm ${fd('projectGroup')}` : '………';
    const capQD = fd('capQuyetDinh', 'decisionAuthority') || '………';
    const chuDauTu = fd('investorName', 'chuDauTu') || '………';
    const diaDiem = fullLocation || '………';
    const tongMuc = fd('totalInvestment') || '………';
    const nguonVon = fd('capitalSource', 'nguonVon') || '………';
    const thoiGian = fd('duration', 'thoiGianThucHien') || '………';
    const signerTitle = fd('signerTitle') || 'ĐẠI DIỆN CƠ QUAN';
    const signerName = fd('signerName') || '';

    // Font size shorthand
    const B = 28; // Body 14pt
    const INDENT = 12.7; // mm

    // Extract parent org name from project context
    const parentOrg = fd('parentOrg') || extractParentOrg(context);

    // ═══════════════════════════════════════════
    // PART 0: Document header
    // ═══════════════════════════════════════════
    children.push(...buildDocumentHeader(orgName, docNumber, docDate, headerLocation, {
        parentOrg,
    }));

    // ═══════════════════════════════════════════
    // PART 1: Title — BÁO CÁO
    // ═══════════════════════════════════════════
    children.push(...buildTitleBlock(
        'BÁO CÁO',
        `Đề xuất chủ trương đầu tư dự án ${tenDuAn}`,
    ));

    // ═══════════════════════════════════════════
    // PART 2: Kính gửi + Căn cứ pháp lý
    // ═══════════════════════════════════════════
    children.push(pMulti([
        { text: 'Kính gửi: ', bold: true, italics: true, size: B },
        { text: kinhGui, italics: true, size: B },
    ], { alignment: AlignmentType.CENTER, after: 200 }));

    // Căn cứ pháp lý
    children.push(pBody('Căn cứ Luật Đầu tư công ngày 13 tháng 6 năm 2019 (sửa đổi, bổ sung ngày 29 tháng 11 năm 2024);'));
    children.push(pBody('Căn cứ Nghị định số 40/2020/NĐ-CP ngày 06/4/2020 hướng dẫn thi hành Luật Đầu tư công;'));
    children.push(pBody('Các căn cứ pháp lý khác (có liên quan),'));

    // Introductory paragraph
    children.push(pEmpty(100));
    children.push(pBody(
        `${orgName} trình ${kinhGui} Báo cáo đề xuất chủ trương đầu tư dự án ${tenDuAn} với các nội dung chính sau:`,
    ));

    // ═══════════════════════════════════════════
    // PART 3: I. THÔNG TIN CHUNG DỰ ÁN (Điều 27)
    // ═══════════════════════════════════════════
    children.push(pHeading('I. THÔNG TIN CHUNG DỰ ÁN'));

    children.push(pBody(`1. Tên dự án: ${tenDuAn}`));
    children.push(pBody(`2. Dự án nhóm: ${nhomDuAn}`));
    children.push(pBody(`3. Cấp quyết định đầu tư: ${capQD}`));
    children.push(pBody(`4. Tên chủ đầu tư (nếu có): ${chuDauTu}`));
    children.push(pBody(`5. Địa điểm thực hiện dự án: ${diaDiem}`));

    // Item 6 with sub-items: Tổng mức đầu tư
    children.push(pBody(`6. Dự kiến tổng mức đầu tư dự án: ${tongMuc} đồng`));
    children.push(p(`   - Nguồn vốn: ${nguonVon}`, { size: B, indent: INDENT * 1.5, after: 80 }));
    children.push(p(`   - Phân kỳ đầu tư: ${fd('phanKyDauTu') || '………'}`, { size: B, indent: INDENT * 1.5, after: 80 }));
    children.push(p(`   - Dự kiến bố trí vốn: ${fd('duKienBoTriVon') || '………'}`, { size: B, indent: INDENT * 1.5, after: 120 }));

    children.push(pBody(`7. Thời gian thực hiện: ${thoiGian}`));
    children.push(pBody(`8. Các thông tin khác (nếu có): ${fd('thongTinKhac') || '………'}`));

    // ═══════════════════════════════════════════
    // PART 4: II. NỘI DUNG CHỦ YẾU (Điều 35)
    // ═══════════════════════════════════════════
    children.push(pHeading('II. NỘI DUNG CHỦ YẾU CỦA DỰ ÁN'));
    children.push(pBody('Báo cáo đầy đủ các nội dung quy định tại Điều 35 của Luật Đầu tư công:'));

    const contentItems = [
        { label: '1. Sự cần thiết đầu tư', key: 'suCanThiet' },
        { label: '2. Mục tiêu đầu tư', key: 'mucTieu', altKey: 'objective' },
        { label: '3. Quy mô đầu tư', key: 'quyMo' },
        { label: '4. Phân loại dự án', key: 'phanLoaiDuAn' },
        { label: '5. Phương án thiết kế sơ bộ', key: 'phuongAnThietKe' },
        { label: '6. Sơ bộ tổng mức đầu tư', key: 'soBoTongMuc' },
        { label: '7. Tiến độ thực hiện, phân kỳ đầu tư', key: 'tienDo' },
        { label: '8. Phân tích hiệu quả đầu tư', key: 'hieuQuaDauTu' },
        { label: '9. Đánh giá tác động môi trường', key: 'tacDongMoiTruong' },
        { label: '10. Phương án thu hồi vốn (nếu có)', key: 'phuongAnThuHoiVon' },
    ];
    for (const item of contentItems) {
        const val = fd(item.key, (item as any).altKey) || '………';
        children.push(p(`${item.label}: ${val}`, { size: B, indent: INDENT * 1.5, after: 100 }));
    }

    // ═══════════════════════════════════════════
    // PART 5: Closing paragraph
    // ═══════════════════════════════════════════
    children.push(pEmpty(200));
    children.push(pBody(
        `${orgName} trình ${kinhGui} xem xét, quyết định chủ trương đầu tư dự án ${tenDuAn}./.`,
    ));
    children.push(pEmpty(200));

    // ═══════════════════════════════════════════
    // PART 6: Signature block (two-column table)
    // ═══════════════════════════════════════════
    const signatureTable = buildSignatureBlockTable(
        [
            'Như trên',
            'Cơ quan thẩm định chủ trương đầu tư dự án',
            'Các cơ quan liên quan khác',
        ],
        signerTitle,
        signerName,
    );
    children.push(signatureTable);

    // ── Build and save with proper document styling ──
    const doc = new Document({
        styles: {
            default: {
                document: {
                    run: { font: 'Times New Roman', size: 28 },
                    paragraph: { spacing: { line: 360 } }, // 1.5 lines
                },
            },
        },
        sections: [{
            properties: { ...PORTRAIT_A4 },
            footers: { default: buildPageFooter() },
            children,
        }],
    });

    const blob = await Packer.toBlob(doc);
    const safeName = (formData.projectName || config.shortLabel)
        .replace(/[^a-zA-Z0-9\u00C0-\u1EF9\s]/g, '_')
        .substring(0, 50)
        .trim();
    const fileName = `${config.shortLabel}_${safeName}.docx`;
    saveAs(blob, fileName);
}

/**
 * Get filled template content for preview (returns markdown string)
 */
export async function getFilledTemplatePreview(
    templatePath: string,
    formData: Record<string, string>,
    context: ExportDataContext,
): Promise<string> {
    const response = await fetch(`/templates/${templatePath}`);
    if (!response.ok) throw new Error(`Template not found: ${templatePath}`);
    const rawContent = await response.text();
    return replacePlaceholders(rawContent, formData, context);
}
