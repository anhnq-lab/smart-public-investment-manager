import { ProjectGroup, Task, TaskStatus, TaskPriority } from '../types';

export interface TemplateStep {
    stepCode: string;
    title: string;
    durationDays: number;
    department: 'Planning' | 'Technical' | 'Bidding' | 'Finance' | 'PMU' | 'Director';
    departmentName: string;
    description: string;
    legalBasis: string;
}

// Default durations based on Public Investment Law 2019 & Decree 15/2021
const DURATION_MATRIX: Record<ProjectGroup, Record<string, number>> = {
    [ProjectGroup.QN]: { // Quan trọng quốc gia (Treat as complex A)
        'PREP_POLICY': 60,
        'PREP_FS': 60,
        'IMPL_DESIGN': 60,
        'IMPL_BIDDING': 60,
    },
    [ProjectGroup.A]: {
        'PREP_POLICY': 45, // days
        'PREP_FS': 40,
        'IMPL_DESIGN': 40, // Grade I/Special
        'IMPL_BIDDING': 45,
    },
    [ProjectGroup.B]: {
        'PREP_POLICY': 30,
        'PREP_FS': 30,
        'IMPL_DESIGN': 30, // Grade II/III
        'IMPL_BIDDING': 35,
    },
    [ProjectGroup.C]: {
        'PREP_POLICY': 20,
        'PREP_FS': 20,
        'IMPL_DESIGN': 20, // Others
        'IMPL_BIDDING': 25,
    }
};

const COMMON_DURATIONS = {
    'PREP_SURVEY': 15,
    'IMPL_CLEARANCE': 90, // Varied, but 3 months is a safe default baseline
    'IMPL_PERMIT': 20, // GPXD
    'IMPL_CONSTRUCTION': 365, // Placeholder 1 year
    'FINISH_ACCEPTANCE': 14,
    'FINISH_SETTLEMENT': 30,
};

const DEPARTMENTS = {
    'Planning': 'Phòng Kế hoạch - Tổng hợp',
    'Technical': 'Phòng Kỹ thuật - Thẩm định',
    'Bidding': 'Phòng Đấu thầu',
    'Finance': 'Phòng Tài chính - Kế toán',
    'PMU': 'Ban Quản lý dự án',
    'Director': 'Ban Giám đốc',
};

