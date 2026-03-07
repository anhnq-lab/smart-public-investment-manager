import React from 'react';
import { TrendingUp, Banknote } from 'lucide-react';

interface DualProgressCardProps {
    physicalProgress: number;    // 0-100
    financialProgress: number;   // 0-100
    physicalLabel?: string;
    financialLabel?: string;
}

export const DualProgressCard: React.FC<DualProgressCardProps> = ({
    physicalProgress,
    financialProgress,
    physicalLabel = 'Tiến độ khối lượng',
    financialLabel = 'Tiến độ giải ngân'
}) => {
    return (
        <div className="section-card">
            <div className="section-card-header">
                <div className="flex items-center gap-2">
                    <div className="section-icon"><TrendingUp className="w-3.5 h-3.5" /></div>
                    <span>Tiến độ thực hiện</span>
                </div>
            </div>
            <div className="p-4 space-y-4">
                {/* Physical Progress */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-medium text-gray-700 dark:text-slate-300">{physicalLabel}</span>
                        </div>
                        <span className="text-sm font-bold text-blue-700 tabular-nums">
                            {physicalProgress.toFixed(1)}%
                        </span>
                    </div>
                    <div className="h-2.5 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(0, physicalProgress))}%` }}
                        />
                    </div>
                </div>

                {/* Financial Progress */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Banknote className="w-4 h-4 text-emerald-600" />
                            <span className="text-xs font-medium text-gray-700 dark:text-slate-300">{financialLabel}</span>
                        </div>
                        <span className="text-sm font-bold text-emerald-700 tabular-nums">
                            {financialProgress.toFixed(1)}%
                        </span>
                    </div>
                    <div className="h-2.5 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(0, financialProgress))}%` }}
                        />
                    </div>
                </div>

                {/* Variance indicator */}
                {Math.abs(physicalProgress - financialProgress) > 10 && (
                    <div className={`text-[10px] p-2 rounded-md ${physicalProgress > financialProgress
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                        {physicalProgress > financialProgress
                            ? '⚠️ Khối lượng vượt trước giải ngân'
                            : 'ℹ️ Giải ngân vượt trước khối lượng'
                        }
                    </div>
                )}
            </div>
        </div>
    );
};

export default DualProgressCard;
