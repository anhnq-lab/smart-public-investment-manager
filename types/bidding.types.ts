// Bidding & Contractor types

// 4.1. Bảng dữ liệu: Contractors (Tổ chức Nhà thầu)
export interface Contractor {
    ContractorID: string;
    CapCertCode: string;
    FullName: string;
    IsForeign: boolean;
    OpLicenseNo?: string;
    Address: string;
    ContactInfo: string;
}

// 5.1. Bảng dữ liệu: BiddingPackages (Gói thầu)
export enum PackageStatus {
    Planning = 'Planning',
    Bidding = 'Bidding',
    Evaluating = 'Evaluating',
    Awarded = 'Awarded',
    Cancelled = 'Cancelled',
    Posted = 'Posted'
}

/**
 * Hạn mức áp dụng hình thức lựa chọn nhà thầu theo NĐ 214/2025/NĐ-CP
 */
export const BIDDING_THRESHOLDS = {
    DIRECT_PURCHASE: 50_000_000,
    CDT_SIMPLIFIED_ESTIMATE: 500_000_000,
    CDT_SIMPLIFIED_CONSULTANCY: 800_000_000,
    CDT_SIMPLIFIED_CONSTRUCTION: 2_000_000_000,
    ONLINE_QUOTATION_ESTIMATE: 2_000_000_000,
    ONLINE_QUOTATION_PROJECT: 5_000_000_000,
    COMPETITIVE_SHOPPING: 10_000_000_000,
} as const;

/** Phân loại hình thức LCNT áp dụng theo hạn mức NĐ 214/2025 */
export type ApplicableSelectionMethod =
    | 'DirectPurchase'
    | 'SimplifiedCDT'
    | 'NormalCDT'
    | 'OnlineQuotation'
    | 'CompetitiveShopping'
    | 'OpenBidding';

export interface BiddingPackage {
    PackageID: string;
    ProjectID: string;
    PackageNumber: string;
    PackageName: string;
    Price: number;
    SelectionMethod:
    | 'OpenBidding'
    | 'LimitedBidding'
    | 'Appointed'
    | 'CompetitiveShopping'
    | 'DirectProcurement'
    | 'SelfExecution'
    | 'CommunityParticipation';
    SelectionProcedure?:
    | 'OneStageOneEnvelope'
    | 'OneStageTwoEnvelope'
    | 'TwoStageOneEnvelope'
    | 'TwoStageTwoEnvelope'
    | 'Reduced'
    | 'Normal';
    BidType: 'Online' | 'Offline';
    ContractType:
    | 'LumpSum'
    | 'UnitPrice'
    | 'AdjustableUnitPrice'
    | 'TimeBased'
    | 'Percentage'
    | 'Mixed';
    Field?:
    | 'Construction'
    | 'Consultancy'
    | 'NonConsultancy'
    | 'Goods'
    | 'Mixed';
    Status: PackageStatus;
    KHLCNTCode?: string;
    NotificationCode?: string;
    PostingDate?: string;
    BidClosingDate?: string;
    BidOpeningDate?: string;
    DecisionNumber?: string;
    DecisionDate?: string;
    WinningContractorID?: string;
    WinningPrice?: number;
    ApprovalDate_Result?: string;
    Duration?: string;
    ContractID?: string;
    FundingSource?: string;
    Description?: string;
    SelectionDuration?: string;
    SelectionStartDate?: string;
    HasOption?: boolean;
    ApplicableMethod?: ApplicableSelectionMethod;
    IsSimplifiedCDT?: boolean;
    SimplifiedReason?: string;
    RequiresAppraisal?: boolean;
    BidFee?: number;
    EstimatePrice?: number;
    DecisionAgency?: string;
    DecisionFile?: string;
    PlanGroupName?: string;
    PlanDecisionNumber?: string;
    PlanDecisionDate?: string;
    MSCPlanCode?: string;
    MSCPackageLink?: string;
    MSCPublishStatus?: 'NotRequired' | 'Pending' | 'Published' | 'Overdue';
    SortOrder?: number;
}

/** Tài liệu cần đăng tải trên muasamcong.vn */
export interface MSCPublishingRequirement {
    documentType: string;
    description: string;
    isRequired: boolean;
    legalBasis: string;
    status: 'NotDone' | 'Done' | 'NotApplicable' | 'Overdue';
    deadline?: string;
}

// Risk & Issue Management
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
    score: number;
    riskLevel: RiskLevel;
    factors: string[];
    recommendation: string;
}
