import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User, Briefcase, CheckSquare, FileText, AlertTriangle,
    Clock, ArrowRight, Building2, Calendar, TrendingUp,
    Star, BookOpen, Bell, ChevronRight, Target
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { mockProjects, mockTasks, mockDocuments, mockContracts, formatCurrency } from '../mockData';
import { ProjectStatus, TaskStatus, TaskPriority } from '../types';

const PersonalDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    // Get projects where current user is a member
    const myProjects = useMemo(() => {
        if (!currentUser) return [];
        return mockProjects.filter(p =>
            p.Members?.includes(currentUser.EmployeeID)
        );
    }, [currentUser]);

    // Get tasks assigned to current user
    const myTasks = useMemo(() => {
        if (!currentUser) return [];
        return mockTasks.filter(t => t.AssigneeID === currentUser.EmployeeID);
    }, [currentUser]);

    // Tasks by status
    const taskStats = useMemo(() => {
        const inProgress = myTasks.filter(t => t.Status === TaskStatus.InProgress).length;
        const todo = myTasks.filter(t => t.Status === TaskStatus.Todo).length;
        const done = myTasks.filter(t => t.Status === TaskStatus.Done).length;
        const overdue = myTasks.filter(t => {
            const due = new Date(t.DueDate);
            return t.Status !== TaskStatus.Done && due < new Date();
        }).length;
        return { inProgress, todo, done, overdue, total: myTasks.length };
    }, [myTasks]);

    // Upcoming deadlines (next 7 days)
    const upcomingDeadlines = useMemo(() => {
        const now = new Date();
        const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        return myTasks
            .filter(t => {
                const due = new Date(t.DueDate);
                return t.Status !== TaskStatus.Done && due >= now && due <= next7Days;
            })
            .sort((a, b) => new Date(a.DueDate).getTime() - new Date(b.DueDate).getTime())
            .slice(0, 5);
    }, [myTasks]);

    // Recent documents (from my projects)
    const myDocuments = useMemo(() => {
        const projectIds = myProjects.map(p => p.ProjectID);
        return mockDocuments
            .filter(d => projectIds.includes(d.ProjectID))
            .slice(0, 5);
    }, [myProjects]);

    // Total investment of my projects
    const totalInvestment = myProjects.reduce((sum, p) => sum + p.TotalInvestment, 0);

    // Priority colors
    const priorityColors: Record<string, string> = {
        [TaskPriority.Urgent]: 'bg-red-100 text-red-700 border-red-200',
        [TaskPriority.High]: 'bg-orange-100 text-orange-700 border-orange-200',
        [TaskPriority.Medium]: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        [TaskPriority.Low]: 'bg-green-100 text-green-700 border-green-200',
    };

    const daysUntil = (dateStr: string) => {
        const diff = Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        if (diff === 0) return 'Hôm nay';
        if (diff === 1) return 'Ngày mai';
        return `${diff} ngày`;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Welcome Header */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 text-white relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3"></div>
                <div className="absolute right-20 bottom-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2"></div>

                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur">
                            {currentUser?.AvatarUrl ? (
                                <img src={currentUser.AvatarUrl} alt="" className="w-full h-full object-cover rounded-2xl" />
                            ) : (
                                <User className="w-8 h-8 text-white" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Xin chào, {currentUser?.FullName || 'Khách'}!</h1>
                            <p className="text-blue-100 mt-1">{currentUser?.Position} - {currentUser?.Department}</p>
                        </div>
                    </div>
                    <div className="text-right hidden md:block">
                        <p className="text-sm text-blue-200">Hôm nay</p>
                        <p className="text-xl font-bold">{new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Dự án phụ trách</p>
                            <p className="text-3xl font-black text-gray-900 mt-1">{myProjects.length}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Công việc đang làm</p>
                            <p className="text-3xl font-black text-blue-600 mt-1">{taskStats.inProgress}</p>
                        </div>
                        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                            <Target className="w-6 h-6 text-indigo-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Chờ xử lý</p>
                            <p className="text-3xl font-black text-amber-600 mt-1">{taskStats.todo}</p>
                        </div>
                        <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                            <Clock className="w-6 h-6 text-amber-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Quá hạn</p>
                            <p className={`text-3xl font-black mt-1 ${taskStats.overdue > 0 ? 'text-red-600' : 'text-gray-400'}`}>{taskStats.overdue}</p>
                        </div>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${taskStats.overdue > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                            <AlertTriangle className={`w-6 h-6 ${taskStats.overdue > 0 ? 'text-red-600' : 'text-gray-400'}`} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* My Projects */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-blue-600" />
                            <h3 className="font-bold text-gray-800">Dự án của tôi</h3>
                        </div>
                        <button
                            onClick={() => navigate('/projects')}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                            Xem tất cả <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>

                    <div className="divide-y divide-gray-50">
                        {myProjects.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">
                                <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p>Bạn chưa được phân công dự án nào</p>
                            </div>
                        ) : (
                            myProjects.slice(0, 4).map(project => (
                                <div
                                    key={project.ProjectID}
                                    onClick={() => navigate(`/projects/${project.ProjectID}`)}
                                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors flex items-center gap-4"
                                >
                                    <div className={`w-2 h-12 rounded-full ${project.Status === ProjectStatus.Execution ? 'bg-blue-500' :
                                        project.Status === ProjectStatus.Finished ? 'bg-emerald-500' : 'bg-gray-300'
                                        }`}></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-800 truncate">{project.ProjectName}</p>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                            <span>Nhóm {project.GroupCode}</span>
                                            <span>•</span>
                                            <span>{formatCurrency(project.TotalInvestment)}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 rounded-full transition-all"
                                                    style={{ width: `${project.Progress || 0}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs font-bold text-gray-600">{project.Progress || 0}%</span>
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${project.Status === ProjectStatus.Execution ? 'bg-blue-100 text-blue-700' :
                                            project.Status === ProjectStatus.Finished ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {project.Status === ProjectStatus.Execution ? 'Đang thực hiện' :
                                                project.Status === ProjectStatus.Finished ? 'Hoàn thành' : 'Chuẩn bị'}
                                        </span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-300" />
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Upcoming Deadlines */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-amber-600" />
                            <h3 className="font-bold text-gray-800">Deadline sắp tới</h3>
                        </div>
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">7 ngày</span>
                    </div>

                    <div className="divide-y divide-gray-50">
                        {upcomingDeadlines.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">
                                <CheckSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p>Không có deadline trong 7 ngày tới</p>
                            </div>
                        ) : (
                            upcomingDeadlines.map(task => (
                                <div
                                    key={task.TaskID}
                                    onClick={() => navigate(`/tasks/${task.TaskID}`)}
                                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-800 text-sm truncate">{task.Title}</p>
                                            <p className="text-xs text-gray-400 mt-1 truncate">{task.ProjectID}</p>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded border shrink-0 ${priorityColors[task.Priority]}`}>
                                            {daysUntil(task.DueDate)}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* My Tasks */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CheckSquare className="w-5 h-5 text-indigo-600" />
                            <h3 className="font-bold text-gray-800">Công việc đang thực hiện</h3>
                        </div>
                        <button
                            onClick={() => navigate('/tasks')}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                        >
                            Xem tất cả <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>

                    <div className="divide-y divide-gray-50 max-h-[300px] overflow-y-auto">
                        {myTasks.filter(t => t.Status === TaskStatus.InProgress).slice(0, 5).map(task => (
                            <div
                                key={task.TaskID}
                                onClick={() => navigate(`/tasks/${task.TaskID}`)}
                                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors flex items-center gap-3"
                            >
                                <div className={`w-2 h-2 rounded-full ${task.Priority === TaskPriority.Urgent ? 'bg-red-500' :
                                        task.Priority === TaskPriority.High ? 'bg-orange-500' :
                                            task.Priority === TaskPriority.Medium ? 'bg-yellow-500' : 'bg-green-500'
                                    }`}></div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-800 text-sm truncate">{task.Title}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{task.DueDate}</p>
                                </div>
                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                    Đang làm
                                </span>
                            </div>
                        ))}

                        {myTasks.filter(t => t.Status === TaskStatus.InProgress).length === 0 && (
                            <div className="p-8 text-center text-gray-400">
                                <Target className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                                <p className="text-sm">Không có công việc đang thực hiện</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* My Documents */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-purple-600" />
                            <h3 className="font-bold text-gray-800">Tài liệu liên quan</h3>
                        </div>
                        <button
                            onClick={() => navigate('/documents')}
                            className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
                        >
                            Xem tất cả <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>

                    <div className="divide-y divide-gray-50 max-h-[300px] overflow-y-auto">
                        {myDocuments.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">
                                <FileText className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                                <p className="text-sm">Chưa có tài liệu nào</p>
                            </div>
                        ) : (
                            myDocuments.map(doc => (
                                <div
                                    key={doc.DocumentID}
                                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors flex items-center gap-3"
                                >
                                    <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center shrink-0">
                                        <FileText className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-800 text-sm truncate">{doc.Name}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{doc.ProjectID} • v{doc.CurrentVersion}</p>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded ${doc.SignatureStatus === 'Signed' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {doc.SignatureStatus === 'Signed' ? 'Đã ký' : 'Chưa ký'}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Summary Footer */}
            <div className="bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-100 p-6">
                <div className="flex flex-wrap items-center justify-between gap-6">
                    <div className="flex items-center gap-8">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase">Tổng mức đầu tư phụ trách</p>
                            <p className="text-xl font-black text-gray-900 mt-1">{formatCurrency(totalInvestment)}</p>
                        </div>
                        <div className="h-10 w-px bg-gray-200"></div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase">Hoàn thành công việc</p>
                            <p className="text-xl font-black text-emerald-600 mt-1">
                                {taskStats.done}/{taskStats.total} <span className="text-sm font-normal text-gray-400">({taskStats.total > 0 ? Math.round(taskStats.done / taskStats.total * 100) : 0}%)</span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/tasks')}
                        className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center gap-2"
                    >
                        <TrendingUp className="w-4 h-4" />
                        Xem báo cáo chi tiết
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PersonalDashboard;
