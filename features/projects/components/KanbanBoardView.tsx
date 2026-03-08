import React, { useState, useMemo } from 'react';
import { Task, TaskStatus, TaskPriority } from '@/types';
import {
    Circle, Clock, CheckCircle2, AlertCircle, Plus,
    User, Calendar, Flag, GripVertical, ChevronRight
} from 'lucide-react';
import { ProgressBadge } from './ProgressSlider';

interface KanbanBoardViewProps {
    tasks: Task[];
    onTaskClick: (task: Task) => void;
    onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
    onAddTask?: (status: TaskStatus) => void;
}

interface KanbanColumn {
    id: TaskStatus;
    title: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    borderColor: string;
}

const KANBAN_COLUMNS: KanbanColumn[] = [
    {
        id: TaskStatus.Todo,
        title: 'Chờ làm',
        icon: Circle,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200'
    },
    {
        id: TaskStatus.InProgress,
        title: 'Đang làm',
        icon: Clock,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200'
    },
    {
        id: TaskStatus.Review,
        title: 'Đang duyệt',
        icon: AlertCircle,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50',
        borderColor: 'border-indigo-200'
    },
    {
        id: TaskStatus.Done,
        title: 'Hoàn thành',
        icon: CheckCircle2,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200'
    },
];

export const KanbanBoardView: React.FC<KanbanBoardViewProps> = ({
    tasks,
    onTaskClick,
    onStatusChange,
    onAddTask
}) => {
    const [draggedTask, setDraggedTask] = useState<Task | null>(null);
    const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

    const tasksByStatus = useMemo(() => {
        const map = new Map<TaskStatus, Task[]>();
        KANBAN_COLUMNS.forEach(col => map.set(col.id, []));

        tasks.forEach(task => {
            const list = map.get(task.Status) || [];
            list.push(task);
            map.set(task.Status, list);
        });

        // Sort each column by StartDate ascending (execution order: earliest first)
        map.forEach((list, status) => {
            list.sort((a, b) => {
                const dateA = a.StartDate ? new Date(a.StartDate).getTime() : (a.DueDate ? new Date(a.DueDate).getTime() : 0);
                const dateB = b.StartDate ? new Date(b.StartDate).getTime() : (b.DueDate ? new Date(b.DueDate).getTime() : 0);
                return dateA - dateB;
            });
        });

        return map;
    }, [tasks]);

    const handleDragStart = (e: React.DragEvent, task: Task) => {
        setDraggedTask(task);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', task.TaskID);
    };

    const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverColumn(status);
    };

    const handleDragLeave = () => {
        setDragOverColumn(null);
    };

    const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
        e.preventDefault();
        if (draggedTask && draggedTask.Status !== status) {
            onStatusChange(draggedTask.TaskID, status);
        }
        setDraggedTask(null);
        setDragOverColumn(null);
    };

    const handleDragEnd = () => {
        setDraggedTask(null);
        setDragOverColumn(null);
    };

    const getPriorityStyle = (priority?: TaskPriority) => {
        switch (priority) {
            case 'High':
            case 'Urgent':
                return 'border-l-red-500';
            case 'Medium':
                return 'border-l-amber-500';
            case 'Low':
                return 'border-l-green-500';
            default:
                return 'border-l-gray-300';
        }
    };

    const isOverdue = (task: Task) => {
        if (task.Status === TaskStatus.Done) return false;
        if (!task.DueDate) return false;
        return new Date(task.DueDate) < new Date();
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {KANBAN_COLUMNS.map(column => {
                const columnTasks = tasksByStatus.get(column.id) || [];
                const Icon = column.icon;
                const isDropTarget = dragOverColumn === column.id;

                return (
                    <div
                        key={column.id}
                        className={`flex flex-col rounded-xl border-2 transition-all min-h-[400px] ${isDropTarget
                            ? `${column.borderColor} ring-2 ring-offset-2 ring-${column.color.replace('text-', '')}`
                            : 'border-gray-200 dark:border-slate-700'
                            }`}
                        onDragOver={(e) => handleDragOver(e, column.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, column.id)}
                    >
                        {/* Column Header */}
                        <div className={`flex items-center justify-between px-4 py-3 ${column.bgColor} border-b ${column.borderColor} rounded-t-xl`}>
                            <div className="flex items-center gap-2">
                                <Icon className={`w-4 h-4 ${column.color}`} />
                                <h3 className={`font-bold text-sm ${column.color}`}>
                                    {column.title}
                                </h3>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${column.bgColor} ${column.color} border ${column.borderColor}`}>
                                    {columnTasks.length}
                                </span>
                            </div>
                            {onAddTask && (
                                <button
                                    onClick={() => onAddTask(column.id)}
                                    className={`p-1 rounded hover:bg-white/50 transition-colors ${column.color}`}
                                    title={`Thêm công việc vào ${column.title}`}
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Tasks List */}
                        <div className="flex-1 p-3 space-y-2 overflow-y-auto">
                            {columnTasks.map(task => (
                                <div
                                    key={task.TaskID}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, task)}
                                    onDragEnd={handleDragEnd}
                                    onClick={() => onTaskClick(task)}
                                    className={`group bg-white dark:bg-slate-800 rounded-lg border dark:border-slate-700 p-3 cursor-pointer transition-all hover:shadow-md border-l-4 ${getPriorityStyle(task.Priority as TaskPriority)} ${draggedTask?.TaskID === task.TaskID ? 'opacity-50 scale-95' : ''
                                        } ${isOverdue(task) ? 'bg-red-50/50' : ''}`}
                                >
                                    {/* Drag Handle + Title */}
                                    <div className="flex items-start gap-2">
                                        <GripVertical className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab shrink-0 mt-0.5" />
                                        <div className="flex-1 min-w-0">
                                            <h4 className={`text-sm font-medium line-clamp-2 ${task.Status === TaskStatus.Done
                                                ? 'text-gray-400'
                                                : isOverdue(task)
                                                    ? 'text-red-700'
                                                    : 'text-gray-800 dark:text-slate-200'
                                                }`}>
                                                {task.Title}
                                            </h4>
                                        </div>
                                    </div>

                                    {/* Meta Row */}
                                    <div className="flex items-center justify-between mt-2 gap-2">
                                        {/* Due Date */}
                                        {task.DueDate && (
                                            <span className={`flex items-center gap-1 text-[10px] ${isOverdue(task) ? 'text-red-600 font-bold' : 'text-gray-400'
                                                }`}>
                                                <Calendar className="w-3 h-3" />
                                                {new Date(task.DueDate).toLocaleDateString('vi-VN', {
                                                    day: '2-digit',
                                                    month: '2-digit'
                                                })}
                                            </span>
                                        )}

                                        {/* Priority Badge */}
                                        {task.Priority && (
                                            <span className={`flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded border ${task.Priority === 'High' || task.Priority === 'Urgent'
                                                ? 'bg-red-50 text-red-600 border-red-200'
                                                : task.Priority === 'Medium'
                                                    ? 'bg-amber-50 text-amber-600 border-amber-200'
                                                    : 'bg-green-50 text-green-600 border-green-200'
                                                }`}>
                                                <Flag className="w-2.5 h-2.5" />
                                                {task.Priority}
                                            </span>
                                        )}
                                    </div>

                                    {/* Progress + Assignee Row */}
                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200 dark:border-slate-700">
                                        {/* Progress */}
                                        {task.ProgressPercent !== undefined && (
                                            <ProgressBadge value={task.ProgressPercent} size="sm" />
                                        )}

                                        {/* Assignee */}
                                        {task.AssigneeID && (
                                            <span className="flex items-center gap-1 text-[10px] text-gray-500">
                                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-[8px] font-bold">
                                                    {task.AssigneeID.slice(0, 2).toUpperCase()}
                                                </div>
                                            </span>
                                        )}
                                    </div>

                                    {/* Critical Path Indicator */}
                                    {task.IsCritical && (
                                        <div className="mt-2 flex items-center gap-1 text-[10px] text-purple-600 font-bold">
                                            <ChevronRight className="w-3 h-3" />
                                            Critical Path
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Empty State */}
                            {columnTasks.length === 0 && (
                                <div className="h-32 flex flex-col items-center justify-center text-gray-400 dark:text-slate-500 text-sm">
                                    <Icon className="w-8 h-8 mb-2 opacity-30" />
                                    <p className="text-xs">Không có công việc</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default KanbanBoardView;
