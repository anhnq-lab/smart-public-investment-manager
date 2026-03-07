import React from 'react';
import { Task, TaskStatus } from '@/types';

interface ProjectGanttChartProps {
    tasks: Task[];
}

export const ProjectGanttChart: React.FC<ProjectGanttChartProps> = ({ tasks }) => {
    if (tasks.length === 0) return (
        <div className="py-12 text-center text-gray-400 italic bg-gray-50 dark:bg-slate-800 rounded-xl border border-dashed border-gray-200 dark:border-slate-700">
            Chưa có dữ liệu tiến độ để hiển thị biểu đồ.
        </div>
    );

    // Sort tasks by StartDate, then DueDate
    const sortedTasks = [...tasks].sort((a, b) => {
        const startA = a.StartDate ? new Date(a.StartDate).getTime() : (a.DueDate ? new Date(a.DueDate).getTime() : 0);
        const startB = b.StartDate ? new Date(b.StartDate).getTime() : (b.DueDate ? new Date(b.DueDate).getTime() : 0);
        return startA - startB;
    });

    // Calculate Date Range from all tasks (using both StartDate and DueDate)
    const allDates: number[] = [];
    sortedTasks.forEach(t => {
        if (t.StartDate) allDates.push(new Date(t.StartDate).getTime());
        if (t.DueDate) allDates.push(new Date(t.DueDate).getTime());
    });

    const minDate = new Date(Math.min(...allDates));
    const maxDate = new Date(Math.max(...allDates));

    // Pad range by 1 month before and 2 months after
    minDate.setMonth(minDate.getMonth() - 1);
    maxDate.setMonth(maxDate.getMonth() + 2);

    // Build Timeline Header grouped by Year → Month
    const timeline: { month: number; year: number; label: string }[] = [];
    const current = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    while (current <= maxDate) {
        timeline.push({
            month: current.getMonth() + 1,
            year: current.getFullYear(),
            label: `T${current.getMonth() + 1}`
        });
        current.setMonth(current.getMonth() + 1);
    }

    // Group months by year for header
    const yearGroups: { year: number; months: typeof timeline }[] = [];
    timeline.forEach(m => {
        const last = yearGroups[yearGroups.length - 1];
        if (last && last.year === m.year) {
            last.months.push(m);
        } else {
            yearGroups.push({ year: m.year, months: [m] });
        }
    });

    const totalDuration = maxDate.getTime() - minDate.getTime();
    const COL_WIDTH = 48; // px per month column
    const totalWidth = timeline.length * COL_WIDTH;

    // Status colors
    const getBarColor = (status: TaskStatus) => {
        switch (status) {
            case TaskStatus.Done: return 'bg-emerald-500';
            case TaskStatus.Review: return 'bg-indigo-500';
            case TaskStatus.InProgress: return 'bg-orange-500';
            default: return 'bg-blue-400';
        }
    };

    const getBarShadow = (status: TaskStatus) => {
        switch (status) {
            case TaskStatus.Done: return 'shadow-emerald-200';
            case TaskStatus.Review: return 'shadow-indigo-200';
            case TaskStatus.InProgress: return 'shadow-orange-200';
            default: return 'shadow-blue-200';
        }
    };

    const getDotColor = (status: TaskStatus) => {
        switch (status) {
            case TaskStatus.Done: return 'bg-emerald-500';
            case TaskStatus.Review: return 'bg-indigo-500';
            case TaskStatus.InProgress: return 'bg-orange-500';
            default: return 'bg-gray-300';
        }
    };

    return (
        <div className="overflow-x-auto pb-4 rounded-xl border border-gray-200 dark:border-slate-700">
            <div style={{ minWidth: `${280 + totalWidth}px` }}>
                {/* Year Header */}
                <div className="flex border-b border-gray-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                    <div className="w-[280px] shrink-0" />
                    <div className="flex">
                        {yearGroups.map(yg => (
                            <div
                                key={yg.year}
                                style={{ width: `${yg.months.length * COL_WIDTH}px` }}
                                className="text-center py-1.5 text-[10px] font-black text-slate-500 dark:text-slate-400 border-l border-gray-200 dark:border-slate-700 uppercase tracking-widest"
                            >
                                {yg.year}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Month Header */}
                <div className="flex border-b border-gray-200 dark:border-slate-700 bg-gray-50/80 dark:bg-slate-800/80 sticky top-0 z-10">
                    <div className="w-[280px] shrink-0 px-4 py-2 text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                        Hạng mục công việc
                    </div>
                    <div className="flex">
                        {timeline.map((m, idx) => (
                            <div
                                key={idx}
                                style={{ width: `${COL_WIDTH}px` }}
                                title={`Tháng ${m.month} năm ${m.year}`}
                                className="text-center py-2 text-[9px] font-black text-gray-400 dark:text-slate-500 border-l border-gray-200 dark:border-slate-700 cursor-help hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                {m.label}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Body - ALL tasks */}
                <div className="divide-y divide-gray-50 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {sortedTasks.map((task, idx) => {
                        const dueDate = new Date(task.DueDate);
                        let startDate = task.StartDate ? new Date(task.StartDate) : null;

                        // Fallback: use DueDate - DurationDays, or DueDate - 30 days
                        if (!startDate || isNaN(startDate.getTime())) {
                            startDate = new Date(dueDate);
                            const dur = task.DurationDays || 30;
                            startDate.setDate(startDate.getDate() - dur);
                        }

                        const leftPos = ((startDate.getTime() - minDate.getTime()) / totalDuration) * 100;
                        const width = ((dueDate.getTime() - startDate.getTime()) / totalDuration) * 100;

                        // Today marker position
                        const todayPos = ((Date.now() - minDate.getTime()) / totalDuration) * 100;

                        return (
                            <div key={task.TaskID} className="flex group hover:bg-blue-50/40 dark:hover:bg-slate-800/60 transition-colors">
                                {/* Task Name Column */}
                                <div className="w-[280px] shrink-0 px-4 py-2.5 flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full shrink-0 ${getDotColor(task.Status)}`} />
                                    <span
                                        className="text-[11px] font-semibold text-gray-700 dark:text-slate-300 truncate"
                                        title={task.Title}
                                    >
                                        {task.Title}
                                    </span>
                                </div>

                                {/* Gantt Bar Column */}
                                <div className="flex-1 relative h-9 flex items-center">
                                    {/* Grid Lines */}
                                    <div className="absolute inset-0 flex pointer-events-none">
                                        {timeline.map((_, i) => (
                                            <div
                                                key={i}
                                                style={{ width: `${COL_WIDTH}px` }}
                                                className="border-l border-gray-50 dark:border-slate-800/50"
                                            />
                                        ))}
                                    </div>

                                    {/* Today Line */}
                                    {todayPos > 0 && todayPos < 100 && idx === 0 && (
                                        <div
                                            className="absolute top-0 bottom-0 w-[2px] bg-red-400 z-20 pointer-events-none"
                                            style={{ left: `${todayPos}%` }}
                                        >
                                            <div className="absolute -top-0.5 -left-1 w-2 h-2 bg-red-500 rounded-full" />
                                        </div>
                                    )}

                                    {/* Task Bar */}
                                    <div
                                        className={`absolute h-5 rounded-md shadow-sm flex items-center justify-center min-w-[12px] transition-all cursor-pointer hover:opacity-90 hover:shadow-md ${getBarColor(task.Status)} ${getBarShadow(task.Status)}`}
                                        style={{
                                            left: `${Math.max(0, leftPos)}%`,
                                            width: `${Math.max(1.5, width)}%`
                                        }}
                                        title={`${task.Title}\n${startDate.toLocaleDateString('vi-VN')} → ${dueDate.toLocaleDateString('vi-VN')}\nTrạng thái: ${task.Status}`}
                                    >
                                        {width > 5 && (
                                            <span className="text-[7px] text-white font-bold whitespace-nowrap overflow-hidden px-1 uppercase tracking-wide">
                                                {task.DurationDays ? `${task.DurationDays}d` : ''}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
