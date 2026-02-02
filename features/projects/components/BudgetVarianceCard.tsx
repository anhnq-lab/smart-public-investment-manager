import React from 'react';
import { TrendingUp, TrendingDown, Minus, DollarSign, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/utils/format';

interface BudgetVarianceProps {
    totalInvestment: number;
    disbursedAmount: number;
    plannedDisbursement?: number;
    previousMonthDisbursed?: number;
}

export const BudgetVarianceCard: React.FC<BudgetVarianceProps> = ({
    totalInvestment,
    disbursedAmount,
    plannedDisbursement,
    previousMonthDisbursed
}) => {
    const remaining = totalInvestment - disbursedAmount;
    const disbursedPercent = totalInvestment > 0 ? (disbursedAmount / totalInvestment) * 100 : 0;
    const plannedPercent = plannedDisbursement && totalInvestment > 0
        ? (plannedDisbursement / totalInvestment) * 100
        : null;

    // Calculate variance
    const variance = plannedDisbursement ? disbursedAmount - plannedDisbursement : null;
    const variancePercent = plannedDisbursement && plannedDisbursement > 0
        ? ((disbursedAmount - plannedDisbursement) / plannedDisbursement) * 100
        : null;

    // Calculate month-over-month change
    const momChange = previousMonthDisbursed !== undefined
        ? disbursedAmount - previousMonthDisbursed
        : null;

    const getVarianceColor = () => {
        if (variance === null) return 'text-gray-500';
        if (variance >= 0) return 'text-emerald-600';
        if (variance < 0 && Math.abs(variance) / (plannedDisbursement || 1) > 0.1) return 'text-red-600';
        return 'text-amber-600';
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-5 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-blue-600" />
                        <h3 className="font-bold text-gray-800 text-xs uppercase">Phân tích ngân sách</h3>
                    </div>
                    {momChange !== null && (
                        <div className={`flex items-center gap-1 text-xs font-bold ${momChange > 0 ? 'text-emerald-600' : momChange < 0 ? 'text-red-600' : 'text-gray-500'
                            }`}>
                            {momChange > 0 ? <TrendingUp className="w-3 h-3" /> :
                                momChange < 0 ? <TrendingDown className="w-3 h-3" /> :
                                    <Minus className="w-3 h-3" />}
                            {momChange > 0 ? '+' : ''}{formatCurrency(momChange)} so với tháng trước
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
                {/* Main Figures */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Tổng mức ĐT</p>
                        <p className="text-lg font-black text-gray-800">{formatCurrency(totalInvestment)}</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-xl">
                        <p className="text-[10px] text-blue-600 uppercase font-bold mb-1">Đã giải ngân</p>
                        <p className="text-lg font-black text-blue-700">{formatCurrency(disbursedAmount)}</p>
                        <p className="text-[10px] text-blue-500">{disbursedPercent.toFixed(1)}%</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Còn lại</p>
                        <p className="text-lg font-black text-gray-700">{formatCurrency(remaining)}</p>
                        <p className="text-[10px] text-gray-500">{(100 - disbursedPercent).toFixed(1)}%</p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Tiến độ giải ngân</span>
                        <span className="font-bold text-gray-800">{disbursedPercent.toFixed(1)}%</span>
                    </div>
                    <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
                        {/* Actual */}
                        <div
                            className="absolute h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                            style={{ width: `${Math.min(disbursedPercent, 100)}%` }}
                        />
                        {/* Planned marker */}
                        {plannedPercent !== null && (
                            <div
                                className="absolute top-0 bottom-0 w-0.5 bg-emerald-500"
                                style={{ left: `${Math.min(plannedPercent, 100)}%` }}
                                title={`Kế hoạch: ${plannedPercent.toFixed(1)}%`}
                            >
                                <div className="absolute -top-1 -translate-x-1/2 w-2 h-2 bg-emerald-500 rounded-full" />
                            </div>
                        )}
                    </div>
                    {plannedPercent !== null && (
                        <div className="flex items-center gap-4 text-[10px]">
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-blue-500 rounded"></span>
                                Thực tế
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-emerald-500 rounded"></span>
                                Kế hoạch ({plannedPercent.toFixed(1)}%)
                            </span>
                        </div>
                    )}
                </div>

                {/* Variance Section */}
                {variance !== null && (
                    <div className={`flex items-center justify-between p-3 rounded-xl ${variance >= 0 ? 'bg-emerald-50 border border-emerald-100' :
                            Math.abs(variance) / (plannedDisbursement || 1) > 0.1 ? 'bg-red-50 border border-red-100' :
                                'bg-amber-50 border border-amber-100'
                        }`}>
                        <div className="flex items-center gap-2">
                            {variance < 0 && Math.abs(variance) / (plannedDisbursement || 1) > 0.1 && (
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                            )}
                            <div>
                                <p className="text-xs text-gray-600">Chênh lệch so với kế hoạch</p>
                                <p className={`text-sm font-bold ${getVarianceColor()}`}>
                                    {variance >= 0 ? '+' : ''}{formatCurrency(variance)}
                                    {variancePercent !== null && (
                                        <span className="ml-1 text-xs font-normal">
                                            ({variancePercent >= 0 ? '+' : ''}{variancePercent.toFixed(1)}%)
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${variance >= 0 ? 'bg-emerald-100' :
                                Math.abs(variance) / (plannedDisbursement || 1) > 0.1 ? 'bg-red-100' :
                                    'bg-amber-100'
                            }`}>
                            {variance >= 0 ? (
                                <TrendingUp className="w-5 h-5 text-emerald-600" />
                            ) : (
                                <TrendingDown className={`w-5 h-5 ${Math.abs(variance) / (plannedDisbursement || 1) > 0.1 ? 'text-red-600' : 'text-amber-600'
                                    }`} />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BudgetVarianceCard;
