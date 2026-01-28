import React, { useState, useEffect } from 'react';
import { X, Calendar, User, AlignLeft, CheckSquare, Clock } from 'lucide-react';
import { Task, TaskStatus, TaskPriority, Employee } from '@/types';
import { mockEmployees } from '@/mockData'; // TODO: Use proper service

interface ProjectTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (task: Partial<Task>) => void;
    initialData?: Partial<Task>;
    stepName?: string; // The Decree 175 Step Name (e.g., "1.1. Lập đề xuất...")
    stepCode?: string;
}

export const ProjectTaskModal: React.FC<ProjectTaskModalProps> = ({ isOpen, onClose, onSubmit, initialData, stepName, stepCode }) => {
    const [formData, setFormData] = useState<Partial<Task>>({
        Title: '',
        Description: '',
        Status: TaskStatus.Todo,
        Priority: TaskPriority.Medium,
        StartDate: '',
        DueDate: '',
        AssigneeID: '',
        ...initialData
    });

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
                ...initialData
            });
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            ...formData,
            TimelineStep: stepCode // Link task to the step
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
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

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">

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
                                    onChange={e => setFormData({ ...formData, StartDate: new Date(e.target.value).toISOString() })} // Simplified date handling
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
                                    onChange={e => setFormData({ ...formData, DueDate: new Date(e.target.value).toISOString() })}
                                />
                                <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <AlignLeft className="w-4 h-4 text-gray-400" /> Diễn giải chi tiết
                        </label>
                        <textarea
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                            placeholder="Nhập ghi chú, yêu cầu kỹ thuật..."
                            value={formData.Description}
                            onChange={e => setFormData({ ...formData, Description: e.target.value })}
                        />
                    </div>

                    {/* Assignee & Status */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-400" /> Người thực hiện
                            </label>
                            <select
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                value={formData.AssigneeID || ''}
                                onChange={e => setFormData({ ...formData, AssigneeID: e.target.value })}
                            >
                                <option value="">-- Chọn nhân sự --</option>
                                {mockEmployees.map(emp => (
                                    <option key={emp.EmployeeID} value={emp.EmployeeID}>
                                        {emp.FullName} - {emp.Department}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700">Trạng thái</label>
                            <select
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                value={formData.Status}
                                onChange={e => setFormData({ ...formData, Status: e.target.value as TaskStatus })}
                            >
                                <option value={TaskStatus.Todo}>Chưa bắt đầu</option>
                                <option value={TaskStatus.InProgress}>Đang thực hiện</option>
                                <option value={TaskStatus.Review}>Đang kiểm tra</option>
                                <option value={TaskStatus.Done}>Hoàn thành</option>
                            </select>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
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
