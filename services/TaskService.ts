// Task Service - Supabase CRUD operations
import { supabase } from '../lib/supabase';
import { dbToTask, taskToDb } from '../lib/dbMappers';
import { Task } from '../types';

export const TaskService = {
    getAllTasks: async (): Promise<Task[]> => {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw new Error(`Failed to fetch tasks: ${error.message}`);
        return (data || []).map(dbToTask);
    },

    getTasksByProject: async (projectId: string): Promise<Task[]> => {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });

        if (error) throw new Error(`Failed to fetch tasks: ${error.message}`);
        return (data || []).map(dbToTask);
    },

    saveTasks: async (tasks: Task[]): Promise<boolean> => {
        // Upsert all tasks
        const rows = tasks.map(t => taskToDb(t));

        const { error } = await supabase
            .from('tasks')
            .upsert(rows, { onConflict: 'task_id' });

        if (error) throw new Error(`Failed to save tasks: ${error.message}`);
        return true;
    },

    saveTask: async (task: Task): Promise<Task> => {
        const today = new Date().toISOString().split('T')[0];

        // Auto-set ActualStartDate when task first starts
        const progress = task.ProgressPercent ?? 0;
        if (progress > 0 && !task.ActualStartDate) {
            task.ActualStartDate = today;
        }

        // Auto-set ActualEndDate when progress reaches 100%
        if (progress >= 100) {
            if (!task.ActualEndDate) task.ActualEndDate = today;
            if (task.Status !== 'Done') {
                task.Status = 'Done' as any;
            }
        } else if (task.ActualEndDate && progress < 100) {
            // Clear ActualEndDate if progress drops below 100%
            task.ActualEndDate = '';
        }

        const row = taskToDb(task);

        const { data, error } = await supabase
            .from('tasks')
            .upsert(row, { onConflict: 'task_id' })
            .select()
            .single();

        if (error) throw new Error(`Failed to save task: ${error.message}`);
        return dbToTask(data);
    },

    updateTask: async (task: Task): Promise<boolean> => {
        await TaskService.saveTask(task);
        return true;
    },

    deleteTask: async (id: string): Promise<boolean> => {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('task_id', id);

        if (error) throw new Error(`Failed to delete task: ${error.message}`);
        return true;
    }
};
