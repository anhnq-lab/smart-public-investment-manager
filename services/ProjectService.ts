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
                [ProjectStatus.Finished]: 0,
                [ProjectStatus.Operation]: 0,
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
                {
                    PackageID: 'PKG-001',
                    ProjectID: projectId,
                    PackageNumber: 'XL-01',
                    PackageName: 'Thi công xây dựng hạng mục chung',
                    Price: 15000000000,
                    SelectionMethod: 'OpenBidding',
                    BidType: 'Online',
                    ContractType: 'LumpSum',
                    Status: PackageStatus.Contracted, // Assuming Contracted map to appropriate enum or use Casting if enum mismatch
                    contractorName: 'Công ty CP Xây dựng Hà Tĩnh',
                    NotificationCode: '20240233491',
                    PostingDate: '2024-02-15',
                    BidClosingDate: '2024-03-05',
                    WinningPrice: 14850000000,
                    Duration: '360 ngày',
                    Field: 'Construction'
                },
                {
                    PackageID: 'PKG-002',
                    ProjectID: projectId,
                    PackageNumber: 'TV-01',
                    PackageName: 'Tư vấn giám sát thi công',
                    Price: 500000000,
                    SelectionMethod: 'Appointed',
                    BidType: 'Offline',
                    ContractType: 'TimeBased',
                    Status: PackageStatus.Bidding,
                    Duration: '360 ngày',
                    Field: 'Consultancy'
                },
                {
                    PackageID: 'PKG-003',
                    ProjectID: projectId,
                    PackageNumber: 'XL-02',
                    PackageName: 'Thi công hệ thống điện nhẹ',
                    Price: 2000000000,
                    SelectionMethod: 'OpenBidding',
                    BidType: 'Online',
                    ContractType: 'LumpSum',
                    Status: PackageStatus.Planning,
                    Duration: '90 ngày',
                    Field: 'Construction'
                }
            ] as unknown as BiddingPackage[];
        });
    }

    /**
     * Get capital and disbursement info
     */
    static async getCapitalInfo(projectId: string): Promise<{
        allocations: CapitalAllocation[];
        disbursements: Disbursement[];
        summary: {
            totalInvestment: number;
            totalAllocated: number;
            totalDisbursed: number;
        }
    }> {
        return api.get(`/projects/${projectId}/capital`, () => {
            const allocations: CapitalAllocation[] = [
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
                {
                    DisbursementID: 'DIS-001',
                    ProjectID: projectId,
                    AllocationID: 'AL-2024-01',
                    Amount: 3000000000,
                    Date: '2024-03-10',
                    Status: 'Approved',
                    Description: 'Tạm ứng hợp đồng XL-01'
                },
                {
                    DisbursementID: 'DIS-002',
                    ProjectID: projectId,
                    AllocationID: 'AL-2024-01',
                    Amount: 2500000000,
                    Date: '2024-06-20',
                    Status: 'Approved',
                    Description: 'Thanh toán đợt 1 XL-01'
                },
                {
                    DisbursementID: 'DIS-003',
                    ProjectID: projectId,
                    AllocationID: 'AL-2024-01',
                    Amount: 1000000000,
                    Date: '2024-08-15',
                    Status: 'Pending',
                    Description: 'Thanh toán TV-01'
                }
            ];

            return {
                allocations,
                disbursements,
                summary: {
                    totalInvestment: 25000000000,
                    totalAllocated: 15000000000,
                    totalDisbursed: 5500000000
                }
            };
        });
    }
}

export default ProjectService;
