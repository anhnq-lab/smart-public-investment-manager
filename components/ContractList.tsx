
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { mockContracts, formatCurrency } from '../mockData';
import { ContractStatus } from '../types';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

const ContractList: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <div>
                <h2 className="text-lg font-bold text-gray-800">Quản lý Hợp đồng</h2>
                <p className="text-sm text-gray-500 mt-1">Theo dõi tiến độ, giá trị và bảo lãnh hợp đồng (HD-01, HD-02)</p>
            </div>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
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
                    {mockContracts.map((contract, idx) => {
                        // Mock guarantee data randomly
                        const isExpired = idx % 5 === 0;
                        const guaranteeDate = isExpired ? "15/01/2025" : "31/12/2025";
                        
                        return (
                            <tr 
                                key={contract.ContractID} 
                                className="hover:bg-gray-50 transition-colors cursor-pointer group"
                                onClick={() => navigate(`/contracts/${encodeURIComponent(contract.ContractID)}`)}
                            >
                                <td className="px-6 py-4 font-medium text-blue-600 group-hover:underline">{contract.ContractID}</td>
                                <td className="px-6 py-4 font-medium">{contract.ContractorID}</td>
                                <td className="px-6 py-4 text-right font-medium text-gray-900">{formatCurrency(contract.Value)}</td>
                                <td className="px-6 py-4 text-center">{contract.SignDate}</td>
                                <td className="px-6 py-4 text-center">
                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border ${
                                        isExpired ? 'bg-red-50 border-red-100 text-red-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                    }`}>
                                        {isExpired ? <ShieldAlert className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                                        <span className="text-xs font-medium">Exp: {guaranteeDate}</span>
                                    </div>
                                    {isExpired && <div className="text-[10px] text-red-500 font-bold mt-1 animate-pulse">Cần gia hạn gấp!</div>}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        contract.Status === ContractStatus.Executing ? 'bg-blue-100 text-blue-800' :
                                        contract.Status === ContractStatus.Paused ? 'bg-orange-100 text-orange-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {contract.Status === ContractStatus.Executing ? 'Đang thực hiện' : 'Tạm dừng'}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    </div>
  );
};

export default ContractList;
