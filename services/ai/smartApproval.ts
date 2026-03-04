// Smart Approval AI — hỗ trợ quy trình phê duyệt thông minh
import { ProjectService } from '../ProjectService';
import { ContractService } from '../ContractService';
import { PaymentService } from '../PaymentService';
import { generateAIAnalysis } from '../aiService';

export type ApprovalType = 'payment' | 'contract' | 'variation' | 'extension' | 'settlement';

export interface ApprovalCheckResult {
    type: ApprovalType;
    canApprove: boolean;
    score: number; // 0-100 confidence
    checks: ApprovalCheck[];
    riskFlags: string[];
    aiRecommendation?: string;
    checkedAt: string;
}

export interface ApprovalCheck {
    id: string;
    name: string;
    status: 'passed' | 'failed' | 'warning' | 'skipped';
    detail: string;
    isCritical: boolean;
}

let checkCounter = 0;
function nextCheckId(): string { return `CHK-${++checkCounter}`; }

/**
 * Kiểm tra trước khi phê duyệt thanh toán
 */
export async function checkPaymentApproval(
    contractId: string,
    paymentAmount: number
): Promise<ApprovalCheckResult> {
    checkCounter = 0;
    const checks: ApprovalCheck[] = [];
    const riskFlags: string[] = [];

    // Get contract and payment history
    const allContracts = await ContractService.getAll();
    const contract = allContracts.find(c => c.ContractID === contractId);

    if (!contract) {
        return {
            type: 'payment',
            canApprove: false,
            score: 0,
            checks: [{ id: nextCheckId(), name: 'Hợp đồng', status: 'failed', detail: 'Không tìm thấy HĐ', isCritical: true }],
            riskFlags: ['Hợp đồng không tồn tại'],
            checkedAt: new Date().toISOString(),
        };
    }

    const payments = await PaymentService.getByContractId(contractId);
    const totalPaid = payments.reduce((s, p) => s + (p.Amount || 0), 0);
    const remainingValue = contract.Value - totalPaid;

    // Check 1: Contract status
    checks.push({
        id: nextCheckId(),
        name: 'Trạng thái HĐ',
        status: contract.Status === 1 ? 'passed' : 'failed',
        detail: contract.Status === 1 ? 'HĐ đang thực hiện' : 'HĐ không ở trạng thái thực hiện',
        isCritical: true,
    });

    // Check 2: Payment doesn't exceed remaining
    const exceedsRemaining = paymentAmount > remainingValue * 1.05;
    checks.push({
        id: nextCheckId(),
        name: 'Giá trị thanh toán',
        status: exceedsRemaining ? 'failed' : paymentAmount > remainingValue * 0.9 ? 'warning' : 'passed',
        detail: exceedsRemaining
            ? `Yêu cầu ${(paymentAmount / 1e6).toFixed(0)}tr > giá trị còn lại ${(remainingValue / 1e6).toFixed(0)}tr`
            : `Trong phạm vi cho phép (còn ${(remainingValue / 1e6).toFixed(0)}tr)`,
        isCritical: exceedsRemaining,
    });
    if (exceedsRemaining) riskFlags.push('Thanh toán vượt giá trị HĐ còn lại');

    // Check 3: Advance rate
    if (payments.length === 0 && contract.AdvanceRate > 0) {
        const maxAdvance = contract.Value * (contract.AdvanceRate / 100);
        const exceedsAdvance = paymentAmount > maxAdvance;
        checks.push({
            id: nextCheckId(),
            name: 'Tỷ lệ tạm ứng',
            status: exceedsAdvance ? 'failed' : 'passed',
            detail: exceedsAdvance
                ? `Tạm ứng ${(paymentAmount / 1e6).toFixed(0)}tr > max ${(maxAdvance / 1e6).toFixed(0)}tr (${contract.AdvanceRate}%)`
                : `Tạm ứng hợp lệ (max ${contract.AdvanceRate}%)`,
            isCritical: exceedsAdvance,
        });
    }

    // Check 4: Payment frequency (too many in short time)
    if (payments.length > 10) {
        checks.push({
            id: nextCheckId(),
            name: 'Tần suất thanh toán',
            status: 'warning',
            detail: `Đã có ${payments.length} đợt thanh toán`,
            isCritical: false,
        });
        riskFlags.push('Số lượng đợt thanh toán cao');
    } else {
        checks.push({
            id: nextCheckId(),
            name: 'Tần suất thanh toán',
            status: 'passed',
            detail: `${payments.length} đợt thanh toán trước đó`,
            isCritical: false,
        });
    }

    // Check 5: Warranty retention
    const totalWithNew = totalPaid + paymentAmount;
    const maxPayable = contract.Value * (1 - (contract.Warranty || 0) / 100);
    if (totalWithNew > maxPayable && contract.Warranty > 0) {
        checks.push({
            id: nextCheckId(),
            name: 'Bảo lãnh bảo hành',
            status: 'warning',
            detail: `Tổng TT sau duyệt (${(totalWithNew / 1e6).toFixed(0)}tr) vượt mức cho phép trước bảo hành (${(maxPayable / 1e6).toFixed(0)}tr, giữ lại ${contract.Warranty}%)`,
            isCritical: false,
        });
        riskFlags.push('Cần giữ lại % bảo hành');
    }

    // Calculate score
    const criticalFailed = checks.filter(c => c.isCritical && c.status === 'failed').length;
    const totalFailed = checks.filter(c => c.status === 'failed').length;
    const totalWarning = checks.filter(c => c.status === 'warning').length;
    const score = Math.max(0, 100 - criticalFailed * 40 - totalFailed * 20 - totalWarning * 10);
    const canApprove = criticalFailed === 0;

    // AI recommendation
    let aiRecommendation: string | undefined;
    try {
        const checkSummary = checks.map(c => `[${c.status}] ${c.name}: ${c.detail}`).join('\n');
        aiRecommendation = await generateAIAnalysis(
            `Kiểm tra phê duyệt thanh toán ${(paymentAmount / 1e6).toFixed(0)} triệu cho HĐ "${contract.ContractName}":\n${checkSummary}\n\nScore: ${score}/100. Đưa ra khuyến nghị phê duyệt 1-2 câu.`,
            'compliance'
        );
    } catch { /* optional */ }

    return {
        type: 'payment',
        canApprove,
        score,
        checks,
        riskFlags,
        aiRecommendation,
        checkedAt: new Date().toISOString(),
    };
}

