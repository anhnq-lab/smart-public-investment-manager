
import { Document, Folder, ISO19650Status, WorkflowStep } from '../types';

export const INTERLINKED_WORKFLOW_STEPS = [
    { id: 'CONTRACTOR_SUBMIT', name: 'Nhà thầu trình', role: 'Contractor', nextStatus: ISO19650Status.S3 },
    { id: 'CONSULTANT_APPROVE', name: 'Tư vấn duyệt', role: 'Consultant', nextStatus: ISO19650Status.S3 },
    { id: 'PMU_APPRAISE', name: 'PMU thẩm định', role: 'PMU', nextStatus: ISO19650Status.S3 },
    { id: 'LEADER_SIGN', name: 'Lãnh đạo ký số', role: 'Leader', nextStatus: ISO19650Status.A1 },
];

export class DocumentService {

    /**
     * Get folder structure for a project
     * TODO: Integrate with Supabase storage
     */
    static getFolders(projectId: string): Folder[] {
        return [];
    }

    /**
     * Get documents in a specific folder
     * TODO: Integrate with Supabase storage
     */
    static getDocumentsInFolder(folderId: string): Document[] {
        return [];
    }

    /**
     * Get next step for a document in the workflow
     */
    static getNextWorkflowStep(doc: Document) {
        if (!doc.WorkflowHistory || doc.WorkflowHistory.length === 0) {
            return INTERLINKED_WORKFLOW_STEPS[0];
        }

        const lastStep = doc.WorkflowHistory[doc.WorkflowHistory.length - 1];
        if (lastStep.Status === 'Rejected') return INTERLINKED_WORKFLOW_STEPS[0]; // Start over
        if (lastStep.Status === 'Pending') return INTERLINKED_WORKFLOW_STEPS.find(s => s.name === lastStep.StepName);

        const currentIndex = INTERLINKED_WORKFLOW_STEPS.findIndex(s => s.name === lastStep.StepName);
        if (currentIndex === -1 || currentIndex === INTERLINKED_WORKFLOW_STEPS.length - 1) return null;

        return INTERLINKED_WORKFLOW_STEPS[currentIndex + 1];
    }

    /**
     * Approve/Reject a document step
     * TODO: Implement with Supabase
     */
    static async processStep(docId: number, status: 'Approved' | 'Rejected', comment: string, actorId: string): Promise<boolean> {
        // Placeholder — document workflow will be integrated with Supabase
        console.warn('DocumentService.processStep: Not yet connected to Supabase');
        return true;
    }

    /**
     * Upload a new document (Mock)
     */
    static async uploadDocument(doc: Partial<Document>): Promise<Document> {
        return new Promise((resolve) => {
            setTimeout(() => {
                const newDoc: Document = {
                    ...doc,
                    DocID: Math.floor(Math.random() * 10000),
                    UploadDate: new Date().toISOString().split('T')[0],
                    IsDigitized: true,
                    ISOStatus: ISO19650Status.S0,
                    Version: 'P01.01',
                    WorkflowHistory: []
                } as Document;

                resolve(newDoc);
            }, 1000);
        });
    }

    /**
     * Get ISO Status Color Code
     */
    static getStatusColor(status: ISO19650Status): string {
        switch (status) {
            case ISO19650Status.S0: return '#fbbf24'; // Amber (WIP)
            case ISO19650Status.S1:
            case ISO19650Status.S2:
            case ISO19650Status.S3: return '#3b82f6'; // Blue (Shared)
            case ISO19650Status.A1:
            case ISO19650Status.A2:
            case ISO19650Status.A3: return '#10b981'; // Green (Published)
            case ISO19650Status.B1: return '#9ca3af'; // Gray (Archived)
            default: return '#9ca3af';
        }
    }

    static getStatusLabel(status: ISO19650Status): string {
        switch (status) {
            case ISO19650Status.S0: return 'WIP (Đang làm việc)';
            case ISO19650Status.S1: return 'SHARED (Điều phối)';
            case ISO19650Status.S2: return 'SHARED (Thông tin)';
            case ISO19650Status.S3: return 'SHARED (Phê duyệt)';
            case ISO19650Status.A1: return 'PUBLISHED (Đã ký số)';
            case ISO19650Status.A2: return 'PUBLISHED (Bàn giao)';
            case ISO19650Status.B1: return 'ARCHIVED (Lưu trữ)';
            default: return status;
        }
    }

    /**
     * Get all documents belonging to a project
     * TODO: Integrate with Supabase
     */
    static getDocumentsByProject(projectId: string): Document[] {
        return [];
    }

    /**
     * Get document statistics for a project
     */
    static getDocumentStats(projectId: string): {
        total: number;
        approved: number;
        inProgress: number;
        wip: number;
    } {
        const docs = this.getDocumentsByProject(projectId);
        return {
            total: docs.length,
            approved: docs.filter(d =>
                d.ISOStatus === ISO19650Status.A1 ||
                d.ISOStatus === ISO19650Status.A2 ||
                d.ISOStatus === ISO19650Status.A3
            ).length,
            inProgress: docs.filter(d =>
                d.ISOStatus === ISO19650Status.S1 ||
                d.ISOStatus === ISO19650Status.S2 ||
                d.ISOStatus === ISO19650Status.S3
            ).length,
            wip: docs.filter(d =>
                d.ISOStatus === ISO19650Status.S0
            ).length,
        };
    }

    /**
     * Search documents by name within a project
     * TODO: Integrate with Supabase
     */
    static searchDocuments(query: string, projectId?: string): Document[] {
        const lowerQuery = query.toLowerCase();
        const docs = projectId ? this.getDocumentsByProject(projectId) : [];
        return docs.filter(d => d.DocName.toLowerCase().includes(lowerQuery));
    }
}
