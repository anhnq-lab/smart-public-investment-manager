import React, { useState, useMemo } from 'react';
import { Task, TaskDependency, DependencyType, TaskStatus } from '@/types';
import {
    Link2, Unlink, Plus, ChevronDown, ArrowRight,
    Clock, AlertTriangle, CheckCircle2, X, Info
} from 'lucide-react';

interface TaskDependencyManagerProps {
    task: Task;
    allTasks: Task[];
    onUpdate: (dependencies: TaskDependency[]) => void;
    readOnly?: boolean;
}

const DEPENDENCY_TYPES: { id: DependencyType; label: string; description: string }[] = [
    { id: 'FS', label: 'Kết thúc → Bắt đầu', description: 'Task này bắt đầu sau khi task kia kết thúc' },
    { id: 'SS', label: 'Bắt đầu → Bắt đầu', description: 'Hai task bắt đầu cùng lúc' },
    { id: 'FF', label: 'Kết thúc → Kết thúc', description: 'Hai task kết thúc cùng lúc' },
    { id: 'SF', label: 'Bắt đầu → Kết thúc', description: 'Task này kết thúc khi task kia bắt đầu' },
];

export const TaskDependencyManager: React.FC<TaskDependencyManagerProps> = ({
    task,
    allTasks,
    onUpdate,
    readOnly = false
}) => {
    const [isAdding, setIsAdding] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState<string>('');
    const [selectedType, setSelectedType] = useState<DependencyType>('FS');
    const [lagDays, setLagDays] = useState<number>(0);

    const dependencies = task.Dependencies || [];

    // Get available tasks (exclude self and existing dependencies)
    const availableTasks = useMemo(() => {
        const existingIds = new Set([task.TaskID, ...dependencies.map(d => d.TaskID)]);
        return allTasks.filter(t => !existingIds.has(t.TaskID));
    }, [allTasks, task.TaskID, dependencies]);

    // Get task by ID
    const getTask = (taskId: string): Task | undefined => {
        return allTasks.find(t => t.TaskID === taskId);
    };

    // Check if dependency is blocking (predecessor not done)
    const isBlocking = (dep: TaskDependency): boolean => {
        const predecessor = getTask(dep.TaskID);
        if (!predecessor) return false;

        if (dep.Type === 'FS' || dep.Type === 'SF') {
            return predecessor.Status !== TaskStatus.Done;
        }
        return predecessor.Status === TaskStatus.Todo;
    };

    // Add new dependency
    const handleAdd = () => {
        if (!selectedTaskId) return;

        const newDep: TaskDependency = {
            TaskID: selectedTaskId,
            Type: selectedType,
            LagDays: lagDays !== 0 ? lagDays : undefined
        };

        onUpdate([...dependencies, newDep]);
        setIsAdding(false);
        setSelectedTaskId('');
        setSelectedType('FS');
        setLagDays(0);
    };

    // Remove dependency
    const handleRemove = (taskId: string) => {
        onUpdate(dependencies.filter(d => d.TaskID !== taskId));
    };

    // Update dependency type
    const handleTypeChange = (taskId: string, newType: DependencyType) => {
        onUpdate(dependencies.map(d =>
            d.TaskID === taskId ? { ...d, Type: newType } : d
        ));
    };

    // Get status icon for task
    const getStatusIcon = (status: TaskStatus) => {
        switch (status) {
            case TaskStatus.Done:
                return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
            case TaskStatus.InProgress:
            case TaskStatus.Review:
                return <Clock className="w-4 h-4 text-orange-500" />;
            default:
                return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
        }
    };

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-gray-500" />
                    <h4 className="font-bold text-sm text-gray-700">Phụ thuộc</h4>
                    {dependencies.length > 0 && (
                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded">
                            {dependencies.length}
                        </span>
                    )}
                </div>
                {!readOnly && !isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                        <Plus className="w-3 h-3" />
                        Thêm
                    </button>
                )}
            </div>

            {/* Dependencies List */}
            {dependencies.length > 0 ? (
                <div className="space-y-2">
                    {dependencies.map(dep => {
                        const predecessor = getTask(dep.TaskID);
                        if (!predecessor) return null;

                        const blocking = isBlocking(dep);

                        return (
                            <div
                                key={dep.TaskID}
                                className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${blocking
                                        ? 'bg-amber-50 border-amber-200'
                                        : 'bg-gray-50 border-gray-200'
                                    }`}
                            >
                                {/* Status Icon */}
                                {getStatusIcon(predecessor.Status)}

                                {/* Task Title */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-700 truncate">{predecessor.Title}</p>
                                    {blocking && (
                                        <p className="text-[10px] text-amber-600 flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3" />
                                            Đang chặn task này
                                        </p>
                                    )}
                                </div>

                                {/* Dependency Type */}
                                {!readOnly ? (
                                    <select
                                        value={dep.Type}
                                        onChange={(e) => handleTypeChange(dep.TaskID, e.target.value as DependencyType)}
                                        className="text-[10px] px-1.5 py-1 border border-gray-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                        {DEPENDENCY_TYPES.map(type => (
                                            <option key={type.id} value={type.id}>
                                                {type.id}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                                        {dep.Type}
                                    </span>
                                )}

                                {/* Lag Days */}
                                {dep.LagDays !== undefined && dep.LagDays !== 0 && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${dep.LagDays > 0
                                            ? 'bg-orange-100 text-orange-700'
                                            : 'bg-blue-100 text-blue-700'
                                        }`}>
                                        {dep.LagDays > 0 ? `+${dep.LagDays}` : dep.LagDays} ngày
                                    </span>
                                )}

                                {/* Remove Button */}
                                {!readOnly && (
                                    <button
                                        onClick={() => handleRemove(dep.TaskID)}
                                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                        title="Xóa phụ thuộc"
                                    >
                                        <Unlink className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : !isAdding && (
                <div className="text-center py-4 text-gray-400 text-sm">
                    <Link2 className="w-6 h-6 mx-auto mb-1 opacity-30" />
                    <p>Không có phụ thuộc</p>
                </div>
            )}

            {/* Add Form */}
            {isAdding && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                        <h5 className="text-xs font-bold text-blue-800">Thêm phụ thuộc</h5>
                        <button
                            onClick={() => setIsAdding(false)}
                            className="text-blue-400 hover:text-blue-600"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Task Select */}
                    <div>
                        <label className="text-[10px] text-blue-600 font-medium mb-1 block">
                            Công việc tiền quyết
                        </label>
                        <select
                            value={selectedTaskId}
                            onChange={(e) => setSelectedTaskId(e.target.value)}
                            className="w-full text-sm px-2 py-1.5 border border-blue-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">-- Chọn công việc --</option>
                            {availableTasks.map(t => (
                                <option key={t.TaskID} value={t.TaskID}>
                                    {t.Title}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Type + Lag Row */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-[10px] text-blue-600 font-medium mb-1 block">
                                Loại phụ thuộc
                            </label>
                            <select
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value as DependencyType)}
                                className="w-full text-sm px-2 py-1.5 border border-blue-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {DEPENDENCY_TYPES.map(type => (
                                    <option key={type.id} value={type.id}>
                                        {type.id} - {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] text-blue-600 font-medium mb-1 block">
                                Độ trễ (ngày)
                            </label>
                            <input
                                type="number"
                                value={lagDays}
                                onChange={(e) => setLagDays(parseInt(e.target.value) || 0)}
                                className="w-full text-sm px-2 py-1.5 border border-blue-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="0"
                            />
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex items-start gap-2 text-[10px] text-blue-600 bg-blue-100/50 p-2 rounded">
                        <Info className="w-3 h-3 shrink-0 mt-0.5" />
                        <p>
                            {DEPENDENCY_TYPES.find(t => t.id === selectedType)?.description}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setIsAdding(false)}
                            className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleAdd}
                            disabled={!selectedTaskId}
                            className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Thêm
                        </button>
                    </div>
                </div>
            )}

            {/* Critical Path Info */}
            {task.IsCritical && (
                <div className="flex items-center gap-2 p-2 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-700">
                    <ArrowRight className="w-4 h-4" />
                    <span className="font-medium">Nằm trên Critical Path</span>
                    {task.Slack !== undefined && (
                        <span className="ml-auto text-purple-500">
                            Slack: {task.Slack} ngày
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export default TaskDependencyManager;
