/**
 * Step Sub-Tasks Registry
 * ========================
 * Tự động tạo công việc con cho từng bước dự án
 * 
 * Căn cứ pháp lý:
 * - Luật XD 135/2025/QH15 (thay thế Luật XD 2014)
 * - Luật ĐTC 58/2024/QH15
 * - NĐ 175/2024/NĐ-CP (thay thế NĐ 15/2021)
 * - NĐ 140/2025/NĐ-CP (chính quyền 2 cấp)
 * - NĐ 144/2025/NĐ-CP (phân quyền, phân cấp)
 * - Sổ tay ĐTC Học viện CTQG HCM
 */

import { ProjectGroup } from '@/types';

export interface SubTaskDef {
    code: string;
    title: string;
    description?: string;
    responsible: string;
    legalBasis?: string;
    estimatedDays?: number;
    templatePath?: string;
    templateLabel?: string;
}

// ============================================================
// PHASE 1: CHUẨN BỊ DỰ ÁN
// ============================================================

const PREP_PREFEASIBILITY: SubTaskDef[] = [
    {
        code: 'PREFEAS_01', title: 'Giao đơn vị lập BC NCTKT',
        responsible: 'Giám đốc Học viện CTQG HCM',
        legalBasis: 'Đ25 Luật ĐTC 58',
    },
    {
        code: 'PREFEAS_02', title: 'Lập Báo cáo nghiên cứu tiền khả thi',
        responsible: 'Đơn vị được giao lập',
        estimatedDays: 30,
        legalBasis: 'Đ33 Luật ĐTC 58',
        templatePath: 'mau-02-bc-nctkt-du-an-nhom-a.md',
        templateLabel: 'Mẫu 02 – BC NCTKT dự án nhóm A',
    },
    {
        code: 'PREFEAS_03', title: 'Thẩm định BC NCTKT + nguồn vốn',
        responsible: 'HĐ thẩm định / Sở TC',
        estimatedDays: 45,
        legalBasis: 'Đ25 Luật ĐTC 58; K6 Đ9 NĐ 40',
        templatePath: 'mau-04-bc-ket-qua-tham-dinh-chu-truong.md',
        templateLabel: 'Mẫu 04 – BC kết quả thẩm định',
    },
    {
        code: 'PREFEAS_04', title: 'Hoàn thiện theo ý kiến thẩm định',
        responsible: 'Đơn vị lập BC',
        legalBasis: 'Đ25 Luật ĐTC 58',
    },
];

const PREP_POLICY: SubTaskDef[] = [
    {
        code: 'POLICY_01', title: 'Lập BC đề xuất chủ trương đầu tư',
        responsible: 'Chủ đầu tư (Ban QLDA)',
        estimatedDays: 20,
        legalBasis: 'Đ34-35 Luật ĐTC 58',
        templatePath: 'mau-03-bc-de-xuat-chu-truong-dt.md',
        templateLabel: 'Mẫu 04 – BC đề xuất chủ trương ĐT',
    },
    {
        code: 'POLICY_02', title: 'Thẩm định BC đề xuất CTrĐT + nguồn vốn',
        responsible: 'HĐ thẩm định / Sở TC',
        estimatedDays: 30,
        legalBasis: 'Đ27-28 Luật ĐTC 58',
        templatePath: 'mau-04-bc-ket-qua-tham-dinh-chu-truong.md',
        templateLabel: 'Mẫu 04 – BC thẩm định CTrĐT',
    },
    {
        code: 'POLICY_03', title: 'Hoàn thiện theo ý kiến thẩm định',
        responsible: 'Đơn vị lập BC',
    },
    {
        code: 'POLICY_04', title: 'Trình duyệt QĐ chủ trương đầu tư',
        responsible: 'HĐ thẩm định',
        templatePath: 'mau-05-to-trinh-qd-chu-truong-dt.md',
        templateLabel: 'Mẫu 05 – Tờ trình QĐ CTrĐT',
    },
    {
        code: 'POLICY_05', title: 'Quyết định chủ trương đầu tư',
        responsible: 'Giám đốc Học viện CTQG / Ban Cán sự Đảng',
        legalBasis: 'K2 Đ25,27,28 Luật ĐTC 58',
        templatePath: 'mau-06-nghi-quyet-chu-truong-dt.md',
        templateLabel: 'Mẫu 06 – Nghị quyết CTrĐT',
    },
];

