import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    X, ExternalLink, Calendar, FileText, Building2, Banknote, Clock, Award,
    TrendingDown, TrendingUp, CreditCard, Receipt, ChevronRight, Edit, ArrowLeft,
    PieChart, BarChart3, Users, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { BiddingPackage, PackageStatus, Payment } from '../../../types';
import { formatCurrency, formatDate } from '../../../utils/format';
import ApiClient from '../../../services/api';
import { mockPayments, mockContractors, mockContracts } from '../../../mockData';

// ========================================
// BIDDING PACKAGE DETAIL - Full Featured View
// ========================================

interface BiddingPackageDetailProps {
    isOpen: boolean;
    onClose: () => void;
    package_data: BiddingPackage | null;
    onEdit?: (pkg: BiddingPackage) => void;
}

type TabType = 'info' | 'price' | 'payments' | 'documents' | 'timeline';

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

const getLabelMaps = () => ({
    field: { 'Construction': 'Xây lắp', 'Consultancy': 'Tư vấn', 'NonConsultancy': 'Phi tư vấn', 'Goods': 'Hàng hóa', 'Mixed': 'Hỗn hợp' },
    method: { 'OpenBidding': 'Đấu thầu rộng rãi', 'LimitedBidding': 'Đấu thầu hạn chế', 'Appointed': 'Chỉ định thầu', 'CompetitiveShopping': 'Chào hàng cạnh tranh', 'DirectProcurement': 'Mua sắm trực tiếp', 'SelfExecution': 'Tự thực hiện', 'CommunityParticipation': 'Cộng đồng tham gia' },
    procedure: { 'OneStageOneEnvelope': '1 giai đoạn 1 túi hồ sơ', 'OneStageTwoEnvelope': '1 giai đoạn 2 túi hồ sơ', 'TwoStageOneEnvelope': '2 giai đoạn 1 túi hồ sơ', 'TwoStageTwoEnvelope': '2 giai đoạn 2 túi hồ sơ', 'Reduced': 'Rút gọn', 'Normal': 'Thông thường' },
    contractType: { 'LumpSum': 'Trọn gói', 'UnitPrice': 'Đơn giá cố định', 'AdjustableUnitPrice': 'Đơn giá điều chỉnh', 'TimeBased': 'Theo thời gian', 'Percentage': 'Theo tỷ lệ phần trăm', 'Mixed': 'Hỗn hợp' },
});

