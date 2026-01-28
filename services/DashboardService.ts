import { mockProjects, mockPayments, mockContractors } from '../mockData';
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

// Simulating API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const DashboardService = {
    getMetrics: async (): Promise<DashboardMetrics> => {
        await delay(500);
        const totalInvestment = mockProjects.reduce((acc, curr) => acc + curr.TotalInvestment, 0);
        const totalDisbursed = mockPayments.filter(p => p.Status === 'Transferred').reduce((acc, curr) => acc + curr.Amount, 0);
        const disbursementRate = totalInvestment > 0 ? (totalDisbursed / totalInvestment) * 100 : 0;
        const totalVolumeValue = mockPayments.filter(p => p.Type === PaymentType.Volume).reduce((acc, curr) => acc + curr.Amount, 0);
        const riskCount = 3; // Mock

        return {
            totalInvestment,
            totalDisbursed,
            disbursementRate,
            totalVolumeValue,
            riskCount
        };
    },

    getDisbursementChart: async (): Promise<DashboardChartData[]> => {
        await delay(600);
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
        await delay(400);
        return [
            { id: 1, type: 'budget', msg: 'Dự án Cầu Cửa Nhượng: Nguy cơ vượt tổng mức đầu tư 5%', date: '20-12-2025' },
            { id: 2, type: 'schedule', msg: 'Dự án Đường ven biển: Chậm tiến độ GPMB 2 tuần', date: '19-12-2025' },
            { id: 3, type: 'legal', msg: 'Dự án Bệnh viện Tỉnh: Thiếu giấy phép PCCC', date: '19-12-2025' },
        ];
    },

    getProjectStatusDistribution: async (): Promise<DashboardProjectStatus[]> => {
        await delay(300);
        return [
            { name: 'Đang chuẩn bị', value: mockProjects.filter(p => p.Status === ProjectStatus.Preparation).length, color: '#F59E0B' },
            { name: 'Đang thực hiện', value: mockProjects.filter(p => p.Status === ProjectStatus.Execution).length, color: '#3B82F6' },
            { name: 'Hoàn thành', value: mockProjects.filter(p => p.Status === ProjectStatus.Finished).length, color: '#10B981' },
            { name: 'Vận hành', value: mockProjects.filter(p => p.Status === ProjectStatus.Operation).length, color: '#EF4444' },
        ];
    },

    getGroupDistribution: async (): Promise<DashboardGroupDistribution[]> => {
        await delay(350);
        return [
            { name: 'Nhóm A', value: mockProjects.filter(p => p.GroupCode === ProjectGroup.A).length, color: '#8B5CF6' },
            { name: 'Nhóm B', value: mockProjects.filter(p => p.GroupCode === ProjectGroup.B).length, color: '#6366F1' },
            { name: 'Nhóm C', value: mockProjects.filter(p => p.GroupCode === ProjectGroup.C).length, color: '#EC4899' },
        ];
    },

    getDeadlines: async (): Promise<DashboardDeadline[]> => {
        await delay(450);
        return [
            { id: 1, title: 'Trình thẩm định Báo cáo KTKT', project: 'Dự án Trường Trần Phú', due: 'Ngày mai', urgent: true },
            { id: 2, title: 'Phê duyệt Tờ trình kế hoạch', project: 'Dự án Đường ven biển', due: '22/12', urgent: false },
            { id: 3, title: 'Họp giao ban công trường', project: 'Dự án Cầu Cửa Nhượng', due: '23/12', urgent: false },
            { id: 4, title: 'Nghiệm thu đợt 1', project: 'Dự án Đê kè biển', due: '24/12', urgent: false },
        ];
    },

    getGPMBData: async (): Promise<DashboardGPMB> => {
        await delay(400);
        return {
            bottlenecks: 2,
            handedOverPercent: 85
        };
    },

    getTopContractors: async () => {
        await delay(500);
        return mockContractors.slice(0, 5);
    }
};