const PREP_SURVEY: SubTaskDef[] = [
    {
        code: 'SURVEY_01', title: 'Lập KHLCNT giai đoạn CBDA',
        responsible: 'CĐT (Ban QLDA)',
        legalBasis: 'Đ36-39 Luật ĐT 2023',
    },
    {
        code: 'SURVEY_02', title: 'Thẩm định KHLCNT',
        responsible: 'CĐT / Đơn vị được giao',
        estimatedDays: 20,
        legalBasis: 'K3 Đ40 Luật ĐT 2023',
    },
    {
        code: 'SURVEY_03', title: 'Phê duyệt KHLCNT',
        responsible: 'CĐT / Người có thẩm quyền',
        estimatedDays: 10,
        legalBasis: 'Đ39, K2 Đ40 Luật ĐT 2023',
    },
    {
        code: 'SURVEY_04', title: 'LCNT khảo sát, TV thiết kế, TV thẩm tra',
        responsible: 'CĐT, BMT, Tổ chuyên gia',
    },
    {
        code: 'SURVEY_05', title: 'Tổ chức khảo sát địa điểm',
        responsible: 'CĐT, Nhà thầu TVKS',
    },
];

const PREP_PLANNING: SubTaskDef[] = [
    {
        code: 'PLAN_01', title: 'Lập nhiệm vụ quy hoạch chi tiết',
        responsible: 'CĐT',
        estimatedDays: 30,
        legalBasis: 'Đ36 Luật QHĐT&NT 47',
    },
    {
        code: 'PLAN_02', title: 'LCNT tư vấn lập quy hoạch',
        responsible: 'CĐT',
        estimatedDays: 30,
    },
    {
        code: 'PLAN_03', title: 'Lập đồ án quy hoạch chi tiết',
        responsible: 'CĐT, Nhà thầu TVTK',
        estimatedDays: 180,
    },
    {
        code: 'PLAN_04', title: 'Lấy ý kiến, thẩm định, phê duyệt QH',
        responsible: 'Sở XD',
        estimatedDays: 30,
        legalBasis: 'Đ37, Đ40 Luật QHĐT&NT 47',
    },
];

// BCNCKT cho nhóm A/B
const PREP_FEASIBILITY_AB: SubTaskDef[] = [
    {
        code: 'FEAS_01', title: 'Lập BCNCKT + Thiết kế cơ sở (TKCS)',
        responsible: 'CĐT, Nhà thầu TVTK',
        estimatedDays: 80, // A: 80d, B: 60d — sẽ điều chỉnh theo groupCode
        legalBasis: 'Đ14 NĐ 175',
    },
    {
        code: 'FEAS_02', title: 'Hoàn thiện BCNCKT ĐTXD',
        responsible: 'CĐT, ĐVTV lập BCNCKT',
        legalBasis: 'Đ14 NĐ 175',
    },
    {
        code: 'FEAS_03', title: 'Trình hồ sơ thẩm định BCNCKT',
        responsible: 'CĐT',
        templatePath: 'mau-01-to-trinh-tham-dinh-bc-nctkt.md',
        templateLabel: 'Mẫu 01 – Tờ trình thẩm định',
    },
    {
        code: 'FEAS_04', title: 'Thẩm tra BCNCKT (nếu có)',
        responsible: 'Nhà thầu TV thẩm tra',
        templatePath: 'bao-cao-ket-qua-tham-tra-bcnckt.md',
        templateLabel: 'BC kết quả thẩm tra BCNCKT',
    },
    {
        code: 'FEAS_05', title: 'Lấy ý kiến sở ngành liên quan',
        responsible: 'Sở XD (NĐ 144)',
        estimatedDays: 15, // A: 15d, B: 10d
        legalBasis: 'Đ7 NĐ 10; Đ15-21 NĐ 175',
    },
    {
        code: 'FEAS_06', title: 'Tổng hợp kết quả thẩm định',
        responsible: 'Sở XD (NĐ 144, NĐ 175)',
        estimatedDays: 40, // A: 40d, B: 30d
        legalBasis: 'K1 Đ22 NĐ 175',
        templatePath: 'thong-bao-ket-qua-tham-dinh-bcnckt.md',
        templateLabel: 'TB KQTĐ BCNCKT',
    },
    {
        code: 'FEAS_07', title: 'Thông báo KQTĐ (NQĐĐT)',
        responsible: 'Người QĐ đầu tư',
        templatePath: 'thong-bao-ket-qua-tham-dinh-bcnckt-nqddt.md',
        templateLabel: 'TB KQTĐ BCNCKT (NQĐĐT)',
    },
];

