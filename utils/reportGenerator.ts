// Report Generator Utility - Generates Excel/CSV exports for reports
import { mockProjects, mockPayments, mockContracts, mockBiddingPackages, mockTasks } from '../mockData';
import { ProjectStatus, PaymentStatus, TaskStatus } from '../types';

interface ReportData {
    filename: string;
    content: string;
    type: 'csv' | 'json';
}

// Format number as VND currency string
const formatVND = (value: number): string => {
    return new Intl.NumberFormat('vi-VN').format(value);
};

// Generate monitoring report (BC-01)
export const generateMonitoringReport = (): ReportData => {
    const headers = [
        'STT',
        'Mã dự án',
        'Tên dự án',
        'Nhóm',
        'Tổng mức đầu tư (VND)',
        'Tiến độ (%)',
        'Trạng thái',
        'Chủ đầu tư'
    ];

    const rows = mockProjects.map((project, idx) => [
        idx + 1,
        project.ProjectID,
        `"${project.ProjectName}"`, // Quote for CSV safety
        project.GroupCode,
        formatVND(project.TotalInvestment),
        project.Progress || 0,
        project.Status === ProjectStatus.Preparation ? 'Chuẩn bị' :
            project.Status === ProjectStatus.Execution ? 'Đang thực hiện' :
                project.Status === ProjectStatus.Finished ? 'Hoàn thành' : 'Vận hành',
        `"${project.InvestorName || 'Chưa cập nhật'}"`
    ]);

    const csv = [
        '# BÁO CÁO GIÁM SÁT ĐẦU TƯ CÔNG',
        `# Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`,
        '',
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    return {
        filename: `BC01_GiamSatDauTu_${new Date().toISOString().split('T')[0]}.csv`,
        content: csv,
        type: 'csv'
    };
};

// Generate disbursement report
export const generateDisbursementReport = (): ReportData => {
    const headers = [
        'STT',
        'Mã thanh toán',
        'Số hợp đồng',
        'Đợt',
        'Loại',
        'Số tiền (VND)',
        'Mã giao dịch KB',
        'Trạng thái'
    ];

    const rows = mockPayments.map((payment, idx) => [
        idx + 1,
        payment.PaymentID,
        payment.ContractID,
        payment.BatchNo,
        payment.Type === 'Advance' ? 'Tạm ứng' : 'Khối lượng',
        formatVND(payment.Amount),
        payment.TreasuryRef,
        payment.Status === PaymentStatus.Transferred ? 'Đã chuyển' : 'Chờ duyệt'
    ]);

    // Summary
    const totalAmount = mockPayments.reduce((sum, p) => sum + p.Amount, 0);
    const transferredAmount = mockPayments
        .filter(p => p.Status === PaymentStatus.Transferred)
        .reduce((sum, p) => sum + p.Amount, 0);

    const csv = [
        '# BÁO CÁO TÌNH HÌNH GIẢI NGÂN',
        `# Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`,
        '',
        headers.join(','),
        ...rows.map(row => row.join(',')),
        '',
        `# TỔNG KẾT`,
        `Tổng giải ngân,,,,,${formatVND(totalAmount)},,`,
        `Đã chuyển tiền,,,,,${formatVND(transferredAmount)},,`,
        `Đang chờ duyệt,,,,,${formatVND(totalAmount - transferredAmount)},,`
    ].join('\n');

    return {
        filename: `BC02_GiaiNgan_${new Date().toISOString().split('T')[0]}.csv`,
        content: csv,
        type: 'csv'
    };
};

// Generate issues report
export const generateIssuesReport = (): ReportData => {
    // Get tasks that are overdue or at risk
    const now = new Date();
    const riskyTasks = mockTasks.filter(task => {
        if (task.Status === TaskStatus.Done) return false;
        const dueDate = new Date(task.DueDate);
        return dueDate < now; // Overdue
    });

    const headers = [
        'STT',
        'Mã công việc',
        'Tiêu đề',
        'Mã dự án',
        'Ngày đến hạn',
        'Trạng thái',
        'Mức ưu tiên'
    ];

    const rows = riskyTasks.map((task, idx) => [
        idx + 1,
        task.TaskID,
        `"${task.Title}"`,
        task.ProjectID,
        task.DueDate,
        task.Status,
        task.Priority
    ]);

    const csv = [
        '# BÁO CÁO XỬ LÝ VƯỚNG MẮC',
        `# Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`,
        `# Tổng số vấn đề: ${riskyTasks.length}`,
        '',
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    return {
        filename: `BC03_VuongMac_${new Date().toISOString().split('T')[0]}.csv`,
        content: csv,
        type: 'csv'
    };
};

// Generate risk analysis report
export const generateRiskReport = (): ReportData => {
    const riskCategories = [
        {
            category: 'Tiến độ',
            items: mockProjects.filter(p => (p.Progress || 0) < 50 && p.Status === ProjectStatus.Execution)
                .map(p => ({ name: p.ProjectName, risk: 'Tiến độ chậm', progress: p.Progress }))
        },
        {
            category: 'Tài chính',
            items: mockProjects.filter(p => (p.PaymentProgress || 0) < 30 && p.Status === ProjectStatus.Execution)
                .map(p => ({ name: p.ProjectName, risk: 'Giải ngân chậm', progress: p.PaymentProgress }))
        }
    ];

    const data = {
        reportName: 'Báo cáo phân tích rủi ro',
        generatedAt: new Date().toISOString(),
        categories: riskCategories
    };

    return {
        filename: `BC04_PhanTichRuiRo_${new Date().toISOString().split('T')[0]}.json`,
        content: JSON.stringify(data, null, 2),
        type: 'json'
    };
};

// Download file helper
export const downloadReport = (report: ReportData): void => {
    const mimeType = report.type === 'csv' ? 'text/csv;charset=utf-8;' : 'application/json';

    // Add BOM for Excel UTF-8 compatibility
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + report.content], { type: mimeType });

    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', report.filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
};

// Export all reports
export const exportAllReports = () => {
    return {
        monitoring: generateMonitoringReport,
        disbursement: generateDisbursementReport,
        issues: generateIssuesReport,
        risk: generateRiskReport,
        download: downloadReport
    };
};
