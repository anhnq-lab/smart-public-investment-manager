/**
 * Generate Demo Plan v2 — Kế hoạch Demo QLDA
 * Cấu trúc mới: Slide thuyết trình (5-8 slides) → Demo trực tiếp
 */
const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
    ShadingType, PageBreak, PageNumber, TabStopType, TabStopPosition
} = require('docx');
const fs = require('fs');
const path = require('path');

// ── Color Palette ──
const C = {
    primary: '1B3A5C',  // Deep navy
    accent: '2D8B8B',  // Teal
    accent2: 'E8792B',  // Orange accent
    dark: '1A1A1A',
    text: '333333',
    muted: '666666',
    light: 'F5F7FA',
    white: 'FFFFFF',
    headerBg: '1B3A5C',
    headerBg2: '2D8B8B',
    rowAlt: 'F0F6FA',
    border: 'D0D8E0',
    success: '27AE60',
    warning: 'E8792B',
    danger: 'C0392B',
};

// ── Helpers ──
const border = (color = C.border) => ({ style: BorderStyle.SINGLE, size: 1, color });
const borders = (color) => ({ top: border(color), bottom: border(color), left: border(color), right: border(color) });
const noBorders = () => {
    const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
    return { top: none, bottom: none, left: none, right: none };
};
const cellMargins = { top: 60, bottom: 60, left: 100, right: 100 };

const PAGE_W = 11906; // A4 width DXA
const MARGIN = 1134;  // ~2cm
const CONTENT_W = PAGE_W - 2 * MARGIN; // ~9638

function spacer(before = 100, after = 100) {
    return new Paragraph({ spacing: { before, after }, children: [] });
}

function heading(text, level = HeadingLevel.HEADING_1) {
    return new Paragraph({
        heading: level,
        spacing: { before: level === HeadingLevel.HEADING_1 ? 300 : 200, after: 120 },
        children: [new TextRun({ text, bold: true, font: 'Arial', size: level === HeadingLevel.HEADING_1 ? 30 : 26, color: C.primary })]
    });
}

function heading3(text) {
    return new Paragraph({
        spacing: { before: 160, after: 80 },
        children: [new TextRun({ text, bold: true, font: 'Arial', size: 22, color: C.accent })]
    });
}

function bodyText(text, opts = {}) {
    return new Paragraph({
        spacing: { before: 40, after: 40 },
        alignment: opts.align || AlignmentType.JUSTIFIED,
        children: [new TextRun({ text, font: 'Arial', size: 21, color: opts.color || C.text, ...(opts.bold ? { bold: true } : {}), ...(opts.italic ? { italic: true } : {}) })]
    });
}

function richParagraph(runs, opts = {}) {
    return new Paragraph({
        spacing: { before: opts.before || 40, after: opts.after || 40 },
        alignment: opts.align || AlignmentType.LEFT,
        children: runs.map(r => new TextRun({ font: 'Arial', size: 21, color: C.text, ...r }))
    });
}

function headerRow(cells, widths) {
    return new TableRow({
        tableHeader: true,
        children: cells.map((text, i) => new TableCell({
            width: { size: widths[i], type: WidthType.DXA },
            borders: borders(C.primary),
            shading: { fill: C.headerBg, type: ShadingType.CLEAR },
            margins: cellMargins,
            verticalAlign: 'center',
            children: [new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text, bold: true, font: 'Arial', size: 20, color: C.white })]
            })]
        }))
    });
}

function dataRow(cells, widths, isAlt = false, opts = []) {
    return new TableRow({
        children: cells.map((text, i) => {
            const o = opts[i] || {};
            return new TableCell({
                width: { size: widths[i], type: WidthType.DXA },
                borders: borders(C.border),
                shading: { fill: isAlt ? C.rowAlt : C.white, type: ShadingType.CLEAR },
                margins: cellMargins,
                verticalAlign: 'center',
                children: [new Paragraph({
                    alignment: o.align || AlignmentType.LEFT,
                    children: [new TextRun({ text: String(text), font: 'Arial', size: 20, color: o.color || C.text, bold: o.bold || false })]
                })]
            });
        })
    });
}

