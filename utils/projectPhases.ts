import { ProjectGroup } from '@/types';

/**
 * Sinh kế hoạch thực hiện dự án theo nhóm
 * Căn cứ: NĐ 175/2024, Luật ĐTC 58/2024, Luật XD 135/2025
 * - Nhóm A/QN: BC NCTKT → BC NCKT → TK triển khai (CĐT tự thẩm định)
 * - Nhóm B: Đề xuất chủ trương ĐT → BC NCKT → TK triển khai (CĐT tự thẩm định)
 * - Nhóm C: Đề xuất chủ trương ĐT → BC KT-KT (≤20 tỷ, NĐ 175 K3Đ5) → 1 bước TK
 */
export interface PhaseItem {
    id: string;
    title: string;
    code: string;
}

export interface ProjectPhase {
    id: string;
    title: string;
    description: string;
    items: PhaseItem[];
}

export const getProjectPhases = (groupCode: ProjectGroup = ProjectGroup.C, isODA: boolean = false): ProjectPhase[] => {
    // --- PHASE 1: Chuẩn bị dự án ---
    const phase1Items: PhaseItem[] = [];
    let stepNum = 1;

    // 1.1 ODA - chỉ khi dự án sử dụng vốn ODA
    if (isODA) {
        phase1Items.push({ id: `1.${stepNum}`, title: 'Lập đề xuất chương trình, dự án (ODA)', code: 'PREP_ODA' });
        stepNum++;
    }

    // 1.2 Chủ trương đầu tư
    if (groupCode === ProjectGroup.A || groupCode === ProjectGroup.QN) {
        phase1Items.push({ id: `1.${stepNum}`, title: 'Lập, thẩm định Báo cáo nghiên cứu tiền khả thi (NCTKT)', code: 'PREP_PREFEASIBILITY' });
        stepNum++;
        phase1Items.push({ id: `1.${stepNum}`, title: 'Quyết định chủ trương đầu tư', code: 'PREP_POLICY' });
    } else {
        phase1Items.push({ id: `1.${stepNum}`, title: 'Lập Báo cáo đề xuất chủ trương đầu tư', code: 'PREP_POLICY' });
    }
    stepNum++;

    // Khảo sát XD
    phase1Items.push({ id: `1.${stepNum}`, title: 'Khảo sát xây dựng phục vụ lập dự án', code: 'PREP_SURVEY' });
    stepNum++;

    // Quy hoạch XD
    phase1Items.push({ id: `1.${stepNum}`, title: 'Lập, thẩm định, phê duyệt Quy hoạch xây dựng', code: 'PREP_PLANNING' });
    stepNum++;

    // BC NCKT hoặc BC KT-KT
    if (groupCode === ProjectGroup.C) {
        phase1Items.push({ id: `1.${stepNum}`, title: 'Lập, thẩm định Báo cáo kinh tế - kỹ thuật (BCKTKT)', code: 'PREP_FEASIBILITY' });
    } else {
        phase1Items.push({ id: `1.${stepNum}`, title: 'Lập, thẩm định Báo cáo nghiên cứu khả thi (BCNCKT)', code: 'PREP_FEASIBILITY' });
    }
    stepNum++;

    // QĐ đầu tư
    phase1Items.push({ id: `1.${stepNum}`, title: 'Quyết định phê duyệt dự án đầu tư xây dựng', code: 'PREP_DECISION' });

    // --- PHASE 2: Thực hiện dự án ---
    const phase2Items: PhaseItem[] = [
        { id: '2.1', title: 'Chuẩn bị mặt bằng xây dựng, rà phá bom mìn', code: 'IMPL_SITE' },
        { id: '2.2', title: 'Khảo sát xây dựng phục vụ thiết kế', code: 'IMPL_SURVEY' },
    ];

    // Thiết kế theo nhóm
    if (groupCode === ProjectGroup.C) {
        phase2Items.push({ id: '2.3', title: 'Thiết kế bản vẽ thi công & Dự toán', code: 'IMPL_DESIGN' });
    } else {
        phase2Items.push({ id: '2.3', title: 'Lập, thẩm định, phê duyệt Thiết kế xây dựng & Dự toán', code: 'IMPL_DESIGN' });
    }

    phase2Items.push(
        { id: '2.4', title: 'Cấp Giấy phép xây dựng', code: 'IMPL_PERMIT' },
        { id: '2.5', title: 'Lựa chọn nhà thầu và ký kết hợp đồng', code: 'IMPL_BIDDING' },
        { id: '2.6', title: 'Thi công xây dựng công trình', code: 'IMPL_CONSTRUCTION' },
        { id: '2.7', title: 'Giám sát thi công xây dựng', code: 'IMPL_SUPERVISION' },
        { id: '2.8', title: 'Tạm ứng, thanh toán khối lượng hoàn thành', code: 'IMPL_PAYMENT' },
        { id: '2.9', title: 'Vận hành, chạy thử', code: 'IMPL_TRIAL_RUN' },
        { id: '2.10', title: 'Nghiệm thu hoàn thành công trình', code: 'IMPL_ACCEPTANCE' },
        { id: '2.11', title: 'Giám sát, đánh giá dự án đầu tư', code: 'IMPL_MONITORING' }
    );

    // --- PHASE 3: Kết thúc xây dựng ---
    const phase3Items: PhaseItem[] = [
        { id: '3.1', title: 'Quyết toán hợp đồng xây dựng', code: 'CLOSE_CONTRACT_SETTLEMENT' },
        { id: '3.2', title: 'Quyết toán vốn đầu tư dự án hoàn thành', code: 'CLOSE_CAPITAL_SETTLEMENT' },
        { id: '3.3', title: 'Bàn giao công trình đưa vào sử dụng', code: 'CLOSE_HANDOVER' },
        { id: '3.4', title: 'Bảo hành công trình xây dựng', code: 'CLOSE_WARRANTY' },
        { id: '3.5', title: 'Bàn giao hồ sơ lưu trữ', code: 'CLOSE_ARCHIVE' },
        { id: '3.6', title: 'Giám sát, đánh giá sau hoàn thành', code: 'CLOSE_MONITORING' }
    ];

    return [
        {
            id: 'PHASE_1',
            title: 'I. GIAI ĐOẠN CHUẨN BỊ DỰ ÁN',
            description: groupCode === ProjectGroup.C
                ? 'Lập đề xuất chủ trương, thẩm định BC KT-KT'
                : groupCode === ProjectGroup.A || groupCode === ProjectGroup.QN
                    ? 'Lập BC NCTKT, thẩm định, phê duyệt chủ trương và BC NCKT'
                    : 'Lập đề xuất chủ trương, thẩm định BC NCKT',
            items: phase1Items
        },
        {
            id: 'PHASE_2',
            title: 'II. GIAI ĐOẠN THỰC HIỆN DỰ ÁN',
            description: 'Triển khai chi tiết, thi công và giám sát',
            items: phase2Items
        },
        {
            id: 'PHASE_3',
            title: 'III. GIAI ĐOẠN KẾT THÚC XÂY DỰNG',
            description: 'Bàn giao, quyết toán và bảo hành',
            items: phase3Items
        }
    ];
};

/** Label nhóm dự án */
export const getGroupLabel = (g?: ProjectGroup) => {
    switch (g) {
        case ProjectGroup.QN: return 'Quan trọng QG';
        case ProjectGroup.A: return 'Nhóm A';
        case ProjectGroup.B: return 'Nhóm B';
        case ProjectGroup.C: return 'Nhóm C';
        default: return 'Nhóm C';
    }
};
