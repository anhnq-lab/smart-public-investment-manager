import React, { useState, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Task, TaskStatus, TaskPriority, Employee, ProjectGroup, Project } from '@/types';
import {
    Layers, CheckCircle2, Circle, Clock, ChevronDown, ChevronRight,
    FileText, AlertCircle, Plus, Calendar, User, Flag, Zap, Building2, Scale, Info, ExternalLink, ListPlus, Paperclip, Upload
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
import { TaskService } from '@/services/TaskService';
import { supabase } from '@/lib/supabase';
import { findByStepCode, buildTT24Key } from '@/utils/docStepMapping';
import { mockEmployees } from '@/mockData';

interface ProjectPlanTabProps {
    tasks: Task[];
    projectID?: string;
    onSaveTask?: (task: Task) => void;
    employees?: Employee[];
    currentUserId?: string;
    groupCode?: ProjectGroup;
    isODA?: boolean;
    project?: Project | null;
}

/**
 * Sinh kế hoạch thực hiện dự án theo nhóm
 * Căn cứ: NĐ 175/2024, Luật ĐTC 58/2024, Luật XD 135/2025
 * - Nhóm A/QN: BC NCTKT → BC NCKT → TK triển khai (CĐT tự thẩm định)
 * - Nhóm B: Đề xuất chủ trương ĐT → BC NCKT → TK triển khai (CĐT tự thẩm định)
 * - Nhóm C: Đề xuất chủ trương ĐT → BC KT-KT (≤20 tỷ, NĐ 175 K3Đ5) → 1 bước TK
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
        { id: '2.9', title: 'Vận hành, chạy thử', code: 'IMPL_TRIAL_RUN' },
        { id: '2.10', title: 'Nghiệm thu hoàn thành công trình', code: 'IMPL_ACCEPTANCE' },
        { id: '2.11', title: 'Giám sát, đánh giá dự án đầu tư', code: 'IMPL_MONITORING' }
    );

    // --- PHASE 3: Kết thúc xây dựng (giống nhau cho mọi nhóm) ---
    const phase3Items = [
        { id: '3.1', title: 'Quyết toán hợp đồng xây dựng', code: 'CLOSE_CONTRACT_SETTLEMENT' },
        { id: '3.2', title: 'Quyết toán vốn đầu tư dự án hoàn thành', code: 'CLOSE_CAPITAL_SETTLEMENT' },
        { id: '3.3', title: 'Bàn giao công trình đưa vào sử dụng', code: 'CLOSE_HANDOVER' },
        { id: '3.4', title: 'Bảo hành công trình xây dựng', code: 'CLOSE_WARRANTY' },
        { id: '3.5', title: 'Bàn giao hồ sơ lưu trữ', code: 'CLOSE_ARCHIVE' },
        { id: '3.6', title: 'Giám sát, đánh giá sau hoàn thành', code: 'CLOSE_MONITORING' }
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
    isODA = false,
    project,
}) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    // Dynamic phases based on project group
    const DECREE_175_PHASES = useMemo(() => getProjectPhases(groupCode, isODA), [groupCode, isODA]);

    // Employee name lookup map
    const employeeNameMap = useMemo(() => {
        const map: Record<string, string> = {};
        const allEmps = employees.length > 0 ? employees : mockEmployees;
        allEmps.forEach(e => { map[e.EmployeeID] = e.FullName; });
        return map;
    }, [employees]);

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
    const [selectedSubTask, setSelectedSubTask] = useState<{ def: SubTaskDef; stepTitle: string; stepCode: string } | null>(null);
    const [bulkCreatingStep, setBulkCreatingStep] = useState<string | null>(null);
    const [bulkCreatingAll, setBulkCreatingAll] = useState(false);
    const [attachmentCounts, setAttachmentCounts] = useState<Record<string, number>>({});
    const [uploadingTaskId, setUploadingTaskId] = useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [pendingUploadTaskId, setPendingUploadTaskId] = useState<string | null>(null);

    // Load attachment counts from documents table
    useEffect(() => {
        if (!projectID) return;
        const loadCounts = async () => {
            const taskIds = tasks.map(t => t.TaskID);
            if (taskIds.length === 0) return;
            const { data } = await supabase
                .from('documents')
                .select('task_id')
                .eq('source' as any, 'task')
                .in('task_id' as any, taskIds) as any;
            if (data) {
                const counts: Record<string, number> = {};
                (data as any[]).forEach((row: { task_id: string }) => {
                    counts[row.task_id] = (counts[row.task_id] || 0) + 1;
                });
                setAttachmentCounts(counts);
            }
        };
        loadCounts();
    }, [tasks, projectID]);

    // Handle file upload for task → saves to documents table with cross-reference
    const handleFileUpload = async (taskId: string, file: File) => {
        setUploadingTaskId(taskId);
        try {
            const ext = file.name.split('.').pop();
            const path = `${projectID}/${taskId}/${Date.now()}.${ext}`;
            const { error: uploadError } = await supabase.storage
                .from('task-attachments')
                .upload(path, file);
            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from('task-attachments')
                .getPublicUrl(path);

            // Find the task to get step_code and title for cross-referencing
            const task = tasks.find(t => t.TaskID === taskId);
            const stepCode = (task as any)?.StepCode || (task as any)?.step_code || task?.TimelineStep || '';
            const crossRef = stepCode ? findByStepCode(stepCode) : undefined;

            // Build enriched doc name for keyword matching in Hồ sơ tab
            const docName = task?.Title
                ? `${task.Title} - ${file.name}`
                : file.name;

            // Build tt24_field for TT24 cross-reference
            const tt24Field = crossRef?.tt24Stt
                ? buildTT24Key(crossRef.tt24Stt, crossRef.tt24Label)
                : undefined;

            // Insert into unified documents table with cross-reference fields
            await (supabase.from('documents') as any).insert({
                project_id: projectID,
                task_id: taskId,
                doc_name: docName,
                storage_path: urlData.publicUrl,
                size: `${(file.size / 1024).toFixed(0)} KB`,
                category: 0,
                source: 'task',
                is_digitized: true,
                ...(tt24Field && { tt24_field: tt24Field }),
            });

            setAttachmentCounts(prev => ({ ...prev, [taskId]: (prev[taskId] || 0) + 1 }));
        } catch (err) {
            console.error('Upload failed:', err);
        } finally {
            setUploadingTaskId(null);
        }
    };

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
        // Auto-sync progress with status
        let newProgress = task.ProgressPercent || 0;
        if (newStatus === TaskStatus.Done) newProgress = 100;
        else if (newStatus === TaskStatus.Review && newProgress < 100) newProgress = 100;
        else if (newStatus === TaskStatus.InProgress && newProgress === 0) newProgress = 25;
        else if (newStatus === TaskStatus.Todo) newProgress = 0;
        handleSaveTask({ ...task, Status: newStatus, ProgressPercent: newProgress } as any);
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

    const handleSaveTask = async (taskData: Partial<Task>) => {
        // ── Auto-derive status from progress ──
        const progress = taskData.ProgressPercent ?? (taskData as any).Progress ?? 0;
        if (taskData.ProgressPercent !== undefined || (taskData as any).Progress !== undefined) {
            // Only auto-derive if status wasn't explicitly changed in this call
            const currentTask = tasks.find(t => t.TaskID === taskData.TaskID);
            const statusExplicitlyChanged = taskData.Status !== undefined && taskData.Status !== currentTask?.Status;
            if (!statusExplicitlyChanged) {
                if (progress === 100) {
                    taskData.Status = TaskStatus.Review; // 100% → Đang kiểm tra (chờ GĐ duyệt)
                } else if (progress >= 1) {
                    taskData.Status = TaskStatus.InProgress; // 1-99% → Đang thực hiện
                } else {
                    taskData.Status = TaskStatus.Todo; // 0% → Chưa bắt đầu
                }
            }
        }
        // ── Auto-sync progress when status is set explicitly ──
        if (taskData.Status === TaskStatus.Done && (progress < 100)) {
            taskData.ProgressPercent = 100;
            (taskData as any).Progress = 100;
        }
        if (taskData.Status === TaskStatus.Todo && progress > 0) {
            taskData.ProgressPercent = 0;
            (taskData as any).Progress = 0;
        }

        let updatedTask: Task;

        if (taskData.TaskID && !taskData.TaskID.startsWith('NEW_')) {
            updatedTask = { ...editingTask, ...taskData } as Task;
            setTasks(prev => prev.map(t => t.TaskID === updatedTask.TaskID ? updatedTask : t));
        } else {
            updatedTask = {
                ...taskData as Task,
                TaskID: taskData.TaskID || `T-${Math.random().toString(36).substring(2, 10)}`,
                ProjectID: projectID || 'PROJ_TEMP',
                CreatedDate: new Date().toISOString()
            } as Task;
            setTasks(prev => [...prev, updatedTask]);
        }

        // Persist to DB
        try {
            await TaskService.saveTask(updatedTask);
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        } catch (err) {
            console.error('Failed to save task:', err);
        }

        if (onSaveTask) {
            onSaveTask(updatedTask);
        }
        setIsTaskModalOpen(false);
    };

    // ── Bulk create tasks from workflow sub-steps ──
    const handleBulkCreateFromSubTasks = async (stepCode: string, stepTitle: string) => {
        if (!projectID) return;
        setBulkCreatingStep(stepCode);
        try {
            const subTaskDefs = getSubTasksForStep(stepCode, groupCode);
            if (subTaskDefs.length === 0) return;

            // Calculate base date (same logic as date display)
            const getBaseDate = (): Date => {
                if (project?.StartDate) return new Date(project.StartDate);
                if (project?.ApprovalDate) return new Date(project.ApprovalDate);
                return new Date();
            };

            // Already-linked step codes to avoid duplicates
            const existingTitles = new Set(tasks.filter(t => t.TimelineStep === stepCode).map(t => t.Title));

            // Calculate cumulative days before this step
            const allPhaseItems = DECREE_175_PHASES.flatMap(p => p.items);
            const currentIdx = allPhaseItems.findIndex(i => i.code === stepCode);
            let cumulativeDaysBefore = 0;
            for (let i = 0; i < currentIdx; i++) {
                const prevSubs = getSubTasksForStep(allPhaseItems[i].code, groupCode);
                cumulativeDaysBefore += prevSubs.reduce((sum, s) => sum + (s.estimatedDays || 10), 0);
            }

            const baseDate = getBaseDate();
            let runningDays = cumulativeDaysBefore;
            const newTasks: Task[] = [];

            for (let idx = 0; idx < subTaskDefs.length; idx++) {
                const st = subTaskDefs[idx];
                // Skip if task already exists with same title
                if (existingTitles.has(st.title)) continue;

                const days = st.estimatedDays || 10;
                const startDate = new Date(baseDate);
                startDate.setDate(startDate.getDate() + runningDays);
                const dueDate = new Date(startDate);
                dueDate.setDate(dueDate.getDate() + days);
                runningDays += days;

                const shortId = Math.random().toString(36).substring(2, 10);
                const task: Task = {
                    TaskID: `T-${shortId}${idx}`,
                    // idx added for uniqueness within batch
                    ProjectID: projectID,
                    Title: st.title,
                    Description: st.description || `Bước trong quy trình: ${stepTitle}. Phụ trách: ${st.responsible}.${st.legalBasis ? ` Căn cứ: ${st.legalBasis}` : ''}`,
                    Status: TaskStatus.Todo,
                    Priority: TaskPriority.Medium,
                    StartDate: startDate.toISOString(),
                    DueDate: dueDate.toISOString(),
                    AssigneeID: st.responsible,
                    TimelineStep: stepCode,
                    StepCode: stepCode,
                    LegalBasis: st.legalBasis || '',
                    DurationDays: days,
                    Phase: stepTitle,
                } as Task;
                newTasks.push(task);
            }

            if (newTasks.length === 0) {
                setBulkCreatingStep(null);
                return;
            }

            // Save to DB
            await TaskService.saveTasks(newTasks);

            // Update local state + invalidate react-query cache
            setTasks(prev => [...prev, ...newTasks]);
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        } catch (error) {
            console.error('Failed to bulk create tasks:', error);
        } finally {
            setBulkCreatingStep(null);
        }
    };

    // ── Bulk create ALL tasks across ALL steps ──
    const handleBulkCreateAll = async () => {
        if (!projectID) return;
        setBulkCreatingAll(true);
        try {
            const allPhaseItems = DECREE_175_PHASES.flatMap(p => p.items);
            for (const item of allPhaseItems) {
                const subTasks = getSubTasksForStep(item.code, groupCode);
                if (subTasks.length > 0) {
                    await handleBulkCreateFromSubTasks(item.code, item.title);
                }
            }
        } catch (error) {
            console.error('Failed to bulk create all tasks:', error);
        } finally {
            setBulkCreatingAll(false);
        }
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
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border border-blue-100 dark:border-blue-800 p-4 rounded-xl flex justify-between items-center">
                <div>
                    <h3 className="text-blue-900 dark:text-blue-200 font-bold flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Kế hoạch thực hiện dự án
                    </h3>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        Căn cứ theo Điều 4, Nghị định 175/NĐ-CP về trình tự đầu tư xây dựng.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Tạo tất cả công việc Button */}
                    <button
                        onClick={handleBulkCreateAll}
                        disabled={bulkCreatingAll}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all shadow-sm ${bulkCreatingAll
                            ? 'text-amber-600 bg-amber-50 border-amber-200 cursor-wait'
                            : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 hover:shadow'
                            }`}
                    >
                        {bulkCreatingAll ? (
                            <>
                                <div className="w-3 h-3 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin" />
                                Đang tạo...
                            </>
                        ) : (
                            <>
                                <ListPlus className="w-3.5 h-3.5" />
                                Tạo tất cả công việc
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => navigate(`/tasks`, { state: { filterProject: projectID } })}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg border border-blue-200 dark:border-blue-700 transition-colors shadow-sm"
                    >
                        <ExternalLink className="w-3 h-3" />
                        Xem tất cả công việc
                    </button>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${groupCode === ProjectGroup.A || groupCode === ProjectGroup.QN
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : groupCode === ProjectGroup.B
                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                            : 'bg-green-100 text-green-700 border border-green-200'
                        }`}>
                        {getGroupLabel(groupCode)}
                    </span>
                </div>
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
                            <div className="mt-2 ml-4 border-l-2 border-gray-200 dark:border-slate-700 pl-4 space-y-2">
                                {phase.items.map((item) => {
                                    const linkedTasks = filteredTasks
                                        .filter(t => t.TimelineStep === item.code)
                                        .sort((a, b) => {
                                            const dateA = a.StartDate ? new Date(a.StartDate).getTime() : (a.DueDate ? new Date(a.DueDate).getTime() : 0);
                                            const dateB = b.StartDate ? new Date(b.StartDate).getTime() : (b.DueDate ? new Date(b.DueDate).getTime() : 0);
                                            return dateA - dateB;
                                        });
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
                                        <div key={item.id} className={`bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-lg p-3 hover:border-gray-200 dark:hover:border-slate-600 transition-colors group border-l-4 ${stepBorderColor}`}>
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
                                                    <h5 className={`text-sm font-medium ${isParentDone ? 'text-gray-900 dark:text-slate-100' : 'text-gray-700 dark:text-slate-300'}`}>
                                                        {item.id}. {item.title}
                                                    </h5>
                                                </div>

                                                {/* Progress Badge */}
                                                {agg && agg.progress > 0 && (
                                                    <ProgressBadge value={agg.progress} size="sm" />
                                                )}

                                                {/* Date Range Badge */}
                                                {(agg?.startDate || agg?.dueDate) && (
                                                    <span className="hidden sm:flex items-center gap-1 text-[10px] text-gray-400 dark:text-slate-500 bg-gray-50 dark:bg-slate-700 px-2 py-0.5 rounded border border-gray-100 dark:border-slate-600 shrink-0">
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
                                                <div className="mt-3 border border-gray-100 dark:border-slate-700 rounded-lg overflow-hidden">
                                                    <table className="w-full text-xs">
                                                        <thead>
                                                            <tr className="bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-slate-400">
                                                                <th className="px-2 py-1.5 text-left font-medium w-8"></th>
                                                                <th className="px-2 py-1.5 text-left font-medium">Công việc</th>
                                                                <th className="px-2 py-1.5 text-center font-medium w-16">Tiến độ</th>
                                                                <th className="px-2 py-1.5 text-left font-medium w-32 hidden sm:table-cell">Phụ trách</th>
                                                                <th className="px-2 py-1.5 text-left font-medium w-24 hidden sm:table-cell">Hạn</th>
                                                                <th className="px-2 py-1.5 text-center font-medium w-16">Ưu tiên</th>
                                                                <th className="px-2 py-1.5 text-center font-medium w-16">Tài liệu</th>
                                                                <th className="px-2 py-1.5 text-center font-medium w-8"></th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                                                            {linkedTasks.map(t => (
                                                                <tr
                                                                    key={t.TaskID}
                                                                    onClick={() => handleEditTask(t)}
                                                                    className={`cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-slate-700 ${isOverdue(t) ? 'bg-red-50/50 dark:bg-red-900/20' : ''}`}
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
                                                                            <span className="flex items-center gap-1 truncate max-w-[120px]" title={employeeNameMap[t.AssigneeID] || t.AssigneeID}>
                                                                                <User className="w-3 h-3 shrink-0" />
                                                                                {employeeNameMap[t.AssigneeID] || t.AssigneeID}
                                                                            </span>
                                                                        )}
                                                                    </td>

                                                                    {/* Due Date + Completion Date */}
                                                                    <td className={`px-2 py-2 hidden sm:table-cell ${isOverdue(t) ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
                                                                        {t.Status === TaskStatus.Done && t.ActualEndDate ? (
                                                                            <span className="flex items-center gap-1 text-emerald-600 font-medium" title={`Hoàn thành: ${new Date(t.ActualEndDate).toLocaleDateString('vi-VN')}`}>
                                                                                <CheckCircle2 className="w-3 h-3" />
                                                                                {new Date(t.ActualEndDate).toLocaleDateString('vi-VN')}
                                                                            </span>
                                                                        ) : (
                                                                            t.DueDate && new Date(t.DueDate).toLocaleDateString('vi-VN')
                                                                        )}
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
                                                                    {/* Upload Attachment */}
                                                                    <td className="px-2 py-2 text-center">
                                                                        <div className="flex items-center justify-center gap-1">
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setPendingUploadTaskId(t.TaskID);
                                                                                    fileInputRef.current?.click();
                                                                                }}
                                                                                disabled={uploadingTaskId === t.TaskID}
                                                                                className={`p-1 rounded transition-colors ${uploadingTaskId === t.TaskID
                                                                                    ? 'bg-amber-50 text-amber-500'
                                                                                    : 'hover:bg-blue-50 text-gray-400 hover:text-blue-600'
                                                                                    }`}
                                                                                title="Tải tài liệu hoàn thành"
                                                                            >
                                                                                {uploadingTaskId === t.TaskID
                                                                                    ? <div className="w-3.5 h-3.5 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin" />
                                                                                    : <Upload className="w-3.5 h-3.5" />
                                                                                }
                                                                            </button>
                                                                            {(attachmentCounts[t.TaskID] || 0) > 0 && (
                                                                                <span className="flex items-center gap-0.5 text-[9px] px-1 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100 font-bold">
                                                                                    <Paperclip className="w-2.5 h-2.5" />
                                                                                    {attachmentCounts[t.TaskID]}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                    {/* Navigate to Task Detail */}
                                                                    <td className="px-2 py-2 text-center">
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                navigate(`/tasks/${t.TaskID}`);
                                                                            }}
                                                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-blue-50 rounded text-blue-500"
                                                                            title="Xem chi tiết công việc"
                                                                        >
                                                                            <ExternalLink className="w-3 h-3" />
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}

                                            {/* Empty state */}
                                            {linkedTasks.length === 0 && !expandedSubTasks[item.code] && (
                                                <p className="text-xs text-gray-400 dark:text-slate-500 mt-2 italic">
                                                    Chưa có công việc nào được tạo. Click "Quy trình" để xem các bước cần thực hiện.
                                                </p>
                                            )}

                                            {/* Sub-tasks from Registry */}
                                            {expandedSubTasks[item.code] && (() => {
                                                const subTasks = getSubTasksForStep(item.code, groupCode);

                                                // ── Auto-fill Start/End dates ──
                                                // Lấy ngày bắt đầu: từ project.StartDate / ApprovalDate hoặc today
                                                const getBaseDate = (): Date => {
                                                    if (project?.StartDate) return new Date(project.StartDate);
                                                    if (project?.ApprovalDate) return new Date(project.ApprovalDate);
                                                    return new Date();
                                                };

                                                // Tính tổng ngày từ các bước TRƯỚC item hiện tại
                                                const allPhaseItems = DECREE_175_PHASES.flatMap(p => p.items);
                                                const currentIdx = allPhaseItems.findIndex(i => i.code === item.code);
                                                let cumulativeDaysBefore = 0;
                                                for (let i = 0; i < currentIdx; i++) {
                                                    const prevSubs = getSubTasksForStep(allPhaseItems[i].code, groupCode);
                                                    cumulativeDaysBefore += prevSubs.reduce((sum, s) => sum + (s.estimatedDays || 10), 0);
                                                }

                                                // Build date ranges cho từng sub-task
                                                const baseDate = getBaseDate();
                                                let runningDays = cumulativeDaysBefore;
                                                const stepDates = subTasks.map(st => {
                                                    const days = st.estimatedDays || 10;
                                                    const start = new Date(baseDate);
                                                    start.setDate(start.getDate() + runningDays);
                                                    const end = new Date(start);
                                                    end.setDate(end.getDate() + days);
                                                    runningDays += days;
                                                    return { start, end, days };
                                                });

                                                // Tổng ngày cho toàn bộ quy trình con này
                                                const totalStepDays = subTasks.reduce((s, st) => s + (st.estimatedDays || 10), 0);

                                                return (
                                                    <div className="mt-3 border border-purple-100 dark:border-purple-800 rounded-lg overflow-hidden bg-purple-50/30 dark:bg-purple-900/10">
                                                        <div className="px-3 py-2 bg-purple-50 dark:bg-purple-900/30 border-b border-purple-100 dark:border-purple-800 flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <Scale className="w-3.5 h-3.5 text-purple-500" />
                                                                <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                                                                    Quy trình theo NĐ 175, Luật 135, NĐ 140, NĐ 144
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                {/* Bulk Create Tasks Button */}
                                                                {(() => {
                                                                    const existingCount = tasks.filter(t => t.TimelineStep === item.code).length;
                                                                    const subCount = subTasks.length;
                                                                    const allCreated = existingCount >= subCount;
                                                                    return (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleBulkCreateFromSubTasks(item.code, item.title);
                                                                            }}
                                                                            disabled={bulkCreatingStep === item.code || allCreated}
                                                                            className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg flex items-center gap-1 transition-all ${allCreated
                                                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default'
                                                                                : bulkCreatingStep === item.code
                                                                                    ? 'bg-amber-50 text-amber-600 border border-amber-200 cursor-wait'
                                                                                    : 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 hover:shadow-sm'
                                                                                }`}
                                                                            title={allCreated ? 'Đã tạo công việc cho tất cả bước' : 'Tạo công việc tự động cho tất cả bước quy trình'}
                                                                        >
                                                                            {bulkCreatingStep === item.code ? (
                                                                                <>
                                                                                    <div className="w-3 h-3 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin" />
                                                                                    Đang tạo...
                                                                                </>
                                                                            ) : allCreated ? (
                                                                                <>
                                                                                    <CheckCircle2 className="w-3 h-3" />
                                                                                    Đã tạo {existingCount} việc
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <ListPlus className="w-3 h-3" />
                                                                                    Tạo {subCount} công việc
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                    );
                                                                })()}
                                                                <span className="text-[10px] text-purple-500 dark:text-purple-400 flex items-center gap-1">
                                                                    <Calendar className="w-3 h-3" />
                                                                    ~{totalStepDays} ngày
                                                                </span>
                                                                <span className="text-[10px] text-purple-500 dark:text-purple-400">
                                                                    {subTasks.length} bước
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="divide-y divide-purple-100 dark:divide-purple-800/50">
                                                            {subTasks.map((st, idx) => {
                                                                const dates = stepDates[idx];
                                                                const fmtDate = (d: Date) => d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
                                                                const fmtShort = (d: Date) => d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

                                                                return (
                                                                    <div
                                                                        key={st.code}
                                                                        onClick={() => setSelectedSubTask({ def: st, stepTitle: item.title, stepCode: item.code })}
                                                                        className="px-3 py-2.5 flex items-center gap-3 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors cursor-pointer group/st"
                                                                    >
                                                                        <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-800 text-purple-600 dark:text-purple-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                                                                            {idx + 1}
                                                                        </span>
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-xs font-medium text-gray-700 dark:text-slate-300 truncate">{st.title}</p>
                                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                                <span className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400">
                                                                                    <Building2 className="w-2.5 h-2.5" />
                                                                                    {st.responsible}
                                                                                </span>
                                                                                {st.estimatedDays && (
                                                                                    <span className="flex items-center gap-0.5 text-[10px] text-gray-400 dark:text-slate-500">
                                                                                        <Clock className="w-2.5 h-2.5" />
                                                                                        {st.estimatedDays}d
                                                                                    </span>
                                                                                )}
                                                                                {st.templatePath && (
                                                                                    <span className="flex items-center gap-0.5 text-[10px] text-cyan-600 dark:text-cyan-400">
                                                                                        <FileText className="w-2.5 h-2.5" />
                                                                                        Biểu mẫu
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        {/* ── AUTO-FILLED DATE RANGE ── */}
                                                                        <div className="hidden sm:flex flex-col items-end gap-0.5 shrink-0 min-w-[140px]">
                                                                            <div className="flex items-center gap-1.5 text-[10px]">
                                                                                <Calendar className="w-3 h-3 text-indigo-400" />
                                                                                <span className="text-gray-600 dark:text-slate-400 font-medium">
                                                                                    {fmtShort(dates.start)}
                                                                                </span>
                                                                                <span className="text-gray-300 dark:text-slate-600">→</span>
                                                                                <span className="text-gray-700 dark:text-slate-300 font-semibold">
                                                                                    {fmtShort(dates.end)}
                                                                                </span>
                                                                            </div>
                                                                            {/* Mini progress bar */}
                                                                            <div className="w-full h-1 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                                                <div
                                                                                    className="h-full bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full transition-all"
                                                                                    style={{ width: `${Math.min(100, (dates.days / totalStepDays) * 100)}%` }}
                                                                                />
                                                                            </div>
                                                                        </div>

                                                                        <Info className="w-3.5 h-3.5 text-gray-300 group-hover/st:text-purple-400 transition-colors shrink-0" />
                                                                    </div>
                                                                );
                                                            })}
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
                        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                            <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700 flex justify-between items-center">
                                <h4 className="font-bold text-gray-700 dark:text-slate-200 text-xs uppercase flex items-center gap-2">
                                    <Layers className="w-4 h-4" /> Tiến độ tổng thể (Gantt)
                                </h4>
                                <span className="text-[10px] text-gray-400 dark:text-slate-500 font-normal normal-case">
                                    * Chỉ hiển thị các hạng mục lớn đã có công việc thành phần
                                </span>
                            </div>
                            <div className="p-4">
                                {ganttTasks.length > 0 ? (
                                    <ProjectGanttChart tasks={ganttTasks} />
                                ) : (
                                    <div className="h-32 flex items-center justify-center text-gray-400 dark:text-slate-500 text-sm italic">
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
                stepCode={selectedSubTask?.stepCode}
                isOpen={!!selectedSubTask}
                onClose={() => setSelectedSubTask(null)}
                onCreateTask={handleSaveTask}
                project={project}
            />

            {/* Hidden file input for attachments */}
            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.zip"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && pendingUploadTaskId) {
                        handleFileUpload(pendingUploadTaskId, file);
                        setPendingUploadTaskId(null);
                    }
                    e.target.value = '';
                }}
            />
        </div>
    );
};