function makeTable(headers, rows, widths) {
    return new Table({
        width: { size: CONTENT_W, type: WidthType.DXA },
        columnWidths: widths,
        rows: [
            headerRow(headers, widths),
            ...rows.map((row, i) => dataRow(row, widths, i % 2 === 1))
        ]
    });
}

// ── Accent divider ──
function divider() {
    return new Table({
        width: { size: CONTENT_W, type: WidthType.DXA },
        columnWidths: [CONTENT_W],
        rows: [new TableRow({
            children: [new TableCell({
                width: { size: CONTENT_W, type: WidthType.DXA },
                borders: {
                    top: { style: BorderStyle.SINGLE, size: 6, color: C.accent },
                    bottom: { style: BorderStyle.NONE, size: 0, color: C.white },
                    left: { style: BorderStyle.NONE, size: 0, color: C.white },
                    right: { style: BorderStyle.NONE, size: 0, color: C.white },
                },
                children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: [] })]
            })]
        })]
    });
}

// ── Info box ──
function infoBox(label, value) {
    const boxW = Math.floor(CONTENT_W / 3);
    return new TableCell({
        width: { size: boxW, type: WidthType.DXA },
        borders: borders(C.accent),
        shading: { fill: 'EAF4F4', type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: label, font: 'Arial', size: 18, color: C.muted })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 40 }, children: [new TextRun({ text: value, font: 'Arial', size: 22, bold: true, color: C.primary })] }),
        ]
    });
}

