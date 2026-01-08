import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend, ScatterChart, Scatter } from 'recharts';
import { Wallet, Activity, TrendingUp, AlertCircle, CheckCircle2, FileBox, Users, HardHat, Clock, ArrowRight, AlertTriangle, Calendar, Building2, Briefcase, Map } from 'lucide-react';
import { formatCurrency, mockProjects, mockPayments, mockTasks, mockEmployees, mockContractors } from '../mockData';
import { ProjectStatus, ProjectGroup, PaymentType } from '../types';
import InteractiveMap from './InteractiveMap';


// --- MOCK DATA FOR CHARTS ---
const disbursementData = [
    { name: 'T1', disbursement: 4200, plan: 4500 },
    { name: 'T2', disbursement: 3800, plan: 4000 },
    { name: 'T3', disbursement: 5100, plan: 5500 },
    { name: 'T4', disbursement: 6200, plan: 6000 }, // Over performed
    { name: 'T5', disbursement: 4800, plan: 5200 },
    { name: 'T6', disbursement: 5900, plan: 6500 },
    { name: 'T7', disbursement: 7200, plan: 8000 },
    { name: 'T8', disbursement: 0, plan: 8500 }, // Future
    { name: 'T9', disbursement: 0, plan: 9000 },
];

const projectStatusData = [
    { name: 'Đang chuẩn bị', value: mockProjects.filter(p => p.Status === ProjectStatus.Preparation).length, color: '#F59E0B' },
    { name: 'Đang thực hiện', value: mockProjects.filter(p => p.Status === ProjectStatus.Execution).length, color: '#3B82F6' },
    { name: 'Hoàn thành', value: mockProjects.filter(p => p.Status === ProjectStatus.Finished).length, color: '#10B981' },
    { name: 'Vận hành', value: mockProjects.filter(p => p.Status === ProjectStatus.Operation).length, color: '#EF4444' },
];

const groupData = [
    { name: 'Nhóm A', value: mockProjects.filter(p => p.GroupCode === ProjectGroup.A).length, color: '#8B5CF6' },
    { name: 'Nhóm B', value: mockProjects.filter(p => p.GroupCode === ProjectGroup.B).length, color: '#6366F1' },
    { name: 'Nhóm C', value: mockProjects.filter(p => p.GroupCode === ProjectGroup.C).length, color: '#EC4899' },
];

