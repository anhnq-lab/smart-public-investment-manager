// Project Service - CRUD operations for Projects
import api from './api';
import { mockProjects } from '../mockData';
import { Project, ProjectStatus, ProjectGroup, BiddingPackage, PackageStatus, CapitalAllocation, Disbursement } from '../types';
import type { QueryParams } from '../types/api';

// Local storage key for persisted projects
const PROJECTS_STORAGE_KEY = 'app_projects';

// Load projects from localStorage or fallback to mock
const loadProjectsFromStorage = (): Project[] => {
    try {
        const saved = localStorage.getItem(PROJECTS_STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            // If we have saved data but it's empty, fallback to mockProjects to "restore" data
            // This prevents "lost data" feeling if the user wiped storage or had a bug.
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }
    } catch (e) {
        console.error('Failed to load projects from storage', e);
    }
    return mockProjects;
};

// Save projects to localStorage
const saveProjectsToStorage = (projects: Project[]): void => {
    try {
        localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
    } catch (e) {
        console.error('Failed to save projects to storage', e);
    }
};

export class ProjectService {
    /**
     * Get all projects with optional filtering
     */
    static async getAll(params?: QueryParams): Promise<Project[]> {
        return api.get('/projects', () => {
            let projects = loadProjectsFromStorage();

            // Apply search filter
            if (params?.search) {
                const searchLower = params.search.toLowerCase();
                projects = projects.filter(p =>
                    p.ProjectName.toLowerCase().includes(searchLower) ||
                    p.ProjectID.toLowerCase().includes(searchLower)
                );
            }

            // Apply status filter
            if (params?.filters?.status) {
                projects = projects.filter(p => p.Status === params.filters!.status);
            }

            // Apply group filter
            if (params?.filters?.group) {
                projects = projects.filter(p => p.GroupCode === params.filters!.group);
            }

            // Apply sorting
            if (params?.sortBy) {
                projects.sort((a, b) => {
                    const aVal = (a as any)[params.sortBy!];
                    const bVal = (b as any)[params.sortBy!];
                    const order = params.sortOrder === 'desc' ? -1 : 1;
                    if (typeof aVal === 'string') {
                        return aVal.localeCompare(bVal) * order;
                    }
                    return ((aVal || 0) - (bVal || 0)) * order;
                });
            }

            return projects;
        }, params);
    }

    /**
     * Get a single project by ID (supports both ProjectID and ProjectNumber)
     */
    static async getById(id: string): Promise<Project | undefined> {
        return api.get(`/projects/${id}`, () => {
            const projects = loadProjectsFromStorage();
            return projects.find(p =>
                p.ProjectID === id ||
                p.ProjectNumber === id ||
                p.ProjectID === decodeURIComponent(id)
            );
        });
    }

    /**
     * Create a new project
     */
    static async create(projectData: Partial<Project>): Promise<Project> {
        return api.post('/projects', projectData, () => {
            const projects = loadProjectsFromStorage();

            const newProject: Project = {
                ProjectID: projectData.ProjectID || `PR${Date.now()}`,
                ProjectName: projectData.ProjectName || 'Dự án mới',
                GroupCode: projectData.GroupCode || ProjectGroup.C,
                InvestmentType: projectData.InvestmentType || 1,
                DecisionMakerID: projectData.DecisionMakerID || 100,
                TotalInvestment: projectData.TotalInvestment || 0,
                CapitalSource: projectData.CapitalSource || 'Ngân sách Tỉnh',
                LocationCode: projectData.LocationCode || 'Hà Tĩnh',
                ApprovalDate: projectData.ApprovalDate || new Date().toISOString().split('T')[0],
                Status: projectData.Status || ProjectStatus.Preparation,
                IsEmergency: projectData.IsEmergency || false,
                Progress: 0,
                PaymentProgress: 0,
                ...projectData,
            };

            const updatedProjects = [newProject, ...projects];
            saveProjectsToStorage(updatedProjects);

            return newProject;
        });
    }

    /**
     * Update an existing project
     */
    static async update(id: string, data: Partial<Project>): Promise<Project> {
        return api.put(`/projects/${id}`, data, () => {
            const projects = loadProjectsFromStorage();
            const index = projects.findIndex(p => p.ProjectID === id);

            if (index === -1) {
                throw new Error(`Project ${id} not found`);
            }

            const updatedProject = { ...projects[index], ...data };
            projects[index] = updatedProject;
            saveProjectsToStorage(projects);

            return updatedProject;
        });
    }

