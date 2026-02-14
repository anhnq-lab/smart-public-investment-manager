
import {
    Project, ProjectGroup, InvestmentType, ProjectStatus, ProjectStage, ProjectSector,
    Contractor, Contract, ContractStatus, Payment, PaymentType, PaymentStatus, Document, DocCategory,
    BiddingPackage, PackageStatus, Employee, EmployeeStatus, Task, TaskStatus, TaskPriority, AuditLog, Role,
    PackageIssue, RiskLevel, PackageHealthCheck,
    Folder, ISO19650Status, CapitalPlan, Disbursement, VariationOrder, WorkflowStep
} from './types';

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
        decisionAuthority: "UBND tỉnh Hà Tĩnh"
    },
    {
        id: "DA-NOHV-8567",
        name: "Xây dựng tòa nhà ở học viên - Học viện Chính trị quốc gia Hồ Chí Minh",
        total: 597000000000,
        status: ProjectStatus.Execution,
        projectNumber: "DA-NOHV-8567",
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
        GroupCode: p.total >= 2300000000000 ? ProjectGroup.A : (p.total >= 80000000000 ? ProjectGroup.B : ProjectGroup.C),
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
            NationalProjectCode: 'DA-NOHV-8567',
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

// MAPPING: Project ID -> List of specific contracts
const specificContracts = [
    // DA7946312: BV Cẩm Xuyên
    { pid: "DA7946312", code: "20/2023/HĐTV-TVMT", val: 263000000, cName: "Công ty CP Tư vấn thiết kế Hà Tĩnh", type: "TV", date: "07/12/2023", name: "Tư vấn môi trường" },
    { pid: "DA7946312", code: "19/2023/HĐTV-TVQH", val: 24348000, cName: "Công ty CP Tư vấn thiết kế Hà Tĩnh", type: "TV", date: "07/12/2023", name: "Tư vấn quy hoạch" },
    { pid: "DA7946312", code: "18/2023/HĐTV-TVNCKT", val: 605869000, cName: "Công ty CP Tư vấn thiết kế Hà Tĩnh", type: "TV", date: "07/12/2023", name: "Lập Báo cáo NCKT" },

    // DA7544621: BIIG2
    { pid: "DA7544621", code: "25/2020/HĐXL-DDCN", val: 48028754750, cName: "Công ty CP Bơm Châu Âu", type: "XL", date: "28/04/2020", name: "Thi công Gói thầu số 07" },
    { pid: "DA7544621", code: "195/2020/HĐXL-DDCN", val: 117675700920, cName: "Công ty CP Hà Huy", type: "XL", date: "14/12/2020", name: "Thi công Gói thầu số 08" },

    // DA7333066: BĐKH
    { pid: "DA7333066", code: "150/HĐTRNM-IWMC", val: 1590036756, cName: "Công ty cổ phần tư vấn và xây dựng Thái Hà", type: "XL", date: "06/11/2018", name: "Thi công trồng rừng ngập mặn" },

    // DA007: 19 TYT (Finished Project - Detailed Data)
    { pid: "DA007", code: "14/2023/TVTK", val: 594422460, cName: "Liên danh 3001650743 - 2901407806", type: "TV", date: "10/05/2023", name: "Tư vấn thiết kế BVTC" },
    { pid: "DA007", code: "36/2023/HĐXL", val: 7205990780, cName: "Liên danh 3001650743 - 2901407806", type: "XL", date: "23/01/2023", name: "Thi công xây dựng cụm 1 (Cẩm Xuyên)" },
    { pid: "DA007", code: "48/2023/HĐXL", val: 3019463578, cName: "Liên danh 3001806687 - 3000353064", type: "XL", date: "14/09/2023", name: "Thi công xây dựng cụm 2 (Thạch Hà)" },
    { pid: "DA007", code: "43/2023/HĐXL", val: 11966889000, cName: "Liên danh 3000296112", type: "XL", date: "08/09/2023", name: "Thi công xây dựng cụm 3 (Can Lộc)" },
    { pid: "DA007", code: "45/2023/HĐXL", val: 8587405926, cName: "Liên danh 3001313321 - 3002103239", type: "XL", date: "19/09/2023", name: "Thi công xây dựng cụm 4 (Hương Khê)" },
    { pid: "DA007", code: "49/2023/TVGS", val: 289310000, cName: "Công ty CP Tư vấn thiết kế Hà Tĩnh", type: "TV", date: "22/09/2023", name: "Tư vấn giám sát thi công" },
    { pid: "DA007", code: "3472/23/HD-BH", val: 2102807000, cName: "Công ty CP 3001279984", type: "K", date: "23/01/2024", name: "Bảo hiểm công trình" },

    // DA7987973: Trường nghề
    { pid: "DA7987973", code: "91/2023/HĐXLT", val: 33120487000, cName: "Liên danh 3001937697 - 3000645726", type: "XL", date: "27/12/2023", name: "Xây dựng nhà học 05 tầng" },
    { pid: "DA7987973", code: "56/2023/TV/TKBVTC", val: 946492000, cName: "Công ty CP 3001279984", type: "TV", date: "10/10/2023", name: "Tư vấn thiết kế BVTC" },
    { pid: "DA7987973", code: "120/2022/HĐ-TVTT", val: 50422000, cName: "Công ty CP Tư vấn thiết kế Hà Tĩnh", type: "TV", date: "12/12/2022", name: "Thẩm tra BC NCKT" },

    // DA7632186: Nguyễn Du
    { pid: "DA7632186", code: "24/2020/HĐXL-DDCN", val: 10823076000, cName: "Công ty CP 484", type: "XL", date: "29/04/2022", name: "Tu bổ tôn tạo di tích" },

    // DA7535585: TTYT Kỳ Anh
    { pid: "DA7535585", code: "52/2023/HĐXL", val: 713824000, cName: "Công ty 3000426153", type: "XL", date: "29/09/2023", name: "Xây dựng nhà để xe" },

    // DA009: BVĐK
    { pid: "DA009", code: "10/2023/TVTK", val: 1052411520, cName: "Liên danh 3001313321 - 3002103239", type: "TV", date: "07/12/2023", name: "Thiết kế BVTC 4 bệnh viện" },
    { pid: "DA009", code: "114/2022/HĐTV", val: 272969000, cName: "Liên danh 3001313321 - 3002103239", type: "TV", date: "02/12/2022", name: "Lập BCNCKT" }
];

// ═══════════════════════════════════════════════════════════════════════════════
// SAMPLE DATA: 2 Complete Packages - 1 Tư vấn (Consultancy), 1 Xây lắp (Construction)
// With full lifecycle data: Contractors, Contracts, Payments, Settlement
// ═══════════════════════════════════════════════════════════════════════════════

export const mockBiddingPackages: BiddingPackage[] = [
    // ═══════════════════════════════════════════════════════════════
    // PACKAGE 1: TƯ VẤN - Thiết kế BVTC (Consultancy - Completed)
    // Lifecycle: KHLCNT → TBMT → Mời thầu → Đánh giá → Hợp đồng → Thực hiện → Quyết toán
    // NO Nghiệm thu/Bảo hành for consultancy packages
    // ═══════════════════════════════════════════════════════════════
    {
        PackageID: 'PKG-TV-DEMO-001',
        ProjectID: 'DA007', // 19 Trạm Y tế
        PackageNumber: 'TV-01',
        PackageName: 'Tư vấn lập Báo cáo NCKT và Thiết kế BVTC',
        Price: 650_000_000,
        Field: 'Consultancy',
        SelectionMethod: 'Appointed', // Chỉ định thầu rút gọn
        SelectionProcedure: 'Reduced',
        BidType: 'Online',
        ContractType: 'LumpSum',
        Status: PackageStatus.Awarded,

        // KHLCNT Info
        KHLCNTCode: 'PL20240001-TV',
        DecisionNumber: 'QĐ-156/2024/KHLCNT',
        DecisionDate: '2024-01-15',
        FundingSource: 'Ngân sách tỉnh',
        Description: 'Tư vấn lập Báo cáo nghiên cứu khả thi và Thiết kế bản vẽ thi công cho 19 Trạm Y tế xã trên địa bàn tỉnh.',
        SelectionDuration: '30 ngày',
        SelectionStartDate: 'Tháng 02/2024',

        // TBMT Info
        NotificationCode: 'IB2024001234',
        PostingDate: '2024-02-01',
        BidClosingDate: '2024-02-20',
        BidOpeningDate: '2024-02-20',

        // Result
        WinningContractorID: 'MST-TV-VINAXIM',
        WinningPrice: 594_422_460,
        ApprovalDate_Result: '2024-03-10',

        // Execution
        Duration: '120 ngày',
        ContractID: 'CTR-TV-DEMO-001',
    },

    // ═══════════════════════════════════════════════════════════════
    // PACKAGE 2: XÂY LẮP - Thi công xây dựng (Construction - Completed)
    // Lifecycle: KHLCNT → TBMT → Mời thầu → Đánh giá → Hợp đồng → Thực hiện → Nghiệm thu → Bảo hành → Quyết toán
    // HAS Nghiệm thu/Bảo hành stages
    // ═══════════════════════════════════════════════════════════════
    {
        PackageID: 'PKG-XL-DEMO-001',
        ProjectID: 'DA007', // 19 Trạm Y tế
        PackageNumber: 'XL-00',
        PackageName: 'Thi công xây dựng phần thân và hoàn thiện công trình nhà học 5 tầng',
        Price: 28_500_000_000,
        Field: 'Construction',
        SelectionMethod: 'OpenBidding', // Đấu thầu rộng rãi
        SelectionProcedure: 'OneStageTwoEnvelope',
        BidType: 'Online',
        ContractType: 'LumpSum',
        Status: PackageStatus.Awarded,

        // KHLCNT Info
        KHLCNTCode: 'PL20240002-XL',
        DecisionNumber: 'QĐ-289/2024/KHLCNT',
        DecisionDate: '2024-01-20',
        FundingSource: 'Ngân sách tỉnh và ngân sách trung ương',
        Description: 'Thi công xây dựng phần thân và hoàn thiện công trình nhà học 5 tầng, bao gồm: Móng cọc, kết cấu bê tông cốt thép, xây trát hoàn thiện, M&E.',
        SelectionDuration: '45 ngày',
        SelectionStartDate: 'Tháng 02/2024',

        // TBMT Info
        NotificationCode: 'IB2024005678',
        PostingDate: '2024-02-10',
        BidClosingDate: '2024-03-25',
        BidOpeningDate: '2024-03-25',

        // Result
        WinningContractorID: 'MST-XL-THANHLOI',
        WinningPrice: 27_800_000_000,
        ApprovalDate_Result: '2024-04-05',

        // Execution
        Duration: '540 ngày',
        ContractID: 'CTR-XL-DEMO-001',
    }
];

// ═══════════════════════════════════════════════════════════════════════════════
// CONTRACTORS for Demo Packages
// ═══════════════════════════════════════════════════════════════════════════════
mockContractors.push(
    {
        ContractorID: 'MST-TV-VINAXIM',
        CapCertCode: 'TVXD-2024-001',
        FullName: 'Công ty CP Tư vấn Thiết kế Xây dựng VINAXIM',
        IsForeign: false,
        Address: 'Số 123 Đường Nguyễn Trãi, Quận Thanh Xuân, Hà Nội',
        ContactInfo: 'Tel: 024.3568.9999 | Email: vinaxim@tvxd.vn',
    },
    {
        ContractorID: 'MST-XL-THANHLOI',
        CapCertCode: 'XLDG-2024-002',
        FullName: 'Công ty TNHH Xây dựng Thành Lợi',
        IsForeign: false,
        Address: '456 Đường Lê Duẩn, TP. Hà Tĩnh, Tỉnh Hà Tĩnh',
        ContactInfo: 'Tel: 039.384.5678 | Email: thanhloi@xaydung.vn',
    }
);

// ═══════════════════════════════════════════════════════════════════════════════
// CONTRACTS for Demo Packages
// ═══════════════════════════════════════════════════════════════════════════════
export const mockContracts: Contract[] = [
    // Contract for Tư vấn Package (COMPLETED/LIQUIDATED)
    {
        ContractID: 'CTR-TV-DEMO-001',
        PackageID: 'PKG-TV-DEMO-001',
        ContractorID: 'MST-TV-VINAXIM',
        SignDate: '2024-03-15',
        Value: 594_422_460,
        AdvanceRate: 30, // Tư vấn có tỷ lệ tạm ứng cao hơn
        Warranty: 0, // NO WARRANTY for consultancy
        Status: ContractStatus.Liquidated, // Đã quyết toán xong
    },
    // Contract for Xây lắp Package (EXECUTING - In Warranty Period)
    {
        ContractID: 'CTR-XL-DEMO-001',
        PackageID: 'PKG-XL-DEMO-001',
        ContractorID: 'MST-XL-THANHLOI',
        SignDate: '2024-04-15',
        Value: 27_800_000_000,
        AdvanceRate: 15,
        Warranty: 24, // 24 tháng bảo hành
        Status: ContractStatus.Executing, // Đang trong giai đoạn bảo hành
    }
];

// ═══════════════════════════════════════════════════════════════════════════════
// PAYMENTS for Demo Packages
// ═══════════════════════════════════════════════════════════════════════════════
export const mockPayments: Payment[] = [
    // ═══════════════════════════════════════════════════════════════
    // PAYMENTS FOR TƯ VẤN PACKAGE (CTR-TV-DEMO-001)
    // Consultancy: Tạm ứng → Thanh toán đợt 1 → Quyết toán (100%)
    // ═══════════════════════════════════════════════════════════════
    {
        PaymentID: 101,
        ContractID: 'CTR-TV-DEMO-001',
        BatchNo: 1,
        Type: PaymentType.Advance,
        Amount: 178_326_738, // 30% của 594,422,460
        TreasuryRef: 'KB-TV-2024-001',
        Status: PaymentStatus.Transferred,
    },
    {
        PaymentID: 102,
        ContractID: 'CTR-TV-DEMO-001',
        BatchNo: 2,
        Type: PaymentType.Volume,
        Amount: 237_768_984, // 40% - Sau khi hoàn thành 50% khối lượng
        TreasuryRef: 'KB-TV-2024-002',
        Status: PaymentStatus.Transferred,
    },
    {
        PaymentID: 103,
        ContractID: 'CTR-TV-DEMO-001',
        BatchNo: 3,
        Type: PaymentType.Volume,
        Amount: 178_326_738, // 30% còn lại - Quyết toán
        TreasuryRef: 'KB-TV-2024-003',
        Status: PaymentStatus.Transferred, // Đã thanh toán 100%
    },

    // ═══════════════════════════════════════════════════════════════
    // PAYMENTS FOR XÂY LẮP PACKAGE (CTR-XL-DEMO-001)
    // Construction: Tạm ứng → Thanh toán đợt 1-5 → Giữ lại 5% bảo hành
    // ═══════════════════════════════════════════════════════════════
    {
        PaymentID: 201,
        ContractID: 'CTR-XL-DEMO-001',
        BatchNo: 1,
        Type: PaymentType.Advance,
        Amount: 4_170_000_000, // 15% của 27.8 tỷ
        TreasuryRef: 'KB-XL-2024-001',
        Status: PaymentStatus.Transferred,
    },
    {
        PaymentID: 202,
        ContractID: 'CTR-XL-DEMO-001',
        BatchNo: 2,
        Type: PaymentType.Volume,
        Amount: 5_560_000_000, // ~20% - Hoàn thành móng
        TreasuryRef: 'KB-XL-2024-002',
        Status: PaymentStatus.Transferred,
    },
    {
        PaymentID: 203,
        ContractID: 'CTR-XL-DEMO-001',
        BatchNo: 3,
        Type: PaymentType.Volume,
        Amount: 6_950_000_000, // ~25% - Hoàn thành kết cấu
        TreasuryRef: 'KB-XL-2024-003',
        Status: PaymentStatus.Transferred,
    },
    {
        PaymentID: 204,
        ContractID: 'CTR-XL-DEMO-001',
        BatchNo: 4,
        Type: PaymentType.Volume,
        Amount: 5_560_000_000, // ~20% - Hoàn thiện thô
        TreasuryRef: 'KB-XL-2025-001',
        Status: PaymentStatus.Transferred,
    },
    {
        PaymentID: 205,
        ContractID: 'CTR-XL-DEMO-001',
        BatchNo: 5,
        Type: PaymentType.Volume,
        Amount: 4_170_000_000, // ~15% - Hoàn thiện tinh (trừ 5% bảo hành)
        TreasuryRef: 'KB-XL-2025-002',
        Status: PaymentStatus.Pending, // Đang chờ duyệt
    },
    // 5% giữ lại bảo hành = 1,390,000,000 sẽ thanh toán sau khi hết bảo hành
];

// GENERATE DATA: Project -> Package (1) -> Contract (1)
mockProjects.forEach((project, index) => {
    // 1. Find specific contracts for this project
    const projectSpecificContracts = specificContracts.filter(c => c.pid === project.ProjectID);

    if (projectSpecificContracts.length > 0) {
        // Create 1 Package and 1 Contract for EACH specific contract found
        projectSpecificContracts.forEach((sc, i) => {
            const pkgId = `PKG-${project.ProjectID}-${sc.type}-${i + 1}`;

            // Find or create contractor
            let contractorID = mockContractors.find(c => c.FullName === sc.cName)?.ContractorID;
            if (!contractorID) {
                // If not found in mock list, assign a random one for visual purposes
                contractorID = mockContractors[i % mockContractors.length].ContractorID;
            }

            // Create Package
            mockBiddingPackages.push({
                PackageID: pkgId,
                ProjectID: project.ProjectID,
                PackageNumber: `${sc.type}-0${i + 1}`,
                PackageName: sc.name || `Gói thầu số ${i + 1} - ${sc.type}`,
                Price: sc.val * 1.05, // Estimate slightly higher than contract
                SelectionMethod: sc.val > 1000000000 ? 'OpenBidding' : 'Appointed',
                BidType: 'Online',
                ContractType: 'LumpSum',
                Status: PackageStatus.Awarded,
                WinningContractorID: contractorID,
                WinningPrice: sc.val,
                PostingDate: "2023-01-15",
                BidClosingDate: "2023-02-15"
            });

            // Create Contract (Linked 1-1 to Package)
            const contract: Contract = {
                ContractID: sc.code,
                PackageID: pkgId,
                ContractorID: contractorID,
                SignDate: sc.date,
                Value: sc.val,
                AdvanceRate: 15,
                Warranty: 12,
                Status: project.Status === ProjectStatus.Completion ? ContractStatus.Liquidated : ContractStatus.Executing
            };
            mockContracts.push(contract);

            // Create Initial Payment (Advance)
            mockPayments.push({
                PaymentID: 10000 + mockPayments.length,
                ContractID: contract.ContractID,
                BatchNo: 1,
                Type: PaymentType.Advance,
                Amount: contract.Value * 0.15,
                TreasuryRef: `KB-${contract.ContractID.split('/')[0]}-01`,
                Status: PaymentStatus.Transferred
            });
        });
    } else if (project.ProjectID !== 'PR2500060068' && project.ProjectID !== 'PR2400031160' && project.ProjectID !== 'PR2500062685' && project.ProjectID !== 'PR2500044101') {
        // 2. Fallback: Create 1 Default Package & Contract if no specific data exists
        // This ensures the UI is not empty for other projects
        // SKIP FOR Truong Chinh Tri (PR2500060068) as we manually add specific packages later
        // SKIP FOR ODA Health Stations (PR2400031160) to avoid auto-generation
        let pkgStatus = PackageStatus.Planning;
        if (project.Status === ProjectStatus.Execution) pkgStatus = PackageStatus.Awarded;
        else if (project.Status === ProjectStatus.Completion) pkgStatus = PackageStatus.Awarded;
        else if (project.Status === ProjectStatus.Preparation) pkgStatus = PackageStatus.Planning;

        const pkgId = `PKG-${project.ProjectID}-XL01`;
        const contractorID = mockContractors[index % mockContractors.length].ContractorID;

        // XL Package
        const xlPkg: BiddingPackage = {
            PackageID: pkgId,
            ProjectID: project.ProjectID,
            PackageNumber: "XL-01",
            PackageName: `Thi công xây dựng công trình chính`,
            Price: project.TotalInvestment * 0.8,
            SelectionMethod: 'OpenBidding',
            BidType: 'Online',
            ContractType: 'AdjustableUnitPrice',
            Status: pkgStatus,
            WinningContractorID: pkgStatus === PackageStatus.Awarded ? contractorID : undefined,
            WinningPrice: pkgStatus === PackageStatus.Awarded ? project.TotalInvestment * 0.78 : undefined
        };
        mockBiddingPackages.push(xlPkg);

        // Contract (Only if Awarded)
        if (pkgStatus === PackageStatus.Awarded) {
            const contract: Contract = {
                ContractID: `HD-${project.ProjectID}/XL01`,
                PackageID: xlPkg.PackageID,
                ContractorID: xlPkg.WinningContractorID!,
                SignDate: "2024-01-15",
                Value: xlPkg.WinningPrice!,
                AdvanceRate: 20,
                Warranty: 24,
                Status: project.Status === ProjectStatus.Completion ? ContractStatus.Liquidated : ContractStatus.Executing
            };
            mockContracts.push(contract);

            // Payments
            mockPayments.push({
                PaymentID: 20000 + index,
                ContractID: contract.ContractID,
                BatchNo: 1,
                Type: PaymentType.Advance,
                Amount: contract.Value * 0.2,
                TreasuryRef: `KB-${project.ProjectID}-01`,
                Status: PaymentStatus.Transferred
            });
        }
    }
});

// ADD SPECIFIC PACKAGES FOR Truong Chinh Tri (Since they are not contracts yet, just packages)
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
        DecisionAgency: "Ban Quản lý dự án đầu tư xây dựng công trình Dân dụng và Hạ tầng khu vực tỉnh Hà Tĩnh",
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
        PostingDate: "2025-11-20"
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
        PostingDate: "2025-11-20"
    }
];
// Append to the generated packages
mockBiddingPackages.push(...truongChinhTriPackages);

