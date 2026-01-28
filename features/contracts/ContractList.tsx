
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../mockData';
import { ContractStatus } from '../../types';
import { ShieldAlert, ShieldCheck, FileText, Search, Plus } from 'lucide-react';
import { useContracts } from '../../hooks/useContracts';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';

const ContractList: React.FC = () => {
    const navigate = useNavigate();
    const { contracts, isLoading } = useContracts();
    const [searchQuery, setSearchQuery] = React.useState('');

    const filteredContracts = contracts.filter(c =>
        c.ContractID.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.ContractorID.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between">
                    <Skeleton className="h-10 w-96 rounded-xl" />
                    <Skeleton className="h-10 w-32 rounded-xl" />
                </div>
                <Card className="p-6">
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className="h-12 w-full rounded-lg" />
                        ))}
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý Hợp đồng</h1>
                    <p className="text-gray-500">Theo dõi tiến độ, giá trị và bảo lãnh hợp đồng</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="w-full md:w-64">
                        <Input
                            placeholder="Tìm số hợp đồng, nhà thầu..."
                            leftIcon={<Search className="w-4 h-4" />}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button leftIcon={<Plus className="w-4 h-4" />}>
                        Thêm HĐ
                    </Button>
                </div>
            </div>

            <Card className="overflow-hidden border-0 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50/50 text-xs uppercase font-semibold text-gray-500">
                            <tr>
                                <th className="px-6 py-4">Số hợp đồng</th>
                                <th className="px-6 py-4">Nhà thầu</th>
                                <th className="px-6 py-4 text-right">Giá trị HĐ</th>
                                <th className="px-6 py-4 text-center">Ngày ký</th>
                                <th className="px-6 py-4 text-center">Bảo lãnh HĐ (HD-02)</th>
                                <th className="px-6 py-4 text-center">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredContracts.map((contract, idx) => {
                                // Mock guarantee data randomly
                                const isExpired = idx % 5 === 0;
                                const guaranteeDate = isExpired ? "15/01/2025" : "31/12/2025";

                                return (
                                    <tr
                                        key={contract.ContractID}
                                        className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                                        onClick={() => navigate(`/contracts/${encodeURIComponent(contract.ContractID)}`)}
                                    >
                                        <td className="px-6 py-4 font-medium text-blue-600 group-hover:text-blue-700 flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-blue-400" />
                                            {contract.ContractID}
                                        </td>
                                        <td className="px-6 py-4 font-medium">{contract.ContractorID}</td>
                                        <td className="px-6 py-4 text-right font-medium text-gray-900 font-mono tracking-tight">{formatCurrency(contract.Value)}</td>
                                        <td className="px-6 py-4 text-center text-gray-500">{contract.SignDate}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${isExpired ? 'bg-red-50 border-red-100 text-red-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                                }`}>
                                                {isExpired ? <ShieldAlert className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                                                <span className="text-xs font-medium">{guaranteeDate}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge variant={contract.Status === ContractStatus.Executing ? 'success' : 'warning'}>
                                                {contract.Status === ContractStatus.Executing ? 'Đang thực hiện' : 'Tạm dừng'}
                                            </Badge>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {filteredContracts.length === 0 && (
                    <div className="p-12 text-center text-gray-500">
                        <p>Không tìm thấy hợp đồng nào.</p>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default ContractList;
