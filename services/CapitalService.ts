// Capital Service - Supabase CRUD operations
import { supabase } from '../lib/supabase';
import { CapitalPlan, Disbursement } from '../types';

export interface DisbursementAlert {
    ProjectID: string;
    AlertLevel: 'Low' | 'Medium' | 'High';
    Message: string;
    Deadline?: string;
}

export class CapitalService {

    // ═══════════════════════════════════════════════════════════
    // CAPITAL PLANS — CRUD
    // ═══════════════════════════════════════════════════════════

    /**
     * Get Capital Plans for Project
     */
    static async getCapitalPlans(projectId: string): Promise<CapitalPlan[]> {
        const { data, error } = await supabase
            .from('capital_plans')
            .select('*')
            .eq('project_id', projectId)
            .order('year', { ascending: false });

        if (error) throw new Error(`Failed to fetch capital plans: ${error.message}`);
        return (data || []).map(this.mapCapitalPlan);
    }

    /**
     * Create a new Capital Plan
     */
    static async createCapitalPlan(plan: Omit<CapitalPlan, 'PlanID'>): Promise<CapitalPlan> {
        const { data, error } = await supabase
            .from('capital_plans')
            .insert({
                plan_id: `CP-${Date.now()}`,
                project_id: plan.ProjectID,
                year: plan.Year,
                amount: plan.Amount,
                source: plan.Source,
                decision_number: plan.DecisionNumber || null,
                date_assigned: plan.DateAssigned || null,
                disbursed_amount: plan.DisbursedAmount || 0,
                status: plan.Status || 'Approved',
            })
            .select()
            .single();

        if (error) throw new Error(`Failed to create capital plan: ${error.message}`);
        return this.mapCapitalPlan(data);
    }

    /**
     * Update an existing Capital Plan
     */
    static async updateCapitalPlan(planId: string, updates: Partial<CapitalPlan>): Promise<CapitalPlan> {
        const updateData: Record<string, any> = {};
        if (updates.Year !== undefined) updateData.year = updates.Year;
        if (updates.Amount !== undefined) updateData.amount = updates.Amount;
        if (updates.Source !== undefined) updateData.source = updates.Source;
        if (updates.DecisionNumber !== undefined) updateData.decision_number = updates.DecisionNumber;
        if (updates.DateAssigned !== undefined) updateData.date_assigned = updates.DateAssigned;
        if (updates.DisbursedAmount !== undefined) updateData.disbursed_amount = updates.DisbursedAmount;
        if (updates.Status !== undefined) updateData.status = updates.Status;

        const { data, error } = await supabase
            .from('capital_plans')
            .update(updateData)
            .eq('plan_id', planId)
            .select()
            .single();

        if (error) throw new Error(`Failed to update capital plan: ${error.message}`);
        return this.mapCapitalPlan(data);
    }

    /**
     * Delete a Capital Plan
     */
    static async deleteCapitalPlan(planId: string): Promise<void> {
        const { error } = await supabase
            .from('capital_plans')
            .delete()
            .eq('plan_id', planId);

        if (error) throw new Error(`Failed to delete capital plan: ${error.message}`);
    }

    // ═══════════════════════════════════════════════════════════
    // DISBURSEMENTS — CRUD
    // ═══════════════════════════════════════════════════════════

    /**
     * Get Disbursements for Project
     */
    static async getDisbursements(projectId: string): Promise<Disbursement[]> {
        const { data, error } = await supabase
            .from('disbursements')
            .select('*')
            .eq('project_id', projectId)
            .order('date', { ascending: false });

        if (error) throw new Error(`Failed to fetch disbursements: ${error.message}`);
        return (data || []).map(this.mapDisbursement);
    }

    /**
     * Create a new Disbursement
     */
    static async createDisbursement(d: Omit<Disbursement, 'DisbursementID'>): Promise<Disbursement> {
        const { data, error } = await supabase
            .from('disbursements')
            .insert({
                disbursement_id: `GN-${Date.now()}`,
                project_id: d.ProjectID,
                capital_plan_id: d.CapitalPlanID || null,
                payment_id: d.PaymentID || null,
                amount: d.Amount,
                date: d.Date,
                treasury_code: d.TreasuryCode || null,
                form_type: d.FormType || null,
                status: d.Status || 'Pending',
                type: d.Type || 'ThanhToanKLHT',
                description: d.Description || null,
                contract_number: d.ContractNumber || null,
                cumulative_before: d.CumulativeBefore || 0,
                advance_balance: d.AdvanceBalance || 0,
            })
            .select()
            .single();

        if (error) throw new Error(`Failed to create disbursement: ${error.message}`);
        return this.mapDisbursement(data);
    }