// ADD SPECIFIC PACKAGES FOR Tram Y Te (PR2400031160)
const tramYTePackages: BiddingPackage[] = [
    {
        PackageID: "PKG-PR2400031160-01",
        ProjectID: "PR2400031160",
        PackageNumber: "01.4/TV-KS-TKBVTC",
        PackageName: "01.4/TV-KS-TKBVTC: Tư vấn Khảo sát, lập thiết kế bản vẽ thi công và dự toán dự án đầu tư xây dựng, cải tạo và nâng cấp cơ sở hạ tầng, cung cấp trang thiết bị cho các trạm y tế xã trên địa bàn tỉnh Hà Tĩnh",
        Price: 2944652402,
        WinningPrice: 2885758000,
        WinningContractorID: "3001328159", // Vinaxim
        SelectionMethod: 'OpenBidding',
        BidType: 'Online',
        ContractType: 'LumpSum',
        Status: PackageStatus.Awarded,
        NotificationCode: "IB2400183847",
        PostingDate: "23/07/2024 07:38",
        DecisionNumber: "145",
        DecisionDate: "16/07/2024",
        DecisionAgency: "Ban quản lý dự án đầu tư xây dựng công trình dân dụng và công nghiệp tỉnh Hà Tĩnh",
        Field: 'Consultancy',
        Duration: "30 ngày"
    },
    {
        PackageID: "PKG-PR2400031160-02",
        ProjectID: "PR2400031160",
        PackageNumber: "01.5/TV-TT",
        PackageName: "01.5/TV-TT: Tư vấn thẩm tra thiết kế, dự toán",
        Price: 341527205,
        SelectionMethod: 'Appointed',
        BidType: 'Offline',
        ContractType: 'LumpSum',
        Status: PackageStatus.Planning,
        Duration: "14 ngày"
    },
    {
        PackageID: "PKG-PR2400031160-03",
        ProjectID: "PR2400031160",
        PackageNumber: "01.6/TV-CHTB",
        PackageName: "01.6/TV-CHTB: Tư vấn lập cấu hình, tính năng kỹ thuật trang thiết bị y tế",
        Price: 57750000,
        SelectionMethod: 'Appointed',
        BidType: 'Offline',
        ContractType: 'LumpSum',
        Status: PackageStatus.Planning,
        Duration: "20 ngày"
    },
    {
        PackageID: "PKG-PR2400031160-04",
        ProjectID: "PR2400031160",
        PackageNumber: "01.7/TV-TĐG",
        PackageName: "01.7/TV-TĐG: Tư vấn thẩm định giá",
        Price: 138600000,
        SelectionMethod: 'Appointed',
        BidType: 'Offline',
        ContractType: 'LumpSum',
        Status: PackageStatus.Planning,
        Duration: "20 ngày"
    }
];
mockBiddingPackages.push(...tramYTePackages);

