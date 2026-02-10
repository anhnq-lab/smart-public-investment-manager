import React, { useState, useEffect, useMemo } from 'react';
import {
    X, Building2, Scale, Clock, FileText, ChevronRight,
    Users, Briefcase, Calendar, User, Flag, CheckSquare,
    AlignLeft, BarChart3, Save, Zap
} from 'lucide-react';
import { SubTaskDef } from '@/utils/stepSubtasksRegistry';
import { Task, TaskStatus, TaskPriority, Employee } from '@/types';
import { mockEmployees } from '@/mockData';
import { ProgressSlider } from './ProgressSlider';
import { TemplateViewer } from './TemplateViewer';

interface SubTaskDetailModalProps {
    subTask: SubTaskDef | null;
    stepTitle?: string;
    stepCode?: string;
    isOpen: boolean;
    onClose: () => void;
    onCreateTask?: (task: Partial<Task>) => void;
}

// Danh sách đơn vị phụ trách theo mô hình 2 cấp (NĐ 140/2025)
const RESPONSIBLE_UNITS = [
    'CĐT (Ban QLDA)',
    'Sở Xây dựng',
    'Sở Tài chính',
    'UBND tỉnh',
    'UBND xã',
    'Nhà thầu TVTK',
    'Nhà thầu TVGS',
    'Nhà thầu TV thẩm tra',
    'Nhà thầu TVKS',
    'Nhà thầu thi công',
    'Bên mời thầu (BMT)',
    'Tổ chuyên gia',
    'HĐ thẩm định',
    'KBNN',
    'Hội đồng BT TĐC',
    'CQ chủ trì thẩm định',
    'Người QĐ đầu tư',
    'Chủ tịch UBND tỉnh',
    'HĐND',
    'Đơn vị sử dụng',
];

// Lấy danh sách Phòng ban duy nhất từ employees
function getUniqueDepartments(employees: Employee[]): string[] {
    const deps = new Set<string>();
    employees.forEach(emp => {
        if (emp.Department) deps.add(emp.Department);
    });
    return Array.from(deps).sort();
}

