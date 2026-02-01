import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../../hooks/useProjects';
import { ProjectStatus, ProjectGroup } from '../../types';
import { ProjectCard } from './ProjectCard';
import { ProjectStats } from './ProjectStats';
import { Search, Plus, LayoutGrid, List as ListIcon, Filter, Layers } from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';
import { CreateProjectModal } from './components/CreateProjectModal';
import { generateProjectTasks } from '../../utils/projectTemplateGenerator';
import { TaskService } from '../../services/TaskService';
import ProjectService from '../../services/ProjectService';
import { Project } from '../../types';

const ProjectList: React.FC = () => {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default open for large screens

    // Data Fetching
    const { projects = [], isLoading, refetch } = useProjects();

    // Local Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [selectedGroup, setSelectedGroup] = useState<string>('all');
    const [selectedType, setSelectedType] = useState<string>('all');

    // Filter Logic
    const filteredProjects = useMemo(() => {
        return projects.filter(p => {
            const matchesSearch = p.ProjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.ProjectID.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = selectedStatus === 'all' || p.Status.toString() === selectedStatus;
            const matchesGroup = selectedGroup === 'all' || p.GroupCode === selectedGroup;
            const matchesType = selectedType === 'all' || p.InvestmentType.toString() === selectedType;

            return matchesSearch && matchesStatus && matchesGroup && matchesType;
        });
    }, [projects, searchQuery, selectedStatus, selectedGroup, selectedType]);

    // Create Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleCreateProject = () => {
        setIsModalOpen(true);
    };

    const handleSaveProject = async (data: Partial<Project> & { StartDate: Date }) => {
        try {
            // 1. Create Project
            const newProject = await ProjectService.create(data);

            // 2. Generate Schedule based on Decree 175
            // Ensure GroupCode is valid, default to C if missing
            const group = data.GroupCode || ProjectGroup.C;
            const tasks = generateProjectTasks(newProject.ProjectID, group, data.StartDate);

            // 3. Save Tasks
            await TaskService.saveTasks(tasks);

            // 4. Notify and Navigate
            refetch(); // Refresh list to update stats/list
            setIsModalOpen(false);

            // Navigate to the new project detail immediately
            navigate(`/projects/${newProject.ProjectID}`);
        } catch (error) {
            console.error('Error creating project:', error);
            alert('Có lỗi xảy ra khi tạo dự án. Vui lòng thử lại.');
        }
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300 pb-20">
            {/* 1. STATS HEADER */}
            <ProjectStats projects={projects} />

            <div className="flex flex-col lg:flex-row gap-6 items-start">
                {/* 2. SIDEBAR FILTER (Premium Style) */}
                <div className={`w-full lg:w-72 shrink-0 ${isSidebarOpen ? 'block' : 'hidden lg:block'}`}>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-6">
                        <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <Filter className="w-4 h-4 text-blue-600" /> Bộ lọc dự án
                            </h3>
                            <button onClick={() => {
                                setSelectedStatus('all'); setSelectedGroup('all'); setSelectedType('all'); setSearchQuery('');
                            }} className="text-xs text-red-500 hover:underline">Xóa lọc</button>
                        </div>

                        <div className="p-4 space-y-6">
                            {/* Status Filter */}
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Trạng thái</label>
                                <div className="space-y-1">
                                    {[
                                        { val: 'all', label: 'Tất cả', color: 'bg-gray-400' },
                                        { val: ProjectStatus.Preparation.toString(), label: 'Chuẩn bị đầu tư', color: 'bg-gradient-to-r from-amber-400 to-orange-500' },
                                        { val: ProjectStatus.Execution.toString(), label: 'Thực hiện đầu tư', color: 'bg-gradient-to-r from-blue-500 to-blue-600' },
                                        { val: ProjectStatus.Finished.toString(), label: 'Hoàn thành', color: 'bg-gradient-to-r from-emerald-500 to-emerald-600' },
                                    ].map(opt => (
                                        <label
                                            key={opt.val}
                                            className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all duration-200 ${selectedStatus === opt.val
                                                    ? 'bg-blue-50 ring-1 ring-blue-200'
                                                    : 'hover:bg-gray-50'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="status"
                                                checked={selectedStatus === opt.val}
                                                onChange={() => setSelectedStatus(opt.val)}
                                                className="sr-only"
                                            />
                                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${opt.color} ring-2 ring-white shadow-sm`}></span>
                                            <span className={`text-sm ${selectedStatus === opt.val ? 'font-bold text-gray-800' : 'text-gray-600 font-medium'}`}>{opt.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="w-full h-px bg-gray-100"></div>

                            {/* Group Filter */}
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Nhóm dự án</label>
                                <div className="space-y-1">
                                    {['all', ProjectGroup.A, ProjectGroup.B, ProjectGroup.C].map(g => (
                                        <button
                                            key={g}
                                            onClick={() => setSelectedGroup(g)}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex justify-between ${selectedGroup === g ? 'bg-blue-50 text-blue-700 font-bold shadow-sm' : 'text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            {g === 'all' ? 'Tất cả nhóm' : `Nhóm ${g}`}
                                            {selectedGroup === g && <Filter className="w-3 h-3" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. MAIN LIST AREA */}
                <div className="flex-1 w-full space-y-6">
                    {/* Toolbar */}
                    <div className="bg-white p-2 pr-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="relative w-full md:flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm dự án, mã, chủ đầu tư..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-transparent border-none rounded-xl focus:ring-0 text-sm font-medium"
                            />
                        </div>

                        <div className="flex items-center gap-3 shrink-0 px-2 pb-2 md:pb-0">
                            <div className="h-8 w-px bg-gray-100 hidden md:block"></div>

                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <ListIcon className="w-4 h-4" />
                                </button>
                            </div>

                            <button
                                onClick={handleCreateProject}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Thêm mới</span>
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="min-h-[400px]">
                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="bg-white h-72 rounded-2xl p-4 space-y-4 border border-gray-100">
                                        <Skeleton className="h-40 w-full rounded-xl" />
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-4 w-1/2" />
                                    </div>
                                ))}
                            </div>
                        ) : filteredProjects.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 border-dashed">
                                <div className="bg-gray-50 p-6 rounded-full mb-4">
                                    <Layers className="w-10 h-10 text-gray-300" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800">Không tìm thấy dự án</h3>
                                <p className="text-gray-500 mt-2 max-w-sm text-center">Không có dự án nào phù hợp với bộ lọc hiện tại. Hãy thử thay đổi từ khóa hoặc bộ lọc.</p>
                                <button
                                    onClick={() => { setSearchQuery(''); setSelectedStatus('all'); }}
                                    className="mt-6 text-blue-600 font-bold hover:underline"
                                >
                                    Xóa tất cả bộ lọc
                                </button>
                            </div>
                        ) : (
                            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'flex flex-col gap-4'}>
                                {filteredProjects.map(project => (
                                    <ProjectCard
                                        key={project.ProjectID}
                                        project={project}
                                        onClick={() => navigate(`/projects/${project.ProjectID}`)}
                                        layout={viewMode}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Create Project Modal */}
            <CreateProjectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveProject}
            />
        </div>
    );
};

export default ProjectList;