// ADD SPECIFIC PACKAGES FOR Kim Anh Project (PR2500044101)
const kimAnhPackages: BiddingPackage[] = [
    {
        PackageID: "PKG-PR2500044101-01",
        ProjectID: "PR2500044101",
        PackageNumber: "PL2500186419", // Using KHLCNT number as proxy if needed, or mapping it to KHLCNTCode
        PackageName: "Điều chỉnh nguồn vốn và phê duyệt kế hoạch lựa chọn nhà thầu bổ sung dự án Xây dựng đường nối từ đường Quốc lộ 2 - Minh Trí - Xuân Hòa đi Khu công nghiệp sạch Sóc Sơn với đường Nội Bài - 35 - Minh Phú",
        Price: 52267727,
        SelectionMethod: 'OpenBidding',
        BidType: 'Online',
        ContractType: 'LumpSum',
        Status: PackageStatus.Planning,
        KHLCNTCode: "PL2500186419",
        Field: 'Mixed', // Inferring
        Duration: "—",
        DecisionNumber: "1032/QĐ-UBND",
        DecisionDate: "28/02/2025",
        DecisionAgency: "UBND huyện Sóc Sơn"
    },
    {
        PackageID: "PKG-PR2500044101-02",
        ProjectID: "PR2500044101",
        PackageNumber: "PL2500138388",
        PackageName: "Kế hoạch lựa chọn nhà thầu dự án: Xây dựng đường nối Quốc lộ 2 - Minh Trí - Xuân Hòa đi Khu công nghiệp sạch Sóc Sơn với đường Nội Bài - 35 - Minh Phú",
        Price: 27570010110,
        SelectionMethod: 'OpenBidding',
        BidType: 'Online',
        ContractType: 'AdjustableUnitPrice',
        Status: PackageStatus.Awarded, // "KHLCNT đã thực hiện xong"
        KHLCNTCode: "PL2500138388",
        Field: 'Construction',
        Duration: "—"
    }
];
mockBiddingPackages.push(...kimAnhPackages);

