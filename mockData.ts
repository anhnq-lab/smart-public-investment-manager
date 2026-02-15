
import {
    Project, ProjectGroup, InvestmentType, ProjectStatus, ProjectStage, ProjectSector,
    Contractor, Contract, ContractStatus, Payment, PaymentType, PaymentStatus, Document, DocCategory,
    BiddingPackage, PackageStatus, Employee, EmployeeStatus, Task, TaskStatus, TaskPriority, AuditLog, Role,
    PackageIssue, RiskLevel, PackageHealthCheck,
    Folder, ISO19650Status, CapitalPlan, Disbursement, VariationOrder, WorkflowStep
} from './types';
import { classifyProject } from './utils/projectCompliance';

// Helper to generate formatted currency
export const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) {
        return (amount / 1000000000).toFixed(1).replace(/\.0$/, '') + ' Tỷ';
    }
    if (amount >= 1000000) {
        return (amount / 1000000).toFixed(0) + ' Tr';
    }
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export const formatFullCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// --- 1. DỰ ÁN - BAN QLDA ĐTXD CHUYÊN NGÀNH (HVCTQG HCM) ---
const hvctqgProjects = [
    {
        id: "PR2500060068",
        name: "Đầu tư xây dựng Trường Chính trị Trần Phú",
        total: 105800000000,
        status: ProjectStatus.Preparation,
        projectNumber: "PR2500060068",
        version: "00",
        objective: "Nâng cao chất lượng đào tạo, từng bước hoàn thiện cơ sở vật chất theo quy hoạch được duyệt; đảm bảo các yêu cầu về tiêu chuẩn trường chính trị mức 1, hướng tới mức 2 theo Đề án số 02-DA/TU ngày 09/01/2023 của Ban Thường vụ Tỉnh ủy.",
        investor: "Ban Quản lý dự án đầu tư xây dựng chuyên ngành",
        authority: "Giám đốc Học viện Chính trị quốc gia Hồ Chí Minh",
        duration: "4 Năm",
        managementForm: "Chủ đầu tư trực tiếp quản lý dự án",
        isODA: false,
        location: "Tỉnh Hà Tĩnh",
        decisionNumber: "2810/QĐ-UBND",
        decisionDate: "2025-11-11",
        decisionAuthority: "Giám đốc Học viện Chính trị quốc gia Hồ Chí Minh"
    },
    {
        id: "0122118567000",
        name: "Xây dựng tòa nhà ở học viên - Học viện Chính trị quốc gia Hồ Chí Minh",
        total: 597000000000,
        status: ProjectStatus.Execution,
        projectNumber: "0122118567000",
        version: "00",
        objective: "Xây dựng tòa nhà ở học viên đáp ứng nhu cầu chỗ ở cho học viên, nghiên cứu sinh trong quá trình đào tạo, bồi dưỡng tại Học viện Chính trị quốc gia Hồ Chí Minh.",
        investor: "Ban Quản lý dự án đầu tư xây dựng chuyên ngành",
        authority: "Giám đốc Học viện Chính trị quốc gia Hồ Chí Minh",
        duration: "2021 - 2025",
        managementForm: "Chủ đầu tư trực tiếp quản lý dự án",
        isODA: false,
        location: "135 Nguyễn Phong Sắc, Nghĩa Tân, Cầu Giấy, Hà Nội",
        decisionNumber: "8567-QĐ/HVCTQG",
        decisionDate: "2022-03-30",
        decisionAuthority: "Giám đốc Học viện Chính trị quốc gia Hồ Chí Minh",
        // Chi tiết từ QĐ 8567
        constructionCost: 429623828000,
        equipmentCost: 100329599000,
        managementCost: 5744107000,
        consultingCost: 23723180000,
        otherCost: 3489773000,
        contingency: 34089513000,
        landArea: 7543,
        constructionArea: 4179,
        totalFloorArea: 35119,
        basementArea: 8579,
        buildingHeight: 64.4,
        floors: 16,
        designConsultant: "Công ty TNHH MTV tư vấn thiết kế và đầu tư xây dựng - Bộ Quốc phòng"
    }
];

const projectImages = [
    "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1487958449943-2429e8be8625?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=600&auto=format&fit=crop"
];

export const mockProjects: Project[] = hvctqgProjects.map((p, i) => {
    let progress = 0;
    let paymentProgress = 0;

    if (p.status === ProjectStatus.Completion) {
        progress = 100;
        paymentProgress = 98;
    } else if (p.status === ProjectStatus.Execution) {
        progress = 55 + Math.floor(Math.random() * 30);
        paymentProgress = Math.max(0, progress - 15 - Math.floor(Math.random() * 10));
    } else {
        progress = Math.floor(Math.random() * 5);
    }

    // Cast to any to access new fields for mapping without full typing on hvctqgProjects source
    const pAny = p as any;

    return {
        ProjectID: p.id,
        ProjectName: p.name,
        // Luật ĐTC 58/2024: Phân loại tự động theo lĩnh vực Giáo dục
        GroupCode: classifyProject(p.total, ProjectSector.Education),
        InvestmentType: InvestmentType.Public,
        DecisionMakerID: 100,
        TotalInvestment: p.total,
        CapitalSource: "Ngân sách Nhà nước",
        LocationCode: pAny.location || "Hà Nội",
        ApprovalDate: pAny.decisionDate || `2022-01-15`,
        Status: p.status,
        IsEmergency: false,
        ImageUrl: projectImages[i % projectImages.length],
        Progress: progress,
        PaymentProgress: paymentProgress,
        InvestorName: pAny.investor || "Ban QLDA ĐTXD chuyên ngành",
        MainContractorName: p.status === ProjectStatus.Preparation ? "Đang lựa chọn" : "Liên danh nhà thầu",
        ConstructionType: "Công trình Dân dụng",
        ConstructionGrade: p.total > 100000000000 ? "II" : "III",
        Members: p.id === 'PR2500060068'
            ? ["NV001", "NV003", "NV005"]
            : ["NV001", "NV002", "NV004", "NV006"],

        // Map new fields
        ProjectNumber: pAny.projectNumber,
        Version: pAny.version,
        Objective: pAny.objective,
        CompetentAuthority: pAny.authority,
        Duration: pAny.duration,
        ManagementForm: pAny.managementForm,
        DecisionNumber: pAny.decisionNumber,
        DecisionDate: pAny.decisionDate,
        DecisionAuthority: pAny.decisionAuthority,
        IsODA: pAny.isODA,

        // Module 1: National Gateway Sync
        SyncStatus: p.id === 'PR2500060068' ? {
            IsSynced: false,
            LastSyncDate: undefined,
            NationalProjectCode: undefined,
            SyncError: undefined
        } : {
            IsSynced: true,
            LastSyncDate: '2023-06-15',
            NationalProjectCode: '0122118567000',
            SyncError: undefined
        },

        // Map Coordinates
        Coordinates: p.id === 'PR2500060068'
            ? { lat: 18.343, lng: 105.905 } // Hà Tĩnh
            : { lat: 21.0378, lng: 105.7956 }, // Cầu Giấy, Hà Nội

        // Lifecycle & Compliance
        Stage: p.status === ProjectStatus.Preparation ? ProjectStage.Preparation :
            p.status === ProjectStatus.Execution ? ProjectStage.Execution :
                ProjectStage.Completion,

        Sector: ProjectSector.Education,

        // BIM Requirements
        RequiresBIM: p.total >= 80000000000,
        BIMStatus: p.total >= 80000000000
            ? (p.status === ProjectStatus.Execution ? 'Active' : 'Pending')
            : 'NotRequired',

        PhysicalProgress: progress,
        FinancialProgress: paymentProgress
    };
});

// --- 2. DEPARTMENTS & EMPLOYEES ---
export const mockEmployees: Employee[] = [
    {
        EmployeeID: "NV001",
        FullName: "Nguyễn Quốc Anh",
        Username: "Admin",
        Password: "123456",
        Role: Role.Admin,
        Department: "Ban Giám đốc",
        Position: "Quản trị hệ thống",
        Email: "quocanhnguyen.ksxd@gmail.com",
        Phone: "0943431591",
        AvatarUrl: "https://ui-avatars.com/api/?name=Nguyễn+Quốc+Anh&background=0D8ABC&color=fff",
        JoinDate: "2022-08-20",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV002",
        FullName: "ThS. Hoàng Văn Hùng",
        Username: "HVHUNG.BGD",
        Password: "123456",
        Role: Role.Admin,
        Department: "Ban Giám đốc",
        Position: "Giám đốc Ban QLDA",
        Email: "hvhung@hvctqg.edu.vn",
        Phone: "0912000001",
        AvatarUrl: "https://ui-avatars.com/api/?name=Hoàng+Văn+Hùng&background=1E40AF&color=fff",
        JoinDate: "2020-01-15",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV003",
        FullName: "ThS. Trần Xuân Ban",
        Username: "TXBAN.BGD",
        Password: "123456",
        Role: Role.Admin,
        Department: "Ban Giám đốc",
        Position: "Phó Giám đốc Ban QLDA",
        Email: "txban@hvctqg.edu.vn",
        Phone: "0912000002",
        AvatarUrl: "https://ui-avatars.com/api/?name=Trần+Xuân+Ban&background=1E40AF&color=fff",
        JoinDate: "2020-03-01",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV004",
        FullName: "Lê Minh Tuấn",
        Username: "LMTUAN.KTGS",
        Password: "123456",
        Role: Role.Staff,
        Department: "Phòng Kỹ thuật - Giám sát",
        Position: "Trưởng phòng",
        Email: "lmtuan@hvctqg.edu.vn",
        Phone: "0912000003",
        AvatarUrl: "https://ui-avatars.com/api/?name=Lê+Minh+Tuấn&background=065F46&color=fff",
        JoinDate: "2020-06-01",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV005",
        FullName: "Nguyễn Thị Hồng Nhung",
        Username: "NTHNHUNG.KHTC",
        Password: "123456",
        Role: Role.Staff,
        Department: "Phòng Kế hoạch - Tài chính",
        Position: "Trưởng phòng",
        Email: "nthnhung@hvctqg.edu.vn",
        Phone: "0912000004",
        AvatarUrl: "https://ui-avatars.com/api/?name=Nguyễn+Thị+Hồng+Nhung&background=9333EA&color=fff",
        JoinDate: "2020-06-15",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV006",
        FullName: "Phạm Văn Đức",
        Username: "PVDUC.KTGS",
        Password: "123456",
        Role: Role.Staff,
        Department: "Phòng Kỹ thuật - Giám sát",
        Position: "Kỹ sư giám sát",
        Email: "pvduc@hvctqg.edu.vn",
        Phone: "0912000005",
        AvatarUrl: "https://ui-avatars.com/api/?name=Phạm+Văn+Đức&background=065F46&color=fff",
        JoinDate: "2021-01-10",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV007",
        FullName: "Trần Thị Mai Anh",
        Username: "TTMANH.KHTC",
        Password: "123456",
        Role: Role.Staff,
        Department: "Phòng Kế hoạch - Tài chính",
        Position: "Kế toán",
        Email: "ttmanh@hvctqg.edu.vn",
        Phone: "0912000006",
        AvatarUrl: "https://ui-avatars.com/api/?name=Trần+Thị+Mai+Anh&background=9333EA&color=fff",
        JoinDate: "2021-03-01",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV008",
        FullName: "Đỗ Quang Hưng",
        Username: "DQHUNG.KTGS",
        Password: "123456",
        Role: Role.Staff,
        Department: "Phòng Kỹ thuật - Giám sát",
        Position: "Kỹ sư xây dựng",
        Email: "dqhung@hvctqg.edu.vn",
        Phone: "0912000007",
        AvatarUrl: "https://ui-avatars.com/api/?name=Đỗ+Quang+Hưng&background=065F46&color=fff",
        JoinDate: "2021-06-01",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV009",
        FullName: "Vũ Thị Lan Phương",
        Username: "VTLPHUONG.HCTH",
        Password: "123456",
        Role: Role.Staff,
        Department: "Phòng Hành chính - Tổng hợp",
        Position: "Nhân viên hành chính",
        Email: "vtlphuong@hvctqg.edu.vn",
        Phone: "0912000008",
        AvatarUrl: "https://ui-avatars.com/api/?name=Vũ+Thị+Lan+Phương&background=B45309&color=fff",
        JoinDate: "2021-09-01",
        Status: EmployeeStatus.Active
    }
];


// --- 3. CONTRACTORS & CONTRACTS MAPPING ---
// Full list from user dump
const realContractorsList = [
    "Công ty CP Bơm Châu Âu",
    "Công ty CP Xây dựng và Thương mại Dịch vụ 555",
    "Công ty cổ phần tư vấn và xây dựng Thái Hà",
    "Công ty CP Hà Huy",
    "Liên danh 3001650743 - 2901407806",
    "Liên danh 3001806687 - 3000353064",
    "Liên danh 3000296112",
    "Liên danh 3001313321 - 3002103239",
    "Liên danh 3001937697 - 3000645726",
    "Công ty CP Tư vấn thiết kế Hà Tĩnh",
    "Công ty TNHH Hòa Hiệp",
    "Tổng công ty 319 Bộ Quốc phòng",
    "Công ty 3000426153",
    "Công ty CP 484",
    "Công ty TNHH Như Nam",
    "Sở Xây dựng Hà Tĩnh",
    "Công ty CP 3001279984"
];

export const mockContractors: Contractor[] = realContractorsList.map((name, i) => ({
    ContractorID: `MST${300000000 + i}`,
    CapCertCode: `CC${80000000 + i}`,
    FullName: name,
    IsForeign: false,
    Address: `TP.Hà Tĩnh, Tỉnh Hà Tĩnh`,
    ContactInfo: `contact@${name.substring(0, 10).toLowerCase().replace(/\s+/g, '')}.com`
}));

// ADD SPECIFIC CONTRACTORS FROM NEW DATA
mockContractors.push(
    {
        ContractorID: '3001328159',
        FullName: 'CÔNG TY CP TƯ VẤN VÀ ĐẦU TƯ XÂY DỰNG VINAXIM',
        CapCertCode: 'CC328159',
        IsForeign: false,
        Address: 'Hà Nội',
        ContactInfo: 'vinaxim@example.com'
    },
    {
        ContractorID: '3000109186',
        FullName: 'CÔNG TY CP TƯ VẤN VÀ XÂY DỰNG HÀ TĨNH',
        CapCertCode: 'CC109186',
        IsForeign: false,
        Address: 'Hà Tĩnh',
        ContactInfo: 'tvxdht@example.com'
    },
    {
        ContractorID: 'vn0107740913',
        FullName: 'CÔNG TY CỔ PHẦN BẢO TỒN DI SẢN VĂN HÓA TRUNG HƯNG',
        CapCertCode: 'MN010774',
        IsForeign: false,
        Address: 'Hà Nội',
        ContactInfo: 'trunghungjsc@gmail.com'
    },
    {
        ContractorID: 'vn0108622278',
        FullName: 'CÔNG TY CỔ PHẦN TU BỔ TÔN TẠO CÔNG TRÌNH VĂN HÓA',
        CapCertCode: 'MN010862',
        IsForeign: false,
        Address: 'Hà Nội',
        ContactInfo: 'tubotontao@example.com'
    },
    {
        ContractorID: 'vn0107128531',
        FullName: 'CÔNG TY CỔ PHẦN CÔNG NGHỆ SỐ 1 VIỆT NAM',
        CapCertCode: 'MN010712',
        IsForeign: false,
        Address: 'Hà Nội',
        ContactInfo: 'congngheso1@example.com'
    },
    {
        ContractorID: 'vn0107008523',
        FullName: 'Công ty TNHH thương mại tổng hợp và xây dựng Minh Châu',
        CapCertCode: 'MN070085',
        IsForeign: false,
        Address: 'Hà Nội',
        ContactInfo: 'minhchau@example.com'
    },
    {
        ContractorID: 'vn0103723427',
        FullName: 'CÔNG TY CỔ PHẦN ĐẦU TƯ VÀ XÂY DỰNG PHÚ NGHĨA',
        CapCertCode: 'MN037234',
        IsForeign: false,
        Address: 'Hà Nội',
        ContactInfo: 'phunghia@example.com'
    },
    {
        ContractorID: 'LD-PR2500062685-07',
        FullName: 'Liên danh nhà thầu thi công Tu bổ, tôn tạo đình Vụ Bản, xã Minh Trí',
        CapCertCode: 'LD-VUBAN',
        IsForeign: false,
        Address: 'Hà Nội',
        ContactInfo: 'liendanh.vuban@example.com'
    },
    {
        ContractorID: 'vn0104426593',
        FullName: 'CÔNG TY CỔ PHẦN TƯ VẤN VÀ XÂY DỰNG MÊ LINH',
        CapCertCode: 'MN044265',
        IsForeign: false,
        Address: 'Hà Nội',
        ContactInfo: 'melinh@example.com'
    },
    {
        ContractorID: 'vn0304422444',
        FullName: 'TỔNG CÔNG TY CỔ PHẦN BẢO HIỂM TOÀN CẦU',
        CapCertCode: 'MN044224',
        IsForeign: false,
        Address: 'Hà Nội',
        ContactInfo: 'baohiemtoancau@example.com'
    }
);

// ═══════════════════════════════════════════════════════════════════════════════
// GÓI THẦU DỰ ÁN NHÀ Ở HỌC VIÊN (0122118567000)
// 17 gói thầu theo KHLCNT được phê duyệt
// ═══════════════════════════════════════════════════════════════════════════════


