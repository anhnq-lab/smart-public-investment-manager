// Forecasting — Dự báo tiến độ & giải ngân
// Kết hợp tính toán cơ bản + AI phân tích xu hướng

import { forecastProgress, ForecastResult } from '../aiService';
import { ProjectService } from '../ProjectService';
import { CapitalService } from '../CapitalService';

export interface SimpleForecast {
    currentDisbursementRate: number;      // % đã giải ngân
    monthlyAvgRate: number;              // Tốc độ giải ngân TB hàng tháng
    projectedYearEnd: number;            // Dự báo cuối năm (%)
    remainingMonths: number;              // Số tháng còn lại trong năm
    isOnTrack: boolean;                   // Đạt mục tiêu?
}

/**
 * Dự báo đơn giản (tính toán, không dùng AI)
 */
export function calculateSimpleForecast(
    currentRate: number,
    monthsElapsed: number,
    targetRate = 100
): SimpleForecast {
    const currentMonth = new Date().getMonth() + 1; // 1-12
    const remainingMonths = 12 - currentMonth;
    const monthlyAvgRate = monthsElapsed > 0 ? currentRate / monthsElapsed : 0;
    const projectedYearEnd = Math.min(100, currentRate + monthlyAvgRate * remainingMonths);

    return {
        currentDisbursementRate: currentRate,
        monthlyAvgRate: Math.round(monthlyAvgRate * 10) / 10,
        projectedYearEnd: Math.round(projectedYearEnd * 10) / 10,
        remainingMonths,
        isOnTrack: projectedYearEnd >= targetRate * 0.8,
    };
}

/**
 * Dự báo AI đầy đủ cho 1 dự án
 */
export async function forecastProject(projectId: string): Promise<ForecastResult> {
    const project = await ProjectService.getById(projectId);
    if (!project) throw new Error('Không tìm thấy dự án');

    let capitalInfo;
    try {
        capitalInfo = await ProjectService.getCapitalInfo(projectId);
    } catch { /* ignore */ }

    const data = {
        project: {
            ProjectID: project.ProjectID,
            ProjectName: project.ProjectName,
            TotalInvestment: project.TotalInvestment,
            Progress: project.Progress,
            PaymentProgress: project.PaymentProgress,
            PhysicalProgress: project.PhysicalProgress,
            FinancialProgress: project.FinancialProgress,
            StartDate: project.StartDate,
            ExpectedEndDate: project.ExpectedEndDate,
            Status: project.Status,
            GroupCode: project.GroupCode,
        },
        capitalInfo,
        currentDate: new Date().toISOString(),
        currentMonth: new Date().getMonth() + 1,
    };

    return await forecastProgress(data);
}
