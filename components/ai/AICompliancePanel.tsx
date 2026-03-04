import React, { useState, useEffect, useCallback } from 'react';
import {
    Shield, CheckCircle2, AlertTriangle, AlertCircle, Clock,
    ChevronRight, RefreshCw, Sparkles, ExternalLink
} from 'lucide-react';
import { checkProjectCompliance, FullComplianceReport, EnrichedComplianceCheck } from '../../services/ai/complianceChecker';

interface AICompliancePanelProps {
    projectId: string;
    className?: string;
}

const statusConfig = {
    passed: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', icon: CheckCircle2, iconClass: 'text-emerald-600 dark:text-emerald-400', label: 'Đạt' },
    warning: { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', icon: AlertCircle, iconClass: 'text-amber-600 dark:text-amber-400', label: 'Cảnh báo' },
    violation: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', icon: AlertTriangle, iconClass: 'text-red-600 dark:text-red-400', label: 'Vi phạm' },
    pending: { bg: 'bg-slate-50 dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-700', icon: Clock, iconClass: 'text-slate-400', label: 'Chờ xác nhận' },
};

export const AICompliancePanel: React.FC<AICompliancePanelProps> = ({ projectId, className = '' }) => {
    const [report, setReport] = useState<FullComplianceReport | null>(null);
    const [loading, setLoading] = useState(false);
    const [expandedCheck, setExpandedCheck] = useState<string | null>(null);

    const loadCompliance = useCallback(async () => {
        setLoading(true);
        try {
            const result = await checkProjectCompliance(projectId);
            setReport(result);
        } catch (e) {
            console.error('Compliance check error:', e);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        loadCompliance();
    }, [loadCompliance]);

    const passedCount = report?.checks.filter(c => c.status === 'passed').length ?? 0;
    const totalChecks = report?.checks.length ?? 0;

    return (
        <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden ${className}`}>
            {/* Header */}
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                        <Shield size={14} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Tuân thủ pháp lý AI</h3>
                        <p className="text-[10px] text-slate-400">
                            {totalChecks > 0 ? `${passedCount}/${totalChecks} đạt yêu cầu` : 'Đang kiểm tra...'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={loadCompliance}
                    disabled={loading}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                    <RefreshCw size={14} className={`text-slate-400 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Content */}
            <div className="p-3 space-y-2">
                {loading && !report && (
                    <div className="flex items-center justify-center py-6 gap-2 text-slate-400">
                        <RefreshCw size={14} className="animate-spin" />
                        <span className="text-xs">Đang kiểm tra tuân thủ...</span>
                    </div>
                )}

                {report && report.checks.map(check => {
                    const config = statusConfig[check.status];
                    const Icon = config.icon;
                    const isExpanded = expandedCheck === check.id;

                    return (
                        <div
                            key={check.id}
                            className={`rounded-lg border ${config.border} ${config.bg} transition-all cursor-pointer`}
                            onClick={() => setExpandedCheck(isExpanded ? null : check.id)}
                        >
                            <div className="flex items-center gap-2.5 p-2.5">
                                <Icon size={14} className={config.iconClass} />
                                <div className="flex-1 min-w-0">
                                    <span className="text-xs font-medium text-slate-700 dark:text-slate-200 block truncate">
                                        {check.requirement}
                                    </span>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block truncate">
                                        {check.regulation} — {check.article}
                                    </span>
                                </div>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${check.status === 'passed' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                                        : check.status === 'violation' ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                                            : check.status === 'warning' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                                                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                                    }`}>
                                    {config.label}
                                </span>
                                <ChevronRight size={12} className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                            </div>

                            {isExpanded && (
                                <div className="px-2.5 pb-2.5 border-t border-slate-200/50 dark:border-slate-700/50">
                                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-2">{check.detail}</p>
                                    {check.recommendation && (
                                        <div className="mt-2 p-2 bg-white/60 dark:bg-slate-700/30 rounded text-[11px] text-slate-600 dark:text-slate-300">
                                            <span className="font-medium">💡 Khuyến nghị:</span> {check.recommendation}
                                        </div>
                                    )}
                                    <span className="text-[9px] text-slate-400 mt-1 block">
                                        Nguồn: {check.source === 'ai' ? '🤖 Phân tích AI' : '📋 Quy tắc tự động'}
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Score */}
                {report && (
                    <div className="mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                            <span>Điểm tuân thủ</span>
                            <span className="font-bold text-slate-600 dark:text-slate-300">{report.complianceScore}/100</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${report.complianceScore >= 80 ? 'bg-emerald-500'
                                        : report.complianceScore >= 50 ? 'bg-amber-500'
                                            : 'bg-red-500'
                                    }`}
                                style={{ width: `${report.complianceScore}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AICompliancePanel;
