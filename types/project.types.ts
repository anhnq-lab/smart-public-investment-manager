// Project-related types — Luật Đầu tư công 58/2024/QH15

// 3.1. Bảng dữ liệu: Projects (Dự án Đầu tư)
export enum ProjectGroup {
    QN = 'QN', // Quan trọng quốc gia
    A = 'A',
    B = 'B',
    C = 'C'
}

export enum InvestmentType {
    Public = 1, // Đầu tư công
    StateNonPublic = 2, // Vốn nhà nước ngoài đầu tư công
    PPP = 3, // Đối tác công tư
    Other = 4
}

export enum ProjectStatus {
    Preparation = 1, // GĐ Chuẩn bị dự án
    Execution = 2,   // GĐ Thực hiện dự án
    Completion = 3   // GĐ Kết thúc xây dựng, đưa CT vào khai thác sử dụng
}

/** Giai đoạn dự án theo NĐ 175/2024 (3 giai đoạn) */
export enum ProjectStage {
    Preparation = 'Preparation',   // GĐ Chuẩn bị dự án
    Execution = 'Execution',       // GĐ Thực hiện dự án
    Completion = 'Completion'      // GĐ Kết thúc xây dựng
}

/**
 * Lĩnh vực đầu tư - theo Điều 9 Luật ĐTC 58/2024/QH15
 * Phân thành 5 nhóm lĩnh vực (Khoản 1-5 Điều 9) với ngưỡng khác nhau
 */
export enum ProjectSector {
    // === Khoản 2 Điều 9: Nhóm A ≥ 4.600 tỷ ===
    TransportMajor = 'TransportMajor',       // GT: cầu, cảng biển, sân bay, đường sắt, đường QG
    PowerIndustry = 'PowerIndustry',         // Công nghiệp điện
    OilGas = 'OilGas',                       // Khai thác dầu khí
    HeavyIndustry = 'HeavyIndustry',         // Xi măng, Luyện kim, Chế tạo máy
    ResidentialHousing = 'ResidentialHousing', // Xây dựng khu nhà ở

    // === Khoản 3 Điều 9: Nhóm A ≥ 3.000 tỷ ===
    Transport = 'Transport',                 // Giao thông (khác K2)
    WaterResources = 'WaterResources',       // Thủy lợi, cấp thoát nước
    Telecom = 'Telecom',                     // Bưu chính, viễn thông
    BuildingMaterials = 'BuildingMaterials', // Sản xuất vật liệu, Kỹ thuật điện

    // === Khoản 4 Điều 9: Nhóm A ≥ 2.000 tỷ ===
    Agriculture = 'Agriculture',             // Nông lâm ngư nghiệp
    UrbanInfra = 'UrbanInfra',               // Hạ tầng khu đô thị mới
    Industry = 'Industry',                   // Công nghiệp (khác K2, K3)

    // === Khoản 5 Điều 9: Nhóm A ≥ 1.600 tỷ ===
    Health = 'Health',                       // Y tế
    Education = 'Education',                 // Giáo dục
    Culture = 'Culture',                     // Văn hóa, thể thao
    Technology = 'Technology',               // Khoa học công nghệ
    Other = 'Other'                          // Các lĩnh vực khác
}

/**
 * Ngưỡng phân loại dự án - Luật Đầu tư công 58/2024/QH15
 * Căn cứ Điều 8, 9, 10, 11
 * Đơn vị: VND
 */
export const PROJECT_THRESHOLDS_2024 = {
    // Quan trọng quốc gia (Điều 8)
    NATIONAL_IMPORTANCE: 30_000_000_000_000, // 30.000 tỷ

    // Nhóm A - theo nhóm lĩnh vực (Điều 9)
    GROUP_A: {
        K2: 4_600_000_000_000,   // 4.600 tỷ - GT lớn, CN điện, Dầu khí, Luyện kim, Khu nhà ở
        K3: 3_000_000_000_000,   // 3.000 tỷ - GT khác, Thủy lợi, Viễn thông, Vật liệu XD
        K4: 2_000_000_000_000,   // 2.000 tỷ - Nông lâm, Khu đô thị, CN khác
        K5: 1_600_000_000_000,   // 1.600 tỷ - Y tế, GD, Văn hóa, KHCN, khác
    },

    // Nhóm B/C - ngưỡng dưới (Điều 10, 11): dưới mức này → Nhóm C
    GROUP_C: {
        K2: 240_000_000_000,     // 240 tỷ
        K3: 160_000_000_000,     // 160 tỷ
        K4: 120_000_000_000,     // 120 tỷ
        K5: 90_000_000_000,      // 90 tỷ
    },

    // Thời hạn bố trí vốn tối đa (năm)
    CAPITAL_DURATION: {
        GROUP_QN: 6,
        GROUP_A: 6,
        GROUP_B: 4,
        GROUP_C: 3
    }
} as const;

