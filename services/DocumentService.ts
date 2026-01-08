
import { Document, Folder, ISO19650Status, WorkflowStep } from '../types';
import { mockDocuments, mockFolders } from '../mockData';

export const INTERLINKED_WORKFLOW_STEPS = [
    { id: 'CONTRACTOR_SUBMIT', name: 'Nhà thầu trình', role: 'Contractor', nextStatus: ISO19650Status.S3 },
    { id: 'CONSULTANT_APPROVE', name: 'Tư vấn duyệt', role: 'Consultant', nextStatus: ISO19650Status.S3 },
    { id: 'PMU_APPRAISE', name: 'PMU thẩm định', role: 'PMU', nextStatus: ISO19650Status.S3 },
    { id: 'LEADER_SIGN', name: 'Lãnh đạo ký số', role: 'Leader', nextStatus: ISO19650Status.A1 },
];

export class DocumentService {

    /**
     * Get folder structure for a project
     */
    static getFolders(projectId: string): Folder[] {
        return mockFolders;
    }

    /**
     * Get documents in a specific folder
     */
    static getDocumentsInFolder(folderId: string): Document[] {
        return mockDocuments.filter(d => d.FolderID === folderId);
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
     */
    static async processStep(docId: number, status: 'Approved' | 'Rejected', comment: string, actorId: string): Promise<boolean> {
        return new Promise((resolve) => {
            setTimeout(() => {
                const doc = mockDocuments.find(d => d.DocID === docId);
                if (doc) {
                    const nextStep = this.getNextWorkflowStep(doc);
                    if (nextStep) {
                        if (!doc.WorkflowHistory) doc.WorkflowHistory = [];
                        doc.WorkflowHistory.push({
                            StepID: `STP-${Date.now()}`,
                            StepName: nextStep.name,
                            ActorID: actorId,
                            Status: status,
                            Timestamp: new Date().toISOString(),
                            Comment: comment
                        });

                        if (status === 'Approved') {
                            doc.ISOStatus = nextStep.nextStatus;
                        } else {
                            doc.ISOStatus = ISO19650Status.S0; // Returned to WIP
                        }
                    }
                }
                resolve(true);
            }, 800);
        });
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
}