// BCKTKT cho nhóm C
const PREP_FEASIBILITY_C: SubTaskDef[] = [
    {
        code: 'FEASC_01', title: 'Lập BCKTKT + TK Bản vẽ thi công',
        responsible: 'CĐT, Nhà thầu TVTK',
        estimatedDays: 60,
        legalBasis: 'Đ14 NĐ 175',
    },
    {
        code: 'FEASC_02', title: 'Hoàn thiện BCKTKT ĐTXD',
        responsible: 'CĐT, ĐVTV',
    },
    {
        code: 'FEASC_03', title: 'Thẩm định BCKTKT',
        responsible: 'Sở XD (DA tỉnh) / UBND xã (DA xã, NĐ 140 Đ4)',
        estimatedDays: 20,
        legalBasis: 'Đ56-59 Luật XD; K13-16 Đ1 Luật 62; NĐ 140 Đ4',
        templatePath: 'thong-bao-ket-qua-tham-dinh-bcktkt.md',
        templateLabel: 'TB KQTĐ BCKTKT',
    },
    {
        code: 'FEASC_04', title: 'Tổng hợp trình phê duyệt',
        responsible: 'CQ chủ trì thẩm định',
        estimatedDays: 5,
    },
];

const PREP_DECISION: SubTaskDef[] = [
    {
        code: 'DEC_01', title: 'Trình duyệt QĐ đầu tư dự án',
        responsible: 'CQ chủ trì thẩm định',
    },
    {
        code: 'DEC_02', title: 'Phê duyệt dự án đầu tư XD',
        responsible: 'Giám đốc Học viện CTQG HCM',
        estimatedDays: 7,
        legalBasis: 'Luật XD 135/2025; Luật ĐTC 58/2024',
    },
];

// ============================================================
// PHASE 2: THỰC HIỆN DỰ ÁN
// ============================================================

const IMPL_SITE: SubTaskDef[] = [
    {
        code: 'SITE_01', title: 'Lập phương án bồi thường, hỗ trợ, TĐC',
        responsible: 'CĐT, UBND xã',
    },
    {
        code: 'SITE_02', title: 'Thẩm định, phê duyệt PA BT, TĐC',
        responsible: 'Hội đồng BT TĐC',
    },
    {
        code: 'SITE_03', title: 'Chi trả bồi thường, GPMB',
        responsible: 'CĐT, UBND xã',
    },
    {
        code: 'SITE_04', title: 'Bàn giao mặt bằng',
        responsible: 'CĐT',
    },
];

const IMPL_SURVEY: SubTaskDef[] = [
    {
        code: 'ISURVEY_01', title: 'Khảo sát địa hình, địa chất',
        responsible: 'CĐT, Nhà thầu TVKS',
    },
    {
        code: 'ISURVEY_02', title: 'Nghiệm thu kết quả khảo sát',
        responsible: 'CĐT',
        legalBasis: 'Luật XD 135/2025',
    },
];

