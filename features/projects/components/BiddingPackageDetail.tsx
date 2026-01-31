import React from 'react';
import { X, ExternalLink, Calendar, FileText, Building2, Banknote, Clock, Award } from 'lucide-react';
import { BiddingPackage, PackageStatus } from '../../../types';
import { formatCurrency, formatDate } from '../../../utils/format';

// ========================================
// BIDDING PACKAGE DETAIL - View Only Modal
// ========================================

interface BiddingPackageDetailProps {
    isOpen: boolean;
    onClose: () => void;
    package_data: BiddingPackage | null;
    contractorName?: string;
}

const getStatusConfig = (status: PackageStatus) => {
    const configs = {
        [PackageStatus.Planning]: { label: 'Trong kế hoạch', bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' },
        [PackageStatus.Posted]: { label: 'Đã đăng tải', bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200' },
        [PackageStatus.Bidding]: { label: 'Đang mời thầu', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
        [PackageStatus.Evaluating]: { label: 'Đang xét thầu', bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
        [PackageStatus.Awarded]: { label: 'Đã có kết quả', bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
        [PackageStatus.Cancelled]: { label: 'Hủy thầu', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
    };
    return configs[status] || configs[PackageStatus.Planning];
};

const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
        'Construction': 'Xây lắp',
        'Consultancy': 'Tư vấn',
        'NonConsultancy': 'Phi tư vấn',
        'Goods': 'Hàng hóa',
        'Mixed': 'Hỗn hợp',
    };
    return labels[field] || field;
};

const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
        'OpenBidding': 'Đấu thầu rộng rãi',
        'LimitedBidding': 'Đấu thầu hạn chế',
        'Appointed': 'Chỉ định thầu',
        'CompetitiveShopping': 'Chào hàng cạnh tranh',
        'DirectProcurement': 'Mua sắm trực tiếp',
        'SelfExecution': 'Tự thực hiện',
        'CommunityParticipation': 'Cộng đồng tham gia',
    };
    return labels[method] || method;
};

const getProcedureLabel = (procedure: string) => {
    const labels: Record<string, string> = {
        'OneStageOneEnvelope': '1 giai đoạn 1 túi hồ sơ',
        'OneStageTwoEnvelope': '1 giai đoạn 2 túi hồ sơ',
        'TwoStageOneEnvelope': '2 giai đoạn 1 túi hồ sơ',
        'TwoStageTwoEnvelope': '2 giai đoạn 2 túi hồ sơ',
        'Reduced': 'Rút gọn',
        'Normal': 'Thông thường',
    };
    return labels[procedure] || procedure;
};

const getContractTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
        'LumpSum': 'Trọn gói',
        'UnitPrice': 'Đơn giá cố định',
        'AdjustableUnitPrice': 'Đơn giá điều chỉnh',
        'TimeBased': 'Theo thời gian',
        'Percentage': 'Theo tỷ lệ phần trăm',
        'Mixed': 'Hỗn hợp',
    };
    return labels[type] || type;
};

