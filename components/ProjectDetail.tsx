
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    mockProjects, mockBiddingPackages, formatFullCurrency, mockTasks, mockEmployees, saveTasksToDB,
    mockContracts, mockPayments
} from '../mockData';
import { ProjectStatus, ProjectGroup, Task, TaskStatus, TaskPriority, PackageStatus, PaymentStatus, InvestmentType } from '../types';
import { TaskService } from '../services/taskService';
import {
    ArrowLeft, Calendar, MapPin, DollarSign,
    Layers, Clock, FileText,
    Building2, AlertCircle, ListChecks,
    Scale, Landmark, ChevronDown, ChevronRight, PlayCircle, BookOpen, ShieldCheck, UserCheck, CheckCircle2, Loader2,
    Eye, PieChart, TrendingUp, AlertTriangle, Plus, Edit, Trash2, X, Save, Briefcase, Users, Activity, Info, HardHat, BarChart2, Wand2,
    FileInput, FileOutput, Mail, Phone, Map, Download, FileCheck, Wallet, Search, Filter, Printer, Maximize2, Minimize2, Upload, Image as ImageIcon, UserPlus,
    RefreshCw, FileBarChart, FolderOpen, Reply, Send, Paperclip // New icons
} from 'lucide-react';
import { NationalGatewayService, SyncResult } from '../services/NationalGatewayService';
import { CDEManager } from './CDEManager';
import { CapitalManager } from './CapitalManager';
import { BIMViewer } from './BIMViewer';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { generateTasksForProject } from '../services/taskTemplates';

