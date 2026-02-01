/**
 * Project Compliance Utilities
 * Căn cứ pháp lý: Luật Đầu tư công 58/2024/QH15, NĐ 175/2024/NĐ-CP
 */

import {
    ProjectGroup,
    ProjectSector,
    PROJECT_THRESHOLDS_2024,
    ProjectStage
} from '../types';

// ═══════════════════════════════════════════════════════════════
// PHÂN LOẠI DỰ ÁN
// ═══════════════════════════════════════════════════════════════

/**
 * Tự động phân loại nhóm dự án theo Luật ĐTC 58/2024
 * @param totalInvestment - Tổng mức đầu tư (VND)
 * @param sector - Lĩnh vực đầu tư
 * @param isNationalImportance - Có phải dự án quan trọng quốc gia không
 * @returns ProjectGroup (QN, A, B, C)
 */
export function classifyProject(
    totalInvestment: number,
    sector: ProjectSector,
    isNationalImportance: boolean = false
): ProjectGroup {
    // Quan trọng quốc gia - theo flag hoặc ngưỡng 30.000 tỷ
    if (isNationalImportance ||
        totalInvestment >= PROJECT_THRESHOLDS_2024.NATIONAL_IMPORTANCE) {
        return ProjectGroup.QN;
    }

    const thresholds = PROJECT_THRESHOLDS_2024;

    switch (sector) {
        case ProjectSector.Transport:
        case ProjectSector.Industry:
            if (totalInvestment >= thresholds.GROUP_A.TRANSPORT_INDUSTRY)
                return ProjectGroup.A;
            if (totalInvestment >= thresholds.GROUP_C.TRANSPORT_INDUSTRY)
                return ProjectGroup.B;
            return ProjectGroup.C;

        case ProjectSector.WaterResources:
            if (totalInvestment >= thresholds.GROUP_A.WATER_RESOURCES)
                return ProjectGroup.A;
            if (totalInvestment >= thresholds.GROUP_C.WATER_RESOURCES)
                return ProjectGroup.B;
            return ProjectGroup.C;

        case ProjectSector.Agriculture:
            if (totalInvestment >= thresholds.GROUP_A.AGRICULTURE)
                return ProjectGroup.A;
            if (totalInvestment >= thresholds.GROUP_C.AGRICULTURE)
                return ProjectGroup.B;
            return ProjectGroup.C;

        case ProjectSector.Health:
        case ProjectSector.Education:
        case ProjectSector.Technology:
            if (totalInvestment >= thresholds.GROUP_A.SOCIAL)
                return ProjectGroup.A;
            if (totalInvestment >= thresholds.GROUP_C.SOCIAL)
                return ProjectGroup.B;
            return ProjectGroup.C;

        default:
            // Sector.Other - áp dụng ngưỡng thấp nhất (SOCIAL)
            if (totalInvestment >= thresholds.GROUP_A.SOCIAL)
                return ProjectGroup.A;
            if (totalInvestment >= thresholds.GROUP_C.SOCIAL)
                return ProjectGroup.B;
            return ProjectGroup.C;
    }
}

// ═══════════════════════════════════════════════════════════════
// CƠ QUAN PHÊ DUYỆT
// ═══════════════════════════════════════════════════════════════

/**
 * Xác định cơ quan có thẩm quyền phê duyệt theo nhóm dự án
 */
export function getApprovalAuthority(group: ProjectGroup): string {
    const authorities: Record<ProjectGroup, string> = {
        [ProjectGroup.QN]: 'Quốc hội',
        [ProjectGroup.A]: 'Thủ tướng Chính phủ',
        [ProjectGroup.B]: 'Bộ trưởng / Chủ tịch UBND tỉnh',
        [ProjectGroup.C]: 'UBND cấp huyện / Chủ đầu tư'
    };
    return authorities[group];
}

/**
 * Thời hạn bố trí vốn tối đa (năm)
 */
export function getMaxCapitalDuration(group: ProjectGroup): number {
    const durations = PROJECT_THRESHOLDS_2024.CAPITAL_DURATION;
    switch (group) {
        case ProjectGroup.QN:
            return durations.GROUP_QN;
        case ProjectGroup.A:
            return durations.GROUP_A;
        case ProjectGroup.B:
            return durations.GROUP_B;
        case ProjectGroup.C:
            return durations.GROUP_C;
        default:
            return durations.GROUP_C;
    }
}

