
// Căn cứ theo tài liệu: Cấu trúc cơ sở dữ liệu chiến lược

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

// ═══════════════════════════════════════════════════════════════
// PHÂN LOẠI DỰ ÁN - Luật Đầu tư công 58/2024/QH15
// ═══════════════════════════════════════════════════════════════

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
    ProjectID: string; // CHAR(13) - Mã số định danh duy nhất
    ProjectName: string; // NVARCHAR(500)
    GroupCode: ProjectGroup; // CHAR(2)
    InvestmentType: InvestmentType; // TINYINT
    DecisionMakerID: number; // INT - Foreign Key (Simulated)
    TotalInvestment: number; // DECIMAL(18,2)
    CapitalSource: string; // NVARCHAR(255)
    LocationCode: string; // VARCHAR(10)
    ApprovalDate: string; // DATE (ISO string)
    Status: ProjectStatus; // TINYINT
    IsEmergency: boolean; // BIT
    // Added fields for UI
    ImageUrl?: string;
    Progress?: number;
    PaymentProgress?: number;
    InvestorName?: string;
    MainContractorName?: string; // Tên nhà thầu chính
    ConstructionType?: string; // Loại công trình (Dân dụng, Giao thông...)
    ConstructionGrade?: string; // Cấp công trình (I, II, III...)
    Members?: string[]; // Array of EmployeeIDs

    // Detailed Fields (New)
    ProjectNumber?: string; // Số dự án (PR...)
    Version?: string; // Phiên bản thay đổi
    Objective?: string; // Mục tiêu đầu tư
    CompetentAuthority?: string; // Người có thẩm quyền
    Duration?: string; // Thời gian thực hiện
    ManagementForm?: string; // Hình thức quản lý dự án
    DecisionNumber?: string; // Số quyết định phê duyệt
    DecisionDate?: string; // Ngày phê duyệt
    DecisionAuthority?: string; // Cơ quan ban hành quyết định
    IsODA?: boolean; // Có sử dụng vốn ODA
    Coordinates?: {
        lat: number;
        lng: number;
    }; // Tọa độ địa lý
    SyncStatus?: {
        IsSynced: boolean;
        LastSyncDate?: string;
        NationalProjectCode?: string;
        SyncError?: string;
    };

    // Extended fields for lifecycle tracking (Phase 2 enhancement)
    Stage?: ProjectStage;
    Sector?: ProjectSector;
    CalculatedGroup?: ProjectGroup;
    PhysicalProgress?: number;   // Tiến độ khối lượng (%)
    FinancialProgress?: number;  // Tiến độ giải ngân (%)
    RequiresBIM?: boolean;
    BIMStatus?: 'NotRequired' | 'Pending' | 'EIRApproved' | 'BEPApproved' | 'Active';
    CDEProjectCode?: string;

    // Trường bổ sung theo mẫu BCNCKT (Phụ lục I - Mẫu 05)
    ApplicableStandards?: string;    // Tiêu chuẩn, quy chuẩn áp dụng
    FeasibilityContractor?: string;  // Nhà thầu lập BCNCKT
    SurveyContractor?: string;       // Nhà thầu khảo sát xây dựng
    ReviewContractor?: string;       // Nhà thầu thẩm tra

    // ═══════════════════════════════════════════════════════════
    // TT24/2025/TT-BXD Phụ lục III — Dữ liệu CSDL Quốc gia
    // ═══════════════════════════════════════════════════════════

    // A.I: Quy mô đầu tư
    InvestmentScale?: string;            // Diện tích, công suất, số tầng...

    // A.II.2: Quy hoạch liên quan
    PlanningApprovalNumber?: string;     // Số QĐ phê duyệt QH
    PlanningApprovalDate?: string;       // Ngày phê duyệt QH

    // A.II.3.1: PCCC
    PCCCApprovalNumber?: string;         // Số văn bản thủ tục PCCC
    PCCCApprovalDate?: string;           // Ngày cấp
    PCCCApprovalAgency?: string;         // CQ cấp

    // A.II.3.2: Môi trường
    EnvApprovalNumber?: string;          // Số văn bản MT
    EnvApprovalDate?: string;            // Ngày cấp
    EnvApprovalType?: string;            // 'ĐTM' | 'KH_BVMT'

    // A.II.4: Thẩm định BCNCKT
    AppraisalResultNumber?: string;      // Số TB kết quả thẩm định
    AppraisalResultDate?: string;        // Ngày thẩm định
    AppraisalAgency?: string;            // CQ thẩm định

    // A.II.7.4: Chi tiết tổng mức đầu tư
    CostBreakdown?: CostBreakdown;       // Chi tiết chi phí

    // B.II: Thiết kế triển khai sau TKCS
    DesignAppraisalNumber?: string;      // Số TB thẩm định TK
    DesignAppraisalDate?: string;        // Ngày thẩm định TK
    DesignApprovalNumber?: string;       // Số QĐ phê duyệt TK
    DesignApprovalDate?: string;         // Ngày phê duyệt TK
    DesignApprovalAuthority?: string;    // CQ phê duyệt TK
    DesignContractor?: string;           // NT thiết kế
    SupervisionContractor?: string;      // NT tư vấn giám sát

    // C: Giấy phép xây dựng
    ConstructionPermitNumber?: string;   // Số GPXD
    ConstructionPermitDate?: string;     // Ngày cấp GPXD
    ConstructionPermitAgency?: string;   // CQ cấp GPXD

    // D: Khởi công + Bảo hiểm
    ActualStartDateConstruction?: string;// Ngày khởi công thực tế
    InsuranceContract?: string;          // Số HĐ bảo hiểm CT
    InsuranceValue?: number;             // Giá trị bảo hiểm

    // E: Nghiệm thu + Bàn giao
    AcceptanceResult?: string;           // Kết quả nghiệm thu
    AcceptanceDate?: string;             // Ngày nghiệm thu
    HandoverDate?: string;               // Ngày bàn giao đưa vào sử dụng

    // Tracking
    TT24CompletionPct?: number;          // Tỷ lệ hoàn thành dữ liệu TT24 (0-100)
    StartDate?: string;                  // Ngày bắt đầu
    ExpectedEndDate?: string;            // Ngày kết thúc dự kiến
    ActualEndDate?: string;              // Ngày kết thúc thực tế
}

