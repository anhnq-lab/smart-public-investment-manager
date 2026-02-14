// contract.service.ts — Lightweight contract service wrapper (delegates to ContractService)
import { ContractService } from './ContractService';
import { Contract } from '../types';

export const contractService = {
    getAll: async (): Promise<Contract[]> => {
        return ContractService.getAll();
    },

    getById: async (id: string): Promise<Contract | undefined> => {
        return ContractService.getById(id);
    },

    create: async (contract: Partial<Contract>): Promise<Contract> => {
        return ContractService.create(contract);
    },

    update: async (id: string, contract: Partial<Contract>): Promise<Contract> => {
        return ContractService.update(id, contract);
    },

    delete: async (id: string): Promise<void> => {
        return ContractService.delete(id);
    }
};
