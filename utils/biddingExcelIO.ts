/**
 * Bidding Package Excel Import/Export Utility
 * 
 * Export: BiddingPackage[] → .xlsx file (KHLCNT format)
 * Import: .xlsx file → Partial<BiddingPackage>[] with validation
 */
import * as XLSX from 'xlsx';
import { BiddingPackage, PackageStatus } from '../types';

// ========================================
// COLUMN DEFINITIONS
// ========================================

interface ColumnDef {
    header: string;
    subHeader?: string;
    key: keyof BiddingPackage | 'stt';
    width: number;
    type: 'string' | 'number' | 'boolean';
}

const COLUMNS: ColumnDef[] = [
    { header: 'STT', key: 'stt', width: 6, type: 'number' },
    { header: 'Tên gói thầu', key: 'PackageName', width: 40, type: 'string' },
    { header: 'Tóm tắt công việc chính của gói thầu', key: 'Description', width: 40, type: 'string' },
    { header: 'Lĩnh vực', key: 'Field', width: 14, type: 'string' },
    { header: 'Giá gói thầu (VND)', key: 'Price', width: 20, type: 'number' },
    { header: 'Chi tiết nguồn vốn', key: 'FundingSource', width: 35, type: 'string' },
    { header: 'Hình thức LCNT', key: 'SelectionMethod', width: 22, type: 'string' },
    { header: 'Phương thức LCNT', key: 'SelectionProcedure', width: 22, type: 'string' },
    { header: 'Thời gian tổ chức LCNT', key: 'SelectionDuration', width: 18, type: 'string' },
    { header: 'Thời gian bắt đầu tổ chức LCNT', key: 'SelectionStartDate', width: 20, type: 'string' },
    { header: 'Loại hợp đồng', key: 'ContractType', width: 16, type: 'string' },
    { header: 'Thời gian thực hiện gói thầu', key: 'Duration', width: 18, type: 'string' },
    { header: 'Tùy chọn mua thêm', key: 'HasOption', width: 14, type: 'boolean' },
    { header: 'Trạng thái', key: 'Status', width: 16, type: 'string' },
];

// ========================================
// ENUM → VIETNAMESE LABEL MAPS
// ========================================

const FIELD_MAP: Record<string, string> = {
    Construction: 'Xây lắp',
    Consultancy: 'Tư vấn',
    NonConsultancy: 'Phi tư vấn',
    Goods: 'Hàng hóa',
    Mixed: 'Hỗn hợp',
};
const FIELD_MAP_REVERSE: Record<string, string> = {};
Object.entries(FIELD_MAP).forEach(([k, v]) => { FIELD_MAP_REVERSE[v.toLowerCase()] = k; });

const SELECTION_METHOD_MAP: Record<string, string> = {
    OpenBidding: 'Đấu thầu rộng rãi',
    LimitedBidding: 'Đấu thầu hạn chế',
    Appointed: 'Chỉ định thầu',
    CompetitiveShopping: 'Chào hàng cạnh tranh',
    DirectProcurement: 'Mua sắm trực tiếp',
    SelfExecution: 'Tự thực hiện',
    CommunityParticipation: 'Cộng đồng tham gia',
};
const SELECTION_METHOD_REVERSE: Record<string, string> = {};
Object.entries(SELECTION_METHOD_MAP).forEach(([k, v]) => { SELECTION_METHOD_REVERSE[v.toLowerCase()] = k; });
// Also handle "Chỉ định thầu rút gọn"
SELECTION_METHOD_REVERSE['chỉ định thầu rút gọn'] = 'Appointed';

const PROCEDURE_MAP: Record<string, string> = {
    OneStageOneEnvelope: 'Một giai đoạn một túi hồ sơ',
    OneStageTwoEnvelope: 'Một giai đoạn hai túi hồ sơ',
    TwoStageOneEnvelope: 'Hai giai đoạn một túi hồ sơ',
    TwoStageTwoEnvelope: 'Hai giai đoạn hai túi hồ sơ',
    Reduced: 'Rút gọn',
    Normal: 'Thông thường',
};
const PROCEDURE_REVERSE: Record<string, string> = {};
Object.entries(PROCEDURE_MAP).forEach(([k, v]) => { PROCEDURE_REVERSE[v.toLowerCase()] = k; });
// Handle "Không có phương thức LCNT"
PROCEDURE_REVERSE['không có phương thức lcnt'] = '';

