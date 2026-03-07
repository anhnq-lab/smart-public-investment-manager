import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export type StatCardColor = 'blue' | 'emerald' | 'amber' | 'rose' | 'violet';

interface StatCardProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    color?: StatCardColor;
    /** e.g. "+12%" or "2 đang chạy" */
    sublabel?: string;
    trend?: 'up' | 'down';
    className?: string;
    onClick?: () => void;
}

const GRADIENT_MAP: Record<StatCardColor, { gradient: string; ring: string }> = {
    blue: { gradient: 'from-blue-500 via-blue-600 to-indigo-700', ring: 'ring-blue-400/30' },
    emerald: { gradient: 'from-emerald-500 via-emerald-600 to-teal-700', ring: 'ring-emerald-400/30' },
    amber: { gradient: 'from-amber-500 via-orange-500 to-red-500', ring: 'ring-amber-400/30' },
    rose: { gradient: 'from-red-500 via-red-600 to-rose-700', ring: 'ring-red-400/30' },
    violet: { gradient: 'from-violet-500 via-violet-600 to-purple-700', ring: 'ring-violet-400/30' },
};

/**
 * Reusable Stat Card — bold gradient design matching TaskList/PaymentList.
 */
export const StatCard: React.FC<StatCardProps> = ({
    label,
    value,
    icon,
    color = 'blue',
    sublabel,
    trend,
    className = '',
    onClick,
}) => {
    const { gradient, ring } = GRADIENT_MAP[color] || GRADIENT_MAP.blue;

    return (
        <div
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} text-white p-5 shadow-xl ring-1 ${ring} transition-transform hover:scale-[1.02] hover:shadow-2xl duration-300 flex items-center gap-4 ${onClick ? 'cursor-pointer' : ''} ${className}`}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
        >
            {/* Icon */}
            <div className="p-3 rounded-xl bg-white/20 shadow-sm shrink-0">
                {icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-extrabold text-white/90 uppercase tracking-[0.15em]">{label}</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl font-black text-white drop-shadow-sm">{value}</span>
                    {sublabel && (
                        <span className="text-[10px] text-white/70 truncate font-medium">
                            {sublabel}
                        </span>
                    )}
                </div>
            </div>

            {/* Trend indicator */}
            {trend && (
                <div className={`p-1.5 rounded-lg bg-white/20 shrink-0`}>
                    {trend === 'up'
                        ? <TrendingUp className="w-4 h-4 text-white" />
                        : <TrendingDown className="w-4 h-4 text-white" />
                    }
                </div>
            )}
        </div>
    );
};
