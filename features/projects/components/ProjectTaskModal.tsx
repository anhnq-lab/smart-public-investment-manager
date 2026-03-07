import React, { useState, useEffect } from 'react';
import { X, Calendar, User, AlignLeft, CheckSquare, Clock, Flag, Link2, BarChart3 } from 'lucide-react';
import { Task, TaskStatus, TaskPriority, TaskDependency, Employee } from '@/types';
import { useEmployees } from '@/hooks/useEmployees';
import { ProgressSlider } from './ProgressSlider';
import { TaskDependencyManager } from './TaskDependencyManager';

interface ProjectTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (task: Partial<Task>) => void;
    initialData?: Partial<Task>;
    stepName?: string;
    stepCode?: string;
    allTasks?: Task[];
}

export const ProjectTaskModal: React.FC<ProjectTaskModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    stepName,
    stepCode,
    allTasks = []
}) => {
    const { data: employees = [] } = useEmployees();
    const [formData, setFormData] = useState<Partial<Task>>({
        Title: '',
        Description: '',
        Status: TaskStatus.Todo,
        Priority: TaskPriority.Medium,
        StartDate: '',
        DueDate: '',
        AssigneeID: '',
        ProgressPercent: 0,
        Dependencies: [],
        ...initialData
    });

    const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');

    useEffect(() => {
        if (isOpen) {
            setFormData({
                Title: '',
                Description: '',
                Status: TaskStatus.Todo,
                Priority: TaskPriority.Medium,
                StartDate: '',
                DueDate: '',
                AssigneeID: '',
                ProgressPercent: 0,
                Dependencies: [],
                ...initialData
            });
            setActiveTab('basic');
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            ...formData,
            TimelineStep: stepCode || formData.TimelineStep
        });
        onClose();
    };

    const handleDependencyUpdate = (dependencies: TaskDependency[]) => {
        setFormData({ ...formData, Dependencies: dependencies });
    };

    const getPriorityColor = (priority: TaskPriority) => {
        switch (priority) {
            case 'High':
            case 'Urgent':
                return 'border-red-500 bg-red-50';
            case 'Medium':
                return 'border-amber-500 bg-amber-50';
            case 'Low':
                return 'border-green-500 bg-green-50';
            default:
                return 'border-gray-300 bg-gray-50';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">
                            {initialData?.TaskID ? 'Cập nhật công việc' : 'Thêm công việc mới'}
                        </h3>
                        {stepName && (
                            <p className="text-xs text-blue-600 font-medium mt-0.5 uppercase tracking-wide">
                                Thuộc bước: {stepName}
                            </p>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 px-6 shrink-0">
                    <button
                        type="button"
                        onClick={() => setActiveTab('basic')}
                        className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === 'basic'
                            ? 'text-blue-600 border-blue-600'
                            : 'text-gray-500 border-transparent hover:text-gray-700'
                            }`}
                    >
                        Thông tin cơ bản
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('advanced')}
                        className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === 'advanced'
                            ? 'text-blue-600 border-blue-600'
                            : 'text-gray-500 border-transparent hover:text-gray-700'
                            }`}
                    >
                        Nâng cao
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-5">

                        {activeTab === 'basic' && (
                            <>
                                {/* Title */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <CheckSquare className="w-4 h-4 text-gray-400" /> Tên công việc <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        placeholder="VD: Lập tờ trình thẩm định..."
                                        value={formData.Title}
                                        onChange={e => setFormData({ ...formData, Title: e.target.value })}
                                    />
                                </div>

                                {/* Date Range */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-gray-400" /> Ngày bắt đầu
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={formData.StartDate ? new Date(formData.StartDate).toISOString().split('T')[0] : ''}
                                                onChange={e => setFormData({ ...formData, StartDate: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                                            />
                                            <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-gray-400" /> Hạn hoàn thành
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={formData.DueDate ? new Date(formData.DueDate).toISOString().split('T')[0] : ''}
                                                onChange={e => setFormData({ ...formData, DueDate: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                                            />
                                            <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                                        </div>
                                    </div>
                                </div>

                                {/* Actual Start/End Dates - show when task has progress */}
                                {((formData.ProgressPercent || 0) > 0 || formData.ActualStartDate || formData.ActualEndDate) && (
                                    <div className="grid grid-cols-2 gap-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-emerald-700 flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-emerald-500" /> Ngày bắt đầu thực tế
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="date"
                                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-emerald-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                                                    value={formData.ActualStartDate ? new Date(formData.ActualStartDate).toISOString().split('T')[0] : ''}
                                                    onChange={e => setFormData({ ...formData, ActualStartDate: e.target.value || '' })}
                                                />
                                                <Calendar className="w-4 h-4 text-emerald-400 absolute left-3 top-3" />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-emerald-700 flex items-center gap-2">
                                                <CheckSquare className="w-4 h-4 text-emerald-500" /> Ngày hoàn thành thực tế
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="date"
                                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-emerald-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                                                    value={formData.ActualEndDate ? new Date(formData.ActualEndDate).toISOString().split('T')[0] : ''}
                                                    onChange={e => setFormData({ ...formData, ActualEndDate: e.target.value || '' })}
                                                />
                                                <Calendar className="w-4 h-4 text-emerald-400 absolute left-3 top-3" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Progress */}
                                <div className="space-y-1.5">
                                    <ProgressSlider
                                        value={formData.ProgressPercent || 0}
                                        onChange={(value) => {
                                            // Auto-derive status from progress
                                            let newStatus = formData.Status;
                                            if (value === 100) newStatus = TaskStatus.Review;
                                            else if (value >= 1) newStatus = TaskStatus.InProgress;
                                            else newStatus = TaskStatus.Todo;
                                            setFormData({ ...formData, ProgressPercent: value, Status: newStatus });
                                        }}
                                    />
                                </div>

                                {/* Description */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <AlignLeft className="w-4 h-4 text-gray-400" /> Diễn giải chi tiết
                                    </label>
                                    <textarea
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none"
                                        placeholder="Nhập ghi chú, yêu cầu kỹ thuật..."
                                        value={formData.Description}
                                        onChange={e => setFormData({ ...formData, Description: e.target.value })}
                                    />
                                </div>

                                {/* Assignee, Status, Priority */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                            <User className="w-4 h-4 text-gray-400" /> Người thực hiện
                                        </label>
                                        <select
                                            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                                            value={formData.AssigneeID || ''}
                                            onChange={e => setFormData({ ...formData, AssigneeID: e.target.value })}
                                        >
                                            <option value="">-- Chọn --</option>
                                            {employees.map(emp => (
                                                <option key={emp.EmployeeID} value={emp.EmployeeID}>
                                                    {emp.FullName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Trạng thái</label>
                                        <select
                                            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                                            value={formData.Status}
                                            onChange={e => {
                                                const newStatus = e.target.value as TaskStatus;
                                                let newProgress = formData.ProgressPercent || 0;
                                                if (newStatus === TaskStatus.Done) newProgress = 100;
                                                else if (newStatus === TaskStatus.Todo) newProgress = 0;
                                                else if (newStatus === TaskStatus.InProgress && newProgress === 0) newProgress = 25;
                                                else if (newStatus === TaskStatus.Review && newProgress < 100) newProgress = 100;
                                                setFormData({ ...formData, Status: newStatus, ProgressPercent: newProgress });
                                            }}
                                        >
                                            <option value={TaskStatus.Todo}>Chưa bắt đầu</option>
                                            <option value={TaskStatus.InProgress}>Đang thực hiện</option>
                                            <option value={TaskStatus.Review}>Đang kiểm tra</option>
                                            <option value={TaskStatus.Done}>Hoàn thành</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                            <Flag className="w-4 h-4 text-gray-400" /> Ưu tiên
                                        </label>
                                        <select
                                            className={`w-full px-3 py-2.5 rounded-lg border-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all ${getPriorityColor(formData.Priority as TaskPriority)}`}
                                            value={formData.Priority}
                                            onChange={e => setFormData({ ...formData, Priority: e.target.value as TaskPriority })}
                                        >
                                            <option value="Low">Thấp</option>
                                            <option value="Medium">Trung bình</option>
                                            <option value="High">Cao</option>
                                            <option value="Urgent">Khẩn cấp</option>
                                        </select>
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'advanced' && (
                            <>
                                {/* Dependencies */}
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                    <TaskDependencyManager
                                        task={formData as Task}
                                        allTasks={allTasks}
                                        onUpdate={handleDependencyUpdate}
                                    />
                                </div>

                                {/* Legal Basis & Output */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">
                                            Căn cứ pháp lý
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="VD: Điều 24 Luật ĐTC"
                                            value={formData.LegalBasis || ''}
                                            onChange={e => setFormData({ ...formData, LegalBasis: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">
                                            Sản phẩm đầu ra
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="VD: Quyết định phê duyệt"
                                            value={formData.OutputDocument || ''}
                                            onChange={e => setFormData({ ...formData, OutputDocument: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Duration & Cost */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">
                                            Thời gian thực hiện (ngày)
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="VD: 15"
                                            value={formData.DurationDays || ''}
                                            onChange={e => setFormData({ ...formData, DurationDays: parseInt(e.target.value) || undefined })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">
                                            Chi phí dự kiến (VNĐ)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="VD: 50,000,000"
                                            value={formData.EstimatedCost || ''}
                                            onChange={e => setFormData({ ...formData, EstimatedCost: parseInt(e.target.value) || undefined })}
                                        />
                                    </div>
                                </div>

                                {/* Approver */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700">
                                        Người phê duyệt
                                    </label>
                                    <select
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                        value={formData.ApproverID || ''}
                                        onChange={e => setFormData({ ...formData, ApproverID: e.target.value })}
                                    >
                                        <option value="">-- Chọn người phê duyệt --</option>
                                        {employees.filter(emp => emp.Position?.includes('Trưởng') || emp.Position?.includes('Giám đốc')).map(emp => (
                                            <option key={emp.EmployeeID} value={emp.EmployeeID}>
                                                {emp.FullName} - {emp.Position}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Critical Path Flag */}
                                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                                    <input
                                        type="checkbox"
                                        id="isCritical"
                                        className="w-4 h-4 text-purple-600 border-purple-300 rounded focus:ring-purple-500"
                                        checked={formData.IsCritical || false}
                                        onChange={e => setFormData({ ...formData, IsCritical: e.target.checked })}
                                    />
                                    <label htmlFor="isCritical" className="text-sm font-medium text-purple-700">
                                        Đánh dấu là Critical Path (ảnh hưởng trực tiếp đến tiến độ dự án)
                                    </label>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md transition-all transform active:scale-95"
                        >
                            {initialData?.TaskID ? 'Lưu thay đổi' : 'Tạo công việc'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
