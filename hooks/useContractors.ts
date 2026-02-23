import { useQuery } from '@tanstack/react-query';
import { ContractorService } from '../services/ContractorService';
import { Contractor } from '../types';

/**
 * Hook to fetch all contractors from Supabase
 */
export const useContractors = () => {
    const query = useQuery<Contractor[]>({
        queryKey: ['contractors'],
        queryFn: () => ContractorService.getAll(),
        staleTime: 5 * 60 * 1000, // 5 mins
    });

    return {
        contractors: query.data || [],
        isLoading: query.isLoading,
        error: query.error,
        ...query,
    };
};

export default useContractors;