/** Chi tiết tổng mức đầu tư — TT24 A.II.7.4 */
export interface CostBreakdown {
    construction?: number;   // Chi phí xây dựng
    equipment?: number;      // Chi phí thiết bị
    management?: number;     // Chi phí QLDA
    consultancy?: number;    // Chi phí TVXD
    other?: number;          // Chi phí khác
    contingency?: number;    // Dự phòng
}

// ═══════════════════════════════════════════════════════════════
// INTERFACES MỚI - Theo NĐ 175/2024 và Luật ĐTC 58/2024
// ═══════════════════════════════════════════════════════════════

/** Quyết định phê duyệt chủ trương đầu tư */
export interface InvestmentPolicyDecision {
    DecisionNumber: string;           // Số quyết định
    DecisionDate: string;             // Ngày ban hành
    Authority: string;                // Quốc hội / TTg / UBND
    Objectives: string;               // Mục tiêu đầu tư
    PreliminaryInvestment: number;    // Sơ bộ tổng mức đầu tư
    CapitalSources: string[];         // Nguồn vốn
    Duration: string;                 // Thời gian thực hiện
    Location: string;                 // Địa điểm
    DocumentPath?: string;            // Đường dẫn file scan
}

/** Báo cáo nghiên cứu khả thi (BCNCKT / F/S) */
export interface FeasibilityStudy {
    ReportID: string;
    ProjectID: string;
    ApprovalNumber: string;           // Số QĐ phê duyệt
    ApprovalDate: string;             // Ngày phê duyệt
    ApprovalAuthority: string;        // Cơ quan phê duyệt
    TotalInvestment: number;          // Tổng mức đầu tư được duyệt
    DesignPhases: 1 | 2 | 3;          // Số bước thiết kế
    ConstructionScale: string;        // Quy mô xây dựng
    MainTechnology: string;           // Giải pháp công nghệ chính
    EnvironmentalApproval?: string;   // Số QĐ phê duyệt ĐTM
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

/** Interface mở rộng đầy đủ cho Project (sử dụng cho detail views) */
export interface ProjectExtended extends Project {
    // Lifecycle
    Stage: ProjectStage;
    StageHistory: StageTransition[];

