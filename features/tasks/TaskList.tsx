import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '../../hooks/useTasks';
import { useProjects } from '../../hooks/useProjects';
import { useEmployees } from '../../hooks/useEmployees';
import { Task, TaskStatus, TaskPriority } from '../../types';
import { getTimelineStepLabel, getPhaseColor, getTimelineStepOptions } from '../../utils/timelineStepUtils';
import {
    Search, Plus, Calendar, User,
    CheckCircle2, Clock, AlertCircle, Trash2, Edit, Briefcase, Layers,
    ExternalLink, BarChart3, ChevronDown
} from 'lucide-react';

// Helper functions for translation and styling
const getPriorityInfo = (p: TaskPriority) => {
    switch (p) {
        case TaskPriority.Urgent: return { label: 'Khẩn cấp', color: 'bg-red-100 text-red-700 border-red-200' };
        case TaskPriority.High: return { label: 'Cao', color: 'bg-orange-100 text-orange-700 border-orange-200' };
        case TaskPriority.Medium: return { label: 'Trung bình', color: 'bg-blue-100 text-blue-700 border-blue-200' };
        case TaskPriority.Low: return { label: 'Thấp', color: 'bg-gray-100 text-gray-700 border-gray-200' };
        default: return { label: p, color: 'bg-gray-100 text-gray-700 border-gray-200' };
    }
};

const getStatusLabel = (s: TaskStatus) => {
    switch (s) {
        case TaskStatus.Todo: return 'Cần làm';
        case TaskStatus.InProgress: return 'Đang thực hiện';
        case TaskStatus.Review: return 'Đang duyệt';
        case TaskStatus.Done: return 'Hoàn thành';
        default: return s;
    }
};

const getStatusIcon = (s: TaskStatus) => {
    switch (s) {
        case TaskStatus.Done: return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
        case TaskStatus.Review: return <AlertCircle className="w-4 h-4 text-purple-500" />;
        case TaskStatus.InProgress: return <Clock className="w-4 h-4 text-blue-500" />;
        default: return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
    }
};

