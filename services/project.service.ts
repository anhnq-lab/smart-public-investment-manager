
import { apiClient } from '../services/api.client';
import { Project, ProjectStatus } from '../types';
import { mockProjects } from '../mockData';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const projectService = {
    getAll: async (): Promise<Project[]> => {
        // In real app: return apiClient.get<Project[]>('/projects');
        await delay(500);
        return mockProjects;
    },

    getById: async (id: string): Promise<Project | undefined> => {
        // In real app: return apiClient.get<Project>(`/projects/${id}`);
        await delay(300);
        return mockProjects.find(p => p.ProjectID === id);
    },

    create: async (project: Partial<Project>): Promise<Project> => {
        // In real app: return apiClient.post<Project>('/projects', project);
        await delay(800);
        return { ...project, ProjectID: `PRJ-${Date.now()}` } as Project;
    },

    update: async (id: string, project: Partial<Project>): Promise<Project> => {
        // In real app: return apiClient.put<Project>(`/projects/${id}`, project);
        await delay(500);
        return { ...project, ProjectID: id } as Project;
    },

    delete: async (id: string): Promise<void> => {
        // In real app: return apiClient.delete(`/projects/${id}`);
        await delay(500);
    },

    // Example of specific business logic request
    getByStatus: async (status: ProjectStatus): Promise<Project[]> => {
        await delay(500);
        return mockProjects.filter(p => p.Status === status);
    }
};
