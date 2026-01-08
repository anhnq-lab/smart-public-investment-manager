import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TaskService } from '../services/taskService';
import { mockTasks, mockProjects, mockEmployees } from '../mockData';
import { Task, TaskStatus, TaskPriority } from '../types';
import {
    Search, Filter, Plus, Calendar, User,
    MoreVertical, CheckCircle2, Clock, AlertCircle, Trash2, Edit, Briefcase, Layers
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
    const [tasks, setTasks] = useState<Task[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentTask, setCurrentTask] = useState<Partial<Task>>({});
    const [isEditMode, setIsEditMode] = useState(false);

    // Load tasks on mount
    useEffect(() => {
        setTasks(TaskService.getAllTasks());
    }, []);

    const refreshTasks = () => {
        setTasks(TaskService.getAllTasks());
    };

    // Filter Logic
    const filteredTasks = tasks.filter(task => {
        const matchSearch = task.Title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = filterStatus === 'All' || task.Status === filterStatus;
        return matchSearch && matchStatus;
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
    const getProjectName = (id: string) => mockProjects.find(p => p.ProjectID === id)?.ProjectName || id;
    const getAssignee = (id: string) => mockEmployees.find(e => e.EmployeeID === id);

    // CRUD Handlers
    const handleDelete = (id: string) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa công việc này?")) {
            TaskService.deleteTask(id);
            refreshTasks();
        }
    };

    const openCreateModal = () => {
        setIsEditMode(false);
        setCurrentTask({
            Status: TaskStatus.Todo,
            Priority: TaskPriority.Medium,
            ProjectID: mockProjects[0].ProjectID,
            AssigneeID: mockEmployees[0].EmployeeID
        });
        setIsModalOpen(true);
    };

    const openEditModal = (task: Task) => {
        setIsEditMode(true);
        setCurrentTask({ ...task });
        setIsModalOpen(true);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();

        const taskToSave = {
            ...currentTask,
            TaskID: currentTask.TaskID || `TSK-${Date.now()}`
        } as Task;

        TaskService.saveTask(taskToSave);
        refreshTasks();
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Tìm tên công việc..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
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
                            {/* Project Header */}
                            <div className="flex items-center gap-2 px-1">
                                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                                    <Briefcase className="w-4 h-4" />
                                </div>
                                <h3 className="font-bold text-gray-800 text-base">{getProjectName(projectId)}</h3>
                                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                                    {projectTasks.length}
                                </span>
                            </div>

                            {/* Tasks Grid */}
                            <div className="grid grid-cols-1 gap-3">
                                {projectTasks.map(task => {
                                    const assignee = getAssignee(task.AssigneeID);
                                    const priorityInfo = getPriorityInfo(task.Priority);
                                    return (
                                        <div
                                            key={task.TaskID}
                                            onClick={() => navigate(`/tasks/${task.TaskID}`)}
                                            className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 cursor-pointer transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group relative"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    {getStatusIcon(task.Status)}
                                                    <h3 className="font-bold text-gray-800 line-clamp-1 group-hover:text-blue-600 transition-colors">{task.Title}</h3>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded border ${priorityInfo.color} font-medium uppercase`}>
                                                        {priorityInfo.label}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 mb-2 line-clamp-2">{task.Description}</p>
                                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                                    {task.TimelineStep && (
                                                        <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                                            <Layers className="w-3 h-3" />
                                                            Bước: {task.TimelineStep}
                                                        </span>
                                                    )}
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
                                                <div className="flex items-center gap-1 text-xs font-mono text-gray-500">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {task.DueDate}
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
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
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
                                        {mockProjects.map(p => (
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
                                        {mockEmployees.map(e => (
                                            <option key={e.EmployeeID} value={e.EmployeeID}>{e.FullName}</option>
                                        ))}
                                    </select>
                                </div>
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