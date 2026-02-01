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
    Copy, X, AlertTriangle, Loader2
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
                                <tr
                                    key={pkg.PackageID}
                                    className="hover:bg-blue-50 transition-colors cursor-pointer group"
                                    onClick={() => handleView(pkg)}
                                >
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
                                                    {pkg.Field === 'Construction' ? 'Xây lắp' : pkg.Field === 'Consultancy' ? 'Tư vấn' : pkg.Field}
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
                                                    pkg.SelectionMethod === 'Appointed' ? 'Chỉ định thầu' :
                                                        pkg.SelectionMethod === 'CompetitiveShopping' ? 'Chào hàng cạnh tranh' : pkg.SelectionMethod}
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
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(pkg.Status)}`}>
                                            {getStatusLabel(pkg.Status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {pkg.WinningContractorID ? (
                                            <div className="flex flex-col text-sm">
                                                <span className="text-indigo-700 font-medium">Bên trúng thầu: CT-001</span>
                                                <span className="text-xs text-green-600 font-bold mt-0.5">Giá: {formatCurrency(pkg.WinningPrice || 0)}</span>
                                                <span className="text-[10px] text-gray-400">QĐ: {formatDate(pkg.ApprovalDate_Result) || '...'}</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 italic text-xs">Chưa có kết quả</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
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
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                        Không tìm thấy gói thầu nào
                                    </td>
                                </tr>
                            )}
                        </tbody>
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
