import { Task, TaskStatus, TaskPriority, ProjectGroup } from '../types';

interface TaskTemplate {
    Title: string;
    Description: string;
    TimelineStep: string;
    LegalBasis: string;
    OutputDocument: string;
    DurationDays: number;
    Priority: TaskPriority;
}

// Mẫu công việc tham khảo theo Nghị định 175/2024/NĐ-CP (Quy định trình tự thực hiện dự án đầu tư xây dựng)
// Ban hành ngày 30/12/2024, thay thế Nghị định 15/2021/NĐ-CP

const GROUP_B_MAIN_FLOW: TaskTemplate[] = [
    // 1. Giai đoạn chuẩn bị dự án
    {
        Title: "Lập, thẩm định, phê duyệt Quy hoạch xây dựng (nếu có)",
        Description: "Lập quy hoạch phân khu/chi tiết làm cơ sở lập dự án.",
        TimelineStep: "1. Giai đoạn chuẩn bị dự án",
        LegalBasis: "NĐ 175/2024/NĐ-CP",
        OutputDocument: "Quyết định phê duyệt quy hoạch",
        DurationDays: 30,
        Priority: TaskPriority.Medium
    },
    {
        Title: "Lập Báo cáo nghiên cứu khả thi (hoặc Báo cáo đề xuất chủ trương)",
        Description: "Lập hồ sơ đề xuất chủ trương đầu tư (nếu cần) hoặc BCNCKT.",
        TimelineStep: "1. Giai đoạn chuẩn bị dự án",
        LegalBasis: "NĐ 175/2024/NĐ-CP; Luật Đầu tư công",
        OutputDocument: "Tờ trình/Hồ sơ dự án",
        DurationDays: 45,
        Priority: TaskPriority.High
    },
    {
        Title: "Khảo sát xây dựng phục vụ lập dự án",
        Description: "Khảo sát địa hình, địa chất phục vụ lập BCNCKT.",
        TimelineStep: "1. Giai đoạn chuẩn bị dự án",
        LegalBasis: "NĐ 175/2024/NĐ-CP",
        OutputDocument: "Báo cáo kết quả khảo sát",
        DurationDays: 20,
        Priority: TaskPriority.Medium
    },
    {
        Title: "Thẩm định Báo cáo nghiên cứu khả thi",
        Description: "Thẩm định dự án đầu tư xây dựng (Thiết kế cơ sở & Tổng mức đầu tư).",
        TimelineStep: "1. Giai đoạn chuẩn bị dự án",
        LegalBasis: "NĐ 175/2024/NĐ-CP; Luật Xây dựng",
        OutputDocument: "Báo cáo kết quả thẩm định",
        DurationDays: 30,
        Priority: TaskPriority.High
    },
    {
        Title: "Quyết định đầu tư xây dựng",
        Description: "Phê duyệt dự án đầu tư.",
        TimelineStep: "1. Giai đoạn chuẩn bị dự án",
        LegalBasis: "NĐ 175/2024/NĐ-CP",
        OutputDocument: "Quyết định phê duyệt dự án",
        DurationDays: 7,
        Priority: TaskPriority.Urgent
    },

    // 2. Giai đoạn thực hiện dự án
    {
        Title: "Chuẩn bị mặt bằng xây dựng, rà phá bom mìn",
        Description: "Giải phóng mặt bằng, giao đất, rà phá bom mìn (nếu có).",
        TimelineStep: "2. Giai đoạn thực hiện dự án",
        LegalBasis: "NĐ 175/2024/NĐ-CP",
        OutputDocument: "Biên bản bàn giao mặt bằng sạch",
        DurationDays: 60,
        Priority: TaskPriority.High
    },
    {
        Title: "Khảo sát xây dựng phục vụ thiết kế (bước sau TKCS)",
        Description: "Khảo sát chi tiết phục vụ thiết kế bản vẽ thi công.",
        TimelineStep: "2. Giai đoạn thực hiện dự án",
        LegalBasis: "NĐ 175/2024/NĐ-CP",
        OutputDocument: "Báo cáo khảo sát bước thiết kế",
        DurationDays: 20,
        Priority: TaskPriority.Medium
    },
    {
        Title: "Lập, Thẩm định, Phê duyệt Thiết kế & Dự toán",
        Description: "Thẩm định và phê duyệt thiết kế triển khai sau thiết kế cơ sở & dự toán xây dựng.",
        TimelineStep: "2. Giai đoạn thực hiện dự án",
        LegalBasis: "NĐ 175/2024/NĐ-CP",
        OutputDocument: "Quyết định phê duyệt TKBVTC & Dự toán",
        DurationDays: 30,
        Priority: TaskPriority.High
    },
    {
        Title: "Lựa chọn nhà thầu & Ký kết hợp đồng xây dựng",
        Description: "Tổ chức lựa chọn nhà thầu, thương thảo và ký kết hợp đồng.",
        TimelineStep: "2. Giai đoạn thực hiện dự án",
        LegalBasis: "NĐ 175/2024/NĐ-CP; Luật Đấu thầu",
        OutputDocument: "Hợp đồng thi công xây dựng",
        DurationDays: 45,
        Priority: TaskPriority.Urgent
    },
    {
        Title: "Cấp giấy phép xây dựng (nếu có)",
        Description: "Thực hiện thủ tục cấp GPXD đối với công trình yêu cầu.",
        TimelineStep: "2. Giai đoạn thực hiện dự án",
        LegalBasis: "NĐ 175/2024/NĐ-CP",
        OutputDocument: "Giấy phép xây dựng",
        DurationDays: 15,
        Priority: TaskPriority.Medium
    },
    {
        Title: "Thi công xây dựng: Phần móng & Ngầm",
        Description: "Thi công phần móng và công trình ngầm.",
        TimelineStep: "2. Giai đoạn thực hiện dự án",
        LegalBasis: "NĐ 175/2024/NĐ-CP; NĐ 06/2021/NĐ-CP",
        OutputDocument: "Biên bản nghiệm thu phần móng",
        DurationDays: 45,
        Priority: TaskPriority.Medium
    },
    {
        Title: "Thi công xây dựng: Phần thân & Kết cấu",
        Description: "Thi công phần thân, kết cấu chịu lực chính.",
        TimelineStep: "2. Giai đoạn thực hiện dự án",
        LegalBasis: "NĐ 175/2024/NĐ-CP",
        OutputDocument: "Biên bản nghiệm thu phần thân",
        DurationDays: 90,
        Priority: TaskPriority.Medium
    },
    {
        Title: "Thi công xây dựng: Hoàn thiện & ME",
        Description: "Thi công hoàn thiện và lắp đặt thiết bị công trình.",
        TimelineStep: "2. Giai đoạn thực hiện dự án",
        LegalBasis: "NĐ 175/2024/NĐ-CP",
        OutputDocument: "Biên bản nghiệm thu hoàn thành giai đoạn",
        DurationDays: 60,
        Priority: TaskPriority.Medium
    },
    {
        Title: "Giám sát thi công xây dựng",
        Description: "Công tác giám sát chất lượng, khối lượng, tiến độ, an toàn lao động.",
        TimelineStep: "2. Giai đoạn thực hiện dự án",
        LegalBasis: "NĐ 175/2024/NĐ-CP",
        OutputDocument: "Báo cáo giám sát định kỳ",
        DurationDays: 195, // Song hành cùng thời gian thi công
        Priority: TaskPriority.Medium
    },
    {
        Title: "Nghiệm thu hoàn thành công trình xây dựng",
        Description: "Nghiệm thu hoàn thành hạng mục hoặc toàn bộ công trình.",
        TimelineStep: "2. Giai đoạn thực hiện dự án",
        LegalBasis: "NĐ 175/2024/NĐ-CP",
        OutputDocument: "Văn bản chấp thuận nghiệm thu",
        DurationDays: 15,
        Priority: TaskPriority.High
    },

    // 3. Giai đoạn kết thúc xây dựng
    {
        Title: "Bàn giao công trình đưa vào sử dụng",
        Description: "Bàn giao công trình cho chủ đầu tư/đơn vị quản lý sử dụng.",
        TimelineStep: "3. Giai đoạn kết thúc xây dựng",
        LegalBasis: "NĐ 175/2024/NĐ-CP",
        OutputDocument: "Biên bản bàn giao công trình",
        DurationDays: 7,
        Priority: TaskPriority.Medium
    },
    {
        Title: "Quyết toán hợp đồng xây dựng",
        Description: "Thực hiện quyết toán hợp đồng với các nhà thầu.",
        TimelineStep: "3. Giai đoạn kết thúc xây dựng",
        LegalBasis: "NĐ 175/2024/NĐ-CP",
        OutputDocument: "Hồ sơ quyết toán hợp đồng",
        DurationDays: 30,
        Priority: TaskPriority.Medium
    },
    {
        Title: "Quyết toán vốn đầu tư dự án hoàn thành",
        Description: "Lập hồ sơ và trình phê duyệt quyết toán vốn đầu tư.",
        TimelineStep: "3. Giai đoạn kết thúc xây dựng",
        LegalBasis: "NĐ 175/2024/NĐ-CP; NĐ 99/2021/NĐ-CP",
        OutputDocument: "Quyết định phê duyệt quyết toán vốn",
        DurationDays: 90,
        Priority: TaskPriority.Medium
    },
    {
        Title: "Bảo hành công trình xây dựng",
        Description: "Thực hiện nghĩa vụ bảo hành theo quy định.",
        TimelineStep: "3. Giai đoạn kết thúc xây dựng",
        LegalBasis: "NĐ 175/2024/NĐ-CP",
        OutputDocument: "Văn bản xác nhận hoàn thành bảo hành",
        DurationDays: 365,
        Priority: TaskPriority.Medium
    }
];

