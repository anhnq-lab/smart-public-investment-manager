import { supabase } from '../lib/supabase';
import { ISO19650Status } from '../types';

// ═══════════════════════════════════════════════════════════════
// CDE Service — Môi trường dữ liệu chung (ISO 19650)
// ═══════════════════════════════════════════════════════════════

export interface CDEFolder {
    id: string;
    project_id: string;
    parent_id: string | null;
    name: string;
    container_type: 'WIP' | 'SHARED' | 'PUBLISHED' | 'ARCHIVED';
    path: string;
    sort_order: number;
    icon?: string;
    description?: string;
    created_at: string;
    updated_at: string;
    // Computed
    doc_count?: number;
}

export interface CDEDocument {
    doc_id: number;
    project_id: string;
    doc_name: string;
    storage_path: string;
    size: string;
    version: string;
    cde_folder_id: string | null;
    cde_status: string;
    iso_status: string;
    revision: string;
    upload_date: string;
    uploaded_by: string;
    submitted_by: string;
    approved_by_name: string;
    contractor_id: string | null;
    document_number: string;
    issue_date: string;
    issuing_authority: string;
    notes: string;
    is_digitized: boolean;
    created_at: string;
    // Computed
    workflow_history?: CDEWorkflowStep[];
}

export interface CDEWorkflowStep {
    id: string;
    doc_id: number;
    step_name: string;
    actor_id: string;
    actor_name: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    comment: string;
    created_at: string;
}

// Workflow steps definition (ISO 19650 compliant)
export const CDE_WORKFLOW_STEPS = [
    { id: 'CONTRACTOR_SUBMIT', name: 'Nhà thầu trình', role: 'Nhà thầu', nextStatus: 'S1' },
    { id: 'CONSULTANT_APPROVE', name: 'Tư vấn duyệt', role: 'Tư vấn giám sát', nextStatus: 'S2' },
    { id: 'PMU_APPRAISE', name: 'PMU thẩm định', role: 'Ban QLDA', nextStatus: 'S3' },
    { id: 'LEADER_SIGN', name: 'Lãnh đạo ký số', role: 'Lãnh đạo', nextStatus: 'A1' },
];

