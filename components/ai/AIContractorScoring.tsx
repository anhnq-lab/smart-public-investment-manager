import React, { useState, useCallback } from 'react';
import { Award, RefreshCw, Star, AlertTriangle, ChevronRight, TrendingUp, Users } from 'lucide-react';
import { rankAllContractors, ContractorRanking, ContractorScore } from '../../services/ai/contractorScoring';

export const AIContractorScoring: React.FC<{ className?: string }> = ({ className = '' }) => {
    const [ranking, setRanking] = useState<ContractorRanking | null>(null);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState<string | null>(null);

    const loadRanking = useCallback(async () => {
        setLoading(true);
        try {
            const result = await rankAllContractors();
            setRanking(result);
        } catch (e) {
            console.error('Ranking error:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    const riskColors = {
        low: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
        medium: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
        high: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    };

    return (
        <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden ${className}`}>
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                        <Award size={14} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Đánh giá Nhà thầu AI</h3>
                        <p className="text-[10px] text-slate-400">
                            {ranking ? `${ranking.rankings.length} nhà thầu đã phân tích` : 'Nhấn để phân tích'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={loadRanking}
                    disabled={loading}
                    className="text-[11px] px-2.5 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg hover:bg-amber-100 transition-colors flex items-center gap-1"
                >
                    {loading ? <RefreshCw size={12} className="animate-spin" /> : <TrendingUp size={12} />}
                    {loading ? 'Đang phân tích...' : ranking ? 'Cập nhật' : 'Phân tích'}
                </button>
            </div>

            <div className="p-3 space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                {!ranking && !loading && (
                    <div className="text-center py-8 text-slate-400">
                        <Users size={24} className="mx-auto mb-2 opacity-50" />
                        <p className="text-xs">Nhấn "Phân tích" để đánh giá nhà thầu</p>
                    </div>
                )}

                {loading && !ranking && (
                    <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
                        <RefreshCw size={14} className="animate-spin" />
                        <span className="text-xs">Đang đánh giá nhà thầu...</span>
                    </div>
                )}

                {ranking?.rankings.map((score, idx) => (
                    <div
                        key={score.contractorId}
                        className="rounded-lg border border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-600 transition-all cursor-pointer"
                        onClick={() => setExpanded(expanded === score.contractorId ? null : score.contractorId)}
                    >
                        <div className="flex items-center gap-2.5 p-2.5">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${idx < 3 ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                                }`}>
                                {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{score.contractorName}</p>
                                <p className="text-[10px] text-slate-400">{score.contractCount} HĐ • {(score.totalContractValue / 1e9).toFixed(1)} tỷ</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="text-right">
                                    <span className="text-sm font-black text-slate-700 dark:text-slate-200">{score.overallScore}</span>
                                    <span className="text-[9px] text-slate-400">/100</span>
                                </div>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${riskColors[score.riskLevel]}`}>
                                    {score.riskLevel === 'low' ? 'Tốt' : score.riskLevel === 'medium' ? 'TB' : 'Rủi ro'}
                                </span>
                                <ChevronRight size={12} className={`text-slate-400 transition-transform ${expanded === score.contractorId ? 'rotate-90' : ''}`} />
                            </div>
                        </div>

                        {expanded === score.contractorId && (
                            <div className="px-2.5 pb-2.5 border-t border-slate-100 dark:border-slate-700/50 pt-2 space-y-2">
                                {/* Score bars */}
                                {[
                                    { label: 'Tiến độ', value: score.dimensions.deliveryScore },
                                    { label: 'Chất lượng', value: score.dimensions.qualityScore },
                                    { label: 'Tài chính', value: score.dimensions.financialScore },
                                    { label: 'Tuân thủ', value: score.dimensions.complianceScore },
                                    { label: 'Kinh nghiệm', value: score.dimensions.experienceScore },
                                ].map(d => (
                                    <div key={d.label} className="flex items-center gap-2">
                                        <span className="text-[10px] text-slate-500 w-16">{d.label}</span>
                                        <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full ${d.value >= 70 ? 'bg-emerald-500' : d.value >= 45 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${d.value}%` }} />
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 w-8 text-right">{Math.round(d.value)}</span>
                                    </div>
                                ))}
                                {score.highlights.length > 0 && (
                                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400">✅ {score.highlights.join(' • ')}</div>
                                )}
                                {score.concerns.length > 0 && (
                                    <div className="text-[10px] text-red-500 dark:text-red-400">⚠️ {score.concerns.join(' • ')}</div>
                                )}
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">💡 {score.recommendation}</p>
                            </div>
                        )}
                    </div>
                ))}

                {ranking?.aiInsight && (
                    <div className="mt-2 p-2.5 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800/30 text-[11px] text-amber-800 dark:text-amber-300">
                        🤖 {ranking.aiInsight}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIContractorScoring;