    /**
     * Delete a project
     */
    static async delete(id: string): Promise<void> {
        return api.delete(`/projects/${id}`, () => {
            const projects = loadProjectsFromStorage();
            const filtered = projects.filter(p => p.ProjectID !== id);
            saveProjectsToStorage(filtered);
        });
    }

    /**
     * Get project statistics
     */
    static async getStatistics(): Promise<{
        total: number;
        byStatus: Record<ProjectStatus, number>;
        byGroup: Record<ProjectGroup, number>;
        totalInvestment: number;
    }> {
        return api.get('/projects/statistics', () => {
            const projects = loadProjectsFromStorage();

            const byStatus = {
                [ProjectStatus.Preparation]: 0,
                [ProjectStatus.Execution]: 0,
                [ProjectStatus.Completion]: 0,
            };

            const byGroup = {
                [ProjectGroup.QN]: 0,
                [ProjectGroup.A]: 0,
                [ProjectGroup.B]: 0,
                [ProjectGroup.C]: 0,
            };

            let totalInvestment = 0;

            projects.forEach(p => {
                byStatus[p.Status]++;
                byGroup[p.GroupCode]++;
                totalInvestment += p.TotalInvestment;
            });

            return {
                total: projects.length,
                byStatus,
                byGroup,
                totalInvestment,
            };
        });
    }

    /**
     * Get projects by status
     */
    static async getByStatus(status: ProjectStatus): Promise<Project[]> {
        return this.getAll({ filters: { status } });
    }