const GROUP_C_MAIN_FLOW: TaskTemplate[] = [
    // 1. Giai đoạn chuẩn bị dự án
    {
        Title: "Lập, phê duyệt chủ trương đầu tư (nếu có)",
        Description: "Đối với dự án nhóm C yêu cầu phải có chủ trương đầu tư trước.",
        TimelineStep: "1. Giai đoạn chuẩn bị dự án",
        LegalBasis: "NĐ 175/2024/NĐ-CP; Luật ĐTC",
        OutputDocument: "Quyết định chủ trương đầu tư",
        DurationDays: 15,
        Priority: TaskPriority.High
    },
    {
        Title: "Khảo sát, Lập Báo cáo KT-KT đầu tư xây dựng",
        Description: "Lập Báo cáo kinh tế - kỹ thuật (bao gồm thiết kế bản vẽ thi công & dự toán).",
        TimelineStep: "1. Giai đoạn chuẩn bị dự án",
        LegalBasis: "NĐ 175/2024/NĐ-CP",
        OutputDocument: "Hồ sơ Báo cáo KT-KT",
        DurationDays: 30,
        Priority: TaskPriority.High
    },
    {
        Title: "Thẩm định Báo cáo KT-KT",
        Description: "Thẩm định các nội dung của Báo cáo KT-KT.",
        TimelineStep: "1. Giai đoạn chuẩn bị dự án",
        LegalBasis: "NĐ 175/2024/NĐ-CP",
        OutputDocument: "Báo cáo thẩm định",
        DurationDays: 20,
        Priority: TaskPriority.High
    },
    {
        Title: "Quyết định đầu tư xây dựng (Phê duyệt Báo cáo KT-KT)",
        Description: "Phê duyệt dự án và thiết kế bản vẽ thi công, dự toán.",
        TimelineStep: "1. Giai đoạn chuẩn bị dự án",
        LegalBasis: "NĐ 175/2024/NĐ-CP",
        OutputDocument: "Quyết định phê duyệt Báo cáo KT-KT",
        DurationDays: 7,
        Priority: TaskPriority.Urgent
    },

    // 2. Giai đoạn thực hiện dự án
    {
        Title: "Chuẩn bị mặt bằng thi công",
        Description: "Bàn giao mặt bằng để thi công.",
        TimelineStep: "2. Giai đoạn thực hiện dự án",
        LegalBasis: "NĐ 175/2024/NĐ-CP",
        OutputDocument: "Biên bản bàn giao mặt bằng",
        DurationDays: 10,
        Priority: TaskPriority.Medium
    },
    {
        Title: "Lựa chọn nhà thầu & Ký kết hợp đồng",
        Description: "Lựa chọn nhà thầu thi công xây dựng.",
        TimelineStep: "2. Giai đoạn thực hiện dự án",
        LegalBasis: "NĐ 175/2024/NĐ-CP",
        OutputDocument: "Hợp đồng thi công",
        DurationDays: 20,
        Priority: TaskPriority.Urgent
    },
    {
        Title: "Thi công xây dựng công trình",
        Description: "Thực hiện thi công theo thiết kế đã duyệt.",
        TimelineStep: "2. Giai đoạn thực hiện dự án",
        LegalBasis: "NĐ 175/2024/NĐ-CP",
        OutputDocument: "Nhật ký thi công",
        DurationDays: 120,
        Priority: TaskPriority.Medium
    },
    {
        Title: "Giám sát thi công xây dựng",
        Description: "Giám sát chất lượng trong quá trình thi công.",
        TimelineStep: "2. Giai đoạn thực hiện dự án",
        LegalBasis: "NĐ 175/2024/NĐ-CP",
        OutputDocument: "Báo cáo giám sát",
        DurationDays: 120,
        Priority: TaskPriority.Medium
    },
    {
        Title: "Nghiệm thu hoàn thành công trình",
        Description: "Nghiệm thu đưa công trình vào sử dụng.",
        TimelineStep: "2. Giai đoạn thực hiện dự án",
        LegalBasis: "NĐ 175/2024/NĐ-CP",
        OutputDocument: "Biên bản nghiệm thu hoàn thành",
        DurationDays: 7,
        Priority: TaskPriority.High
    },

    // 3. Giai đoạn kết thúc xây dựng
    {
        Title: "Bàn giao công trình",
        Description: "Bàn giao cho chủ đầu tư/đơn vị sử dụng.",
        TimelineStep: "3. Giai đoạn kết thúc xây dựng",
        LegalBasis: "NĐ 175/2024/NĐ-CP",
        OutputDocument: "Biên bản bàn giao",
        DurationDays: 5,
        Priority: TaskPriority.Medium
    },
    {
        Title: "Quyết toán vốn đầu tư dự án hoàn thành",
        Description: "Lập và phê duyệt quyết toán.",
        TimelineStep: "3. Giai đoạn kết thúc xây dựng",
        LegalBasis: "NĐ 175/2024/NĐ-CP",
        OutputDocument: "Quyết định phê duyệt quyết toán",
        DurationDays: 60,
        Priority: TaskPriority.Medium
    },
    {
        Title: "Bảo hành công trình",
        Description: "Bảo hành theo quy định.",
        TimelineStep: "3. Giai đoạn kết thúc xây dựng",
        LegalBasis: "NĐ 175/2024/NĐ-CP",
        OutputDocument: "Xác nhận hết hạn bảo hành",
        DurationDays: 365,
        Priority: TaskPriority.Medium
    }
];

