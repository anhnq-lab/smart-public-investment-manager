import { Task, TaskStatus, TaskPriority, Project } from '../types';
import { mockTasks, mockProjects, loadTasksFromStorage, saveTasksToDB } from '../mockData';

export class TaskService {
    private static TASKS_STORAGE_KEY = 'app_tasks';

    static getAllTasks(): Task[] {
        return loadTasksFromStorage(); // Uses existing mockData logic which checks localStorage
    }

    static getTasksByProject(projectId: string): Task[] {
        return this.getAllTasks().filter(t => t.ProjectID === projectId);
    }

    static getTasksByProjectAndStage(projectId: string, stage: string): Task[] {
        return this.getAllTasks().filter(t => t.ProjectID === projectId && t.TimelineStep === stage);
    }

    static saveTask(task: Task): Task {
        const tasks = this.getAllTasks();
        const existingIndex = tasks.findIndex(t => t.TaskID === task.TaskID);

        let updatedTasks;
        if (existingIndex >= 0) {
            updatedTasks = tasks.map(t => t.TaskID === task.TaskID ? task : t);
        } else {
            updatedTasks = [task, ...tasks];
        }

        saveTasksToDB(updatedTasks);
        this.updateProjectProgress(task.ProjectID, updatedTasks);
        return task;
    }

    static saveTasks(newTasks: Task[]): void {
        const tasks = this.getAllTasks();
        // Remove old versions of these tasks if they exist (based on ID), then add new ones
        const newIds = new Set(newTasks.map(t => t.TaskID));
        const filteredTasks = tasks.filter(t => !newIds.has(t.TaskID));

        const updatedTasks = [...newTasks, ...filteredTasks];
        saveTasksToDB(updatedTasks);
    }

    static deleteTask(taskId: string): void {
        const tasks = this.getAllTasks();
        const task = tasks.find(t => t.TaskID === taskId);
        if (!task) return;

        const updatedTasks = tasks.filter(t => t.TaskID !== taskId);
        saveTasksToDB(updatedTasks);
        this.updateProjectProgress(task.ProjectID, updatedTasks);
    }

    // Logic to update project progress (if any) based on completed tasks
    // For now, simpler logic: verify all tasks in a "stage" are done?
    // Or just simple count? Let's assume progress is manual for now but we trigger an event?
    // In this "mock" world, we might want to update the project object in localStorage too.
    private static updateProjectProgress(projectId: string, allTasks: Task[]) {
        // Implementation idea: 
        // 1. Get all tasks for this project
        // 2. Calculate % compeleted
        // 3. Update Project.TotalProgress (if this field existed)
        // For now, we will just ensure the UI gets fresh data by managing state where used.
    }
}
