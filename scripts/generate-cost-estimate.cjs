/**
 * Generate Cost Estimate — Dự toán chi phí phần mềm CIC.QLDA v4.0
 * Chi phí nhân công tính theo man-month
 */
const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
    ShadingType, PageBreak, PageNumber
} = require('docx');
const fs = require('fs');
const path = require('path');

// ── Colors ──
const C = {
    primary: '1B3A5C', accent: '2D8B8B', dark: '1A1A1A', text: '333333',
    muted: '666666', white: 'FFFFFF', headerBg: '1B3A5C', rowAlt: 'F0F6FA',
    border: 'D0D8E0', totalBg: 'E8F0F6', grandTotalBg: '1B3A5C',
    sectionBg: 'EAF4F4', warning: 'FFF3E0',
};

const border = (c = C.border) => ({ style: BorderStyle.SINGLE, size: 1, color: c });
const borders = (c) => ({ top: border(c), bottom: border(c), left: border(c), right: border(c) });
const cellM = { top: 50, bottom: 50, left: 80, right: 80 };

const PAGE_W = 16838; // A4 landscape width
const PAGE_H = 11906; // A4 landscape height
const MARGIN = 1000;
const CW = PAGE_W - 2 * MARGIN; // content width ~14838

function spacer(b = 80, a = 80) {
    return new Paragraph({ spacing: { before: b, after: a }, children: [] });
}

function heading(text, level = HeadingLevel.HEADING_1) {
    const sz = level === HeadingLevel.HEADING_1 ? 28 : 24;
    return new Paragraph({
        heading: level,
        spacing: { before: level === HeadingLevel.HEADING_1 ? 240 : 160, after: 100 },
        children: [new TextRun({ text, bold: true, font: 'Arial', size: sz, color: C.primary })]
    });
}

function bodyText(text, opts = {}) {
    return new Paragraph({
        spacing: { before: 30, after: 30 },
        alignment: opts.align || AlignmentType.LEFT,
        children: [new TextRun({ text, font: 'Arial', size: opts.size || 20, color: opts.color || C.text, bold: opts.bold || false, italics: opts.italic || false })]
    });
}

// ── Table builder ──
function makeCell(text, w, opts = {}) {
    return new TableCell({
        width: { size: w, type: WidthType.DXA },
        borders: borders(opts.borderColor || C.border),
        shading: { fill: opts.fill || C.white, type: ShadingType.CLEAR },
        margins: cellM,
        verticalAlign: 'center',
        columnSpan: opts.colSpan || 1,
        children: [new Paragraph({
            alignment: opts.align || AlignmentType.LEFT,
            children: [new TextRun({
                text: String(text),
                font: 'Arial',
                size: opts.size || 19,
                color: opts.color || C.text,
                bold: opts.bold || false,
                italics: opts.italic || false,
            })]
        })]
    });
}

function headerCell(text, w, opts = {}) {
    return makeCell(text, w, { fill: C.headerBg, color: C.white, bold: true, align: AlignmentType.CENTER, borderColor: C.primary, size: 19, ...opts });
}

function numFmt(n) {
    if (n === 0 || n === '') return '';
    return new Intl.NumberFormat('vi-VN').format(n);
}

// ═══════════════════════════════════════
// DATA
// ═══════════════════════════════════════

// A. NHÂN CÔNG — Man-month
const laborData = [
    // [STT, Vị trí, Số người, Man-month, Đơn giá (triệu), Thành tiền, Ghi chú]
    { stt: 1, role: 'Trưởng dự án (Project Manager)', qty: 1, mm: 4, rate: 35, note: 'Quản lý toàn bộ, giao tiếp KH' },
    { stt: 2, role: 'Phân tích nghiệp vụ (BA)', qty: 1, mm: 2, rate: 30, note: 'Phân tích yêu cầu, viết spec' },
    { stt: 3, role: 'Thiết kế UI/UX', qty: 1, mm: 1.5, rate: 28, note: 'Wireframe, mockup, design system' },
    { stt: 4, role: 'Lập trình Frontend (React/TS)', qty: 2, mm: 6, rate: 32, note: '2 dev × 3 tháng = 6 MM' },
    { stt: 5, role: 'Lập trình Backend (Supabase)', qty: 1, mm: 3, rate: 32, note: 'DB, API, Edge Functions, RLS' },
    { stt: 6, role: 'Lập trình AI (Gemini Integration)', qty: 1, mm: 2.5, rate: 38, note: 'Function Calling, 10 AI tools' },
    { stt: 7, role: 'Lập trình BIM (Three.js/IFC)', qty: 1, mm: 2.5, rate: 35, note: '3D viewer, section plane, đo đạc' },
    { stt: 8, role: 'Kiểm thử (QA/QC)', qty: 1, mm: 2, rate: 22, note: 'Test chức năng, UAT, regression' },
    { stt: 9, role: 'DevOps / Triển khai', qty: 1, mm: 1, rate: 30, note: 'CI/CD, deploy, monitoring' },
];

