// Contractor Service - CRUD operations for Contractors
import api from './api';
import { mockContractors } from '../mockData';
import { Contractor } from '../types';
import type { QueryParams } from '../types/api';

const CONTRACTORS_STORAGE_KEY = 'app_contractors';

const loadContractorsFromStorage = (): Contractor[] => {
    try {
        const saved = localStorage.getItem(CONTRACTORS_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
    } catch (e) {
        console.error('Failed to load contractors from storage', e);
    }
    return mockContractors;
};

const saveContractorsToStorage = (contractors: Contractor[]): void => {
    try {
        localStorage.setItem(CONTRACTORS_STORAGE_KEY, JSON.stringify(contractors));
    } catch (e) {
        console.error('Failed to save contractors to storage', e);
    }
};

export class ContractorService {
    /**
     * Get all contractors with optional filtering
     */
    static async getAll(params?: QueryParams): Promise<Contractor[]> {
        return api.get('/contractors', () => {
            let contractors = loadContractorsFromStorage();

            if (params?.search) {
                const searchLower = params.search.toLowerCase();
                contractors = contractors.filter(c =>
                    c.FullName.toLowerCase().includes(searchLower) ||
                    c.ContractorID.toLowerCase().includes(searchLower) ||
                    c.Address.toLowerCase().includes(searchLower)
                );
            }

            if (params?.filters?.isForeign !== undefined) {
                contractors = contractors.filter(c => c.IsForeign === params.filters!.isForeign);
            }

            return contractors;
        }, params);
    }

    /**
     * Get a single contractor by ID
     */
    static async getById(id: string): Promise<Contractor | undefined> {
        return api.get(`/contractors/${id}`, () => {
            const contractors = loadContractorsFromStorage();
            return contractors.find(c => c.ContractorID === id);
        });
    }

    /**
     * Get contractor name by ID (sync helper)
     */
    static getNameById(id: string): string {
        const contractors = loadContractorsFromStorage();
        const contractor = contractors.find(c => c.ContractorID === id);
        return contractor?.FullName || id;
    }

    /**
     * Create a new contractor
     */
    static async create(contractorData: Partial<Contractor>): Promise<Contractor> {
        return api.post('/contractors', contractorData, () => {
            const contractors = loadContractorsFromStorage();

            const newContractor: Contractor = {
                ContractorID: contractorData.ContractorID || `NT${Date.now()}`,
                CapCertCode: contractorData.CapCertCode || '',
                FullName: contractorData.FullName || 'Nhà thầu mới',
                IsForeign: contractorData.IsForeign || false,
                Address: contractorData.Address || '',
                ContactInfo: contractorData.ContactInfo || '',
                ...contractorData,
            };

            const updatedContractors = [newContractor, ...contractors];
            saveContractorsToStorage(updatedContractors);

            return newContractor;
        });
    }

    /**
     * Update an existing contractor
     */
    static async update(id: string, data: Partial<Contractor>): Promise<Contractor> {
        return api.put(`/contractors/${id}`, data, () => {
            const contractors = loadContractorsFromStorage();
            const index = contractors.findIndex(c => c.ContractorID === id);

            if (index === -1) {
                throw new Error(`Contractor ${id} not found`);
            }

            const updatedContractor = { ...contractors[index], ...data };
            contractors[index] = updatedContractor;
            saveContractorsToStorage(contractors);

            return updatedContractor;
        });
    }

    /**
     * Delete a contractor
     */
    static async delete(id: string): Promise<void> {
        return api.delete(`/contractors/${id}`, () => {
            const contractors = loadContractorsFromStorage();
            const filtered = contractors.filter(c => c.ContractorID !== id);
            saveContractorsToStorage(filtered);
        });
    }

    /**
     * Get contractor statistics
     */
    static async getStatistics(): Promise<{
        total: number;
        domestic: number;
        foreign: number;
    }> {
        return api.get('/contractors/statistics', () => {
            const contractors = loadContractorsFromStorage();
            return {
                total: contractors.length,
                domestic: contractors.filter(c => !c.IsForeign).length,
                foreign: contractors.filter(c => c.IsForeign).length,
            };
        });
    }
}

export default ContractorService;
