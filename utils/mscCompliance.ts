/**
 * Muasamcong.vn Compliance Utilities
 * Xác định các tài liệu cần đăng tải lên Hệ thống mạng đấu thầu quốc gia
 * 
 * Căn cứ: Luật Đấu thầu 2023, NĐ 214/2025/NĐ-CP
 */

import { BiddingPackage, PackageStatus, MSCPublishingRequirement } from '../types';

/**
 * Danh sách tài liệu cần đăng tải trên muasamcong.vn theo trạng thái gói thầu
 * CDT cần đăng tải đúng thời hạn, nếu không sẽ vi phạm quy định
 */
export function getMSCRequirements(pkg: BiddingPackage): MSCPublishingRequirement[] {
    const requirements: MSCPublishingRequirement[] = [];

    // Gói ≤50 triệu: không cần đăng tải
    if (pkg.Price <= 50_000_000) {
        return [{
            documentType: 'Miễn trừ',
            description: 'Gói thầu ≤50 triệu đồng: không bắt buộc đăng tải',
            isRequired: false,
            legalBasis: 'Khoản 2 Điều 80 NĐ 214/2025',
            status: 'NotApplicable',
        }];
    }

    // === 1. KHLCNT (Kế hoạch lựa chọn nhà thầu) ===
    const hasKHLCNT = !!pkg.KHLCNTCode || !!pkg.DecisionNumber;
    requirements.push({
        documentType: 'KHLCNT',
        description: 'Kế hoạch lựa chọn nhà thầu (đăng sau khi có QĐ phê duyệt)',
        isRequired: true,
        legalBasis: 'Điều 45 Luật Đấu thầu 2023',
        status: hasKHLCNT ? 'Done' : 'NotDone',
        deadline: pkg.DecisionDate ? addDays(pkg.DecisionDate, 7) : undefined,
    });

    // === 2. E-TBMT (Thông báo mời thầu điện tử) ===
    if (isOpenBiddingRequired(pkg)) {
        const hasTBMT = !!pkg.NotificationCode;
        requirements.push({
            documentType: 'E-TBMT',
            description: 'Thông báo mời thầu đăng trên Hệ thống mạng đấu thầu quốc gia',
            isRequired: true,
            legalBasis: 'Điều 46 Luật Đấu thầu 2023',
            status: hasTBMT ? 'Done' : shouldHaveTBMT(pkg) ? 'NotDone' : 'NotApplicable',
        });

        // === 3. E-HSMT (Hồ sơ mời thầu điện tử) ===
        requirements.push({
            documentType: 'E-HSMT',
            description: 'Hồ sơ mời thầu phát hành đồng thời với TBMT',
            isRequired: true,
            legalBasis: 'Điều 46 Luật Đấu thầu 2023',
            status: hasTBMT ? 'Done' : shouldHaveTBMT(pkg) ? 'NotDone' : 'NotApplicable',
        });
    }

    // === 4. Làm rõ / Sửa đổi HSMT ===
    if (pkg.Status === PackageStatus.Bidding || pkg.Status === PackageStatus.Posted) {
        requirements.push({
            documentType: 'Sửa đổi HSMT',
            description: 'Văn bản làm rõ, sửa đổi HSMT (nếu có) phải đăng tải',
            isRequired: false,
            legalBasis: 'Khoản 3 Điều 46 Luật Đấu thầu 2023',
            status: 'NotApplicable',
        });
    }

    // === 5. KQLCNT (Kết quả lựa chọn nhà thầu) ===
    const isAwarded = pkg.Status === PackageStatus.Awarded;
    const hasResult = !!pkg.WinningContractorID || !!pkg.ApprovalDate_Result;
    requirements.push({
        documentType: 'KQLCNT',
        description: 'Kết quả lựa chọn nhà thầu (đăng sau khi có QĐ phê duyệt KQLCNT)',
        isRequired: true,
        legalBasis: 'Điều 48 Luật Đấu thầu 2023',
        status: isAwarded && hasResult ? 'Done' : isAwarded ? 'NotDone' : 'NotApplicable',
        deadline: pkg.ApprovalDate_Result ? addDays(pkg.ApprovalDate_Result, 7) : undefined,
    });

    // === 6. Thông tin hợp đồng ===
    const hasContract = !!pkg.ContractID;
    requirements.push({
        documentType: 'Thông tin HĐ',
        description: 'Thông tin hợp đồng (đăng trong 20 ngày kể từ ngày ký HĐ)',
        isRequired: true,
        legalBasis: 'Điều 48 Luật Đấu thầu 2023, Khoản 4',
        status: hasContract ? 'Done' : isAwarded ? 'NotDone' : 'NotApplicable',
    });

    // === 7. Kiểm tra đấu thầu qua mạng ===
    if (pkg.BidType === 'Offline' && isOnlineBiddingRequired(pkg)) {
        requirements.push({
            documentType: '⚠️ Đấu thầu qua mạng',
            description: 'Gói thầu này bắt buộc đấu thầu qua mạng theo NĐ 214/2025',
            isRequired: true,
            legalBasis: 'Điều 37 NĐ 214/2025',
            status: 'NotDone',
        });
    }

    return requirements;
}

