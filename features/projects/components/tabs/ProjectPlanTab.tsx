import React, { useState, useMemo, useEffect } from 'react';
import { Task, TaskStatus, Employee, ProjectGroup } from '@/types';
import {
    Layers, CheckCircle2, Circle, Clock, ChevronDown, ChevronRight,
    FileText, AlertCircle, Plus, Calendar, User, Flag, Zap, Building2, Scale, Info
} from 'lucide-react';
import { ProjectGanttChart } from '../ProjectGanttChart';
import { ProjectTaskModal } from '../ProjectTaskModal';
import { PlanStatisticsHeader } from '../PlanStatisticsHeader';
import { PhaseProgressCard } from '../PhaseProgressCard';
import { MilestoneTimeline } from '../MilestoneTimeline';
import { TaskFilterBar, TaskFilter, TaskViewMode } from '../TaskFilterBar';
import { KanbanBoardView } from '../KanbanBoardView';
import { ResourceAllocationView } from '../ResourceAllocationView';
import { ProgressBadge } from '../ProgressSlider';
import { getSubTasksForStep, hasSubTasks, SubTaskDef } from '@/utils/stepSubtasksRegistry';
import { SubTaskDetailModal } from '../SubTaskDetailModal';

interface ProjectPlanTabProps {
    tasks: Task[];
    projectID?: string;
    onSaveTask?: (task: Task) => void;
    employees?: Employee[];
    currentUserId?: string;
    groupCode?: ProjectGroup;
    isODA?: boolean;
}

/**
 * Sinh kế hoạch thực hiện dự án theo nhóm (NĐ 175/2024 & Luật ĐTC 2019)
 * - Nhóm A/QN: BC NCTKT → BC NCKT → 3 bước TK
 * - Nhóm B: Đề xuất chủ trương ĐT → BC NCKT → 2 bước TK  
 * - Nhóm C: Đề xuất chủ trương ĐT → BC KT-KT → 1 bước TK
 */