// ADD SPECIFIC PACKAGES FOR Vu Ban Project (PR2500062685)
const vuBanPackages: BiddingPackage[] = [
    {
        PackageID: "PKG-PR2500062685-04",
        ProjectID: "PR2500062685",
        PackageNumber: "4",
        PackageName: "Gói thầu số 4: Tư vấn lập thiết kế bản vẽ thi công và dự toán",
        Price: 669709097,
        SelectionMethod: 'Appointed',
        BidType: 'Offline',
        ContractType: 'LumpSum',
        Duration: "30 ngày",
        DecisionAgency: "Ban Quản lý dự án đầu tư - Hạ tầng xã Kim Anh",
        WinningContractorID: "vn0107740913",
        WinningPrice: 657532000,
        DecisionNumber: "103/QĐ-QLDA",
        DecisionDate: "22/11/2025",
        DecisionFile: "QĐ 103_0001.pdf",
        Status: PackageStatus.Awarded
    },
    {
        PackageID: "PKG-PR2500062685-05",
        ProjectID: "PR2500062685",
        PackageNumber: "5",
        PackageName: "Gói thầu số 5: Tư vấn thẩm tra thiết kế bản vẽ thi công và dự toán",
        Price: 83393476,
        SelectionMethod: 'Appointed',
        BidType: 'Offline',
        ContractType: 'LumpSum',
        Duration: "30 ngày",
        DecisionAgency: "Ban Quản lý dự án đầu tư - Hạ tầng xã Kim Anh",
        WinningContractorID: "vn0108622278",
        WinningPrice: 81963000,
        DecisionNumber: "103/QĐ-QLDA",
        DecisionDate: "22/11/2025",
        DecisionFile: "QĐ 103_0001.pdf",
        Status: PackageStatus.Awarded
    },
    {
        PackageID: "PKG-PR2500062685-06",
        ProjectID: "PR2500062685",
        PackageNumber: "6",
        PackageName: "Gói thầu số 6: Tư vấn lập hồ sơ mời thầu, đánh giá hồ sơ dự thầu gói thầu 7",
        Price: 67614740,
        SelectionMethod: 'Appointed',
        BidType: 'Offline',
        ContractType: 'LumpSum',
        Duration: "30 ngày",
        DecisionAgency: "Ban Quản lý dự án đầu tư - Hạ tầng xã Kim Anh",
        WinningContractorID: "vn0107128531",
        WinningPrice: 67767000,
        DecisionNumber: "Đang cập nhật",
        DecisionDate: "15/12/2025",
        DecisionFile: "QĐ phê duyệt TKBVTC và dự toán gói thầu.pdf",
        Status: PackageStatus.Awarded
    },
    {
        PackageID: "PKG-PR2500062685-07",
        ProjectID: "PR2500062685",
        PackageNumber: "7",
        PackageName: "Gói thầu số 7: Toàn bộ phần xây dựng",
        Price: 18548389278,
        SelectionMethod: 'OpenBidding',
        BidType: 'Online',
        ContractType: 'UnitPrice',
        Status: PackageStatus.Awarded,
        Field: 'Construction',
        Duration: "360 ngày",
        NotificationCode: "IB2500605959",
        PostingDate: "29/12/2025 18:01",
        EstimatePrice: 18690734349,
        WinningContractorID: "LD-PR2500062685-07",
        WinningPrice: 18507185000,
        DecisionNumber: "194/QĐ-QLDA",
        DecisionDate: "29/12/2025",
        DecisionAgency: "Ban Quản lý dự án đầu tư - Hạ tầng xã Kim Anh",
        DecisionFile: "IB2500605959_QuyetDinhPheDuyetKQLCNT_29_12_2025.pdf"
    },
    {
        PackageID: "PKG-PR2500062685-08",
        ProjectID: "PR2500062685",
        PackageNumber: "8",
        PackageName: "Gói thầu số 8: Tư vấn giám sát thi công xây dựng",
        Price: 538963519,
        SelectionMethod: 'Appointed',
        BidType: 'Offline',
        ContractType: 'LumpSum',
        Status: PackageStatus.Awarded,
        Field: 'Consultancy',
        Duration: "360 ngày",
        EstimatePrice: 552663414,
        WinningContractorID: "vn0104426593",
        WinningPrice: 552663000,
        DecisionNumber: "196/QĐ-QLDA",
        DecisionDate: "29/12/2025",
        PostingDate: "07/01/2026",
        DecisionFile: "13. QĐ phê duyệt KQLCNT gói thầu GS, bảo hiểm.pdf",
        DecisionAgency: "Ban Quản lý dự án đầu tư - Hạ tầng xã Kim Anh"
    },
    {
        PackageID: "PKG-PR2500062685-09",
        ProjectID: "PR2500062685",
        PackageNumber: "9",
        PackageName: "Gói thầu số 9: Bảo hiểm công trình",
        Price: 14300856,
        SelectionMethod: 'Appointed',
        BidType: 'Offline',
        ContractType: 'Percentage', // Mapped roughly to logic or kept as string if type allows
        Status: PackageStatus.Awarded,
        Field: 'NonConsultancy', // Keeping as Tu van per request table usually, or Non-Consulting. User said Tu van in table column 4
        Duration: "360 ngày",
        EstimatePrice: 14780061,
        WinningContractorID: "vn0304422444",
        WinningPrice: 14780000,
        DecisionNumber: "196/QĐ-QLDA",
        DecisionDate: "29/12/2025",
        PostingDate: "07/01/2026",
        DecisionFile: "13. QĐ phê duyệt KQLCNT gói thầu GS, bảo hiểm.pdf",
        DecisionAgency: "Ban Quản lý dự án đầu tư - Hạ tầng xã Kim Anh"
    }
];
mockBiddingPackages.push(...vuBanPackages);

