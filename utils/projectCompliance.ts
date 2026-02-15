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

/**
 * Xác định nhóm lĩnh vực (Khoản) theo Điều 9 Luật ĐTC 58/2024
 * @returns 'K2' | 'K3' | 'K4' | 'K5'
 */
export function getSectorTier(sector: ProjectSector): 'K2' | 'K3' | 'K4' | 'K5' {
    switch (sector) {
        // Khoản 2: GT lớn, CN điện, Dầu khí, Luyện kim, Khu nhà ở
        case ProjectSector.TransportMajor:
        case ProjectSector.PowerIndustry:
        case ProjectSector.OilGas:
        case ProjectSector.HeavyIndustry:
        case ProjectSector.ResidentialHousing:
            return 'K2';

        // Khoản 3: GT khác, Thủy lợi, Viễn thông, Vật liệu XD
        case ProjectSector.Transport:
        case ProjectSector.WaterResources:
        case ProjectSector.Telecom:
        case ProjectSector.BuildingMaterials:
            return 'K3';

        // Khoản 4: Nông lâm, Khu đô thị, CN khác
        case ProjectSector.Agriculture:
        case ProjectSector.UrbanInfra:
        case ProjectSector.Industry:
            return 'K4';

        // Khoản 5: Y tế, GD, Văn hóa, KHCN, khác
        case ProjectSector.Health:
        case ProjectSector.Education:
        case ProjectSector.Culture:
        case ProjectSector.Technology:
        case ProjectSector.Other:
        default:
            return 'K5';
    }
}

/**
 * Tự động phân loại nhóm dự án theo Luật ĐTC 58/2024/QH15
 * Căn cứ Điều 8 (QN), 9 (A), 10 (B), 11 (C)
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
    // Quan trọng quốc gia - Điều 8
    if (isNationalImportance ||
        totalInvestment >= PROJECT_THRESHOLDS_2024.NATIONAL_IMPORTANCE) {
        return ProjectGroup.QN;
    }

    const tier = getSectorTier(sector);
    const thresholdA = PROJECT_THRESHOLDS_2024.GROUP_A[tier];
    const thresholdC = PROJECT_THRESHOLDS_2024.GROUP_C[tier];

    if (totalInvestment >= thresholdA) return ProjectGroup.A;
    if (totalInvestment >= thresholdC) return ProjectGroup.B;
    return ProjectGroup.C;
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
        [ProjectGroup.B]: 'Bộ trưởng / Giám đốc Học viện CTQG HCM',
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
        [ProjectStage.Preparation]: 'Chuẩn bị dự án',
        [ProjectStage.Execution]: 'Thực hiện dự án',
        [ProjectStage.Completion]: 'Kết thúc xây dựng'
    };
    return labels[stage];
}

/** Tên lĩnh vực tiếng Việt */
export function getSectorLabel(sector: ProjectSector): string {
    const labels: Record<ProjectSector, string> = {
        // K2
        [ProjectSector.TransportMajor]: 'Giao thông (trọng điểm)',
        [ProjectSector.PowerIndustry]: 'Công nghiệp điện',
        [ProjectSector.OilGas]: 'Khai thác dầu khí',
        [ProjectSector.HeavyIndustry]: 'Luyện kim, Xi măng, Chế tạo máy',
        [ProjectSector.ResidentialHousing]: 'Xây dựng khu nhà ở',
        // K3
        [ProjectSector.Transport]: 'Giao thông',
        [ProjectSector.WaterResources]: 'Thủy lợi, cấp thoát nước',
        [ProjectSector.Telecom]: 'Bưu chính, viễn thông',
        [ProjectSector.BuildingMaterials]: 'Vật liệu xây dựng',
        // K4
        [ProjectSector.Agriculture]: 'Nông lâm ngư nghiệp',
        [ProjectSector.UrbanInfra]: 'Hạ tầng khu đô thị',
        [ProjectSector.Industry]: 'Công nghiệp',
        // K5
        [ProjectSector.Health]: 'Y tế',
        [ProjectSector.Education]: 'Giáo dục',
        [ProjectSector.Culture]: 'Văn hóa, thể thao',
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
        ProjectStage.Preparation,
        ProjectStage.Execution,
        ProjectStage.Completion
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
