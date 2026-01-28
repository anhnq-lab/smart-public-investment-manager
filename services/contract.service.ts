
import { apiClient } from './api.client';
import { Contract, ContractStatus } from '../types';
import { mockContracts } from '../mockData';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const contractService = {
    getAll: async (): Promise<Contract[]> => {
        // In real app: return apiClient.get<Contract[]>('/contracts');
        await delay(600);
        return mockContracts;
    },

    getById: async (id: string): Promise<Contract | undefined> => {
        // In real app: return apiClient.get<Contract>(`/contracts/${id}`);
        await delay(300);
        return mockContracts.find(c => c.ContractID === id);
    },

    create: async (contract: Partial<Contract>): Promise<Contract> => {
        // In real app: return apiClient.post<Contract>('/contracts', contract);
        await delay(800);
        return { ...contract, ContractID: `HD-${Date.now()}` } as Contract;
    },

    update: async (id: string, contract: Partial<Contract>): Promise<Contract> => {
        // In real app: return apiClient.put<Contract>(`/contracts/${id}`, contract);
        await delay(500);
        return { ...contract, ContractID: id } as Contract;
    },

    delete: async (id: string): Promise<void> => {
        // In real app: return apiClient.delete(`/contracts/${id}`);
        await delay(500);
    }
};