export const mockBiddingPackages: BiddingPackage[] = [
    // ═══════════════════════════════════════════════════════════════
    // 17 GÓI THẦU DỰ ÁN NHÀ Ở HỌC VIÊN (0122118567000)
    // Nguồn: KHLCNT dự án Xây dựng tòa nhà ở học viên - HVCTQG HCM
    // ═══════════════════════════════════════════════════════════════
    {
        PackageID: "PKG-NOHV-01",
        ProjectID: "0122118567000",
        PackageNumber: "01",
        PackageName: "Tư vấn thiết kế nội thất",
        Price: 912_752_000,
        Field: 'Consultancy',
        SelectionMethod: 'OpenBidding',
        SelectionProcedure: 'OneStageTwoEnvelope',
        BidType: 'Online',
        ContractType: 'LumpSum',
        Status: PackageStatus.Awarded,
        FundingSource: 'Vốn ngân sách Nhà nước chi đầu tư phát triển ngành Giáo dục - Đào tạo',
        Duration: '60 ngày',
        SelectionStartDate: 'Quý II, 2023',
        HasOption: false,
    },
    {
        PackageID: "PKG-NOHV-02",
        ProjectID: "0122118567000",
        PackageNumber: "02",
        PackageName: "Tư vấn thẩm tra thiết kế và dự toán nội thất",
        Price: 113_204_000,
        Field: 'Consultancy',
        SelectionMethod: 'Appointed',
        SelectionProcedure: 'Reduced',
        BidType: 'Offline',
        ContractType: 'LumpSum',
        Status: PackageStatus.Awarded,
        FundingSource: 'Vốn ngân sách Nhà nước chi đầu tư phát triển ngành Giáo dục - Đào tạo',
        Duration: '30 ngày',
        SelectionStartDate: 'Quý II, 2023',
        HasOption: false,
    },
    {
        PackageID: "PKG-NOHV-03",
        ProjectID: "0122118567000",
        PackageNumber: "03",
        PackageName: "Tư vấn thẩm định giá nội thất",
        Price: 50_000_000,
        Field: 'Consultancy',
        SelectionMethod: 'Appointed',
        SelectionProcedure: 'Reduced',
        BidType: 'Offline',
        ContractType: 'LumpSum',
        Status: PackageStatus.Awarded,
        FundingSource: 'Vốn ngân sách Nhà nước chi đầu tư phát triển ngành Giáo dục - Đào tạo',
        Duration: '20 ngày',
        SelectionStartDate: 'Quý II, 2023',
        HasOption: false,
    },
    {
        PackageID: "PKG-NOHV-04",
        ProjectID: "0122118567000",
        PackageNumber: "04",
        PackageName: "Tư vấn lập hồ sơ mời thầu, đánh giá hồ sơ dự thầu các gói thầu",
        Price: 470_177_000,
        Field: 'Consultancy',
        SelectionMethod: 'Appointed',
        SelectionProcedure: 'Reduced',
        BidType: 'Offline',
        ContractType: 'LumpSum',
        Status: PackageStatus.Awarded,
        FundingSource: 'Vốn ngân sách Nhà nước chi đầu tư phát triển ngành Giáo dục - Đào tạo',
        Duration: '340 ngày',
        SelectionStartDate: 'Quý IV, 2022',
        HasOption: false,
    },
    {
        PackageID: "PKG-NOHV-05",
        ProjectID: "0122118567000",
        PackageNumber: "05",
        PackageName: "Tư vấn thẩm định hồ sơ mời thầu, thẩm định kết quả lựa chọn nhà thầu các gói thầu",
        Price: 217_024_000,
        Field: 'Consultancy',
        SelectionMethod: 'Appointed',
        SelectionProcedure: 'Reduced',
        BidType: 'Offline',
        ContractType: 'LumpSum',
        Status: PackageStatus.Awarded,
        FundingSource: 'Vốn ngân sách Nhà nước chi đầu tư phát triển ngành Giáo dục - Đào tạo',
        Duration: '260 ngày',
        SelectionStartDate: 'Quý IV, 2022',
        HasOption: false,
    },
    {
        PackageID: "PKG-NOHV-06",
        ProjectID: "0122118567000",
        PackageNumber: "06",
        PackageName: "Giám sát thi công xây dựng, lắp đặt thiết bị và nội thất",
        Price: 6_073_498_000,
        Field: 'Consultancy',
        SelectionMethod: 'OpenBidding',
        SelectionProcedure: 'OneStageTwoEnvelope',
        BidType: 'Online',
        ContractType: 'LumpSum',
        Status: PackageStatus.Awarded,
        FundingSource: 'Vốn ngân sách Nhà nước chi đầu tư phát triển ngành Giáo dục - Đào tạo',
        Duration: '720 ngày',
        SelectionStartDate: 'Quý IV, 2022',
        HasOption: false,
    },
    {
        PackageID: "PKG-NOHV-07",
        ProjectID: "0122118567000",
        PackageNumber: "07",
        PackageName: "Quan trắc lún",
        Price: 719_505_000,
        Field: 'Consultancy',
        SelectionMethod: 'OpenBidding',
        SelectionProcedure: 'OneStageTwoEnvelope',
        BidType: 'Online',
        ContractType: 'LumpSum',
        Status: PackageStatus.Awarded,
        FundingSource: 'Vốn ngân sách Nhà nước chi đầu tư phát triển ngành Giáo dục - Đào tạo',
        Duration: '720 ngày',
        SelectionStartDate: 'Quý I, 2023',
        HasOption: false,
    },
    {
        PackageID: "PKG-NOHV-08",
        ProjectID: "0122118567000",
        PackageNumber: "08",
        PackageName: "Kiểm toán công trình",
        Price: 1_195_194_000,
        Field: 'Consultancy',
        SelectionMethod: 'OpenBidding',
        SelectionProcedure: 'OneStageTwoEnvelope',
        BidType: 'Online',
        ContractType: 'LumpSum',
        Status: PackageStatus.Awarded,
        FundingSource: 'Vốn ngân sách Nhà nước chi đầu tư phát triển ngành Giáo dục - Đào tạo',
        Duration: '360 ngày',
        SelectionStartDate: 'Quý III, 2023',
        HasOption: false,
    },
    {
        PackageID: "PKG-NOHV-09",
        ProjectID: "0122118567000",
        PackageNumber: "09",
        PackageName: "Thí nghiệm cọc",
        Price: 1_218_805_000,
        Field: 'Consultancy',
        SelectionMethod: 'OpenBidding',
        SelectionProcedure: 'OneStageTwoEnvelope',
        BidType: 'Online',
        ContractType: 'LumpSum',
        Status: PackageStatus.Awarded,
        FundingSource: 'Vốn ngân sách Nhà nước chi đầu tư phát triển ngành Giáo dục - Đào tạo',
        Duration: '60 ngày',
        SelectionStartDate: 'Quý IV, 2022',
        HasOption: false,
    },
    {
        PackageID: "PKG-NOHV-10",
        ProjectID: "0122118567000",
        PackageNumber: "10",
        PackageName: "Bảo hiểm công trình xây dựng và thiết bị",
        Price: 643_493_000,
        Field: 'NonConsultancy',
        SelectionMethod: 'OpenBidding',
        SelectionProcedure: 'OneStageOneEnvelope',
        BidType: 'Online',
        ContractType: 'LumpSum',
        Status: PackageStatus.Awarded,
        FundingSource: 'Vốn ngân sách Nhà nước chi đầu tư phát triển ngành Giáo dục - Đào tạo',
        Duration: '720 ngày',
        SelectionStartDate: 'Quý IV, 2022',
        HasOption: false,
    },
    {
        PackageID: "PKG-NOHV-11",
        ProjectID: "0122118567000",
        PackageNumber: "11",
        PackageName: "Phòng chống mối",
        Price: 462_486_000,
        Field: 'Construction',
        SelectionMethod: 'Appointed',
        SelectionProcedure: 'Reduced',
        BidType: 'Offline',
        ContractType: 'LumpSum',
        Status: PackageStatus.Awarded,
        FundingSource: 'Vốn ngân sách Nhà nước chi đầu tư phát triển ngành Giáo dục - Đào tạo',
        Duration: '180 ngày',
        SelectionStartDate: 'Quý II, 2023',
        HasOption: false,
    },
    {
        PackageID: "PKG-NOHV-12",
        ProjectID: "0122118567000",
        PackageNumber: "12",
        PackageName: "Thi công xây dựng công trình",
        Price: 428_692_341_000,
        Field: 'Construction',
        SelectionMethod: 'OpenBidding',
        SelectionProcedure: 'OneStageTwoEnvelope',
        BidType: 'Online',
        ContractType: 'UnitPrice',
        Status: PackageStatus.Awarded,
        FundingSource: 'Vốn ngân sách Nhà nước chi đầu tư phát triển ngành Giáo dục - Đào tạo',
        Duration: '720 ngày',
        SelectionStartDate: 'Quý IV, 2022',
        HasOption: false,
    },
    {
        PackageID: "PKG-NOHV-13",
        ProjectID: "0122118567000",
        PackageNumber: "13",
        PackageName: "Cung cấp lắp đặt thiết bị điều hòa không khí",
        Price: 28_288_678_000,
        Field: 'Goods',
        SelectionMethod: 'OpenBidding',
        SelectionProcedure: 'OneStageTwoEnvelope',
        BidType: 'Online',
        ContractType: 'LumpSum',
        Status: PackageStatus.Awarded,
        FundingSource: 'Vốn ngân sách Nhà nước chi đầu tư phát triển ngành Giáo dục - Đào tạo',
        Duration: '360 ngày',
        SelectionStartDate: 'Quý II, 2023',
        HasOption: false,
    },
    {
        PackageID: "PKG-NOHV-14",
        ProjectID: "0122118567000",
        PackageNumber: "14",
        PackageName: "Cung cấp, lắp đặt thiết bị hệ thống thang máy, thang cuốn",
        Price: 30_416_440_000,
        Field: 'Goods',
        SelectionMethod: 'OpenBidding',
        SelectionProcedure: 'OneStageTwoEnvelope',
        BidType: 'Online',
        ContractType: 'LumpSum',
        Status: PackageStatus.Awarded,
        FundingSource: 'Vốn ngân sách Nhà nước chi đầu tư phát triển ngành Giáo dục - Đào tạo',
        Duration: '360 ngày',
        SelectionStartDate: 'Quý III, 2023',
        HasOption: false,
    },
    {
        PackageID: "PKG-NOHV-15",
        ProjectID: "0122118567000",
        PackageNumber: "15",
        PackageName: "Cung cấp, lắp đặt thiết bị hệ thống điện nhẹ, âm thanh, camera giám sát",
        Description: "Cung cấp, lắp đặt: thiết bị hệ thống điện nhẹ đồng bộ cho dự án theo thiết kế được duyệt; hệ thống thông tin (mạng, thoại, truyền hình); hệ thống âm thanh đầy đủ hoạt động điều khiển trung tâm; hệ thống quản lý và kiểm soát xe ra vào; hệ camera thống giám sát tòa nhà (thiết kế theo hệ thống camera IP)",
        Price: 8_157_768_000,
        Field: 'Goods',
        SelectionMethod: 'OpenBidding',
        SelectionProcedure: 'OneStageOneEnvelope',
        BidType: 'Online',
        ContractType: 'LumpSum',
        Status: PackageStatus.Bidding,
        FundingSource: 'Vốn ngân sách Nhà nước chi đầu tư phát triển ngành Giáo dục - Đào tạo',
        Duration: '90 ngày',
        SelectionDuration: '60 ngày',
        SelectionStartDate: 'Quý II, 2025',
        HasOption: false,
        DecisionAgency: 'Ban quản lý dự án Đầu tư xây dựng chuyên ngành - Học viện Chính trị quốc gia Hồ Chí Minh',
    },
    {
        PackageID: "PKG-NOHV-16",
        ProjectID: "0122118567000",
        PackageNumber: "16",
        PackageName: "Cung cấp, lắp đặt thiết bị hệ thống máy phát điện, trạm biến áp",
        Price: 15_991_945_000,
        Field: 'Goods',
        SelectionMethod: 'OpenBidding',
        SelectionProcedure: 'OneStageTwoEnvelope',
        BidType: 'Online',
        ContractType: 'LumpSum',
        Status: PackageStatus.Awarded,
        FundingSource: 'Vốn ngân sách Nhà nước chi đầu tư phát triển ngành Giáo dục - Đào tạo',
        Duration: '180 ngày',
        SelectionStartDate: 'Quý IV, 2023',
        HasOption: false,
    },
    {
        PackageID: "PKG-NOHV-17",
        ProjectID: "0122118567000",
        PackageNumber: "17",
        PackageName: "Cung cấp, lắp đặt hệ thống trang thiết bị nội thất (Bao gồm: trang thiết bị nội thất phòng ở, doanh cụ phòng ăn, thiết bị bếp)",
        Description: "Cung cấp, lắp đặt trang thiết bị nội thất sinh hoạt cho toàn bộ khu nhà ở học viên 380 phòng (bao gồm: giường ngủ, tủ quần áo, bàn ghế làm việc, bàn ghế uống nước, quạt, ti vi, chăn ga gối đệm...); khu sảnh, lễ tân (bàn quầy, vách ngăn); khu nhà bếp (bao gồm 48 bộ bàn ghế phòng ăn và toàn bộ doanh cụ, thiết bị bếp)",
        Price: 27_292_979_000,
        Field: 'Goods',
        SelectionMethod: 'OpenBidding',
        SelectionProcedure: 'OneStageOneEnvelope',
        BidType: 'Online',
        ContractType: 'LumpSum',
        Status: PackageStatus.Bidding,
        FundingSource: 'Vốn ngân sách Nhà nước chi đầu tư phát triển ngành Giáo dục - Đào tạo',
        Duration: '45 ngày',
        SelectionDuration: '60 ngày',
        SelectionStartDate: 'Quý II, 2025',
        HasOption: false,
        DecisionAgency: 'Ban quản lý dự án Đầu tư xây dựng chuyên ngành - Học viện Chính trị quốc gia Hồ Chí Minh',
    },
];

// ═══════════════════════════════════════════════════════════════════════════════
// GÓI THẦU DỰ ÁN TRƯỜNG CHÍNH TRỊ TRẦN PHÚ (PR2500060068)
// ═══════════════════════════════════════════════════════════════════════════════
const truongChinhTriPackages: BiddingPackage[] = [
    {
        PackageID: "PKG-PR2500060068-01",
        ProjectID: "PR2500060068",
        PackageNumber: "01.1/TV-BVTC",
        PackageName: "01.1/TV-BVTC: Tư vấn khảo sát, lập Thiết kế bản vẽ thi công và dự toán công trình Đầu tư xây dựng Trường chính trị Trần Phú",
        Price: 1973350000,
        SelectionMethod: 'OpenBidding',
        BidType: 'Online',
        ContractType: 'LumpSum',
        Status: PackageStatus.Bidding,
        NotificationCode: "IB2500519537",
        PostingDate: "20/11/2025 16:47",
        BidClosingDate: "08/12/2025 07:40",
        KHLCNTCode: "PL2500295620",
        Field: 'Consultancy',
        Duration: "60 ngày",
        BidFee: 330000,
        DecisionNumber: "241",
        DecisionDate: "20/11/2025",
        DecisionAgency: "Ban Quản lý dự án đầu tư xây dựng chuyên ngành - Học viện Chính trị quốc gia Hồ Chí Minh",
        DecisionFile: "IB2500519537_QuyetDinhPheDuyetHSMT_20_11_2025.pdf"
    },
    {
        PackageID: "PKG-PR2500060068-02",
        ProjectID: "PR2500060068",
        PackageNumber: "01.2/TĐGTB",
        PackageName: "Thẩm định giá thiết bị vật tư công trình Đầu tư xây dựng Trường chính trị Trần Phú",
        Price: 60000000,
        SelectionMethod: 'Appointed',
        BidType: 'Offline',
        ContractType: 'LumpSum',
        Status: PackageStatus.Planning,
        Field: 'Consultancy',
    },
    {
        PackageID: "PKG-PR2500060068-03",
        ProjectID: "PR2500060068",
        PackageNumber: "01.3/TVTT",
        PackageName: "Tư vấn thẩm tra thiết kế và dự toán công trình Đầu tư xây dựng Trường chính trị Trần Phú",
        Price: 237727000,
        SelectionMethod: 'Appointed',
        BidType: 'Offline',
        ContractType: 'LumpSum',
        Status: PackageStatus.Planning,
        Field: 'Consultancy',
    }
];
mockBiddingPackages.push(...truongChinhTriPackages);

// ═══════════════════════════════════════════════════════════════════════════════
// HỢP ĐỒNG & THANH TOÁN
// ═══════════════════════════════════════════════════════════════════════════════
export const mockContracts: Contract[] = [
    // Gói 12: Thi công xây dựng công trình (gói lớn nhất)
    {
        ContractID: 'HD-NOHV-12/XL',
        PackageID: 'PKG-NOHV-12',
        ContractorID: mockContractors[0]?.ContractorID || 'CTR-001',
        SignDate: '2023-03-15',
        Value: 420_000_000_000,
        AdvanceRate: 15,
        Warranty: 24,
        Status: ContractStatus.Executing,
    },
    // Gói 06: Giám sát thi công
    {
        ContractID: 'HD-NOHV-06/TV',
        PackageID: 'PKG-NOHV-06',
        ContractorID: mockContractors[1]?.ContractorID || 'CTR-002',
        SignDate: '2023-04-01',
        Value: 5_900_000_000,
        AdvanceRate: 30,
        Warranty: 0,
        Status: ContractStatus.Executing,
    },
    // Gói 13: Điều hòa không khí
    {
        ContractID: 'HD-NOHV-13/HH',
        PackageID: 'PKG-NOHV-13',
        ContractorID: mockContractors[2]?.ContractorID || 'CTR-003',
        SignDate: '2023-09-20',
        Value: 27_500_000_000,
        AdvanceRate: 15,
        Warranty: 12,
        Status: ContractStatus.Executing,
    },
    // Gói 14: Thang máy, thang cuốn
    {
        ContractID: 'HD-NOHV-14/HH',
        PackageID: 'PKG-NOHV-14',
        ContractorID: mockContractors[3]?.ContractorID || 'CTR-004',
        SignDate: '2024-01-10',
        Value: 29_800_000_000,
        AdvanceRate: 15,
        Warranty: 24,
        Status: ContractStatus.Executing,
    },
    // Gói 16: Máy phát điện, trạm biến áp
    {
        ContractID: 'HD-NOHV-16/HH',
        PackageID: 'PKG-NOHV-16',
        ContractorID: mockContractors[4]?.ContractorID || 'CTR-005',
        SignDate: '2024-03-15',
        Value: 15_500_000_000,
        AdvanceRate: 15,
        Warranty: 12,
        Status: ContractStatus.Executing,
    },
];

