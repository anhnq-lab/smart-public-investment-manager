import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import ProjectService from '../../../../services/ProjectService';

import { formatCurrency } from '../../../../utils/format';
import { Disbursement, CapitalAllocation } from '../../../../types';
import {
    Coins, TrendingUp, Wallet, AlertTriangle,
    Calendar, FileText, Landmark, DollarSign, FileDown,
    ArrowDownUp, Receipt, RefreshCcw, RotateCcw
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';

interface ProjectCapitalTabProps {
    projectID: string;
}

// Color constants
const COLORS = {
    tamUng: '#f59e0b',
    klht: '#3b82f6',
    thuHoi: '#10b981',
    pending: '#f97316',
    rejected: '#ef4444',
};

const SOURCE_COLORS: Record<string, string> = {
    NganSachTrungUong: '#3b82f6',
    NganSachDiaPhuong: '#8b5cf6',
    ODA: '#06b6d4',
    Khac: '#6b7280',
};

const SOURCE_LABELS: Record<string, string> = {
    NganSachTrungUong: 'NSTW',
    NganSachDiaPhuong: 'NSĐP',
    ODA: 'ODA',
    Khac: 'Khác',
};

const TYPE_LABELS: Record<string, string> = {
    TamUng: 'Tạm ứng',
    ThanhToanKLHT: 'TT KLHT',
    ThuHoiTamUng: 'Thu hồi TƯ',
};

type DisbursementFilter = 'all' | 'TamUng' | 'ThanhToanKLHT' | 'ThuHoiTamUng';

export const ProjectCapitalTab: React.FC<ProjectCapitalTabProps> = ({ projectID }) => {
    const { data, isLoading } = useQuery({
        queryKey: ['project-capital', projectID],
        queryFn: () => ProjectService.getCapitalInfo(projectID)
    });

    const [disbursementFilter, setDisbursementFilter] = useState<DisbursementFilter>('all');

    // Safe destructure — hooks must always run regardless of data
    const allocations = data?.allocations ?? [];
    const disbursements = data?.disbursements ?? [];
    const summary = data?.summary ?? {
        totalInvestment: 0, totalAllocated: 0, totalDisbursed: 0,
        totalAdvance: 0, advanceRecovered: 0, advanceBalance: 0,
        completionPayment: 0, disbursementRate: 0, yearlyTarget: 0, yearlyDisbursed: 0,
    };

    // ── Computed Data ──
    const filteredDisbursements = disbursementFilter === 'all'
        ? disbursements
        : disbursements.filter(d => d.Type === disbursementFilter);

    // Monthly chart data — stacked by type
    const monthlyChartData = useMemo(() => {
        const map = new Map<string, { month: string; tamUng: number; klht: number; thuHoi: number }>();
        disbursements.forEach(d => {
            if (d.Status !== 'Approved') return;
            const dt = new Date(d.Date);
            const key = `${dt.getFullYear()}-T${dt.getMonth() + 1}`;
            const label = `T${dt.getMonth() + 1}/${dt.getFullYear().toString().slice(2)}`;
            if (!map.has(key)) map.set(key, { month: label, tamUng: 0, klht: 0, thuHoi: 0 });
            const entry = map.get(key)!;
            if (d.Type === 'TamUng') entry.tamUng += d.Amount;
            else if (d.Type === 'ThanhToanKLHT') entry.klht += d.Amount;
            else if (d.Type === 'ThuHoiTamUng') entry.thuHoi += d.Amount;
        });
        return Array.from(map.values());
    }, [disbursements]);

    // Donut chart — allocations by source
    const sourceChartData = useMemo(() => {
        const map = new Map<string, number>();
        allocations.forEach(a => {
            map.set(a.Source, (map.get(a.Source) || 0) + a.Amount);
        });
        return Array.from(map.entries()).map(([source, value]) => ({
            name: SOURCE_LABELS[source] || source,
            value,
            color: SOURCE_COLORS[source] || '#6b7280',
        }));
    }, [allocations]);

    // Alerts
    const alerts = useMemo(() => {
        const result: { level: string; message: string; icon: React.ReactNode }[] = [];
        const currentMonth = new Date().getMonth() + 1;

        if (summary.disbursementRate < 50 && currentMonth >= 6) {
            result.push({
                level: 'high',
                message: `Tỷ lệ giải ngân mới đạt ${summary.disbursementRate}% — cần đẩy nhanh tiến độ hồ sơ thanh toán.`,
                icon: <AlertTriangle className="w-4 h-4" />,
            });
        }
        if (summary.advanceBalance > 0) {
            result.push({
                level: 'medium',
                message: `Số dư tạm ứng chưa thu hồi: ${formatCurrency(summary.advanceBalance)}. Cần hoàn tất nghiệm thu để thu hồi.`,
                icon: <RotateCcw className="w-4 h-4" />,
            });
        }
        if (summary.yearlyTarget > 0 && summary.yearlyDisbursed < summary.yearlyTarget * 0.3 && currentMonth >= 6) {
            result.push({
                level: 'medium',
                message: `Giải ngân năm nay mới đạt ${Math.round((summary.yearlyDisbursed / summary.yearlyTarget) * 100)}% kế hoạch.`,
                icon: <Calendar className="w-4 h-4" />,
            });
        }
        return result;
    }, [summary]);

    // Per-allocation disbursement rate
    const allocationWithRate = useMemo(() => {
        return allocations.map(a => {
            const disbursed = disbursements
                .filter(d => d.AllocationID === a.AllocationID && d.Status === 'Approved' && d.Type !== 'ThuHoiTamUng')
                .reduce((s, d) => s + d.Amount, 0);
            const recovered = disbursements
                .filter(d => d.AllocationID === a.AllocationID && d.Status === 'Approved' && d.Type === 'ThuHoiTamUng')
                .reduce((s, d) => s + d.Amount, 0);
            return { ...a, disbursed: disbursed - recovered, rate: a.Amount > 0 ? ((disbursed - recovered) / a.Amount) * 100 : 0 };
        });
    }, [allocations, disbursements]);

    // Early returns AFTER all hooks
    if (isLoading) return <div className="p-8 text-center text-gray-500 dark:text-slate-400">Đang tải dữ liệu vốn...</div>;
    if (!data) return <div className="p-8 text-center text-red-500 dark:text-red-400">Không có dữ liệu vốn</div>;

    return (
        <div className="space-y-6">
            {/* ════════════════════════════════════════════
                SECTION A — KPI Dashboard (6 cards)
               ════════════════════════════════════════════ */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <KPICard
                    label="Tổng mức đầu tư"
                    value={formatCurrency(summary.totalInvestment)}
                    sub={`Đã bố trí: ${summary.totalAllocated > 0 ? Math.round((summary.totalAllocated / summary.totalInvestment) * 100) : 0}%`}
                    icon={<Coins className="w-5 h-5" />}
                    iconBg="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                />
                <KPICard
                    label="KH vốn lũy kế"
                    value={formatCurrency(summary.totalAllocated)}
                    sub={`${allocations.length} đợt bố trí`}
                    icon={<Landmark className="w-5 h-5" />}
                    iconBg="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                    valueColor="text-blue-700"
                />
                <KPICard
                    label="KH vốn năm nay"
                    value={formatCurrency(summary.yearlyTarget)}
                    sub={`Giải ngân: ${formatCurrency(summary.yearlyDisbursed)}`}
                    icon={<Calendar className="w-5 h-5" />}
                    iconBg="bg-indigo-100 text-indigo-600"
                    valueColor="text-indigo-700"
                />
                <KPICard
                    label="Đã giải ngân"
                    value={formatCurrency(summary.totalDisbursed)}
                    icon={<TrendingUp className="w-5 h-5" />}
                    iconBg="bg-emerald-100 text-emerald-600"
                    valueColor="text-emerald-700"
                    progress={summary.disbursementRate}
                    progressColor="bg-emerald-500"
                />
                <KPICard
                    label="Tạm ứng"
                    value={formatCurrency(summary.totalAdvance)}
                    sub={`Chưa thu hồi: ${formatCurrency(summary.advanceBalance)}`}
                    icon={<Receipt className="w-5 h-5" />}
                    iconBg="bg-amber-100 text-amber-600"
                    valueColor="text-amber-700"
                />
                <KPICard
                    label="TT KLHT"
                    value={formatCurrency(summary.completionPayment)}
                    sub="Thanh toán khối lượng HT"
                    icon={<DollarSign className="w-5 h-5" />}
                    iconBg="bg-cyan-100 text-cyan-600"
                    valueColor="text-cyan-700"
                />
            </div>

            {/* ════════════════════════════════════════════
                SECTION B — Charts (Stacked bar + Donut)
               ════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Stacked Bar Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        Giải ngân theo tháng (NĐ 99/2021/NĐ-CP)
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyChartData} barCategoryGap="20%">
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={11} />
                                <YAxis hide />
                                <Tooltip
                                    cursor={{ fill: '#f3f4f6' }}
                                    formatter={(value: number, name: string) => {
                                        const labels: Record<string, string> = {
                                            tamUng: 'Tạm ứng',
                                            klht: 'TT KLHT',
                                            thuHoi: 'Thu hồi TƯ',
                                        };
                                        return [formatCurrency(value), labels[name] || name];
                                    }}
                                />
                                <Legend
                                    formatter={(value: string) => {
                                        const labels: Record<string, string> = {
                                            tamUng: 'Tạm ứng (Mẫu 04a)',
                                            klht: 'TT KLHT (Mẫu 03a)',
                                            thuHoi: 'Thu hồi TƯ (Mẫu 04b)',
                                        };
                                        return <span className="text-xs">{labels[value] || value}</span>;
                                    }}
                                />
                                <Bar dataKey="tamUng" stackId="a" fill={COLORS.tamUng} radius={[0, 0, 0, 0]} />
                                <Bar dataKey="klht" stackId="a" fill={COLORS.klht} radius={[0, 0, 0, 0]} />
                                <Bar dataKey="thuHoi" stackId="a" fill={COLORS.thuHoi} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Donut Chart — Nguồn vốn */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-purple-600" />
                        Phân bổ nguồn vốn
                    </h3>
                    <div className="h-52 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={sourceChartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={45}
                                    outerRadius={75}
                                    paddingAngle={3}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    labelLine={false}
                                    fontSize={10}
                                >
                                    {sourceChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="space-y-2 mt-2">
                        {sourceChartData.map((s) => (
                            <div key={s.name} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                                    <span className="text-gray-600 dark:text-slate-400">{s.name}</span>
                                </div>
                                <span className="font-bold text-gray-800 dark:text-slate-100">{formatCurrency(s.value)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ════════════════════════════════════════════
                SECTION C — Kế hoạch vốn theo năm (Allocations)
               ════════════════════════════════════════════ */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-700/50">
                    <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        Kế hoạch vốn (Luật ĐTC 2024 - 58/2024/QH15)
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-slate-400 font-semibold text-xs uppercase border-b border-gray-100 dark:border-slate-600">
                            <tr>
                                <th className="px-6 py-3">Năm</th>
                                <th className="px-6 py-3">QĐ giao vốn</th>
                                <th className="px-6 py-3 text-right">Vốn giao</th>
                                <th className="px-6 py-3 text-right">Đã giải ngân</th>
                                <th className="px-6 py-3">Tỷ lệ</th>
                                <th className="px-6 py-3">Nguồn</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                            {allocationWithRate.map(a => (
                                <tr key={a.AllocationID} className="hover:bg-blue-50/30 dark:hover:bg-slate-700 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="font-bold text-gray-800 dark:text-slate-100">Năm {a.Year}</span>
                                        <p className="text-[10px] text-gray-400 dark:text-slate-500 font-mono mt-0.5">{a.AllocationID}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-gray-700 dark:text-slate-300 font-medium">{a.DecisionNumber}</span>
                                        <p className="text-[10px] text-gray-400 dark:text-slate-500 italic mt-0.5">{a.DateAssigned}</p>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono font-bold text-blue-700 dark:text-blue-400">
                                        {formatCurrency(a.Amount)}
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono font-medium text-emerald-600 dark:text-emerald-400">
                                        {formatCurrency(a.disbursed)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-20 h-1.5 bg-gray-100 dark:bg-slate-600 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${a.rate >= 90 ? 'bg-emerald-500' : a.rate >= 50 ? 'bg-blue-500' : 'bg-orange-500'}`}
                                                    style={{ width: `${Math.min(a.rate, 100)}%` }}
                                                />
                                            </div>
                                            <span className={`text-xs font-bold ${a.rate >= 90 ? 'text-emerald-600' : a.rate >= 50 ? 'text-blue-600' : 'text-orange-600'}`}>
                                                {a.rate.toFixed(0)}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${a.Source === 'NganSachTrungUong' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                                            a.Source === 'NganSachDiaPhuong' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' :
                                                a.Source === 'ODA' ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300' :
                                                    'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300'
                                            }`}>
                                            {SOURCE_LABELS[a.Source] || a.Source}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {/* Tổng cộng */}
                            <tr className="bg-blue-50/50 dark:bg-blue-900/20 font-bold border-t border-blue-200 dark:border-blue-800">
                                <td className="px-6 py-3 text-gray-800 dark:text-slate-100" colSpan={2}>Tổng cộng</td>
                                <td className="px-6 py-3 text-right font-mono text-blue-800 dark:text-blue-400">
                                    {formatCurrency(summary.totalAllocated)}
                                </td>
                                <td className="px-6 py-3 text-right font-mono text-emerald-700 dark:text-emerald-400">
                                    {formatCurrency(summary.totalDisbursed)}
                                </td>
                                <td className="px-6 py-3">
                                    <span className={`text-sm font-bold ${summary.disbursementRate >= 50 ? 'text-emerald-600' : 'text-orange-600'}`}>
                                        {summary.disbursementRate}%
                                    </span>
                                </td>
                                <td className="px-6 py-3"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ════════════════════════════════════════════
                SECTION D — Lịch sử giải ngân chi tiết
               ════════════════════════════════════════════ */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex flex-wrap justify-between items-center gap-3">
                    <h3 className="font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
                        <ArrowDownUp className="w-4 h-4 text-emerald-600" />
                        Lịch sử giải ngân (NĐ 99/2021/NĐ-CP)
                    </h3>
                    <div className="flex items-center gap-2">
                        <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-0.5">
                            {([
                                ['all', 'Tất cả'],
                                ['TamUng', 'Tạm ứng'],
                                ['ThanhToanKLHT', 'TT KLHT'],
                                ['ThuHoiTamUng', 'Thu hồi TƯ'],
                            ] as const).map(([key, label]) => (
                                <button
                                    key={key}
                                    onClick={() => setDisbursementFilter(key)}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${disbursementFilter === key
                                        ? 'bg-white dark:bg-slate-600 text-gray-800 dark:text-slate-100 shadow-sm'
                                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-slate-400 font-semibold text-xs uppercase border-b border-gray-100 dark:border-slate-600">
                            <tr>
                                <th className="px-4 py-3">Ngày</th>
                                <th className="px-4 py-3">Nội dung</th>
                                <th className="px-4 py-3">HĐ số</th>
                                <th className="px-4 py-3 text-center">Loại</th>
                                <th className="px-4 py-3 text-center">Biểu mẫu</th>
                                <th className="px-4 py-3 text-right">Số tiền</th>
                                <th className="px-4 py-3 text-right">Lũy kế TT</th>
                                <th className="px-4 py-3 text-center">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                            {filteredDisbursements.map((d) => (
                                <tr key={d.DisbursementID} className={`hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors ${d.Type === 'ThuHoiTamUng' ? 'bg-green-50/30 dark:bg-green-900/10' :
                                    d.Type === 'TamUng' ? 'bg-amber-50/20 dark:bg-amber-900/10' : ''
                                    }`}>
                                    <td className="px-4 py-3.5 text-gray-600 dark:text-slate-400 font-mono text-xs whitespace-nowrap">
                                        {d.Date}
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <p className="text-gray-800 dark:text-slate-200 font-medium text-xs line-clamp-1">{d.Description}</p>
                                        <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5 font-mono">{d.TreasuryCode || '—'}</p>
                                    </td>
                                    <td className="px-4 py-3.5 text-xs text-gray-600 dark:text-slate-400 font-medium whitespace-nowrap">
                                        {d.ContractNumber || '—'}
                                    </td>
                                    <td className="px-4 py-3.5 text-center">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${d.Type === 'TamUng' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                                            d.Type === 'ThanhToanKLHT' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                                                d.Type === 'ThuHoiTamUng' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                                                    'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300'
                                            }`}>
                                            {d.Type === 'TamUng' && <Receipt className="w-3 h-3" />}
                                            {d.Type === 'ThanhToanKLHT' && <DollarSign className="w-3 h-3" />}
                                            {d.Type === 'ThuHoiTamUng' && <RefreshCcw className="w-3 h-3" />}
                                            {TYPE_LABELS[d.Type || ''] || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 text-center">
                                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 rounded text-[10px] font-mono font-bold">
                                            {d.FormType || '—'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 text-right font-mono font-bold">
                                        <span className={d.Type === 'ThuHoiTamUng' ? 'text-green-600 dark:text-green-400' : 'text-gray-800 dark:text-slate-100'}>
                                            {d.Type === 'ThuHoiTamUng' ? '-' : ''}{formatCurrency(d.Amount)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 text-right font-mono text-xs text-gray-500 dark:text-slate-400">
                                        {d.CumulativeBefore != null ? formatCurrency(d.CumulativeBefore + d.Amount) : '—'}
                                    </td>
                                    <td className="px-4 py-3.5 text-center">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${d.Status === 'Approved' ? 'bg-green-100 text-green-700' :
                                            d.Status === 'Pending' ? 'bg-orange-100 text-orange-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${d.Status === 'Approved' ? 'bg-green-500' :
                                                d.Status === 'Pending' ? 'bg-orange-500' : 'bg-red-500'
                                                }`} />
                                            {d.Status === 'Approved' ? 'Đã duyệt' :
                                                d.Status === 'Pending' ? 'Chờ duyệt' : 'Từ chối'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {filteredDisbursements.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-6 py-8 text-center text-gray-400 dark:text-slate-500 text-sm">
                                        Không có giao dịch nào cho bộ lọc này
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ════════════════════════════════════════════
                SECTION E — Cảnh báo rủi ro
               ════════════════════════════════════════════ */}
            {alerts.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="px-6 py-3 border-b border-gray-100 dark:border-slate-700 bg-orange-50/50 dark:bg-orange-900/20">
                        <h3 className="text-sm font-bold text-orange-800 dark:text-orange-400 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Cảnh báo giải ngân
                        </h3>
                    </div>
                    <div className="p-4 space-y-2">
                        {alerts.map((a, i) => (
                            <div key={i} className={`p-3 rounded-lg border flex items-start gap-3 ${a.level === 'high'
                                ? 'bg-red-50 border-red-200 text-red-800'
                                : 'bg-amber-50 border-amber-200 text-amber-800'
                                }`}>
                                <div className="mt-0.5">{a.icon}</div>
                                <p className="text-sm font-medium">{a.message}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════
                SECTION F — Xuất văn bản (Toolbar)
               ════════════════════════════════════════════ */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-5">
                <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Xuất văn bản thanh toán (NĐ 99/2021/NĐ-CP)
                </h3>
                <div className="flex flex-wrap gap-3">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 hover:border-gray-300 transition-all text-sm font-medium shadow-sm">
                        <FileDown className="w-4 h-4 text-amber-600" />
                        <div className="text-left">
                            <div className="font-semibold">Mẫu 25</div>
                            <div className="text-[10px] text-gray-400 dark:text-slate-500 -mt-0.5">Đề nghị thanh toán vốn</div>
                        </div>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 hover:border-gray-300 transition-all text-sm font-medium shadow-sm">
                        <FileDown className="w-4 h-4 text-blue-600" />
                        <div className="text-left">
                            <div className="font-semibold">Mẫu 26</div>
                            <div className="text-[10px] text-gray-400 dark:text-slate-500 -mt-0.5">Đề nghị rút vốn</div>
                        </div>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 hover:border-gray-300 transition-all text-sm font-medium shadow-sm">
                        <FileDown className="w-4 h-4 text-green-600" />
                        <div className="text-left">
                            <div className="font-semibold">Mẫu 27</div>
                            <div className="text-[10px] text-gray-400 dark:text-slate-500 -mt-0.5">Thu hồi vốn tạm ứng</div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ═══════════════════════════════════
   Sub-components
   ═══════════════════════════════════ */

interface KPICardProps {
    label: string;
    value: string;
    sub?: string;
    icon: React.ReactNode;
    iconBg?: string;
    valueColor?: string;
    progress?: number;
    progressColor?: string;
}

const KPICard: React.FC<KPICardProps> = ({
    label, value, sub, icon, iconBg = 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300',
    valueColor = 'text-gray-800', progress, progressColor = 'bg-blue-500'
}) => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-between mb-2">
            <div className={`p-1.5 rounded-lg ${iconBg}`}>{icon}</div>
        </div>
        <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium truncate">{label}</p>
        <h3 className={`text-lg font-bold ${valueColor} dark:text-slate-100 mt-0.5 truncate`}>{value}</h3>
        {progress != null && (
            <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-1.5 bg-gray-100 dark:bg-slate-600 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${progressColor}`} style={{ width: `${Math.min(progress, 100)}%` }} />
                </div>
                <span className="text-[10px] font-bold text-gray-600 dark:text-slate-400">{progress}%</span>
            </div>
        )}
        {sub && !progress && (
            <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1.5 truncate">{sub}</p>
        )}
    </div>
);