// TKXD cho A/B (Luật 135: CĐT tự thẩm định)
const IMPL_DESIGN_AB: SubTaskDef[] = [
    {
        code: 'DESIGN_01', title: 'Lập hồ sơ TKXD triển khai sau TKCS',
        responsible: 'CĐT, Nhà thầu TVTK',
        estimatedDays: 80, // A: 80d, B: 60d
        legalBasis: 'Đ79-80 Luật XD sđ Luật 62; Đ35,37,42 NĐ 175',
        templatePath: 'mau-01-to-trinh-tham-dinh-bc-nctkt.md',
        templateLabel: 'Tờ trình thẩm định TK',
    },
    {
        code: 'DESIGN_02', title: 'Thẩm tra thiết kế (TV độc lập)',
        responsible: 'Nhà thầu TV thẩm tra',
        templatePath: 'bao-cao-ket-qua-tham-tra-thiet-ke-xay-dung.md',
        templateLabel: 'BC thẩm tra TKXD',
    },
    {
        code: 'DESIGN_03', title: 'CĐT tự thẩm định + phê duyệt TK-DT',
        description: 'Luật 135/2025: BÃI BỎ thẩm định tại CQ chuyên môn XD. CĐT tự chịu trách nhiệm.',
        responsible: 'CĐT (Ban QLDA)',
        estimatedDays: 7,
        legalBasis: 'Luật XD 135/2025; K8 Đ82 Luật XD sđ; Đ48 NĐ 175',
        templatePath: 'quyet-dinh-phe-duyet-thiet-ke-xay-dung.md',
        templateLabel: 'QĐ phê duyệt TKXD',
    },
];

// TKXD cho C (nằm trong BCKTKT, chỉ dự toán)
const IMPL_DESIGN_C: SubTaskDef[] = [
    {
        code: 'DESIGNC_01', title: 'Lập TK bản vẽ thi công + Dự toán',
        description: 'Nhóm C: TK BVTC đã lập trong BCKTKT. Bước này chỉ hoàn thiện dự toán chi tiết.',
        responsible: 'CĐT, Nhà thầu TVTK',
        estimatedDays: 30,
    },
    {
        code: 'DESIGNC_02', title: 'Phê duyệt dự toán chi tiết',
        responsible: 'CĐT',
        estimatedDays: 5,
    },
];

const IMPL_PERMIT: SubTaskDef[] = [
    {
        code: 'PERMIT_01', title: 'Lập đơn đề nghị cấp GPXD',
        responsible: 'CĐT',
        templatePath: 'phu-luc-II-01-don-de-nghi-cap-gpxd.md',
        templateLabel: 'Phụ lục II-01 – Đơn GPXD',
    },
    {
        code: 'PERMIT_02', title: 'Thẩm định + cấp GPXD',
        description: 'NĐ 140/2025 Đ4: UBND xã cấp GPXD cấp III-IV. Sở XD cấp I-II.',
        responsible: 'Sở XD (cấp I-II) / UBND xã (cấp III-IV, NĐ 140 Đ4)',
        estimatedDays: 20,
        legalBasis: 'K2-3 Đ103 Luật XD sđ 2020; NĐ 140 Đ4 K1',
    },
];

const IMPL_BIDDING: SubTaskDef[] = [
    {
        code: 'BID_01', title: 'Lập Tờ trình KHLCNT giai đoạn THDA',
        responsible: 'CĐT',
        templatePath: 'mau-07-van-ban-trinh-duyet-khlcnt.md',
        templateLabel: 'Mẫu 07 – VB trình duyệt KHLCNT',
    },
    {
        code: 'BID_02', title: 'Thẩm định KHLCNT',
        responsible: 'Sở TC',
        estimatedDays: 20,
        legalBasis: 'K3 Đ45 Luật ĐT 2023',
        templatePath: 'mau-08-bc-tham-dinh-khlcnt.md',
        templateLabel: 'Mẫu 08 – BC thẩm định KHLCNT',
    },
    {
        code: 'BID_03', title: 'Phê duyệt KHLCNT',
        responsible: 'Người có thẩm quyền / CĐT',
        estimatedDays: 10,
        legalBasis: 'Đ40 Luật ĐT 2023',
        templatePath: 'mau-09-qd-phe-duyet-khlcnt.md',
        templateLabel: 'Mẫu 09 – QĐ phê duyệt KHLCNT',
    },
    {
        code: 'BID_04', title: 'Lập HSMT/HSYC',
        responsible: 'CĐT, BMT',
    },
    {
        code: 'BID_05', title: 'Phát hành HSMT, mở thầu',
        responsible: 'BMT',
    },
    {
        code: 'BID_06', title: 'Đánh giá HSDT',
        responsible: 'Tổ chuyên gia',
    },
    {
        code: 'BID_07', title: 'Thẩm định, phê duyệt KQLCNT',
        responsible: 'CĐT',
    },
    {
        code: 'BID_08', title: 'Thương thảo, ký kết hợp đồng',
        responsible: 'CĐT, Nhà thầu',
        templatePath: 'mau-42-45-hop-dong-xay-dung.md',
        templateLabel: 'Mẫu 42-45 – Hợp đồng XD',
    },
];