// B. HẠ TẦNG & CÔNG NGHỆ
const infraData = [
    { stt: 1, item: 'Supabase Cloud (Pro Plan)', unit: 'tháng', qty: 12, rate: 25, note: 'Database, Auth, Storage, Realtime' },
    { stt: 2, item: 'Google Gemini API (AI)', unit: 'tháng', qty: 12, rate: 1.5, note: 'Function Calling, 10 AI services' },
    { stt: 3, item: 'Domain + SSL Certificate', unit: 'năm', qty: 1, rate: 1.5, note: '.vn domain + SSL' },
    { stt: 4, item: 'CDN & Hosting (Vercel/CF)', unit: 'tháng', qty: 12, rate: 0.5, note: 'Frontend hosting, CDN global' },
    { stt: 5, item: 'Backup & Disaster Recovery', unit: 'tháng', qty: 12, rate: 0.5, note: 'Point-in-time recovery, replica' },
    { stt: 6, item: 'Email Service (Notify)', unit: 'tháng', qty: 12, rate: 0.2, note: 'Thông báo email, Telegram bot' },
];

// C. TRIỂN KHAI & ĐÀO TẠO
const deployData = [
    { stt: 1, item: 'Cài đặt, cấu hình hệ thống', unit: 'gói', qty: 1, rate: 8, note: 'Setup môi trường, import dữ liệu' },
    { stt: 2, item: 'Đào tạo Admin (2 buổi)', unit: 'buổi', qty: 2, rate: 3, note: 'Quản trị hệ thống, phân quyền' },
    { stt: 3, item: 'Đào tạo người dùng (3 buổi)', unit: 'buổi', qty: 3, rate: 3, note: 'Nghiệp vụ QLDA, BIM, AI' },
    { stt: 4, item: 'Tài liệu hướng dẫn sử dụng', unit: 'bộ', qty: 1, rate: 5, note: 'User Guide, Video hướng dẫn' },
    { stt: 5, item: 'Hỗ trợ vận hành song song (1 tháng)', unit: 'tháng', qty: 1, rate: 10, note: 'Chuyên viên onsite hỗ trợ' },
];

// D. VẬN HÀNH HÀNG THÁNG (sau triển khai)
const opsData = [
    { stt: 1, item: 'Supabase Cloud (Pro Plan)', unit: 'tháng', qty: 1, rate: 25, note: 'Database, Auth, Storage' },
    { stt: 2, item: 'Google Gemini API', unit: 'tháng', qty: 1, rate: 1.5, note: '~500 queries/ngày' },
    { stt: 3, item: 'CDN & Hosting', unit: 'tháng', qty: 1, rate: 0.5, note: 'Vercel / Cloudflare Pages' },
    { stt: 4, item: 'Backup & Recovery', unit: 'tháng', qty: 1, rate: 0.5, note: 'Daily backup' },
    { stt: 5, item: 'Bảo trì, cập nhật (0.5 MM)', unit: 'tháng', qty: 1, rate: 16, note: 'Fix bug, update tính năng nhỏ' },
];

// ═══════════════
// CALC
// ═══════════════
const laborTotal = laborData.reduce((s, r) => s + r.mm * r.rate, 0);
const totalMM = laborData.reduce((s, r) => s + r.mm, 0);
const infraTotal = infraData.reduce((s, r) => s + r.qty * r.rate, 0);
const deployTotal = deployData.reduce((s, r) => s + r.qty * r.rate, 0);
const opsMonthly = opsData.reduce((s, r) => s + r.qty * r.rate, 0);
const grandXD = laborTotal + infraTotal + deployTotal;