export const generateProjectTasks = (projectID: string, group: ProjectGroup, startDate: Date = new Date()): Task[] => {
    const tasks: Task[] = [];
    const durations = DURATION_MATRIX[group] || DURATION_MATRIX[ProjectGroup.C];

    let currentDate = new Date(startDate);

    // Helper to add days
    const addDays = (date: Date, days: number) => {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    };

    const createAutoTask = (
        stepCode: string,
        baseCode: string,
        title: string,
        deptKey: keyof typeof DEPARTMENTS,
        legal: string,
        duration?: number
    ) => {
        const dur = duration || durations[baseCode] || COMMON_DURATIONS[baseCode as keyof typeof COMMON_DURATIONS] || 30;
        const start = new Date(currentDate);
        const end = addDays(start, dur);

        // Update global current date for sequential scheduling
        // Note: Some tasks execute in parallel in reality, but for a base plan, sequential is safer.
        // We will overlap slightly for efficiency in specific phases.
        currentDate = end;

        return {
            TaskID: `TASK-${projectID}-${stepCode}-${Math.floor(Math.random() * 1000)}`,
            ProjectID: projectID,
            Title: title,
            Description: `Tự động tạo theo quy trình nhóm ${group}. Phụ trách bởi ${DEPARTMENTS[deptKey]}.`,
            Status: TaskStatus.Todo,
            Priority: TaskPriority.Medium,
            StartDate: start.toISOString(),
            DueDate: end.toISOString(),
            AssigneeID: DEPARTMENTS[deptKey], // Placeholder for Dept Name
            TimelineStep: stepCode,
            LegalBasis: legal,
            DurationDays: dur,
        } as Task;
    };

    // --- PHASE 1: PREPARATION ---

    // 1.1: Investment Policy (Chủ trương đầu tư)
    // Group C usually requires this, but simplified.
    tasks.push(createAutoTask(
        '1.1', 'PREP_POLICY',
        'Lập, thẩm định, phê duyệt Báo cáo đề xuất chủ trương đầu tư',
        'Planning',
        'Luật Đầu tư công 2019'
    ));

    if (group === ProjectGroup.C) {
        // Group C: Báo cáo KT-KT (Economic-Technical Report)
        // Skip separate survey (usually combined)
        tasks.push(createAutoTask(
            '1.3', 'PREP_FS', // Map to same timeline step for Gantt viz, but title is differnet
            'Lập, thẩm định, phê duyệt Báo cáo Kinh tế - Kỹ thuật (KT-KT)',
            'Technical',
            'Luật Xây dựng 2014, NĐ 15/2021 (Điều 5)'
        ));
    } else {
        // Group A/B: Full Feasibility Study Sequence
        tasks.push(createAutoTask(
            '1.2', 'PREP_SURVEY',
            'Khảo sát xây dựng (Giai đoạn chuẩn bị)',
            'Technical',
            'Luật Xây dựng 2014, NĐ 15/2021'
        ));

        tasks.push(createAutoTask(
            '1.3', 'PREP_FS',
            'Lập, thẩm định, phê duyệt Báo cáo NCKT (Dự án đầu tư)',
            'Technical',
            'NĐ 15/2021/NĐ-CP, NĐ 10/2021/NĐ-CP'
        ));
    }


    // --- PHASE 2: IMPLEMENTATION ---
    // Restart current date slightly to simulate parallel clearance & design
    // (Design starts after FS Approval)
    // (Clearance assumes starts after FS Approval too)

    const implStartDate = new Date(currentDate);

    // Branch 1: Clearance
    const clearanceTask = createAutoTask(
        '2.1', 'IMPL_CLEARANCE',
        'Giải phóng mặt bằng & Rà phá bom mìn',
        'PMU',
        'Luật Đất đai'
    );
    tasks.push(clearanceTask);

    // Reset for Design branch
    currentDate = new Date(implStartDate);

    tasks.push(createAutoTask(
        '2.2', 'PREP_SURVEY', // Survey for Design
        'Khảo sát thiết kế bản vẽ thi công',
        'Technical',
        'NĐ 15/2021/NĐ-CP'
    ));

    tasks.push(createAutoTask(
        '2.3', 'IMPL_DESIGN',
        'Lập, thẩm định, phê duyệt Thiết kế & Dự toán',
        'Technical',
        'NĐ 15/2021/NĐ-CP (Điều 35-37)'
    ));

    tasks.push(createAutoTask(
        '2.4', 'IMPL_PERMIT',
        'Xin cấp Giấy phép xây dựng (nếu có)',
        'PMU',
        'Luật Xây dựng'
    ));

    tasks.push(createAutoTask(
        '2.5', 'IMPL_BIDDING',
        'Lựa chọn nhà thầu thi công xây dựng',
        'Bidding',
        'Luật Đấu thầu 2023, NĐ 24/2024'
    ));

    // Construction starts after Bidding (and implies Clearance is done, but simplifying here)
    tasks.push(createAutoTask(
        '2.6', 'IMPL_CONSTRUCTION',
        'Thi công xây dựng công trình',
        'PMU',
        'NĐ 06/2021/NĐ-CP (QLCL)'
    ));

    // --- PHASE 3: COMPLETION ---
    tasks.push(createAutoTask(
        '3.2', 'FINISH_ACCEPTANCE', // 3.1 is strict acceptance, mapping to 3.2 logic
        'Nghiệm thu hoàn thành bàn giao đưa vào sử dụng',
        'Technical',
        'NĐ 06/2021/NĐ-CP'
    ));

    tasks.push(createAutoTask(
        '3.3', 'FINISH_SETTLEMENT',
        'Quyết toán vốn đầu tư dự án hoàn thành',
        'Finance',
        'TT 96/2021/TT-BTC'
    ));

    return tasks;
};