    // Legal Documents
    InvestmentPolicy?: InvestmentPolicyDecision;
    FeasibilityStudy?: FeasibilityStudy;

    // Classification
    Sector: ProjectSector;
    CalculatedGroup?: ProjectGroup;

    // Progress
    PhysicalProgress: number;
    FinancialProgress: number;

    // BIM (NĐ 175)
    RequiresBIM: boolean;
    BIMStatus: 'NotRequired' | 'Pending' | 'EIRApproved' | 'BEPApproved' | 'Active';
    CDEProjectCode?: string;
}
export interface ConstructionWork {
    WorkID: string; // CHAR(13)
    ProjectID: string; // CHAR(13)
    WorkName: string; // NVARCHAR(255)
    Grade: number; // TINYINT (0-4: Đặc biệt, I, II, III, IV)
    Type: string; // NVARCHAR(50) (Dân dụng, Công nghiệp...)
    DesignLevel: number; // TINYINT (1-3 bước)
    Address: string; // NVARCHAR(500)
}

// 4.1. Bảng dữ liệu: Contractors (Tổ chức Nhà thầu)
export interface Contractor {
    ContractorID: string; // VARCHAR(20) - Mã số thuế/DN
    CapCertCode: string; // CHAR(8) - Mã số chứng chỉ năng lực
    FullName: string; // NVARCHAR(255)
    IsForeign: boolean; // BIT
    OpLicenseNo?: string; // NVARCHAR(50) - Cho nhà thầu nước ngoài
    Address: string; // NVARCHAR(255)
    ContactInfo: string; // NVARCHAR(255)
}

// 5.1. Bảng dữ liệu: BiddingPackages (Gói thầu)
export enum PackageStatus {
    Planning = 'Planning',     // Trong kế hoạch
    Bidding = 'Bidding',       // Đang mời thầu
    Evaluating = 'Evaluating', // Đang xét thầu
    Awarded = 'Awarded',       // Đã có KQLCNT
    Cancelled = 'Cancelled',   // Hủy thầu
    Posted = 'Posted'          // Đã đăng tải TBMT
}

/**
 * Hạn mức áp dụng hình thức lựa chọn nhà thầu theo NĐ 214/2025/NĐ-CP
 * Hiệu lực: 04/08/2025, thay thế NĐ 24/2024 và NĐ 17/2025
 */
export const BIDDING_THRESHOLDS = {
    /** Gói thầu ≤50 triệu: Không cần kế hoạch bố trí vốn, chỉ cần hóa đơn chứng từ */
    DIRECT_PURCHASE: 50_000_000,

    /** Chỉ định thầu rút gọn - Dự toán mua sắm không hình thành dự án */
    CDT_SIMPLIFIED_ESTIMATE: 500_000_000,
    /** Chỉ định thầu rút gọn - Gói thầu dịch vụ tư vấn */
    CDT_SIMPLIFIED_CONSULTANCY: 800_000_000,
    /** Chỉ định thầu rút gọn - Xây lắp, hàng hóa, phi tư vấn, hỗn hợp */
    CDT_SIMPLIFIED_CONSTRUCTION: 2_000_000_000,

    /** Chào giá trực tuyến rút gọn - Dự toán mua sắm */
    ONLINE_QUOTATION_ESTIMATE: 2_000_000_000,
    /** Chào giá trực tuyến rút gọn - Dự án */
    ONLINE_QUOTATION_PROJECT: 5_000_000_000,

    /** Chào hàng cạnh tranh (tăng từ 5 tỷ lên 10 tỷ) */
    COMPETITIVE_SHOPPING: 10_000_000_000,
} as const;

/** Phân loại hình thức LCNT áp dụng theo hạn mức NĐ 214/2025 */
export type ApplicableSelectionMethod =
    | 'DirectPurchase'      // ≤50 triệu - Mua sắm trực tiếp
    | 'SimplifiedCDT'       // CĐT rút gọn (theo loại gói thầu)
    | 'NormalCDT'           // CĐT thông thường
    | 'OnlineQuotation'     // Chào giá trực tuyến
    | 'CompetitiveShopping' // Chào hàng cạnh tranh
    | 'OpenBidding';        // Đấu thầu rộng rãi

export interface BiddingPackage {
    PackageID: string;
    ProjectID: string;
    // Core Info (Thông tin chung)
    PackageNumber: string; // Số hiệu (VD: Gói thầu số 01)
    PackageName: string;   // Tên gói thầu
    Price: number;         // Giá gói thầu (Dự toán được duyệt)

