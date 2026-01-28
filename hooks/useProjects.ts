import { useQuery } from '@tanstack/react-query';
import { ProjectService } from '../services/ProjectService';
import { QueryParams } from '../types/api';

export const useProjects = (params?: QueryParams) => {
    const { data: projects = [], isLoading, error, refetch } = useQuery({
        queryKey: ['projects', JSON.stringify(params)],
        queryFn: () => ProjectService.getAll(params)
    });

    return {
        projects,
        isLoading,
        error: error ? (error as Error).message : null,
        refetch
    };
};