export const mockPayments: Payment[] = [
    // Gói 12: Thi công XD - Tạm ứng
    {
        PaymentID: 101,
        ContractID: 'HD-NOHV-12/XL',
        BatchNo: 1,
        Type: PaymentType.Advance,
        Amount: 63_000_000_000, // 15%
        TreasuryRef: 'KB-NOHV-12-001',
        Status: PaymentStatus.Transferred,
    },
    // Gói 12: Thi công XD - Thanh toán đợt 1 (Móng + Tầng hầm)
    {
        PaymentID: 102,
        ContractID: 'HD-NOHV-12/XL',
        BatchNo: 2,
        Type: PaymentType.Volume,
        Amount: 84_000_000_000, // ~20%
        TreasuryRef: 'KB-NOHV-12-002',
        Status: PaymentStatus.Transferred,
    },
    // Gói 12: Thi công XD - Thanh toán đợt 2 (Kết cấu tầng 1-8)
    {
        PaymentID: 103,
        ContractID: 'HD-NOHV-12/XL',
        BatchNo: 3,
        Type: PaymentType.Volume,
        Amount: 105_000_000_000, // ~25%
        TreasuryRef: 'KB-NOHV-12-003',
        Status: PaymentStatus.Transferred,
    },
    // Gói 12: Thi công XD - Thanh toán đợt 3 (Kết cấu tầng 9-16 + Hoàn thiện)
    {
        PaymentID: 104,
        ContractID: 'HD-NOHV-12/XL',
        BatchNo: 4,
        Type: PaymentType.Volume,
        Amount: 84_000_000_000, // ~20%
        TreasuryRef: 'KB-NOHV-12-004',
        Status: PaymentStatus.Pending,
    },
    // Gói 06: Giám sát - Tạm ứng
    {
        PaymentID: 201,
        ContractID: 'HD-NOHV-06/TV',
        BatchNo: 1,
        Type: PaymentType.Advance,
        Amount: 1_770_000_000, // 30%
        TreasuryRef: 'KB-NOHV-06-001',
        Status: PaymentStatus.Transferred,
    },
    // Gói 13: Điều hòa - Tạm ứng
    {
        PaymentID: 301,
        ContractID: 'HD-NOHV-13/HH',
        BatchNo: 1,
        Type: PaymentType.Advance,
        Amount: 4_125_000_000, // 15%
        TreasuryRef: 'KB-NOHV-13-001',
        Status: PaymentStatus.Transferred,
    },
    // Gói 14: Thang máy - Tạm ứng
    {
        PaymentID: 401,
        ContractID: 'HD-NOHV-14/HH',
        BatchNo: 1,
        Type: PaymentType.Advance,
        Amount: 4_470_000_000, // 15%
        TreasuryRef: 'KB-NOHV-14-001',
        Status: PaymentStatus.Transferred,
    },
    // Gói 16: Máy phát điện - Tạm ứng
    {
        PaymentID: 501,
        ContractID: 'HD-NOHV-16/HH',
        BatchNo: 1,
        Type: PaymentType.Advance,
        Amount: 2_325_000_000, // 15%
        TreasuryRef: 'KB-NOHV-16-001',
        Status: PaymentStatus.Transferred,
    },
];

// 5. Documents
// 5. Documents
export const mockDocuments: Document[] = [
    // --- PROJECT PR2400031160 (Trạm Y Tế) ---
    // F1: LEGAL (Folder: 10. Pháp lý)

    {
        DocID: 101,
        ReferenceID: "PR2400031160",
        ProjectID: "PR2400031160",
        Category: DocCategory.Legal,
        DocName: "Quyết định phê duyệt chủ trương đầu tư số 573/QĐ-UBND.pdf",
        StoragePath: "/docs/QD_573.pdf",
        IsDigitized: true,
        UploadDate: "2024-06-06",
        Version: "P01.01",
        Size: "2.8 MB",
        FolderID: 'FLD-S-LEGAL',
        ISOStatus: ISO19650Status.S3,
        WorkflowHistory: [
            {
                StepID: "STP-001",
                StepName: "Nhà thầu trình",
                ActorID: "Nhà thầu Thuận Thảo",
                Status: "Approved",
                Timestamp: "2024-06-06T08:00:00Z",
                Comment: "Trình hồ sơ thẩm định thiết kế"
            },
            {
                StepID: "STP-002",
                StepName: "Tư vấn duyệt",
                ActorID: "Tư vấn giám sát A",
                Status: "Approved",
                Timestamp: "2024-06-07T14:30:00Z",
                Comment: "Thiết kế đạt yêu cầu, thống nhất trình PMU"
            }
        ]
    },
    {
        DocID: 102,
        ReferenceID: "PR2400031160",
        ProjectID: "PR2400031160",
        Category: DocCategory.Legal,
        DocName: "Giấy chứng nhận quyền sử dụng đất (Bản sao công chứng).pdf",
        StoragePath: "/docs/GCN_QSDDat.pdf",
        IsDigitized: true,
        UploadDate: "2024-06-10",
        Version: "v1.0",
        Size: "4.1 MB",
        FolderID: 'FLD-S-LEGAL',
        ISOStatus: ISO19650Status.S1
    },
    {
        DocID: 103,
        ReferenceID: "PR2400031160",
        ProjectID: "PR2400031160",
        Category: DocCategory.Legal,
        DocName: "Giấy phép xây dựng số 22/GPXD-SXD.pdf",
        StoragePath: "/docs/GPXD_22.pdf",
        IsDigitized: true,
        UploadDate: "2024-07-01",
        Version: "v1.0",
        Size: "1.5 MB",
        FolderID: 'FLD-S-LEGAL',
        ISOStatus: ISO19650Status.A1
    },
    // F2: DESIGN & SURVEY (Folder: 20. Thiết kế)
    {
        DocID: 201,
        ReferenceID: "PR2400031160",
        ProjectID: "PR2400031160",
        Category: DocCategory.BIM,
        DocName: "Báo cáo khảo sát địa chất công trình.docx",
        StoragePath: "/docs/BaoCao_DiaChat.docx",
        IsDigitized: true,
        UploadDate: "2024-07-15",
        Version: "v1.2",
        Size: "12.5 MB",
        FolderID: 'FLD-S-DESIGN',
        ISOStatus: ISO19650Status.S2
    },
    {
        DocID: 202,
        ReferenceID: "PR2400031160",
        ProjectID: "PR2400031160",
        Category: DocCategory.BIM,
        DocName: "Ban_ve_Kien_truc_Tong_the.pdf",
        StoragePath: "/docs/KT_TongThe.pdf",
        IsDigitized: true,
        UploadDate: "2024-08-01",
        Version: "v2.0",
        Size: "8.9 MB",
        FolderID: 'FLD-S-DESIGN',
        ISOStatus: ISO19650Status.S3
    },
    // F4: QUALITY (Folder: 30. QL Chất lượng)
    {
        DocID: 401,
        ReferenceID: "PR2400031160",
        ProjectID: "PR2400031160",
        Category: DocCategory.Quality,
        DocName: "Biên bản nghiệm thu vật liệu đầu vào (Thép Hòa Phát).pdf",
        StoragePath: "/docs/NT_Thep.pdf",
        IsDigitized: true,
        UploadDate: "2024-10-05",
        Version: "v1.0",
        Size: "1.8 MB",
        FolderID: 'FLD-S-QUALITY',
        ISOStatus: ISO19650Status.A1
    }
];