// --- VU BAN PROJECT CONTRACTS & PAYMENTS ---
const vuBanContracts: Contract[] = [
    {
        ContractID: "103/2025/HĐ-TVTK", // Based on decision 103/QĐ-QLDA
        PackageID: "PKG-PR2500062685-04",
        ContractorID: "vn0107740913", // Trung Hung
        SignDate: "25/11/2025",
        Value: 657532000,
        AdvanceRate: 15,
        Warranty: 0,
        Status: ContractStatus.Executing
    },
    {
        ContractID: "104/2025/HĐ-TVTT", // Guessing next number
        PackageID: "PKG-PR2500062685-05",
        ContractorID: "vn0108622278", // Tu Bo Ton Tao
        SignDate: "25/11/2025",
        Value: 81963000,
        AdvanceRate: 0,
        Warranty: 0,
        Status: ContractStatus.Executing
    },
    {
        ContractID: "105/2025/HĐ-TVHSMT",
        PackageID: "PKG-PR2500062685-06",
        ContractorID: "vn0107128531", // CNS1
        SignDate: "18/12/2025",
        Value: 67767000,
        AdvanceRate: 0,
        Warranty: 0,
        Status: ContractStatus.Executing
    },
    {
        ContractID: "194/2025/HĐ-XL07", // Based on decision 194/QĐ-QLDA
        PackageID: "PKG-PR2500062685-07",
        ContractorID: "LD-PR2500062685-07", // Lien Danh
        SignDate: "30/12/2025",
        Value: 18507185000,
        AdvanceRate: 20,
        Warranty: 12,
        Status: ContractStatus.Executing
    },
    {
        ContractID: "196/2025/HĐ-TVGS", // Based on decision 196/QĐ-QLDA
        PackageID: "PKG-PR2500062685-08",
        ContractorID: "vn0104426593", // Me Linh
        SignDate: "08/01/2026",
        Value: 552663000,
        AdvanceRate: 10,
        Warranty: 0,
        Status: ContractStatus.Executing
    },
    {
        ContractID: "197/2025/HĐ-BH",
        PackageID: "PKG-PR2500062685-09",
        ContractorID: "vn0304422444", // Bao Hiem Toan Cau
        SignDate: "08/01/2026",
        Value: 14780000,
        AdvanceRate: 0,
        Warranty: 0,
        Status: ContractStatus.Executing
    }
];
mockContracts.push(...vuBanContracts);

