// Custom hook for Tasks data fetching
import { useState, useEffect, useCallback } from 'react';
import { TaskService } from '../services/taskService';
import { Task, TaskStatus } from '../types';

interface UseTasksOptions {
    projectId?: string;
    autoFetch?: boolean;
}

interface UseTasksResult {
    tasks: Task[];
    loading: boolean;
    error: Error | null;
    refetch: () => void;
    create: (data: Task) => Task;
    update: (task: Task) => Task;
    remove: (id: string) => void;
    filterByStatus: (status: TaskStatus | null) => void;
}

/**
 * Hook to fetch and manage tasks list
 */
export const useTasks = (options: UseTasksOptions = {}): UseTasksResult => {
    const { projectId, autoFetch = true } = options;

    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [statusFilter, setStatusFilter] = useState<TaskStatus | null>(null);

    const fetchTasks = useCallback(() => {
        setLoading(true);
        setError(null);
        try {
            let data: Task[];
            if (projectId) {
                data = TaskService.getTasksByProject(projectId);
            } else {
                data = TaskService.getAllTasks();
            }

            // Apply status filter
            if (statusFilter) {
                data = data.filter(t => t.Status === statusFilter);
            }

            setTasks(data);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [projectId, statusFilter]);

    const refetch = useCallback(() => {
        fetchTasks();
    }, [fetchTasks]);

    const create = useCallback((task: Task): Task => {
        const saved = TaskService.saveTask(task);
        setTasks(prev => [saved, ...prev]);
        return saved;
    }, []);

    const update = useCallback((task: Task): Task => {
        const saved = TaskService.saveTask(task);
        setTasks(prev => prev.map(t => t.TaskID === task.TaskID ? saved : t));
        return saved;
    }, []);

    const remove = useCallback((id: string): void => {
        TaskService.deleteTask(id);
        setTasks(prev => prev.filter(t => t.TaskID !== id));
    }, []);

    const filterByStatus = useCallback((status: TaskStatus | null) => {
        setStatusFilter(status);
    }, []);

    useEffect(() => {
        if (autoFetch) {
            fetchTasks();
        }
    }, [autoFetch, fetchTasks]);

    return { tasks, loading, error, refetch, create, update, remove, filterByStatus };
};

interface UseTaskResult {
    task: Task | null;
    loading: boolean;
    error: Error | null;
    update: (data: Partial<Task>) => void;
}

/**
 * Hook to fetch and manage a single task
 */
export const useTask = (id: string | undefined): UseTaskResult => {
    const [task, setTask] = useState<Task | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchTask = useCallback(() => {
        if (!id) {
            setTask(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const allTasks = TaskService.getAllTasks();
            const found = allTasks.find(t => t.TaskID === id);
            setTask(found || null);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    const update = useCallback((data: Partial<Task>) => {
        if (!task) return;
        const updated = { ...task, ...data };
        TaskService.saveTask(updated);
        setTask(updated);
    }, [task]);

    useEffect(() => {
        fetchTask();
    }, [fetchTask]);

    return { task, loading, error, update };
};

/**
 * Hook for task statistics
 */
export const useTaskStatistics = (projectId?: string) => {
    const [stats, setStats] = useState<{
        total: number;
        byStatus: Record<TaskStatus, number>;
        overdue: number;
    } | null>(null);

    useEffect(() => {
        const tasks = projectId
            ? TaskService.getTasksByProject(projectId)
            : TaskService.getAllTasks();

        const byStatus = {
            [TaskStatus.Todo]: 0,
            [TaskStatus.InProgress]: 0,
            [TaskStatus.Review]: 0,
            [TaskStatus.Done]: 0,
        };

        let overdue = 0;
        const today = new Date().toISOString().split('T')[0];

        tasks.forEach(t => {
            byStatus[t.Status]++;
            if (t.DueDate < today && t.Status !== TaskStatus.Done) {
                overdue++;
            }
        });

        setStats({
            total: tasks.length,
            byStatus,
            overdue,
        });
    }, [projectId]);

    return { stats };
};
