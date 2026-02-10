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
    Play, Eye, BarChart3, Link2, AlertTriangle
} from 'lucide-react';

// Status transition helpers
const STATUS_ORDER = [TaskStatus.Todo, TaskStatus.InProgress, TaskStatus.Review, TaskStatus.Done];

const getStatusInfo = (s: TaskStatus) => {
    switch (s) {
        case TaskStatus.Done: return { label: 'Hoàn thành', color: 'bg-emerald-500 text-white', icon: <CheckCircle2 className="w-4 h-4" /> };
        case TaskStatus.InProgress: return { label: 'Đang thực hiện', color: 'bg-blue-500 text-white', icon: <Play className="w-4 h-4" /> };
        case TaskStatus.Review: return { label: 'Chờ duyệt', color: 'bg-purple-500 text-white', icon: <Eye className="w-4 h-4" /> };
        default: return { label: 'Cần làm', color: 'bg-gray-200 text-gray-700', icon: <Clock className="w-4 h-4" /> };
    }
};

const getNextStatus = (current: TaskStatus): TaskStatus | null => {
    const idx = STATUS_ORDER.indexOf(current);
    return idx < STATUS_ORDER.length - 1 ? STATUS_ORDER[idx + 1] : null;
};

const getPrevStatus = (current: TaskStatus): TaskStatus | null => {
    const idx = STATUS_ORDER.indexOf(current);
    return idx > 0 ? STATUS_ORDER[idx - 1] : null;
};

const TaskDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // Hooks
    const { data: task, isLoading } = useTask(id);
    const { data: allTasks = [] } = useTasks();
    const { projects = [] } = useProjects();
    const { data: employees = [] } = useEmployees();
    const updateTaskMutation = useUpdateTask();

    // Local state
    const [isSubTaskModalOpen, setIsSubTaskModalOpen] = useState(false);
    const [editingSubTask, setEditingSubTask] = useState<any>(null);

    // Derived
    const project = projects.find(p => p.ProjectID === task?.ProjectID);
    const assignee = employees.find(e => e.EmployeeID === task?.AssigneeID);

    if (isLoading) return <div className="p-8 text-center text-gray-500">Đang tải...</div>;
    if (!task) return <div className="p-8 text-center text-red-500">Không tìm thấy công việc!</div>;

    const statusInfo = getStatusInfo(task.Status);
    const nextStatus = getNextStatus(task.Status);
    const prevStatus = getPrevStatus(task.Status);
    const progress = task.ProgressPercent || (task.Status === TaskStatus.Done ? 100 : 0);
    const stepLabel = getTimelineStepLabel(task.TimelineStep);
    const phaseColor = getPhaseColor(task.TimelineStep);
    const isOverdue = task.Status !== TaskStatus.Done && task.DueDate && new Date(task.DueDate) < new Date();

    const handleStatusChange = (newStatus: TaskStatus) => {
        const newProgress = newStatus === TaskStatus.Done ? 100 : task.ProgressPercent;
        updateTaskMutation.mutate({ ...task, Status: newStatus, ProgressPercent: newProgress });
    };

    // Get dependency task info
    const getDependencyTask = (taskId: string) => allTasks.find(t => t.TaskID === taskId);

    return (
        <div className="bg-[#F8FAFC] min-h-screen p-6 animate-in fade-in duration-300">
            {/* Breadcrumb Navigation */}
            <div className="max-w-5xl mx-auto mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 flex-wrap">
                    <button onClick={() => navigate('/tasks')} className="hover:text-blue-600 transition-colors font-medium">
                        Công việc
                    </button>
                    <ChevronRight className="w-3 h-3 text-gray-400" />
                    {project && (
                        <>
                            <button
                                onClick={() => navigate(`/projects/${project.ProjectID}`, { state: { activeTab: 'plan' } })}
                                className="hover:text-blue-600 transition-colors font-medium flex items-center gap-1"
                            >
                                {project.ProjectName}
                            </button>
                            <ChevronRight className="w-3 h-3 text-gray-400" />
                        </>
                    )}
                    <span className="text-gray-800 font-bold truncate max-w-[300px]">{task.Title}</span>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${statusInfo.color}`}>
                                {statusInfo.icon}
                                {statusInfo.label}
                            </span>
                            <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{task.TaskID}</span>
                            {task.IsCritical && (
                                <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" /> Đường găng
                                </span>
                            )}
                            {isOverdue && (
                                <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded animate-pulse">
                                    ⚠ QUÁ HẠN
                                </span>
                            )}
                        </div>
                        <h1 className="text-2xl font-black text-gray-800 leading-tight mb-2">{task.Title}</h1>
                        <div className="flex items-center gap-4 flex-wrap">
                            <p className="text-gray-500 flex items-center gap-2 text-sm">
                                <Building2 className="w-4 h-4" />
                                Thuộc dự án:
                                <button
                                    onClick={() => navigate(`/projects/${project?.ProjectID}`, { state: { activeTab: 'plan' } })}
                                    className="font-bold text-blue-600 hover:underline flex items-center gap-1"
                                >
                                    {project?.ProjectName}
                                    <ExternalLink className="w-3 h-3" />
                                </button>
                            </p>
                        </div>
                    </div>
                    {/* Status Transition Actions */}
                    <div className="flex gap-2 shrink-0">
                        {prevStatus && (
                            <button
                                onClick={() => handleStatusChange(prevStatus)}
                                className="px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600"
                            >
                                ← {getStatusInfo(prevStatus).label}
                            </button>
                        )}
                        {nextStatus && (
                            <button
                                onClick={() => handleStatusChange(nextStatus)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold text-white transition-colors shadow-lg flex items-center gap-1.5 ${nextStatus === TaskStatus.Done ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200'
                                        : nextStatus === TaskStatus.Review ? 'bg-purple-500 hover:bg-purple-600 shadow-purple-200'
                                            : 'bg-blue-500 hover:bg-blue-600 shadow-blue-200'
                                    }`}
                            >
                                {getStatusInfo(nextStatus).icon}
                                {getStatusInfo(nextStatus).label} →
                            </button>
                        )}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4 bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
                            <BarChart3 className="w-3 h-3" /> Tiến độ thực hiện
                        </span>
                        <span className="text-sm font-black text-gray-800">{progress}%</span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${progress >= 100 ? 'bg-emerald-500' :
                                    progress >= 70 ? 'bg-blue-500' :
                                        progress >= 40 ? 'bg-amber-500' :
                                            'bg-gray-300'
                                }`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Content Grid - FIX: Right column now INSIDE the grid */}
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Left Column: Detailed Info */}
                <div className="md:col-span-2 space-y-6">
                    {/* Main Description */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-400" /> Nội dung thực hiện
                        </h3>
                        <div className="prose prose-sm max-w-none text-gray-600">
                            <p>{task.Description || "Chưa có mô tả chi tiết."}</p>
                        </div>
                    </div>

                    {/* Regulatory Information */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 border-l-4 border-l-blue-500">
                        <h3 className="text-sm font-black text-blue-700 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Scale className="w-4 h-4" /> Thông tin pháp lý & Quy trình
                        </h3>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Căn cứ pháp lý</label>
                                    <div className="flex items-start gap-2 bg-blue-50 p-3 rounded-lg text-blue-800 text-sm font-medium">
                                        <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
                                        {task.LegalBasis || "Chưa cập nhật căn cứ pháp lý"}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Sản phẩm / Kết quả đầu ra</label>
                                    <div className="flex items-start gap-2 bg-emerald-50 p-3 rounded-lg text-emerald-800 text-sm font-medium">
                                        <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                                        {task.OutputDocument || "Chưa xác định sản phẩm"}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Bước thực hiện</label>
                                    <div className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-bold ${phaseColor.bg} ${phaseColor.text} border ${phaseColor.border}`}>
                                        {stepLabel}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Thời gian quy định</label>
                                    <p className="text-sm font-bold text-gray-800 flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5 text-gray-400" /> {task.DurationDays ? `${task.DurationDays} ngày` : "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Công việc phụ thuộc</label>
                                    <div className="space-y-1">
                                        {task.Dependencies && task.Dependencies.length > 0 ? (
                                            task.Dependencies.map((dep, idx) => {
                                                const depTask = getDependencyTask(dep.TaskID);
                                                return (
                                                    <button
                                                        key={idx}
                                                        onClick={() => navigate(`/tasks/${dep.TaskID}`)}
                                                        className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-blue-50 hover:text-blue-600 px-2 py-1 rounded transition-colors group/dep w-full text-left"
                                                    >
                                                        <Link2 className="w-3 h-3 shrink-0 text-gray-400 group-hover/dep:text-blue-500" />
                                                        <span className="truncate">{depTask ? depTask.Title : dep.TaskID}</span>
                                                        <span className="text-[10px] text-gray-400 shrink-0">({dep.Type})</span>
                                                    </button>
                                                );
                                            })
                                        ) : (
                                            <span className="text-sm text-gray-500">Không có</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Metadata - NOW inside grid */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Phân công</h3>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="relative">
                                <img src={assignee?.AvatarUrl || 'https://ui-avatars.com/api/?name=User'} className="w-12 h-12 rounded-full border-2 border-white shadow-md" alt="" />
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-800">{assignee?.FullName || "Chưa phân công"}</p>
                                <p className="text-xs text-gray-500">{assignee?.Position || "N/A"}</p>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-gray-100">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Hạn chót</label>
                                <p className={`text-sm font-medium px-2 py-1 rounded inline-block ${isOverdue ? 'text-red-600 bg-red-50 animate-pulse' : 'text-red-600 bg-red-50'}`}>
                                    {task.DueDate ? new Date(task.DueDate).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'}
                                </p>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 flex items-center gap-1"><User className="w-3 h-3" /> Người phê duyệt</label>
                                <p className="text-sm font-medium text-gray-700">
                                    {task.ApproverID ? employees.find(e => e.EmployeeID === task.ApproverID)?.FullName : "Lãnh đạo Ban"}
                                </p>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Chi phí dự kiến</label>
                                <p className="text-sm font-medium text-gray-700">
                                    {task.EstimatedCost ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(task.EstimatedCost) : "Chưa lập dự toán"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Subtasks Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Công việc con (Phân công)</h3>
                            <button
                                onClick={() => { setIsSubTaskModalOpen(true); setEditingSubTask(null); }}
                                className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            {(task.SubTasks || []).length === 0 && <p className="text-xs text-gray-400 italic text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">Chưa có công việc con.</p>}

                            {(task.SubTasks || []).map((sub, idx) => (
                                <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl group border border-transparent hover:border-gray-200 hover:scale-[1.02] transition-all">
                                    <div
                                        onClick={() => {
                                            const updatedSubTasks = [...(task.SubTasks || [])];
                                            updatedSubTasks[idx].Status = updatedSubTasks[idx].Status === 'Done' ? 'Todo' : 'Done';
                                            const updatedTask = { ...task, SubTasks: updatedSubTasks };
                                            updateTaskMutation.mutate(updatedTask);
                                        }}
                                        className={`mt-0.5 w-4 h-4 rounded border cursor-pointer flex items-center justify-center transition-colors ${sub.Status === 'Done' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 bg-white'}`}
                                    >
                                        {sub.Status === 'Done' && <CheckCircle2 className="w-3 h-3" />}
                                    </div>
                                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { setEditingSubTask(sub); setIsSubTaskModalOpen(true); }}>
                                        <p className={`text-xs font-bold text-gray-800 line-clamp-2 ${sub.Status === 'Done' ? 'line-through text-gray-400' : ''}`}>{sub.Title}</p>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            <span className="text-[10px] text-gray-500 bg-white px-1.5 py-0.5 rounded border border-gray-100 shadow-sm flex items-center gap-1">
                                                <User className="w-3 h-3" />
                                                {sub.AssigneeID ? employees.find(e => e.EmployeeID === sub.AssigneeID)?.FullName : "Chưa gán"}
                                            </span>
                                            {sub.DueDate && (
                                                <span className="text-[10px] text-red-500 bg-white px-1.5 py-0.5 rounded border border-gray-100 shadow-sm flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {sub.DueDate}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => {
                                            if (confirm("Xóa công việc con này?")) {
                                                const updatedSubTasks = (task.SubTasks || []).filter((_, i) => i !== idx);
                                                const updatedTask = { ...task, SubTasks: updatedSubTasks };
                                                updateTaskMutation.mutate(updatedTask);
                                            }
                                        }}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-500 p-1"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Attachments */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Tệp đính kèm</h3>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                                <div className="p-2 bg-white rounded shadow-sm text-red-500"><FileText className="w-4 h-4" /></div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-gray-700 truncate">Mau-to-trinh-phe-duyet.docx</p>
                                    <p className="text-[10px] text-gray-400">1.2 MB • 20/02/2025</p>
                                </div>
                            </div>
                            <div className="text-center pt-2">
                                <button className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1 w-full">
                                    <Paperclip className="w-3 h-3" /> Thêm tài liệu
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SubTask Modal */}
            {isSubTaskModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-800">{editingSubTask ? 'Cập nhật công việc con' : 'Thêm công việc con'}</h3>
                            <button onClick={() => { setIsSubTaskModalOpen(false); setEditingSubTask(null); }} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const title = formData.get('title') as string;
                            const assigneeId = formData.get('assignee') as string;
                            const dueDate = formData.get('dueDate') as string;

                            let updatedSubTasks = [...(task.SubTasks || [])];

                            if (editingSubTask) {
                                updatedSubTasks = updatedSubTasks.map(sub =>
                                    sub.SubTaskID === editingSubTask.SubTaskID
                                        ? { ...sub, Title: title, AssigneeID: assigneeId, DueDate: dueDate }
                                        : sub
                                );
                            } else {
                                const newSubTask = {
                                    SubTaskID: `SUB-${Date.now()}`,
                                    Title: title,
                                    AssigneeID: assigneeId,
                                    DueDate: dueDate,
                                    Status: 'Todo' as const
                                };
                                updatedSubTasks.push(newSubTask);
                            }

                            const updatedTask = { ...task, SubTasks: updatedSubTasks };
                            updateTaskMutation.mutate(updatedTask);
                            setIsSubTaskModalOpen(false);
                            setEditingSubTask(null);
                        }} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung công việc</label>
                                <input defaultValue={editingSubTask?.Title || ''} name="title" required className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Nhập tên đầu việc..." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Người thực hiện</label>
                                <select defaultValue={editingSubTask?.AssigneeID || ''} name="assignee" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                                    <option value="">-- Chọn nhân viên --</option>
                                    {employees.filter(e => e.Status === 1).map(e => (
                                        <option key={e.EmployeeID} value={e.EmployeeID}>{e.FullName} - {e.Department}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Hạn hoàn thành</label>
                                <input defaultValue={editingSubTask?.DueDate || ''} type="date" name="dueDate" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => { setIsSubTaskModalOpen(false); setEditingSubTask(null); }} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">Hủy</button>
                                <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg shadow-blue-200">
                                    {editingSubTask ? 'Lưu thay đổi' : 'Thêm mới'}
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
