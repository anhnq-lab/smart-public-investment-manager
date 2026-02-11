import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../mockData';
import { PaymentType, PaymentStatus, Payment } from '../../types';
import { PaymentForm } from './PaymentForm';
import { usePayments, useCreatePayment } from '../../hooks/usePayments';
import { useContracts } from '../../hooks/useContracts';
import { mockContractors, mockBiddingPackages } from '../../mockData';
import { useProjects } from '../../hooks/useProjects';
import {
    CreditCard, Download, TrendingUp, Search, Plus,
    DollarSign, Clock, CheckCircle2, FileText,
    Building2, ChevronRight, ArrowUpRight, Filter,
    BarChart3, Banknote, Wallet
} from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';

const PaymentList: React.FC = () => {
    const navigate = useNavigate();
    const { payments, isLoading } = usePayments();
    const createPaymentMutation = useCreatePayment();
    const { contracts } = useContracts();
    const { projects } = useProjects();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [filterStatus, setFilterStatus] = useState<'all' | PaymentStatus>('all');
    const [filterType, setFilterType] = useState<'all' | PaymentType>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // === Cross-module helpers ===
    const getContractorName = (contractId: string): string => {
        const contract = contracts.find(c => c.ContractID === contractId);
        if (!contract) return '—';
        const contractor = mockContractors.find(ct => ct.ContractorID === contract.ContractorID);
        return contractor?.FullName || contract.ContractorID;
    };

    const getProjectName = (contractId: string): string => {
        const contract = contracts.find(c => c.ContractID === contractId);
        if (!contract) return '—';
        const pkg = mockBiddingPackages.find(p => p.PackageID === contract.PackageID);
        if (!pkg) return '—';
        const project = projects.find(p => p.ProjectID === pkg.ProjectID);
        return project?.ProjectName || '—';
    };

    // === Stats ===
    const stats = useMemo(() => {
        const totalAmount = payments.reduce((sum, p) => sum + p.Amount, 0);
        const transferred = payments.filter(p => p.Status === PaymentStatus.Transferred);
        const transferredAmount = transferred.reduce((sum, p) => sum + p.Amount, 0);
        const pending = payments.filter(p => p.Status === PaymentStatus.Pending);
        const pendingAmount = pending.reduce((sum, p) => sum + p.Amount, 0);
        const advanceAmount = payments.filter(p => p.Type === PaymentType.Advance).reduce((sum, p) => sum + p.Amount, 0);
        return {
            total: payments.length,
            totalAmount,
            transferredCount: transferred.length,
            transferredAmount,
            pendingCount: pending.length,
            pendingAmount,
            advanceAmount,
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
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
                </div>
                <Skeleton className="h-16 rounded-2xl" />
                <Card className="p-6"><div className="space-y-4">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div></Card>
            </div>
        );
    }

    const statCards = [
        {
            label: 'Tổng giải ngân',
            value: formatCurrency(stats.totalAmount),
            sub: `${stats.total} phiếu`,
            icon: DollarSign,
            gradient: 'from-blue-500 to-indigo-600',
        },
        {
            label: 'Đã chuyển tiền',
            value: formatCurrency(stats.transferredAmount),
            sub: `${stats.transferredCount} phiếu`,
            icon: CheckCircle2,
            gradient: 'from-emerald-500 to-teal-600',
        },
        {
            label: 'Đang chờ duyệt',
            value: formatCurrency(stats.pendingAmount),
            sub: `${stats.pendingCount} phiếu`,
            icon: Clock,
            gradient: 'from-amber-500 to-orange-600',
        },
        {
            label: 'Tạm ứng HĐ',
            value: formatCurrency(stats.advanceAmount),
            sub: 'Tổng tạm ứng',
            icon: Wallet,
            gradient: 'from-violet-500 to-purple-600',
        },
    ];

    return (
        <>
            <div className="space-y-6 animate-in fade-in duration-300">
                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map((card, idx) => (
                        <div key={idx} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.gradient} text-white p-5 shadow-lg`}>
                            <div className="absolute -right-4 -top-4 opacity-20">
                                <card.icon className="w-24 h-24" />
                            </div>
                            <div className="relative">
                                <p className="text-xs font-bold uppercase tracking-widest text-white/80">{card.label}</p>
                                <p className="text-2xl font-black mt-2 tracking-tight">{card.value}</p>
                                <p className="text-xs text-white/60 mt-1 font-medium">{card.sub}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Toolbar */}
                <div className="flex flex-col md:flex-row items-center gap-3">
                    <div className="w-full md:w-80">
                        <Input
                            placeholder="Tìm mã TT, mã HĐ, mã Kho bạc..."
                            leftIcon={<Search className="w-4 h-4" />}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Status filter */}
                    <div className="flex items-center gap-2">
                        {[
                            { value: 'all' as const, label: 'Tất cả' },
                            { value: PaymentStatus.Transferred, label: 'Đã chuyển' },
                            { value: PaymentStatus.Pending, label: 'Chờ duyệt' }
                        ].map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setFilterStatus(opt.value)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${filterStatus === opt.value
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {/* Type filter */}
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Loại:</span>
                        {[
                            { value: 'all' as const, label: 'Tất cả' },
                            { value: PaymentType.Advance, label: 'Tạm ứng' },
                            { value: PaymentType.Volume, label: 'Khối lượng' },
                        ].map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setFilterType(opt.value)}
                                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${filterType === opt.value
                                    ? 'bg-violet-100 text-violet-700 ring-1 ring-violet-200'
                                    : 'text-gray-500 hover:bg-gray-100'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    <div className="ml-auto flex gap-2">
                        <button className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2">
                            <Download className="w-4 h-4" />
                            Xuất Excel
                        </button>
                        <button
                            onClick={() => setIsFormOpen(true)}
                            className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 flex items-center gap-2"
                        >
                            <CreditCard className="w-4 h-4" />
                            Tạo phiếu thanh toán
                        </button>
                    </div>
                </div>

                {/* Table */}
                <Card className="overflow-hidden border-0 shadow-sm">
                    <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            {filteredPayments.length} phiếu thanh toán
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50/80 text-xs uppercase font-bold text-gray-500 tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Mã TT</th>
                                    <th className="px-6 py-4">Hợp đồng</th>
                                    <th className="px-6 py-4">Nhà thầu</th>
                                    <th className="px-6 py-4">Dự án</th>
                                    <th className="px-6 py-4 text-center">Đợt</th>
                                    <th className="px-6 py-4">Loại</th>
                                    <th className="px-6 py-4 text-right">Số tiền</th>
                                    <th className="px-6 py-4 text-center">Trạng thái</th>
                                    <th className="px-6 py-4 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredPayments.map((payment) => {
                                    const contractorName = getContractorName(payment.ContractID);
                                    const projectName = getProjectName(payment.ContractID);

                                    return (
                                        <tr
                                            key={payment.PaymentID}
                                            className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                                            onClick={() => navigate(`/contracts/${encodeURIComponent(payment.ContractID)}`)}
                                        >
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-xs text-gray-500">#{payment.PaymentID}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                                                    <span className="font-medium text-blue-600 text-xs">{payment.ContractID}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
                                                        <Building2 className="w-3 h-3 text-gray-500" />
                                                    </div>
                                                    <span className="text-gray-700 text-xs max-w-[150px] truncate" title={contractorName}>
                                                        {contractorName}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-gray-500 text-xs max-w-[160px] truncate block" title={projectName}>
                                                    {projectName}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100 text-xs font-bold text-gray-700">
                                                    {payment.BatchNo}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${payment.Type === PaymentType.Advance
                                                    ? 'bg-purple-50 text-purple-700 ring-1 ring-purple-100'
                                                    : 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100'
                                                    }`}>
                                                    {payment.Type === PaymentType.Advance ? 'Tạm ứng' : 'Khối lượng'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-bold text-gray-900 font-mono tracking-tight">{formatCurrency(payment.Amount)}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${payment.Status === PaymentStatus.Transferred
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {payment.Status === PaymentStatus.Transferred && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
                                                    {payment.Status === PaymentStatus.Transferred ? 'Đã chuyển' : 'Chờ duyệt'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {filteredPayments.length === 0 && (
                        <div className="p-16 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                <CreditCard className="w-8 h-8 text-gray-300" />
                            </div>
                            <p className="text-gray-500 font-medium">Không tìm thấy phiếu thanh toán nào.</p>
                            <p className="text-gray-400 text-sm mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                        </div>
                    )}
                </Card>
            </div>

            {/* Payment Form Modal */}
            <PaymentForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSubmit={handleCreatePayment}
            />
        </>
    );
};

export default PaymentList;
