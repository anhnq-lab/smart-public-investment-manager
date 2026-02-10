import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProjectService } from '@/services/ProjectService';
import { NationalGatewayService, SyncResult } from '@/services/NationalGatewayService';
import { Project, Employee, ProjectStage } from '@/types';
import { useTasks, useUpdateTask } from '@/hooks/useTasks';
import { useBiddingPackages } from '@/hooks/useBiddingPackages';
import { mockEmployees } from '@/mockData';
import { ProjectHeader } from './components/ProjectHeader';
import { ProjectInfoTab } from './components/tabs/ProjectInfoTab';
import { ProjectPlanTab } from './components/tabs/ProjectPlanTab';
const ProjectBimTab = React.lazy(() => import('./components/tabs/ProjectBimTab').then(m => ({ default: m.ProjectBimTab })));
import { ProjectPackagesTab } from './components/tabs/ProjectPackagesTab';
import { ProjectCapitalTab } from './components/tabs/ProjectCapitalTab';
import { ProjectDocumentsTab } from './components/tabs/ProjectDocumentsTab';
import { Info, CalendarCheck, Briefcase, FolderOpen, Layers, Landmark } from 'lucide-react';

// Error Boundary for BIM tab - catches runtime crashes from 3D libraries
class BimErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error: Error | null }
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('BIM Tab Error:', error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center h-96 gap-4 text-center p-8">
                    <div className="text-red-500 text-lg font-bold">⚠️ BIM Viewer Error</div>
                    <div className="text-gray-600 text-sm max-w-lg">
                        {this.state.error?.message || 'Unknown error'}
                    </div>
                    <pre className="text-xs bg-gray-100 p-4 rounded-lg max-w-2xl overflow-auto max-h-48 text-left text-gray-500">
                        {this.state.error?.stack}
                    </pre>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                        Thử lại
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

const ProjectDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();

    // State
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'info' | 'plan' | 'packages' | 'capital' | 'documents' | 'bim'>('info');

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

    // Get bidding packages for this project
    const { data: packages = [] } = useBiddingPackages(project?.ProjectID || '');

    // Get project members (filtered from mockEmployees by project.Members)
    const projectMembers = useMemo<Employee[]>(() => {
        if (!project?.Members) return mockEmployees.slice(0, 3); // Demo: show 3 employees if no Members
        return mockEmployees.filter(emp => project.Members?.includes(emp.EmployeeID));
    }, [project?.Members]);

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
            <div className="container mx-auto px-4 py-6">
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
                        { id: 'info', label: 'TỔNG QUAN', icon: Info },
                        { id: 'plan', label: 'KẾ HOẠCH', icon: CalendarCheck },
                        { id: 'packages', label: 'GÓI THẦU', icon: Briefcase },
                        { id: 'capital', label: 'VỐN & GIẢI NGÂN', icon: Landmark },
                        { id: 'documents', label: 'HỒ SƠ', icon: FolderOpen },
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
                            projectMembers={projectMembers}
                            projectPackages={packages}
                            isSyncing={isSyncing}
                            syncResult={syncResult}
                            isGeneratingReport={isGeneratingReport}
                            onGenerateReport={handleGenerateReport}
                            onViewMember={(employeeId) => {
                                // TODO: Navigate to Personnel module
                                console.log('View member:', employeeId);
                            }}
                            onViewPackage={(packageId) => {
                                // Navigate to Packages tab
                                setActiveTab('packages');
                            }}
                            onStageChange={(newStage, entry) => {
                                // Update project stage
                                setProject(prev => prev ? {
                                    ...prev,
                                    Stage: newStage,
                                    StageHistory: [...(prev.StageHistory || []), entry]
                                } : null);
                                console.log('Stage changed to:', newStage, entry);
                                // TODO: Persist to API
                            }}
                            onHistoryUpdate={(history) => {
                                setProject(prev => prev ? { ...prev, StageHistory: history } : null);
                            }}
                            canEditLifecycle={true}
                        />
                    )}
                    {activeTab === 'plan' && (
                        <ProjectPlanTab
                            tasks={tasks}
                            projectID={project.ProjectID}
                            onSaveTask={(t) => saveTask(t)}
                            groupCode={project.GroupCode}
                            isODA={project.IsODA}
                        />
                    )}
                    {activeTab === 'packages' && (
                        <ProjectPackagesTab projectID={project.ProjectID} project={project} />
                    )}
                    {activeTab === 'capital' && (
                        <ProjectCapitalTab projectID={project.ProjectID} />
                    )}
                    {activeTab === 'documents' && (
                        <ProjectDocumentsTab
                            projectID={project.ProjectID}
                            projectStage={project.Stage || ProjectStage.Execution}
                        />
                    )}
                    {activeTab === 'bim' && (
                        <BimErrorBoundary>
                            <Suspense fallback={<div className="flex items-center justify-center h-96 text-blue-500">Đang tải BIM Viewer...</div>}>
                                <ProjectBimTab projectID={project.ProjectID} />
                            </Suspense>
                        </BimErrorBoundary>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectDetail;