    /**
     * Search projects
     */
    static async search(query: string): Promise<Project[]> {
        return this.getAll({ search: query });
    }
    /**
     * Get bidding packages for a project
     */
    static async getPackagesByProject(projectId: string): Promise<BiddingPackage[]> {
        // Mock data
        return api.get(`/projects/${projectId}/packages`, () => {
            return [
                // === PKG-000: COMPLETE LIFECYCLE PACKAGE (All stages filled) ===
                {
                    PackageID: 'PKG-000',
                    ProjectID: projectId,
                    PackageNumber: 'XL-00',
                    PackageName: 'Thi công xây dựng phần thân và hoàn thiện công trình nhà học 5 tầng',
                    Price: 28500000000, // 28.5 tỷ dự toán
                    SelectionMethod: 'OpenBidding',
                    SelectionProcedure: 'OneStageTwoEnvelope',
                    BidType: 'Online',
                    ContractType: 'LumpSum',
                    Status: PackageStatus.Awarded,
                    Field: 'Construction',

                    // KHLCNT Info
                    KHLCNTCode: 'PL2400098765',
                    DecisionNumber: '1234/QĐ-UBND',
                    DecisionDate: '2024-01-15',
                    FundingSource: 'Ngân sách tỉnh và ngân sách trung ương',
                    Description: 'Thi công xây dựng phần thân, hoàn thiện kiến trúc, PCCC, điện nước nội thất công trình nhà học 5 tầng theo thiết kế được duyệt.',
                    SelectionDuration: '45 ngày',
                    SelectionStartDate: 'Tháng 2/2024',
                    HasOption: false,

                    // TBMT Info  
                    NotificationCode: 'IB2400098765',
                    PostingDate: '2024-02-01',
                    BidClosingDate: '2024-03-15T09:00:00',
                    BidOpeningDate: '2024-03-15T09:30:00',

                    // Result Info
                    WinningContractorID: 'CT-COMPLETE',
                    WinningPrice: 27800000000, // Tiết kiệm 700 triệu (2.5%)
                    ApprovalDate_Result: '2024-04-01',

                    // Contract Info
                    ContractID: 'CTR-PKG-000',
                    Duration: '540 ngày, kể từ ngày ký hợp đồng',
                },
                // === PKG-001: Awarded but not Completed ===
                {
                    PackageID: 'PKG-001',
                    ProjectID: projectId,
                    PackageNumber: 'XL-01',
                    PackageName: 'Thi công xây dựng hạng mục chung',
                    Price: 15000000000,
                    SelectionMethod: 'OpenBidding',
                    SelectionProcedure: 'OneStageOneEnvelope',
                    BidType: 'Online',
                    ContractType: 'LumpSum',
                    Status: PackageStatus.Awarded,
                    WinningContractorID: 'CT-001',
                    NotificationCode: 'IB2400012345',
                    KHLCNTCode: 'PL2400056789',
                    PostingDate: '2024-02-15',
                    BidClosingDate: '2024-03-05',
                    BidOpeningDate: '2024-03-05',
                    WinningPrice: 14850000000,
                    Duration: '360 ngày',
                    Field: 'Construction',
                    FundingSource: 'Ngân sách Nhà nước',
                    Description: 'Thi công các hạng mục xây lắp chung bao gồm: san nền, móng, kết cấu, hoàn thiện kiến trúc.',
                    DecisionNumber: '567/QĐ-UBND',
                    DecisionDate: '2024-01-10',
                    ApprovalDate_Result: '2024-03-20',
                    ContractID: 'CTR-PKG-001',
                },
                // === PKG-002: In Bidding phase ===
                {
                    PackageID: 'PKG-002',
                    ProjectID: projectId,
                    PackageNumber: 'TV-01',
                    PackageName: 'Tư vấn giám sát thi công',
                    Price: 500000000,
                    SelectionMethod: 'Appointed',
                    SelectionProcedure: 'Reduced',
                    BidType: 'Offline',
                    ContractType: 'TimeBased',
                    Status: PackageStatus.Bidding,
                    Duration: '360 ngày',
                    Field: 'Consultancy',
                    KHLCNTCode: 'PL2400056789',
                    FundingSource: 'Ngân sách tỉnh',
                    Description: 'Tư vấn giám sát quá trình thi công các gói thầu xây lắp thuộc dự án.',
                    DecisionNumber: '567/QĐ-UBND',
                    DecisionDate: '2024-01-10',
                    NotificationCode: 'IB2400012399',
                    PostingDate: '2024-06-01',
                    BidClosingDate: '2024-06-20',
                },
                // === PKG-003: In Planning phase ===
                {
                    PackageID: 'PKG-003',
                    ProjectID: projectId,
                    PackageNumber: 'XL-02',
                    PackageName: 'Thi công hệ thống điện nhẹ',
                    Price: 2000000000,
                    SelectionMethod: 'OpenBidding',
                    SelectionProcedure: 'OneStageOneEnvelope',
                    BidType: 'Online',
                    ContractType: 'LumpSum',
                    Status: PackageStatus.Planning,
                    Duration: '90 ngày',
                    Field: 'Construction',
                    KHLCNTCode: 'PL2400056789',
                    FundingSource: 'Ngân sách Nhà nước',
                    Description: 'Cung cấp, lắp đặt hệ thống điện nhẹ bao gồm: LAN, điện thoại, camera, báo cháy.',
                    DecisionNumber: '567/QĐ-UBND',
                    DecisionDate: '2024-01-10',
                },
                // === PKG-004: Evaluating phase ===
                {
                    PackageID: 'PKG-004',
                    ProjectID: projectId,
                    PackageNumber: 'HH-01',
                    PackageName: 'Mua sắm thiết bị nội thất văn phòng',
                    Price: 1200000000,
                    SelectionMethod: 'CompetitiveShopping',
                    SelectionProcedure: 'Normal',
                    BidType: 'Online',
                    ContractType: 'LumpSum',
                    Status: PackageStatus.Evaluating,
                    Duration: '60 ngày',
                    Field: 'Goods',
                    KHLCNTCode: 'PL2400056789',
                    FundingSource: 'Ngân sách tỉnh',
                    Description: 'Mua sắm bàn ghế, tủ hồ sơ, thiết bị văn phòng cho các phòng làm việc.',
                    DecisionNumber: '567/QĐ-UBND',
                    DecisionDate: '2024-01-10',
                    NotificationCode: 'IB2400013456',
                    PostingDate: '2024-05-15',
                    BidClosingDate: '2024-06-01',
                    BidOpeningDate: '2024-06-01',
                }
            ] as unknown as BiddingPackage[];
        });
    }

