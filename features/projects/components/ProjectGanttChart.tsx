import React from 'react';
import { Task, TaskStatus } from '@/types';

interface ProjectGanttChartProps {
    tasks: Task[];
}

export const ProjectGanttChart: React.FC<ProjectGanttChartProps> = ({ tasks }) => {
    // If no tasks, show empty state
    const taskDates = tasks.map(t => new Date(t.DueDate).getTime());
    if (tasks.length === 0) return (
        <div className="py-12 text-center text-gray-400 italic bg-gray-50 rounded-xl border border-dashed border-gray-200">
            Chưa có dữ liệu tiến độ để hiển thị biểu đồ.
        </div>
    );

    // Calculate Date Range
    const minDate = new Date(Math.min(...taskDates));
    const maxDate = new Date(Math.max(...taskDates));

    // Pad range by 2 months before and 3 months after
    minDate.setMonth(minDate.getMonth() - 2);
    maxDate.setMonth(maxDate.getMonth() + 3);

    // Build Timeline Header
    const timeline: { label: string, full: string }[] = [];
    let current = new Date(minDate);
    while (current <= maxDate) {
        timeline.push({
            label: (current.getMonth() + 1).toString(),
            full: `Tháng ${current.getMonth() + 1} năm ${current.getFullYear()}`
        });
        current.setMonth(current.getMonth() + 1);
    }

    const totalDuration = maxDate.getTime() - minDate.getTime();

    return (
        <div className="overflow-x-auto pb-4">
            <div className="min-w-[1000px]">
                {/* Header */}
                <div className="flex border-b border-gray-200 bg-gray-50/80 sticky top-0 z-10">
                    <div className="w-64 shrink-0 px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Hạng mục công việc</div>
                    <div className="flex-1 flex">
                        {timeline.map((m, idx) => (
                            <div
                                key={idx}
                                title={m.full}
                                className="flex-1 text-center py-2.5 text-[9px] font-black text-gray-400 border-l border-gray-100 uppercase cursor-help hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                                {m.label}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Body */}
                <div className="divide-y divide-gray-100 bg-white">
                    {tasks.slice(0, 10).map(task => { // Limiting to top 10 for performance/overview
                        const dueDate = new Date(task.DueDate);
                        const startDate = new Date(dueDate);
                        // Mock start date for demo (2 months before due date)
                        startDate.setMonth(startDate.getMonth() - 2);

                        const leftPos = ((startDate.getTime() - minDate.getTime()) / totalDuration) * 100;
                        const width = ((dueDate.getTime() - startDate.getTime()) / totalDuration) * 100;

                        return (
                            <div key={task.TaskID} className="flex group hover:bg-blue-50/40 transition-colors">
                                <div className="w-64 shrink-0 px-4 py-3 flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${task.Status === TaskStatus.Done ? 'bg-emerald-500' : task.Status === TaskStatus.InProgress ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                                    <span className="text-[11px] font-semibold text-gray-700 truncate" title={task.Title}>{task.Title}</span>
                                </div>
                                <div className="flex-1 relative h-10 flex items-center border-l border-gray-100">
                                    {/* Grid Lines */}
                                    <div className="absolute inset-0 flex pointer-events-none">
                                        {timeline.map((_, i) => <div key={i} className="flex-1 border-r border-gray-50/50"></div>)}
                                    </div>

                                    {/* Task Bar */}
                                    <div
                                        className={`absolute h-4 rounded-full shadow-sm flex items-center px-2 min-w-[20px] transition-all duration-700 ease-out cursor-pointer ${task.Status === TaskStatus.Done ? 'bg-emerald-500 shadow-emerald-100' :
                                            task.Status === TaskStatus.InProgress ? 'bg-blue-500 shadow-blue-100' : 'bg-gray-200'
                                            }`}
                                        style={{ left: `${Math.max(0, leftPos)}%`, width: `${Math.max(5, width)}%` }}
                                        title={`${task.Title}: ${startDate.toLocaleDateString()} - ${dueDate.toLocaleDateString()}`}
                                    >
                                        <span className="text-[8px] text-white font-bold whitespace-nowrap overflow-hidden pointer-events-none uppercase">
                                            {task.Status === TaskStatus.Done ? 'OK' : '...'}
                                        </span>
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
