// Anomaly Detector AI — phát hiện bất thường tài chính & tiến độ
import { ProjectService } from '../ProjectService';
import { ContractService } from '../ContractService';
import { PaymentService } from '../PaymentService';
import { CapitalService } from '../CapitalService';
import { generateAIAnalysis } from '../aiService';

export type AnomalyLevel = 'info' | 'warning' | 'critical';
export type AnomalyCategory = 'financial' | 'progress' | 'contract' | 'payment';

export interface Anomaly {
    id: string;
    category: AnomalyCategory;
    level: AnomalyLevel;
    title: string;
    description: string;
    projectId?: string;
    projectName?: string;
    metric?: string;
    expectedValue?: string;
    actualValue?: string;
    deviation?: number; // %
    detectedAt: string;
    suggestion?: string;
}

export interface AnomalyReport {
    anomalies: Anomaly[];
    totalChecked: number;
    criticalCount: number;
    warningCount: number;
    infoCount: number;
    aiSummary?: string;
    scannedAt: string;
}

let anomalyCounter = 0;
function nextId(): string { return `ANM-${++anomalyCounter}`; }

/**
 * Quét bất thường trên toàn bộ dự án
 */
export async function scanAllAnomalies(): Promise<AnomalyReport> {
    anomalyCounter = 0;
    const anomalies: Anomaly[] = [];
    const projects = await ProjectService.getAll();

    for (const project of projects) {
        try {
            // 1. Progress anomaly: vật lý vs tài chính chênh lệch > 25%
            const physical = project.PhysicalProgress || 0;
            const financial = project.FinancialProgress || 0;
            const gap = Math.abs(physical - financial);
            if (gap > 25) {
                anomalies.push({
                    id: nextId(),
                    category: 'progress',
                    level: gap > 40 ? 'critical' : 'warning',
                    title: 'Chênh lệch KL-TC bất thường',
                    description: `Khối lượng thực hiện ${physical}% nhưng tài chính ${financial}% (chênh ${gap}%)`,
                    projectId: project.ProjectID,
                    projectName: project.ProjectName,
                    metric: 'Progress Gap',
                    expectedValue: `<15%`,
                    actualValue: `${gap}%`,
                    deviation: gap,
                    detectedAt: new Date().toISOString(),
                    suggestion: physical > financial
                        ? 'Đẩy nhanh giải ngân để thu hồi vốn đã thi công'
                        : 'Kiểm tra hồ sơ nghiệm thu, có thể thanh toán vượt KL thực',
                });
            }

            // 2. Budget overrun: tổng HĐ > tổng vốn phê duyệt
            const contracts = await ContractService.getAll();
            const projectContracts = contracts.filter(c => c.ProjectID === project.ProjectID);
            const totalContractValue = projectContracts.reduce((s, c) => s + (c.Value || 0), 0);
            const totalInvestment = project.TotalInvestment || 0;
            if (totalInvestment > 0 && totalContractValue > totalInvestment * 1.05) {
                const overrun = ((totalContractValue / totalInvestment) - 1) * 100;
                anomalies.push({
                    id: nextId(),
                    category: 'financial',
                    level: overrun > 15 ? 'critical' : 'warning',
                    title: 'Giá trị HĐ vượt tổng mức đầu tư',
                    description: `Tổng HĐ: ${(totalContractValue / 1e9).toFixed(1)} tỷ / TMĐT: ${(totalInvestment / 1e9).toFixed(1)} tỷ (vượt ${overrun.toFixed(1)}%)`,
                    projectId: project.ProjectID,
                    projectName: project.ProjectName,
                    metric: 'Budget Overrun',
                    expectedValue: `≤${(totalInvestment / 1e9).toFixed(1)} tỷ`,
                    actualValue: `${(totalContractValue / 1e9).toFixed(1)} tỷ`,
                    deviation: overrun,
                    detectedAt: new Date().toISOString(),
                    suggestion: 'Cần rà soát TMĐT hoặc điều chỉnh chi phí dự phòng',
                });
            }

            // 3. Duplicate/unusual payments
            for (const contract of projectContracts.slice(0, 5)) {
                try {
                    const payments = await PaymentService.getByContractId(contract.ContractID);
                    // Check for duplicate amounts
                    const amounts = payments.map(p => p.Amount);
                    const uniqueAmounts = new Set(amounts);
                    if (amounts.length > 2 && uniqueAmounts.size < amounts.length * 0.5) {
                        anomalies.push({
                            id: nextId(),
                            category: 'payment',
                            level: 'warning',
                            title: 'Thanh toán trùng số tiền',
                            description: `HĐ ${contract.ContractName}: ${amounts.length - uniqueAmounts.size} đợt thanh toán có cùng số tiền`,
                            projectId: project.ProjectID,
                            projectName: project.ProjectName,
                            metric: 'Duplicate Payments',
                            detectedAt: new Date().toISOString(),
                            suggestion: 'Kiểm tra lại hồ sơ thanh toán, có thể nhập trùng',
                        });
                    }

                    // Check total payments > contract value
                    const totalPaid = payments.reduce((s, p) => s + (p.Amount || 0), 0);
                    if (contract.Value > 0 && totalPaid > contract.Value * 1.1) {
                        const overpayRate = ((totalPaid / contract.Value) - 1) * 100;
                        anomalies.push({
                            id: nextId(),
                            category: 'payment',
                            level: 'critical',
                            title: 'Thanh toán vượt giá trị HĐ',
                            description: `HĐ ${contract.ContractName}: đã thanh toán ${(totalPaid / 1e9).toFixed(2)} tỷ / giá trị HĐ ${(contract.Value / 1e9).toFixed(2)} tỷ`,
                            projectId: project.ProjectID,
                            projectName: project.ProjectName,
                            metric: 'Overpayment',
                            expectedValue: `≤${(contract.Value / 1e9).toFixed(2)} tỷ`,
                            actualValue: `${(totalPaid / 1e9).toFixed(2)} tỷ`,
                            deviation: overpayRate,
                            detectedAt: new Date().toISOString(),
                            suggestion: 'Dừng thanh toán ngay, rà soát chứng từ',
                        });
                    }
                } catch { /* skip */ }
            }

            // 4. Stagnant project: has budget but 0% progress for a long time
            if (totalInvestment > 0 && physical === 0 && financial === 0 && project.Status === 2) {
                anomalies.push({
                    id: nextId(),
                    category: 'progress',
                    level: 'warning',
                    title: 'Dự án "chết lâm sàng"',
                    description: `${project.ProjectName} đang giai đoạn thực hiện nhưng chưa có tiến độ`,
                    projectId: project.ProjectID,
                    projectName: project.ProjectName,
                    metric: 'Stagnant Project',
                    detectedAt: new Date().toISOString(),
                    suggestion: 'Kiểm tra vướng mắc GPMB/pháp lý hoặc chuyển sang tạm dừng',
                });
            }

        } catch (e) {
            console.error(`Anomaly scan failed for ${project.ProjectID}:`, e);
        }
    }

    // Sort by severity
    const levelOrder = { critical: 0, warning: 1, info: 2 };
    anomalies.sort((a, b) => levelOrder[a.level] - levelOrder[b.level]);

    // AI summary
    let aiSummary: string | undefined;
    if (anomalies.length > 0) {
        try {
            const summary = anomalies.slice(0, 10).map(a =>
                `[${a.level.toUpperCase()}] ${a.title} — ${a.projectName}: ${a.description}`
            ).join('\n');

            aiSummary = await generateAIAnalysis(
                `Phát hiện ${anomalies.length} bất thường:\n${summary}\n\nĐưa ra đánh giá tổng quan 2-3 câu và ưu tiên xử lý.`,
                'riskAnalysis'
            );
        } catch { /* optional */ }
    }

    return {
        anomalies,
        totalChecked: projects.length,
        criticalCount: anomalies.filter(a => a.level === 'critical').length,
        warningCount: anomalies.filter(a => a.level === 'warning').length,
        infoCount: anomalies.filter(a => a.level === 'info').length,
        aiSummary,
        scannedAt: new Date().toISOString(),
    };
}

/**
 * Quét bất thường cho 1 dự án cụ thể
 */
export async function scanProjectAnomalies(projectId: string): Promise<Anomaly[]> {
    const report = await scanAllAnomalies();
    return report.anomalies.filter(a => a.projectId === projectId);
}