// Container config
export const CDE_CONTAINERS = [
    { type: 'WIP' as const, label: 'WIP - Đang xử lý', color: '#f59e0b', bgClass: 'bg-amber-500', textClass: 'text-amber-700', lightBg: 'bg-amber-50 dark:bg-amber-900/20' },
    { type: 'SHARED' as const, label: 'SHARED - Chia sẻ', color: '#3b82f6', bgClass: 'bg-blue-500', textClass: 'text-blue-700', lightBg: 'bg-blue-50 dark:bg-blue-900/20' },
    { type: 'PUBLISHED' as const, label: 'PUBLISHED - Phát hành', color: '#10b981', bgClass: 'bg-emerald-500', textClass: 'text-emerald-700', lightBg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { type: 'ARCHIVED' as const, label: 'ARCHIVED - Lưu trữ', color: '#8b5cf6', bgClass: 'bg-purple-500', textClass: 'text-purple-700', lightBg: 'bg-purple-50 dark:bg-purple-900/20' },
];

export class CDEService {

    // ─── Folders ────────────────────────────────────────────────

    /** Lấy cấu trúc thư mục CDE của dự án */
    static async getFolders(projectId: string): Promise<CDEFolder[]> {
        const { data, error } = await supabase
            .from('cde_folders')
            .select('*')
            .eq('project_id', projectId)
            .order('sort_order');

        if (error) {
            console.error('CDEService.getFolders error:', error);
            return [];
        }
        return (data || []) as CDEFolder[];
    }

    /** Lấy folders con */
    static async getChildFolders(folderId: string): Promise<CDEFolder[]> {
        const { data, error } = await supabase
            .from('cde_folders')
            .select('*')
            .eq('parent_id', folderId)
            .order('sort_order');

        if (error) return [];
        return (data || []) as CDEFolder[];
    }

    // ─── Documents ─────────────────────────────────────────────

    /** Lấy tài liệu trong một thư mục CDE */
    static async getDocuments(folderId: string): Promise<CDEDocument[]> {
        const { data, error } = await supabase
            .from('documents')
            .select('*')
            .eq('cde_folder_id', folderId)
            .order('upload_date', { ascending: false });

        if (error) {
            console.error('CDEService.getDocuments error:', error);
            return [];
        }
        return (data || []) as CDEDocument[];
    }

    /** Lấy tất cả tài liệu CDE của dự án */
    static async getDocumentsByProject(projectId: string): Promise<CDEDocument[]> {
        const { data, error } = await supabase
            .from('documents')
            .select('*')
            .eq('project_id', projectId)
            .not('cde_folder_id', 'is', null)
            .order('upload_date', { ascending: false });

        if (error) return [];
        return (data || []) as CDEDocument[];
    }

    /** Upload tài liệu vào CDE */
    static async uploadDocument(
        file: File,
        folderId: string,
        projectId: string,
        metadata?: {
            docName?: string;
            submittedBy?: string;
            contractorId?: string;
        }
    ): Promise<CDEDocument | null> {
        try {
            // 1. Upload file to Supabase Storage
            const ext = file.name.split('.').pop();
            const storagePath = `${projectId}/cde/${Date.now()}.${ext}`;
            const { error: uploadError } = await supabase.storage
                .from('task-attachments')
                .upload(storagePath, file);

            if (uploadError) throw uploadError;

            // 2. Get public URL
            const { data: urlData } = supabase.storage
                .from('task-attachments')
                .getPublicUrl(storagePath);

            // 3. Get folder info for container_type → determine initial status
            const { data: folder } = await supabase
                .from('cde_folders')
                .select('container_type')
                .eq('id', folderId)
                .single();

            const initialStatus = folder?.container_type === 'WIP' ? 'S0'
                : folder?.container_type === 'SHARED' ? 'S1'
                    : folder?.container_type === 'PUBLISHED' ? 'A1'
                        : 'B1';

            // 4. Insert document record
            const { data: doc, error: insertError } = await supabase
                .from('documents')
                .insert({
                    project_id: projectId,
                    doc_name: metadata?.docName || file.name,
                    storage_path: urlData.publicUrl,
                    size: CDEService.formatFileSize(file.size),
                    version: 'P01.01',
                    cde_folder_id: folderId,
                    cde_status: initialStatus,
                    iso_status: initialStatus,
                    is_digitized: true,
                    source: 'cde',
                    submitted_by: metadata?.submittedBy || 'Ban QLDA',
                    contractor_id: metadata?.contractorId || null,
                })
                .select()
                .single();

            if (insertError) throw insertError;
            return doc as CDEDocument;
        } catch (err) {
            console.error('CDEService.uploadDocument error:', err);
            return null;
        }
    }

    // ─── Status Management ─────────────────────────────────────

    /** Chuyển trạng thái tài liệu ISO 19650 */
    static async changeStatus(
        docId: number,
        newStatus: string,
        newFolderId?: string
    ): Promise<boolean> {
        const updateData: any = { cde_status: newStatus, iso_status: newStatus };
        if (newFolderId) updateData.cde_folder_id = newFolderId;

        const { error } = await supabase
            .from('documents')
            .update(updateData)
            .eq('doc_id', docId);

        return !error;
    }

    // ─── Workflow ──────────────────────────────────────────────

    /** Lấy lịch sử workflow của tài liệu */
    static async getWorkflowHistory(docId: number): Promise<CDEWorkflowStep[]> {
        const { data, error } = await supabase
            .from('cde_workflow_history')
            .select('*')
            .eq('doc_id', docId)
            .order('created_at', { ascending: true });

        if (error) return [];
        return (data || []) as CDEWorkflowStep[];
    }

    /** Xử lý bước phê duyệt */
    static async processWorkflowStep(
        docId: number,
        stepName: string,
        status: 'Approved' | 'Rejected',
        comment: string,
        actorId: string,
        actorName: string
    ): Promise<boolean> {
        try {
            // 1. Insert workflow history
            const { error: histError } = await supabase
                .from('cde_workflow_history')
                .insert({
                    doc_id: docId,
                    step_name: stepName,
                    actor_id: actorId,
                    actor_name: actorName,
                    status,
                    comment,
                });

            if (histError) throw histError;

            // 2. Update document status if approved
            if (status === 'Approved') {
                const step = CDE_WORKFLOW_STEPS.find(s => s.name === stepName);
                if (step) {
                    await CDEService.changeStatus(docId, step.nextStatus);
                }
            } else {
                // Rejected → back to S0 (WIP)
                await CDEService.changeStatus(docId, 'S0');
            }

            return true;
        } catch (err) {
            console.error('CDEService.processWorkflowStep error:', err);
            return false;
        }
    }

    /** Tìm bước tiếp theo trong workflow */
    static async getNextWorkflowStep(docId: number) {
        const history = await CDEService.getWorkflowHistory(docId);

        if (history.length === 0) return CDE_WORKFLOW_STEPS[0];

        const lastStep = history[history.length - 1];
        if (lastStep.status === 'Rejected') return CDE_WORKFLOW_STEPS[0];
        if (lastStep.status === 'Pending') return CDE_WORKFLOW_STEPS.find(s => s.name === lastStep.step_name);

        const currentIndex = CDE_WORKFLOW_STEPS.findIndex(s => s.name === lastStep.step_name);
        if (currentIndex === -1 || currentIndex === CDE_WORKFLOW_STEPS.length - 1) return null;

        return CDE_WORKFLOW_STEPS[currentIndex + 1];
    }

    // ─── Stats ─────────────────────────────────────────────────

    /** Thống kê hồ sơ CDE của dự án */
    static async getStats(projectId: string) {
        const docs = await CDEService.getDocumentsByProject(projectId);
        return {
            total: docs.length,
            wip: docs.filter(d => d.cde_status === 'S0').length,
            shared: docs.filter(d => ['S1', 'S2', 'S3'].includes(d.cde_status)).length,
            published: docs.filter(d => ['A1', 'A2', 'A3'].includes(d.cde_status)).length,
            archived: docs.filter(d => d.cde_status === 'B1').length,
        };
    }

    // ─── Helpers ────────────────────────────────────────────────

    static getStatusColor(status: string): string {
        if (status === 'S0') return '#f59e0b';
        if (['S1', 'S2', 'S3'].includes(status)) return '#3b82f6';
        if (['A1', 'A2', 'A3'].includes(status)) return '#10b981';
        if (status === 'B1') return '#8b5cf6';
        return '#9ca3af';
    }

    static getStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            S0: 'WIP - Đang xử lý',
            S1: 'SHARED - Điều phối',
            S2: 'SHARED - Thông tin',
            S3: 'SHARED - Phê duyệt',
            A1: 'PUBLISHED - Đã ký số',
            A2: 'PUBLISHED - Bàn giao',
            A3: 'PUBLISHED - Quản lý TS',
            B1: 'ARCHIVED - Lưu trữ',
        };
        return labels[status] || status;
    }

    static getContainerFromStatus(status: string): 'WIP' | 'SHARED' | 'PUBLISHED' | 'ARCHIVED' {
        if (status === 'S0') return 'WIP';
        if (['S1', 'S2', 'S3'].includes(status)) return 'SHARED';
        if (['A1', 'A2', 'A3'].includes(status)) return 'PUBLISHED';
        return 'ARCHIVED';
    }

    static formatFileSize(bytes: number): string {
        if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
        return `${bytes} B`;
    }
}