// --- COMPONENT: FILE PREVIEW MODAL (ACTUAL + MOCK) ---
const FilePreviewModal: React.FC<{ file: any, onClose: () => void }> = ({ file, onClose }) => {
    const f = file as any;
    const fileName = (f.title || f.number || f.name || '').toLowerCase();
    const isPDF = fileName.endsWith('.pdf');
    const isImage = fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg');
    const isExcel = fileName.includes('vốn') || fileName.includes('dự toán') || fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    const isWord = fileName.includes('tờ trình') || fileName.includes('báo cáo') || fileName.endsWith('.docx') || fileName.endsWith('.doc');

    const blobUrl = useMemo(() => {
        if (f.isLocal && f.fileObj) {
            return URL.createObjectURL(f.fileObj);
        }
        return null;
    }, [f]);

    useEffect(() => {
        return () => {
            if (blobUrl) URL.revokeObjectURL(blobUrl);
        };
    }, [blobUrl]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#F1F5F9] w-full max-w-6xl h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-white/20">
                <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-gray-200">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                            {isImage ? <ImageIcon className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                        </div>
                        <div>
                            <h3 className="text-base font-black text-gray-800 tracking-tight">{f.title || f.number || f.name}</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{f.isLocal ? 'TÀI LIỆU VỪA TẢI LÊN' : f.code || 'TÀI LIỆU DỰ ÁN'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-xl transition-all" title="In tài liệu"><Printer className="w-5 h-5" /></button>
                        <button className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-xl transition-all" title="Tải xuống"><Download className="w-5 h-5" /></button>
                        <div className="w-px h-6 bg-gray-200 mx-2"></div>
                        <button onClick={onClose} className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-8 flex justify-center bg-[#525659]">
                    {f.isLocal && (isPDF || isImage) ? (
                        <div className="bg-white w-full h-full rounded-sm shadow-2xl overflow-hidden flex flex-col relative">
                            {isPDF ? (
                                <iframe
                                    src={`${blobUrl}#toolbar=0`}
                                    className="w-full h-full border-0"
                                    title="Local PDF Viewer"
                                />
                            ) : (
                                <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4">
                                    <img src={blobUrl!} className="max-w-full max-h-full object-contain shadow-lg" alt="Preview" />
                                </div>
                            )}
                        </div>
                    ) : isExcel ? (
                        <div className="bg-white w-full max-w-5xl shadow-2xl rounded-sm overflow-hidden flex flex-col h-fit">
                            <div className="bg-[#217346] text-white px-4 py-1 text-xs font-medium uppercase tracking-tighter">Microsoft Excel Viewer</div>
                            <div className="overflow-x-auto p-4">
                                <p className="text-gray-500 text-xs italic mb-4">Mô phỏng bảng tính cho file: {f.name || f.title}</p>
                                <table className="w-full border-collapse text-[12px]">
                                    <thead>
                                        <tr className="bg-[#E6E6E6] text-gray-600 text-center">
                                            <th className="border border-gray-300 w-10 py-1"></th>
                                            <th className="border border-gray-300 px-4 py-1 uppercase">A</th>
                                            <th className="border border-gray-300 px-4 py-1 uppercase">B</th>
                                            <th className="border border-gray-300 px-4 py-1 uppercase">C</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[1, 2, 3, 4, 5].map(row => (
                                            <tr key={row}>
                                                <td className="bg-[#E6E6E6] border border-gray-300 text-center py-1">{row}</td>
                                                <td className="border border-gray-200 px-3 py-1 bg-white"></td>
                                                <td className="border border-gray-200 px-3 py-1 bg-white"></td>
                                                <td className="border border-gray-200 px-3 py-1 bg-white"></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white w-full max-w-[800px] min-h-[1100px] shadow-2xl p-[60px] text-gray-800 font-serif leading-relaxed">
                            <div className="flex justify-between mb-12 italic text-sm">
                                <div>BAN QLDA ĐẦU TƯ CÔNG<br /><b>SỐ: {f.code || f.number || '00/BQL'}</b></div>
                                <div className="text-right">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br />Độc lập - Tự do - Hạnh phúc</div>
                            </div>
                            <div className="text-center mb-10">
                                <h2 className="text-xl font-bold uppercase tracking-widest">{f.title || f.name || 'VĂN BẢN TRÌNH DUYỆT'}</h2>
                            </div>
                            <div className="space-y-6 text-justify">
                                <p className="p-4 bg-blue-50 text-blue-800 rounded-xl text-sm border border-blue-100 font-sans italic">
                                    Hệ thống hiện tại hỗ trợ hiển thị nội dung thực cho file PDF và Hình ảnh (JPG, PNG).
                                    Đối với định dạng Office (.docx, .xlsx), vui lòng tải xuống để xem hoặc sử dụng trình xem chuyên dụng.
                                </p>
                                <p>Căn cứ tình hình triển khai thực tế của dự án, Ban Quản lý báo cáo nội dung sau:</p>
                                <div className="h-4 bg-gray-50 rounded w-full animate-pulse"></div>
                                <div className="h-4 bg-gray-50 rounded w-3/4 animate-pulse"></div>
                                <div className="mt-20 flex justify-between">
                                    <div className="text-center font-bold">NGƯỜI LẬP BIỂU</div>
                                    <div className="text-center font-bold">GIÁM ĐỐC BAN</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- BIỂU ĐỒ TIẾN ĐỘ DỰ ÁN (GANTT CHART) ---
const ProjectGanttChart: React.FC<{ tasks: Task[] }> = ({ tasks }) => {
    const taskDates = tasks.map(t => new Date(t.DueDate).getTime());
    if (tasks.length === 0) return (
        <div className="py-12 text-center text-gray-400 italic bg-gray-50 rounded-xl border border-dashed border-gray-200">
            Chưa có dữ liệu tiến độ để hiển thị biểu đồ.
        </div>
    );

    const minDate = new Date(Math.min(...taskDates));
    const maxDate = new Date(Math.max(...taskDates));

    minDate.setMonth(minDate.getMonth() - 2);
    maxDate.setMonth(maxDate.getMonth() + 3);

    const timeline: { label: string, full: string }[] = [];
    let current = new Date(minDate);
    while (current <= maxDate) {
        timeline.push({
            label: (current.getMonth() + 1).toString(),
            full: `Tháng ${current.getMonth() + 1} năm ${current.getFullYear()}`
        });
        current.setMonth(current.getMonth() + 1);
    }

    const totalDuration = maxDate.getTime() - minDate.getTime();

    return (
        <div className="overflow-x-auto pb-4">
            <div className="min-w-[1000px]">
                <div className="flex border-b border-gray-200 bg-gray-50/80 sticky top-0 z-10">
                    <div className="w-64 shrink-0 px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Hạng mục công việc</div>
                    <div className="flex-1 flex">
                        {timeline.map((m, idx) => (
                            <div
                                key={idx}
                                title={m.full}
                                className="flex-1 text-center py-2.5 text-[9px] font-black text-gray-400 border-l border-gray-100 uppercase cursor-help hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                                {m.label}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="divide-y divide-gray-100 bg-white">
                    {tasks.slice(0, 10).map(task => {
                        const dueDate = new Date(task.DueDate);
                        const startDate = new Date(dueDate);
                        startDate.setMonth(startDate.getMonth() - 2);

                        const leftPos = ((startDate.getTime() - minDate.getTime()) / totalDuration) * 100;
                        const width = ((dueDate.getTime() - startDate.getTime()) / totalDuration) * 100;

                        return (
                            <div key={task.TaskID} className="flex group hover:bg-blue-50/40 transition-colors">
                                <div className="w-64 shrink-0 px-4 py-3 flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${task.Status === TaskStatus.Done ? 'bg-emerald-500' : task.Status === TaskStatus.InProgress ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                                    <span className="text-[11px] font-semibold text-gray-700 truncate" title={task.Title}>{task.Title}</span>
                                </div>
                                <div className="flex-1 relative h-10 flex items-center border-l border-gray-100">
                                    <div className="absolute inset-0 flex pointer-events-none">
                                        {timeline.map((_, i) => <div key={i} className="flex-1 border-r border-gray-50/50"></div>)}
                                    </div>
                                    <div
                                        className={`absolute h-4 rounded-full shadow-sm flex items-center px-2 min-w-[20px] transition-all duration-700 ease-out cursor-pointer ${task.Status === TaskStatus.Done ? 'bg-emerald-500 shadow-emerald-100' :
                                            task.Status === TaskStatus.InProgress ? 'bg-blue-500 shadow-blue-100' : 'bg-gray-200'
                                            }`}
                                        style={{ left: `${Math.max(0, leftPos)}%`, width: `${Math.max(5, width)}%` }}
                                    >
                                        <span className="text-[8px] text-white font-bold whitespace-nowrap overflow-hidden pointer-events-none uppercase">
                                            {task.Status === TaskStatus.Done ? 'OK' : '...'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// --- MEMBERS MANAGEMENT MODAL ---
const MembersManagementModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    currentMembers: string[];
    onUpdateMembers: (newMembers: string[]) => void;
}> = ({ isOpen, onClose, currentMembers, onUpdateMembers }) => {
    const [searchQuery, setSearchQuery] = useState('');

    // Employees not in the project
    const availableEmployees = mockEmployees.filter(e =>
        !currentMembers.includes(e.EmployeeID) &&
        (e.FullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.Position.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Employees currently in the project
    const activeMembers = currentMembers.map(id => mockEmployees.find(e => e.EmployeeID === id)).filter(Boolean);

    const handleAddMember = (id: string) => {
        onUpdateMembers([...currentMembers, id]);
    };

    const handleRemoveMember = (id: string) => {
        onUpdateMembers(currentMembers.filter(mId => mId !== id));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-4xl h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 animate-in zoom-in-95">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-lg font-black text-gray-800 flex items-center gap-3">
                        <Users className="w-5 h-5 text-blue-600" /> Quản lý nhân sự dự án
                    </h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Current Members */}
                    <div className="flex-1 border-r border-gray-100 flex flex-col bg-white">
                        <div className="p-4 bg-blue-50/30 border-b border-blue-50">
                            <h4 className="text-xs font-bold text-blue-800 uppercase tracking-widest mb-1">Danh sách hiện tại ({activeMembers.length})</h4>
                            <p className="text-[10px] text-blue-600/70">Thành viên đang tham gia dự án</p>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {activeMembers.map((member: any) => (
                                <div key={member.EmployeeID} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-100 hover:bg-blue-50/20 transition-all group">
                                    <div className="relative">
                                        <img src={member.AvatarUrl} alt="" className="w-10 h-10 rounded-full border border-gray-100" />
                                        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${member.Status === 1 ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-800 truncate">{member.FullName}</p>
                                        <p className="text-xs text-gray-500 truncate">{member.Position} • {member.Department}</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1"><Phone className="w-3 h-3" /> {member.Phone}</p>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveMember(member.EmployeeID)}
                                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        title="Xóa khỏi dự án"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {activeMembers.length === 0 && (
                                <div className="text-center py-10 text-gray-400 italic text-sm">Chưa có thành viên nào.</div>
                            )}
                        </div>
                    </div>

                    {/* Right: Add New */}
                    <div className="w-[400px] flex flex-col bg-gray-50/50">
                        <div className="p-4 border-b border-gray-200">
                            <h4 className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-3">Thêm thành viên mới</h4>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm tên, chức vụ..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {availableEmployees.map((emp) => (
                                <div key={emp.EmployeeID} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-all shadow-sm">
                                    <img src={emp.AvatarUrl} alt="" className="w-8 h-8 rounded-full bg-gray-100" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-gray-800 truncate">{emp.FullName}</p>
                                        <p className="text-[10px] text-gray-500 truncate">{emp.Position}</p>
                                    </div>
                                    <button
                                        onClick={() => handleAddMember(emp.EmployeeID)}
                                        className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProjectDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const project = mockProjects.find(p => p.ProjectID === id);

    const [localTasks, setLocalTasks] = useState<Task[]>(() => {
        const allTasks = JSON.parse(localStorage.getItem('app_tasks') || '[]');
        const filtered = allTasks.filter((t: Task) => t.ProjectID === id);
        return filtered.length > 0 ? filtered : mockTasks.filter(t => t.ProjectID === id);
    });

    // Local state for members to update UI immediately
    const [memberIds, setMemberIds] = useState<string[]>(project?.Members || []);

    const [activeTab, setActiveTab] = useState<'info' | 'overview' | 'packages' | 'legal' | 'timeline'>('info');
    const [activeDocTab, setActiveDocTab] = useState<'incoming' | 'outgoing'>('incoming');
    const [activePhase, setActivePhase] = useState<string>("1. Giai đoạn chuẩn bị dự án");
    const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
    const [isAllDocsModalOpen, setIsAllDocsModalOpen] = useState(false);
    const [docSearch, setDocSearch] = useState('');
    const [previewFile, setPreviewFile] = useState<any>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0); // Add force refresh state

    const [uploadedLegalDocs, setUploadedLegalDocs] = useState<any[]>([]);
    const legalFileInputRef = useRef<HTMLInputElement>(null);

    // Module 1: National Gateway State
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);

    const handleSync = async () => {
        if (!project) return;
        setIsSyncing(true);
        try {
            const result = await NationalGatewayService.syncProject(project);
            setSyncResult(result);
            if (result.success) {
                // Update local state to reflect sync (ideal would be to update store)
                alert(result.message);
            } else {
                alert(`Lỗi: ${result.message}`);
            }
        } catch (error) {
            console.error(error);
            alert('Có lỗi xảy ra khi đồng bộ.');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleGenerateReport = async (type: 'Monitoring' | 'Settlement') => {
        if (!project) return;
        setIsGeneratingReport(true);
        try {
            const report = type === 'Monitoring'
                ? await NationalGatewayService.generateMonitoringReport(project.ProjectID)
                : await NationalGatewayService.generateSettlementReport(project.ProjectID);

            // Mock download
            const link = document.createElement('a');
            link.href = report.url;
            link.download = `${type}_Report_${project.ProjectID}.pdf`;
            document.body.appendChild(link);
            // link.click(); // Commented out to avoid actual download in this environment
            document.body.removeChild(link);
            alert(`Đã trích xuất báo cáo: ${report.id} thành công!`);
        } catch (error) {
            console.error(error);
        } finally {
            setIsGeneratingReport(false);
        }
    };

    // Sync state if project changes
    useEffect(() => {
        if (project) setMemberIds(project.Members || []);
    }, [project]);

    // Load tasks whenever project changes or refresh is triggered
    useEffect(() => {
        if (project?.ProjectID) {
            const tasks = TaskService.getTasksByProject(project.ProjectID);
            console.log("Loading tasks for project:", project.ProjectID, "Count:", tasks.length);
            setLocalTasks(tasks);
        }
    }, [project?.ProjectID, refreshTrigger]);

    const projectMembers = useMemo(() => {
        return memberIds.map(id => mockEmployees.find(e => e.EmployeeID === id)).filter(Boolean);
    }, [memberIds]);

    const handleLegalUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const newFiles = Array.from(files).map((file: File) => ({
                title: file.name,
                code: 'LOCAL-UPLOAD',
                date: new Date().toISOString().split('T')[0],
                status: 'Mới tải lên',
                isLocal: true,
                fileObj: file
            }));
            setUploadedLegalDocs(prev => [...prev, ...newFiles]);
            alert(`Đã tải lên ${files.length} hồ sơ.`);
            e.target.value = '';
        }
    };

    const [dispatches, setDispatches] = useState({
        incoming: [
            { id: 1, number: '123/UBND-KT', date: '2025-02-20', content: 'V/v phê duyệt kế hoạch lựa chọn nhà thầu các gói thầu tư vấn.', from: 'UBND Tỉnh' },
            { id: 2, number: '45/SXD-QLXD', date: '2025-02-15', content: 'Thông báo kết quả thẩm định thiết kế bản vẽ thi công.', from: 'Sở Xây dựng' },
            { id: 3, number: 'CV-88/NCC-TĐ', date: '2025-03-10', content: 'Đề xuất thay đổi vật liệu ốp lát sảnh chính (do khan hiếm nguồn cung)', from: 'Nhà thầu Tuấn Đạt' },
            { id: 4, number: 'CV-92/TVGS-HBC', date: '2025-03-12', content: 'Báo cáo giám sát chất lượng thi công cọc khoan nhồi', from: 'TVGS Hòa Bình' }
        ],
        outgoing: [
            { id: 1, number: '12/BanQLDA-KH', date: '2025-02-22', content: 'Tờ trình đề nghị phê duyệt dự toán hạng mục san lấp.', to: 'UBND Tỉnh' },
            { id: 2, number: 'CV-105/BQL-KT', date: '2025-03-11', content: 'V/v chấn chỉnh công tác an toàn lao động tại công trường', to: 'Nhà thầu Tuấn Đạt' }
        ]
    });

    const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
    const [replyingToDoc, setReplyingToDoc] = useState<any>(null);
    const [replyContent, setReplyContent] = useState('');
    const [replyNumber, setReplyNumber] = useState('');
    const [replyFiles, setReplyFiles] = useState<File[]>([]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setReplyFiles(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removeReplyFile = (index: number) => {
        setReplyFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleReply = (doc: any) => {
        setReplyingToDoc(doc);
        setReplyContent(`Phúc đáp văn bản số ${doc.number} về việc...`);
        setReplyNumber(`CV-${Math.floor(Math.random() * 1000)}/BQL-DA`);
        setReplyFiles([]);
        setIsReplyModalOpen(true);
    };

    const submitReply = () => {
        if (!replyNumber || !replyContent) return;

        const newDispatch = {
            id: Date.now(),
            number: replyNumber,
            date: new Date().toISOString().split('T')[0],
            content: replyContent,
            to: replyingToDoc.from || 'Đơn vị liên quan',
            files: replyFiles.map(f => f.name)
        };

        setDispatches(prev => ({
            ...prev,
            outgoing: [newDispatch, ...prev.outgoing]
        }));

        setIsReplyModalOpen(false);
        setReplyingToDoc(null);
        setReplyFiles([]);
        setActiveDocTab('outgoing');
        alert(`Đã gửi văn bản trả lời: ${newDispatch.number}\n(Đã đính kèm ${replyFiles.length} tệp)`);
    };

    const projectLegalDocs = [
        { title: 'Tờ trình phê duyệt chủ trương đầu tư', code: 'TTr-05/BQL', date: '2021-06-15', status: 'Đã ký' },
        { title: 'Báo cáo thẩm định chủ trương', code: 'BC-88/SXD', date: '2022-06-15', status: 'Đã ký' },
        { title: 'Quyết định phê duyệt chủ trương đầu tư', code: 'QD-204/UBND', date: '2023-06-15', status: 'Đã ký' },
        { title: 'Quyết định đầu tư dự án', code: 'QD-1015/QD-UBND', date: '2024-06-15', status: 'Đã ký' },
        { title: 'Giấy phép xây dựng công trình', code: 'GP-45/SXD', date: '2025-01-20', status: 'Đã duyệt' },
    ];

    const allLegalDocs = [...uploadedLegalDocs, ...projectLegalDocs];

    const projectCapitalPlan = [
        { year: 2023, allocated: 150000000000, disbursed: 150000000000, status: '100%' },
        { year: 2024, allocated: 350000000000, disbursed: 315000000000, status: '90%' },
        { year: 2025, allocated: 500000000000, disbursed: 0, status: 'Kế hoạch' },
    ];

    const phases = [
        "1. Giai đoạn chuẩn bị dự án",
        "2. Giai đoạn thực hiện dự án",
        "3. Giai đoạn kết thúc xây dựng"
    ];

    const tasksByPhase = useMemo(() => {
        const map: Record<string, Task[]> = {};
        phases.forEach(phase => {
            map[phase] = localTasks
                .filter(t => t.TimelineStep === phase)
                .sort((a, b) => (a.SortOrder || 0) - (b.SortOrder || 0));
        });
        return map;
    }, [localTasks, phases]);

    if (!project) return <div className="flex items-center justify-center h-screen font-bold text-gray-500">Dự án không tồn tại.</div>;

    const packages = mockBiddingPackages.filter(p => p.ProjectID === project.ProjectID);
    const disbursedAmount = mockContracts
        .filter(c => packages.some(pkg => pkg.PackageID === c.PackageID))
        .reduce((total, contract) => {
            const paid = mockPayments
                .filter(p => p.ContractID === contract.ContractID && p.Status === PaymentStatus.Transferred)
                .reduce((sum, p) => sum + p.Amount, 0);
            return total + paid;
        }, 0);

    const disbursementRate = (disbursedAmount / project.TotalInvestment) * 100;

    const investmentBreakdown = [
        { name: 'Xây dựng', value: project.TotalInvestment * 0.7, color: '#3B82F6' },
        { name: 'Thiết bị', value: project.TotalInvestment * 0.15, color: '#10B981' },
        { name: 'QLDA & TV', value: project.TotalInvestment * 0.1, color: '#F59E0B' },
        { name: 'Dự phòng', value: project.TotalInvestment * 0.05, color: '#6366F1' },
    ];

    const packageFinancials = useMemo(() => {
        return packages.slice(0, 5).map(pkg => {
            const contract = mockContracts.find(c => c.PackageID === pkg.PackageID);
            let val = contract?.Value || pkg.Price;
            let paid = mockPayments.filter(p => p.ContractID === contract?.ContractID && p.Status === PaymentStatus.Transferred).reduce((sum, p) => sum + p.Amount, 0);
            return { name: pkg.PackageNumber, contractValue: val, disbursed: paid };
        });
    }, [packages]);

    const filteredAllDocs = (dispatches as any)[activeDocTab].filter((d: any) =>
        d.number.toLowerCase().includes(docSearch.toLowerCase()) ||
        d.content.toLowerCase().includes(docSearch.toLowerCase())
    );

    return (
        <>
            <div className="space-y-6 animate-in fade-in duration-300 relative bg-[#F8FAFC]">
                {/* Header Section */}
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-gray-200 bg-white shadow-sm">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">{project.ProjectName}</h1>
                            <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${project.Status === ProjectStatus.Finished ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                {project.Status === ProjectStatus.Finished ? 'ĐÃ KẾT THÚC' : 'ĐANG TRIỂN KHAI'}
                            </span>
                        </div>
                        {/* Sync Button */}
                        <button
                            onClick={handleSync}
                            disabled={isSyncing}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all ${project.SyncStatus?.IsSynced || syncResult?.success
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                }`}
                            title={project.SyncStatus?.LastSyncDate ? `Đồng bộ lần cuối: ${project.SyncStatus.LastSyncDate}` : 'Chưa đồng bộ'}
                        >
                            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                            {isSyncing ? 'Đang đồng bộ...' : (project.SyncStatus?.IsSynced || syncResult?.success ? 'Đã đồng bộ QG' : 'Đồng bộ QG')}
                        </button>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                        <span className="font-mono bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-xs font-bold">{project.ProjectID}</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        <span className="font-semibold text-gray-600">Nhóm {project.GroupCode}</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-red-400" /> {project.LocationCode}</span>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 flex gap-8">
                {[
                    { id: 'info', label: 'THÔNG TIN DỰ ÁN', icon: Info },
                    { id: 'timeline', label: 'TIẾN ĐỘ DỰ ÁN', icon: Clock },
                    { id: 'overview', label: 'TỔNG QUAN', icon: PieChart },
                    { id: 'cde', label: 'CDE & TÀI LIỆU', icon: FolderOpen },
                    { id: 'bim', label: 'MÔ HÌNH BIM', icon: Layers },
                    { id: 'capital', label: 'QUẢN LÝ VỐN', icon: Landmark },
                    { id: 'packages', label: 'GÓI THẦU', icon: Briefcase },
                    { id: 'legal', label: 'VĂN BẢN ĐẾN/ĐI', icon: Mail }
                ].map(t => (
                    <button
                        key={t.id} onClick={() => setActiveTab(t.id as any)}
                        className={`py-4 px-1 text-xs font-black border-b-2 transition-all flex items-center gap-2 tracking-widest ${activeTab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        <t.icon className="w-4 h-4" />
                        {t.label}
                    </button>
                ))}
            </div>

            {/* --- 0. TAB INFO (NEW) --- */}
            {
                activeTab === 'info' && (
                    <div className="animate-in slide-in-from-bottom-2 duration-500 space-y-8 max-w-5xl mx-auto py-4">

                        {/* Section 0: Kết nối dữ liệu Quốc gia (ND111) */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm border border-blue-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-blue-100 flex justify-between items-center">
                                <h3 className="font-bold text-blue-800 text-sm uppercase flex items-center gap-2">
                                    <Landmark className="w-4 h-4" /> Cổng kết nối Quốc gia (Nghị định 111/ND-CP)
                                </h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleGenerateReport('Monitoring')}
                                        disabled={isGeneratingReport}
                                        className="px-3 py-1.5 bg-white text-blue-700 text-xs font-bold rounded-md border border-blue-200 hover:bg-blue-50 flex items-center gap-2 transition-all shadow-sm"
                                    >
                                        <FileBarChart className="w-3.5 h-3.5" /> Báo cáo giám sát
                                    </button>
                                    <button
                                        onClick={() => handleGenerateReport('Settlement')}
                                        disabled={isGeneratingReport}
                                        className="px-3 py-1.5 bg-white text-blue-700 text-xs font-bold rounded-md border border-blue-200 hover:bg-blue-50 flex items-center gap-2 transition-all shadow-sm"
                                    >
                                        <FileCheck className="w-3.5 h-3.5" /> Báo cáo quyết toán
                                    </button>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${project.SyncStatus?.IsSynced || syncResult?.success ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                                            <RefreshCw className={`w-6 h-6 ${isSyncing ? 'animate-spin' : ''}`} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">Trạng thái đồng bộ CSDL Quốc gia</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {isSyncing ? 'Đang kết nối đến cổng...' : (
                                                    (project.SyncStatus?.IsSynced || syncResult?.success)
                                                        ? `Đã đồng bộ. Mã dự án QG: ${syncResult?.nationalCode || project.SyncStatus?.NationalProjectCode || 'ND111-PR2400-2025'}`
                                                        : 'Chưa đồng bộ hoặc có lỗi.'
                                                )}
                                            </p>
                                            {(project.SyncStatus?.LastSyncDate || syncResult?.timestamp) && (
                                                <p className="text-[10px] text-gray-400 mt-0.5">
                                                    Cập nhật lần cuối: {syncResult?.timestamp ? new Date(syncResult.timestamp).toLocaleString('vi-VN') : project.SyncStatus?.LastSyncDate}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-medium text-gray-500 mb-1">Cơ quan quản lý</div>
                                        <div className="text-sm font-bold text-blue-900">BỘ XÂY DỰNG</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 1: Thông tin chung */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                                <h3 className="font-bold text-gray-800 text-sm uppercase">Thông tin chung</h3>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                                    <div className="space-y-4">
                                        <div className="flex flex-col border-b border-gray-100 pb-2">
                                            <span className="text-xs text-gray-500 mb-1">Số dự án</span>
                                            <span className="text-sm font-medium text-gray-900">{project.ProjectNumber || project.ProjectID}</span>
                                        </div>
                                        <div className="flex flex-col border-b border-gray-100 pb-2">
                                            <span className="text-xs text-gray-500 mb-1">Phiên bản thay đổi</span>
                                            <span className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                                {project.Version || '00'}
                                                <ChevronDown className="w-4 h-4 text-gray-400" />
                                            </span>
                                        </div>
                                        <div className="flex flex-col border-b border-gray-100 pb-2">
                                            <span className="text-xs text-gray-500 mb-1">Trạng thái đăng tải</span>
                                            <span className="text-sm font-medium text-gray-900">Đã đăng tải</span>
                                        </div>
                                        <div className="flex flex-col border-b border-gray-100 pb-2">
                                            <span className="text-xs text-gray-500 mb-1">Tên dự án</span>
                                            <span className="text-sm font-medium text-gray-900">{project.ProjectName}</span>
                                        </div>
                                        <div className="flex flex-col border-b border-gray-100 pb-2">
                                            <span className="text-xs text-gray-500 mb-1">Mục tiêu đầu tư</span>
                                            <span className="text-sm font-medium text-gray-900 text-justify leading-relaxed">{project.Objective || 'Chưa cập nhật'}</span>
                                        </div>
                                        <div className="flex flex-col border-b border-gray-100 pb-2">
                                            <span className="text-xs text-gray-500 mb-1">Chủ đầu tư</span>
                                            <span className="text-sm font-medium text-gray-900">{project.InvestorName}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex flex-col border-b border-gray-100 pb-2">
                                            <span className="text-xs text-gray-500 mb-1">Người có thẩm quyền</span>
                                            <span className="text-sm font-medium text-gray-900 uppercase">{project.CompetentAuthority || 'UBND TỈNH'}</span>
                                        </div>
                                        <div className="flex flex-col border-b border-gray-100 pb-2">
                                            <span className="text-xs text-gray-500 mb-1">Thời gian thực hiện dự án</span>
                                            <span className="text-sm font-medium text-gray-900">{project.Duration || '5 Năm'}</span>
                                        </div>
                                        <div className="flex flex-col border-b border-gray-100 pb-2">
                                            <span className="text-xs text-gray-500 mb-1">Nhóm dự án</span>
                                            <span className="text-sm font-medium text-gray-900">Nhóm {project.GroupCode}</span>
                                        </div>
                                        <div className="flex flex-col border-b border-gray-100 pb-2">
                                            <span className="text-xs text-gray-500 mb-1">Hình thức quản lý dự án</span>
                                            <span className="text-sm font-medium text-gray-900">{project.ManagementForm || 'Chủ đầu tư trực tiếp quản lý dự án'}</span>
                                        </div>
                                        <div className="flex flex-col border-b border-gray-100 pb-2">
                                            <span className="text-xs text-gray-500 mb-1">Có sử dụng vốn ODA</span>
                                            <span className="text-sm font-medium text-gray-900">{project.IsODA ? 'Có' : 'Không'}</span>
                                        </div>
                                        <div className="flex flex-col border-b border-gray-100 pb-2">
                                            <span className="text-xs text-gray-500 mb-1">Địa điểm thực hiện</span>
                                            <span className="text-sm font-medium text-gray-900">{project.LocationCode}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Thông tin tổng mức đầu tư */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                                <h3 className="font-bold text-gray-800 text-sm uppercase">Thông tin tổng mức đầu tư</h3>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex flex-col border-b border-gray-100 pb-2">
                                    <span className="text-xs text-gray-500 mb-1">Tổng mức đầu tư</span>
                                    <span className="text-sm font-bold text-gray-900">{new Intl.NumberFormat('vi-VN').format(project.TotalInvestment)} VND</span>
                                </div>
                                <div className="flex flex-col border-b border-gray-100 pb-2">
                                    <span className="text-xs text-gray-500 mb-1">Số tiền bằng chữ</span>
                                    <span className="text-sm font-medium text-gray-900 italic">
                                        {project.TotalInvestment === 305000000000 ? "Ba trăm lẻ năm tỷ đồng" :
                                            project.TotalInvestment === 105800000000 ? "Một trăm lẻ năm tỷ tám trăm triệu đồng" : "Đang cập nhật"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Thông tin quyết định phê duyệt */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                                <h3 className="font-bold text-gray-800 text-sm uppercase">Thông tin quyết định phê duyệt</h3>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex flex-col border-b border-gray-100 pb-2">
                                    <span className="text-xs text-gray-500 mb-1">Số quyết định phê duyệt dự án</span>
                                    <span className="text-sm font-medium text-gray-900">{project.DecisionNumber || '1183/QĐ-UBND'}</span>
                                </div>
                                <div className="flex flex-col border-b border-gray-100 pb-2">
                                    <span className="text-xs text-gray-500 mb-1">Ngày phê duyệt dự án</span>
                                    <span className="text-sm font-medium text-gray-900">{project.DecisionDate || '28/05/2025'}</span>
                                </div>
                                <div className="flex flex-col border-b border-gray-100 pb-2">
                                    <span className="text-xs text-gray-500 mb-1">Cơ quan ban hành quyết định</span>
                                    <span className="text-sm font-medium text-gray-900 uppercase">{project.DecisionAuthority || 'UỶ BAN NHÂN DÂN TỈNH HÀ TĨNH'}</span>
                                </div>
                                <div className="flex flex-col border-b border-gray-100 pb-2">
                                    <span className="text-xs text-gray-500 mb-1">Quyết định phê duyệt</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <FileText className="w-4 h-4 text-red-500" />
                                        <a href="#" className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1">
                                            00. Quyết định phê duyệt dự án.pdf <Download className="w-3 h-3" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Danh sách KHLCNT (NEW) */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                                <h3 className="font-bold text-gray-800 text-sm uppercase">Danh sách KHLCNT liên kết với dự án</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-gray-600">
                                    <thead className="bg-white text-xs uppercase font-semibold text-gray-500 border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-3 w-16">STT</th>
                                            <th className="px-6 py-3">Số hiệu KHLCNT</th>
                                            <th className="px-6 py-3">Tên KHLCNT</th>
                                            <th className="px-6 py-3 text-right">Tổng giá gói thầu</th>
                                            <th className="px-6 py-3">Phân loại KHLCNT</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {project.ProjectID === 'PR2500060068' ? (
                                            <tr className="hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium">1</td>
                                                <td className="px-6 py-4 font-medium text-blue-600">PL2500295620</td>
                                                <td className="px-6 py-4">V/v phê duyệt kế hoạch lựa chọn nhà thầu một số gói thầu thuộc Dự án đầu tư xây dựng Trường Chính trị Trần Phú</td>
                                                <td className="px-6 py-4 text-right font-bold text-gray-900">2.271.077.000 VND</td>
                                                <td className="px-6 py-4">KHLCNT thực hiện trên hệ thống EGP mới</td>
                                            </tr>
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-8 text-center text-gray-400 italic">Chưa có thông tin KHLCNT cho dự án này.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                    {project.ProjectID === 'PR2500060068' && (
                                        <tfoot className="bg-gray-50 font-bold text-gray-700">
                                            <tr>
                                                <td colSpan={3} className="px-6 py-3 text-right">Tổng tiền</td>
                                                <td className="px-6 py-3 text-right">2.271.077.000 VND</td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        </div>

                        {/* Return Button */}
                        <div className="flex justify-start pt-4">
                            <button onClick={() => navigate(-1)} className="px-4 py-2 bg-orange-400 text-white rounded text-sm font-bold hover:bg-orange-500 transition-colors flex items-center gap-2">
                                <ArrowLeft className="w-4 h-4" /> Quay trở lại
                            </button>
                        </div>
                    </div>
                )
            }

            {/* --- 1. TAB TỔNG QUAN --- */}
            {
                activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-2 duration-500">
                        {/* VÙNG 1: CHỈ SỐ VÀ BIỂU ĐỒ (LEFT/CENTER - 8/12) */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Hàng Stat Cards nhỏ hơn */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-28">
                                    <div className="flex justify-between items-start"><div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><DollarSign className="w-4 h-4" /></div><span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">NGÂN SÁCH</span></div>
                                    <div><p className="text-[10px] text-gray-500 font-medium leading-none mb-1">Tổng mức đầu tư</p><p className="text-sm font-black text-gray-800 leading-none">{formatFullCurrency(project.TotalInvestment)}</p></div>
                                </div>
                                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-28">
                                    <div className="flex justify-between items-start"><div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><Activity className="w-4 h-4" /></div><span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">{disbursementRate.toFixed(1)}%</span></div>
                                    <div><p className="text-[10px] text-gray-500 font-medium leading-none mb-1">Giá trị giải ngân</p><p className="text-sm font-black text-emerald-700 leading-none">{formatFullCurrency(disbursedAmount)}</p></div>
                                </div>
                                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-28">
                                    <div className="flex justify-between items-start"><div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg"><Briefcase className="w-4 h-4" /></div><span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">ĐẤU THẦU</span></div>
                                    <div><p className="text-[10px] text-gray-500 font-medium leading-none mb-1">Số lượng gói thầu</p><p className="text-sm font-black text-gray-800 leading-none">{packages.length} Gói</p></div>
                                </div>
                                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-28">
                                    <div className="flex justify-between items-start"><div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg"><AlertTriangle className="w-4 h-4" /></div><span className="text-[9px] font-black text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">CẢNH BÁO</span></div>
                                    <div><p className="text-[10px] text-gray-500 font-medium leading-none mb-1">Tình trạng rủi ro</p><p className="text-[11px] font-bold text-gray-800 leading-none">Chậm tiến độ 5%</p></div>
                                </div>
                            </div>

                            {/* Hàng Biểu đồ */}
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col h-[320px]">
                                    <h3 className="text-[10px] font-black text-gray-800 mb-4 flex items-center gap-2 uppercase tracking-widest border-b border-gray-50 pb-2">
                                        <PieChart className="w-3.5 h-3.5 text-blue-600" /> Cơ cấu nguồn vốn & Chi phí
                                    </h3>
                                    <div className="flex-1 flex flex-col items-center justify-center">
                                        <div className="w-full h-40 relative">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RechartsPie>
                                                    <Pie data={investmentBreakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={60} paddingAngle={4} dataKey="value">
                                                        {investmentBreakdown.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                                                    </Pie>
                                                    <RechartsTooltip formatter={(v) => formatFullCurrency(Number(v))} />
                                                </RechartsPie>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="w-full mt-4 grid grid-cols-2 gap-x-4 gap-y-1">
                                            {investmentBreakdown.map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between text-[10px]">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                                                        <span className="text-gray-500 font-bold">{item.name}</span>
                                                    </div>
                                                    <span className="font-black text-gray-800">{((item.value / project.TotalInvestment) * 100).toFixed(0)}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col h-[320px]">
                                    <h3 className="text-[10px] font-black text-gray-800 mb-4 flex items-center gap-2 uppercase tracking-widest border-b border-gray-50 pb-2">
                                        <BarChart2 className="w-3.5 h-3.5 text-emerald-600" /> Giải ngân các gói thầu
                                    </h3>
                                    <div className="flex-1">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={packageFinancials} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                                <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                                <YAxis hide />
                                                <RechartsTooltip formatter={(v) => formatFullCurrency(Number(v))} cursor={{ fill: '#F8FAFC' }} />
                                                <Bar dataKey="contractValue" fill="#6366F1" radius={[4, 4, 0, 0]} name="Giá trị HĐ" />
                                                <Bar dataKey="disbursed" fill="#10B981" radius={[4, 4, 0, 0]} name="Đã giải ngân" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            {/* Timeline */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xs font-black text-gray-800 flex items-center gap-2 tracking-tight uppercase">
                                        <Layers className="w-4 h-4 text-indigo-600" /> Tiến độ dự án (Sơ đồ tổng thể)
                                    </h3>
                                    <button
                                        onClick={() => {
                                            console.log('Create Process Button Clicked');
                                            console.log('Current localTasks length:', localTasks.length);

                                            const newTasks = generateTasksForProject(project.ProjectID, project.GroupCode);
                                            console.log('Generated tasks:', newTasks.length);
                                            // Filter out duplicates if needed, or just append
                                            newTasks.forEach(t => TaskService.saveTask(t));
                                            setRefreshTrigger(prev => prev + 1);
                                            // Silent success - không hiện alert
                                        }}
                                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-lg border border-indigo-200 flex items-center gap-2 transition-all"
                                    >
                                        <Wand2 className="w-3.5 h-3.5" /> Tạo quy trình chuẩn
                                    </button>
                                </div>

                                {localTasks.length === 0 && (
                                    <div className="mb-6 p-4 bg-gray-50 border border-gray-100 rounded-xl text-center">
                                        <p className="text-sm text-gray-500">Chưa có dữ liệu tiến độ.</p>
                                    </div>
                                )}
                                <ProjectGanttChart tasks={localTasks} />
                            </div>
                        </div>

                        {/* VÙNG 2: THÔNG TIN VÀ VĂN BẢN (RIGHT - 4/12) */}
                        <div className="space-y-6">
                            {/* Đưa Thông tin dự án lên đầu */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <div className="flex justify-between items-center mb-5">
                                    <h3 className="text-xs font-black text-gray-800 flex items-center gap-2 uppercase tracking-tight"><Info className="w-4 h-4 text-blue-600" /> Thông tin dự án</h3>
                                    <button onClick={() => setActiveTab('info')} className="text-[10px] font-bold text-blue-600 hover:underline">Chi tiết</button>
                                </div>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><p className="text-[9px] text-gray-400 uppercase font-black mb-1 tracking-tighter">Mã định danh</p><p className="text-[11px] font-mono font-bold text-gray-800">{project.ProjectNumber || project.ProjectID}</p></div>
                                        <div><p className="text-[9px] text-gray-400 uppercase font-black mb-1 tracking-tighter">Phân loại</p><span className="inline-flex px-2 py-0.5 rounded text-[9px] font-black bg-red-50 text-red-700 border border-red-100 uppercase">NHÓM {project.GroupCode}</span></div>
                                    </div>
                                    <div className="pt-4 border-t border-gray-100 space-y-3">
                                        <div className="flex items-start gap-3"><div className="p-1.5 bg-gray-50 rounded-lg text-gray-400"><MapPin className="w-3.5 h-3.5" /></div><div><p className="text-[9px] text-gray-400 font-black uppercase tracking-tighter">Địa điểm triển khai</p><p className="text-[11px] font-bold text-gray-700">{project.LocationCode}</p></div></div>
                                        <div className="flex items-start gap-3"><div className="p-1.5 bg-gray-50 rounded-lg text-gray-400"><Building2 className="w-3.5 h-3.5" /></div><div><p className="text-[9px] text-gray-400 font-black uppercase tracking-tighter">Chủ đầu tư phê duyệt</p><p className="text-[11px] font-bold text-gray-700 line-clamp-2" title={project.InvestorName}>{project.InvestorName}</p></div></div>
                                        <div className="flex items-start gap-3"><div className="p-1.5 bg-gray-50 rounded-lg text-gray-400"><Calendar className="w-3.5 h-3.5" /></div><div><p className="text-[9px] text-gray-400 font-black uppercase tracking-tighter">Ngày quyết định đầu tư</p><p className="text-[11px] font-bold text-gray-700">{project.DecisionDate || project.ApprovalDate}</p></div></div>
                                    </div>
                                </div>
                            </div>

                            {/* NEW MEMBER CARD */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <div className="flex justify-between items-center mb-5">
                                    <h3 className="text-xs font-black text-gray-800 flex items-center gap-2 uppercase tracking-tight">
                                        <Users className="w-4 h-4 text-blue-600" /> Thành viên dự án
                                    </h3>
                                    <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-md">{projectMembers.length}</span>
                                </div>
                                <div className="space-y-4">
                                    {projectMembers.map((member: any) => (
                                        <div key={member.EmployeeID} className="flex items-center gap-3 group cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded-xl transition-colors">
                                            <div className="relative">
                                                <img src={member.AvatarUrl} alt={member.FullName} className="w-10 h-10 rounded-full border border-gray-100 object-cover" />
                                                <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${member.Status === 1 ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{member.FullName}</p>
                                                <p className="text-[10px] text-gray-500 font-medium">{member.Position}</p>
                                                <p className="text-[9px] text-gray-400 mt-0.5">{member.Department}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {projectMembers.length === 0 && <p className="text-xs text-gray-400 italic">Chưa có thành viên.</p>}
                                </div>
                                <button onClick={() => setIsMembersModalOpen(true)} className="w-full mt-4 flex items-center justify-center gap-2 py-2 text-[10px] font-black text-blue-600 bg-blue-50/50 border border-blue-100 rounded-xl hover:bg-blue-100 uppercase tracking-widest transition-all">
                                    <UserPlus className="w-3 h-3" /> Quản lý nhân sự
                                </button>
                            </div>

                            {/* Văn bản điều hành */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-xs font-black text-gray-800 mb-5 flex items-center gap-2 uppercase tracking-tight"><Mail className="w-4 h-4 text-blue-600" /> Văn bản điều hành</h3>
                                <div className="space-y-4">
                                    {dispatches[activeDocTab].map((doc: any) => (
                                        <div key={doc.id} className="flex gap-3 items-start group relative border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                                            <div className={`mt-1 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${activeDocTab === 'incoming' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                                                <FileInput className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="flex-1 min-w-0 pr-6">
                                                <div className="flex justify-between items-center"><p className="text-[11px] font-black text-gray-800 truncate tracking-tight">{doc.number}</p><span className="text-[9px] text-gray-400 font-bold">{doc.date}</span></div>
                                                <p className="text-[10px] text-gray-600 line-clamp-1 font-medium mt-0.5">{doc.content}</p>
                                            </div>
                                            <button onClick={() => setPreviewFile(doc)} className="absolute right-0 top-1/2 -translate-y-1/2 p-1 bg-blue-50 text-blue-600 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-sm">
                                                <Eye className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={() => setIsAllDocsModalOpen(true)} className="w-full mt-5 py-2 text-[10px] font-black text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 uppercase tracking-widest transition-all">XEM TẤT CẢ VĂN BẢN</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* --- 2. TAB GÓI THẦU --- */}
            {
                activeTab === 'packages' && (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 animate-in slide-in-from-bottom-2 duration-500">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-gray-800 flex items-center gap-2 tracking-tight uppercase"><Briefcase className="w-6 h-6 text-blue-600" /> Quản lý Gói thầu & Hợp đồng</h3>
                            <div className="flex gap-2">
                                <button className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-lg border border-indigo-200 flex items-center gap-2">
                                    <BookOpen className="w-3.5 h-3.5" /> Hồ sơ thầu E-GP
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto rounded-2xl border border-gray-100">
                            <table className="w-full text-sm text-left">
                                <thead className="text-[11px] text-gray-500 bg-gray-50/80 uppercase font-black border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4">Mã gói</th>
                                        <th className="px-6 py-4">Tên gói thầu</th>
                                        <th className="px-6 py-4">Lĩnh vực</th>
                                        <th className="px-6 py-4">Hình thức</th>
                                        <th className="px-6 py-4 text-right">Giá trị gói thầu (VND)</th>
                                        <th className="px-6 py-4">Trạng thái</th>
                                        <th className="px-6 py-4">VO (Phụ lục)</th>
                                        <th className="px-6 py-4 text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {packages.map(pkg => {
                                        const contract = mockContracts.find(c => c.PackageID === pkg.PackageID);
                                        const voCount = contract?.VariationOrders?.length || 0;
                                        const voAmount = contract?.VariationOrders?.reduce((sum, vo) => sum + vo.Amount, 0) || 0;

                                        return (
                                            <tr key={pkg.PackageID} className="hover:bg-blue-50/30 cursor-pointer group" onClick={() => navigate(`/projects/${project.ProjectID}/packages/${pkg.PackageID}`)}>
                                                <td className="px-6 py-4 font-mono font-bold text-gray-600">{pkg.PackageNumber}</td>
                                                <td className="px-6 py-4 font-extrabold text-gray-800 max-w-xs">
                                                    {pkg.PackageName}
                                                    <div className="text-[10px] font-normal text-gray-500 mt-1">{pkg.Duration ? `Thời gian: ${pkg.Duration}` : ''}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-50 text-gray-600 border border-gray-200">
                                                        {pkg.Field || 'Hỗn hợp'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded w-fit">
                                                        <Wand2 className="w-3 h-3" /> {pkg.SelectionMethod || 'Đấu thầu QM'}
                                                    </span>
                                                    <div className="text-[9px] text-gray-400 mt-1">{pkg.BidType}</div>
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono font-black text-emerald-600">
                                                    {formatFullCurrency(contract?.Value || pkg.WinningPrice || pkg.Price)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {contract ? (
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 uppercase">
                                                            Đang thực hiện
                                                        </span>
                                                    ) : (
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${pkg.Status === 'Posted' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                            pkg.Status === 'Planning' ? 'bg-gray-100 text-gray-600 border-gray-200' :
                                                                'bg-orange-100 text-orange-700 border-orange-200'
                                                            }`}>
                                                            {pkg.Status === 'Posted' ? 'Đã đăng tải' :
                                                                pkg.Status === 'Planning' ? 'Trong kế hoạch' :
                                                                    pkg.Status === 'Bidding' ? 'Đang mời thầu' : 'Chưa ký HĐ'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {voCount > 0 ? (
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100 w-fit">
                                                                {voCount} PLHĐ
                                                            </span>
                                                            <span className="text-[9px] font-mono text-gray-400 mt-0.5">+{formatFullCurrency(voAmount)}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] text-gray-400 italic">Không có</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right"><Eye className="w-4 h-4 text-gray-300 group-hover:text-blue-600 inline" /></td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            }

            {/* --- 2.5 TAB CDE MANAGER (NEW) --- */}
            {
                activeTab === 'cde' && (
                    <div className="animate-in slide-in-from-bottom-2 duration-500">
                        <CDEManager projectId={project.ProjectID} projectCode={project.ProjectNumber} />
                    </div>
                )
            }


            {/* --- 2.6 TAB CAPITAL MANAGER (NEW) --- */}
            {
                activeTab === 'capital' && (
                    <div className="animate-in slide-in-from-bottom-2 duration-500">
                        <CapitalManager projectId={project.ProjectID} />
                    </div>
                )
            }

            {/* --- 2.7 TAB BIM VIEWER (NEW) --- */}
            {
                activeTab === 'bim' && (
                    <div className="animate-in slide-in-from-bottom-2 duration-500">
                        <BIMViewer projectId={project.ProjectID} />
                    </div>
                )
            }

            {/* --- 3. TAB PHÁP LÝ & VỐN --- */}
            {
                activeTab === 'legal' && (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 animate-in slide-in-from-bottom-2 duration-500">
                        {/* Header: Title + Tab Switcher + Actions */}
                        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                            <div className="flex items-center gap-6 w-full md:w-auto">
                                <h3 className="text-xl font-black text-gray-800 flex items-center gap-3 uppercase tracking-tight shrink-0">
                                    <Mail className="w-6 h-6 text-blue-600" /> Văn bản Đến/Đi
                                </h3>
                                {/* Tab Switcher */}
                                <div className="flex bg-gray-100 p-1 rounded-xl shrink-0">
                                    <button
                                        onClick={() => setActiveDocTab('incoming')}
                                        className={`px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${activeDocTab === 'incoming' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        Văn bản Đến
                                    </button>
                                    <button
                                        onClick={() => setActiveDocTab('outgoing')}
                                        className={`px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${activeDocTab === 'outgoing' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        Văn bản Đi
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <div className="relative flex-1 md:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm số hiệu, trích yếu..."
                                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-200 transition-all"
                                        value={docSearch}
                                        onChange={(e) => setDocSearch(e.target.value)}
                                    />
                                </div>
                                <button className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors shrink-0" title="Tải lên văn bản">
                                    <Upload className="w-4 h-4" />
                                </button>
                                <button className="p-2 bg-gray-50 text-gray-500 rounded-xl hover:bg-gray-100 transition-colors shrink-0" title="Bộ lọc nâng cao">
                                    <Filter className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* List Dispatch Table */}
                        <div className="overflow-hidden rounded-2xl border border-gray-100">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50/80 text-gray-400 font-black text-[11px] uppercase border-b border-gray-100 tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4 w-40">Số hiệu</th>
                                        <th className="px-6 py-4 w-32">Ngày LH</th>
                                        <th className="px-6 py-4">Trích yếu nội dung</th>
                                        <th className="px-6 py-4 w-48">{activeDocTab === 'incoming' ? 'Nơi gửi' : 'Nơi nhận'}</th>
                                        <th className="px-6 py-4 w-24 text-center">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {(dispatches as any)[activeDocTab].filter((d: any) =>
                                        d.number.toLowerCase().includes(docSearch.toLowerCase()) ||
                                        d.content.toLowerCase().includes(docSearch.toLowerCase())
                                    ).length > 0 ? (
                                        (dispatches as any)[activeDocTab]
                                            .filter((d: any) => d.number.toLowerCase().includes(docSearch.toLowerCase()) || d.content.toLowerCase().includes(docSearch.toLowerCase()))
                                            .map((doc: any) => (
                                                <tr
                                                    key={doc.id}
                                                    className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                                                    onClick={() => setPreviewFile({ ...doc, title: doc.content, code: doc.number, isLocal: false })}
                                                >
                                                    <td className="px-6 py-4">
                                                        <span className={`font-mono font-black ${activeDocTab === 'incoming' ? 'text-emerald-600' : 'text-orange-600'}`}>
                                                            {doc.number}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 font-bold text-gray-500 text-xs">{doc.date}</td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-gray-700 font-medium line-clamp-2 text-xs leading-relaxed">{doc.content}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs font-bold text-gray-600 flex items-center gap-2">
                                                        <Building2 className="w-3 h-3 text-gray-300" />
                                                        {activeDocTab === 'incoming' ? doc.from : doc.to}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setPreviewFile({ ...doc, title: doc.content, code: doc.number, isLocal: false }); }}
                                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all"
                                                                title="Xem chi tiết"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                            {activeDocTab === 'incoming' && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleReply(doc); }}
                                                                    className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-white rounded-lg transition-all"
                                                                    title="Trả lời văn bản"
                                                                >
                                                                    <Reply className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="py-12 text-center text-gray-400 text-xs italic">
                                                Không tìm thấy văn bản nào phù hợp.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            }

            {/* --- 4. TAB TIẾN ĐỘ (NEW LAYOUT) --- */}
            {
                activeTab === 'timeline' && (
                    <div className="animate-in slide-in-from-bottom-2 duration-500 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 h-[calc(100vh-180px)]">
                        {/* LEFT SIDEBAR: VERTICAL TIMELINE */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden h-full">
                            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                                <h4 className="flex items-center gap-2 font-black text-gray-800 text-sm uppercase tracking-widest">
                                    <Layers className="w-5 h-5 text-indigo-600" /> Tiến độ dự án
                                </h4>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 relative">
                                {/* Vertical Line */}
                                <div className="absolute left-[34px] top-6 bottom-6 w-0.5 bg-gray-200"></div>

                                {phases.map((phase, index) => {
                                    const isActive = activePhase === phase;
                                    const tasks = tasksByPhase[phase] || [];
                                    const taskCount = tasks.length;
                                    const completedCount = tasks.filter(t => t.Status === TaskStatus.Done).length;

                                    // Calculate date range
                                    let dateRange = "Chưa có dữ liệu";
                                    if (tasks.length > 0) {
                                        const dates = tasks.map(t => new Date(t.DueDate).getTime());
                                        const minDate = new Date(Math.min(...dates));
                                        const maxDate = new Date(Math.max(...dates));
                                        // Estimate start date based on calculation or just show Due Date range
                                        // For simplicity showing min/max due date as range
                                        dateRange = `${minDate.toLocaleDateString('vi-VN')} - ${maxDate.toLocaleDateString('vi-VN')}`;
                                    }

                                    return (
                                        <div
                                            key={phase}
                                            onClick={() => setActivePhase(phase)}
                                            className="relative pl-12 pb-8 last:pb-0 cursor-pointer group"
                                        >
                                            {/* Timeline Dot */}
                                            <div className={`absolute left-0 top-1 w-4 h-4 rounded-full border-[3px] z-10 transition-colors ${isActive ? 'bg-white border-blue-600 ring-4 ring-blue-100' :
                                                taskCount > 0 ? 'bg-white border-gray-400 group-hover:border-blue-400' : 'bg-gray-200 border-gray-200'
                                                }`}></div>

                                            {/* Content Node */}
                                            <div className={`transition-all ${isActive ? 'opacity-100 translate-x-1' : 'opacity-70 group-hover:opacity-100'}`}>
                                                <h5 className={`font-black uppercase tracking-tight text-xs mb-1 ${isActive ? 'text-blue-700' : 'text-gray-700'}`}>
                                                    {phase}
                                                </h5>

                                                {/* Details */}
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-3 h-3 text-gray-400" />
                                                        <span className="text-[10px] font-bold text-gray-500 font-mono tracking-tight">{dateRange}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase ${isActive ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-500 border-gray-200'
                                                            }`}>
                                                            {taskCount} Công việc
                                                        </span>
                                                        {taskCount > 0 && (
                                                            <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-1">
                                                                <CheckCircle2 className="w-3 h-3" /> {completedCount} Hoàn thành
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* RIGHT CONTENT: DETAILED TASKS */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden h-full">
                            {/* RIGHT HEADER: TABS + ACTIONS */}
                            <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-white">
                                {/* Short Tabs for Right Panel */}
                                <div className="flex bg-gray-100 p-1.5 rounded-xl w-full md:w-auto">
                                    <button
                                        onClick={() => setActivePhase(phases[0])}
                                        className={`px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${activePhase === phases[0] ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Chuẩn bị
                                    </button>
                                    <button
                                        onClick={() => setActivePhase(phases[1])}
                                        className={`px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${activePhase === phases[1] ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Thực hiện
                                    </button>
                                    <button
                                        onClick={() => setActivePhase(phases[2])}
                                        className={`px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${activePhase === phases[2] ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Kết thúc
                                    </button>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                        {(tasksByPhase[activePhase] || []).length} Đầu mục
                                    </span>
                                    <button
                                        onClick={() => {
                                            // Sử dụng ngày quyết định đầu tư làm mốc bắt đầu tính tiến độ
                                            const startDate = project.DecisionDate || project.ApprovalDate || new Date().toISOString().split('T')[0];
                                            console.log("Generating tasks for project:", project.ProjectID, "Group:", project.GroupCode, "Start Date:", startDate);

                                            const newTasks = generateTasksForProject(project.ProjectID, project.GroupCode, startDate);
                                            console.log("Generated tasks:", newTasks);

                                            // Batch save tasks efficiently
                                            TaskService.saveTasks(newTasks);

                                            // Force refresh
                                            setRefreshTrigger(prev => prev + 1);
                                            // Silent success - không hiện alert
                                        }}
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-xl shadow-lg shadow-indigo-200 flex items-center gap-2 transition-all uppercase tracking-widest"
                                    >
                                        <div className="p-0.5 bg-white/20 rounded-full"><Wand2 className="w-3 h-3" /></div>
                                        Tạo quy trình chuẩn
                                    </button>
                                </div>
                            </div>

                            {/* RIGHT BODY: TASK LIST */}
                            <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
                                {(tasksByPhase[activePhase] || []).length > 0 ? (
                                    <div className="space-y-3">
                                        {(tasksByPhase[activePhase] || []).map(task => {
                                            const assignee = mockEmployees.find(e => e.EmployeeID === task.AssigneeID);
                                            return (
                                                <div
                                                    key={task.TaskID}
                                                    onClick={() => navigate(`/tasks/${task.TaskID}`)}
                                                    className="bg-white p-4 rounded-xl border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex-1">
                                                            <h6 className="text-sm font-bold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-1" title={task.Title}>{task.Title}</h6>
                                                            <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">{task.Description}</p>
                                                        </div>
                                                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider shrink-0 ml-4 ${task.Status === TaskStatus.Done ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                                                            }`}>
                                                            {task.Status === TaskStatus.Done ? 'Hoàn thành' : 'Đang thực hiện'}
                                                        </span>
                                                    </div>

                                                    {assignee && (
                                                        <div className="flex items-center gap-2 my-2 py-1.5 px-2 bg-gray-50 rounded-lg border border-gray-100">
                                                            <img src={assignee.AvatarUrl} alt={assignee.FullName} className="w-5 h-5 rounded-full border border-white shadow-sm object-cover" />
                                                            <div className="min-w-0 flex-1">
                                                                <div className="text-[10px] font-bold text-gray-700 truncate">{assignee.FullName}</div>
                                                                <div className="text-[9px] font-medium text-gray-400 truncate">{assignee.Department}</div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                                                        <div className="flex items-center gap-3">
                                                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                                                                <Clock className="w-3 h-3" /> {task.DurationDays} ngày
                                                            </span>
                                                            {task.LegalBasis && (
                                                                <span className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-50 max-w-[200px] truncate" title={task.LegalBasis}>
                                                                    <Scale className="w-3 h-3" /> {task.LegalBasis}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] font-bold text-gray-400">{task.DueDate}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                            <ListChecks className="w-10 h-10 text-gray-300" />
                                        </div>
                                        <p className="text-sm font-bold text-gray-500">Chưa có công việc nào trong giai đoạn này.</p>
                                        <p className="text-xs text-gray-400 mt-1">Vui lòng tạo quy trình chuẩn hoặc thêm công việc mới.</p>
                                        <button className="mt-4 text-[11px] font-bold text-blue-600 hover:underline">Chi tiết các task</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {previewFile && <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}

            <MembersManagementModal
                isOpen={isMembersModalOpen}
                onClose={() => setIsMembersModalOpen(false)}
                currentMembers={memberIds}
                onUpdateMembers={setMemberIds}
            />

            {
                isAllDocsModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[85vh] border border-gray-100 animate-in zoom-in-95">
                            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <h3 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-3"><Mail className="w-7 h-7 text-blue-600" /> Văn bản Điều hành</h3>
                                <button onClick={() => setIsAllDocsModalOpen(false)} className="text-gray-400 hover:text-red-500 rounded-full p-2.5 hover:bg-red-50 transition-all"><X className="w-7 h-7" /></button>
                            </div>
                            <div className="p-6 bg-white border-b flex gap-4">
                                <div className="flex bg-gray-100 p-1 rounded-xl w-64">
                                    <button onClick={() => setActiveDocTab('incoming')} className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${activeDocTab === 'incoming' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400'}`}>Đến</button>
                                    <button onClick={() => setActiveDocTab('outgoing')} className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${activeDocTab === 'outgoing' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400'}`}>Đi</button>
                                </div>
                                <input type="text" value={docSearch} onChange={(e) => setDocSearch(e.target.value)} placeholder="Tìm kiếm văn bản..." className="flex-1 px-4 py-2 bg-gray-50 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div className="flex-1 overflow-auto p-4">
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead className="bg-gray-50/80 text-gray-400 font-black text-[11px] uppercase border-b tracking-widest">
                                        <tr><th className="px-8 py-4">Số hiệu</th><th className="px-8 py-4">Ngày</th><th className="px-8 py-4">Trích yếu nội dung</th><th className="px-8 py-4 text-center">Thao tác</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredAllDocs.map((doc: any) => (
                                            <tr key={doc.id} className="hover:bg-blue-50/20 transition-colors">
                                                <td className="px-8 py-5 font-black text-gray-900">{doc.number}</td>
                                                <td className="px-8 py-5 font-bold text-gray-500">{doc.date}</td>
                                                <td className="px-8 py-5 text-gray-600 font-medium max-w-xs truncate">{doc.content}</td>
                                                <td className="px-8 py-5 text-center"><button onClick={() => setPreviewFile(doc)} className="p-2 hover:bg-blue-50 text-blue-500 rounded-xl transition-all"><Eye className="w-5 h-5" /></button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Reply Modal */}
            {isReplyModalOpen && replyingToDoc && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-black text-gray-800 flex items-center gap-2 uppercase tracking-tight">
                                <Reply className="w-5 h-5 text-blue-600" /> Trả lời văn bản
                            </h3>
                            <button onClick={() => setIsReplyModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-all text-gray-500"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Đang trả lời văn bản:</p>
                                <p className="text-sm font-bold text-blue-800 line-clamp-1">{replyingToDoc.number} - {replyingToDoc.content}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Số hiệu văn bản đi</label>
                                    <input type="text" value={replyNumber} onChange={(e) => setReplyNumber(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Ngày ban hành</label>
                                    <input type="date" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" defaultValue={new Date().toISOString().split('T')[0]} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Trích yếu nội dung</label>
                                <textarea value={replyContent} onChange={(e) => setReplyContent(e.target.value)} rows={4} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none" placeholder="Nhập nội dung trả lời..." />
                            </div>

                            {/* File Attachment UI */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Tệp đính kèm</label>
                                <div
                                    className="border border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 hover:border-blue-400 transition-all bg-white group"
                                    onClick={() => document.getElementById('reply-file-upload')?.click()}
                                >
                                    <input
                                        type="file"
                                        id="reply-file-upload"
                                        className="hidden"
                                        multiple
                                        onChange={handleFileSelect}
                                    />
                                    <div className="p-3 bg-gray-50 rounded-full mb-2 group-hover:scale-110 transition-transform">
                                        <Paperclip className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
                                    </div>
                                    <p className="text-xs font-bold text-gray-600 group-hover:text-blue-600 transition-colors">Nhấn để tải lên tệp đính kèm</p>
                                    <p className="text-[10px] text-gray-400 mt-1">Hỗ trợ PDF, Word, Excel, Ảnh (Tối đa 50MB)</p>
                                </div>
                                {replyFiles.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                        {replyFiles.map((file, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100 animate-in fade-in slide-in-from-bottom-1">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <Paperclip className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                                    <span className="text-xs font-medium text-gray-700 truncate">{file.name}</span>
                                                    <span className="text-[10px] text-gray-400">({(file.size / 1024).toFixed(0)} KB)</span>
                                                </div>
                                                <button onClick={() => removeReplyFile(idx)} className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-all"><X className="w-3.5 h-3.5" /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setIsReplyModalOpen(false)} className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-200 transition-all">Hủy bỏ</button>
                            <button onClick={submitReply} className="px-6 py-2.5 rounded-xl text-xs font-black text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center gap-2">
                                <Send className="w-4 h-4" /> Gửi văn bản
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ProjectDetail;
