// Employee & Auth types

// 7.1. Employees (Nhân viên) & AUTH
export enum EmployeeStatus {
    Active = 1,
    Inactive = 0
}

export enum Role {
    Admin = 'Admin',
    Manager = 'Manager',
    Staff = 'Staff'
}

export interface Employee {
    EmployeeID: string;
    FullName: string;
    Department: string;
    Position: string;
    Email: string;
    Phone: string;
    AvatarUrl: string;
    Status: EmployeeStatus;
    JoinDate: string;
    Username: string;
    Password?: string;
    Role: Role;
}

// 9.1 Audit Logs (Lưu vết hệ thống)
export interface AuditLog {
    LogID: string;
    Action: 'Create' | 'Update' | 'Delete' | 'Login';
    TargetEntity: string;
    TargetID: string;
    ChangedBy: string;
    Timestamp: string;
    Details: string;
}