/**
 * Kiểm tra nhanh trước khi phê duyệt hợp đồng mới
 */
export async function checkContractApproval(
    projectId: string,
    contractValue: number
): Promise<ApprovalCheckResult> {
    checkCounter = 0;
    const checks: ApprovalCheck[] = [];
    const riskFlags: string[] = [];

    const project = await ProjectService.getById(projectId);
    if (!project) {
        return {
            type: 'contract',
            canApprove: false,
            score: 0,
            checks: [{ id: nextCheckId(), name: 'Dự án', status: 'failed', detail: 'Không tìm thấy dự án', isCritical: true }],
            riskFlags: ['Dự án không tồn tại'],
            checkedAt: new Date().toISOString(),
        };
    }

    // Check 1: Project status
    checks.push({
        id: nextCheckId(),
        name: 'Trạng thái dự án',
        status: project.Status === 2 ? 'passed' : 'warning',
        detail: project.Status === 2 ? 'Dự án đang thực hiện' : 'Dự án không ở giai đoạn thực hiện',
        isCritical: false,
    });

    // Check 2: Total contracts vs TMDT
    const allContracts = await ContractService.getAll();
    const projectContracts = allContracts.filter(c => c.ProjectID === projectId);
    const existingTotal = projectContracts.reduce((s, c) => s + (c.Value || 0), 0);
    const newTotal = existingTotal + contractValue;
    const tmdt = project.TotalInvestment || 0;

    const exceeds = tmdt > 0 && newTotal > tmdt;
    checks.push({
        id: nextCheckId(),
        name: 'Tổng giá trị HĐ vs TMĐT',
        status: exceeds ? 'failed' : newTotal > tmdt * 0.9 ? 'warning' : 'passed',
        detail: `Tổng HĐ sau ký: ${(newTotal / 1e9).toFixed(2)} tỷ / TMĐT: ${(tmdt / 1e9).toFixed(2)} tỷ`,
        isCritical: exceeds,
    });
    if (exceeds) riskFlags.push('Vượt TMĐT, cần điều chỉnh');

    // Check 3: Legal docs
    const hasDecision = !!project.DecisionNumber;
    checks.push({
        id: nextCheckId(),
        name: 'Quyết định đầu tư',
        status: hasDecision ? 'passed' : 'failed',
        detail: hasDecision ? `QĐ số ${project.DecisionNumber}` : 'Chưa có QĐ đầu tư',
        isCritical: true,
    });

    // Check 4: Number of contracts
    checks.push({
        id: nextCheckId(),
        name: 'Số lượng HĐ hiện tại',
        status: projectContracts.length > 20 ? 'warning' : 'passed',
        detail: `${projectContracts.length} HĐ hiện có`,
        isCritical: false,
    });

    // Calculate
    const criticalFailed = checks.filter(c => c.isCritical && c.status === 'failed').length;
    const totalWarning = checks.filter(c => c.status === 'warning').length;
    const score = Math.max(0, 100 - criticalFailed * 40 - totalWarning * 10);
    const canApprove = criticalFailed === 0;

    return {
        type: 'contract',
        canApprove,
        score,
        checks,
        riskFlags,
        checkedAt: new Date().toISOString(),
    };
}