const getProjectPhases = (groupCode: ProjectGroup = ProjectGroup.C, isODA: boolean = false) => {
    // --- PHASE 1: Chuẩn bị dự án ---
    const phase1Items: { id: string; title: string; code: string }[] = [];
    let stepNum = 1;

    // 1.1 ODA - chỉ khi dự án sử dụng vốn ODA
    if (isODA) {
        phase1Items.push({ id: `1.${stepNum}`, title: 'Lập đề xuất chương trình, dự án (ODA)', code: 'PREP_ODA' });
        stepNum++;
    }

    // 1.2 Chủ trương đầu tư
    if (groupCode === ProjectGroup.A || groupCode === ProjectGroup.QN) {
        // Nhóm A/QN: Lập Báo cáo nghiên cứu tiền khả thi
        phase1Items.push({ id: `1.${stepNum}`, title: 'Lập, thẩm định Báo cáo nghiên cứu tiền khả thi (NCTKT)', code: 'PREP_PREFEASIBILITY' });
        stepNum++;
        phase1Items.push({ id: `1.${stepNum}`, title: 'Quyết định chủ trương đầu tư', code: 'PREP_POLICY' });
    } else {
        // Nhóm B/C: Báo cáo đề xuất chủ trương đầu tư
        phase1Items.push({ id: `1.${stepNum}`, title: 'Lập Báo cáo đề xuất chủ trương đầu tư', code: 'PREP_POLICY' });
    }
    stepNum++;

    // Khảo sát XD
    phase1Items.push({ id: `1.${stepNum}`, title: 'Khảo sát xây dựng phục vụ lập dự án', code: 'PREP_SURVEY' });
    stepNum++;

    // Quy hoạch XD
    phase1Items.push({ id: `1.${stepNum}`, title: 'Lập, thẩm định, phê duyệt Quy hoạch xây dựng', code: 'PREP_PLANNING' });
    stepNum++;

    // BC NCKT hoặc BC KT-KT
    if (groupCode === ProjectGroup.C) {
        phase1Items.push({ id: `1.${stepNum}`, title: 'Lập, thẩm định Báo cáo kinh tế - kỹ thuật (BCKTKT)', code: 'PREP_FEASIBILITY' });
    } else {
        phase1Items.push({ id: `1.${stepNum}`, title: 'Lập, thẩm định Báo cáo nghiên cứu khả thi (BCNCKT)', code: 'PREP_FEASIBILITY' });
    }
    stepNum++;

    // QĐ đầu tư
    phase1Items.push({ id: `1.${stepNum}`, title: 'Quyết định phê duyệt dự án đầu tư xây dựng', code: 'PREP_DECISION' });

    // --- PHASE 2: Thực hiện dự án ---
    const phase2Items: { id: string; title: string; code: string }[] = [
        { id: '2.1', title: 'Chuẩn bị mặt bằng xây dựng, rà phá bom mìn', code: 'IMPL_SITE' },
        { id: '2.2', title: 'Khảo sát xây dựng phục vụ thiết kế', code: 'IMPL_SURVEY' },
    ];

    // Thiết kế theo nhóm
    if (groupCode === ProjectGroup.C) {
        // Nhóm C: thiết kế bản vẽ thi công (1 bước, nằm trong BCKTKT)
        phase2Items.push({ id: '2.3', title: 'Thiết kế bản vẽ thi công & Dự toán', code: 'IMPL_DESIGN' });
    } else {
        // Nhóm A/B: thiết kế triển khai sau TKCS
        phase2Items.push({ id: '2.3', title: 'Lập, thẩm định, phê duyệt Thiết kế xây dựng & Dự toán', code: 'IMPL_DESIGN' });
    }

    phase2Items.push(
        { id: '2.4', title: 'Cấp Giấy phép xây dựng', code: 'IMPL_PERMIT' },
        { id: '2.5', title: 'Lựa chọn nhà thầu và ký kết hợp đồng', code: 'IMPL_BIDDING' },
        { id: '2.6', title: 'Thi công xây dựng công trình', code: 'IMPL_CONSTRUCTION' },
        { id: '2.7', title: 'Giám sát thi công xây dựng', code: 'IMPL_SUPERVISION' },
        { id: '2.8', title: 'Tạm ứng, thanh toán khối lượng hoàn thành', code: 'IMPL_PAYMENT' },
        { id: '2.9', title: 'Nghiệm thu hoàn thành công trình', code: 'IMPL_ACCEPTANCE' }
    );

    // --- PHASE 3: Kết thúc xây dựng (giống nhau cho mọi nhóm) ---
    const phase3Items = [
        { id: '3.1', title: 'Quyết toán hợp đồng xây dựng', code: 'CLOSE_CONTRACT_SETTLEMENT' },
        { id: '3.2', title: 'Quyết toán vốn đầu tư dự án hoàn thành', code: 'CLOSE_CAPITAL_SETTLEMENT' },
        { id: '3.3', title: 'Bàn giao công trình đưa vào sử dụng', code: 'CLOSE_HANDOVER' },
        { id: '3.4', title: 'Bảo hành công trình xây dựng', code: 'CLOSE_WARRANTY' },
        { id: '3.5', title: 'Bàn giao hồ sơ lưu trữ', code: 'CLOSE_ARCHIVE' }
    ];

    return [
        {
            id: 'PHASE_1',
            title: 'I. GIAI ĐOẠN CHUẨN BỊ DỰ ÁN',
            description: groupCode === ProjectGroup.C
                ? 'Lập đề xuất chủ trương, thẩm định BC KT-KT'
                : groupCode === ProjectGroup.A || groupCode === ProjectGroup.QN
                    ? 'Lập BC NCTKT, thẩm định, phê duyệt chủ trương và BC NCKT'
                    : 'Lập đề xuất chủ trương, thẩm định BC NCKT',
            items: phase1Items
        },
        {
            id: 'PHASE_2',
            title: 'II. GIAI ĐOẠN THỰC HIỆN DỰ ÁN',
            description: 'Triển khai chi tiết, thi công và giám sát',
            items: phase2Items
        },
        {
            id: 'PHASE_3',
            title: 'III. GIAI ĐOẠN KẾT THÚC XÂY DỰNG',
            description: 'Bàn giao, quyết toán và bảo hành',
            items: phase3Items
        }
    ];
};

