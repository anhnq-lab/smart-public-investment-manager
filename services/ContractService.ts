// Contract Service - CRUD operations for Contracts
import api from './api';
import { mockContracts, mockContractors } from '../mockData';
import { Contract, ContractStatus } from '../types';
import type { QueryParams } from '../types/api';

const CONTRACTS_STORAGE_KEY = 'app_contracts';

const loadContractsFromStorage = (): Contract[] => {
    try {
        const saved = localStorage.getItem(CONTRACTS_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
    } catch (e) {
        console.error('Failed to load contracts from storage', e);
    }
    return mockContracts;
};

const saveContractsToStorage = (contracts: Contract[]): void => {
    try {
        localStorage.setItem(CONTRACTS_STORAGE_KEY, JSON.stringify(contracts));
    } catch (e) {
        console.error('Failed to save contracts to storage', e);
    }
};

export class ContractService {
    /**
     * Get all contracts with optional filtering
     */
    static async getAll(params?: QueryParams): Promise<Contract[]> {
        return api.get('/contracts', () => {
            let contracts = loadContractsFromStorage();

            if (params?.search) {
                const searchLower = params.search.toLowerCase();
                contracts = contracts.filter(c =>
                    c.ContractID.toLowerCase().includes(searchLower) ||
                    c.ContractorID.toLowerCase().includes(searchLower)
                );
            }

            if (params?.filters?.status) {
                contracts = contracts.filter(c => c.Status === params.filters!.status);
            }

            if (params?.filters?.packageId) {
                contracts = contracts.filter(c => c.PackageID === params.filters!.packageId);
            }

            return contracts;
        }, params);
    }

    /**
     * Get a single contract by ID
     */
    static async getById(id: string): Promise<Contract | undefined> {
        return api.get(`/contracts/${id}`, () => {
            const contracts = loadContractsFromStorage();
            return contracts.find(c => c.ContractID === id || c.ContractID === decodeURIComponent(id));
        });
    }

    /**
     * Get contracts by package ID
     */
    static async getByPackageId(packageId: string): Promise<Contract[]> {
        return this.getAll({ filters: { packageId } });
    }

    /**
     * Create a new contract
     */
    static async create(contractData: Partial<Contract>): Promise<Contract> {
        return api.post('/contracts', contractData, () => {
            const contracts = loadContractsFromStorage();

            const newContract: Contract = {
                ContractID: contractData.ContractID || `HD-${Date.now()}`,
                PackageID: contractData.PackageID || '',
                ContractorID: contractData.ContractorID || '',
                SignDate: contractData.SignDate || new Date().toISOString().split('T')[0],
                Value: contractData.Value || 0,
                AdvanceRate: contractData.AdvanceRate || 0,
                Warranty: contractData.Warranty || 12,
                Status: contractData.Status || ContractStatus.Executing,
                ...contractData,
            };

            const updatedContracts = [newContract, ...contracts];
            saveContractsToStorage(updatedContracts);

            return newContract;
        });
    }

    /**
     * Update an existing contract
     */
    static async update(id: string, data: Partial<Contract>): Promise<Contract> {
        return api.put(`/contracts/${id}`, data, () => {
            const contracts = loadContractsFromStorage();
            const index = contracts.findIndex(c => c.ContractID === id);

            if (index === -1) {
                throw new Error(`Contract ${id} not found`);
            }

            const updatedContract = { ...contracts[index], ...data };
            contracts[index] = updatedContract;
            saveContractsToStorage(contracts);

            return updatedContract;
        });
    }

    /**
     * Delete a contract
     */
    static async delete(id: string): Promise<void> {
        return api.delete(`/contracts/${id}`, () => {
            const contracts = loadContractsFromStorage();
            const filtered = contracts.filter(c => c.ContractID !== id);
            saveContractsToStorage(filtered);
        });
    }

    /**
     * Get contract statistics
     */
    static async getStatistics(): Promise<{
        total: number;
        totalValue: number;
        byStatus: Record<ContractStatus, number>;
    }> {
        return api.get('/contracts/statistics', () => {
            const contracts = loadContractsFromStorage();

            const byStatus = {
                [ContractStatus.Executing]: 0,
                [ContractStatus.Paused]: 0,
                [ContractStatus.Liquidated]: 0,
            };

            let totalValue = 0;

            contracts.forEach(c => {
                byStatus[c.Status]++;
                totalValue += c.Value;
            });

            return {
                total: contracts.length,
                totalValue,
                byStatus,
            };
        });
    }

    /**
     * Get contractor name by ID
     */
    static getContractorName(contractorId: string): string {
        const contractor = mockContractors.find(c => c.ContractorID === contractorId);
        return contractor?.FullName || contractorId;
    }
}

export default ContractService;
