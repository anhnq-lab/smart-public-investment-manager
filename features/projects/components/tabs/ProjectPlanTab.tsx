import React, { useState, useMemo, useEffect } from 'react';
import { Task, TaskStatus } from '@/types';
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

export const ProjectPlanTab: React.FC<ProjectPlanTabProps> = ({ tasks: initialTasks, projectID }) => {
    // 1. Local Tasks State (to allow immediate "Save" feedback without full backend)
    const [tasks, setTasks] = useState<Task[]>(initialTasks);

    // Sync tasks if props change (optional, but good practice)
    useEffect(() => {
        if (initialTasks.length > 0 && tasks.length === 0) {
            setTasks(initialTasks);
        }
    }, [initialTasks, tasks]);

    // 2. Compute Parent Item Status & Dates
    // We create a map of "Step Code" -> Aggregated Data
    const stepAggregates = useMemo(() => {
        const map = new Map<string, { status: TaskStatus; startDate: string | null; dueDate: string | null; childCount: number }>();

        // Flatten all items to iterate
        const allItems = DECREE_175_PHASES.flatMap(p => p.items);

        allItems.forEach(item => {
            // Find children for this step
            const children = tasks.filter(t => t.TimelineStep === item.code);

            if (children.length === 0) {
                map.set(item.code, { status: TaskStatus.Todo, startDate: null, dueDate: null, childCount: 0 });
                return;
            }

            // Status Logic:
            // All Done -> Done
            // Any InProgress or Done -> InProgress
            // Else -> Todo
            const allDone = children.every(t => t.Status === TaskStatus.Done);
            const anyActive = children.some(t => t.Status === TaskStatus.InProgress || t.Status === TaskStatus.Done || t.Status === TaskStatus.Review);

            let status = TaskStatus.Todo;
            if (allDone) status = TaskStatus.Done;
            else if (anyActive) status = TaskStatus.InProgress;

            // Date Logic
            const startDates = children.map(t => new Date(t.StartDate).getTime()).filter(t => !isNaN(t));
            const dueDates = children.map(t => new Date(t.DueDate).getTime()).filter(t => !isNaN(t));

            const minStart = startDates.length > 0 ? new Date(Math.min(...startDates)).toISOString() : null;
            const maxDue = dueDates.length > 0 ? new Date(Math.max(...dueDates)).toISOString() : null;

            map.set(item.code, { status, startDate: minStart, dueDate: maxDue, childCount: children.length });
        });

        return map;
    }, [tasks]);

    // 3. Prepare Gantt Data (Parents Only)
    const ganttTasks = useMemo(() => {
        const allItems = DECREE_175_PHASES.flatMap(p => p.items);
        return allItems
            .map(item => {
                const agg = stepAggregates.get(item.code);
                if (!agg || !agg.startDate || !agg.dueDate) return null; // Skip if no dates (no children or empty dates)

                // Return a Synthetic Task for the Gantt
                return {
                    TaskID: item.code,
                    Title: `${item.id}. ${item.title}`,
                    StartDate: agg.startDate,
                    DueDate: agg.dueDate,
                    Status: agg.status,
                    Priority: 'Medium',
                    Description: 'Tổng hợp từ các công việc con',
                    AssigneeID: '',
                    TimelineStep: item.code
                } as Task;
            })
            .filter((t): t is Task => t !== null); // Remove nulls
    }, [stepAggregates]);


    // Basic state
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

    const handleQuickStatusChange = (e: React.MouseEvent, task: Task) => {
        e.stopPropagation(); // Prevent opening modal
        const statusCycle: Record<TaskStatus, TaskStatus> = {
            [TaskStatus.Todo]: TaskStatus.InProgress,
            [TaskStatus.InProgress]: TaskStatus.Done,
            [TaskStatus.Done]: TaskStatus.Todo,
            [TaskStatus.Review]: TaskStatus.Done // Handle Review if exists
        };
        const newStatus = statusCycle[task.Status] || TaskStatus.InProgress;
        handleSaveTask({ ...task, Status: newStatus });
    };

    const handleEditTask = (task: Task) => {
        setEditingTask(task);
        setSelectedStep(null);
        setIsTaskModalOpen(true);
    };

    const handleSaveTask = (taskData: Partial<Task>) => {
        if (taskData.TaskID) {
            // Edit Mode
            setTasks(prev => prev.map(t => t.TaskID === taskData.TaskID ? { ...t, ...taskData } as Task : t));
        } else {
            // Create Mode
            const newTask: Task = {
                ...taskData as Task,
                TaskID: `NEW_${Date.now()}`, // Temporary ID
                ProjectID: projectID || 'PROJ_001',
                CreatedDate: new Date().toISOString()
            };
            setTasks(prev => [...prev, newTask]);
        }
        setIsTaskModalOpen(false);
    };

    return (
        <div className="animate-in slide-in-from-bottom-2 duration-500 space-y-6 max-w-6xl mx-auto py-4">

            {/* Header */}
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

            {/* Gantt Chart Section (Parents Only) */}
            {showGantt && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h4 className="font-bold text-gray-700 text-xs uppercase flex items-center gap-2">
                            <Layers className="w-4 h-4" /> Tiến độ tổng thể (Gantt)
                        </h4>
                        <span className="text-[10px] text-gray-400 font-normal normal-case">
                            * Chỉ hiển thị các hạng mục lớn đã có công việc thành phần
                        </span>
                    </div>
                    <div className="p-4">
                        {ganttTasks.length > 0 ? (
                            <ProjectGanttChart tasks={ganttTasks} />
                        ) : (
                            <div className="h-32 flex items-center justify-center text-gray-400 text-sm italic">
                                Chưa có công việc nào được cập nhật thời gian. Hãy thêm công việc bên dưới.
                            </div>
                        )}
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
                                {phase.items.map((item) => {
                                    // Get Children and Aggregated Status
                                    const linkedTasks = tasks.filter(t => t.TimelineStep === item.code);
                                    const agg = stepAggregates.get(item.code);
                                    const parentStatus = agg?.status || TaskStatus.Todo;
                                    const isParentDone = parentStatus === TaskStatus.Done;
                                    const isParentInProgress = parentStatus === TaskStatus.InProgress;

                                    return (
                                        <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors group">
                                            <div className="flex items-start gap-4">
                                                {/* Parent Status Icon */}
                                                <div className="mt-1">
                                                    {isParentDone ? (
                                                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                    ) : isParentInProgress ? (
                                                        <Clock className="w-5 h-5 text-orange-500 animate-pulse" />
                                                    ) : (
                                                        <Circle className="w-5 h-5 text-gray-300" />
                                                    )}
                                                </div>

                                                <div className="flex-1">
                                                    {/* Parent Title Line */}
                                                    <div className="flex justify-between items-start">
                                                        <h5 className={`text-sm font-medium ${isParentDone ? 'text-gray-900' : 'text-gray-600'}`}>
                                                            {item.id}. {item.title}
                                                        </h5>
                                                        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            Điều 4 - NĐ175
                                                        </span>
                                                    </div>

                                                    {/* Parent Date Summary (if available) */}
                                                    {(agg?.startDate || agg?.dueDate) && (
                                                        <div className="text-[10px] text-gray-400 mt-1 mb-2 flex gap-2">
                                                            {agg.startDate && <span>Bắt đầu: {new Date(agg.startDate).toLocaleDateString('vi-VN')}</span>}
                                                            {agg.dueDate && <span>Kết thúc: {new Date(agg.dueDate).toLocaleDateString('vi-VN')}</span>}
                                                        </div>
                                                    )}

                                                    {/* Children List */}
                                                    {linkedTasks.length > 0 && (
                                                        <div className="mt-2 ml-[-4px] pl-4 border-l-2 border-gray-200 space-y-1">
                                                            {linkedTasks.map(t => (
                                                                <div
                                                                    key={t.TaskID}
                                                                    onClick={() => handleEditTask(t)}
                                                                    className="flex items-center gap-2 text-xs cursor-pointer hover:bg-white p-1 rounded transition-colors group/task"
                                                                >
                                                                    {/* Quick Status Toggle */}
                                                                    <button
                                                                        onClick={(e) => handleQuickStatusChange(e, t)}
                                                                        className={`w-3 h-3 rounded-full mr-2 transition-transform hover:scale-125 focus:outline-none ${t.Status === 'Done' ? 'bg-emerald-500' :
                                                                                t.Status === 'InProgress' ? 'bg-orange-500' :
                                                                                    'bg-gray-300 hover:bg-gray-400'
                                                                            }`}
                                                                        title="Bấm để chuyển trạng thái"
                                                                    />

                                                                    <span className={`font-medium transition-colors ${t.Status === 'Done' ? 'text-gray-400 line-through' :
                                                                            t.Status === 'InProgress' ? 'text-orange-600' :
                                                                                'text-gray-700 hover:text-blue-600'
                                                                        }`}>
                                                                        {t.Title}
                                                                    </span>

                                                                    <span className="text-gray-400 text-[10px]">- {t.AssigneeID || 'Chưa giao'}</span>
                                                                    <span className="text-[10px] text-gray-400 ml-auto flex items-center gap-2">
                                                                        {t.DueDate ? new Date(t.DueDate).toLocaleDateString('vi-VN') : ''}
                                                                        {/* Edit Hint */}
                                                                        <span className="opacity-0 group-hover/task:opacity-100 text-blue-600 text-[9px] font-bold uppercase tracking-wider">
                                                                            Sửa
                                                                        </span>
                                                                    </span>
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
