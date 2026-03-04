import React, { useState, useCallback } from 'react';
import { BarChart3, RefreshCw, AlertTriangle, CheckCircle2, Target, Zap } from 'lucide-react';
import { analyzeResourceAllocation, ResourceOptimizationResult } from '../../services/ai/resourceOptimizer';

export const AIResourceOptimizer: React.FC<{ className?: string }> = ({ className = '' }) => {
    const [result, setResult] = useState<ResourceOptimizationResult | null>(null);
    const [loading, setLoading] = useState(false);

    const loadAnalysis = useCallback(async () => {
        setLoading(true);
        try {
            const data = await analyzeResourceAllocation();
            setResult(data);
        } catch (e) {
            console.error('Resource analysis error:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    return (
        <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden ${className}`}>
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                        <BarChart3 size={14} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Tối ưu Nguồn lực AI</h3>
                        <p className="text-[10px] text-slate-400">
                            {result ? `${result.totalActiveProjects} dự án đang thực hiện` : 'Nhấn để phân tích'}
                        </p>
                    </div>
                </div>
                <button onClick={loadAnalysis} disabled={loading}
                    className="text-[11px] px-2.5 py-1.5 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400 rounded-lg hover:bg-cyan-100 transition-colors flex items-center gap-1">
                    {loading ? <RefreshCw size={12} className="animate-spin" /> : <Zap size={12} />}
                    {loading ? 'Phân tích...' : result ? 'Cập nhật' : 'Phân tích'}
                </button>
            </div>

            <div className="p-3 space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                {!result && !loading && (
                    <div className="text-center py-8 text-slate-400">
                        <Target size={24} className="mx-auto mb-2 opacity-50" />
                        <p className="text-xs">Nhấn "Phân tích" để đánh giá nguồn lực</p>
                    </div>
                )}

                {loading && !result && (
                    <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
                        <RefreshCw size={14} className="animate-spin" />
                        <span className="text-xs">Đang phân tích nguồn lực...</span>
                    </div>
                )}

                {/* Summary KPIs */}
                {result && (
                    <div className="grid grid-cols-3 gap-2">
                        <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-lg p-2 text-center">
                            <p className="text-lg font-black text-cyan-700 dark:text-cyan-300">{result.totalActiveProjects}</p>
                            <p className="text-[9px] text-cyan-500">DA hoạt động</p>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2 text-center">
                            <p className="text-lg font-black text-red-700 dark:text-red-300">{result.overloadedProjects.length}</p>
                            <p className="text-[9px] text-red-500">Quá tải</p>
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2 text-center">
                            <p className="text-lg font-black text-amber-700 dark:text-amber-300">{result.underutilizedProjects.length}</p>
                            <p className="text-[9px] text-amber-500">Chưa khai thác</p>
                        </div>
                    </div>
                )}

                {/* Project allocations */}
                {result?.allocations.map(alloc => (
                    <div key={alloc.projectId} className="rounded-lg border border-slate-200 dark:border-slate-700 p-2.5">
                        <div className="flex items-center justify-between mb-1.5">
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate flex-1">{alloc.projectName}</p>
                            <span className="text-[10px] font-bold text-slate-500">{alloc.utilizationRate}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-1.5">
                            <div className={`h-full rounded-full ${alloc.utilizationRate >= 70 ? 'bg-emerald-500' : alloc.utilizationRate >= 30 ? 'bg-cyan-500' : 'bg-amber-500'
                                }`} style={{ width: `${Math.min(100, alloc.utilizationRate)}%` }} />
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400">
                            <span>{alloc.activeTaskCount} tasks</span>
                            <span>{(alloc.totalBudget / 1e9).toFixed(1)} tỷ</span>
                        </div>
                        {alloc.bottlenecks.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                                {alloc.bottlenecks.map((b, i) => (
                                    <span key={i} className="text-[9px] px-1.5 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded">
                                        ⚠️ {b}
                                    </span>
                                ))}
                            </div>
                        )}
                        {alloc.suggestions.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                                {alloc.suggestions.map((s, i) => (
                                    <span key={i} className="text-[9px] px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded">
                                        💡 {s}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                ))}

                {/* Recommendations */}
                {result?.recommendations.map((rec, i) => (
                    <div key={i} className="text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-1.5 px-1">
                        <CheckCircle2 size={12} className="text-cyan-500 mt-0.5 shrink-0" />
                        {rec}
                    </div>
                ))}

                {/* AI Analysis */}
                {result?.aiAnalysis && (
                    <div className="p-2.5 bg-cyan-50 dark:bg-cyan-900/10 rounded-lg border border-cyan-200 dark:border-cyan-800/30 text-[11px] text-cyan-800 dark:text-cyan-300">
                        🤖 {result.aiAnalysis}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIResourceOptimizer;