const IMPL_CONSTRUCTION: SubTaskDef[] = [
    {
        code: 'CONST_01', title: 'Thông báo khởi công',
        responsible: 'CĐT',
        templatePath: 'mau-16-thong-bao-khoi-cong.md',
        templateLabel: 'Mẫu 16 – TB khởi công',
    },
    {
        code: 'CONST_02', title: 'Tổ chức thi công xây dựng',
        responsible: 'Nhà thầu thi công',
        legalBasis: 'Luật XD 135/2025',
    },
    {
        code: 'CONST_03', title: 'Quản lý tiến độ, an toàn lao động',
        responsible: 'CĐT',
        legalBasis: 'Luật XD 135/2025',
    },
];

const IMPL_SUPERVISION: SubTaskDef[] = [
    {
        code: 'SUP_01', title: 'Giám sát thi công xây dựng',
        responsible: 'CĐT, Nhà thầu TVGS',
        legalBasis: 'K1 Đ120 Luật XD; K1 Đ19 NĐ 06',
        templatePath: 'mau-17-bc-dinh-ky-giam-sat-thi-cong.md',
        templateLabel: 'Mẫu 17 – BC định kỳ GS thi công',
    },
    {
        code: 'SUP_02', title: 'Giám sát tác giả',
        responsible: 'Nhà thầu TVTK',
        legalBasis: 'Đ114 Luật XD sđ; Đ20 NĐ 06',
    },
    {
        code: 'SUP_03', title: 'Lập BC hoàn thành giám sát',
        responsible: 'CĐT, Nhà thầu TVGS',
        templatePath: 'mau-18-bc-hoan-thanh-giam-sat-thi-cong.md',
        templateLabel: 'Mẫu 18 – BC hoàn thành GS',
    },
];

const IMPL_PAYMENT: SubTaskDef[] = [
    {
        code: 'PAY_01', title: 'Xác định giá trị KLCV hoàn thành',
        responsible: 'CĐT, Nhà thầu, TVGS',
        templatePath: 'mau-28-bang-xac-dinh-gia-tri-klcv-hoan-thanh.md',
        templateLabel: 'Mẫu 28 – Bảng xác định KLCV',
    },
    {
        code: 'PAY_02', title: 'Đề nghị thanh toán vốn đầu tư',
        responsible: 'CĐT',
        templatePath: 'mau-25-giay-de-nghi-thanh-toan-von.md',
        templateLabel: 'Mẫu 25 – Giấy đề nghị thanh toán',
    },
    {
        code: 'PAY_03', title: 'Kiểm soát chi, giải ngân',
        responsible: 'KBNN',
    },
];

const IMPL_ACCEPTANCE: SubTaskDef[] = [
    {
        code: 'ACC_01', title: 'Nghiệm thu nội bộ nhà thầu',
        responsible: 'Nhà thầu thi công',
    },
    {
        code: 'ACC_02', title: 'Nghiệm thu CĐT',
        responsible: 'CĐT, TVGS, TVTK',
    },
    {
        code: 'ACC_03', title: 'Đề nghị kiểm tra công tác nghiệm thu',
        responsible: 'CĐT',
        templatePath: 'mau-19-ho-so-de-nghi-kiem-tra-nghiem-thu.md',
        templateLabel: 'Mẫu 19 – Hồ sơ đề nghị KT nghiệm thu',
    },
    {
        code: 'ACC_04', title: 'Kiểm tra công tác nghiệm thu',
        responsible: 'Sở XD (Đ123 NĐ 175)',
        legalBasis: 'Đ123 Luật XD; Đ24 NĐ 06; Đ123 NĐ 175',
        templatePath: 'mau-20-thong-bao-kq-kiem-tra-nghiem-thu.md',
        templateLabel: 'Mẫu 20 – TB KQ kiểm tra nghiệm thu',
    },
    {
        code: 'ACC_05', title: 'Nghiệm thu hoàn thành công trình',
        responsible: 'CĐT, các bên liên quan',
    },
];

// ============================================================
// PHASE 3: KẾT THÚC XÂY DỰNG
// ============================================================

