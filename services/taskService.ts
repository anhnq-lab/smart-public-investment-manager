import { Task } from '../types';
import { mockTasks } from '../mockData';

const STORAGE_KEY = 'cic_tasks_data';

// Helper to load
const loadTasks = (): Task[] => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        // Fallback to mockTasks if empty to provide initial data demo
        if (!data) return mockTasks;

        const tasks = JSON.parse(data);
        return Array.isArray(tasks) ? tasks : mockTasks;
    } catch {
        return mockTasks;
    }
};

const saveToStorage = (tasks: Task[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
};

export const TaskService = {
    getAllTasks: (): Task[] => {
        return loadTasks();
    },

    getTasksByProject: (projectId: string): Promise<Task[]> => {
        return new Promise((resolve) => {
            const allTasks = loadTasks();
            const projectTasks = allTasks.filter(t => t.ProjectID === projectId);
            resolve(projectTasks);
        });
    },

    saveTasks: (tasks: Task[]): Promise<boolean> => {
        return new Promise((resolve) => {
            let allTasks = loadTasks();

            const newIds = new Set(tasks.map(t => t.TaskID));
            // Remove conflicts tasks from existing list (update logic)
            allTasks = allTasks.filter(t => !newIds.has(t.TaskID));

            // Append new/updated tasks
            allTasks = [...allTasks, ...tasks];

            saveToStorage(allTasks);
            resolve(true);
        });
    },

    saveTask: (task: Task): Promise<Task> => {
        return new Promise((resolve) => {
            let allTasks = loadTasks();
            const index = allTasks.findIndex(t => t.TaskID === task.TaskID);

            if (index !== -1) {
                allTasks[index] = task;
            } else {
                allTasks.push(task);
            }

            saveToStorage(allTasks);
            resolve(task);
        });
    },

    updateTask: (task: Task): Promise<boolean> => {
        return TaskService.saveTask(task).then(() => true);
    },

    deleteTask: (id: string): Promise<boolean> => {
        return new Promise((resolve) => {
            let allTasks = loadTasks();
            const initialLen = allTasks.length;
            allTasks = allTasks.filter(t => t.TaskID !== id);

            if (allTasks.length !== initialLen) {
                saveToStorage(allTasks);
            }
            resolve(true);
        });
    }
};
