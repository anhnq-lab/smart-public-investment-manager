// ============================================
// LEGAL DOCUMENTS DATA - Văn bản Pháp luật XD
// ============================================

export type DocType = 'luat' | 'nghi-dinh' | 'thong-tu' | 'qcvn' | 'quyet-dinh';
export type DocStatus = 'hieu-luc' | 'het-hieu-luc' | 'sap-hieu-luc';

export interface LegalArticle {
    id: string;
    code: string;
    title: string;
    summary: string;
}

export interface LegalChapter {
    id: string;
    code: string;
    title: string;
    articles: LegalArticle[];
}

export interface LegalDocument {
    id: string;
    code: string;
    title: string;
    shortTitle: string;
    type: DocType;
    issuedDate: string;
    effectiveDate: string;
    issuedBy: string;
    status: DocStatus;
    summary: string;
    fileName: string;
    filePath: string;
    fileSize: string;
    tags: string[];
    relatedDocIds: string[];
    chapters: LegalChapter[];
}

export const DOC_TYPE_LABELS: Record<DocType, string> = {
    'luat': 'Luật',
    'nghi-dinh': 'Nghị định',
    'thong-tu': 'Thông tư',
    'qcvn': 'QCVN/TCVN',
    'quyet-dinh': 'Quyết định',
};

export const DOC_TYPE_COLORS: Record<DocType, { bg: string; text: string; border: string; darkBg: string; darkText: string; darkBorder: string }> = {
    'luat': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', darkBg: 'dark:bg-red-900/20', darkText: 'dark:text-red-400', darkBorder: 'dark:border-red-800' },
    'nghi-dinh': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', darkBg: 'dark:bg-blue-900/20', darkText: 'dark:text-blue-400', darkBorder: 'dark:border-blue-800' },
    'thong-tu': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', darkBg: 'dark:bg-emerald-900/20', darkText: 'dark:text-emerald-400', darkBorder: 'dark:border-emerald-800' },
    'qcvn': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', darkBg: 'dark:bg-purple-900/20', darkText: 'dark:text-purple-400', darkBorder: 'dark:border-purple-800' },
    'quyet-dinh': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', darkBg: 'dark:bg-amber-900/20', darkText: 'dark:text-amber-400', darkBorder: 'dark:border-amber-800' },
};

export const DOC_STATUS_LABELS: Record<DocStatus, string> = {
    'hieu-luc': 'Còn hiệu lực',
    'het-hieu-luc': 'Hết hiệu lực',
    'sap-hieu-luc': 'Sắp có hiệu lực',
};