export const BiddingPackageDetail: React.FC<BiddingPackageDetailProps> = ({
    isOpen,
    onClose,
    package_data: pkg,
    onEdit,
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('info');

    if (!isOpen || !pkg) return null;

    const statusConfig = getStatusConfig(pkg.Status);
    const labels = getLabelMaps();

    // Get related data
    const relatedContract = mockContracts.find(c => c.PackageID === pkg.PackageID);
    const relatedPayments = mockPayments.filter(p => relatedContract && p.ContractID === relatedContract.ContractID);
    const winningContractor = pkg.WinningContractorID ? mockContractors.find(c => c.ContractorID === pkg.WinningContractorID) : null;

    // Calculate stats
    const savings = pkg.WinningPrice && pkg.Price ? pkg.Price - pkg.WinningPrice : 0;
    const savingsPercent = pkg.Price && savings > 0 ? ((savings / pkg.Price) * 100).toFixed(2) : '0';
    const totalPaid = relatedPayments.reduce((sum, p) => sum + p.Amount, 0);
    const paymentProgress = relatedContract ? (totalPaid / relatedContract.ContractValue * 100) : 0;

    const tabs = [
        { id: 'info', label: 'Thông tin gói thầu', icon: FileText },
        { id: 'price', label: 'So sánh giá', icon: BarChart3 },
        { id: 'payments', label: 'Thanh toán', icon: CreditCard, badge: relatedPayments.length },
        { id: 'timeline', label: 'Tiến độ', icon: Clock },
    ] as const;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />

            {/* Modal - Full width */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden animate-scale-in flex flex-col">
                {/* Header */}
                <div className="shrink-0 px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-primary-50 via-blue-50 to-indigo-50">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <button
                                onClick={onClose}
                                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Quay lại danh sách
                            </button>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-2xl font-bold text-gray-800">{pkg.PackageNumber}</span>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                                    {statusConfig.label}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${pkg.Field === 'Construction' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                        pkg.Field === 'Consultancy' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                                            'bg-gray-50 text-gray-600 border-gray-200'
                                    }`}>
                                    {labels.field[pkg.Field as keyof typeof labels.field] || pkg.Field}
                                </span>
                            </div>
                            <h2 className="text-base text-gray-600 leading-relaxed max-w-3xl">{pkg.PackageName}</h2>

                            <div className="flex items-center gap-4 mt-3">
                                {pkg.NotificationCode && (
                                    <a
                                        href={`https://muasamcong.mpi.gov.vn/web/guest/contractor-selection?type=es-contractor-selection&noticeNo=${pkg.NotificationCode}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                        Xem trên muasamcong.vn
                                    </a>
                                )}
                                {onEdit && (
                                    <button
                                        onClick={() => onEdit(pkg)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        <Edit className="w-3.5 h-3.5" />
                                        Chỉnh sửa
                                    </button>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="shrink-0 grid grid-cols-4 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-100">
                    <div className="text-center">
                        <p className="text-xs text-gray-500">Giá gói thầu</p>
                        <p className="text-lg font-bold text-gray-800">{formatCurrency(pkg.Price)}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-gray-500">Giá trúng thầu</p>
                        <p className="text-lg font-bold text-green-600">{pkg.WinningPrice ? formatCurrency(pkg.WinningPrice) : '-'}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-gray-500">Tiết kiệm</p>
                        <p className={`text-lg font-bold ${savings > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                            {savings > 0 ? `${savingsPercent}%` : '-'}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-gray-500">Thời gian thực hiện</p>
                        <p className="text-lg font-bold text-gray-800">{pkg.Duration || '-'}</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="shrink-0 flex border-b border-gray-100 px-6 bg-white">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                flex items-center gap-2 px-4 py-3 text-sm font-medium 
                                border-b-2 transition-colors -mb-px
                                ${activeTab === tab.id
                                    ? 'text-primary-600 border-primary-600'
                                    : 'text-gray-500 border-transparent hover:text-gray-700'}
                            `}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                            {tab.badge && tab.badge > 0 && (
                                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-primary-100 text-primary-600 rounded-full">
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Tab: Info */}
                    {activeTab === 'info' && (
                        <div className="grid grid-cols-2 gap-6">
                            {/* Left Column - Basic Info */}
                            <div className="space-y-4">
                                <div className="bg-white rounded-xl border border-gray-200 p-4">
                                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-gray-500" />
                                        Phân loại pháp lý
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                        <InfoRow label="Lĩnh vực" value={labels.field[pkg.Field as keyof typeof labels.field] || pkg.Field} />
                                        <InfoRow label="Hình thức LCNT" value={labels.method[pkg.SelectionMethod as keyof typeof labels.method] || pkg.SelectionMethod} />
                                        <InfoRow label="Phương thức" value={labels.procedure[pkg.SelectionProcedure as keyof typeof labels.procedure] || pkg.SelectionProcedure} />
                                        <InfoRow label="Loại hợp đồng" value={labels.contractType[pkg.ContractType as keyof typeof labels.contractType] || pkg.ContractType} />
                                        <InfoRow
                                            label="Hình thức đấu thầu"
                                            value={<span className={pkg.BidType === 'Online' ? 'text-blue-600' : ''}>{pkg.BidType === 'Online' ? '🌐 Qua mạng' : '📋 Trực tiếp'}</span>}
                                        />
                                    </div>
                                </div>

                                {/* KHLCNT Info */}
                                {(pkg.KHLCNTCode || pkg.DecisionNumber) && (
                                    <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                                        <h4 className="font-semibold text-gray-800 mb-3">Kế hoạch LCNT</h4>
                                        <div className="space-y-2 text-sm">
                                            {pkg.KHLCNTCode && <InfoRow label="Mã KHLCNT" value={<span className="font-mono">{pkg.KHLCNTCode}</span>} />}
                                            {pkg.DecisionNumber && <InfoRow label="QĐ phê duyệt" value={pkg.DecisionNumber} />}
                                            {pkg.DecisionDate && <InfoRow label="Ngày phê duyệt" value={formatDate(pkg.DecisionDate)} />}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right Column - Contractor & Timeline */}
                            <div className="space-y-4">
                                {/* Winning Contractor */}
                                {winningContractor && (
                                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-4">
                                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                            <Award className="w-4 h-4 text-green-600" />
                                            Nhà thầu trúng thầu
                                        </h4>
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                                <Users className="w-6 h-6 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800">{winningContractor.ContractorName}</p>
                                                <p className="text-xs text-gray-500">{winningContractor.TaxCode}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <InfoRow label="Giá trúng thầu" value={<span className="font-bold text-green-600">{formatCurrency(pkg.WinningPrice || 0)}</span>} />
                                            {pkg.ApprovalDate_Result && <InfoRow label="Ngày phê duyệt" value={formatDate(pkg.ApprovalDate_Result)} />}
                                        </div>
                                    </div>
                                )}

                                {/* Related Contract */}
                                {relatedContract && (
                                    <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
                                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-blue-600" />
                                            Hợp đồng liên quan
                                        </h4>
                                        <div className="space-y-2 text-sm">
                                            <InfoRow label="Số hợp đồng" value={relatedContract.ContractNumber} />
                                            <InfoRow label="Giá trị HĐ" value={formatCurrency(relatedContract.ContractValue)} />
                                            <InfoRow label="Ngày ký" value={formatDate(relatedContract.SigningDate)} />
                                        </div>
                                    </div>
                                )}

                                {/* Timeline Visual */}
                                <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-4">
                                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-indigo-600" />
                                        Mốc thời gian
                                    </h4>
                                    <div className="relative pl-6 space-y-4">
                                        <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-indigo-200" />
                                        <TimelineStep label="Đăng tải TBMT" date={pkg.PostingDate} isActive={!!pkg.PostingDate} />
                                        <TimelineStep label="Đóng thầu" date={pkg.BidClosingDate} isActive={!!pkg.BidClosingDate} isCritical />
                                        <TimelineStep label="Mở thầu" date={pkg.BidOpeningDate} isActive={!!pkg.BidOpeningDate} />
                                        <TimelineStep label="Phê duyệt KQLCNT" date={pkg.ApprovalDate_Result} isActive={pkg.Status === PackageStatus.Awarded} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab: Price Comparison */}
                    {activeTab === 'price' && (
                        <div className="space-y-6">
                            {/* Price Cards */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-white rounded-xl border border-gray-200 p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm text-gray-500">Giá dự toán (Gói thầu)</span>
                                        <Banknote className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <p className="text-2xl font-bold text-gray-800">{formatCurrency(pkg.Price)}</p>
                                </div>
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm text-green-600">Giá trúng thầu</span>
                                        <Award className="w-5 h-5 text-green-500" />
                                    </div>
                                    <p className="text-2xl font-bold text-green-600">{pkg.WinningPrice ? formatCurrency(pkg.WinningPrice) : '-'}</p>
                                </div>
                                <div className={`rounded-xl border p-5 ${savings > 0 ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className={`text-sm ${savings > 0 ? 'text-blue-600' : 'text-gray-500'}`}>Tiết kiệm</span>
                                        {savings > 0 ? <TrendingDown className="w-5 h-5 text-blue-500" /> : <TrendingUp className="w-5 h-5 text-gray-400" />}
                                    </div>
                                    <p className={`text-2xl font-bold ${savings > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                                        {savings > 0 ? formatCurrency(savings) : '-'}
                                    </p>
                                    {savings > 0 && <p className="text-sm text-blue-500 mt-1">{savingsPercent}% so với dự toán</p>}
                                </div>
                            </div>

                            {/* Visual Comparison Bar */}
                            {pkg.WinningPrice && (
                                <div className="bg-white rounded-xl border border-gray-200 p-6">
                                    <h4 className="font-semibold text-gray-800 mb-4">So sánh trực quan</h4>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-gray-600">Giá gói thầu</span>
                                                <span className="font-medium">{formatCurrency(pkg.Price)}</span>
                                            </div>
                                            <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                                                <div className="h-full bg-gray-400 rounded-lg" style={{ width: '100%' }} />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-green-600">Giá trúng thầu</span>
                                                <span className="font-medium text-green-600">{formatCurrency(pkg.WinningPrice)}</span>
                                            </div>
                                            <div className="h-8 bg-green-100 rounded-lg overflow-hidden">
                                                <div
                                                    className="h-full bg-green-500 rounded-lg transition-all"
                                                    style={{ width: `${(pkg.WinningPrice / pkg.Price) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {!pkg.WinningPrice && (
                                <div className="bg-gray-50 rounded-xl p-8 text-center">
                                    <PieChart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">Chưa có kết quả trúng thầu để so sánh</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab: Payments */}
                    {activeTab === 'payments' && (
                        <div className="space-y-6">
                            {relatedContract ? (
                                <>
                                    {/* Payment Progress */}
                                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="font-semibold text-gray-800">Tiến độ thanh toán</h4>
                                            <span className="text-sm text-gray-500">
                                                {formatCurrency(totalPaid)} / {formatCurrency(relatedContract.ContractValue)}
                                            </span>
                                        </div>
                                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all"
                                                style={{ width: `${Math.min(paymentProgress, 100)}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between mt-2 text-sm">
                                            <span className="text-gray-500">Đã thanh toán: <span className="font-medium text-green-600">{paymentProgress.toFixed(1)}%</span></span>
                                            <span className="text-gray-500">Còn lại: <span className="font-medium text-gray-700">{formatCurrency(relatedContract.ContractValue - totalPaid)}</span></span>
                                        </div>
                                    </div>

                                    {/* Payment List */}
                                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                                            <h4 className="font-semibold text-gray-800">Danh sách thanh toán</h4>
                                            <span className="text-sm text-gray-500">{relatedPayments.length} lần thanh toán</span>
                                        </div>
                                        {relatedPayments.length > 0 ? (
                                            <div className="divide-y divide-gray-100">
                                                {relatedPayments.map((payment, idx) => (
                                                    <div key={payment.PaymentID} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${payment.Status === 'Paid' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                                                {payment.Status === 'Paid' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-800">Đợt {idx + 1}: {payment.Description}</p>
                                                                <p className="text-xs text-gray-500">{formatDate(payment.PaymentDate) || 'Chờ thanh toán'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-bold text-gray-800">{formatCurrency(payment.Amount)}</p>
                                                            <span className={`text-xs px-2 py-0.5 rounded-full ${payment.Status === 'Paid' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                                                {payment.Status === 'Paid' ? 'Đã thanh toán' : 'Chờ duyệt'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-8 text-center text-gray-500">
                                                <Receipt className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                                                <p>Chưa có thanh toán nào</p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="bg-gray-50 rounded-xl p-8 text-center">
                                    <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">Chưa có hợp đồng để quản lý thanh toán</p>
                                    <p className="text-sm text-gray-400 mt-1">Gói thầu cần có kết quả trúng thầu và hợp đồng ký kết</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab: Timeline */}
                    {activeTab === 'timeline' && (
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <h4 className="font-semibold text-gray-800 mb-6">Quy trình lựa chọn nhà thầu</h4>
                                <div className="relative">
                                    {/* Timeline line */}
                                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

                                    <div className="space-y-6">
                                        <TimelineFullStep
                                            step={1}
                                            title="Lập kế hoạch LCNT"
                                            description="Phê duyệt kế hoạch lựa chọn nhà thầu"
                                            date={pkg.DecisionDate}
                                            code={pkg.KHLCNTCode}
                                            isComplete={!!pkg.DecisionNumber}
                                        />
                                        <TimelineFullStep
                                            step={2}
                                            title="Đăng tải E-TBMT"
                                            description="Thông báo mời thầu trên hệ thống đấu thầu quốc gia"
                                            date={pkg.PostingDate}
                                            code={pkg.NotificationCode}
                                            isComplete={!!pkg.NotificationCode}
                                            link={pkg.NotificationCode ? `https://muasamcong.mpi.gov.vn/web/guest/contractor-selection?noticeNo=${pkg.NotificationCode}` : undefined}
                                        />
                                        <TimelineFullStep
                                            step={3}
                                            title="Đóng/Mở thầu"
                                            description="Hết hạn nộp HSDT và mở thầu công khai"
                                            date={pkg.BidClosingDate}
                                            extraDate={pkg.BidOpeningDate}
                                            extraLabel="Mở thầu"
                                            isComplete={!!pkg.BidOpeningDate}
                                        />
                                        <TimelineFullStep
                                            step={4}
                                            title="Phê duyệt KQLCNT"
                                            description="Công bố kết quả lựa chọn nhà thầu"
                                            date={pkg.ApprovalDate_Result}
                                            isComplete={pkg.Status === PackageStatus.Awarded}
                                        />
                                        <TimelineFullStep
                                            step={5}
                                            title="Ký hợp đồng"
                                            description="Hoàn thiện và ký kết hợp đồng"
                                            date={relatedContract?.SigningDate}
                                            code={relatedContract?.ContractNumber}
                                            isComplete={!!relatedContract}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Helper Components
const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex justify-between py-1.5">
        <span className="text-gray-500">{label}</span>
        <span className="font-medium text-gray-800 text-right">{value || '-'}</span>
    </div>
);

const TimelineStep = ({ label, date, isActive, isCritical = false }: {
    label: string; date?: string; isActive: boolean; isCritical?: boolean
}) => (
    <div className="relative flex items-center gap-3">
        <div className={`absolute -left-6 w-4 h-4 rounded-full border-2 ${isActive ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-300'}`} />
        <div className="flex-1">
            <p className={`text-sm font-medium ${isActive ? 'text-gray-800' : 'text-gray-400'}`}>{label}</p>
            <p className={`text-xs ${isCritical && date ? 'text-red-500' : 'text-gray-500'}`}>{date ? formatDate(date) : 'Chưa có'}</p>
        </div>
    </div>
);

const TimelineFullStep = ({ step, title, description, date, code, extraDate, extraLabel, isComplete, link }: {
    step: number; title: string; description: string; date?: string; code?: string;
    extraDate?: string; extraLabel?: string; isComplete: boolean; link?: string;
}) => (
    <div className="relative flex gap-4 pl-6">
        <div className={`absolute left-4 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${isComplete ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
            {isComplete ? <CheckCircle2 className="w-3 h-3" /> : step}
        </div>
        <div className="flex-1 pb-2">
            <div className="flex items-center gap-2">
                <h5 className={`font-semibold ${isComplete ? 'text-gray-800' : 'text-gray-400'}`}>{title}</h5>
                {code && <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">{code}</span>}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{description}</p>
            {date && <p className="text-xs text-gray-600 mt-1">📅 {formatDate(date)}</p>}
            {extraDate && <p className="text-xs text-gray-600">{extraLabel}: {formatDate(extraDate)}</p>}
            {link && (
                <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1">
                    <ExternalLink className="w-3 h-3" /> Xem trên MSC
                </a>
            )}
        </div>
    </div>
);

export default BiddingPackageDetail;
