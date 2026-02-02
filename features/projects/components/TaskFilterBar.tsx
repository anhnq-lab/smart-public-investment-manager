import React from 'react';
import {
    Filter, User, Clock, AlertTriangle, CheckCircle2,
    Calendar, Route, Plus, Search, X, LayoutGrid, List, BarChart3
} from 'lucide-react';
import { TaskStatus } from '@/types';

export type TaskViewMode = 'wbs' | 'gantt' | 'kanban' | 'resource';
export type TaskFilter = 'all' | 'my-tasks' | 'overdue' | 'this-week' | 'critical' | 'in-progress' | 'completed';

interface TaskFilterBarProps {
    currentFilter: TaskFilter;
    currentView: TaskViewMode;
    onFilterChange: (filter: TaskFilter) => void;
    onViewChange: (view: TaskViewMode) => void;
    onAddTask: () => void;
    onSearch?: (query: string) => void;
    searchQuery?: string;
    taskCounts?: {
        all: number;
        myTasks: number;
        overdue: number;
        thisWeek: number;
        critical: number;
        inProgress: number;
        completed: number;
    };
    currentUserId?: string;
}

export const TaskFilterBar: React.FC<TaskFilterBarProps> = ({
    currentFilter,
    currentView,
    onFilterChange,
    onViewChange,
    onAddTask,
    onSearch,
    searchQuery = '',
    taskCounts,
    currentUserId
}) => {
    const filters: { id: TaskFilter; label: string; icon: React.ElementType; color: string }[] = [
        { id: 'all', label: 'Tất cả', icon: Filter, color: 'gray' },
        { id: 'my-tasks', label: 'Của tôi', icon: User, color: 'blue' },
        { id: 'this-week', label: 'Tuần này', icon: Calendar, color: 'indigo' },
        { id: 'in-progress', label: 'Đang làm', icon: Clock, color: 'orange' },
        { id: 'overdue', label: 'Quá hạn', icon: AlertTriangle, color: 'red' },
        { id: 'critical', label: 'Critical Path', icon: Route, color: 'purple' },
        { id: 'completed', label: 'Hoàn thành', icon: CheckCircle2, color: 'emerald' },
    ];

    const views: { id: TaskViewMode; label: string; icon: React.ElementType }[] = [
        { id: 'wbs', label: 'WBS', icon: List },
        { id: 'gantt', label: 'Gantt', icon: BarChart3 },
        { id: 'kanban', label: 'Kanban', icon: LayoutGrid },
        { id: 'resource', label: 'Nguồn lực', icon: User },
    ];

    const getFilterCount = (filter: TaskFilter): number | undefined => {
        if (!taskCounts) return undefined;
        switch (filter) {
            case 'all': return taskCounts.all;
            case 'my-tasks': return taskCounts.myTasks;
            case 'overdue': return taskCounts.overdue;
            case 'this-week': return taskCounts.thisWeek;
            case 'critical': return taskCounts.critical;
            case 'in-progress': return taskCounts.inProgress;
            case 'completed': return taskCounts.completed;
            default: return undefined;
        }
    };

    const getFilterStyle = (filter: { id: TaskFilter; color: string }, isActive: boolean) => {
        if (!isActive) return 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50';

        switch (filter.color) {
            case 'blue': return 'bg-blue-50 text-blue-700 border-blue-300 ring-1 ring-blue-200';
            case 'red': return 'bg-red-50 text-red-700 border-red-300 ring-1 ring-red-200';
            case 'orange': return 'bg-orange-50 text-orange-700 border-orange-300 ring-1 ring-orange-200';
            case 'emerald': return 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-1 ring-emerald-200';
            case 'purple': return 'bg-purple-50 text-purple-700 border-purple-300 ring-1 ring-purple-200';
            case 'indigo': return 'bg-indigo-50 text-indigo-700 border-indigo-300 ring-1 ring-indigo-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-300 ring-1 ring-gray-200';
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
            {/* Top Row: Search + Add Button */}
            <div className="flex items-center gap-4">
                {/* Search */}
                {onSearch && (
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm công việc..."
                            value={searchQuery}
                            onChange={(e) => onSearch(e.target.value)}
                            className="w-full pl-10 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => onSearch('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                )}

                {/* Add Task Button */}
                <button
                    onClick={onAddTask}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    Thêm công việc
                </button>
            </div>

            {/* Bottom Row: Filters + View Toggle */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                {/* Filter Pills */}
                <div className="flex items-center gap-2 flex-wrap">
                    {filters.map(filter => {
                        const isActive = currentFilter === filter.id;
                        const count = getFilterCount(filter.id);
                        const Icon = filter.icon;

                        return (
                            <button
                                key={filter.id}
                                onClick={() => onFilterChange(filter.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${getFilterStyle(filter, isActive)}`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {filter.label}
                                {count !== undefined && count > 0 && (
                                    <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] ${isActive
                                            ? 'bg-white/50'
                                            : filter.color === 'red' && count > 0
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-gray-100'
                                        }`}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* View Toggle */}
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                    {views.map(view => {
                        const isActive = currentView === view.id;
                        const Icon = view.icon;

                        return (
                            <button
                                key={view.id}
                                onClick={() => onViewChange(view.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${isActive
                                        ? 'bg-white text-blue-700 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                title={view.label}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">{view.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default TaskFilterBar;
