import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { getDashboardSummary, getProjectSummary } from '../../services/ai/smartSummary';
import { isAIAvailable } from '../../services/aiService';

interface AISummaryWidgetProps {
    /** If provided, show project-specific summary. Otherwise show dashboard summary. */
    projectId?: string;
    className?: string;
}

export const AISummaryWidget: React.FC<AISummaryWidgetProps> = ({ projectId, className = '' }) => {
    const [summary, setSummary] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const loadSummary = useCallback(async (force = false) => {
        if (!isAIAvailable()) return;
        setLoading(true);
        try {
            const text = projectId
                ? await getProjectSummary(projectId, force)
                : await getDashboardSummary(force);
            setSummary(text);
        } catch (e) {
            console.error('Summary error:', e);
            setSummary('⚠️ Không thể tạo tóm tắt');
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        loadSummary();
    }, [loadSummary]);

    if (!isAIAvailable()) return null;

    return (
        <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-xl border border-blue-100 dark:border-blue-800/30 p-4 ${className}`}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-blue-500" />
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300">Tóm tắt AI</span>
                </div>
                <button
                    onClick={() => loadSummary(true)}
                    disabled={loading}
                    className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800/30 rounded-lg transition-colors"
                    title="Tạo lại"
                >
                    <RefreshCw size={12} className={`text-blue-400 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {loading && !summary && (
                <div className="flex items-center gap-2 py-2">
                    <RefreshCw size={12} className="animate-spin text-blue-400" />
                    <span className="text-xs text-blue-400">Đang phân tích...</span>
                </div>
            )}

            {summary && (
                <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {summary}
                </div>
            )}
        </div>
    );
};

export default AISummaryWidget;
