import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ProjectService from '../../../../services/ProjectService';
import { PackageStatus } from '../../../../types';
import { formatCurrency, formatDate } from '../../../../utils/format';
import {
    Briefcase, CheckCircle2,
    FileText, Search, Plus, MoreVertical
} from 'lucide-react';

interface ProjectPackagesTabProps {
    projectID: string;
}

export const ProjectPackagesTab: React.FC<ProjectPackagesTabProps> = ({ projectID }) => {
    const { data: packages, isLoading, error } = useQuery({
        queryKey: ['project-packages', projectID],
        queryFn: () => ProjectService.getPackagesByProject(projectID)
    });

    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    const getStatusColor = (status: PackageStatus) => {
        switch (status) {
            case PackageStatus.Planning: return 'bg-gray-100 text-gray-600';
            case PackageStatus.Bidding: return 'bg-blue-100 text-blue-700';
            case PackageStatus.Evaluating: return 'bg-yellow-100 text-yellow-700';
            case PackageStatus.Awarded: return 'bg-green-100 text-green-700';
            case PackageStatus.Posted: return 'bg-indigo-100 text-indigo-700';
            case PackageStatus.Cancelled: return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const getStatusLabel = (status: PackageStatus) => {
        switch (status) {
            case PackageStatus.Planning: return 'Trong kế hoạch';
            case PackageStatus.Bidding: return 'Đang mời thầu';
            case PackageStatus.Evaluating: return 'Đang xét thầu';
            case PackageStatus.Awarded: return 'Đã có kết quả';
            case PackageStatus.Posted: return 'Đã đăng tải (E-TBMT)';
            case PackageStatus.Cancelled: return 'Hủy thầu';
            default: return status;
        }
    };

    const filteredPackages = packages?.filter(pkg => {
        const matchesStatus = filterStatus === 'all' || pkg.Status === filterStatus;
        const matchesSearch = pkg.PackageName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pkg.PackageNumber.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    if (isLoading) return <div className="p-8 text-center text-gray-500">Đang tải dữ liệu gói thầu...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Không thể tải dữ liệu gói thầu</div>;

    return (
        <div className="space-y-6">
            {/* Header / Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Tổng số gói thầu</p>
                            <h3 className="text-2xl font-bold text-gray-800 mt-1">{packages?.length || 0}</h3>
                        </div>
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <Briefcase size={20} />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Tổng giá trị (Dự toán)</p>
                            <h3 className="text-2xl font-bold text-gray-800 mt-1">
                                {formatCurrency(packages?.reduce((sum, p) => sum + (p.Price || 0), 0) || 0)}
                            </h3>
                        </div>
                        <div className="p-2 bg-green-50 rounded-lg text-green-600">
                            <FileText size={20} />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Đã có kết quả</p>
                            <h3 className="text-2xl font-bold text-gray-800 mt-1">
                                {packages?.filter(p => p.Status === PackageStatus.Awarded).length || 0}
                            </h3>
                        </div>
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                            <CheckCircle2 size={20} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm gói thầu..."
                            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value={PackageStatus.Planning}>Trong kế hoạch</option>
                        <option value={PackageStatus.Bidding}>Đang mời thầu</option>
                        <option value={PackageStatus.Evaluating}>Đang xét thầu</option>
                        <option value={PackageStatus.Awarded}>Đã trúng thầu</option>
                    </select>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm shadow-blue-200">
                    <Plus size={16} />
                    <span>Thêm gói thầu</span>
                </button>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3 min-w-[200px]">Gói thầu / Mã TBMT</th>
                                <th className="px-6 py-3">Giá gói thầu</th>
                                <th className="px-6 py-3">Hình thức & Phương thức</th>
                                <th className="px-6 py-3">Thời gian</th>
                                <th className="px-6 py-3">Trạng thái</th>
                                <th className="px-6 py-3">Kết quả LCNT</th>
                                <th className="px-6 py-3 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredPackages?.map((pkg) => (
                                <tr key={pkg.PackageID} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-gray-800">{pkg.PackageNumber}</span>
                                                {pkg.NotificationCode && (
                                                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded border border-gray-200 font-mono">
                                                        {pkg.NotificationCode}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-gray-600 line-clamp-2 font-medium" title={pkg.PackageName}>{pkg.PackageName}</span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-xs px-2 py-0.5 rounded border ${pkg.Field === 'Construction' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                        pkg.Field === 'Consultancy' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                                            'bg-gray-50 text-gray-500 border-gray-200'
                                                    }`}>
                                                    {pkg.Field === 'Construction' ? 'Xây lắp' : pkg.Field === 'Consultancy' ? 'Tư vấn' : 'Khác'}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-gray-800 whitespace-nowrap">
                                        {formatCurrency(pkg.Price)}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-medium text-gray-700">
                                                {pkg.SelectionMethod === 'OpenBidding' ? 'Đấu thầu rộng rãi' :
                                                    pkg.SelectionMethod === 'Appointed' ? 'Chỉ định thầu' : pkg.SelectionMethod}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {pkg.SelectionProcedure === 'OneStageOneEnvelope' ? '1 GĐ 1 túi HS' :
                                                    pkg.SelectionProcedure === 'OneStageTwoEnvelope' ? '1 GĐ 2 túi HS' :
                                                        pkg.SelectionProcedure === 'Reduced' ? 'Rút gọn' : '-'}
                                            </span>
                                            <span className="text-xs text-blue-600">
                                                {pkg.BidType === 'Online' ? '• Đấu thầu qua mạng' : '• Đấu thầu trực tiếp'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-600 whitespace-nowrap">
                                        <div className="flex flex-col gap-1">
                                            <div>Đăng tải: <span className="font-medium">{formatDate(pkg.PostingDate) || '-'}</span></div>
                                            <div>Đóng thầu: <span className="text-red-600 font-medium">{formatDate(pkg.BidClosingDate) || '-'}</span></div>
                                            <div>Mở thầu: <span className="font-medium">{formatDate(pkg.BidOpeningDate) || '-'}</span></div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(pkg.Status).replace('bg-', 'border-').replace('text-', 'text-')} ${getStatusColor(pkg.Status)}`}>
                                            {getStatusLabel(pkg.Status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {pkg.WinningContractorID ? (
                                            <div className="flex flex-col text-sm">
                                                <span className="text-indigo-700 font-medium">Bên trúng thầu: CT-001</span> {/* Mock name */}
                                                <span className="text-xs text-green-600 font-bold mt-0.5">Giá: {formatCurrency(pkg.WinningPrice || 0)}</span>
                                                <span className="text-[10px] text-gray-400">QĐ: {formatDate(pkg.ApprovalDate_Result) || '...'}</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 italic text-xs">Chưa có kết quả</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
                                            <MoreVertical size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredPackages?.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                        Không tìm thấy gói thầu nào
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
