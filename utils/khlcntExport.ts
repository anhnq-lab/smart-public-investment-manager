/**
 * KHLCNT Export Utility
 * Xuất Quyết định phê duyệt Kế hoạch lựa chọn nhà thầu
 * 
 * Approach: HTML → window.print() → PDF
 * Lý do: jspdf không hỗ trợ Unicode/Vietnamese natively, 
 * cần embed font base64 rất nặng. Dùng print() tận dụng 
 * font system sẵn có.
 */

import { BiddingPackage } from '../types';
import { formatCurrency } from './format';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface KHLCNTExportData {
    // Thông tin QĐ
    decisionNumber: string;      // Số QĐ: VD "123/QĐ-UBND"
    decisionDate: string;        // Ngày ký QĐ
    signerName: string;          // Họ tên người ký
    signerTitle: string;         // Chức vụ người ký

    // Thông tin dự án
    projectName: string;
    investmentDecision: string;  // Số QĐ đầu tư
    totalInvestment: number;     // TMĐT
    fundingSource: string;       // Nguồn vốn
    investorName: string;        // Tên CĐT

    // Cơ quan ban hành
    issuingAuthority: string;    // VD: "UBND TỈNH HẢI DƯƠNG"
    issuingDepartment: string;   // VD: "CHỦ TỊCH"

    // Danh sách gói thầu
    packages: BiddingPackage[];
}

// Label mapping
const FIELD_LABELS: Record<string, string> = {
    Construction: 'Xây lắp',
    Consultancy: 'Tư vấn',
    NonConsultancy: 'Phi tư vấn',
    Goods: 'Hàng hóa',
    Mixed: 'Hỗn hợp',
};

const METHOD_LABELS: Record<string, string> = {
    OpenBidding: 'Đấu thầu rộng rãi',
    LimitedBidding: 'Đấu thầu hạn chế',
    Appointed: 'Chỉ định thầu',
    CompetitiveShopping: 'Chào hàng cạnh tranh',
    DirectProcurement: 'Mua sắm trực tiếp',
    SelfExecution: 'Tự thực hiện',
    CommunityParticipation: 'Cộng đồng tham gia',
};

const PROCEDURE_LABELS: Record<string, string> = {
    OneStageOneEnvelope: '1 giai đoạn 1 túi hồ sơ',
    OneStageTwoEnvelope: '1 giai đoạn 2 túi hồ sơ',
    TwoStageOneEnvelope: '2 giai đoạn 1 túi hồ sơ',
    TwoStageTwoEnvelope: '2 giai đoạn 2 túi hồ sơ',
    Reduced: 'Rút gọn',
    Normal: 'Thông thường',
};

const CONTRACT_LABELS: Record<string, string> = {
    LumpSum: 'Trọn gói',
    UnitPrice: 'Đơn giá cố định',
    AdjustableUnitPrice: 'Đơn giá điều chỉnh',
    TimeBased: 'Theo thời gian',
    Percentage: 'Theo tỷ lệ %',
    Mixed: 'Hỗn hợp',
};

const BID_TYPE_LABELS: Record<string, string> = {
    Online: 'Qua mạng',
    Offline: 'Trực tiếp',
};

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function formatDate(dateStr: string): string {
    if (!dateStr) return '...../...../........';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `ngày ${day} tháng ${month} năm ${year}`;
}

