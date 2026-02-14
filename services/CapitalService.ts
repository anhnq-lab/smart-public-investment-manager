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

    /**
     * Get Capital Plans for Project
     */
    static async getCapitalPlans(projectId: string): Promise<CapitalPlan[]> {
        const { data, error } = await supabase
            .from('capital_plans')
            .select('*')
            .eq('project_id', projectId);

        if (error) throw new Error(`Failed to fetch capital plans: ${error.message}`);
        return (data || []).map((row: any) => ({
            PlanID: row.plan_id,
            ProjectID: row.project_id,
            Year: row.year,
            Amount: Number(row.amount) || 0,
            Source: row.source || '',
            DecisionNumber: row.decision_number || '',
            DateAssigned: row.date_assigned || '',
            DisbursedAmount: Number(row.disbursed_amount) || 0,
        }));
    }

    /**
     * Get Disbursements for Project
     */
    static async getDisbursements(projectId: string): Promise<Disbursement[]> {
        const { data, error } = await supabase
            .from('disbursements')
            .select('*')
            .eq('project_id', projectId)
            .order('date', { ascending: true });

        if (error) throw new Error(`Failed to fetch disbursements: ${error.message}`);
        return (data || []).map((row: any) => ({
            DisbursementID: row.disbursement_id,
            ProjectID: row.project_id,
            CapitalPlanID: row.capital_plan_id || undefined,
            AllocationID: row.capital_plan_id || undefined,
            PaymentID: row.payment_id || undefined,
            Amount: Number(row.amount) || 0,
            Date: row.date,
            TreasuryCode: row.treasury_code || '',
            FormType: row.form_type || '',
            Status: row.status as 'Pending' | 'Approved' | 'Rejected',
        }));
    }

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
}