/**
 * Đếm số yêu cầu chưa hoàn thành
 */
export function countPendingRequirements(pkg: BiddingPackage): number {
    const reqs = getMSCRequirements(pkg);
    return reqs.filter(r => r.isRequired && r.status === 'NotDone').length;
}

/**
 * Tổng hợp trạng thái MSC cho danh sách gói thầu
 */
export function getMSCSummary(packages: BiddingPackage[]): {
    totalPending: number;
    packagesNeedAction: number;
    details: { packageName: string; pendingCount: number; items: string[] }[];
} {
    const details: { packageName: string; pendingCount: number; items: string[] }[] = [];
    let totalPending = 0;
    let packagesNeedAction = 0;

    for (const pkg of packages) {
        const reqs = getMSCRequirements(pkg);
        const pending = reqs.filter(r => r.isRequired && r.status === 'NotDone');
        if (pending.length > 0) {
            packagesNeedAction++;
            totalPending += pending.length;
            details.push({
                packageName: `${pkg.PackageNumber}: ${pkg.PackageName}`,
                pendingCount: pending.length,
                items: pending.map(r => r.documentType),
            });
        }
    }

    return { totalPending, packagesNeedAction, details };
}

/**
 * Generate link muasamcong.vn cho KHLCNT
 */
export function getMSCPlanLink(mscPlanCode: string): string {
    if (!mscPlanCode) return '';
    return `https://muasamcong.mpi.gov.vn/web/guest/contractor-selection?planNo=${encodeURIComponent(mscPlanCode)}`;
}

/**
 * Generate link muasamcong.vn cho gói thầu (TBMT)
 */
export function getMSCPackageLink(notificationCode: string): string {
    if (!notificationCode) return '';
    return `https://muasamcong.mpi.gov.vn/web/guest/contractor-selection?noticeNo=${encodeURIComponent(notificationCode)}`;
}

// ===== HELPERS =====

function addDays(dateStr: string, days: number): string {
    try {
        const d = new Date(dateStr);
        d.setDate(d.getDate() + days);
        return d.toISOString().split('T')[0];
    } catch {
        return '';
    }
}

function isOpenBiddingRequired(pkg: BiddingPackage): boolean {
    return ['OpenBidding', 'LimitedBidding', 'CompetitiveShopping'].includes(pkg.SelectionMethod);
}

function shouldHaveTBMT(pkg: BiddingPackage): boolean {
    if (!isOpenBiddingRequired(pkg)) return false;
    const statusOrder = [PackageStatus.Planning, PackageStatus.Posted, PackageStatus.Bidding, PackageStatus.Evaluating, PackageStatus.Awarded];
    const currentIdx = statusOrder.indexOf(pkg.Status);
    // After Planning, should have TBMT
    return currentIdx >= 1;
}

function isOnlineBiddingRequired(pkg: BiddingPackage): boolean {
    // Theo NĐ 214/2025: Đấu thầu rộng rãi, hạn chế, chào hàng cạnh tranh
    // đều bắt buộc qua mạng từ 2025
    return ['OpenBidding', 'LimitedBidding', 'CompetitiveShopping'].includes(pkg.SelectionMethod);
}
