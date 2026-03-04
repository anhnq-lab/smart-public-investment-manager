/**
 * Mẫu tài liệu theo bước quy trình (TimelineStep)
 * Căn cứ: NĐ 175/2024/NĐ-CP, Luật Xây dựng 2014 (sửa đổi),
 *          Luật Đầu tư công 58/2024/QH15, NĐ 15/2021/NĐ-CP
 *
 * Mỗi template có `keywords` để match với tên công việc (task.Title).
 * Chỉ hiện template nào khớp với công việc đó.
 */

export interface TaskTemplate {
    name: string;
    description: string;
    fileType: 'docx' | 'xlsx' | 'pdf';
    legalBasis?: string;
    keywords: string[];  // match against task.Title (lowercase)
    templatePath?: string; // link to .md template in /public/templates/ for DOCX export
}

/**
 * Map: TimelineStep code → danh sách tài liệu mẫu cần có
 */
export const TASK_TEMPLATES: Record<string, TaskTemplate[]> = {
    // ═══════════════════════════════════════════════════
    // PHASE 1: Chuẩn bị dự án
    // ═══════════════════════════════════════════════════

    'PREP_ODA': [
        { name: 'Đề xuất chương trình/dự án ODA', description: 'Văn bản đề xuất chương trình, dự án sử dụng vốn ODA', fileType: 'docx', legalBasis: 'NĐ 114/2021/NĐ-CP', keywords: ['đề xuất', 'oda', 'lập đề xuất'] },
        { name: 'Ý kiến nhà tài trợ', description: 'Văn bản ý kiến của nhà tài trợ về chương trình/dự án', fileType: 'pdf', keywords: ['ý kiến', 'tài trợ'] },
    ],

    'PREP_PREFEASIBILITY': [
        { name: 'Báo cáo nghiên cứu tiền khả thi', description: 'Báo cáo NCTKKT theo Điều 53 Luật XD 2014', fileType: 'docx', legalBasis: 'Điều 53 Luật XD 2014', keywords: ['báo cáo', 'tiền khả thi', 'nctkkt', 'lập bc'], templatePath: 'mau-02-bc-nctkt-du-an-nhom-a.md' },
        { name: 'Tờ trình thẩm định BCNCTKKT', description: 'Tờ trình gửi cơ quan thẩm định', fileType: 'docx', keywords: ['tờ trình', 'thẩm định', 'trình thẩm định'], templatePath: 'mau-01-to-trinh-tham-dinh-bc-nctkt.md' },
        { name: 'Kết quả thẩm định BCNCTKKT', description: 'Văn bản kết quả thẩm định của cơ quan có thẩm quyền', fileType: 'pdf', keywords: ['kết quả', 'thẩm định', 'phê duyệt'] },
    ],

    'PREP_POLICY': [
        { name: 'Tờ trình đề xuất chủ trương đầu tư', description: 'Tờ trình trình cấp có thẩm quyền phê duyệt chủ trương ĐT', fileType: 'docx', legalBasis: 'Điều 27 Luật ĐTC 58/2024', keywords: ['tờ trình', 'trình'], templatePath: 'mau-05-to-trinh-qd-chu-truong-dt.md' },
        { name: 'Báo cáo đề xuất chủ trương đầu tư', description: 'Nội dung: mục tiêu, quy mô, sơ bộ tổng mức ĐT, nguồn vốn', fileType: 'docx', legalBasis: 'Điều 29 Luật ĐTC 58/2024', keywords: ['báo cáo', 'lập bc', 'đề xuất'], templatePath: 'mau-03-bc-de-xuat-chu-truong-dt.md' },
        { name: 'Quyết định phê duyệt chủ trương ĐT', description: 'QĐ của cấp có thẩm quyền phê duyệt chủ trương đầu tư', fileType: 'pdf', legalBasis: 'Điều 34 Luật ĐTC 58/2024', keywords: ['quyết định', 'phê duyệt', 'qđ'], templatePath: 'mau-06-nghi-quyet-chu-truong-dt.md' },
    ],

    'PREP_SURVEY': [
        { name: 'Nhiệm vụ khảo sát xây dựng', description: 'Đề cương nhiệm vụ khảo sát đia hình, địa chất', fileType: 'docx', legalBasis: 'Điều 76 Luật XD 2014', keywords: ['nhiệm vụ', 'lập nhiệm vụ'] },
        { name: 'Phương án kỹ thuật khảo sát', description: 'Phương án kỹ thuật trước khi thực hiện khảo sát', fileType: 'docx', keywords: ['phương án', 'kỹ thuật'] },
        { name: 'Báo cáo kết quả khảo sát', description: 'Báo cáo kết quả khảo sát địa hình, địa chất CT', fileType: 'docx', keywords: ['báo cáo', 'kết quả', 'thực hiện'] },
    ],

    'PREP_PLANNING': [
        { name: 'Nhiệm vụ quy hoạch XD', description: 'Nhiệm vụ lập quy hoạch xây dựng', fileType: 'docx', legalBasis: 'Luật Quy hoạch 2017', keywords: ['nhiệm vụ', 'lập'] },
        { name: 'Đồ án quy hoạch XD', description: 'Hồ sơ đồ án quy hoạch chi tiết xây dựng', fileType: 'pdf', keywords: ['đồ án', 'hồ sơ'] },
        { name: 'QĐ phê duyệt Quy hoạch', description: 'Quyết định phê duyệt quy hoạch xây dựng', fileType: 'pdf', keywords: ['quyết định', 'phê duyệt', 'qđ'] },
    ],

    'PREP_FEASIBILITY': [
        { name: 'Báo cáo nghiên cứu khả thi (F/S)', description: 'BCNCKT theo Điều 54 Luật XD 2014', fileType: 'docx', legalBasis: 'Điều 54 Luật XD 2014', keywords: ['báo cáo', 'lập bc', 'lập báo cáo', 'nckt', 'khả thi'], templatePath: 'to-trinh-tham-dinh-bcnckt.md' },
        { name: 'Thiết kế cơ sở', description: 'Hồ sơ thiết kế cơ sở kèm BCNCKT', fileType: 'pdf', legalBasis: 'Điều 54 Luật XD 2014', keywords: ['thiết kế cơ sở', 'tkcs'] },
        { name: 'Báo cáo ĐTM', description: 'Báo cáo đánh giá tác động môi trường', fileType: 'docx', legalBasis: 'Luật BVMT 2020', keywords: ['đtm', 'môi trường', 'tác động'] },
        { name: 'Tờ trình thẩm định BCNCKT', description: 'Tờ trình gửi cơ quan thẩm định', fileType: 'docx', keywords: ['tờ trình', 'trình thẩm định'], templatePath: 'to-trinh-tham-dinh-bcnckt.md' },
        { name: 'Kết quả thẩm định BCNCKT', description: 'Kết quả thẩm định của cơ quan nhà nước CQ', fileType: 'pdf', keywords: ['kết quả', 'thẩm định'], templatePath: 'thong-bao-ket-qua-tham-dinh-bcnckt.md' },
    ],

    'PREP_DECISION': [
        { name: 'Tờ trình phê duyệt dự án', description: 'Tờ trình trình cấp CQ phê duyệt dự án đầu tư XD', fileType: 'docx', legalBasis: 'NĐ 15/2021/NĐ-CP', keywords: ['tờ trình', 'trình phê duyệt'], templatePath: 'to-trinh-tham-dinh-bcnckt.md' },
        { name: 'Quyết định phê duyệt dự án ĐT XD', description: 'QĐ phê duyệt dự án bao gồm TK cơ sở', fileType: 'pdf', legalBasis: 'Điều 60 Luật XD 2014', keywords: ['quyết định', 'phê duyệt', 'qđ'], templatePath: 'quyet-dinh-phe-duyet-du-an-bcnckt.md' },
        { name: 'Kế hoạch lựa chọn nhà thầu', description: 'Kế hoạch tổng thể và chi tiết lựa chọn nhà thầu', fileType: 'xlsx', legalBasis: 'Luật Đấu thầu 2023', keywords: ['kế hoạch', 'lựa chọn nhà thầu', 'khlcnt'], templatePath: 'mau-09-qd-phe-duyet-khlcnt.md' },
    ],

    // ═══════════════════════════════════════════════════
    // PHASE 2: Thực hiện dự án
    // ═══════════════════════════════════════════════════

    'IMPL_SITE': [
        { name: 'Phương án bồi thường, GPMB', description: 'Phương án bồi thường, hỗ trợ, tái định cư', fileType: 'docx', legalBasis: 'Luật Đất đai 2024', keywords: ['bồi thường', 'gpmb', 'phương án', 'giải phóng'] },
        { name: 'QĐ thu hồi đất', description: 'Quyết định thu hồi đất và phương án TĐC', fileType: 'pdf', keywords: ['thu hồi', 'quyết định'] },
        { name: 'Biên bản bàn giao mặt bằng', description: 'Biên bản bàn giao mặt bằng thi công', fileType: 'docx', keywords: ['bàn giao', 'mặt bằng'] },
    ],

    'IMPL_SURVEY': [
        { name: 'Nhiệm vụ khảo sát phục vụ TK', description: 'Nhiệm vụ khảo sát phục vụ thiết kế kỹ thuật/BVTC', fileType: 'docx', keywords: ['nhiệm vụ', 'lập'] },
        { name: 'Báo cáo kết quả khảo sát TK', description: 'Báo cáo khảo sát chi tiết phục vụ thiết kế', fileType: 'docx', keywords: ['báo cáo', 'kết quả', 'thực hiện'] },
    ],

    'IMPL_DESIGN': [
        { name: 'Hồ sơ TKKT', description: 'Hồ sơ thiết kế kỹ thuật', fileType: 'pdf', legalBasis: 'NĐ 15/2021/NĐ-CP', keywords: ['tkkt', 'thiết kế kỹ thuật', 'lập tk'] },
        { name: 'Hồ sơ TKBVTC', description: 'Hồ sơ thiết kế bản vẽ thi công', fileType: 'pdf', keywords: ['tkbvtc', 'bản vẽ thi công'] },
        { name: 'Dự toán xây dựng', description: 'Dự toán chi tiết theo từng hạng mục', fileType: 'xlsx', legalBasis: 'TT 11/2021/TT-BXD', keywords: ['dự toán', 'lập dự toán'] },
        { name: 'Kết quả thẩm định TK-DT', description: 'Kết quả thẩm định thiết kế và dự toán', fileType: 'pdf', keywords: ['thẩm định', 'kết quả'] },
        { name: 'QĐ phê duyệt TK-DT', description: 'Quyết định phê duyệt thiết kế kỹ thuật và dự toán', fileType: 'pdf', keywords: ['quyết định', 'phê duyệt', 'qđ'] },
    ],

    'IMPL_PERMIT': [
        { name: 'Đơn xin cấp GPXD', description: 'Đơn đề nghị cấp giấy phép xây dựng', fileType: 'docx', legalBasis: 'Điều 95 Luật XD 2014', keywords: ['đơn xin', 'đề nghị', 'lập đơn'] },
        { name: 'Giấy phép xây dựng', description: 'Giấy phép xây dựng CT', fileType: 'pdf', keywords: ['giấy phép', 'cấp giấy phép'] },
        { name: 'Văn bản chấp thuận PCCC', description: 'Văn bản thẩm duyệt thiết kế PCCC', fileType: 'pdf', legalBasis: 'Luật PCCC', keywords: ['pccc', 'phòng cháy'] },
    ],

    'IMPL_BIDDING': [
        { name: 'Hồ sơ mời thầu (HSMT)', description: 'HSMT gói thầu xây lắp/tư vấn', fileType: 'docx', legalBasis: 'Luật Đấu thầu 2023', keywords: ['hồ sơ mời thầu', 'hsmt', 'lập hsmt'], templatePath: 'mau-46-55-dau-thau-nhom-1.md' },
        { name: 'Báo cáo đánh giá HSDT', description: 'Báo cáo đánh giá hồ sơ dự thầu', fileType: 'docx', keywords: ['đánh giá', 'hsdt', 'báo cáo'], templatePath: 'mau-08-bc-tham-dinh-khlcnt.md' },
        { name: 'QĐ phê duyệt KQLCNT', description: 'Quyết định phê duyệt kết quả lựa chọn nhà thầu', fileType: 'pdf', keywords: ['quyết định', 'phê duyệt', 'kqlcnt', 'kết quả'], templatePath: 'mau-09-qd-phe-duyet-khlcnt.md' },
        { name: 'Hợp đồng xây dựng', description: 'Hợp đồng thi công xây dựng CT', fileType: 'docx', legalBasis: 'NĐ 37/2015/NĐ-CP', keywords: ['hợp đồng', 'ký hđ', 'ký hợp đồng'], templatePath: 'mau-42-45-hop-dong-xay-dung.md' },
    ],

    'IMPL_CONSTRUCTION': [
        { name: 'Nhật ký thi công', description: 'Sổ nhật ký thi công hàng ngày', fileType: 'xlsx', keywords: ['nhật ký', 'thi công'] },
        { name: 'Biên bản nghiệm thu vật liệu', description: 'Biên bản NT vật liệu, cấu kiện trước khi đưa vào CT', fileType: 'docx', keywords: ['vật liệu', 'nghiệm thu vật liệu'] },
        { name: 'Biên bản nghiệm thu công việc', description: 'Biên bản NT công việc xây dựng', fileType: 'docx', legalBasis: 'NĐ 06/2021/NĐ-CP', keywords: ['nghiệm thu', 'công việc'] },
        { name: 'Biên bản nghiệm thu giai đoạn', description: 'Biên bản NT hoàn thành giai đoạn thi công', fileType: 'docx', keywords: ['nghiệm thu', 'giai đoạn'] },
    ],

    'IMPL_SUPERVISION': [
        { name: 'Báo cáo giám sát thi công', description: 'Báo cáo định kỳ của tư vấn giám sát', fileType: 'docx', keywords: ['báo cáo', 'giám sát'] },
        { name: 'Nhật ký giám sát', description: 'Sổ nhật ký giám sát thi công', fileType: 'xlsx', keywords: ['nhật ký', 'giám sát'] },
        { name: 'Biên bản xử lý sự cố', description: 'Biên bản xử lý sự cố (nếu có)', fileType: 'docx', keywords: ['sự cố', 'xử lý'] },
    ],

    'IMPL_PAYMENT': [
        { name: 'Bảng xác nhận KLHT', description: 'Bảng xác nhận khối lượng hoàn thành', fileType: 'xlsx', legalBasis: 'NĐ 99/2021/NĐ-CP', keywords: ['xác nhận', 'klht', 'khối lượng'], templatePath: 'mau-28-bang-xac-dinh-gia-tri-klcv-hoan-thanh.md' },
        { name: 'Hồ sơ đề nghị thanh toán', description: 'Hồ sơ đề nghị thanh toán KLHT', fileType: 'docx', keywords: ['thanh toán', 'đề nghị thanh toán'], templatePath: 'mau-25-giay-de-nghi-thanh-toan-von.md' },
        { name: 'Giấy đề nghị tạm ứng', description: 'Giấy đề nghị tạm ứng vốn đầu tư', fileType: 'docx', keywords: ['tạm ứng', 'đề nghị tạm ứng'], templatePath: 'mau-26-giay-de-nghi-rut-von.md' },
    ],

    'IMPL_ACCEPTANCE': [
        { name: 'Biên bản nghiệm thu hoàn thành CT', description: 'Biên bản NT hoàn thành công trình đưa vào sử dụng', fileType: 'docx', legalBasis: 'NĐ 06/2021/NĐ-CP', keywords: ['nghiệm thu', 'hoàn thành'] },
        { name: 'Hồ sơ hoàn công', description: 'Bản vẽ hoàn công công trình', fileType: 'pdf', keywords: ['hoàn công', 'bản vẽ'] },
        { name: 'Chứng nhận đủ ĐK nghiệm thu', description: 'Thông báo kết quả kiểm tra công tác NT', fileType: 'pdf', keywords: ['chứng nhận', 'kiểm tra'] },
    ],

    // ═══════════════════════════════════════════════════
    // PHASE 3: Kết thúc xây dựng
    // ═══════════════════════════════════════════════════

    'CLOSE_CONTRACT_SETTLEMENT': [
        { name: 'Biên bản thanh lý hợp đồng', description: 'Biên bản thanh lý HĐ xây dựng', fileType: 'docx', keywords: ['thanh lý', 'biên bản'] },
        { name: 'Hồ sơ quyết toán HĐ', description: 'Bộ hồ sơ quyết toán hợp đồng xây dựng', fileType: 'xlsx', legalBasis: 'NĐ 37/2015/NĐ-CP', keywords: ['quyết toán', 'hồ sơ'] },
    ],

    'CLOSE_CAPITAL_SETTLEMENT': [
        { name: 'Báo cáo quyết toán vốn ĐT', description: 'Báo cáo quyết toán vốn đầu tư dự án hoàn thành', fileType: 'xlsx', legalBasis: 'TT 96/2021/TT-BTC', keywords: ['báo cáo', 'quyết toán', 'lập'], templatePath: 'mau-32-bc-tong-hop-quyet-toan-da.md' },
        { name: 'QĐ phê duyệt quyết toán', description: 'Quyết định phê duyệt quyết toán vốn ĐT', fileType: 'pdf', keywords: ['quyết định', 'phê duyệt', 'qđ'] },
    ],

    'CLOSE_HANDOVER': [
        { name: 'Biên bản bàn giao CT', description: 'Biên bản bàn giao CT đưa vào khai thác sử dụng', fileType: 'docx', keywords: ['bàn giao', 'biên bản'] },
        { name: 'Hồ sơ quản lý chất lượng', description: 'Hồ sơ QLCL bàn giao cho chủ sở hữu', fileType: 'pdf', keywords: ['chất lượng', 'qlcl', 'hồ sơ'] },
    ],

    'CLOSE_WARRANTY': [
        { name: 'Hợp đồng bảo hành', description: 'Thỏa thuận bảo hành công trình', fileType: 'docx', legalBasis: 'Điều 125 Luật XD 2014', keywords: ['hợp đồng', 'bảo hành', 'ký'] },
        { name: 'Biên bản hết hạn bảo hành', description: 'Biên bản xác nhận hết thời hạn bảo hành', fileType: 'docx', keywords: ['hết hạn', 'biên bản', 'xác nhận'] },
    ],

    'CLOSE_ARCHIVE': [
        { name: 'Danh mục hồ sơ lưu trữ', description: 'Danh mục tài liệu bàn giao lưu trữ theo NĐ 175/2024', fileType: 'xlsx', legalBasis: 'NĐ 175/2024/NĐ-CP', keywords: ['danh mục', 'lưu trữ'] },
        { name: 'Biên bản bàn giao hồ sơ', description: 'Biên bản bàn giao hồ sơ lưu trữ', fileType: 'docx', keywords: ['bàn giao', 'biên bản'] },
    ],
};

/**
 * Get templates for a specific task — filtered by task title keywords.
 * If no keywords match, returns all templates for that step (fallback).
 */
export function getTaskTemplates(timelineStep?: string, taskTitle?: string): TaskTemplate[] {
    if (!timelineStep) return [];
    const all = TASK_TEMPLATES[timelineStep] || [];
    if (!taskTitle || all.length === 0) return all;

    const titleLower = taskTitle.toLowerCase();

    // Filter templates whose keywords match the task title
    const matched = all.filter(tpl =>
        tpl.keywords.some(kw => titleLower.includes(kw.toLowerCase()))
    );

    // If we found matches, return only those; otherwise fallback to all
    return matched.length > 0 ? matched : all;
}

/**
 * Get file type icon color
 */
export function getFileTypeColor(fileType: string): { bg: string; text: string; icon: string } {
    switch (fileType) {
        case 'docx': return { bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', icon: '📝' };
        case 'xlsx': return { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', icon: '📊' };
        case 'pdf': return { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', icon: '📕' };
        default: return { bg: 'bg-gray-50 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', icon: '📄' };
    }
}