    /**
     * Get capital and disbursement info (NĐ 99/2021/NĐ-CP)
     */
    static async getCapitalInfo(projectId: string): Promise<{
        allocations: CapitalAllocation[];
        disbursements: Disbursement[];
        summary: {
            totalInvestment: number;
            totalAllocated: number;
            totalDisbursed: number;
            totalAdvance: number;
            advanceRecovered: number;
            advanceBalance: number;
            completionPayment: number;
            disbursementRate: number;
            yearlyTarget: number;
            yearlyDisbursed: number;
        }
    }> {
        return api.get(`/projects/${projectId}/capital`, () => {
            const allocations: CapitalAllocation[] = [
                {
                    AllocationID: 'AL-2023-01',
                    ProjectID: projectId,
                    Year: 2023,
                    Amount: 8000000000,
                    Source: 'NganSachTrungUong',
                    DateAssigned: '2023-02-15',
                    DecisionNumber: '112/QĐ-UBND'
                },
                {
                    AllocationID: 'AL-2024-01',
                    ProjectID: projectId,
                    Year: 2024,
                    Amount: 10000000000,
                    Source: 'NganSachTrungUong',
                    DateAssigned: '2024-01-15',
                    DecisionNumber: 'QD-UBND-2024'
                },
                {
                    AllocationID: 'AL-2025-01',
                    ProjectID: projectId,
                    Year: 2025,
                    Amount: 5000000000,
                    Source: 'NganSachDiaPhuong',
                    DateAssigned: '2025-01-20',
                    DecisionNumber: 'QD-UBND-2025'
                }
            ];

            const disbursements: Disbursement[] = [
                // 2023 — Tạm ứng XL
                {
                    DisbursementID: 'DIS-001',
                    ProjectID: projectId,
                    AllocationID: 'AL-2023-01',
                    Amount: 2400000000,
                    Date: '2023-03-20',
                    Status: 'Approved',
                    Description: 'Tạm ứng hợp đồng XL-01 (30%)',
                    Type: 'TamUng',
                    ContractNumber: 'HĐ-XL-01/2023',
                    FormType: '04a',
                    TreasuryCode: 'KB-HT-23001',
                    CumulativeBefore: 0,
                },
                // 2023 — TT KLHT đợt 1
                {
                    DisbursementID: 'DIS-002',
                    ProjectID: projectId,
                    AllocationID: 'AL-2023-01',
                    Amount: 3200000000,
                    Date: '2023-07-15',
                    Status: 'Approved',
                    Description: 'Thanh toán KLHT đợt 1 XL-01',
                    Type: 'ThanhToanKLHT',
                    ContractNumber: 'HĐ-XL-01/2023',
                    FormType: '03a',
                    TreasuryCode: 'KB-HT-23045',
                    CumulativeBefore: 2400000000,
                },
                // 2023 — Thu hồi tạm ứng
                {
                    DisbursementID: 'DIS-003',
                    ProjectID: projectId,
                    AllocationID: 'AL-2023-01',
                    Amount: 960000000,
                    Date: '2023-07-15',
                    Status: 'Approved',
                    Description: 'Thu hồi tạm ứng đợt 1 XL-01',
                    Type: 'ThuHoiTamUng',
                    ContractNumber: 'HĐ-XL-01/2023',
                    FormType: '04b',
                    TreasuryCode: 'KB-HT-23046',
                    CumulativeBefore: 5600000000,
                },
                // 2024 — Tạm ứng TV
                {
                    DisbursementID: 'DIS-004',
                    ProjectID: projectId,
                    AllocationID: 'AL-2024-01',
                    Amount: 500000000,
                    Date: '2024-02-10',
                    Status: 'Approved',
                    Description: 'Tạm ứng hợp đồng TV-01 (20%)',
                    Type: 'TamUng',
                    ContractNumber: 'HĐ-TV-01/2024',
                    FormType: '04a',
                    TreasuryCode: 'KB-HT-24012',
                    CumulativeBefore: 0,
                },
                // 2024 — TT KLHT đợt 2 XL
                {
                    DisbursementID: 'DIS-005',
                    ProjectID: projectId,
                    AllocationID: 'AL-2024-01',
                    Amount: 2800000000,
                    Date: '2024-05-20',
                    Status: 'Approved',
                    Description: 'Thanh toán KLHT đợt 2 XL-01',
                    Type: 'ThanhToanKLHT',
                    ContractNumber: 'HĐ-XL-01/2023',
                    FormType: '03a',
                    TreasuryCode: 'KB-HT-24056',
                    CumulativeBefore: 5600000000,
                },
                // 2024 — Thu hồi tạm ứng TV
                {
                    DisbursementID: 'DIS-006',
                    ProjectID: projectId,
                    AllocationID: 'AL-2024-01',
                    Amount: 250000000,
                    Date: '2024-06-15',
                    Status: 'Approved',
                    Description: 'Thu hồi tạm ứng TV-01',
                    Type: 'ThuHoiTamUng',
                    ContractNumber: 'HĐ-TV-01/2024',
                    FormType: '04b',
                    TreasuryCode: 'KB-HT-24067',
                    CumulativeBefore: 8900000000,
                },
                // 2024 — TT KLHT đợt 3 XL
                {
                    DisbursementID: 'DIS-007',
                    ProjectID: projectId,
                    AllocationID: 'AL-2024-01',
                    Amount: 2500000000,
                    Date: '2024-09-10',
                    Status: 'Approved',
                    Description: 'Thanh toán KLHT đợt 3 XL-01',
                    Type: 'ThanhToanKLHT',
                    ContractNumber: 'HĐ-XL-01/2023',
                    FormType: '03a',
                    TreasuryCode: 'KB-HT-24089',
                    CumulativeBefore: 8400000000,
                },
                // 2025 — Tạm ứng TB
                {
                    DisbursementID: 'DIS-008',
                    ProjectID: projectId,
                    AllocationID: 'AL-2025-01',
                    Amount: 1200000000,
                    Date: '2025-01-25',
                    Status: 'Approved',
                    Description: 'Tạm ứng hợp đồng TB-01 (30%)',
                    Type: 'TamUng',
                    ContractNumber: 'HĐ-TB-01/2025',
                    FormType: '04a',
                    TreasuryCode: 'KB-HT-25003',
                    CumulativeBefore: 0,
                },
                // 2025 — Chờ duyệt
                {
                    DisbursementID: 'DIS-009',
                    ProjectID: projectId,
                    AllocationID: 'AL-2025-01',
                    Amount: 800000000,
                    Date: '2025-02-05',
                    Status: 'Pending',
                    Description: 'Thanh toán KLHT TV-01',
                    Type: 'ThanhToanKLHT',
                    ContractNumber: 'HĐ-TV-01/2024',
                    FormType: '03a',
                    CumulativeBefore: 500000000,
                },
            ];

            // Tính toán summary
            const totalAdvance = disbursements
                .filter(d => d.Type === 'TamUng' && d.Status === 'Approved')
                .reduce((s, d) => s + d.Amount, 0);
            const advanceRecovered = disbursements
                .filter(d => d.Type === 'ThuHoiTamUng' && d.Status === 'Approved')
                .reduce((s, d) => s + d.Amount, 0);
            const completionPayment = disbursements
                .filter(d => d.Type === 'ThanhToanKLHT' && d.Status === 'Approved')
                .reduce((s, d) => s + d.Amount, 0);
            const totalDisbursed = totalAdvance + completionPayment - advanceRecovered;
            const totalAllocated = allocations.reduce((s, a) => s + a.Amount, 0);
            const currentYear = new Date().getFullYear();
            const yearlyTarget = allocations
                .filter(a => a.Year === currentYear)
                .reduce((s, a) => s + a.Amount, 0);
            const yearlyDisbursed = disbursements
                .filter(d => new Date(d.Date).getFullYear() === currentYear && d.Status === 'Approved')
                .reduce((s, d) => s + d.Amount, 0);

            return {
                allocations,
                disbursements,
                summary: {
                    totalInvestment: 25000000000,
                    totalAllocated,
                    totalDisbursed,
                    totalAdvance,
                    advanceRecovered,
                    advanceBalance: totalAdvance - advanceRecovered,
                    completionPayment,
                    disbursementRate: totalAllocated > 0 ? Math.round((totalDisbursed / totalAllocated) * 100) : 0,
                    yearlyTarget,
                    yearlyDisbursed: 2000000000, // Hardcode for demo
                }
            };
        });
    }
}

export default ProjectService;
