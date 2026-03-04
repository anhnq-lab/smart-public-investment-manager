// Contractor Scoring AI — đánh giá nhà thầu thông minh
import { ContractorService } from '../ContractorService';
import { ContractService } from '../ContractService';
import { PaymentService } from '../PaymentService';
import { Contractor } from '../../types';
import { generateAIAnalysis } from '../aiService';

export interface ContractorScore {
    contractorId: string;
    contractorName: string;
    overallScore: number; // 0-100
    dimensions: {
        deliveryScore: number;     // Tiến độ giao hàng/thi công
        qualityScore: number;      // Sai sót, bảo hành
        financialScore: number;    // Thanh toán đúng hạn
        complianceScore: number;   // Tuân thủ HĐ
        experienceScore: number;   // Kinh nghiệm
    };
    contractCount: number;
    totalContractValue: number;
    riskLevel: 'low' | 'medium' | 'high';
    highlights: string[];
    concerns: string[];
    recommendation: string;
}

export interface ContractorRanking {
    rankings: ContractorScore[];
    analyzedAt: string;
    aiInsight?: string;
}

/**
 * Rule-based scoring cho 1 nhà thầu
 */
async function scoreContractor(contractor: Contractor): Promise<ContractorScore> {
    // Lấy tất cả hợp đồng của nhà thầu
    const allContracts = await ContractService.getAll();
    const contracts = allContracts.filter(c => c.ContractorID === contractor.ContractorID);

    const contractCount = contracts.length;
    const totalContractValue = contracts.reduce((s, c) => s + (c.Value || 0), 0);

    const highlights: string[] = [];
    const concerns: string[] = [];

    // --- Delivery Score ---
    const completedContracts = contracts.filter(c => c.Status === 3); // Liquidated = done
    const executingContracts = contracts.filter(c => c.Status === 1);
    const deliveryRatio = contractCount > 0 ? completedContracts.length / contractCount : 0;
    let deliveryScore = Math.min(100, deliveryRatio * 100 + 20);
    if (executingContracts.length > 0) deliveryScore = Math.max(deliveryScore, 50);
    if (contractCount === 0) deliveryScore = 30; // No history

    if (deliveryRatio > 0.8) highlights.push(`Hoàn thành ${completedContracts.length}/${contractCount} HĐ`);
    if (executingContracts.length > 3) concerns.push(`Đang thực hiện ${executingContracts.length} HĐ cùng lúc`);

    // --- Financial Score ---
    let financialScore = 60; // base
    let totalPayments = 0;
    for (const contract of contracts.slice(0, 5)) {
        try {
            const payments = await PaymentService.getByContractId(contract.ContractID);
            totalPayments += payments.length;
            const transferred = payments.filter(p => p.Status === 'Transferred').length;
            if (payments.length > 0) {
                financialScore = Math.max(financialScore, (transferred / payments.length) * 100);
            }
        } catch { /* skip */ }
    }

    if (totalPayments > 5) highlights.push(`${totalPayments} đợt thanh toán đã xử lý`);

    // --- Quality Score (heuristic) ---
    let qualityScore = 70; // default
    if (completedContracts.length >= 3) qualityScore = 85;
    if (completedContracts.length >= 5) {
        qualityScore = 90;
        highlights.push('Nhà thầu có kinh nghiệm');
    }

    // --- Compliance Score ---
    const pausedContracts = contracts.filter(c => c.Status === 2);
    let complianceScore = 80;
    if (pausedContracts.length > 0) {
        complianceScore -= pausedContracts.length * 15;
        concerns.push(`${pausedContracts.length} HĐ bị tạm dừng`);
    }
    complianceScore = Math.max(0, complianceScore);

    // --- Experience Score ---
    const yearsInBusiness = contractor.EstablishedYear
        ? new Date().getFullYear() - contractor.EstablishedYear
        : 0;
    let experienceScore = Math.min(100, yearsInBusiness * 5 + contractCount * 10);
    if (yearsInBusiness > 10) highlights.push(`${yearsInBusiness} năm kinh nghiệm`);
    if (contractCount === 0) {
        experienceScore = 20;
        concerns.push('Chưa có lịch sử hợp đồng');
    }

    // Overall
    const overallScore = Math.round(
        deliveryScore * 0.25 +
        financialScore * 0.20 +
        qualityScore * 0.20 +
        complianceScore * 0.20 +
        experienceScore * 0.15
    );

    const riskLevel: 'low' | 'medium' | 'high' =
        overallScore >= 70 ? 'low' : overallScore >= 45 ? 'medium' : 'high';

    return {
        contractorId: contractor.ContractorID,
        contractorName: contractor.FullName,
        overallScore,
        dimensions: { deliveryScore, qualityScore, financialScore, complianceScore, experienceScore },
        contractCount,
        totalContractValue,
        riskLevel,
        highlights,
        concerns,
        recommendation: overallScore >= 70
            ? 'Phù hợp để giao thầu các gói quan trọng'
            : overallScore >= 45
                ? 'Cần giám sát chặt khi giao thầu'
                : 'Rủi ro cao, nên cân nhắc kỹ',
    };
}

/**
 * Đánh giá và xếp hạng tất cả nhà thầu
 */
export async function rankAllContractors(): Promise<ContractorRanking> {
    const contractors = await ContractorService.getAll();
    const scores: ContractorScore[] = [];

    for (const contractor of contractors) {
        try {
            const score = await scoreContractor(contractor);
            scores.push(score);
        } catch (e) {
            console.error(`Scoring failed for ${contractor.ContractorID}:`, e);
        }
    }

    // Sort by overall score descending
    scores.sort((a, b) => b.overallScore - a.overallScore);

    // AI insight
    let aiInsight: string | undefined;
    try {
        const topSummary = scores.slice(0, 5).map(s =>
            `${s.contractorName}: ${s.overallScore}/100 (${s.contractCount} HĐ, ${s.highlights.join(', ')})`
        ).join('\n');

        aiInsight = await generateAIAnalysis(
            `Phân tích bảng xếp hạng nhà thầu:\n${topSummary}\n\nĐưa ra nhận xét tổng quan 2-3 câu.`,
            'riskAnalysis'
        );
    } catch { /* optional */ }

    return {
        rankings: scores,
        analyzedAt: new Date().toISOString(),
        aiInsight,
    };
}

/**
 * Đánh giá 1 nhà thầu cụ thể
 */
export async function scoreOneContractor(contractorId: string): Promise<ContractorScore | null> {
    const contractor = await ContractorService.getById(contractorId);
    if (!contractor) return null;
    return scoreContractor(contractor);
}
