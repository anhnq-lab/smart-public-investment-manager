
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contractService } from '../services/contract.service';
import { Contract } from '../types';

export const useContracts = () => {
    const queryClient = useQueryClient();

    const { data: contracts = [], isLoading, error } = useQuery({
        queryKey: ['contracts'],
        queryFn: contractService.getAll
    });

    const createMutation = useMutation({
        mutationFn: contractService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
        }
    });

    return {
        contracts,
        isLoading,
        error: error ? (error as Error).message : null,
        createContract: createMutation.mutateAsync,
        isCreating: createMutation.isPending
    };
};