    // Legal Classification (Phân loại theo Luật Đấu thầu)
    SelectionMethod:
    | 'OpenBidding'            // Đấu thầu rộng rãi
    | 'LimitedBidding'         // Đấu thầu hạn chế
    | 'Appointed'              // Chỉ định thầu
    | 'CompetitiveShopping'    // Chào hàng cạnh tranh
    | 'DirectProcurement'      // Mua sắm trực tiếp
    | 'SelfExecution'          // Tự thực hiện
    | 'CommunityParticipation'; // Cộng đồng tham gia

    SelectionProcedure?:
    | 'OneStageOneEnvelope'    // 1 giai đoạn 1 túi hồ sơ
    | 'OneStageTwoEnvelope'    // 1 giai đoạn 2 túi hồ sơ
    | 'TwoStageOneEnvelope'    // 2 giai đoạn 1 túi hồ sơ
    | 'TwoStageTwoEnvelope'    // 2 giai đoạn 2 túi hồ sơ
    | 'Reduced'                // Rút gọn
    | 'Normal';                // Thông thường (cho chào hàng)

    BidType: 'Online' | 'Offline'; // Qua mạng (E-Procurement) / Trực tiếp

    ContractType:
    | 'LumpSum'                // Trọn gói
    | 'UnitPrice'              // Đơn giá cố định
    | 'AdjustableUnitPrice'    // Đơn giá điều chỉnh
    | 'TimeBased'              // Theo thời gian
    | 'Percentage'             // Theo tỷ lệ phần trăm
    | 'Mixed';                 // Hỗn hợp

    Field?:
    | 'Construction'           // Xây lắp
    | 'Consultancy'            // Tư vấn
    | 'NonConsultancy'         // Phi tư vấn
    | 'Goods'                  // Hàng hóa
    | 'Mixed';                 // Hỗn hợp

    // Status & Process (Quy trình)
    Status: PackageStatus;

    // Key Codes & Dates (Mã định danh & Mốc thời gian)
    KHLCNTCode?: string;          // Mã Kế hoạch lựa chọn nhà thầu (PL...)
    NotificationCode?: string;    // Mã Thông báo mời thầu (TBMT: IB...)

    PostingDate?: string;         // Ngày đăng tải E-TBMT
    BidClosingDate?: string;      // Thời điểm đóng thầu
    BidOpeningDate?: string;      // Thời điểm mở thầu

    DecisionNumber?: string;      // Quyết định phê duyệt KHLCNT
    DecisionDate?: string;        // Ngày phê duyệt

    // Result (Kết quả)
    WinningContractorID?: string; // Nhà thầu trúng thầu
    WinningPrice?: number;        // Giá trúng thầu
    ApprovalDate_Result?: string; // Ngày phê duyệt KQLCNT

    // Execution
    Duration?: string;            // Thời gian thực hiện hợp đồng (VD: 360 ngày)
    ContractID?: string;          // Link to Contract

    // KHLCNT Specific Fields (For Export)
    FundingSource?: string;       // Nguồn vốn (VD: Ngân sách tỉnh và ngân sách trung ương)
    Description?: string;         // Tóm tắt công việc chính của gói thầu
    SelectionDuration?: string;   // Thời gian tổ chức lựa chọn nhà thầu (VD: 45 ngày)
    SelectionStartDate?: string;  // Thời gian bắt đầu tổ chức lựa chọn nhà thầu (VD: Tháng 12/2025)
    HasOption?: boolean;          // Tùy chọn mua thêm (Có/Không)

    // NĐ 214/2025 Compliance Fields
    ApplicableMethod?: ApplicableSelectionMethod; // Auto-detected từ Price + Field
    IsSimplifiedCDT?: boolean;    // Có phải CĐT rút gọn không
    SimplifiedReason?: string;    // Lý do áp dụng CĐT rút gọn (nếu có)
    RequiresAppraisal?: boolean;  // Có cần thẩm định không (theo NĐ mới = false cho KHLCNT)

