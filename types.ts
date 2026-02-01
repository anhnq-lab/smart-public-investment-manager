
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
    Preparation = 1, // Chuẩn bị
    Execution = 2,   // Thực hiện
    Finished = 3,    // Kết thúc
    Operation = 4    // Vận hành
}

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
}

// 3.2. Bảng dữ liệu: ConstructionWorks (Công trình Xây dựng)
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

    SelectionProcedure:
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

    Field:
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
    Duration: string;             // Thời gian thực hiện hợp đồng (VD: 360 ngày)
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

// Ensure Disbursement matches
export interface Disbursement {
    DisbursementID: string;
    ProjectID: string;
    AllocationID?: string; // Link to specific allocation
    PaymentID?: number;
    Amount: number;
    Date: string;
    Description?: string;
    Status: 'Pending' | 'Approved' | 'Rejected';
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
    StartDate: string; // ISO Date String
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
    PredecessorTaskID?: string; // Công việc tiền quyết
    ApproverID?: string; // Người duyệt
    EstimatedCost?: number; // Chi phí dự kiến
    ActualStartDate?: string;
    ActualEndDate?: string;
    SubTasks?: SubTask[];

    // Module 1: National Data Gateway
    SyncStatus?: {
        IsSynced: boolean;
        LastSyncDate?: string;
        NationalProjectCode?: string; // Mã dự án quốc gia
        SyncError?: string;
    };
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