// 8. Tasks (Modified for Persistence)
const generateDefaultTasks = (): Task[] => {
    const tasks: Task[] = [];
    const today = new Date();
    const assignees = ["NV1001", "NV1001", "NV1001", "NV1002", "NV1005", "NV1033"];

    // Create generic tasks for the new real projects
    mockProjects.forEach((project, i) => {
        const assigneeId = assignees[i % assignees.length]; // Round-robin assignment, NV1001 gets ~50%

        if (project.Status === ProjectStatus.Preparation) {
            const dueDate = new Date(today);
            dueDate.setDate(today.getDate() + 5 + (i % 10)); // 5-15 days from now

            tasks.push({
                TaskID: `TSK-${project.ProjectID}-01`,
                Title: `Lập Báo cáo nghiên cứu khả thi ${project.ProjectName.substring(0, 40)}...`,
                Description: "Hoàn thiện hồ sơ trình Sở KHĐT thẩm định",
                ProjectID: project.ProjectID,
                AssigneeID: assigneeId,
                DueDate: dueDate.toISOString().split('T')[0],
                Status: i % 3 === 0 ? TaskStatus.InProgress : TaskStatus.Todo,
                Priority: i % 4 === 0 ? TaskPriority.Urgent : TaskPriority.High,
                TimelineStep: "1. Chuẩn bị dự án"
            });
        } else if (project.Status === ProjectStatus.Execution) {
            const dueDate1 = new Date(today);
            dueDate1.setDate(today.getDate() + 2 + (i % 7)); // 2-9 days from now

            tasks.push({
                TaskID: `TSK-${project.ProjectID}-02`,
                Title: `Giám sát thi công đợt ${new Date().getMonth() + 1}`,
                Description: "Kiểm tra hiện trường và nghiệm thu công việc xây dựng",
                ProjectID: project.ProjectID,
                AssigneeID: assigneeId,
                DueDate: dueDate1.toISOString().split('T')[0],
                Status: i % 2 === 0 ? TaskStatus.InProgress : TaskStatus.Todo,
                Priority: i % 5 === 0 ? TaskPriority.Urgent : TaskPriority.Medium,
                TimelineStep: "3. Thực hiện dự án - Thi công"
            });

            // Add more tasks for some projects
            if (i % 2 === 0) {
                const dueDate2 = new Date(today);
                dueDate2.setDate(today.getDate() + 10 + (i % 15));

                tasks.push({
                    TaskID: `TSK-${project.ProjectID}-03`,
                    Title: `Thanh toán đợt ${Math.floor(i / 2) + 1} - ${project.ProjectName.substring(0, 30)}`,
                    Description: "Chuẩn bị hồ sơ thanh toán và trình ký",
                    ProjectID: project.ProjectID,
                    AssigneeID: "NV1001",
                    DueDate: dueDate2.toISOString().split('T')[0],
                    Status: TaskStatus.Todo,
                    Priority: TaskPriority.High,
                    TimelineStep: "3. Thực hiện dự án - Thanh toán"
                });
            }
        }
    });

    // Add special tasks for NV1001
    tasks.push({
        TaskID: 'TSK-SPECIAL-001',
        Title: 'Họp giao ban tuần - Ban QLDA',
        Description: 'Báo cáo tiến độ các dự án và giải quyết vướng mắc',
        ProjectID: 'PR2400031160',
        AssigneeID: 'NV1001',
        DueDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        Status: TaskStatus.InProgress,
        Priority: TaskPriority.High,
        TimelineStep: '3. Thực hiện dự án'
    });

    tasks.push({
        TaskID: 'TSK-SPECIAL-002',
        Title: 'Rà soát báo cáo giải ngân quý 1/2026',
        Description: 'Tổng hợp số liệu và lập báo cáo trình Giám đốc Học viện CTQG HCM',
        ProjectID: 'DA7501924',
        AssigneeID: 'NV1001',
        DueDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        Status: TaskStatus.Todo,
        Priority: TaskPriority.Urgent,
        TimelineStep: '3. Thực hiện dự án - Báo cáo'
    });

    tasks.push({
        TaskID: 'TSK-SPECIAL-003',
        Title: 'Phê duyệt hồ sơ mời thầu gói XL-02',
        Description: 'Kiểm tra và ký duyệt HSMT trước khi đăng tải',
        ProjectID: 'PR2500060068',
        AssigneeID: 'NV1001',
        DueDate: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        Status: TaskStatus.InProgress,
        Priority: TaskPriority.Urgent,
        TimelineStep: '2. Lựa chọn nhà thầu'
    });

    // ============================================================
    // COMPREHENSIVE SAMPLE DATA FOR COMPLETED PROJECT
    // Project: DA7632186 - Tu bổ, tôn tạo Khu di tích Quốc gia đặc biệt Đại thi hào Nguyễn Du
    // This provides full lifecycle tasks across all NĐ 175 phases
    // ============================================================
    const completedProjectId = 'DA7632186';

    // PHASE 1: GIAI ĐOẠN CHUẨN BỊ DỰ ÁN (All completed)
    tasks.push(
        // 1.1 Lập đề xuất chương trình, dự án (ODA) - N/A for this project
        {
            TaskID: 'TSK-DA7632186-0101',
            Title: 'Xác định không thuộc nguồn ODA',
            Description: 'Xác nhận dự án sử dụng ngân sách tỉnh',
            ProjectID: completedProjectId,
            AssigneeID: 'NV1001',
            StartDate: '2021-01-10',
            DueDate: '2021-01-15',
            Status: TaskStatus.Done,
            Priority: TaskPriority.Medium,
            TimelineStep: 'PREP_ODA'
        },
        // 1.2 Lập, thẩm định Báo cáo NCTKT / Đề xuất chủ trương đầu tư
        {
            TaskID: 'TSK-DA7632186-0201',
            Title: 'Lập báo cáo đề xuất chủ trương đầu tư',
            Description: 'Xây dựng báo cáo đề xuất chủ trương đầu tư theo Luật ĐTC',
            ProjectID: completedProjectId,
            AssigneeID: 'NV1002',
            StartDate: '2021-01-15',
            DueDate: '2021-02-28',
            Status: TaskStatus.Done,
            Priority: TaskPriority.High,
            TimelineStep: 'PREP_POLICY'
        },
        {
            TaskID: 'TSK-DA7632186-0202',
            Title: 'Thẩm định chủ trương đầu tư tại Sở KHĐT',
            Description: 'Nộp hồ sơ và phối hợp thẩm định tại Sở KHĐT',
            ProjectID: completedProjectId,
            AssigneeID: 'NV1001',
            StartDate: '2021-03-01',
            DueDate: '2021-03-25',
            Status: TaskStatus.Done,
            Priority: TaskPriority.High,
            TimelineStep: 'PREP_POLICY'
        },
        {
            TaskID: 'TSK-DA7632186-0203',
            Title: 'Giám đốc Học viện phê duyệt chủ trương đầu tư',
            Description: 'QĐ phê duyệt chủ trương đầu tư số 456/QĐ-UBND',
            ProjectID: completedProjectId,
            AssigneeID: 'NV1001',
            StartDate: '2021-03-26',
            DueDate: '2021-04-05',
            Status: TaskStatus.Done,
            Priority: TaskPriority.Urgent,
            TimelineStep: 'PREP_POLICY'
        },
        // 1.3 Khảo sát xây dựng phục vụ lập dự án
        {
            TaskID: 'TSK-DA7632186-0301',
            Title: 'Khảo sát địa hình, địa chất khu vực dự án',
            Description: 'Khảo sát chi tiết địa hình, địa chất công trình',
            ProjectID: completedProjectId,
            AssigneeID: 'NV1005',
            StartDate: '2021-04-10',
            DueDate: '2021-05-15',
            Status: TaskStatus.Done,
            Priority: TaskPriority.Medium,
            TimelineStep: 'PREP_SURVEY'
        },
        {
            TaskID: 'TSK-DA7632186-0302',
            Title: 'Đánh giá hiện trạng di tích',
            Description: 'Khảo sát, đánh giá hiện trạng các hạng mục di tích cần tu bổ',
            ProjectID: completedProjectId,
            AssigneeID: 'NV1033',
            StartDate: '2021-04-15',
            DueDate: '2021-05-20',
            Status: TaskStatus.Done,
            Priority: TaskPriority.High,
            TimelineStep: 'PREP_SURVEY'
        },
        // 1.4 Lập, thẩm định, phê duyệt Quy hoạch xây dựng (N/A - đã có QH)
        {
            TaskID: 'TSK-DA7632186-0401',
            Title: 'Rà soát quy hoạch chi tiết đã được duyệt',
            Description: 'Xác nhận phù hợp với QH chi tiết 1/500 đã phê duyệt',
            ProjectID: completedProjectId,
            AssigneeID: 'NV1002',
            StartDate: '2021-05-01',
            DueDate: '2021-05-10',
            Status: TaskStatus.Done,
            Priority: TaskPriority.Medium,
            TimelineStep: 'PREP_PLANNING'
        },
        // 1.5 Lập, thẩm định Báo cáo NCKT / Báo cáo KT-KT
        {
            TaskID: 'TSK-DA7632186-0501',
            Title: 'Lập Báo cáo nghiên cứu khả thi dự án',
            Description: 'Thuê đơn vị tư vấn lập báo cáo NCKT theo NĐ175',
            ProjectID: completedProjectId,
            AssigneeID: 'NV1001',
            StartDate: '2021-05-25',
            DueDate: '2021-08-30',
            Status: TaskStatus.Done,
            Priority: TaskPriority.Urgent,
            TimelineStep: 'PREP_FEASIBILITY'
        },
        {
            TaskID: 'TSK-DA7632186-0502',
            Title: 'Thẩm định BC NCKT tại Sở Xây dựng',
            Description: 'Nộp hồ sơ và phối hợp thẩm định tại SXD',
            ProjectID: completedProjectId,
            AssigneeID: 'NV1002',
            StartDate: '2021-09-01',
            DueDate: '2021-10-15',
            Status: TaskStatus.Done,
            Priority: TaskPriority.High,
            TimelineStep: 'PREP_FEASIBILITY'
        },
        // 1.6 Quyết định đầu tư xây dựng
        {
            TaskID: 'TSK-DA7632186-0601',
            Title: 'Trình hồ sơ phê duyệt dự án',
            Description: 'Hoàn thiện hồ sơ trình Giám đốc Học viện CTQG HCM phê duyệt dự án',
            ProjectID: completedProjectId,
            AssigneeID: 'NV1001',
            StartDate: '2021-10-20',
            DueDate: '2021-11-05',
            Status: TaskStatus.Done,
            Priority: TaskPriority.Urgent,
            TimelineStep: 'PREP_DECISION'
        },
        {
            TaskID: 'TSK-DA7632186-0602',
            Title: 'Giám đốc Học viện ban hành QĐ phê duyệt dự án',
            Description: 'QĐ phê duyệt dự án đầu tư số 2156/QĐ-UBND',
            ProjectID: completedProjectId,
            AssigneeID: 'NV1001',
            StartDate: '2021-11-10',
            DueDate: '2021-11-20',
            Status: TaskStatus.Done,
            Priority: TaskPriority.Urgent,
            TimelineStep: 'PREP_DECISION'
        }
    );

    // PHASE 2: GIAI ĐOẠN THỰC HIỆN DỰ ÁN (All completed)
    tasks.push(
        // 2.1 Chuẩn bị mặt bằng xây dựng, rà phá bom mìn
        {
            TaskID: 'TSK-DA7632186-0701',
            Title: 'Rà phá bom mìn, vật nổ khu vực dự án',
            Description: 'Thuê đơn vị chuyên ngành rà phá bom mìn',
            ProjectID: completedProjectId,
            AssigneeID: 'NV1005',
            StartDate: '2021-12-01',
            DueDate: '2021-12-20',
            Status: TaskStatus.Done,
            Priority: TaskPriority.High,
            TimelineStep: 'IMPL_SITE'
        },
        {
            TaskID: 'TSK-DA7632186-0702',
            Title: 'Bàn giao mặt bằng thi công',
            Description: 'Lập biên bản bàn giao mặt bằng cho nhà thầu',
            ProjectID: completedProjectId,
            AssigneeID: 'NV1002',
            StartDate: '2021-12-21',
            DueDate: '2021-12-25',
            Status: TaskStatus.Done,
            Priority: TaskPriority.Medium,
            TimelineStep: 'IMPL_SITE'
        },
        // 2.2 Khảo sát xây dựng phục vụ thiết kế
        {
            TaskID: 'TSK-DA7632186-0801',
            Title: 'Khảo sát chi tiết phục vụ thiết kế BVTC',
            Description: 'Khảo sát bổ sung cho thiết kế bản vẽ thi công',
            ProjectID: completedProjectId,
            AssigneeID: 'NV1033',
            StartDate: '2022-01-05',
            DueDate: '2022-01-25',
            Status: TaskStatus.Done,
            Priority: TaskPriority.Medium,
            TimelineStep: 'IMPL_SURVEY'
        },
        // 2.3 Lập, thẩm định, phê duyệt Thiết kế & Dự toán
        {
            TaskID: 'TSK-DA7632186-0901',
            Title: 'Lập thiết kế bản vẽ thi công và dự toán',
            Description: 'Đơn vị tư vấn thiết kế thực hiện BVTC-DT',
            ProjectID: completedProjectId,
            AssigneeID: 'NV1001',
            StartDate: '2022-01-10',
            DueDate: '2022-03-30',
            Status: TaskStatus.Done,
            Priority: TaskPriority.Urgent,
            TimelineStep: 'IMPL_DESIGN'
        },
        {
            TaskID: 'TSK-DA7632186-0902',
            Title: 'Thẩm định thiết kế tại Sở Xây dựng',
            Description: 'Nộp hồ sơ thẩm định TK BVTC tại SXD',
            ProjectID: completedProjectId,
            AssigneeID: 'NV1002',
            StartDate: '2022-04-01',
            DueDate: '2022-04-25',
            Status: TaskStatus.Done,
            Priority: TaskPriority.High,
            TimelineStep: 'IMPL_DESIGN'
        },
        {
            TaskID: 'TSK-DA7632186-0903',
            Title: 'Phê duyệt thiết kế BVTC và dự toán',
            Description: 'CĐT phê duyệt TKBVTC-DT các gói thầu',
            ProjectID: completedProjectId,
            AssigneeID: 'NV1001',
            StartDate: '2022-04-26',
            DueDate: '2022-05-10',
            Status: TaskStatus.Done,
            Priority: TaskPriority.Urgent,
            TimelineStep: 'IMPL_DESIGN'
        },
        // 2.4 Cấp Giấy phép xây dựng
        {
            TaskID: 'TSK-DA7632186-1001',
            Title: 'Xin cấp giấy phép xây dựng',
            Description: 'Lập hồ sơ xin GPXD tại Sở Xây dựng',
            ProjectID: completedProjectId,
            AssigneeID: 'NV1005',
            StartDate: '2022-05-15',
            DueDate: '2022-06-10',
            Status: TaskStatus.Done,
            Priority: TaskPriority.High,
            TimelineStep: 'IMPL_PERMIT'
        },
        // 2.5 Lựa chọn nhà thầu và ký kết hợp đồng
        {
            TaskID: 'TSK-DA7632186-1101',
            Title: 'Lập kế hoạch lựa chọn nhà thầu',
            Description: 'Lập KHLCNT trình cấp có thẩm quyền phê duyệt',
            ProjectID: completedProjectId,
            AssigneeID: 'NV1001',
            StartDate: '2022-05-01',
            DueDate: '2022-05-20',
            Status: TaskStatus.Done,
            Priority: TaskPriority.High,
            TimelineStep: 'IMPL_BIDDING'
        },
        {
            TaskID: 'TSK-DA7632186-1102',
            Title: 'Tổ chức đấu thầu gói XL-01 Tu bổ Nhà thờ',
            Description: 'Đăng tải, mở thầu, đánh giá HSDT gói XL-01',
            ProjectID: completedProjectId,
            AssigneeID: 'NV1002',
            StartDate: '2022-05-25',
            DueDate: '2022-07-15',
            Status: TaskStatus.Done,
            Priority: TaskPriority.Urgent,
            TimelineStep: 'IMPL_BIDDING'
        },
        {
            TaskID: 'TSK-DA7632186-1103',
            Title: 'Ký hợp đồng với nhà thầu XL-01',
            Description: 'Đàm phán và ký hợp đồng với CT TNHH XD Hà Tĩnh',
            ProjectID: completedProjectId,
            AssigneeID: 'NV1001',
            StartDate: '2022-07-20',
            DueDate: '2022-07-30',
            Status: TaskStatus.Done,
            Priority: TaskPriority.Urgent,
            TimelineStep: 'IMPL_BIDDING'
        },
        // 2.6 Thi công xây dựng công trình
        {
            TaskID: 'TSK-DA7632186-1201',
            Title: 'Khởi công xây dựng công trình',
            Description: 'Tổ chức lễ khởi công dự án',
            ProjectID: completedProjectId,
            AssigneeID: 'NV1001',
            StartDate: '2022-08-01',
            DueDate: '2022-08-05',
            Status: TaskStatus.Done,
            Priority: TaskPriority.High,
            TimelineStep: 'IMPL_CONSTRUCTION'
        },
        {
            TaskID: 'TSK-DA7632186-1202',
            Title: 'Thi công tu bổ Nhà thờ chính',
            Description: 'Thi công các hạng mục tu bổ nhà thờ Nguyễn Du',
            ProjectID: completedProjectId,
            AssigneeID: 'NV1033',
            StartDate: '2022-08-10',
            DueDate: '2023-06-30',
            Status: TaskStatus.Done,
            Priority: TaskPriority.Urgent,
            TimelineStep: 'IMPL_CONSTRUCTION'
        },
        {
            TaskID: 'TSK-DA7632186-1203',
            Title: 'Thi công cải tạo cảnh quan sân vườn',
            Description: 'Cải tạo, tôn tạo hệ thống cảnh quan khu di tích',
            ProjectID: completedProjectId,
            AssigneeID: 'NV1005',
            StartDate: '2023-03-01',
            DueDate: '2023-08-30',
            Status: TaskStatus.Done,
            Priority: TaskPriority.High,
            TimelineStep: 'IMPL_CONSTRUCTION'
        },
        // 2.7 Giám sát thi công xây dựng
        {
            TaskID: 'TSK-DA7632186-1301',
            Title: 'Giám sát thi công gói XL-01',
            Description: 'Thực hiện giám sát toàn bộ quá trình thi công',
            ProjectID: completedProjectId,
            AssigneeID: 'NV1002',
            StartDate: '2022-08-10',
            DueDate: '2023-08-30',
            Status: TaskStatus.Done,
            Priority: TaskPriority.High,
            TimelineStep: 'IMPL_SUPERVISION'
        },
        {
            TaskID: 'TSK-DA7632186-1302',
            Title: 'Lập báo cáo giám sát hàng tháng',
            Description: 'Tổng hợp, báo cáo tiến độ và chất lượng thi công',
            ProjectID: completedProjectId,
            AssigneeID: 'NV1033',
            StartDate: '2022-09-01',
            DueDate: '2023-08-30',
            Status: TaskStatus.Done,
            Priority: TaskPriority.Medium,
            TimelineStep: 'IMPL_SUPERVISION'
        },
        // 2.8 Tạm ứng, thanh toán khối lượng hoàn thành
        {
            TaskID: 'TSK-DA7632186-1401',
            Title: 'Tạm ứng hợp đồng (20%)',
            Description: 'Thực hiện tạm ứng lần 1 theo hợp đồng',
            ProjectID: completedProjectId,
            AssigneeID: 'NV1001',
            StartDate: '2022-08-15',
            DueDate: '2022-08-25',
            Status: TaskStatus.Done,
            Priority: TaskPriority.High,
            TimelineStep: 'IMPL_PAYMENT'
        },
        {
            TaskID: 'TSK-DA7632186-1402',
            Title: 'Thanh toán khối lượng đợt 1',
            Description: 'Thanh toán 30% giá trị hợp đồng',
            ProjectID: completedProjectId,
            AssigneeID: 'NV1002',
            StartDate: '2023-02-01',
            DueDate: '2023-02-20',
            Status: TaskStatus.Done,
            Priority: TaskPriority.High,
            TimelineStep: 'IMPL_PAYMENT'
        },
        {
            TaskID: 'TSK-DA7632186-1403',
            Title: 'Thanh toán khối lượng đợt 2',
            Description: 'Thanh toán 40% giá trị hợp đồng',
            ProjectID: completedProjectId,
            AssigneeID: 'NV1001',
            StartDate: '2023-07-01',
            DueDate: '2023-07-20',
            Status: TaskStatus.Done,
            Priority: TaskPriority.High,
            TimelineStep: 'IMPL_PAYMENT'
        },
        // 2.9 Nghiệm thu hoàn thành công trình
        {
            TaskID: 'TSK-DA7632186-1501',
            Title: 'Nghiệm thu từng phần công trình',
            Description: 'Nghiệm thu các hạng mục theo tiến độ thi công',
            ProjectID: completedProjectId,
            AssigneeID: 'NV1033',
            StartDate: '2023-06-01',
            DueDate: '2023-08-25',
            Status: TaskStatus.Done,
            Priority: TaskPriority.High,
            TimelineStep: 'IMPL_ACCEPTANCE'
        },
        {
            TaskID: 'TSK-DA7632186-1502',
            Title: 'Nghiệm thu hoàn thành công trình',
            Description: 'Tổ chức nghiệm thu hoàn thành đưa vào sử dụng',
            ProjectID: completedProjectId,
            AssigneeID: 'NV1001',
            StartDate: '2023-09-01',
            DueDate: '2023-09-15',
            Status: TaskStatus.Done,
            Priority: TaskPriority.Urgent,
            TimelineStep: 'IMPL_ACCEPTANCE'
        }
    );

    // PHASE 3: GIAI ĐOẠN KẾT THÚC XÂY DỰNG (All completed)
    tasks.push(
        // 3.1 Quyết toán hợp đồng xây dựng
        {
            TaskID: 'TSK-DA7632186-1601',
            Title: 'Quyết toán hợp đồng XL-01',
            Description: 'Lập hồ sơ quyết toán hợp đồng với nhà thầu',
            ProjectID: completedProjectId,
            AssigneeID: 'NV1002',
            StartDate: '2023-09-20',
            DueDate: '2023-10-30',
            Status: TaskStatus.Done,
            Priority: TaskPriority.High,
            TimelineStep: 'CLOSE_CONTRACT_SETTLEMENT'
        },
        {
            TaskID: 'TSK-DA7632186-1602',
            Title: 'Thanh lý hợp đồng với nhà thầu',
            Description: 'Ký biên bản thanh lý hợp đồng',
            ProjectID: completedProjectId,
            AssigneeID: 'NV1001',
            StartDate: '2023-11-01',
            DueDate: '2023-11-15',
            Status: TaskStatus.Done,
            Priority: TaskPriority.Medium,
            TimelineStep: 'CLOSE_CONTRACT_SETTLEMENT'
        },
        // 3.2 Quyết toán vốn đầu tư dự án hoàn thành
        {
            TaskID: 'TSK-DA7632186-1701',
            Title: 'Lập báo cáo quyết toán vốn đầu tư',
            Description: 'Tổng hợp chi phí, lập BC quyết toán dự án hoàn thành',
            ProjectID: completedProjectId,
            AssigneeID: 'NV1001',
            StartDate: '2023-11-15',
            DueDate: '2023-12-30',
            Status: TaskStatus.Done,
            Priority: TaskPriority.Urgent,
            TimelineStep: 'CLOSE_CAPITAL_SETTLEMENT'
        },
        {
            TaskID: 'TSK-DA7632186-1702',
            Title: 'Kiểm toán quyết toán dự án',
            Description: 'Phối hợp cơ quan kiểm toán thực hiện',
            ProjectID: completedProjectId,
            AssigneeID: 'NV1002',
            StartDate: '2024-01-05',
            DueDate: '2024-02-28',
            Status: TaskStatus.Done,
            Priority: TaskPriority.High,
            TimelineStep: 'CLOSE_CAPITAL_SETTLEMENT'
        },
        {
            TaskID: 'TSK-DA7632186-1703',
            Title: 'Phê duyệt quyết toán dự án',
            Description: 'Giám đốc Học viện phê duyệt quyết toán dự án hoàn thành',
            ProjectID: completedProjectId,
            AssigneeID: 'NV1001',
            StartDate: '2024-03-01',
            DueDate: '2024-03-20',
            Status: TaskStatus.Done,
            Priority: TaskPriority.Urgent,
            TimelineStep: 'CLOSE_CAPITAL_SETTLEMENT'
        },
        // 3.3 Bàn giao công trình đưa vào sử dụng
        {
            TaskID: 'TSK-DA7632186-1801',
            Title: 'Lập hồ sơ bàn giao công trình',
            Description: 'Chuẩn bị hồ sơ, biên bản bàn giao cho đơn vị sử dụng',
            ProjectID: completedProjectId,
            AssigneeID: 'NV1033',
            StartDate: '2023-09-16',
            DueDate: '2023-09-25',
            Status: TaskStatus.Done,
            Priority: TaskPriority.High,
            TimelineStep: 'CLOSE_HANDOVER'
        },
        {
            TaskID: 'TSK-DA7632186-1802',
            Title: 'Tổ chức lễ khánh thành và bàn giao',
            Description: 'Tổ chức khánh thành, bàn giao cho Ban QL Di tích',
            ProjectID: completedProjectId,
            AssigneeID: 'NV1001',
            StartDate: '2023-09-26',
            DueDate: '2023-09-30',
            Status: TaskStatus.Done,
            Priority: TaskPriority.High,
            TimelineStep: 'CLOSE_HANDOVER'
        },
        // 3.4 Bảo hành công trình xây dựng
        {
            TaskID: 'TSK-DA7632186-1901',
            Title: 'Theo dõi công tác bảo hành 24 tháng',
            Description: 'Giám sát nhà thầu thực hiện nghĩa vụ bảo hành',
            ProjectID: completedProjectId,
            AssigneeID: 'NV1005',
            StartDate: '2023-10-01',
            DueDate: '2025-09-30',
            Status: TaskStatus.Done,
            Priority: TaskPriority.Medium,
            TimelineStep: 'CLOSE_WARRANTY'
        },
        {
            TaskID: 'TSK-DA7632186-1902',
            Title: 'Xác nhận hết thời hạn bảo hành',
            Description: 'Lập biên bản xác nhận hết bảo hành, hoàn trả bảo lãnh',
            ProjectID: completedProjectId,
            AssigneeID: 'NV1001',
            StartDate: '2025-10-01',
            DueDate: '2025-10-15',
            Status: TaskStatus.Done,
            Priority: TaskPriority.Medium,
            TimelineStep: 'CLOSE_WARRANTY'
        },
        // 3.5 Bàn giao hồ sơ lưu trữ
        {
            TaskID: 'TSK-DA7632186-2001',
            Title: 'Hoàn thiện hồ sơ hoàn công',
            Description: 'Tập hợp đầy đủ hồ sơ hoàn công công trình',
            ProjectID: completedProjectId,
            AssigneeID: 'NV1033',
            StartDate: '2023-09-20',
            DueDate: '2023-10-30',
            Status: TaskStatus.Done,
            Priority: TaskPriority.High,
            TimelineStep: 'CLOSE_ARCHIVE'
        },
        {
            TaskID: 'TSK-DA7632186-2002',
            Title: 'Bàn giao hồ sơ cho Kho lưu trữ',
            Description: 'Nộp hồ sơ dự án vào Kho lưu trữ tỉnh',
            ProjectID: completedProjectId,
            AssigneeID: 'NV1002',
            StartDate: '2024-04-01',
            DueDate: '2024-04-15',
            Status: TaskStatus.Done,
            Priority: TaskPriority.Medium,
            TimelineStep: 'CLOSE_ARCHIVE'
        }
    );

    // ============================================================
    // COMPREHENSIVE TASK DATA FOR NHÀ Ở HỌC VIÊN
    // Project: 0122118567000 - Xây dựng tòa nhà ở học viên
    // Nhóm B, 597 tỷ, 2021-2025, ĐÃ HOÀN THÀNH
    // 16 tầng + 2 tầng hầm, 135 Nguyễn Phong Sắc, Cầu Giấy, HN
    // ============================================================
    const nohvProjectId = '0122118567000';

    // PHASE 1: GIAI ĐOẠN CHUẨN BỊ DỰ ÁN (All completed, 2021)
    tasks.push(
        // 1.1 Báo cáo đề xuất chủ trương đầu tư (Nhóm B)
        {
            TaskID: 'TSK-NOHV-0101',
            Title: 'Lập Báo cáo đề xuất chủ trương đầu tư',
            Description: 'Lập BC đề xuất CTĐT dự án xây dựng tòa nhà ở học viên 16 tầng, trình Giám đốc Học viện',
            ProjectID: nohvProjectId,
            AssigneeID: 'NV1001',
            StartDate: '2021-01-10',
            DueDate: '2021-02-15',
            Status: TaskStatus.Done,
            Priority: TaskPriority.High,
            TimelineStep: 'PREP_POLICY',
            ProgressPercent: 100,
            IsCritical: true,
            OutputDocument: 'Báo cáo đề xuất chủ trương ĐT',
            LegalBasis: 'Đ34-35 Luật ĐTC 2019',
            DurationDays: 36
        },
        {
            TaskID: 'TSK-NOHV-0102',
            Title: 'Thẩm định Báo cáo đề xuất chủ trương đầu tư',
            Description: 'Sở KHĐT Hà Nội thẩm định BC đề xuất chủ trương ĐT',
            ProjectID: nohvProjectId,
            AssigneeID: 'NV1002',
            StartDate: '2021-02-20',
            DueDate: '2021-03-25',
            Status: TaskStatus.Done,
            Priority: TaskPriority.Urgent,
            TimelineStep: 'PREP_POLICY',
            ProgressPercent: 100,
            Dependencies: [{ TaskID: 'TSK-NOHV-0101', Type: 'FS' as const, LagDays: 3 }],
            DurationDays: 33
        },
        {
            TaskID: 'TSK-NOHV-0103',
            Title: 'Quyết định chủ trương đầu tư',
            Description: 'Giám đốc Học viện CTQG HCM ban hành QĐ phê duyệt chủ trương ĐT',
            ProjectID: nohvProjectId,
            AssigneeID: 'NV1001',
            StartDate: '2021-03-28',
            DueDate: '2021-04-05',
            Status: TaskStatus.Done,
            Priority: TaskPriority.Urgent,
            TimelineStep: 'PREP_POLICY',
            ProgressPercent: 100,
            IsCritical: true,
            Dependencies: [{ TaskID: 'TSK-NOHV-0102', Type: 'FS' as const, LagDays: 2 }],
            OutputDocument: 'QĐ phê duyệt chủ trương ĐT'
        },

        // 1.2 Khảo sát xây dựng phục vụ lập dự án
        {
            TaskID: 'TSK-NOHV-0201',
            Title: 'Khảo sát địa hình khu đất 135 Nguyễn Phong Sắc',
            Description: 'Khảo sát địa hình 1/500, xác định ranh giới khu đất 7.543 m²',
            ProjectID: nohvProjectId,
            AssigneeID: 'NV1033',
            StartDate: '2021-03-15',
            DueDate: '2021-04-15',
            Status: TaskStatus.Done,
            Priority: TaskPriority.Medium,
            TimelineStep: 'PREP_SURVEY',
            ProgressPercent: 100,
            Dependencies: [{ TaskID: 'TSK-NOHV-0101', Type: 'SS' as const, LagDays: 45 }],
            Assignees: [
                { EmployeeID: 'NV1033', AllocationPercent: 50, Role: 'Lead' },
                { EmployeeID: 'NV1034', AllocationPercent: 40, Role: 'Support' }
            ]
        },
        {
            TaskID: 'TSK-NOHV-0202',
            Title: 'Khảo sát địa chất công trình',
            Description: 'Khoan thăm dò 20 hố khoan, thí nghiệm đất nền cho tòa nhà 16 tầng + 2 hầm',
            ProjectID: nohvProjectId,
            AssigneeID: 'NV1034',
            StartDate: '2021-04-01',
            DueDate: '2021-05-20',
            Status: TaskStatus.Done,
            Priority: TaskPriority.High,
            TimelineStep: 'PREP_SURVEY',
            ProgressPercent: 100,
            Dependencies: [{ TaskID: 'TSK-NOHV-0201', Type: 'SS' as const, LagDays: 17 }],
            EstimatedCost: 850000000,
            DurationDays: 49
        },

        // 1.3 Quy hoạch xây dựng
        {
            TaskID: 'TSK-NOHV-0301',
            Title: 'Rà soát quy hoạch chi tiết khu vực Cầu Giấy',
            Description: 'Kiểm tra phù hợp QH phân khu, QH chi tiết 1/500 khu vực Nghĩa Tân',
            ProjectID: nohvProjectId,
            AssigneeID: 'NV1002',
            StartDate: '2021-04-20',
            DueDate: '2021-05-10',
            Status: TaskStatus.Done,
            Priority: TaskPriority.Medium,
            TimelineStep: 'PREP_PLANNING',
            ProgressPercent: 100,
            OutputDocument: 'Văn bản xác nhận phù hợp QH'
        },

        // 1.4 Lập, thẩm định BC NCKT (Nhóm B)
        {
            TaskID: 'TSK-NOHV-0401',
            Title: 'Lập Báo cáo nghiên cứu khả thi + Thiết kế cơ sở',
            Description: 'Lập BCNCKT và TKCS tòa nhà 16 tầng, 2 hầm; 606 phòng ở; diện tích sàn 35.119 m²',
            ProjectID: nohvProjectId,
            AssigneeID: 'NV1027',
            StartDate: '2021-05-15',
            DueDate: '2021-08-30',
            Status: TaskStatus.Done,
            Priority: TaskPriority.High,
            TimelineStep: 'PREP_FEASIBILITY',
            ProgressPercent: 100,
            IsCritical: true,
            Dependencies: [
                { TaskID: 'TSK-NOHV-0202', Type: 'FS' as const, LagDays: 0 },
                { TaskID: 'TSK-NOHV-0301', Type: 'FS' as const, LagDays: 5 }
            ],
            Assignees: [
                { EmployeeID: 'NV1027', AllocationPercent: 40, Role: 'Lead' },
                { EmployeeID: 'NV1033', AllocationPercent: 30, Role: 'Support' },
                { EmployeeID: 'NV1034', AllocationPercent: 20, Role: 'Support' }
            ],
            EstimatedCost: 3500000000,
            DurationDays: 107,
            LegalBasis: 'Đ14 NĐ 175'
        },
        {
            TaskID: 'TSK-NOHV-0402',
            Title: 'Thẩm định BCNCKT tại Sở Xây dựng Hà Nội',
            Description: 'Sở XD thẩm định TKCS, Bộ XD thẩm tra PCCC, thẩm duyệt môi trường',
            ProjectID: nohvProjectId,
            AssigneeID: 'NV1005',
            StartDate: '2021-09-05',
            DueDate: '2021-10-15',
            Status: TaskStatus.Done,
            Priority: TaskPriority.Urgent,
            TimelineStep: 'PREP_FEASIBILITY',
            ProgressPercent: 100,
            Dependencies: [{ TaskID: 'TSK-NOHV-0401', Type: 'FS' as const, LagDays: 5 }],
            DurationDays: 40,
            LegalBasis: 'K1 Đ22 NĐ 175'
        },
        {
            TaskID: 'TSK-NOHV-0403',
            Title: 'Hoàn thiện hồ sơ BCNCKT theo ý kiến thẩm định',
            Description: 'Chỉnh sửa thiết kế PCCC, bổ sung giải pháp chống ngập tầng hầm',
            ProjectID: nohvProjectId,
            AssigneeID: 'NV1027',
            StartDate: '2021-10-18',
            DueDate: '2021-11-05',
            Status: TaskStatus.Done,
            Priority: TaskPriority.High,
            TimelineStep: 'PREP_FEASIBILITY',
            ProgressPercent: 100,
            Dependencies: [{ TaskID: 'TSK-NOHV-0402', Type: 'FS' as const, LagDays: 2 }]
        },

        // 1.5 QĐ phê duyệt dự án
        {
            TaskID: 'TSK-NOHV-0501',
            Title: 'Trình phê duyệt dự án đầu tư xây dựng',
            Description: 'Trình Giám đốc Học viện phê duyệt DA với tổng mức ĐT 597 tỷ đồng',
            ProjectID: nohvProjectId,
            AssigneeID: 'NV1001',
            StartDate: '2021-11-10',
            DueDate: '2021-11-25',
            Status: TaskStatus.Done,
            Priority: TaskPriority.Urgent,
            TimelineStep: 'PREP_DECISION',
            ProgressPercent: 100,
            Dependencies: [{ TaskID: 'TSK-NOHV-0403', Type: 'FS' as const, LagDays: 4 }],
            OutputDocument: 'QĐ 8567-QĐ/HVCTQG phê duyệt DAXD',
            IsCritical: true
        }
    );

    // PHASE 2: GIAI ĐOẠN THỰC HIỆN DỰ ÁN (2022-2025)
    tasks.push(
        // 2.1 Chuẩn bị mặt bằng xây dựng
        {
            TaskID: 'TSK-NOHV-0601',
            Title: 'Phá dỡ công trình cũ trên khu đất',
            Description: 'Phá dỡ nhà cấp 4 và công trình phụ trợ cũ trong khu đất 7.543 m²',
            ProjectID: nohvProjectId,
            AssigneeID: 'NV1033',
            StartDate: '2022-01-10',
            DueDate: '2022-02-28',
            Status: TaskStatus.Done,
            Priority: TaskPriority.High,
            TimelineStep: 'IMPL_SITE',
            ProgressPercent: 100,
            Dependencies: [{ TaskID: 'TSK-NOHV-0501', Type: 'FS' as const, LagDays: 45 }],
            EstimatedCost: 1200000000,
            DurationDays: 49
        },
        {
            TaskID: 'TSK-NOHV-0602',
            Title: 'San nền, gia cố mặt bằng thi công',
            Description: 'Đào đất, san lấp, gia cố nền đất yếu khu vực tầng hầm',
            ProjectID: nohvProjectId,
            AssigneeID: 'NV1034',
            StartDate: '2022-03-01',
            DueDate: '2022-03-31',
            Status: TaskStatus.Done,
            Priority: TaskPriority.High,
            TimelineStep: 'IMPL_SITE',
            ProgressPercent: 100,
            Dependencies: [{ TaskID: 'TSK-NOHV-0601', Type: 'FS' as const, LagDays: 1 }]
        },
        {
            TaskID: 'TSK-NOHV-0603',
            Title: 'Bàn giao mặt bằng sạch cho thi công',
            Description: 'Nghiệm thu và bàn giao mặt bằng sạch 4.179 m² cho nhà thầu',
            ProjectID: nohvProjectId,
            AssigneeID: 'NV1001',
            StartDate: '2022-04-01',
            DueDate: '2022-04-10',
            Status: TaskStatus.Done,
            Priority: TaskPriority.Urgent,
            TimelineStep: 'IMPL_SITE',
            ProgressPercent: 100,
            IsCritical: true,
            Dependencies: [{ TaskID: 'TSK-NOHV-0602', Type: 'FS' as const, LagDays: 1 }]
        },

        // 2.2 Khảo sát xây dựng phục vụ thiết kế
        {
            TaskID: 'TSK-NOHV-0701',
            Title: 'Khảo sát bổ sung địa chất phục vụ TKBVTC',
            Description: 'Khảo sát bổ sung vị trí móng cọc khoan nhồi, thí nghiệm SPT',
            ProjectID: nohvProjectId,
            AssigneeID: 'NV1034',
            StartDate: '2022-01-15',
            DueDate: '2022-02-20',
            Status: TaskStatus.Done,
            Priority: TaskPriority.Medium,
            TimelineStep: 'IMPL_SURVEY',
            ProgressPercent: 100,
            Dependencies: [{ TaskID: 'TSK-NOHV-0501', Type: 'FS' as const, LagDays: 50 }]
        },

        // 2.3 Thiết kế xây dựng & Dự toán (Nhóm B: TKXD triển khai sau TKCS)
        {
            TaskID: 'TSK-NOHV-0801',
            Title: 'Lập hồ sơ thiết kế xây dựng triển khai',
            Description: 'Thiết kế kỹ thuật + BVTC: kết cấu khung BTCT, 2 hầm + 16 tầng, 606 phòng ở',
            ProjectID: nohvProjectId,
            AssigneeID: 'NV1027',
            StartDate: '2022-01-20',
            DueDate: '2022-04-30',
            Status: TaskStatus.Done,
            Priority: TaskPriority.High,
            TimelineStep: 'IMPL_DESIGN',
            ProgressPercent: 100,
            IsCritical: true,
            Dependencies: [
                { TaskID: 'TSK-NOHV-0501', Type: 'FS' as const, LagDays: 55 },
                { TaskID: 'TSK-NOHV-0701', Type: 'SS' as const, LagDays: 5 }
            ],
            Assignees: [
                { EmployeeID: 'NV1027', AllocationPercent: 40, Role: 'Lead' },
                { EmployeeID: 'NV1033', AllocationPercent: 30, Role: 'Support' }
            ],
            EstimatedCost: 5200000000,
            DurationDays: 100,
            LegalBasis: 'Đ79-83 Luật XD 2014'
        },
        {
            TaskID: 'TSK-NOHV-0802',
            Title: 'Thẩm định TKXD tại Sở Xây dựng Hà Nội',
            Description: 'Sở XD thẩm định TKKT, PCCC, điện nước, thang máy',
            ProjectID: nohvProjectId,
            AssigneeID: 'NV1005',
            StartDate: '2022-05-05',
            DueDate: '2022-06-15',
            Status: TaskStatus.Done,
            Priority: TaskPriority.High,
            TimelineStep: 'IMPL_DESIGN',
            ProgressPercent: 100,
            Dependencies: [{ TaskID: 'TSK-NOHV-0801', Type: 'FS' as const, LagDays: 4 }],
            DurationDays: 41
        },
        {
            TaskID: 'TSK-NOHV-0803',
            Title: 'Phê duyệt thiết kế XD và dự toán',
            Description: 'CĐT phê duyệt TKXD toàn bộ 17 gói thầu, tổng dự toán 429,6 tỷ phần XD',
            ProjectID: nohvProjectId,
            AssigneeID: 'NV1001',
            StartDate: '2022-06-20',
            DueDate: '2022-07-05',
            Status: TaskStatus.Done,
            Priority: TaskPriority.Urgent,
            TimelineStep: 'IMPL_DESIGN',
            ProgressPercent: 100,
            IsCritical: true,
            Dependencies: [{ TaskID: 'TSK-NOHV-0802', Type: 'FS' as const, LagDays: 4 }],
            OutputDocument: 'QĐ phê duyệt TKXD & Dự toán'
        },

        // 2.4 Cấp Giấy phép xây dựng
        {
            TaskID: 'TSK-NOHV-0901',
            Title: 'Xin cấp Giấy phép xây dựng tại Sở XD HN',
            Description: 'Nộp hồ sơ xin GPXD công trình 16 tầng + 2 hầm tại Sở XD Hà Nội',
            ProjectID: nohvProjectId,
            AssigneeID: 'NV1005',
            StartDate: '2022-07-10',
            DueDate: '2022-08-15',
            Status: TaskStatus.Done,
            Priority: TaskPriority.High,
            TimelineStep: 'IMPL_PERMIT',
            ProgressPercent: 100,
            Dependencies: [{ TaskID: 'TSK-NOHV-0803', Type: 'FS' as const, LagDays: 5 }],
            OutputDocument: 'Giấy phép xây dựng số 789/GPXD',
            DurationDays: 36
        },

        // 2.5 Lựa chọn nhà thầu và ký kết hợp đồng
        {
            TaskID: 'TSK-NOHV-1001',
            Title: 'Lập Kế hoạch lựa chọn nhà thầu (KHLCNT)',
            Description: 'Lập KHLCNT cho toàn bộ 17 gói thầu, trình Giám đốc Học viện phê duyệt',
            ProjectID: nohvProjectId,
            AssigneeID: 'NV1002',
            StartDate: '2022-07-15',
            DueDate: '2022-08-10',
            Status: TaskStatus.Done,
            Priority: TaskPriority.High,
            TimelineStep: 'IMPL_BIDDING',
            ProgressPercent: 100,
            Dependencies: [{ TaskID: 'TSK-NOHV-0803', Type: 'FS' as const, LagDays: 10 }],
            OutputDocument: 'QĐ phê duyệt KHLCNT toàn dự án',
            LegalBasis: 'Đ36-39 Luật Đấu thầu 2023'
        },
        {
            TaskID: 'TSK-NOHV-1002',
            Title: 'Tổ chức đấu thầu gói XL-01 (Xây thô + hoàn thiện)',
            Description: 'Đấu thầu rộng rãi, 1 giai đoạn 1 túi hồ sơ, giá gói 169,8 tỷ',
            ProjectID: nohvProjectId,
            AssigneeID: 'NV1002',
            StartDate: '2022-08-15',
            DueDate: '2022-10-15',
            Status: TaskStatus.Done,
            Priority: TaskPriority.Urgent,
            TimelineStep: 'IMPL_BIDDING',
            ProgressPercent: 100,
            IsCritical: true,
            Dependencies: [{ TaskID: 'TSK-NOHV-1001', Type: 'FS' as const, LagDays: 5 }],
            DurationDays: 61
        },
        {
            TaskID: 'TSK-NOHV-1003',
            Title: 'Tổ chức đấu thầu gói XL-02 (Cơ điện + PCCC)',
            Description: 'Đấu thầu gói cơ điện, thang máy, PCCC, điều hòa, giá gói 89,3 tỷ',
            ProjectID: nohvProjectId,
            AssigneeID: 'NV1015',
            StartDate: '2022-09-01',
            DueDate: '2022-11-10',
            Status: TaskStatus.Done,
            Priority: TaskPriority.High,
            TimelineStep: 'IMPL_BIDDING',
            ProgressPercent: 100,
            Dependencies: [{ TaskID: 'TSK-NOHV-1001', Type: 'FS' as const, LagDays: 20 }],
            DurationDays: 70
        },
        {
            TaskID: 'TSK-NOHV-1004',
            Title: 'Ký hợp đồng với nhà thầu chính (XL-01, XL-02)',
            Description: 'Đàm phán và ký HĐ trọn gói với nhà thầu trúng thầu',
            ProjectID: nohvProjectId,
            AssigneeID: 'NV1001',
            StartDate: '2022-10-20',
            DueDate: '2022-11-15',
            Status: TaskStatus.Done,
            Priority: TaskPriority.Urgent,
            TimelineStep: 'IMPL_BIDDING',
            ProgressPercent: 100,
            IsCritical: true,
            Dependencies: [
                { TaskID: 'TSK-NOHV-1002', Type: 'FS' as const, LagDays: 5 },
                { TaskID: 'TSK-NOHV-1003', Type: 'FS' as const, LagDays: 5 }
            ],
            OutputDocument: 'Hợp đồng xây lắp XL-01, XL-02'
        },
        {
            TaskID: 'TSK-NOHV-1005',
            Title: 'Lựa chọn nhà thầu tư vấn giám sát',
            Description: 'Chỉ định thầu TV giám sát thi công (theo Đ22 Luật ĐT)',
            ProjectID: nohvProjectId,
            AssigneeID: 'NV1002',
            StartDate: '2022-09-15',
            DueDate: '2022-10-15',
            Status: TaskStatus.Done,
            Priority: TaskPriority.Medium,
            TimelineStep: 'IMPL_BIDDING',
            ProgressPercent: 100,
            Dependencies: [{ TaskID: 'TSK-NOHV-1001', Type: 'FS' as const, LagDays: 35 }]
        },

        // 2.6 Thi công xây dựng công trình
        {
            TaskID: 'TSK-NOHV-1101',
            Title: 'Khởi công xây dựng tòa nhà ở học viên',
            Description: 'Tổ chức lễ khởi công, triển khai thi công phần hầm',
            ProjectID: nohvProjectId,
            AssigneeID: 'NV1001',
            StartDate: '2022-11-20',
            DueDate: '2022-11-25',
            Status: TaskStatus.Done,
            Priority: TaskPriority.Urgent,
            TimelineStep: 'IMPL_CONSTRUCTION',
            ProgressPercent: 100,
            IsCritical: true,
            Dependencies: [
                { TaskID: 'TSK-NOHV-1004', Type: 'FS' as const, LagDays: 5 },
                { TaskID: 'TSK-NOHV-0603', Type: 'FS' as const, LagDays: 0 },
                { TaskID: 'TSK-NOHV-0901', Type: 'FS' as const, LagDays: 0 }
            ]
        },
        {
            TaskID: 'TSK-NOHV-1102',
            Title: 'Thi công tường vây, phần hầm (2 tầng hầm)',
            Description: 'Thi công tường vây, đào đất hầm, đổ BT sàn hầm B2, B1 (8.579 m² sàn hầm)',
            ProjectID: nohvProjectId,
            AssigneeID: 'NV1033',
            StartDate: '2022-11-25',
            DueDate: '2023-04-30',
            Status: TaskStatus.Done,
            Priority: TaskPriority.High,
            TimelineStep: 'IMPL_CONSTRUCTION',
            ProgressPercent: 100,
            IsCritical: true,
            Dependencies: [{ TaskID: 'TSK-NOHV-1101', Type: 'FS' as const, LagDays: 0 }],
            DurationDays: 156,
            EstimatedCost: 45000000000
        },
        {
            TaskID: 'TSK-NOHV-1103',
            Title: 'Thi công phần thân (16 tầng nổi)',
            Description: 'Thi công kết cấu khung BTCT, sàn, tường, cầu thang 16 tầng (cao 64,4m)',
            ProjectID: nohvProjectId,
            AssigneeID: 'NV1034',
            StartDate: '2023-05-01',
            DueDate: '2024-03-31',
            Status: TaskStatus.Done,
            Priority: TaskPriority.High,
            TimelineStep: 'IMPL_CONSTRUCTION',
            ProgressPercent: 100,
            IsCritical: true,
            Dependencies: [{ TaskID: 'TSK-NOHV-1102', Type: 'FS' as const, LagDays: 1 }],
            DurationDays: 335,
            EstimatedCost: 95000000000
        },
        {
            TaskID: 'TSK-NOHV-1104',
            Title: 'Thi công hoàn thiện kiến trúc (trát, sơn, ốp lát)',
            Description: 'Hoàn thiện bên trong 606 phòng ở, hành lang, sảnh, tiện ích tầng 1',
            ProjectID: nohvProjectId,
            AssigneeID: 'NV1033',
            StartDate: '2024-01-15',
            DueDate: '2024-08-31',
            Status: TaskStatus.Done,
            Priority: TaskPriority.High,
            TimelineStep: 'IMPL_CONSTRUCTION',
            ProgressPercent: 100,
            Dependencies: [{ TaskID: 'TSK-NOHV-1103', Type: 'SS' as const, LagDays: -75 }],
            DurationDays: 229,
            EstimatedCost: 35000000000
        },
        {
            TaskID: 'TSK-NOHV-1105',
            Title: 'Thi công hệ thống cơ điện, thang máy, PCCC',
            Description: 'Lắp đặt 4 thang máy, hệ M&E, PCCC, điều hòa trung tâm',
            ProjectID: nohvProjectId,
            AssigneeID: 'NV1034',
            StartDate: '2024-02-01',
            DueDate: '2024-10-15',
            Status: TaskStatus.Done,
            Priority: TaskPriority.High,
            TimelineStep: 'IMPL_CONSTRUCTION',
            ProgressPercent: 100,
            Dependencies: [{ TaskID: 'TSK-NOHV-1103', Type: 'SS' as const, LagDays: -60 }],
            EstimatedCost: 85000000000
        },
        {
            TaskID: 'TSK-NOHV-1106',
            Title: 'Thi công hạ tầng kỹ thuật, sân vườn, cảnh quan',
            Description: 'San nền, đường nội bộ, cây xanh, hệ thống thoát nước, chiếu sáng ngoài nhà',
            ProjectID: nohvProjectId,
            AssigneeID: 'NV1033',
            StartDate: '2024-06-01',
            DueDate: '2024-11-30',
            Status: TaskStatus.Done,
            Priority: TaskPriority.Medium,
            TimelineStep: 'IMPL_CONSTRUCTION',
            ProgressPercent: 100,
            Dependencies: [{ TaskID: 'TSK-NOHV-1104', Type: 'SS' as const, LagDays: 0 }],
            EstimatedCost: 15000000000
        },

        // 2.7 Giám sát thi công
        {
            TaskID: 'TSK-NOHV-1201',
            Title: 'Triển khai giám sát thi công toàn dự án',
            Description: 'TV giám sát hiện trường theo Điều 120 Luật XD, kiểm tra chất lượng hàng ngày',
            ProjectID: nohvProjectId,
            AssigneeID: 'NV1027',
            StartDate: '2022-11-20',
            DueDate: '2025-01-15',
            Status: TaskStatus.Done,
            Priority: TaskPriority.High,
            TimelineStep: 'IMPL_SUPERVISION',
            ProgressPercent: 100,
            Dependencies: [{ TaskID: 'TSK-NOHV-1101', Type: 'SS' as const, LagDays: 0 }],
            Assignees: [
                { EmployeeID: 'NV1027', AllocationPercent: 30, Role: 'Lead' },
                { EmployeeID: 'NV1033', AllocationPercent: 50, Role: 'Field' },
                { EmployeeID: 'NV1034', AllocationPercent: 40, Role: 'Field' }
            ],
            LegalBasis: 'Đ120 Luật XD 2014'
        },

        // 2.8 Tạm ứng, thanh toán
        {
            TaskID: 'TSK-NOHV-1301',
            Title: 'Tạm ứng hợp đồng XL-01 (15%)',
            Description: 'Lập hồ sơ tạm ứng 15% giá trị HĐ XL-01 = 25,47 tỷ',
            ProjectID: nohvProjectId,
            AssigneeID: 'NV1015',
            StartDate: '2022-12-01',
            DueDate: '2022-12-20',
            Status: TaskStatus.Done,
            Priority: TaskPriority.Urgent,
            TimelineStep: 'IMPL_PAYMENT',
            ProgressPercent: 100,
            Dependencies: [{ TaskID: 'TSK-NOHV-1004', Type: 'FS' as const, LagDays: 15 }],
            EstimatedCost: 25470000000
        },
        {
            TaskID: 'TSK-NOHV-1302',
            Title: 'Thanh toán đợt 1 - Phần hầm hoàn thành',
            Description: 'Nghiệm thu và thanh toán KLHT phần hầm 2 tầng',
            ProjectID: nohvProjectId,
            AssigneeID: 'NV1015',
            StartDate: '2023-05-10',
            DueDate: '2023-05-31',
            Status: TaskStatus.Done,
            Priority: TaskPriority.High,
            TimelineStep: 'IMPL_PAYMENT',
            ProgressPercent: 100,
            Dependencies: [{ TaskID: 'TSK-NOHV-1102', Type: 'FS' as const, LagDays: 10 }],
            EstimatedCost: 40000000000
        },
        {
            TaskID: 'TSK-NOHV-1303',
            Title: 'Thanh toán đợt 2 - Phần thân tầng 1-8',
            Description: 'Thanh toán khối lượng thi công kết cấu tầng 1 đến tầng 8',
            ProjectID: nohvProjectId,
            AssigneeID: 'NV1015',
            StartDate: '2023-11-15',
            DueDate: '2023-12-10',
            Status: TaskStatus.Done,
            Priority: TaskPriority.High,
            TimelineStep: 'IMPL_PAYMENT',
            ProgressPercent: 100,
            EstimatedCost: 55000000000
        },
        {
            TaskID: 'TSK-NOHV-1304',
            Title: 'Thanh toán đợt 3 - Toàn bộ phần thân + cơ điện',
            Description: 'Thanh toán KLHT phần thân 16 tầng và hệ thống M&E',
            ProjectID: nohvProjectId,
            AssigneeID: 'NV1015',
            StartDate: '2024-11-01',
            DueDate: '2024-11-30',
            Status: TaskStatus.Done,
            Priority: TaskPriority.High,
            TimelineStep: 'IMPL_PAYMENT',
            ProgressPercent: 100,
            EstimatedCost: 120000000000
        },

        // 2.9 Nghiệm thu hoàn thành
        {
            TaskID: 'TSK-NOHV-1401',
            Title: 'Nghiệm thu hoàn thành hạng mục kết cấu',
            Description: 'Hội đồng nghiệm thu kiểm tra chất lượng kết cấu BTCT 16 tầng',
            ProjectID: nohvProjectId,
            AssigneeID: 'NV1027',
            StartDate: '2024-10-15',
            DueDate: '2024-11-10',
            Status: TaskStatus.Done,
            Priority: TaskPriority.High,
            TimelineStep: 'IMPL_ACCEPTANCE',
            ProgressPercent: 100,
            Dependencies: [{ TaskID: 'TSK-NOHV-1103', Type: 'FS' as const, LagDays: 197 }]
        },
        {
            TaskID: 'TSK-NOHV-1402',
            Title: 'Kiểm tra PCCC trước khi đưa vào sử dụng',
            Description: 'Phòng Cảnh sát PC&CC Hà Nội kiểm tra và cấp GCN đủ điều kiện PCCC',
            ProjectID: nohvProjectId,
            AssigneeID: 'NV1005',
            StartDate: '2024-12-01',
            DueDate: '2024-12-20',
            Status: TaskStatus.Done,
            Priority: TaskPriority.Urgent,
            TimelineStep: 'IMPL_ACCEPTANCE',
            ProgressPercent: 100,
            OutputDocument: 'GCN đủ điều kiện PCCC',
            IsCritical: true
        },
        {
            TaskID: 'TSK-NOHV-1403',
            Title: 'Nghiệm thu hoàn thành công trình đưa vào sử dụng',
            Description: 'Hội đồng nghiệm thu Nhà nước kiểm tra, nghiệm thu toàn bộ công trình',
            ProjectID: nohvProjectId,
            AssigneeID: 'NV1001',
            StartDate: '2025-01-05',
            DueDate: '2025-01-25',
            Status: TaskStatus.Done,
            Priority: TaskPriority.Urgent,
            TimelineStep: 'IMPL_ACCEPTANCE',
            ProgressPercent: 100,
            IsCritical: true,
            Dependencies: [
                { TaskID: 'TSK-NOHV-1401', Type: 'FS' as const, LagDays: 55 },
                { TaskID: 'TSK-NOHV-1402', Type: 'FS' as const, LagDays: 15 }
            ],
            OutputDocument: 'Biên bản NTHTTCTRĐVSD',
            LegalBasis: 'Đ123-124 Luật XD 2014'
        }
    );

    // PHASE 3: GIAI ĐOẠN KẾT THÚC XÂY DỰNG (2025)
    tasks.push(
        // 3.1 Quyết toán hợp đồng xây dựng
        {
            TaskID: 'TSK-NOHV-1501',
            Title: 'Quyết toán hợp đồng XL-01 (Xây thô + hoàn thiện)',
            Description: 'Lập hồ sơ quyết toán A-B, đối chiếu khối lượng, đơn giá HĐ XL-01',
            ProjectID: nohvProjectId,
            AssigneeID: 'NV1002',
            StartDate: '2025-02-01',
            DueDate: '2025-03-15',
            Status: TaskStatus.Done,
            Priority: TaskPriority.High,
            TimelineStep: 'CLOSE_CONTRACT_SETTLEMENT',
            ProgressPercent: 100,
            Dependencies: [{ TaskID: 'TSK-NOHV-1403', Type: 'FS' as const, LagDays: 7 }],
            DurationDays: 42
        },
        {
            TaskID: 'TSK-NOHV-1502',
            Title: 'Quyết toán hợp đồng XL-02 (Cơ điện, PCCC)',
            Description: 'Quyết toán A-B gói cơ điện, thang máy, PCCC',
            ProjectID: nohvProjectId,
            AssigneeID: 'NV1015',
            StartDate: '2025-02-15',
            DueDate: '2025-03-31',
            Status: TaskStatus.Done,
            Priority: TaskPriority.High,
            TimelineStep: 'CLOSE_CONTRACT_SETTLEMENT',
            ProgressPercent: 100,
            DurationDays: 44
        },
        {
            TaskID: 'TSK-NOHV-1503',
            Title: 'Thanh lý toàn bộ hợp đồng với nhà thầu',
            Description: 'Ký biên bản thanh lý 17 hợp đồng, hoàn trả bảo lãnh thực hiện HĐ',
            ProjectID: nohvProjectId,
            AssigneeID: 'NV1001',
            StartDate: '2025-04-01',
            DueDate: '2025-04-30',
            Status: TaskStatus.Done,
            Priority: TaskPriority.High,
            TimelineStep: 'CLOSE_CONTRACT_SETTLEMENT',
            ProgressPercent: 100,
            Dependencies: [
                { TaskID: 'TSK-NOHV-1501', Type: 'FS' as const, LagDays: 17 },
                { TaskID: 'TSK-NOHV-1502', Type: 'FS' as const, LagDays: 1 }
            ]
        },

        // 3.2 Quyết toán vốn đầu tư dự án hoàn thành
        {
            TaskID: 'TSK-NOHV-1601',
            Title: 'Lập Báo cáo quyết toán vốn đầu tư dự án hoàn thành',
            Description: 'Tổng hợp toàn bộ chi phí dự án, lập BC quyết toán trình Giám đốc Học viện',
            ProjectID: nohvProjectId,
            AssigneeID: 'NV1002',
            StartDate: '2025-05-01',
            DueDate: '2025-06-30',
            Status: TaskStatus.Done,
            Priority: TaskPriority.Urgent,
            TimelineStep: 'CLOSE_CAPITAL_SETTLEMENT',
            ProgressPercent: 100,
            IsCritical: true,
            Dependencies: [{ TaskID: 'TSK-NOHV-1503', Type: 'FS' as const, LagDays: 1 }],
            DurationDays: 60,
            LegalBasis: 'TT 96/2021/TT-BTC',
            EstimatedCost: 597000000000
        },
        {
            TaskID: 'TSK-NOHV-1602',
            Title: 'Kiểm toán Nhà nước quyết toán dự án',
            Description: 'KTNN kiểm toán quyết toán dự án hoàn thành',
            ProjectID: nohvProjectId,
            AssigneeID: 'NV1005',
            StartDate: '2025-07-01',
            DueDate: '2025-08-31',
            Status: TaskStatus.Done,
            Priority: TaskPriority.Urgent,
            TimelineStep: 'CLOSE_CAPITAL_SETTLEMENT',
            ProgressPercent: 100,
            Dependencies: [{ TaskID: 'TSK-NOHV-1601', Type: 'FS' as const, LagDays: 1 }],
            DurationDays: 61
        },
        {
            TaskID: 'TSK-NOHV-1603',
            Title: 'Phê duyệt quyết toán vốn đầu tư hoàn thành',
            Description: 'Giám đốc Học viện phê duyệt quyết toán dự án',
            ProjectID: nohvProjectId,
            AssigneeID: 'NV1001',
            StartDate: '2025-09-05',
            DueDate: '2025-09-20',
            Status: TaskStatus.Done,
            Priority: TaskPriority.Urgent,
            TimelineStep: 'CLOSE_CAPITAL_SETTLEMENT',
            ProgressPercent: 100,
            IsCritical: true,
            Dependencies: [{ TaskID: 'TSK-NOHV-1602', Type: 'FS' as const, LagDays: 4 }],
            OutputDocument: 'QĐ phê duyệt quyết toán VĐTDA'
        },

        // 3.3 Bàn giao công trình đưa vào sử dụng
        {
            TaskID: 'TSK-NOHV-1701',
            Title: 'Bàn giao công trình cho đơn vị quản lý vận hành',
            Description: 'Bàn giao tòa nhà 16 tầng (606 phòng) cho Ban Quản lý KTX Học viện',
            ProjectID: nohvProjectId,
            AssigneeID: 'NV1001',
            StartDate: '2025-02-01',
            DueDate: '2025-02-15',
            Status: TaskStatus.Done,
            Priority: TaskPriority.Urgent,
            TimelineStep: 'CLOSE_HANDOVER',
            ProgressPercent: 100,
            Dependencies: [{ TaskID: 'TSK-NOHV-1403', Type: 'FS' as const, LagDays: 7 }],
            OutputDocument: 'Biên bản bàn giao công trình'
        },

        // 3.4 Bảo hành công trình
        {
            TaskID: 'TSK-NOHV-1801',
            Title: 'Theo dõi bảo hành công trình (24 tháng)',
            Description: 'Giám sát bảo hành kết cấu, chống thấm, thang máy, PCCC trong 24 tháng',
            ProjectID: nohvProjectId,
            AssigneeID: 'NV1027',
            StartDate: '2025-02-16',
            DueDate: '2025-12-31',
            Status: TaskStatus.Done,
            Priority: TaskPriority.Medium,
            TimelineStep: 'CLOSE_WARRANTY',
            ProgressPercent: 100,
            Dependencies: [{ TaskID: 'TSK-NOHV-1701', Type: 'FS' as const, LagDays: 1 }]
        },

        // 3.5 Bàn giao hồ sơ lưu trữ
        {
            TaskID: 'TSK-NOHV-1901',
            Title: 'Hoàn thiện hồ sơ hoàn công công trình',
            Description: 'Tập hợp đầy đủ hồ sơ hoàn công, bản vẽ AS-BUILT, nhật ký thi công',
            ProjectID: nohvProjectId,
            AssigneeID: 'NV1033',
            StartDate: '2025-02-01',
            DueDate: '2025-03-30',
            Status: TaskStatus.Done,
            Priority: TaskPriority.High,
            TimelineStep: 'CLOSE_ARCHIVE',
            ProgressPercent: 100,
            DurationDays: 57
        },
        {
            TaskID: 'TSK-NOHV-1902',
            Title: 'Bàn giao hồ sơ cho Kho lưu trữ Học viện',
            Description: 'Nộp toàn bộ hồ sơ dự án cho Phòng Lưu trữ - Tổng hợp',
            ProjectID: nohvProjectId,
            AssigneeID: 'NV1002',
            StartDate: '2025-10-01',
            DueDate: '2025-10-20',
            Status: TaskStatus.Done,
            Priority: TaskPriority.Medium,
            TimelineStep: 'CLOSE_ARCHIVE',
            ProgressPercent: 100,
            Dependencies: [{ TaskID: 'TSK-NOHV-1901', Type: 'FS' as const, LagDays: 185 }]
        }
    );

    // ============================================================
    // COMPREHENSIVE SAMPLE DATA FOR TRƯỜNG CHÍNH TRỊ TRẦN PHÚ
    // Project: PR2500060068 - Đầu tư xây dựng Trường Chính trị Trần Phú
    // This provides full lifecycle tasks demonstrating the new features:
    // - Dependencies (FS/SS/FF/SF)
    // - Progress tracking (0-100%)
    // - Resource allocation
    // - Critical path
    // ============================================================
    const tranPhuProjectId = 'PR2500060068';

    // PHASE 1: GIAI ĐOẠN CHUẨN BỊ DỰ ÁN
    tasks.push(
        // 1.1 Không phải ODA
        {
            TaskID: 'TSK-TCTTP-0101',
            Title: 'Xác định nguồn vốn ngân sách tỉnh',
            Description: 'Xác nhận dự án sử dụng 100% ngân sách địa phương, không thuộc nguồn ODA',
            ProjectID: tranPhuProjectId,
            AssigneeID: 'NV1001',
            StartDate: '2025-01-05',
            DueDate: '2025-01-10',
            Status: TaskStatus.Done,
            Priority: TaskPriority.Medium,
            TimelineStep: 'PREP_ODA',
            ProgressPercent: 100,
            IsCritical: false
        },

        // 1.2 Lập, thẩm định Báo cáo NCTKT / Đề xuất chủ trương đầu tư
        {
            TaskID: 'TSK-TCTTP-0201',
            Title: 'Lập báo cáo đề xuất chủ trương đầu tư',
            Description: 'Xây dựng báo cáo đề xuất chủ trương theo Luật Đầu tư công 2019, phù hợp Đề án 02-DA/TU',
            ProjectID: tranPhuProjectId,
            AssigneeID: 'NV1002',
            StartDate: '2025-01-10',
            DueDate: '2025-02-15',
            Status: TaskStatus.Done,
            Priority: TaskPriority.High,
            TimelineStep: 'PREP_POLICY',
            ProgressPercent: 100,
            IsCritical: true,
            Dependencies: [{ TaskID: 'TSK-TCTTP-0101', Type: 'FS' as const, LagDays: 0 }],
            LegalBasis: 'Điều 30 Luật Đầu tư công 2019',
            OutputDocument: 'Báo cáo đề xuất chủ trương ĐT'
        },
        {
            TaskID: 'TSK-TCTTP-0202',
            Title: 'Thẩm định chủ trương đầu tư tại Sở KHĐT',
            Description: 'Nộp hồ sơ và phối hợp Sở KHĐT thẩm định theo quy định',
            ProjectID: tranPhuProjectId,
            AssigneeID: 'NV1001',
            StartDate: '2025-02-16',
            DueDate: '2025-03-15',
            Status: TaskStatus.Done,
            Priority: TaskPriority.High,
            TimelineStep: 'PREP_POLICY',
            ProgressPercent: 100,
            IsCritical: true,
            Dependencies: [{ TaskID: 'TSK-TCTTP-0201', Type: 'FS' as const, LagDays: 1 }],
            DurationDays: 28,
            OutputDocument: 'Báo cáo thẩm định của Sở KHĐT'
        },
        {
            TaskID: 'TSK-TCTTP-0203',
            Title: 'Giám đốc Học viện quyết định chủ trương đầu tư',
            Description: 'Trình Giám đốc Học viện quyết định chủ trương đầu tư dự án nhóm B',
            ProjectID: tranPhuProjectId,
            AssigneeID: 'NV1002',
            StartDate: '2025-03-16',
            DueDate: '2025-04-10',
            Status: TaskStatus.Done,
            Priority: TaskPriority.Urgent,
            TimelineStep: 'PREP_POLICY',
            ProgressPercent: 100,
            IsCritical: true,
            Dependencies: [{ TaskID: 'TSK-TCTTP-0202', Type: 'FS' as const, LagDays: 1 }],
            OutputDocument: 'Quyết định của Giám đốc Học viện'
        },

        // 1.3 Khảo sát xây dựng phục vụ lập dự án
        {
            TaskID: 'TSK-TCTTP-0301',
            Title: 'Khảo sát địa hình khu đất xây dựng',
            Description: 'Khảo sát địa hình 1/500 khu vực xây dựng Trường Chính trị',
            ProjectID: tranPhuProjectId,
            AssigneeID: 'NV1033',
            StartDate: '2025-04-01',
            DueDate: '2025-04-20',
            Status: TaskStatus.Done,
            Priority: TaskPriority.Medium,
            TimelineStep: 'PREP_SURVEY',
            ProgressPercent: 100,
            Dependencies: [{ TaskID: 'TSK-TCTTP-0203', Type: 'SS' as const, LagDays: -10 }],
            Assignees: [
                { EmployeeID: 'NV1033', AllocationPercent: 50, Role: 'Lead' },
                { EmployeeID: 'NV1035', AllocationPercent: 30, Role: 'Support' }
            ]
        },
        {
            TaskID: 'TSK-TCTTP-0302',
            Title: 'Khảo sát địa chất công trình',
            Description: 'Khảo sát địa chất, khoan thăm dò 15 hố khoan, thí nghiệm mẫu đất',
            ProjectID: tranPhuProjectId,
            AssigneeID: 'NV1034',
            StartDate: '2025-04-15',
            DueDate: '2025-05-15',
            Status: TaskStatus.Done,
            Priority: TaskPriority.High,
            TimelineStep: 'PREP_SURVEY',
            ProgressPercent: 100,
            Dependencies: [{ TaskID: 'TSK-TCTTP-0301', Type: 'SS' as const, LagDays: 14 }]
        },
        {
            TaskID: 'TSK-TCTTP-0303',
            Title: 'Đánh giá hiện trạng công trình hiện hữu',
            Description: 'Khảo sát, đánh giá các hạng mục công trình hiện có cần giữ lại hoặc phá dỡ',
            ProjectID: tranPhuProjectId,
            AssigneeID: 'NV1027',
            StartDate: '2025-04-10',
            DueDate: '2025-04-30',
            Status: TaskStatus.Done,
            Priority: TaskPriority.Medium,
            TimelineStep: 'PREP_SURVEY',
            ProgressPercent: 100
        },

        // 1.4 Quy hoạch xây dựng
        {
            TaskID: 'TSK-TCTTP-0401',
            Title: 'Rà soát quy hoạch chi tiết 1/500',
            Description: 'Xác nhận phù hợp với QH chi tiết xây dựng đã được phê duyệt',
            ProjectID: tranPhuProjectId,
            AssigneeID: 'NV1002',
            StartDate: '2025-04-20',
            DueDate: '2025-05-05',
            Status: TaskStatus.Done,
            Priority: TaskPriority.Medium,
            TimelineStep: 'PREP_PLANNING',
            ProgressPercent: 100
        },

        // 1.5 Lập, thẩm định Báo cáo NCKT
        {
            TaskID: 'TSK-TCTTP-0501',
            Title: 'Lập Báo cáo nghiên cứu khả thi dự án',
            Description: 'Thuê đơn vị tư vấn lập báo cáo NCKT theo NĐ175/2024',
            ProjectID: tranPhuProjectId,
            AssigneeID: 'NV1001',
            StartDate: '2025-05-01',
            DueDate: '2025-07-15',
            Status: TaskStatus.Done,
            Priority: TaskPriority.High,
            TimelineStep: 'PREP_FEASIBILITY',
            ProgressPercent: 100,
            IsCritical: true,
            Dependencies: [
                { TaskID: 'TSK-TCTTP-0302', Type: 'FS' as const, LagDays: 0 },
                { TaskID: 'TSK-TCTTP-0401', Type: 'FS' as const, LagDays: 0 }
            ],
            DurationDays: 75,
            EstimatedCost: 850000000,
            LegalBasis: 'Điều 54 Luật XD 2014',
            OutputDocument: 'Báo cáo NCKT dự án'
        },
        {
            TaskID: 'TSK-TCTTP-0502',
            Title: 'Lập ĐTM và thủ tục môi trường',
            Description: 'Lập báo cáo đánh giá tác động môi trường trình Sở TNMT',
            ProjectID: tranPhuProjectId,
            AssigneeID: 'NV1027',
            StartDate: '2025-05-15',
            DueDate: '2025-07-30',
            Status: TaskStatus.Done,
            Priority: TaskPriority.High,
            TimelineStep: 'PREP_FEASIBILITY',
            ProgressPercent: 100,
            Dependencies: [{ TaskID: 'TSK-TCTTP-0501', Type: 'SS' as const, LagDays: 14 }]
        },
        {
            TaskID: 'TSK-TCTTP-0503',
            Title: 'Thẩm định BCNCKT tại Sở Xây dựng',
            Description: 'Phối hợp Sở XD thẩm định BCNCKT theo Điều 58 Luật XD',
            ProjectID: tranPhuProjectId,
            AssigneeID: 'NV1001',
            StartDate: '2025-07-20',
            DueDate: '2025-08-30',
            Status: TaskStatus.Done,
            Priority: TaskPriority.High,
            TimelineStep: 'PREP_FEASIBILITY',
            ProgressPercent: 100,
            IsCritical: true,
            Dependencies: [
                { TaskID: 'TSK-TCTTP-0501', Type: 'FS' as const, LagDays: 5 },
                { TaskID: 'TSK-TCTTP-0502', Type: 'FS' as const, LagDays: -10 }
            ],
            OutputDocument: 'Báo cáo thẩm định Sở XD'
        },

        // 1.6 Quyết định đầu tư xây dựng
        {
            TaskID: 'TSK-TCTTP-0601',
            Title: 'Trình phê duyệt dự án đầu tư',
            Description: 'Hoàn thiện hồ sơ trình Giám đốc Học viện CTQG HCM phê duyệt dự án',
            ProjectID: tranPhuProjectId,
            AssigneeID: 'NV1001',
            StartDate: '2025-09-01',
            DueDate: '2025-09-20',
            Status: TaskStatus.Done,
            Priority: TaskPriority.Urgent,
            TimelineStep: 'PREP_DECISION',
            ProgressPercent: 100,
            IsCritical: true,
            Dependencies: [{ TaskID: 'TSK-TCTTP-0503', Type: 'FS' as const, LagDays: 2 }]
        },
        {
            TaskID: 'TSK-TCTTP-0602',
            Title: 'Giám đốc Học viện ban hành QĐ phê duyệt dự án',
            Description: 'QĐ số 2810/QĐ-UBND ngày 11/11/2025 phê duyệt dự án',
            ProjectID: tranPhuProjectId,
            AssigneeID: 'NV1002',
            StartDate: '2025-10-01',
            DueDate: '2025-11-11',
            Status: TaskStatus.Done,
            Priority: TaskPriority.Urgent,
            TimelineStep: 'PREP_DECISION',
            ProgressPercent: 100,
            IsCritical: true,
            Dependencies: [{ TaskID: 'TSK-TCTTP-0601', Type: 'FS' as const, LagDays: 10 }],
            OutputDocument: 'QĐ 2810/QĐ-UBND'
        },

        // PHASE 2: GIAI ĐOẠN THỰC HIỆN DỰ ÁN
        // 2.1 Chuẩn bị mặt bằng
        {
            TaskID: 'TSK-TCTTP-1101',
            Title: 'Lập phương án GPMB',
            Description: 'Lập phương án bồi thường, hỗ trợ GPMB theo Luật Đất đai 2024',
            ProjectID: tranPhuProjectId,
            AssigneeID: 'NV1033',
            StartDate: '2025-11-15',
            DueDate: '2025-12-30',
            Status: TaskStatus.Done,
            Priority: TaskPriority.High,
            TimelineStep: 'IMPL_SITE',
            ProgressPercent: 100,
            Dependencies: [{ TaskID: 'TSK-TCTTP-0602', Type: 'FS' as const, LagDays: 4 }]
        },
        {
            TaskID: 'TSK-TCTTP-1102',
            Title: 'Thực hiện chi trả bồi thường GPMB',
            Description: 'Chi trả tiền bồi thường cho 5 hộ dân bị ảnh hưởng',
            ProjectID: tranPhuProjectId,
            AssigneeID: 'NV1015',
            StartDate: '2026-01-02',
            DueDate: '2026-01-31',
            Status: TaskStatus.Done,
            Priority: TaskPriority.High,
            TimelineStep: 'IMPL_SITE',
            ProgressPercent: 100,
            Dependencies: [{ TaskID: 'TSK-TCTTP-1101', Type: 'FS' as const, LagDays: 3 }],
            EstimatedCost: 2500000000
        },
        {
            TaskID: 'TSK-TCTTP-1103',
            Title: 'Bàn giao mặt bằng sạch',
            Description: 'Nghiệm thu và bàn giao mặt bằng sạch cho thi công',
            ProjectID: tranPhuProjectId,
            AssigneeID: 'NV1001',
            StartDate: '2026-01-20',
            DueDate: '2026-02-01',
            Status: TaskStatus.InProgress,
            Priority: TaskPriority.Urgent,
            TimelineStep: 'IMPL_SITE',
            ProgressPercent: 75,
            IsCritical: true,
            Dependencies: [{ TaskID: 'TSK-TCTTP-1102', Type: 'SS' as const, LagDays: 10 }]
        },

        // 2.2 Khảo sát phục vụ thiết kế
        {
            TaskID: 'TSK-TCTTP-1201',
            Title: 'Khảo sát bổ sung phục vụ thiết kế BVTC',
            Description: 'Khảo sát địa chất bổ sung tại vị trí công trình chính',
            ProjectID: tranPhuProjectId,
            AssigneeID: 'NV1034',
            StartDate: '2025-12-01',
            DueDate: '2025-12-30',
            Status: TaskStatus.Done,
            Priority: TaskPriority.Medium,
            TimelineStep: 'IMPL_SURVEY',
            ProgressPercent: 100,
            Dependencies: [{ TaskID: 'TSK-TCTTP-0602', Type: 'FS' as const, LagDays: 20 }]
        },

        // 2.3 Thiết kế & Dự toán
        {
            TaskID: 'TSK-TCTTP-1301',
            Title: 'Lập hồ sơ thiết kế BVTC',
            Description: 'Thuê đơn vị tư vấn lập TKBVTC các hạng mục công trình',
            ProjectID: tranPhuProjectId,
            AssigneeID: 'NV1027',
            StartDate: '2025-12-01',
            DueDate: '2026-02-28',
            Status: TaskStatus.InProgress,
            Priority: TaskPriority.High,
            TimelineStep: 'IMPL_DESIGN',
            ProgressPercent: 85,
            IsCritical: true,
            Dependencies: [
                { TaskID: 'TSK-TCTTP-0602', Type: 'FS' as const, LagDays: 20 },
                { TaskID: 'TSK-TCTTP-1201', Type: 'SS' as const, LagDays: 0 }
            ],
            Assignees: [
                { EmployeeID: 'NV1027', AllocationPercent: 40, Role: 'Lead' },
                { EmployeeID: 'NV1028', AllocationPercent: 30, Role: 'Support' },
                { EmployeeID: 'NV1029', AllocationPercent: 20, Role: 'Support' }
            ],
            DurationDays: 90,
            EstimatedCost: 1200000000
        },
        {
            TaskID: 'TSK-TCTTP-1302',
            Title: 'Lập dự toán xây dựng công trình',
            Description: 'Lập dự toán chi tiết theo Thông tư 11/2021/TT-BXD',
            ProjectID: tranPhuProjectId,
            AssigneeID: 'NV1015',
            StartDate: '2026-01-15',
            DueDate: '2026-02-20',
            Status: TaskStatus.InProgress,
            Priority: TaskPriority.High,
            TimelineStep: 'IMPL_DESIGN',
            ProgressPercent: 70,
            Dependencies: [{ TaskID: 'TSK-TCTTP-1301', Type: 'SS' as const, LagDays: 45 }]
        },
        {
            TaskID: 'TSK-TCTTP-1303',
            Title: 'Thẩm định thiết kế BVTC và dự toán',
            Description: 'Thẩm định TKBVTC và dự toán tại Sở Xây dựng',
            ProjectID: tranPhuProjectId,
            AssigneeID: 'NV1001',
            StartDate: '2026-02-25',
            DueDate: '2026-03-25',
            Status: TaskStatus.Todo,
            Priority: TaskPriority.High,
            TimelineStep: 'IMPL_DESIGN',
            ProgressPercent: 0,
            IsCritical: true,
            Dependencies: [
                { TaskID: 'TSK-TCTTP-1301', Type: 'FS' as const, LagDays: 0 },
                { TaskID: 'TSK-TCTTP-1302', Type: 'FS' as const, LagDays: 5 }
            ]
        },
        {
            TaskID: 'TSK-TCTTP-1304',
            Title: 'Phê duyệt thiết kế BVTC và dự toán',
            Description: 'Chủ đầu tư phê duyệt TKBVTC và tổng dự toán',
            ProjectID: tranPhuProjectId,
            AssigneeID: 'NV1002',
            StartDate: '2026-03-26',
            DueDate: '2026-04-10',
            Status: TaskStatus.Todo,
            Priority: TaskPriority.Urgent,
            TimelineStep: 'IMPL_DESIGN',
            ProgressPercent: 0,
            IsCritical: true,
            Dependencies: [{ TaskID: 'TSK-TCTTP-1303', Type: 'FS' as const, LagDays: 1 }]
        },

        // 2.4 Giấy phép xây dựng
        {
            TaskID: 'TSK-TCTTP-1401',
            Title: 'Lập hồ sơ xin GPXD',
            Description: 'Chuẩn bị hồ sơ xin giấy phép xây dựng theo Điều 95 Luật XD',
            ProjectID: tranPhuProjectId,
            AssigneeID: 'NV1033',
            StartDate: '2026-03-20',
            DueDate: '2026-04-05',
            Status: TaskStatus.Todo,
            Priority: TaskPriority.High,
            TimelineStep: 'IMPL_PERMIT',
            ProgressPercent: 0,
            Dependencies: [{ TaskID: 'TSK-TCTTP-1303', Type: 'SS' as const, LagDays: 20 }]
        },
        {
            TaskID: 'TSK-TCTTP-1402',
            Title: 'Cấp giấy phép xây dựng',
            Description: 'Sở Xây dựng cấp GPXD cho công trình',
            ProjectID: tranPhuProjectId,
            AssigneeID: 'NV1001',
            StartDate: '2026-04-05',
            DueDate: '2026-04-25',
            Status: TaskStatus.Todo,
            Priority: TaskPriority.High,
            TimelineStep: 'IMPL_PERMIT',
            ProgressPercent: 0,
            IsCritical: true,
            Dependencies: [{ TaskID: 'TSK-TCTTP-1401', Type: 'FS' as const, LagDays: 0 }],
            OutputDocument: 'Giấy phép xây dựng'
        },

        // 2.5 Lựa chọn nhà thầu
        {
            TaskID: 'TSK-TCTTP-1501',
            Title: 'Lập kế hoạch lựa chọn nhà thầu',
            Description: 'Lập KHLCNT trình phê duyệt theo Luật Đấu thầu 2023',
            ProjectID: tranPhuProjectId,
            AssigneeID: 'NV1001',
            StartDate: '2026-03-01',
            DueDate: '2026-03-20',
            Status: TaskStatus.Todo,
            Priority: TaskPriority.High,
            TimelineStep: 'IMPL_BIDDING',
            ProgressPercent: 0,
            Dependencies: [{ TaskID: 'TSK-TCTTP-1302', Type: 'FS' as const, LagDays: 5 }],
            LegalBasis: 'Điều 39 Luật Đấu thầu 2023'
        },
        {
            TaskID: 'TSK-TCTTP-1502',
            Title: 'Phê duyệt KHLCNT',
            Description: 'Giám đốc Học viện phê duyệt kế hoạch lựa chọn nhà thầu',
            ProjectID: tranPhuProjectId,
            AssigneeID: 'NV1002',
            StartDate: '2026-03-21',
            DueDate: '2026-04-05',
            Status: TaskStatus.Todo,
            Priority: TaskPriority.High,
            TimelineStep: 'IMPL_BIDDING',
            ProgressPercent: 0,
            Dependencies: [{ TaskID: 'TSK-TCTTP-1501', Type: 'FS' as const, LagDays: 1 }]
        },
        {
            TaskID: 'TSK-TCTTP-1503',
            Title: 'Lập HSMT gói thầu XL-01 (Xây lắp)',
            Description: 'Lập hồ sơ mời thầu gói XL-01: Xây dựng Nhà học chính và Hội trường',
            ProjectID: tranPhuProjectId,
            AssigneeID: 'NV1027',
            StartDate: '2026-04-01',
            DueDate: '2026-04-20',
            Status: TaskStatus.Todo,
            Priority: TaskPriority.High,
            TimelineStep: 'IMPL_BIDDING',
            ProgressPercent: 0,
            Dependencies: [
                { TaskID: 'TSK-TCTTP-1304', Type: 'FS' as const, LagDays: -10 },
                { TaskID: 'TSK-TCTTP-1502', Type: 'SS' as const, LagDays: 0 }
            ],
            Assignees: [
                { EmployeeID: 'NV1027', AllocationPercent: 50, Role: 'Lead' },
                { EmployeeID: 'NV1028', AllocationPercent: 30, Role: 'Support' }
            ]
        },
        {
            TaskID: 'TSK-TCTTP-1504',
            Title: 'Phê duyệt và phát hành HSMT gói XL-01',
            Description: 'Phê duyệt HSMT và đăng tải trên Hệ thống mạng đấu thầu quốc gia',
            ProjectID: tranPhuProjectId,
            AssigneeID: 'NV1001',
            StartDate: '2026-04-21',
            DueDate: '2026-04-30',
            Status: TaskStatus.Todo,
            Priority: TaskPriority.Urgent,
            TimelineStep: 'IMPL_BIDDING',
            ProgressPercent: 0,
            IsCritical: true,
            Dependencies: [{ TaskID: 'TSK-TCTTP-1503', Type: 'FS' as const, LagDays: 1 }]
        },
        {
            TaskID: 'TSK-TCTTP-1505',
            Title: 'Tổ chức đấu thầu gói XL-01',
            Description: 'Mở thầu, đánh giá HSDT và trình phê duyệt kết quả',
            ProjectID: tranPhuProjectId,
            AssigneeID: 'NV1033',
            StartDate: '2026-05-01',
            DueDate: '2026-06-30',
            Status: TaskStatus.Todo,
            Priority: TaskPriority.High,
            TimelineStep: 'IMPL_BIDDING',
            ProgressPercent: 0,
            IsCritical: true,
            Dependencies: [{ TaskID: 'TSK-TCTTP-1504', Type: 'FS' as const, LagDays: 1 }],
            DurationDays: 60
        },
        {
            TaskID: 'TSK-TCTTP-1506',
            Title: 'Ký kết hợp đồng gói XL-01',
            Description: 'Thương thảo và ký hợp đồng với nhà thầu trúng thầu',
            ProjectID: tranPhuProjectId,
            AssigneeID: 'NV1001',
            StartDate: '2026-07-01',
            DueDate: '2026-07-15',
            Status: TaskStatus.Todo,
            Priority: TaskPriority.Urgent,
            TimelineStep: 'IMPL_BIDDING',
            ProgressPercent: 0,
            IsCritical: true,
            Dependencies: [{ TaskID: 'TSK-TCTTP-1505', Type: 'FS' as const, LagDays: 1 }],
            OutputDocument: 'Hợp đồng xây lắp XL-01'
        },

        // 2.6 Thi công xây dựng
        {
            TaskID: 'TSK-TCTTP-1601',
            Title: 'Khởi công xây dựng công trình',
            Description: 'Tổ chức lễ khởi công, triển khai thi công hạng mục đầu tiên',
            ProjectID: tranPhuProjectId,
            AssigneeID: 'NV1002',
            StartDate: '2026-07-20',
            DueDate: '2026-07-25',
            Status: TaskStatus.Todo,
            Priority: TaskPriority.High,
            TimelineStep: 'IMPL_CONSTRUCTION',
            ProgressPercent: 0,
            Dependencies: [
                { TaskID: 'TSK-TCTTP-1506', Type: 'FS' as const, LagDays: 5 },
                { TaskID: 'TSK-TCTTP-1402', Type: 'FS' as const, LagDays: 0 },
                { TaskID: 'TSK-TCTTP-1103', Type: 'FS' as const, LagDays: 0 }
            ]
        },
        {
            TaskID: 'TSK-TCTTP-1602',
            Title: 'Thi công phần móng công trình chính',
            Description: 'Đào đất, ép cọc, đổ bê tông móng Nhà học chính',
            ProjectID: tranPhuProjectId,
            AssigneeID: 'NV1033',
            StartDate: '2026-07-26',
            DueDate: '2026-10-30',
            Status: TaskStatus.Todo,
            Priority: TaskPriority.High,
            TimelineStep: 'IMPL_CONSTRUCTION',
            ProgressPercent: 0,
            IsCritical: true,
            Dependencies: [{ TaskID: 'TSK-TCTTP-1601', Type: 'FS' as const, LagDays: 1 }],
            DurationDays: 96
        },
        {
            TaskID: 'TSK-TCTTP-1603',
            Title: 'Thi công phần thân công trình chính',
            Description: 'Thi công kết cấu khung, sàn, tường Nhà học chính 5 tầng',
            ProjectID: tranPhuProjectId,
            AssigneeID: 'NV1034',
            StartDate: '2026-11-01',
            DueDate: '2027-06-30',
            Status: TaskStatus.Todo,
            Priority: TaskPriority.High,
            TimelineStep: 'IMPL_CONSTRUCTION',
            ProgressPercent: 0,
            IsCritical: true,
            Dependencies: [{ TaskID: 'TSK-TCTTP-1602', Type: 'FS' as const, LagDays: 2 }],
            DurationDays: 242
        },

        // 2.7 Giám sát thi công
        {
            TaskID: 'TSK-TCTTP-1701',
            Title: 'Triển khai giám sát thi công',
            Description: 'Cử cán bộ giám sát hiện trường theo Điều 120 Luật XD',
            ProjectID: tranPhuProjectId,
            AssigneeID: 'NV1027',
            StartDate: '2026-07-20',
            DueDate: '2029-06-30',
            Status: TaskStatus.Todo,
            Priority: TaskPriority.High,
            TimelineStep: 'IMPL_SUPERVISION',
            ProgressPercent: 0,
            Dependencies: [{ TaskID: 'TSK-TCTTP-1601', Type: 'SS' as const, LagDays: 0 }],
            Assignees: [
                { EmployeeID: 'NV1027', AllocationPercent: 30, Role: 'Lead' },
                { EmployeeID: 'NV1035', AllocationPercent: 50, Role: 'Field' },
                { EmployeeID: 'NV1036', AllocationPercent: 40, Role: 'Field' }
            ]
        },

        // 2.8 Thanh toán
        {
            TaskID: 'TSK-TCTTP-1801',
            Title: 'Tạm ứng hợp đồng XL-01 (20%)',
            Description: 'Lập hồ sơ tạm ứng 20% giá trị hợp đồng theo quy định',
            ProjectID: tranPhuProjectId,
            AssigneeID: 'NV1015',
            StartDate: '2026-07-16',
            DueDate: '2026-07-31',
            Status: TaskStatus.Todo,
            Priority: TaskPriority.High,
            TimelineStep: 'IMPL_PAYMENT',
            ProgressPercent: 0,
            Dependencies: [{ TaskID: 'TSK-TCTTP-1506', Type: 'FS' as const, LagDays: 1 }],
            EstimatedCost: 15000000000
        }
    );

    return tasks;
};

