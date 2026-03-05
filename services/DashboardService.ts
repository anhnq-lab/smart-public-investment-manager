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
    DashboardGPMB,
    DashboardContractStatus
} from '../types/dashboard';
import { dbToContractor } from '../lib/dbMappers';

export const DashboardService = {
    getMetrics: async (): Promise<DashboardMetrics> => {
        const today = new Date().toISOString();

        // Parallel fetch all data sources
        const [projectsRes, paymentsRes, overdueRes, issueRes] = await Promise.all([
            supabase.from('projects').select('total_investment'),
            supabase.from('payments').select('amount, status, type'),
            supabase.from('tasks').select('*', { count: 'exact', head: true }).neq('status', 'Done').lt('due_date', today),
            supabase.from('package_issues').select('*', { count: 'exact', head: true }).eq('status', 'Open'),
        ]);

        const totalInvestment = (projectsRes.data || []).reduce((acc, p) => acc + Number(p.total_investment), 0);

        const totalDisbursed = (paymentsRes.data || [])
            .filter(p => p.status === 'Transferred')
            .reduce((acc, p) => acc + Number(p.amount), 0);
        const disbursementRate = totalInvestment > 0 ? (totalDisbursed / totalInvestment) * 100 : 0;
        const totalVolumeValue = (paymentsRes.data || [])
            .filter(p => p.type === PaymentType.Volume)
            .reduce((acc, p) => acc + Number(p.amount), 0);

        const riskCount = (overdueRes.count || 0) + (issueRes.count || 0);

        return {
            totalInvestment,
            totalDisbursed,
            disbursementRate,
            totalVolumeValue,
            riskCount
        };
    },

    getDisbursementChart: async (): Promise<DashboardChartData[]> => {
        const currentYear = new Date().getFullYear();

        // Get disbursements for current year
        const { data: disbursements } = await supabase
            .from('disbursements')
            .select('amount, date')
            .gte('date', `${currentYear}-01-01`)
            .lte('date', `${currentYear}-12-31`);

        // Get capital plans for current year
        const { data: capitalPlans } = await supabase
            .from('capital_plans')
            .select('amount, year')
            .eq('year', currentYear);

        // Total planned amount for the year (divided by 12 for monthly average)
        const totalPlanned = (capitalPlans || []).reduce((acc, p) => acc + Number(p.amount), 0);
        const monthlyPlan = totalPlanned / 12;

        // Aggregate disbursements by month
        const monthlyDisbursement: Record<number, number> = {};
        (disbursements || []).forEach(d => {
            const month = new Date(d.date).getMonth(); // 0-indexed
            monthlyDisbursement[month] = (monthlyDisbursement[month] || 0) + Number(d.amount);
        });

        const monthNames = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
        const currentMonth = new Date().getMonth();

        // Only show months up to current month + 2 (for planning ahead)
        const maxMonth = Math.min(currentMonth + 2, 11);

        return monthNames.slice(0, maxMonth + 1).map((name, idx) => ({
            name,
            // Convert to billions for chart display (value / 1_000_000_000)
            disbursement: Math.round((monthlyDisbursement[idx] || 0) / 1_000_000_000 * 1000) / 1000,
            plan: Math.round(monthlyPlan / 1_000_000_000 * 1000) / 1000,
        }));
    },

    getRisks: async (): Promise<DashboardRisk[]> => {
        const risks: DashboardRisk[] = [];
        const today = new Date().toISOString();

        // 1. Overdue tasks
        const { data: overdueTasks } = await supabase
            .from('tasks')
            .select('task_id, title, due_date, project_id')
            .neq('status', 'Done')
            .lt('due_date', today)
            .order('due_date', { ascending: true })
            .limit(5);

        (overdueTasks || []).forEach(t => {
            const dueDate = new Date(t.due_date);
            const daysOverdue = Math.ceil((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
            risks.push({
                id: t.task_id,
                type: 'overdue',
                msg: `Công việc "${t.title}" quá hạn ${daysOverdue} ngày`,
                date: dueDate.toLocaleDateString('vi-VN'),
                projectId: t.project_id,
                severity: daysOverdue > 14 ? 'high' : daysOverdue > 7 ? 'medium' : 'low',
            });
        });

        // 2. Open package issues
        const { data: issues } = await supabase
            .from('package_issues')
            .select('issue_id, title, reported_date, severity, package_id')
            .eq('status', 'Open')
            .order('reported_date', { ascending: false })
            .limit(5);

        (issues || []).forEach(issue => {
            risks.push({
                id: issue.issue_id,
                type: 'legal',
                msg: `Vấn đề gói thầu: ${issue.title}`,
                date: new Date(issue.reported_date).toLocaleDateString('vi-VN'),
                severity: issue.severity === 'High' ? 'high' : issue.severity === 'Medium' ? 'medium' : 'low',
            });
        });

        return risks.slice(0, 8); // Limit to 8 items total
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
            { name: 'Chuẩn bị dự án', value: counts[ProjectStatus.Preparation], color: '#3B82F6' },
            { name: 'Thực hiện dự án', value: counts[ProjectStatus.Execution], color: '#F97316' },
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
        const now = new Date();
        const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const { data: tasks } = await supabase
            .from('tasks')
            .select('task_id, title, due_date, project_id, priority')
            .neq('status', 'Done')
            .gte('due_date', now.toISOString())
            .lte('due_date', next7Days.toISOString())
            .order('due_date', { ascending: true })
            .limit(6);

        if (!tasks || tasks.length === 0) return [];

        // Fetch project names for these tasks
        const projectIds = [...new Set(tasks.map(t => t.project_id))];
        const { data: projects } = await supabase
            .from('projects')
            .select('project_id, project_name')
            .in('project_id', projectIds);

        const projectNameMap: Record<string, string> = {};
        (projects || []).forEach(p => {
            projectNameMap[p.project_id] = p.project_name;
        });

        return tasks.map(t => {
            const dueDate = new Date(t.due_date);
            const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            let dueLabel: string;
            if (diffDays <= 0) dueLabel = 'Hôm nay';
            else if (diffDays === 1) dueLabel = 'Ngày mai';
            else dueLabel = dueDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

            return {
                id: t.task_id,
                title: t.title,
                project: projectNameMap[t.project_id] || t.project_id,
                projectName: projectNameMap[t.project_id],
                due: dueLabel,
                urgent: diffDays <= 1 || t.priority === 'Urgent',
                taskId: t.task_id,
            };
        });
    },

    getGPMBData: async (): Promise<DashboardGPMB> => {
        // TODO: Tạo bảng `site_clearance` trong DB để lưu dữ liệu GPMB thực
        // Tạm thời trả về giá trị tĩnh
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
    },

    getContractStatusCounts: async (): Promise<DashboardContractStatus> => {
        const { data } = await supabase
            .from('contracts')
            .select('status');

        const contracts = data || [];
        return {
            total: contracts.length,
            executing: contracts.filter(c => c.status === 1).length,
            paused: contracts.filter(c => c.status === 2).length,
            liquidated: contracts.filter(c => c.status === 3).length,
        };
    }
};
