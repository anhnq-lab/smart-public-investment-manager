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
                <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-3 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full -translate-y-6 translate-x-6" />
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
                            <Target className="w-4 h-4 text-white/80" />
                        </div>
                        <span className="text-[10px] font-medium text-white/80 uppercase tracking-wider">Tổng công việc</span>
                    </div>
                    <p className="text-2xl font-black">{stats.total}</p>
                    <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-700"
                                style={{ width: `${stats.completion}%` }}
                            />
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400">{stats.completion}%</span>
                    </div>
                </div>

                {/* In Progress */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 text-white p-3 shadow-lg ring-1 ring-blue-400/30 transition-all duration-200 cursor-pointer"
                    onClick={() => setFilterStatus(filterStatus === TaskStatus.InProgress ? 'All' : TaskStatus.InProgress)}>
                    <div className="absolute -right-2 -top-2 opacity-[0.12]">
                        <TrendingUp className="w-16 h-16" strokeWidth={1.2} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-white/90">Đang thực hiện</p>
                        <p className="text-xl font-black mt-1 tracking-tight drop-shadow-sm">{stats.inProgress}</p>
                    </div>
                </div>

                {/* Review */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-500 via-violet-600 to-purple-700 text-white p-3 shadow-lg ring-1 ring-violet-400/30 transition-all duration-200 cursor-pointer"
                    onClick={() => setFilterStatus(filterStatus === TaskStatus.Review ? 'All' : TaskStatus.Review)}>
                    <div className="absolute -right-2 -top-2 opacity-[0.12]">
                        <AlertCircle className="w-16 h-16" strokeWidth={1.2} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-white/90">Chờ duyệt</p>
                        <p className="text-xl font-black mt-1 tracking-tight drop-shadow-sm">{stats.review}</p>
                    </div>
                </div>

                {/* Done */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 text-white p-3 shadow-lg ring-1 ring-emerald-400/30 transition-all duration-200 cursor-pointer"
                    onClick={() => setFilterStatus(filterStatus === TaskStatus.Done ? 'All' : TaskStatus.Done)}>
                    <div className="absolute -right-2 -top-2 opacity-[0.12]">
                        <CheckCircle2 className="w-16 h-16" strokeWidth={1.2} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-white/90">Hoàn thành</p>
                        <p className="text-xl font-black mt-1 tracking-tight drop-shadow-sm">{stats.done}</p>
                    </div>
                </div>

                {/* Overdue */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-red-500 via-red-600 to-rose-700 text-white p-3 shadow-lg ring-1 ring-red-400/30 transition-all duration-200 cursor-pointer"
                    onClick={() => { /* custom overdue filter logic */ }}>
                    <div className="absolute -right-2 -top-2 opacity-[0.12]">
                        <AlertTriangle className="w-16 h-16" strokeWidth={1.2} />
                    </div>
                    {stats.overdue > 0 && (
                        <div className="absolute top-2 right-2">
                            <span className="flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-50"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white/70"></span>
                            </span>
                        </div>
                    )}
                    <div className="relative z-10">
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-white/90">Quá hạn</p>
                        <p className="text-xl font-black mt-1 tracking-tight drop-shadow-sm">{stats.overdue}</p>
                    </div>
                </div>
            </div>

            {/* ══════════ TOOLBAR ══════════ */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
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
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
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
                                className="pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 appearance-none cursor-pointer transition-all max-w-[220px]"
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
                                className="pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 appearance-none cursor-pointer transition-all"
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
                        <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-xl p-1">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-700 dark:text-slate-200' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                            >
                                <ListTodo className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('board')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'board' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-700 dark:text-slate-200' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
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
                <div className="space-y-0">
                    {Object.keys(tasksByProject).length > 0 ? (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-x-auto overflow-y-auto max-h-[calc(100vh-280px)]">
                            <table className="w-full">
                                <thead>
                                    <tr className="table-header-row">
                                        <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest w-12"></th>
                                        <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest max-w-[280px]">Công việc</th>
                                        <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest hidden md:table-cell w-44">Bước thực hiện</th>
                                        <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest w-24">Tiến độ</th>
                                        <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest hidden lg:table-cell w-40">Phụ trách</th>
                                        <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest hidden sm:table-cell w-28">Hạn chót</th>
                                        <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest w-24">Ưu tiên</th>
                                        <th className="px-4 py-3 w-20"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                                    {Object.entries(tasksByProject).map(([projectId, projectTasks]: [string, Task[]]) => (
                                        <React.Fragment key={projectId}>
                                            {/* ── Project Group Separator ── */}
                                            <tr className="bg-slate-50/80 dark:bg-slate-700/30 border-t-2 border-slate-200 dark:border-slate-600">
                                                <td colSpan={8} className="px-4 py-2.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-sm">
                                                            <Briefcase className="w-3.5 h-3.5 text-white" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{getProjectName(projectId)}</h3>
                                                            <p className="text-[10px] text-slate-400 dark:text-slate-500">{projectTasks.length} công việc</p>
                                                        </div>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); navigate(`/projects/${projectId}`, { state: { activeTab: 'plan' } }); }}
                                                            className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-medium transition-colors"
                                                        >
                                                            <ExternalLink className="w-3 h-3" />
                                                            Xem kế hoạch
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {/* ── Tasks for this project ── */}
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
                                                        className={`group cursor-pointer transition-all hover:bg-slate-50/80 dark:hover:bg-slate-700/50 ${isOverdue ? 'bg-red-50/40 dark:bg-red-900/10' : ''}`}
                                                    >
                                                        {/* Status */}
                                                        <td className="px-4 py-3.5">
                                                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${statusInfo.bg}/10 ${statusInfo.color}`}>
                                                                {statusInfo.icon}
                                                            </div>
                                                        </td>

                                                        {/* Title + Description */}
                                                        <td className="px-4 py-3.5 max-w-[280px]">
                                                            <div className="flex items-center gap-2 mb-0.5">
                                                                <h4 className={`text-sm font-semibold group-hover:text-blue-600 transition-colors line-clamp-1 ${task.Status === TaskStatus.Done ? 'text-slate-400' : isOverdue ? 'text-red-700 dark:text-red-400' : 'text-slate-800 dark:text-slate-100'
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
                                                                <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
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
                                                                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{assignee.FullName}</p>
                                                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{assignee.Position || assignee.Department}</p>
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
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                            <div className="w-14 h-14 bg-slate-50 dark:bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Sparkles className="w-6 h-6 text-slate-300 dark:text-slate-500" />
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 font-medium">Không tìm thấy công việc nào.</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Thử thay đổi bộ lọc hoặc tạo công việc mới.</p>
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
                                    <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{statusInfo.label}</h4>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-full font-bold">{statusTasks.length}</span>
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
                                                className={`bg-white dark:bg-slate-800 rounded-xl border p-4 cursor-pointer hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all group ${isOverdue ? 'border-red-200 bg-red-50/30 dark:bg-red-900/10 dark:border-red-900/30' : 'border-slate-100 dark:border-slate-700'}`}
                                            >
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <h4 className={`text-sm font-semibold line-clamp-2 group-hover:text-blue-600 transition-colors ${task.Status === TaskStatus.Done ? 'text-slate-400' : 'text-slate-800 dark:text-slate-100'
                                                        }`}>{task.Title}</h4>
                                                    <span className={`shrink-0 w-1.5 h-1.5 rounded-full mt-1.5 ${priorityInfo.dot}`} />
                                                </div>

                                                {/* Progress */}
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="flex-1 h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
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
                                        <div className="text-center py-8 border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-xl text-xs text-slate-300 dark:text-slate-500">
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
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto ring-1 ring-black/5 dark:ring-slate-700">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800 sticky top-0 z-10">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{isEditMode ? 'Cập nhật công việc' : 'Tạo công việc mới'}</h3>
                                <p className="text-xs text-slate-400 mt-0.5">{isEditMode ? 'Chỉnh sửa thông tin' : 'Điền thông tin để tạo công việc'}</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-5">
                            {/* Title */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Tên công việc *</label>
                                <input
                                    required
                                    value={currentTask.Title || ''}
                                    onChange={e => setCurrentTask({ ...currentTask, Title: e.target.value })}
                                    type="text"
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-sm dark:text-slate-200 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
                                    placeholder="Nhập tên đầu việc..."
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Mô tả</label>
                                <textarea
                                    rows={3}
                                    value={currentTask.Description || ''}
                                    onChange={e => setCurrentTask({ ...currentTask, Description: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-sm dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all resize-none"
                                    placeholder="Mô tả nội dung công việc..."
                                />
                            </div>

                            {/* Project + Assignee */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Dự án</label>
                                    <select
                                        value={currentTask.ProjectID}
                                        onChange={e => setCurrentTask({ ...currentTask, ProjectID: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                                    >
                                        {projects.map(p => (
                                            <option key={p.ProjectID} value={p.ProjectID}>{p.ProjectName.substring(0, 28)}...</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Phụ trách</label>
                                    <select
                                        value={currentTask.AssigneeID}
                                        onChange={e => setCurrentTask({ ...currentTask, AssigneeID: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
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
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
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
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Hạn chót</label>
                                    <input
                                        type="date"
                                        value={currentTask.DueDate || ''}
                                        onChange={e => setCurrentTask({ ...currentTask, DueDate: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Trạng thái</label>
                                    <select
                                        value={currentTask.Status}
                                        onChange={e => setCurrentTask({ ...currentTask, Status: e.target.value as TaskStatus })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                                    >
                                        {Object.values(TaskStatus).map(s => (
                                            <option key={s} value={s}>{getStatusInfo(s).label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Ưu tiên</label>
                                    <select
                                        value={currentTask.Priority}
                                        onChange={e => setCurrentTask({ ...currentTask, Priority: e.target.value as TaskPriority })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
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
                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
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