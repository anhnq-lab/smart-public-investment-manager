/**
 * Utility: Map TimelineStep codes → Vietnamese labels
 * Sử dụng chung cho TaskList, TaskDetail, ProjectPlanTab
 */

export interface TimelineStepInfo {
    label: string;
    phase: string;
    phaseId: string;
}

/** All timeline step codes mapped to labels (NĐ 175/2024) */
export const TIMELINE_STEPS: Record<string, TimelineStepInfo> = {
    // Phase 1: Chuẩn bị dự án
    'PREP_ODA': { label: 'Lập đề xuất chương trình, dự án (ODA)', phase: 'Chuẩn bị dự án', phaseId: 'PHASE_1' },
    'PREP_PREFEASIBILITY': { label: 'Lập, thẩm định BC nghiên cứu tiền khả thi', phase: 'Chuẩn bị dự án', phaseId: 'PHASE_1' },
    'PREP_POLICY': { label: 'Quyết định chủ trương đầu tư', phase: 'Chuẩn bị dự án', phaseId: 'PHASE_1' },
    'PREP_SURVEY': { label: 'Khảo sát xây dựng phục vụ lập dự án', phase: 'Chuẩn bị dự án', phaseId: 'PHASE_1' },
    'PREP_PLANNING': { label: 'Lập, thẩm định QH xây dựng', phase: 'Chuẩn bị dự án', phaseId: 'PHASE_1' },
    'PREP_FEASIBILITY': { label: 'Lập, thẩm định BC NCKT / BCKTKT', phase: 'Chuẩn bị dự án', phaseId: 'PHASE_1' },
    'PREP_DECISION': { label: 'QĐ phê duyệt dự án đầu tư XD', phase: 'Chuẩn bị dự án', phaseId: 'PHASE_1' },

    // Phase 2: Thực hiện dự án
    'IMPL_SITE': { label: 'Chuẩn bị mặt bằng xây dựng', phase: 'Thực hiện dự án', phaseId: 'PHASE_2' },
    'IMPL_SURVEY': { label: 'Khảo sát xây dựng phục vụ thiết kế', phase: 'Thực hiện dự án', phaseId: 'PHASE_2' },
    'IMPL_DESIGN': { label: 'Thiết kế xây dựng & Dự toán', phase: 'Thực hiện dự án', phaseId: 'PHASE_2' },
    'IMPL_PERMIT': { label: 'Cấp Giấy phép xây dựng', phase: 'Thực hiện dự án', phaseId: 'PHASE_2' },
    'IMPL_BIDDING': { label: 'Lựa chọn nhà thầu & Ký HĐ', phase: 'Thực hiện dự án', phaseId: 'PHASE_2' },
    'IMPL_CONSTRUCTION': { label: 'Thi công xây dựng', phase: 'Thực hiện dự án', phaseId: 'PHASE_2' },
    'IMPL_SUPERVISION': { label: 'Giám sát thi công', phase: 'Thực hiện dự án', phaseId: 'PHASE_2' },
    'IMPL_PAYMENT': { label: 'Tạm ứng, thanh toán KLHT', phase: 'Thực hiện dự án', phaseId: 'PHASE_2' },
    'IMPL_ACCEPTANCE': { label: 'Nghiệm thu hoàn thành CT', phase: 'Thực hiện dự án', phaseId: 'PHASE_2' },

    // Phase 3: Kết thúc xây dựng
    'CLOSE_CONTRACT_SETTLEMENT': { label: 'Quyết toán hợp đồng XD', phase: 'Kết thúc XD', phaseId: 'PHASE_3' },
    'CLOSE_CAPITAL_SETTLEMENT': { label: 'Quyết toán vốn đầu tư', phase: 'Kết thúc XD', phaseId: 'PHASE_3' },
    'CLOSE_HANDOVER': { label: 'Bàn giao công trình', phase: 'Kết thúc XD', phaseId: 'PHASE_3' },
    'CLOSE_WARRANTY': { label: 'Bảo hành công trình', phase: 'Kết thúc XD', phaseId: 'PHASE_3' },
    'CLOSE_ARCHIVE': { label: 'Bàn giao hồ sơ lưu trữ', phase: 'Kết thúc XD', phaseId: 'PHASE_3' },
};

/** Get label for a TimelineStep code */
export function getTimelineStepLabel(code?: string): string {
    if (!code) return 'Chưa phân loại';
    return TIMELINE_STEPS[code]?.label || code;
}

/** Get phase name for a TimelineStep code */
export function getTimelineStepPhase(code?: string): string {
    if (!code) return '';
    return TIMELINE_STEPS[code]?.phase || '';
}

/** Get phase color based on phaseId */
export function getPhaseColor(code?: string): { bg: string; text: string; border: string } {
    if (!code) return { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' };
    const phaseId = TIMELINE_STEPS[code]?.phaseId;
    switch (phaseId) {
        case 'PHASE_1': return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
        case 'PHASE_2': return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
        case 'PHASE_3': return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
        default: return { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' };
    }
}

/** Get all TimelineStep codes as options for select dropdown */
export function getTimelineStepOptions(): { value: string; label: string; group: string }[] {
    return Object.entries(TIMELINE_STEPS).map(([code, info]) => ({
        value: code,
        label: info.label,
        group: info.phase,
    }));
}
