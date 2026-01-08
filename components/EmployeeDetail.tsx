import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Employee, Project, Task, TaskStatus } from '../types';
import { mockEmployees, mockProjects, mockAuditLogs } from '../mockData';
import { TaskService } from '../services/taskService';
import { ArrowLeft, Mail, Phone, MapPin, Briefcase, Calendar, Shield, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

const EmployeeDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);

    useEffect(() => {
        const emp = mockEmployees.find(e => e.EmployeeID === id);
        if (emp) {
            setEmployee(emp);
            // Fetch Tasks
            const allTasks = TaskService.getAllTasks();
            const empTasks = allTasks.filter(t => t.AssigneeID === id);
            setTasks(empTasks);

            // Fetch Logs
            const logs = mockAuditLogs.filter(l => l.ChangedBy === emp.Username || l.TargetID === id);
            setAuditLogs(logs);
        }
    }, [id]);

    if (!employee) return <div className="p-8 text-center text-gray-500">Không tìm thấy nhân viên.</div>;

    // Derived Data
    const activeTasks = tasks.filter(t => t.Status !== TaskStatus.Done).length;
    const completedTasks = tasks.filter(t => t.Status === TaskStatus.Done).length;

    // Participating Projects (Unique projects from tasks)
    const projectIds = Array.from(new Set(tasks.map(t => t.ProjectID)));
    const projects = mockProjects.filter(p => projectIds.includes(p.ProjectID));

    return (
        <div className="bg-[#F8FAFC] min-h-screen p-8 animate-in fade-in duration-300">
            {/* Header */}
            <div className="max-w-6xl mx-auto mb-8">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors mb-4">
                    <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
                </button>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row gap-8 items-start">
                    <img src={employee.AvatarUrl} alt={employee.FullName} className="w-32 h-32 rounded-full border-4 border-blue-50 object-cover shadow-inner" />

                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl font-black text-gray-800 mb-2">{employee.FullName}</h1>
                                <p className="text-gray-500 font-medium text-lg flex items-center gap-2">
                                    <Briefcase className="w-5 h-5 text-gray-400" />
                                    {employee.Position} • {employee.Department}
                                </p>
                            </div>
                            <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${employee.Status === 1 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-100 text-gray-500'}`}>
                                {employee.Status === 1 ? 'Đang làm việc' : 'Đã nghỉ việc'}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                            <div className="flex items-center gap-3 text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <Mail className="w-5 h-5 text-blue-500" />
                                <span className="font-medium">{employee.Email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <Phone className="w-5 h-5 text-blue-500" />
                                <span className="font-medium">{employee.Phone}</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <Calendar className="w-5 h-5 text-blue-500" />
                                <span className="font-medium">Ngày vào làm: {employee.JoinDate}</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <Shield className="w-5 h-5 text-purple-500" />
                                <span className="font-medium">Vai trò hệ thống: {employee.Role}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Col: WORK STATS */}
                <div className="space-y-8">
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-blue-600" /> Thống kê công việc
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl">
                                <span className="font-medium text-blue-800">Đang thực hiện</span>
                                <span className="text-2xl font-black text-blue-600">{activeTasks}</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl">
                                <span className="font-medium text-emerald-800">Đã hoàn thành</span>
                                <span className="text-2xl font-black text-emerald-600">{completedTasks}</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                <span className="font-medium text-gray-600">Tổng cộng</span>
                                <span className="text-2xl font-black text-gray-800">{tasks.length}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-indigo-600" /> Dự án tham gia ({projects.length})
                        </h3>
                        <div className="space-y-3">
                            {projects.map(p => (
                                <div key={p.ProjectID} onClick={() => navigate(`/projects/${p.ProjectID}`)} className="p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 cursor-pointer transition-colors group">
                                    <h4 className="font-bold text-gray-800 text-sm group-hover:text-blue-600 transition-colors line-clamp-2">{p.ProjectName}</h4>
                                    <p className="text-xs text-gray-400 mt-1">{p.ProjectID}</p>
                                </div>
                            ))}
                            {projects.length === 0 && <p className="text-gray-400 text-sm italic">Chưa tham gia dự án nào.</p>}
                        </div>
                    </div>
                </div>

                {/* Right Col: TASKS & HISTORY */}
                <div className="md:col-span-2 space-y-8">
                    {/* Tasks List */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-800">Danh sách công việc</h3>
                            <button onClick={() => navigate('/tasks')} className="text-sm text-blue-600 font-bold hover:underline">Xem tất cả</button>
                        </div>
                        <div className="space-y-4">
                            {tasks.slice(0, 5).map(task => (
                                <div key={task.TaskID} onClick={() => navigate(`/tasks/${task.TaskID}`)} className="flex items-start gap-4 p-4 rounded-2xl hover:bg-gray-50 cursor-pointer transition-colors border border-transparent hover:border-gray-100">
                                    <div className={`mt-1 w-3 h-3 rounded-full shrink-0 ${task.Status === TaskStatus.Done ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                                    <div className="flex-1">
                                        <h4 className={`font-bold text-gray-800 ${task.Status === TaskStatus.Done ? 'line-through text-gray-400' : ''}`}>{task.Title}</h4>
                                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                            <span className="bg-gray-100 px-2 py-1 rounded font-mono">{task.TaskID}</span>
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Hạn: {task.DueDate}</span>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${task.Status === TaskStatus.Done ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {task.Status}
                                    </span>
                                </div>
                            ))}
                            {tasks.length === 0 && <p className="text-gray-400 text-center py-8">Chưa có công việc nào được giao.</p>}
                        </div>
                    </div>

                    {/* Activity Log */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                        <h3 className="text-xl font-bold text-gray-800 mb-6">Nhật ký hoạt động</h3>
                        <div className="relative border-l-2 border-gray-100 ml-3 space-y-8">
                            {auditLogs.slice(0, 10).map((log, idx) => (
                                <div key={idx} className="relative pl-8">
                                    <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 border-white bg-gray-300"></div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">{log.Action} - {log.TargetEntity}</p>
                                        <p className="text-sm text-gray-600 mt-1">{log.Details}</p>
                                        <p className="text-xs text-gray-400 mt-1 font-mono">{log.Timestamp}</p>
                                    </div>
                                </div>
                            ))}
                            {auditLogs.length === 0 && <p className="text-gray-400 italic pl-8">Chưa có hoạt động nào được ghi nhận.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeDetail;
