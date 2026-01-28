import React, { useState } from 'react';
import { Task } from '@/types';
import { Layers, CheckCircle2, Circle, Clock, ChevronDown, ChevronRight, FileText, AlertCircle } from 'lucide-react';
import { ProjectGanttChart } from '../ProjectGanttChart';
import { ProjectTaskModal } from '../ProjectTaskModal';

interface ProjectPlanTabProps {
    tasks: Task[];
    projectID?: string;
}

// Decree 175 Standard Phases
const DECREE_175_PHASES = [
    {
        id: 'PHASE_1',
        title: 'I. GIAI ĐOẠN CHUẨN BỊ DỰ ÁN',
        description: 'Lập, thẩm định, phê duyệt chủ trương và dự án đầu tư',
        items: [
            { id: '1.1', title: 'Lập đề xuất chương trình, dự án (ODA)', code: 'PREP_ODA' },
            { id: '1.2', title: 'Lập, thẩm định Báo cáo NCTKT / Đề xuất chủ trương đầu tư', code: 'PREP_POLICY' },
            { id: '1.3', title: 'Khảo sát xây dựng phục vụ lập dự án', code: 'PREP_SURVEY' },
            { id: '1.4', title: 'Lập, thẩm định, phê duyệt Quy hoạch xây dựng', code: 'PREP_PLANNING' },
            { id: '1.5', title: 'Lập, thẩm định Báo cáo NCKT / Báo cáo KT-KT', code: 'PREP_FEASIBILITY' },
            { id: '1.6', title: 'Quyết định đầu tư xây dựng', code: 'PREP_DECISION' }
        ]
    },
    {
        id: 'PHASE_2',
        title: 'II. GIAI ĐOẠN THỰC HIỆN DỰ ÁN',
        description: 'Triển khai chi tiết, thi công và giám sát',
        items: [
            { id: '2.1', title: 'Chuẩn bị mặt bằng xây dựng, rà phá bom mìn', code: 'IMPL_SITE' },
            { id: '2.2', title: 'Khảo sát xây dựng phục vụ thiết kế', code: 'IMPL_SURVEY' },
            { id: '2.3', title: 'Lập, thẩm định, phê duyệt Thiết kế & Dự toán', code: 'IMPL_DESIGN' },
            { id: '2.4', title: 'Cấp Giấy phép xây dựng', code: 'IMPL_PERMIT' },
            { id: '2.5', title: 'Lựa chọn nhà thầu và ký kết hợp đồng', code: 'IMPL_BIDDING' },
            { id: '2.6', title: 'Thi công xây dựng công trình', code: 'IMPL_CONSTRUCTION' },
            { id: '2.7', title: 'Giám sát thi công xây dựng', code: 'IMPL_SUPERVISION' },
            { id: '2.8', title: 'Tạm ứng, thanh toán khối lượng hoàn thành', code: 'IMPL_PAYMENT' },
            { id: '2.9', title: 'Nghiệm thu hoàn thành công trình', code: 'IMPL_ACCEPTANCE' }
        ]
    },
    {
        id: 'PHASE_3',
        title: 'III. GIAI ĐOẠN KẾT THÚC XÂY DỰNG',
        description: 'Bàn giao, quyết toán và bảo hành',
        items: [
            { id: '3.1', title: 'Quyết toán hợp đồng xây dựng', code: 'CLOSE_CONTRACT_SETTLEMENT' },
            { id: '3.2', title: 'Quyết toán vốn đầu tư dự án hoàn thành', code: 'CLOSE_CAPITAL_SETTLEMENT' },
            { id: '3.3', title: 'Bàn giao công trình đưa vào sử dụng', code: 'CLOSE_HANDOVER' },
            { id: '3.4', title: 'Bảo hành công trình xây dựng', code: 'CLOSE_WARRANTY' },
            { id: '3.5', title: 'Bàn giao hồ sơ lưu trữ', code: 'CLOSE_ARCHIVE' }
        ]
    }
];

