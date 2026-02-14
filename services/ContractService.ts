// Contract Service - Supabase CRUD operations
import { supabase } from '../lib/supabase';
import { dbToContract, contractToDb } from '../lib/dbMappers';
import { Contract, ContractStatus } from '../types';
import type { QueryParams } from '../types/api';

export class ContractService {
    /**
     * Get all contracts with optional filtering
     */
    static async getAll(params?: QueryParams): Promise<Contract[]> {
        let query = supabase.from('contracts').select('*');

        if (params?.search) {
            const s = params.search;
            query = query.or(`contract_id.ilike.%${s}%,contract_name.ilike.%${s}%,contractor_id.ilike.%${s}%`);
        }

        if (params?.filters?.status) {
            query = query.eq('status', params.filters.status);
        }

        if (params?.filters?.packageId) {
            query = query.eq('package_id', params.filters.packageId);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw new Error(`Failed to fetch contracts: ${error.message}`);
        return (data || []).map(dbToContract);
    }

    /**
     * Get a single contract by ID
     */
    static async getById(id: string): Promise<Contract | undefined> {
        const decodedId = decodeURIComponent(id);
        const { data, error } = await supabase
            .from('contracts')
            .select('*')
            .eq('contract_id', decodedId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return undefined;
            throw new Error(`Failed to fetch contract: ${error.message}`);
        }
        return data ? dbToContract(data) : undefined;
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
        const insertData = contractToDb({
            ContractID: contractData.ContractID || `HD-${Date.now()}`,
            SignDate: contractData.SignDate || new Date().toISOString().split('T')[0],
            Value: contractData.Value || 0,
            AdvanceRate: contractData.AdvanceRate || 0,
            Warranty: contractData.Warranty || 12,
            Status: contractData.Status || ContractStatus.Executing,
            ...contractData,
        });

        const { data, error } = await supabase
            .from('contracts')
            .insert(insertData)
            .select()
            .single();

        if (error) throw new Error(`Failed to create contract: ${error.message}`);
        return dbToContract(data);
    }

    /**
     * Update an existing contract
     */
    static async update(id: string, data: Partial<Contract>): Promise<Contract> {
        const updateData = contractToDb(data);

        const { data: updated, error } = await supabase
            .from('contracts')
            .update(updateData)
            .eq('contract_id', id)
            .select()
            .single();

        if (error) throw new Error(`Failed to update contract: ${error.message}`);
        return dbToContract(updated);
    }

    /**
     * Delete a contract
     */
    static async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('contracts')
            .delete()
            .eq('contract_id', id);

        if (error) throw new Error(`Failed to delete contract: ${error.message}`);
    }

    /**
     * Get contract statistics
     */
    static async getStatistics(): Promise<{
        total: number;
        totalValue: number;
        byStatus: Record<ContractStatus, number>;
    }> {
        const contracts = await this.getAll();

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
    }

    /**
     * Get contractor name by ID
     */
    static getContractorName(contractorId: string): string {
        const cached = localStorage.getItem('cached_contractors');
        if (cached) {
            try {
                const contractors = JSON.parse(cached);
                const found = contractors.find((c: any) => c.ContractorID === contractorId);
                if (found) return found.FullName;
            } catch { /* ignore */ }
        }
        return contractorId;
    }
}

export default ContractService;
