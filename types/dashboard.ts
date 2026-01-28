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
    id: number;
    type: 'budget' | 'schedule' | 'legal';
    msg: string;
    date: string;
}

export interface DashboardProjectStatus {
    name: string;
    value: number;
    color: string;
}

export interface DashboardGroupDistribution {
    name: string;
    value: number;
    color: string;
}

export interface DashboardDeadline {
    id: number;
    title: string;
    project: string;
    due: string;
    urgent: boolean;
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
