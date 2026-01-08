import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Task, TaskStatus, TaskPriority } from '../types';
import { mockEmployees, mockProjects, loadTasksFromStorage } from '../mockData';
import { TaskService } from '../services/taskService';
import { ArrowLeft, Calendar, FileText, CheckCircle2, Clock, AlertCircle, Building2, User, Scale, ShieldCheck, DollarSign, Paperclip, ChevronRight, Plus, Trash2, UserPlus } from 'lucide-react';

const TaskDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [task, setTask] = useState<Task | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubTaskModalOpen, setIsSubTaskModalOpen] = useState(false);
    const [editingSubTask, setEditingSubTask] = useState<any>(null);

    useEffect(() => {
        // Find task from service
        const allTasks = TaskService.getAllTasks();
        const found = allTasks.find(t => t.TaskID === id);
        setTask(found || null);
        setLoading(false);
    }, [id]);

    if (loading) return <div className="p-8 text-center text-gray-500">Đang tải...</div>;
    if (!task) return <div className="p-8 text-center text-red-500">Không tìm thấy công việc!</div>;

    const project = mockProjects.find(p => p.ProjectID === task.ProjectID);
    const assignee = mockEmployees.find(e => e.EmployeeID === task.AssigneeID);

    // Helper colors
    const getStatusColor = (s: TaskStatus) => {
        switch (s) {
            case TaskStatus.Done: return 'bg-emerald-500 text-white';
            case TaskStatus.InProgress: return 'bg-blue-500 text-white';
            case TaskStatus.Review: return 'bg-purple-500 text-white';
            default: return 'bg-gray-200 text-gray-700';
        }
    };

    return (
        <div className="bg-[#F8FAFC] min-h-screen p-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="max-w-5xl mx-auto mb-6">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors mb-4">
                    <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
                </button>
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-widest ${getStatusColor(task.Status)}`}>
                                {task.Status}
                            </span>
                            <span className="text-sm font-mono text-gray-400">{task.TaskID}</span>
                        </div>
                        <h1 className="text-2xl font-black text-gray-800 leading-tight mb-2">{task.Title}</h1>
                        <p className="text-gray-500 flex items-center gap-2 text-sm">
                            <Building2 className="w-4 h-4" /> Thuộc dự án: <span className="font-bold text-blue-600">{project?.ProjectName}</span>
                        </p>
                    </div>
                    {/* Actions */}
                    <div className="flex gap-2">
                        {/* Add action buttons here (Edit, Complete, etc.) */}
                    </div>
                </div>
            </div>

            {/* Content Grid */}
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

                    {/* Regulatory Information (The "More Info") */}
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
                                    <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Sản phẩm / Kết quả đẩu ra</label>
                                    <div className="flex items-start gap-2 bg-emerald-50 p-3 rounded-lg text-emerald-800 text-sm font-medium">
                                        <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                                        {task.OutputDocument || "Chưa xác định sản phẩm"}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Bước thực hiện</label>
                                    <p className="text-sm font-bold text-gray-800">{task.TimelineStep || "Chưa phân loại"}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Thời gian quy định</label>
                                    <p className="text-sm font-bold text-gray-800 flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5 text-gray-400" /> {task.DurationDays ? `${task.DurationDays} ngày` : "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Công việc tiền quyết</label>
                                    <p className="text-sm font-mono text-gray-500">
                                        {task.PredecessorTaskID ? (
                                            <span className="bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 cursor-pointer">{task.PredecessorTaskID}</span>
                                        ) : "Không có"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Metadata */}
            </div>

            {/* Right Column: Metadata */}
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
                            <p className="text-sm font-medium text-red-600 bg-red-50 px-2 py-1 rounded inline-block">
                                {task.DueDate}
                            </p>
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 flex items-center gap-1"><User className="w-3 h-3" /> Người phê duyệt</label>
                            <p className="text-sm font-medium text-gray-700">
                                {task.ApproverID ? mockEmployees.find(e => e.EmployeeID === task.ApproverID)?.FullName : "Lãnh đạo Ban"}
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

                {/* Subtasks Section for Delegation */}
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
                                        setTask(updatedTask);
                                        TaskService.saveTask(updatedTask);
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
                                            {sub.AssigneeID ? mockEmployees.find(e => e.EmployeeID === sub.AssigneeID)?.FullName : "Chưa gán"}
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
                                            setTask(updatedTask);
                                            TaskService.saveTask(updatedTask);
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
                            const assignee = formData.get('assignee') as string;
                            const dueDate = formData.get('dueDate') as string;

                            let updatedSubTasks = [...(task.SubTasks || [])];

                            if (editingSubTask) {
                                // Update existing
                                updatedSubTasks = updatedSubTasks.map(sub =>
                                    sub.SubTaskID === editingSubTask.SubTaskID
                                        ? { ...sub, Title: title, AssigneeID: assignee, DueDate: dueDate }
                                        : sub
                                );
                            } else {
                                // Create new
                                const newSubTask = {
                                    SubTaskID: `SUB-${Date.now()}`,
                                    Title: title,
                                    AssigneeID: assignee,
                                    DueDate: dueDate,
                                    Status: 'Todo' as const
                                };
                                updatedSubTasks.push(newSubTask);
                            }

                            const updatedTask = { ...task, SubTasks: updatedSubTasks };
                            setTask(updatedTask);
                            TaskService.saveTask(updatedTask);
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
                                    {mockEmployees.filter(e => e.Status === 1).map(e => (
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