const TaskList: React.FC = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('All');
    const [filterProject, setFilterProject] = useState<string>('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentTask, setCurrentTask] = useState<Partial<Task>>({});
    const [isEditMode, setIsEditMode] = useState(false);

    // Data Hooks
    const { data: tasks = [], isLoading } = useTasks();
    const { projects = [] } = useProjects();
    const { data: employees = [] } = useEmployees();

    // Mutations
    const createTaskMutation = useCreateTask();
    const updateTaskMutation = useUpdateTask();
    const deleteTaskMutation = useDeleteTask();

    // Filter Logic
    const filteredTasks = tasks.filter(task => {
        const matchSearch = task.Title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = filterStatus === 'All' || task.Status === filterStatus;
        const matchProject = filterProject === 'All' || task.ProjectID === filterProject;
        return matchSearch && matchStatus && matchProject;
    });

    // Group Tasks by Project
    const tasksByProject = filteredTasks.reduce((acc, task) => {
        const projectId = task.ProjectID;
        if (!acc[projectId]) {
            acc[projectId] = [];
        }
        acc[projectId].push(task);
        return acc;
    }, {} as Record<string, Task[]>);

    // Helper to get names
    const getProjectName = (id: string) => projects.find(p => p.ProjectID === id)?.ProjectName || id;
    const getAssignee = (id: string) => employees.find(e => e.EmployeeID === id);

    // CRUD Handlers
    const handleDelete = async (id: string) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa công việc này?")) {
            await deleteTaskMutation.mutateAsync(id);
        }
    };

    const openCreateModal = () => {
        setIsEditMode(false);
        setCurrentTask({
            Status: TaskStatus.Todo,
            Priority: TaskPriority.Medium,
            ProjectID: projects[0]?.ProjectID || '',
            AssigneeID: employees[0]?.EmployeeID || '',
            ProgressPercent: 0,
        });
        setIsModalOpen(true);
    };

    const openEditModal = (task: Task) => {
        setIsEditMode(true);
        setCurrentTask({ ...task });
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        const taskToSave = {
            ...currentTask,
            TaskID: currentTask.TaskID || `TSK-${Date.now()}`
        } as Task;

        if (isEditMode) {
            await updateTaskMutation.mutateAsync(taskToSave);
        } else {
            await createTaskMutation.mutateAsync(taskToSave);
        }

        setIsModalOpen(false);
    };

    // Progress bar color helper
    const getProgressColor = (percent: number) => {
        if (percent >= 100) return 'bg-emerald-500';
        if (percent >= 70) return 'bg-blue-500';
        if (percent >= 40) return 'bg-amber-500';
        return 'bg-gray-300';
    };

    // Stats
    const totalTasks = filteredTasks.length;
    const doneTasks = filteredTasks.filter(t => t.Status === TaskStatus.Done).length;
    const inProgressTasks = filteredTasks.filter(t => t.Status === TaskStatus.InProgress).length;
    const overdueTasks = filteredTasks.filter(t => {
        if (t.Status === TaskStatus.Done) return false;
        if (!t.DueDate) return false;
        return new Date(t.DueDate) < new Date();
    }).length;

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-xs text-gray-400 font-medium">Tổng công việc</p>
                    <p className="text-2xl font-black text-gray-800 mt-1">{totalTasks}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-xs text-blue-500 font-medium">Đang thực hiện</p>
                    <p className="text-2xl font-black text-blue-600 mt-1">{inProgressTasks}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-xs text-emerald-500 font-medium">Hoàn thành</p>
                    <p className="text-2xl font-black text-emerald-600 mt-1">{doneTasks}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-xs text-red-500 font-medium">Quá hạn</p>
                    <p className="text-2xl font-black text-red-600 mt-1">{overdueTasks}</p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Tìm tên công việc..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
                    {/* Project Filter */}
                    <select
                        value={filterProject}
                        onChange={(e) => setFilterProject(e.target.value)}
                        className="bg-gray-50 border border-gray-200 text-gray-700 py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm max-w-[200px]"
                    >
                        <option value="All">Tất cả dự án</option>
                        {projects.map(p => (
                            <option key={p.ProjectID} value={p.ProjectID}>{p.ProjectName.substring(0, 30)}...</option>
                        ))}
                    </select>

                    {/* Status Filter */}
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-gray-50 border border-gray-200 text-gray-700 py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                        <option value="All">Tất cả trạng thái</option>
                        <option value={TaskStatus.Todo}>Cần làm</option>
                        <option value={TaskStatus.InProgress}>Đang thực hiện</option>
                        <option value={TaskStatus.Review}>Đang duyệt</option>
                        <option value={TaskStatus.Done}>Hoàn thành</option>
                    </select>

                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Tạo công việc</span>
                    </button>
                </div>
            </div>

            {/* Task List Grouped by Project */}
            <div className="space-y-8">
                {Object.keys(tasksByProject).length > 0 ? (
                    Object.entries(tasksByProject).map(([projectId, projectTasks]: [string, Task[]]) => (
                        <div key={projectId} className="space-y-3">
                            {/* Project Header with link */}
                            <div className="flex items-center gap-2 px-1 group/header">
                                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                                    <Briefcase className="w-4 h-4" />
                                </div>
                                <h3 className="font-bold text-gray-800 text-base">{getProjectName(projectId)}</h3>
                                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                                    {projectTasks.length}
                                </span>
                                {/* Link to Project Detail - Plan tab */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/projects/${projectId}`, { state: { activeTab: 'plan' } });
                                    }}
                                    className="opacity-0 group-hover/header:opacity-100 transition-opacity flex items-center gap-1 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg border border-blue-200"
                                    title="Xem kế hoạch dự án"
                                >
                                    <ExternalLink className="w-3 h-3" />
                                    Kế hoạch
                                </button>
                            </div>

                            {/* Tasks Grid */}
                            <div className="grid grid-cols-1 gap-3">
                                {projectTasks.map(task => {
                                    const assignee = getAssignee(task.AssigneeID);
                                    const priorityInfo = getPriorityInfo(task.Priority);
                                    const progress = task.ProgressPercent || (task.Status === TaskStatus.Done ? 100 : 0);
                                    const stepLabel = getTimelineStepLabel(task.TimelineStep);
                                    const phaseColor = getPhaseColor(task.TimelineStep);
                                    const isOverdue = task.Status !== TaskStatus.Done && task.DueDate && new Date(task.DueDate) < new Date();

                                    return (
                                        <div
                                            key={task.TaskID}
                                            onClick={() => navigate(`/tasks/${task.TaskID}`)}
                                            className={`bg-white p-4 rounded-xl border shadow-sm hover:shadow-md hover:border-blue-200 cursor-pointer transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group relative ${isOverdue ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-2">
                                                    {getStatusIcon(task.Status)}
                                                    <h3 className={`font-bold line-clamp-1 group-hover:text-blue-600 transition-colors ${task.Status === TaskStatus.Done ? 'text-gray-400 line-through' : isOverdue ? 'text-red-700' : 'text-gray-800'}`}>{task.Title}</h3>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded border ${priorityInfo.color} font-medium uppercase shrink-0`}>
                                                        {priorityInfo.label}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 mb-2 line-clamp-1">{task.Description}</p>
                                                <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                                                    {task.TimelineStep && (
                                                        <span className={`flex items-center gap-1 px-2 py-1 rounded border ${phaseColor.bg} ${phaseColor.text} ${phaseColor.border}`}>
                                                            <Layers className="w-3 h-3" />
                                                            {stepLabel}
                                                        </span>
                                                    )}
                                                    {/* Progress Bar */}
                                                    <div className="flex items-center gap-2 min-w-[120px]">
                                                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all ${getProgressColor(progress)}`}
                                                                style={{ width: `${progress}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-[10px] font-bold text-gray-500 w-8 text-right">{progress}%</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                                                <div className="flex items-center gap-2 min-w-[140px]">
                                                    {assignee && (
                                                        <>
                                                            <img src={assignee.AvatarUrl} alt={assignee.FullName} className="w-8 h-8 rounded-full border border-gray-200" />
                                                            <div>
                                                                <p className="text-xs font-bold text-gray-700">{assignee.FullName}</p>
                                                                <p className="text-[10px] text-gray-400">{assignee.Department}</p>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                                <div className={`flex items-center gap-1 text-xs font-mono ${isOverdue ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {task.DueDate && new Date(task.DueDate).toLocaleDateString('vi-VN')}
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); openEditModal(task); }}
                                                        className="p-2 hover:bg-gray-100 rounded text-blue-600"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(task.TaskID); }}
                                                        className="p-2 hover:bg-red-50 rounded text-red-500"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <p className="text-gray-500 font-medium">Không tìm thấy công việc nào.</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 sticky top-0 z-10">
                            <h3 className="text-lg font-bold text-gray-800">{isEditMode ? 'Cập nhật công việc' : 'Tạo công việc mới'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tên công việc</label>
                                <input
                                    required
                                    value={currentTask.Title || ''}
                                    onChange={e => setCurrentTask({ ...currentTask, Title: e.target.value })}
                                    type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Nhập tên đầu việc..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả chi tiết</label>
                                <textarea
                                    rows={3}
                                    value={currentTask.Description || ''}
                                    onChange={e => setCurrentTask({ ...currentTask, Description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Mô tả nội dung công việc..."
                                ></textarea>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Dự án</label>
                                    <select
                                        value={currentTask.ProjectID}
                                        onChange={e => setCurrentTask({ ...currentTask, ProjectID: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                    >
                                        {projects.map(p => (
                                            <option key={p.ProjectID} value={p.ProjectID}>{p.ProjectName.substring(0, 30)}...</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Người phụ trách</label>
                                    <select
                                        value={currentTask.AssigneeID}
                                        onChange={e => setCurrentTask({ ...currentTask, AssigneeID: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                    >
                                        {employees.map(e => (
                                            <option key={e.EmployeeID} value={e.EmployeeID}>{e.FullName}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* TimelineStep */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Layers className="inline w-3.5 h-3.5 mr-1" />
                                    Bước thực hiện (Kế hoạch)
                                </label>
                                <select
                                    value={currentTask.TimelineStep || ''}
                                    onChange={e => setCurrentTask({ ...currentTask, TimelineStep: e.target.value || undefined })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                >
                                    <option value="">-- Không chọn --</option>
                                    {(() => {
                                        const options = getTimelineStepOptions();
                                        const groups = Array.from(new Set(options.map(o => o.group)));
                                        return groups.map(group => (
                                            <optgroup key={group} label={group}>
                                                {options.filter(o => o.group === group).map(o => (
                                                    <option key={o.value} value={o.value}>{o.label}</option>
                                                ))}
                                            </optgroup>
                                        ));
                                    })()}
                                </select>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Hạn chót</label>
                                    <input
                                        type="date"
                                        value={currentTask.DueDate || ''}
                                        onChange={e => setCurrentTask({ ...currentTask, DueDate: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                                    <select
                                        value={currentTask.Status}
                                        onChange={e => setCurrentTask({ ...currentTask, Status: e.target.value as TaskStatus })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                    >
                                        {Object.values(TaskStatus).map(s => (
                                            <option key={s} value={s}>{getStatusLabel(s)}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ưu tiên</label>
                                    <select
                                        value={currentTask.Priority}
                                        onChange={e => setCurrentTask({ ...currentTask, Priority: e.target.value as TaskPriority })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                    >
                                        {Object.values(TaskPriority).map(s => (
                                            <option key={s} value={s}>{getPriorityInfo(s).label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Progress */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <BarChart3 className="inline w-3.5 h-3.5 mr-1" />
                                    Tiến độ: <span className="font-bold text-blue-600">{currentTask.ProgressPercent || 0}%</span>
                                </label>
                                <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    step={5}
                                    value={currentTask.ProgressPercent || 0}
                                    onChange={e => setCurrentTask({ ...currentTask, ProgressPercent: parseInt(e.target.value) })}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                                    <span>0%</span>
                                    <span>50%</span>
                                    <span>100%</span>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Hủy</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-lg shadow-blue-200">Lưu lại</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskList;