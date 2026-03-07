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
            textColor: 'text-blue-600 dark:text-blue-400',
            bgColor: '',
            borderColor: 'border-blue-100 dark:border-blue-800'
        },
        {
            label: 'Đang thực hiện',
            value: inProgressTasks + reviewTasks,
            subtitle: reviewTasks > 0 ? `(${reviewTasks} chờ duyệt)` : undefined,
            icon: PlayCircle,
            color: 'amber',
            bgGradient: 'from-amber-500 to-orange-500',
            textColor: 'text-amber-600 dark:text-amber-400',
            bgColor: '',
            borderColor: 'border-amber-100 dark:border-amber-800'
        },
        {
            label: 'Hoàn thành',
            value: `${doneTasks}/${totalTasks}`,
            subtitle: `${completionRate}%`,
            icon: CheckCircle2,
            color: 'emerald',
            bgGradient: 'from-emerald-500 to-green-600',
            textColor: 'text-emerald-600 dark:text-emerald-400',
            bgColor: '',
            borderColor: 'border-emerald-100 dark:border-emerald-800'
        },
        {
            label: 'Quá hạn',
            value: overdueTasks,
            icon: AlertTriangle,
            color: 'red',
            bgGradient: 'from-red-500 to-rose-600',
            textColor: overdueTasks > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-slate-500',
            bgColor: overdueTasks > 0 ? '' : 'bg-gray-200 dark:bg-slate-800',
            borderColor: overdueTasks > 0 ? 'border-red-100 dark:border-red-800' : 'border-gray-200 dark:border-slate-700',
            alert: overdueTasks > 0
        }
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
                <div
                    key={index}
                    className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${stat.bgGradient} text-white p-4 shadow-xl ring-1 ring-white/10 transition-transform hover:scale-[1.02] hover:shadow-2xl duration-300`}
                >
                    {/* Gradient top border */}
                    <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg, #F99715, #EC6710)' }} />

                    {/* Background gradient accent */}
                    <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.bgGradient} opacity-10 rounded-full -translate-y-8 translate-x-8`} />

                    <div className="relative flex items-start justify-between">
                        <div>
                            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-white/90">
                                {stat.label}
                            </p>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-2xl font-black text-white tabular-nums drop-shadow-sm">
                                    {stat.value}
                                </span>
                                {stat.subtitle && (
                                    <span className="text-sm font-semibold text-white/80">
                                        {stat.subtitle}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="p-2 rounded-lg bg-white/20 shadow-sm">
                            <stat.icon className={`w-5 h-5 text-white ${stat.alert ? 'animate-pulse' : ''}`} />
                        </div>
                    </div>

                    {/* Progress bar for completion */}
                    {stat.label === 'Hoàn thành' && (
                        <div className="mt-3">
                            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-white/80 transition-all duration-500 rounded-full"
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