const CONTRACT_TYPE_MAP: Record<string, string> = {
    LumpSum: 'Trọn gói',
    UnitPrice: 'Đơn giá cố định',
    AdjustableUnitPrice: 'Đơn giá điều chỉnh',
    TimeBased: 'Theo thời gian',
    Percentage: 'Theo tỷ lệ %',
    Mixed: 'Hỗn hợp',
};
const CONTRACT_TYPE_REVERSE: Record<string, string> = {};
Object.entries(CONTRACT_TYPE_MAP).forEach(([k, v]) => { CONTRACT_TYPE_REVERSE[v.toLowerCase()] = k; });

const STATUS_MAP: Record<string, string> = {
    Planning: 'Trong kế hoạch',
    Posted: 'Đã đăng tải',
    Bidding: 'Đang mời thầu',
    Evaluating: 'Đang xét thầu',
    Awarded: 'Đã có kết quả',
    Cancelled: 'Hủy thầu',
};
const STATUS_REVERSE: Record<string, string> = {};
Object.entries(STATUS_MAP).forEach(([k, v]) => { STATUS_REVERSE[v.toLowerCase()] = k; });

// ========================================
// EXPORT
// ========================================

export function exportBiddingPackagesToExcel(
    packages: BiddingPackage[],
    projectName: string
): void {
    // Build data rows
    const rows = packages.map((pkg, idx) => ({
        'STT': idx + 1,
        'Tên gói thầu': pkg.PackageName || '',
        'Tóm tắt công việc chính của gói thầu': pkg.Description || '',
        'Lĩnh vực': FIELD_MAP[pkg.Field || ''] || pkg.Field || '',
        'Giá gói thầu (VND)': pkg.Price || 0,
        'Chi tiết nguồn vốn': pkg.FundingSource || '',
        'Hình thức LCNT': SELECTION_METHOD_MAP[pkg.SelectionMethod || ''] || pkg.SelectionMethod || '',
        'Phương thức LCNT': PROCEDURE_MAP[pkg.SelectionProcedure || ''] || pkg.SelectionProcedure || 'Không có phương thức LCNT',
        'Thời gian tổ chức LCNT': pkg.SelectionDuration || '',
        'Thời gian bắt đầu tổ chức LCNT': pkg.SelectionStartDate || '',
        'Loại hợp đồng': CONTRACT_TYPE_MAP[pkg.ContractType || ''] || pkg.ContractType || '',
        'Thời gian thực hiện gói thầu': pkg.Duration || '',
        'Tùy chọn mua thêm': pkg.HasOption ? 'Có' : 'Không áp dụng',
        'Trạng thái': STATUS_MAP[pkg.Status || ''] || pkg.Status || '',
    }));

    // Create workbook
    const ws = XLSX.utils.json_to_sheet(rows);

    // Set column widths
    ws['!cols'] = COLUMNS.map(c => ({ wch: c.width }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Gói thầu');

    // Generate filename
    const shortName = projectName.length > 30 ? projectName.slice(0, 30) : projectName;
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const fileName = `GoiThau_${shortName}_${dateStr}.xlsx`;

    // Download
    XLSX.writeFile(wb, fileName);
}

// ========================================
// IMPORT
// ========================================

export interface ImportResult {
    packages: Partial<BiddingPackage>[];
    errors: string[];
    warnings: string[];
}

/**
 * Header matching — fuzzy match Vietnamese column headers
 */
// Order matters: more specific patterns MUST come before broader ones.
// "Thời gian bắt đầu tổ chức LCNT" must match SelectionStartDate before
// "Thời gian tổ chức LCNT" matches SelectionDuration (substring overlap).
const HEADER_PATTERNS: { patterns: string[]; field: keyof BiddingPackage | 'stt' }[] = [
    { patterns: ['stt', 'số thứ tự'], field: 'stt' },
    { patterns: ['giá gói thầu', 'giá gói'], field: 'Price' },
    { patterns: ['tên gói thầu', 'tên gói'], field: 'PackageName' },
    { patterns: ['tóm tắt công việc', 'tóm tắt', 'công việc chính', 'mô tả công việc'], field: 'Description' },
    { patterns: ['lĩnh vực'], field: 'Field' },
    { patterns: ['chi tiết nguồn vốn', 'nguồn vốn'], field: 'FundingSource' },
    { patterns: ['hình thức lcnt', 'hình thức lựa chọn nhà thầu', 'hình thức lựa chọn'], field: 'SelectionMethod' },
    { patterns: ['phương thức lcnt', 'phương thức lựa chọn nhà thầu', 'phương thức lựa chọn'], field: 'SelectionProcedure' },
    // SelectionStartDate MUST come before SelectionDuration (more specific)
    { patterns: ['thời gian bắt đầu tổ chức', 'bắt đầu tổ chức lcnt', 'bắt đầu lcnt'], field: 'SelectionStartDate' },
    { patterns: ['thời gian tổ chức lcnt', 'thời gian tổ chức lựa chọn'], field: 'SelectionDuration' },
    // Duration MUST come after SelectionDuration/SelectionStartDate
    { patterns: ['thời gian thực hiện gói thầu', 'thời gian thực hiện hợp đồng', 'thời gian thực hiện'], field: 'Duration' },
    { patterns: ['loại hợp đồng'], field: 'ContractType' },
    { patterns: ['tùy chọn mua thêm', 'mua thêm'], field: 'HasOption' },
    { patterns: ['trạng thái', 'tình trạng tbmt', 'tình trạng'], field: 'Status' },
];

function matchHeader(header: string): keyof BiddingPackage | 'stt' | null {
    const normalized = header.toLowerCase().trim()
        .replace(/\s+/g, ' ')
        .replace(/\n/g, ' ')
        .replace(/\(.*?\)/g, '')
        .trim();

    if (!normalized) return null;

    // Pass 1: exact match (strongest)
    for (const { patterns, field } of HEADER_PATTERNS) {
        for (const pattern of patterns) {
            if (normalized === pattern) return field;
        }
    }

    // Pass 2: header contains pattern (e.g., "Giá gói thầu (VND)" contains "giá gói thầu")
    // Only check normalized.includes(pattern), NOT pattern.includes(normalized),
    // to avoid short patterns matching unrelated long headers.
    for (const { patterns, field } of HEADER_PATTERNS) {
        for (const pattern of patterns) {
            if (normalized.includes(pattern)) return field;
        }
    }

    return null;
}

function parsePrice(val: any): number {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const str = String(val)
        .replace(/[^\d.,]/g, '')  // keep digits, dots, commas
        .replace(/\./g, '')       // remove thousand separators (Vietnamese dots)
        .replace(/,/g, '.');      // convert decimal comma to dot
    return parseFloat(str) || 0;
}

function reverseMapValue(val: string, reverseMap: Record<string, string>): string {
    if (!val) return '';
    const key = val.toLowerCase().trim();
    return reverseMap[key] || val;
}

export async function parseBiddingPackagesFromExcel(
    file: File,
    projectId: string
): Promise<ImportResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const packages: Partial<BiddingPackage>[] = [];

    try {
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: 'array' });
        const sheetName = wb.SheetNames[0];
        if (!sheetName) {
            errors.push('File Excel không có sheet nào');
            return { packages, errors, warnings };
        }

        const ws = wb.Sheets[sheetName];
        const raw: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        if (raw.length < 2) {
            errors.push('File Excel rỗng hoặc chỉ có header');
            return { packages, errors, warnings };
        }

        // Find header row (first row with >= 3 matched columns)
        let headerRowIdx = -1;
        let columnMap: Map<number, keyof BiddingPackage | 'stt'> = new Map();

        for (let i = 0; i < Math.min(5, raw.length); i++) {
            const row = raw[i];
            const tempMap = new Map<number, keyof BiddingPackage | 'stt'>();
            for (let j = 0; j < row.length; j++) {
                const matched = matchHeader(String(row[j] || ''));
                if (matched) tempMap.set(j, matched);
            }
            if (tempMap.size >= 3) {
                headerRowIdx = i;
                columnMap = tempMap;
                break;
            }
        }

        if (headerRowIdx === -1) {
            errors.push('Không tìm thấy header phù hợp. Đảm bảo file có các cột: Tên gói thầu, Giá gói thầu, Lĩnh vực...');
            return { packages, errors, warnings };
        }

        // Check for multi-row headers - look for sub-headers
        const nextRow = raw[headerRowIdx + 1];
        let dataStartRow = headerRowIdx + 1;
        if (nextRow) {
            const hasSubHeaders = nextRow.some((cell: any) => {
                const str = String(cell || '').toLowerCase().trim();
                return str.includes('tóm tắt') || str.includes('công việc chính') || str.includes('tên gói thầu');
            });
            if (hasSubHeaders) {
                // Merge sub-header mappings
                for (let j = 0; j < nextRow.length; j++) {
                    const matched = matchHeader(String(nextRow[j] || ''));
                    if (matched && !columnMap.has(j)) {
                        columnMap.set(j, matched);
                    }
                }
                dataStartRow = headerRowIdx + 2;
            }
        }

        // Parse data rows
        for (let i = dataStartRow; i < raw.length; i++) {
            const row = raw[i];
            const rowNum = i + 1;

            // Skip empty rows
            const hasData = row.some((cell: any) => String(cell || '').trim() !== '');
            if (!hasData) continue;

            // Skip summary/total rows
            const firstCell = String(row[0] || '').toLowerCase();
            if (firstCell.includes('tổng') || firstCell.includes('cộng')) continue;

            const pkg: Partial<BiddingPackage> = {
                ProjectID: projectId,
                Status: PackageStatus.Planning,
                BidType: 'Offline',
            };

            let stt = '';

            columnMap.forEach((field, colIdx) => {
                const cellValue = row[colIdx];
                const strValue = String(cellValue ?? '').trim();

                switch (field) {
                    case 'stt':
                        stt = strValue;
                        break;
                    case 'PackageName':
                        pkg.PackageName = strValue;
                        break;
                    case 'Description':
                        pkg.Description = strValue;
                        break;
                    case 'Field':
                        // DB stores Vietnamese: 'Tư vấn', 'Xây lắp', 'Mua sắm'...
                        pkg.Field = (strValue || 'Tư vấn') as any;
                        break;
                    case 'Price':
                        pkg.Price = parsePrice(cellValue);
                        if (pkg.Price === 0 && strValue) {
                            warnings.push(`Dòng ${rowNum}: Không parse được giá "${strValue}"`);
                        }
                        break;
                    case 'FundingSource':
                        pkg.FundingSource = strValue;
                        break;
                    case 'SelectionMethod':
                        // DB stores Vietnamese: 'Đấu thầu rộng rãi', 'Chỉ định thầu'...
                        pkg.SelectionMethod = (strValue || 'Chỉ định thầu') as any;
                        // Auto-detect "rút gọn" in method text
                        if (strValue.toLowerCase().includes('rút gọn')) {
                            pkg.SelectionProcedure = 'Rút gọn' as any;
                        }
                        break;
                    case 'SelectionProcedure':
                        // DB stores Vietnamese: 'Một giai đoạn một túi hồ sơ'...
                        if (strValue) pkg.SelectionProcedure = strValue as any;
                        break;
                    case 'SelectionDuration':
                        pkg.SelectionDuration = strValue;
                        break;
                    case 'SelectionStartDate':
                        pkg.SelectionStartDate = strValue;
                        break;
                    case 'ContractType':
                        // DB stores Vietnamese: 'Trọn gói', 'Theo đơn giá', 'Theo đơn giá điều chỉnh'...
                        pkg.ContractType = (strValue || 'Trọn gói') as any;
                        break;
                    case 'Duration':
                        pkg.Duration = strValue;
                        break;
                    case 'HasOption':
                        pkg.HasOption = strValue.toLowerCase().includes('có') && !strValue.toLowerCase().includes('không');
                        break;
                    case 'Status': {
                        // DB stores English status: 'Planning', 'Bidding', 'Executing'...
                        const statusMap: Record<string, string> = {
                            'trong kế hoạch': 'Planning',
                            'đã đăng tải': 'Posted',
                            'đang mời thầu': 'Bidding',
                            'đang xét thầu': 'Evaluating',
                            'đã có kết quả': 'Awarded',
                            'hủy thầu': 'Cancelled',
                            'đang thực hiện': 'Executing',
                            'hoàn thành': 'Completed',
                        };
                        const lower = strValue.toLowerCase().trim();
                        pkg.Status = (statusMap[lower] || strValue || 'Planning') as any;
                        if (lower.includes('tbmt')) pkg.Status = 'Posted' as any;
                        break;
                    }
                }
            });

            // Validate required fields
            if (!pkg.PackageName) {
                warnings.push(`Dòng ${rowNum}: Thiếu tên gói thầu, bỏ qua`);
                continue;
            }

            // Auto-generate PackageID
            const paddedNum = String(packages.length + 1).padStart(2, '0');
            pkg.PackageID = `PKG-IMP-${Date.now()}-${paddedNum}`;
            pkg.SortOrder = packages.length + 1;

            packages.push(pkg);
        }

        if (packages.length === 0) {
            errors.push('Không tìm thấy dòng dữ liệu hợp lệ nào trong file');
        }

    } catch (err: any) {
        errors.push(`Lỗi đọc file: ${err.message}`);
    }

    return { packages, errors, warnings };
}
