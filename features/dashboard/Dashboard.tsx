import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { Wallet, Activity, TrendingUp, AlertCircle, CheckCircle2, FileBox, Users, HardHat, Clock, ArrowRight, AlertTriangle, Calendar, Building2, Briefcase, Map as MapIcon } from 'lucide-react';
import { formatShortCurrency as formatCurrency } from '../../utils/format';
import InteractiveMap from '../../components/common/InteractiveMap';
import { DashboardService } from '../../services/DashboardService';
import { ProjectService } from '../../services/ProjectService';

// --- COMPONENTS ---

const StatCard: React.FC<{
    title: string;
    value: string;
    icon: React.ElementType;
    trend?: string;
    trendUp?: boolean;
    bgIcon: string;
    textIcon: string;
    description?: string;
    loading?: boolean;
}> = ({ title, value, icon: Icon, trend, trendUp, bgIcon, textIcon, description, loading }) => (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col justify-between h-36 relative overflow-hidden group hover:shadow-md transition-all duration-300">
        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 ${textIcon}`}>
            <Icon className="w-24 h-24" />
        </div>
        <div className="flex justify-between items-start relative z-10">
            <div className={`p-2.5 rounded-xl ${bgIcon} border border-white/50 dark:border-slate-600/50 shadow-sm`}>
                <Icon className={`w-5 h-5 ${textIcon}`} />
            </div>
            {trend && !loading && (
                <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border ${trendUp ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800'}`}>
                    <TrendingUp className={`w-3 h-3 ${trendUp ? '' : 'rotate-180'}`} /> {trend}
                </span>
            )}
        </div>
        <div className="relative z-10">
            {loading ? (
                <div className="h-8 w-24 bg-gray-200 dark:bg-slate-700 rounded animate-pulse my-1"></div>
            ) : (
                <h3 className="text-2xl font-black text-gray-800 dark:text-slate-100 tracking-tight my-1">{value}</h3>
            )}
            <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{title}</p>
            {description && <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1 font-medium">{description}</p>}
        </div>
    </div>
);

