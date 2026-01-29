import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ProjectService from '../../../../services/ProjectService';
import { formatCurrency } from '../../../../utils/format';
import {
    Coins, TrendingUp, Wallet, ArrowUpRight,
    Calendar, FileCode, Landmark
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

interface ProjectCapitalTabProps {
    projectID: string;
}

export const ProjectCapitalTab: React.FC<ProjectCapitalTabProps> = ({ projectID }) => {
    const { data, isLoading } = useQuery({
        queryKey: ['project-capital', projectID],
        queryFn: () => ProjectService.getCapitalInfo(projectID)
    });

    const [activeSection, setActiveSection] = useState<'allocations' | 'disbursements'>('disbursements');

    if (isLoading) return <div className="p-8 text-center text-gray-500">Đang tải dữ liệu vốn...</div>;
    if (!data) return <div className="p-8 text-center text-red-500">Không có dữ liệu vốn</div>;

    const { allocations, disbursements, summary } = data;

    // Prepare chart data (Monthly disbursement)
    const chartData = disbursements.reduce((acc: any[], dis) => {
        const month = new Date(dis.Date).getMonth() + 1;
        const existing = acc.find(item => item.month === `T${month}`);
        if (existing) {
            existing.amount += dis.Amount;
        } else {
            acc.push({ month: `T${month}`, amount: dis.Amount });
        }
        return acc;
    }, []).sort((a, b) => parseInt(a.month.substring(1)) - parseInt(b.month.substring(1)));

    const disbursementRate = summary.totalAllocated > 0
        ? Math.round((summary.totalDisbursed / summary.totalAllocated) * 100)
        : 0;

    return (
        <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-gray-500 text-sm font-medium">Tổng mức đầu tư</p>
                        <h3 className="text-xl font-bold text-gray-800 mt-1">{formatCurrency(summary.totalInvestment)}</h3>
                        <p className="text-xs text-gray-400 mt-2">Đã bố trí: {Math.round((summary.totalAllocated / summary.totalInvestment) * 100)}%</p>
                    </div>
                    <Coins className="absolute right-2 bottom-2 text-gray-100 -z-0 w-16 h-16" />
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-gray-500 text-sm font-medium">Kế hoạch vốn (Lũy kế)</p>
                    <h3 className="text-xl font-bold text-blue-700 mt-1">{formatCurrency(summary.totalAllocated)}</h3>
                    <div className="w-full bg-blue-100 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div className="bg-blue-600 h-full" style={{ width: '100%' }}></div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-gray-500 text-sm font-medium">Đã giải ngân</p>
                    <h3 className="text-xl font-bold text-green-700 mt-1">{formatCurrency(summary.totalDisbursed)}</h3>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                            {disbursementRate}% KH
                        </span>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-gray-500 text-sm font-medium">Số dư chưa giải ngân</p>
                    <h3 className="text-xl font-bold text-orange-600 mt-1">
                        {formatCurrency(summary.totalAllocated - summary.totalDisbursed)}
                    </h3>
                    <div className="flex items-center gap-1 text-orange-500 mt-2 text-xs">
                        <AlertCircle className="w-3 h-3" />
                        <span>Cần đẩy nhanh tiến độ</span>
                    </div>
                </div>
            </div>

            {/* Main Content: Chart & Detail Table */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Chart */}
                <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        Biểu đồ giải ngân năm nay
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                                <YAxis hide />
                                <Tooltip
                                    cursor={{ fill: '#f3f4f6' }}
                                    formatter={(value: number) => formatCurrency(value)}
                                />
                                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill="#3b82f6" fillOpacity={0.8} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right: Recent Activity / Allocation List */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-purple-600" />
                        Nguồn vốn bố trí
                    </h3>
                    <div className="space-y-3">
                        {allocations.map(alloc => (
                            <div key={alloc.AllocationID} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-semibold text-gray-700">Năm {alloc.Year}</span>
                                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                                        {alloc.Source === 'NganSachTrungUong' ? 'NSTW' : 'NSĐP'}
                                    </span>
                                </div>
                                <div className="text-lg font-bold text-gray-800">
                                    {formatCurrency(alloc.Amount)}
                                </div>
                                <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500 flex justify-between">
                                    <span>QĐ: {alloc.DecisionNumber}</span>
                                    <span>{alloc.DateAssigned}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Detailed Disbursement Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">Lịch sử giải ngân</h3>
                    <button className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1">
                        Xem tất cả <ArrowUpRight className="w-3 h-3" />
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 font-medium">
                            <tr>
                                <th className="px-6 py-3">Ngày Giao dịch</th>
                                <th className="px-6 py-3">Nội dung thanh toán</th>
                                <th className="px-6 py-3">Số tiền</th>
                                <th className="px-6 py-3">Trạng thái</th>
                                <th className="px-6 py-3">Chứng từ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {disbursements.map((dis) => (
                                <tr key={dis.DisbursementID} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-gray-600 font-mono">
                                        {dis.Date}
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-gray-800 font-medium line-clamp-1">{dis.Description}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">Mã: {dis.DisbursementID}</p>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-gray-800">
                                        {formatCurrency(dis.Amount)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium 
                                            ${dis.Status === 'Approved' ? 'bg-green-100 text-green-700' :
                                                dis.Status === 'Pending' ? 'bg-orange-100 text-orange-700' :
                                                    'bg-red-100 text-red-700'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full 
                                                ${dis.Status === 'Approved' ? 'bg-green-500' :
                                                    dis.Status === 'Pending' ? 'bg-orange-500' :
                                                        'bg-red-500'}`}></span>
                                            {dis.Status === 'Approved' ? 'Đã duyệt' :
                                                dis.Status === 'Pending' ? 'Chờ duyệt' : 'Từ chối'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        <FileCode className="w-4 h-4 cursor-pointer hover:text-blue-600" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// Simple Icon for missing Import
const AlertCircle = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
);
