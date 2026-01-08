
import { CapitalPlan, Disbursement } from '../types';
import { mockCapitalPlans, mockDisbursements } from '../mockData';

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
    static getCapitalPlans(projectId: string): CapitalPlan[] {
        return mockCapitalPlans.filter(cp => cp.ProjectID === projectId);
    }

    /**
     * Get Disbursements for Project
     */
    static getDisbursements(projectId: string): Disbursement[] {
        return mockDisbursements.filter(d => d.ProjectID === projectId);
    }

    /**
     * Get Total Planned vs Disbursed
     */
    static getFinancialStats(projectId: string) {
        const plans = this.getCapitalPlans(projectId);
        const disbursed = this.getDisbursements(projectId);

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
    static getAlerts(projectId: string): DisbursementAlert[] {
        const stats = this.getFinancialStats(projectId);
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

        // Rule 2: Warning if unassigned capital exists
        // (Simplified logic)

        return alerts;
    }
}
