const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, BorderStyle, PageBreak, Header, Footer, PageNumber, NumberFormat, ShadingType, VerticalAlign, TableLayoutType, convertInchesToTwip } = require('docx');
const fs = require('fs');

// ============================================
// HELPERS
// ============================================
const FONT = 'Times New Roman';
const BLUE = '1a5276';
const DARK_BLUE = '0d3b66';
const LIGHT_BLUE = 'd6eaf8';
const LIGHTER_BLUE = 'ebf5fb';
const GRAY = '7f8c8d';
const WHITE = 'ffffff';
const BLACK = '000000';
const ACCENT = '2980b9';

function text(t, opts = {}) {
    return new TextRun({
        text: t,
        font: FONT,
        size: opts.size || 24, // 12pt
        bold: opts.bold || false,
        italics: opts.italic || false,
        color: opts.color || BLACK,
        underline: opts.underline ? {} : undefined,
        break: opts.break || undefined,
    });
}

function heading1(t) {
    return new Paragraph({
        children: [text(t, { bold: true, size: 28, color: DARK_BLUE })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 360, after: 200 },
        border: {
            bottom: { color: ACCENT, space: 4, size: 12, style: BorderStyle.SINGLE },
        },
    });
}

function heading2(t) {
    return new Paragraph({
        children: [text(t, { bold: true, size: 26, color: BLUE })],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 160 },
    });
}

function heading3(t) {
    return new Paragraph({
        children: [text(t, { bold: true, size: 24, color: BLUE })],
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 240, after: 120 },
    });
}

function para(t, opts = {}) {
    const runs = typeof t === 'string' ? [text(t, opts)] : t;
    return new Paragraph({
        children: runs,
        spacing: { after: opts.after || 120, before: opts.before || 0, line: opts.line || 312 },
        alignment: opts.align || AlignmentType.JUSTIFIED,
        indent: opts.indent ? { firstLine: 480 } : undefined,
        bullet: opts.bullet ? { level: opts.bulletLevel || 0 } : undefined,
    });
}

function bullet(t, level = 0, opts = {}) {
    const runs = typeof t === 'string' ? [text(t, opts)] : t;
    return new Paragraph({
        children: runs,
        bullet: { level },
        spacing: { after: 60, line: 312 },
    });
}

function emptyLine() {
    return new Paragraph({ children: [text('')], spacing: { after: 120 } });
}

// Table helpers
function headerCell(t, width) {
    return new TableCell({
        children: [new Paragraph({
            children: [text(t, { bold: true, size: 22, color: WHITE })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 0 },
        })],
        width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
        shading: { type: ShadingType.CLEAR, fill: BLUE },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 60, bottom: 60, left: 80, right: 80 },
    });
}

function dataCell(t, opts = {}) {
    const runs = typeof t === 'string' ? [text(t, { size: 22, bold: opts.bold, color: opts.color })] : t;
    return new TableCell({
        children: [new Paragraph({
            children: runs,
            alignment: opts.align || AlignmentType.LEFT,
            spacing: { after: 0 },
        })],
        width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
        shading: opts.shading ? { type: ShadingType.CLEAR, fill: opts.shading } : undefined,
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 40, bottom: 40, left: 80, right: 80 },
    });
}

function makeTable(headers, rows, colWidths) {
    const headerRow = new TableRow({
        children: headers.map((h, i) => headerCell(h, colWidths?.[i])),
        tableHeader: true,
    });
    const dataRows = rows.map((row, ri) =>
        new TableRow({
            children: row.map((cell, ci) => {
                if (typeof cell === 'object' && cell.type === 'TableCell') return cell;
                return dataCell(String(cell), {
                    align: ci === 0 ? AlignmentType.CENTER : undefined,
                    shading: ri % 2 === 1 ? LIGHTER_BLUE : undefined,
                    width: colWidths?.[ci],
                    bold: cell?.bold,
                });
            }),
        })
    );
    return new Table({
        rows: [headerRow, ...dataRows],
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
    });
}

function costCell(t) {
    return dataCell(t, { align: AlignmentType.RIGHT });
}