const vuBanPayments: Payment[] = [
    // Payment for Package 4 (TVTK) - Advance
    {
        PaymentID: 30001,
        ContractID: "103/2025/HĐ-TVTK",
        BatchNo: 1,
        Type: PaymentType.Advance,
        Amount: 657532000 * 0.15, // 15%
        Status: PaymentStatus.Transferred,
        TreasuryRef: "KB-KA-25-001"
    },
    // Payment for Package 7 (Construction) - Advance
    {
        PaymentID: 30002,
        ContractID: "194/2025/HĐ-XL07",
        BatchNo: 1,
        Type: PaymentType.Advance,
        Amount: 18507185000 * 0.20, // 20%
        Status: PaymentStatus.Pending,
        TreasuryRef: "KB-KA-26-001"
    }
];
mockPayments.push(...vuBanPayments);

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
        Description: 'Tổng hợp số liệu và lập báo cáo trình UBND tỉnh',
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
            Title: 'UBND tỉnh phê duyệt chủ trương đầu tư',
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
            Description: 'Hoàn thiện hồ sơ trình UBND tỉnh phê duyệt dự án',
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
            Title: 'UBND tỉnh ban hành QĐ phê duyệt dự án',
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
            Description: 'UBND tỉnh phê duyệt quyết toán dự án hoàn thành',
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
            Title: 'HĐND tỉnh quyết định chủ trương đầu tư',
            Description: 'Trình HĐND tỉnh quyết định chủ trương đầu tư dự án nhóm B',
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
            OutputDocument: 'Nghị quyết HĐND tỉnh'
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
            Description: 'Hoàn thiện hồ sơ trình UBND tỉnh phê duyệt dự án',
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
            Title: 'UBND tỉnh ban hành QĐ phê duyệt dự án',
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
            Description: 'UBND tỉnh phê duyệt kế hoạch lựa chọn nhà thầu',
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
const TASKS_DATA_VERSION = '2026-02-02-v1-tranphu';

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

