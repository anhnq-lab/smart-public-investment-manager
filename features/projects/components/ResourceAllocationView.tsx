import React, { useMemo } from 'react';
import { Task, TaskStatus, Employee } from '@/types';
import { User, AlertTriangle, Clock, CheckCircle2, Calendar, BarChart3 } from 'lucide-react';
import { ProgressBadge } from './ProgressSlider';

interface ResourceAllocationViewProps {
    tasks: Task[];
    employees: Employee[];
    onTaskClick: (task: Task) => void;
}

interface ResourceData {
    employee: Employee;
    tasks: Task[];
    totalAllocation: number;
    overloadWarning: boolean;
    completedTasks: number;
    inProgressTasks: number;
}

export const ResourceAllocationView: React.FC<ResourceAllocationViewProps> = ({
    tasks,
    employees,
    onTaskClick
}) => {
    // Group tasks by assignee and calculate workload
    const resourceData = useMemo((): ResourceData[] => {
        const assigneeMap = new Map<string, Task[]>();

        // Group tasks by primary assignee
        tasks.forEach(task => {
            if (task.AssigneeID) {
                const list = assigneeMap.get(task.AssigneeID) || [];
                list.push(task);
                assigneeMap.set(task.AssigneeID, list);
            }

            // Also consider multi-assignees
            task.Assignees?.forEach(assignment => {
                const list = assigneeMap.get(assignment.EmployeeID) || [];
                if (!list.find(t => t.TaskID === task.TaskID)) {
                    list.push(task);
                }
                assigneeMap.set(assignment.EmployeeID, list);
            });
        });

        return employees
            .filter(emp => assigneeMap.has(emp.EmployeeID))
            .map(emp => {
                const empTasks = assigneeMap.get(emp.EmployeeID) || [];
                const activeTasks = empTasks.filter(t =>
                    t.Status === TaskStatus.InProgress || t.Status === TaskStatus.Review
                );

                // Calculate total allocation from Assignees array or count active tasks
                let totalAllocation = 0;
                activeTasks.forEach(task => {
                    const assignment = task.Assignees?.find(a => a.EmployeeID === emp.EmployeeID);
                    totalAllocation += assignment?.AllocationPercent || 100 / Math.max(activeTasks.length, 1);
                });

                return {
                    employee: emp,
                    tasks: empTasks,
                    totalAllocation: Math.min(totalAllocation, 200), // Cap at 200%
                    overloadWarning: totalAllocation > 100,
                    completedTasks: empTasks.filter(t => t.Status === TaskStatus.Done).length,
                    inProgressTasks: activeTasks.length
                };
            })
            .sort((a, b) => b.totalAllocation - a.totalAllocation);
    }, [tasks, employees]);

    const getWorkloadColor = (allocation: number) => {
        if (allocation > 100) return 'bg-red-500';
        if (allocation > 80) return 'bg-orange-500';
        if (allocation > 50) return 'bg-blue-500';
        return 'bg-emerald-500';
    };

    const getWorkloadBg = (allocation: number) => {
        if (allocation > 100) return 'bg-red-50 border-red-200';
        if (allocation > 80) return 'bg-orange-50 border-orange-200';
        return 'bg-white border-gray-200';
    };

    const isOverdue = (task: Task) => {
        if (task.Status === TaskStatus.Done) return false;
        if (!task.DueDate) return false;
        return new Date(task.DueDate) < new Date();
    };

    return (
        <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                        <User className="w-4 h-4" />
                        Người được giao
                    </div>
                    <div className="text-2xl font-black text-gray-800">{resourceData.length}</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-2 text-orange-500 text-xs mb-1">
                        <Clock className="w-4 h-4" />
                        Đang thực hiện
                    </div>
                    <div className="text-2xl font-black text-orange-600">
                        {resourceData.reduce((sum, r) => sum + r.inProgressTasks, 0)}
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-2 text-red-500 text-xs mb-1">
                        <AlertTriangle className="w-4 h-4" />
                        Quá tải (&gt;100%)
                    </div>
                    <div className="text-2xl font-black text-red-600">
                        {resourceData.filter(r => r.overloadWarning).length}
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-2 text-emerald-500 text-xs mb-1">
                        <CheckCircle2 className="w-4 h-4" />
                        Đã hoàn thành
                    </div>
                    <div className="text-2xl font-black text-emerald-600">
                        {resourceData.reduce((sum, r) => sum + r.completedTasks, 0)}
                    </div>
                </div>
            </div>

            {/* Resource Cards */}
            <div className="space-y-3">
                {resourceData.map(({ employee, tasks: empTasks, totalAllocation, overloadWarning, completedTasks, inProgressTasks }) => (
                    <div
                        key={employee.EmployeeID}
                        className={`rounded-xl border overflow-hidden transition-all ${getWorkloadBg(totalAllocation)}`}
                    >
                        {/* Employee Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                {/* Avatar */}
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold">
                                    {employee.FullName.split(' ').slice(-1)[0].charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-800">{employee.FullName}</h4>
                                    <p className="text-xs text-gray-500">{employee.Position || 'Nhân viên'}</p>
                                </div>
                            </div>

                            {/* Workload Indicator */}
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <div className="flex items-center gap-2">
                                        {overloadWarning && (
                                            <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
                                        )}
                                        <span className={`text-xl font-black ${overloadWarning ? 'text-red-600' : 'text-gray-800'
                                            }`}>
                                            {Math.round(totalAllocation)}%
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-gray-400">Khối lượng công việc</p>
                                </div>

                                {/* Visual Bar */}
                                <div className="w-24 h-3 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all ${getWorkloadColor(totalAllocation)}`}
                                        style={{ width: `${Math.min(totalAllocation, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Task Summary */}
                        <div className="flex items-center justify-between px-4 py-2 bg-gray-50/50 text-xs">
                            <div className="flex items-center gap-4">
                                <span className="text-gray-500">
                                    <strong className="text-gray-700">{empTasks.length}</strong> công việc
                                </span>
                                <span className="text-orange-600">
                                    <strong>{inProgressTasks}</strong> đang làm
                                </span>
                                <span className="text-emerald-600">
                                    <strong>{completedTasks}</strong> hoàn thành
                                </span>
                            </div>
                            <button className="text-blue-600 hover:underline font-medium">
                                Xem chi tiết
                            </button>
                        </div>

                        {/* Active Tasks List */}
                        {inProgressTasks > 0 && (
                            <div className="px-4 pb-4 space-y-2">
                                {empTasks
                                    .filter(t => t.Status === TaskStatus.InProgress || t.Status === TaskStatus.Review)
                                    .slice(0, 5)
                                    .map(task => (
                                        <div
                                            key={task.TaskID}
                                            onClick={() => onTaskClick(task)}
                                            className={`flex items-center justify-between p-2 bg-white rounded-lg border cursor-pointer hover:shadow-sm transition-all ${isOverdue(task) ? 'border-red-200 bg-red-50/50' : 'border-gray-100'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                {task.Status === TaskStatus.Review ? (
                                                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                                ) : (
                                                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                                                )}
                                                <span className={`text-sm truncate ${isOverdue(task) ? 'text-red-700 font-medium' : 'text-gray-700'
                                                    }`}>
                                                    {task.Title}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {task.ProgressPercent !== undefined && (
                                                    <ProgressBadge value={task.ProgressPercent} size="sm" />
                                                )}
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
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                ))}

                {/* Empty State */}
                {resourceData.length === 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                        <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <h4 className="text-gray-500 font-medium mb-1">Chưa có phân công</h4>
                        <p className="text-gray-400 text-sm">
                            Các công việc chưa được giao cho ai. Hãy thêm người phụ trách.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResourceAllocationView;