export interface Project {
    ProjectID: string;
    ProjectName: string;
    GroupCode: ProjectGroup;
    InvestmentType: InvestmentType;
    DecisionMakerID: number;
    TotalInvestment: number;
    CapitalSource: string;
    LocationCode: string;
    ApprovalDate: string;
    Status: ProjectStatus;
    IsEmergency: boolean;
    ImageUrl?: string;
    Progress?: number;
    PaymentProgress?: number;
    InvestorName?: string;
    MainContractorName?: string;
    ConstructionType?: string;
    ConstructionGrade?: string;
    Members?: string[];
    ProjectNumber?: string;
    Version?: string;
    Objective?: string;
    CompetentAuthority?: string;
    Duration?: string;
    ManagementForm?: string;
    DecisionNumber?: string;
    DecisionDate?: string;
    DecisionAuthority?: string;
    IsODA?: boolean;
    Coordinates?: { lat: number; lng: number; };
    SyncStatus?: {
        IsSynced: boolean;
        LastSyncDate?: string;
        NationalProjectCode?: string;
        SyncError?: string;
    };
    Stage?: ProjectStage;
    Sector?: ProjectSector;
    CalculatedGroup?: ProjectGroup;
    PhysicalProgress?: number;
    FinancialProgress?: number;
    RequiresBIM?: boolean;
    BIMStatus?: 'NotRequired' | 'Pending' | 'EIRApproved' | 'BEPApproved' | 'Active';
    CDEProjectCode?: string;
    ApplicableStandards?: string;
    FeasibilityContractor?: string;
    SurveyContractor?: string;
    ReviewContractor?: string;
    // TT24/2025/TT-BXD
    InvestmentScale?: string;
    PlanningApprovalNumber?: string;
    PlanningApprovalDate?: string;
    PCCCApprovalNumber?: string;
    PCCCApprovalDate?: string;
    PCCCApprovalAgency?: string;
    EnvApprovalNumber?: string;
    EnvApprovalDate?: string;
    EnvApprovalType?: string;
    AppraisalResultNumber?: string;
    AppraisalResultDate?: string;
    AppraisalAgency?: string;
    CostBreakdown?: CostBreakdown;
    DesignAppraisalNumber?: string;
    DesignAppraisalDate?: string;
    DesignApprovalNumber?: string;
    DesignApprovalDate?: string;
    DesignApprovalAuthority?: string;
    DesignContractor?: string;
    SupervisionContractor?: string;
    ConstructionPermitNumber?: string;
    ConstructionPermitDate?: string;
    ConstructionPermitAgency?: string;
    ActualStartDateConstruction?: string;
    InsuranceContract?: string;
    InsuranceValue?: number;
    AcceptanceResult?: string;
    AcceptanceDate?: string;
    HandoverDate?: string;
    TT24CompletionPct?: number;
    StartDate?: string;
    ExpectedEndDate?: string;
    ActualEndDate?: string;
}

/** Chi tiết tổng mức đầu tư — TT24 A.II.7.4 */
export interface CostBreakdown {
    construction?: number;
    equipment?: number;
    management?: number;
    consultancy?: number;
    other?: number;
    contingency?: number;
}

/** Quyết định phê duyệt chủ trương đầu tư */
export interface InvestmentPolicyDecision {
    DecisionNumber: string;
    DecisionDate: string;
    Authority: string;
    Objectives: string;
    PreliminaryInvestment: number;
    CapitalSources: string[];
    Duration: string;
    Location: string;
    DocumentPath?: string;
}

/** Báo cáo nghiên cứu khả thi (BCNCKT / F/S) */
export interface FeasibilityStudy {
    ReportID: string;
    ProjectID: string;
    ApprovalNumber: string;
    ApprovalDate: string;
    ApprovalAuthority: string;
    TotalInvestment: number;
    DesignPhases: 1 | 2 | 3;
    ConstructionScale: string;
    MainTechnology: string;
    EnvironmentalApproval?: string;
    DocumentPath?: string;
}

/** Lịch sử chuyển giai đoạn */
export interface StageTransition {
    stage: ProjectStage;
    startDate: string;
    endDate?: string;
    decisionNumber?: string;
    decisionDate?: string;
}

/** Interface mở rộng đầy đủ cho Project */
export interface ProjectExtended extends Project {
    Stage: ProjectStage;
    StageHistory: StageTransition[];
    InvestmentPolicy?: InvestmentPolicyDecision;
    FeasibilityStudy?: FeasibilityStudy;
    Sector: ProjectSector;
    CalculatedGroup?: ProjectGroup;
    PhysicalProgress: number;
    FinancialProgress: number;
    RequiresBIM: boolean;
    BIMStatus: 'NotRequired' | 'Pending' | 'EIRApproved' | 'BEPApproved' | 'Active';
    CDEProjectCode?: string;
}

export interface ConstructionWork {
    WorkID: string;
    ProjectID: string;
    WorkName: string;
    Grade: number;
    Type: string;
    DesignLevel: number;
    Address: string;
}