const CLOSE_CONTRACT_SETTLEMENT: SubTaskDef[] = [
    {
        code: 'CSET_01', title: 'Quyết toán hợp đồng xây dựng',
        responsible: 'CĐT, Nhà thầu',
    },
    {
        code: 'CSET_02', title: 'Đối chiếu công nợ, xác nhận khối lượng',
        responsible: 'CĐT, Nhà thầu, TVGS',
    },
];

const CLOSE_CAPITAL_SETTLEMENT: SubTaskDef[] = [
    {
        code: 'CAPSET_01', title: 'Lập báo cáo quyết toán dự án hoàn thành',
        responsible: 'CĐT',
        templatePath: 'mau-32-bc-tong-hop-quyet-toan-da.md',
        templateLabel: 'Mẫu 32 – BC tổng hợp quyết toán DA',
    },
    {
        code: 'CAPSET_02', title: 'Thẩm tra quyết toán',
        responsible: 'Sở TC',
        templatePath: 'mau-33-41-bieu-mau-quyet-toan-da.md',
        templateLabel: 'Mẫu 33-41 – Biểu mẫu quyết toán',
    },
    {
        code: 'CAPSET_03', title: 'Phê duyệt quyết toán',
        responsible: 'Người QĐ đầu tư',
    },
];

const CLOSE_HANDOVER: SubTaskDef[] = [
    {
        code: 'HAND_01', title: 'Bàn giao công trình đưa vào sử dụng',
        responsible: 'CĐT, Đơn vị sử dụng',
    },
];

const CLOSE_WARRANTY: SubTaskDef[] = [
    {
        code: 'WARR_01', title: 'Bảo hành công trình xây dựng',
        responsible: 'Nhà thầu thi công',
        legalBasis: 'Luật XD 135/2025; Đ35 NĐ 06',
    },
    {
        code: 'WARR_02', title: 'Giám sát bảo hành',
        responsible: 'CĐT',
    },
];

const CLOSE_ARCHIVE: SubTaskDef[] = [
    {
        code: 'ARCH_01', title: 'Tập hợp hồ sơ hoàn công',
        responsible: 'CĐT',
    },
    {
        code: 'ARCH_02', title: 'Bàn giao hồ sơ lưu trữ',
        responsible: 'CĐT',
    },
];

// ============================================================
// PHASE 2 BỔ SUNG: VẬN HÀNH, GIÁM SÁT (Đ50 Luật XD, NĐ 175)
// ============================================================

const IMPL_TRIAL_RUN: SubTaskDef[] = [
    {
        code: 'TRIAL_01', title: 'Lập kế hoạch vận hành, chạy thử',
        responsible: 'CĐT, Nhà thầu',
        legalBasis: 'NĐ 175/2024',
    },
    {
        code: 'TRIAL_02', title: 'Vận hành chạy thử thiết bị, hệ thống',
        responsible: 'CĐT, Nhà thầu thi công',
        estimatedDays: 30,
    },
    {
        code: 'TRIAL_03', title: 'Đánh giá kết quả vận hành chạy thử',
        responsible: 'CĐT, TVGS',
    },
];

const IMPL_MONITORING: SubTaskDef[] = [
    {
        code: 'MON_01', title: 'Lập báo cáo giám sát, đánh giá dự án đầu tư',
        responsible: 'CĐT (Ban QLDA)',
        legalBasis: 'Đ71-73 Luật ĐTC 58/2024',
        templatePath: 'mau-bc-giam-sat-danh-gia-du-an.md',
        templateLabel: 'Mẫu BC giám sát, đánh giá DA',
    },
    {
        code: 'MON_02', title: 'Gửi báo cáo cho cơ quan có thẩm quyền',
        responsible: 'CĐT',
        legalBasis: 'Đ73 Luật ĐTC 58/2024',
    },
];

// ============================================================
// PHASE 3 BỔ SUNG: GIÁM SÁT SAU HOÀN THÀNH
// ============================================================

