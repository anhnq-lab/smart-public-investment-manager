export interface DashboardMetrics {
    totalInvestment: number;
    totalDisbursed: number;
    disbursementRate: number;
    totalVolumeValue: number;
    riskCount: number;
}

export interface DashboardChartData {
    name: string;
    disbursement: number;
    plan: number;
}

export interface DashboardRisk {
    id: number | string;
    type: 'budget' | 'schedule' | 'legal' | 'overdue';
    msg: string;
    date: string;
    projectId?: string;
    severity?: 'high' | 'medium' | 'low';
}

export interface DashboardProjectStatus {
    [key: string]: unknown;
    name: string;
    value: number;
    color: string;
}

export interface DashboardGroupDistribution {
    [key: string]: unknown;
    name: string;
    value: number;
    color: string;
}

export interface DashboardDeadline {
    id: number | string;
    title: string;
    project: string;
    projectName?: string;
    due: string;
    urgent: boolean;
    taskId?: string;
}

export interface DashboardLegalIssue {
    category: string;
    count: number;
    statusColor: string; // Tailwind class or hex
}

export interface DashboardGPMB {
    bottlenecks: number;
    handedOverPercent: number;
}

export interface DashboardContractStatus {
    total: number;
    executing: number;
    paused: number;
    liquidated: number;
}
