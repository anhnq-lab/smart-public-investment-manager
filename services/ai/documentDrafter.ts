// Document Drafter — AI soạn thảo văn bản từ dữ liệu dự án
// Lấy dữ liệu từ các service → gửi Gemini → trả về bản nháp văn bản

import { draftDocument } from '../aiService';
import { ProjectService } from '../ProjectService';
import { ContractService } from '../ContractService';
import { PaymentService } from '../PaymentService';
import { CapitalService } from '../CapitalService';

export type DocumentType =
    | 'monitoring_report'      // Báo cáo giám sát
    | 'settlement_report'      // Báo cáo quyết toán
    | 'extension_request'      // Tờ trình xin gia hạn
    | 'adjustment_request'     // Tờ trình điều chỉnh dự án
    | 'acceptance_report'      // Biên bản nghiệm thu
    | 'progress_report'        // Báo cáo tiến độ
    | 'disbursement_report';   // Báo cáo giải ngân

export interface DocumentTypeInfo {
    type: DocumentType;
    label: string;
    description: string;
    icon: string;
}

export const DOCUMENT_TYPES: DocumentTypeInfo[] = [
    {
        type: 'monitoring_report',
        label: 'Báo cáo giám sát',
        description: 'Báo cáo giám sát tình hình thực hiện dự án định kỳ (tháng/quý)',
        icon: '📊',
    },
    {
        type: 'progress_report',
        label: 'Báo cáo tiến độ',
        description: 'Báo cáo tiến độ thực hiện so với kế hoạch',
        icon: '📈',
    },
    {
        type: 'disbursement_report',
        label: 'Báo cáo giải ngân',
        description: 'Tình hình giải ngân vốn đầu tư so với kế hoạch năm',
        icon: '💰',
    },
    {
        type: 'extension_request',
        label: 'Tờ trình xin gia hạn',
        description: 'Tờ trình đề nghị gia hạn thời gian thực hiện hợp đồng',
        icon: '📝',
    },
    {
        type: 'adjustment_request',
        label: 'Tờ trình điều chỉnh DA',
        description: 'Tờ trình đề nghị điều chỉnh dự án',
        icon: '📋',
    },
    {
        type: 'acceptance_report',
        label: 'Biên bản nghiệm thu',
        description: 'Biên bản nghiệm thu khối lượng hoàn thành',
        icon: '✅',
    },
    {
        type: 'settlement_report',
        label: 'Báo cáo quyết toán',
        description: 'Báo cáo quyết toán vốn đầu tư dự án hoàn thành',
        icon: '🧾',
    },
];

/**
 * Gom dữ liệu dự án từ nhiều nguồn
 */
async function gatherProjectData(projectId: string) {
    const project = await ProjectService.getById(projectId);
    if (!project) throw new Error('Không tìm thấy dự án');

    // Parallel fetch additional data
    const [capitalInfo, packages] = await Promise.all([
        ProjectService.getCapitalInfo(projectId).catch(() => null),
        ProjectService.getPackagesByProject(projectId).catch(() => []),
    ]);

    // Get contracts and payments for the project's packages
    let contracts: Awaited<ReturnType<typeof ContractService.getAll>> = [];
    let payments: Awaited<ReturnType<typeof PaymentService.getAll>> = [];

    if (packages.length > 0) {
        const contractResults = await Promise.all(
            packages.map(pkg => ContractService.getByPackageId(pkg.PackageID).catch(() => []))
        );
        contracts = contractResults.flat();

        if (contracts.length > 0) {
            const paymentResults = await Promise.all(
                contracts.map(c => PaymentService.getByContractId(c.ContractID).catch(() => []))
            );
            payments = paymentResults.flat();
        }
    }

    return {
        project,
        capitalInfo,
        packages,
        contracts,
        payments,
        currentDate: new Date().toISOString(),
    };
}

/**
 * Soạn văn bản AI
 */
export async function generateDocument(
    projectId: string,
    documentType: DocumentType
): Promise<string> {
    const data = await gatherProjectData(projectId);

    const typeInfo = DOCUMENT_TYPES.find(t => t.type === documentType);
    const typeLabel = typeInfo?.label || documentType;

    return await draftDocument(typeLabel, data);
}

/**
 * Soạn văn bản với context tùy chỉnh
 */
export async function generateDocumentWithContext(
    projectId: string,
    documentType: DocumentType,
    additionalContext: string
): Promise<string> {
    const data = await gatherProjectData(projectId);

    const typeInfo = DOCUMENT_TYPES.find(t => t.type === documentType);
    const typeLabel = typeInfo?.label || documentType;

    return await draftDocument(typeLabel, {
        ...data,
        additionalContext,
    });
}