const CLOSE_MONITORING: SubTaskDef[] = [
    {
        code: 'CMON_01', title: 'Đánh giá kết quả, hiệu quả đầu tư',
        responsible: 'CĐT',
        legalBasis: 'Đ73 Luật ĐTC 58/2024',
    },
    {
        code: 'CMON_02', title: 'Lập báo cáo kết thúc dự án',
        responsible: 'CĐT',
        templatePath: 'mau-bc-ket-thuc-du-an.md',
        templateLabel: 'Mẫu BC kết thúc DA',
    },
];

// ============================================================
// REGISTRY MAP
// ============================================================

/**
 * Map step code → sub-tasks
 * Một số step code cần phân biệt theo nhóm dự án (A/B vs C)
 */
const REGISTRY: Record<string, SubTaskDef[]> = {
    // Phase 1
    PREP_PREFEASIBILITY,
    PREP_POLICY,
    PREP_SURVEY,
    PREP_PLANNING,
    PREP_DECISION,
    // Phase 2
    IMPL_SITE,
    IMPL_SURVEY,
    IMPL_PERMIT,
    IMPL_BIDDING,
    IMPL_CONSTRUCTION,
    IMPL_SUPERVISION,
    IMPL_PAYMENT,
    IMPL_TRIAL_RUN,
    IMPL_ACCEPTANCE,
    IMPL_MONITORING,
    // Phase 3
    CLOSE_CONTRACT_SETTLEMENT,
    CLOSE_CAPITAL_SETTLEMENT,
    CLOSE_HANDOVER,
    CLOSE_WARRANTY,
    CLOSE_ARCHIVE,
    CLOSE_MONITORING,
};

/**
 * Lấy danh sách sub-tasks cho một step code, tự điều chỉnh theo nhóm dự án
 */
export function getSubTasksForStep(
    stepCode: string,
    groupCode: ProjectGroup = ProjectGroup.C
): SubTaskDef[] {
    // Feasibility study: khác nhau A/B vs C
    if (stepCode === 'PREP_FEASIBILITY') {
        if (groupCode === ProjectGroup.C) {
            return PREP_FEASIBILITY_C;
        }
        // A, B, QN → BCNCKT
        const tasks = PREP_FEASIBILITY_AB.map(t => ({ ...t }));
        // Điều chỉnh thời gian theo nhóm
        if (groupCode === ProjectGroup.B) {
            const feas01 = tasks.find(t => t.code === 'FEAS_01');
            if (feas01) feas01.estimatedDays = 60;
            const feas05 = tasks.find(t => t.code === 'FEAS_05');
            if (feas05) feas05.estimatedDays = 10;
            const feas06 = tasks.find(t => t.code === 'FEAS_06');
            if (feas06) feas06.estimatedDays = 30;
        }
        return tasks;
    }

    // Design: khác nhau A/B vs C
    if (stepCode === 'IMPL_DESIGN') {
        if (groupCode === ProjectGroup.C) {
            return IMPL_DESIGN_C;
        }
        const tasks = IMPL_DESIGN_AB.map(t => ({ ...t }));
        if (groupCode === ProjectGroup.B) {
            const d01 = tasks.find(t => t.code === 'DESIGN_01');
            if (d01) d01.estimatedDays = 60;
        }
        return tasks;
    }

    // Decision: điều chỉnh thời gian A vs B/C
    if (stepCode === 'PREP_DECISION') {
        const tasks = PREP_DECISION.map(t => ({ ...t }));
        const dec02 = tasks.find(t => t.code === 'DEC_02');
        if (dec02) {
            dec02.estimatedDays = (groupCode === ProjectGroup.A || groupCode === ProjectGroup.QN) ? 7 : 5;
            dec02.templatePath = groupCode === ProjectGroup.C
                ? 'quyet-dinh-phe-duyet-du-an-bcktkt.md'
                : 'quyet-dinh-phe-duyet-du-an-bcnckt.md';
            dec02.templateLabel = groupCode === ProjectGroup.C
                ? 'QĐ phê duyệt DA (BCKTKT)'
                : 'QĐ phê duyệt DA (BCNCKT)';
        }
        return tasks;
    }

    return REGISTRY[stepCode] ?? [];
}

/**
 * Kiểm tra step code có sub-tasks được định nghĩa hay không
 */
export function hasSubTasks(stepCode: string): boolean {
    if (stepCode === 'PREP_FEASIBILITY' || stepCode === 'IMPL_DESIGN') return true;
    return stepCode in REGISTRY;
}
