import React from 'react';
import { Task, TaskStatus } from '@/types';
import { CheckCircle2, Circle, Clock, ChevronRight } from 'lucide-react';

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
    const itemsWithTasks = phase.items.filter(item =>
        phaseTasks.some(t => t.TimelineStep === item.code)
    ).length;

    const completedItems = phase.items.filter(item => {
        const itemTasks = phaseTasks.filter(t => t.TimelineStep === item.code);
        return itemTasks.length > 0 && itemTasks.every(t => t.Status === TaskStatus.Done);
    }).length;

    const inProgressItems = phase.items.filter(item => {
        const itemTasks = phaseTasks.filter(t => t.TimelineStep === item.code);
        return itemTasks.some(t => t.Status === TaskStatus.InProgress || t.Status === TaskStatus.Review);
    }).length;

    const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

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
            color: 'text-gray-400',
            bgColor: 'bg-gray-100',
            progressColor: 'bg-gray-300',
            label: 'Chưa bắt đầu'
        },
        in_progress: {
            icon: Clock,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
            progressColor: 'from-blue-500 to-indigo-600',
            label: 'Đang thực hiện'
        },
        done: {
            icon: CheckCircle2,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-100',
            progressColor: 'from-emerald-500 to-green-600',
            label: 'Hoàn thành'
        }
    };

    const config = statusConfig[phaseStatus];
    const StatusIcon = config.icon;

    return (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            {/* Header */}
            <div
                className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={onToggle}
            >
                <div className="flex items-center gap-4 flex-1">
                    {/* Status Icon */}
                    <div className={`p-2 rounded-lg ${config.bgColor}`}>
                        <StatusIcon className={`w-5 h-5 ${config.color}`} />
                    </div>

                    {/* Title & Description */}
                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-800 text-sm">
                            {phase.title}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                            {phase.description}
                        </p>
                    </div>

                    {/* Progress Stats */}
                    <div className="hidden sm:flex items-center gap-4 mr-4">
                        {/* Mini Progress */}
                        <div className="flex flex-col items-end">
                            <span className="text-xs text-gray-500">Tiến độ</span>
                            <div className="flex items-center gap-2">
                                <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
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
                        <div className="flex flex-col items-center px-3 py-1 bg-gray-50 rounded-lg border border-gray-100">
                            <span className="text-lg font-bold text-gray-800 tabular-nums">
                                {completedItems}/{totalItems}
                            </span>
                            <span className="text-[10px] text-gray-500 uppercase tracking-wide">
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
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full bg-gradient-to-r ${config.progressColor} transition-all duration-500`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <span className={`text-xs font-bold ${config.color} tabular-nums`}>
                        {completedItems}/{totalItems}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default PhaseProgressCard;
