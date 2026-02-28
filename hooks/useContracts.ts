
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ContractService } from '../services/ContractService';
import { Contract } from '../types';

export const useContracts = () => {
    const queryClient = useQueryClient();

    const { data: contracts = [], isLoading, error } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => ContractService.getAll()
    });

    const createMutation = useMutation({
        mutationFn: (contract: Partial<Contract>) => ContractService.create(contract),
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