    // Additional fields for compliance
    BidFee?: number;              // Phí bán HSMT
    EstimatePrice?: number;       // Giá gói thầu (dự toán)
    DecisionAgency?: string;      // Cơ quan phê duyệt
    DecisionFile?: string;        // Tên file quyết định

    // Plan Group — Nhóm theo KHLCNT/giai đoạn
    PlanGroupName?: string;         // Tên kế hoạch (VD: "KHLCNT giai đoạn 1")
    PlanDecisionNumber?: string;    // Số QĐ phê duyệt KH
    PlanDecisionDate?: string;      // Ngày QĐ phê duyệt KH

    // Muasamcong.vn Integration
    MSCPlanCode?: string;           // Mã KHLCNT trên muasamcong (PL..)
    MSCPackageLink?: string;        // Link trực tiếp đến gói thầu trên MSC
    MSCPublishStatus?: 'NotRequired' | 'Pending' | 'Published' | 'Overdue';

    // Ordering
    SortOrder?: number;             // Thứ tự hiển thị trong bảng KHLCNT
}

/** Tài liệu cần đăng tải trên muasamcong.vn */
export interface MSCPublishingRequirement {
    documentType: string;     // VD: "KHLCNT", "E-TBMT", "KQLCNT"
    description: string;      // Mô tả
    isRequired: boolean;      // Bắt buộc hay không
    legalBasis: string;       // Căn cứ pháp lý
    status: 'NotDone' | 'Done' | 'NotApplicable' | 'Overdue';
    deadline?: string;        // Hạn đăng tải (nếu có)
}

export interface CapitalAllocation {
    AllocationID: string;
    ProjectID: string;
    Year: number;
    Amount: number; // Vốn bố trí
    Source: 'NganSachTrungUong' | 'NganSachDiaPhuong' | 'ODA' | 'Khac';
    DecisionNumber?: string;
    DateAssigned: string;
}

// Disbursement (Giải ngân) — NĐ 99/2021/NĐ-CP
export interface Disbursement {
    DisbursementID: string;
    ProjectID: string;
    CapitalPlanID?: string; // Link to specific capital plan
    AllocationID?: string; // Link to specific allocation
    PaymentID?: number;
    Amount: number;
    Date: string;
    TreasuryCode?: string; // Mã Kho bạc
    FormType?: string; // Biểu mẫu (03a, 03b, 04a, 04b, 05)
    Description?: string;
    Status: 'Pending' | 'Approved' | 'Rejected';
    Type?: 'TamUng' | 'ThanhToanKLHT' | 'ThuHoiTamUng'; // Loại thanh toán
    ContractNumber?: string; // Số hợp đồng
    CumulativeBefore?: number; // Lũy kế TT trước
    AdvanceBalance?: number;   // Số dư tạm ứng
}

// Capital Summary Extended (Tổng hợp vốn)
export interface CapitalSummaryExtended {
    totalInvestment: number;     // Tổng mức đầu tư
    totalAllocated: number;      // Tổng vốn bố trí lũy kế
    totalDisbursed: number;      // Tổng đã giải ngân
    totalAdvance: number;        // Tổng tạm ứng
    advanceRecovered: number;    // Đã thu hồi tạm ứng
    advanceBalance: number;      // Số dư tạm ứng chưa thu hồi
    completionPayment: number;   // Thanh toán KLHT
    disbursementRate: number;    // Tỷ lệ giải ngân (%)
    yearlyTarget: number;        // KH vốn năm nay
    yearlyDisbursed: number;     // Giải ngân năm nay
}

// Capital Plan (Kế hoạch vốn)
export interface CapitalPlan {
    PlanID: string;
    ProjectID: string;
    Year: number;
    Amount: number;
    DecisionNumber?: string;
    DateAssigned?: string;
    Source: string;
    DisbursedAmount?: number;
    Status?: 'Draft' | 'Approved' | 'Allocated' | 'Closed';
}

// NEW: Risk & Issue Management
export enum RiskLevel {
    Low = 'Low',
    Medium = 'Medium',
    High = 'High',
    Critical = 'Critical'
}

export interface PackageIssue {
    IssueID: string;
    PackageID: string;
    Title: string;
    Description: string;
    Status: 'Open' | 'Resolved' | 'InProgress';
    Severity: RiskLevel;
    ReportedDate: string;
    Reporter: string;
}

export interface PackageHealthCheck {
    score: number; // 0-100
    riskLevel: RiskLevel;
    factors: string[]; // List of reasons (e.g., "Disbursement slow")
    recommendation: string;
}

// 5.2. Bảng dữ liệu: Contracts (Hợp đồng Xây dựng)
export enum ContractStatus {
    Executing = 1, // Đang thực hiện
    Paused = 2,    // Tạm dừng
    Liquidated = 3 // Đã thanh lý
}

export interface Contract {
    ContractID: string; // VARCHAR(50)
    PackageID: string; // Changed to string to match Package
    ContractorID: string; // VARCHAR(20)
    ProjectID: string; // VARCHAR - Foreign key to Project
    ContractName: string; // NVARCHAR - Tên hợp đồng
    SignDate: string; // DATE
    Value: number; // DECIMAL(18,2)
    AdvanceRate: number; // DECIMAL(5,2) - Tỷ lệ tạm ứng
    Warranty: number; // INT - Tháng
    Status: ContractStatus; // TINYINT
    VariationOrders?: VariationOrder[];
}

// 5.3. Bảng dữ liệu: Payments (Thanh toán & Giải ngân)
export enum PaymentType {
    Advance = 'Advance', // Tạm ứng
    Volume = 'Volume'    // Thanh toán khối lượng
}

export enum PaymentStatus {
    Pending = 'Pending', // Chờ duyệt
    Transferred = 'Transferred' // Đã chuyển tiền
}

export interface Payment {
    PaymentID: number; // Khóa chính
    ContractID: string; // Khóa ngoại
    BatchNo: number; // Đợt thanh toán
    Type: PaymentType;
    Amount: number; // Số tiền đề nghị
    TreasuryRef: string; // Mã giao dịch kho bạc
    Status: PaymentStatus;
}

// 6.1. Bảng dữ liệu: Documents (Hồ sơ Lưu trữ)
export enum DocCategory {
    Legal = 1,      // Pháp lý
    Quality = 2,    // Chất lượng
    AsBuilt = 3,    // Hoàn công
    BIM = 4         // BIM
}

export interface Document {
    DocID: number;
    ReferenceID: string; // Mã dự án hoặc công trình
    ProjectID?: string; // Explicit Project Link
    Category: DocCategory;
    DocName: string;
    StoragePath: string;
    IsDigitized: boolean;
    UploadDate: string;
    // UI Helpers
    Version?: string;
    Size?: string;
    History?: any[];
    isLocal?: boolean;
    fileObj?: any; // For local preview

