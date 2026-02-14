// Contractor Service - Supabase CRUD operations
import { supabase } from '../lib/supabase';
import { dbToContractor, contractorToDb } from '../lib/dbMappers';
import { Contractor } from '../types';
import type { QueryParams } from '../types/api';

export class ContractorService {
    /**
     * Get all contractors with optional filtering
     */
    static async getAll(params?: QueryParams): Promise<Contractor[]> {
        let query = supabase.from('contractors').select('*');

        if (params?.search) {
            const s = params.search;
            query = query.or(`full_name.ilike.%${s}%,contractor_id.ilike.%${s}%,address.ilike.%${s}%`);
        }

        if (params?.filters?.isForeign !== undefined) {
            query = query.eq('is_foreign', params.filters.isForeign);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw new Error(`Failed to fetch contractors: ${error.message}`);
        return (data || []).map(dbToContractor);
    }

    /**
     * Get a single contractor by ID
     */
    static async getById(id: string): Promise<Contractor | undefined> {
        const { data, error } = await supabase
            .from('contractors')
            .select('*')
            .eq('contractor_id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return undefined;
            throw new Error(`Failed to fetch contractor: ${error.message}`);
        }
        return data ? dbToContractor(data) : undefined;
    }

    /**
     * Get contractor name by ID (sync helper)
     */
    static getNameById(id: string): string {
        const cached = localStorage.getItem('cached_contractors');
        if (cached) {
            try {
                const contractors: Contractor[] = JSON.parse(cached);
                const found = contractors.find(c => c.ContractorID === id);
                if (found) return found.FullName;
            } catch { /* ignore */ }
        }
        return id || 'Unknown';
    }

    /**
     * Create a new contractor
     */
    static async create(contractorData: Partial<Contractor>): Promise<Contractor> {
        const insertData = contractorToDb({
            ContractorID: contractorData.ContractorID || `NT${Date.now()}`,
            FullName: contractorData.FullName || 'Nhà thầu mới',
            IsForeign: contractorData.IsForeign || false,
            ...contractorData,
        });

        const { data, error } = await supabase
            .from('contractors')
            .insert(insertData)
            .select()
            .single();

        if (error) throw new Error(`Failed to create contractor: ${error.message}`);
        return dbToContractor(data);
    }

    /**
     * Update an existing contractor
     */
    static async update(id: string, data: Partial<Contractor>): Promise<Contractor> {
        const updateData = contractorToDb(data);

        const { data: updated, error } = await supabase
            .from('contractors')
            .update(updateData)
            .eq('contractor_id', id)
            .select()
            .single();

        if (error) throw new Error(`Failed to update contractor: ${error.message}`);
        return dbToContractor(updated);
    }

    /**
     * Delete a contractor
     */
    static async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('contractors')
            .delete()
            .eq('contractor_id', id);

        if (error) throw new Error(`Failed to delete contractor: ${error.message}`);
    }

    /**
     * Get contractor statistics
     */
    static async getStatistics(): Promise<{
        total: number;
        domestic: number;
        foreign: number;
    }> {
        const contractors = await this.getAll();

        // Cache for getNameById sync fallback
        localStorage.setItem('cached_contractors', JSON.stringify(contractors));

        return {
            total: contractors.length,
            domestic: contractors.filter(c => !c.IsForeign).length,
            foreign: contractors.filter(c => c.IsForeign).length,
        };
    }
}

export default ContractorService;
