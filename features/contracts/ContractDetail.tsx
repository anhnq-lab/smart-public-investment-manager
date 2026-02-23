
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatFullCurrency } from '../../utils/format';
import { useContractors } from '../../hooks/useContractors';
import { useAllBiddingPackages } from '../../hooks/useAllBiddingPackages';
import { ContractStatus, PaymentStatus } from '../../types';
import { useContracts } from '../../hooks/useContracts';
import { usePayments } from '../../hooks/usePayments';
import { useProjects } from '../../hooks/useProjects';
import {
    ArrowLeft, FileText, Calendar, DollarSign,
    Building2, Printer, Download, Edit3,
    CheckCircle2, Clock, AlertTriangle,
    TrendingUp, Layers, FileDigit, Briefcase, ShieldCheck
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
    AreaChart, Area, Legend
} from 'recharts';

const ContractDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'general' | 'boq' | 'payment' | 'progress'>('general');

    // 1. Get Data with decoding to handle IDs containing slashes
    const contractId = decodeURIComponent(id || '');
    const { contracts } = useContracts();
    const { payments: allPayments } = usePayments();
    const { projects: allProjects } = useProjects();
    const { contractors: allContractors } = useContractors();
    const { biddingPackages: allBiddingPackages } = useAllBiddingPackages();

    const contract = contracts.find(c => c.ContractID === contractId);

    if (!contract) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-slate-900">
                <h2 className="text-xl font-bold text-gray-800 dark:text-slate-200 mb-2">Không tìm thấy hợp đồng</h2>
                <p className="text-gray-500 dark:text-slate-400 mb-4 text-sm">Mã hợp đồng: {id}</p>
                <button onClick={() => navigate(-1)} className="text-blue-600 dark:text-blue-400 hover:underline">Quay lại</button>
            </div>
        );
    }

    const pkg = allBiddingPackages.find(p => p.PackageID === contract.PackageID);
    const project = allProjects.find(p => p.ProjectID === pkg?.ProjectID);
    const contractor = allContractors.find(c => c.ContractorID === contract.ContractorID);
    const payments = allPayments.filter(p => p.ContractID === contract.ContractID);

    // 2. Calculate Financials
    const totalPaid = payments
        .filter(p => p.Status === PaymentStatus.Transferred)
        .reduce((sum, p) => sum + p.Amount, 0);
    const remaining = contract.Value - totalPaid;
    const paymentPercent = (totalPaid / contract.Value) * 100;

    // 3. Mock BOQ Data (Bill of Quantities - Phụ lục khối lượng)
    const boqItems = [
        { id: 1, name: "Chi phí xây dựng lán trại, nhà tạm", unit: "Trọn gói", qty: 1, price: contract.Value * 0.02, total: contract.Value * 0.02 },
        { id: 2, name: "Thi công phần móng và công trình ngầm", unit: "m3", qty: 500, price: contract.Value * 0.0005, total: contract.Value * 0.25 },
        { id: 3, name: "Thi công phần thân (Kết cấu BTCT)", unit: "m2", qty: 1200, price: contract.Value * 0.0003, total: contract.Value * 0.36 },
        { id: 4, name: "Công tác hoàn thiện (Xây, trát, ốp, lát)", unit: "m2", qty: 2500, price: contract.Value * 0.0001, total: contract.Value * 0.25 },
        { id: 5, name: "Hệ thống điện nước (M&E)", unit: "Hệ thống", qty: 1, price: contract.Value * 0.1, total: contract.Value * 0.10 },
        { id: 6, name: "Vệ sinh công nghiệp và bàn giao", unit: "Trọn gói", qty: 1, price: contract.Value * 0.02, total: contract.Value * 0.02 },
    ];

    // 4. Mock Progress Milestones
    const milestones = [
        { id: 1, name: "Ký kết hợp đồng & Tạm ứng", date: contract.SignDate, status: "Done" },
        { id: 2, name: "Bàn giao mặt bằng thi công", date: "2024-03-01", status: "Done" },
        { id: 3, name: "Nghiệm thu phần móng", date: "2024-05-15", status: "Done" },
        { id: 4, name: "Nghiệm thu phần thân", date: "2024-09-30", status: "In Progress" },
        { id: 5, name: "Hoàn thiện & Lắp đặt thiết bị", date: "2024-12-15", status: "Pending" },
        { id: 6, name: "Bàn giao đưa vào sử dụng", date: "2025-01-20", status: "Pending" },
    ];

    // Chart Data
    const financialData = [
        { name: 'Giá trị HĐ', value: contract.Value, fill: '#3B82F6' },
        { name: 'Đã thanh toán', value: totalPaid, fill: '#10B981' },
        { name: 'Còn lại', value: remaining, fill: '#F59E0B' },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-300 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/contracts')} className="p-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
                        <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-slate-400" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black text-gray-800 dark:text-slate-100 tracking-tight">Hợp đồng số: {contract.ContractID}</h1>
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${contract.Status === ContractStatus.Executing ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' :
                                contract.Status === ContractStatus.Liquidated ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400'
                                }`}>
                                {contract.Status === ContractStatus.Executing ? 'Đang thực hiện' : 'Đã thanh lý'}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 font-medium">{pkg?.PackageName}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 text-sm transition-colors">
                        <Printer className="w-4 h-4" /> In Hợp đồng
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 text-sm shadow-lg shadow-blue-200 dark:shadow-blue-900/30 transition-colors">
                        <Edit3 className="w-4 h-4" /> Điều chỉnh
                    </button>
                </div>
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm flex items-center justify-between relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><DollarSign className="w-24 h-24" /></div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">Giá trị hợp đồng</p>
                        <p className="text-xl font-black text-gray-900 dark:text-slate-100">{formatFullCurrency(contract.Value)}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <FileDigit className="w-6 h-6" />
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm flex items-center justify-between relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><TrendingUp className="w-24 h-24 text-emerald-600" /></div>
                    <div>
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Đã thanh toán ({paymentPercent.toFixed(1)}%)</p>
                        <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">{formatFullCurrency(totalPaid)}</p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm flex items-center justify-between relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><Clock className="w-24 h-24 text-orange-600" /></div>
                    <div>
                        <p className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-1">Giá trị còn lại</p>
                        <p className="text-xl font-black text-orange-700 dark:text-orange-300">{formatFullCurrency(remaining)}</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/30 rounded-xl flex items-center justify-center text-orange-600 dark:text-orange-400">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="border-b border-gray-100 dark:border-slate-700 px-6 flex gap-8 overflow-x-auto">
                    {[
                        { id: 'general', label: 'Thông tin chung', icon: FileText },
                        { id: 'boq', label: 'Nội dung & Khối lượng', icon: Layers },
                        { id: 'payment', label: 'Thanh toán & Giải ngân', icon: DollarSign },
                        { id: 'progress', label: 'Tiến độ thực hiện', icon: Clock },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id
                                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                                : 'border-transparent text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-8">
                    {/* TAB 1: GENERAL INFO */}
                    {activeTab === 'general' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            {/* Left Column: Contract Details */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-black text-gray-800 dark:text-slate-200 uppercase tracking-widest border-b border-gray-100 dark:border-slate-700 pb-2 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Thông tin hợp đồng
                                </h3>
                                <div className="grid grid-cols-2 gap-y-4 gap-x-4 text-sm">
                                    <div>
                                        <p className="text-xs text-gray-400 dark:text-slate-500 font-bold uppercase">Ngày ký hợp đồng</p>
                                        <p className="font-medium text-gray-800 dark:text-slate-200">{contract.SignDate}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 dark:text-slate-500 font-bold uppercase">Loại hợp đồng</p>
                                        <p className="font-medium text-gray-800 dark:text-slate-200">{pkg?.ContractType || "Trọn gói"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 dark:text-slate-500 font-bold uppercase">Thời gian thực hiện</p>
                                        <p className="font-medium text-gray-800 dark:text-slate-200">360 ngày</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 dark:text-slate-500 font-bold uppercase">Bảo hành công trình</p>
                                        <p className="font-medium text-gray-800 dark:text-slate-200 flex items-center gap-1">
                                            <ShieldCheck className="w-4 h-4 text-emerald-500" /> {contract.Warranty} tháng
                                        </p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-xs text-gray-400 font-bold uppercase">Thuộc dự án</p>
                                        <p className="font-medium text-blue-600 dark:text-blue-400 cursor-pointer hover:underline" onClick={() => navigate(`/projects/${project?.ProjectID}`)}>
                                            {project?.ProjectName}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Parties */}
                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-sm font-black text-gray-800 dark:text-slate-200 uppercase tracking-widest border-b border-gray-100 dark:border-slate-700 pb-2 flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Bên giao thầu (Bên A)
                                    </h3>
                                    <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-100 dark:border-slate-600">
                                        <p className="font-bold text-gray-800 dark:text-slate-200 text-sm">{project?.InvestorName}</p>
                                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Đại diện: Giám đốc Ban QLDA</p>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-gray-800 dark:text-slate-200 uppercase tracking-widest border-b border-gray-100 dark:border-slate-700 pb-2 flex items-center gap-2">
                                        <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Bên nhận thầu (Bên B)
                                    </h3>
                                    <div className="mt-4 p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/40">
                                        <p className="font-bold text-blue-900 dark:text-blue-200 text-sm">{contractor?.FullName}</p>
                                        <div className="mt-2 space-y-1 text-xs text-blue-800/70 dark:text-blue-300/70">
                                            <p>MST: {contractor?.ContractorID}</p>
                                            <p>Địa chỉ: {contractor?.Address}</p>
                                            <p>Liên hệ: {contractor?.ContactInfo}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: BOQ */}
                    {activeTab === 'boq' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-slate-200">Phụ lục khối lượng công việc</h3>
                                <button className="text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1">
                                    <Download className="w-4 h-4" /> Xuất Excel
                                </button>
                            </div>
                            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-700">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 dark:bg-slate-700/50 text-gray-500 dark:text-slate-400 font-bold uppercase text-xs">
                                        <tr>
                                            <th className="px-6 py-4 w-16 text-center">STT</th>
                                            <th className="px-6 py-4">Nội dung công việc</th>
                                            <th className="px-6 py-4 w-32 text-center">Đơn vị</th>
                                            <th className="px-6 py-4 w-32 text-right">Khối lượng</th>
                                            <th className="px-6 py-4 w-40 text-right">Đơn giá</th>
                                            <th className="px-6 py-4 w-40 text-right">Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                        {boqItems.map((item, idx) => (
                                            <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/50">
                                                <td className="px-6 py-4 text-center font-mono text-gray-400 dark:text-slate-500">{idx + 1}</td>
                                                <td className="px-6 py-4 font-medium text-gray-800 dark:text-slate-200">{item.name}</td>
                                                <td className="px-6 py-4 text-center text-gray-500 dark:text-slate-400">{item.unit}</td>
                                                <td className="px-6 py-4 text-right font-mono dark:text-slate-300">{item.qty.toLocaleString()}</td>
                                                <td className="px-6 py-4 text-right font-mono text-gray-600 dark:text-slate-400">{formatFullCurrency(item.price)}</td>
                                                <td className="px-6 py-4 text-right font-mono font-bold text-gray-900 dark:text-slate-100">{formatFullCurrency(item.total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-gray-50 dark:bg-slate-700/50 font-bold text-gray-900 dark:text-slate-100 border-t border-gray-200 dark:border-slate-700">
                                        <tr>
                                            <td colSpan={5} className="px-6 py-4 text-right uppercase text-xs tracking-wider">Tổng giá trị hợp đồng</td>
                                            <td className="px-6 py-4 text-right text-blue-600 dark:text-blue-400">{formatFullCurrency(contract.Value)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: PAYMENT */}
                    {activeTab === 'payment' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-slate-200 mb-6">Lịch sử thanh toán</h3>
                                <div className="space-y-4">
                                    {payments.length > 0 ? payments.map((pay) => (
                                        <div key={pay.PaymentID} className="bg-white dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 p-5 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-xl ${pay.Type === 'Advance' ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                                                    <DollarSign className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800 dark:text-slate-200 text-sm uppercase">Đợt {pay.BatchNo}: {pay.Type === 'Advance' ? 'Tạm ứng hợp đồng' : 'Thanh toán khối lượng'}</p>
                                                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 font-mono">Mã GD Kho bạc: {pay.TreasuryRef}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-black text-gray-900 dark:text-slate-100">{formatFullCurrency(pay.Amount)}</p>
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase mt-1 ${pay.Status === PaymentStatus.Transferred ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300'
                                                    }`}>
                                                    {pay.Status === PaymentStatus.Transferred ? 'Đã giải ngân' : 'Chờ xử lý'}
                                                </span>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-10 bg-gray-50 dark:bg-slate-700/30 rounded-xl border border-dashed border-gray-300 dark:border-slate-600 text-gray-400 dark:text-slate-500">
                                            Chưa có đợt thanh toán nào.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Payment Chart */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-slate-200 mb-6">Biểu đồ dòng tiền</h3>
                                <div className="bg-gray-50 dark:bg-slate-700/30 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={financialData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                            <XAxis type="number" hide />
                                            <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }} />
                                            <RechartsTooltip
                                                cursor={{ fill: 'transparent' }}
                                                formatter={(value) => formatFullCurrency(Number(value))}
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Bar dataKey="value" barSize={32} radius={[0, 6, 6, 0]}>
                                                {financialData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/40">
                                    <p className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase mb-2">Tỷ lệ hoàn thành tài chính</p>
                                    <div className="w-full bg-white dark:bg-slate-700 rounded-full h-3 mb-2 border border-blue-100 dark:border-blue-800/40">
                                        <div className="bg-blue-600 h-full rounded-full transition-all duration-1000" style={{ width: `${paymentPercent}%` }}></div>
                                    </div>
                                    <div className="flex justify-between text-xs font-medium text-blue-700 dark:text-blue-300">
                                        <span>0%</span>
                                        <span>{paymentPercent.toFixed(1)}%</span>
                                        <span>100%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 4: PROGRESS with S-CURVE */}
                    {activeTab === 'progress' && (
                        <div className="space-y-8">
                            {/* S-Curve Chart */}
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800 dark:text-slate-200">Biểu đồ S-Curve</h3>
                                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">So sánh tiến độ kế hoạch và thực tế</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                                            <span className="text-xs font-medium text-gray-600 dark:text-slate-400">Kế hoạch</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                                            <span className="text-xs font-medium text-gray-600 dark:text-slate-400">Thực tế</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-slate-700/30 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart
                                            data={[
                                                { month: 'T1', planned: 5, actual: 3 },
                                                { month: 'T2', planned: 12, actual: 8 },
                                                { month: 'T3', planned: 22, actual: 18 },
                                                { month: 'T4', planned: 35, actual: 30 },
                                                { month: 'T5', planned: 48, actual: 42 },
                                                { month: 'T6', planned: 60, actual: 55 },
                                                { month: 'T7', planned: 70, actual: 65 },
                                                { month: 'T8', planned: 80, actual: 72 },
                                                { month: 'T9', planned: 88, actual: null },
                                                { month: 'T10', planned: 94, actual: null },
                                                { month: 'T11', planned: 98, actual: null },
                                                { month: 'T12', planned: 100, actual: null },
                                            ]}
                                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                        >
                                            <defs>
                                                <linearGradient id="colorPlanned" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                            <XAxis
                                                dataKey="month"
                                                tick={{ fontSize: 11, fill: '#64748b' }}
                                                axisLine={{ stroke: '#e5e7eb' }}
                                            />
                                            <YAxis
                                                tickFormatter={(v) => `${v}%`}
                                                tick={{ fontSize: 11, fill: '#64748b' }}
                                                axisLine={{ stroke: '#e5e7eb' }}
                                                domain={[0, 100]}
                                            />
                                            <RechartsTooltip
                                                formatter={(value, name) => [
                                                    value ? `${value}%` : 'Chưa có dữ liệu',
                                                    name === 'planned' ? 'Kế hoạch' : 'Thực tế'
                                                ]}
                                                contentStyle={{
                                                    borderRadius: '12px',
                                                    border: 'none',
                                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="planned"
                                                stroke="#3B82F6"
                                                strokeWidth={2}
                                                fill="url(#colorPlanned)"
                                                name="planned"
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="actual"
                                                stroke="#10B981"
                                                strokeWidth={2}
                                                fill="url(#colorActual)"
                                                name="actual"
                                                connectNulls={false}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Progress Stats */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/40">
                                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">Tiến độ kế hoạch</p>
                                        <p className="text-2xl font-black text-blue-700 dark:text-blue-300 mt-1">80%</p>
                                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Tháng 8/2024</p>
                                    </div>
                                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/40">
                                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">Tiến độ thực tế</p>
                                        <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">72%</p>
                                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Cập nhật: Hôm nay</p>
                                    </div>
                                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-800/40">
                                        <p className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase">Chênh lệch</p>
                                        <p className="text-2xl font-black text-orange-700 dark:text-orange-300 mt-1">-8%</p>
                                        <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Chậm so với kế hoạch</p>
                                    </div>
                                </div>
                            </div>

                            {/* Milestones */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-slate-200 mb-6">Mốc tiến độ hợp đồng</h3>
                                <div className="relative border-l-2 border-gray-200 dark:border-slate-700 ml-4 space-y-8 pb-4">
                                    {milestones.map((ms, idx) => (
                                        <div key={ms.id} className="relative pl-10 group">
                                            {/* Status Dot */}
                                            <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm transition-transform group-hover:scale-125 ${ms.status === 'Done' ? 'bg-emerald-500' :
                                                ms.status === 'In Progress' ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'
                                                }`}></div>

                                            <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white dark:bg-slate-700/50 border border-gray-100 dark:border-slate-600 rounded-xl hover:shadow-md transition-shadow">
                                                <div>
                                                    <h4 className={`font-bold text-sm ${ms.status === 'Pending' ? 'text-gray-500 dark:text-slate-500' : 'text-gray-800 dark:text-slate-200'}`}>{ms.name}</h4>
                                                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" /> {ms.date}
                                                    </p>
                                                </div>
                                                <span className={`mt-2 md:mt-0 px-3 py-1 rounded-full text-[10px] font-black uppercase w-fit ${ms.status === 'Done' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' :
                                                    ms.status === 'In Progress' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'
                                                    }`}>
                                                    {ms.status === 'Done' ? 'Hoàn thành' : ms.status === 'In Progress' ? 'Đang thực hiện' : 'Chưa đến hạn'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContractDetail;
