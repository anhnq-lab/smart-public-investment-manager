
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatShortCurrency as formatCurrency } from '../../utils/format';
import { Contract, ContractStatus, PaymentStatus } from '../../types';
import {
    FileText, Search, Plus, Filter,
    Building2, TrendingUp, CheckCircle2, Clock, DollarSign,
    ChevronRight, BarChart3, ArrowUpRight, ArrowDownRight, Briefcase,
    ShieldCheck, ShieldAlert, Landmark, CalendarDays, Eye
} from 'lucide-react';
import { useContracts } from '../../hooks/useContracts';
import { usePayments } from '../../hooks/usePayments';
import { useProjects } from '../../hooks/useProjects';
import { useContractors } from '../../hooks/useContractors';
import { useAllBiddingPackages } from '../../hooks/useAllBiddingPackages';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';

const ContractList: React.FC = () => {
    const navigate = useNavigate();
    const { contracts, isLoading } = useContracts();
    const { payments } = usePayments();
    const { projects } = useProjects();
    const { contractors } = useContractors();
    const { biddingPackages } = useAllBiddingPackages();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | ContractStatus>('all');

    // === Cross-module helpers ===
    const getContractorName = (contractorId: string): string => {
        const contractor = contractors.find(c => c.ContractorID === contractorId);
        return contractor?.FullName || contractorId;
    };

    const getProjectName = (contract: Contract): string => {
        const pkg = biddingPackages.find(p => p.PackageID === contract.PackageID);
        if (!pkg) return '—';
        const project = projects.find(p => p.ProjectID === pkg.ProjectID);
        return project?.ProjectName || '—';
    };

    const getPaymentProgress = (contractId: string, contractValue: number) => {
        const contractPayments = payments.filter(p => p.ContractID === contractId);
        const paid = contractPayments
            .filter(p => p.Status === PaymentStatus.Transferred)
            .reduce((sum, p) => sum + p.Amount, 0);
        const pending = contractPayments
            .filter(p => p.Status === PaymentStatus.Pending)
            .reduce((sum, p) => sum + p.Amount, 0);
        const percent = contractValue > 0 ? (paid / contractValue) * 100 : 0;
        return { paid, pending, percent, count: contractPayments.length };
    };

    // === Stats ===
    const stats = useMemo(() => {
        const totalValue = contracts.reduce((sum, c) => sum + c.Value, 0);
        const executingContracts = contracts.filter(c => c.Status === ContractStatus.Executing);
        const executingCount = executingContracts.length;
        const executingValue = executingContracts.reduce((sum, c) => sum + c.Value, 0);
        const liquidatedCount = contracts.filter(c => c.Status === ContractStatus.Liquidated).length;
        const totalPaid = payments
            .filter(p => p.Status === PaymentStatus.Transferred)
            .reduce((sum, p) => sum + p.Amount, 0);
        const totalPending = payments
            .filter(p => p.Status === PaymentStatus.Pending)
            .reduce((sum, p) => sum + p.Amount, 0);
        const disbursementRate = totalValue > 0 ? (totalPaid / totalValue) * 100 : 0;
        const uniqueContractors = new Set(contracts.map(c => c.ContractorID)).size;
        return { total: contracts.length, totalValue, executingCount, executingValue, liquidatedCount, totalPaid, totalPending, disbursementRate, uniqueContractors };
    }, [contracts, payments]);

    // === Filtering ===
    const filteredContracts = useMemo(() => {
        return contracts.filter(c => {
            const contractorName = getContractorName(c.ContractorID).toLowerCase();
            const projectName = getProjectName(c).toLowerCase();
            const qLower = searchQuery.toLowerCase();
            const matchesSearch = !searchQuery ||
                c.ContractID.toLowerCase().includes(qLower) ||
                contractorName.includes(qLower) ||
                projectName.includes(qLower);
            const matchesStatus = statusFilter === 'all' || c.Status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [contracts, searchQuery, statusFilter, projects]);

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
            label: 'Tổng hợp đồng',
            value: stats.total,
            suffix: 'HĐ',
            sub: `${stats.uniqueContractors} nhà thầu`,
            icon: FileText,
            gradient: 'from-blue-500 via-blue-600 to-indigo-700',
            ring: 'ring-blue-400/30',
        },
        {
            label: 'Tổng giá trị',
            value: formatCurrency(stats.totalValue),
            sub: `Đang TH: ${formatCurrency(stats.executingValue)}`,
            icon: DollarSign,
            gradient: 'from-emerald-500 via-emerald-600 to-teal-700',
            ring: 'ring-emerald-400/30',
        },
        {
            label: 'Đang thực hiện',
            value: stats.executingCount,
            suffix: 'HĐ',
            sub: `${stats.liquidatedCount} đã thanh lý`,
            icon: TrendingUp,
            gradient: 'from-violet-500 via-violet-600 to-purple-700',
            ring: 'ring-violet-400/30',
        },
        {
            label: 'Tỷ lệ giải ngân',
            value: `${stats.disbursementRate.toFixed(1)}%`,
            sub: `${formatCurrency(stats.totalPaid)} / ${formatCurrency(stats.totalValue)}`,
            icon: BarChart3,
            gradient: 'from-amber-500 via-orange-500 to-red-500',
            ring: 'ring-amber-400/30',
            // Show mini progress bar
            progressPercent: stats.disbursementRate,
        },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* === Stat Cards === */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {statCards.map((card, idx) => (
                    <div
                        key={idx}
                        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.gradient} text-white p-5 shadow-xl ring-1 ${card.ring} transition-transform hover:scale-[1.02] hover:shadow-2xl duration-300`}
                    >
                        {/* Background icon */}
                        <div className="absolute -right-3 -top-3 opacity-[0.12]">
                            <card.icon className="w-24 h-24" strokeWidth={1.2} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/90">{card.label}</p>
                            <p className="text-3xl font-black mt-2 tracking-tight drop-shadow-sm">
                                {card.value}
                                {card.suffix && <span className="text-sm font-semibold ml-1.5 text-white/80">{card.suffix}</span>}
                            </p>
                            {card.progressPercent !== undefined && (
                                <div className="mt-2 w-full bg-white/20 rounded-full h-1.5">
                                    <div className="h-full bg-white/80 rounded-full transition-all duration-1000" style={{ width: `${Math.min(card.progressPercent, 100)}%` }}></div>
                                </div>
                            )}
                            <p className="text-[11px] text-white/70 mt-1.5 font-medium">{card.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* === Toolbar === */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-4">
                <div className="flex flex-col md:flex-row items-center gap-3">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
                        <input
                            type="text"
                            placeholder="Tìm mã HĐ, nhà thầu, dự án..."
                            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50/50 dark:bg-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all placeholder:text-gray-400 dark:placeholder:text-slate-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center bg-gray-100 dark:bg-slate-700 rounded-xl p-1 gap-0.5">
                        {[
                            { value: 'all' as const, label: 'Tất cả', count: stats.total },
                            { value: ContractStatus.Executing, label: 'Đang TH', count: stats.executingCount },
                            { value: ContractStatus.Liquidated, label: 'Thanh lý', count: stats.liquidatedCount },
                        ].map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setStatusFilter(opt.value)}
                                className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${statusFilter === opt.value
                                    ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-slate-200 shadow-sm'
                                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                {opt.label}
                                <span className={`ml-1 text-[10px] ${statusFilter === opt.value ? 'text-blue-600' : 'text-gray-400 dark:text-slate-500'}`}>
                                    {opt.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                        <span className="text-xs text-gray-400 dark:text-slate-500 font-medium hidden lg:inline">
                            Hiển thị {filteredContracts.length} / {stats.total}
                        </span>
                        <button
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-blue-200 transition-all duration-300 flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Thêm hợp đồng
                        </button>
                    </div>
                </div>
            </div>

            {/* === Contract Table === */}
            <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-gray-100 dark:ring-slate-700 dark:bg-slate-800">
                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-360px)]">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="table-header-row">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Số hợp đồng</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Nhà thầu</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Dự án</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right">Giá trị HĐ</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center">Giải ngân</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center">Ngày ký</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center">Trạng thái</th>
                                <th className="px-6 py-4 w-10"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredContracts.map((contract, rowIdx) => {
                                const payProgress = getPaymentProgress(contract.ContractID, contract.Value);
                                const contractorName = getContractorName(contract.ContractorID);
                                const projectName = getProjectName(contract);
                                const isEven = rowIdx % 2 === 0;

                                return (
                                    <tr
                                        key={contract.ContractID}
                                        className={`group cursor-pointer transition-all duration-200 hover:bg-blue-50/60 dark:hover:bg-slate-700/50 hover:shadow-sm ${isEven ? 'bg-white dark:bg-slate-800' : 'bg-gray-50/30 dark:bg-slate-900/30'} border-b border-gray-50 dark:border-slate-700`}
                                        onClick={() => navigate(`/contracts/${encodeURIComponent(contract.ContractID)}`)}
                                    >
                                        {/* Contract ID */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center ring-1 ring-blue-200/50 group-hover:ring-blue-300 transition-colors">
                                                    <FileText className="w-4 h-4 text-blue-600" />
                                                </div>
                                                <div>
                                                    <span className="font-bold text-blue-700 group-hover:text-blue-800 text-sm block">{contract.ContractID}</span>
                                                    <span className="text-[10px] text-gray-400 dark:text-slate-500">Gói {contract.PackageID?.slice(-5) || '—'}</span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Contractor */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center ring-1 ring-slate-200 dark:ring-slate-600">
                                                    <Building2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                                                </div>
                                                <span className="font-medium text-gray-800 dark:text-slate-200 max-w-[200px] truncate text-[13px]" title={contractorName}>
                                                    {contractorName}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Project */}
                                        <td className="px-6 py-4">
                                            <span className="text-gray-500 dark:text-slate-400 text-xs max-w-[200px] truncate block leading-relaxed" title={projectName}>
                                                {projectName}
                                            </span>
                                        </td>

                                        {/* Contract Value */}
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-bold text-gray-900 dark:text-slate-100 font-mono text-sm tracking-tight">{formatCurrency(contract.Value)}</span>
                                        </td>

                                        {/* Payment Progress */}
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col items-center gap-1.5">
                                                <div className="w-full max-w-[120px] bg-gray-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 ${payProgress.percent >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
                                                            payProgress.percent >= 40 ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
                                                                payProgress.percent > 0 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gray-200 dark:bg-slate-600'}`}
                                                        style={{ width: `${Math.min(payProgress.percent, 100)}%` }}
                                                    ></div>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[10px]">
                                                    <span className="font-bold text-gray-600 dark:text-slate-300">{payProgress.percent.toFixed(0)}%</span>
                                                    <span className="text-gray-300 dark:text-slate-600">·</span>
                                                    <span className="text-gray-400 dark:text-slate-500">{payProgress.count} đợt</span>
                                                    {payProgress.pending > 0 && (
                                                        <>
                                                            <span className="text-gray-300 dark:text-slate-600">·</span>
                                                            <span className="text-amber-500 font-semibold flex items-center gap-0.5">
                                                                <Clock className="w-2.5 h-2.5" /> {formatCurrency(payProgress.pending)}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Sign Date */}
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
                                                <CalendarDays className="w-3 h-3 text-gray-400 dark:text-slate-500" />
                                                {contract.SignDate}
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="px-6 py-4 text-center">
                                            {contract.Status === ContractStatus.Executing ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/30">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                                                    Đang TH
                                                </span>
                                            ) : contract.Status === ContractStatus.Liquidated ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-100 dark:ring-emerald-900/30">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    Thanh lý
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 ring-1 ring-yellow-100 dark:ring-yellow-900/30">
                                                    <Clock className="w-3 h-3" />
                                                    Tạm dừng
                                                </span>
                                            )}
                                        </td>

                                        {/* Arrow */}
                                        <td className="px-4 py-4">
                                            <div className="w-7 h-7 rounded-full bg-gray-50 dark:bg-slate-700 flex items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:ring-1 group-hover:ring-blue-200 dark:group-hover:ring-blue-800 transition-all">
                                                <ChevronRight className="w-4 h-4 text-gray-300 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Summary Footer */}
                <div className="bg-gradient-to-r from-gray-50 to-blue-50/30 dark:from-slate-900 dark:to-slate-800/30 border-t border-gray-200 dark:border-slate-700 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                <span className="text-xs text-gray-500 dark:text-slate-400">Đang thực hiện: <span className="font-bold text-gray-700 dark:text-slate-200">{stats.executingCount}</span></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                <span className="text-xs text-gray-500 dark:text-slate-400">Đã thanh lý: <span className="font-bold text-gray-700 dark:text-slate-200">{stats.liquidatedCount}</span></span>
                            </div>
                            <div className="w-px h-4 bg-gray-200 dark:bg-slate-600"></div>
                            <span className="text-xs text-gray-500 dark:text-slate-400">Tổng giá trị: <span className="font-bold text-gray-900 dark:text-slate-100">{formatCurrency(stats.totalValue)}</span></span>
                        </div>
                        <span className="text-xs text-gray-400 dark:text-slate-500">{filteredContracts.length} hợp đồng</span>
                    </div>
                </div>

                {filteredContracts.length === 0 && (
                    <div className="p-20 text-center dark:text-slate-400">
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center mx-auto mb-5 ring-1 ring-gray-200 dark:ring-slate-600">
                            <FileText className="w-10 h-10 text-gray-300 dark:text-slate-500" />
                        </div>
                        <p className="text-gray-600 dark:text-slate-400 font-bold text-lg">Không tìm thấy hợp đồng</p>
                        <p className="text-gray-400 dark:text-slate-500 text-sm mt-2">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default ContractList;