export const SubTaskDetailModal: React.FC<SubTaskDetailModalProps> = ({
    subTask,
    stepTitle,
    stepCode,
    isOpen,
    onClose,
    onCreateTask,
}) => {
    const [showTemplate, setShowTemplate] = useState(false);
    const [mode, setMode] = useState<'view' | 'create'>('view');

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [responsibleUnit, setResponsibleUnit] = useState('');
    const [department, setDepartment] = useState('');
    const [assigneeId, setAssigneeId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [status, setStatus] = useState<TaskStatus>(TaskStatus.Todo);
    const [priority, setPriority] = useState<TaskPriority>(TaskPriority.Medium);
    const [progress, setProgress] = useState(0);
    const [legalBasis, setLegalBasis] = useState('');
    const [durationDays, setDurationDays] = useState<number>(0);

    const departments = useMemo(() => getUniqueDepartments(mockEmployees), []);

    // Filter employees by selected department
    const filteredEmployees = useMemo(() => {
        if (!department) return mockEmployees;
        return mockEmployees.filter(emp => emp.Department === department);
    }, [department]);

    // Pre-fill from registry when subTask changes
    useEffect(() => {
        if (subTask && isOpen) {
            setTitle(subTask.title);
            setDescription(subTask.description || '');
            setResponsibleUnit(subTask.responsible);
            setLegalBasis(subTask.legalBasis || '');
            setDurationDays(subTask.estimatedDays || 0);
            setDepartment('');
            setAssigneeId('');
            setStartDate('');
            setDueDate('');
            setStatus(TaskStatus.Todo);
            setPriority(TaskPriority.Medium);
            setProgress(0);
            setMode('view');
        }
    }, [subTask, isOpen]);

    // Auto-calculate due date from start date + duration
    useEffect(() => {
        if (startDate && durationDays > 0 && !dueDate) {
            const start = new Date(startDate);
            start.setDate(start.getDate() + durationDays);
            setDueDate(start.toISOString().split('T')[0]);
        }
    }, [startDate, durationDays]);

    const handleCreateTask = () => {
        if (!title.trim()) return;

        const taskData: Partial<Task> = {
            Title: title,
            Description: `${description}${legalBasis ? `\n\nCăn cứ pháp lý: ${legalBasis}` : ''}${responsibleUnit ? `\nĐơn vị phụ trách: ${responsibleUnit}` : ''}`,
            Status: status,
            Priority: priority,
            StartDate: startDate ? new Date(startDate).toISOString() : '',
            DueDate: dueDate ? new Date(dueDate).toISOString() : '',
            AssigneeID: assigneeId,
            ProgressPercent: progress,
            TimelineStep: stepCode,
            LegalBasis: legalBasis,
            DurationDays: durationDays || undefined,
        };

        onCreateTask?.(taskData);
        onClose();
    };

    if (!isOpen || !subTask) return null;

    const getPriorityColor = (p: TaskPriority) => {
        switch (p) {
            case 'High': case 'Urgent': return 'border-red-500 bg-red-50 text-red-700';
            case 'Medium': return 'border-amber-500 bg-amber-50 text-amber-700';
            case 'Low': return 'border-green-500 bg-green-50 text-green-700';
            default: return 'border-gray-300 bg-gray-50';
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}>
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
                    onClick={e => e.stopPropagation()}>

                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shrink-0">
                                    <Briefcase size={16} className="text-white" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-base font-bold text-gray-800 truncate">
                                        {subTask.title}
                                    </h3>
                                    {stepTitle && (
                                        <p className="text-xs text-blue-600 font-medium truncate">
                                            Thuộc: {stepTitle}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                            {/* Mode toggle */}
                            <div className="flex bg-gray-200 rounded-lg p-0.5">
                                <button
                                    onClick={() => setMode('view')}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${mode === 'view' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Xem
                                </button>
                                <button
                                    onClick={() => setMode('create')}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${mode === 'create' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Tạo việc
                                </button>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">

                        {/* === VIEW MODE === */}
                        {mode === 'view' && (
                            <>
                                {/* Code badge */}
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-500 text-xs font-mono">
                                        {subTask.code}
                                    </span>
                                </div>

                                {/* Description */}
                                {subTask.description && (
                                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                                        <p className="text-sm text-amber-800">{subTask.description}</p>
                                    </div>
                                )}

                                {/* Info cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {/* Đơn vị phụ trách */}
                                    <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
                                        <Building2 size={18} className="text-blue-500 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-xs text-blue-400 font-medium">Đơn vị phụ trách</p>
                                            <p className="text-sm font-semibold text-blue-800">{subTask.responsible}</p>
                                        </div>
                                    </div>

                                    {/* Thời gian */}
                                    {subTask.estimatedDays && (
                                        <div className="flex items-start gap-3 p-3 rounded-xl bg-orange-50 border border-orange-100">
                                            <Clock size={18} className="text-orange-500 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="text-xs text-orange-400 font-medium">Thời gian ước tính</p>
                                                <p className="text-sm font-semibold text-orange-800">{subTask.estimatedDays} ngày</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Căn cứ pháp lý */}
                                {subTask.legalBasis && (
                                    <div className="flex items-start gap-3 p-3 rounded-xl bg-purple-50 border border-purple-100">
                                        <Scale size={18} className="text-purple-500 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-xs text-purple-400 font-medium">Căn cứ pháp lý</p>
                                            <p className="text-sm text-purple-800">{subTask.legalBasis}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Biểu mẫu */}
                                {subTask.templatePath && (
                                    <button
                                        onClick={() => setShowTemplate(true)}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-cyan-50 border border-cyan-100 hover:bg-cyan-100 transition-colors group"
                                    >
                                        <FileText size={18} className="text-cyan-500 shrink-0" />
                                        <div className="flex-1 text-left">
                                            <p className="text-xs text-cyan-400 font-medium">Biểu mẫu liên kết</p>
                                            <p className="text-sm text-cyan-700 font-semibold">
                                                {subTask.templateLabel || subTask.templatePath}
                                            </p>
                                        </div>
                                        <ChevronRight size={16} className="text-cyan-300 group-hover:text-cyan-600 transition-colors" />
                                    </button>
                                )}

                                {/* CTA to create */}
                                <div className="pt-2">
                                    <button
                                        onClick={() => setMode('create')}
                                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                                    >
                                        <Zap size={18} />
                                        Tạo thành công việc để quản lý
                                    </button>
                                </div>
                            </>
                        )}

                        {/* === CREATE MODE === */}
                        {mode === 'create' && (
                            <>
                                {/* Title */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <CheckSquare className="w-4 h-4 text-gray-400" /> Tên công việc <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                    />
                                </div>

                                {/* Đơn vị phụ trách + Phòng ban */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                            <Building2 className="w-4 h-4 text-gray-400" /> Đơn vị phụ trách
                                        </label>
                                        <select
                                            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                                            value={responsibleUnit}
                                            onChange={e => setResponsibleUnit(e.target.value)}
                                        >
                                            <option value="">-- Chọn --</option>
                                            {RESPONSIBLE_UNITS.map(u => (
                                                <option key={u} value={u}>{u}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                            <Users className="w-4 h-4 text-gray-400" /> Phòng ban
                                        </label>
                                        <select
                                            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                                            value={department}
                                            onChange={e => {
                                                setDepartment(e.target.value);
                                                setAssigneeId(''); // Reset assignee when department changes
                                            }}
                                        >
                                            <option value="">-- Tất cả phòng --</option>
                                            {departments.map(d => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Người phụ trách */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <User className="w-4 h-4 text-gray-400" /> Người phụ trách
                                    </label>
                                    <select
                                        className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                                        value={assigneeId}
                                        onChange={e => setAssigneeId(e.target.value)}
                                    >
                                        <option value="">-- Chọn người --</option>
                                        {filteredEmployees.map(emp => (
                                            <option key={emp.EmployeeID} value={emp.EmployeeID}>
                                                {emp.FullName} — {emp.Position} {emp.Department ? `(${emp.Department})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Date Range */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-400" /> Ngày bắt đầu
                                        </label>
                                        <input
                                            type="date"
                                            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                            value={startDate}
                                            onChange={e => setStartDate(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-gray-400" /> Thời gian (ngày)
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                            value={durationDays || ''}
                                            onChange={e => setDurationDays(parseInt(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-400" /> Hạn hoàn thành
                                        </label>
                                        <input
                                            type="date"
                                            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                            value={dueDate}
                                            onChange={e => setDueDate(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Status + Priority */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Trạng thái</label>
                                        <select
                                            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                                            value={status}
                                            onChange={e => setStatus(e.target.value as TaskStatus)}
                                        >
                                            <option value={TaskStatus.Todo}>Chưa bắt đầu</option>
                                            <option value={TaskStatus.InProgress}>Đang thực hiện</option>
                                            <option value={TaskStatus.Review}>Đang kiểm tra</option>
                                            <option value={TaskStatus.Done}>Hoàn thành</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                            <Flag className="w-4 h-4 text-gray-400" /> Mức ưu tiên
                                        </label>
                                        <select
                                            className={`w-full px-3 py-2.5 rounded-lg border-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all ${getPriorityColor(priority)}`}
                                            value={priority}
                                            onChange={e => setPriority(e.target.value as TaskPriority)}
                                        >
                                            <option value="Low">Thấp</option>
                                            <option value="Medium">Trung bình</option>
                                            <option value="High">Cao</option>
                                            <option value="Urgent">Khẩn cấp</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Progress */}
                                <div className="space-y-1.5">
                                    <ProgressSlider
                                        value={progress}
                                        onChange={setProgress}
                                    />
                                </div>

                                {/* Description */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <AlignLeft className="w-4 h-4 text-gray-400" /> Ghi chú / Diễn giải
                                    </label>
                                    <textarea
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none text-sm"
                                        placeholder="Nhập ghi chú, yêu cầu..."
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                    />
                                </div>

                                {/* Căn cứ pháp lý (read from registry, editable) */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <Scale className="w-4 h-4 text-gray-400" /> Căn cứ pháp lý
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        value={legalBasis}
                                        onChange={e => setLegalBasis(e.target.value)}
                                    />
                                </div>

                                {/* Template link */}
                                {subTask.templatePath && (
                                    <button
                                        type="button"
                                        onClick={() => setShowTemplate(true)}
                                        className="flex items-center gap-2 text-sm text-cyan-600 hover:text-cyan-800 transition-colors"
                                    >
                                        <FileText className="w-4 h-4" />
                                        Xem biểu mẫu: {subTask.templateLabel || subTask.templatePath}
                                    </button>
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    {mode === 'create' && (
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 shrink-0">
                            <button
                                type="button"
                                onClick={() => setMode('view')}
                                className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Quay lại
                            </button>
                            <button
                                type="button"
                                onClick={handleCreateTask}
                                disabled={!title.trim()}
                                className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <Save size={16} />
                                Tạo công việc
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Template Viewer */}
            {subTask.templatePath && (
                <TemplateViewer
                    templatePath={subTask.templatePath}
                    templateLabel={subTask.templateLabel}
                    isOpen={showTemplate}
                    onClose={() => setShowTemplate(false)}
                />
            )}
        </>
    );
};