import { mockEmployees } from '../mockData';

export const generateTasksForProject = (projectID: string, group: ProjectGroup, startDateInput?: string): Task[] => {
    // Chọn mẫu dựa trên Nhóm dự án
    let template = GROUP_B_MAIN_FLOW;
    if (group === ProjectGroup.C) {
        template = GROUP_C_MAIN_FLOW;
    }
    // Mở rộng cho Nhóm A nếu cần...

    const baseStartDate = startDateInput ? new Date(startDateInput) : new Date();

    return template.map((tpl, index) => {
        // Logic tính ngày: Công việc sau bắt đầu sau công việc trước
        const taskStartDate = new Date(baseStartDate);
        taskStartDate.setDate(taskStartDate.getDate() + (index * (tpl.DurationDays + 2)));

        const dueDate = new Date(taskStartDate);
        dueDate.setDate(dueDate.getDate() + tpl.DurationDays);

        // Random assignee
        const randomEmployee = mockEmployees[Math.floor(Math.random() * mockEmployees.length)];

        return {
            TaskID: `TSK-${projectID}-${(index + 1).toString().padStart(2, '0')}`,
            ProjectID: projectID,
            Title: tpl.Title,
            Description: tpl.Description,
            Status: TaskStatus.Todo,
            Priority: tpl.Priority,
            AssigneeID: randomEmployee?.EmployeeID || "NV1001",
            DueDate: dueDate.toISOString().split('T')[0],
            TimelineStep: tpl.TimelineStep,
            LegalBasis: tpl.LegalBasis,
            OutputDocument: tpl.OutputDocument,
            DurationDays: tpl.DurationDays,
            EstimatedCost: 0,
            SortOrder: index + 1,
            PredecessorTaskID: index > 0 ? `TSK-${projectID}-${index.toString().padStart(2, '0')}` : undefined
        };
    });
};
