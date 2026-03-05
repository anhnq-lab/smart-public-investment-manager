/**
 * Generate Cost Estimate Excel — CIC.QLDA v4.0
 * Có công thức Excel để chỉnh sửa
 * 2 nhân sự: 1 PM + 1 Dev (kết hợp AI)
 */
const ExcelJS = require('exceljs');
const path = require('path');

const PRIMARY = '1B3A5C';
const ACCENT = '2D8B8B';
const HEADER_BG = '1B3A5C';
const HEADER_FG = 'FFFFFF';
const TOTAL_BG = 'D6E8F0';
const GRAND_BG = '1B3A5C';
const ALT_ROW = 'F5F8FA';
const SECTION_BG = 'EAF4F4';
const BC = { argb: 'FFD0D8E0' };

const fn = (o = {}) => ({ name: 'Arial', size: o.size || 10, bold: o.bold || false, italic: o.italic || false, color: o.color ? { argb: `FF${o.color}` } : undefined });
const fl = (c) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${c}` } });
const bd = { top: { style: 'thin', color: BC }, bottom: { style: 'thin', color: BC }, left: { style: 'thin', color: BC }, right: { style: 'thin', color: BC } };

function styleHeader(row, cols) {
    for (let c = 1; c <= cols; c++) {
        const cell = row.getCell(c);
        cell.font = fn({ bold: true, size: 10, color: HEADER_FG });
        cell.fill = fl(HEADER_BG);
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = bd;
    }
    row.height = 32;
}

function styleData(row, cols, alt = false) {
    for (let c = 1; c <= cols; c++) {
        const cell = row.getCell(c);
        if (!cell.font || !cell.font.name) cell.font = fn({ size: 10 });
        if (alt && !cell.fill) cell.fill = fl(ALT_ROW);
        cell.border = bd;
        if (!cell.alignment) cell.alignment = { vertical: 'middle', wrapText: true };
    }
}

function styleTotal(row, cols, isGrand = false) {
    for (let c = 1; c <= cols; c++) {
        const cell = row.getCell(c);
        cell.font = fn({ bold: true, size: isGrand ? 11 : 10, color: isGrand ? HEADER_FG : PRIMARY });
        cell.fill = fl(isGrand ? GRAND_BG : TOTAL_BG);
        cell.border = bd;
        cell.alignment = { vertical: 'middle', wrapText: true };
    }
    if (isGrand) row.height = 28;
}

function sectionTitle(ws, r, text, cols) {
    ws.mergeCells(`A${r}:H${r}`);
    const c = ws.getCell(`A${r}`);
    c.value = text;
    c.font = fn({ bold: true, size: 11, color: PRIMARY });
    c.fill = fl(SECTION_BG);
    c.border = bd;
    for (let i = 2; i <= cols; i++) { ws.getCell(r, i).border = bd; ws.getCell(r, i).fill = fl(SECTION_BG); }
    ws.getRow(r).height = 24;
}

async function build() {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'CIC';
    wb.created = new Date();

    const ws = wb.addWorksheet('Dự toán chi phí', {
        pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    });

    // Columns: A=STT, B=Nội dung, C=Đơn vị, D=Số lượng, E=Man-month, F=Đơn giá, G=Thành tiền, H=Ghi chú
    ws.columns = [
        { width: 6 },   // A
        { width: 42 },  // B
        { width: 10 },  // C
        { width: 10 },  // D: Số người / SL
        { width: 12 },  // E: Man-month
        { width: 14 },  // F: Đơn giá
        { width: 16 },  // G: Thành tiền
        { width: 35 },  // H: Ghi chú
    ];

    const COLS = 8;
    let r = 1;

    // ── TITLE ──
    ws.mergeCells(`A${r}:H${r}`);
    ws.getCell(`A${r}`).value = 'DỰ TOÁN CHI PHÍ PHẦN MỀM QUẢN LÝ DỰ ÁN ĐẦU TƯ CÔNG THÔNG MINH';
    ws.getCell(`A${r}`).font = fn({ bold: true, size: 14, color: PRIMARY });
    ws.getCell(`A${r}`).alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(r).height = 30;
    r++;

    ws.mergeCells(`A${r}:H${r}`);
    ws.getCell(`A${r}`).value = 'CIC.QLDA v4.0 — Tích hợp AI & BIM 3D  |  Đơn vị: Triệu VNĐ';
    ws.getCell(`A${r}`).font = fn({ size: 10, italic: true, color: ACCENT });
    ws.getCell(`A${r}`).alignment = { horizontal: 'center' };
    r++;

    ws.mergeCells(`A${r}:H${r}`);
    ws.getCell(`A${r}`).value = 'Ngày lập: 05/03/2026  |  Thời gian: 4 tháng  |  Nhân sự: 1 PM + 1 Dev + AI Assistant';
    ws.getCell(`A${r}`).font = fn({ size: 9, italic: true, color: '666666' });
    ws.getCell(`A${r}`).alignment = { horizontal: 'center' };
    r += 2;

    // ═══════════════════════════════════
    // A. NHÂN CÔNG
    // ═══════════════════════════════════
    const secA = r;
    sectionTitle(ws, r, 'A. CHI PHÍ NHÂN CÔNG (1 PM + 1 Dev, kết hợp AI Coding Assistant)', COLS);
    r++;

    // Header
    const hA = ws.getRow(r);
    ['STT', 'Vị trí / Vai trò', 'Số người', 'Man-month', '', 'Đơn giá\n(triệu/MM)', 'Thành tiền\n(triệu)', 'Ghi chú'].forEach((h, i) => hA.getCell(i + 1).value = h);
    styleHeader(hA, COLS);
    r++;

    // Labor data rows
    const laborRows = [
        { stt: 1, role: 'Project Manager (PM)', qty: 1, mm: 4, rate: 35, note: 'Quản lý dự án, phân tích nghiệp vụ, thiết kế UI/UX, kiểm thử' },
        { stt: 2, role: 'Developer (Full-stack + AI + BIM)', qty: 1, mm: 4, rate: 32, note: 'React/TS Frontend, Supabase Backend, AI, BIM 3D' },
        { stt: 3, role: 'AI Coding Assistant (Gemini, Claude)', qty: 0, mm: 0, rate: 0, note: 'Hỗ trợ viết code, review, test — năng suất ×3-5 (miễn phí nhân công)' },
    ];

    const laborStartRow = r;
    laborRows.forEach((d, i) => {
        const row = ws.getRow(r);

        row.getCell(1).value = d.stt;
        row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

        row.getCell(2).value = d.role;

        if (d.qty > 0) {
            row.getCell(3).value = d.qty;
            row.getCell(4).value = d.mm;
            row.getCell(6).value = d.rate;
            // FORMULA: G = E × F (man-month × đơn giá)
            row.getCell(7).value = { formula: `E${r}*F${r}`, result: d.mm * d.rate };
            row.getCell(7).font = fn({ bold: true, size: 10 });
        } else {
            row.getCell(3).value = '—';
            row.getCell(4).value = '—';
            row.getCell(6).value = '—';
            row.getCell(7).value = '—';
        }

        row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };
        row.getCell(6).numFmt = '#,##0';
        row.getCell(7).alignment = { horizontal: 'right', vertical: 'middle' };
        row.getCell(7).numFmt = '#,##0';

        row.getCell(8).value = d.note;
        row.getCell(8).font = fn({ size: 9, italic: true, color: '666666' });

        styleData(row, COLS, i % 2 === 1);
        r++;
    });
    const laborEndRow = r - 1;

    // Labor total with FORMULAS
    const lTotal = ws.getRow(r);
    lTotal.getCell(1).value = '';
    lTotal.getCell(2).value = 'CỘNG CHI PHÍ NHÂN CÔNG (A)';
    // FORMULA: SUM of qty
    lTotal.getCell(3).value = { formula: `SUM(C${laborStartRow}:C${laborStartRow + 1})`, result: 2 };
    lTotal.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
    // FORMULA: SUM of man-months
    lTotal.getCell(4).value = { formula: `SUM(E${laborStartRow}:E${laborStartRow + 1})`, result: 8 };
    lTotal.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
    lTotal.getCell(6).value = '';
    // FORMULA: SUM of thành tiền
    lTotal.getCell(7).value = { formula: `SUM(G${laborStartRow}:G${laborEndRow})`, result: 268 };
    lTotal.getCell(7).alignment = { horizontal: 'right', vertical: 'middle' };
    lTotal.getCell(7).numFmt = '#,##0';
    lTotal.getCell(8).value = '';
    styleTotal(lTotal, COLS);
    const laborTotalRow = r;
    r += 2;

    // ═══════════════════════════════════
    // B. HẠ TẦNG & CÔNG NGHỆ
    // ═══════════════════════════════════
    sectionTitle(ws, r, 'B. CHI PHÍ HẠ TẦNG & CÔNG NGHỆ (NĂM ĐẦU)', COLS);
    r++;

    const hB = ws.getRow(r);
    ['STT', 'Hạng mục', 'Đơn vị', 'Số lượng', '', 'Đơn giá\n(triệu)', 'Thành tiền\n(triệu)', 'Ghi chú'].forEach((h, i) => hB.getCell(i + 1).value = h);
    styleHeader(hB, COLS);
    r++;

    const infraItems = [
        { stt: 1, item: 'Supabase Cloud (Free → Pro khi cần)', unit: 'tháng', qty: 12, rate: 0.625, note: 'Free tier ban đầu; Pro $25/th ≈ 625k VNĐ' },
        { stt: 2, item: 'Google Gemini API (AI)', unit: 'tháng', qty: 12, rate: 0.5, note: '500k/tháng — Function Calling, 10 AI services' },
        { stt: 3, item: 'Domain + SSL Certificate', unit: 'năm', qty: 1, rate: 1.0, note: 'Domain .vn + SSL (Let\'s Encrypt miễn phí)' },
        { stt: 4, item: 'CDN & Hosting (Vercel/Cloudflare)', unit: 'tháng', qty: 12, rate: 0, note: 'Free tier — đủ cho production' },
        { stt: 5, item: 'Backup & Disaster Recovery', unit: 'tháng', qty: 12, rate: 0, note: 'Đã gộp trong Supabase plan' },
    ];

    const infraStartRow = r;
    infraItems.forEach((d, i) => {
        const row = ws.getRow(r);
        row.getCell(1).value = d.stt;
        row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(2).value = d.item;
        row.getCell(3).value = d.unit;
        row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(4).value = d.qty;
        row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(6).value = d.rate;
        row.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };
        row.getCell(6).numFmt = '#,##0.000';
        // FORMULA: G = D × F
        row.getCell(7).value = { formula: `D${r}*F${r}`, result: d.qty * d.rate };
        row.getCell(7).alignment = { horizontal: 'right', vertical: 'middle' };
        row.getCell(7).numFmt = '#,##0.000';
        row.getCell(7).font = fn({ bold: true, size: 10 });
        row.getCell(8).value = d.note;
        row.getCell(8).font = fn({ size: 9, italic: true, color: '666666' });
        styleData(row, COLS, i % 2 === 1);
        r++;
    });
    const infraEndRow = r - 1;

    const iTotalR = ws.getRow(r);
    iTotalR.getCell(1).value = '';
    iTotalR.getCell(2).value = 'CỘNG CHI PHÍ HẠ TẦNG NĂM ĐẦU (B)';
    iTotalR.getCell(7).value = { formula: `SUM(G${infraStartRow}:G${infraEndRow})`, result: 14.5 };
    iTotalR.getCell(7).alignment = { horizontal: 'right', vertical: 'middle' };
    iTotalR.getCell(7).numFmt = '#,##0.0';
    styleTotal(iTotalR, COLS);
    const infraTotalRow = r;
    r += 2;

    // ═══════════════════════════════════
    // C. TRIỂN KHAI & ĐÀO TẠO
    // ═══════════════════════════════════
    sectionTitle(ws, r, 'C. CHI PHÍ TRIỂN KHAI & ĐÀO TẠO', COLS);
    r++;

    const hC = ws.getRow(r);
    ['STT', 'Hạng mục', 'Đơn vị', 'Số lượng', '', 'Đơn giá\n(triệu)', 'Thành tiền\n(triệu)', 'Ghi chú'].forEach((h, i) => hC.getCell(i + 1).value = h);
    styleHeader(hC, COLS);
    r++;

    const deployItems = [
        { stt: 1, item: 'Cài đặt, cấu hình hệ thống', unit: 'gói', qty: 1, rate: 5, note: 'Setup môi trường, import dữ liệu ban đầu' },
        { stt: 2, item: 'Đào tạo người dùng (2 buổi)', unit: 'buổi', qty: 2, rate: 2, note: 'Hướng dẫn sử dụng toàn bộ chức năng' },
        { stt: 3, item: 'Tài liệu hướng dẫn sử dụng', unit: 'bộ', qty: 1, rate: 3, note: 'User Guide + Video hướng dẫn' },
        { stt: 4, item: 'Hỗ trợ vận hành (1 tháng)', unit: 'tháng', qty: 1, rate: 5, note: 'Remote support, fix bug nhanh, hotline' },
    ];

    const deployStartRow = r;
    deployItems.forEach((d, i) => {
        const row = ws.getRow(r);
        row.getCell(1).value = d.stt;
        row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(2).value = d.item;
        row.getCell(3).value = d.unit;
        row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(4).value = d.qty;
        row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(6).value = d.rate;
        row.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };
        row.getCell(6).numFmt = '#,##0';
        // FORMULA: G = D × F
        row.getCell(7).value = { formula: `D${r}*F${r}`, result: d.qty * d.rate };
        row.getCell(7).alignment = { horizontal: 'right', vertical: 'middle' };
        row.getCell(7).numFmt = '#,##0';
        row.getCell(7).font = fn({ bold: true, size: 10 });
        row.getCell(8).value = d.note;
        row.getCell(8).font = fn({ size: 9, italic: true, color: '666666' });
        styleData(row, COLS, i % 2 === 1);
        r++;
    });
    const deployEndRow = r - 1;

    const dTotalR = ws.getRow(r);
    dTotalR.getCell(1).value = '';
    dTotalR.getCell(2).value = 'CỘNG CHI PHÍ TRIỂN KHAI & ĐÀO TẠO (C)';
    dTotalR.getCell(7).value = { formula: `SUM(G${deployStartRow}:G${deployEndRow})`, result: 17 };
    dTotalR.getCell(7).alignment = { horizontal: 'right', vertical: 'middle' };
    dTotalR.getCell(7).numFmt = '#,##0';
    styleTotal(dTotalR, COLS);
    const deployTotalRow = r;
    r += 2;

    // ═══════════════════════════════════
    // TỔNG HỢP  (all FORMULAS)
    // ═══════════════════════════════════
    sectionTitle(ws, r, 'BẢNG TỔNG HỢP CHI PHÍ XÂY DỰNG', COLS);
    r++;

    const sumH = ws.getRow(r);
    ['Mục', 'Nội dung', '', '', '', '', 'Thành tiền\n(triệu)', 'Tỷ trọng'].forEach((h, i) => sumH.getCell(i + 1).value = h);
    styleHeader(sumH, COLS);
    ws.mergeCells(`B${r}:F${r}`);
    r++;

    // Row A — FORMULA ref to labor total
    const sA = ws.getRow(r);
    sA.getCell(1).value = 'A';
    sA.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    sA.getCell(1).font = fn({ bold: true });
    sA.getCell(2).value = 'Chi phí nhân công (1 PM + 1 Dev × 4 tháng)';
    sA.getCell(2).font = fn({ bold: true });
    ws.mergeCells(`B${r}:F${r}`);
    sA.getCell(7).value = { formula: `G${laborTotalRow}`, result: 268 };
    sA.getCell(7).alignment = { horizontal: 'right', vertical: 'middle' };
    sA.getCell(7).numFmt = '#,##0';
    sA.getCell(7).font = fn({ bold: true });
    // FORMULA: tỷ trọng = G/Grand*100
    const grandTotalRowNum = r + 3; // will be 3 rows below
    sA.getCell(8).value = { formula: `TEXT(G${r}/G${grandTotalRowNum},"0.0%")`, result: '89.5%' };
    sA.getCell(8).alignment = { horizontal: 'center', vertical: 'middle' };
    styleData(sA, COLS);
    const sumRowA = r;
    r++;

    // Row B
    const sB = ws.getRow(r);
    sB.getCell(1).value = 'B';
    sB.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    sB.getCell(1).font = fn({ bold: true });
    sB.getCell(2).value = 'Chi phí hạ tầng & công nghệ (năm đầu)';
    sB.getCell(2).font = fn({ bold: true });
    ws.mergeCells(`B${r}:F${r}`);
    sB.getCell(7).value = { formula: `G${infraTotalRow}`, result: 14.5 };
    sB.getCell(7).alignment = { horizontal: 'right', vertical: 'middle' };
    sB.getCell(7).numFmt = '#,##0.0';
    sB.getCell(7).font = fn({ bold: true });
    sB.getCell(8).value = { formula: `TEXT(G${r}/G${grandTotalRowNum},"0.0%")`, result: '4.8%' };
    sB.getCell(8).alignment = { horizontal: 'center', vertical: 'middle' };
    styleData(sB, COLS, true);
    const sumRowB = r;
    r++;

    // Row C
    const sC = ws.getRow(r);
    sC.getCell(1).value = 'C';
    sC.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    sC.getCell(1).font = fn({ bold: true });
    sC.getCell(2).value = 'Chi phí triển khai & đào tạo';
    sC.getCell(2).font = fn({ bold: true });
    ws.mergeCells(`B${r}:F${r}`);
    sC.getCell(7).value = { formula: `G${deployTotalRow}`, result: 17 };
    sC.getCell(7).alignment = { horizontal: 'right', vertical: 'middle' };
    sC.getCell(7).numFmt = '#,##0';
    sC.getCell(7).font = fn({ bold: true });
    sC.getCell(8).value = { formula: `TEXT(G${r}/G${grandTotalRowNum},"0.0%")`, result: '5.7%' };
    sC.getCell(8).alignment = { horizontal: 'center', vertical: 'middle' };
    styleData(sC, COLS);
    const sumRowC = r;
    r++;

    // Grand Total — FORMULA: SUM(A+B+C)
    const grandRow = ws.getRow(r);
    grandRow.getCell(1).value = '';
    grandRow.getCell(2).value = 'TỔNG CHI PHÍ XÂY DỰNG (A + B + C)';
    ws.mergeCells(`B${r}:F${r}`);
    grandRow.getCell(7).value = { formula: `G${sumRowA}+G${sumRowB}+G${sumRowC}`, result: 299.5 };
    grandRow.getCell(7).alignment = { horizontal: 'right', vertical: 'middle' };
    grandRow.getCell(7).numFmt = '#,##0.0';
    grandRow.getCell(8).value = '100%';
    grandRow.getCell(8).alignment = { horizontal: 'center', vertical: 'middle' };
    styleTotal(grandRow, COLS, true);
    const grandTotalRow = r;
    r += 2;

    // ═══════════════════════════════════
    // D. VẬN HÀNH HÀNG THÁNG
    // ═══════════════════════════════════
    sectionTitle(ws, r, 'D. CHI PHÍ VẬN HÀNH HÀNG THÁNG (SAU TRIỂN KHAI)', COLS);
    r++;

    const hD = ws.getRow(r);
    ['STT', 'Hạng mục', 'Đơn vị', 'SL', '', 'Đơn giá\n(triệu)', 'Thành tiền\n(triệu/tháng)', 'Ghi chú'].forEach((h, i) => hD.getCell(i + 1).value = h);
    styleHeader(hD, COLS);
    r++;

    const opsItems = [
        { stt: 1, item: 'Supabase Cloud', unit: 'tháng', qty: 1, rate: 0.625, note: 'Database, Auth, Storage ($25/th ≈ 625k)' },
        { stt: 2, item: 'Google Gemini API', unit: 'tháng', qty: 1, rate: 0.5, note: '500k/tháng — Function Calling' },
        { stt: 3, item: 'Hosting & CDN', unit: 'tháng', qty: 1, rate: 0, note: 'Vercel/Cloudflare — Free tier' },
        { stt: 4, item: 'Bảo trì, cập nhật phần mềm', unit: 'tháng', qty: 1, rate: 2, note: 'Fix bug, cập nhật tính năng, hỗ trợ KT' },
    ];

    const opsStartRow = r;
    opsItems.forEach((d, i) => {
        const row = ws.getRow(r);
        row.getCell(1).value = d.stt;
        row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(2).value = d.item;
        row.getCell(3).value = d.unit;
        row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(4).value = d.qty;
        row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(6).value = d.rate;
        row.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };
        row.getCell(6).numFmt = '#,##0.000';
        // FORMULA: G = D × F
        row.getCell(7).value = { formula: `D${r}*F${r}`, result: d.qty * d.rate };
        row.getCell(7).alignment = { horizontal: 'right', vertical: 'middle' };
        row.getCell(7).numFmt = '#,##0.000';
        row.getCell(7).font = fn({ bold: true, size: 10 });
        row.getCell(8).value = d.note;
        row.getCell(8).font = fn({ size: 9, italic: true, color: '666666' });
        styleData(row, COLS, i % 2 === 1);
        r++;
    });
    const opsEndRow = r - 1;

    const opsTotalR = ws.getRow(r);
    opsTotalR.getCell(1).value = '';
    opsTotalR.getCell(2).value = 'CHI PHÍ VẬN HÀNH HÀNG THÁNG (D)';
    opsTotalR.getCell(7).value = { formula: `SUM(G${opsStartRow}:G${opsEndRow})`, result: 3.125 };
    opsTotalR.getCell(7).alignment = { horizontal: 'right', vertical: 'middle' };
    opsTotalR.getCell(7).numFmt = '#,##0.000';
    // FORMULA: chi phí năm = D × 12
    opsTotalR.getCell(8).value = { formula: `"~"&TEXT(G${r}*12,"#,##0.0")&" triệu/năm"`, result: '~37,5 triệu/năm' };
    styleTotal(opsTotalR, COLS, true);
    const opsTotalRowNum = r;
    r += 2;

    // ═══════════════════════════════════
    // TIẾN ĐỘ THANH TOÁN
    // ═══════════════════════════════════
    sectionTitle(ws, r, 'TIẾN ĐỘ THANH TOÁN', COLS);
    r++;

    const payH = ws.getRow(r);
    ['Đợt', 'Mốc thanh toán', '', '', 'Tỷ lệ', '', 'Số tiền (triệu)', 'Thời điểm'].forEach((h, i) => payH.getCell(i + 1).value = h);
    styleHeader(payH, COLS);
    ws.mergeCells(`B${r}:D${r}`);
    r++;

    const payments = [
        { dot: 1, milestone: 'Ký hợp đồng, bắt đầu triển khai', pct: 0.3, time: 'Tháng 1' },
        { dot: 2, milestone: 'Nghiệm thu GĐ 1 (vận hành song song)', pct: 0.4, time: 'Tháng 2-3' },
        { dot: 3, milestone: 'Nghiệm thu hoàn thành, bàn giao', pct: 0.3, time: 'Tháng 4' },
    ];

    payments.forEach((p, i) => {
        const row = ws.getRow(r);
        row.getCell(1).value = p.dot;
        row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(1).font = fn({ bold: true });
        row.getCell(2).value = p.milestone;
        ws.mergeCells(`B${r}:D${r}`);
        row.getCell(5).value = p.pct;
        row.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(5).font = fn({ bold: true });
        row.getCell(5).numFmt = '0%';
        // FORMULA: Số tiền = Tỷ lệ × Tổng XD
        row.getCell(7).value = { formula: `ROUND(E${r}*G${grandTotalRow},1)`, result: Math.round(299.5 * p.pct * 10) / 10 };
        row.getCell(7).alignment = { horizontal: 'right', vertical: 'middle' };
        row.getCell(7).numFmt = '#,##0.0';
        row.getCell(7).font = fn({ bold: true });
        row.getCell(8).value = p.time;
        row.getCell(8).alignment = { horizontal: 'center', vertical: 'middle' };
        styleData(row, COLS, i % 2 === 1);
        r++;
    });

    r += 2;

    // ═══════════════════════════════════
    // GHI CHÚ
    // ═══════════════════════════════════
    ws.mergeCells(`A${r}:H${r}`);
    ws.getCell(`A${r}`).value = 'GHI CHÚ';
    ws.getCell(`A${r}`).font = fn({ bold: true, size: 11, color: PRIMARY });
    r++;

    const notes = [
        '1. Đơn giá man-month đã bao gồm lương, bảo hiểm, thuế TNCN, chi phí quản lý.',
        '2. Sử dụng AI Coding Assistant (Gemini, Claude) — tăng năng suất ×3-5 lần, 2 người đủ làm toàn bộ.',
        '3. Supabase Free tier đủ dùng giai đoạn đầu; nâng Pro ($25/tháng) khi cần scale.',
        '4. Gemini API: 500.000 VNĐ/tháng — đủ cho ~500 queries/ngày.',
        '5. Hosting miễn phí (Vercel / Cloudflare Pages Free tier).',
        '6. Chưa bao gồm thuế VAT (nếu áp dụng). Giá trị có thể điều chỉnh ±10%.',
        '7. Bảo hành phần mềm: 12 tháng (miễn phí fix bug).',
        '8. Các ô màu xanh (Thành tiền) đều có CÔNG THỨC — chỉ cần sửa Đơn giá hoặc Số lượng.',
    ];

    notes.forEach(note => {
        ws.mergeCells(`A${r}:H${r}`);
        ws.getCell(`A${r}`).value = note;
        ws.getCell(`A${r}`).font = fn({ size: 9, color: '555555' });
        ws.getCell(`A${r}`).alignment = { wrapText: true };
        r++;
    });

    r += 2;

    // Signature
    ws.mergeCells(`A${r}:D${r}`);
    ws.getCell(`A${r}`).value = 'BÊN A — CHỦ ĐẦU TƯ';
    ws.getCell(`A${r}`).font = fn({ bold: true, size: 10, color: PRIMARY });
    ws.getCell(`A${r}`).alignment = { horizontal: 'center' };
    ws.mergeCells(`E${r}:H${r}`);
    ws.getCell(`E${r}`).value = 'BÊN B — ĐƠN VỊ THỰC HIỆN';
    ws.getCell(`E${r}`).font = fn({ bold: true, size: 10, color: PRIMARY });
    ws.getCell(`E${r}`).alignment = { horizontal: 'center' };
    r++;
    ws.mergeCells(`A${r}:D${r}`);
    ws.getCell(`A${r}`).value = '(Ký, ghi rõ họ tên)';
    ws.getCell(`A${r}`).font = fn({ size: 9, italic: true, color: '999999' });
    ws.getCell(`A${r}`).alignment = { horizontal: 'center' };
    ws.mergeCells(`E${r}:H${r}`);
    ws.getCell(`E${r}`).value = '(Ký, ghi rõ họ tên)';
    ws.getCell(`E${r}`).font = fn({ size: 9, italic: true, color: '999999' });
    ws.getCell(`E${r}`).alignment = { horizontal: 'center' };

    // ══════════════════
    // SAVE
    // ══════════════════
    const outPath = path.join(__dirname, '..', 'resources', 'DuToan_ChiPhi_QLDA.xlsx');
    await wb.xlsx.writeFile(outPath);

    const stats = require('fs').statSync(outPath);
    const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n);
    console.log(`✅ Generated: ${outPath}`);
    console.log(`   Size: ${(stats.size / 1024).toFixed(1)} KB`);
    console.log(`\n📊 TỔNG KẾT (tất cả ô Thành tiền đều có CÔNG THỨC):`);
    console.log(`   A. Nhân công: 1 PM (4MM×35tr) + 1 Dev (4MM×32tr) = ${fmt(268)} triệu`);
    console.log(`   B. Hạ tầng:   Supabase + Gemini + Domain = ${fmt(14.5)} triệu/năm`);
    console.log(`   C. Triển khai: Cài đặt + Đào tạo + Tài liệu = ${fmt(17)} triệu`);
    console.log(`   ─────────────────────────`);
    console.log(`   TỔNG XÂY DỰNG:  ${fmt(299.5)} triệu  (SUM formula)`);
    console.log(`   VẬN HÀNH:       ${fmt(3.125)} triệu/tháng (SUM formula)`);
    console.log(`\n💡 Sửa đơn giá/số lượng → Thành tiền tự động cập nhật!`);
}

build().catch(console.error);
