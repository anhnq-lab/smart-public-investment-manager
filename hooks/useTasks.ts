import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TaskService } from '../services/TaskService';
import { Task, TaskStatus } from '../types';

// Keys
export const taskKeys = {
    all: ['tasks'] as const,
    lists: () => [...taskKeys.all, 'list'] as const,
    list: (projectId?: string) => [...taskKeys.lists(), { projectId }] as const,
    details: () => [...taskKeys.all, 'detail'] as const,
    detail: (id: string) => [...taskKeys.details(), id] as const,
    stats: (projectId?: string) => [...taskKeys.all, 'stats', { projectId }] as const,
};

// Hooks

export const useTasks = (options: { projectId?: string } = {}) => {
    return useQuery({
        queryKey: taskKeys.list(options.projectId),
        queryFn: () => options.projectId
            ? TaskService.getTasksByProject(options.projectId)
            : TaskService.getAllTasks(),
    });
};

export const useTask = (id: string | undefined) => {
    return useQuery({
        queryKey: taskKeys.detail(id || ''),
        queryFn: async () => {
            if (!id) return null;
            const allTasks = await TaskService.getAllTasks();
            return allTasks.find(t => t.TaskID === id) || null;
        },
        enabled: !!id,
    });
};

export const useCreateTask = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (task: Task) => Promise.resolve(TaskService.saveTask(task)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
            queryClient.invalidateQueries({ queryKey: taskKeys.stats() });
        },
    });
};

export const useUpdateTask = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (task: Task) => Promise.resolve(TaskService.saveTask(task)),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: taskKeys.detail(data.TaskID) });
            queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
            queryClient.invalidateQueries({ queryKey: taskKeys.stats() });
        },
    });
};

export const useDeleteTask = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => Promise.resolve(TaskService.deleteTask(id)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
            queryClient.invalidateQueries({ queryKey: taskKeys.stats() });
        },
    });
};

// Helper for statistics
export const useTaskStatistics = (projectId?: string) => {
    return useQuery({
        queryKey: taskKeys.stats(projectId),
        queryFn: async () => {
            const tasks = await (projectId
                ? TaskService.getTasksByProject(projectId)
                : TaskService.getAllTasks());

            const byStatus = {
                [TaskStatus.Todo]: 0,
                [TaskStatus.InProgress]: 0,
                [TaskStatus.Review]: 0,
                [TaskStatus.Done]: 0,
            };

            let overdue = 0;
            const today = new Date().toISOString().split('T')[0];

            tasks.forEach(t => {
                const status = t.Status as TaskStatus; // Ensure type safety
                if (byStatus[status] !== undefined) {
                    byStatus[status]++;
                }
                if (t.DueDate < today && t.Status !== TaskStatus.Done) {
                    overdue++;
                }
            });

            return {
                total: tasks.length,
                byStatus,
                overdue,
            };
        }
    });
};