export const saveTasksToDB = (tasks: Task[]) => {
    try {
        localStorage.setItem('app_tasks', JSON.stringify(tasks));
    } catch (e) {
        console.error("Failed to save tasks", e);
    }
};

// Version number to force refresh when data structure changes
const TASKS_DATA_VERSION = '2026-02-14-v2-nohv';

export const loadTasksFromStorage = (): Task[] => {
    if (typeof localStorage === 'undefined') {
        return generateDefaultTasks();
    }
    try {
        const savedVersion = localStorage.getItem('app_tasks_version');
        const saved = localStorage.getItem('app_tasks');

        // If version mismatch or no saved data, regenerate
        if (savedVersion !== TASKS_DATA_VERSION || !saved) {
            const defaults = generateDefaultTasks();
            localStorage.setItem('app_tasks', JSON.stringify(defaults));
            localStorage.setItem('app_tasks_version', TASKS_DATA_VERSION);
            return defaults;
        }

        return JSON.parse(saved);
    } catch (e) {
        console.error("Failed to load tasks", e);
    }
    const defaults = generateDefaultTasks();
    localStorage.setItem('app_tasks', JSON.stringify(defaults));
    localStorage.setItem('app_tasks_version', TASKS_DATA_VERSION);
    return defaults;
};

export const mockTasks: Task[] = loadTasksFromStorage();