export const BiddingPackageDetail: React.FC<BiddingPackageDetailProps> = ({
    isOpen,
    onClose,
    package_data: pkg,
    contractorName,
}) => {
    if (!isOpen || !pkg) return null;

    const statusConfig = getStatusConfig(pkg.Status);

    const InfoRow = ({ label, value, highlight = false }: { label: string; value: React.ReactNode; highlight?: boolean }) => (
        <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
            <span className="text-gray-500 text-sm">{label}</span>
            <span className={`text-sm font-medium ${highlight ? 'text-primary-600' : 'text-gray-800'}`}>{value || '-'}</span>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-primary-50 to-blue-50">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-xl font-bold text-gray-800">{pkg.PackageNumber}</span>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                                    {statusConfig.label}
                                </span>
                            </div>
                            <h2 className="text-base text-gray-700 leading-relaxed">{pkg.PackageName}</h2>

                            {pkg.NotificationCode && (
                                <a
                                    href={`https://muasamcong.mpi.gov.vn/web/guest/contractor-selection?type=es-contractor-selection&noticeNo=${pkg.NotificationCode}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    Xem trên muasamcong.vn ({pkg.NotificationCode})
                                </a>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6">
                    {/* Price & Duration */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                            <div className="flex items-center gap-2 text-green-600 mb-2">
                                <Banknote className="w-5 h-5" />
                                <span className="text-sm font-medium">Giá gói thầu</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-800">{formatCurrency(pkg.Price)}</p>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                            <div className="flex items-center gap-2 text-blue-600 mb-2">
                                <Clock className="w-5 h-5" />
                                <span className="text-sm font-medium">Thời gian thực hiện</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-800">{pkg.Duration || '-'}</p>
                        </div>
                    </div>

                    {/* Legal Classification */}
                    <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Building2 className="w-5 h-5 text-gray-600" />
                            <h3 className="font-semibold text-gray-800">Phân loại pháp lý</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-x-6">
                            <InfoRow label="Lĩnh vực" value={getFieldLabel(pkg.Field)} />
                            <InfoRow label="Hình thức LCNT" value={getMethodLabel(pkg.SelectionMethod)} />
                            <InfoRow label="Phương thức" value={getProcedureLabel(pkg.SelectionProcedure)} />
                            <InfoRow label="Loại hợp đồng" value={getContractTypeLabel(pkg.ContractType)} />
                            <InfoRow
                                label="Hình thức đấu thầu"
                                value={
                                    <span className={pkg.BidType === 'Online' ? 'text-blue-600' : ''}>
                                        {pkg.BidType === 'Online' ? '🌐 Qua mạng' : '📋 Trực tiếp'}
                                    </span>
                                }
                            />
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="bg-blue-50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Calendar className="w-5 h-5 text-blue-600" />
                            <h3 className="font-semibold text-gray-800">Mốc thời gian</h3>
                        </div>

                        {/* KHLCNT */}
                        {(pkg.KHLCNTCode || pkg.DecisionNumber) && (
                            <div className="mb-4 p-3 bg-white rounded-lg">
                                <p className="text-xs font-medium text-gray-500 mb-2">KẾ HOẠCH LCNT</p>
                                <div className="space-y-1">
                                    {pkg.KHLCNTCode && (
                                        <p className="text-sm"><span className="text-gray-500">Mã:</span> <span className="font-mono font-medium">{pkg.KHLCNTCode}</span></p>
                                    )}
                                    {pkg.DecisionNumber && (
                                        <p className="text-sm"><span className="text-gray-500">QĐ phê duyệt:</span> <span className="font-medium">{pkg.DecisionNumber}</span></p>
                                    )}
                                    {pkg.DecisionDate && (
                                        <p className="text-sm"><span className="text-gray-500">Ngày phê duyệt:</span> <span className="font-medium">{formatDate(pkg.DecisionDate)}</span></p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Timeline visual */}
                        <div className="flex items-center justify-between relative">
                            <div className="absolute top-4 left-8 right-8 h-0.5 bg-blue-200" />

                            <TimelineItem
                                label="Đăng tải"
                                date={pkg.PostingDate}
                                isActive={!!pkg.PostingDate}
                            />
                            <TimelineItem
                                label="Đóng thầu"
                                date={pkg.BidClosingDate}
                                isActive={!!pkg.BidClosingDate}
                            />
                            <TimelineItem
                                label="Mở thầu"
                                date={pkg.BidOpeningDate}
                                isActive={!!pkg.BidOpeningDate}
                            />
                            <TimelineItem
                                label="Kết quả"
                                date={pkg.ApprovalDate_Result}
                                isActive={pkg.Status === PackageStatus.Awarded}
                                isLast
                            />
                        </div>
                    </div>

                    {/* Result (if awarded) */}
                    {pkg.Status === PackageStatus.Awarded && pkg.WinningContractorID && (
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                            <div className="flex items-center gap-2 mb-3">
                                <Award className="w-5 h-5 text-green-600" />
                                <h3 className="font-semibold text-gray-800">Kết quả lựa chọn nhà thầu</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Nhà thầu trúng thầu</p>
                                    <p className="text-base font-semibold text-gray-800">{contractorName || pkg.WinningContractorID}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Giá trúng thầu</p>
                                    <p className="text-base font-bold text-green-600">{formatCurrency(pkg.WinningPrice || 0)}</p>
                                </div>
                                {pkg.ApprovalDate_Result && (
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Ngày phê duyệt KQLCNT</p>
                                        <p className="text-base font-medium text-gray-800">{formatDate(pkg.ApprovalDate_Result)}</p>
                                    </div>
                                )}
                                {pkg.WinningPrice && pkg.Price && (
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Tỷ lệ tiết kiệm</p>
                                        <p className="text-base font-bold text-blue-600">
                                            {(((pkg.Price - pkg.WinningPrice) / pkg.Price) * 100).toFixed(2)}%
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end px-6 py-4 border-t border-gray-100 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

// Timeline item component
const TimelineItem = ({ label, date, isActive, isLast = false }: {
    label: string;
    date?: string;
    isActive: boolean;
    isLast?: boolean;
}) => (
    <div className="flex flex-col items-center z-10">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isActive ? 'bg-blue-600 text-white' : 'bg-white border-2 border-blue-200 text-gray-400'}`}>
            {isActive ? '✓' : '○'}
        </div>
        <p className={`mt-2 text-xs font-medium ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>{label}</p>
        <p className="text-[10px] text-gray-500">{date ? formatDate(date) : '-'}</p>
    </div>
);

export default BiddingPackageDetail;
