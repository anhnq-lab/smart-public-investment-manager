// Task management types

// 8.1. Tasks (Công việc)
export enum TaskStatus {
    Todo = 'Todo',
    InProgress = 'InProgress',
    Review = 'Review',
    Done = 'Done'
}

export enum TaskPriority {
    Low = 'Low',
    Medium = 'Medium',
    High = 'High',
    Urgent = 'Urgent'
}

export interface Task {
    TaskID: string;
    Title: string;
    Description?: string;
    ProjectID: string;
    AssigneeID: string;
    StartDate?: string;
    DueDate: string;
    Status: TaskStatus;
    Priority: TaskPriority;
    TimelineStep?: string;
    CreatedDate?: string;
    SortOrder?: number;
    LegalBasis?: string;
    OutputDocument?: string;
    DurationDays?: number;
    PredecessorTaskID?: string;
    ApproverID?: string;
    EstimatedCost?: number;
    ActualStartDate?: string;
    ActualEndDate?: string;
    SubTasks?: SubTask[];
    Dependencies?: TaskDependency[];
    ProgressPercent?: number;
    PlannedStartDate?: string;
    PlannedEndDate?: string;
    Assignees?: TaskAssignment[];
    IsCritical?: boolean;
    Slack?: number;
    BoardColumn?: string;
    Attachments?: TaskAttachment[];
    SyncStatus?: {
        IsSynced: boolean;
        LastSyncDate?: string;
        NationalProjectCode?: string;
        SyncError?: string;
    };
}

export interface TaskAttachment {
    id: string;
    name: string;
    url: string;
    size: string;
    uploadDate: string;
    type: 'template' | 'uploaded';
}

// Task Dependency Types
export type DependencyType = 'FS' | 'SS' | 'FF' | 'SF';

export interface TaskDependency {
    TaskID: string;
    Type: DependencyType;
    LagDays?: number;
}

// Resource Assignment
export interface TaskAssignment {
    EmployeeID: string;
    AllocationPercent: number;
    Role?: string;
}

export interface SubTask {
    SubTaskID: string;
    Title: string;
    AssigneeID: string;
    Status: 'Todo' | 'Done';
    DueDate?: string;
}