    // CDE & ISO 19650 Fields
    FolderID?: string; // Link to Folder Structure
    ISOStatus?: ISO19650Status;
    Revision?: string; // P01, C01...
    WorkflowHistory?: WorkflowStep[];
}

export interface Folder {
    FolderID: string;
    ParentID?: string | null;
    Name: string;
    Type: 'Container' | 'Folder'; // ISO 19650 Container (e.g., WIP, Shared) or Sub-folder
    Path: string; // Materialized path for easy querying
}

// 7.1. Bảng dữ liệu: Employees (Nhân viên) & AUTH
export enum EmployeeStatus {
    Active = 1,
    Inactive = 0
}

export enum Role {
    Admin = 'Admin',
    Manager = 'Manager',
    Staff = 'Staff'
}

export interface Employee {
    EmployeeID: string;
    FullName: string;
    Department: string;
    Position: string;
    Email: string;
    Phone: string;
    AvatarUrl: string;
    Status: EmployeeStatus;
    JoinDate: string;
    // Auth Fields
    Username: string;
    Password?: string; // In real app, this should be hashed
    Role: Role;
}

// 9.1 Audit Logs (Lưu vết hệ thống)
export interface AuditLog {
    LogID: string;
    Action: 'Create' | 'Update' | 'Delete' | 'Login';
    TargetEntity: string; // E.g., 'Employee', 'Project'
    TargetID: string;
    ChangedBy: string; // EmployeeID or Username
    Timestamp: string;
    Details: string; // JSON string or description
}

// 8.1. Bảng dữ liệu: Tasks (Công việc)
export enum TaskStatus {
    Todo = 'Todo',
    InProgress = 'InProgress',
    Review = 'Review',
    Done = 'Done'
}

export enum TaskPriority {
    Low = 'Low',
    Medium = 'Medium',
    High = 'High',
    Urgent = 'Urgent'
}

export interface Task {
    TaskID: string;
    Title: string;
    Description?: string;
    ProjectID: string;
    AssigneeID: string; // Link to Employee
    StartDate?: string; // ISO Date String (optional)
    DueDate: string;   // ISO Date String
    Status: TaskStatus;
    Priority: TaskPriority;
    TimelineStep?: string; // Link to the specific step in project timeline
    CreatedDate?: string; // ISO Date String
    SortOrder?: number; // Ordering for UI display