// ═══════════════════════════
// BUILD DOCUMENT
// ═══════════════════════════
async function build() {

    // COLUMN WIDTHS for main cost tables (7 columns)
    const w = [600, 4000, 900, 1400, 2000, 2400, 3538]; // = ~14838

    const doc = new Document({
        styles: {
            default: { document: { run: { font: 'Arial', size: 20 } } },
            paragraphStyles: [
                {
                    id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
                    run: { size: 28, bold: true, font: 'Arial', color: C.primary },
                    paragraph: { spacing: { before: 240, after: 100 }, outlineLevel: 0 }
                },
                {
                    id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
                    run: { size: 24, bold: true, font: 'Arial', color: C.primary },
                    paragraph: { spacing: { before: 160, after: 80 }, outlineLevel: 1 }
                },
            ]
        },
        sections: [{
            properties: {
                page: {
                    size: { width: PAGE_W, height: PAGE_H, orientation: 'landscape' },
                    margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN }
                }
            },
            headers: {
                default: new Header({
                    children: [new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [new TextRun({ text: 'DỰ TOÁN CHI PHÍ — CIC.QLDA v4.0', font: 'Arial', size: 16, color: C.muted, italics: true })]
                    })]
                })
            },
            footers: {
                default: new Footer({
                    children: [new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({ text: '© 2026 CIC — Phần mềm Quản lý Dự án Đầu tư Công Thông minh  |  Trang ', font: 'Arial', size: 16, color: C.muted }),
                            new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 16, color: C.muted }),
                        ]
                    })]
                })
            },
            children: [

                // ══════════════════
                // TITLE
                // ══════════════════
                spacer(300, 0),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 60 },
                    children: [new TextRun({ text: 'DỰ TOÁN CHI PHÍ', font: 'Arial', size: 36, bold: true, color: C.primary })]
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 40 },
                    children: [new TextRun({ text: 'PHẦN MỀM QUẢN LÝ DỰ ÁN ĐẦU TƯ CÔNG THÔNG MINH', font: 'Arial', size: 26, bold: true, color: C.primary })]
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 100 },
                    children: [new TextRun({ text: 'CIC.QLDA v4.0 — Tích hợp AI \u0026 BIM 3D', font: 'Arial', size: 22, color: C.accent, italics: true })]
                }),

                // Info row
                new Table({
                    width: { size: CW, type: WidthType.DXA },
                    columnWidths: [Math.floor(CW / 3), Math.floor(CW / 3), Math.floor(CW / 3)],
                    rows: [new TableRow({
                        children: [
                            makeCell('Đơn vị tính: Triệu VNĐ', Math.floor(CW / 3), { fill: C.sectionBg, bold: true, align: AlignmentType.CENTER, size: 18 }),
                            makeCell('Ngày lập: 05/03/2026', Math.floor(CW / 3), { fill: C.sectionBg, bold: true, align: AlignmentType.CENTER, size: 18 }),
                            makeCell('Thời gian thực hiện: 4 tháng', Math.floor(CW / 3), { fill: C.sectionBg, bold: true, align: AlignmentType.CENTER, size: 18 }),
                        ]
                    })]
                }),

                // ══════════════════════════════════════
                // A. CHI PHÍ NHÂN CÔNG
                // ══════════════════════════════════════
                spacer(200, 0),
                heading('A. CHI PHÍ NHÂN CÔNG (XÂY DỰNG PHẦN MỀM)', HeadingLevel.HEADING_1),
                spacer(40, 0),

                new Table({
                    width: { size: CW, type: WidthType.DXA },
                    columnWidths: w,
                    rows: [
                        // Header
                        new TableRow({
                            tableHeader: true,
                            children: [
                                headerCell('STT', w[0]),
                                headerCell('Vị trí / Vai trò', w[1]),
                                headerCell('Số người', w[2]),
                                headerCell('Man-month', w[3]),
                                headerCell('Đơn giá\n(triệu/MM)', w[4]),
                                headerCell('Thành tiền\n(triệu)', w[5]),
                                headerCell('Ghi chú', w[6]),
                            ]
                        }),
                        // Data rows
                        ...laborData.map((r, i) => new TableRow({
                            children: [
                                makeCell(r.stt, w[0], { align: AlignmentType.CENTER, fill: i % 2 ? C.rowAlt : C.white }),
                                makeCell(r.role, w[1], { fill: i % 2 ? C.rowAlt : C.white }),
                                makeCell(r.qty, w[2], { align: AlignmentType.CENTER, fill: i % 2 ? C.rowAlt : C.white }),
                                makeCell(r.mm, w[3], { align: AlignmentType.CENTER, fill: i % 2 ? C.rowAlt : C.white }),
                                makeCell(numFmt(r.rate), w[4], { align: AlignmentType.RIGHT, fill: i % 2 ? C.rowAlt : C.white }),
                                makeCell(numFmt(r.mm * r.rate), w[5], { align: AlignmentType.RIGHT, fill: i % 2 ? C.rowAlt : C.white, bold: true }),
                                makeCell(r.note, w[6], { fill: i % 2 ? C.rowAlt : C.white, size: 18, italic: true, color: C.muted }),
                            ]
                        })),
                        // Total row
                        new TableRow({
                            children: [
                                makeCell('', w[0], { fill: C.totalBg }),
                                makeCell('CỘNG CHI PHÍ NHÂN CÔNG (A)', w[1], { fill: C.totalBg, bold: true, color: C.primary }),
                                makeCell(laborData.reduce((s, r) => s + r.qty, 0), w[2], { align: AlignmentType.CENTER, fill: C.totalBg, bold: true }),
                                makeCell(totalMM, w[3], { align: AlignmentType.CENTER, fill: C.totalBg, bold: true }),
                                makeCell('', w[4], { fill: C.totalBg }),
                                makeCell(numFmt(laborTotal), w[5], { align: AlignmentType.RIGHT, fill: C.totalBg, bold: true, color: C.primary, size: 21 }),
                                makeCell(`Tổng ${totalMM} man-month`, w[6], { fill: C.totalBg, bold: true, size: 18 }),
                            ]
                        }),
                    ]
                }),

                // ══════════════════════════════════════
                // B. HẠ TẦNG & CÔNG NGHỆ (NĂM ĐẦU)
                // ══════════════════════════════════════
                spacer(200, 0),
                heading('B. CHI PHÍ HẠ TẦNG & CÔNG NGHỆ (NĂM ĐẦU)', HeadingLevel.HEADING_1),
                spacer(40, 0),

                new Table({
                    width: { size: CW, type: WidthType.DXA },
                    columnWidths: [600, 4000, 1400, 1400, 2000, 2400, 3038],
                    rows: [
                        new TableRow({
                            tableHeader: true,
                            children: [
                                headerCell('STT', 600),
                                headerCell('Hạng mục', 4000),
                                headerCell('Đơn vị', 1400),
                                headerCell('Số lượng', 1400),
                                headerCell('Đơn giá\n(triệu)', 2000),
                                headerCell('Thành tiền\n(triệu)', 2400),
                                headerCell('Ghi chú', 3038),
                            ]
                        }),
                        ...infraData.map((r, i) => new TableRow({
                            children: [
                                makeCell(r.stt, 600, { align: AlignmentType.CENTER, fill: i % 2 ? C.rowAlt : C.white }),
                                makeCell(r.item, 4000, { fill: i % 2 ? C.rowAlt : C.white }),
                                makeCell(r.unit, 1400, { align: AlignmentType.CENTER, fill: i % 2 ? C.rowAlt : C.white }),
                                makeCell(r.qty, 1400, { align: AlignmentType.CENTER, fill: i % 2 ? C.rowAlt : C.white }),
                                makeCell(numFmt(r.rate), 2000, { align: AlignmentType.RIGHT, fill: i % 2 ? C.rowAlt : C.white }),
                                makeCell(numFmt(r.qty * r.rate), 2400, { align: AlignmentType.RIGHT, fill: i % 2 ? C.rowAlt : C.white, bold: true }),
                                makeCell(r.note, 3038, { fill: i % 2 ? C.rowAlt : C.white, size: 18, italic: true, color: C.muted }),
                            ]
                        })),
                        new TableRow({
                            children: [
                                makeCell('', 600, { fill: C.totalBg }),
                                makeCell('CỘNG CHI PHÍ HẠ TẦNG NĂM ĐẦU (B)', 4000, { fill: C.totalBg, bold: true, color: C.primary }),
                                makeCell('', 1400, { fill: C.totalBg }),
                                makeCell('', 1400, { fill: C.totalBg }),
                                makeCell('', 2000, { fill: C.totalBg }),
                                makeCell(numFmt(infraTotal), 2400, { align: AlignmentType.RIGHT, fill: C.totalBg, bold: true, color: C.primary, size: 21 }),
                                makeCell('', 3038, { fill: C.totalBg }),
                            ]
                        }),
                    ]
                }),

                // ══════════════════════════════════════
                // C. TRIỂN KHAI & ĐÀO TẠO
                // ══════════════════════════════════════
                new Paragraph({ children: [new PageBreak()] }),
                heading('C. CHI PHÍ TRIỂN KHAI & ĐÀO TẠO', HeadingLevel.HEADING_1),
                spacer(40, 0),

                new Table({
                    width: { size: CW, type: WidthType.DXA },
                    columnWidths: [600, 4000, 1400, 1400, 2000, 2400, 3038],
                    rows: [
                        new TableRow({
                            tableHeader: true,
                            children: [
                                headerCell('STT', 600),
                                headerCell('Hạng mục', 4000),
                                headerCell('Đơn vị', 1400),
                                headerCell('Số lượng', 1400),
                                headerCell('Đơn giá\n(triệu)', 2000),
                                headerCell('Thành tiền\n(triệu)', 2400),
                                headerCell('Ghi chú', 3038),
                            ]
                        }),
                        ...deployData.map((r, i) => new TableRow({
                            children: [
                                makeCell(r.stt, 600, { align: AlignmentType.CENTER, fill: i % 2 ? C.rowAlt : C.white }),
                                makeCell(r.item, 4000, { fill: i % 2 ? C.rowAlt : C.white }),
                                makeCell(r.unit, 1400, { align: AlignmentType.CENTER, fill: i % 2 ? C.rowAlt : C.white }),
                                makeCell(r.qty, 1400, { align: AlignmentType.CENTER, fill: i % 2 ? C.rowAlt : C.white }),
                                makeCell(numFmt(r.rate), 2000, { align: AlignmentType.RIGHT, fill: i % 2 ? C.rowAlt : C.white }),
                                makeCell(numFmt(r.qty * r.rate), 2400, { align: AlignmentType.RIGHT, fill: i % 2 ? C.rowAlt : C.white, bold: true }),
                                makeCell(r.note, 3038, { fill: i % 2 ? C.rowAlt : C.white, size: 18, italic: true, color: C.muted }),
                            ]
                        })),
                        new TableRow({
                            children: [
                                makeCell('', 600, { fill: C.totalBg }),
                                makeCell('CỘNG CHI PHÍ TRIỂN KHAI & ĐÀO TẠO (C)', 4000, { fill: C.totalBg, bold: true, color: C.primary }),
                                makeCell('', 1400, { fill: C.totalBg }),
                                makeCell('', 1400, { fill: C.totalBg }),
                                makeCell('', 2000, { fill: C.totalBg }),
                                makeCell(numFmt(deployTotal), 2400, { align: AlignmentType.RIGHT, fill: C.totalBg, bold: true, color: C.primary, size: 21 }),
                                makeCell('', 3038, { fill: C.totalBg }),
                            ]
                        }),
                    ]
                }),

                // ══════════════════════════════════════
                // TỔNG HỢP
                // ══════════════════════════════════════
                spacer(200, 0),
                heading('BẢNG TỔNG HỢP CHI PHÍ XÂY DỰNG', HeadingLevel.HEADING_1),
                spacer(40, 0),

                new Table({
                    width: { size: CW, type: WidthType.DXA },
                    columnWidths: [800, 7038, 3500, 3500],
                    rows: [
                        new TableRow({
                            tableHeader: true,
                            children: [
                                headerCell('Mục', 800),
                                headerCell('Nội dung', 7038),
                                headerCell('Thành tiền (triệu)', 3500),
                                headerCell('Tỷ trọng', 3500),
                            ]
                        }),
                        // A
                        new TableRow({
                            children: [
                                makeCell('A', 800, { align: AlignmentType.CENTER, bold: true }),
                                makeCell(`Chi phí nhân công (${totalMM} man-month)`, 7038, { bold: true }),
                                makeCell(numFmt(laborTotal), 3500, { align: AlignmentType.RIGHT, bold: true }),
                                makeCell(`${(laborTotal / grandXD * 100).toFixed(1)}%`, 3500, { align: AlignmentType.CENTER }),
                            ]
                        }),
                        // B
                        new TableRow({
                            children: [
                                makeCell('B', 800, { align: AlignmentType.CENTER, bold: true, fill: C.rowAlt }),
                                makeCell('Chi phí hạ tầng & công nghệ (năm đầu)', 7038, { bold: true, fill: C.rowAlt }),
                                makeCell(numFmt(infraTotal), 3500, { align: AlignmentType.RIGHT, bold: true, fill: C.rowAlt }),
                                makeCell(`${(infraTotal / grandXD * 100).toFixed(1)}%`, 3500, { align: AlignmentType.CENTER, fill: C.rowAlt }),
                            ]
                        }),
                        // C
                        new TableRow({
                            children: [
                                makeCell('C', 800, { align: AlignmentType.CENTER, bold: true }),
                                makeCell('Chi phí triển khai & đào tạo', 7038, { bold: true }),
                                makeCell(numFmt(deployTotal), 3500, { align: AlignmentType.RIGHT, bold: true }),
                                makeCell(`${(deployTotal / grandXD * 100).toFixed(1)}%`, 3500, { align: AlignmentType.CENTER }),
                            ]
                        }),
                        // GRAND TOTAL
                        new TableRow({
                            children: [
                                makeCell('', 800, { fill: C.grandTotalBg }),
                                makeCell('TỔNG CHI PHÍ XÂY DỰNG (A + B + C)', 7038, { fill: C.grandTotalBg, bold: true, color: C.white, size: 22 }),
                                makeCell(numFmt(grandXD), 3500, { align: AlignmentType.RIGHT, fill: C.grandTotalBg, bold: true, color: C.white, size: 24 }),
                                makeCell('100%', 3500, { align: AlignmentType.CENTER, fill: C.grandTotalBg, bold: true, color: C.white }),
                            ]
                        }),
                    ]
                }),

                spacer(40, 0),
                bodyText(`Bằng chữ: ${spellOutMillion(grandXD)}`, { bold: true, size: 20 }),


                // ══════════════════════════════════════
                // D. VẬN HÀNH HÀNG THÁNG
                // ══════════════════════════════════════
                spacer(200, 0),
                heading('D. CHI PHÍ VẬN HÀNH HÀNG THÁNG (SAU TRIỂN KHAI)', HeadingLevel.HEADING_1),
                spacer(40, 0),

                new Table({
                    width: { size: CW, type: WidthType.DXA },
                    columnWidths: [600, 4000, 1400, 1400, 2000, 2400, 3038],
                    rows: [
                        new TableRow({
                            tableHeader: true,
                            children: [
                                headerCell('STT', 600),
                                headerCell('Hạng mục', 4000),
                                headerCell('Đơn vị', 1400),
                                headerCell('Số lượng', 1400),
                                headerCell('Đơn giá\n(triệu)', 2000),
                                headerCell('Thành tiền\n(triệu/tháng)', 2400),
                                headerCell('Ghi chú', 3038),
                            ]
                        }),
                        ...opsData.map((r, i) => new TableRow({
                            children: [
                                makeCell(r.stt, 600, { align: AlignmentType.CENTER, fill: i % 2 ? C.rowAlt : C.white }),
                                makeCell(r.item, 4000, { fill: i % 2 ? C.rowAlt : C.white }),
                                makeCell(r.unit, 1400, { align: AlignmentType.CENTER, fill: i % 2 ? C.rowAlt : C.white }),
                                makeCell(r.qty, 1400, { align: AlignmentType.CENTER, fill: i % 2 ? C.rowAlt : C.white }),
                                makeCell(numFmt(r.rate), 2000, { align: AlignmentType.RIGHT, fill: i % 2 ? C.rowAlt : C.white }),
                                makeCell(numFmt(r.qty * r.rate), 2400, { align: AlignmentType.RIGHT, fill: i % 2 ? C.rowAlt : C.white, bold: true }),
                                makeCell(r.note, 3038, { fill: i % 2 ? C.rowAlt : C.white, size: 18, italic: true, color: C.muted }),
                            ]
                        })),
                        new TableRow({
                            children: [
                                makeCell('', 600, { fill: C.grandTotalBg }),
                                makeCell('CHI PHÍ VẬN HÀNH HÀNG THÁNG (D)', 4000, { fill: C.grandTotalBg, bold: true, color: C.white, size: 21 }),
                                makeCell('', 1400, { fill: C.grandTotalBg }),
                                makeCell('', 1400, { fill: C.grandTotalBg }),
                                makeCell('', 2000, { fill: C.grandTotalBg }),
                                makeCell(numFmt(opsMonthly), 2400, { align: AlignmentType.RIGHT, fill: C.grandTotalBg, bold: true, color: C.white, size: 22 }),
                                makeCell(`~${numFmt(opsMonthly * 12)} triệu/năm`, 3038, { fill: C.grandTotalBg, color: C.white, bold: true, size: 18 }),
                            ]
                        }),
                    ]
                }),


                // ══════════════════════════════════════
                // TỔNG GIÁ TRỊ HỢP ĐỒNG
                // ══════════════════════════════════════
                spacer(200, 0),
                heading('TỔNG GIÁ TRỊ HỢP ĐỒNG ĐỀ XUẤT', HeadingLevel.HEADING_1),
                spacer(40, 0),

                new Table({
                    width: { size: CW, type: WidthType.DXA },
                    columnWidths: [800, 7038, 3500, 3500],
                    rows: [
                        new TableRow({
                            tableHeader: true,
                            children: [
                                headerCell('#', 800),
                                headerCell('Nội dung', 7038),
                                headerCell('Giá trị (triệu VNĐ)', 3500),
                                headerCell('Hình thức thanh toán', 3500),
                            ]
                        }),
                        new TableRow({
                            children: [
                                makeCell('1', 800, { align: AlignmentType.CENTER, bold: true }),
                                makeCell('Chi phí xây dựng phần mềm (A+B+C)', 7038, { bold: true }),
                                makeCell(numFmt(grandXD), 3500, { align: AlignmentType.RIGHT, bold: true }),
                                makeCell('Thanh toán 3 đợt theo giai đoạn', 3500),
                            ]
                        }),
                        new TableRow({
                            children: [
                                makeCell('2', 800, { align: AlignmentType.CENTER, bold: true, fill: C.rowAlt }),
                                makeCell('Chi phí vận hành hàng tháng (D)', 7038, { bold: true, fill: C.rowAlt }),
                                makeCell(`${numFmt(opsMonthly)}/tháng`, 3500, { align: AlignmentType.RIGHT, bold: true, fill: C.rowAlt }),
                                makeCell('Thanh toán theo tháng/quý', 3500, { fill: C.rowAlt }),
                            ]
                        }),
                    ]
                }),

                spacer(100, 0),

                // Payment schedule
                heading('TIẾN ĐỘ THANH TOÁN ĐỀ XUẤT', HeadingLevel.HEADING_2),
                spacer(40, 0),

                new Table({
                    width: { size: CW, type: WidthType.DXA },
                    columnWidths: [800, 5038, 3000, 3000, 3000],
                    rows: [
                        new TableRow({
                            tableHeader: true,
                            children: [
                                headerCell('Đợt', 800),
                                headerCell('Mốc thanh toán', 5038),
                                headerCell('Tỷ lệ', 3000),
                                headerCell('Số tiền (triệu)', 3000),
                                headerCell('Thời điểm', 3000),
                            ]
                        }),
                        new TableRow({
                            children: [
                                makeCell('1', 800, { align: AlignmentType.CENTER, bold: true }),
                                makeCell('Ký hợp đồng, bắt đầu triển khai', 5038),
                                makeCell('30%', 3000, { align: AlignmentType.CENTER, bold: true }),
                                makeCell(numFmt(Math.round(grandXD * 0.3)), 3000, { align: AlignmentType.RIGHT, bold: true }),
                                makeCell('Tháng 1', 3000, { align: AlignmentType.CENTER }),
                            ]
                        }),
                        new TableRow({
                            children: [
                                makeCell('2', 800, { align: AlignmentType.CENTER, bold: true, fill: C.rowAlt }),
                                makeCell('Nghiệm thu giai đoạn 1 (vận hành song song)', 5038, { fill: C.rowAlt }),
                                makeCell('40%', 3000, { align: AlignmentType.CENTER, bold: true, fill: C.rowAlt }),
                                makeCell(numFmt(Math.round(grandXD * 0.4)), 3000, { align: AlignmentType.RIGHT, bold: true, fill: C.rowAlt }),
                                makeCell('Tháng 2-3', 3000, { align: AlignmentType.CENTER, fill: C.rowAlt }),
                            ]
                        }),
                        new TableRow({
                            children: [
                                makeCell('3', 800, { align: AlignmentType.CENTER, bold: true }),
                                makeCell('Nghiệm thu hoàn thành, bàn giao chính thức', 5038),
                                makeCell('30%', 3000, { align: AlignmentType.CENTER, bold: true }),
                                makeCell(numFmt(Math.round(grandXD * 0.3)), 3000, { align: AlignmentType.RIGHT, bold: true }),
                                makeCell('Tháng 4', 3000, { align: AlignmentType.CENTER }),
                            ]
                        }),
                    ]
                }),

                // ══════════════════════════════════════
                // GHI CHÚ
                // ══════════════════════════════════════
                spacer(200, 0),
                heading('GHI CHÚ', HeadingLevel.HEADING_2),
                bodyText('1.  Đơn giá nhân công (man-month) đã bao gồm lương, bảo hiểm, thuế TNCN, chi phí quản lý.'),
                bodyText('2.  Chi phí hạ tầng cloud tính theo giá Supabase Pro Plan (USD→VND theo tỷ giá tham khảo).'),
                bodyText('3.  Chi phí vận hành bao gồm bảo trì phần mềm 0,5 man-month/tháng cho fix bug và cập nhật tính năng nhỏ.'),
                bodyText('4.  Chưa bao gồm thuế VAT (nếu áp dụng).'),
                bodyText('5.  Giá trị dự toán có thể điều chỉnh ±10% tùy theo yêu cầu thực tế.'),
                bodyText('6.  Bảo hành phần mềm: 12 tháng kể từ ngày nghiệm thu hoàn thành (miễn phí fix bug).'),

                spacer(300, 0),

                // Signature area
                new Table({
                    width: { size: CW, type: WidthType.DXA },
                    columnWidths: [Math.floor(CW / 2), Math.floor(CW / 2)],
                    rows: [new TableRow({
                        children: [
                            new TableCell({
                                width: { size: Math.floor(CW / 2), type: WidthType.DXA },
                                borders: { top: { style: BorderStyle.NONE, size: 0, color: C.white }, bottom: { style: BorderStyle.NONE, size: 0, color: C.white }, left: { style: BorderStyle.NONE, size: 0, color: C.white }, right: { style: BorderStyle.NONE, size: 0, color: C.white } },
                                children: [
                                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'BÊN A — CHỦ ĐẦU TƯ', bold: true, font: 'Arial', size: 20, color: C.primary })] }),
                                    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 40 }, children: [new TextRun({ text: '(Ký, ghi rõ họ tên)', font: 'Arial', size: 18, color: C.muted, italics: true })] }),
                                ]
                            }),
                            new TableCell({
                                width: { size: Math.floor(CW / 2), type: WidthType.DXA },
                                borders: { top: { style: BorderStyle.NONE, size: 0, color: C.white }, bottom: { style: BorderStyle.NONE, size: 0, color: C.white }, left: { style: BorderStyle.NONE, size: 0, color: C.white }, right: { style: BorderStyle.NONE, size: 0, color: C.white } },
                                children: [
                                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'BÊN B — ĐƠN VỊ THỰC HIỆN', bold: true, font: 'Arial', size: 20, color: C.primary })] }),
                                    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 40 }, children: [new TextRun({ text: '(Ký, ghi rõ họ tên)', font: 'Arial', size: 18, color: C.muted, italics: true })] }),
                                ]
                            }),
                        ]
                    })]
                }),

            ]
        }]
    });

    const buffer = await Packer.toBuffer(doc);
    const outPath = path.join(__dirname, '..', 'resources', 'DuToan_ChiPhi_QLDA.docx');
    fs.writeFileSync(outPath, buffer);
    console.log(`✅ Generated: ${outPath}`);
    console.log(`   Size: ${(buffer.length / 1024).toFixed(1)} KB`);
    console.log(`\n📊 TỔNG KẾT:`);
    console.log(`   A. Nhân công:    ${numFmt(laborTotal)} triệu (${totalMM} man-month)`);
    console.log(`   B. Hạ tầng:      ${numFmt(infraTotal)} triệu (năm đầu)`);
    console.log(`   C. Triển khai:   ${numFmt(deployTotal)} triệu`);
    console.log(`   ─────────────────────────`);
    console.log(`   TỔNG XÂY DỰNG:  ${numFmt(grandXD)} triệu`);
    console.log(`   VẬN HÀNH:       ${numFmt(opsMonthly)} triệu/tháng (~${numFmt(opsMonthly * 12)} triệu/năm)`);
}

function spellOutMillion(n) {
    // Simple Vietnamese number to text for millions
    const hundreds = Math.floor(n);
    if (hundreds < 1000) return `${hundreds} triệu đồng`;
    const s = String(hundreds);
    // Special handling omitted for simplicity
    return `${numFmt(hundreds)} triệu đồng`;
}

build().catch(console.error);
