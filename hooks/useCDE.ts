import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CDEService, CDEDocument, CDEFolder, CDEWorkflowStep } from '../services/CDEService';

// ═══════════════════════════════════════════════════════════════
// CDE Hooks — React Query hooks for Môi trường dữ liệu chung
// ═══════════════════════════════════════════════════════════════

/** Fetch CDE folder structure for a project */
export const useCDEFolders = (projectId: string) => {
    return useQuery({
        queryKey: ['cde-folders', projectId],
        queryFn: () => CDEService.getFolders(projectId),
        enabled: !!projectId,
        staleTime: 30_000,
    });
};

/** Fetch documents in a CDE folder */
export const useCDEDocuments = (folderId: string | null) => {
    return useQuery({
        queryKey: ['cde-documents', folderId],
        queryFn: () => CDEService.getDocuments(folderId!),
        enabled: !!folderId,
    });
};

/** Fetch all CDE documents for a project */
export const useCDEProjectDocuments = (projectId: string) => {
    return useQuery({
        queryKey: ['cde-project-documents', projectId],
        queryFn: () => CDEService.getDocumentsByProject(projectId),
        enabled: !!projectId,
    });
};

/** Fetch CDE stats for a project */
export const useCDEStats = (projectId: string) => {
    return useQuery({
        queryKey: ['cde-stats', projectId],
        queryFn: () => CDEService.getStats(projectId),
        enabled: !!projectId,
        staleTime: 10_000,
    });
};

/** Fetch workflow history for a document */
export const useCDEWorkflowHistory = (docId: number | null) => {
    return useQuery({
        queryKey: ['cde-workflow', docId],
        queryFn: () => CDEService.getWorkflowHistory(docId!),
        enabled: !!docId,
    });
};

/** Upload document to CDE */
export const useUploadCDE = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ file, folderId, projectId, metadata }: {
            file: File;
            folderId: string;
            projectId: string;
            metadata?: { docName?: string; submittedBy?: string; contractorId?: string };
        }) => CDEService.uploadDocument(file, folderId, projectId, metadata),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['cde-documents', variables.folderId] });
            queryClient.invalidateQueries({ queryKey: ['cde-project-documents', variables.projectId] });
            queryClient.invalidateQueries({ queryKey: ['cde-stats', variables.projectId] });
        },
    });
};

/** Change document ISO status */
export const useChangeStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ docId, newStatus, newFolderId }: {
            docId: number;
            newStatus: string;
            newFolderId?: string;
            projectId: string;
        }) => CDEService.changeStatus(docId, newStatus, newFolderId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cde-documents'] });
            queryClient.invalidateQueries({ queryKey: ['cde-project-documents'] });
            queryClient.invalidateQueries({ queryKey: ['cde-stats'] });
        },
    });
};

/** Process a workflow step (approve/reject) */
export const useProcessWorkflowStep = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ docId, stepName, status, comment, actorId, actorName }: {
            docId: number;
            stepName: string;
            status: 'Approved' | 'Rejected';
            comment: string;
            actorId: string;
            actorName: string;
        }) => CDEService.processWorkflowStep(docId, stepName, status, comment, actorId, actorName),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['cde-workflow', variables.docId] });
            queryClient.invalidateQueries({ queryKey: ['cde-documents'] });
            queryClient.invalidateQueries({ queryKey: ['cde-project-documents'] });
            queryClient.invalidateQueries({ queryKey: ['cde-stats'] });
        },
    });
};