// ============================================
// COVER PAGE
// ============================================
function coverPage() {
    return [
        emptyLine(), emptyLine(), emptyLine(), emptyLine(),
        new Paragraph({
            children: [text('HỌC VIỆN CHÍNH TRỊ QUỐC GIA HỒ CHÍ MINH', { bold: true, size: 28, color: BLUE })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
        }),
        new Paragraph({
            children: [text('BAN QUẢN LÝ DỰ ÁN ĐẦU TƯ XÂY DỰNG CÔNG NGHIỆP', { bold: true, size: 24, color: BLUE })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
        }),
        new Paragraph({
            children: [text('─────────────────────────', { color: ACCENT, size: 28 })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
        }),
        emptyLine(), emptyLine(),
        new Paragraph({
            children: [text('TÀI LIỆU GIỚI THIỆU', { bold: true, size: 40, color: DARK_BLUE })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 160 },
        }),
        new Paragraph({
            children: [text('PHẦN MỀM QUẢN LÝ DỰ ÁN', { bold: true, size: 36, color: DARK_BLUE })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 160 },
        }),
        new Paragraph({
            children: [text('ĐẦU TƯ XÂY DỰNG CÔNG', { bold: true, size: 36, color: DARK_BLUE })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
        }),
        new Paragraph({
            children: [text('Smart Public Investment Manager', { italic: true, size: 30, color: ACCENT })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
        }),
        new Paragraph({
            children: [text('─────────────────────────', { color: ACCENT, size: 28 })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
        }),
        emptyLine(), emptyLine(),
        new Paragraph({
            children: [text('Phiên bản: 1.0', { size: 24, color: GRAY })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
        }),
        new Paragraph({
            children: [text('Ngày: 24/02/2026', { size: 24, color: GRAY })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
        }),
        new Paragraph({
            children: [text('Quy mô sử dụng: 20 người dùng', { size: 24, color: GRAY })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
        }),
        new Paragraph({
            children: [new PageBreak()],
        }),
    ];
}

// ============================================
// TABLE OF CONTENTS PAGE
// ============================================
function tocPage() {
    const tocItems = [
        ['I.', 'TỔNG QUAN'],
        ['II.', 'KIẾN TRÚC HỆ THỐNG'],
        ['III.', 'MÔ TẢ TÍNH NĂNG'],
        ['  ', '  Module 1: Dashboard - Bảng điều khiển tổng quan'],
        ['  ', '  Module 2: Quản lý Dự án'],
        ['  ', '  Module 3: BIM Viewer - Quản lý mô hình 3D'],
        ['  ', '  Module 4: Quản lý Vận hành Tài sản'],
        ['  ', '  Module 5: Quản lý Hợp đồng'],
        ['  ', '  Module 6: Quản lý Thanh toán'],
        ['  ', '  Module 7: Quản lý Nhà thầu'],
        ['  ', '  Module 8: Quản lý Nhân sự'],
        ['  ', '  Module 9: Quản lý Tài liệu'],
        ['  ', '  Module 10: Báo cáo'],
        ['  ', '  Module 11: Quy chế hoạt động'],
        ['  ', '  Module 12: Trợ lý AI'],
        ['  ', '  Module 13: Quản trị hệ thống'],
        ['IV.', 'YÊU CẦU HỆ THỐNG'],
        ['V.', 'DỰ TOÁN CHI PHÍ'],
        ['VI.', 'LỘ TRÌNH TRIỂN KHAI'],
        ['VII.', 'CAM KẾT'],
    ];
    return [
        heading1('MỤC LỤC'),
        emptyLine(),
        ...tocItems.map(([num, title]) => {
            const isMain = num.trim() !== '';
            return new Paragraph({
                children: [
                    text(isMain ? `${num} ${title}` : title, {
                        bold: isMain,
                        size: isMain ? 24 : 22,
                        color: isMain ? DARK_BLUE : BLACK,
                    }),
                ],
                spacing: { after: isMain ? 100 : 60 },
                indent: isMain ? undefined : { left: 480 },
            });
        }),
        new Paragraph({ children: [new PageBreak()] }),
    ];
}

// ============================================
// MAIN CONTENT
// ============================================
function mainContent() {
    const sections = [];

    // ── I. TỔNG QUAN ──
    sections.push(heading1('I. TỔNG QUAN'));
    sections.push(heading2('1. Giới thiệu'));
    sections.push(para('Smart Public Investment Manager là phần mềm quản lý dự án đầu tư xây dựng công trực tuyến (Web-based), được thiết kế chuyên biệt cho các Ban Quản lý Dự án Đầu tư Xây dựng thuộc cơ quan nhà nước. Phần mềm số hóa toàn bộ quy trình quản lý dự án đầu tư công từ giai đoạn chuẩn bị đầu tư, thực hiện đầu tư, đến kết thúc đầu tư — tuân thủ theo Luật Đầu tư công, Luật Xây dựng và các nghị định hướng dẫn hiện hành.', { indent: true }));

    sections.push(heading2('2. Mục tiêu'));
    sections.push(makeTable(
        ['STT', 'Mục tiêu', 'Mô tả'],
        [
            ['1', 'Số hóa quy trình', 'Chuyển đổi toàn bộ quy trình quản lý dự án sang nền tảng số'],
            ['2', 'Minh bạch thông tin', 'Dashboard tổng quan, theo dõi tiến độ và tài chính real-time'],
            ['3', 'Tuân thủ pháp luật', 'Tích hợp checklist tuân thủ theo TT24/2024/BXD, Luật ĐTC, Luật XD'],
            ['4', 'Quản lý BIM', 'Xem mô hình 3D IFC trực tiếp trên trình duyệt, quản lý tài sản'],
            ['5', 'Tối ưu vận hành', 'Giảm thời gian xử lý, tăng hiệu quả phối hợp giữa các bộ phận'],
        ],
        [8, 22, 70]
    ));

    sections.push(heading2('3. Đối tượng sử dụng'));
    sections.push(bullet([text('Ban Giám đốc', { bold: true }), text(': Nắm bắt tổng quan tiến độ, tài chính, rủi ro các dự án')]));
    sections.push(bullet([text('Phòng Kế hoạch - Tổng hợp', { bold: true }), text(': Quản lý kế hoạch vốn, đấu thầu, hợp đồng')]));
    sections.push(bullet([text('Phòng Kỹ thuật', { bold: true }), text(': Quản lý thiết kế, BIM, chất lượng thi công')]));
    sections.push(bullet([text('Phòng Quản lý Dự án', { bold: true }), text(': Theo dõi tiến độ, công việc, phối hợp nhà thầu')]));
    sections.push(bullet([text('Phòng Hành chính', { bold: true }), text(': Quản lý tài liệu, nhân sự, quy chế')]));

    // ── II. KIẾN TRÚC ──
    sections.push(new Paragraph({ children: [new PageBreak()] }));
    sections.push(heading1('II. KIẾN TRÚC HỆ THỐNG'));
    sections.push(para('Hệ thống được xây dựng trên kiến trúc serverless hiện đại, không yêu cầu quản trị máy chủ vật lý, tối ưu chi phí vận hành.', { indent: true }));
    sections.push(emptyLine());
    sections.push(makeTable(
        ['Thành phần', 'Công nghệ', 'Vai trò'],
        [
            ['Frontend', 'React 19, TypeScript, Vite', 'Giao diện SPA hiệu năng cao'],
            ['UI Framework', 'TailwindCSS', 'Responsive, hỗ trợ Dark Mode'],
            ['Biểu đồ', 'Recharts', 'Dashboard, thống kê trực quan'],
            ['Bản đồ', 'Leaflet + OpenStreetMap', 'Hiển thị vị trí dự án trên bản đồ'],
            ['BIM Viewer', 'ThatOpen + Three.js', 'Xem mô hình 3D IFC trên web'],
            ['Database', 'PostgreSQL 17 (Supabase)', 'CSDL quan hệ, 22 bảng dữ liệu'],
            ['Auth', 'Supabase Auth + RLS', 'Xác thực, phân quyền theo dòng dữ liệu'],
            ['Storage', 'Supabase Storage', 'Lưu trữ file BIM, tài liệu dự án'],
            ['AI', 'Google Gemini', 'Trợ lý AI tra cứu pháp luật'],
            ['Hosting', 'Vercel', 'CDN toàn cầu, triển khai tự động'],
        ],
        [20, 35, 45]
    ));

    // ── III. TÍNH NĂNG ──
    sections.push(new Paragraph({ children: [new PageBreak()] }));
    sections.push(heading1('III. MÔ TẢ TÍNH NĂNG'));

    // Module 1
    sections.push(heading2('Module 1: Dashboard - Bảng điều khiển tổng quan'));
    sections.push(para('Cung cấp cái nhìn toàn cảnh về tất cả dự án đang quản lý, với các chỉ số KPI cập nhật realtime.', { indent: true }));
    sections.push(heading3('Tính năng chính:'));
    sections.push(bullet([text('Thẻ thống kê', { bold: true }), text(': Tổng dự án, tổng giá trị đầu tư, tỷ lệ giải ngân, số hợp đồng')]));
    sections.push(bullet([text('Biểu đồ tiến độ giải ngân', { bold: true }), text(': Theo dõi xu hướng giải ngân qua các tháng')]));
    sections.push(bullet([text('Biểu đồ phân bổ vốn', { bold: true }), text(': So sánh kế hoạch vốn và giải ngân thực tế')]));
    sections.push(bullet([text('Biểu đồ trạng thái', { bold: true }), text(': Phân bổ theo giai đoạn (chuẩn bị, thực hiện, kết thúc)')]));
    sections.push(bullet([text('Bản đồ dự án', { bold: true }), text(': Hiển thị vị trí tất cả dự án trên bản đồ tương tác')]));
    sections.push(bullet([text('Dashboard cá nhân', { bold: true }), text(': Theo dõi công việc được giao, tiến độ cá nhân')]));

    // Module 2
    sections.push(heading2('Module 2: Quản lý Dự án'));
    sections.push(para('Module trung tâm của hệ thống, quản lý toàn diện vòng đời dự án đầu tư xây dựng công từ giai đoạn chuẩn bị đến kết thúc đầu tư.', { indent: true }));

    sections.push(heading3('Tab 2.1 - Thông tin dự án'));
    sections.push(bullet('Thông tin cơ bản: tên, mã, nhóm, loại dự án, chủ đầu tư'));
    sections.push(bullet('Quyết định đầu tư: số QĐ, ngày, cơ quan phê duyệt'));
    sections.push(bullet('Tổng mức đầu tư chi tiết theo hạng mục (xây lắp, thiết bị, QLDA, tư vấn, dự phòng)'));
    sections.push(bullet('Các nhà thầu tham gia: tư vấn lập dự án, khảo sát, thiết kế, giám sát, thẩm tra'));
    sections.push(bullet('Tracking giai đoạn dự án (Lifecycle Stepper): Chuẩn bị → Thực hiện → Kết thúc'));

    sections.push(heading3('Tab 2.2 - Kế hoạch thực hiện'));
    sections.push(bullet([text('Biểu đồ Gantt', { bold: true }), text(': Hiển thị toàn bộ kế hoạch theo timeline')]));
    sections.push(bullet([text('Quản lý công việc', { bold: true }), text(': Tạo, phân công, theo dõi tiến độ (progress slider)')]));
    sections.push(bullet([text('Kanban Board', { bold: true }), text(': Quản lý công việc theo trạng thái (Todo → In Progress → Review → Done)')]));
    sections.push(bullet([text('Quản lý phụ thuộc', { bold: true }), text(': Liên kết công việc tiền nhiệm/kế nhiệm')]));
    sections.push(bullet([text('Phân bổ nguồn lực', { bold: true }), text(': Xem tải công việc theo nhân sự')]));
    sections.push(bullet([text('Template quy trình', { bold: true }), text(': Áp dụng template ĐTXD tự động')]));

    sections.push(heading3('Tab 2.3 - Gói thầu'));
    sections.push(bullet('Danh sách gói thầu theo dự án, thông tin chi tiết'));
    sections.push(bullet('Theo dõi quy trình: Lập KHLCNT → Thông báo mời thầu → Đóng thầu → Phê duyệt'));
    sections.push(bullet('Quản lý vấn đề/rủi ro liên quan gói thầu'));
    sections.push(bullet([text('Xuất mẫu biểu KHLCNT', { bold: true }), text(' theo Nghị định 25/2020/NĐ-CP')]));

    sections.push(heading3('Tab 2.4 - Kế hoạch vốn & Giải ngân'));
    sections.push(bullet('Kế hoạch vốn hàng năm: số QĐ giao vốn, nguồn vốn, số tiền'));
    sections.push(bullet('Theo dõi giải ngân: tạm ứng, thanh toán KLHT, thu hồi tạm ứng'));
    sections.push(bullet('Biểu đồ giải ngân lũy kế so với kế hoạch'));
    sections.push(bullet('Đối soát với Kho bạc Nhà nước'));

    sections.push(heading3('Tab 2.5 - Tài liệu theo TT24'));
    sections.push(para('Tổ chức hồ sơ theo cấu trúc chuẩn 5 thư mục:', { indent: true }));
    sections.push(bullet('Hồ sơ Pháp lý dự án', 1));
    sections.push(bullet('Hồ sơ Thiết kế & Khảo sát', 1));
    sections.push(bullet('Hồ sơ Đấu thầu', 1));
    sections.push(bullet('Hồ sơ Quản lý chất lượng', 1));
    sections.push(bullet('Hồ sơ Thanh quyết toán', 1));
    sections.push(bullet('Upload, xem trước file, lịch sử phiên bản, mô phỏng chữ ký số'));

    sections.push(heading3('Tab 2.6 - Tuân thủ pháp luật'));
    sections.push(bullet('Checklist tuân thủ theo Thông tư 24/2024/TT-BXD'));
    sections.push(bullet('Theo dõi tỷ lệ hoàn thành dữ liệu TT24 (0-100%)'));
    sections.push(bullet('Hồ sơ chủ trương đầu tư, báo cáo nghiên cứu khả thi'));

    // Module 3
    sections.push(heading2('Module 3: BIM Viewer - Quản lý mô hình 3D'));
    sections.push(para('Tích hợp xem mô hình BIM (Building Information Modeling) trực tiếp trên trình duyệt web, không cần cài đặt phần mềm chuyên dụng.', { indent: true }));
    sections.push(bullet([text('Upload & convert IFC', { bold: true }), text(': Tải lên file IFC, tự động chuyển đổi sang định dạng web')]));
    sections.push(bullet([text('Xem 3D tương tác', { bold: true }), text(': Xoay, zoom, pan mô hình 3D mượt mà')]));
    sections.push(bullet([text('Chọn cấu kiện', { bold: true }), text(': Click để xem chi tiết vật liệu, kích thước, tầng')]));
    sections.push(bullet([text('Cây mô hình', { bold: true }), text(': Duyệt theo cấu trúc tầng/không gian (Model Tree)')]));
    sections.push(bullet([text('Đo đạc', { bold: true }), text(': Đo khoảng cách, diện tích trên mô hình 3D')]));
    sections.push(bullet([text('Cắt mặt phẳng', { bold: true }), text(': Tạo mặt cắt (section plane) xem nội thất')]));
    sections.push(bullet([text('ViewCube & phím tắt', { bold: true }), text(': Điều hướng nhanh, WASD di chuyển, phím 1-7 chọn góc nhìn')]));
    sections.push(bullet([text('Multi-model', { bold: true }), text(': Hiển thị đồng thời nhiều mô hình theo bộ môn')]));

    // Module 4
    sections.push(heading2('Module 4: Quản lý Vận hành Tài sản'));
    sections.push(para('Quản lý tài sản, thiết bị toà nhà gắn liền với mô hình BIM sau khi công trình đưa vào vận hành.', { indent: true }));
    sections.push(bullet('Danh sách tài sản theo dự án (hỗ trợ 3.000+ items)'));
    sections.push(bullet('Phân loại: Cơ điện, PCCC, Thang máy, Điều hòa, Camera, v.v.'));
    sections.push(bullet('Theo dõi trạng thái: Hoạt động, Bảo trì, Hỏng, Ngưng sử dụng'));
    sections.push(bullet('Lịch bảo trì định kỳ, heatmap tình trạng tài sản trên mô hình BIM'));

    // Module 5
    sections.push(heading2('Module 5: Quản lý Hợp đồng'));
    sections.push(bullet('Danh sách hợp đồng xây dựng theo dự án'));
    sections.push(bullet('Thông tin: giá trị, tỷ lệ tạm ứng, bảo hành, phạm vi'));
    sections.push(bullet('Quản lý phụ lục/điều chỉnh hợp đồng (Variation Orders)'));
    sections.push(bullet('Liên kết: Hợp đồng ↔ Gói thầu ↔ Nhà thầu ↔ Dự án'));
    sections.push(bullet('Tính thuế VAT tự động (10%)'));

    // Module 6
    sections.push(heading2('Module 6: Quản lý Thanh toán'));
    sections.push(bullet('Tạo đề nghị thanh toán theo hợp đồng, theo đợt'));
    sections.push(bullet('Phân loại: Tạm ứng, Thanh toán KLHT, Thu hồi tạm ứng'));
    sections.push(bullet('Quy trình phê duyệt: Đề nghị → Phê duyệt → Thanh toán'));
    sections.push(bullet('Lũy kế thanh toán, số dư tạm ứng, tham chiếu chứng từ Kho bạc'));

    // Module 7
    sections.push(heading2('Module 7: Quản lý Nhà thầu'));
    sections.push(bullet('Hồ sơ năng lực: tên, MST, giấy phép, đại diện, năm thành lập'));
    sections.push(bullet('Chứng chỉ hành nghề, chứng chỉ năng lực hoạt động xây dựng'));
    sections.push(bullet('Phân biệt nhà thầu trong nước / nước ngoài'));
    sections.push(bullet('Lịch sử tham gia đấu thầu và thực hiện hợp đồng'));

    // Module 8
    sections.push(heading2('Module 8: Quản lý Nhân sự'));
    sections.push(bullet('Danh sách cán bộ, viên chức Ban QLDA'));
    sections.push(bullet('Phân quyền theo vai trò: Giám đốc, Phó GĐ, Trưởng phòng, Chuyên viên'));
    sections.push(bullet('Phân công dự án: thành viên tham gia từng dự án với vai trò cụ thể'));
    sections.push(bullet('Dashboard cá nhân: theo dõi công việc, tiến độ'));

    // Module 9
    sections.push(heading2('Module 9: Quản lý Tài liệu'));
    sections.push(bullet('Quản lý theo cây thư mục chuẩn ISO'));
    sections.push(bullet('Upload đa định dạng (PDF, DOC, XLS, DWG, IFC)'));
    sections.push(bullet('Xem trước tài liệu trực tiếp trên web'));
    sections.push(bullet('Lịch sử phiên bản (Version History)'));
    sections.push(bullet('Tìm kiếm, lọc nâng cao, mô phỏng ký số (USB Token PIN)'));

    // Module 10
    sections.push(heading2('Module 10: Báo cáo'));
    sections.push(bullet([text('Báo cáo giám sát dự án', { bold: true }), text(': Tổng hợp tiến độ, tài chính, rủi ro')]));
    sections.push(bullet([text('Báo cáo giải ngân', { bold: true }), text(': Chi tiết theo kỳ, lũy kế, so sánh kế hoạch')]));
    sections.push(bullet([text('Báo cáo vấn đề', { bold: true }), text(': Tổng hợp rủi ro, vướng mắc cần xử lý')]));
    sections.push(bullet('Xuất báo cáo PDF/Excel'));

    // Module 11
    sections.push(heading2('Module 11: Quy chế hoạt động'));
    sections.push(bullet('Số hóa Quy chế hoạt động Ban QLDA (theo QĐ 2535/QĐ-HVCTQG)'));
    sections.push(bullet('Hiển thị trực quan: Sơ đồ tổ chức, Quy trình, Bản đồ quan hệ'));
    sections.push(bullet('Tra cứu theo Chương/Điều, chi tiết 5 phòng ban'));
    sections.push(bullet('Bình luận, trao đổi trên từng điều khoản'));

    // Module 12
    sections.push(heading2('Module 12: Trợ lý AI'));
    sections.push(bullet('Tích hợp Google Gemini AI'));
    sections.push(bullet('Tra cứu nhanh quy định pháp luật về đầu tư công, xây dựng'));
    sections.push(bullet('Hỏi đáp theo ngữ cảnh dự án, hỗ trợ soạn văn bản'));

    // Module 13
    sections.push(heading2('Module 13: Quản trị hệ thống'));
    sections.push(bullet([text('Cài đặt', { bold: true }), text(': Giao diện Light/Dark mode, Tích hợp Google Drive')]));
    sections.push(bullet([text('Nhật ký hoạt động', { bold: true }), text(' (Audit Log): Ghi lại mọi thao tác trên hệ thống')]));
    sections.push(bullet([text('Xác thực', { bold: true }), text(': Đăng nhập bằng email hoặc Google OAuth')]));
    sections.push(bullet([text('Phân quyền RLS', { bold: true }), text(': Kiểm soát truy cập dữ liệu ở cấp database')]));

    // ── IV. YÊU CẦU HỆ THỐNG ──
    sections.push(new Paragraph({ children: [new PageBreak()] }));
    sections.push(heading1('IV. YÊU CẦU HỆ THỐNG'));

    sections.push(heading2('Phía người dùng (Client)'));
    sections.push(makeTable(
        ['Yêu cầu', 'Tối thiểu'],
        [
            ['Trình duyệt', 'Chrome 90+, Edge 90+, Firefox 90+, Safari 15+'],
            ['Kết nối', 'Internet tốc độ ≥ 10 Mbps'],
            ['Màn hình', '1366×768 trở lên (khuyến nghị 1920×1080)'],
            ['Thiết bị', 'PC, Laptop, Tablet'],
        ],
        [30, 70]
    ));
    sections.push(emptyLine());

    sections.push(heading2('Phía máy chủ (Server) — Cloud'));
    sections.push(makeTable(
        ['Thành phần', 'Dịch vụ', 'Ghi chú'],
        [
            ['Database', 'Supabase Pro (PostgreSQL 17)', 'Auto backup hàng ngày'],
            ['Hosting', 'Vercel Pro', 'CDN global, SSL miễn phí'],
            ['Storage', 'Supabase Storage', '100 GB included'],
            ['Auth', 'Supabase Auth', '100K MAU included'],
        ],
        [25, 40, 35]
    ));
    sections.push(emptyLine());
    sections.push(para([text('Lưu ý: ', { bold: true, italic: true }), text('Hệ thống sử dụng kiến trúc serverless, không yêu cầu quản trị máy chủ vật lý.', { italic: true })]));

    // ── V. DỰ TOÁN CHI PHÍ ──
    sections.push(new Paragraph({ children: [new PageBreak()] }));
    sections.push(heading1('V. DỰ TOÁN CHI PHÍ (20 NGƯỜI DÙNG)'));

    sections.push(heading2('A. Chi phí xây dựng ban đầu (một lần)'));
    sections.push(makeTable(
        ['STT', 'Hạng mục', 'Chi phí (VNĐ)', 'Ghi chú'],
        [
            ['1', 'Phân tích yêu cầu & thiết kế UI/UX', '30.000.000', '2-3 tuần'],
            ['2', 'Xây dựng 8 module nghiệp vụ cốt lõi', '120.000.000', 'Dashboard, Dự án, HĐ, TT, Vốn, NS, NT, TL'],
            ['3', 'Module BIM Viewer 3D', '50.000.000', 'IFC parser, 3D rendering, section, measure'],
            ['4', 'Module Đấu thầu & Báo cáo', '30.000.000', 'KHLCNT, template xuất biểu mẫu'],
            ['5', 'Tích hợp AI (Gemini)', '20.000.000', 'Tra cứu pháp luật, hỏi đáp'],
            ['6', 'Hệ thống xác thực & phân quyền', '15.000.000', 'Auth, RLS, vai trò'],
            ['7', 'Thiết kế database & migration', '10.000.000', '22 bảng, quan hệ, indexes, triggers'],
            ['8', 'Kiểm thử & nghiệm thu', '15.000.000', 'UAT, bug fixing'],
            ['9', 'Đào tạo & tài liệu hướng dẫn', '10.000.000', 'Đào tạo 20 users'],
        ],
        [7, 38, 20, 35]
    ));
    sections.push(emptyLine());
    // Total row
    sections.push(new Table({
        rows: [new TableRow({
            children: [
                dataCell('', { width: 7, shading: DARK_BLUE }),
                dataCell([text('TỔNG CỘNG', { bold: true, size: 22, color: WHITE })], { width: 38, shading: DARK_BLUE }),
                dataCell([text('300.000.000', { bold: true, size: 22, color: WHITE })], { width: 20, shading: DARK_BLUE, align: AlignmentType.RIGHT }),
                dataCell([text('≈ 12.000 USD', { bold: true, size: 22, color: WHITE })], { width: 35, shading: DARK_BLUE }),
            ],
        })],
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
    }));

    sections.push(emptyLine());
    sections.push(heading2('B. Chi phí vận hành hàng tháng'));
    sections.push(makeTable(
        ['STT', 'Hạng mục', 'Chi phí/tháng (VNĐ)', 'Ghi chú'],
        [
            ['1', 'Supabase Pro (DB + Auth + Storage)', '625.000', '$25/tháng'],
            ['2', 'Vercel Pro (Hosting + CDN)', '500.000', '$20/tháng'],
            ['3', 'Google Maps API', '125.000', '~$5, có $200 credit miễn phí'],
            ['4', 'Google Gemini AI', '250.000', '~$10, phụ thuộc lượng query'],
            ['5', 'Tên miền (.vn)', '42.000', '500K/năm ÷ 12'],
            ['6', 'Bảo trì, sửa lỗi & hỗ trợ kỹ thuật', '2.000.000', 'Part-time, hỗ trợ users'],
        ],
        [7, 38, 22, 33]
    ));
    sections.push(emptyLine());
    sections.push(new Table({
        rows: [new TableRow({
            children: [
                dataCell('', { width: 7, shading: DARK_BLUE }),
                dataCell([text('TỔNG/THÁNG', { bold: true, size: 22, color: WHITE })], { width: 38, shading: DARK_BLUE }),
                dataCell([text('3.542.000', { bold: true, size: 22, color: WHITE })], { width: 22, shading: DARK_BLUE, align: AlignmentType.RIGHT }),
                dataCell([text('≈ 142 USD | 177.100/user', { bold: true, size: 22, color: WHITE })], { width: 33, shading: DARK_BLUE }),
            ],
        })],
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
    }));

    sections.push(emptyLine());
    sections.push(heading2('C. Tổng hợp chi phí'));
    sections.push(makeTable(
        ['Mục', 'Số tiền (VNĐ)', 'Ghi chú'],
        [
            ['Chi phí xây dựng ban đầu', '300.000.000', 'Một lần'],
            ['Chi phí hàng tháng (hạ tầng + vận hành)', '3.542.000', '≈ 142 USD'],
            ['Tổng năm đầu tiên', '342.504.000', 'Ban đầu + 12 tháng'],
            ['Tổng/năm (từ năm thứ 2)', '42.504.000', 'Chỉ hạ tầng + vận hành'],
            ['Chi phí / user / tháng', '177.100', '20 người dùng'],
        ],
        [45, 25, 30]
    ));
    sections.push(emptyLine());
    sections.push(para([text('Ghi chú: ', { bold: true, italic: true }), text('Chi phí nâng cấp tính năng mới (nếu có) sẽ được báo giá riêng theo yêu cầu. Chi phí trên chưa bao gồm VAT.', { italic: true })]));

    // ── VI. LỘ TRÌNH ──
    sections.push(new Paragraph({ children: [new PageBreak()] }));
    sections.push(heading1('VI. LỘ TRÌNH TRIỂN KHAI'));
    sections.push(para('Tổng thời gian triển khai dự kiến: 4 tháng, chia thành 3 giai đoạn.', { indent: true }));
    sections.push(emptyLine());
    sections.push(makeTable(
        ['Giai đoạn', 'Thời gian', 'Nội dung chính'],
        [
            ['GĐ 1', 'Tuần 1-9', 'Phân tích, thiết kế, xây dựng 8 module cốt lõi'],
            ['GĐ 2', 'Tuần 10-13', 'Module BIM, AI, Đấu thầu, Báo cáo'],
            ['GĐ 3', 'Tuần 14-16', 'Kiểm thử, đào tạo, vận hành thử, go-live'],
        ],
        [15, 20, 65]
    ));

    // ── VII. CAM KẾT ──
    sections.push(emptyLine());
    sections.push(heading1('VII. CAM KẾT'));
    const commitments = [
        ['Bảo mật dữ liệu', 'Mã hóa SSL/TLS, phân quyền cấp dòng dữ liệu (RLS), nhật ký hoạt động'],
        ['Sao lưu tự động', 'Backup database hàng ngày, lưu trữ 7 ngày gần nhất'],
        ['Uptime', '≥ 99.9% (theo SLA của Supabase & Vercel)'],
        ['Hỗ trợ kỹ thuật', 'Phản hồi trong vòng 24h ngày làm việc'],
        ['Bảo hành', '12 tháng kể từ ngày nghiệm thu'],
        ['Đào tạo', 'Đào tạo trực tiếp cho 20 người dùng, cung cấp tài liệu HDSD'],
    ];
    commitments.forEach(([title, desc], i) => {
        sections.push(bullet([text(`${title}: `, { bold: true }), text(desc)]));
    });

    // ── SIGNATURE ──
    sections.push(emptyLine());
    sections.push(emptyLine());
    sections.push(new Paragraph({
        children: [text('─────────────────────────────────────────', { color: ACCENT })],
        alignment: AlignmentType.CENTER,
    }));
    sections.push(emptyLine());

    // Signature table
    sections.push(new Table({
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        children: [
                            new Paragraph({ children: [text('BÊN CUNG CẤP', { bold: true, size: 22 })], alignment: AlignmentType.CENTER }),
                            emptyLine(), emptyLine(), emptyLine(),
                            new Paragraph({ children: [text('_________________________', { size: 22 })], alignment: AlignmentType.CENTER }),
                        ],
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                    }),
                    new TableCell({
                        children: [
                            new Paragraph({ children: [text('BÊN SỬ DỤNG', { bold: true, size: 22 })], alignment: AlignmentType.CENTER }),
                            emptyLine(), emptyLine(), emptyLine(),
                            new Paragraph({ children: [text('_________________________', { size: 22 })], alignment: AlignmentType.CENTER }),
                        ],
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                    }),
                ],
            }),
        ],
        width: { size: 100, type: WidthType.PERCENTAGE },
    }));

    return sections;
}

// ============================================
// BUILD DOCUMENT
// ============================================
async function main() {
    const doc = new Document({
        styles: {
            default: {
                document: {
                    run: { font: FONT, size: 24 },
                    paragraph: { spacing: { line: 312 } },
                },
                heading1: {
                    run: { font: FONT, size: 28, bold: true, color: DARK_BLUE },
                    paragraph: { spacing: { before: 360, after: 200 } },
                },
                heading2: {
                    run: { font: FONT, size: 26, bold: true, color: BLUE },
                    paragraph: { spacing: { before: 300, after: 160 } },
                },
                heading3: {
                    run: { font: FONT, size: 24, bold: true, color: BLUE },
                    paragraph: { spacing: { before: 240, after: 120 } },
                },
            },
        },
        numbering: {
            config: [{
                reference: 'default-bullet',
                levels: [
                    { level: 0, format: NumberFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 480, hanging: 240 } } } },
                    { level: 1, format: NumberFormat.BULLET, text: '◦', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 960, hanging: 240 } } } },
                ],
            }],
        },
        sections: [{
            properties: {
                page: {
                    margin: {
                        top: convertInchesToTwip(1),
                        right: convertInchesToTwip(0.8),
                        bottom: convertInchesToTwip(0.8),
                        left: convertInchesToTwip(1.2),
                    },
                },
            },
            headers: {
                default: new Header({
                    children: [new Paragraph({
                        children: [text('Smart Public Investment Manager — Tài liệu giới thiệu phần mềm', { size: 16, color: GRAY, italic: true })],
                        alignment: AlignmentType.RIGHT,
                        border: { bottom: { color: LIGHT_BLUE, space: 4, size: 6, style: BorderStyle.SINGLE } },
                    })],
                }),
            },
            footers: {
                default: new Footer({
                    children: [new Paragraph({
                        children: [
                            text('Ban QLDA ĐTXD CN — Học viện CTQG HCM', { size: 16, color: GRAY }),
                            text('        Trang ', { size: 16, color: GRAY }),
                            new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: GRAY }),
                            text('/', { size: 16, color: GRAY }),
                            new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: 16, color: GRAY }),
                        ],
                        alignment: AlignmentType.CENTER,
                        border: { top: { color: LIGHT_BLUE, space: 4, size: 6, style: BorderStyle.SINGLE } },
                    })],
                }),
            },
            children: [
                ...coverPage(),
                ...tocPage(),
                ...mainContent(),
            ],
        }],
    });

    const buffer = await Packer.toBuffer(doc);
    const outputPath = process.argv[2] || './TaiLieu_GioiThieu_PhanMem_QLDA.docx';
    fs.writeFileSync(outputPath, buffer);
    console.log(`✅ Đã tạo file: ${outputPath}`);
    console.log(`📄 Kích thước: ${(buffer.length / 1024).toFixed(1)} KB`);
}

main().catch(err => {
    console.error('❌ Lỗi:', err.message);
    process.exit(1);
});