const Dashboard: React.FC = () => {
    // --- DATA FETCHING ---
    const { data: metrics, isLoading: loadingMetrics } = useQuery({
        queryKey: ['dashboard', 'metrics'],
        queryFn: DashboardService.getMetrics
    });

    const { data: disbursementData, isLoading: loadingDisbursement } = useQuery({
        queryKey: ['dashboard', 'disbursement'],
        queryFn: DashboardService.getDisbursementChart
    });

    const { data: risks, isLoading: loadingRisks } = useQuery({
        queryKey: ['dashboard', 'risks'],
        queryFn: DashboardService.getRisks
    });

    const { data: projectStatusData, isLoading: loadingStatus } = useQuery({
        queryKey: ['dashboard', 'projectStatus'],
        queryFn: DashboardService.getProjectStatusDistribution
    });

    const { data: groupData, isLoading: loadingGroups } = useQuery({
        queryKey: ['dashboard', 'groups'],
        queryFn: DashboardService.getGroupDistribution
    });

    const { data: deadlines, isLoading: loadingDeadlines } = useQuery({
        queryKey: ['dashboard', 'deadlines'],
        queryFn: DashboardService.getDeadlines
    });

    const { data: gpmbData, isLoading: loadingGPMB } = useQuery({
        queryKey: ['dashboard', 'gpmb'],
        queryFn: DashboardService.getGPMBData
    });

    const { data: contractors, isLoading: loadingContractors } = useQuery({
        queryKey: ['dashboard', 'contractors'],
        queryFn: DashboardService.getTopContractors
    });

    const { data: projects, isLoading: loadingProjects } = useQuery({
        queryKey: ['projects', 'all'],
        queryFn: () => ProjectService.getAll()
    });

    return (
        <div className="space-y-8 pb-20 font-sans">
            {/* HEADER SECTION */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-black text-gray-800 dark:text-slate-100 tracking-tight uppercase">Trung tâm điều hành — Ban QLDA ĐTXD CN</h2>
                    <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Cập nhật dữ liệu: {new Date().toLocaleDateString('vi-VN')}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 text-sm font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 shadow-sm transition-all flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Tháng 12/2025
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-blue-900/30 transition-all flex items-center gap-2">
                        <FileBox className="w-4 h-4" /> Xuất báo cáo
                    </button>
                </div>
            </div>

            {/* 1. KEY METRICS ROW */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Tổng vốn đầu tư"
                    value={metrics ? formatCurrency(metrics.totalInvestment) : '0'}
                    icon={Wallet}
                    trend="+12% so với 2024"
                    trendUp={true}
                    bgIcon="bg-blue-50"
                    textIcon="text-blue-600"
                    description="Dự án đang quản lý"
                    loading={loadingMetrics}
                />
                <StatCard
                    title="Giá trị giải ngân"
                    value={metrics ? formatCurrency(metrics.totalDisbursed) : '0'}
                    icon={Activity}
                    trend="92% Kế hoạch năm"
                    trendUp={true}
                    bgIcon="bg-emerald-50"
                    textIcon="text-emerald-600"
                    description={metrics ? `Đạt ${metrics.disbursementRate.toFixed(1)}% tổng vốn` : ''}
                    loading={loadingMetrics}
                />
                <StatCard
                    title="Giá trị KL nghiệm thu"
                    value={metrics ? formatCurrency(metrics.totalVolumeValue) : '0'}
                    icon={CheckCircle2}
                    bgIcon="bg-purple-50"
                    textIcon="text-purple-600"
                    description="Đã được phê duyệt"
                    trend="+8% yêu cầu mới"
                    trendUp={true}
                    loading={loadingMetrics}
                />
                <StatCard
                    title="Cảnh báo rủi ro"
                    value={metrics ? metrics.riskCount.toString() : '0'}
                    icon={AlertCircle}
                    bgIcon="bg-red-50"
                    textIcon="text-red-600"
                    description="Cần xử lý ngay"
                    trend="Tăng 1 cảnh báo"
                    trendUp={false}
                    loading={loadingMetrics}
                />
            </div>

            {/* 2. MAP & ALERTS ROW */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-[500px]">
                {/* Map Section (2/3 width) */}
                <div className="xl:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 relative overflow-hidden h-full flex flex-col">
                    <div className="flex justify-between items-center mb-4 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg"><MapIcon className="w-5 h-5" /></div>
                            <h3 className="text-sm font-black text-gray-800 dark:text-slate-100 uppercase tracking-widest">Bản đồ vị trí dự án</h3>
                        </div>
                    </div>

                    <div className="flex-1 w-full bg-gray-100 dark:bg-slate-700 rounded-2xl relative border border-gray-200 dark:border-slate-600 overflow-hidden z-0">
                        {loadingProjects ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                            </div>
                        ) : (
                            <InteractiveMap projects={projects || []} />
                        )}

                        {/* Legend Overlay */}
                        <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-3 rounded-xl border border-gray-200 dark:border-slate-600 shadow-lg z-[1000]">
                            <h4 className="text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Chú thích</h4>
                            <div className="space-y-2">
                                {projectStatusData?.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-sm" style={{ backgroundColor: item.color }}></span>
                                        <span className="text-[10px] font-bold text-gray-600 dark:text-slate-300">{item.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ALERTS SECTION */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-red-100 dark:border-red-900/50 relative overflow-hidden h-full flex flex-col">
                    <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none"><AlertTriangle className="w-32 h-32 text-red-500" /></div>
                    <h3 className="text-sm font-black text-red-600 uppercase tracking-widest mb-4 flex items-center gap-2 relative z-10 shrink-0">
                        <AlertTriangle className="w-4 h-4" /> Cảnh báo quan trọng
                    </h3>
                    <div className="space-y-3 relative z-10 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {loadingRisks ? (
                            <div className="space-y-2">
                                <div className="h-16 bg-red-50/50 rounded-xl animate-pulse"></div>
                                <div className="h-16 bg-red-50/50 rounded-xl animate-pulse"></div>
                                <div className="h-16 bg-red-50/50 rounded-xl animate-pulse"></div>
                            </div>
                        ) : (
                            risks?.map(r => (
                                <div key={r.id} className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 rounded-xl flex items-start gap-3 transition-transform hover:scale-[1.02] cursor-pointer">
                                    <div className="p-1.5 bg-white dark:bg-slate-700 rounded-lg text-red-500 shadow-sm shrink-0">
                                        <AlertCircle className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-red-800 leading-snug">{r.msg}</p>
                                        <p className="text-[10px] text-red-500 mt-1 font-medium">{r.date}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <button className="w-full mt-4 py-2 bg-white dark:bg-slate-700 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0">
                        Xem chi tiết báo cáo rủi ro
                    </button>
                </div>
            </div>

            {/* 3. MAIN CONTENT GRID */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Main Content Column (2/3) */}
                <div className="xl:col-span-2 space-y-6">
                    {/* PORTFOLIO STATUS ROW (Horizontal / Compact) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Pie Chart: Project Status */}
                        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-48">
                            <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest mb-2 flex items-center gap-2 shrink-0">
                                <Activity className="w-4 h-4 text-blue-500" /> Giai đoạn dự án
                            </h3>
                            {loadingStatus ? (
                                <div className="h-full w-full bg-gray-50 rounded-xl animate-pulse"></div>
                            ) : (
                                <div className="flex-1 flex items-center gap-4">
                                    <div className="relative w-32 h-32 shrink-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={projectStatusData} cx="50%" cy="50%" innerRadius={40} outerRadius={55} paddingAngle={5} dataKey="value">
                                                    {projectStatusData?.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                                                </Pie>
                                                <RechartsTooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <span className="text-xl font-black text-gray-800 dark:text-slate-100">{projects?.length || 0}</span>
                                            <span className="text-[9px] text-gray-400 dark:text-slate-500 font-bold uppercase">Dự án</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 grid grid-cols-1 gap-2 overflow-y-auto pr-1 custom-scrollbar max-h-32">
                                        {projectStatusData?.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between group">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <div className="w-2 h-2 rounded-full shrink-0 group-hover:scale-125 transition-transform" style={{ backgroundColor: item.color }}></div>
                                                    <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400 truncate group-hover:text-gray-700 dark:group-hover:text-slate-200 transition-colors" title={item.name}>{item.name}</span>
                                                </div>
                                                <span className="text-[11px] font-black text-gray-800 dark:text-slate-100">{item.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Pie Chart: Groups */}
                        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col h-48">
                            <h3 className="text-xs font-black text-gray-800 dark:text-slate-100 uppercase tracking-widest mb-2 flex items-center gap-2 shrink-0">
                                <Building2 className="w-4 h-4 text-purple-500" /> Phân loại nhóm dự án
                            </h3>
                            {loadingGroups ? (
                                <div className="h-full w-full bg-gray-50 rounded-xl animate-pulse"></div>
                            ) : (
                                <div className="flex-1 flex items-center gap-4">
                                    <div className="relative w-32 h-32 shrink-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={groupData} cx="50%" cy="50%" innerRadius={40} outerRadius={55} paddingAngle={5} dataKey="value">
                                                    {groupData?.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                                                </Pie>
                                                <RechartsTooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <span className="text-xl font-black text-gray-800 dark:text-slate-100">100%</span>
                                            <span className="text-[9px] text-gray-400 dark:text-slate-500 font-bold uppercase">Cơ cấu</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 grid grid-cols-1 gap-2 overflow-y-auto pr-1 custom-scrollbar max-h-32">
                                        {groupData?.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between group">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <div className="w-2 h-2 rounded-full shrink-0 group-hover:scale-125 transition-transform" style={{ backgroundColor: item.color }}></div>
                                                    <span className="text-[11px] font-bold text-gray-500 truncate group-hover:text-gray-700 transition-colors" title={item.name}>{item.name}</span>
                                                </div>
                                                <span className="text-[11px] font-black text-gray-800 dark:text-slate-100">{item.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Disbursement Chart (Full Width in column) */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg"><TrendingUp className="w-5 h-5" /></div>
                                <h3 className="text-sm font-black text-gray-800 dark:text-slate-100 uppercase tracking-widest">Biểu đồ giải ngân & Kế hoạch vốn</h3>
                            </div>
                            <div className="flex gap-2">
                                <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500 dark:text-slate-400"><div className="w-2 h-2 rounded bg-[#0ea5e9]"></div> Giải ngân</span>
                                <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500 dark:text-slate-400"><div className="w-2 h-2 rounded bg-gray-300 dark:bg-slate-500"></div> Kế hoạch</span>
                            </div>
                        </div>
                        <div className="h-80 w-full">
                            {loadingDisbursement ? (
                                <div className="h-full w-full bg-gray-50 rounded-xl animate-pulse"></div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={disbursementData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barGap={0}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11, fontWeight: 600 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11, fontWeight: 600 }} tickFormatter={(val) => `${val / 1000} Tỷ`} />
                                        <RechartsTooltip
                                            cursor={{ fill: '#F3F4F6' }}
                                            contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                            labelStyle={{ display: 'none' }}
                                            formatter={(value: any, name: string) => [formatCurrency(value * 1000000000), name === 'disbursement' ? 'Thực hiện' : 'Kế hoạch']}
                                        />
                                        <Bar dataKey="plan" fill="#D1D5DB" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                        <Bar dataKey="disbursement" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* NEW WIDGET FOR DIRECTOR: LEGAL & SITE CLEARANCE MONITOR */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-orange-100 dark:border-orange-900/50 flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-black text-gray-800 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
                                <FileBox className="w-4 h-4 text-orange-500" /> Theo dõi Vướng mắc (GPMB & Pháp lý)
                            </h3>
                            <button className="text-[10px] font-bold text-blue-600 hover:underline">Chi tiết</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Legal Issues */}
                            <div className="p-4 bg-orange-50/50 dark:bg-orange-900/20 rounded-2xl border border-orange-100 dark:border-orange-800/50">
                                <h4 className="text-[11px] font-bold text-orange-800 uppercase mb-3 flex items-center gap-2">
                                    <Briefcase className="w-3 h-3" /> Hồ sơ pháp lý
                                </h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-600 font-medium">Chờ phê duyệt chủ trương</span>
                                        <span className="text-xs font-black text-gray-800 bg-white px-2 py-0.5 rounded border border-gray-100 shadow-sm">3 dự án</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-600 font-medium">Đang điều chỉnh TMĐT</span>
                                        <span className="text-xs font-black text-orange-600 bg-white px-2 py-0.5 rounded border border-orange-100 shadow-sm">1 dự án</span>
                                    </div>
                                    <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2 overflow-hidden">
                                        <div className="bg-orange-400 h-full rounded-full" style={{ width: '65%' }}></div>
                                    </div>
                                    <p className="text-[9px] text-gray-400 text-right mt-1">Hoàn thành 65% hồ sơ năm</p>
                                </div>
                            </div>

                            {/* Site Clearance (GPMB) */}
                            <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/50">
                                <h4 className="text-[11px] font-bold text-blue-800 uppercase mb-3 flex items-center gap-2">
                                    <MapIcon className="w-3 h-3" /> Giải phóng mặt bằng
                                </h4>
                                {loadingGPMB ? (
                                    <div className="h-24 bg-blue-100/50 rounded-xl animate-pulse"></div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-600 font-medium">Vướng mắc mặt bằng</span>
                                            <span className="text-xs font-black text-red-600 bg-white px-2 py-0.5 rounded border border-red-100 shadow-sm animate-pulse">{gpmbData?.bottlenecks || 0} điểm nghẽn</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-600 font-medium">Đã bàn giao mặt bằng</span>
                                            <span className="text-xs font-black text-emerald-600 bg-white px-2 py-0.5 rounded border border-emerald-100 shadow-sm">{gpmbData?.handedOverPercent || 0}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2 overflow-hidden">
                                            <div className="bg-blue-500 h-full rounded-full" style={{ width: `${gpmbData?.handedOverPercent || 0}%` }}></div>
                                        </div>
                                        <p className="text-[9px] text-gray-400 text-right mt-1">Tăng 5% so với tháng trước</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Column (1/3) */}
                <div className="space-y-6">
                    {/* UPCOMING DEADLINES - Mocked from Tasks */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-black text-gray-800 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
                                <Clock className="w-4 h-4 text-orange-500" /> Sắp đến hạn
                            </h3>
                            <span className="text-[10px] bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-md font-bold">7 ngày tới</span>
                        </div>
                        <div className="space-y-4">
                            {loadingDeadlines ? (
                                <div className="space-y-3">
                                    <div className="h-12 bg-gray-50 rounded-lg animate-pulse"></div>
                                    <div className="h-12 bg-gray-50 rounded-lg animate-pulse"></div>
                                </div>
                            ) : (
                                deadlines?.map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                                        <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${item.urgent ? 'bg-red-500 animate-pulse' : 'bg-orange-400'}`}></div>
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-gray-800 dark:text-slate-100 line-clamp-1">{item.title}</p>
                                            <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5 mb-1">{item.project}</p>
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${item.urgent ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800' : 'bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-slate-400 border-gray-100 dark:border-slate-600'}`}>
                                                Hạn: {item.due}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* ACTIVE CONTRACTORS SUMMARY */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-black text-gray-800 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
                                <HardHat className="w-4 h-4 text-gray-600" /> Nhà thầu chính
                            </h3>
                        </div>
                        <div className="space-y-4">
                            {loadingContractors ? (
                                <div className="space-y-3">
                                    <div className="h-10 bg-gray-50 rounded-full animate-pulse"></div>
                                    <div className="h-10 bg-gray-50 rounded-full animate-pulse"></div>
                                </div>
                            ) : (
                                contractors?.map((c, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-100 dark:border-blue-800">
                                            {c.ContractorID.substring(0, 2)}
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="text-xs font-bold text-gray-800 dark:text-slate-100 truncate" title={c.FullName}>{c.FullName}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <div className="flex items-center gap-0.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                    <span className="text-[9px] text-gray-500 font-medium">Đang thi công</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
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