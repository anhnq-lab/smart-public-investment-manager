import { useQuery } from '@tanstack/react-query';
import { projectService } from '../services/project.service';

export const useProjects = () => {
    const { data: projects = [], isLoading, error, refetch } = useQuery({
        queryKey: ['projects'],
        queryFn: projectService.getAll
    });

    return {
        projects,
        isLoading,
        error: error ? (error as Error).message : null,
        refetch
    };
};
