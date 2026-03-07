import React from 'react';
import { TrendingUp, Wallet, Package } from 'lucide-react';
import { formatShortCurrency } from '@/utils/format';

interface KeyMetricsHeaderProps {
    totalInvestment: number;
    disbursedAmount: number;
    physicalProgress: number;
}

export const KeyMetricsHeader: React.FC<KeyMetricsHeaderProps> = ({
    totalInvestment,
    disbursedAmount,
    physicalProgress
}) => {
    const formatCurrency = formatShortCurrency;

    const disbursementPercent = totalInvestment > 0
        ? ((disbursedAmount / totalInvestment) * 100).toFixed(1)
        : '0';

    const metrics = [
        {
            label: 'Tổng mức đầu tư',
            value: formatCurrency(totalInvestment),
            icon: TrendingUp,
            gradient: 'from-blue-500 to-indigo-600',
            bgGradient: 'from-blue-50 to-indigo-50',
            iconBg: 'bg-blue-100 text-blue-600'
        },
        {
            label: 'Đã giải ngân',
            value: formatCurrency(disbursedAmount),
            subValue: `${disbursementPercent}%`,
            icon: Wallet,
            gradient: 'from-emerald-500 to-teal-600',
            bgGradient: 'from-emerald-50 to-teal-50',
            iconBg: 'bg-emerald-100 text-emerald-600'
        },
        {
            label: 'Tiến độ khối lượng',
            value: `${physicalProgress}%`,
            icon: Package,
            gradient: 'from-violet-500 to-purple-600',
            bgGradient: 'from-violet-50 to-purple-50',
            iconBg: 'bg-violet-100 text-violet-600'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {metrics.map((metric, idx) => (
                <div
                    key={idx}
                    className={`relative overflow-hidden bg-gradient-to-br ${metric.gradient} rounded-2xl p-5 shadow-xl ring-1 ring-white/10 hover:scale-[1.02] hover:shadow-2xl transition-all duration-200 cursor-default`}
                >
                    {/* Icon watermark */}
                    <metric.icon className="absolute -right-3 -top-3 w-20 h-20 text-white opacity-[0.12]" />
                    <div className="relative z-10 flex items-start justify-between">
                        <div className="flex-1">
                            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-white/90 mb-1">
                                {metric.label}
                            </p>
                            <p className="text-2xl font-black tracking-tight text-white drop-shadow-sm tabular-nums">
                                {metric.value}
                            </p>
                            {metric.subValue && (
                                <p className="text-sm text-white/80 mt-1">
                                    {metric.subValue} tổng mức
                                </p>
                            )}
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                            <metric.icon className="w-5 h-5 text-white" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