export const DOC_STATUS_COLORS: Record<DocStatus, { bg: string; text: string; dot: string }> = {
    'hieu-luc': { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
    'het-hieu-luc': { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-500 dark:text-gray-400', dot: 'bg-gray-400' },
    'sap-hieu-luc': { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
};

// ============================================
// LEGAL DOCUMENTS DATABASE
// ============================================

export const legalDocuments: LegalDocument[] = [
    // ========== LUẬT ==========
    {
        id: 'luat-dau-tu-cong-2019',
        code: 'Luật số 39/2019/QH14',
        title: 'Luật Đầu tư công',
        shortTitle: 'Luật Đầu tư công 2019',
        type: 'luat',
        issuedDate: '13/06/2019',
        effectiveDate: '01/01/2020',
        issuedBy: 'Quốc hội',
        status: 'hieu-luc',
        summary: 'Quy định việc quản lý và sử dụng vốn đầu tư công; quản lý nhà nước về đầu tư công; quyền, nghĩa vụ và trách nhiệm của cơ quan, đơn vị, tổ chức, cá nhân liên quan đến hoạt động đầu tư công.',
        fileName: 'Luật đầu tư công.pdf',
        filePath: '/resources/Luật đầu tư công.pdf',
        fileSize: '12.6 MB',
        tags: ['đầu tư công', 'vốn nhà nước', 'kế hoạch đầu tư', 'thẩm định dự án'],
        relatedDocIds: ['nd-175-2024', 'nd-111-2024'],
        chapters: [
            {
                id: 'luat39-ch1', code: 'Chương I', title: 'Những quy định chung',
                articles: [
                    { id: 'luat39-d1', code: 'Điều 1', title: 'Phạm vi điều chỉnh', summary: 'Luật này quy định việc quản lý và sử dụng vốn đầu tư công, quản lý nhà nước về đầu tư công.' },
                    { id: 'luat39-d4', code: 'Điều 4', title: 'Giải thích từ ngữ', summary: 'Định nghĩa các thuật ngữ: Đầu tư công, vốn đầu tư công, chương trình đầu tư công, dự án đầu tư công...' },
                    { id: 'luat39-d5', code: 'Điều 5', title: 'Phân loại dự án đầu tư công', summary: 'Dự án quan trọng quốc gia, nhóm A, B, C theo tiêu chí tổng mức đầu tư.' },
                    { id: 'luat39-d6', code: 'Điều 6', title: 'Nguyên tắc quản lý đầu tư công', summary: 'Tuân thủ pháp luật, phù hợp chiến lược, kế hoạch, quy hoạch; đảm bảo hiệu quả kinh tế - xã hội.' },
                ]
            },
            {
                id: 'luat39-ch2', code: 'Chương II', title: 'Chủ trương đầu tư chương trình, dự án',
                articles: [
                    { id: 'luat39-d17', code: 'Điều 17', title: 'Thẩm quyền quyết định chủ trương đầu tư', summary: 'Quốc hội, Thủ tướng, Bộ trưởng, UBND quyết định theo phân cấp.' },
                    { id: 'luat39-d30', code: 'Điều 30', title: 'Nội dung Báo cáo nghiên cứu tiền khả thi', summary: 'Sự cần thiết đầu tư, mục tiêu, quy mô, tổng mức đầu tư, phương án huy động vốn.' },
                    { id: 'luat39-d31', code: 'Điều 31', title: 'Nội dung Báo cáo đề xuất chủ trương đầu tư', summary: 'Sự cần thiết, dự kiến mục tiêu, quy mô, tổng mức, tiến độ, hiệu quả.' },
                ]
            },
            {
                id: 'luat39-ch3', code: 'Chương III', title: 'Dự án đầu tư công',
                articles: [
                    { id: 'luat39-d40', code: 'Điều 40', title: 'Lập, thẩm định, quyết định đầu tư', summary: 'Quy trình lập BCNCKT, BCKTKT; thẩm định nguồn vốn và khả năng cân đối vốn.' },
                    { id: 'luat39-d43', code: 'Điều 43', title: 'Nội dung Báo cáo nghiên cứu khả thi', summary: 'Phân tích, đánh giá khả thi về tài chính, kỹ thuật, môi trường.' },
                ]
            },
            {
                id: 'luat39-ch4', code: 'Chương IV', title: 'Kế hoạch đầu tư công',
                articles: [
                    { id: 'luat39-d49', code: 'Điều 49', title: 'Nguyên tắc lập kế hoạch đầu tư công trung hạn', summary: 'Phù hợp kế hoạch tài chính 5 năm, ưu tiên bố trí vốn cho dự án đã phê duyệt.' },
                    { id: 'luat39-d52', code: 'Điều 52', title: 'Kế hoạch đầu tư công hằng năm', summary: 'Lập, thẩm định, phân bổ và giao kế hoạch vốn hằng năm.' },
                ]
            },
        ]
    },
    {
        id: 'luat-xay-dung-2025',
        code: 'Luật số 135/2025/QH15',
        title: 'Luật Xây dựng',
        shortTitle: 'Luật Xây dựng 2025',
        type: 'luat',
        issuedDate: '2025',
        effectiveDate: '01/01/2026',
        issuedBy: 'Quốc hội',
        status: 'hieu-luc',
        summary: 'Luật Xây dựng quy định về hoạt động xây dựng; quyền, nghĩa vụ, trách nhiệm của cơ quan, tổ chức, cá nhân trong hoạt động xây dựng và quản lý nhà nước về xây dựng. Căn cứ Hiến pháp nước CHXHCN Việt Nam.',
        fileName: 'luat135-XD-2025.pdf',
        filePath: '/resources/luat135-XD-2025.pdf',
        fileSize: '4.2 MB',
        tags: ['xây dựng', 'quản lý dự án', 'giấy phép xây dựng', 'chất lượng công trình', 'thiết kế', 'thi công', 'nghiệm thu', 'bảo hành', 'bảo trì', 'khảo sát', 'an toàn xây dựng'],
        relatedDocIds: ['nd-175-2024', 'tt-06-2021', 'qcvn-pccc', 'tt-24-2025', 'nd-140-2025', 'nd-144-2025'],
        chapters: [
            // ===== CHƯƠNG I: NHỮNG QUY ĐỊNH CHUNG =====
            {
                id: 'luat135-ch1', code: 'Chương I', title: 'Những quy định chung',
                articles: [
                    { id: 'luat135-d1', code: 'Điều 1', title: 'Phạm vi điều chỉnh', summary: 'Luật này quy định về hoạt động xây dựng; quyền, nghĩa vụ, trách nhiệm của cơ quan, tổ chức, cá nhân trong hoạt động xây dựng và quản lý nhà nước về xây dựng.' },
                    { id: 'luat135-d2', code: 'Điều 2', title: 'Đối tượng áp dụng', summary: 'Áp dụng đối với cơ quan, tổ chức, cá nhân trong nước; tổ chức, cá nhân nước ngoài có hoạt động xây dựng trên lãnh thổ Việt Nam.' },
                    { id: 'luat135-d3', code: 'Điều 3', title: 'Giải thích từ ngữ', summary: 'Định nghĩa 30 thuật ngữ: hoạt động xây dựng, công trình xây dựng, hệ thống HTKT, HTXH, người quyết định đầu tư, dự án ĐTXD, dự án khu đô thị, tư vấn XD, thiết kế sơ bộ/cơ sở/FEED/kỹ thuật/BVTC, thẩm tra, thẩm định, cơ quan QLNN, nhà thầu, sự cố công trình, vùng nguy hiểm...' },
                    { id: 'luat135-d4', code: 'Điều 4', title: 'Áp dụng Luật Xây dựng và các luật có liên quan', summary: 'Hoạt động XD thực hiện theo Luật XD. Hợp đồng XD chưa quy định cụ thể thì áp dụng Luật Đấu thầu, Luật Đầu tư PPP, BLDS. Quy định khác với Luật Đầu tư về thủ tục đặc biệt thì theo Luật Đầu tư. Quy định khác Luật Đường sắt về dự án đường sắt thì theo Luật Đường sắt.' },
                    { id: 'luat135-d5', code: 'Điều 5', title: 'Nguyên tắc cơ bản trong hoạt động xây dựng', summary: '7 nguyên tắc: (1) Xây dựng theo quy hoạch, bảo vệ cảnh quan, môi trường; (2) Sử dụng hợp lý nguồn lực; (3) Tuân thủ QCKT, tiêu chuẩn; (4) Bảo đảm an toàn, chất lượng, PCCC; (5) Xây dựng đồng bộ HTKT-HTXH; (6) Công khai, minh bạch, phòng chống tham nhũng; (7) Phân định chức năng QLNN với CĐT.' },
                    { id: 'luat135-d6', code: 'Điều 6', title: 'Loại, cấp công trình xây dựng', summary: 'Loại CT xác định theo tính chất kết cấu và công năng. Cấp CT gồm: cấp đặc biệt, I, II, III, IV (căn cứ quy mô, mức độ quan trọng, thông số kỹ thuật). Bộ trưởng BXD quy định chi tiết.' },
                    { id: 'luat135-d7', code: 'Điều 7', title: 'Tiêu chuẩn, quy chuẩn kỹ thuật, ứng dụng KHCN, chuyển đổi số', summary: 'Tiêu chuẩn áp dụng tự nguyện (trừ viện dẫn trong QCKT). Ứng dụng CNTT, CĐS, mô hình thông tin công trình (BIM). Bộ QLCTXDCN xây dựng, cập nhật QCKT quốc gia.' },
                    { id: 'luat135-d8', code: 'Điều 8', title: 'Vật liệu xây dựng', summary: 'VLXD phải an toàn, hiệu quả, thân thiện môi trường. Phải theo thiết kế, chỉ dẫn kỹ thuật đã phê duyệt. Ưu tiên VLXD tại chỗ, sản phẩm nội địa hóa cao.' },
                    { id: 'luat135-d9', code: 'Điều 9', title: 'Chủ đầu tư', summary: 'Dự án ĐTC: CĐT là Ban QLDA hoặc cơ quan được giao. Dự án PPP: CĐT là doanh nghiệp dự án PPP. Dự án đầu tư kinh doanh: CĐT là nhà đầu tư được lựa chọn. Trường hợp khác: CĐT là tổ chức/cá nhân bỏ vốn.' },
                    { id: 'luat135-d10', code: 'Điều 10', title: 'Bảo hiểm trong hoạt động xây dựng', summary: 'Bảo hiểm bắt buộc: (a) BH công trình trong thời gian XD cho CT ảnh hưởng lớn; (b) BH trách nhiệm nghề nghiệp tư vấn từ cấp II trở lên; (c) BH cho người lao động thi công và trách nhiệm dân sự bên thứ ba.' },
                    { id: 'luat135-d11', code: 'Điều 11', title: 'Chính sách khuyến khích trong hoạt động xây dựng', summary: 'Khuyến khích bảo tồn di tích, nhà ở xã hội, xây dựng miền núi/hải đảo. Khuyến khích VLXD mới/tái chế/xanh/thông minh, công trình xanh, đô thị thông minh. Nghiên cứu ứng dụng KHCN, đổi mới sáng tạo.' },
                    { id: 'luat135-d12', code: 'Điều 12', title: 'Hợp tác quốc tế trong hoạt động xây dựng', summary: 'Khuyến khích mở rộng hợp tác quốc tế, chuyển giao công nghệ. Nhà nước hỗ trợ ký kết điều ước quốc tế, bảo hộ thương hiệu XD Việt Nam ở nước ngoài. Bảo đảm an ninh, chủ quyền.' },
                    { id: 'luat135-d13', code: 'Điều 13', title: 'Bất khả kháng và hoàn cảnh thay đổi cơ bản', summary: 'Bất khả kháng: thiên tai, hỏa hoạn, dịch bệnh, tình trạng khẩn cấp, đình công, cổ vật/khảo cổ. Hoàn cảnh thay đổi cơ bản: Nhà nước thay đổi chính sách/pháp luật, điều kiện bất thường về địa chất.' },
                    { id: 'luat135-d14', code: 'Điều 14', title: 'Hệ thống thông tin, CSDL quốc gia về hoạt động xây dựng', summary: 'CSDL quốc gia về HĐXD là nền tảng chuyển đổi số trong quản lý XD. Dữ liệu là tham chiếu gốc phục vụ tra cứu. Phải kết nối đồng bộ với CSDL quốc gia về đất đai, quy hoạch. Chính phủ quy định chi tiết.' },
                    { id: 'luat135-d15', code: 'Điều 15', title: 'Các hành vi bị nghiêm cấm', summary: '10 hành vi: XD trong khu vực cấm; không phù hợp QCKT; khởi công khi chưa đủ ĐK; VLXD không đảm bảo; vi phạm an toàn/PCCC/MT; sử dụng CT sai mục đích; hối lộ/thông đồng; lạm dụng chức vụ; cản trở HĐXD; tự ý thay đổi thiết kế.' },
                ]
            },
            // ===== CHƯƠNG II: QUẢN LÝ DỰ ÁN ĐẦU TƯ XÂY DỰNG =====
            {
                id: 'luat135-ch2', code: 'Chương II', title: 'Quản lý dự án đầu tư xây dựng',
                articles: [
                    // --- Mục 1: Quy định chung ---
                    { id: 'luat135-d16', code: 'Điều 16', title: 'Trình tự đầu tư xây dựng', summary: '3 giai đoạn: chuẩn bị dự án → thực hiện dự án → kết thúc xây dựng. Dự án có thể phân kỳ, tách thành dự án thành phần, dự án BT-HT-TĐC độc lập.' },
                    { id: 'luat135-d17', code: 'Điều 17', title: 'Phân loại dự án đầu tư xây dựng', summary: 'Theo hình thức: ĐTC, PPP, vốn chi thường xuyên, đầu tư kinh doanh. Theo quy mô: quan trọng quốc gia, nhóm A, B, C. Theo mục đích, công năng phục vụ.' },
                    { id: 'luat135-d18', code: 'Điều 18', title: 'Yêu cầu đối với dự án ĐTXD', summary: 'Phù hợp quy hoạch, đảm bảo tính khả thi thiết kế/công nghệ, đáp ứng an toàn/PCCC/BVMT/biến đổi khí hậu, có phương án tài chính/huy động vốn.' },
                    { id: 'luat135-d19', code: 'Điều 19', title: 'Thiết kế xây dựng', summary: 'Thiết kế 1 hoặc nhiều bước. Các loại: thiết kế sơ bộ, cơ sở, FEED, kỹ thuật, bản vẽ thi công. Dự án BCKTKT áp dụng 1 bước là BVTC.' },
                    { id: 'luat135-d20', code: 'Điều 20', title: 'Yêu cầu đối với thiết kế xây dựng', summary: 'Phù hợp nhiệm vụ thiết kế, tuân thủ QCKT/tiêu chuẩn, đáp ứng công năng/an toàn/PCCC/BVMT. Bước sau cụ thể hóa bước trước. Bảo đảm bảo trì, phương án quản lý khai thác.' },
                    { id: 'luat135-d21', code: 'Điều 21', title: 'Khảo sát xây dựng', summary: 'Gồm: khảo sát địa hình, địa chất công trình, địa chất thủy văn, thủy văn, hiện trạng công trình, và công việc khảo sát khác.' },
                    { id: 'luat135-d22', code: 'Điều 22', title: 'Yêu cầu đối với khảo sát xây dựng', summary: 'Nhiệm vụ KS phù hợp loại/cấp CT. Phương án KTKS tuân thủ QCKT, tiêu chuẩn. Kết quả KS phải trung thực, khách quan, được phê duyệt.' },
                    // --- Mục 2: Lập, thẩm định dự án và quyết định ĐTXD ---
                    { id: 'luat135-d23', code: 'Điều 23', title: 'Lập dự án đầu tư xây dựng', summary: 'Phải lập BCNCKT hoặc BCKTKT. Chỉ cần BCKTKT cho: CT tôn giáo, quy mô nhỏ/đơn giản. CT nông nghiệp cá nhân/nhà ở riêng lẻ không phải lập. Dự án bảo tồn di tích theo PL di sản.' },
                    { id: 'luat135-d24', code: 'Điều 24', title: 'Báo cáo nghiên cứu khả thi', summary: 'Gồm thuyết minh + thiết kế XD. Thuyết minh: sự cần thiết, mục tiêu, khả thi, tổng mức ĐT, đánh giá tác động, CĐT, hình thức QLDA. Thiết kế XD tại BCNCKT là thiết kế cơ sở (có thể FEED/TKKT thay thế).' },
                    { id: 'luat135-d25', code: 'Điều 25', title: 'Báo cáo kinh tế - kỹ thuật', summary: 'Gồm thuyết minh + thiết kế BVTC + thiết kế công nghệ (nếu có). Thuyết minh gồm: sự cần thiết, mục tiêu, địa điểm, quy mô, TMĐT, cấp CT, giải pháp thi công, PCCC, BVMT.' },
                    { id: 'luat135-d26', code: 'Điều 26', title: 'Thẩm định BCNCKT, BCKTKT', summary: 'BCNCKT/BCKTKT phải được thẩm định. Dự án ĐTC: cơ quan chuyên môn trực thuộc NQĐĐT thẩm định (phù hợp chủ trương, khả thi, thiết kế, công nghệ, BVMT, QLDA). CT ảnh hưởng lớn phải thẩm tra TKXD.' },
                    { id: 'luat135-d27', code: 'Điều 27', title: 'Thẩm định BCNCKT của cơ quan chuyên môn về XD', summary: 'Phải thẩm định tại CQCM: dự án ĐTC, PPP, ĐTKD quy mô lớn. BCKTKT không yêu cầu thẩm định tại CQCM. Dự án QTQG có thể lập Hội đồng thẩm định. Nội dung: quy hoạch, hạ tầng, QCKT, an toàn, PCCC, chi phí.' },
                    { id: 'luat135-d28', code: 'Điều 28', title: 'Phê duyệt, quyết định đầu tư, điều chỉnh dự án', summary: 'Thẩm quyền phê duyệt theo PL ĐTC, PPP. Điều chỉnh dự án ĐTC khi: thay đổi CS/PL, điều chỉnh QH, bất khả kháng, hiệu quả cao hơn, chỉ số giá vượt dự phòng. CT trọng yếu QP-AN phải có ý kiến BQP, BCA.' },
                    // --- Mục 3: Quản lý thiết kế XD sau dự án ---
                    { id: 'luat135-d29', code: 'Điều 29', title: 'Thẩm định, phê duyệt thiết kế xây dựng', summary: 'CĐT thẩm định, kiểm soát và phê duyệt TKXD sau dự án được phê duyệt. CT ảnh hưởng lớn phải thẩm tra TKXD. CĐT thực hiện yêu cầu PCCC, BVMT, QP-AN.' },
                    { id: 'luat135-d30', code: 'Điều 30', title: 'Nội dung thẩm định thiết kế XD của CĐT', summary: 'DA ĐTC: đáp ứng nhiệm vụ TK, phù hợp BCNCKT, tuân thủ QCKT, an toàn chịu lực/PCCC, phù hợp khối lượng-dự toán-TMĐT, năng lực chủ thể. DA PPP/ĐTKD: theo NĐ Chính phủ.' },
                    { id: 'luat135-d31', code: 'Điều 31', title: 'Điều chỉnh thiết kế XD sau dự án', summary: 'Điều chỉnh khi: điều chỉnh dự án có yêu cầu, hoặc quá trình thi công cần điều chỉnh để đảm bảo chất lượng/hiệu quả. CĐT quyết định, phải thẩm định và phê duyệt lại.' },
                    // --- Mục 4: Quản lý thực hiện dự án ---
                    { id: 'luat135-d32', code: 'Điều 32', title: 'Hình thức tổ chức quản lý dự án', summary: '2 hình thức: (a) Ban QLDA ĐTXD (quản lý đồng thời/liên tục nhiều DA); (b) CĐT thuê tư vấn QLDA hoặc thành lập Ban QLDA trực thuộc hoặc tự thực hiện.' },
                    { id: 'luat135-d33', code: 'Điều 33', title: 'Nội dung quản lý dự án ĐTXD', summary: 'Quản lý: phạm vi, kế hoạch, khối lượng, chất lượng, tiến độ, chi phí, an toàn, BVMT, lựa chọn nhà thầu, hợp đồng XD. CĐT thực hiện hoặc giao Ban QLDA/tư vấn.' },
                    { id: 'luat135-d34', code: 'Điều 34', title: 'Quản lý tiến độ thực hiện dự án', summary: 'NQĐĐT quyết định thời gian/tiến độ khi phê duyệt DA. CĐT, nhà thầu phải lập kế hoạch tiến độ. Khuyến khích áp dụng giải pháp rút ngắn thời gian XD.' },
                    // --- Mục 5: Quyền, nghĩa vụ các chủ thể ---
                    { id: 'luat135-d35', code: 'Điều 35', title: 'Quyền, nghĩa vụ nhà thầu tư vấn', summary: 'Quyền: yêu cầu cung cấp thông tin, bảo hộ sở hữu trí tuệ, từ chối yêu cầu trái PL, thuê thầu phụ. Nghĩa vụ: thực hiện HĐ, chịu trách nhiệm chất lượng, bồi thường thiệt hại.' },
                    { id: 'luat135-d36', code: 'Điều 36', title: 'Quyền, nghĩa vụ nhà thầu tư vấn thẩm tra', summary: 'Quyền: yêu cầu giải trình, bảo lưu kết quả. Nghĩa vụ: thẩm tra theo HĐ, chịu trách nhiệm về tính đầy đủ/chính xác/trung thực của Báo cáo thẩm tra, bồi thường thiệt hại.' },
                    { id: 'luat135-d37', code: 'Điều 37', title: 'Quyền, nghĩa vụ nhà thầu khảo sát xây dựng', summary: 'Quyền: yêu cầu thông tin, từ chối ngoài HĐ, thuê thầu phụ. Nghĩa vụ: thực hiện đúng yêu cầu KS, đề xuất bổ sung khi phát hiện yếu tố ảnh hưởng, chịu trách nhiệm kết quả KS, bồi thường thiệt hại.' },
                    { id: 'luat135-d38', code: 'Điều 38', title: 'Quyền và trách nhiệm cơ quan thẩm định BCNCKT, BCKTKT', summary: 'CQCM trực thuộc NQĐĐT: yêu cầu giải trình, thuê thẩm tra, bảo lưu kết quả; thẩm định và tổng hợp trình NQĐĐT. Hội đồng thẩm định/CQCM XD: yêu cầu thông tin QH, thẩm tra, thông báo kết quả.' },
                    { id: 'luat135-d39', code: 'Điều 39', title: 'Quyền và trách nhiệm của người quyết định đầu tư', summary: 'Quyền: phê duyệt/phân cấp/ủy quyền DA, không phê duyệt nếu không hiệu quả, tạm ngừng/hủy/điều chỉnh DA. Trách nhiệm: tổ chức thẩm định, đảm bảo nguồn vốn, kiểm tra CĐT, chịu trách nhiệm toàn diện.' },
                    { id: 'luat135-d40', code: 'Điều 40', title: 'Quyền, nghĩa vụ, trách nhiệm chủ đầu tư', summary: 'Quyền: lập DA/TK, lựa chọn nhà thầu, tổ chức QLDA. Nghĩa vụ: lựa chọn nhà thầu đủ năng lực, cung cấp thông tin, nghiệm thu KS/TK, thực hiện HĐ, kiểm tra giám sát, báo cáo định kỳ, bồi thường thiệt hại.' },
                    { id: 'luat135-d41', code: 'Điều 41', title: 'Quyền, nghĩa vụ Ban QLDA ĐTXD', summary: 'Quyền: yêu cầu thông tin, quản lý DA theo nhiệm vụ, đề xuất giải pháp, thuê tư vấn. Nghĩa vụ: thực hiện trách nhiệm CĐT, đảm bảo tiến độ/chất lượng/chi phí/an toàn/BVMT, báo cáo CĐT.' },
                    { id: 'luat135-d42', code: 'Điều 42', title: 'Lưu trữ hồ sơ công trình xây dựng', summary: 'CĐT lưu trữ hồ sơ thẩm định, văn bản CQTQ, hồ sơ hoàn thành CT. Nhà thầu lưu trữ hồ sơ phần việc. Hồ sơ quản lý/sử dụng CT lưu tối thiểu bằng thời hạn sử dụng CT.' },
                ]
            },
            // ===== CHƯƠNG III: GIẤY PHÉP XÂY DỰNG VÀ QUẢN LÝ TRẬT TỰ XD =====
            {
                id: 'luat135-ch3', code: 'Chương III', title: 'Giấy phép xây dựng và quản lý trật tự xây dựng',
                articles: [
                    { id: 'luat135-d43', code: 'Điều 43', title: 'Quy định chung về cấp GPXD', summary: '3 loại GPXD: mới, sửa chữa/cải tạo/di dời, có thời hạn. 8 trường hợp miễn GPXD: bí mật nhà nước, khẩn cấp, ĐTC đặc biệt, đầu tư đặc biệt, XD tạm, CT theo tuyến, đã thẩm định BCNCKT, CT cấp IV <7 tầng <500m2 ngoài khu vực QH...' },
                    { id: 'luat135-d44', code: 'Điều 44', title: 'Cấp giấy phép xây dựng', summary: 'Điều kiện: phù hợp MĐSD đất, phù hợp QHĐT&NT/TKĐT/QCQLKT, thiết kế đảm bảo an toàn/BVMT/PCCC/kết nối HTKT. GPXD có thời hạn cho khu vực có QH chưa thực hiện. Chính phủ quy định chi tiết.' },
                    { id: 'luat135-d45', code: 'Điều 45', title: 'Quyền và trách nhiệm cơ quan cấp GPXD', summary: 'Quyền: yêu cầu giải trình, từ chối yêu cầu sai lệch, lấy ý kiến cơ quan liên quan. Trách nhiệm: niêm yết công khai, trả kết quả đúng thời hạn, kiểm tra thực hiện, đình chỉ/thu hồi, bồi thường cấp sai/chậm.' },
                    { id: 'luat135-d46', code: 'Điều 46', title: 'Quyền và trách nhiệm tổ chức, cá nhân đề nghị cấp GPXD', summary: 'Quyền: yêu cầu hướng dẫn, khiếu nại/khởi kiện/tố cáo, khởi công theo quy định. Trách nhiệm: nộp đủ hồ sơ trung thực, đảm bảo quyền SDĐ/sở hữu CT, nộp lệ phí, thực hiện đúng GPXD.' },
                    { id: 'luat135-d47', code: 'Điều 47', title: 'Quản lý trật tự xây dựng', summary: 'Quản lý từ tiếp nhận thông báo khởi công đến nghiệm thu/bàn giao. UBND cấp tỉnh chịu trách nhiệm toàn diện trên địa bàn. UBND cấp xã chịu trách nhiệm theo phân cấp. Phát hiện vi phạm phải xử lý ngay.' },
                ]
            },
            // ===== CHƯƠNG IV: XÂY DỰNG CÔNG TRÌNH =====
            {
                id: 'luat135-ch4', code: 'Chương IV', title: 'Xây dựng công trình',
                articles: [
                    // --- Mục 1: Chuẩn bị xây dựng ---
                    { id: 'luat135-d48', code: 'Điều 48', title: 'Điều kiện khởi công xây dựng công trình', summary: 'ĐK: mặt bằng, GPXD, thiết kế BVTC được duyệt, HĐ với nhà thầu, thông báo khởi công. CT khẩn cấp/ĐTC đặc biệt chỉ cần mặt bằng. Nhà ở riêng lẻ chỉ cần GPXD + đất ở hợp pháp.' },
                    { id: 'luat135-d49', code: 'Điều 49', title: 'Yêu cầu đối với công trường xây dựng', summary: 'CĐT lắp biển báo, thiết bị giám sát. Nhà thầu quản lý toàn bộ công trường. Phải đảm bảo an toàn, vệ sinh, xử lý chất thải, không gây ảnh hưởng xấu đến môi trường xung quanh.' },
                    // --- Mục 2: Thi công xây dựng ---
                    { id: 'luat135-d50', code: 'Điều 50', title: 'Yêu cầu đối với thi công xây dựng', summary: 'Tuân thủ thiết kế, QCKT, tiêu chuẩn, VLXD theo quy định; đảm bảo an toàn/PCCC/BVMT. Đảm bảo an toàn cho người, thiết bị, CT ngầm, CT liền kề. Kiểm tra, giám sát, nghiệm thu đầy đủ.' },
                    { id: 'luat135-d51', code: 'Điều 51', title: 'An toàn trong thi công xây dựng', summary: 'Nhà thầu đảm bảo an toàn/VSLĐ/BVMT/PCCC. CĐT giám sát an toàn, tạm dừng khi vi phạm, phối hợp xử lý sự cố. Nhà thầu xác định vùng nguy hiểm, lập biện pháp an toàn. Máy/thiết bị nghiêm ngặt phải kiểm định.' },
                    { id: 'luat135-d52', code: 'Điều 52', title: 'Bảo vệ môi trường trong thi công', summary: 'Nhà thầu lập và thực hiện biện pháp BVMT: không khí, nước, chất thải rắn, tiếng ồn. Bồi thường thiệt hại do gây ô nhiễm.' },
                    { id: 'luat135-d53', code: 'Điều 53', title: 'Di dời công trình xây dựng', summary: 'Phải phù hợp quy hoạch, đảm bảo chất lượng/an toàn, không ảnh hưởng CT lân cận. Phải có giấy phép di dời (trừ miễn GPXD). Nhà thầu thực hiện biện pháp an toàn.' },
                    { id: 'luat135-d54', code: 'Điều 54', title: 'Phá dỡ công trình xây dựng', summary: '9 trường hợp phá dỡ: giải phóng mặt bằng, nguy cơ sụp đổ, khu vực cấm, sai quy hoạch, không có GPXD, lấn chiếm đất, theo nhu cầu CĐT, hết thời hạn. Trách nhiệm các bên: CĐT tổ chức, nhà thầu lập biện pháp, cưỡng chế nếu không chấp hành.' },
                    { id: 'luat135-d55', code: 'Điều 55', title: 'Sự cố công trình xây dựng', summary: 'Phát hiện nguy cơ: kịp thời dừng thi công/khai thác, thực hiện biện pháp an toàn, bảo vệ hiện trường. CQNN tổ chức giám định nguyên nhân. CT có sự cố chỉ tiếp tục khi được cho phép. Tổ chức/cá nhân gây sự cố phải bồi thường.' },
                    // --- Mục 3: Quản lý chất lượng, nghiệm thu, bàn giao ---
                    { id: 'luat135-d56', code: 'Điều 56', title: 'Giám sát thi công xây dựng', summary: 'CT phải được giám sát về chất lượng, khối lượng, tiến độ, an toàn, BVMT. Yêu cầu: nghiệm thu trong quá trình thi công, đúng thiết kế/QCKT/tiêu chuẩn, trung thực khách quan. Nhà thầu giám sát phải có giải pháp và quy trình kiểm soát.' },
                    { id: 'luat135-d57', code: 'Điều 57', title: 'Nghiệm thu công trình xây dựng', summary: 'Nghiệm thu: công việc XD trong thi công, giai đoạn chuyển bước, hoàn thành hạng mục/CT. CT hoàn thành chỉ được khai thác sau khi nghiệm thu đúng quy định. CĐT tổ chức nghiệm thu. CT QTQG/quy mô lớn phải được CQTQ kiểm tra nghiệm thu.' },
                    { id: 'luat135-d58', code: 'Điều 58', title: 'Bàn giao công trình xây dựng', summary: 'Phải nghiệm thu xong, đảm bảo an toàn vận hành. Khu đô thị: bàn giao toàn bộ hoặc từng phần nhưng phải đồng bộ HTKT-HTXH. Nhà thầu giao bản vẽ hoàn công, quy trình vận hành/bảo trì, DMTB dự trữ.' },
                    // --- Mục 4: Quyền, nghĩa vụ các chủ thể trong thi công ---
                    { id: 'luat135-d59', code: 'Điều 59', title: 'Quyền, nghĩa vụ CĐT trong thi công XD', summary: 'Quyền: thi công/thuê nhà thầu, giám sát, đình chỉ/chấm dứt HĐ, dừng thi công khi vi phạm. Nghĩa vụ: lựa chọn nhà thầu phù hợp, bàn giao mặt bằng, tổ chức giám sát QLCL, nghiệm thu/thanh toán/quyết toán.' },
                    { id: 'luat135-d60', code: 'Điều 60', title: 'Quyền, nghĩa vụ CĐT trong giám sát thi công', summary: 'Quyền: tự giám sát hoặc thuê, thay đổi người giám sát, đình chỉ/chấm dứt HĐ. Nghĩa vụ: thuê tư vấn giám sát phù hợp, thông báo quyền/nghĩa vụ, xử lý đề xuất, lưu trữ kết quả, bồi thường thiệt hại.' },
                    { id: 'luat135-d61', code: 'Điều 61', title: 'Quyền, nghĩa vụ nhà thầu thi công XD', summary: 'Quyền: từ chối ngoài HĐ, đề xuất sửa đổi TK, yêu cầu thanh toán, dừng thi công khi mất an toàn, yêu cầu bồi thường. Nghĩa vụ: thi công đúng TK/QCKT, hệ thống QLCL, quản lý lao động, bản vẽ hoàn công, bảo hành, bồi thường thiệt hại.' },
                    { id: 'luat135-d62', code: 'Điều 62', title: 'Quyền, nghĩa vụ nhà thầu thiết kế trong thi công', summary: 'Quyền: yêu cầu thi công đúng TK, từ chối thay đổi không phù hợp, từ chối nghiệm thu sai TK. Nghĩa vụ: cử người giám sát tác giả TK, tham gia nghiệm thu, xử lý bất hợp lý TK, thông báo khi phát hiện thi công sai.' },
                    { id: 'luat135-d63', code: 'Điều 63', title: 'Quyền, nghĩa vụ nhà thầu giám sát thi công', summary: 'Quyền: tham gia nghiệm thu, yêu cầu thi công đúng TK, bảo lưu ý kiến, tạm dừng khi mất an toàn, từ chối ngoài HĐ. Nghĩa vụ: giám sát và chịu trách nhiệm chất lượng, từ chối nghiệm thu không đạt, đề xuất bất hợp lý TK.' },
                    // --- Mục 5: Bảo hành, bảo trì ---
                    { id: 'luat135-d64', code: 'Điều 64', title: 'Bảo hành công trình xây dựng', summary: 'Nhà thầu thi công bảo hành CT do mình thi công, nhà thầu cung ứng thiết bị bảo hành thiết bị. Nội dung: khắc phục, sửa chữa, thay thế hư hỏng/khiếm khuyết. Thời gian BH theo loại/cấp CT và HĐ.' },
                    { id: 'luat135-d65', code: 'Điều 65', title: 'Bảo trì công trình xây dựng', summary: 'CT phải được bảo trì trong khai thác/sử dụng. Quy trình BT do CĐT lập và phê duyệt trước khi khai thác. Chủ sở hữu/quản lý chịu trách nhiệm BT. CT quy mô lớn phải đánh giá định kỳ an toàn.' },
                    { id: 'luat135-d66', code: 'Điều 66', title: 'Quản lý, khai thác, sử dụng công trình', summary: 'CT phải được quản lý/khai thác đúng mục đích, an toàn, bền vững, hiệu quả KT-XH. HTKT: vận hành liên tục, ổn định, chia sẻ dữ liệu, có phương án bảo vệ an ninh, an toàn.' },
                    { id: 'luat135-d67', code: 'Điều 67', title: 'Dừng khai thác, sử dụng công trình', summary: 'Dừng khi: hết thời hạn sử dụng, nguy cơ mất an toàn, gây sự cố. Phải thông báo bằng văn bản cho người sử dụng. Chỉ tiếp tục khi đã khắc phục sự cố hoặc kiểm định/gia cố đạt an toàn.' },
                    // --- Mục 6: Đầu tư XD công trình đặc thù ---
                    { id: 'luat135-d68', code: 'Điều 68', title: 'Dự án ĐTXD công trình đặc thù', summary: '4 loại: (a) CT bí mật nhà nước; (b) CT khẩn cấp, cấp bách; (c) DA ĐTC đặc biệt; (d) CT xây dựng tạm. Trình tự, thủ tục riêng theo Điều 69-72.' },
                    { id: 'luat135-d69', code: 'Điều 69', title: 'Dự án, công trình cần bảo đảm bí mật nhà nước', summary: 'CT bí mật nhà nước: CT có yêu cầu bí mật theo PL bảo vệ BMNN, CT QP-AN có thông tin bí mật. Cơ quan được giao quyền quyết định và chịu trách nhiệm toàn bộ từ lập DA đến nghiệm thu.' },
                    { id: 'luat135-d70', code: 'Điều 70', title: 'Dự án, công trình khẩn cấp, cấp bách', summary: 'CT khẩn cấp: XD ngay sau lệnh XD khẩn cấp để phòng/chống/khắc phục thiên tai, thảm họa, dịch bệnh. CT cấp bách: XD nhanh đáp ứng QP-AN, đối ngoại, năng lượng, nguồn nước, sự cố MT theo yêu cầu CP/TTg.' },
                    { id: 'luat135-d71', code: 'Điều 71', title: 'Dự án đầu tư công đặc biệt', summary: 'Trình tự theo PL ĐTC. NQĐĐT/CĐT được quyết định trình tự rút gọn. BCNCKT phải thẩm tra, thẩm định bởi CQCM trực thuộc NQĐĐT. TK XD có thể lập song song, đồng thời với lập/thẩm định BCNCKT và thi công.' },
                    { id: 'luat135-d72', code: 'Điều 72', title: 'Công trình xây dựng tạm', summary: 'CT XD tạm phục vụ thi công CT chính phải bảo đảm an toàn, BVMT, phải phá dỡ khi hoàn thành. CT XD tạm theo quy hoạch phải có thời hạn theo quyết định của CQTQ.' },
                ]
            },
            // ===== CHƯƠNG V: HỢP ĐỒNG XÂY DỰNG =====
            {
                id: 'luat135-ch5', code: 'Chương V', title: 'Hợp đồng xây dựng',
                articles: [
                    { id: 'luat135-d73', code: 'Điều 73', title: 'Quy định chung về hợp đồng xây dựng', summary: 'HĐXD là hợp đồng dân sự bằng văn bản giữa bên giao thầu và bên nhận thầu để thực hiện công việc XD. Phải tuân thủ nguyên tắc bình đẳng, tự nguyện, thiện chí, hợp tác.' },
                    { id: 'luat135-d74', code: 'Điều 74', title: 'Nguyên tắc ký kết hợp đồng xây dựng', summary: 'Tự nguyện, bình đẳng, không trái PL/đạo đức. Đảm bảo năng lực phù hợp, phạm vi công việc rõ ràng. HĐ sử dụng vốn NN phải theo kết quả lựa chọn nhà thầu.' },
                    { id: 'luat135-d75', code: 'Điều 75', title: 'Loại hợp đồng xây dựng', summary: 'Theo tính chất: tư vấn, thi công, thiết kế-thi công, EPC, EC, chìa khóa trao tay, hỗn hợp. Theo hình thức giá: trọn gói, đơn giá cố định, đơn giá điều chỉnh, theo thời gian, theo tỷ lệ (%), hỗn hợp giá.' },
                    { id: 'luat135-d76', code: 'Điều 76', title: 'Nội dung hợp đồng xây dựng', summary: 'Bao gồm: phạm vi công việc, thời gian thực hiện, giá HĐ, tạm ứng/thanh toán, bảo lãnh, bảo đảm, điều chỉnh HĐ, nghiệm thu/bàn giao, bảo hành, quyền/nghĩa vụ, tạm dừng/chấm dứt, thưởng/phạt, bồi thường, giải quyết tranh chấp.' },
                    { id: 'luat135-d77', code: 'Điều 77', title: 'Điều chỉnh hợp đồng xây dựng', summary: 'Điều chỉnh khi: bổ sung/thay đổi thiết kế, bất khả kháng, hoàn cảnh thay đổi cơ bản, thay đổi CS/PL, điều chỉnh DA. Giá HĐ điều chỉnh: bổ sung khối lượng, trượt giá theo HĐ. Vốn NN: điều chỉnh không vượt TMĐT.' },
                    { id: 'luat135-d78', code: 'Điều 78', title: 'Quản lý, thanh toán hợp đồng xây dựng', summary: 'Thanh toán theo tiến độ/khối lượng hoàn thành. Tạm ứng theo quy định. Bảo lãnh thực hiện HĐ, bảo lãnh tạm ứng bắt buộc. Thanh toán trong 14 ngày kể từ hồ sơ hợp lệ. Lãi chậm thanh toán theo BLDS.' },
                    { id: 'luat135-d79', code: 'Điều 79', title: 'Quyết toán hợp đồng xây dựng', summary: 'CĐT quyết toán HĐ khi hoàn thành/chấm dứt. Hồ sơ quyết toán: biên bản nghiệm thu, hồ sơ thanh toán, biên bản bàn giao. Bên nhận thầu lập hồ sơ, CĐT phê duyệt.' },
                    { id: 'luat135-d80', code: 'Điều 80', title: 'Tạm dừng, chấm dứt hợp đồng xây dựng', summary: 'Tạm dừng khi: vi phạm an toàn, mất an toàn, theo yêu cầu CQTQ, theo thỏa thuận. Chấm dứt khi: bên kia vi phạm nghiêm trọng, bất khả kháng kéo dài, phá sản/giải thể, theo thỏa thuận.' },
                    { id: 'luat135-d81', code: 'Điều 81', title: 'Thưởng, phạt hợp đồng xây dựng', summary: 'Thưởng vượt tiến độ/chất lượng theo thỏa thuận (≤12% giá trị phần vượt). Phạt vi phạm HĐ theo thỏa thuận (≤12% giá trị phần vi phạm hoặc theo BLDS). Bồi thường thiệt hại thực tế.' },
                    { id: 'luat135-d82', code: 'Điều 82', title: 'Giải quyết tranh chấp hợp đồng xây dựng', summary: 'Thương lượng → Hòa giải → Trọng tài/Tòa án. Khuyến khích giải quyết bằng hòa giải. Tranh chấp có yếu tố nước ngoài theo thỏa thuận và PL quốc tế.' },
                    { id: 'luat135-d83', code: 'Điều 83', title: 'Hợp đồng với nhà thầu nước ngoài', summary: 'Phải tuân thủ PL Việt Nam. Nhà thầu nước ngoài phải liên danh hoặc sử dụng thầu phụ trong nước (trừ không có nhà thầu trong nước đáp ứng). Thanh toán bằng VND, ngoại tệ theo quy định NHNN.' },
                    { id: 'luat135-d84', code: 'Điều 84', title: 'Quyền, nghĩa vụ bên giao thầu', summary: 'Quyền: giám sát, yêu cầu thực hiện đúng HĐ, tạm dừng/chấm dứt HĐ, yêu cầu bồi thường. Nghĩa vụ: bàn giao mặt bằng/tài liệu, thanh toán đúng hạn, cử đại diện đủ thẩm quyền, nghiệm thu đúng quy định.' },
                    { id: 'luat135-d85', code: 'Điều 85', title: 'Quyền, nghĩa vụ bên nhận thầu', summary: 'Quyền: yêu cầu thanh toán, yêu cầu bồi thường, tạm dừng khi chưa thanh toán. Nghĩa vụ: thực hiện đúng HĐ, tổ chức QLCL, bảo hành, mua bảo hiểm, không giao thầu phụ toàn bộ.' },
                ]
            },
            // ===== CHƯƠNG VI: NĂNG LỰC HOẠT ĐỘNG XÂY DỰNG =====
            {
                id: 'luat135-ch6', code: 'Chương VI', title: 'Năng lực hoạt động xây dựng',
                articles: [
                    { id: 'luat135-d86', code: 'Điều 86', title: 'Điều kiện năng lực hoạt động xây dựng', summary: 'Tổ chức/cá nhân tham gia HĐXD phải có đủ điều kiện năng lực phù hợp loại, cấp CT. Điều kiện: nhân lực, kinh nghiệm, tài chính, thiết bị. Cấp năng lực: I, II, III theo loại công việc.' },
                    { id: 'luat135-d87', code: 'Điều 87', title: 'Chứng chỉ hành nghề hoạt động xây dựng', summary: 'Cá nhân phải có CCHN: khảo sát, thiết kế, giám sát, định giá, QLDA XD. Điều kiện: trình độ chuyên môn, kinh nghiệm, đạo đức nghề nghiệp. Hạng I: BXD cấp, Hạng II-III: Sở XD cấp. Thời hạn 7 năm.' },
                    { id: 'luat135-d88', code: 'Điều 88', title: 'Chứng chỉ năng lực hoạt động xây dựng', summary: 'Tổ chức phải có CCNL: khảo sát, thiết kế, thi công, giám sát, QLDA, kiểm định, thẩm tra. Hạng I: BXD cấp, Hạng II-III: Sở XD cấp. Thời hạn 7 năm. Đánh giá dựa trên nhân lực, kinh nghiệm, tài chính.' },
                    { id: 'luat135-d89', code: 'Điều 89', title: 'Điều kiện năng lực nhà thầu nước ngoài', summary: 'Nhà thầu nước ngoài: phải có giấy phép hoạt động XD tại VN, liên danh/sử dụng thầu phụ trong nước, đăng ký tại Sở XD. Chứng chỉ nước ngoài được công nhận theo điều ước quốc tế hoặc thẩm định của BXD.' },
                    { id: 'luat135-d90', code: 'Điều 90', title: 'Quản lý năng lực hoạt động xây dựng', summary: 'BXD quản lý CSDL năng lực HĐXD quốc gia. Công khai thông tin CCHN, CCNL trên hệ thống. Thu hồi CCHN/CCNL khi vi phạm. Kiểm tra định kỳ duy trì điều kiện năng lực.' },
                    { id: 'luat135-d91', code: 'Điều 91', title: 'Đào tạo, bồi dưỡng kiến thức hoạt động xây dựng', summary: 'Các nhân phải cập nhật kiến thức định kỳ (tối thiểu 1 lần trong thời hạn CCHN). Chương trình đào tạo do BXD quy định. Cơ sở đào tạo phải đăng ký và được BXD/Sở XD chấp thuận.' },
                    { id: 'luat135-d92', code: 'Điều 92', title: 'Trách nhiệm nghề nghiệp', summary: 'Cá nhân CCHN chịu trách nhiệm cá nhân về chất lượng công việc. Phải tuân thủ QCKT, tiêu chuẩn, đạo đức nghề nghiệp. Bồi thường thiệt hại do lỗi chuyên môn. Bị thu hồi CCHN nếu vi phạm nghiêm trọng.' },
                    { id: 'luat135-d93', code: 'Điều 93', title: 'Tổ chức xã hội - nghề nghiệp trong xây dựng', summary: 'Tổ chức xã hội - nghề nghiệp (Hội KTS, Hội KTXD, Tổng hội XD...) tham gia: tư vấn phản biện, đào tạo, giám sát chất lượng, bảo vệ quyền lợi hội viên. Nhà nước tạo điều kiện hoạt động.' },
                ]
            },
            // ===== CHƯƠNG VII: QUẢN LÝ NHÀ NƯỚC VỀ XÂY DỰNG =====
            {
                id: 'luat135-ch7', code: 'Chương VII', title: 'Quản lý nhà nước về xây dựng',
                articles: [
                    { id: 'luat135-d94', code: 'Điều 94', title: 'Nội dung quản lý nhà nước về xây dựng', summary: 'Xây dựng chiến lược/chính sách/PL; QCKT/tiêu chuẩn; quản lý HĐXD/chất lượng CT/năng lực HĐXD; thanh tra/kiểm tra; hợp tác quốc tế; CSDL quốc gia; giải quyết khiếu nại/tố cáo.' },
                    { id: 'luat135-d95', code: 'Điều 95', title: 'Trách nhiệm của Chính phủ', summary: 'Thống nhất QLNN về XD. Ban hành NĐ hướng dẫn. Phân công, phân cấp cho Bộ/UBND. Chỉ đạo xây dựng CSDL quốc gia. Báo cáo Quốc hội về tình hình HĐXD.' },
                    { id: 'luat135-d96', code: 'Điều 96', title: 'Trách nhiệm của Bộ Xây dựng', summary: 'Chịu trách nhiệm trước CP về QLNN về XD. Xây dựng QCKT/tiêu chuẩn; quản lý CCHN/CCNL hạng I; thẩm định DA QTQG; thanh tra chuyên ngành XD; quản lý CSDL quốc gia; hợp tác quốc tế.' },
                    { id: 'luat135-d97', code: 'Điều 97', title: 'Trách nhiệm của Bộ quản lý công trình XD chuyên ngành', summary: 'Bộ GTVT, Bộ NN&PTNT, Bộ CT: quản lý CT chuyên ngành (giao thông, thủy lợi, công nghiệp). Xây dựng QCKT chuyên ngành, thẩm định DA chuyên ngành, quản lý CCHN/CCNL liên quan.' },
                    { id: 'luat135-d98', code: 'Điều 98', title: 'Trách nhiệm của UBND cấp tỉnh', summary: 'QLNN về XD trên địa bàn tỉnh/TP. Cấp GPXD, CCHN/CCNL hạng II-III. Thẩm định BCNCKT theo thẩm quyền. Quản lý trật tự XD. Thanh tra, xử lý vi phạm. Báo cáo BXD.' },
                    { id: 'luat135-d99', code: 'Điều 99', title: 'Trách nhiệm của UBND cấp huyện, cấp xã', summary: 'UBND huyện: cấp GPXD theo phân cấp, quản lý trật tự XD, kiểm tra CT trên địa bàn. UBND xã: phát hiện/báo cáo vi phạm trật tự XD, phối hợp xử lý, theo dõi thi công nhà ở riêng lẻ.' },
                    { id: 'luat135-d100', code: 'Điều 100', title: 'Thanh tra xây dựng', summary: 'Thanh tra XD nằm trong hệ thống thanh tra nhà nước. BXD: Thanh tra Bộ. Sở XD: Thanh tra Sở. Nội dung: thanh tra HĐXD, chất lượng CT, năng lực, trật tự XD, xử lý vi phạm. Thanh tra viên XD có QĐ riêng.' },
                    { id: 'luat135-d101', code: 'Điều 101', title: 'Xử lý vi phạm trong hoạt động xây dựng', summary: 'Vi phạm hành chính: xử phạt theo NĐ CP. Vi phạm hình sự: truy cứu TNHS. Gây thiệt hại: bồi thường theo BLDS. Thu hồi CCHN/CCNL/GPXD. Cưỡng chế phá dỡ CT vi phạm.' },
                ]
            },
            // ===== CHƯƠNG VIII: ĐIỀU KHOẢN THI HÀNH =====
            {
                id: 'luat135-ch8', code: 'Chương VIII', title: 'Điều khoản thi hành',
                articles: [
                    { id: 'luat135-d102', code: 'Điều 102', title: 'Sửa đổi, bổ sung một số điều của các luật có liên quan', summary: 'Sửa đổi/bổ sung một số điều của: Luật Nhà ở, Luật Kinh doanh BĐS, Luật QH đô thị, Luật Đầu tư, Luật Đầu tư công, Luật PPP và các luật liên quan khác để đồng bộ với Luật XD mới.' },
                    { id: 'luat135-d103', code: 'Điều 103', title: 'Bãi bỏ', summary: 'Bãi bỏ Luật Xây dựng số 50/2014/QH13, Luật sửa đổi bổ sung Luật XD số 62/2020/QH14, và các quy định trái với Luật này tại NĐ, TT, QĐ đã ban hành.' },
                    { id: 'luat135-d104', code: 'Điều 104', title: 'Quy định chuyển tiếp', summary: 'DA đã phê duyệt trước ngày Luật có hiệu lực: tiếp tục theo quy định cũ. DA đang thẩm định: áp dụng Luật mới nếu CĐT đề nghị. GPXD đã cấp còn hiệu lực. CCHN/CCNL đã cấp có giá trị đến hết thời hạn.' },
                    { id: 'luat135-d105', code: 'Điều 105', title: 'Hiệu lực thi hành', summary: 'Luật này có hiệu lực thi hành từ ngày 01/01/2026. Luật XD số 50/2014/QH13 (sửa đổi, bổ sung 2020) hết hiệu lực kể từ ngày Luật này có hiệu lực.' },
                    { id: 'luat135-d106', code: 'Điều 106', title: 'Quy định chi tiết', summary: 'Chính phủ, Bộ trưởng BXD, Bộ trưởng các Bộ QLCTXDCN quy định chi tiết các điều, khoản được giao trong Luật này. Các NĐ, TT hướng dẫn phải ban hành trước ngày Luật có hiệu lực.' },
                    { id: 'luat135-d107', code: 'Điều 107', title: 'Trách nhiệm thi hành', summary: 'Chính phủ, các Bộ, UBND các cấp, tổ chức/cá nhân liên quan chịu trách nhiệm thi hành Luật này. Luật được QH nước CHXHCN Việt Nam khóa XV thông qua.' },
                ]
            },
        ]
    },
    {
        id: 'luat-quy-hoach-2025',
        code: 'Luật số 112/2025/QH16',
        title: 'Luật Quy hoạch (sửa đổi)',
        shortTitle: 'Luật Quy hoạch 2025',
        type: 'luat',
        issuedDate: '2025',
        effectiveDate: '01/01/2026',
        issuedBy: 'Quốc hội',
        status: 'hieu-luc',
        summary: 'Sửa đổi Luật Quy hoạch, quy định việc lập, thẩm định, phê duyệt, công bố, thực hiện, đánh giá, điều chỉnh quy hoạch trong hệ thống quy hoạch quốc gia.',
        fileName: 'luat112-QH-2025.pdf',
        filePath: '/resources/luat112-QH-2025.pdf',
        fileSize: '4.9 MB',
        tags: ['quy hoạch', 'quy hoạch đô thị', 'quy hoạch xây dựng', 'không gian'],
        relatedDocIds: ['luat-xay-dung-2025'],
        chapters: [
            {
                id: 'luat112-ch1', code: 'Chương I', title: 'Quy định chung',
                articles: [
                    { id: 'luat112-d1', code: 'Điều 1', title: 'Phạm vi điều chỉnh', summary: 'Quy định về hoạt động quy hoạch; quyền, nghĩa vụ các bên liên quan đến quy hoạch.' },
                ]
            },
            {
                id: 'luat112-ch2', code: 'Chương II', title: 'Hệ thống quy hoạch quốc gia',
                articles: [
                    { id: 'luat112-d5', code: 'Điều 5', title: 'Hệ thống quy hoạch', summary: 'Quy hoạch tổng thể quốc gia, quy hoạch ngành, quy hoạch vùng, quy hoạch tỉnh.' },
                ]
            },
        ]
    },
    {
        id: 'luat-khcn-2025',
        code: 'Luật số 93/2025/QH16',
        title: 'Luật Khoa học và Công nghệ',
        shortTitle: 'Luật KH&CN 2025',
        type: 'luat',
        issuedDate: '2025',
        effectiveDate: '01/01/2026',
        issuedBy: 'Quốc hội',
        status: 'hieu-luc',
        summary: 'Quy định về hoạt động khoa học và công nghệ; chính sách, cơ chế tài chính cho KH&CN; ứng dụng công nghệ trong các ngành kinh tế bao gồm xây dựng.',
        fileName: 'luat93-KHCN-2025.pdf',
        filePath: '/resources/luat93-KHCN-2025.pdf',
        fileSize: '5.7 MB',
        tags: ['khoa học công nghệ', 'đổi mới sáng tạo', 'chuyển giao công nghệ'],
        relatedDocIds: ['luat-cds-2025', 'luat-ttnt-2025'],
        chapters: [
            {
                id: 'luat93-ch1', code: 'Chương I', title: 'Quy định chung',
                articles: [
                    { id: 'luat93-d1', code: 'Điều 1', title: 'Phạm vi điều chỉnh', summary: 'Quy định về tổ chức, cá nhân hoạt động KH&CN; chính sách nhà nước về KH&CN.' },
                ]
            },
        ]
    },
    {
        id: 'luat-ttnt-2025',
        code: 'Luật số 134/2025/QH16',
        title: 'Luật Trí tuệ nhân tạo',
        shortTitle: 'Luật TTNT 2025',
        type: 'luat',
        issuedDate: '2025',
        effectiveDate: '01/01/2026',
        issuedBy: 'Quốc hội',
        status: 'hieu-luc',
        summary: 'Luật quy định về nghiên cứu, phát triển, ứng dụng trí tuệ nhân tạo; quản lý rủi ro; đạo đức AI; trách nhiệm của tổ chức, cá nhân trong phát triển và sử dụng AI.',
        fileName: 'luat134-TTNT-2025.pdf',
        filePath: '/resources/luat134-TTNT-2025.pdf',
        fileSize: '2.1 MB',
        tags: ['trí tuệ nhân tạo', 'AI', 'công nghệ số', 'dữ liệu'],
        relatedDocIds: ['luat-cds-2025', 'luat-khcn-2025'],
        chapters: [
            {
                id: 'luat134-ch1', code: 'Chương I', title: 'Quy định chung',
                articles: [
                    { id: 'luat134-d1', code: 'Điều 1', title: 'Phạm vi điều chỉnh', summary: 'Quy định về hoạt động trí tuệ nhân tạo tại Việt Nam.' },
                ]
            },
        ]
    },
    {
        id: 'luat-cds-2025',
        code: 'Luật số 148/2025/QH16',
        title: 'Luật Chuyển đổi số',
        shortTitle: 'Luật CĐS 2025',
        type: 'luat',
        issuedDate: '2025',
        effectiveDate: '01/01/2026',
        issuedBy: 'Quốc hội',
        status: 'hieu-luc',
        summary: 'Quy định về chuyển đổi số trong cơ quan nhà nước và doanh nghiệp; hạ tầng số; dữ liệu số; nền tảng số; chính phủ số; kinh tế số; xã hội số.',
        fileName: 'luat148-CĐS-2025.pdf',
        filePath: '/resources/luat148-CĐS-2025.pdf',
        fileSize: '2.5 MB',
        tags: ['chuyển đổi số', 'dữ liệu số', 'chính phủ số', 'nền tảng số'],
        relatedDocIds: ['luat-ttnt-2025', 'luat-khcn-2025'],
        chapters: [
            {
                id: 'luat148-ch1', code: 'Chương I', title: 'Quy định chung',
                articles: [
                    { id: 'luat148-d1', code: 'Điều 1', title: 'Phạm vi điều chỉnh', summary: 'Quy định về chuyển đổi số; nguồn lực phát triển chuyển đổi số.' },
                ]
            },
        ]
    },

    // ========== NGHỊ ĐỊNH ==========
    {
        id: 'nd-175-2024',
        code: 'NĐ 175/2024/NĐ-CP',
        title: 'Nghị định sửa đổi, bổ sung một số điều của các Nghị định thuộc lĩnh vực quản lý nhà nước của Bộ Xây dựng',
        shortTitle: 'NĐ 175/2024 (sửa đổi NĐ 15, 06, 10)',
        type: 'nghi-dinh',
        issuedDate: '30/12/2024',
        effectiveDate: '01/01/2025',
        issuedBy: 'Chính phủ',
        status: 'hieu-luc',
        summary: 'Sửa đổi NĐ 15/2021 về quản lý dự án ĐTXD, NĐ 06/2021 về QLCL công trình, NĐ 10/2021 về chi phí đầu tư xây dựng và nhiều nghị định khác. Đơn giản hóa thủ tục, phân cấp mạnh hơn trong quản lý dự án.',
        fileName: 'NĐ 175.pdf',
        filePath: '/resources/NĐ 175.pdf',
        fileSize: '24.9 MB',
        tags: ['quản lý dự án', 'chi phí xây dựng', 'chất lượng công trình', 'phân cấp', 'sửa đổi NĐ 15'],
        relatedDocIds: ['luat-xay-dung-2025', 'nd-111-2024', 'tt-06-2021'],
        chapters: [
            {
                id: 'nd175-ch1', code: 'Điều 1', title: 'Sửa đổi NĐ 15/2021/NĐ-CP về QLDA ĐTXD',
                articles: [
                    { id: 'nd175-d1-k1', code: 'Khoản 1', title: 'Sửa đổi Điều 1 NĐ 15', summary: 'Phạm vi điều chỉnh mở rộng, áp dụng cho cả dự án PPP.' },
                    { id: 'nd175-d1-k5', code: 'Khoản 5', title: 'Lập dự án ĐTXD', summary: 'Quy định chi tiết lập BCNCKT, BCKTKT cho dự án ĐTXD.' },
                    { id: 'nd175-d1-k8', code: 'Khoản 8', title: 'Thẩm định dự án', summary: 'Thẩm quyền, quy trình thẩm định dự án ĐTXD theo phân cấp mới.' },
                ]
            },
            {
                id: 'nd175-ch2', code: 'Điều 2', title: 'Sửa đổi NĐ 06/2021/NĐ-CP về QLCL công trình',
                articles: [
                    { id: 'nd175-d2-k1', code: 'Khoản 1', title: 'Giám sát thi công xây dựng', summary: 'Nội dung giám sát, trách nhiệm giám sát thi công của CĐT.' },
                    { id: 'nd175-d2-k3', code: 'Khoản 3', title: 'Nghiệm thu công trình', summary: 'Quy trình nghiệm thu từng phần, hoàn thành hạng mục và toàn bộ CT.' },
                ]
            },
            {
                id: 'nd175-ch3', code: 'Điều 3', title: 'Sửa đổi NĐ 10/2021/NĐ-CP về chi phí ĐTXD',
                articles: [
                    { id: 'nd175-d3-k1', code: 'Khoản 1', title: 'Tổng mức đầu tư', summary: 'Phương pháp xác định tổng mức đầu tư xây dựng.' },
                    { id: 'nd175-d3-k2', code: 'Khoản 2', title: 'Dự toán xây dựng', summary: 'Nội dung, phương pháp lập dự toán xây dựng công trình.' },
                ]
            },
        ]
    },
    {
        id: 'nd-111-2024',
        code: 'NĐ 111/2024/NĐ-CP',
        title: 'Nghị định quy định chi tiết một số điều của Luật Đấu thầu về lựa chọn nhà thầu',
        shortTitle: 'NĐ 111/2024 (hướng dẫn Luật Đấu thầu)',
        type: 'nghi-dinh',
        issuedDate: '2024',
        effectiveDate: '2024',
        issuedBy: 'Chính phủ',
        status: 'hieu-luc',
        summary: 'Hướng dẫn chi tiết Luật Đấu thầu 2023 về lựa chọn nhà thầu, quy trình đấu thầu, đấu thầu qua mạng, ưu đãi trong đấu thầu, hợp đồng với nhà thầu.',
        fileName: 'NĐ111.pdf',
        filePath: '/resources/NĐ111.pdf',
        fileSize: '1.4 MB',
        tags: ['đấu thầu', 'lựa chọn nhà thầu', 'hồ sơ mời thầu', 'đấu thầu qua mạng', 'hợp đồng'],
        relatedDocIds: ['nd-175-2024', 'luat-dau-tu-cong-2019'],
        chapters: [
            {
                id: 'nd111-ch1', code: 'Chương I', title: 'Quy định chung',
                articles: [
                    { id: 'nd111-d1', code: 'Điều 1', title: 'Phạm vi điều chỉnh', summary: 'Quy định chi tiết về lựa chọn nhà thầu, nhà đầu tư.' },
                    { id: 'nd111-d3', code: 'Điều 3', title: 'Kế hoạch lựa chọn nhà thầu', summary: 'Lập, thẩm định, phê duyệt KHLCNT cho dự án.' },
                ]
            },
            {
                id: 'nd111-ch2', code: 'Chương II', title: 'Đấu thầu rộng rãi, hạn chế',
                articles: [
                    { id: 'nd111-d10', code: 'Điều 10', title: 'Quy trình đấu thầu rộng rãi', summary: 'Chuẩn bị → Tổ chức → Đánh giá HSDT → Phê duyệt kết quả → Ký HĐ.' },
                ]
            },
            {
                id: 'nd111-ch3', code: 'Chương III', title: 'Chỉ định thầu, chào hàng cạnh tranh',
                articles: [
                    { id: 'nd111-d22', code: 'Điều 22', title: 'Chỉ định thầu', summary: 'Các trường hợp được chỉ định thầu; hạn mức chỉ định thầu.' },
                ]
            },
        ]
    },
    {
        id: 'nd-140-2025',
        code: 'NĐ 140/2025/NĐ-CP',
        title: 'Nghị định quy định về phân định thẩm quyền của chính quyền địa phương 02 cấp trong lĩnh vực quản lý Nhà nước của Bộ Xây dựng',
        shortTitle: 'NĐ 140/2025 (phân cấp địa phương)',
        type: 'nghi-dinh',
        issuedDate: '2025',
        effectiveDate: '2025',
        issuedBy: 'Chính phủ',
        status: 'hieu-luc',
        summary: 'Quy định phân định thẩm quyền giữa chính quyền cấp tỉnh và cấp huyện trong các lĩnh vực: quy hoạch xây dựng, cấp phép xây dựng, quản lý chất lượng công trình, quản lý nhà ở, kinh doanh bất động sản.',
        fileName: 'Nghi_dinh_140_2025_ND-CP_cua_Chinh_phu_quy_dinh_ve_phan_dinh_tham_quyen_cua_chinh_quyen_dia_phuong_02_cap_trong_linh_vuc_quan_ly_Nha_nuoc_cua_Bo_Xay_dung_1749785465897.pdf',
        filePath: '/resources/Nghi_dinh_140_2025_ND-CP_cua_Chinh_phu_quy_dinh_ve_phan_dinh_tham_quyen_cua_chinh_quyen_dia_phuong_02_cap_trong_linh_vuc_quan_ly_Nha_nuoc_cua_Bo_Xay_dung_1749785465897.pdf',
        fileSize: '14.6 MB',
        tags: ['phân cấp', 'chính quyền địa phương', 'cấp phép xây dựng', 'quy hoạch'],
        relatedDocIds: ['nd-144-2025', 'luat-xay-dung-2025'],
        chapters: [
            {
                id: 'nd140-ch1', code: 'Chương I', title: 'Quy định chung',
                articles: [
                    { id: 'nd140-d1', code: 'Điều 1', title: 'Phạm vi điều chỉnh', summary: 'Phân định thẩm quyền giữa cấp tỉnh và cấp huyện trong quản lý XD.' },
                ]
            },
        ]
    },
    {
        id: 'nd-144-2025',
        code: 'NĐ 144/2025/NĐ-CP',
        title: 'Nghị định quy định về phân quyền, phân cấp trong lĩnh vực quản lý Nhà nước của Bộ Xây dựng',
        shortTitle: 'NĐ 144/2025 (phân quyền BXD)',
        type: 'nghi-dinh',
        issuedDate: '2025',
        effectiveDate: '2025',
        issuedBy: 'Chính phủ',
        status: 'hieu-luc',
        summary: 'Quy định phân quyền, phân cấp từ Chính phủ, Thủ tướng, Bộ Xây dựng cho các cấp trong lĩnh vực: quy hoạch, hoạt động xây dựng, phát triển đô thị, nhà ở, kinh doanh bất động sản, vật liệu xây dựng.',
        fileName: 'Nghi_dinh_144_2025_ND-CP_cua_Chinh_phu_quy_dinh_ve_phan_quyen,_phan_cap_trong_linh_vuc_quan_ly_Nha_nuoc_cua_Bo_Xay_dung_1749785955601.pdf',
        filePath: '/resources/Nghi_dinh_144_2025_ND-CP_cua_Chinh_phu_quy_dinh_ve_phan_quyen,_phan_cap_trong_linh_vuc_quan_ly_Nha_nuoc_cua_Bo_Xay_dung_1749785955601.pdf',
        fileSize: '15.7 MB',
        tags: ['phân quyền', 'phân cấp', 'Bộ Xây dựng', 'thẩm quyền'],
        relatedDocIds: ['nd-140-2025', 'luat-xay-dung-2025'],
        chapters: [
            {
                id: 'nd144-ch1', code: 'Chương I', title: 'Quy định chung',
                articles: [
                    { id: 'nd144-d1', code: 'Điều 1', title: 'Phạm vi điều chỉnh', summary: 'Phân quyền, phân cấp trong lĩnh vực QLNN của Bộ Xây dựng.' },
                ]
            },
        ]
    },

    // ========== THÔNG TƯ ==========
    {
        id: 'tt-24-2025',
        code: 'TT 24/2025/TT-BXD',
        title: 'Thông tư hướng dẫn Nghị định 175/2024/NĐ-CP và Nghị định 15/2021/NĐ-CP về quản lý dự án đầu tư xây dựng',
        shortTitle: 'TT 24/2025 (hướng dẫn NĐ 175)',
        type: 'thong-tu',
        issuedDate: '2025',
        effectiveDate: '2025',
        issuedBy: 'Bộ Xây dựng',
        status: 'hieu-luc',
        summary: 'Hướng dẫn chi tiết về quản lý dự án đầu tư xây dựng: phân loại dự án, lập/thẩm định BCNCKT, thiết kế, chi phí, QLCL, nghiệm thu, bàn giao; các biểu mẫu kèm theo.',
        fileName: 'TT24-2025.pdf',
        filePath: '/resources/TT24-2025.pdf',
        fileSize: '26.1 MB',
        tags: ['hướng dẫn NĐ 175', 'quản lý dự án', 'biểu mẫu', 'thẩm định', 'nghiệm thu'],
        relatedDocIds: ['nd-175-2024', 'luat-xay-dung-2025'],
        chapters: [
            {
                id: 'tt24-ch1', code: 'Chương I', title: 'Quy định chung',
                articles: [
                    { id: 'tt24-d1', code: 'Điều 1', title: 'Phạm vi điều chỉnh', summary: 'Hướng dẫn NĐ 175/2024 và NĐ 15/2021 về QLDA ĐTXD.' },
                ]
            },
            {
                id: 'tt24-ch2', code: 'Chương II', title: 'Lập, thẩm định dự án và thiết kế',
                articles: [
                    { id: 'tt24-d5', code: 'Điều 5', title: 'Hồ sơ trình thẩm định', summary: 'Thành phần hồ sơ trình thẩm định BCNCKT, thiết kế xây dựng.' },
                ]
            },
            {
                id: 'tt24-ph', code: 'Phụ lục', title: 'Các biểu mẫu',
                articles: [
                    { id: 'tt24-pl1', code: 'Phụ lục I', title: 'Mẫu Tờ trình thẩm định', summary: 'Biểu mẫu tờ trình thẩm định dự án ĐTXD.' },
                    { id: 'tt24-pl2', code: 'Phụ lục II', title: 'Mẫu Báo cáo kết quả thẩm định', summary: 'Biểu mẫu báo cáo kết quả thẩm định thiết kế.' },
                    { id: 'tt24-pl3', code: 'Phụ lục III', title: 'Mẫu Quyết định phê duyệt', summary: 'Biểu mẫu QĐ phê duyệt dự án, thiết kế.' },
                ]
            },
        ]
    },
    {
        id: 'tt-06-2021',
        code: 'TT 06/2021/TT-BXD',
        title: 'Thông tư quy định về phân cấp công trình xây dựng và hướng dẫn áp dụng trong quản lý hoạt động đầu tư xây dựng',
        shortTitle: 'TT 06/2021 (phân cấp công trình)',
        type: 'thong-tu',
        issuedDate: '30/06/2021',
        effectiveDate: '15/08/2021',
        issuedBy: 'Bộ Xây dựng',
        status: 'hieu-luc',
        summary: 'Quy định phân cấp công trình (đặc biệt, cấp I, II, III, IV) theo loại và quy mô; hướng dẫn áp dụng trong cấp phép xây dựng, thẩm định, QLCL, bảo trì.',
        fileName: 'TT06-2021.pdf',
        filePath: '/resources/TT06-2021.pdf',
        fileSize: '8.5 MB',
        tags: ['phân cấp công trình', 'cấp đặc biệt', 'cấp I-IV', 'quy mô công trình'],
        relatedDocIds: ['nd-175-2024', 'luat-xay-dung-2025'],
        chapters: [
            {
                id: 'tt06-ch1', code: 'Chương I', title: 'Quy định chung',
                articles: [
                    { id: 'tt06-d1', code: 'Điều 1', title: 'Phạm vi điều chỉnh', summary: 'Phân cấp công trình xây dựng và hướng dẫn áp dụng.' },
                    { id: 'tt06-d2', code: 'Điều 2', title: 'Đối tượng áp dụng', summary: 'Tổ chức, cá nhân tham gia hoạt động ĐTXD.' },
                ]
            },
            {
                id: 'tt06-ch2', code: 'Chương II', title: 'Phân cấp công trình',
                articles: [
                    { id: 'tt06-d3', code: 'Điều 3', title: 'Nguyên tắc phân cấp', summary: 'Cấp công trình xác định theo loại công trình, quy mô kết cấu, tầm quan trọng.' },
                    { id: 'tt06-d4', code: 'Điều 4', title: 'Bảng phân cấp công trình', summary: 'Chi tiết cấp đặc biệt, I, II, III, IV cho từng loại công trình.' },
                ]
            },
        ]
    },

    // ========== QCVN / TCVN ==========
    {
        id: 'qcvn-pccc',
        code: 'QCVN 06:2022/BXD',
        title: 'Quy chuẩn kỹ thuật quốc gia về An toàn cháy cho nhà và công trình',
        shortTitle: 'QCVN 06 - PCCC',
        type: 'qcvn',
        issuedDate: '2022',
        effectiveDate: '2023',
        issuedBy: 'Bộ Xây dựng',
        status: 'hieu-luc',
        summary: 'Quy chuẩn bắt buộc về phòng cháy chữa cháy cho nhà và công trình: khoảng cách an toàn, lối thoát nạn, vật liệu chống cháy, hệ thống chữa cháy tự động, báo cháy.',
        fileName: 'QCVN PCCC.pdf',
        filePath: '/resources/QCVN PCCC.pdf',
        fileSize: '1.8 MB',
        tags: ['PCCC', 'phòng cháy', 'an toàn cháy', 'thoát nạn', 'vật liệu chống cháy'],
        relatedDocIds: ['luat-xay-dung-2025', 'tt-06-2021'],
        chapters: [
            {
                id: 'qcvn06-ch1', code: 'Phần 1', title: 'Quy định chung',
                articles: [
                    { id: 'qcvn06-1-1', code: '1.1', title: 'Phạm vi điều chỉnh', summary: 'Áp dụng cho thiết kế, xây dựng mới, cải tạo nhà và công trình.' },
                    { id: 'qcvn06-1-2', code: '1.2', title: 'Đối tượng áp dụng', summary: 'Tất cả nhà và công trình trên lãnh thổ Việt Nam.' },
                ]
            },
            {
                id: 'qcvn06-ch2', code: 'Phần 2', title: 'Phân loại kỹ thuật về cháy',
                articles: [
                    { id: 'qcvn06-2-1', code: '2.1', title: 'Bậc chịu lửa', summary: 'Phân loại bậc chịu lửa I, II, III, IV, V cho công trình.' },
                    { id: 'qcvn06-2-2', code: '2.2', title: 'Nguy hiểm cháy nổ', summary: 'Phân loại hạng nguy hiểm cháy, cháy nổ: A, B, C, D, E.' },
                ]
            },
            {
                id: 'qcvn06-ch3', code: 'Phần 3', title: 'Khoảng cách an toàn PCCC',
                articles: [
                    { id: 'qcvn06-3-1', code: '3.1', title: 'Khoảng cách giữa các nhà', summary: 'Bảng khoảng cách tối thiểu giữa các công trình theo bậc chịu lửa.' },
                ]
            },
            {
                id: 'qcvn06-ch4', code: 'Phần 4', title: 'Đường thoát nạn',
                articles: [
                    { id: 'qcvn06-4-1', code: '4.1', title: 'Yêu cầu về lối thoát nạn', summary: 'Số lượng, chiều rộng, chiều dài tối đa đường thoát nạn.' },
                ]
            },
        ]
    },

    // ========== QUYẾT ĐỊNH ==========
    {
        id: 'qd-409-2025',
        code: 'QĐ 409/QĐ-BXD',
        title: 'Quyết định công bố Suất vốn đầu tư xây dựng công trình và giá xây dựng tổng hợp bộ phận kết cấu công trình năm 2025',
        shortTitle: 'QĐ 409 - Suất vốn đầu tư 2025',
        type: 'quyet-dinh',
        issuedDate: '2025',
        effectiveDate: '2025',
        issuedBy: 'Bộ Xây dựng',
        status: 'hieu-luc',
        summary: 'Công bố suất vốn đầu tư xây dựng công trình (nhà ở, trụ sở, trường học, bệnh viện, đường giao thông, cấp thoát nước...) và giá xây dựng tổng hợp bộ phận kết cấu làm cơ sở lập tổng mức đầu tư, ước tính chi phí.',
        fileName: 'QĐ 409 Suất vốn đầu tư 2025.pdf',
        filePath: '/resources/QĐ 409 Suất vốn đầu tư 2025.pdf',
        fileSize: '26.9 MB',
        tags: ['suất vốn đầu tư', 'giá xây dựng', 'tổng mức đầu tư', 'chi phí xây dựng', 'đơn giá'],
        relatedDocIds: ['nd-175-2024', 'luat-xay-dung-2025'],
        chapters: [
            {
                id: 'qd409-p1', code: 'Phần I', title: 'Suất vốn đầu tư xây dựng công trình',
                articles: [
                    { id: 'qd409-1-1', code: 'Bảng 1', title: 'Suất vốn đầu tư nhà ở', summary: 'Suất vốn đầu tư nhà ở theo loại hình: chung cư, biệt thự, liền kề, nhà ở xã hội.' },
                    { id: 'qd409-1-2', code: 'Bảng 2', title: 'Suất vốn đầu tư công trình công cộng', summary: 'Trụ sở, trường học, bệnh viện, nhà văn hóa, thể thao.' },
                    { id: 'qd409-1-3', code: 'Bảng 3', title: 'Suất vốn đầu tư hạ tầng kỹ thuật', summary: 'Đường giao thông, cầu, cấp nước, thoát nước, điện.' },
                ]
            },
            {
                id: 'qd409-p2', code: 'Phần II', title: 'Giá xây dựng tổng hợp bộ phận kết cấu',
                articles: [
                    { id: 'qd409-2-1', code: 'Bảng 4', title: 'Giá xây dựng kết cấu nhà dân dụng', summary: 'Chi phí theo m2 sàn cho từng loại kết cấu: BTCT, thép, xây gạch.' },
                ]
            },
        ]
    },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getDocumentsByType(type: DocType): LegalDocument[] {
    return legalDocuments.filter(d => d.type === type);
}

export function getDocumentById(id: string): LegalDocument | undefined {
    return legalDocuments.find(d => d.id === id);
}

export function searchDocuments(query: string): LegalDocument[] {
    if (!query.trim()) return legalDocuments;
    const q = query.toLowerCase();
    return legalDocuments.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        d.shortTitle.toLowerCase().includes(q) ||
        d.summary.toLowerCase().includes(q) ||
        d.tags.some(t => t.toLowerCase().includes(q)) ||
        d.chapters.some(ch =>
            ch.title.toLowerCase().includes(q) ||
            ch.articles.some(a =>
                a.title.toLowerCase().includes(q) ||
                a.summary.toLowerCase().includes(q)
            )
        )
    );
}

export function getRelatedDocuments(doc: LegalDocument): LegalDocument[] {
    return doc.relatedDocIds
        .map(id => legalDocuments.find(d => d.id === id))
        .filter(Boolean) as LegalDocument[];
}

export function getDocStats() {
    const totalArticles = legalDocuments.reduce((sum, d) =>
        sum + d.chapters.reduce((s, c) => s + c.articles.length, 0), 0
    );
    const totalChapters = legalDocuments.reduce((sum, d) => sum + d.chapters.length, 0);
    return {
        total: legalDocuments.length,
        active: legalDocuments.filter(d => d.status === 'hieu-luc').length,
        expired: legalDocuments.filter(d => d.status === 'het-hieu-luc').length,
        upcoming: legalDocuments.filter(d => d.status === 'sap-hieu-luc').length,
        totalArticles,
        totalChapters,
        byType: {
            luat: legalDocuments.filter(d => d.type === 'luat').length,
            'nghi-dinh': legalDocuments.filter(d => d.type === 'nghi-dinh').length,
            'thong-tu': legalDocuments.filter(d => d.type === 'thong-tu').length,
            qcvn: legalDocuments.filter(d => d.type === 'qcvn').length,
            'quyet-dinh': legalDocuments.filter(d => d.type === 'quyet-dinh').length,
        },
    };
}

export interface FlatArticle {
    docId: string;
    docTitle: string;
    chapterId: string;
    chapterCode: string;
    chapterTitle: string;
    article: LegalArticle;
}

export function getAllArticles(): FlatArticle[] {
    const result: FlatArticle[] = [];
    for (const doc of legalDocuments) {
        for (const ch of doc.chapters) {
            for (const art of ch.articles) {
                result.push({
                    docId: doc.id,
                    docTitle: doc.shortTitle,
                    chapterId: ch.id,
                    chapterCode: ch.code,
                    chapterTitle: ch.title,
                    article: art,
                });
            }
        }
    }
    return result;
}

export function getArticleById(articleId: string): FlatArticle | undefined {
    return getAllArticles().find(a => a.article.id === articleId);
}

export function deepSearchArticles(query: string): FlatArticle[] {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return getAllArticles().filter(a =>
        a.article.title.toLowerCase().includes(q) ||
        a.article.summary.toLowerCase().includes(q) ||
        a.article.code.toLowerCase().includes(q)
    );
}

export function getDocArticleCount(docId: string): { chapters: number; articles: number } {
    const doc = legalDocuments.find(d => d.id === docId);
    if (!doc) return { chapters: 0, articles: 0 };
    return {
        chapters: doc.chapters.length,
        articles: doc.chapters.reduce((s, c) => s + c.articles.length, 0),
    };
}