export const ProjectPlanTab: React.FC<ProjectPlanTabProps> = ({ tasks, projectID }) => {
    // Basic state to toggle Gantt view
    const [showGantt, setShowGantt] = useState(true);
    const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({
        'PHASE_1': true,
        'PHASE_2': true,
        'PHASE_3': true
    });

    // Modal State
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [selectedStep, setSelectedStep] = useState<{ name: string; code: string } | null>(null);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    const togglePhase = (id: string) => {
        setExpandedPhases(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleAddTask = (stepName: string, stepCode: string) => {
        setSelectedStep({ name: stepName, code: stepCode });
        setEditingTask(null);
        setIsTaskModalOpen(true);
    };

    const handleEditTask = (task: Task) => {
        setEditingTask(task);
        setSelectedStep(null); // Or derive step from task.TimelineStep if possible
        setIsTaskModalOpen(true);
    };

    const handleSaveTask = (taskData: Partial<Task>) => {
        console.log("Saving Task:", taskData);
        // TODO: Call API to create/update task
        // For now, just close modal
        setIsTaskModalOpen(false);
        alert(`Đã lưu công việc: ${taskData.Title} (Mock)`);
    };

    return (
        <div className="animate-in slide-in-from-bottom-2 duration-500 space-y-6 max-w-6xl mx-auto py-4">

            {/* Header / Strategy Selection */}
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex justify-between items-center">
                <div>
                    <h3 className="text-blue-900 font-bold flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Kế hoạch thực hiện dự án
                    </h3>
                    <p className="text-xs text-blue-600 mt-1">
                        Căn cứ theo Điều 4, Nghị định 175/NĐ-CP về trình tự đầu tư xây dựng.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowGantt(!showGantt)}
                        className={`text-xs font-bold px-3 py-2 rounded-md transition-colors border ${showGantt ? 'bg-white text-blue-700 border-blue-200 shadow-sm' : 'bg-transparent text-blue-500 border-transparent hover:bg-blue-100'}`}
                    >
                        {showGantt ? 'Ẩn biểu đồ Gantt' : 'Xem biểu đồ Gantt'}
                    </button>
                </div>
            </div>

            {/* Gantt Chart Section */}
            {showGantt && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h4 className="font-bold text-gray-700 text-xs uppercase flex items-center gap-2">
                            <Layers className="w-4 h-4" /> Tiến độ tổng thể (Gantt)
                        </h4>
                    </div>
                    <div className="p-4">
                        <ProjectGanttChart tasks={tasks} />
                    </div>
                </div>
            )}

            {/* Standard Implementation Steps */}
            <div className="space-y-4">
                {DECREE_175_PHASES.map((phase) => (
                    <div key={phase.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        {/* Phase Header */}
                        <div
                            className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => togglePhase(phase.id)}
                        >
                            <div>
                                <h4 className="font-bold text-gray-800 text-sm uppercase">{phase.title}</h4>
                                <p className="text-xs text-gray-500 mt-0.5">{phase.description}</p>
                            </div>
                            {expandedPhases[phase.id] ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                        </div>

                        {/* Phase Items */}
                        {expandedPhases[phase.id] && (
                            <div className="divide-y divide-gray-100">
                                {phase.items.map((item, index) => {
                                    // Pseudo-logic to check if this item has linked tasks (mock)
                                    // In real app, we would match tasks by 'TimelineStep' or 'Code'
                                    const linkedTasks = tasks.filter(t => t.Title.toLowerCase().includes(item.title.toLowerCase()) || (index === 0 && tasks.length > 0)); // Hack for demo
                                    const isDone = linkedTasks.some(t => t.Status === 'Done');
                                    const inProgress = linkedTasks.some(t => t.Status === 'InProgress');

                                    return (
                                        <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors group">
                                            <div className="flex items-start gap-4">
                                                <div className="mt-1">
                                                    {isDone ? (
                                                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                    ) : inProgress ? (
                                                        <Clock className="w-5 h-5 text-blue-500 animate-pulse" />
                                                    ) : (
                                                        <Circle className="w-5 h-5 text-gray-300" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <h5 className={`text-sm font-medium ${isDone ? 'text-gray-900' : 'text-gray-600'}`}>
                                                            {item.id}. {item.title}
                                                        </h5>
                                                        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            Điều 4 - NĐ175
                                                        </span>
                                                    </div>

                                                    {/* Linked Tasks Preview */}
                                                    {linkedTasks.length > 0 && (
                                                        <div className="mt-2 ml-[-4px] pl-4 border-l-2 border-gray-200 space-y-1">
                                                            {linkedTasks.map(t => (
                                                                <div
                                                                    key={t.TaskID}
                                                                    onClick={() => handleEditTask(t)}
                                                                    className="flex items-center gap-2 text-xs cursor-pointer hover:bg-white p-1 rounded transition-colors"
                                                                >
                                                                    <span className={`w-1.5 h-1.5 rounded-full ${t.Status === 'Done' ? 'bg-emerald-500' : t.Status === 'InProgress' ? 'bg-blue-500' : 'bg-gray-300'}`}></span>
                                                                    <span className="text-gray-600 font-medium hover:text-blue-600 hover:underline">{t.Title}</span>
                                                                    <span className="text-gray-400">- {t.AssigneeID || 'Chưa giao'}</span>
                                                                    <span className="text-[10px] text-gray-400 ml-auto">{t.DueDate ? new Date(t.DueDate).toLocaleDateString('vi-VN') : ''}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleAddTask(item.title, item.code)}
                                                        className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200"
                                                    >
                                                        + Thêm công việc
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Task Modal */}
            <ProjectTaskModal
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                onSubmit={handleSaveTask}
                initialData={editingTask || {}}
                stepName={selectedStep?.name}
                stepCode={selectedStep?.code}
            />
        </div>
    );
};