    // Advanced fields for Regulatory Compliance
    LegalBasis?: string; // Căn cứ pháp lý (e.g. "Điều 24 Luật ĐTC")
    OutputDocument?: string; // Kết quả/Sản phẩm (e.g. "Quyết định phê duyệt")
    DurationDays?: number; // Thời gian thực hiện (ngày)
    PredecessorTaskID?: string; // Công việc tiền quyết (legacy - single)
    ApproverID?: string; // Người duyệt
    EstimatedCost?: number; // Chi phí dự kiến
    ActualStartDate?: string;
    ActualEndDate?: string;
    SubTasks?: SubTask[];

    // Enhanced Dependencies (New)
    Dependencies?: TaskDependency[];

    // Progress Tracking (New)
    ProgressPercent?: number; // 0-100
    PlannedStartDate?: string; // Baseline start
    PlannedEndDate?: string; // Baseline end

    // Resource Allocation (New)
    Assignees?: TaskAssignment[];

    // Critical Path (New)
    IsCritical?: boolean;
    Slack?: number; // Days of slack/float

    // Kanban (New)
    BoardColumn?: string;

    // Module 1: National Data Gateway
    SyncStatus?: {
        IsSynced: boolean;
        LastSyncDate?: string;
        NationalProjectCode?: string; // Mã dự án quốc gia
        SyncError?: string;
    };
}

// Task Dependency Types
export type DependencyType = 'FS' | 'SS' | 'FF' | 'SF';

export interface TaskDependency {
    TaskID: string; // The task this depends on
    Type: DependencyType;
    LagDays?: number; // Positive = delay, Negative = overlap
}

// Resource Assignment
export interface TaskAssignment {
    EmployeeID: string;
    AllocationPercent: number; // 0-100
    Role?: string; // e.g. "Lead", "Support"
}


export interface SubTask {
    SubTaskID: string;
    Title: string;
    AssigneeID: string;
    Status: 'Todo' | 'Done';
    DueDate?: string;
}

// Module 2: CDE & ISO 19650
export enum ISO19650Status {
    S0 = 'S0', // WIP
    S1 = 'S1', // Shared (Coordination)
    S2 = 'S2', // Shared (Information)
    S3 = 'S3', // Shared (Review)
    A1 = 'A1', // Published (Construction)
    A2 = 'A2', // Published (Handover)
    A3 = 'A3', // Published (Asset Mgmt)
    B1 = 'B1'  // Archived
}

export interface WorkflowStep {
    StepID: string;
    StepName: string; // e.g., "Nhà thầu trình", "TVGS duyệt"
    ActorID: string; // EmployeeID or Role
    Status: 'Pending' | 'Approved' | 'Rejected';
    Comment?: string;
    Timestamp?: string;
}

// Module 4: Contracts & Bidding Enhancements
export interface VariationOrder {
    VOID: string;
    ContractID: string;
    Number: string; // Số PLHĐ
    SignDate: string;
    Content: string;
    AdjustedAmount: number; // Giá trị điều chỉnh (+/-)
    AdjustedDuration: number; // Thời gian điều chỉnh (+/- ngày)
    ApprovalFile?: string;
}
