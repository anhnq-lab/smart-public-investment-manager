import { useQuery } from '@tanstack/react-query';
import ProjectService from '../services/ProjectService';
import { BiddingPackage } from '../types';

/**
 * Hook to fetch ALL bidding packages across all projects
 */
export const useAllBiddingPackages = () => {
    const query = useQuery<BiddingPackage[]>({
        queryKey: ['bidding-packages-all'],
        queryFn: () => ProjectService.getAllBiddingPackages(),
        staleTime: 5 * 60 * 1000, // 5 mins
    });

    return {
        biddingPackages: query.data || [],
        isLoading: query.isLoading,
        error: query.error,
        ...query,
    };
};

export default useAllBiddingPackages;
