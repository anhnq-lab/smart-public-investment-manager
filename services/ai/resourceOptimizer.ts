// Resource Optimizer AI — tối ưu phân bổ nguồn lực dự án
import { ProjectService } from '../ProjectService';
import { TaskService } from '../TaskService';
import { Project, Task } from '../../types';
import { generateAIAnalysis } from '../aiService';

export interface ResourceAllocation {
    projectId: string;
    projectName: string;
    activeTaskCount: number;
    totalBudget: number;
    disbursedBudget: number;
    utilizationRate: number; // %
    staffCount: number;
    bottlenecks: string[];
    suggestions: string[];
}

export interface ResourceOptimizationResult {
    allocations: ResourceAllocation[];
    overloadedProjects: string[];
    underutilizedProjects: string[];
    totalActiveProjects: number;
    recommendations: string[];
    aiAnalysis?: string;
    analyzedAt: string;
}

/**
 * Phân tích phân bổ nguồn lực hiện tại
 */
export async function analyzeResourceAllocation(): Promise<ResourceOptimizationResult> {
    const projects = await ProjectService.getAll();
    const activeProjects = projects.filter(p => p.Status === 2); // Execution

    const allocations: ResourceAllocation[] = [];
    const overloaded: string[] = [];
    const underutilized: string[] = [];
    const recommendations: string[] = [];

    for (const project of activeProjects) {
        try {
            const tasks = await TaskService.getTasksByProject(project.ProjectID);
            const activeTasks = tasks.filter(t =>
                t.Status !== 'Done' && (t.ProgressPercent ?? 0) < 100
            );

            // Calculate utilization
            const totalBudget = project.TotalInvestment || 0;
            const disbursed = (project.PaymentProgress || project.FinancialProgress || 0) / 100 * totalBudget;
            const utilizationRate = totalBudget > 0 ? (disbursed / totalBudget) * 100 : 0;

            // Detect bottlenecks
            const bottlenecks: string[] = [];
            const suggestions: string[] = [];

            // Overdue tasks
            const overdueTasks = activeTasks.filter(t => {
                if (!t.PlannedEndDate) return false;
                return new Date(t.PlannedEndDate) < new Date();
            });
            if (overdueTasks.length > 0) {
                bottlenecks.push(`${overdueTasks.length} công việc quá hạn`);
            }

            // Low progress with many tasks
            const physicalProgress = project.PhysicalProgress || 0;
            if (activeTasks.length > 10 && physicalProgress < 30) {
                bottlenecks.push('Nhiều việc nhưng tiến độ thấp');
                suggestions.push('Cần ưu tiên hóa công việc');
            }

            // Financial vs physical gap
            const financialProgress = project.FinancialProgress || 0;
            if (Math.abs(physicalProgress - financialProgress) > 20) {
                bottlenecks.push(`Chênh lệch KL-TC: KL ${physicalProgress}% vs TC ${financialProgress}%`);
                suggestions.push('Đẩy nhanh thủ tục thanh toán');
            }

            // Stale tasks
            const staleTasks = activeTasks.filter(t =>
                (t.ProgressPercent ?? 0) > 0 && (t.ProgressPercent ?? 0) < 100
            );
            if (staleTasks.length > 5) {
                suggestions.push(`${staleTasks.length} công việc đang dở dang`);
            }

            const allocation: ResourceAllocation = {
                projectId: project.ProjectID,
                projectName: project.ProjectName,
                activeTaskCount: activeTasks.length,
                totalBudget,
                disbursedBudget: disbursed,
                utilizationRate: Math.round(utilizationRate * 10) / 10,
                staffCount: 0, // Will be enriched if member data available
                bottlenecks,
                suggestions,
            };

            allocations.push(allocation);

            if (bottlenecks.length >= 2) overloaded.push(project.ProjectName);
            if (activeTasks.length === 0 && physicalProgress < 80) {
                underutilized.push(project.ProjectName);
            }
        } catch (e) {
            console.error(`Resource analysis failed for ${project.ProjectID}:`, e);
        }
    }

    // Global recommendations
    if (overloaded.length > 0) {
        recommendations.push(`${overloaded.length} dự án đang quá tải, cần điều phối nguồn lực`);
    }
    if (underutilized.length > 0) {
        recommendations.push(`${underutilized.length} dự án chưa khai thác hết nguồn lực`);
    }
    if (allocations.length > 0) {
        const avgUtilization = allocations.reduce((s, a) => s + a.utilizationRate, 0) / allocations.length;
        recommendations.push(`Tỷ lệ sử dụng nguồn lực trung bình: ${avgUtilization.toFixed(1)}%`);
    }

    // AI analysis
    let aiAnalysis: string | undefined;
    try {
        const summary = allocations.map(a =>
            `${a.projectName}: ${a.activeTaskCount} tasks, util ${a.utilizationRate}%, bottlenecks: ${a.bottlenecks.join('; ') || 'none'}`
        ).join('\n');

        aiAnalysis = await generateAIAnalysis(
            `Phân tích phân bổ nguồn lực ${allocations.length} dự án:\n${summary}\n\nĐưa ra 3-4 khuyến nghị tối ưu hóa nguồn lực.`,
            'forecasting'
        );
    } catch { /* optional */ }

    return {
        allocations,
        overloadedProjects: overloaded,
        underutilizedProjects: underutilized,
        totalActiveProjects: activeProjects.length,
        recommendations,
        aiAnalysis,
        analyzedAt: new Date().toISOString(),
    };
}
