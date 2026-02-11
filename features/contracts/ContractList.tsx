
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../mockData';
import { Contract, ContractStatus, PaymentStatus } from '../../types';
import {
    ShieldAlert, ShieldCheck, FileText, Search, Plus, Filter,
    Building2, TrendingUp, CheckCircle2, Clock, DollarSign,
    ChevronRight, BarChart3, Briefcase, ArrowUpRight
} from 'lucide-react';
import { useContracts } from '../../hooks/useContracts';
import { usePayments } from '../../hooks/usePayments';
import { useProjects } from '../../hooks/useProjects';
import { mockContractors, mockBiddingPackages } from '../../mockData';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';

const ContractList: React.FC = () => {
    const navigate = useNavigate();
    const { contracts, isLoading } = useContracts();
    const { payments } = usePayments();
    const { projects } = useProjects();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | ContractStatus>('all');

    // Cross-module data helpers
    const getContractorName = (contractorId: string): string => {
        const contractor = mockContractors.find(c => c.ContractorID === contractorId);
        return contractor?.FullName || contractorId;
    };

    const getProjectName = (contract: Contract): string => {
        const pkg = mockBiddingPackages.find(p => p.PackageID === contract.PackageID);
        if (!pkg) return '—';
        const project = projects.find(p => p.ProjectID === pkg.ProjectID);
        return project?.ProjectName || '—';
    };

    const getPaymentProgress = (contractId: string, contractValue: number) => {
        const contractPayments = payments.filter(p => p.ContractID === contractId);
        const paid = contractPayments
            .filter(p => p.Status === PaymentStatus.Transferred)
            .reduce((sum, p) => sum + p.Amount, 0);
        const percent = contractValue > 0 ? (paid / contractValue) * 100 : 0;
        return { paid, percent, count: contractPayments.length };
    };

    // Stats
    const stats = useMemo(() => {
        const totalValue = contracts.reduce((sum, c) => sum + c.Value, 0);
        const executingCount = contracts.filter(c => c.Status === ContractStatus.Executing).length;
        const liquidatedCount = contracts.filter(c => c.Status === ContractStatus.Liquidated).length;
        const totalPaid = payments
            .filter(p => p.Status === PaymentStatus.Transferred)
            .reduce((sum, p) => sum + p.Amount, 0);
        return { total: contracts.length, totalValue, executingCount, liquidatedCount, totalPaid };
    }, [contracts, payments]);

    // Filtering
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
            label: 'Tổng hợp đồng',
            value: stats.total,
            suffix: 'HĐ',
            icon: FileText,
            gradient: 'from-blue-500 to-indigo-600',
            bgIcon: 'text-blue-200',
        },
        {
            label: 'Tổng giá trị HĐ',
            value: formatCurrency(stats.totalValue),
            icon: DollarSign,
            gradient: 'from-emerald-500 to-teal-600',
            bgIcon: 'text-emerald-200',
        },
        {
            label: 'Đang thực hiện',
            value: stats.executingCount,
            suffix: 'HĐ',
            icon: TrendingUp,
            gradient: 'from-violet-500 to-purple-600',
            bgIcon: 'text-violet-200',
        },
        {
            label: 'Đã giải ngân',
            value: formatCurrency(stats.totalPaid),
            icon: CheckCircle2,
            gradient: 'from-amber-500 to-orange-600',
            bgIcon: 'text-amber-200',
        },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card, idx) => (
                    <div key={idx} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.gradient} text-white p-5 shadow-lg`}>
                        <div className={`absolute -right-4 -top-4 opacity-20 ${card.bgIcon}`}>
                            <card.icon className="w-24 h-24" />
                        </div>
                        <div className="relative">
                            <p className="text-xs font-bold uppercase tracking-widest text-white/80">{card.label}</p>
                            <p className="text-2xl font-black mt-2 tracking-tight">
                                {card.value}{card.suffix && <span className="text-base font-medium ml-1 text-white/70">{card.suffix}</span>}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row items-center gap-3">
                <div className="w-full md:w-80">
                    <Input
                        placeholder="Tìm mã HĐ, nhà thầu, dự án..."
                        leftIcon={<Search className="w-4 h-4" />}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    {[
                        { value: 'all' as const, label: 'Tất cả', count: stats.total },
                        { value: ContractStatus.Executing, label: 'Đang thực hiện', count: stats.executingCount },
                        { value: ContractStatus.Liquidated, label: 'Đã thanh lý', count: stats.liquidatedCount },
                    ].map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => setStatusFilter(opt.value)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${statusFilter === opt.value
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            {opt.label} <span className="ml-1 opacity-60">({opt.count})</span>
                        </button>
                    ))}
                </div>
                <div className="ml-auto">
                    <Button leftIcon={<Plus className="w-4 h-4" />}>Thêm HĐ</Button>
                </div>
            </div>

            {/* Contract Table */}
            <Card className="overflow-hidden border-0 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50/80 text-xs uppercase font-bold text-gray-500 tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Số hợp đồng</th>
                                <th className="px-6 py-4">Nhà thầu</th>
                                <th className="px-6 py-4">Dự án</th>
                                <th className="px-6 py-4 text-right">Giá trị HĐ</th>
                                <th className="px-6 py-4 text-center">Thanh toán</th>
                                <th className="px-6 py-4 text-center">Ngày ký</th>
                                <th className="px-6 py-4 text-center">Trạng thái</th>
                                <th className="px-6 py-4 w-12"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredContracts.map((contract) => {
                                const payProgress = getPaymentProgress(contract.ContractID, contract.Value);
                                const contractorName = getContractorName(contract.ContractorID);
                                const projectName = getProjectName(contract);

                                return (
                                    <tr
                                        key={contract.ContractID}
                                        className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                                        onClick={() => navigate(`/contracts/${encodeURIComponent(contract.ContractID)}`)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                                    <FileText className="w-4 h-4" />
                                                </div>
                                                <span className="font-bold text-blue-600 group-hover:text-blue-700">{contract.ContractID}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                                    <Building2 className="w-3.5 h-3.5 text-gray-500" />
                                                </div>
                                                <span className="font-medium text-gray-800 max-w-[180px] truncate" title={contractorName}>
                                                    {contractorName}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-gray-600 max-w-[200px] truncate block text-xs" title={projectName}>
                                                {projectName}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-bold text-gray-900 font-mono tracking-tight">{formatCurrency(contract.Value)}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="w-full max-w-[100px] bg-gray-100 rounded-full h-2">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-700 ${payProgress.percent >= 80 ? 'bg-emerald-500' : payProgress.percent >= 40 ? 'bg-blue-500' : 'bg-amber-500'}`}
                                                        style={{ width: `${Math.min(payProgress.percent, 100)}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-400">
                                                    {payProgress.percent.toFixed(0)}% · {payProgress.count} đợt
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center text-xs text-gray-500">{contract.SignDate}</td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge variant={contract.Status === ContractStatus.Executing ? 'info' : contract.Status === ContractStatus.Liquidated ? 'success' : 'warning'}>
                                                {contract.Status === ContractStatus.Executing ? 'Đang thực hiện' :
                                                    contract.Status === ContractStatus.Liquidated ? 'Đã thanh lý' : 'Tạm dừng'}
                                            </Badge>
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
                {filteredContracts.length === 0 && (
                    <div className="p-16 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-gray-500 font-medium">Không tìm thấy hợp đồng nào.</p>
                        <p className="text-gray-400 text-sm mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default ContractList;
