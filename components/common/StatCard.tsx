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

/**
 * Reusable Stat Card — consistent styling across Dashboard, Projects, Tasks, CDE.
 * Uses design system `.stat-card` classes from index.css.
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
    return (
        <div
            className={`stat-card stat-card-${color} ${onClick ? 'cursor-pointer' : ''} ${className}`}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
        >
            {/* Icon */}
            <div className="stat-card-icon">
                {icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className="stat-card-label">{label}</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="stat-card-value">{value}</span>
                    {sublabel && (
                        <span className="text-xs text-gray-400 dark:text-slate-500 truncate">
                            {sublabel}
                        </span>
                    )}
                </div>
            </div>

            {/* Trend indicator */}
            {trend && (
                <div className={`stat-card-trend ${trend}`}>
                    {trend === 'up'
                        ? <TrendingUp className="w-4 h-4" />
                        : <TrendingDown className="w-4 h-4" />
                    }
                </div>
            )}
        </div>
    );
};
