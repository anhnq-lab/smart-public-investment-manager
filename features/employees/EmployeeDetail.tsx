import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEmployee } from '../../hooks/useEmployees';
import { useTasks } from '../../hooks/useTasks';
import { useProjects } from '../../hooks/useProjects';
import { useContracts } from '../../hooks/useContracts';
import { TaskStatus, TaskPriority, EmployeeStatus, ProjectStatus, Role } from '../../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import {
    ArrowLeft, Mail, Phone, Calendar, Shield, Briefcase, Building2,
    CheckCircle2, Clock, AlertCircle, ClipboardList, FolderOpen,
    FileText, ExternalLink, TrendingUp, Target, User, Hash,
    AlertTriangle, Sparkles
} from 'lucide-react';

// ═══════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════

const getPriorityInfo = (p: TaskPriority) => {
    switch (p) {
        case TaskPriority.Urgent: return { label: 'Khẩn cấp', color: 'bg-red-500/10 text-red-600 ring-1 ring-red-500/20', dot: 'bg-red-500' };
        case TaskPriority.High: return { label: 'Cao', color: 'bg-orange-500/10 text-orange-600 ring-1 ring-orange-500/20', dot: 'bg-orange-500' };
        case TaskPriority.Medium: return { label: 'Trung bình', color: 'bg-sky-500/10 text-sky-600 ring-1 ring-sky-500/20', dot: 'bg-sky-500' };
        case TaskPriority.Low: return { label: 'Thấp', color: 'bg-slate-500/10 text-slate-500 ring-1 ring-slate-500/20', dot: 'bg-slate-400' };
        default: return { label: p, color: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400' };
    }
};

const getStatusInfo = (s: TaskStatus) => {
    switch (s) {
        case TaskStatus.Done: return { label: 'Hoàn thành', color: 'text-emerald-600', bg: 'bg-emerald-500', icon: <CheckCircle2 className="w-4 h-4" /> };
        case TaskStatus.Review: return { label: 'Chờ duyệt', color: 'text-violet-600', bg: 'bg-violet-500', icon: <AlertCircle className="w-4 h-4" /> };
        case TaskStatus.InProgress: return { label: 'Đang thực hiện', color: 'text-blue-600', bg: 'bg-blue-500', icon: <Clock className="w-4 h-4" /> };
        default: return { label: 'Cần làm', color: 'text-slate-500', bg: 'bg-slate-300', icon: <div className="w-4 h-4 rounded-full border-2 border-slate-300" /> };
    }
};

const getRoleInfo = (role: Role) => {
    switch (role) {
        case Role.Admin: return { label: 'Admin', color: 'bg-purple-500/10 text-purple-600 ring-1 ring-purple-500/20' };
        case Role.Manager: return { label: 'Quản lý', color: 'bg-blue-500/10 text-blue-600 ring-1 ring-blue-500/20' };
        default: return { label: 'Nhân viên', color: 'bg-slate-500/10 text-slate-500 ring-1 ring-slate-500/20' };
    }
};

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#94a3b8'];

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

const EmployeeDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: employee, isLoading: empLoading } = useEmployee(id || '');
    const { data: tasks = [] } = useTasks();
    const { projects = [] } = useProjects();
    const { contracts = [] } = useContracts();

    const [activeTab, setActiveTab] = useState<'tasks' | 'projects' | 'contracts'>('tasks');

    // ── Cross-module computed data ──
    const empTasks = useMemo(() => tasks.filter(t => t.AssigneeID === id), [tasks, id]);
    const activeTasks = useMemo(() => empTasks.filter(t => t.Status !== TaskStatus.Done), [empTasks]);
    const completedTasks = useMemo(() => empTasks.filter(t => t.Status === TaskStatus.Done), [empTasks]);
    const overdueTasks = useMemo(() => {
        const now = new Date();
        return empTasks.filter(t => t.Status !== TaskStatus.Done && t.DueDate && new Date(t.DueDate) < now);
    }, [empTasks]);

    // Projects: union of task-based and member-based
    const empProjects = useMemo(() => {
        const taskProjectIds = new Set(empTasks.map(t => t.ProjectID));
        const memberProjectIds = new Set(projects.filter(p => p.Members?.includes(id || '')).map(p => p.ProjectID));
        const allIds = new Set([...taskProjectIds, ...memberProjectIds]);
        return projects.filter(p => allIds.has(p.ProjectID));
    }, [empTasks, projects, id]);

    // Contracts: contracts belonging to projects employee is involved in
    const empContracts = useMemo(() => {
        const empProjectIds = new Set(empProjects.map(p => p.ProjectID));
        // Contracts link to projects via BiddingPackage, but PackageID doesn't directly contain ProjectID
        // For now match contracts whose PackageID starts with a matching ProjectID prefix
        return contracts.filter(c => {
            const pkgProject = Array.from(empProjectIds).some(pid => c.PackageID.startsWith(pid));
            return pkgProject;
        });
    }, [contracts, empProjects]);

    // ── Task Distribution Chart Data ──
    const chartData = useMemo(() => {
        const inProgress = empTasks.filter(t => t.Status === TaskStatus.InProgress).length;
        const todo = empTasks.filter(t => t.Status === TaskStatus.Todo).length;
        const done = completedTasks.length;
        const review = empTasks.filter(t => t.Status === TaskStatus.Review).length;
        return [
            { name: 'Đang thực hiện', value: inProgress, color: '#3b82f6' },
            { name: 'Chờ duyệt', value: review, color: '#8b5cf6' },
            { name: 'Hoàn thành', value: done, color: '#10b981' },
            { name: 'Cần làm', value: todo, color: '#94a3b8' },
        ].filter(d => d.value > 0);
    }, [empTasks, completedTasks]);

    const completionRate = empTasks.length > 0 ? Math.round((completedTasks.length / empTasks.length) * 100) : 0;

    // ── Loading / Not Found ──
    if (empLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    <p className="text-sm text-slate-400">Đang tải thông tin...</p>
                </div>
            </div>
        );
    }

    if (!employee) {
        return (
            <div className="text-center py-20">
                <Sparkles className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">Không tìm thấy nhân sự.</p>
                <button onClick={() => navigate('/employees')} className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline">← Quay lại</button>
            </div>
        );
    }

    const roleInfo = getRoleInfo(employee.Role);

    // ═══════════════════════════════════════════════════
    // Render
    // ═══════════════════════════════════════════════════
    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* ══════════ HERO HEADER ══════════ */}
            <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-2xl overflow-hidden relative">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0djJoLTJ2LTJoMnptMCAxMHYyaC0ydi0yaDJ6bTAtMTB2MmgtMnYtMmgyek0yNiAyNHYyaC0ydi0yaDJ6bTAtMTB2MmgtMnYtMmgyek0xNiAxNHYyaC0ydi0yaDJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
                <div className="relative px-6 py-8">
                    {/* Back button */}
                    <button
                        onClick={() => navigate('/employees')}
                        className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors mb-6 group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Danh sách nhân sự
                    </button>

                    <div className="flex items-start gap-6">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                            <img
                                src={employee.AvatarUrl}
                                alt={employee.FullName}
                                className="w-24 h-24 rounded-2xl object-cover border-4 border-white/20 shadow-2xl"
                            />
                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-3 border-white ${employee.Status === EmployeeStatus.Active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h1 className="text-2xl font-black text-white">{employee.FullName}</h1>
                                    <p className="text-blue-200 font-medium mt-1">{employee.Position}</p>
                                    <div className="flex items-center gap-3 mt-3">
                                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/80 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                                            <Building2 className="w-3 h-3" /> {employee.Department}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/80 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                                            <Shield className="w-3 h-3" /> {roleInfo.label}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/80 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                                            <Hash className="w-3 h-3" /> {employee.EmployeeID}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ══════════ OVERVIEW CARDS ══════════ */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

                {/* Contact Info Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5">
                    <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <User className="w-3.5 h-3.5" /> Thông tin liên hệ
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg"><Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" /></div>
                            <div className="min-w-0">
                                <p className="text-[10px] text-slate-400 dark:text-slate-500">Email</p>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{employee.Email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg"><Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /></div>
                            <div>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500">Điện thoại</p>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{employee.Phone || '—'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-violet-50 dark:bg-violet-900/30 rounded-lg"><Calendar className="w-4 h-4 text-violet-600 dark:text-violet-400" /></div>
                            <div>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500">Ngày vào làm</p>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {employee.JoinDate ? new Date(employee.JoinDate).toLocaleDateString('vi-VN') : '—'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Task Stats Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5">
                    <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <ClipboardList className="w-3.5 h-3.5" /> Thống kê công việc
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 text-center">
                            <p className="text-2xl font-black text-slate-800 dark:text-slate-200">{empTasks.length}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1">Tổng</p>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-3 text-center">
                            <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{activeTasks.length}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1">Đang thực hiện</p>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-xl p-3 text-center">
                            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{completedTasks.length}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1">Hoàn thành</p>
                        </div>
                        <div className={`rounded-xl p-3 text-center ${overdueTasks.length > 0 ? 'bg-red-50' : 'bg-slate-50'}`}>
                            <p className={`text-2xl font-black ${overdueTasks.length > 0 ? 'text-red-600' : 'text-slate-400'}`}>{overdueTasks.length}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1">Quá hạn</p>
                        </div>
                    </div>
                </div>

                {/* Workload Donut Chart */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5">
                    <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Target className="w-3.5 h-3.5" /> Phân bổ công việc
                    </h3>
                    {chartData.length > 0 ? (
                        <div className="flex items-center gap-4">
                            <div className="w-24 h-24 relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={28}
                                            outerRadius={42}
                                            paddingAngle={3}
                                            dataKey="value"
                                            strokeWidth={0}
                                        >
                                            {chartData.map((entry, i) => (
                                                <Cell key={i} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(v: number) => [`${v} việc`, '']} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-lg font-black text-slate-800 dark:text-slate-200">{completionRate}%</span>
                                </div>
                            </div>
                            <div className="flex-1 space-y-1.5">
                                {chartData.map(d => (
                                    <div key={d.name} className="flex items-center gap-2 text-xs">
                                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                                        <span className="text-slate-500 dark:text-slate-400 flex-1 truncate">{d.name}</span>
                                        <span className="font-bold text-slate-700 dark:text-slate-300">{d.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-24 text-sm text-slate-300">Chưa có dữ liệu</div>
                    )}
                </div>

                {/* Cross-Module Summary */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5">
                    <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <TrendingUp className="w-3.5 h-3.5" /> Tổng quan kết nối
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/20 rounded-xl px-4 py-3">
                            <div className="flex items-center gap-2.5">
                                <FolderOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Dự án</span>
                            </div>
                            <span className="text-lg font-black text-indigo-600">{empProjects.length}</span>
                        </div>
                        <div className="flex items-center justify-between bg-sky-50 dark:bg-sky-900/20 rounded-xl px-4 py-3">
                            <div className="flex items-center gap-2.5">
                                <ClipboardList className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Công việc</span>
                            </div>
                            <span className="text-lg font-black text-sky-600">{empTasks.length}</span>
                        </div>
                        <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 rounded-xl px-4 py-3">
                            <div className="flex items-center gap-2.5">
                                <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Hợp đồng</span>
                            </div>
                            <span className="text-lg font-black text-amber-600">{empContracts.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ══════════ TABS ══════════ */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                {/* Tab Navigation */}
                <div className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-5">
                    <div className="flex gap-1">
                        {[
                            { key: 'tasks' as const, label: 'Công việc', icon: <ClipboardList className="w-4 h-4" />, count: empTasks.length },
                            { key: 'projects' as const, label: 'Dự án', icon: <FolderOpen className="w-4 h-4" />, count: empProjects.length },
                            { key: 'contracts' as const, label: 'Hợp đồng', icon: <FileText className="w-4 h-4" />, count: empContracts.length },
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-all -mb-px ${activeTab === tab.key
                                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                                    : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:border-slate-200 dark:hover:border-slate-600'
                                    }`}
                            >
                                {tab.icon}
                                <span>{tab.label}</span>
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === tab.key ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                                    }`}>{tab.count}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="p-5">

                    {/* ── Tasks Tab ── */}
                    {activeTab === 'tasks' && (
                        <div>
                            {empTasks.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-slate-100 dark:border-slate-700">
                                                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider w-10"></th>
                                                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Công việc</th>
                                                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider hidden md:table-cell">Dự án</th>
                                                <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider w-24">Tiến độ</th>
                                                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider hidden sm:table-cell w-28">Hạn chót</th>
                                                <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider w-24">Ưu tiên</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                                            {empTasks.map(task => {
                                                const statusInfo = getStatusInfo(task.Status);
                                                const priorityInfo = getPriorityInfo(task.Priority);
                                                const progress = task.ProgressPercent || (task.Status === TaskStatus.Done ? 100 : 0);
                                                const isOverdue = task.Status !== TaskStatus.Done && task.DueDate && new Date(task.DueDate) < new Date();
                                                const project = projects.find(p => p.ProjectID === task.ProjectID);

                                                return (
                                                    <tr
                                                        key={task.TaskID}
                                                        onClick={() => navigate(`/tasks/${task.TaskID}`)}
                                                        className={`group cursor-pointer transition-all hover:bg-slate-50/80 dark:hover:bg-slate-700/40 ${isOverdue ? 'bg-red-50/40 dark:bg-red-900/10' : ''}`}
                                                    >
                                                        <td className="px-4 py-3.5">
                                                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${statusInfo.bg}/10 ${statusInfo.color}`}>
                                                                {statusInfo.icon}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3.5">
                                                            <div className="flex items-center gap-2 mb-0.5">
                                                                <h4 className={`text-sm font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 ${task.Status === TaskStatus.Done ? 'text-slate-400 dark:text-slate-500 line-through' : isOverdue ? 'text-red-700 dark:text-red-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                                                    {task.Title}
                                                                </h4>
                                                                {task.IsCritical && <span className="shrink-0 text-[8px] font-black text-red-600 bg-red-100 px-1.5 py-0.5 rounded-md uppercase">Găng</span>}
                                                            </div>
                                                            {task.Description && <p className="text-xs text-slate-400 line-clamp-1 max-w-[300px]">{task.Description}</p>}
                                                        </td>
                                                        <td className="px-4 py-3.5 hidden md:table-cell">
                                                            {project ? (
                                                                <p className="text-xs text-slate-500 truncate max-w-[200px]">{project.ProjectName}</p>
                                                            ) : <span className="text-[10px] text-slate-300">—</span>}
                                                        </td>
                                                        <td className="px-4 py-3.5">
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full rounded-full bg-gradient-to-r ${getProgressGradient(progress)} transition-all duration-500`}
                                                                        style={{ width: `${progress}%` }}
                                                                    />
                                                                </div>
                                                                <span className={`text-[10px] font-bold tabular-nums w-7 text-right ${progress >= 100 ? 'text-emerald-600' : progress >= 70 ? 'text-blue-600' : 'text-slate-400'}`}>{progress}%</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3.5 hidden sm:table-cell">
                                                            {task.DueDate ? (
                                                                <div className={`flex items-center gap-1.5 text-xs ${isOverdue ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
                                                                    <Calendar className="w-3 h-3 shrink-0" />
                                                                    {new Date(task.DueDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                                    {isOverdue && <AlertTriangle className="w-3 h-3 text-red-500 animate-pulse" />}
                                                                </div>
                                                            ) : <span className="text-[10px] text-slate-300">—</span>}
                                                        </td>
                                                        <td className="px-4 py-3.5 text-center">
                                                            <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-md ${priorityInfo.color}`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${priorityInfo.dot}`} />
                                                                {priorityInfo.label}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Sparkles className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                                    <p className="text-sm text-slate-400">Chưa có công việc nào được giao.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Projects Tab ── */}
                    {activeTab === 'projects' && (
                        <div>
                            {empProjects.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {empProjects.map(project => {
                                        const projectTasks = empTasks.filter(t => t.ProjectID === project.ProjectID);
                                        const doneTasks = projectTasks.filter(t => t.Status === TaskStatus.Done);
                                        const progress = projectTasks.length > 0 ? Math.round((doneTasks.length / projectTasks.length) * 100) : 0;

                                        return (
                                            <div
                                                key={project.ProjectID}
                                                onClick={() => navigate(`/projects/${project.ProjectID}`)}
                                                className="bg-white dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-600 hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-md transition-all cursor-pointer group p-5"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                                                                <Briefcase className="w-3.5 h-3.5 text-white" />
                                                            </div>
                                                            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">{project.ProjectID}</span>
                                                        </div>
                                                        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mt-2">
                                                            {project.ProjectName}
                                                        </h4>
                                                    </div>
                                                    <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-blue-400 transition-colors shrink-0 mt-1" />
                                                </div>

                                                {/* Progress bar */}
                                                <div className="mt-4">
                                                    <div className="flex items-center justify-between text-[10px] mb-1.5">
                                                        <span className="text-slate-400">{doneTasks.length}/{projectTasks.length} công việc</span>
                                                        <span className={`font-bold ${progress >= 100 ? 'text-emerald-600' : 'text-blue-600'}`}>{progress}%</span>
                                                    </div>
                                                    <div className="h-1.5 bg-slate-100 dark:bg-slate-600 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full bg-gradient-to-r ${getProgressGradient(progress)} transition-all duration-700`}
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Meta */}
                                                <div className="mt-3 flex items-center gap-3 text-[10px] text-slate-400">
                                                    <span>{project.Members?.length || 0} thành viên</span>
                                                    <span>•</span>
                                                    <span>{project.Status}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Sparkles className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                                    <p className="text-sm text-slate-400">Chưa tham gia dự án nào.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Contracts Tab ── */}
                    {activeTab === 'contracts' && (
                        <div>
                            {empContracts.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-slate-100 dark:border-slate-700">
                                                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Mã HĐ</th>
                                                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Gói thầu</th>
                                                <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Giá trị</th>
                                                <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Ngày ký</th>
                                                <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Trạng thái</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                                            {empContracts.map(contract => (
                                                <tr key={contract.ContractID} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors">
                                                    <td className="px-4 py-3.5">
                                                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{contract.ContractID}</span>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <span className="text-xs text-slate-500 font-mono">{contract.PackageID}</span>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-right">
                                                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                                            {(contract.Value || 0).toLocaleString('vi-VN')} đ
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-center">
                                                        <span className="text-xs text-slate-500">
                                                            {contract.SignDate ? new Date(contract.SignDate).toLocaleDateString('vi-VN') : '—'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-center">
                                                        <span className="inline-flex text-[10px] font-bold px-2 py-1 rounded-md bg-blue-50 text-blue-600">
                                                            {contract.Status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Sparkles className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                                    <p className="text-sm text-slate-400">Không có hợp đồng liên quan.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmployeeDetail;
