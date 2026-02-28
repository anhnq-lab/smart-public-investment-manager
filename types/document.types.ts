// Document & CDE types

// 6.1. Documents (Hồ sơ Lưu trữ)
export enum DocCategory {
    Legal = 1,
    Quality = 2,
    AsBuilt = 3,
    BIM = 4
}

export interface Document {
    DocID: number;
    ReferenceID: string;
    ProjectID?: string;
    Category: DocCategory;
    DocName: string;
    StoragePath: string;
    IsDigitized: boolean;
    UploadDate: string;
    Version?: string;
    Size?: string;
    History?: any[];
    isLocal?: boolean;
    fileObj?: any;
    FolderID?: string;
    ISOStatus?: ISO19650Status;
    Revision?: string;
    WorkflowHistory?: WorkflowStep[];
}

export interface Folder {
    FolderID: string;
    ParentID?: string | null;
    Name: string;
    Type: 'Container' | 'Folder';
    Path: string;
}

// Module 2: CDE & ISO 19650
export enum ISO19650Status {
    S0 = 'S0', // WIP
    S1 = 'S1', // Shared (Coordination)
    S2 = 'S2', // Shared (Information)
    S3 = 'S3', // Shared (Review)
    A1 = 'A1', // Published (Construction)
    A2 = 'A2', // Published (Handover)
    A3 = 'A3', // Published (Asset Mgmt)
    B1 = 'B1'  // Archived
}

export interface WorkflowStep {
    StepID: string;
    StepName: string;
    ActorID: string;
    Status: 'Pending' | 'Approved' | 'Rejected';
    Comment?: string;
    Timestamp?: string;
}
