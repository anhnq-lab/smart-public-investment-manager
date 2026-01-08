import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockContractors, mockBiddingPackages, mockContracts } from '../mockData';
import { ArrowLeft, Building2, MapPin, Phone, FileText, CheckCircle2, DollarSign, Award } from 'lucide-react';

const ContractorDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // Find Contractor
    const contractor = mockContractors.find(c => c.ContractorID === id);

    // Find Won Packages
    const wonPackages = mockBiddingPackages.filter(p => p.WinningContractorID === id);

    // Find Contracts
    const contracts = mockContracts.filter(c => c.ContractorID === id);

    if (!contractor) return <div className="p-8 text-center text-gray-500">Không tìm thấy nhà thầu.</div>;

    // Derived Stats
    const totalWonValue = wonPackages.reduce((sum, p) => sum + (p.WinningPrice || 0), 0);
    const activeContracts = contracts.filter(c => c.Status === 1).length;

    return (
        <div className="bg-[#F8FAFC] min-h-screen p-8 animate-in fade-in duration-300">
            {/* Header */}
            <div className="max-w-6xl mx-auto mb-8">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors mb-4">
                    <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
                </button>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                    <div className="flex flex-col md:flex-row justify-between gap-8">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${contractor.IsForeign ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                    {contractor.IsForeign ? 'Nhà thầu quốc tế' : 'Nhà thầu trong nước'}
                                </span>
                                <span className="text-gray-400 font-mono text-sm">#{contractor.ContractorID}</span>
                            </div>
                            <h1 className="text-3xl font-black text-gray-800 mb-4">{contractor.FullName}</h1>

                            <div className="space-y-2 text-gray-600">
                                <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400" /> {contractor.Address}</p>
                                <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" /> {contractor.ContactInfo}</p>
                                <p className="flex items-center gap-2">
                                    <Award className="w-4 h-4 text-gray-400" />
                                    Mã chứng chỉ năng lực: <span className="font-bold text-gray-800">{contractor.CapCertCode}</span>
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="bg-blue-50 p-6 rounded-2xl min-w-[160px]">
                                <p className="text-sm font-bold text-blue-600 uppercase mb-1">Tổng giá trị trúng thầu</p>
                                <p className="text-2xl font-black text-gray-800">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(totalWonValue)}
                                </p>
                            </div>
                            <div className="bg-emerald-50 p-6 rounded-2xl min-w-[160px]">
                                <p className="text-sm font-bold text-emerald-600 uppercase mb-1">Số lượng gói thầu</p>
                                <p className="text-2xl font-black text-gray-800">{wonPackages.length}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto space-y-8">
                {/* Won Packages List */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <Award className="w-6 h-6 text-yellow-500" /> Lịch sử đấu thầu & Trúng thầu
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500">
                                <tr>
                                    <th className="px-4 py-3">Mã gói thầu</th>
                                    <th className="px-4 py-3">Tên gói thầu</th>
                                    <th className="px-4 py-3 text-right">Giá trúng thầu</th>
                                    <th className="px-4 py-3">Hình thức</th>
                                    <th className="px-4 py-3 text-center">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {wonPackages.map(pkg => (
                                    <tr key={pkg.PackageID} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-mono text-xs">{pkg.PackageNumber}</td>
                                        <td className="px-4 py-3 font-medium text-gray-800 max-w-md truncate" title={pkg.PackageName}>{pkg.PackageName}</td>
                                        <td className="px-4 py-3 text-right font-bold text-emerald-600">
                                            {pkg.WinningPrice ? pkg.WinningPrice.toLocaleString('vi-VN') : '-'}
                                        </td>
                                        <td className="px-4 py-3">{pkg.SelectionMethod}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">Đã trúng thầu</span>
                                        </td>
                                    </tr>
                                ))}
                                {wonPackages.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-gray-400 italic">Chưa có dữ liệu trúng thầu.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Contracts List */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-blue-500" /> Hợp đồng đã ký ({contracts.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {contracts.map(c => (
                            <div key={c.ContractID} onClick={() => navigate(`/contracts/${c.ContractID}`)} className="p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 cursor-pointer transition-all">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold font-mono">{c.ContractID}</span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${c.Status === 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {c.Status === 1 ? 'Đang thực hiện' : 'Đã kết thúc'}
                                    </span>
                                </div>
                                <p className="font-bold text-gray-800 mb-1">Giá trị: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(c.Value)}</p>
                                <p className="text-xs text-gray-500">Ngày ký: {c.SignDate}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ContractorDetail;
