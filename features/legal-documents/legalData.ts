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
        code: 'Luật số 135/2025/QH16',
        title: 'Luật Xây dựng (sửa đổi)',
        shortTitle: 'Luật Xây dựng 2025',
        type: 'luat',
        issuedDate: '2025',
        effectiveDate: '01/01/2026',
        issuedBy: 'Quốc hội',
        status: 'hieu-luc',
        summary: 'Luật Xây dựng sửa đổi năm 2025 quy định về quy hoạch xây dựng, dự án đầu tư xây dựng, khảo sát - thiết kế, thi công, nghiệm thu, bảo hành, bảo trì công trình; năng lực hoạt động xây dựng; quản lý nhà nước về xây dựng.',
        fileName: 'luat135-XD-2025.pdf',
        filePath: '/resources/luat135-XD-2025.pdf',
        fileSize: '4.2 MB',
        tags: ['xây dựng', 'quản lý dự án', 'giấy phép xây dựng', 'chất lượng công trình', 'thiết kế'],
        relatedDocIds: ['nd-175-2024', 'tt-06-2021', 'qcvn-pccc'],
        chapters: [
            {
                id: 'luat135-ch1', code: 'Chương I', title: 'Quy định chung',
                articles: [
                    { id: 'luat135-d1', code: 'Điều 1', title: 'Phạm vi điều chỉnh', summary: 'Quy định về hoạt động đầu tư xây dựng; quyền và nghĩa vụ của tổ chức, cá nhân.' },
                    { id: 'luat135-d3', code: 'Điều 3', title: 'Giải thích từ ngữ', summary: 'Công trình xây dựng, hoạt động xây dựng, chủ đầu tư, nhà thầu, giám sát...' },
                ]
            },
            {
                id: 'luat135-ch2', code: 'Chương II', title: 'Quy hoạch xây dựng',
                articles: [
                    { id: 'luat135-d12', code: 'Điều 12', title: 'Yêu cầu đối với quy hoạch xây dựng', summary: 'Phù hợp chiến lược PT KT-XH, quốc phòng, an ninh, bảo vệ môi trường.' },
                ]
            },
            {
                id: 'luat135-ch3', code: 'Chương III', title: 'Dự án đầu tư xây dựng',
                articles: [
                    { id: 'luat135-d50', code: 'Điều 50', title: 'Phân loại dự án đầu tư xây dựng', summary: 'Phân loại theo quy mô, tính chất, nguồn vốn: Nhóm A, B, C.' },
                    { id: 'luat135-d52', code: 'Điều 52', title: 'Trình tự thực hiện dự án', summary: 'Chuẩn bị đầu tư → Thực hiện dự án → Kết thúc xây dựng đưa vào khai thác sử dụng.' },
                ]
            },
            {
                id: 'luat135-ch5', code: 'Chương V', title: 'Thi công xây dựng công trình',
                articles: [
                    { id: 'luat135-d107', code: 'Điều 107', title: 'Điều kiện khởi công xây dựng', summary: 'Phải có GPXD (nếu thuộc diện), thiết kế BVTC được duyệt, hợp đồng thi công.' },
                ]
            },
            {
                id: 'luat135-ch6', code: 'Chương VI', title: 'Quản lý chất lượng công trình',
                articles: [
                    { id: 'luat135-d112', code: 'Điều 112', title: 'Nguyên tắc QLCL công trình', summary: 'Đảm bảo an toàn, tiết kiệm, phù hợp tiêu chuẩn, quy chuẩn kỹ thuật.' },
                    { id: 'luat135-d120', code: 'Điều 120', title: 'Nghiệm thu công trình', summary: 'Nghiệm thu từng công việc, giai đoạn, hạng mục, toàn bộ công trình.' },
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
    return {
        total: legalDocuments.length,
        active: legalDocuments.filter(d => d.status === 'hieu-luc').length,
        expired: legalDocuments.filter(d => d.status === 'het-hieu-luc').length,
        upcoming: legalDocuments.filter(d => d.status === 'sap-hieu-luc').length,
        byType: {
            luat: legalDocuments.filter(d => d.type === 'luat').length,
            'nghi-dinh': legalDocuments.filter(d => d.type === 'nghi-dinh').length,
            'thong-tu': legalDocuments.filter(d => d.type === 'thong-tu').length,
            qcvn: legalDocuments.filter(d => d.type === 'qcvn').length,
            'quyet-dinh': legalDocuments.filter(d => d.type === 'quyet-dinh').length,
        },
    };
}
