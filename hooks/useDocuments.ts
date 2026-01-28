import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DocumentService } from '../services/DocumentService';
import { Document, Folder } from '../types';

export const useFolders = (projectId: string) => {
    return useQuery({
        queryKey: ['folders', projectId],
        queryFn: () => DocumentService.getFolders(projectId),
        enabled: !!projectId
    });
};

export const useDocuments = (folderId: string) => {
    return useQuery({
        queryKey: ['documents', folderId],
        queryFn: () => DocumentService.getDocumentsInFolder(folderId),
        enabled: !!folderId
    });
};

export const useProcessStep = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ docId, status, comment, actorId }: { docId: number, status: 'Approved' | 'Rejected', comment: string, actorId: string }) =>
            DocumentService.processStep(docId, status, comment, actorId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
        }
    });
};