function formatDateShort(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

// ═══════════════════════════════════════════════════════════════
// MAIN: Generate HTML for QĐ phê duyệt KHLCNT
// ═══════════════════════════════════════════════════════════════

function generateKHLCNTHtml(data: KHLCNTExportData): string {
    const totalPrice = data.packages.reduce((sum, pkg) => sum + (pkg.Price || 0), 0);

    // Build table rows
    const tableRows = data.packages.map((pkg, idx) => `
        <tr>
            <td class="center">${idx + 1}</td>
            <td>${pkg.PackageName || ''}</td>
            <td class="right">${pkg.Price ? formatCurrency(pkg.Price) : ''}</td>
            <td>${pkg.FundingSource || data.fundingSource || ''}</td>
            <td>${FIELD_LABELS[pkg.Field] || pkg.Field || ''}</td>
            <td>${METHOD_LABELS[pkg.SelectionMethod] || pkg.SelectionMethod || ''}</td>
            <td>${PROCEDURE_LABELS[pkg.SelectionProcedure] || pkg.SelectionProcedure || ''}</td>
            <td>${BID_TYPE_LABELS[pkg.BidType] || pkg.BidType || ''}</td>
            <td>${CONTRACT_LABELS[pkg.ContractType] || pkg.ContractType || ''}</td>
            <td>${pkg.Duration || ''}</td>
            <td>${pkg.SelectionDuration || ''}</td>
            <td>${pkg.SelectionStartDate || ''}</td>
            <td>${pkg.HasOption ? 'Có' : 'Không'}</td>
        </tr>
    `).join('');

    return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>QĐ phê duyệt KHLCNT - ${data.projectName}</title>
<style>
    @page {
        size: A4 landscape;
        margin: 15mm 10mm;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
        font-family: 'Times New Roman', 'Noto Serif', serif;
        font-size: 13pt;
        line-height: 1.5;
        color: #000;
        background: #fff;
    }

    /* === QUYẾT ĐỊNH === */
    .decision-page {
        page-break-after: always;
        max-width: 210mm;
        margin: 0 auto;
        padding: 10mm 15mm;
    }

    .header-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 20pt;
    }
    .header-left {
        text-align: center;
        width: 45%;
    }
    .header-right {
        text-align: center;
        width: 45%;
    }
    .header-org {
        font-weight: bold;
        font-size: 13pt;
        text-transform: uppercase;
    }
    .header-line {
        width: 40%;
        margin: 4pt auto;
        border-bottom: 1.5pt solid #000;
    }
    .header-number {
        font-size: 13pt;
        margin-top: 4pt;
    }
    .header-place-date {
        font-style: italic;
        font-size: 13pt;
    }

    .title {
        text-align: center;
        font-weight: bold;
        font-size: 14pt;
        text-transform: uppercase;
        margin: 16pt 0 4pt;
    }
    .subtitle {
        text-align: center;
        font-weight: bold;
        font-size: 13pt;
        margin-bottom: 16pt;
    }

    .legal-basis {
        padding-left: 40pt;
        margin-bottom: 6pt;
    }
    .legal-basis em {
        font-style: italic;
    }

    .article {
        font-weight: bold;
        margin: 12pt 0 6pt;
    }
    .article-content {
        padding-left: 20pt;
        margin-bottom: 6pt;
    }

    .signature-block {
        display: flex;
        justify-content: space-between;
        margin-top: 30pt;
    }
    .sig-left {
        width: 40%;
        font-size: 11pt;
    }
    .sig-left b { display: block; margin-bottom: 4pt; }
    .sig-left .dest { margin-bottom: 2pt; }
    .sig-right {
        text-align: center;
        width: 40%;
    }
    .sig-title {
        font-weight: bold;
        text-transform: uppercase;
        font-size: 13pt;
    }
    .sig-space {
        height: 60pt;
    }
    .sig-name {
        font-weight: bold;
        font-size: 13pt;
    }

    /* === PHỤ LỤC === */
    .appendix-page {
        padding: 8mm 5mm;
    }

    .appendix-title {
        text-align: center;
        font-weight: bold;
        font-size: 13pt;
        text-transform: uppercase;
        margin-bottom: 4pt;
    }
    .appendix-subtitle {
        text-align: center;
        font-style: italic;
        font-size: 12pt;
        margin-bottom: 12pt;
    }

    table.khlcnt {
        width: 100%;
        border-collapse: collapse;
        font-size: 10pt;
    }
    table.khlcnt th, table.khlcnt td {
        border: 0.5pt solid #000;
        padding: 4pt 3pt;
        vertical-align: top;
    }
    table.khlcnt th {
        background: #f0f0f0;
        font-weight: bold;
        text-align: center;
        font-size: 9pt;
    }
    table.khlcnt td.center { text-align: center; }
    table.khlcnt td.right { text-align: right; }
    table.khlcnt tr.total-row {
        font-weight: bold;
        background: #fafafa;
    }

    @media print {
        body { -webkit-print-color-adjust: exact; }
        .no-print { display: none; }
    }
</style>
</head>
<body>

<!-- ═══════════════ TRANG 1: QUYẾT ĐỊNH ═══════════════ -->
<div class="decision-page">
    <div class="header-row">
        <div class="header-left">
            <div class="header-org">${data.issuingAuthority}</div>
            <div class="header-line"></div>
            <div class="header-number">Số: ${data.decisionNumber}</div>
        </div>
        <div class="header-right">
            <div style="font-weight:bold; font-size:13pt;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
            <div style="font-weight:bold; font-size:13pt;">Độc lập - Tự do - Hạnh phúc</div>
            <div class="header-line"></div>
            <div class="header-place-date">
                Hải Dương, ${formatDate(data.decisionDate)}
            </div>
        </div>
    </div>

    <div class="title">QUYẾT ĐỊNH</div>
    <div class="subtitle">
        Về việc phê duyệt kế hoạch lựa chọn nhà thầu<br/>
        Dự án: ${data.projectName}
    </div>

    <div style="text-align:center; font-weight:bold; margin-bottom:12pt; text-transform:uppercase;">
        ${data.issuingDepartment}
    </div>

    <!-- Căn cứ pháp lý -->
    <div class="legal-basis"><em>Căn cứ Luật Đấu thầu số 22/2023/QH15 ngày 23/6/2023;</em></div>
    <div class="legal-basis"><em>Căn cứ Nghị định số 24/2024/NĐ-CP ngày 27/02/2024 quy định chi tiết một số điều và biện pháp thi hành Luật Đấu thầu;</em></div>
    <div class="legal-basis"><em>Căn cứ Nghị định số 214/2025/NĐ-CP sửa đổi, bổ sung NĐ 24/2024/NĐ-CP;</em></div>
    <div class="legal-basis"><em>Căn cứ Luật Đầu tư công số 58/2024/QH15;</em></div>
    <div class="legal-basis"><em>Căn cứ Quyết định đầu tư số ${data.investmentDecision};</em></div>
    <div class="legal-basis"><em>Xét đề nghị của ${data.investorName},</em></div>

    <!-- Điều 1 -->
    <div class="article">Điều 1.</div>
    <div class="article-content">
        Phê duyệt kế hoạch lựa chọn nhà thầu Dự án: <b>${data.projectName}</b> với các nội dung chủ yếu sau:
    </div>
    <div class="article-content">
        1. Tên dự án: ${data.projectName}
    </div>
    <div class="article-content">
        2. Tổng mức đầu tư: ${formatCurrency(data.totalInvestment)}
    </div>
    <div class="article-content">
        3. Nguồn vốn: ${data.fundingSource}
    </div>
    <div class="article-content">
        4. Chủ đầu tư: ${data.investorName}
    </div>
    <div class="article-content">
        5. Nội dung kế hoạch lựa chọn nhà thầu: Theo Phụ lục đính kèm.
    </div>

    <!-- Điều 2 -->
    <div class="article">Điều 2.</div>
    <div class="article-content">
        Giao ${data.investorName} tổ chức thực hiện lựa chọn nhà thầu theo đúng quy định của pháp luật về đấu thầu hiện hành.
    </div>

    <!-- Điều 3 -->
    <div class="article">Điều 3.</div>
    <div class="article-content">
        Quyết định này có hiệu lực kể từ ngày ký. Thủ trưởng các cơ quan, đơn vị có liên quan chịu trách nhiệm thi hành Quyết định này./.
    </div>

    <!-- Chữ ký -->
    <div class="signature-block">
        <div class="sig-left">
            <b>Nơi nhận:</b>
            <div class="dest">- Như Điều 3;</div>
            <div class="dest">- Sở KH&ĐT;</div>
            <div class="dest">- Kho bạc NN;</div>
            <div class="dest">- Lưu: VT.</div>
        </div>
        <div class="sig-right">
            <div class="sig-title">${data.issuingDepartment}</div>
            <div class="sig-space"></div>
            <div class="sig-name">${data.signerName}</div>
        </div>
    </div>
</div>

<!-- ═══════════════ TRANG 2: PHỤ LỤC ═══════════════ -->
<div class="appendix-page">
    <div class="appendix-title">PHỤ LỤC</div>
    <div class="appendix-title" style="font-size:12pt; margin-bottom:2pt;">
        KẾ HOẠCH LỰA CHỌN NHÀ THẦU
    </div>
    <div class="appendix-subtitle">
        (Kèm theo Quyết định số ${data.decisionNumber} ngày ${formatDateShort(data.decisionDate)})
    </div>
    <div style="margin-bottom:8pt; font-size:11pt;">
        <b>Tên dự án:</b> ${data.projectName}<br/>
        <b>Chủ đầu tư:</b> ${data.investorName}
    </div>

    <table class="khlcnt">
        <thead>
            <tr>
                <th rowspan="2" style="width:3%">TT</th>
                <th rowspan="2" style="width:15%">Tên gói thầu</th>
                <th rowspan="2" style="width:8%">Giá gói thầu (VNĐ)</th>
                <th rowspan="2" style="width:7%">Nguồn vốn</th>
                <th rowspan="2" style="width:6%">Lĩnh vực</th>
                <th rowspan="2" style="width:9%">Hình thức LCNT</th>
                <th rowspan="2" style="width:9%">Phương thức LCNT</th>
                <th rowspan="2" style="width:6%">Hình thức đấu thầu</th>
                <th rowspan="2" style="width:7%">Loại HĐ</th>
                <th rowspan="2" style="width:6%">Thời gian TH HĐ</th>
                <th colspan="2" style="width:12%">Thời gian tổ chức LCNT</th>
                <th rowspan="2" style="width:5%">Tùy chọn</th>
            </tr>
            <tr>
                <th>Thời gian</th>
                <th>Bắt đầu</th>
            </tr>
        </thead>
        <tbody>
            ${tableRows}
            <tr class="total-row">
                <td class="center" colspan="2"><b>Tổng cộng</b></td>
                <td class="right"><b>${formatCurrency(totalPrice)}</b></td>
                <td colspan="10"></td>
            </tr>
        </tbody>
    </table>
</div>

</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════
// EXPORT FUNCTION
// ═══════════════════════════════════════════════════════════════

export function exportKHLCNT(data: KHLCNTExportData): void {
    const html = generateKHLCNTHtml(data);

    // Open new window and print
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Trình duyệt chặn popup. Vui lòng cho phép popup để xuất PDF.');
        return;
    }

    printWindow.document.write(html);
    printWindow.document.close();

    // Wait for content to render, then trigger print
    printWindow.onload = () => {
        setTimeout(() => {
            printWindow.print();
        }, 500);
    };

    // Fallback if onload doesn't fire (some browsers)
    setTimeout(() => {
        try {
            printWindow.print();
        } catch {
            // Already printed via onload
        }
    }, 1500);
}

export default exportKHLCNT;
