import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '../../hooks/useTasks';
import { useProjects } from '../../hooks/useProjects';
import { useEmployees } from '../../hooks/useEmployees';
import { Task, TaskStatus, TaskPriority } from '../../types';
import { getTimelineStepLabel, getPhaseColor, getTimelineStepOptions } from '../../utils/timelineStepUtils';
import {
    Search, Plus, Calendar, User, CheckCircle2, Clock, AlertCircle,
    Trash2, Edit, Briefcase, Layers, ExternalLink, BarChart3, ChevronDown,
    ListTodo, LayoutGrid, Filter, TrendingUp, Target, AlertTriangle,
    ArrowUpRight, Sparkles, FolderOpen, X
} from 'lucide-react';

// ═══════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════

const getPriorityInfo = (p: TaskPriority) => {
    switch (p) {
        case TaskPriority.Urgent: return { label: 'KHẨN CẤP', color: 'bg-red-500/10 text-red-600 ring-1 ring-red-500/20', dot: 'bg-red-500' };
        case TaskPriority.High: return { label: 'CAO', color: 'bg-orange-500/10 text-orange-600 ring-1 ring-orange-500/20', dot: 'bg-orange-500' };
        case TaskPriority.Medium: return { label: 'TRUNG BÌNH', color: 'bg-sky-500/10 text-sky-600 ring-1 ring-sky-500/20', dot: 'bg-sky-500' };
        case TaskPriority.Low: return { label: 'THẤP', color: 'bg-slate-500/10 text-slate-500 ring-1 ring-slate-500/20', dot: 'bg-slate-400' };
        default: return { label: p, color: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400' };
    }
};

const getStatusInfo = (s: TaskStatus) => {
    switch (s) {
        case TaskStatus.Done: return { label: 'Hoàn thành', color: 'text-emerald-600', bg: 'bg-emerald-500', ring: 'ring-emerald-500/30', icon: <CheckCircle2 className="w-4 h-4" /> };
        case TaskStatus.Review: return { label: 'Chờ duyệt', color: 'text-violet-600', bg: 'bg-violet-500', ring: 'ring-violet-500/30', icon: <AlertCircle className="w-4 h-4" /> };
        case TaskStatus.InProgress: return { label: 'Đang thực hiện', color: 'text-blue-600', bg: 'bg-blue-500', ring: 'ring-blue-500/30', icon: <Clock className="w-4 h-4" /> };
        default: return { label: 'Cần làm', color: 'text-slate-500', bg: 'bg-slate-300', ring: 'ring-slate-300/30', icon: <div className="w-4 h-4 rounded-full border-2 border-slate-300" /> };
    }
};

const getProgressGradient = (percent: number) => {
    if (percent >= 100) return 'from-emerald-400 to-emerald-600';
    if (percent >= 70) return 'from-blue-400 to-blue-600';
    if (percent >= 40) return 'from-amber-400 to-amber-500';
    if (percent > 0) return 'from-slate-300 to-slate-400';
    return 'from-slate-200 to-slate-200';
};

// ═══════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════

const TaskList: React.FC = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('All');
    const [filterProject, setFilterProject] = useState<string>('All');
    const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentTask, setCurrentTask] = useState<Partial<Task>>({});
    const [isEditMode, setIsEditMode] = useState(false);

    // Data
    const { data: tasks = [], isLoading } = useTasks();
    const { projects = [] } = useProjects();
    const { data: employees = [] } = useEmployees();

    // Mutations
    const createTaskMutation = useCreateTask();
    const updateTaskMutation = useUpdateTask();
    const deleteTaskMutation = useDeleteTask();

    // ── Filter ──
    const filteredTasks = useMemo(() => tasks.filter(task => {
        const matchSearch = task.Title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.Description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = filterStatus === 'All' || task.Status === filterStatus;
        const matchProject = filterProject === 'All' || task.ProjectID === filterProject;
        return matchSearch && matchStatus && matchProject;
    }), [tasks, searchTerm, filterStatus, filterProject]);

    // ── Group by project ──
    const tasksByProject = useMemo(() =>
        filteredTasks.reduce((acc, task) => {
            const pid = task.ProjectID;
            if (!acc[pid]) acc[pid] = [];
            acc[pid].push(task);
            return acc;
        }, {} as Record<string, Task[]>)
        , [filteredTasks]);

    // ── Stats ──
    const stats = useMemo(() => {
        const now = new Date();
        return {
            total: filteredTasks.length,
            inProgress: filteredTasks.filter(t => t.Status === TaskStatus.InProgress).length,
            done: filteredTasks.filter(t => t.Status === TaskStatus.Done).length,
            overdue: filteredTasks.filter(t => t.Status !== TaskStatus.Done && t.DueDate && new Date(t.DueDate) < now).length,
            review: filteredTasks.filter(t => t.Status === TaskStatus.Review).length,
            completion: filteredTasks.length > 0
                ? Math.round((filteredTasks.filter(t => t.Status === TaskStatus.Done).length / filteredTasks.length) * 100)
                : 0,
        };
    }, [filteredTasks]);

    // ── Helpers ──
    const getProjectName = (id: string) => projects.find(p => p.ProjectID === id)?.ProjectName || id;
    const getAssignee = (id: string) => employees.find(e => e.EmployeeID === id);

    // ── CRUD handlers ──
    const handleDelete = async (id: string) => {
        if (window.confirm("Xóa công việc này?")) {
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
        const taskToSave = { ...currentTask, TaskID: currentTask.TaskID || `TSK-${Date.now()}` } as Task;
        if (isEditMode) await updateTaskMutation.mutateAsync(taskToSave);
        else await createTaskMutation.mutateAsync(taskToSave);
        setIsModalOpen(false);
    };

    const hasActiveFilters = filterStatus !== 'All' || filterProject !== 'All' || searchTerm !== '';

    // ═══════════════════════════════════════════════════
    // Render
    // ═══════════════════════════════════════════════════
    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* ══════════ STATS DASHBOARD ══════════ */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Total */}
                <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
                            <Target className="w-5 h-5 text-white/80" />
                        </div>
                        <span className="text-xs font-medium text-white/60 uppercase tracking-wider">Tổng công việc</span>
                    </div>
                    <p className="text-4xl font-black">{stats.total}</p>
                    <div className="mt-3 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-700"
                                style={{ width: `${stats.completion}%` }}
                            />
                        </div>
                        <span className="text-xs font-bold text-emerald-400">{stats.completion}%</span>
                    </div>
                </div>

                {/* In Progress */}
                <div className="bg-white rounded-2xl p-5 border border-blue-100 hover:border-blue-200 transition-colors group cursor-pointer"
                    onClick={() => setFilterStatus(filterStatus === TaskStatus.InProgress ? 'All' : TaskStatus.InProgress)}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
                            <TrendingUp className="w-4 h-4 text-blue-600" />
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-3xl font-black text-blue-600">{stats.inProgress}</p>
                    <p className="text-xs font-medium text-slate-400 mt-1">Đang thực hiện</p>
                </div>

                {/* Review */}
                <div className="bg-white rounded-2xl p-5 border border-violet-100 hover:border-violet-200 transition-colors group cursor-pointer"
                    onClick={() => setFilterStatus(filterStatus === TaskStatus.Review ? 'All' : TaskStatus.Review)}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-violet-50 rounded-xl group-hover:bg-violet-100 transition-colors">
                            <AlertCircle className="w-4 h-4 text-violet-600" />
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-3xl font-black text-violet-600">{stats.review}</p>
                    <p className="text-xs font-medium text-slate-400 mt-1">Chờ duyệt</p>
                </div>

                {/* Done */}
                <div className="bg-white rounded-2xl p-5 border border-emerald-100 hover:border-emerald-200 transition-colors group cursor-pointer"
                    onClick={() => setFilterStatus(filterStatus === TaskStatus.Done ? 'All' : TaskStatus.Done)}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-emerald-50 rounded-xl group-hover:bg-emerald-100 transition-colors">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-3xl font-black text-emerald-600">{stats.done}</p>
                    <p className="text-xs font-medium text-slate-400 mt-1">Hoàn thành</p>
                </div>

                {/* Overdue */}
                <div className="bg-white rounded-2xl p-5 border border-red-100 hover:border-red-200 transition-colors group cursor-pointer"
                    onClick={() => { /* custom overdue filter logic */ }}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-red-50 rounded-xl group-hover:bg-red-100 transition-colors">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                        </div>
                        {stats.overdue > 0 && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                    </div>
                    <p className="text-3xl font-black text-red-600">{stats.overdue}</p>
                    <p className="text-xs font-medium text-slate-400 mt-1">Quá hạn</p>
                </div>
            </div>

            {/* ══════════ TOOLBAR ══════════ */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="p-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    {/* Left: Search + Filters */}
                    <div className="flex items-center gap-3 flex-wrap flex-1 w-full lg:w-auto">
                        <div className="relative flex-1 min-w-[240px] max-w-[360px]">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm công việc..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 placeholder:text-slate-400 transition-all"
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        <div className="relative">
                            <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
                            <select
                                value={filterProject}
                                onChange={(e) => setFilterProject(e.target.value)}
                                className="pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 appearance-none cursor-pointer transition-all max-w-[220px]"
                            >
                                <option value="All">Tất cả dự án</option>
                                {projects.map(p => (
                                    <option key={p.ProjectID} value={p.ProjectID}>{p.ProjectName.substring(0, 28)}...</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
                        </div>

                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 appearance-none cursor-pointer transition-all"
                            >
                                <option value="All">Tất cả trạng thái</option>
                                <option value={TaskStatus.Todo}>Cần làm</option>
                                <option value={TaskStatus.InProgress}>Đang thực hiện</option>
                                <option value={TaskStatus.Review}>Chờ duyệt</option>
                                <option value={TaskStatus.Done}>Hoàn thành</option>
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
                        </div>

                        {hasActiveFilters && (
                            <button
                                onClick={() => { setSearchTerm(''); setFilterStatus('All'); setFilterProject('All'); }}
                                className="text-xs text-slate-500 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                            >
                                Xóa bộ lọc
                            </button>
                        )}
                    </div>

                    {/* Right: View toggle + Create */}
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center bg-slate-100 rounded-xl p-1">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <ListTodo className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('board')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'board' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                        </div>

                        <button
                            onClick={openCreateModal}
                            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-600/25 active:scale-[0.98]"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Tạo công việc</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* ══════════ TASK LIST ══════════ */}
            {viewMode === 'list' ? (
                <div className="space-y-8">
                    {Object.keys(tasksByProject).length > 0 ? (
                        Object.entries(tasksByProject).map(([projectId, projectTasks]: [string, Task[]]) => (
                            <div key={projectId} className="space-y-1">
                                {/* ── Project Group Header ── */}
                                <div className="flex items-center gap-3 px-2 py-2 group/header">
                                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-sm">
                                        <Briefcase className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-bold text-slate-800 truncate">{getProjectName(projectId)}</h3>
                                        <p className="text-[10px] text-slate-400 mt-0.5">{projectTasks.length} công việc</p>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); navigate(`/projects/${projectId}`, { state: { activeTab: 'plan' } }); }}
                                        className="opacity-0 group-hover/header:opacity-100 transition-all flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-medium"
                                    >
                                        <ExternalLink className="w-3 h-3" />
                                        Xem kế hoạch
                                    </button>
                                </div>

                                {/* ── Task Table ── */}
                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-slate-100">
                                                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-12"></th>
                                                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Công việc</th>
                                                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell w-44">Bước thực hiện</th>
                                                <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider w-24">Tiến độ</th>
                                                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell w-40">Phụ trách</th>
                                                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:table-cell w-28">Hạn chót</th>
                                                <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider w-24">Ưu tiên</th>
                                                <th className="px-4 py-3 w-20"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {projectTasks.map(task => {
                                                const assignee = getAssignee(task.AssigneeID);
                                                const priorityInfo = getPriorityInfo(task.Priority);
                                                const statusInfo = getStatusInfo(task.Status);
                                                const progress = task.ProgressPercent || (task.Status === TaskStatus.Done ? 100 : 0);
                                                const stepLabel = getTimelineStepLabel(task.TimelineStep);
                                                const phaseColor = getPhaseColor(task.TimelineStep);
                                                const isOverdue = task.Status !== TaskStatus.Done && task.DueDate && new Date(task.DueDate) < new Date();

                                                return (
                                                    <tr
                                                        key={task.TaskID}
                                                        onClick={() => navigate(`/tasks/${task.TaskID}`)}
                                                        className={`group cursor-pointer transition-all hover:bg-slate-50/80 ${isOverdue ? 'bg-red-50/40' : ''}`}
                                                    >
                                                        {/* Status */}
                                                        <td className="px-4 py-3.5">
                                                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${statusInfo.bg}/10 ${statusInfo.color}`}>
                                                                {statusInfo.icon}
                                                            </div>
                                                        </td>

                                                        {/* Title + Description */}
                                                        <td className="px-4 py-3.5">
                                                            <div className="flex items-center gap-2 mb-0.5">
                                                                <h4 className={`text-sm font-semibold group-hover:text-blue-600 transition-colors line-clamp-1 ${task.Status === TaskStatus.Done ? 'text-slate-400 line-through' : isOverdue ? 'text-red-700' : 'text-slate-800'
                                                                    }`}>
                                                                    {task.Title}
                                                                </h4>
                                                                {task.IsCritical && (
                                                                    <span className="shrink-0 text-[8px] font-black text-red-600 bg-red-100 px-1.5 py-0.5 rounded-md uppercase">Găng</span>
                                                                )}
                                                            </div>
                                                            {task.Description && (
                                                                <p className="text-xs text-slate-400 line-clamp-1 max-w-[300px]">{task.Description}</p>
                                                            )}
                                                        </td>

                                                        {/* TimelineStep */}
                                                        <td className="px-4 py-3.5 hidden md:table-cell">
                                                            {task.TimelineStep ? (
                                                                <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-lg ${phaseColor.bg} ${phaseColor.text} ring-1 ${phaseColor.border}`}>
                                                                    <Layers className="w-3 h-3" />
                                                                    <span className="line-clamp-1 max-w-[120px]">{stepLabel}</span>
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] text-slate-300">—</span>
                                                            )}
                                                        </td>

                                                        {/* Progress */}
                                                        <td className="px-4 py-3.5">
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full rounded-full bg-gradient-to-r ${getProgressGradient(progress)} transition-all duration-500`}
                                                                        style={{ width: `${progress}%` }}
                                                                    />
                                                                </div>
                                                                <span className={`text-[10px] font-bold tabular-nums w-7 text-right ${progress >= 100 ? 'text-emerald-600' : progress >= 70 ? 'text-blue-600' : 'text-slate-400'
                                                                    }`}>{progress}%</span>
                                                            </div>
                                                        </td>

                                                        {/* Assignee */}
                                                        <td className="px-4 py-3.5 hidden lg:table-cell">
                                                            {assignee ? (
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className="relative">
                                                                        <img
                                                                            src={assignee.AvatarUrl || `https://ui-avatars.com/api/?name=${assignee.FullName}&background=6366f1&color=fff&size=32`}
                                                                            alt=""
                                                                            className="w-7 h-7 rounded-full ring-2 ring-white shadow-sm object-cover"
                                                                        />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-xs font-medium text-slate-700 truncate">{assignee.FullName}</p>
                                                                        <p className="text-[10px] text-slate-400 truncate">{assignee.Position || assignee.Department}</p>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <span className="text-[10px] text-slate-300 italic">Chưa gán</span>
                                                            )}
                                                        </td>

                                                        {/* Due */}
                                                        <td className="px-4 py-3.5 hidden sm:table-cell">
                                                            {task.DueDate ? (
                                                                <div className={`flex items-center gap-1.5 text-xs ${isOverdue ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
                                                                    <Calendar className="w-3 h-3 shrink-0" />
                                                                    {new Date(task.DueDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                                    {isOverdue && <AlertTriangle className="w-3 h-3 text-red-500 animate-pulse" />}
                                                                </div>
                                                            ) : (
                                                                <span className="text-[10px] text-slate-300">—</span>
                                                            )}
                                                        </td>

                                                        {/* Priority */}
                                                        <td className="px-4 py-3.5 text-center">
                                                            <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-md ${priorityInfo.color}`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${priorityInfo.dot}`} />
                                                                {priorityInfo.label}
                                                            </span>
                                                        </td>

                                                        {/* Actions */}
                                                        <td className="px-4 py-3.5">
                                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); openEditModal(task); }}
                                                                    className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                                                                    title="Chỉnh sửa"
                                                                >
                                                                    <Edit className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleDelete(task.TaskID); }}
                                                                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                                                                    title="Xóa"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Sparkles className="w-6 h-6 text-slate-300" />
                            </div>
                            <p className="text-slate-500 font-medium">Không tìm thấy công việc nào.</p>
                            <p className="text-xs text-slate-400 mt-1">Thử thay đổi bộ lọc hoặc tạo công việc mới.</p>
                        </div>
                    )}
                </div>
            ) : (
                /* ══════════ BOARD VIEW (Kanban-like columns) ══════════ */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {[TaskStatus.Todo, TaskStatus.InProgress, TaskStatus.Review, TaskStatus.Done].map(status => {
                        const statusInfo = getStatusInfo(status);
                        const statusTasks = filteredTasks.filter(t => t.Status === status);
                        return (
                            <div key={status} className="space-y-3">
                                <div className="flex items-center gap-2 px-1">
                                    <div className={`w-2 h-2 rounded-full ${statusInfo.bg}`} />
                                    <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">{statusInfo.label}</h4>
                                    <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full font-bold">{statusTasks.length}</span>
                                </div>
                                <div className="space-y-2 min-h-[200px]">
                                    {statusTasks.map(task => {
                                        const assignee = getAssignee(task.AssigneeID);
                                        const priorityInfo = getPriorityInfo(task.Priority);
                                        const progress = task.ProgressPercent || (task.Status === TaskStatus.Done ? 100 : 0);
                                        const isOverdue = task.Status !== TaskStatus.Done && task.DueDate && new Date(task.DueDate) < new Date();

                                        return (
                                            <div
                                                key={task.TaskID}
                                                onClick={() => navigate(`/tasks/${task.TaskID}`)}
                                                className={`bg-white rounded-xl border p-4 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group ${isOverdue ? 'border-red-200 bg-red-50/30' : 'border-slate-100'}`}
                                            >
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <h4 className={`text-sm font-semibold line-clamp-2 group-hover:text-blue-600 transition-colors ${task.Status === TaskStatus.Done ? 'text-slate-400 line-through' : 'text-slate-800'
                                                        }`}>{task.Title}</h4>
                                                    <span className={`shrink-0 w-1.5 h-1.5 rounded-full mt-1.5 ${priorityInfo.dot}`} />
                                                </div>

                                                {/* Progress */}
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full bg-gradient-to-r ${getProgressGradient(progress)} transition-all`}
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-400">{progress}%</span>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    {assignee ? (
                                                        <img
                                                            src={assignee.AvatarUrl || `https://ui-avatars.com/api/?name=${assignee.FullName}&background=6366f1&color=fff&size=24`}
                                                            alt=""
                                                            className="w-6 h-6 rounded-full ring-2 ring-white shadow-sm"
                                                        />
                                                    ) : <div className="w-6" />}
                                                    {task.DueDate && (
                                                        <span className={`text-[10px] flex items-center gap-1 ${isOverdue ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(task.DueDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {statusTasks.length === 0 && (
                                        <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-xl text-xs text-slate-300">
                                            Không có công việc
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ══════════ MODAL ══════════ */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto ring-1 ring-black/5">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white sticky top-0 z-10">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">{isEditMode ? 'Cập nhật công việc' : 'Tạo công việc mới'}</h3>
                                <p className="text-xs text-slate-400 mt-0.5">{isEditMode ? 'Chỉnh sửa thông tin' : 'Điền thông tin để tạo công việc'}</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-5">
                            {/* Title */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Tên công việc *</label>
                                <input
                                    required
                                    value={currentTask.Title || ''}
                                    onChange={e => setCurrentTask({ ...currentTask, Title: e.target.value })}
                                    type="text"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-sm font-medium placeholder:text-slate-400 transition-all"
                                    placeholder="Nhập tên đầu việc..."
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Mô tả</label>
                                <textarea
                                    rows={3}
                                    value={currentTask.Description || ''}
                                    onChange={e => setCurrentTask({ ...currentTask, Description: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-sm placeholder:text-slate-400 transition-all resize-none"
                                    placeholder="Mô tả nội dung công việc..."
                                />
                            </div>

                            {/* Project + Assignee */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Dự án</label>
                                    <select
                                        value={currentTask.ProjectID}
                                        onChange={e => setCurrentTask({ ...currentTask, ProjectID: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                                    >
                                        {projects.map(p => (
                                            <option key={p.ProjectID} value={p.ProjectID}>{p.ProjectName.substring(0, 28)}...</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Phụ trách</label>
                                    <select
                                        value={currentTask.AssigneeID}
                                        onChange={e => setCurrentTask({ ...currentTask, AssigneeID: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                                    >
                                        {employees.map(e => (
                                            <option key={e.EmployeeID} value={e.EmployeeID}>{e.FullName}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* TimelineStep */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                                    <Layers className="w-3 h-3" /> Bước thực hiện
                                </label>
                                <select
                                    value={currentTask.TimelineStep || ''}
                                    onChange={e => setCurrentTask({ ...currentTask, TimelineStep: e.target.value || undefined })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
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

                            {/* Date + Status + Priority */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Hạn chót</label>
                                    <input
                                        type="date"
                                        value={currentTask.DueDate || ''}
                                        onChange={e => setCurrentTask({ ...currentTask, DueDate: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Trạng thái</label>
                                    <select
                                        value={currentTask.Status}
                                        onChange={e => setCurrentTask({ ...currentTask, Status: e.target.value as TaskStatus })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                                    >
                                        {Object.values(TaskStatus).map(s => (
                                            <option key={s} value={s}>{getStatusInfo(s).label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Ưu tiên</label>
                                    <select
                                        value={currentTask.Priority}
                                        onChange={e => setCurrentTask({ ...currentTask, Priority: e.target.value as TaskPriority })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                                    >
                                        {Object.values(TaskPriority).map(s => (
                                            <option key={s} value={s}>{getPriorityInfo(s).label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Progress */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                                        <BarChart3 className="w-3 h-3" /> Tiến độ
                                    </label>
                                    <span className="text-sm font-black text-blue-600">{currentTask.ProgressPercent || 0}%</span>
                                </div>
                                <div className="relative">
                                    <input
                                        type="range"
                                        min={0}
                                        max={100}
                                        step={5}
                                        value={currentTask.ProgressPercent || 0}
                                        onChange={e => setCurrentTask({ ...currentTask, ProgressPercent: parseInt(e.target.value) })}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    />
                                    <div className="flex justify-between text-[9px] text-slate-300 mt-1 px-0.5">
                                        <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl shadow-lg shadow-blue-600/25 transition-all active:scale-[0.98]"
                                >
                                    {isEditMode ? 'Lưu thay đổi' : 'Tạo công việc'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskList;