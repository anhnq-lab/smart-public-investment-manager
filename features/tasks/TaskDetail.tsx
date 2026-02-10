import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Task, TaskStatus, TaskPriority } from '../../types';
import { useTask, useUpdateTask, useTasks } from '../../hooks/useTasks';
import { useProjects } from '../../hooks/useProjects';
import { useEmployees } from '../../hooks/useEmployees';
import { getTimelineStepLabel, getPhaseColor } from '../../utils/timelineStepUtils';
import {
    ArrowLeft, Calendar, FileText, CheckCircle2, Scale, Building2, User, Clock,
    ShieldCheck, DollarSign, Paperclip, Plus, Trash2, ChevronRight, ExternalLink,
    Play, Eye, BarChart3, Link2, AlertTriangle, Edit3, Target, Zap, Layers
} from 'lucide-react';

// ═══════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════
const STATUS_ORDER = [TaskStatus.Todo, TaskStatus.InProgress, TaskStatus.Review, TaskStatus.Done];

const getStatusConfig = (s: TaskStatus) => {
    switch (s) {
        case TaskStatus.Done: return { label: 'Hoàn thành', bg: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50', ring: 'ring-emerald-500/20', icon: <CheckCircle2 className="w-4 h-4" /> };
        case TaskStatus.InProgress: return { label: 'Đang thực hiện', bg: 'bg-blue-500', text: 'text-blue-600', light: 'bg-blue-50', ring: 'ring-blue-500/20', icon: <Play className="w-4 h-4" /> };
        case TaskStatus.Review: return { label: 'Chờ duyệt', bg: 'bg-violet-500', text: 'text-violet-600', light: 'bg-violet-50', ring: 'ring-violet-500/20', icon: <Eye className="w-4 h-4" /> };
        default: return { label: 'Cần làm', bg: 'bg-slate-300', text: 'text-slate-500', light: 'bg-slate-50', ring: 'ring-slate-300/20', icon: <Target className="w-4 h-4" /> };
    }
};

const getPriorityConfig = (p?: TaskPriority) => {
    switch (p) {
        case TaskPriority.Urgent: return { label: 'Khẩn cấp', color: 'text-red-600 bg-red-50 ring-1 ring-red-500/20' };
        case TaskPriority.High: return { label: 'Cao', color: 'text-orange-600 bg-orange-50 ring-1 ring-orange-500/20' };
        case TaskPriority.Medium: return { label: 'Trung bình', color: 'text-sky-600 bg-sky-50 ring-1 ring-sky-500/20' };
        case TaskPriority.Low: return { label: 'Thấp', color: 'text-slate-500 bg-slate-50 ring-1 ring-slate-300/20' };
        default: return { label: 'N/A', color: 'text-slate-400 bg-slate-50' };
    }
};

const getProgressGradient = (p: number) => {
    if (p >= 100) return 'from-emerald-400 to-emerald-600';
    if (p >= 70) return 'from-blue-400 to-blue-600';
    if (p >= 40) return 'from-amber-400 to-amber-500';
    return 'from-slate-300 to-slate-400';
};

const getNextStatus = (c: TaskStatus): TaskStatus | null => { const i = STATUS_ORDER.indexOf(c); return i < STATUS_ORDER.length - 1 ? STATUS_ORDER[i + 1] : null; };
const getPrevStatus = (c: TaskStatus): TaskStatus | null => { const i = STATUS_ORDER.indexOf(c); return i > 0 ? STATUS_ORDER[i - 1] : null; };

// ═══════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════
const TaskDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: task, isLoading } = useTask(id);
    const { data: allTasks = [] } = useTasks();
    const { projects = [] } = useProjects();
    const { data: employees = [] } = useEmployees();
    const updateTaskMutation = useUpdateTask();

    const [isSubTaskModalOpen, setIsSubTaskModalOpen] = useState(false);
    const [editingSubTask, setEditingSubTask] = useState<any>(null);

    const project = projects.find(p => p.ProjectID === task?.ProjectID);
    const assignee = employees.find(e => e.EmployeeID === task?.AssigneeID);
    const approver = employees.find(e => e.EmployeeID === task?.ApproverID);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-slate-400">Đang tải...</p>
                </div>
            </div>
        );
    }

    if (!task) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <AlertTriangle className="w-6 h-6 text-red-400" />
                    </div>
                    <p className="text-slate-600 font-medium">Không tìm thấy công việc!</p>
                    <button onClick={() => navigate('/tasks')} className="text-sm text-blue-600 mt-2 hover:underline">← Quay lại</button>
                </div>
            </div>
        );
    }

    const statusCfg = getStatusConfig(task.Status);
    const priorityCfg = getPriorityConfig(task.Priority);
    const nextStatus = getNextStatus(task.Status);
    const prevStatus = getPrevStatus(task.Status);
    const progress = task.ProgressPercent || (task.Status === TaskStatus.Done ? 100 : 0);
    const stepLabel = getTimelineStepLabel(task.TimelineStep);
    const phaseColor = getPhaseColor(task.TimelineStep);
    const isOverdue = task.Status !== TaskStatus.Done && task.DueDate && new Date(task.DueDate) < new Date();

    const handleStatusChange = (s: TaskStatus) => {
        updateTaskMutation.mutate({ ...task, Status: s, ProgressPercent: s === TaskStatus.Done ? 100 : task.ProgressPercent });
    };

    const getDependencyTask = (taskId: string) => allTasks.find(t => t.TaskID === taskId);

    return (
        <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 min-h-screen animate-in fade-in duration-300">
            <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">

                {/* ══════════ BREADCRUMB ══════════ */}
                <nav className="flex items-center gap-1.5 text-sm text-slate-400 flex-wrap">
                    <button onClick={() => navigate('/tasks')} className="hover:text-blue-600 transition-colors font-medium flex items-center gap-1">
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Công việc
                    </button>
                    {project && (
                        <>
                            <ChevronRight className="w-3 h-3" />
                            <button
                                onClick={() => navigate(`/projects/${project.ProjectID}`, { state: { activeTab: 'plan' } })}
                                className="hover:text-blue-600 transition-colors font-medium"
                            >
                                {project.ProjectName}
                            </button>
                        </>
                    )}
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-700 font-bold truncate max-w-[300px]">{task.Title}</span>
                </nav>

                {/* ══════════ HEADER CARD ══════════ */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    {/* Top accent */}
                    <div className={`h-1 ${statusCfg.bg}`} />

                    <div className="p-6">
                        <div className="flex flex-col lg:flex-row justify-between gap-5">
                            {/* Left */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${statusCfg.light} ${statusCfg.text} ring-1 ${statusCfg.ring}`}>
                                        {statusCfg.icon} {statusCfg.label}
                                    </span>
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${priorityCfg.color}`}>
                                        {priorityCfg.label}
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded-md">{task.TaskID}</span>
                                    {task.IsCritical && (
                                        <span className="text-[10px] font-black text-red-600 bg-red-50 ring-1 ring-red-200 px-2 py-1 rounded-md flex items-center gap-1">
                                            <Zap className="w-3 h-3" /> ĐƯỜNG GĂNG
                                        </span>
                                    )}
                                    {isOverdue && (
                                        <span className="text-[10px] font-bold text-red-600 bg-red-50 ring-1 ring-red-200 px-2 py-1 rounded-md animate-pulse flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3" /> QUÁ HẠN
                                        </span>
                                    )}
                                </div>

                                <h1 className="text-2xl font-black text-slate-800 leading-tight mb-2">{task.Title}</h1>

                                <p className="text-sm text-slate-400 flex items-center gap-2">
                                    <Building2 className="w-4 h-4" />
                                    Thuộc dự án:
                                    <button
                                        onClick={() => navigate(`/projects/${project?.ProjectID}`, { state: { activeTab: 'plan' } })}
                                        className="font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                                    >
                                        {project?.ProjectName}
                                        <ExternalLink className="w-3 h-3" />
                                    </button>
                                </p>
                            </div>

                            {/* Right: Actions */}
                            <div className="flex gap-2 shrink-0 items-start">
                                {prevStatus && (
                                    <button
                                        onClick={() => handleStatusChange(prevStatus)}
                                        className="px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 hover:bg-slate-50 text-slate-600 transition-all active:scale-[0.98]"
                                    >
                                        ← {getStatusConfig(prevStatus).label}
                                    </button>
                                )}
                                {nextStatus && (
                                    <button
                                        onClick={() => handleStatusChange(nextStatus)}
                                        className={`px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-lg active:scale-[0.98] flex items-center gap-2 ${nextStatus === TaskStatus.Done ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-600/25'
                                            : nextStatus === TaskStatus.Review ? 'bg-gradient-to-r from-violet-500 to-violet-600 shadow-violet-600/25'
                                                : 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-blue-600/25'
                                            }`}
                                    >
                                        {getStatusConfig(nextStatus).icon}
                                        {getStatusConfig(nextStatus).label} →
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* ── Progress Bar ── */}
                        <div className="mt-5 pt-5 border-t border-slate-100">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <BarChart3 className="w-3.5 h-3.5" /> Tiến độ thực hiện
                                </span>
                                <span className={`text-sm font-black ${progress >= 100 ? 'text-emerald-600' : progress >= 70 ? 'text-blue-600' : 'text-slate-600'}`}>{progress}%</span>
                            </div>
                            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full bg-gradient-to-r ${getProgressGradient(progress)} transition-all duration-700`}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ══════════ CONTENT GRID ══════════ */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* ── LEFT 2/3 ── */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Description */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <FileText className="w-4 h-4" /> Nội dung thực hiện
                            </h3>
                            <div className="prose prose-sm max-w-none text-slate-600 leading-relaxed">
                                <p className="whitespace-pre-wrap">{task.Description || "Chưa có mô tả chi tiết."}</p>
                            </div>
                        </div>

                        {/* Regulatory */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="h-1 bg-gradient-to-r from-blue-400 to-indigo-500" />
                            <div className="p-6">
                                <h3 className="text-xs font-black text-blue-700 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <Scale className="w-4 h-4" /> Thông tin pháp lý & Quy trình
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-slate-400 mb-2 block tracking-wider">Căn cứ pháp lý</label>
                                        <div className="flex items-start gap-2.5 bg-blue-50/60 p-4 rounded-xl text-blue-800 text-sm font-medium ring-1 ring-blue-100">
                                            <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
                                            {task.LegalBasis || "Chưa cập nhật"}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-slate-400 mb-2 block tracking-wider">Sản phẩm / Kết quả</label>
                                        <div className="flex items-start gap-2.5 bg-emerald-50/60 p-4 rounded-xl text-emerald-800 text-sm font-medium ring-1 ring-emerald-100">
                                            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500" />
                                            {task.OutputDocument || "Chưa xác định"}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5 border-t border-slate-100">
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-slate-400 mb-2 block tracking-wider">Bước thực hiện</label>
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold ${phaseColor.bg} ${phaseColor.text} ring-1 ${phaseColor.border}`}>
                                            <Layers className="w-3.5 h-3.5" />
                                            {stepLabel}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-slate-400 mb-2 block tracking-wider">Thời gian quy định</label>
                                        <p className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                                            <Clock className="w-4 h-4 text-slate-400" /> {task.DurationDays ? `${task.DurationDays} ngày` : "N/A"}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-slate-400 mb-2 block tracking-wider">Phụ thuộc</label>
                                        <div className="space-y-1.5">
                                            {task.Dependencies && task.Dependencies.length > 0 ? (
                                                task.Dependencies.map((dep, idx) => {
                                                    const depTask = getDependencyTask(dep.TaskID);
                                                    return (
                                                        <button
                                                            key={idx}
                                                            onClick={() => navigate(`/tasks/${dep.TaskID}`)}
                                                            className="flex items-center gap-1.5 text-xs bg-slate-50 hover:bg-blue-50 hover:text-blue-600 px-3 py-1.5 rounded-lg transition-all group/dep w-full text-left ring-1 ring-slate-100 hover:ring-blue-200"
                                                        >
                                                            <Link2 className="w-3 h-3 shrink-0 text-slate-400 group-hover/dep:text-blue-500 transition-colors" />
                                                            <span className="truncate font-medium">{depTask ? depTask.Title : dep.TaskID}</span>
                                                            <span className="text-[10px] text-slate-400 shrink-0 ml-auto">({dep.Type})</span>
                                                        </button>
                                                    );
                                                })
                                            ) : (
                                                <span className="text-sm text-slate-400 italic">Không có</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── RIGHT 1/3 ── */}
                    <div className="space-y-6">

                        {/* Assignee Card */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-5">Phân công</h3>

                            <div className="flex items-center gap-3 mb-5 pb-5 border-b border-slate-100">
                                <div className="relative">
                                    <img
                                        src={assignee?.AvatarUrl || `https://ui-avatars.com/api/?name=${assignee?.FullName || 'U'}&background=6366f1&color=fff&size=48`}
                                        className="w-12 h-12 rounded-xl ring-2 ring-white shadow-md object-cover"
                                        alt=""
                                    />
                                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800">{assignee?.FullName || "Chưa phân công"}</p>
                                    <p className="text-xs text-slate-400">{assignee?.Position || assignee?.Department || "N/A"}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 flex items-center gap-1 tracking-wider">
                                        <Calendar className="w-3 h-3" /> Hạn chót
                                    </label>
                                    <p className={`text-sm font-semibold px-3 py-2 rounded-xl inline-flex items-center gap-2 ${isOverdue ? 'text-red-600 bg-red-50 ring-1 ring-red-200' : 'text-slate-700 bg-slate-50'}`}>
                                        {task.DueDate ? new Date(task.DueDate).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Chưa có'}
                                        {isOverdue && <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 flex items-center gap-1 tracking-wider">
                                        <User className="w-3 h-3" /> Người phê duyệt
                                    </label>
                                    <p className="text-sm font-medium text-slate-700">
                                        {approver?.FullName || "Lãnh đạo Ban"}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 flex items-center gap-1 tracking-wider">
                                        <DollarSign className="w-3 h-3" /> Chi phí dự kiến
                                    </label>
                                    <p className="text-sm font-bold text-slate-700">
                                        {task.EstimatedCost ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(task.EstimatedCost) : "Chưa lập dự toán"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Subtasks */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Công việc con</h3>
                                <button
                                    onClick={() => { setIsSubTaskModalOpen(true); setEditingSubTask(null); }}
                                    className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            <div className="space-y-2">
                                {(task.SubTasks || []).length === 0 && (
                                    <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-xl">
                                        <p className="text-xs text-slate-300 italic">Chưa có công việc con</p>
                                    </div>
                                )}

                                {(task.SubTasks || []).map((sub, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50/80 rounded-xl group/sub border border-transparent hover:border-slate-200 hover:bg-white transition-all">
                                        <div
                                            onClick={() => {
                                                const updatedSubTasks = [...(task.SubTasks || [])];
                                                updatedSubTasks[idx].Status = updatedSubTasks[idx].Status === 'Done' ? 'Todo' : 'Done';
                                                updateTaskMutation.mutate({ ...task, SubTasks: updatedSubTasks });
                                            }}
                                            className={`mt-0.5 w-5 h-5 rounded-lg border-2 cursor-pointer flex items-center justify-center transition-all ${sub.Status === 'Done' ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-200' : 'border-slate-300 bg-white hover:border-blue-400'
                                                }`}
                                        >
                                            {sub.Status === 'Done' && <CheckCircle2 className="w-3 h-3" />}
                                        </div>
                                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { setEditingSubTask(sub); setIsSubTaskModalOpen(true); }}>
                                            <p className={`text-xs font-semibold line-clamp-2 ${sub.Status === 'Done' ? 'line-through text-slate-400' : 'text-slate-700'}`}>{sub.Title}</p>
                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                <span className="text-[10px] text-slate-400 bg-white px-2 py-0.5 rounded-md ring-1 ring-slate-100 flex items-center gap-1">
                                                    <User className="w-3 h-3" />
                                                    {sub.AssigneeID ? employees.find(e => e.EmployeeID === sub.AssigneeID)?.FullName : "Chưa gán"}
                                                </span>
                                                {sub.DueDate && (
                                                    <span className="text-[10px] text-slate-400 bg-white px-2 py-0.5 rounded-md ring-1 ring-slate-100 flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" /> {sub.DueDate}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (confirm("Xóa công việc con này?")) {
                                                    const updatedSubTasks = (task.SubTasks || []).filter((_, i) => i !== idx);
                                                    updateTaskMutation.mutate({ ...task, SubTasks: updatedSubTasks });
                                                }
                                            }}
                                            className="opacity-0 group-hover/sub:opacity-100 transition-opacity text-slate-300 hover:text-red-500 p-1 rounded-lg hover:bg-red-50"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Attachments */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Tệp đính kèm</h3>
                            <div className="space-y-2">
                                <div className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors ring-1 ring-slate-100">
                                    <div className="p-2 bg-white rounded-xl shadow-sm text-red-500 ring-1 ring-slate-100">
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-slate-700 truncate">Mau-to-trinh-phe-duyet.docx</p>
                                        <p className="text-[10px] text-slate-400">1.2 MB • 20/02/2025</p>
                                    </div>
                                </div>
                                <button className="w-full text-center py-3 text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-colors flex items-center justify-center gap-1.5 border-2 border-dashed border-blue-200">
                                    <Paperclip className="w-3.5 h-3.5" /> Thêm tài liệu
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ══════════ SUBTASK MODAL ══════════ */}
            {isSubTaskModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 ring-1 ring-black/5">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
                            <h3 className="text-base font-bold text-slate-800">{editingSubTask ? 'Cập nhật công việc con' : 'Thêm công việc con'}</h3>
                            <button onClick={() => { setIsSubTaskModalOpen(false); setEditingSubTask(null); }} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors">✕</button>
                        </div>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const fd = new FormData(e.currentTarget);
                            const title = fd.get('title') as string;
                            const assigneeId = fd.get('assignee') as string;
                            const dueDate = fd.get('dueDate') as string;

                            let subs = [...(task.SubTasks || [])];
                            if (editingSubTask) {
                                subs = subs.map(s => s.SubTaskID === editingSubTask.SubTaskID ? { ...s, Title: title, AssigneeID: assigneeId, DueDate: dueDate } : s);
                            } else {
                                subs.push({ SubTaskID: `SUB-${Date.now()}`, Title: title, AssigneeID: assigneeId, DueDate: dueDate, Status: 'Todo' as const });
                            }
                            updateTaskMutation.mutate({ ...task, SubTasks: subs });
                            setIsSubTaskModalOpen(false);
                            setEditingSubTask(null);
                        }} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Nội dung</label>
                                <input defaultValue={editingSubTask?.Title || ''} name="title" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 placeholder:text-slate-400" placeholder="Nhập tên công việc..." />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Người thực hiện</label>
                                <select defaultValue={editingSubTask?.AssigneeID || ''} name="assignee" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400">
                                    <option value="">-- Chọn --</option>
                                    {employees.filter(e => e.Status === 1).map(e => (
                                        <option key={e.EmployeeID} value={e.EmployeeID}>{e.FullName} - {e.Department}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Hạn hoàn thành</label>
                                <input defaultValue={editingSubTask?.DueDate || ''} type="date" name="dueDate" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
                            </div>
                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                                <button type="button" onClick={() => { setIsSubTaskModalOpen(false); setEditingSubTask(null); }} className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl">Hủy</button>
                                <button type="submit" className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl shadow-lg shadow-blue-600/25 active:scale-[0.98]">
                                    {editingSubTask ? 'Lưu' : 'Thêm mới'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TaskDetail;
