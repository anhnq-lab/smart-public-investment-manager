import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatShortCurrency as formatCurrency } from '../../utils/format';
import { PaymentType, PaymentStatus, Payment } from '../../types';
import { PaymentForm } from './PaymentForm';
import { usePayments, useCreatePayment } from '../../hooks/usePayments';
import { useContracts } from '../../hooks/useContracts';
import { useContractors } from '../../hooks/useContractors';
import { useAllBiddingPackages } from '../../hooks/useAllBiddingPackages';
import { useProjects } from '../../hooks/useProjects';
import {
    CreditCard, Download, Search, Plus,
    DollarSign, Clock, CheckCircle2, FileText,
    Building2, ChevronRight, Filter,
    BarChart3, Wallet, CalendarDays, TrendingUp,
    ArrowUpRight, Hash, Landmark
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';

const PaymentList: React.FC = () => {
    const navigate = useNavigate();
    const { payments, isLoading } = usePayments();
    const createPaymentMutation = useCreatePayment();
    const { contracts } = useContracts();
    const { projects } = useProjects();
    const { contractors } = useContractors();
    const { biddingPackages } = useAllBiddingPackages();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [filterStatus, setFilterStatus] = useState<'all' | PaymentStatus>('all');
    const [filterType, setFilterType] = useState<'all' | PaymentType>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // === Cross-module helpers ===
    const getContractorName = (contractId: string): string => {
        const contract = contracts.find(c => c.ContractID === contractId);
        if (!contract) return '—';
        const contractor = contractors.find(ct => ct.ContractorID === contract.ContractorID);
        return contractor?.FullName || contract.ContractorID;
    };

    const getProjectName = (contractId: string): string => {
        const contract = contracts.find(c => c.ContractID === contractId);
        if (!contract) return '—';
        const pkg = biddingPackages.find(p => p.PackageID === contract.PackageID);
        if (!pkg) return '—';
        const project = projects.find(p => p.ProjectID === pkg.ProjectID);
        return project?.ProjectName || '—';
    };

    const getContractValue = (contractId: string): number => {
        const contract = contracts.find(c => c.ContractID === contractId);
        return contract?.Value || 0;
    };

    // === Stats ===
    const stats = useMemo(() => {
        const totalAmount = payments.reduce((sum, p) => sum + p.Amount, 0);
        const transferred = payments.filter(p => p.Status === PaymentStatus.Transferred);
        const transferredAmount = transferred.reduce((sum, p) => sum + p.Amount, 0);
        const pending = payments.filter(p => p.Status === PaymentStatus.Pending);
        const pendingAmount = pending.reduce((sum, p) => sum + p.Amount, 0);
        const advancePayments = payments.filter(p => p.Type === PaymentType.Advance);
        const advanceAmount = advancePayments.reduce((sum, p) => sum + p.Amount, 0);
        const volumePayments = payments.filter(p => p.Type === PaymentType.Volume);
        const volumeAmount = volumePayments.reduce((sum, p) => sum + p.Amount, 0);
        const uniqueContracts = new Set(payments.map(p => p.ContractID)).size;
        return {
            total: payments.length,
            totalAmount,
            transferredCount: transferred.length,
            transferredAmount,
            pendingCount: pending.length,
            pendingAmount,
            advanceAmount,
            advanceCount: advancePayments.length,
            volumeAmount,
            volumeCount: volumePayments.length,
            uniqueContracts,
        };
    }, [payments]);

    // === Filtering ===
    const filteredPayments = useMemo(() => {
        return payments.filter(p => {
            const qLower = searchQuery.toLowerCase();
            const contractorName = getContractorName(p.ContractID).toLowerCase();
            const matchesSearch = !searchQuery ||
                p.ContractID.toLowerCase().includes(qLower) ||
                p.TreasuryRef.toLowerCase().includes(qLower) ||
                contractorName.includes(qLower) ||
                String(p.PaymentID).includes(qLower);
            const matchesStatus = filterStatus === 'all' || p.Status === filterStatus;
            const matchesType = filterType === 'all' || p.Type === filterType;
            return matchesSearch && matchesStatus && matchesType;
        });
    }, [payments, searchQuery, filterStatus, filterType, contracts]);

    const handleCreatePayment = (newPayment: Payment) => {
        createPaymentMutation.mutate(newPayment);
    };

    if (isLoading) {
        return (
            <div className="space-y-6 p-1">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
                </div>
                <Skeleton className="h-14 rounded-2xl" />
                <Card className="p-6"><div className="space-y-4">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div></Card>
            </div>
        );
    }

    const statCards = [
        {
            label: 'Tổng giải ngân',
            value: formatCurrency(stats.totalAmount),
            sub: `${stats.total} phiếu · ${stats.uniqueContracts} hợp đồng`,
            icon: DollarSign,
            gradient: 'from-blue-500 via-blue-600 to-indigo-700',
            ring: 'ring-blue-400/30',
        },
        {
            label: 'Đã chuyển tiền',
            value: formatCurrency(stats.transferredAmount),
            sub: `${stats.transferredCount}/${stats.total} phiếu hoàn thành`,
            icon: CheckCircle2,
            gradient: 'from-emerald-500 via-emerald-600 to-teal-700',
            ring: 'ring-emerald-400/30',
            progressPercent: stats.total > 0 ? (stats.transferredCount / stats.total) * 100 : 0,
        },
        {
            label: 'Đang chờ duyệt',
            value: formatCurrency(stats.pendingAmount),
            sub: `${stats.pendingCount} phiếu cần xử lý`,
            icon: Clock,
            gradient: 'from-amber-500 via-orange-500 to-red-500',
            ring: 'ring-amber-400/30',
            highlight: stats.pendingCount > 0,
        },
        {
            label: 'Tạm ứng',
            value: formatCurrency(stats.advanceAmount),
            sub: `KL: ${formatCurrency(stats.volumeAmount)} (${stats.volumeCount} phiếu)`,
            icon: Wallet,
            gradient: 'from-violet-500 via-violet-600 to-purple-700',
            ring: 'ring-violet-400/30',
        },
    ];

    return (
        <>
            <div className="space-y-6 animate-in fade-in duration-500">
                {/* === Stat Cards === */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {statCards.map((card, idx) => (
                        <div
                            key={idx}
                            className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${card.gradient} text-white p-3 shadow-lg ring-1 ${card.ring} transition-all duration-200`}
                        >
                            <div className="absolute -right-2 -top-2 opacity-[0.12]">
                                <card.icon className="w-16 h-16" strokeWidth={1.2} />
                            </div>
                            {(card as any).highlight && (
                                <div className="absolute top-2 right-2">
                                    <span className="flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-50"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white/70"></span>
                                    </span>
                                </div>
                            )}
                            <div className="relative z-10">
                                <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-white/90">{card.label}</p>
                                <p className="text-xl font-black mt-1 tracking-tight drop-shadow-sm">{card.value}</p>
                                {(card as any).progressPercent !== undefined && (
                                    <div className="mt-1.5 w-full bg-white/20 rounded-full h-1">
                                        <div className="h-full bg-white/80 rounded-full transition-all duration-1000" style={{ width: `${Math.min((card as any).progressPercent, 100)}%` }}></div>
                                    </div>
                                )}
                                <p className="text-[10px] text-white/70 mt-1 font-medium">{card.sub}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* === Toolbar === */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 p-4">
                    <div className="flex flex-col md:flex-row items-center gap-3">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm mã TT, mã HĐ, nhà thầu, Kho bạc..."
                                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Status segmented control */}
                        <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-xl p-1 gap-0.5">
                            {[
                                { value: 'all' as const, label: 'Tất cả', count: stats.total },
                                { value: PaymentStatus.Transferred, label: 'Đã chuyển', count: stats.transferredCount },
                                { value: PaymentStatus.Pending, label: 'Chờ duyệt', count: stats.pendingCount },
                            ].map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setFilterStatus(opt.value)}
                                    className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${filterStatus === opt.value
                                        ? 'bg-white dark:bg-slate-600 text-slate-700 dark:text-slate-200 shadow-sm'
                                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                        }`}
                                >
                                    {opt.label}
                                    <span className={`ml-1 text-[10px] ${filterStatus === opt.value ? 'text-blue-600' : 'text-gray-400'}`}>
                                        {opt.count}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Type pills */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider mr-1">Loại</span>
                            {[
                                { value: 'all' as const, label: 'Tất cả' },
                                { value: PaymentType.Advance, label: 'Tạm ứng' },
                                { value: PaymentType.Volume, label: 'Khối lượng' },
                            ].map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setFilterType(opt.value)}
                                    className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all ${filterType === opt.value
                                        ? 'bg-violet-100 text-violet-700 ring-1 ring-violet-200 shadow-sm'
                                        : 'text-gray-500 hover:bg-gray-100'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        <div className="ml-auto flex items-center gap-2">
                            <button className="px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 bg-white border border-gray-200 rounded-xl hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-colors flex items-center gap-2 hover:shadow-sm">
                                <Download className="w-4 h-4" />
                                Xuất Excel
                            </button>
                            <button
                                onClick={() => setIsFormOpen(true)}
                                className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-emerald-200 transition-all duration-300 flex items-center gap-2"
                            >
                                <CreditCard className="w-4 h-4" />
                                Tạo phiếu thanh toán
                            </button>
                        </div>
                    </div>
                </div>

                {/* === Table === */}
                <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-gray-100 dark:bg-slate-800">
                    <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-360px)]">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="table-header-row">
                                    <th className="px-3 py-2.5 text-center text-[10px] font-black uppercase tracking-widest w-12">STT</th>
                                    <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest">Mã TT</th>
                                    <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest">Hợp đồng</th>
                                    <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest">Nhà thầu</th>
                                    <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest">Dự án</th>
                                    <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-center">Đợt</th>
                                    <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest">Loại</th>
                                    <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-right">Số tiền</th>
                                    <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-center">Trạng thái</th>
                                    <th className="px-5 py-4 w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPayments.map((payment, rowIdx) => {
                                    const contractorName = getContractorName(payment.ContractID);
                                    const projectName = getProjectName(payment.ContractID);
                                    const contractValue = getContractValue(payment.ContractID);
                                    const payPercent = contractValue > 0 ? (payment.Amount / contractValue) * 100 : 0;
                                    const isEven = rowIdx % 2 === 0;

                                    return (
                                        <tr
                                            key={payment.PaymentID}
                                            className={`group cursor-pointer transition-all duration-200 hover:bg-blue-50/60 hover:shadow-sm ${isEven ? 'bg-white dark:bg-slate-800' : 'bg-gray-50/30 dark:bg-slate-900/30'} border-b border-gray-50 dark:border-slate-700`}
                                            onClick={() => navigate(`/contracts/${encodeURIComponent(payment.ContractID)}`)}
                                        >
                                            {/* STT */}
                                            <td className="px-3 py-4 text-center text-xs text-gray-500 dark:text-slate-400 font-medium">{rowIdx + 1}</td>
                                            {/* Payment ID */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center ring-1 ring-gray-200 dark:from-slate-700 dark:to-slate-800 dark:ring-slate-600">
                                                        <Hash className="w-3 h-3 text-gray-500 dark:text-slate-400" />
                                                    </div>
                                                    <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300">{payment.PaymentID}</span>
                                                </div>
                                            </td>

                                            {/* Contract */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                                                    <span className="font-medium text-blue-600 text-xs group-hover:text-blue-700 truncate max-w-[140px]">{payment.ContractID}</span>
                                                </div>
                                            </td>

                                            {/* Contractor */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center ring-1 ring-slate-200 dark:from-slate-700 dark:to-slate-800 dark:ring-slate-600 flex-shrink-0">
                                                        <Building2 className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                                                    </div>
                                                    <span className="text-gray-700 text-xs max-w-[160px] truncate font-medium dark:text-slate-300" title={contractorName}>
                                                        {contractorName}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Project */}
                                            <td className="px-5 py-4">
                                                <span className="text-gray-500 text-xs max-w-[160px] truncate block dark:text-slate-400" title={projectName}>
                                                    {projectName}
                                                </span>
                                            </td>

                                            {/* Batch */}
                                            <td className="px-5 py-4 text-center">
                                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 text-xs font-black text-gray-700 ring-1 ring-gray-200 dark:from-slate-700 dark:to-slate-800 dark:text-slate-300 dark:ring-slate-600">
                                                    {payment.BatchNo}
                                                </span>
                                            </td>

                                            {/* Type */}
                                            <td className="px-5 py-4">
                                                {payment.Type === PaymentType.Advance ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 ring-1 ring-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:ring-purple-900">
                                                        <Wallet className="w-2.5 h-2.5" />
                                                        Tạm ứng
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-300 dark:ring-cyan-900">
                                                        <BarChart3 className="w-2.5 h-2.5" />
                                                        Khối lượng
                                                    </span>
                                                )}
                                            </td>

                                            {/* Amount */}
                                            <td className="px-5 py-4 text-right">
                                                <div className="text-right">
                                                    <span className="font-bold text-gray-900 font-mono text-xs tracking-tight block whitespace-nowrap dark:text-slate-100">{formatCurrency(payment.Amount)}</span>
                                                    {contractValue > 0 && (
                                                        <span className="text-[10px] text-gray-400 font-medium dark:text-slate-500">{payPercent.toFixed(1)}% giá trị HĐ</span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="px-5 py-4 text-center">
                                                {payment.Status === PaymentStatus.Transferred ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold uppercase whitespace-nowrap bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-900">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        Đã chuyển
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold uppercase whitespace-nowrap bg-amber-50 text-amber-700 ring-1 ring-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-900">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                                        Chờ duyệt
                                                    </span>
                                                )}
                                            </td>

                                            {/* Arrow */}
                                            <td className="px-4 py-4">
                                                <div className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 group-hover:ring-1 group-hover:ring-blue-200 transition-all dark:bg-slate-700 dark:group-hover:bg-blue-900/20 dark:group-hover:ring-blue-800">
                                                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors dark:text-slate-500 dark:group-hover:text-blue-400" />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary Footer */}
                    <div className="bg-gradient-to-r from-gray-50 to-emerald-50/30 border-t border-gray-200 px-6 py-4 dark:from-slate-900 dark:to-slate-800/30 dark:border-slate-700">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                    <span className="text-xs text-gray-500 dark:text-slate-400">Đã chuyển: <span className="font-bold text-emerald-700">{formatCurrency(stats.transferredAmount)}</span></span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                                    <span className="text-xs text-gray-500 dark:text-slate-400">Chờ duyệt: <span className="font-bold text-amber-700">{formatCurrency(stats.pendingAmount)}</span></span>
                                </div>
                                <div className="w-px h-4 bg-gray-200 dark:bg-slate-600"></div>
                                <span className="text-xs text-gray-500 dark:text-slate-400">Tổng: <span className="font-bold text-gray-900 dark:text-slate-100">{formatCurrency(stats.totalAmount)}</span></span>
                            </div>
                            <span className="text-xs text-slate-400 dark:text-slate-500">{filteredPayments.length} phiếu thanh toán</span>
                        </div>
                    </div>

                    {filteredPayments.length === 0 && (
                        <div className="p-20 text-center">
                            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center mx-auto mb-5 ring-1 ring-gray-200 dark:ring-slate-600">
                                <CreditCard className="w-10 h-10 text-gray-300 dark:text-slate-500" />
                            </div>
                            <p className="text-gray-600 font-bold text-lg">Không tìm thấy phiếu thanh toán</p>
                            <p className="text-gray-400 text-sm mt-2">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                        </div>
                    )}
                </Card >
            </div >

            <PaymentForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSubmit={handleCreatePayment}
            />
        </>
    );
};

export default PaymentList;