const StatCard: React.FC<{
    title: string;
    value: string;
    icon: React.ElementType;
    trend?: string;
    trendUp?: boolean;
    bgIcon: string;
    textIcon: string;
    description?: string;
}> = ({ title, value, icon: Icon, trend, trendUp, bgIcon, textIcon, description }) => (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-36 relative overflow-hidden group hover:shadow-md transition-all duration-300">
        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 ${textIcon}`}>
            <Icon className="w-24 h-24" />
        </div>
        <div className="flex justify-between items-start relative z-10">
            <div className={`p-2.5 rounded-xl ${bgIcon} border border-white/50 shadow-sm`}>
                <Icon className={`w-5 h-5 ${textIcon}`} />
            </div>
            {trend && (
                <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border ${trendUp ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                    <TrendingUp className={`w-3 h-3 ${trendUp ? '' : 'rotate-180'}`} /> {trend}
                </span>
            )}
        </div>
        <div className="relative z-10">
            <h3 className="text-2xl font-black text-gray-800 tracking-tight my-1">{value}</h3>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{title}</p>
            {description && <p className="text-[10px] text-gray-400 mt-1 font-medium">{description}</p>}
        </div>
    </div>
);

const Dashboard: React.FC = () => {
    // Aggregate Stats
    const totalInvestment = mockProjects.reduce((acc, curr) => acc + curr.TotalInvestment, 0);
    const totalDisbursed = mockPayments.filter(p => p.Status === 'Transferred').reduce((acc, curr) => acc + curr.Amount, 0);
    const disbursementRate = (totalDisbursed / totalInvestment) * 100;
    const totalVolumeValue = mockPayments.filter(p => p.Type === PaymentType.Volume).reduce((acc, curr) => acc + curr.Amount, 0);

    // Fake Alerts logic
    const risks = [
        { id: 1, type: 'budget', msg: 'Dự án Cầu Cửa Nhượng: Nguy cơ vượt tổng mức đầu tư 5%', date: '20-12-2025' },
        { id: 2, type: 'schedule', msg: 'Dự án Đường ven biển: Chậm tiến độ GPMB 2 tuần', date: '19-12-2025' },
        { id: 3, type: 'legal', msg: 'Dự án Bệnh viện Tỉnh: Thiếu giấy phép PCCC', date: '19-12-2025' },
    ];

    return (
        <div className="space-y-8 pb-20 font-sans">
            {/* HEADER SECTION */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-black text-gray-800 tracking-tight uppercase">Trung tâm điều hành</h2>
                    <p className="text-sm font-medium text-gray-500 mt-1 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Cập nhật dữ liệu: {new Date().toLocaleDateString('vi-VN')}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white border border-gray-200 text-gray-600 text-sm font-bold rounded-xl hover:bg-gray-50 shadow-sm transition-all flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Tháng 12/2025
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center gap-2">
                        <FileBox className="w-4 h-4" /> Xuất báo cáo
                    </button>
                </div>
            </div>

            {/* 1. KEY METRICS ROW */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Tổng vốn đầu tư"
                    value={formatCurrency(totalInvestment)}
                    icon={Wallet}
                    trend="+12% so với 2024"
                    trendUp={true}
                    bgIcon="bg-blue-50"
                    textIcon="text-blue-600"
                    description="Tổng 35 dự án đang quản lý"
                />
                <StatCard
                    title="Giá trị giải ngân"
                    value={formatCurrency(totalDisbursed)}
                    icon={Activity}
                    trend="92% Kế hoạch năm"
                    trendUp={true}
                    bgIcon="bg-emerald-50"
                    textIcon="text-emerald-600"
                    description={`Đạt ${disbursementRate.toFixed(1)}% tổng vốn`}
                />
                <StatCard
                    title="Giá trị KL nghiệm thu"
                    value={formatCurrency(totalVolumeValue)}
                    icon={CheckCircle2}
                    bgIcon="bg-purple-50"
                    textIcon="text-purple-600"
                    description="Đã được phê duyệt"
                    trend="+8% yêu cầu mới"
                    trendUp={true}
                />
                <StatCard
                    title="Cảnh báo rủi ro"
                    value={risks.length.toString()}
                    icon={AlertCircle}
                    bgIcon="bg-red-50"
                    textIcon="text-red-600"
                    description="Cần xử lý ngay"
                    trend="Tăng 1 cảnh báo"
                    trendUp={false}
                />
            </div>

            {/* PROJECT MAP & LOCATIONS */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Map className="w-5 h-5" /></div>
                        <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Bản đồ vị trí dự án</h3>
                    </div>
                </div>

                <div className="h-[500px] w-full bg-gray-100 rounded-2xl relative border border-gray-200 overflow-hidden z-0">
                    <InteractiveMap projects={mockProjects} />

                    {/* Legend Overlay */}
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-xl border border-gray-200 shadow-lg z-[1000]">
                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-2">Chú thích</h4>
                        <div className="space-y-2">
                            {projectStatusData.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-sm" style={{ backgroundColor: item.color }}></span>
                                    <span className="text-[10px] font-bold text-gray-600">{item.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. CHARTS & ALERTS ROW */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Main Chart (2/3 width) */}
                <div className="xl:col-span-2 space-y-8">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><TrendingUp className="w-5 h-5" /></div>
                                <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Biểu đồ giải ngân & Kế hoạch vốn</h3>
                            </div>
                            <div className="flex gap-2">
                                <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500"><div className="w-2 h-2 rounded-full bg-[#0ea5e9]"></div> Giải ngân</span>
                                <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500"><div className="w-2 h-2 rounded-full bg-gray-300"></div> Kế hoạch</span>
                            </div>
                        </div>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={disbursementData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorDisbursement" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 600 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 600 }} tickFormatter={(val) => `${val / 1000} Tỷ`} />
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                        labelStyle={{ display: 'none' }}
                                        formatter={(value: any, name: string) => [formatCurrency(value * 1000000000), name === 'disbursement' ? 'Thực hiện' : 'Kế hoạch']}
                                    />
                                    <Area type="monotone" dataKey="plan" stroke="#D1D5DB" strokeWidth={2} strokeDasharray="4 4" fill="transparent" />
                                    <Area type="monotone" dataKey="disbursement" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorDisbursement)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Portfolio Status Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Pie Chart: Project Status */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
                            <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-blue-500" /> Trạng thái dự án
                            </h3>
                            <div className="flex-1 flex items-center justify-center relative">
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie data={projectStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                            {projectStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                                        </Pie>
                                        <RechartsTooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-3xl font-black text-gray-800">{mockProjects.length}</span>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase">Dự án</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mt-4">
                                {projectStatusData.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 overflow-hidden">
                                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }}></div>
                                            <span className="text-[11px] font-bold text-gray-500 truncate" title={item.name}>{item.name}</span>
                                        </div>
                                        <span className="text-[11px] font-black text-gray-800">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Pie Chart: Groups */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
                            <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-purple-500" /> Phân loại nhóm dự án
                            </h3>
                            <div className="flex-1 flex items-center justify-center relative">
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie data={groupData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                            {groupData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                                        </Pie>
                                        <RechartsTooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-3xl font-black text-gray-800">100%</span>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase">Cơ cấu</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mt-4">
                                {groupData.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 overflow-hidden">
                                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }}></div>
                                            <span className="text-[11px] font-bold text-gray-500 truncate" title={item.name}>{item.name}</span>
                                        </div>
                                        <span className="text-[11px] font-black text-gray-800">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Column (1/3 width) - Status & Alerts */}
                <div className="space-y-6">
                    {/* ALERTS SECTION */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-red-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none"><AlertTriangle className="w-32 h-32 text-red-500" /></div>
                        <h3 className="text-sm font-black text-red-600 uppercase tracking-widest mb-4 flex items-center gap-2 relative z-10">
                            <AlertTriangle className="w-4 h-4" /> Cảnh báo quan trọng
                        </h3>
                        <div className="space-y-3 relative z-10">
                            {risks.map(r => (
                                <div key={r.id} className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                                    <div className="p-1.5 bg-white rounded-lg text-red-500 shadow-sm shrink-0">
                                        <AlertCircle className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-red-800 leading-snug">{r.msg}</p>
                                        <p className="text-[10px] text-red-500 mt-1 font-medium">{r.date}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-4 py-2 bg-white border border-red-200 text-red-600 rounded-xl text-xs font-bold hover:bg-red-50 transition-colors">
                            Xem chi tiết báo cáo rủi ro
                        </button>
                    </div>

                    {/* UPCOMING DEADLINES - Mocked from Tasks */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                                <Clock className="w-4 h-4 text-orange-500" /> Sắp đến hạn
                            </h3>
                            <span className="text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded-md font-bold">7 ngày tới</span>
                        </div>
                        <div className="space-y-4">
                            {[
                                { title: 'Trình thẩm định Báo cáo KTKT', project: 'Dự án Trường Trần Phú', due: 'Ngày mai', urgent: true },
                                { title: 'Phê duyệt Tờ trình kế hoạch', project: 'Dự án Đường ven biển', due: '22/12', urgent: false },
                                { title: 'Họp giao ban công trường', project: 'Dự án Cầu Cửa Nhượng', due: '23/12', urgent: false },
                                { title: 'Nghiệm thu đợt 1', project: 'Dự án Đê kè biển', due: '24/12', urgent: false },
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-start gap-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                                    <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${item.urgent ? 'bg-red-500 animate-pulse' : 'bg-orange-400'}`}></div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-gray-800 line-clamp-1">{item.title}</p>
                                        <p className="text-[10px] text-gray-500 mt-0.5 mb-1">{item.project}</p>
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${item.urgent ? 'bg-red-50 text-red-600 border-red-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                                            Hạn: {item.due}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ACTIVE CONTRACTORS SUMMARY */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                                <HardHat className="w-4 h-4 text-gray-600" /> Nhà thầu chính
                            </h3>
                        </div>
                        <div className="space-y-4">
                            {mockContractors.slice(0, 3).map((c, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs border border-blue-100">
                                        {c.ContractorID.substring(0, 2)}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-xs font-bold text-gray-800 truncate" title={c.FullName}>{c.FullName}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <div className="flex items-center gap-0.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                <span className="text-[9px] text-gray-500 font-medium">Đang thi công</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-4 flex items-center justify-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors">
                            Xem tất cả nhà thầu <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;