import React from 'react';
import { Task } from '@/types';
import { Layers } from 'lucide-react';
import { ProjectGanttChart } from '../ProjectGanttChart';

interface ProjectTimelineTabProps {
    tasks: Task[];
}

export const ProjectTimelineTab: React.FC<ProjectTimelineTabProps> = ({ tasks }) => {
    return (
        <div className="animate-in slide-in-from-bottom-2 duration-500 space-y-8 max-w-6xl mx-auto py-4">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h4 className="font-bold text-gray-700 text-xs uppercase flex items-center gap-2">
                        <Layers className="w-4 h-4" /> Biểu đồ Gantt tổng thể
                    </h4>
                    <button className="text-[10px] text-blue-600 hover:underline font-medium">Mở rộng</button>
                </div>
                <div className="p-4">
                    <ProjectGanttChart tasks={tasks} />
                </div>
            </div>

            {/* Future timeline list/milestones could go here */}
        </div>
    );
};