// 9. Logs (Mocking some history)
export const mockAuditLogs: AuditLog[] = [
    {
        LogID: 'LOG-001',
        Action: 'Create',
        TargetEntity: 'Employee',
        TargetID: 'NV1029',
        ChangedBy: 'admin',
        Timestamp: '2024-03-01 08:30:00',
        Details: 'Tạo tài khoản mới cho nhân viên Nguyễn Văn Z'
    }
];

// --- ADVANCED FEATURES: ISSUES & HEALTH CHECK ---

export const mockPackageIssues: PackageIssue[] = [
    {
        IssueID: "ISS-001",
        PackageID: mockBiddingPackages[0]?.PackageID || "PKG-001",
        Title: "Vướng mắc mặt bằng thi công phân khu 2",
        Description: "Chưa bàn giao được 500m2 đất nông nghiệp do hộ dân chưa đồng ý phương án đền bù.",
        Status: "Open",
        Severity: RiskLevel.High,
        ReportedDate: "2024-05-20",
        Reporter: "Ban GPMB"
    }
];

// Simulate Backend AI Health Check
export const analyzePackageHealth = (pkgId: string): Promise<PackageHealthCheck> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const issues = mockPackageIssues.filter(i => i.PackageID === pkgId);
            const highRiskCount = issues.filter(i => i.Severity === RiskLevel.High || i.Severity === RiskLevel.Critical).length;

            let score = 95;
            let factors = ["Tiến độ giải ngân tốt", "Hồ sơ pháp lý đầy đủ"];
            let recommendation = "Tiếp tục duy trì giám sát định kỳ.";
            let risk = RiskLevel.Low;

            if (highRiskCount > 0) {
                score = 65;
                risk = RiskLevel.High;
                factors = ["Vướng mắc mặt bằng chưa giải quyết", "Có nguy cơ chậm tiến độ thi công"];
                recommendation = "Cần tổ chức họp khẩn với Ban GPMB và Lãnh đạo địa phương để tháo gỡ.";
            }

            resolve({ score, riskLevel: risk, factors, recommendation });
        }, 1200);
    });
};

