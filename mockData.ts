
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

// --- 1. REAL WORLD PROJECTS DATA ---
const haTinhProjects = [
    {
        id: "PR2400031160",
        name: "Đầu tư xây dựng, cải tạo và nâng cấp cơ sở hạ tầng, cung cấp trang thiết bị cho các Trạm Y tế xã trên địa bàn tỉnh Hà Tĩnh",
        total: 153173978000,
        status: ProjectStatus.Preparation,
        // New detailed fields from image
        projectNumber: "PR2400031160",
        version: "00",
        objective: "Tăng cường năng lực cho tuyến y tế cơ sở để hướng tới mục tiêu bao phủ chăm sóc sức khỏe toàn dân, góp phần bảo đảm cung ứng đầy đủ các dịch vụ chăm sóc sức khỏe ban đầu, khám bệnh, chữa bệnh cho người dân trên địa bàn; cung ứng dịch vụ theo hướng toàn diện, liên tục, phối hợp và lồng ghép chặt chẽ giữa dự phòng và điều trị giữa các cơ sở y tế, góp phần giảm quá tải cho các bệnh viện tuyến trên, bảo đảm công bằng, hiệu quả trong công tác bảo vệ, chăm sóc và nâng cao sức khỏe nhân dân",
        investor: "Ban Quản lý dự án đầu tư xây dựng công trình dân dụng và công nghiệp tỉnh Hà Tĩnh",
        authority: "UBND tỉnh Hà Tĩnh",
        duration: "3 Năm",
        managementForm: "Chủ đầu tư trực tiếp quản lý dự án",
        isODA: true,
        location: "Tỉnh Hà Tĩnh",
        decisionNumber: "1395",
        decisionDate: "06/06/2024",
        decisionAuthority: "UBND tỉnh Hà Tĩnh"
    },
    {
        id: "PR2500060068",
        name: "Đầu tư xây dựng Trường Chính trị Trần Phú",
        total: 105800000000,
        status: ProjectStatus.Preparation,
        // New detailed fields
        projectNumber: "PR2500060068",
        version: "00",
        objective: "Nâng cao chất lượng đào tạo, từng bước hoàn thiện cơ sở vật chất theo quy hoạch được duyệt; đảm bảo các yêu cầu về tiêu chuẩn trường chính trị mức 1, hướng tới mức 2 theo Đề án số 02-DA/TU ngày 09/01/2023 của Ban Thường vụ Tỉnh ủy.",
        investor: "Ban Quản lý dự án đầu tư xây dựng công trình Dân dụng và Hạ tầng khu vực tỉnh Hà Tĩnh",
        authority: "UBND tỉnh Hà Tĩnh",
        duration: "4 Năm",
        managementForm: "Chủ đầu tư trực tiếp quản lý dự án",
        isODA: false,
        location: "Tỉnh Hà Tĩnh",
        decisionNumber: "2810/QĐ-UBND",
        decisionDate: "2025-11-11",
        decisionAuthority: "UBND tỉnh Hà Tĩnh"
    },
    {
        id: "DA7596599",
        name: "Đầu tư xây dựng Bảo tàng Hà Tĩnh",
        total: 305000000000,
        status: ProjectStatus.Preparation,
        // New detailed fields
        projectNumber: "PR2500046573",
        version: "00",
        objective: "Bảo quản, trưng bày, giới thiệu các hiện vật của Bảo tàng Hà Tĩnh; góp phần gìn giữ, giáo dục và phát huy các giá trị lịch sử, văn hóa, truyền thống cách mạng của Hà Tĩnh; tạo công trình điểm nhấn về kiến trúc, văn hóa, mang đặc trưng quê hương Hà Tĩnh; nâng cao đời sống tinh thần của Nhân dân, góp phần phát triển kinh tế - xã hội.",
        investor: "Ban Quản lý dự án đầu tư xây dựng công trình giao thông và phát triển đô thị tỉnh Hà Tĩnh",
        authority: "UỶ BAN NHÂN DÂN TỈNH HÀ TĨNH",
        duration: "8 Năm",
        managementForm: "Chủ đầu tư trực tiếp quản lý dự án",
        isODA: false,
        location: "Phường Thành Sen, Tỉnh Hà Tĩnh",
        decisionNumber: "1183/QĐ-UBND",
        decisionDate: "2025-05-28",
        decisionAuthority: "UỶ BAN NHÂN DÂN TỈNH HÀ TĨNH"
    },
    { id: "DA7946314", name: "Xây dựng Trung tâm HNTT, Trung tâm THDL, Trung tâm điều hành thông minh", total: 89616000000, status: ProjectStatus.Preparation },
    { id: "DA7946312", name: "Nâng cấp, cải tạo Bệnh viện Đa khoa huyện Cẩm Xuyên", total: 150000000000, status: ProjectStatus.Execution },
    { id: "DA004", name: "Dự án Mở rộng khuôn viên Trung tâm Điều dưỡng Người có công và Bảo trợ xã hội tỉnh", total: 19675000000, status: ProjectStatus.Execution },
    { id: "DA7544621", name: "Dự án BIIG2 (Hạ tầng cơ bản cho phát triển toàn diện)", total: 216000000000, status: ProjectStatus.Execution },
    { id: "DA7501924", name: "Dự án vốn vay quỹ Ả rập xê út (Dự án Ả rập)", total: 667800000000, status: ProjectStatus.Execution },
    { id: "DA007", name: "Dự án Đầu tư xây mới, nâng cấp, cải tạo 19 Trạm y tế tuyến xã, tỉnh Hà Tĩnh", total: 72000000000, status: ProjectStatus.Finished },
    { id: "DA7535585", name: "Trung tâm y tế huyện Kỳ Anh", total: 311681222000, status: ProjectStatus.Execution },
    { id: "DA009", name: "Dự án Đầu tư nâng cấp trang thiết bị y tế BVĐK, TTYT tuyến huyện", total: 193000000000, status: ProjectStatus.Execution },
    { id: "DA773293501", name: "Khu nhà khám bệnh và HCTH - BVĐK huyện Nghi Xuân", total: 45243728276, status: ProjectStatus.Execution },
    { id: "DA773293502", name: "Khu nhà Khoa Sản, Nhi, Ngoại - BVĐK huyện Thạch Hà", total: 36993188000, status: ProjectStatus.Finished },
    { id: "DA7946313", name: "Nhà ký túc xá học sinh, trường THPT chuyên Hà Tĩnh", total: 21000000000, status: ProjectStatus.Execution },
    { id: "DA013", name: "Trường nghề chất lượng cao, Trường CĐ kỹ thuật Việt Đức", total: 120000000000, status: ProjectStatus.Preparation },
    { id: "DA014", name: "Dự án Bệnh viện Y học cổ truyền Giai đoạn 2", total: 60000000000, status: ProjectStatus.Execution },
    { id: "DA7632186", name: "Tu bổ, tôn tạo Khu di tích Quốc gia đặc biệt Đại thi hào Nguyễn Du (GĐ 1)", total: 170959678000, status: ProjectStatus.Finished },
    { id: "DA7872498", name: "Dự án Hồ sinh thái Ngã 3 Đồng Lộc (GĐ 2)", total: 43980789000, status: ProjectStatus.Execution },
    { id: "DA7796352", name: "Cải tạo, nâng cấp, tăng cường cơ sở vật chất trụ sở Tỉnh ủy", total: 104269674307, status: ProjectStatus.Finished },
    { id: "DA018", name: "Sàn giao dịch việc làm tại thành phố Hà Tĩnh", total: 31812000000, status: ProjectStatus.Preparation },
    { id: "DA7987973", name: "Nhà học 5 tầng Trường Trung cấp nghề Hà Tĩnh", total: 37460000000, status: ProjectStatus.Execution },
    { id: "DA7333066", name: "Quản lý nguồn nước tổng hợp và phát triển đô thị BĐKH", total: 180000000000, status: ProjectStatus.Execution },
    { id: "DA7767755", name: "Trồng mới, phục hồi và bảo tồn rừng ngập mặn ven biển", total: 30778000000, status: ProjectStatus.Execution },
    { id: "DA022", name: "Đầu tư xây dựng, cải tạo trạm y tế xã (Vốn ADB)", total: 88000000000, status: ProjectStatus.Execution },
    { id: "DA023", name: "Cải tạo nhà KTX sinh viên Lào - ĐH Hà Tĩnh", total: 9400000000, status: ProjectStatus.Execution },
    { id: "DA7763646", name: "Trụ sở làm việc Trạm kiểm dịch động vật nội địa", total: 15000000000, status: ProjectStatus.Finished },
    { id: "DA024", name: "Nâng cấp trụ sở làm việc Sở Y tế", total: 25000000000, status: ProjectStatus.Execution },
    {
        id: "PR2500044101",
        name: "Xây dựng đường nối từ đường Quốc lộ 2 - Minh Trí - Xuân Hòa đi Khu Công nghiệp sạch Sóc Sơn với đường Nội Bài - 35 - Minh Phú",
        total: 57526217000,
        status: ProjectStatus.Preparation,
        // New detailed fields from image
        projectNumber: "PR2500044101",
        version: "00",
        objective: "", // Not specified in image, left empty
        investor: "Ban Quản lý dự án đầu tư - Hạ tầng xã Kim Anh",
        authority: "Chủ tịch UBND xã Kim Anh",
        duration: "3 Năm",
        managementForm: "BQLDA chuyên ngành - khu vực",
        isODA: false,
        location: "Xã Kim Anh, Thành phố Hà Nội",
        decisionNumber: "1032/QĐ-UBND",
        decisionDate: "2025-02-28",
        decisionAuthority: "UBND huyện Sóc Sơn"
    },
    {
        id: "PR2500062685",
        name: "Tu bổ, tôn tạo đình Vụ Bản, xã Minh Trí",
        total: 21032000000,
        status: ProjectStatus.Execution,
        // New detailed fields from image
        projectNumber: "PR2500062685",
        version: "00",
        objective: "",
        investor: "Ban Quản lý dự án đầu tư - Hạ tầng xã Kim Anh",
        authority: "Chủ tịch UBND xã Kim Anh",
        duration: "3 Năm",
        managementForm: "Chủ đầu tư trực tiếp quản lý dự án",
        isODA: false,
        location: "Xã Kim Anh, Thành phố Hà Nội",
        decisionNumber: "1620/QĐ-UBND",
        decisionDate: "2025-11-04",
        decisionAuthority: "UBND xã Kim Anh"
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

export const mockProjects: Project[] = haTinhProjects.map((p, i) => {
    let progress = 0;
    let paymentProgress = 0;

    if (p.status === ProjectStatus.Finished) {
        progress = 100;
        paymentProgress = 98; // High disbursement for finished
    } else if (p.status === ProjectStatus.Execution) {
        progress = 15 + Math.floor(Math.random() * 70);
        paymentProgress = Math.max(0, progress - 15 - Math.floor(Math.random() * 10));
    } else {
        progress = Math.floor(Math.random() * 5);
    }

    // Specific logic for DA007 to ensure it looks perfectly finished
    if (p.id === 'DA007') {
        progress = 100;
        paymentProgress = 99.5;
    }

    // Cast to any to access new fields for mapping without full typing on haTinhProjects source
    const pAny = p as any;

    return {
        ProjectID: p.id,
        ProjectName: p.name,
        GroupCode: p.total >= 2300000000000 ? ProjectGroup.A : (p.total >= 80000000000 ? ProjectGroup.B : ProjectGroup.C),
        InvestmentType: p.name.includes("ODA") || p.name.includes("ADB") || pAny.isODA ? InvestmentType.Other : InvestmentType.Public,
        DecisionMakerID: 100,
        TotalInvestment: p.total,
        CapitalSource: pAny.isODA || p.name.includes("ODA") ? "Vốn ODA" : "Ngân sách Tỉnh, NSTW",
        LocationCode: pAny.location || (p.id === 'DA007' ? "Toàn tỉnh" : "Hà Tĩnh"),
        ApprovalDate: pAny.decisionDate || `202${2 + (i % 3)}-0${(i % 8) + 1}-15`,
        Status: p.status,
        IsEmergency: false,
        ImageUrl: projectImages[i % projectImages.length],
        Progress: progress,
        PaymentProgress: paymentProgress,
        InvestorName: pAny.investor || "Ban QLDA ĐTXD công trình DD&CN tỉnh",
        MainContractorName: p.status === ProjectStatus.Preparation ? "Đang lựa chọn" : "Liên danh nhà thầu",
        ConstructionType: p.name.includes("Bệnh viện") || p.name.includes("Trạm y tế") || p.name.includes("Trường") ? "Công trình Dân dụng" : "Hạ tầng kỹ thuật",
        ConstructionGrade: p.total > 100000000000 ? "II" : "III",
        Members:
            p.id === 'DA007' ? ["NV1001", "NV1005", "NV1008"] :
                p.id === 'PR2400031160' ? ["NV1001", "NV1002", "NV1033"] :
                    p.id === 'PR2500060068' ? ["NV1001", "NV1003", "NV1027"] :
                        p.id === 'DA7596599' ? ["NV1001", "NV1014", "NV1034"] :
                            p.id === 'DA7946312' ? ["NV1001", "NV1015", "NV1035"] :
                                p.id === 'DA7544621' ? ["NV1001", "NV1016", "NV1036"] :
                                    p.id === 'DA7501924' ? ["NV1001", "NV1002", "NV1033", "NV1037"] :
                                        p.id === 'PR2500044101' ? ["NV1001", "NV1005"] :
                                            p.id === 'PR2500062685' ? ["NV1001", "NV1033"] :
                                                i % 3 === 0 ? ["NV1001", "NV1002"] : ["NV1002", "NV1003"],

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
        SyncStatus: p.id === 'PR2400031160' ? {
            IsSynced: true,
            LastSyncDate: '2024-06-15',
            NationalProjectCode: '112233-0001',
            SyncError: undefined
        } : (p.id === 'PR2500060068' ? {
            IsSynced: false,
            LastSyncDate: undefined,
            NationalProjectCode: undefined,
            SyncError: undefined
        } : (p.id === 'PR2500062685' ? {
            IsSynced: true,
            LastSyncDate: '2025-11-25',
            NationalProjectCode: 'PR2500062685',
            SyncError: undefined
        } : undefined)),

        // Map Coordinates (Random around Ha Tinh: 18.343x, 105.90xx)
        Coordinates: {
            lat: 18.33 + (Math.random() * 0.1 - 0.05), // Random spread
            lng: 105.9 + (Math.random() * 0.1 - 0.05)
        },

        // Phase 2 Enhancement: Lifecycle & Compliance
        Stage: p.status === ProjectStatus.Preparation ? ProjectStage.Preparation :
            p.status === ProjectStatus.Execution ? ProjectStage.Execution :
                p.status === ProjectStatus.Finished ? ProjectStage.Completion :
                    ProjectStage.Operation,

        Sector: p.name.includes('Y tế') || p.name.includes('Bệnh viện') || p.name.includes('Trạm') ? ProjectSector.Health :
            p.name.includes('Trường') || p.name.includes('Giáo dục') ? ProjectSector.Education :
                p.name.includes('đường') || p.name.includes('Giao thông') ? ProjectSector.Transport :
                    ProjectSector.Other,

        // BIM Requirements (Group B+ or Grade II+)
        RequiresBIM: p.total >= 80000000000 || (p.total > 100000000000),
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
        EmployeeID: "NV1001",
        FullName: "Nguyễn Quốc Anh",
        Username: "Admin",
        Password: "123456",
        Role: Role.Admin,
        Department: "Phòng Điều hành dự án",
        Position: "Trưởng phòng",
        Email: "quocanhnguyen.ksxd@gmail.com",
        Phone: "0943431591",
        AvatarUrl: "https://ui-avatars.com/api/?name=Nguyễn+Quốc+Anh&background=random&color=fff",
        JoinDate: "2022-08-20",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1002",
        FullName: "Phạm Xuân Lương",
        Username: "PXLUONG.BGĐ",
        Password: "1",
        Role: Role.Staff,
        Department: "Ban Giám đốc",
        Position: "Phó Giám đốc",
        Email: "luong1202@gmail.com",
        Phone: "0913643668",
        AvatarUrl: "https://ui-avatars.com/api/?name=Phạm+Xuân+Lương&background=random&color=fff",
        JoinDate: "1977-02-12",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1003",
        FullName: "Nguyễn Văn Nhân",
        Username: "NVNHAN.BGĐ",
        Password: "1",
        Role: Role.Staff,
        Department: "Ban Giám đốc",
        Position: "Phó Giám đốc",
        Email: "NguyenNhanDA@gmail.com",
        Phone: "0913294603",
        AvatarUrl: "https://ui-avatars.com/api/?name=Nguyễn+Văn+Nhân&background=random&color=fff",
        JoinDate: "1980-03-09",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1004",
        FullName: "Trần Ngọc Bảo",
        Username: "TNBAO.BGĐ",
        Password: "1",
        Role: Role.Staff,
        Department: "Ban Giám đốc",
        Position: "Phó Giám đốc",
        Email: "tranngocbao@gmail.com",
        Phone: "0944564567",
        AvatarUrl: "https://ui-avatars.com/api/?name=Trần+Ngọc+Bảo&background=random&color=fff",
        JoinDate: "1970-07-07",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1005",
        FullName: "Thái Anh Dũng",
        Username: "TADUNG.HCTH",
        Password: "1",
        Role: Role.Admin,
        Department: "Phòng Hành chính - Tổng hợp",
        Position: "Trưởng phòng",
        Email: "thaianhdunght@gmail.com",
        Phone: "0918673368",
        AvatarUrl: "https://ui-avatars.com/api/?name=Thái+Anh+Dũng&background=random&color=fff",
        JoinDate: "1969-12-30",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1006",
        FullName: "Đoàn Chính Hữu",
        Username: "DCHUU.HCTH",
        Password: "1",
        Role: Role.Staff,
        Department: "Phòng Hành chính - Tổng hợp",
        Position: "Phó Trưởng phòng",
        Email: "chinhhuu@gmail.com",
        Phone: "0919782398",
        AvatarUrl: "https://ui-avatars.com/api/?name=Đoàn+Chính+Hữu&background=random&color=fff",
        JoinDate: "1971-02-17",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1007",
        FullName: "Bùi Thị Hường",
        Username: "BTHUONG.HCTH",
        Password: "1",
        Role: Role.Staff,
        Department: "Phòng Hành chính - Tổng hợp",
        Position: "Nhân viên",
        Email: "huongbui@qlkh.gov.vn",
        Phone: "0919586667",
        AvatarUrl: "https://ui-avatars.com/api/?name=Bùi+Thị+Hường&background=random&color=fff",
        JoinDate: "1988-10-10",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1008",
        FullName: "Đào Thị Hải Long",
        Username: "DTHLONG.HCTH",
        Password: "1",
        Role: Role.Staff,
        Department: "Phòng Hành chính - Tổng hợp",
        Position: "Nhân viên",
        Email: "longdao@qlkh.gov.vn",
        Phone: "0971071279",
        AvatarUrl: "https://ui-avatars.com/api/?name=Đào+Thị+Hải+Long&background=random&color=fff",
        JoinDate: "1976-12-09",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1009",
        FullName: "Đặng Quốc Hoàn",
        Username: "DQHOAN.HCTH",
        Password: "1",
        Role: Role.Staff,
        Department: "Phòng Hành chính - Tổng hợp",
        Position: "Nhân viên",
        Email: "hoandang@qlkh.gov.vn",
        Phone: "0915909779",
        AvatarUrl: "https://ui-avatars.com/api/?name=Đặng+Quốc+Hoàn&background=random&color=fff",
        JoinDate: "1974-05-02",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1010",
        FullName: "Nguyễn Quốc Hoàn",
        Username: "NQHOAN.HCTH",
        Password: "1",
        Role: Role.Staff,
        Department: "Phòng Hành chính - Tổng hợp",
        Position: "Nhân viên",
        Email: "hoannguyen@qlkh.gov.vn",
        Phone: "0904236270",
        AvatarUrl: "https://ui-avatars.com/api/?name=Nguyễn+Quốc+Hoàn&background=random&color=fff",
        JoinDate: "1970-02-02",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1011",
        FullName: "Võ Thị Hiền",
        Username: "VTHIEN.HCTH",
        Password: "1",
        Role: Role.Staff,
        Department: "Phòng Hành chính - Tổng hợp",
        Position: "Nhân viên",
        Email: "hienvo@qlkh.gov.vn",
        Phone: "0912906117",
        AvatarUrl: "https://ui-avatars.com/api/?name=Võ+Thị+Hiền&background=random&color=fff",
        JoinDate: "1979-06-27",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1012",
        FullName: "Đoàn Ngọc Phước",
        Username: "DNPHUOC.HCTH",
        Password: "1",
        Role: Role.Staff,
        Department: "Phòng Hành chính - Tổng hợp",
        Position: "Nhân viên",
        Email: "ngocphuoc67@gmail.com",
        Phone: "0913029730",
        AvatarUrl: "https://ui-avatars.com/api/?name=Đoàn+Ngọc+Phước&background=random&color=fff",
        JoinDate: "1967-04-08",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1013",
        FullName: "Nguyễn Thị Phương Loan",
        Username: "NTPLOAN.HCTH",
        Password: "1",
        Role: Role.Staff,
        Department: "Phòng Hành chính - Tổng hợp",
        Position: "Nhân viên",
        Email: "loannguyen@qlkh.gov.vn",
        Phone: "0978756657",
        AvatarUrl: "https://ui-avatars.com/api/?name=Nguyễn+Thị+Phương+Loan&background=random&color=fff",
        JoinDate: "1977-11-25",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1014",
        FullName: "Nguyễn Văn Dũng",
        Username: "NVDUNG.DHDA",
        Password: "123",
        Role: Role.Staff,
        Department: "Phòng Điều hành dự án",
        Position: "Nhân viên",
        Email: "dung.nv@qlkh.gov.vn",
        Phone: "0912345679",
        AvatarUrl: "https://ui-avatars.com/api/?name=Nguyễn+Văn+Dũng&background=random&color=fff",
        JoinDate: "2022-09-01",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1015",
        FullName: "Nguyễn Thanh Bình",
        Username: "NTBINH.KHTC",
        Password: "1",
        Role: Role.Staff,
        Department: "Phòng Kế hoạch - Tài chính",
        Position: "Trưởng phòng",
        Email: "tbinh@gmail.com",
        Phone: "0825452266",
        AvatarUrl: "https://ui-avatars.com/api/?name=Nguyễn+Thanh+Bình&background=random&color=fff",
        JoinDate: "1982-04-10",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1016",
        FullName: "Trần Bá Châu",
        Username: "TBCHAU.KHTC",
        Password: "1",
        Role: Role.Staff,
        Department: "Phòng Kế hoạch - Tài chính",
        Position: "KT Trưởng",
        Email: "tranchauhp@gmail.com",
        Phone: "0987404004",
        AvatarUrl: "https://ui-avatars.com/api/?name=Trần+Bá+Châu&background=random&color=fff",
        JoinDate: "1985-02-25",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1017",
        FullName: "Nguyễn Thị Quỳnh Nga",
        Username: "NTQNGA.KHTC",
        Password: "1",
        Role: Role.Staff,
        Department: "Phòng Kế hoạch - Tài chính",
        Position: "Phó Trưởng phòng",
        Email: "ng.quynhnga85@gmail.com",
        Phone: "0916213568",
        AvatarUrl: "https://ui-avatars.com/api/?name=Nguyễn+Thị+Quỳnh+Nga&background=random&color=fff",
        JoinDate: "1985-10-13",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1018",
        FullName: "Phạm Viết Cần",
        Username: "PVCAN.KHTC",
        Password: "1",
        Role: Role.Staff,
        Department: "Phòng Kế hoạch - Tài chính",
        Position: "Nhân viên",
        Email: "vietcank48@gmail.com",
        Phone: "0943881388",
        AvatarUrl: "https://ui-avatars.com/api/?name=Phạm+Viết+Cần&background=random&color=fff",
        JoinDate: "1989-01-30",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1019",
        FullName: "Phan Thị Thu Hà",
        Username: "PTTHA.KHTC",
        Password: "1",
        Role: Role.Staff,
        Department: "Phòng Kế hoạch - Tài chính",
        Position: "Nhân viên",
        Email: "phanha5982@gmail.com",
        Phone: "0982859992",
        AvatarUrl: "https://ui-avatars.com/api/?name=Phan+Thị+Thu+Hà&background=random&color=fff",
        JoinDate: "1982-09-05",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1020",
        FullName: "Nguyễn Thị Vân Anh",
        Username: "NTVANH.KHTC",
        Password: "1",
        Role: Role.Staff,
        Department: "Phòng Kế hoạch - Tài chính",
        Position: "Nhân viên",
        Email: "nguyenthivananh@gmail.com",
        Phone: "0941998686",
        AvatarUrl: "https://ui-avatars.com/api/?name=Nguyễn+Thị+Vân+Anh&background=random&color=fff",
        JoinDate: "1992-12-19",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1021",
        FullName: "Phạm Thị Oanh",
        Username: "PTOANH.KHTC",
        Password: "1",
        Role: Role.Staff,
        Department: "Phòng Kế hoạch - Tài chính",
        Position: "Nhân viên",
        Email: "oanhpt224@gmail.com",
        Phone: "0976559745",
        AvatarUrl: "https://ui-avatars.com/api/?name=Phạm+Thị+Oanh&background=random&color=fff",
        JoinDate: "1991-03-20",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1022",
        FullName: "Phan Thị Hải",
        Username: "PTHAI.KHTC",
        Password: "1",
        Role: Role.Staff,
        Department: "Phòng Kế hoạch - Tài chính",
        Position: "Nhân viên",
        Email: "haiimppht@gmail.com",
        Phone: "0917795328",
        AvatarUrl: "https://ui-avatars.com/api/?name=Phan+Thị+Hải&background=random&color=fff",
        JoinDate: "1981-04-10",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1023",
        FullName: "Trần Thị Quỳnh Trang",
        Username: "TTQTRANG.KHTC",
        Password: "1",
        Role: Role.Staff,
        Department: "Phòng Kế hoạch - Tài chính",
        Position: "Nhân viên",
        Email: "TranQuynhTrang1011@gmail.com",
        Phone: "0916762698",
        AvatarUrl: "https://ui-avatars.com/api/?name=Trần+Thị+Quỳnh+Trang&background=random&color=fff",
        JoinDate: "1987-11-10",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1024",
        FullName: "Nguyễn Thị Hương Giang",
        Username: "NTHGIANG.KHTC",
        Password: "1",
        Role: Role.Staff,
        Department: "Phòng Kế hoạch - Tài chính",
        Position: "Nhân viên",
        Email: "nguyenthihuonggiang@gmail.com",
        Phone: "0983451082",
        AvatarUrl: "https://ui-avatars.com/api/?name=Nguyễn+Thị+Hương+Giang&background=random&color=fff",
        JoinDate: "1982-10-20",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1025",
        FullName: "Trần Mai Kỳ Duyên",
        Username: "TMKDUYEN.KHTC",
        Password: "1",
        Role: Role.Staff,
        Department: "Phòng Kế hoạch - Tài chính",
        Position: "Nhân viên",
        Email: "tmkduyen@gmail.com",
        Phone: "0984896963",
        AvatarUrl: "https://ui-avatars.com/api/?name=Trần+Mai+Kỳ+Duyên&background=random&color=fff",
        JoinDate: "1994-07-23",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1026",
        FullName: "Vũ Thị Giang",
        Username: "VTGIANG.KHTC",
        Password: "1",
        Role: Role.Staff,
        Department: "Phòng Kế hoạch - Tài chính",
        Position: "Nhân viên",
        Email: "vuthigiangbql@gmail.com",
        Phone: "0889758788",
        AvatarUrl: "https://ui-avatars.com/api/?name=Vũ+Thị+Giang&background=random&color=fff",
        JoinDate: "1979-07-19",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1027",
        FullName: "Đặng Hữu Phương",
        Username: "DHPHUONG.KTTĐ",
        Password: "1",
        Role: Role.Staff,
        Department: "Phòng Kỹ thuật - Thẩm định",
        Position: "Trưởng phòng",
        Email: "dangphuong.kta@gmail.com",
        Phone: "0915398669",
        AvatarUrl: "https://ui-avatars.com/api/?name=Đặng+Hữu+Phương&background=random&color=fff",
        JoinDate: "1989-03-01",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1028",
        FullName: "Trịnh Thúc Hiếu",
        Username: "TTHIEU.KTTĐ",
        Password: "1",
        Role: Role.Staff,
        Department: "Phòng Kỹ thuật - Thẩm định",
        Position: "Nhân viên",
        Email: "thuchieu86@gmail.com",
        Phone: "0982410982",
        AvatarUrl: "https://ui-avatars.com/api/?name=Trịnh+Thúc+Hiếu&background=random&color=fff",
        JoinDate: "1986-03-19",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1029",
        FullName: "Bùi Thị Hiền",
        Username: "BTHIEN.KTTĐ",
        Password: "1",
        Role: Role.Staff,
        Department: "Phòng Kỹ thuật - Thẩm định",
        Position: "Nhân viên",
        Email: "hienbui279@gmail.com",
        Phone: "0977667253",
        AvatarUrl: "https://ui-avatars.com/api/?name=Bùi+Thị+Hiền&background=random&color=fff",
        JoinDate: "1996-09-27",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1030",
        FullName: "Bùi Văn Minh",
        Username: "BVMINH.KTTĐ",
        Password: "1",
        Role: Role.Staff,
        Department: "Phòng Kỹ thuật - Thẩm định",
        Position: "Nhân viên",
        Email: "minhbui@qlkh.gov.vn",
        Phone: "0912824246",
        AvatarUrl: "https://ui-avatars.com/api/?name=Bùi+Văn+Minh&background=random&color=fff",
        JoinDate: "1983-03-02",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1031",
        FullName: "Hoàng Đức Giang",
        Username: "HDGIANG.KTTĐ",
        Password: "1",
        Role: Role.Staff,
        Department: "Phòng Kỹ thuật - Thẩm định",
        Position: "Nhân viên",
        Email: "hoangducgiang.ht@gmail.com",
        Phone: "0917967699",
        AvatarUrl: "https://ui-avatars.com/api/?name=Hoàng+Đức+Giang&background=random&color=fff",
        JoinDate: "1979-02-22",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1032",
        FullName: "Võ Tá Đại",
        Username: "VTDAI.KTTĐ",
        Password: "1",
        Role: Role.Staff,
        Department: "Phòng Kỹ thuật - Thẩm định",
        Position: "Nhân viên",
        Email: "votadai77@gmail.com",
        Phone: "0919969156",
        AvatarUrl: "https://ui-avatars.com/api/?name=Võ+Tá+Đại&background=random&color=fff",
        JoinDate: "1978-05-05",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1033",
        FullName: "Phạm Quang Hòa",
        Username: "PQHOA.DHDA",
        Password: "1",
        Role: Role.Staff,
        Department: "Phòng Điều hành dự án",
        Position: "Trưởng phòng",
        Email: "phamquanghoa215@gmail.com",
        Phone: "0905838768",
        AvatarUrl: "https://ui-avatars.com/api/?name=Phạm+Quang+Hòa&background=random&color=fff",
        JoinDate: "1983-05-21",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1034",
        FullName: "Phan Quốc Bảo",
        Username: "PQBAO.DHDA",
        Password: "1",
        Role: Role.Staff,
        Department: "Phòng Điều hành dự án",
        Position: "Phó Trưởng phòng",
        Email: "baophan@qlkh.gov.vn",
        Phone: "0915416489",
        AvatarUrl: "https://ui-avatars.com/api/?name=Phan+Quốc+Bảo&background=random&color=fff",
        JoinDate: "1984-06-20",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1035",
        FullName: "Nguyễn Hữu Nam",
        Username: "NHNAM.DHDA",
        Password: "1",
        Role: Role.Staff,
        Department: "Phòng Điều hành dự án",
        Position: "Nhân viên",
        Email: "nhnam03@gmail.com",
        Phone: "0934659468",
        AvatarUrl: "https://ui-avatars.com/api/?name=Nguyễn+Hữu+Nam&background=random&color=fff",
        JoinDate: "1979-10-10",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1036",
        FullName: "Nguyễn Văn Thọ",
        Username: "NVTHO.DHDA",
        Password: "1",
        Role: Role.Staff,
        Department: "Phòng Điều hành dự án",
        Position: "Nhân viên",
        Email: "nguyenvanthoht87@gmail.com",
        Phone: "0915320787",
        AvatarUrl: "https://ui-avatars.com/api/?name=Nguyễn+Văn+Thọ&background=random&color=fff",
        JoinDate: "1988-07-27",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1037",
        FullName: "Nguyễn Văn Thái",
        Username: "NVTHAI.DHDA",
        Password: "123",
        Role: Role.Staff,
        Department: "Phòng Điều hành dự án",
        Position: "Nhân viên",
        Email: "vanthai038@gmail.com",
        Phone: "0912198286",
        AvatarUrl: "https://ui-avatars.com/api/?name=Nguyễn+Văn+Thái&background=random&color=fff",
        JoinDate: "1981-10-22",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1038",
        FullName: "Võ Việt Đức",
        Username: "VVDUC.DHDA",
        Password: "1",
        Role: Role.Staff,
        Department: "Phòng Điều hành dự án",
        Position: "Nhân viên",
        Email: "ducvo@qlkh.gov.vn",
        Phone: "0948122636",
        AvatarUrl: "https://ui-avatars.com/api/?name=Võ+Việt+Đức&background=random&color=fff",
        JoinDate: "1981-11-05",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1039",
        FullName: "Lê Bạch Long",
        Username: "LBLONG.DHDA",
        Password: "1",
        Role: Role.Staff,
        Department: "Phòng Điều hành dự án",
        Position: "Nhân viên",
        Email: "lebachlongre2@gmail.com",
        Phone: "0915263015",
        AvatarUrl: "https://ui-avatars.com/api/?name=Lê+Bạch+Long&background=random&color=fff",
        JoinDate: "1981-07-20",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1040",
        FullName: "Phan Lưu Khánh Linh",
        Username: "PLKLINH.DHDA",
        Password: "1",
        Role: Role.Admin,
        Department: "Phòng Điều hành dự án",
        Position: "Nhân viên",
        Email: "linhphan@qlkh.gov.vn",
        Phone: "0918421299",
        AvatarUrl: "https://ui-avatars.com/api/?name=Phan+Lưu+Khánh+Linh&background=random&color=fff",
        JoinDate: "1995-10-04",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1041",
        FullName: "Nguyễn Thị Thu Thảo",
        Username: "NTTTHAO.DHDA",
        Password: "1",
        Role: Role.Staff,
        Department: "Phòng Điều hành dự án",
        Position: "Nhân viên",
        Email: "nguyenthuthaokthn@gmail.com",
        Phone: "0972756705",
        AvatarUrl: "https://ui-avatars.com/api/?name=Nguyễn+Thị+Thu+Thảo&background=random&color=fff",
        JoinDate: "1992-07-10",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1042",
        FullName: "Cù Chí Tài",
        Username: "CCTAI.DHDA",
        Password: "1",
        Role: Role.Staff,
        Department: "Phòng Điều hành dự án",
        Position: "Nhân viên",
        Email: "philongdhkt81@gmail.com",
        Phone: "0919647002",
        AvatarUrl: "https://ui-avatars.com/api/?name=Cù+Chí+Tài&background=random&color=fff",
        JoinDate: "1981-07-21",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1043",
        FullName: "Nguyễn Văn Quang",
        Username: "NVQUANG.DHDA",
        Password: "1",
        Role: Role.Staff,
        Department: "Phòng Điều hành dự án",
        Position: "Nhân viên",
        Email: "quangxd06a4@gmail.com",
        Phone: "0979352606",
        AvatarUrl: "https://ui-avatars.com/api/?name=Nguyễn+Văn+Quang&background=random&color=fff",
        JoinDate: "1987-03-20",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1044",
        FullName: "Trần Đức Anh",
        Username: "TDANH.DHDA",
        Password: "123",
        Role: Role.Staff,
        Department: "Phòng Điều hành dự án",
        Position: "Nhân viên",
        Email: "tranducanh@gmail.com",
        Phone: "0915966937",
        AvatarUrl: "https://ui-avatars.com/api/?name=Trần+Đức+Anh&background=random&color=fff",
        JoinDate: "1992-01-28",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1045",
        FullName: "Nguyễn Duy Linh",
        Username: "NDLINH.DHDA",
        Password: "1",
        Role: Role.Staff,
        Department: "Phòng Điều hành dự án",
        Position: "Nhân viên",
        Email: "duylinh261084@gmail.com",
        Phone: "0948889384",
        AvatarUrl: "https://ui-avatars.com/api/?name=Nguyễn+Duy+Linh&background=random&color=fff",
        JoinDate: "1984-10-26",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1046",
        FullName: "Nguyễn Văn Khoa",
        Username: "NVKHOA.DHDA",
        Password: "1",
        Role: Role.Staff,
        Department: "Phòng Điều hành dự án",
        Position: "Nhân viên",
        Email: "khoanguyen@qlkh.gov.vn",
        Phone: "0985290406",
        AvatarUrl: "https://ui-avatars.com/api/?name=Nguyễn+Văn+Khoa&background=random&color=fff",
        JoinDate: "1991-10-10",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1047",
        FullName: "Trần Anh Dũng",
        Username: "TADUNG.DHDA",
        Password: "1",
        Role: Role.Staff,
        Department: "Phòng Điều hành dự án",
        Position: "Nhân viên",
        Email: "ce.trandung@gmail.com",
        Phone: "0975920086",
        AvatarUrl: "https://ui-avatars.com/api/?name=Trần+Anh+Dũng&background=random&color=fff",
        JoinDate: "1986-02-26",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1048",
        FullName: "Lê Tùng Nguyên",
        Username: "LTNGUYEN.DHDA",
        Password: "1",
        Role: Role.Staff,
        Department: "Phòng Điều hành dự án",
        Position: "Nhân viên",
        Email: "letungnguyen@gmail.com",
        Phone: "0948561105",
        AvatarUrl: "https://ui-avatars.com/api/?name=Lê+Tùng+Nguyên&background=random&color=fff",
        JoinDate: "1997-04-17",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1049",
        FullName: "Hà Vũ Tuấn Dũng",
        Username: "HVTDUNG.DHDA",
        Password: "1",
        Role: Role.Staff,
        Department: "Phòng Điều hành dự án",
        Position: "Nhân viên",
        Email: "hadungxd7@gmail.com",
        Phone: "0917182828",
        AvatarUrl: "https://ui-avatars.com/api/?name=Hà+Vũ+Tuấn+Dũng&background=random&color=fff",
        JoinDate: "1985-04-21",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1050",
        FullName: "Trần Ngọc Đồng",
        Username: "TNDONG.DHDA",
        Password: "1",
        Role: Role.Staff,
        Department: "Phòng Điều hành dự án",
        Position: "Nhân viên",
        Email: "Tndong1312@gmail.com",
        Phone: "0914199099",
        AvatarUrl: "https://ui-avatars.com/api/?name=Trần+Ngọc+Đồng&background=random&color=fff",
        JoinDate: "1993-12-13",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1051",
        FullName: "Võ Mạnh Hà",
        Username: "VMHA.PTDV",
        Password: "1",
        Role: Role.Staff,
        Department: "Phòng Phát triển dịch vụ",
        Position: "Trưởng phòng",
        Email: "havo@qlkh.gov.vn",
        Phone: "0912999356",
        AvatarUrl: "https://ui-avatars.com/api/?name=Võ+Mạnh+Hà&background=random&color=fff",
        JoinDate: "1980-04-24",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1052",
        FullName: "Bùi Nam Sơn",
        Username: "BNSON.PTDV",
        Password: "1",
        Role: Role.Staff,
        Department: "Phòng Phát triển dịch vụ",
        Position: "Phó Trưởng phòng",
        Email: "sonbui@qlkh.gov.vn",
        Phone: "0903484777",
        AvatarUrl: "https://ui-avatars.com/api/?name=Bùi+Nam+Sơn&background=random&color=fff",
        JoinDate: "1981-08-26",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1053",
        FullName: "Trần Đức Huy",
        Username: "TDHUY.PTDV",
        Password: "1",
        Role: Role.Staff,
        Department: "Phòng Phát triển dịch vụ",
        Position: "Nhân viên",
        Email: "tranhuy2608@gmail.com",
        Phone: "0977075678",
        AvatarUrl: "https://ui-avatars.com/api/?name=Trần+Đức+Huy&background=random&color=fff",
        JoinDate: "1983-07-20",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1054",
        FullName: "Đào Xuân Hiên",
        Username: "DXHIEN.PTDV",
        Password: "1",
        Role: Role.Staff,
        Department: "Phòng Phát triển dịch vụ",
        Position: "Nhân viên",
        Email: "hiendao@qlkh.gov.vn",
        Phone: "0904130509",
        AvatarUrl: "https://ui-avatars.com/api/?name=Đào+Xuân+Hiên&background=random&color=fff",
        JoinDate: "1967-04-01",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1055",
        FullName: "Nguyễn Thị Vân",
        Username: "NTVAN.PTDV",
        Password: "1",
        Role: Role.Staff,
        Department: "Phòng Phát triển dịch vụ",
        Position: "Nhân viên",
        Email: "vannguyen2708ht@gmail.com",
        Phone: "0948602288",
        AvatarUrl: "https://ui-avatars.com/api/?name=Nguyễn+Thị+Vân&background=random&color=fff",
        JoinDate: "1983-02-09",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1056",
        FullName: "Hoàng Văn Nam",
        Username: "HVNAM.PTDV",
        Password: "1",
        Role: Role.Staff,
        Department: "Phòng Phát triển dịch vụ",
        Position: "Nhân viên",
        Email: "namhoang@qlkh.gov.vn",
        Phone: "0918415321",
        AvatarUrl: "https://ui-avatars.com/api/?name=Hoàng+Văn+Nam&background=random&color=fff",
        JoinDate: "1994-10-04",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1057",
        FullName: "Dương Thị Quỳnh Hoa",
        Username: "DTQHOA.PTDV",
        Password: "1",
        Role: Role.Staff,
        Department: "Phòng Phát triển dịch vụ",
        Position: "Nhân viên",
        Email: "quynhhoaht2003@gmail.com",
        Phone: "0914445646",
        AvatarUrl: "https://ui-avatars.com/api/?name=Dương+Thị+Quỳnh+Hoa&background=random&color=fff",
        JoinDate: "1984-10-31",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1058",
        FullName: "Trương Bá Thuận",
        Username: "TBTHUAN.PTDV",
        Password: "1",
        Role: Role.Staff,
        Department: "Phòng Phát triển dịch vụ",
        Position: "Nhân viên",
        Email: "thuantruong@qlkh.gov.vn",
        Phone: "0919782821",
        AvatarUrl: "https://ui-avatars.com/api/?name=Trương+Bá+Thuận&background=random&color=fff",
        JoinDate: "1986-05-20",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1059",
        FullName: "Nguyễn Thị Hồng Lam",
        Username: "NTHLAM.PTDV",
        Password: "1",
        Role: Role.Staff,
        Department: "Phòng Phát triển dịch vụ",
        Position: "Nhân viên",
        Email: "honglam.isdp@gmail.com",
        Phone: "0912917191",
        AvatarUrl: "https://ui-avatars.com/api/?name=Nguyễn+Thị+Hồng+Lam&background=random&color=fff",
        JoinDate: "1979-03-05",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1060",
        FullName: "Bùi Khắc Hùng",
        Username: "BKHUNG.PTDV",
        Password: "1",
        Role: Role.Admin,
        Department: "Phòng Phát triển dịch vụ",
        Position: "Nhân viên",
        Email: "hungbui@qlkh.gov.vn",
        Phone: "0925869868",
        AvatarUrl: "https://ui-avatars.com/api/?name=Bùi+Khắc+Hùng&background=random&color=fff",
        JoinDate: "1991-10-20",
        Status: EmployeeStatus.Active
    },
    {
        EmployeeID: "NV1061",
        FullName: "Lê Thị Thanh Bình",
        Username: "LTTBINH.PTDV",
        Password: "1",
        Role: Role.Staff,
        Department: "Phòng Phát triển dịch vụ",
        Position: "Nhân viên",
        Email: "lebinh2208599@gmail.com",
        Phone: "0967102789",
        AvatarUrl: "https://ui-avatars.com/api/?name=Lê+Thị+Thanh+Bình&background=random&color=fff",
        JoinDate: "1999-08-22",
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
                Status: project.Status === ProjectStatus.Finished ? ContractStatus.Liquidated : ContractStatus.Executing
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
        else if (project.Status === ProjectStatus.Finished) pkgStatus = PackageStatus.Awarded;
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
                Status: project.Status === ProjectStatus.Finished ? ContractStatus.Liquidated : ContractStatus.Executing
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