/** Label nhóm dự án */
const getGroupLabel = (g?: ProjectGroup) => {
    switch (g) {
        case ProjectGroup.QN: return 'Quan trọng QG';
        case ProjectGroup.A: return 'Nhóm A';
        case ProjectGroup.B: return 'Nhóm B';
        case ProjectGroup.C: return 'Nhóm C';
        default: return 'Nhóm C';
    }
};

export const ProjectPlanTab: React.FC<ProjectPlanTabProps> = ({
    tasks: initialTasks,
    projectID,
    onSaveTask,
    employees = [],
    currentUserId,
    groupCode = ProjectGroup.C,
    isODA = false
}) => {
    // Dynamic phases based on project group
    const DECREE_175_PHASES = useMemo(() => getProjectPhases(groupCode, isODA), [groupCode, isODA]);
    // 1. Local Tasks State (Optimistic UI)
    const [tasks, setTasks] = useState<Task[]>(initialTasks);

    // Sync from props
    useEffect(() => {
        setTasks(initialTasks);
    }, [initialTasks]);

    // UI State
    const [currentView, setCurrentView] = useState<TaskViewMode>('wbs');
    const [currentFilter, setCurrentFilter] = useState<TaskFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({
        'PHASE_1': false, 'PHASE_2': false, 'PHASE_3': false
    });
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [selectedStep, setSelectedStep] = useState<{ name: string; code: string } | null>(null);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    // Sub-task registry state
    const [expandedSubTasks, setExpandedSubTasks] = useState<Record<string, boolean>>({});
    const [selectedSubTask, setSelectedSubTask] = useState<{ def: SubTaskDef; stepTitle: string } | null>(null);

    // 2. Filter Tasks
    const filteredTasks = useMemo(() => {
        let filtered = [...tasks];

        // Apply search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(t =>
                t.Title.toLowerCase().includes(query) ||
                t.Description?.toLowerCase().includes(query)
            );
        }

        // Apply filter
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() + 7);

        switch (currentFilter) {
            case 'my-tasks':
                filtered = filtered.filter(t =>
                    t.AssigneeID === currentUserId ||
                    t.Assignees?.some(a => a.EmployeeID === currentUserId)
                );
                break;
            case 'overdue':
                filtered = filtered.filter(t => {
                    if (t.Status === TaskStatus.Done) return false;
                    if (!t.DueDate) return false;
                    return new Date(t.DueDate) < today;
                });
                break;
            case 'this-week':
                filtered = filtered.filter(t => {
                    if (!t.DueDate) return false;
                    const dueDate = new Date(t.DueDate);
                    return dueDate >= today && dueDate <= weekEnd;
                });
                break;
            case 'critical':
                filtered = filtered.filter(t => t.IsCritical);
                break;
            case 'in-progress':
                filtered = filtered.filter(t =>
                    t.Status === TaskStatus.InProgress || t.Status === TaskStatus.Review
                );
                break;
            case 'completed':
                filtered = filtered.filter(t => t.Status === TaskStatus.Done);
                break;
        }

        return filtered;
    }, [tasks, currentFilter, searchQuery, currentUserId]);

    // 3. Task Counts for Filter Bar
    const taskCounts = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() + 7);

        return {
            all: tasks.length,
            myTasks: tasks.filter(t =>
                t.AssigneeID === currentUserId ||
                t.Assignees?.some(a => a.EmployeeID === currentUserId)
            ).length,
            overdue: tasks.filter(t => {
                if (t.Status === TaskStatus.Done) return false;
                if (!t.DueDate) return false;
                return new Date(t.DueDate) < today;
            }).length,
            thisWeek: tasks.filter(t => {
                if (!t.DueDate) return false;
                const dueDate = new Date(t.DueDate);
                return dueDate >= today && dueDate <= weekEnd;
            }).length,
            critical: tasks.filter(t => t.IsCritical).length,
            inProgress: tasks.filter(t =>
                t.Status === TaskStatus.InProgress || t.Status === TaskStatus.Review
            ).length,
            completed: tasks.filter(t => t.Status === TaskStatus.Done).length
        };
    }, [tasks, currentUserId]);

    // 4. Compute Parent Item Status & Dates
    const stepAggregates = useMemo(() => {
        const map = new Map<string, { status: TaskStatus; startDate: string | null; dueDate: string | null; childCount: number; progress: number }>();
        const allItems = DECREE_175_PHASES.flatMap(p => p.items);

        allItems.forEach(item => {
            const children = filteredTasks.filter(t => t.TimelineStep === item.code);
            if (children.length === 0) {
                map.set(item.code, { status: TaskStatus.Todo, startDate: null, dueDate: null, childCount: 0, progress: 0 });
                return;
            }

            const allDone = children.every(t => t.Status === TaskStatus.Done);
            const anyActive = children.some(t => t.Status === TaskStatus.InProgress || t.Status === TaskStatus.Done || t.Status === TaskStatus.Review);

            let status = TaskStatus.Todo;
            if (allDone) status = TaskStatus.Done;
            else if (anyActive) status = TaskStatus.InProgress;

            const startDates = children.map(t => new Date(t.StartDate || t.DueDate).getTime()).filter(t => !isNaN(t));
            const dueDates = children.map(t => new Date(t.DueDate).getTime()).filter(t => !isNaN(t));

            const minStart = startDates.length > 0 ? new Date(Math.min(...startDates)).toISOString() : null;
            const maxDue = dueDates.length > 0 ? new Date(Math.max(...dueDates)).toISOString() : null;

            // Calculate average progress
            const totalProgress = children.reduce((sum, t) => sum + (t.ProgressPercent || (t.Status === TaskStatus.Done ? 100 : 0)), 0);
            const avgProgress = Math.round(totalProgress / children.length);

            map.set(item.code, { status, startDate: minStart, dueDate: maxDue, childCount: children.length, progress: avgProgress });
        });
        return map;
    }, [filteredTasks]);

    // 5. Prepare Gantt Data (Parents Only)
    const ganttTasks = useMemo(() => {
        const allItems = DECREE_175_PHASES.flatMap(p => p.items);
        return allItems
            .map(item => {
                const agg = stepAggregates.get(item.code);
                if (!agg || !agg.startDate || !agg.dueDate) return null;

                return {
                    TaskID: item.code,
                    Title: `${item.id}. ${item.title}`,
                    StartDate: agg.startDate,
                    DueDate: agg.dueDate,
                    Status: agg.status,
                    Priority: 'Medium',
                    Description: 'Tổng hợp từ các công việc con',
                    AssigneeID: '',
                    TimelineStep: item.code,
                    ProjectID: projectID || 'SYNTHETIC',
                    ProgressPercent: agg.progress
                } as Task;
            })
            .filter((t): t is Task => t !== null);
    }, [stepAggregates, projectID]);

    // 6. Compute Milestone Dates for Timeline
    const milestoneData = useMemo(() => {
        const getCompletionDate = (code: string): string | undefined => {
            const completedTasks = tasks.filter(t => t.TimelineStep === code && t.Status === TaskStatus.Done);
            if (completedTasks.length === 0) return undefined;
            const dates = completedTasks.map(t => new Date(t.DueDate).getTime()).filter(d => !isNaN(d));
            if (dates.length === 0) return undefined;
            return new Date(Math.max(...dates)).toISOString().split('T')[0];
        };

        return {
            policyApprovalDate: getCompletionDate('PREP_POLICY'),
            projectApprovalDate: getCompletionDate('PREP_DECISION'),
            groundbreakingDate: getCompletionDate('IMPL_CONSTRUCTION'),
            completionDate: getCompletionDate('IMPL_ACCEPTANCE'),
            handoverDate: getCompletionDate('CLOSE_HANDOVER')
        };
    }, [tasks]);

    // Handlers
    const togglePhase = (id: string) => setExpandedPhases(prev => ({ ...prev, [id]: !prev[id] }));

    const handleAddTask = (stepName?: string, stepCode?: string) => {
        if (stepName && stepCode) {
            setSelectedStep({ name: stepName, code: stepCode });
        } else {
            setSelectedStep(null);
        }
        setEditingTask(null);
        setIsTaskModalOpen(true);
    };

    const handleQuickStatusChange = (e: React.MouseEvent, task: Task) => {
        e.stopPropagation();
        const statusCycle: Record<TaskStatus, TaskStatus> = {
            [TaskStatus.Todo]: TaskStatus.InProgress,
            [TaskStatus.InProgress]: TaskStatus.Review,
            [TaskStatus.Review]: TaskStatus.Done,
            [TaskStatus.Done]: TaskStatus.Todo
        };
        const newStatus = statusCycle[task.Status] || TaskStatus.InProgress;
        handleSaveTask({ ...task, Status: newStatus });
    };

    const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
        const task = tasks.find(t => t.TaskID === taskId);
        if (task) {
            handleSaveTask({ ...task, Status: newStatus });
        }
    };

    const handleEditTask = (task: Task) => {
        setEditingTask(task);
        setSelectedStep(null);
        setIsTaskModalOpen(true);
    };

    const handleSaveTask = (taskData: Partial<Task>) => {
        let updatedTask: Task;

        if (taskData.TaskID) {
            updatedTask = { ...editingTask, ...taskData } as Task;
            setTasks(prev => prev.map(t => t.TaskID === updatedTask.TaskID ? updatedTask : t));
        } else {
            updatedTask = {
                ...taskData as Task,
                TaskID: `NEW_${Date.now()}`,
                ProjectID: projectID || 'PROJ_TEMP',
                CreatedDate: new Date().toISOString()
            } as Task;
            setTasks(prev => [...prev, updatedTask]);
        }

        if (onSaveTask) {
            onSaveTask(updatedTask);
        }
        setIsTaskModalOpen(false);
    };

    // Priority color helper
    const getPriorityColor = (priority?: string) => {
        switch (priority) {
            case 'High': return 'text-red-600 bg-red-50 border-red-200';
            case 'Medium': return 'text-amber-600 bg-amber-50 border-amber-200';
            case 'Low': return 'text-green-600 bg-green-50 border-green-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    // Check if task is overdue
    const isOverdue = (task: Task) => {
        if (task.Status === TaskStatus.Done) return false;
        if (!task.DueDate) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(task.DueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < today;
    };

    // Render WBS View
    const renderWBSView = () => (
        <div className="space-y-4">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-4 rounded-xl flex justify-between items-center">
                <div>
                    <h3 className="text-blue-900 font-bold flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Kế hoạch thực hiện dự án
                    </h3>
                    <p className="text-xs text-blue-600 mt-1">
                        Căn cứ theo Điều 4, Nghị định 175/NĐ-CP về trình tự đầu tư xây dựng.
                    </p>
                </div>
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${groupCode === ProjectGroup.A || groupCode === ProjectGroup.QN
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : groupCode === ProjectGroup.B
                        ? 'bg-amber-100 text-amber-700 border border-amber-200'
                        : 'bg-green-100 text-green-700 border border-green-200'
                    }`}>
                    {getGroupLabel(groupCode)}
                </span>
            </div>

            {/* Phase Cards with Expandable Items */}
            <div className="space-y-3">
                {DECREE_175_PHASES.map((phase) => (
                    <div key={phase.id}>
                        {/* Phase Header Card */}
                        <PhaseProgressCard
                            phase={phase}
                            tasks={filteredTasks}
                            isExpanded={expandedPhases[phase.id]}
                            onToggle={() => togglePhase(phase.id)}
                        />

                        {/* Expanded Items */}
                        {expandedPhases[phase.id] && (
                            <div className="mt-2 ml-4 border-l-2 border-gray-200 pl-4 space-y-2">
                                {phase.items.map((item) => {
                                    const linkedTasks = filteredTasks.filter(t => t.TimelineStep === item.code);
                                    const agg = stepAggregates.get(item.code);
                                    const parentStatus = agg?.status || TaskStatus.Todo;
                                    const isParentDone = parentStatus === TaskStatus.Done;
                                    const isParentActive = parentStatus === TaskStatus.InProgress || parentStatus === TaskStatus.Review;
                                    const completedCount = linkedTasks.filter(t => t.Status === TaskStatus.Done).length;

                                    const stepBorderColor = isParentDone
                                        ? 'border-l-emerald-500'
                                        : isParentActive
                                            ? 'border-l-blue-500'
                                            : 'border-l-gray-200';

                                    return (
                                        <div key={item.id} className={`bg-white border border-gray-100 rounded-lg p-3 hover:border-gray-200 transition-colors group border-l-4 ${stepBorderColor}`}>
                                            {/* Step Header Row */}
                                            <div className="flex items-center gap-3">
                                                {/* Status Icon */}
                                                <div className="shrink-0">
                                                    {isParentDone ? (
                                                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                    ) : parentStatus === TaskStatus.Review ? (
                                                        <AlertCircle className="w-5 h-5 text-indigo-500" />
                                                    ) : parentStatus === TaskStatus.InProgress ? (
                                                        <Clock className="w-5 h-5 text-orange-500 animate-pulse" />
                                                    ) : (
                                                        <Circle className="w-5 h-5 text-gray-300" />
                                                    )}
                                                </div>

                                                {/* Title + Meta */}
                                                <div className="flex-1 min-w-0">
                                                    <h5 className={`text-sm font-medium ${isParentDone ? 'text-gray-900' : 'text-gray-700'}`}>
                                                        {item.id}. {item.title}
                                                    </h5>
                                                </div>

                                                {/* Progress Badge */}
                                                {agg && agg.progress > 0 && (
                                                    <ProgressBadge value={agg.progress} size="sm" />
                                                )}

                                                {/* Date Range Badge */}
                                                {(agg?.startDate || agg?.dueDate) && (
                                                    <span className="hidden sm:flex items-center gap-1 text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100 shrink-0">
                                                        <Calendar className="w-3 h-3" />
                                                        {agg.startDate && new Date(agg.startDate).toLocaleDateString('vi-VN')}
                                                        {agg.startDate && agg.dueDate && ' → '}
                                                        {agg.dueDate && new Date(agg.dueDate).toLocaleDateString('vi-VN')}
                                                    </span>
                                                )}

                                                {/* Task Count Badge */}
                                                <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded font-medium ${linkedTasks.length === 0
                                                    ? 'bg-gray-100 text-gray-500'
                                                    : completedCount === linkedTasks.length
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {completedCount}/{linkedTasks.length} việc
                                                </span>

                                                {/* Add Task Button */}
                                                {/* Sub-task expand toggle */}
                                                {hasSubTasks(item.code) && (
                                                    <button
                                                        onClick={() => setExpandedSubTasks(prev => ({ ...prev, [item.code]: !prev[item.code] }))}
                                                        className={`px-2 py-1 text-xs font-medium rounded border flex items-center gap-1 shrink-0 transition-colors ${expandedSubTasks[item.code]
                                                            ? 'text-amber-700 bg-amber-50 border-amber-200'
                                                            : 'text-purple-600 bg-purple-50 hover:bg-purple-100 border-purple-200'
                                                            }`}
                                                        title="Xem quy trình chi tiết (NĐ 175, Luật 135, NĐ 140, NĐ 144)"
                                                    >
                                                        <Zap className="w-3 h-3" />
                                                        {expandedSubTasks[item.code] ? 'Ẩn QT' : 'Quy trình'}
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => handleAddTask(item.title, item.code)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 flex items-center gap-1 shrink-0"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                    Thêm
                                                </button>
                                            </div>

                                            {/* Task Table (Compact) */}
                                            {linkedTasks.length > 0 && (
                                                <div className="mt-3 border border-gray-100 rounded-lg overflow-hidden">
                                                    <table className="w-full text-xs">
                                                        <thead>
                                                            <tr className="bg-gray-50 text-gray-500">
                                                                <th className="px-2 py-1.5 text-left font-medium w-8"></th>
                                                                <th className="px-2 py-1.5 text-left font-medium">Công việc</th>
                                                                <th className="px-2 py-1.5 text-center font-medium w-16">Tiến độ</th>
                                                                <th className="px-2 py-1.5 text-left font-medium w-20 hidden sm:table-cell">Phụ trách</th>
                                                                <th className="px-2 py-1.5 text-left font-medium w-24 hidden sm:table-cell">Hạn</th>
                                                                <th className="px-2 py-1.5 text-center font-medium w-16">Ưu tiên</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-50">
                                                            {linkedTasks.map(t => (
                                                                <tr
                                                                    key={t.TaskID}
                                                                    onClick={() => handleEditTask(t)}
                                                                    className={`cursor-pointer transition-colors hover:bg-gray-50 ${isOverdue(t) ? 'bg-red-50/50' : ''}`}
                                                                >
                                                                    {/* Status Dot */}
                                                                    <td className="px-2 py-2">
                                                                        <button
                                                                            onClick={(e) => handleQuickStatusChange(e, t)}
                                                                            className={`w-4 h-4 rounded-full transition-transform hover:scale-125 focus:outline-none ring-2 ring-offset-1 ${t.Status === 'Done' ? 'bg-emerald-500 ring-emerald-200' :
                                                                                t.Status === 'Review' ? 'bg-indigo-500 ring-indigo-200' :
                                                                                    t.Status === 'InProgress' ? 'bg-orange-500 ring-orange-200' :
                                                                                        'bg-gray-200 ring-gray-100 hover:bg-gray-300'
                                                                                }`}
                                                                            title="Click để chuyển trạng thái"
                                                                        />
                                                                    </td>

                                                                    {/* Title */}
                                                                    <td className={`px-2 py-2 font-medium ${t.Status === 'Done' ? 'text-gray-400 line-through' :
                                                                        isOverdue(t) ? 'text-red-700' :
                                                                            t.Status === 'Review' ? 'text-indigo-700' :
                                                                                t.Status === 'InProgress' ? 'text-orange-700' :
                                                                                    'text-gray-700'
                                                                        }`}>
                                                                        {t.Title}
                                                                        {t.IsCritical && (
                                                                            <span className="ml-1 px-1 py-0.5 bg-purple-100 text-purple-700 text-[8px] rounded font-bold">
                                                                                CP
                                                                            </span>
                                                                        )}
                                                                    </td>

                                                                    {/* Progress */}
                                                                    <td className="px-2 py-2 text-center">
                                                                        <ProgressBadge
                                                                            value={t.ProgressPercent || (t.Status === TaskStatus.Done ? 100 : 0)}
                                                                            size="sm"
                                                                        />
                                                                    </td>

                                                                    {/* Assignee */}
                                                                    <td className="px-2 py-2 text-gray-500 hidden sm:table-cell">
                                                                        {t.AssigneeID && (
                                                                            <span className="flex items-center gap-1">
                                                                                <User className="w-3 h-3" />
                                                                                {t.AssigneeID}
                                                                            </span>
                                                                        )}
                                                                    </td>

                                                                    {/* Due Date */}
                                                                    <td className={`px-2 py-2 hidden sm:table-cell ${isOverdue(t) ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
                                                                        {t.DueDate && new Date(t.DueDate).toLocaleDateString('vi-VN')}
                                                                    </td>

                                                                    {/* Priority */}
                                                                    <td className="px-2 py-2 text-center">
                                                                        {t.Priority && (
                                                                            <span className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded border ${getPriorityColor(t.Priority)}`}>
                                                                                <Flag className="w-2.5 h-2.5" />
                                                                                {t.Priority}
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}

                                            {/* Empty state */}
                                            {linkedTasks.length === 0 && !expandedSubTasks[item.code] && (
                                                <p className="text-xs text-gray-400 mt-2 italic">
                                                    Chưa có công việc nào được tạo. Click "Quy trình" để xem các bước cần thực hiện.
                                                </p>
                                            )}

                                            {/* Sub-tasks from Registry */}
                                            {expandedSubTasks[item.code] && (() => {
                                                const subTasks = getSubTasksForStep(item.code, groupCode);
                                                return (
                                                    <div className="mt-3 border border-purple-100 rounded-lg overflow-hidden bg-purple-50/30">
                                                        <div className="px-3 py-2 bg-purple-50 border-b border-purple-100 flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <Scale className="w-3.5 h-3.5 text-purple-500" />
                                                                <span className="text-xs font-semibold text-purple-700">
                                                                    Quy trình theo NĐ 175, Luật 135, NĐ 140, NĐ 144
                                                                </span>
                                                            </div>
                                                            <span className="text-[10px] text-purple-500">
                                                                {subTasks.length} bước
                                                            </span>
                                                        </div>
                                                        <div className="divide-y divide-purple-100">
                                                            {subTasks.map((st, idx) => (
                                                                <div
                                                                    key={st.code}
                                                                    onClick={() => setSelectedSubTask({ def: st, stepTitle: item.title })}
                                                                    className="px-3 py-2 flex items-center gap-3 hover:bg-purple-50 transition-colors cursor-pointer group/st"
                                                                >
                                                                    <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                                                                        {idx + 1}
                                                                    </span>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-xs font-medium text-gray-700 truncate">{st.title}</p>
                                                                        <div className="flex items-center gap-2 mt-0.5">
                                                                            <span className="flex items-center gap-1 text-[10px] text-blue-600">
                                                                                <Building2 className="w-2.5 h-2.5" />
                                                                                {st.responsible}
                                                                            </span>
                                                                            {st.estimatedDays && (
                                                                                <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                                                                                    <Clock className="w-2.5 h-2.5" />
                                                                                    {st.estimatedDays}d
                                                                                </span>
                                                                            )}
                                                                            {st.templatePath && (
                                                                                <span className="flex items-center gap-0.5 text-[10px] text-cyan-600">
                                                                                    <FileText className="w-2.5 h-2.5" />
                                                                                    Biểu mẫu
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <Info className="w-3.5 h-3.5 text-gray-300 group-hover/st:text-purple-400 transition-colors shrink-0" />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="animate-in slide-in-from-bottom-2 duration-500 space-y-6 py-4">

            {/* 1. Statistics Header */}
            <PlanStatisticsHeader tasks={tasks} />

            {/* 2. Filter Bar */}
            <TaskFilterBar
                currentFilter={currentFilter}
                currentView={currentView}
                onFilterChange={setCurrentFilter}
                onViewChange={setCurrentView}
                onAddTask={() => handleAddTask()}
                onSearch={setSearchQuery}
                searchQuery={searchQuery}
                taskCounts={taskCounts}
                currentUserId={currentUserId}
            />

            {/* 3. Main Layout: Content + Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left: Main Content (3 cols) */}
                <div className="lg:col-span-3 space-y-4">
                    {currentView === 'wbs' && renderWBSView()}

                    {currentView === 'gantt' && (
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

                    {currentView === 'kanban' && (
                        <KanbanBoardView
                            tasks={filteredTasks}
                            onTaskClick={handleEditTask}
                            onStatusChange={handleStatusChange}
                            onAddTask={(status) => {
                                setSelectedStep(null);
                                setEditingTask({ Status: status } as Task);
                                setIsTaskModalOpen(true);
                            }}
                        />
                    )}

                    {currentView === 'resource' && (
                        <ResourceAllocationView
                            tasks={filteredTasks}
                            employees={employees}
                            onTaskClick={handleEditTask}
                        />
                    )}
                </div>

                {/* Right: Milestone Timeline (1 col) */}
                <div className="lg:col-span-1">
                    <div className="sticky top-4">
                        <MilestoneTimeline milestoneData={milestoneData} />
                    </div>
                </div>
            </div>

            <ProjectTaskModal
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                onSubmit={handleSaveTask}
                initialData={editingTask || {}}
                stepName={selectedStep?.name}
                stepCode={selectedStep?.code}
                allTasks={tasks}
            />

            {/* Sub-task Detail Modal */}
            <SubTaskDetailModal
                subTask={selectedSubTask?.def ?? null}
                stepTitle={selectedSubTask?.stepTitle}
                isOpen={!!selectedSubTask}
                onClose={() => setSelectedSubTask(null)}
            />
        </div>
    );
};
