import React, { useState, useCallback } from 'react';
import { ScanSearch, RefreshCw, AlertTriangle, AlertCircle, Info, ChevronRight } from 'lucide-react';
import { scanAllAnomalies, AnomalyReport, Anomaly } from '../../services/ai/anomalyDetector';

const levelConfig = {
    critical: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', icon: AlertTriangle, iconClass: 'text-red-600', badge: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300', label: 'Nghiêm trọng' },
    warning: { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', icon: AlertCircle, iconClass: 'text-amber-600', badge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300', label: 'Cảnh báo' },
    info: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', icon: Info, iconClass: 'text-blue-600', badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300', label: 'Lưu ý' },
};

export const AIAnomalyDetector: React.FC<{ className?: string }> = ({ className = '' }) => {
    const [report, setReport] = useState<AnomalyReport | null>(null);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState<string | null>(null);

    const loadScan = useCallback(async () => {
        setLoading(true);
        try {
            const data = await scanAllAnomalies();
            setReport(data);
        } catch (e) {
            console.error('Anomaly scan error:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    return (
        <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden ${className}`}>
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                        <ScanSearch size={14} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Phát hiện Bất thường AI</h3>
                        <p className="text-[10px] text-slate-400">
                            {report ? `${report.anomalies.length} bất thường (${report.totalChecked} DA)` : 'Nhấn để quét'}
                        </p>
                    </div>
                </div>
                <button onClick={loadScan} disabled={loading}
                    className="text-[11px] px-2.5 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1">
                    {loading ? <RefreshCw size={12} className="animate-spin" /> : <ScanSearch size={12} />}
                    {loading ? 'Đang quét...' : report ? 'Quét lại' : 'Quét toàn bộ'}
                </button>
            </div>

            <div className="p-3 space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
                {!report && !loading && (
                    <div className="text-center py-8 text-slate-400">
                        <ScanSearch size={24} className="mx-auto mb-2 opacity-50" />
                        <p className="text-xs">Nhấn "Quét toàn bộ" để phát hiện bất thường</p>
                    </div>
                )}

                {loading && !report && (
                    <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
                        <RefreshCw size={14} className="animate-spin" />
                        <span className="text-xs">Đang quét bất thường tài chính & tiến độ...</span>
                    </div>
                )}

                {/* Summary */}
                {report && (
                    <div className="grid grid-cols-3 gap-2 mb-1">
                        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2 text-center">
                            <p className="text-lg font-black text-red-700 dark:text-red-300">{report.criticalCount}</p>
                            <p className="text-[9px] text-red-500">Nghiêm trọng</p>
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2 text-center">
                            <p className="text-lg font-black text-amber-700 dark:text-amber-300">{report.warningCount}</p>
                            <p className="text-[9px] text-amber-500">Cảnh báo</p>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 text-center">
                            <p className="text-lg font-black text-blue-700 dark:text-blue-300">{report.infoCount}</p>
                            <p className="text-[9px] text-blue-500">Lưu ý</p>
                        </div>
                    </div>
                )}

                {/* Anomaly list */}
                {report?.anomalies.map(anomaly => {
                    const config = levelConfig[anomaly.level];
                    const Icon = config.icon;
                    const isExpanded = expanded === anomaly.id;

                    return (
                        <div
                            key={anomaly.id}
                            className={`rounded-lg border ${config.border} ${config.bg} transition-all cursor-pointer`}
                            onClick={() => setExpanded(isExpanded ? null : anomaly.id)}
                        >
                            <div className="flex items-center gap-2.5 p-2.5">
                                <Icon size={14} className={config.iconClass} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{anomaly.title}</p>
                                    <p className="text-[10px] text-slate-400 truncate">{anomaly.projectName}</p>
                                </div>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${config.badge}`}>
                                    {config.label}
                                </span>
                                <ChevronRight size={12} className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                            </div>

                            {isExpanded && (
                                <div className="px-2.5 pb-2.5 border-t border-slate-200/50 dark:border-slate-700/50 pt-2 space-y-1.5">
                                    <p className="text-[11px] text-slate-600 dark:text-slate-300">{anomaly.description}</p>
                                    {anomaly.expectedValue && (
                                        <div className="flex gap-4 text-[10px]">
                                            <span className="text-slate-400">Kỳ vọng: <b className="text-slate-600 dark:text-slate-300">{anomaly.expectedValue}</b></span>
                                            <span className="text-slate-400">Thực tế: <b className="text-red-600 dark:text-red-400">{anomaly.actualValue}</b></span>
                                        </div>
                                    )}
                                    {anomaly.suggestion && (
                                        <div className="p-1.5 bg-white/60 dark:bg-slate-700/30 rounded text-[10px] text-slate-600 dark:text-slate-300">
                                            💡 {anomaly.suggestion}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}

                {report && report.anomalies.length === 0 && (
                    <div className="text-center py-6">
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">✅ Không phát hiện bất thường</p>
                    </div>
                )}

                {/* AI Summary */}
                {report?.aiSummary && (
                    <div className="p-2.5 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800/30 text-[11px] text-red-800 dark:text-red-300">
                        🤖 {report.aiSummary}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIAnomalyDetector;
