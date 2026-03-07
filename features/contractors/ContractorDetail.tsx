import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useContractors } from '../../hooks/useContractors';
import { useAllBiddingPackages } from '../../hooks/useAllBiddingPackages';
import { useContracts } from '../../hooks/useContracts';
import { ArrowLeft, Building2, MapPin, Phone, FileText, DollarSign, Award, User, Calendar, Hash, Briefcase } from 'lucide-react';

const ContractorDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { contractors: allContractors } = useContractors();
    const { biddingPackages: allBiddingPackages } = useAllBiddingPackages();
    const { contracts: allContracts } = useContracts();

    // Find Contractor
    const contractor = allContractors.find(c => c.ContractorID === id);

    // Find Won Packages
    const wonPackages = allBiddingPackages.filter(p => p.WinningContractorID === id);

    // Find Contracts
    const contracts = allContracts.filter(c => c.ContractorID === id);

    if (!contractor) return <div className="p-8 text-center text-gray-500 dark:text-slate-400">Không tìm thấy nhà thầu.</div>;

    // Derived Stats
    const totalWonValue = wonPackages.reduce((sum, p) => sum + (p.WinningPrice || 0), 0);
    const activeContracts = contracts.filter(c => c.Status === 1).length;

    const infoItems = [
        { icon: Hash, label: 'Mã số thuế', value: contractor.TaxCode },
        { icon: MapPin, label: 'Địa chỉ', value: contractor.Address },
        { icon: Phone, label: 'Liên hệ', value: contractor.ContactInfo },
        { icon: User, label: 'Người đại diện', value: contractor.Representative },
        { icon: Calendar, label: 'Năm thành lập', value: contractor.EstablishedYear ? String(contractor.EstablishedYear) : undefined },
        { icon: Award, label: 'Mã chứng chỉ năng lực', value: contractor.CapCertCode },
    ].filter(item => item.value);

    const statCards = [
        { label: 'Tổng giá trị trúng thầu', value: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(totalWonValue), color: 'bg-blue-50 dark:bg-blue-900/30', textColor: 'text-blue-600 dark:text-blue-400' },
        { label: 'Gói thầu đã trúng', value: String(wonPackages.length), color: 'bg-emerald-50 dark:bg-emerald-900/30', textColor: 'text-emerald-600 dark:text-emerald-400' },
        { label: 'Hợp đồng đang thực hiện', value: `${activeContracts} / ${contracts.length}`, color: 'bg-purple-50 dark:bg-purple-900/30', textColor: 'text-purple-600 dark:text-purple-400' },
    ];

    return (
        <div className="bg-gray-50 dark:bg-slate-900 min-h-screen p-8 animate-in fade-in duration-300">
            {/* Header */}
            <div className="max-w-6xl mx-auto mb-8">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 transition-colors mb-4">
                    <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
                </button>

                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-200 dark:border-slate-700 p-8">
                    <div className="flex flex-col md:flex-row justify-between gap-8">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${contractor.IsForeign ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300' : 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'}`}>
                                    {contractor.IsForeign ? 'Nhà thầu quốc tế' : 'Nhà thầu trong nước'}
                                </span>
                                <span className="text-gray-400 dark:text-slate-500 font-mono text-sm">#{contractor.ContractorID}</span>
                            </div>
                            <h1 className="text-3xl font-black text-gray-800 dark:text-slate-100 mb-4">{contractor.FullName}</h1>

                            <div className="space-y-2.5">
                                {infoItems.map(item => (
                                    <p key={item.label} className="flex items-center gap-2 text-gray-600 dark:text-slate-300">
                                        <item.icon className="w-4 h-4 text-gray-400 dark:text-slate-500 shrink-0" />
                                        <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase w-28 shrink-0">{item.label}:</span>
                                        <span className="font-medium">{item.value}</span>
                                    </p>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            {statCards.map(stat => (
                                <div key={stat.label} className={`${stat.color} p-5 rounded-2xl min-w-[180px]`}>
                                    <p className={`text-xs font-bold ${stat.textColor} uppercase mb-1`}>{stat.label}</p>
                                    <p className="text-2xl font-black text-gray-800 dark:text-slate-100">{stat.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto space-y-8">
                {/* Won Packages List */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-200 dark:border-slate-700 p-8">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                        <Award className="w-6 h-6 text-yellow-500" /> Lịch sử đấu thầu & Trúng thầu
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600 dark:text-slate-300">
                            <thead className="bg-gray-50 dark:bg-slate-700/50 text-xs uppercase font-bold text-gray-500 dark:text-slate-400">
                                <tr>
                                    <th className="px-4 py-3 rounded-tl-xl">Mã gói thầu</th>
                                    <th className="px-4 py-3">Tên gói thầu</th>
                                    <th className="px-4 py-3 text-right">Giá trúng thầu</th>
                                    <th className="px-4 py-3">Hình thức</th>
                                    <th className="px-4 py-3 text-center rounded-tr-xl">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                {wonPackages.map(pkg => (
                                    <tr key={pkg.PackageID} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-4 py-3 font-mono text-xs">{pkg.PackageNumber}</td>
                                        <td className="px-4 py-3 font-medium text-gray-800 dark:text-slate-200 max-w-md truncate" title={pkg.PackageName}>{pkg.PackageName}</td>
                                        <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                            {pkg.WinningPrice ? pkg.WinningPrice.toLocaleString('vi-VN') : '-'}
                                        </td>
                                        <td className="px-4 py-3">{pkg.SelectionMethod}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-lg text-xs font-bold">Đã trúng thầu</span>
                                        </td>
                                    </tr>
                                ))}
                                {wonPackages.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-gray-400 dark:text-slate-500 italic">Chưa có dữ liệu trúng thầu.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Contracts List */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-200 dark:border-slate-700 p-8">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-blue-500" /> Hợp đồng đã ký ({contracts.length})
                    </h3>
                    {contracts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {contracts.map(c => (
                                <div key={c.ContractID} onClick={() => navigate(`/contracts/${c.ContractID}`)} className="p-4 border border-gray-200 dark:border-slate-700 rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-700/30 cursor-pointer transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-lg text-xs font-bold font-mono">{c.ContractID}</span>
                                        <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${c.Status === 1 ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400'}`}>
                                            {c.Status === 1 ? 'Đang thực hiện' : 'Đã kết thúc'}
                                        </span>
                                    </div>
                                    <p className="font-bold text-gray-800 dark:text-slate-200 mb-1">Giá trị: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(c.Value)}</p>
                                    <p className="text-xs text-gray-500 dark:text-slate-400">Ngày ký: {c.SignDate}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-400 dark:text-slate-500 italic py-8">Chưa có hợp đồng nào.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ContractorDetail;
