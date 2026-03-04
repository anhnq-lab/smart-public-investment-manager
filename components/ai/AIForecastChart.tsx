import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, RefreshCw, Sparkles, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { forecastProject } from '../../services/ai/forecasting';
import { calculateSimpleForecast } from '../../services/ai/forecasting';
import { ForecastResult } from '../../services/aiService';

interface AIForecastChartProps {
    projectId: string;
    currentDisbursementRate?: number;
    className?: string;
}

export const AIForecastChart: React.FC<AIForecastChartProps> = ({
    projectId,
    currentDisbursementRate = 0,
    className = '',
}) => {
    const [forecast, setForecast] = useState<ForecastResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [useAI, setUseAI] = useState(false);

    // Simple forecast (instant, no AI)
    const currentMonth = new Date().getMonth() + 1;
    const simpleForecast = calculateSimpleForecast(currentDisbursementRate, currentMonth);

    const loadAIForecast = useCallback(async () => {
        setLoading(true);
        try {
            const result = await forecastProject(projectId);
            setForecast(result);
            setUseAI(true);
        } catch (e) {
            console.error('Forecast error:', e);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    // Chart data from AI or simple forecast
    const chartData = forecast?.disbursementForecast?.monthlyProjection || [
        { month: `T${currentMonth}`, projected: currentDisbursementRate, plan: (currentMonth / 12) * 100 },
        { month: 'T12', projected: simpleForecast.projectedYearEnd, plan: 100 },
    ];

    const projectedEnd = useAI
        ? forecast?.disbursementForecast?.projectedYearEnd ?? simpleForecast.projectedYearEnd
        : simpleForecast.projectedYearEnd;

    return (
        <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden ${className}`}>
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                        <TrendingUp size={14} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Dự báo giải ngân</h3>
                        <p className="text-[10px] text-slate-400">
                            {useAI ? '🤖 Phân tích AI' : '📊 Dự báo tuyến tính'}
                        </p>
                    </div>
                </div>
                {!useAI && (
                    <button
                        onClick={loadAIForecast}
                        disabled={loading}
                        className="text-[11px] px-2.5 py-1.5 bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors flex items-center gap-1"
                    >
                        {loading ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
                        {loading ? 'Đang phân tích...' : 'Dự báo AI'}
                    </button>
                )}
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-3 gap-2 p-3">
                <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-2.5 text-center">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">Hiện tại</p>
                    <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{currentDisbursementRate}%</p>
                </div>
                <div className="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-2.5 text-center">
                    <p className="text-[10px] text-violet-500 dark:text-violet-400">Dự báo cuối năm</p>
                    <p className="text-lg font-bold text-violet-700 dark:text-violet-300 flex items-center justify-center gap-1">
                        {projectedEnd.toFixed(0)}%
                        {projectedEnd > currentDisbursementRate
                            ? <ArrowUpRight size={14} className="text-emerald-500" />
                            : <ArrowDownRight size={14} className="text-red-500" />}
                    </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-2.5 text-center">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">TB/tháng</p>
                    <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{simpleForecast.monthlyAvgRate}%</p>
                </div>
            </div>

            {/* Scenarios (if AI forecast available) */}
            {forecast?.disbursementForecast?.scenarios && (
                <div className="px-3 pb-2">
                    <div className="flex items-center gap-3 text-[10px]">
                        <span className="text-emerald-600 dark:text-emerald-400">
                            🟢 Lạc quan: {forecast.disbursementForecast.scenarios.optimistic}%
                        </span>
                        <span className="text-amber-600 dark:text-amber-400">
                            🟡 Cơ sở: {forecast.disbursementForecast.scenarios.baseline}%
                        </span>
                        <span className="text-red-600 dark:text-red-400">
                            🔴 Bi quan: {forecast.disbursementForecast.scenarios.pessimistic}%
                        </span>
                    </div>
                </div>
            )}

            {/* Chart */}
            {chartData.length > 1 && (
                <div className="px-3 pb-3">
                    <ResponsiveContainer width="100%" height={150}>
                        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                            <Tooltip
                                contentStyle={{ fontSize: 11, borderRadius: 8 }}
                                formatter={(value: number) => [`${value.toFixed(1)}%`]}
                            />
                            <Area type="monotone" dataKey="plan" stroke="#94a3b8" strokeDasharray="3 3" fill="none" name="Kế hoạch" />
                            <Area type="monotone" dataKey="projected" stroke="#7c3aed" fill="url(#projGrad)" name="Dự báo" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Completion forecast */}
            {forecast?.completionForecast && (
                <div className="px-3 pb-3 pt-1 border-t border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 text-[11px]">
                        <Calendar size={12} className="text-slate-400" />
                        <span className="text-slate-500 dark:text-slate-400">Dự kiến hoàn thành:</span>
                        <span className="font-medium text-slate-700 dark:text-slate-200">
                            {forecast.completionForecast.projectedDate}
                        </span>
                        {forecast.completionForecast.delayDays > 0 && (
                            <span className="text-red-500 text-[10px]">
                                (chậm {forecast.completionForecast.delayDays} ngày)
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Analysis */}
            {forecast?.analysis && (
                <div className="px-3 pb-3">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        💡 {forecast.analysis}
                    </p>
                </div>
            )}
        </div>
    );
};

export default AIForecastChart;