// ═══════════════════════════════════════════════════════════════
// BIM REQUIREMENTS - NĐ 175/2024
// ═══════════════════════════════════════════════════════════════

/**
 * Kiểm tra BIM bắt buộc theo NĐ 175/2024
 * - Dự án từ Nhóm B trở lên: bắt buộc
 * - Công trình mới từ Cấp II trở lên: bắt buộc
 */
export function requiresBIM(
    group: ProjectGroup,
    constructionGrade?: string
): boolean {
    // Nhóm QN, A, B: bắt buộc BIM
    if (group === ProjectGroup.QN ||
        group === ProjectGroup.A ||
        group === ProjectGroup.B) {
        return true;
    }
    // Công trình cấp Đặc biệt, I, II: bắt buộc BIM
    if (constructionGrade && ['Đặc biệt', 'I', 'II'].includes(constructionGrade)) {
        return true;
    }
    return false;
}

/**
 * Số bước thiết kế theo cấp công trình
 */
export function getDesignPhases(constructionGrade: string): 1 | 2 | 3 {
    if (['Đặc biệt', 'I'].includes(constructionGrade)) return 3;
    if (constructionGrade === 'II') return 2;
    return 1;
}

// ═══════════════════════════════════════════════════════════════
// LIFECYCLE HELPERS
// ═══════════════════════════════════════════════════════════════

/** Tên giai đoạn tiếng Việt */
export function getStageLabel(stage: ProjectStage): string {
    const labels: Record<ProjectStage, string> = {
        [ProjectStage.InvestmentPolicy]: 'Chủ trương đầu tư',
        [ProjectStage.Preparation]: 'Chuẩn bị đầu tư',
        [ProjectStage.Execution]: 'Thực hiện đầu tư',
        [ProjectStage.Completion]: 'Kết thúc đầu tư',
        [ProjectStage.Operation]: 'Vận hành'
    };
    return labels[stage];
}

/** Tên lĩnh vực tiếng Việt */
export function getSectorLabel(sector: ProjectSector): string {
    const labels: Record<ProjectSector, string> = {
        [ProjectSector.Transport]: 'Giao thông',
        [ProjectSector.Industry]: 'Công nghiệp',
        [ProjectSector.Agriculture]: 'Nông lâm ngư nghiệp',
        [ProjectSector.WaterResources]: 'Thủy lợi, cấp thoát nước',
        [ProjectSector.Health]: 'Y tế',
        [ProjectSector.Education]: 'Giáo dục',
        [ProjectSector.Technology]: 'Khoa học công nghệ',
        [ProjectSector.Other]: 'Khác'
    };
    return labels[sector];
}

/** Tên nhóm dự án tiếng Việt */
export function getGroupLabel(group: ProjectGroup): string {
    const labels: Record<ProjectGroup, string> = {
        [ProjectGroup.QN]: 'Quan trọng quốc gia',
        [ProjectGroup.A]: 'Nhóm A',
        [ProjectGroup.B]: 'Nhóm B',
        [ProjectGroup.C]: 'Nhóm C'
    };
    return labels[group];
}

// ═══════════════════════════════════════════════════════════════
// UI STYLING HELPERS
// ═══════════════════════════════════════════════════════════════

/** Gradient styles cho badges theo nhóm dự án */
export function getGroupGradient(group: ProjectGroup): string {
    const gradients: Record<ProjectGroup, string> = {
        [ProjectGroup.QN]: 'bg-gradient-to-r from-red-600 to-rose-800 text-white',
        [ProjectGroup.A]: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white',
        [ProjectGroup.B]: 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white',
        [ProjectGroup.C]: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
    };
    return gradients[group];
}

/** Stage index cho stepper component */
export function getStageIndex(stage: ProjectStage): number {
    const stages = [
        ProjectStage.InvestmentPolicy,
        ProjectStage.Preparation,
        ProjectStage.Execution,
        ProjectStage.Completion,
        ProjectStage.Operation
    ];
    return stages.indexOf(stage);
}

/** BIM status color */
export function getBIMStatusColor(status: string): string {
    const colors: Record<string, string> = {
        'NotRequired': 'text-gray-400',
        'Pending': 'text-yellow-500',
        'EIRApproved': 'text-blue-500',
        'BEPApproved': 'text-indigo-500',
        'Active': 'text-green-500'
    };
    return colors[status] || 'text-gray-400';
}
