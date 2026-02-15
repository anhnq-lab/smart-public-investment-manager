import React from 'react';
import { Task, TaskStatus } from '@/types';
import {
    ListTodo,
    PlayCircle,
    CheckCircle2,
    AlertTriangle,
    TrendingUp
} from 'lucide-react';

interface PlanStatisticsHeaderProps {
    tasks: Task[];
}

export const PlanStatisticsHeader: React.FC<PlanStatisticsHeaderProps> = ({ tasks }) => {
    // Calculate statistics
    const totalTasks = tasks.length;
    const inProgressTasks = tasks.filter(t => t.Status === TaskStatus.InProgress).length;
    const reviewTasks = tasks.filter(t => t.Status === TaskStatus.Review).length;
    const doneTasks = tasks.filter(t => t.Status === TaskStatus.Done).length;
    const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    // Calculate overdue tasks
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdueTasks = tasks.filter(t => {
        if (t.Status === TaskStatus.Done) return false;
        if (!t.DueDate) return false;
        const dueDate = new Date(t.DueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < today;
    }).length;

    const stats = [
        {
            label: 'Tổng công việc',
            value: totalTasks,
            icon: ListTodo,
            color: 'blue',
            bgGradient: 'from-blue-500 to-blue-600',
            textColor: 'text-blue-600',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-100'
        },
        {
            label: 'Đang thực hiện',
            value: inProgressTasks + reviewTasks,
            subtitle: reviewTasks > 0 ? `(${reviewTasks} chờ duyệt)` : undefined,
            icon: PlayCircle,
            color: 'amber',
            bgGradient: 'from-amber-500 to-orange-500',
            textColor: 'text-amber-600',
            bgColor: 'bg-amber-50',
            borderColor: 'border-amber-100'
        },
        {
            label: 'Hoàn thành',
            value: `${doneTasks}/${totalTasks}`,
            subtitle: `${completionRate}%`,
            icon: CheckCircle2,
            color: 'emerald',
            bgGradient: 'from-emerald-500 to-green-600',
            textColor: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
            borderColor: 'border-emerald-100'
        },
        {
            label: 'Quá hạn',
            value: overdueTasks,
            icon: AlertTriangle,
            color: 'red',
            bgGradient: 'from-red-500 to-rose-600',
            textColor: overdueTasks > 0 ? 'text-red-600' : 'text-gray-400',
            bgColor: overdueTasks > 0 ? 'bg-red-50' : 'bg-gray-50',
            borderColor: overdueTasks > 0 ? 'border-red-100' : 'border-gray-100',
            alert: overdueTasks > 0
        }
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
                <div
                    key={index}
                    className={`relative overflow-hidden rounded-xl border ${stat.borderColor} ${stat.bgColor} p-4 transition-all hover:shadow-md`}
                >
                    {/* Background gradient accent */}
                    <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.bgGradient} opacity-10 rounded-full -translate-y-8 translate-x-8`} />

                    <div className="relative flex items-start justify-between">
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                                {stat.label}
                            </p>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className={`text-2xl font-bold ${stat.textColor} tabular-nums`}>
                                    {stat.value}
                                </span>
                                {stat.subtitle && (
                                    <span className={`text-sm font-semibold ${stat.textColor} opacity-70`}>
                                        {stat.subtitle}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className={`p-2 rounded-lg bg-white dark:bg-slate-700 shadow-sm`}>
                            <stat.icon className={`w-5 h-5 ${stat.textColor} ${stat.alert ? 'animate-pulse' : ''}`} />
                        </div>
                    </div>

                    {/* Progress bar for completion */}
                    {stat.label === 'Hoàn thành' && (
                        <div className="mt-3">
                            <div className="h-1.5 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                                <div
                                    className={`h-full bg-gradient-to-r ${stat.bgGradient} transition-all duration-500`}
                                    style={{ width: `${completionRate}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default PlanStatisticsHeader;
