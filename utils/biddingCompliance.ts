/**
 * Bidding Compliance Utilities theo NĐ 214/2025/NĐ-CP
 * Hiệu lực: 04/08/2025
 */

import {
    BIDDING_THRESHOLDS,
    ApplicableSelectionMethod,
    BiddingPackage
} from '../types';

/**
 * Xác định hình thức LCNT áp dụng dựa trên giá gói thầu và lĩnh vực
 * @param price Giá gói thầu (VND)
 * @param field Lĩnh vực gói thầu
 * @param isProjectBased Thuộc dự án hay dự toán mua sắm
 */
export function detectApplicableMethod(
    price: number,
    field: BiddingPackage['Field'],
    isProjectBased: boolean = true
): ApplicableSelectionMethod {
    // Gói ≤50 triệu: Mua sắm trực tiếp
    if (price <= BIDDING_THRESHOLDS.DIRECT_PURCHASE) {
        return 'DirectPurchase';
    }

    // Xác định hạn mức CĐT rút gọn theo lĩnh vực
    const cdtThreshold = getCDTThreshold(field, isProjectBased);

    if (price <= cdtThreshold) {
        return 'SimplifiedCDT';
    }

    // Chào hàng cạnh tranh
    if (price <= BIDDING_THRESHOLDS.COMPETITIVE_SHOPPING) {
        return 'CompetitiveShopping';
    }

    // Mặc định: Đấu thầu rộng rãi
    return 'OpenBidding';
}

/**
 * Lấy hạn mức CĐT rút gọn theo lĩnh vực gói thầu
 */
function getCDTThreshold(
    field: BiddingPackage['Field'],
    isProjectBased: boolean
): number {
    if (!isProjectBased) {
        return BIDDING_THRESHOLDS.CDT_SIMPLIFIED_ESTIMATE;
    }

    switch (field) {
        case 'Consultancy':
            return BIDDING_THRESHOLDS.CDT_SIMPLIFIED_CONSULTANCY;
        case 'Construction':
        case 'NonConsultancy':
        case 'Goods':
        case 'Mixed':
        default:
            return BIDDING_THRESHOLDS.CDT_SIMPLIFIED_CONSTRUCTION;
    }
}

/**
 * Kiểm tra gói thầu có cần thẩm định KHLCNT không
 * Theo NĐ 214/2025: Bãi bỏ yêu cầu thẩm định KHLCNT
 */
export function requiresAppraisal(
    _packageType: 'KHLCNT' | 'HSMT' | 'KQLCNT'
): boolean {
    // Theo NĐ 214/2025: KHLCNT không bắt buộc thẩm định
    // HSMT và KQLCNT: Không bắt buộc, thẩm định khi có yêu cầu
    return false;
}

/**
 * Format hạn mức tiền tệ cho hiển thị
 */
export function formatThreshold(amount: number): string {
    if (amount >= 1_000_000_000) {
        return `${amount / 1_000_000_000} tỷ`;
    }
    if (amount >= 1_000_000) {
        return `${amount / 1_000_000} triệu`;
    }
    return `${amount.toLocaleString('vi-VN')} đồng`;
}

/**
 * Lấy thông tin hướng dẫn cho hình thức LCNT
 */
export function getMethodGuidance(method: ApplicableSelectionMethod): {
    label: string;
    description: string;
    legalBasis: string;
} {
    switch (method) {
        case 'DirectPurchase':
            return {
                label: 'Mua sắm trực tiếp',
                description: 'Không cần kế hoạch bố trí vốn, chỉ cần hóa đơn chứng từ',
                legalBasis: 'NĐ 214/2025, Điều 80',
            };
        case 'SimplifiedCDT':
            return {
                label: 'Chỉ định thầu rút gọn',
                description: 'Quy trình rút gọn, không bắt buộc thẩm định HSYC và KQLCNT',
                legalBasis: 'NĐ 214/2025, Điều 78, 80',
            };
        case 'NormalCDT':
            return {
                label: 'Chỉ định thầu thông thường',
                description: 'Không bắt buộc thẩm định HSYC và KQLCNT, do Chủ đầu tư quyết định',
                legalBasis: 'NĐ 214/2025, Điều 79',
            };
        case 'OnlineQuotation':
            return {
                label: 'Chào giá trực tuyến',
                description: 'Thực hiện qua Hệ thống mạng đấu thầu quốc gia',
                legalBasis: 'NĐ 214/2025, Điều 99',
            };
        case 'CompetitiveShopping':
            return {
                label: 'Chào hàng cạnh tranh',
                description: 'Áp dụng cho gói thầu ≤10 tỷ đồng',
                legalBasis: 'NĐ 214/2025, Điều 81',
            };
        case 'OpenBidding':
        default:
            return {
                label: 'Đấu thầu rộng rãi',
                description: 'Hình thức cạnh tranh cao nhất, mọi nhà thầu đều có thể tham gia',
                legalBasis: 'Luật Đấu thầu 2023',
            };
    }
}

/**
 * Kiểm tra compliance của gói thầu
 */
export function checkPackageCompliance(pkg: BiddingPackage): {
    isCompliant: boolean;
    issues: string[];
    suggestions: string[];
} {
    const issues: string[] = [];
    const suggestions: string[] = [];

    const detectedMethod = detectApplicableMethod(pkg.Price, pkg.Field);

    // Kiểm tra hình thức LCNT có phù hợp với hạn mức không
    if (pkg.SelectionMethod === 'Appointed' && pkg.Price > BIDDING_THRESHOLDS.CDT_SIMPLIFIED_CONSTRUCTION) {
        issues.push(
            `Giá gói thầu (${formatThreshold(pkg.Price)}) vượt hạn mức CĐT rút gọn cho ${pkg.Field}`
        );
        suggestions.push('Cân nhắc chuyển sang hình thức Đấu thầu rộng rãi hoặc Chào hàng cạnh tranh');
    }

    // Gợi ý nếu có thể áp dụng hình thức đơn giản hơn
    if (detectedMethod === 'SimplifiedCDT' && pkg.SelectionMethod === 'OpenBidding') {
        suggestions.push(
            `Theo NĐ 214/2025, gói thầu này có thể áp dụng CĐT rút gọn (hạn mức: ${formatThreshold(getCDTThreshold(pkg.Field, true))})`
        );
    }

    return {
        isCompliant: issues.length === 0,
        issues,
        suggestions,
    };
}
