import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProjectService } from '@/services/ProjectService';
import { NationalGatewayService, SyncResult } from '@/services/NationalGatewayService';
import { Project } from '@/types';
import { useTasks, useUpdateTask } from '@/hooks/useTasks';
import { ProjectHeader } from './components/ProjectHeader';
import { ProjectInfoTab } from './components/tabs/ProjectInfoTab';
import { ProjectPlanTab } from './components/tabs/ProjectPlanTab';
import { ProjectBimTab } from './components/tabs/ProjectBimTab';
import { ProjectPackagesTab } from './components/tabs/ProjectPackagesTab';
import { ProjectCapitalTab } from './components/tabs/ProjectCapitalTab';
import { Info, CalendarCheck, Briefcase, Mail, FolderOpen, Layers, Landmark } from 'lucide-react';

const ProjectDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();

    // State
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'info' | 'overview' | 'packages' | 'legal' | 'plan' | 'cde' | 'bim' | 'capital'>('info');

    // Module 1: National Gateway State
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);

    // Initial Data Fetch
    useEffect(() => {
        const fetchProject = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const data = await ProjectService.getById(id);
                setProject(data || null);
            } catch (error) {
                console.error("Failed to fetch project", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProject();
    }, [id]);

    // Derived Data
    const { data: tasks = [] } = useTasks({ projectId: project?.ProjectID });
    const { mutate: saveTask } = useUpdateTask();

    // Sync Handler
    const handleSync = async () => {
        if (!project) return;
        setIsSyncing(true);
        try {
            const result = await NationalGatewayService.syncProject(project);
            setSyncResult(result);
            if (result.success) alert(result.message);
            else alert(`Lỗi: ${result.message}`);
        } catch (error) {
            console.error(error);
            alert('Có lỗi xảy ra khi đồng bộ.');
        } finally {
            setIsSyncing(false);
        }
    };

    // Report Handler
    const handleGenerateReport = async (type: 'Monitoring' | 'Settlement') => {
        if (!project) return;
        setIsGeneratingReport(true);
        try {
            const report = type === 'Monitoring'
                ? await NationalGatewayService.generateMonitoringReport(project.ProjectID)
                : await NationalGatewayService.generateSettlementReport(project.ProjectID);

            // Mock Download
            const link = document.createElement('a');
            link.href = report.url;
            link.download = `${type}_Report_${project.ProjectID}.pdf`;
            document.body.appendChild(link);
            // link.click(); // Prevent actual download in demo
            document.body.removeChild(link);
            alert(`Đã trích xuất báo cáo: ${report.id} thành công!`);
        } catch (error) {
            console.error(error);
        } finally {
            setIsGeneratingReport(false);
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center text-blue-600">Loading Project...</div>;
    if (!project) return <div className="flex h-screen items-center justify-center font-bold text-gray-500">Dự án không tồn tại.</div>;

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <div className="container mx-auto px-4 py-6 max-w-7xl">
                {/* 1. Header */}
                <ProjectHeader
                    project={project}
                    onSync={handleSync}
                    isSyncing={isSyncing}
                    syncResult={syncResult}
                />

                {/* 2. Tab Navigation */}
                <div className="border-b border-gray-200 flex gap-8 mt-6 overflow-x-auto">
                    {[
                        { id: 'info', label: 'THÔNG TIN', icon: Info },
                        { id: 'plan', label: 'KẾ HOẠCH', icon: CalendarCheck },
                        { id: 'packages', label: 'GÓI THẦU', icon: Briefcase },
                        { id: 'capital', label: 'VỐN & GIẢI NGÂN', icon: Landmark },
                        { id: 'legal', label: 'VĂN BẢN', icon: Mail },
                        { id: 'cde', label: 'HỒ SƠ CDE', icon: FolderOpen },
                        { id: 'bim', label: 'MÔ HÌNH BIM', icon: Layers },
                    ].map(t => (
                        <button
                            key={t.id} onClick={() => setActiveTab(t.id as any)}
                            className={`py-4 px-1 text-xs font-black border-b-2 transition-all flex items-center gap-2 tracking-widest whitespace-nowrap ${activeTab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                        >
                            <t.icon className="w-4 h-4" />
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* 3. Tab Content */}
                <div className="mt-6 min-h-[500px]">
                    {activeTab === 'info' && (
                        <ProjectInfoTab
                            project={project}
                            tasks={tasks}
                            isSyncing={isSyncing}
                            syncResult={syncResult}
                            isGeneratingReport={isGeneratingReport}
                            onGenerateReport={handleGenerateReport}
                        />
                    )}
                    {activeTab === 'plan' && (
                        <ProjectPlanTab
                            tasks={tasks}
                            projectID={project.ProjectID}
                            onSaveTask={(t) => saveTask(t)}
                        />
                    )}
                    {activeTab === 'packages' && (
                        <ProjectPackagesTab projectID={project.ProjectID} />
                    )}
                    {activeTab === 'capital' && (
                        <ProjectCapitalTab projectID={project.ProjectID} />
                    )}
                    {activeTab === 'bim' && (
                        <ProjectBimTab projectID={project.ProjectID} />
                    )}
                    {activeTab !== 'info' && activeTab !== 'plan' && activeTab !== 'bim' && activeTab !== 'packages' && activeTab !== 'capital' && (
                        <div className="bg-white p-10 rounded-2xl border border-dashed border-gray-200 text-center text-gray-400">
                            <div className="mb-2"><Layers className="w-10 h-10 mx-auto text-gray-200" /></div>
                            <h3 className="font-bold text-gray-600">Tính năng đang cập nhật</h3>
                            <p className="text-sm">Tab {activeTab.toUpperCase()} sẽ được hoàn thiện trong các bước tiếp theo.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectDetail;
