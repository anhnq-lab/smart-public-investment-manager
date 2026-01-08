// Project Service - CRUD operations for Projects
import api from './api';
import { mockProjects } from '../mockData';
import { Project, ProjectStatus, ProjectGroup } from '../types';
import type { QueryParams } from '../types/api';

// Local storage key for persisted projects
const PROJECTS_STORAGE_KEY = 'app_projects';

// Load projects from localStorage or fallback to mock
const loadProjectsFromStorage = (): Project[] => {
    try {
        const saved = localStorage.getItem(PROJECTS_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
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
}

export default ProjectService;