    /**
     * Update an existing Disbursement
     */
    static async updateDisbursement(id: string, updates: Partial<Disbursement>): Promise<Disbursement> {
        const updateData: Record<string, any> = {};
        if (updates.Amount !== undefined) updateData.amount = updates.Amount;
        if (updates.Date !== undefined) updateData.date = updates.Date;
        if (updates.TreasuryCode !== undefined) updateData.treasury_code = updates.TreasuryCode;
        if (updates.FormType !== undefined) updateData.form_type = updates.FormType;
        if (updates.Status !== undefined) updateData.status = updates.Status;
        if (updates.Type !== undefined) updateData.type = updates.Type;
        if (updates.Description !== undefined) updateData.description = updates.Description;
        if (updates.ContractNumber !== undefined) updateData.contract_number = updates.ContractNumber;
        if (updates.CapitalPlanID !== undefined) updateData.capital_plan_id = updates.CapitalPlanID;
        if (updates.CumulativeBefore !== undefined) updateData.cumulative_before = updates.CumulativeBefore;
        if (updates.AdvanceBalance !== undefined) updateData.advance_balance = updates.AdvanceBalance;

        const { data, error } = await supabase
            .from('disbursements')
            .update(updateData)
            .eq('disbursement_id', id)
            .select()
            .single();

        if (error) throw new Error(`Failed to update disbursement: ${error.message}`);
        return this.mapDisbursement(data);
    }

    /**
     * Delete a Disbursement
     */
    static async deleteDisbursement(id: string): Promise<void> {
        const { error } = await supabase
            .from('disbursements')
            .delete()
            .eq('disbursement_id', id);

        if (error) throw new Error(`Failed to delete disbursement: ${error.message}`);
    }

    // ═══════════════════════════════════════════════════════════
    // STATISTICS & ALERTS
    // ═══════════════════════════════════════════════════════════

    /**
     * Get Total Planned vs Disbursed
     */
    static async getFinancialStats(projectId: string) {
        const plans = await this.getCapitalPlans(projectId);
        const disbursed = await this.getDisbursements(projectId);

        const totalPlanned = plans.reduce((sum, p) => sum + p.Amount, 0);
        const totalDisbursed = disbursed.reduce((sum, d) => sum + d.Amount, 0);

        return {
            totalPlanned,
            totalDisbursed,
            rate: totalPlanned > 0 ? (totalDisbursed / totalPlanned) * 100 : 0
        };
    }

    /**
     * Check for Disbursement Alerts (Rule-based)
     */
    static async getAlerts(projectId: string): Promise<DisbursementAlert[]> {
        const stats = await this.getFinancialStats(projectId);
        const alerts: DisbursementAlert[] = [];
        const currentMonth = new Date().getMonth() + 1;

        // Rule 1: High risk if rate < 50% by October
        if (currentMonth >= 10 && stats.rate < 50) {
            alerts.push({
                ProjectID: projectId,
                AlertLevel: 'High',
                Message: 'Tỷ lệ giải ngân thấp (< 50%) trong Quý 4. Cần đẩy nhanh tiến độ hồ sơ thanh toán.',
                Deadline: '31/12/2024'
            });
        }

        return alerts;
    }

    // ═══════════════════════════════════════════════════════════
    // MAPPERS
    // ═══════════════════════════════════════════════════════════

    private static mapCapitalPlan(row: any): CapitalPlan {
        return {
            PlanID: row.plan_id,
            ProjectID: row.project_id,
            Year: row.year,
            Amount: Number(row.amount) || 0,
            Source: row.source || '',
            DecisionNumber: row.decision_number || '',
            DateAssigned: row.date_assigned || '',
            DisbursedAmount: Number(row.disbursed_amount) || 0,
            Status: row.status || 'Approved',
        };
    }

    private static mapDisbursement(row: any): Disbursement {
        return {
            DisbursementID: row.disbursement_id,
            ProjectID: row.project_id,
            CapitalPlanID: row.capital_plan_id || undefined,
            AllocationID: row.capital_plan_id || undefined,
            PaymentID: row.payment_id || undefined,
            Amount: Number(row.amount) || 0,
            Date: row.date,
            TreasuryCode: row.treasury_code || '',
            FormType: row.form_type || '',
            Description: row.description || '',
            Status: row.status as 'Pending' | 'Approved' | 'Rejected',
            Type: row.type || undefined,
            ContractNumber: row.contract_number || '',
            CumulativeBefore: Number(row.cumulative_before) || 0,
            AdvanceBalance: Number(row.advance_balance) || 0,
        };
    }
}
