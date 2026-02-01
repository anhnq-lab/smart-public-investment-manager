import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ProjectService from '../../../../services/ProjectService';
import ApiClient from '../../../../services/api';
import { BiddingPackage, PackageStatus } from '../../../../types';
import { formatCurrency, formatDate } from '../../../../utils/format';
import { BiddingPackageModal } from '../BiddingPackageModal';
import { BiddingPackageDetail } from '../BiddingPackageDetail';
import {
    Briefcase, CheckCircle2, FileText, Search, Plus,
    MoreVertical, Eye, Edit, Trash2, ExternalLink,
    Copy, X, AlertTriangle, Loader2, Clock, Circle
} from 'lucide-react';

// ========================================
// PROJECT PACKAGES TAB - CRUD Operations
// ========================================

interface ProjectPackagesTabProps {
    projectID: string;
}

export const ProjectPackagesTab: React.FC<ProjectPackagesTabProps> = ({ projectID }) => {
    const queryClient = useQueryClient();

    const { data: packages, isLoading, error } = useQuery({
        queryKey: ['project-packages', projectID],
        queryFn: () => ProjectService.getPackagesByProject(projectID)
    });

    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState<BiddingPackage | null>(null);

    // Dropdown state
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (packageId: string) => ApiClient.delete(`/api/bidding-packages/${packageId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-packages', projectID] });
            setIsDeleteConfirmOpen(false);
            setSelectedPackage(null);
        },
    });

    const getStatusColor = (status: PackageStatus) => {
        switch (status) {
            case PackageStatus.Planning: return 'bg-gray-100 text-gray-600 border-gray-200';
            case PackageStatus.Posted: return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            case PackageStatus.Bidding: return 'bg-blue-100 text-blue-700 border-blue-200';
            case PackageStatus.Evaluating: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case PackageStatus.Awarded: return 'bg-green-100 text-green-700 border-green-200';
            case PackageStatus.Cancelled: return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    };

    const getStatusLabel = (status: PackageStatus) => {
        switch (status) {
            case PackageStatus.Planning: return 'Trong kế hoạch';
            case PackageStatus.Posted: return 'Đã đăng tải';
            case PackageStatus.Bidding: return 'Đang mời thầu';
            case PackageStatus.Evaluating: return 'Đang xét thầu';
            case PackageStatus.Awarded: return 'Đã có kết quả';
            case PackageStatus.Cancelled: return 'Hủy thầu';
            default: return status;
        }
    };

    const filteredPackages = packages?.filter(pkg => {
        const matchesStatus = filterStatus === 'all' || pkg.Status === filterStatus;
        const matchesSearch = pkg.PackageName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pkg.PackageNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (pkg.NotificationCode?.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesStatus && matchesSearch;
    });

    // Handlers
    const handleView = (pkg: BiddingPackage) => {
        setSelectedPackage(pkg);
        setIsDetailModalOpen(true);
        setOpenDropdownId(null);
    };

    const handleEdit = (pkg: BiddingPackage) => {
        setSelectedPackage(pkg);
        setIsEditModalOpen(true);
        setOpenDropdownId(null);
    };

    const handleDelete = (pkg: BiddingPackage) => {
        setSelectedPackage(pkg);
        setIsDeleteConfirmOpen(true);
        setOpenDropdownId(null);
    };

    const handleCopyTBMT = (code: string) => {
        navigator.clipboard.writeText(`https://muasamcong.mpi.gov.vn/web/guest/contractor-selection?noticeNo=${code}`);
        setOpenDropdownId(null);
    };

    const confirmDelete = () => {
        if (selectedPackage) {
            deleteMutation.mutate(selectedPackage.PackageID);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Đang tải dữ liệu gói thầu...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Không thể tải dữ liệu gói thầu</div>;

    return (
        <div className="space-y-6">
            {/* Header / Statistics */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                {/* Main Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Total Packages */}
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                            <Briefcase size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Tổng gói thầu</p>
                            <h3 className="text-2xl font-bold text-gray-800 tabular-nums">{packages?.length || 0}</h3>
                        </div>
                    </div>

                    {/* Total Value */}
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                            <FileText size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Tổng giá trị (DT)</p>
                            <h3 className="text-2xl font-bold text-gray-800 tabular-nums">
                                {formatCurrency(packages?.reduce((sum, p) => sum + (p.Price || 0), 0) || 0)}
                            </h3>
                        </div>
                    </div>

                    {/* Awarded Packages */}
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                            <CheckCircle2 size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Đã có kết quả</p>
                            <h3 className="text-2xl font-bold text-gray-800 tabular-nums">
                                {packages?.filter(p => p.Status === PackageStatus.Awarded).length || 0}
                                <span className="text-sm font-normal text-gray-400">/{packages?.length || 0}</span>
                            </h3>
                        </div>
                    </div>

                    {/* In Progress */}
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                            <Clock size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Đang thực hiện</p>
                            <h3 className="text-2xl font-bold text-gray-800 tabular-nums">
                                {packages?.filter(p => p.Status === PackageStatus.Bidding || p.Status === PackageStatus.Evaluating).length || 0}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-6 pt-5 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Tiến độ hoàn thành đấu thầu</span>
                        <span className="text-sm font-bold text-gray-800 tabular-nums">
                            {packages?.length > 0
                                ? Math.round((packages.filter(p => p.Status === PackageStatus.Awarded).length / packages.length) * 100)
                                : 0}%
                        </span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
                        {/* Awarded */}
                        <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-green-600 transition-all"
                            style={{ width: `${packages?.length > 0 ? (packages.filter(p => p.Status === PackageStatus.Awarded).length / packages.length) * 100 : 0}%` }}
                            title="Đã có kết quả"
                        />
                        {/* Evaluating */}
                        <div
                            className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 transition-all"
                            style={{ width: `${packages?.length > 0 ? (packages.filter(p => p.Status === PackageStatus.Evaluating).length / packages.length) * 100 : 0}%` }}
                            title="Đang xét thầu"
                        />
                        {/* Bidding */}
                        <div
                            className="h-full bg-gradient-to-r from-blue-400 to-blue-500 transition-all"
                            style={{ width: `${packages?.length > 0 ? (packages.filter(p => p.Status === PackageStatus.Bidding).length / packages.length) * 100 : 0}%` }}
                            title="Đang mời thầu"
                        />
                        {/* Posted */}
                        <div
                            className="h-full bg-gradient-to-r from-indigo-300 to-indigo-400 transition-all"
                            style={{ width: `${packages?.length > 0 ? (packages.filter(p => p.Status === PackageStatus.Posted).length / packages.length) * 100 : 0}%` }}
                            title="Đã đăng tải"
                        />
                    </div>
                    {/* Legend */}
                    <div className="flex flex-wrap gap-4 mt-3 text-xs">
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                            <span className="text-gray-600">Đã có kết quả ({packages?.filter(p => p.Status === PackageStatus.Awarded).length || 0})</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                            <span className="text-gray-600">Đang xét thầu ({packages?.filter(p => p.Status === PackageStatus.Evaluating).length || 0})</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                            <span className="text-gray-600">Đang mời thầu ({packages?.filter(p => p.Status === PackageStatus.Bidding).length || 0})</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
                            <span className="text-gray-600">Đã đăng tải ({packages?.filter(p => p.Status === PackageStatus.Posted).length || 0})</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-gray-300"></span>
                            <span className="text-gray-600">Trong kế hoạch ({packages?.filter(p => p.Status === PackageStatus.Planning).length || 0})</span>
                        </span>
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
                            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value={PackageStatus.Planning}>Trong kế hoạch</option>
                        <option value={PackageStatus.Posted}>Đã đăng tải</option>
                        <option value={PackageStatus.Bidding}>Đang mời thầu</option>
                        <option value={PackageStatus.Evaluating}>Đang xét thầu</option>
                        <option value={PackageStatus.Awarded}>Đã có kết quả</option>
                    </select>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium shadow-sm shadow-primary-200"
                >
                    <Plus size={16} />
                    <span>Thêm gói thầu</span>
                </button>
            </div>

            {/* PHỤ LỤC KHLCNT - Bảng theo định dạng chính thức */}
            <div className="bg-white rounded-xl border border-gray-300 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                        {/* Header - 2 rows like official KHLCNT */}
                        <thead>
                            <tr className="bg-slate-100 border-b border-slate-300">
                                <th rowSpan={2} className="border border-slate-300 px-2 py-2 text-center font-bold text-slate-700 w-10">TT</th>
                                <th rowSpan={2} className="border border-slate-300 px-2 py-2 text-center font-bold text-slate-700 min-w-[80px]">Tên chủ<br />đầu tư</th>
                                <th colSpan={2} className="border border-slate-300 px-2 py-2 text-center font-bold text-slate-700">Tên gói thầu</th>
                                <th rowSpan={2} className="border border-slate-300 px-2 py-2 text-center font-bold text-slate-700 w-[110px]">Giá gói thầu<br />(đồng)</th>
                                <th rowSpan={2} className="border border-slate-300 px-2 py-2 text-center font-bold text-slate-700 min-w-[100px]">Nguồn vốn</th>
                                <th rowSpan={2} className="border border-slate-300 px-2 py-2 text-center font-bold text-slate-700">Hình thức<br />lựa chọn<br />nhà thầu</th>
                                <th rowSpan={2} className="border border-slate-300 px-2 py-2 text-center font-bold text-slate-700">Phương thức<br />lựa chọn<br />nhà thầu</th>
                                <th rowSpan={2} className="border border-slate-300 px-2 py-2 text-center font-bold text-slate-700 w-[90px]">Thời gian<br />tổ chức<br />lựa chọn<br />nhà thầu</th>
                                <th rowSpan={2} className="border border-slate-300 px-2 py-2 text-center font-bold text-slate-700 w-[90px]">Thời gian<br />bắt đầu<br />tổ chức<br />lựa chọn<br />nhà thầu</th>
                                <th rowSpan={2} className="border border-slate-300 px-2 py-2 text-center font-bold text-slate-700">Loại<br />hợp đồng</th>
                                <th rowSpan={2} className="border border-slate-300 px-2 py-2 text-center font-bold text-slate-700 w-[90px]">Thời gian<br />thực hiện<br />gói thầu</th>
                                <th rowSpan={2} className="border border-slate-300 px-2 py-2 text-center font-bold text-slate-700 w-[60px]">Tùy chọn<br />mua thêm</th>
                                <th rowSpan={2} className="border border-slate-300 px-2 py-2 text-center font-bold text-slate-700 w-[90px]">Trạng thái</th>
                                <th rowSpan={2} className="border border-slate-300 px-2 py-2 text-center font-bold text-slate-700 w-10">TT</th>
                            </tr>
                            <tr className="bg-slate-100 border-b border-slate-300">
                                <th className="border border-slate-300 px-2 py-1 text-center font-bold text-slate-700 min-w-[120px]">Tên gói thầu</th>
                                <th className="border border-slate-300 px-2 py-1 text-center font-bold text-slate-700 min-w-[140px]">Tóm tắt công việc<br />chính của gói thầu</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPackages?.map((pkg, index) => (
                                <tr
                                    key={pkg.PackageID}
                                    className="hover:bg-blue-50 transition-colors cursor-pointer"
                                    onClick={() => handleView(pkg)}
                                >
                                    {/* TT */}
                                    <td className="border border-slate-200 px-2 py-3 text-center text-slate-600 font-medium">
                                        {index + 1}
                                    </td>

                                    {/* Tên chủ đầu tư */}
                                    <td className="border border-slate-200 px-2 py-3 text-slate-700 align-top">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-medium text-slate-800">Ban QLDA</span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded w-fit ${pkg.Field === 'Construction' ? 'bg-blue-100 text-blue-700' :
                                                pkg.Field === 'Consultancy' ? 'bg-purple-100 text-purple-700' :
                                                    pkg.Field === 'Goods' ? 'bg-orange-100 text-orange-700' :
                                                        'bg-gray-100 text-gray-600'
                                                }`}>
                                                {pkg.Field === 'Construction' ? 'Xây lắp' :
                                                    pkg.Field === 'Consultancy' ? 'Tư vấn' :
                                                        pkg.Field === 'Goods' ? 'Hàng hóa' : pkg.Field}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Tên gói thầu */}
                                    <td className="border border-slate-200 px-2 py-3 align-top">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-bold text-slate-900">{pkg.PackageNumber}</span>
                                            <span className="text-slate-700 leading-relaxed">{pkg.PackageName}</span>
                                            {pkg.NotificationCode && (
                                                <a
                                                    href={`https://muasamcong.mpi.gov.vn/web/guest/contractor-selection?noticeNo=${pkg.NotificationCode}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[10px] font-mono text-blue-600 hover:underline mt-1"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    TBMT: {pkg.NotificationCode}
                                                </a>
                                            )}
                                        </div>
                                    </td>

                                    {/* Tóm tắt công việc */}
                                    <td className="border border-slate-200 px-2 py-3 text-slate-600 align-top">
                                        {pkg.Description || pkg.PackageName}
                                    </td>

                                    {/* Giá gói thầu */}
                                    <td className="border border-slate-200 px-2 py-3 text-right font-bold text-slate-900 align-top whitespace-nowrap">
                                        {formatCurrency(pkg.Price)}
                                    </td>

                                    {/* Nguồn vốn */}
                                    <td className="border border-slate-200 px-2 py-3 text-slate-600 align-top">
                                        {pkg.FundingSource || 'Ngân sách Nhà nước'}
                                    </td>

                                    {/* Hình thức LCNT */}
                                    <td className="border border-slate-200 px-2 py-3 text-slate-700 align-top">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-medium">
                                                {pkg.SelectionMethod === 'OpenBidding' ? 'Đấu thầu rộng rãi' :
                                                    pkg.SelectionMethod === 'LimitedBidding' ? 'Đấu thầu hạn chế' :
                                                        pkg.SelectionMethod === 'Appointed' ? 'Chỉ định thầu' :
                                                            pkg.SelectionMethod === 'CompetitiveShopping' ? 'Chào hàng cạnh tranh' :
                                                                pkg.SelectionMethod === 'DirectProcurement' ? 'Mua sắm trực tiếp' :
                                                                    pkg.SelectionMethod}
                                            </span>
                                            <span className={`text-[10px] ${pkg.BidType === 'Online' ? 'text-blue-600' : 'text-slate-500'}`}>
                                                {pkg.BidType === 'Online' ? '(qua mạng)' : '(trực tiếp)'}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Phương thức LCNT */}
                                    <td className="border border-slate-200 px-2 py-3 text-slate-600 align-top">
                                        {pkg.SelectionProcedure === 'OneStageOneEnvelope' ? 'Một giai đoạn, hai túi hồ sơ' :
                                            pkg.SelectionProcedure === 'OneStageTwoEnvelope' ? 'Một giai đoạn, hai túi hồ sơ' :
                                                pkg.SelectionProcedure === 'TwoStageOneEnvelope' ? 'Hai giai đoạn' :
                                                    pkg.SelectionProcedure === 'Reduced' ? 'Rút gọn' :
                                                        pkg.SelectionProcedure === 'Normal' ? 'Thường' : '-'}
                                    </td>

                                    {/* Thời gian tổ chức LCNT */}
                                    <td className="border border-slate-200 px-2 py-3 text-center text-slate-600 align-top">
                                        {pkg.SelectionDuration || '45 ngày'}
                                    </td>

                                    {/* Thời gian bắt đầu tổ chức LCNT */}
                                    <td className="border border-slate-200 px-2 py-3 text-center text-slate-700 align-top font-medium">
                                        {pkg.SelectionStartDate || (pkg.PostingDate ? new Date(pkg.PostingDate).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }) : '-')}
                                    </td>

                                    {/* Loại hợp đồng */}
                                    <td className="border border-slate-200 px-2 py-3 text-center text-slate-700 align-top">
                                        {pkg.ContractType === 'LumpSum' ? 'Hợp đồng trọn gói' :
                                            pkg.ContractType === 'UnitPrice' ? 'Đơn giá cố định' :
                                                pkg.ContractType === 'AdjustableUnitPrice' ? 'Đơn giá điều chỉnh' :
                                                    pkg.ContractType === 'Mixed' ? 'Hỗn hợp' :
                                                        pkg.ContractType || '-'}
                                    </td>

                                    {/* Thời gian thực hiện */}
                                    <td className="border border-slate-200 px-2 py-3 text-center text-slate-700 align-top font-medium">
                                        {pkg.Duration || '-'}
                                    </td>

                                    {/* Tùy chọn mua thêm */}
                                    <td className="border border-slate-200 px-2 py-3 text-center text-slate-600 align-top">
                                        {pkg.HasOption ? 'Có' : 'Không'}
                                    </td>

                                    {/* Trạng thái */}
                                    <td className="border border-slate-200 px-2 py-3 text-center align-top">
                                        <div className="flex flex-col items-center gap-1.5">
                                            {/* Status Badge */}
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold ${getStatusColor(pkg.Status)}`}>
                                                {pkg.Status === PackageStatus.Planning && <Circle className="w-2.5 h-2.5" />}
                                                {pkg.Status === PackageStatus.Posted && <FileText className="w-2.5 h-2.5" />}
                                                {pkg.Status === PackageStatus.Bidding && <Clock className="w-2.5 h-2.5 animate-pulse" />}
                                                {pkg.Status === PackageStatus.Evaluating && <AlertTriangle className="w-2.5 h-2.5" />}
                                                {pkg.Status === PackageStatus.Awarded && <CheckCircle2 className="w-2.5 h-2.5" />}
                                                {getStatusLabel(pkg.Status)}
                                            </span>
                                            {/* Mini Progress Indicator */}
                                            <div className="flex gap-0.5">
                                                <span className={`w-2 h-1 rounded-full ${pkg.Status === PackageStatus.Planning || pkg.Status === PackageStatus.Posted || pkg.Status === PackageStatus.Bidding || pkg.Status === PackageStatus.Evaluating || pkg.Status === PackageStatus.Awarded ? 'bg-emerald-500' : 'bg-gray-200'}`}></span>
                                                <span className={`w-2 h-1 rounded-full ${pkg.Status === PackageStatus.Posted || pkg.Status === PackageStatus.Bidding || pkg.Status === PackageStatus.Evaluating || pkg.Status === PackageStatus.Awarded ? 'bg-emerald-500' : 'bg-gray-200'}`}></span>
                                                <span className={`w-2 h-1 rounded-full ${pkg.Status === PackageStatus.Bidding || pkg.Status === PackageStatus.Evaluating || pkg.Status === PackageStatus.Awarded ? 'bg-emerald-500' : 'bg-gray-200'}`}></span>
                                                <span className={`w-2 h-1 rounded-full ${pkg.Status === PackageStatus.Evaluating || pkg.Status === PackageStatus.Awarded ? 'bg-emerald-500' : 'bg-gray-200'}`}></span>
                                                <span className={`w-2 h-1 rounded-full ${pkg.Status === PackageStatus.Awarded ? 'bg-emerald-500' : 'bg-gray-200'}`}></span>
                                            </div>
                                            {/* Next Action Hint */}
                                            {pkg.Status === PackageStatus.Planning && (
                                                <span className="text-[9px] text-gray-400 italic">→ Lập E-HSMT</span>
                                            )}
                                            {pkg.Status === PackageStatus.Posted && (
                                                <span className="text-[9px] text-blue-500 italic">→ Chờ mở thầu</span>
                                            )}
                                            {pkg.Status === PackageStatus.Bidding && (
                                                <span className="text-[9px] text-amber-600 italic">→ Đang chấm thầu</span>
                                            )}
                                            {pkg.Status === PackageStatus.Evaluating && (
                                                <span className="text-[9px] text-yellow-600 italic">→ Chờ phê duyệt</span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Thao tác */}
                                    <td className="border border-slate-200 px-2 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                        <ActionDropdown
                                            pkg={pkg}
                                            isOpen={openDropdownId === pkg.PackageID}
                                            onToggle={() => setOpenDropdownId(openDropdownId === pkg.PackageID ? null : pkg.PackageID)}
                                            onClose={() => setOpenDropdownId(null)}
                                            onView={handleView}
                                            onEdit={handleEdit}
                                            onDelete={handleDelete}
                                            onCopyTBMT={handleCopyTBMT}
                                        />
                                    </td>
                                </tr>
                            ))}
                            {filteredPackages?.length === 0 && (
                                <tr>
                                    <td colSpan={15} className="border border-slate-200 px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <FileText className="w-10 h-10 text-gray-300" />
                                            <span>Không tìm thấy gói thầu nào</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {/* Tổng cộng giá gói thầu */}
                        {filteredPackages && filteredPackages.length > 0 && (
                            <tfoot>
                                <tr className="bg-slate-100 font-bold">
                                    <td colSpan={4} className="border border-slate-300 px-3 py-3 text-center text-slate-800">
                                        Tổng cộng giá gói thầu: {formatCurrency(filteredPackages.reduce((sum, pkg) => sum + pkg.Price, 0))} đồng
                                    </td>
                                    <td colSpan={11} className="border border-slate-300"></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            {/* Create Modal */}
            <BiddingPackageModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                projectId={projectID}
            />

            {/* Edit Modal */}
            <BiddingPackageModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedPackage(null);
                }}
                projectId={projectID}
                packageToEdit={selectedPackage}
            />

            {/* Detail Modal */}
            <BiddingPackageDetail
                isOpen={isDetailModalOpen}
                onClose={() => {
                    setIsDetailModalOpen(false);
                    setSelectedPackage(null);
                }}
                package_data={selectedPackage}
                onEdit={(pkg) => {
                    setIsDetailModalOpen(false);
                    handleEdit(pkg);
                }}
            />

            {/* Delete Confirmation */}
            {isDeleteConfirmOpen && selectedPackage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsDeleteConfirmOpen(false)} />
                    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-scale-in">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-red-100 rounded-full">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">Xác nhận xóa</h3>
                                <p className="text-sm text-gray-500">Hành động này không thể hoàn tác</p>
                            </div>
                        </div>
                        <p className="text-gray-600 mb-6">
                            Bạn có chắc chắn muốn xóa gói thầu <strong>{selectedPackage.PackageNumber}</strong>?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setIsDeleteConfirmOpen(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={deleteMutation.isPending}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                                {deleteMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Action Dropdown Component
interface ActionDropdownProps {
    pkg: BiddingPackage;
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
    onView: (pkg: BiddingPackage) => void;
    onEdit: (pkg: BiddingPackage) => void;
    onDelete: (pkg: BiddingPackage) => void;
    onCopyTBMT: (code: string) => void;
}

const ActionDropdown: React.FC<ActionDropdownProps> = ({
    pkg, isOpen, onToggle, onClose, onView, onEdit, onDelete, onCopyTBMT
}) => {
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={onToggle}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
            >
                <MoreVertical size={16} />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20 animate-fade-in">
                    <button
                        onClick={() => onView(pkg)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                        <Eye className="w-4 h-4" />
                        Xem chi tiết
                    </button>
                    <button
                        onClick={() => onEdit(pkg)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                        <Edit className="w-4 h-4" />
                        Chỉnh sửa
                    </button>
                    {pkg.NotificationCode && (
                        <>
                            <hr className="my-1 border-gray-100" />
                            <a
                                href={`https://muasamcong.mpi.gov.vn/web/guest/contractor-selection?noticeNo=${pkg.NotificationCode}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Xem trên MSC
                            </a>
                            <button
                                onClick={() => onCopyTBMT(pkg.NotificationCode!)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                                <Copy className="w-4 h-4" />
                                Sao chép link TBMT
                            </button>
                        </>
                    )}
                    <hr className="my-1 border-gray-100" />
                    <button
                        onClick={() => onDelete(pkg)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                        <Trash2 className="w-4 h-4" />
                        Xóa
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProjectPackagesTab;
