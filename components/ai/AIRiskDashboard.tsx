import React, { useState, useEffect, useCallback } from 'react';
import {
    AlertTriangle, Shield, TrendingDown, Clock, FileWarning,
    CheckCircle2, RefreshCw, ChevronRight, Sparkles, AlertCircle,
    DollarSign, Users
} from 'lucide-react';
import { analyzeAllProjectsRisks, FullRiskReport, EnrichedRiskItem } from '../../services/ai/riskAnalyzer';

const levelConfig = {
    critical: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800',
        icon: 'text-red-600 dark:text-red-400',
        badge: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
        label: 'Nghiêm trọng',
    },
    warning: {
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        border: 'border-amber-200 dark:border-amber-800',
        icon: 'text-amber-600 dark:text-amber-400',
        badge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
        label: 'Cảnh báo',
    },
    info: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800',
        icon: 'text-blue-600 dark:text-blue-400',
        badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
        label: 'Thông tin',
    },
};

const categoryIcons: Record<string, React.ReactNode> = {
    budget: <DollarSign size={14} />,
    schedule: <Clock size={14} />,
    legal: <Shield size={14} />,
    quality: <CheckCircle2 size={14} />,
    resource: <Users size={14} />,
};

export const AIRiskDashboard: React.FC = () => {
    const [report, setReport] = useState<FullRiskReport | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedRisk, setExpandedRisk] = useState<string | null>(null);

    const loadRisks = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await analyzeAllProjectsRisks();
            setReport(result);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Lỗi phân tích rủi ro');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadRisks();
    }, [loadRisks]);

    const criticalCount = report?.risks.filter(r => r.level === 'critical').length ?? 0;
    const warningCount = report?.risks.filter(r => r.level === 'warning').length ?? 0;

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-red-500 flex items-center justify-center">
                        <Sparkles size={14} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Cảnh báo AI</h3>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">Phân tích rủi ro tự động</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {criticalCount > 0 && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">
                            {criticalCount} nghiêm trọng
                        </span>
                    )}
                    {warningCount > 0 && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                            {warningCount} cảnh báo
                        </span>
                    )}
                    <button
                        onClick={loadRisks}
                        disabled={loading}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                        title="Phân tích lại"
                    >
                        <RefreshCw size={14} className={`text-slate-400 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-3">
                {loading && !report && (
                    <div className="flex items-center justify-center py-8 gap-2 text-slate-400 dark:text-slate-500">
                        <RefreshCw size={16} className="animate-spin" />
                        <span className="text-xs">Đang phân tích rủi ro...</span>
                    </div>
                )}

                {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400 text-xs">
                        <AlertCircle size={14} className="inline mr-1" />
                        {error}
                    </div>
                )}

                {report && report.risks.length === 0 && (
                    <div className="flex flex-col items-center py-6 text-slate-400 dark:text-slate-500">
                        <CheckCircle2 size={32} className="text-emerald-400 mb-2" />
                        <p className="text-xs font-medium">Không phát hiện rủi ro</p>
                        <p className="text-[10px]">Tất cả dự án hoạt động bình thường</p>
                    </div>
                )}

                {report && report.risks.length > 0 && (
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                        {report.risks.map((risk, idx) => {
                            const config = levelConfig[risk.level];
                            const isExpanded = expandedRisk === `${idx}`;
                            return (
                                <div
                                    key={idx}
                                    className={`rounded-lg border ${config.border} ${config.bg} transition-all cursor-pointer`}
                                    onClick={() => setExpandedRisk(isExpanded ? null : `${idx}`)}
                                >
                                    <div className="flex items-start gap-2 p-2.5">
                                        <div className={`${config.icon} mt-0.5`}>
                                            {risk.level === 'critical' ? <AlertTriangle size={14} /> :
                                                risk.level === 'warning' ? <AlertCircle size={14} /> :
                                                    <FileWarning size={14} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                                                    {risk.title}
                                                </span>
                                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${config.badge}`}>
                                                    {config.label}
                                                </span>
                                            </div>
                                            {risk.projectName && (
                                                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                                    {risk.projectName}
                                                </p>
                                            )}
                                            {risk.metric && (
                                                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-mono">
                                                    {risk.metric}
                                                </p>
                                            )}
                                        </div>
                                        <ChevronRight
                                            size={14}
                                            className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                        />
                                    </div>

                                    {isExpanded && (
                                        <div className="px-2.5 pb-2.5 pt-0 border-t border-slate-200/50 dark:border-slate-700/50 mt-1">
                                            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-2">
                                                {risk.description}
                                            </p>
                                            <div className="mt-2 p-2 bg-white/60 dark:bg-slate-700/30 rounded text-[11px] text-slate-600 dark:text-slate-300">
                                                <span className="font-medium">💡 Khuyến nghị:</span> {risk.recommendation}
                                            </div>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-[9px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                                                    {categoryIcons[risk.category] || <Shield size={10} />}
                                                    {risk.source === 'ai' ? 'Phân tích AI' : 'Quy tắc tự động'}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Score bar */}
                {report && (
                    <div className="mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 mb-1">
                            <span>Điểm sức khỏe</span>
                            <span className="font-bold text-slate-600 dark:text-slate-300">{report.overallScore}/100</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${report.overallScore >= 70
                                        ? 'bg-emerald-500'
                                        : report.overallScore >= 40
                                            ? 'bg-amber-500'
                                            : 'bg-red-500'
                                    }`}
                                style={{ width: `${report.overallScore}%` }}
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                            {report.summary}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIRiskDashboard;