// --- 10. NEW MODULES DATA ---

// Module 2: CDE Folders
export const mockFolders: Folder[] = [
    { FolderID: 'FLD-ROOT', Name: 'Dự án Y Tế (PR2400031160)', Type: 'Container', Path: '/' },
    { FolderID: 'FLD-WIP', ParentID: 'FLD-ROOT', Name: '01-WIP (Work In Progress)', Type: 'Container', Path: '/01-WIP' },
    { FolderID: 'FLD-SHARED', ParentID: 'FLD-ROOT', Name: '02-SHARED (Chia sẻ)', Type: 'Container', Path: '/02-SHARED' },
    { FolderID: 'FLD-PUB', ParentID: 'FLD-ROOT', Name: '03-PUBLISHED (Đã phát hành)', Type: 'Container', Path: '/03-PUBLISHED' },
    { FolderID: 'FLD-ARCH', ParentID: 'FLD-ROOT', Name: '04-ARCHIVED (Lưu trữ)', Type: 'Container', Path: '/04-ARCHIVED' },
    // Subfolders in Shared
    { FolderID: 'FLD-S-LEGAL', ParentID: 'FLD-SHARED', Name: '10. Pháp lý', Type: 'Folder', Path: '/02-SHARED/10. Pháp lý' },
    { FolderID: 'FLD-S-DESIGN', ParentID: 'FLD-SHARED', Name: '20. Thiết kế', Type: 'Folder', Path: '/02-SHARED/20. Thiết kế' },
    { FolderID: 'FLD-S-QUALITY', ParentID: 'FLD-SHARED', Name: '30. QL Chất lượng', Type: 'Folder', Path: '/02-SHARED/30. QL Chất lượng' }
];

