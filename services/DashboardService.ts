// Dashboard Service - Supabase queries
import { supabase } from '../lib/supabase';
import { ProjectStatus, ProjectGroup, PaymentType } from '../types';
import {
    DashboardMetrics,
    DashboardChartData,
    DashboardRisk,
    DashboardProjectStatus,
    DashboardGroupDistribution,
    DashboardDeadline,
    DashboardGPMB
} from '../types/dashboard';
import { dbToContractor } from '../lib/dbMappers';

export const DashboardService = {
    getMetrics: async (): Promise<DashboardMetrics> => {
        // Fetch projects total investment
        const { data: projects } = await supabase
            .from('projects')
            .select('total_investment');

        const totalInvestment = (projects || []).reduce((acc, p) => acc + Number(p.total_investment), 0);

        // Fetch payments
        const { data: payments } = await supabase
            .from('payments')
            .select('amount, status, type');

        const totalDisbursed = (payments || [])
            .filter(p => p.status === 'Transferred')
            .reduce((acc, p) => acc + Number(p.amount), 0);
        const disbursementRate = totalInvestment > 0 ? (totalDisbursed / totalInvestment) * 100 : 0;
        const totalVolumeValue = (payments || [])
            .filter(p => p.type === PaymentType.Volume)
            .reduce((acc, p) => acc + Number(p.amount), 0);
        const riskCount = 3; // TODO: compute from real data

        return {
            totalInvestment,
            totalDisbursed,
            disbursementRate,
            totalVolumeValue,
            riskCount
        };
    },

    getDisbursementChart: async (): Promise<DashboardChartData[]> => {
        // TODO: aggregate from real disbursement data
        return [
            { name: 'T1', disbursement: 4200, plan: 4500 },
            { name: 'T2', disbursement: 3800, plan: 4000 },
            { name: 'T3', disbursement: 5100, plan: 5500 },
            { name: 'T4', disbursement: 6200, plan: 6000 },
            { name: 'T5', disbursement: 4800, plan: 5200 },
            { name: 'T6', disbursement: 5900, plan: 6500 },
            { name: 'T7', disbursement: 7200, plan: 8000 },
            { name: 'T8', disbursement: 0, plan: 8500 },
            { name: 'T9', disbursement: 0, plan: 9000 },
        ];
    },

    getRisks: async (): Promise<DashboardRisk[]> => {
        // TODO: derive from actual data
        return [
            { id: 1, type: 'budget', msg: 'Dự án Cầu Cửa Nhượng: Nguy cơ vượt tổng mức đầu tư 5%', date: '20-12-2025' },
            { id: 2, type: 'schedule', msg: 'Dự án Đường ven biển: Chậm tiến độ GPMB 2 tuần', date: '19-12-2025' },
            { id: 3, type: 'legal', msg: 'Dự án Bệnh viện Tỉnh: Thiếu giấy phép PCCC', date: '19-12-2025' },
        ];
    },

    getProjectStatusDistribution: async (): Promise<DashboardProjectStatus[]> => {
        const { data: projects } = await supabase
            .from('projects')
            .select('status');

        const counts = {
            [ProjectStatus.Preparation]: 0,
            [ProjectStatus.Execution]: 0,
            [ProjectStatus.Completion]: 0,
        };
        (projects || []).forEach(p => {
            const s = p.status as ProjectStatus;
            if (counts[s] !== undefined) counts[s]++;
        });

        return [
            { name: 'Chuẩn bị dự án', value: counts[ProjectStatus.Preparation], color: '#F59E0B' },
            { name: 'Thực hiện dự án', value: counts[ProjectStatus.Execution], color: '#3B82F6' },
            { name: 'Kết thúc xây dựng', value: counts[ProjectStatus.Completion], color: '#10B981' },
        ];
    },

    getGroupDistribution: async (): Promise<DashboardGroupDistribution[]> => {
        const { data: projects } = await supabase
            .from('projects')
            .select('group_code');

        const counts = {
            [ProjectGroup.QN]: 0,
            [ProjectGroup.A]: 0,
            [ProjectGroup.B]: 0,
            [ProjectGroup.C]: 0,
        };
        (projects || []).forEach(p => {
            const g = p.group_code?.trim() as ProjectGroup;
            if (counts[g] !== undefined) counts[g]++;
        });

        return [
            { name: 'Nhóm A', value: counts[ProjectGroup.A], color: '#8B5CF6' },
            { name: 'Nhóm B', value: counts[ProjectGroup.B], color: '#6366F1' },
            { name: 'Nhóm C', value: counts[ProjectGroup.C], color: '#EC4899' },
        ];
    },

    getDeadlines: async (): Promise<DashboardDeadline[]> => {
        // TODO: derive from tasks with upcoming due dates
        return [
            { id: 1, title: 'Trình thẩm định Báo cáo KTKT', project: 'Dự án Trường Trần Phú', due: 'Ngày mai', urgent: true },
            { id: 2, title: 'Phê duyệt Tờ trình kế hoạch', project: 'Dự án Đường ven biển', due: '22/12', urgent: false },
            { id: 3, title: 'Họp giao ban công trường', project: 'Dự án Cầu Cửa Nhượng', due: '23/12', urgent: false },
            { id: 4, title: 'Nghiệm thu đợt 1', project: 'Dự án Đê kè biển', due: '24/12', urgent: false },
        ];
    },

    getGPMBData: async (): Promise<DashboardGPMB> => {
        return {
            bottlenecks: 2,
            handedOverPercent: 85
        };
    },

    getTopContractors: async () => {
        const { data } = await supabase
            .from('contractors')
            .select('*')
            .limit(5);

        return (data || []).map(dbToContractor);
    }
};
