import React from 'react';
import { Calendar, AlertCircle, Clock, CheckCircle2, ChevronRight } from 'lucide-react';

export interface KeyDate {
    id: string;
    title: string;
    date: string;
    type: 'deadline' | 'milestone' | 'meeting' | 'report';
    status: 'upcoming' | 'due-soon' | 'overdue' | 'completed';
    description?: string;
}

interface KeyDatesWidgetProps {
    dates: KeyDate[];
    maxItems?: number;
    onViewAll?: () => void;
}

export const KeyDatesWidget: React.FC<KeyDatesWidgetProps> = ({
    dates,
    maxItems = 5,
    onViewAll
}) => {
    const sortedDates = [...dates]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, maxItems);

    const getStatusStyle = (status: KeyDate['status']) => {
        switch (status) {
            case 'overdue':
                return { bg: 'bg-red-50 dark:bg-red-900/30', border: 'border-red-200 dark:border-red-800', text: 'text-red-700 dark:text-red-300', icon: AlertCircle, iconColor: 'text-red-500 dark:text-red-400' };
            case 'due-soon':
                return { bg: 'bg-amber-50 dark:bg-amber-900/30', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-300', icon: Clock, iconColor: 'text-amber-500 dark:text-amber-400' };
            case 'completed':
                return { bg: 'bg-emerald-50 dark:bg-emerald-900/30', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-300', icon: CheckCircle2, iconColor: 'text-emerald-500 dark:text-emerald-400' };
            default:
                return { bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-300', icon: Calendar, iconColor: 'text-blue-500 dark:text-blue-400' };
        }
    };

    const getTypeLabel = (type: KeyDate['type']) => {
        switch (type) {
            case 'deadline': return 'Hạn chót';
            case 'milestone': return 'Mốc tiến độ';
            case 'meeting': return 'Cuộc họp';
            case 'report': return 'Báo cáo';
            default: return type;
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        const formatted = date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        if (diffDays < 0) return { formatted, relative: `Quá hạn ${Math.abs(diffDays)} ngày` };
        if (diffDays === 0) return { formatted, relative: 'Hôm nay' };
        if (diffDays === 1) return { formatted, relative: 'Ngày mai' };
        if (diffDays <= 7) return { formatted, relative: `${diffDays} ngày nữa` };
        return { formatted, relative: null };
    };

    const overdueCount = dates.filter(d => d.status === 'overdue').length;
    const dueSoonCount = dates.filter(d => d.status === 'due-soon').length;

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
            {/* Header */}
            <div className="section-card-header">
                <div className="flex items-center gap-2">
                    <div className="section-icon"><Calendar className="w-3.5 h-3.5" /></div>
                    <span>Các mốc quan trọng</span>
                </div>
                <div className="flex items-center gap-2">
                    {overdueCount > 0 && (
                        <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-[10px] font-bold rounded-full">
                            {overdueCount} quá hạn
                        </span>
                    )}
                    {dueSoonCount > 0 && (
                        <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-[10px] font-bold rounded-full">
                            {dueSoonCount} sắp đến hạn
                        </span>
                    )}
                </div>
            </div>

            {/* Dates List */}
            <div className="divide-y divide-gray-50 dark:divide-slate-700">
                {sortedDates.length === 0 ? (
                    <div className="px-5 py-8 text-center text-gray-400 dark:text-slate-500">
                        <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Chưa có mốc thời gian nào</p>
                    </div>
                ) : (
                    sortedDates.map(date => {
                        const style = getStatusStyle(date.status);
                        const { formatted, relative } = formatDate(date.date);
                        const Icon = style.icon;

                        return (
                            <div
                                key={date.id}
                                className={`px-5 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer group`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`w-10 h-10 rounded-xl ${style.bg} ${style.border} border flex items-center justify-center shrink-0`}>
                                        <Icon className={`w-5 h-5 ${style.iconColor}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-bold text-gray-800 dark:text-slate-200 truncate">{date.title}</p>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${style.bg} ${style.text}`}>
                                                {getTypeLabel(date.type)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-gray-500 dark:text-slate-400">{formatted}</span>
                                            {relative && (
                                                <span className={`text-[10px] font-bold ${style.text}`}>
                                                    • {relative}
                                                </span>
                                            )}
                                        </div>
                                        {date.description && (
                                            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 truncate">{date.description}</p>
                                        )}
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 shrink-0" />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* View All */}
            {dates.length > maxItems && onViewAll && (
                <div className="px-5 py-3 border-t border-gray-200 dark:border-slate-700">
                    <button
                        onClick={onViewAll}
                        className="w-full text-center text-xs font-bold text-blue-600 hover:text-blue-700"
                    >
                        Xem tất cả {dates.length} mốc thời gian →
                    </button>
                </div>
            )}
        </div>
    );
};

export default KeyDatesWidget;
