// Smart Summary — Tóm tắt thông minh cho Dashboard và Project Detail
// Cache kết quả để tiết kiệm API calls

import { generateSummary } from '../aiService';
import { DashboardService } from '../DashboardService';
import { ProjectService } from '../ProjectService';

interface CachedSummary {
    text: string;
    timestamp: number;
}

const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const summaryCache = new Map<string, CachedSummary>();

function getCached(key: string): string | null {
    const cached = summaryCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.text;
    }
    summaryCache.delete(key);
    return null;
}

function setCache(key: string, text: string) {
    summaryCache.set(key, { text, timestamp: Date.now() });
}

/**
 * Tóm tắt dashboard tổng quan
 */
export async function getDashboardSummary(forceRefresh = false): Promise<string> {
    const cacheKey = 'dashboard';
    if (!forceRefresh) {
        const cached = getCached(cacheKey);
        if (cached) return cached;
    }

    try {
        const [metrics, risks, deadlines, statusDist] = await Promise.all([
            DashboardService.getMetrics(),
            DashboardService.getRisks(),
            DashboardService.getDeadlines(),
            DashboardService.getProjectStatusDistribution(),
        ]);

        const data = {
            metrics,
            riskCount: risks.length,
            topRisks: risks.slice(0, 3),
            upcomingDeadlines: deadlines.slice(0, 5),
            statusDistribution: statusDist,
            currentDate: new Date().toISOString(),
        };

        const summary = await generateSummary(data);
        setCache(cacheKey, summary);
        return summary;
    } catch (error) {
        console.error('Error generating dashboard summary:', error);
        return '⚠️ Không thể tạo tóm tắt. Vui lòng thử lại sau.';
    }
}

/**
 * Tóm tắt 1 dự án
 */
export async function getProjectSummary(projectId: string, forceRefresh = false): Promise<string> {
    const cacheKey = `project-${projectId}`;
    if (!forceRefresh) {
        const cached = getCached(cacheKey);
        if (cached) return cached;
    }

    try {
        const project = await ProjectService.getById(projectId);
        if (!project) return '❌ Không tìm thấy dự án';

        let capitalInfo;
        try {
            capitalInfo = await ProjectService.getCapitalInfo(projectId);
        } catch { /* ignore */ }

        const data = {
            project,
            capitalInfo,
            currentDate: new Date().toISOString(),
        };

        const summary = await generateSummary(data);
        setCache(cacheKey, summary);
        return summary;
    } catch (error) {
        console.error('Error generating project summary:', error);
        return '⚠️ Không thể tạo tóm tắt dự án. Vui lòng thử lại sau.';
    }
}

/**
 * Xóa cache
 */
export function clearSummaryCache() {
    summaryCache.clear();
}
