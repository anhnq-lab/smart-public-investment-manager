// Risk Analyzer — Engine phân tích rủi ro dự án
// Kết hợp rule-based (ngưỡng cố định) + AI analysis (Gemini phân tích pattern)

import { Project, ProjectStatus, ProjectGroup } from '../../types';
import { analyzeRisks, RiskItem, RiskAnalysisResult } from '../aiService';
import { ProjectService } from '../ProjectService';
import { ContractService } from '../ContractService';
import { CapitalService } from '../CapitalService';
import { PROJECT_THRESHOLDS_2024 } from '../../types/project.types';

export interface EnrichedRiskItem extends RiskItem {
    projectId?: string;
    projectName?: string;
    source: 'rule' | 'ai';
}

export interface FullRiskReport {
    risks: EnrichedRiskItem[];
    overallScore: number;
    summary: string;
    analyzedAt: Date;
    projectCount: number;
}

/**
 * Rule-based risk checks — chạy nhanh, không cần AI
 * Phát hiện rủi ro dựa trên ngưỡng cố định
 */
function checkRuleBasedRisks(project: Project): EnrichedRiskItem[] {
    const risks: EnrichedRiskItem[] = [];
    const common = { projectId: project.ProjectID, projectName: project.ProjectName, source: 'rule' as const };

    const physical = project.PhysicalProgress ?? project.Progress ?? 0;
    const financial = project.FinancialProgress ?? project.PaymentProgress ?? 0;

    // 1. Chênh lệch tiến độ vật lý vs tài chính
    if (Math.abs(physical - financial) > 20) {
        risks.push({
            ...common,
            level: physical > financial ? 'warning' : 'info',
            category: 'budget',
            title: 'Chênh lệch tiến độ vật lý - tài chính',
            description: `Tiến độ vật lý ${physical}% nhưng tài chính ${financial}% — chênh lệch ${Math.abs(physical - financial).toFixed(0)}%`,
            recommendation: physical > financial
                ? 'Cần đẩy nhanh thanh toán để phù hợp khối lượng đã thực hiện'
                : 'Kiểm tra khối lượng thực của nhà thầu',
            metric: `Vật lý: ${physical}% | Tài chính: ${financial}%`,
        });
    }

    // 2. Hợp đồng sắp hết hạn
    if (project.ExpectedEndDate) {
        const daysLeft = Math.floor(
            (new Date(project.ExpectedEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        if (daysLeft > 0 && daysLeft <= 30 && physical < 80) {
            risks.push({
                ...common,
                level: 'critical',
                category: 'schedule',
                title: 'Sắp hết hạn nhưng tiến độ thấp',
                description: `Còn ${daysLeft} ngày nhưng tiến độ mới ${physical}%`,
                recommendation: 'Cần gia hạn hợp đồng hoặc tăng cường nhân lực',
                metric: `${daysLeft} ngày còn lại`,
            });
        } else if (daysLeft < 0) {
            risks.push({
                ...common,
                level: 'critical',
                category: 'schedule',
                title: 'Đã quá hạn hoàn thành',
                description: `Quá hạn ${Math.abs(daysLeft)} ngày, tiến độ ${physical}%`,
                recommendation: 'Cần xử lý gia hạn hoặc thanh lý hợp đồng',
                metric: `Quá ${Math.abs(daysLeft)} ngày`,
            });
        }
    }

    // 3. Thiếu hồ sơ pháp lý
    if (!project.DecisionNumber) {
        risks.push({
            ...common,
            level: 'warning',
            category: 'legal',
            title: 'Chưa có QĐ phê duyệt dự án',
            description: 'Dự án chưa được ghi nhận số QĐ phê duyệt',
            recommendation: 'Bổ sung QĐ phê duyệt vào hệ thống',
        });
    }

    // 4. BIM bắt buộc nhưng chưa triển khai (NĐ 175/2024)
    if (project.RequiresBIM && (!project.BIMStatus || project.BIMStatus === 'Pending')) {
        risks.push({
            ...common,
            level: 'warning',
            category: 'legal',
            title: 'Chưa triển khai BIM (NĐ 175/2024)',
            description: 'Dự án thuộc diện bắt buộc BIM nhưng chưa triển khai',
            recommendation: 'Lập kế hoạch triển khai BIM theo NĐ 175/2024',
        });
    }

    // 5. Thời hạn bố trí vốn vượt quy định
    if (project.ApprovalDate && project.GroupCode) {
        const approvalDate = new Date(project.ApprovalDate);
        const yearsSince = (Date.now() - approvalDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        const maxYears = PROJECT_THRESHOLDS_2024.CAPITAL_DURATION[
            project.GroupCode === 'QN' ? 'GROUP_QN'
                : project.GroupCode === 'A' ? 'GROUP_A'
                    : project.GroupCode === 'B' ? 'GROUP_B'
                        : 'GROUP_C'
        ];

        if (yearsSince > maxYears && project.Status !== ProjectStatus.Completion) {
            risks.push({
                ...common,
                level: 'critical',
                category: 'legal',
                title: `Vượt thời hạn bố trí vốn (${maxYears} năm)`,
                description: `Dự án nhóm ${project.GroupCode} đã ${yearsSince.toFixed(1)} năm kể từ QĐ phê duyệt, vượt giới hạn ${maxYears} năm`,
                recommendation: 'Rà soát, điều chỉnh kế hoạch vốn hoặc xin gia hạn',
                metric: `${yearsSince.toFixed(1)}/${maxYears} năm`,
            });
        }
    }

    // 6. Tiến độ giải ngân thấp (đã qua nửa năm)
    const currentMonth = new Date().getMonth() + 1;
    if (currentMonth >= 6 && financial < 30 && project.Status === ProjectStatus.Execution) {
        risks.push({
            ...common,
            level: 'warning',
            category: 'budget',
            title: 'Giải ngân chậm so với tiến độ năm',
            description: `Đã qua tháng ${currentMonth} nhưng giải ngân mới ${financial}%`,
            recommendation: 'Đẩy nhanh nghiệm thu, thanh toán để đảm bảo tỷ lệ giải ngân',
            metric: `${financial}% giải ngân (tháng ${currentMonth})`,
        });
    }

    return risks;
}

/**
 * Phân tích rủi ro cho 1 dự án (rule-based only, nhanh)
 */
export async function analyzeProjectRisksQuick(project: Project): Promise<EnrichedRiskItem[]> {
    return checkRuleBasedRisks(project);
}

/**
 * Phân tích rủi ro cho 1 dự án (rule-based + AI)
 */
export async function analyzeProjectRisksFull(projectId: string): Promise<FullRiskReport> {
    const project = await ProjectService.getById(projectId);
    if (!project) {
        return { risks: [], overallScore: 100, summary: 'Không tìm thấy dự án', analyzedAt: new Date(), projectCount: 0 };
    }

    // 1. Rule-based risks
    const ruleRisks = checkRuleBasedRisks(project);

    // 2. Get additional data for AI analysis
    let capitalInfo;
    try {
        capitalInfo = await ProjectService.getCapitalInfo(projectId);
    } catch { /* ignore */ }

    // 3. AI analysis
    let aiResult: RiskAnalysisResult = { risks: [], overallScore: 100, summary: '' };
    try {
        aiResult = await analyzeRisks({
            project,
            capitalInfo,
            currentDate: new Date().toISOString(),
        });
    } catch (e) {
        console.warn('AI risk analysis failed, using rule-based only:', e);
    }

    // 4. Merge results (deduplicate by category + level)
    const aiRisks: EnrichedRiskItem[] = aiResult.risks.map(r => ({
        ...r,
        projectId: project.ProjectID,
        projectName: project.ProjectName,
        source: 'ai' as const,
    }));

    const allRisks = [...ruleRisks, ...aiRisks];

    // Sort: critical → warning → info
    const levelOrder = { critical: 0, warning: 1, info: 2 };
    allRisks.sort((a, b) => levelOrder[a.level] - levelOrder[b.level]);

    return {
        risks: allRisks,
        overallScore: aiResult.overallScore || Math.max(0, 100 - ruleRisks.length * 15),
        summary: aiResult.summary || `Phát hiện ${allRisks.length} rủi ro (${ruleRisks.length} rule-based, ${aiRisks.length} AI)`,
        analyzedAt: new Date(),
        projectCount: 1,
    };
}

/**
 * Quét tất cả dự án, trả về top rủi ro (rule-based, nhanh)
 */
export async function analyzeAllProjectsRisks(): Promise<FullRiskReport> {
    const projects = await ProjectService.getAll();
    const activeProjects = projects.filter(p => p.Status !== ProjectStatus.Completion);

    const allRisks: EnrichedRiskItem[] = [];
    for (const project of activeProjects) {
        const risks = checkRuleBasedRisks(project);
        allRisks.push(...risks);
    }

    // Sort: critical → warning → info
    const levelOrder = { critical: 0, warning: 1, info: 2 };
    allRisks.sort((a, b) => levelOrder[a.level] - levelOrder[b.level]);

    const criticalCount = allRisks.filter(r => r.level === 'critical').length;
    const warningCount = allRisks.filter(r => r.level === 'warning').length;
    const score = Math.max(0, 100 - criticalCount * 20 - warningCount * 10);

    return {
        risks: allRisks.slice(0, 20), // Top 20 risks
        overallScore: score,
        summary: `${activeProjects.length} dự án đang hoạt động: ${criticalCount} rủi ro nghiêm trọng, ${warningCount} cảnh báo`,
        analyzedAt: new Date(),
        projectCount: activeProjects.length,
    };
}