// Module 3: Capital Plans & Disbursement
export const mockCapitalPlans: CapitalPlan[] = [
    {
        PlanID: 'CP-2023-PR2400031160',
        ProjectID: 'PR2400031160',
        Year: 2023,
        Amount: 50000000000,
        DecisionNumber: '112/QĐ-UBND',
        DateAssigned: '2023-01-15',
        Source: 'Ngân sách Tỉnh',
        DisbursedAmount: 50000000000
    },
    {
        PlanID: 'CP-2024-PR2400031160',
        ProjectID: 'PR2400031160',
        Year: 2024,
        Amount: 85000000000,
        DecisionNumber: '15/QĐ-UBND',
        DateAssigned: '2024-01-20',
        Source: 'Ngân sách Trung ương',
        DisbursedAmount: 45000000000
    },
    {
        PlanID: 'CP-2025-PR2400031160',
        ProjectID: 'PR2400031160',
        Year: 2025,
        Amount: 18173978000,
        DecisionNumber: '05/QĐ-UBND',
        DateAssigned: '2025-01-10',
        Source: 'Ngân sách Tỉnh',
        DisbursedAmount: 0
    }
];

export const mockDisbursements: Disbursement[] = [
    {
        DisbursementID: 'DIS-001',
        ProjectID: 'PR2400031160',
        CapitalPlanID: 'CP-2023-PR2400031160',
        Amount: 15000000000,
        Date: '2023-03-20',
        TreasuryCode: 'KB-HT-23001',
        FormType: '03a',
        Status: 'Approved'
    },
    {
        DisbursementID: 'DIS-002',
        ProjectID: 'PR2400031160',
        CapitalPlanID: 'CP-2023-PR2400031160',
        Amount: 35000000000,
        Date: '2023-09-15',
        TreasuryCode: 'KB-HT-23055',
        FormType: '03a',
        Status: 'Approved'
    },
    {
        DisbursementID: 'DIS-003',
        ProjectID: 'PR2400031160',
        CapitalPlanID: 'CP-2024-PR2400031160',
        Amount: 20000000000,
        Date: '2024-02-10',
        TreasuryCode: 'KB-HT-24012',
        FormType: '03a',
        Status: 'Approved'
    },
    {
        DisbursementID: 'DIS-004',
        ProjectID: 'PR2400031160',
        CapitalPlanID: 'CP-2024-PR2400031160',
        Amount: 25000000000,
        Date: '2024-06-20',
        TreasuryCode: 'KB-HT-24089',
        FormType: '03a',
        Status: 'Approved'
    }
];

// Module 4: Variation Orders
export const mockVariationOrders: VariationOrder[] = [
    {
        VOID: 'VO-01',
        ContractID: '43/2023/HĐXL', // Linked to DA007 contract
        Number: 'PL-01',
        SignDate: '2023-11-15',
        Content: 'Bổ sung khối lượng san lấp mặt bằng do thay đổi thiết kế cao độ',
        AdjustedAmount: 500000000,
        AdjustedDuration: 15
    },
    {
        VOID: 'VO-02',
        ContractID: 'PKG-PR2400031160-01', // Should match a contract ID from new project (pkg id used as placeholder for contract id often)
        Number: 'PL-01/TV',
        SignDate: '2024-09-10',
        Content: 'Điều chỉnh nhân sự tư vấn chủ chốt',
        AdjustedAmount: 0,
        AdjustedDuration: 0
    }
];

// Post-processing: Link Variation Orders to Contracts
mockVariationOrders.forEach(vo => {
    const c = mockContracts.find(x => x.ContractID === vo.ContractID);
    if (c) {
        if (!c.VariationOrders) c.VariationOrders = [];
        c.VariationOrders.push(vo);
    }
});