// ══════════════════════════════════════════
// BUILD DOCUMENT
// ══════════════════════════════════════════
async function build() {

    const doc = new Document({
        styles: {
            default: { document: { run: { font: 'Arial', size: 21 } } },
            paragraphStyles: [
                {
                    id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
                    run: { size: 30, bold: true, font: 'Arial', color: C.primary },
                    paragraph: { spacing: { before: 300, after: 120 }, outlineLevel: 0 }
                },
                {
                    id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
                    run: { size: 26, bold: true, font: 'Arial', color: C.primary },
                    paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 1 }
                },
            ]
        },
        sections: [{
            properties: {
                page: {
                    size: { width: PAGE_W, height: 16838 },
                    margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN }
                }
            },
            headers: {
                default: new Header({
                    children: [new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [new TextRun({ text: 'KẾ HOẠCH DEMO — CIC.QLDA v4.0', font: 'Arial', size: 16, color: C.muted, italics: true })]
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

                // ═══════════════════════════════════════
                // TITLE PAGE
                // ═══════════════════════════════════════
                spacer(600, 0),

                // Title badge
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 80 },
                    children: [new TextRun({ text: '🎯  KẾ HOẠCH DEMO PHẦN MỀM', font: 'Arial', size: 36, bold: true, color: C.primary })]
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 40 },
                    children: [new TextRun({ text: 'QUẢN LÝ DỰ ÁN ĐẦU TƯ CÔNG', font: 'Arial', size: 32, bold: true, color: C.primary })]
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 200 },
                    children: [new TextRun({ text: 'Tích hợp Trí tuệ Nhân tạo (AI) và Mô hình BIM 3D', font: 'Arial', size: 22, color: C.accent, italics: true })]
                }),

                divider(),
                spacer(200, 0),

                // Info boxes row
                new Table({
                    width: { size: CONTENT_W, type: WidthType.DXA },
                    columnWidths: [Math.floor(CONTENT_W / 3), Math.floor(CONTENT_W / 3), Math.floor(CONTENT_W / 3)],
                    rows: [new TableRow({
                        children: [
                            infoBox('📅 Ngày', '05/03/2026'),
                            infoBox('⏱ Thời lượng', '60 – 75 phút'),
                            infoBox('🎯 Đối tượng', 'Ban QLDA Chuyên ngành'),
                        ]
                    })]
                }),

                spacer(300, 0),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: 'Đơn vị thực hiện: Công ty CIC — Trung tâm Công nghệ Thông tin', font: 'Arial', size: 21, color: C.muted })]
                }),

                // ═══════════════════════════════════════
                // TỔNG QUAN CẤU TRÚC
                // ═══════════════════════════════════════
                new Paragraph({ children: [new PageBreak()] }),

                heading('TỔNG QUAN CẤU TRÚC BUỔI DEMO'),

                bodyText('Buổi demo được thiết kế gồm 2 phần chính, giúp người tham dự hiểu rõ bối cảnh chuyển đổi số trong ngành xây dựng trước khi trải nghiệm trực tiếp phần mềm:'),
                spacer(80, 0),

                // Structure table
                makeTable(
                    ['Phần', 'Nội dung', 'Hình thức', 'Thời gian'],
                    [
                        ['PHẦN 1', 'Thuyết trình — Chuyển đổi số \& Giới thiệu phần mềm', 'Slide (5–8 slides)', '15–20 phút'],
                        ['PHẦN 2', 'Demo trực tiếp trên phần mềm', 'Live demo', '35–45 phút'],
                        ['—', 'Hỏi đáp \& Thảo luận', 'Trao đổi', '10–15 phút'],
                    ],
                    [1200, 4000, 2200, 2238]
                ),

                spacer(200, 0),

                // Timeline
                heading('PHÂN BỔ THỜI GIAN CHI TIẾT', HeadingLevel.HEADING_2),
                makeTable(
                    ['Thời gian', 'Nội dung', 'Người trình bày', 'Ghi chú'],
                    [
                        ['0:00 – 0:03', 'Mở đầu — Chào hỏi, giới thiệu team', 'MC / Trưởng nhóm', 'Tạo không khí'],
                        ['0:03 – 0:20', 'PHẦN 1: Thuyết trình Slide (5–8 slides)', 'Chuyên gia CĐS', 'Chi tiết bên dưới'],
                        ['0:20 – 0:25', 'Chuyển tiếp — Demo Dashboard tổng quan', 'PM / Tech Lead', 'Ấn tượng đầu tiên'],
                        ['0:25 – 0:50', 'PHẦN 2: Demo chi tiết các module', 'PM / Tech Lead', 'Theo kịch bản'],
                        ['0:50 – 0:55', 'Demo AI trực tiếp — Kịch bản mẫu', 'PM / Tech Lead', 'Highlight AI'],
                        ['0:55 – 0:60', 'Tổng kết \& Hỏi đáp', 'Cả team', 'Q\&A mở'],
                    ],
                    [1400, 3500, 2200, 2538]
                ),

                // ═══════════════════════════════════════
                // PHẦN 1: THUYẾT TRÌNH
                // ═══════════════════════════════════════
                new Paragraph({ children: [new PageBreak()] }),
                heading('PHẦN 1:  THUYẾT TRÌNH — NỘI DUNG 5-8 SLIDES'),
                bodyText('Phần thuyết trình nhằm đặt vấn đề, trình bày căn cứ pháp lý và sự cần thiết, sau đó giới thiệu tổng quan phần mềm trước khi đi vào demo trực tiếp.'),
                spacer(100, 0),

                // ── SLIDE 1 ──
                heading3('📌 SLIDE 1: Bối cảnh — Chuyển đổi số ngành Xây dựng'),
                bodyText('Mục đích: Tạo nhận thức về xu thế CĐS không thể đảo ngược trong lĩnh vực xây dựng và đầu tư công.'),
                spacer(40, 0),
                bodyText('Nội dung chính:', { bold: true }),
                bodyText('•  Xu thế toàn cầu: BIM bắt buộc tại UK (2016), Singapore, Hàn Quốc; AI trong quản lý dự án tăng 35% CAGR'),
                bodyText('•  Việt Nam: Luật 148/2025 về Chuyển đổi số, Luật 134/2025 về Trí tuệ nhân tạo'),
                bodyText('•  Ngành xây dựng: Một trong những ngành chậm CĐS nhất — cơ hội lớn cho "người đi đầu"'),
                bodyText('•  Thống kê: 70% BQLDA vẫn dùng Excel quản lý; 2-3 ngày/báo cáo tổng hợp'),

                spacer(100, 0),

                // ── SLIDE 2 ──
                heading3('📌 SLIDE 2: 7 Vấn đề cần giải quyết (Pain Points)'),
                bodyText('Mục đích: Để người nghe "nhận ra mình" trong các vấn đề hàng ngày — tạo đồng cảm.'),
                spacer(40, 0),
                makeTable(
                    ['#', 'Vấn đề', 'Hậu quả'],
                    [
                        ['1', 'Dữ liệu phân tán: Excel, Word, email, USB', 'Thất lạc, khó tra cứu, mất thời gian'],
                        ['2', 'Tổng hợp báo cáo thủ công', 'Mất 2–3 ngày, sai sót nhiều'],
                        ['3', 'Cấp trên hỏi → mất nửa ngày tìm số liệu', 'Chậm phản hồi, mất uy tín'],
                        ['4', 'Thiếu cảnh báo rủi ro tiến độ/vốn', 'Phát hiện muộn, xử lý bị động'],
                        ['5', 'Phối hợp giữa các phòng ban kém', 'Chồng chéo, thiếu đồng bộ'],
                        ['6', 'Cán bộ nghỉ/chuyển công tác → mất dữ liệu', 'Không kế thừa được, phải làm lại'],
                        ['7', 'Chưa ứng dụng BIM, AI theo quy định mới', 'Chưa đáp ứng NĐ 111, Luật 148/2025'],
                    ],
                    [500, 4200, 4938]
                ),

                spacer(100, 0),

                // ── SLIDE 3 ──
                heading3('📌 SLIDE 3: Căn cứ pháp lý — Tại sao phải CĐS?'),
                bodyText('Mục đích: Chứng minh CĐS không phải "xu thế" mà là YÊU CẦU BẮT BUỘC của pháp luật.'),
                spacer(40, 0),
                makeTable(
                    ['Văn bản', 'Nội dung liên quan'],
                    [
                        ['Luật Đầu tư công (sửa đổi)', 'Yêu cầu công khai, minh bạch, giám sát thường xuyên'],
                        ['Luật Xây dựng (thay thế)', 'Quản lý chất lượng, hồ sơ, BIM bắt buộc nhóm A, B'],
                        ['Luật 148/2025 về CĐS', 'Cơ sở pháp lý cho chuyển đổi số trong cơ quan nhà nước'],
                        ['Luật 134/2025 về TTNT', 'Khung pháp lý cho ứng dụng AI trong quản lý nhà nước'],
                        ['NĐ 175/NĐ-CP', 'Quy trình quản lý đầu tư xây dựng 3 giai đoạn'],
                        ['NĐ 111/NĐ-CP', 'BIM bắt buộc cho dự án nhóm A, B từ 2025'],
                        ['TT 24/2025/TT-BXD', 'CSDL Quốc gia về hoạt động xây dựng — đồng bộ dữ liệu'],
                        ['TT 06/2021/TT-BXD', 'Quản lý KHLCNT, đấu thầu điện tử qua mạng'],
                    ],
                    [3800, 5838]
                ),

                spacer(100, 0),

                // ── SLIDE 4 ──
                heading3('📌 SLIDE 4: Sự cần thiết — Tại sao cần phần mềm QLDA?'),
                bodyText('Mục đích: Kết nối Pain Points + Căn cứ pháp lý → Lý do cần phần mềm chuyên dụng.'),
                spacer(40, 0),
                bodyText('Nội dung chính:', { bold: true }),
                bodyText('•  So sánh: Quản lý thủ công (Excel/Word) vs. Quản lý bằng phần mềm — bảng so sánh trực quan'),
                bodyText('•  Yêu cầu bắt buộc: Đồng bộ CSDL Quốc gia (TT24), BIM (NĐ111), báo cáo giám sát định kỳ'),
                bodyText('•  Bài học thực tế: Các đơn vị đã triển khai — tiết kiệm 70% thời gian báo cáo'),
                bodyText('•  Hậu quả nếu không CĐS: Không đáp ứng yêu cầu kiểm toán, thanh tra; chậm giải ngân'),

                spacer(100, 0),

                // ── SLIDE 5 ──
                heading3('📌 SLIDE 5: Giới thiệu phần mềm CIC.QLDA v4.0'),
                bodyText('Mục đích: Giới thiệu tổng quan giải pháp — 3 trụ cột chính, kiến trúc công nghệ.'),
                spacer(40, 0),
                bodyText('Nội dung chính:', { bold: true }),
                bodyText('•  3 trụ cột: Quản lý Dự án Toàn diện + AI Thông minh + BIM 3D trên Web'),
                bodyText('•  Kiến trúc: Web-based (truy cập mọi nơi), Cloud (Supabase), AI (Gemini 2.0 Flash + Function Calling)'),
                bodyText('•  8 Tab = Toàn bộ vòng đời dự án: Tổng quan → Kế hoạch → Đấu thầu → Vốn → Pháp lý → Hồ sơ → BIM → Vận hành'),
                bodyText('•  10 tính năng AI tích hợp: Từ phân tích rủi ro đến soạn văn bản tự động'),

                spacer(100, 0),

                // ── SLIDE 6 ──
                heading3('📌 SLIDE 6: Mục tiêu triển khai'),
                bodyText('Mục đích: Cho người nghe thấy đích đến rõ ràng — Triển khai sẽ đạt được gì?'),
                spacer(40, 0),
                makeTable(
                    ['#', 'Mục tiêu', 'Chỉ tiêu đo lường'],
                    [
                        ['1', 'Số hóa 100% quy trình quản lý dự án', 'Từ khởi tạo → hoàn thành → vận hành'],
                        ['2', 'Giảm 70% thời gian lập báo cáo', 'Từ 2-3 ngày → 15 phút (AI hỗ trợ)'],
                        ['3', 'Đáp ứng 100% yêu cầu TT24/NĐ111', 'Đồng bộ CSDL QG, BIM trên web'],
                        ['4', 'Cảnh báo sớm rủi ro tiến độ \& vốn', 'AI phân tích 5+ loại rủi ro tự động'],
                        ['5', 'Lưu trữ tập trung theo ISO 19650', 'CDE — Môi trường Dữ liệu Chung'],
                        ['6', 'Nâng cao năng lực số đội ngũ BQLDA', 'Đào tạo sử dụng AI, BIM viewer'],
                    ],
                    [500, 4500, 4638]
                ),

                spacer(100, 0),

                // ── SLIDE 7 ──
                heading3('📌 SLIDE 7: Lộ trình triển khai \& Chi phí'),
                bodyText('Mục đích: Cho thấy lộ trình cụ thể, chi phí hợp lý, không gây "sốc".'),
                spacer(40, 0),
                bodyText('Nội dung chính:', { bold: true }),
                bodyText('•  Giai đoạn 1 (tháng 1-2): Cài đặt, cấu hình, nhập liệu ban đầu, đào tạo'),
                bodyText('•  Giai đoạn 2 (tháng 2-3): Vận hành song song, hỗ trợ tích cực'),
                bodyText('•  Giai đoạn 3 (tháng 3-4): Vận hành chính thức, tối ưu AI, mở rộng tính năng'),
                bodyText('•  Chi phí: 355 triệu xây dựng + 3,7 triệu/tháng vận hành (cloud \& AI)'),

                spacer(100, 0),

                // ── SLIDE 8 ──
                heading3('📌 SLIDE 8 (Tùy chọn): Demo Preview — "Hãy cùng xem trực tiếp"'),
                bodyText('Mục đích: Chuyển tiếp sang phần demo — tạo kỳ vọng, hứng thú.'),
                spacer(40, 0),
                bodyText('Nội dung chính:', { bold: true }),
                bodyText('•  Một screenshot Dashboard tổng quan → "Đây là những gì chúng ta sẽ trải nghiệm"'),
                bodyText('•  Câu hỏi mở: "Quý vị muốn thấy tính năng nào nhất?"'),
                bodyText('•  Chuyển tiếp: Mở trình duyệt → Bắt đầu demo trực tiếp'),

                // ═══════════════════════════════════════
                // PHẦN 2: DEMO TRỰC TIẾP
                // ═══════════════════════════════════════
                new Paragraph({ children: [new PageBreak()] }),
                heading('PHẦN 2:  DEMO TRỰC TIẾP TRÊN PHẦN MỀM'),
                bodyText('Sau phần thuyết trình, chuyển sang demo trực tiếp trên hệ thống đã có dữ liệu mẫu thực tế (5 dự án).'),
                spacer(100, 0),

                heading('KỊCH BẢN DEMO CHI TIẾT', HeadingLevel.HEADING_2),
                spacer(60, 0),

                // ── Module 1: Dashboard ──
                heading3('① DASHBOARD TỔNG QUAN (5 phút)'),
                bodyText('Mục đích: Ấn tượng đầu tiên — "Một cái nhìn, toàn bộ tình hình"'),
                spacer(40, 0),
                makeTable(
                    ['Bước', 'Thao tác', 'Điểm nhấn'],
                    [
                        ['1', 'Mở Dashboard → Giới thiệu 4 thẻ KPI', 'Tổng vốn ĐT, giải ngân, nghiệm thu, cảnh báo'],
                        ['2', 'Biểu đồ giải ngân thực tế vs kế hoạch', 'BarChart tương tác, click xem chi tiết'],
                        ['3', 'Biểu đồ phân loại dự án theo trạng thái', 'PieChart: Chuẩn bị / Thực hiện / Hoàn thành'],
                        ['4', 'Danh sách cảnh báo rủi ro', 'AI highlight các dự án cần lưu ý'],
                    ],
                    [700, 4500, 4438]
                ),
                spacer(100, 0),

                // ── Module 2: Quản lý Dự án ──
                heading3('② QUẢN LÝ DỰ ÁN — 8 TAB (15 phút)'),
                bodyText('Mục đích: Chứng minh "1 dự án = 8 tab = toàn bộ vòng đời"'),
                spacer(40, 0),
                makeTable(
                    ['Tab', 'Nội dung demo', 'Điểm nhấn'],
                    [
                        ['Tổng quan', 'Thông tin cơ bản, KPI, kết nối CSDL QG', 'Quick Actions, đồng bộ TT24'],
                        ['Kế hoạch', 'Cây WBS 3 giai đoạn, Gantt chart', 'Tạo task nhanh, bulk create'],
                        ['Đấu thầu', 'KHLCNT, 6 bước lifecycle, nhà thầu', 'Đánh giá HSDT, chọn trúng thầu'],
                        ['Vốn & GN', 'KPI tài chính, biểu đồ tiến độ GN', 'Budget Variance, cảnh báo'],
                        ['Pháp lý', 'VBPL áp dụng, deep-link đến điều khoản', 'Tra cứu luật trực tiếp'],
                        ['Hồ sơ', 'CDE Explorer (ISO 19650), version history', 'Upload, phê duyệt, tìm kiếm'],
                        ['BIM', 'Mở mô hình 3D, chọn cấu kiện, đo đạc', 'Section plane, multi-model'],
                        ['Vận hành', 'Quản lý tài sản, 3.000+ items', 'Heatmap, tìm kiếm nhanh'],
                    ],
                    [1400, 4200, 4038]
                ),
                spacer(100, 0),

                // ── Module 3: AI Demo ──
                heading3('③ DEMO AI TRỰC TIẾP (10 phút)'),
                bodyText('Mục đích: Highlight tính năng AI — "Hỏi bằng tiếng Việt, trả lời tức thì"'),
                spacer(40, 0),
                makeTable(
                    ['Câu hỏi demo', 'AI sẽ trả lời'],
                    [
                        ['"Tổng giá trị gói thầu đang chờ duyệt?"', 'AI gọi function → truy vấn DB → "234,5 tỷ, 3 gói XL"'],
                        ['"Phân tích rủi ro dự án này"', 'AI quét 5 loại rủi ro → radar chart + đề xuất biện pháp'],
                        ['"Soạn báo cáo tiến độ tháng này"', 'AI tổng hợp dữ liệu → soạn bản nháp → xuất DOCX'],
                        ['"So sánh nhà thầu A và B"', 'AI chấm điểm 4 tiêu chí → bảng so sánh + khuyến nghị'],
                        ['"Kiểm tra tuân thủ TT24"', 'AI đối chiếu 40+ mục → danh sách vi phạm + hướng dẫn'],
                        ['"Dự báo tiến độ hoàn thành?"', 'AI phân tích trend → dự báo ngày hoàn thành + biểu đồ'],
                    ],
                    [4400, 5238]
                ),
                spacer(100, 0),

                // ── Module 4: BIM ──
                heading3('④ DEMO BIM 3D (5 phút)'),
                bodyText('Mục đích: Chứng minh "Không cần phần mềm đắt tiền — xem 3D ngay trên trình duyệt"'),
                spacer(40, 0),
                bodyText('•  Mở tab BIM → Load mô hình IFC thực tế'),
                bodyText('•  Xoay, zoom, chọn cấu kiện → Xem thông tin chi tiết'),
                bodyText('•  Bật Section Plane → Cắt mặt bằng, mặt cắt'),
                bodyText('•  Đo kích thước trực tiếp trên mô hình'),
                bodyText('•  So sánh: License BIM (hàng trăm triệu/năm) vs. Miễn phí trên web'),

                // ═══════════════════════════════════════
                // PHẦN 3: 10 ỨNG DỤNG AI
                // ═══════════════════════════════════════
                new Paragraph({ children: [new PageBreak()] }),
                heading('10 ỨNG DỤNG AI KHI CÓ DỮ LIỆU 1–2 NĂM'),
                bodyText('Càng dùng lâu, dữ liệu càng nhiều, AI càng thông minh. Dưới đây là 10 ứng dụng AI mạnh mẽ khi hệ thống tích lũy dữ liệu:'),
                spacer(60, 0),

                makeTable(
                    ['#', 'Ứng dụng AI', 'Ví dụ cụ thể'],
                    [
                        ['1', '🔮 Dự báo giải ngân', 'Cuối năm chỉ đạt 65% KH. Cần tăng 15% Q3'],
                        ['2', '⏰ Dự báo chậm tiến độ', 'Gói XL trễ 2 tháng do đánh giá HSDT kéo dài'],
                        ['3', '💰 Phát hiện bất thường', '3 đợt TTKLHT giá trị gần giống — cần kiểm tra'],
                        ['4', '📊 Báo cáo tự động', 'AI soạn BC giám sát tháng — chỉ cần ký'],
                        ['5', '📋 So sánh benchmark', 'Giải ngân chậm hơn 20% so với TB nhóm B'],
                        ['6', '🏆 Đánh giá nhà thầu', 'Đúng hạn 85%, chất lượng 4,2/5'],
                        ['7', '📜 Kiểm tra tuân thủ PL', 'Còn thiếu 5 VB theo TT24, 2 VB quá hạn'],
                        ['8', '🗓️ Lập KH thông minh', 'Đề xuất timeline 42 tháng từ 10 DA tương tự'],
                        ['9', '🔍 Hỏi đáp dữ liệu', 'Tổng gói XL chờ duyệt: 234,5 tỷ, 3 gói'],
                        ['10', '📧 Tóm tắt điều hành', 'Tuần: 2 gói cần duyệt, 1 HĐ sắp hết hạn'],
                    ],
                    [500, 3500, 5638]
                ),
                spacer(80, 0),
                richParagraph([
                    { text: 'DỮ LIỆU  ×  AI (Gemini 2.0 Flash + Function Calling)  =  THÔNG TIN HÀNH ĐỘNG', bold: true, color: C.primary, size: 22 },
                ], { align: AlignmentType.CENTER, before: 100, after: 40 }),
                richParagraph([
                    { text: '"Càng dùng lâu, dữ liệu càng nhiều, AI càng thông minh."', italics: true, color: C.accent, size: 20 },
                ], { align: AlignmentType.CENTER }),

                // ═══════════════════════════════════════
                // SO SÁNH
                // ═══════════════════════════════════════
                spacer(200, 0),
                heading('SO SÁNH: KHÔNG CÓ PM vs CÓ PM', HeadingLevel.HEADING_2),
                makeTable(
                    ['Tiêu chí', '❌ Không có phần mềm', '✅ Với phần mềm CIC.QLDA'],
                    [
                        ['Lập báo cáo', '2–3 ngày', '15 phút (AI hỗ trợ)'],
                        ['Tra cứu hồ sơ', '30–60 phút', '30 giây (tìm kiếm)'],
                        ['Họp giao ban', '2–3 giờ/tuần', '30 phút/tuần'],
                        ['Phát hiện rủi ro', 'Khi đã xảy ra', 'Cảnh báo sớm AI'],
                        ['Xem mô hình BIM', 'License đắt tiền', 'Miễn phí trên web'],
                        ['Phối hợp', 'Email, điện thoại', 'Real-time online'],
                        ['Lưu trữ', 'Phân tán, khó tìm', 'CDE tập trung, ISO 19650'],
                    ],
                    [2000, 3500, 4138]
                ),

                // ═══════════════════════════════════════
                // CÂU HỎI THƯỜNG GẶP
                // ═══════════════════════════════════════
                new Paragraph({ children: [new PageBreak()] }),
                heading('CÂU HỎI THƯỜNG GẶP (FAQ)'),
                spacer(60, 0),

                makeTable(
                    ['Câu hỏi', 'Đáp án gợi ý'],
                    [
                        ['Chi phí bao nhiêu?', '355 triệu xây dựng + 3,7 triệu/tháng vận hành'],
                        ['Bao lâu triển khai?', '4 tháng (3 giai đoạn)'],
                        ['Dữ liệu lưu ở đâu?', 'Cloud (Supabase Singapore), backup hàng ngày'],
                        ['Có dùng offline?', 'Cần internet, 10Mbps là đủ'],
                        ['Export báo cáo?', 'Có — PDF, Excel, DOCX đúng mẫu biểu'],
                        ['AI có chính xác không?', 'AI truy vấn dữ liệu thực từ hệ thống (Function Calling), không suy đoán'],
                        ['Có bao nhiêu tính năng AI?', '10 tính năng AI tích hợp: từ phân tích rủi ro đến soạn văn bản'],
                        ['BIM có cần phần mềm riêng?', 'Không — xem IFC 3D trực tiếp trên trình duyệt, không cần license'],
                    ],
                    [4000, 5638]
                ),

                // ═══════════════════════════════════════
                // CHECKLIST CHUẨN BỊ
                // ═══════════════════════════════════════
                spacer(200, 0),
                heading('CHECKLIST CHUẨN BỊ TRƯỚC DEMO', HeadingLevel.HEADING_2),
                spacer(60, 0),

                makeTable(
                    ['#', 'Hạng mục', 'Trạng thái', 'Ghi chú'],
                    [
                        ['1', 'Slide thuyết trình (5–8 slides)', '☐', 'Thiết kế PowerPoint chuyên nghiệp'],
                        ['2', 'Dữ liệu mẫu 5 dự án', '☐', 'Đã có — đa dạng giai đoạn, nhóm'],
                        ['3', 'Internet ổn định (>10 Mbps)', '☐', 'Test trước 30 phút'],
                        ['4', 'Laptop + màn hình chiếu', '☐', 'Resolution 1920x1080 tối thiểu'],
                        ['5', 'Trình duyệt Chrome (cập nhật)', '☐', 'Clear cache, đăng nhập sẵn'],
                        ['6', 'Tài khoản demo đã set up', '☐', 'Admin + Manager + Staff'],
                        ['7', 'File IFC mẫu cho BIM demo', '☐', 'Mô hình đã convert sẵn'],
                        ['8', 'API Key Gemini active', '☐', 'Test AI trước 15 phút'],
                        ['9', 'Backup offline (video demo)', '☐', 'Phòng trường hợp mất mạng'],
                        ['10', 'Tài liệu phát tay (nếu có)', '☐', 'In ấn hoặc gửi email trước'],
                    ],
                    [500, 4000, 1200, 3938]
                ),

                // ═══════════════════════════════════════
                // FOOTER
                // ═══════════════════════════════════════
                spacer(300, 0),
                divider(),
                spacer(60, 0),
                richParagraph([
                    { text: '© 2026 CIC — Phần mềm Quản lý Dự án Đầu tư Công Thông minh v4.0', color: C.muted, size: 18, italics: true },
                ], { align: AlignmentType.CENTER }),

            ]
        }]
    });

    const buffer = await Packer.toBuffer(doc);
    const outPath = path.join(__dirname, '..', 'resources', 'KeHoach_Demo_QLDA_v2.docx');
    fs.writeFileSync(outPath, buffer);
    console.log(`✅ Generated: ${outPath}`);
    console.log(`   Size: ${(buffer.length / 1024).toFixed(1)} KB`);
}

build().catch(console.error);
