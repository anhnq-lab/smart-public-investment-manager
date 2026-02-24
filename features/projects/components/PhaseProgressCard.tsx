import React from 'react';
import { Task, TaskStatus } from '@/types';
import { CheckCircle2, Circle, Clock, ChevronRight, Calendar, AlertTriangle } from 'lucide-react';

interface PhaseData {
    id: string;
    title: string;
    description: string;
    items: { id: string; title: string; code: string }[];
}

interface PhaseProgressCardProps {
    phase: PhaseData;
    tasks: Task[];
    isExpanded: boolean;
    onToggle: () => void;
}

export const PhaseProgressCard: React.FC<PhaseProgressCardProps> = ({
    phase,
    tasks,
    isExpanded,
    onToggle
}) => {
    // Calculate phase progress
    const phaseTasks = tasks.filter(t =>
        phase.items.some(item => item.code === t.TimelineStep)
    );

    const totalItems = phase.items.length;
    const completedItems = phase.items.filter(item => {
        const itemTasks = phaseTasks.filter(t => t.TimelineStep === item.code);
        return itemTasks.length > 0 && itemTasks.every(t => t.Status === TaskStatus.Done);
    }).length;

    const inProgressItems = phase.items.filter(item => {
        const itemTasks = phaseTasks.filter(t => t.TimelineStep === item.code);
        return itemTasks.some(t => t.Status === TaskStatus.InProgress || t.Status === TaskStatus.Review);
    }).length;

    const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    // Calculate phase date range
    const allStartDates = phaseTasks
        .filter(t => t.StartDate)
        .map(t => new Date(t.StartDate!).getTime())
        .filter(d => !isNaN(d));
    const allDueDates = phaseTasks
        .filter(t => t.DueDate)
        .map(t => new Date(t.DueDate).getTime())
        .filter(d => !isNaN(d));

    const phaseStartDate = allStartDates.length > 0 ? new Date(Math.min(...allStartDates)) : null;
    const phaseEndDate = allDueDates.length > 0 ? new Date(Math.max(...allDueDates)) : null;

    // Calculate days status
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let daysInfo = { label: '', color: '', isOverdue: false };

    if (phaseEndDate && completedItems < totalItems) {
        const diffDays = Math.ceil((phaseEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
            daysInfo = { label: `Quá hạn ${Math.abs(diffDays)} ngày`, color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30', isOverdue: true };
        } else if (diffDays <= 7) {
            daysInfo = { label: `Còn ${diffDays} ngày`, color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30', isOverdue: false };
        } else if (diffDays <= 30) {
            daysInfo = { label: `Còn ${diffDays} ngày`, color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30', isOverdue: false };
        }
    }

    // Determine phase status
    let phaseStatus: 'todo' | 'in_progress' | 'done' = 'todo';
    if (completedItems === totalItems && totalItems > 0) {
        phaseStatus = 'done';
    } else if (inProgressItems > 0 || completedItems > 0) {
        phaseStatus = 'in_progress';
    }

    const statusConfig = {
        todo: {
            icon: Circle,
            color: 'text-gray-400 dark:text-slate-500',
            bgColor: 'bg-gray-100 dark:bg-slate-700',
            progressColor: 'bg-gray-300 dark:bg-slate-600',
            borderColor: 'border-l-gray-300 dark:border-l-slate-600'
        },
        in_progress: {
            icon: Clock,
            color: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-100 dark:bg-blue-900/30',
            progressColor: 'from-blue-500 to-indigo-600',
            borderColor: 'border-l-blue-500'
        },
        done: {
            icon: CheckCircle2,
            color: 'text-emerald-600 dark:text-emerald-400',
            bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
            progressColor: 'from-emerald-500 to-green-600',
            borderColor: 'border-l-emerald-500'
        }
    };

    const config = statusConfig[phaseStatus];
    const StatusIcon = config.icon;

    return (
        <div className={`bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border-l-4 ${config.borderColor}`}>
            {/* Header */}
            <div
                className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                onClick={onToggle}
            >
                <div className="flex items-center gap-4 flex-1">
                    {/* Status Icon */}
                    <div className={`p-2 rounded-lg ${config.bgColor}`}>
                        <StatusIcon className={`w-5 h-5 ${config.color}`} />
                    </div>

                    {/* Title & Description */}
                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-800 dark:text-slate-200 text-sm">
                            {phase.title}
                        </h4>
                        <div className="flex items-center gap-3 mt-1">
                            <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                                {phase.description}
                            </p>
                            {/* Date Range Badge */}
                            {phaseStartDate && phaseEndDate && (
                                <span className="hidden md:flex items-center gap-1 text-[10px] text-gray-400 dark:text-slate-500 bg-gray-50 dark:bg-slate-700 px-2 py-0.5 rounded border border-gray-100 dark:border-slate-600 shrink-0">
                                    <Calendar className="w-3 h-3" />
                                    {phaseStartDate.toLocaleDateString('vi-VN')} → {phaseEndDate.toLocaleDateString('vi-VN')}
                                </span>
                            )}
                            {/* Days Remaining Badge */}
                            {daysInfo.label && (
                                <span className={`hidden md:flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-medium shrink-0 ${daysInfo.color}`}>
                                    {daysInfo.isOverdue && <AlertTriangle className="w-3 h-3" />}
                                    {daysInfo.label}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Progress Stats */}
                    <div className="hidden sm:flex items-center gap-4 mr-4">
                        {/* Mini Progress */}
                        <div className="flex flex-col items-end">
                            <span className="text-xs text-gray-500 dark:text-slate-400">Tiến độ</span>
                            <div className="flex items-center gap-2">
                                <div className="w-24 h-2 bg-gray-100 dark:bg-slate-600 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full bg-gradient-to-r ${config.progressColor} transition-all duration-500`}
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <span className={`text-sm font-bold ${config.color} tabular-nums`}>
                                    {progress}%
                                </span>
                            </div>
                        </div>

                        {/* Item Counter */}
                        <div className="flex flex-col items-center px-3 py-1 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-100 dark:border-slate-600">
                            <span className="text-lg font-bold text-gray-800 dark:text-slate-200 tabular-nums">
                                {completedItems}/{totalItems}
                            </span>
                            <span className="text-[10px] text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                                Hoàn thành
                            </span>
                        </div>
                    </div>
                </div>

                {/* Expand Icon */}
                <ChevronRight
                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                />
            </div>

            {/* Mobile Progress Bar */}
            <div className="sm:hidden px-5 pb-3">
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-100 dark:bg-slate-600 rounded-full overflow-hidden">
                        <div
                            className={`h-full bg-gradient-to-r ${config.progressColor} transition-all duration-500`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <span className={`text-xs font-bold ${config.color} tabular-nums`}>
                        {completedItems}/{totalItems}
                    </span>
                </div>
                {/* Mobile Date Range */}
                {phaseStartDate && phaseEndDate && (
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-slate-500 mt-2">
                        <Calendar className="w-3 h-3" />
                        {phaseStartDate.toLocaleDateString('vi-VN')} → {phaseEndDate.toLocaleDateString('vi-VN')}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PhaseProgressCard;

