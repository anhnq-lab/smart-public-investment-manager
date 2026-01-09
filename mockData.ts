
import {
    Project, ProjectGroup, InvestmentType, ProjectStatus,
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
        }
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

export const mockBiddingPackages: BiddingPackage[] = [];
export const mockContracts: Contract[] = [];
export const mockPayments: Payment[] = [];

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
                SelectionMethod: sc.val > 1000000000 ? "Đấu thầu rộng rãi" : "Chỉ định thầu",
                BidType: "Qua mạng",
                ContractType: "Trọn gói",
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
    } else if (project.ProjectID !== 'PR2500060068' && project.ProjectID !== 'PR2400031160') {
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
            SelectionMethod: "Đấu thầu rộng rãi",
            BidType: "Qua mạng",
            ContractType: "Đơn giá điều chỉnh",
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
        SelectionMethod: "Đấu thầu rộng rãi",
        BidType: "Qua mạng",
        ContractType: "Trọn gói",
        Status: PackageStatus.Bidding,
        NotificationCode: "IB2500519537",
        PostingDate: "20/11/2025 16:47",
        BidClosingDate: "08/12/2025 07:40",
        KHLCNTCode: "PL2500295620",
        Field: "Tư vấn",
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
        SelectionMethod: "Chỉ định thầu rút gọn",
        BidType: "Không qua mạng",
        ContractType: "Trọn gói",
        Status: PackageStatus.Planning,
        PostingDate: "2025-11-20"
    },
    {
        PackageID: "PKG-PR2500060068-03",
        ProjectID: "PR2500060068",
        PackageNumber: "01.3/TVTT",
        PackageName: "Tư vấn thẩm tra thiết kế và dự toán công trình Đầu tư xây dựng Trường chính trị Trần Phú",
        Price: 237727000,
        SelectionMethod: "Chỉ định thầu rút gọn",
        BidType: "Không qua mạng",
        ContractType: "Trọn gói",
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
        SelectionMethod: "Đấu thầu rộng rãi",
        BidType: "Qua mạng",
        ContractType: "Trọn gói",
        Status: PackageStatus.Awarded,
        NotificationCode: "IB2400183847",
        PostingDate: "23/07/2024 07:38",
        DecisionNumber: "145",
        DecisionDate: "16/07/2024",
        DecisionAgency: "Ban quản lý dự án đầu tư xây dựng công trình dân dụng và công nghiệp tỉnh Hà Tĩnh",
        Field: "Tư vấn",
        Duration: "30 ngày"
    },
    {
        PackageID: "PKG-PR2400031160-02",
        ProjectID: "PR2400031160",
        PackageNumber: "01.5/TV-TT",
        PackageName: "01.5/TV-TT: Tư vấn thẩm tra thiết kế, dự toán",
        Price: 341527205,
        SelectionMethod: "Chỉ định thầu rút gọn",
        BidType: "Không qua mạng",
        ContractType: "Trọn gói",
        Status: PackageStatus.Planning,
        Duration: "14 ngày"
    },
    {
        PackageID: "PKG-PR2400031160-03",
        ProjectID: "PR2400031160",
        PackageNumber: "01.6/TV-CHTB",
        PackageName: "01.6/TV-CHTB: Tư vấn lập cấu hình, tính năng kỹ thuật trang thiết bị y tế",
        Price: 57750000,
        SelectionMethod: "Chỉ định thầu rút gọn",
        BidType: "Không qua mạng",
        ContractType: "Trọn gói",
        Status: PackageStatus.Planning,
        Duration: "20 ngày"
    },
    {
        PackageID: "PKG-PR2400031160-04",
        ProjectID: "PR2400031160",
        PackageNumber: "01.7/TV-TĐG",
        PackageName: "01.7/TV-TĐG: Tư vấn thẩm định giá",
        Price: 138600000,
        SelectionMethod: "Chỉ định thầu rút gọn",
        BidType: "Không qua mạng",
        ContractType: "Trọn gói",
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
        SelectionMethod: "Đấu thầu rộng rãi",
        BidType: "Qua mạng",
        ContractType: "Trọn gói",
        Status: PackageStatus.Planning,
        KHLCNTCode: "PL2500186419",
        Field: "Hỗn hợp", // Inferring
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
        SelectionMethod: "Đấu thầu rộng rãi",
        BidType: "Qua mạng",
        ContractType: "Đơn giá điều chỉnh",
        Status: PackageStatus.Awarded, // "KHLCNT đã thực hiện xong"
        KHLCNTCode: "PL2500138388",
        Field: "Xây lắp",
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
        SelectionMethod: "Chỉ định thầu rút gọn",
        BidType: "Không qua mạng",
        ContractType: "Trọn gói",
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
        SelectionMethod: "Chỉ định thầu rút gọn",
        BidType: "Không qua mạng",
        ContractType: "Trọn gói",
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
        SelectionMethod: "Chỉ định thầu rút gọn",
        BidType: "Không qua mạng",
        ContractType: "Trọn gói",
        Status: PackageStatus.Planning,
        Field: "Tư vấn",
        Duration: "30 ngày",
        DecisionAgency: "Ban Quản lý dự án đầu tư - Hạ tầng xã Kim Anh"
    },
    {
        PackageID: "PKG-PR2500062685-07",
        ProjectID: "PR2500062685",
        PackageNumber: "7",
        PackageName: "Gói thầu số 7: Toàn bộ phần xây dựng",
        Price: 18548389278,
        SelectionMethod: "Đấu thầu rộng rãi",
        BidType: "Qua mạng", // Standard for Open Bidding now
        ContractType: "Đơn giá cố định",
        Status: PackageStatus.Posted,
        Field: "Xây lắp",
        Duration: "360 ngày",
        DecisionAgency: "Ban Quản lý dự án đầu tư - Hạ tầng xã Kim Anh"
    },
    {
        PackageID: "PKG-PR2500062685-08",
        ProjectID: "PR2500062685",
        PackageNumber: "8",
        PackageName: "Gói thầu số 8: Tư vấn giám sát thi công xây dựng",
        Price: 538963519,
        SelectionMethod: "Chỉ định thầu rút gọn",
        BidType: "Không qua mạng",
        ContractType: "Trọn gói",
        Status: PackageStatus.Planning,
        Field: "Tư vấn",
        Duration: "360 ngày",
        DecisionAgency: "Ban Quản lý dự án đầu tư - Hạ tầng xã Kim Anh"
    },
    {
        PackageID: "PKG-PR2500062685-09",
        ProjectID: "PR2500062685",
        PackageNumber: "9",
        PackageName: "Gói thầu số 9: Bảo hiểm công trình",
        Price: 14300856,
        SelectionMethod: "Chỉ định thầu rút gọn",
        BidType: "Không qua mạng",
        ContractType: "Theo tỷ lệ phần trăm", // Mapped roughly to logic or kept as string if type allows
        Status: PackageStatus.Planning,
        Field: "Tư vấn", // Keeping as Tu van per request table usually, or Non-Consulting. User said Tu van in table column 4
        Duration: "360 ngày",
        DecisionAgency: "Ban Quản lý dự án đầu tư - Hạ tầng xã Kim Anh"
    }
];
mockBiddingPackages.push(...vuBanPackages);

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
const TASKS_DATA_VERSION = '2026-01-07-v2';

export const loadTasksFromStorage = (): Task[] => {
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

