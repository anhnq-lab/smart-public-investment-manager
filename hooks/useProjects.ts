// Custom hook for Projects data fetching
import { useState, useEffect, useCallback } from 'react';
import { ProjectService } from '../services/ProjectService';
import { Project, ProjectStatus } from '../types';
import type { QueryParams } from '../types/api';

interface UseProjectsOptions {
    autoFetch?: boolean;
    initialFilters?: QueryParams['filters'];
}

interface UseProjectsResult {
    projects: Project[];
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
    search: (query: string) => Promise<void>;
    filterByStatus: (status: ProjectStatus | null) => Promise<void>;
}

/**
 * Hook to fetch and manage projects list
 */
export const useProjects = (options: UseProjectsOptions = {}): UseProjectsResult => {
    const { autoFetch = true, initialFilters } = options;

    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [params, setParams] = useState<QueryParams>({ filters: initialFilters });

    const fetchProjects = useCallback(async (queryParams?: QueryParams) => {
        setLoading(true);
        setError(null);
        try {
            const data = await ProjectService.getAll(queryParams || params);
            setProjects(data);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [params]);

    const refetch = useCallback(async () => {
        await fetchProjects();
    }, [fetchProjects]);

    const search = useCallback(async (query: string) => {
        const newParams = { ...params, search: query };
        setParams(newParams);
        await fetchProjects(newParams);
    }, [params, fetchProjects]);

    const filterByStatus = useCallback(async (status: ProjectStatus | null) => {
        const newParams = {
            ...params,
            filters: status ? { ...params.filters, status } : { ...params.filters, status: undefined },
        };
        setParams(newParams);
        await fetchProjects(newParams);
    }, [params, fetchProjects]);

    useEffect(() => {
        if (autoFetch) {
            fetchProjects();
        }
    }, [autoFetch]); // eslint-disable-line react-hooks/exhaustive-deps

    return { projects, loading, error, refetch, search, filterByStatus };
};

interface UseProjectResult {
    project: Project | null;
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
    update: (data: Partial<Project>) => Promise<void>;
}

/**
 * Hook to fetch and manage a single project
 */
export const useProject = (id: string | undefined): UseProjectResult => {
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchProject = useCallback(async () => {
        if (!id) {
            setProject(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const data = await ProjectService.getById(id);
            setProject(data || null);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    const refetch = useCallback(async () => {
        await fetchProject();
    }, [fetchProject]);

    const update = useCallback(async (data: Partial<Project>) => {
        if (!id || !project) return;
        try {
            const updated = await ProjectService.update(id, data);
            setProject(updated);
        } catch (err) {
            setError(err as Error);
            throw err;
        }
    }, [id, project]);

    useEffect(() => {
        fetchProject();
    }, [fetchProject]);

    return { project, loading, error, refetch, update };
};

/**
 * Hook for project statistics
 */
export const useProjectStatistics = () => {
    const [stats, setStats] = useState<{
        total: number;
        byStatus: Record<ProjectStatus, number>;
        totalInvestment: number;
    } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await ProjectService.getStatistics();
                setStats(data);
            } catch (err) {
                console.error('Failed to fetch project statistics', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    return { stats, loading };
};
