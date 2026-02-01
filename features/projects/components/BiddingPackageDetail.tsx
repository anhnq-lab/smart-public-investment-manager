import React, { useState } from 'react';
import {
    X, ExternalLink, Calendar, FileText, Building2, Banknote, Clock, Award,
    TrendingDown, CreditCard, Receipt, Edit, ArrowLeft, BarChart3, Users,
    AlertTriangle, CheckCircle2, Phone, Mail, MapPin, Target, DollarSign,
    ClipboardList, Gavel, FileSignature, Calculator, Shield, Percent, Package
} from 'lucide-react';
import { BiddingPackage, PackageStatus } from '../../../types';
import { formatCurrency, formatDate } from '../../../utils/format';
import { mockPayments, mockContractors, mockContracts } from '../../../mockData';

// ========================================
// BIDDING PACKAGE DETAIL - Full Lifecycle Management
// 7 Stages: KHLCNT → TBMT → Bidding → Evaluation → Contract → Execution → Settlement
// ========================================

interface BiddingPackageDetailProps {
    isOpen: boolean;
    onClose: () => void;
    package_data: BiddingPackage | null;
    onEdit?: (pkg: BiddingPackage) => void;
}

type TabType = 'khlcnt' | 'selection' | 'contract' | 'settlement';

// Lifecycle stages configuration
const LIFECYCLE_STAGES = [
    { id: 1, name: 'Kế hoạch', status: ['Planning'], icon: ClipboardList, color: 'gray' },
    { id: 2, name: 'TBMT', status: ['Posted'], icon: ExternalLink, color: 'indigo' },
    { id: 3, name: 'Mời thầu', status: ['Bidding'], icon: Users, color: 'blue' },
    { id: 4, name: 'Đánh giá', status: ['Evaluating'], icon: Gavel, color: 'yellow' },
    { id: 5, name: 'Hợp đồng', status: ['Awarded'], icon: FileSignature, color: 'green' },
    { id: 6, name: 'Thực hiện', status: [], icon: Building2, color: 'cyan' },
    { id: 7, name: 'Quyết toán', status: [], icon: Calculator, color: 'emerald' },
];

const getStatusConfig = (status: PackageStatus) => {
    const configs = {
        [PackageStatus.Planning]: { label: 'Trong kế hoạch', bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', stage: 1 },
        [PackageStatus.Posted]: { label: 'Đã đăng TBMT', bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200', stage: 2 },
        [PackageStatus.Bidding]: { label: 'Đang mời thầu', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', stage: 3 },
        [PackageStatus.Evaluating]: { label: 'Đang xét thầu', bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200', stage: 4 },
        [PackageStatus.Awarded]: { label: 'Đã có KQLCNT', bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', stage: 5 },
        [PackageStatus.Cancelled]: { label: 'Hủy thầu', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', stage: 0 },
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
    const [activeTab, setActiveTab] = useState<TabType>('khlcnt');

    if (!isOpen || !pkg) return null;

    const statusConfig = getStatusConfig(pkg.Status);
    const labels = getLabelMaps();
    const currentStage = statusConfig.stage;

    // Get related data
    const relatedContract = mockContracts.find(c => c.PackageID === pkg.PackageID);
    const relatedPayments = mockPayments.filter(p => relatedContract && p.ContractID === relatedContract.ContractID);
    const winningContractor = pkg.WinningContractorID ? mockContractors.find(c => c.ContractorID === pkg.WinningContractorID) : null;

    // Calculate stats
    const savings = pkg.WinningPrice && pkg.Price ? pkg.Price - pkg.WinningPrice : 0;
    const savingsPercent = pkg.Price && savings > 0 ? ((savings / pkg.Price) * 100).toFixed(2) : '0';
    const totalPaid = relatedPayments.reduce((sum, p) => sum + p.Amount, 0);
    const contractValue = relatedContract?.ContractValue || pkg.WinningPrice || 0;
    const paymentProgress = contractValue > 0 ? (totalPaid / contractValue * 100) : 0;

    // Determine actual stage (including contract execution stages)
    const actualStage = relatedContract
        ? (relatedContract.Status === 'Completed' ? 7 : 6)
        : currentStage;

    const tabs = [
        { id: 'khlcnt', label: 'KHLCNT & TBMT', icon: ClipboardList, stages: [1, 2] },
        { id: 'selection', label: 'Lựa chọn nhà thầu', icon: Users, stages: [3, 4] },
        { id: 'contract', label: 'Hợp đồng & Thanh toán', icon: FileSignature, stages: [5, 6] },
        { id: 'settlement', label: 'Quyết toán', icon: Calculator, stages: [7] },
    ] as const;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />

            {/* Modal - Full width */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden animate-scale-in flex flex-col">
                {/* Header with Package Info */}
                <div className="shrink-0 px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50">
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
                            <h2 className="text-base text-gray-600 leading-relaxed max-w-4xl line-clamp-2">{pkg.PackageName}</h2>

                            <div className="flex items-center gap-3 mt-3">
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

                {/* LIFECYCLE TIMELINE HEADER */}
                <div className="shrink-0 bg-gradient-to-r from-slate-50 via-gray-50 to-slate-50 border-b border-gray-200 px-6 py-5">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Vòng đời gói thầu</h4>
                    <div className="relative flex items-center justify-between">
                        {/* Connector Line - Background */}
                        <div className="absolute left-0 right-0 top-5 h-1.5 bg-gray-200 rounded-full" style={{ left: '2.5rem', right: '2.5rem' }} />
                        {/* Connector Line - Progress */}
                        <div
                            className="absolute top-5 h-1.5 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all duration-500"
                            style={{
                                left: '2.5rem',
                                width: actualStage > 0 ? `calc(${Math.min((actualStage - 1) / (LIFECYCLE_STAGES.length - 1) * 100, 100)}% - 5rem)` : '0%'
                            }}
                        />

                        {LIFECYCLE_STAGES.map((stage, idx) => {
                            const isCompleted = actualStage > stage.id;
                            const isCurrent = actualStage === stage.id;
                            const isPending = actualStage < stage.id;

                            return (
                                <div key={stage.id} className="flex flex-col items-center z-10 relative" style={{ width: `${100 / LIFECYCLE_STAGES.length}%` }}>
                                    <div className={`
                                        w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all shadow-sm
                                        ${isCompleted ? 'bg-gradient-to-br from-emerald-400 to-green-600 text-white shadow-green-200' :
                                            isCurrent ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white ring-4 ring-blue-100 shadow-blue-200' :
                                                'bg-white text-gray-400 border-2 border-gray-200'}
                                    `}>
                                        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <stage.icon className="w-5 h-5" />}
                                    </div>
                                    <span className={`text-[11px] mt-2 font-medium whitespace-nowrap ${isCompleted ? 'text-green-600' :
                                        isCurrent ? 'text-blue-600' :
                                            'text-gray-400'
                                        }`}>{stage.name}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Tabs - 4 Lifecycle Groups */}
                <div className="shrink-0 flex border-b border-gray-100 px-6 bg-gray-50">
                    {tabs.map(tab => {
                        const tabHasProgress = tab.stages.some(s => actualStage >= s);
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex items-center gap-2 px-4 py-3 text-sm font-medium 
                                    border-b-2 transition-colors -mb-px
                                    ${activeTab === tab.id
                                        ? 'text-blue-600 border-blue-600 bg-white'
                                        : tabHasProgress
                                            ? 'text-gray-600 border-transparent hover:text-gray-800'
                                            : 'text-gray-400 border-transparent'}
                                `}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    {/* Tab 1: KHLCNT & TBMT */}
                    {activeTab === 'khlcnt' && (
                        <div className="grid grid-cols-2 gap-6">
                            {/* Left: KHLCNT Info */}
                            <div className="space-y-4">
                                <SectionCard title="Kế hoạch lựa chọn nhà thầu" icon={ClipboardList} color="blue">
                                    <InfoRow label="Mã KHLCNT" value={pkg.KHLCNTCode ? <span className="font-mono">{pkg.KHLCNTCode}</span> : '-'} />
                                    <InfoRow label="QĐ phê duyệt KHLCNT" value={pkg.DecisionNumber || '-'} />
                                    <InfoRow label="Ngày phê duyệt" value={pkg.DecisionDate ? formatDate(pkg.DecisionDate) : '-'} />
                                    <div className="border-t border-gray-100 my-2" />
                                    <InfoRow label="Giá gói thầu" value={<span className="font-bold text-gray-900">{formatCurrency(pkg.Price)}</span>} />
                                    <InfoRow label="Nguồn vốn" value={pkg.FundingSource || 'Ngân sách Nhà nước'} />
                                    <InfoRow label="Thời gian thực hiện" value={pkg.Duration || '-'} />
                                </SectionCard>

                                <SectionCard title="Phương thức đấu thầu" icon={Gavel} color="purple">
                                    <InfoRow label="Lĩnh vực" value={labels.field[pkg.Field as keyof typeof labels.field] || pkg.Field} />
                                    <InfoRow label="Hình thức LCNT" value={labels.method[pkg.SelectionMethod as keyof typeof labels.method] || pkg.SelectionMethod} />
                                    <InfoRow label="Phương thức" value={labels.procedure[pkg.SelectionProcedure as keyof typeof labels.procedure] || pkg.SelectionProcedure} />
                                    <InfoRow label="Loại hợp đồng" value={labels.contractType[pkg.ContractType as keyof typeof labels.contractType] || pkg.ContractType} />
                                    <InfoRow
                                        label="Hình thức đấu thầu"
                                        value={<span className={pkg.BidType === 'Online' ? 'text-blue-600' : ''}>{pkg.BidType === 'Online' ? '🌐 Qua mạng (E-Bidding)' : '📋 Trực tiếp'}</span>}
                                    />
                                </SectionCard>
                            </div>

                            {/* Right: TBMT Info */}
                            <div className="space-y-4">
                                <SectionCard title="Thông báo mời thầu (TBMT)" icon={ExternalLink} color="indigo">
                                    {pkg.NotificationCode ? (
                                        <>
                                            <InfoRow label="Mã TBMT" value={<span className="font-mono text-blue-600">{pkg.NotificationCode}</span>} />
                                            <InfoRow label="Ngày đăng tải" value={pkg.PostingDate ? formatDate(pkg.PostingDate) : '-'} />
                                            <InfoRow label="Thời điểm đóng thầu" value={pkg.BidClosingDate ? formatDate(pkg.BidClosingDate) : '-'} highlight />
                                            <InfoRow label="Thời điểm mở thầu" value={pkg.BidOpeningDate ? formatDate(pkg.BidOpeningDate) : '-'} />
                                            <div className="mt-3">
                                                <a
                                                    href={`https://muasamcong.mpi.gov.vn/web/guest/contractor-selection?noticeNo=${pkg.NotificationCode}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                    Xem TBMT trên Hệ thống ĐTQG
                                                </a>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-6">
                                            <ExternalLink className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                            <p className="text-gray-500">Chưa đăng tải TBMT</p>
                                            <p className="text-xs text-gray-400 mt-1">Gói thầu đang trong giai đoạn lập kế hoạch</p>
                                        </div>
                                    )}
                                </SectionCard>

                                <SectionCard title="Thời gian tổ chức LCNT" icon={Calendar} color="cyan">
                                    <InfoRow label="Thời gian tổ chức" value={pkg.SelectionDuration || '45 ngày'} />
                                    <InfoRow label="Thời gian bắt đầu" value={pkg.SelectionStartDate || '-'} />
                                    <InfoRow label="Tùy chọn mua thêm" value={pkg.HasOption ? 'Có' : 'Không'} />
                                </SectionCard>
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Lựa chọn nhà thầu */}
                    {activeTab === 'selection' && (
                        <div className="grid grid-cols-2 gap-6">
                            {/* Left: Bidders */}
                            <div className="space-y-4">
                                <SectionCard title="Nhà thầu tham gia" icon={Users} color="blue">
                                    {actualStage >= 3 ? (
                                        <div className="space-y-3">
                                            <p className="text-sm text-gray-500 italic">Danh sách nhà thầu đăng ký và nộp HSDT</p>
                                            {/* Mock bidders - In real app, fetch from API */}
                                            {[
                                                { name: 'Công ty CP Xây dựng ABC', submitted: true },
                                                { name: 'Công ty TNHH Thương mại XYZ', submitted: true },
                                                { name: 'Doanh nghiệp Tư nhân DEF', submitted: false },
                                            ].map((bidder, idx) => (
                                                <div key={idx} className={`flex items-center justify-between p-3 rounded-lg border ${bidder.submitted ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="w-4 h-4 text-gray-400" />
                                                        <span className="text-sm font-medium">{bidder.name}</span>
                                                    </div>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${bidder.submitted ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                                        {bidder.submitted ? 'Đã nộp HSDT' : 'Đã đăng ký'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <EmptyState icon={Users} message="Chưa có nhà thầu tham gia" hint="Gói thầu cần đăng TBMT trước" />
                                    )}
                                </SectionCard>
                            </div>

                            {/* Right: Evaluation & Result */}
                            <div className="space-y-4">
                                <SectionCard title="Đánh giá HSDT" icon={BarChart3} color="yellow">
                                    {actualStage >= 4 ? (
                                        <div className="space-y-2">
                                            <InfoRow label="Ngày mở thầu" value={pkg.BidOpeningDate ? formatDate(pkg.BidOpeningDate) : '-'} />
                                            <InfoRow label="Biên bản mở thầu" value="Đã lập" />
                                            <InfoRow label="Báo cáo đánh giá" value="Đã hoàn thành" />
                                        </div>
                                    ) : (
                                        <EmptyState icon={BarChart3} message="Chưa đánh giá HSDT" hint="Chờ hết thời gian nộp HSDT" />
                                    )}
                                </SectionCard>

                                <SectionCard title="Kết quả lựa chọn nhà thầu" icon={Award} color="green">
                                    {pkg.WinningContractorID && winningContractor ? (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                                    <Award className="w-6 h-6 text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-800">{winningContractor.ContractorName}</p>
                                                    <p className="text-xs text-gray-500">MST: {winningContractor.TaxCode}</p>
                                                </div>
                                            </div>
                                            <InfoRow label="Giá trúng thầu" value={<span className="font-bold text-green-600">{formatCurrency(pkg.WinningPrice || 0)}</span>} />
                                            <InfoRow label="Tiết kiệm" value={savings > 0 ? <span className="text-blue-600">{formatCurrency(savings)} ({savingsPercent}%)</span> : '-'} />
                                            <InfoRow label="Ngày phê duyệt KQLCNT" value={pkg.ApprovalDate_Result ? formatDate(pkg.ApprovalDate_Result) : '-'} />
                                        </div>
                                    ) : (
                                        <EmptyState icon={Award} message="Chưa có kết quả LCNT" hint="Đang trong quá trình đánh giá" />
                                    )}
                                </SectionCard>
                            </div>
                        </div>
                    )}

                    {/* Tab 3: Hợp đồng & Thanh toán */}
                    {activeTab === 'contract' && (
                        <div className="space-y-6">
                            {/* Contract & Contractor Overview */}
                            <div className="grid grid-cols-2 gap-4">
                                <SectionCard title="Nhà thầu thực hiện" icon={Building2} color="green">
                                    {winningContractor ? (
                                        <div className="space-y-2">
                                            <p className="font-semibold text-gray-800">{winningContractor.ContractorName}</p>
                                            <div className="text-sm text-gray-600 space-y-1.5">
                                                <p className="flex items-center gap-2"><Target className="w-3.5 h-3.5 text-gray-400" /> MST: {winningContractor.TaxCode}</p>
                                                {winningContractor.Phone && <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-gray-400" /> {winningContractor.Phone}</p>}
                                                {winningContractor.Email && <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-gray-400" /> {winningContractor.Email}</p>}
                                                {winningContractor.Address && <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-gray-400" /> {winningContractor.Address}</p>}
                                            </div>
                                        </div>
                                    ) : (
                                        <EmptyState icon={Building2} message="Chưa có nhà thầu" />
                                    )}
                                </SectionCard>

                                <SectionCard title="Hợp đồng" icon={FileSignature} color="blue">
                                    {relatedContract ? (
                                        <div className="space-y-2">
                                            <InfoRow label="Số hợp đồng" value={<span className="font-mono font-semibold">{relatedContract.ContractNumber}</span>} />
                                            <InfoRow label="Giá trị HĐ" value={<span className="font-bold text-blue-600">{formatCurrency(relatedContract.ContractValue)}</span>} />
                                            <InfoRow label="Ngày ký" value={formatDate(relatedContract.SigningDate)} />
                                            <InfoRow label="Thời gian thực hiện" value={relatedContract.Duration || pkg.Duration} />
                                            <InfoRow label="Trạng thái" value={
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${relatedContract.Status === 'Active' ? 'bg-green-100 text-green-600' :
                                                    relatedContract.Status === 'Completed' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {relatedContract.Status === 'Active' ? 'Đang thực hiện' :
                                                        relatedContract.Status === 'Completed' ? 'Hoàn thành' : relatedContract.Status}
                                                </span>
                                            } />
                                        </div>
                                    ) : (
                                        <EmptyState icon={FileSignature} message="Chưa ký hợp đồng" />
                                    )}
                                </SectionCard>
                            </div>

                            {/* Payment Progress */}
                            {relatedContract ? (
                                <>
                                    <SectionCard title="Tiến độ thanh toán" icon={DollarSign} color="emerald">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <span className="text-lg font-bold text-green-600">{formatCurrency(totalPaid)}</span>
                                                <span className="text-gray-400"> / </span>
                                                <span className="text-gray-600">{formatCurrency(contractValue)}</span>
                                            </div>
                                            <span className="text-lg font-bold text-green-600">{paymentProgress.toFixed(1)}%</span>
                                        </div>
                                        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all"
                                                style={{ width: `${Math.min(paymentProgress, 100)}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-sm mt-2">
                                            <span className="text-gray-500">Đã thanh toán</span>
                                            <span className="text-orange-600 font-medium">Còn lại: {formatCurrency(contractValue - totalPaid)}</span>
                                        </div>
                                    </SectionCard>

                                    {/* Payment List */}
                                    <SectionCard title="Danh sách đợt thanh toán" icon={Receipt} color="gray" badge={`${relatedPayments.length} đợt`}>
                                        {relatedPayments.length > 0 ? (
                                            <div className="space-y-3">
                                                {relatedPayments.map((payment, idx) => (
                                                    <div key={payment.PaymentID} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${payment.Status === 'Paid' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                                                {payment.Status === 'Paid' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-800">Đợt {idx + 1}: {payment.Description}</p>
                                                                <p className="text-xs text-gray-500">{payment.PaymentDate ? formatDate(payment.PaymentDate) : 'Chờ thanh toán'}</p>
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
                                            <EmptyState icon={Receipt} message="Chưa có thanh toán" hint="Các đợt thanh toán sẽ hiển thị tại đây" />
                                        )}
                                    </SectionCard>
                                </>
                            ) : (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                                    <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                                    <p className="font-medium text-gray-700">Chưa có hợp đồng để quản lý</p>
                                    <p className="text-sm text-gray-500 mt-1">Gói thầu cần có kết quả trúng thầu và hợp đồng ký kết</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab 4: Quyết toán */}
                    {activeTab === 'settlement' && (
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <SectionCard title="Nghiệm thu công trình" icon={CheckCircle2} color="green">
                                    {relatedContract?.Status === 'Completed' ? (
                                        <div className="space-y-2">
                                            <InfoRow label="Ngày nghiệm thu" value="15/01/2026" />
                                            <InfoRow label="Biên bản nghiệm thu" value="Đã ký" />
                                            <InfoRow label="Chất lượng" value={<span className="text-green-600 font-medium">Đạt yêu cầu</span>} />
                                        </div>
                                    ) : (
                                        <EmptyState icon={CheckCircle2} message="Chưa nghiệm thu" hint="Hoàn thành hợp đồng để nghiệm thu" />
                                    )}
                                </SectionCard>

                                <SectionCard title="Quyết toán hợp đồng" icon={Calculator} color="blue">
                                    {relatedContract?.Status === 'Completed' ? (
                                        <div className="space-y-2">
                                            <InfoRow label="Giá trị quyết toán" value={<span className="font-bold text-blue-600">{formatCurrency(contractValue)}</span>} />
                                            <InfoRow label="Đã thanh toán" value={<span className="text-green-600">{formatCurrency(totalPaid)}</span>} />
                                            <InfoRow label="Còn giữ lại (BH)" value={<span className="text-orange-600">{formatCurrency(contractValue * 0.05)}</span>} />
                                            <InfoRow label="Ngày quyết toán" value="20/01/2026" />
                                        </div>
                                    ) : (
                                        <EmptyState icon={Calculator} message="Chưa quyết toán" hint="Hoàn thành nghiệm thu để quyết toán" />
                                    )}
                                </SectionCard>
                            </div>

                            <div className="space-y-4">
                                <SectionCard title="Bảo hành công trình" icon={Shield} color="purple">
                                    {relatedContract?.Status === 'Completed' ? (
                                        <div className="space-y-2">
                                            <InfoRow label="Thời gian bảo hành" value="24 tháng" />
                                            <InfoRow label="Bắt đầu từ" value="15/01/2026" />
                                            <InfoRow label="Kết thúc" value="15/01/2028" />
                                            <InfoRow label="Giá trị bảo lãnh BH" value={<span className="font-medium">{formatCurrency(contractValue * 0.05)}</span>} />
                                            <InfoRow label="Trạng thái" value={<span className="px-2 py-0.5 bg-green-100 text-green-600 rounded text-xs font-medium">Đang trong bảo hành</span>} />
                                        </div>
                                    ) : (
                                        <EmptyState icon={Shield} message="Chưa có thông tin bảo hành" hint="Hoàn thành quyết toán để bắt đầu bảo hành" />
                                    )}
                                </SectionCard>

                                <SectionCard title="Tổng hợp" icon={Package} color="slate">
                                    <div className="space-y-2">
                                        <InfoRow label="Giá gói thầu" value={formatCurrency(pkg.Price)} />
                                        <InfoRow label="Giá trúng thầu" value={pkg.WinningPrice ? formatCurrency(pkg.WinningPrice) : '-'} />
                                        <InfoRow label="Giá trị HĐ" value={relatedContract ? formatCurrency(relatedContract.ContractValue) : '-'} />
                                        <div className="border-t border-gray-200 my-2" />
                                        <InfoRow label="Tiết kiệm so với dự toán" value={
                                            savings > 0
                                                ? <span className="font-bold text-blue-600">{formatCurrency(savings)} ({savingsPercent}%)</span>
                                                : '-'
                                        } />
                                    </div>
                                </SectionCard>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ========================================
// Helper Components
// ========================================

const SectionCard = ({ title, icon: Icon, color, children, badge }: {
    title: string;
    icon: React.ElementType;
    color: string;
    children: React.ReactNode;
    badge?: string;
}) => {
    const colorMap: Record<string, string> = {
        blue: 'text-blue-600',
        green: 'text-green-600',
        purple: 'text-purple-600',
        indigo: 'text-indigo-600',
        yellow: 'text-yellow-600',
        cyan: 'text-cyan-600',
        emerald: 'text-emerald-600',
        gray: 'text-gray-600',
        slate: 'text-slate-600',
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${colorMap[color] || 'text-gray-500'}`} />
                    {title}
                </h4>
                {badge && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded text-xs font-medium">{badge}</span>
                )}
            </div>
            <div className="space-y-2 text-sm">{children}</div>
        </div>
    );
};

const InfoRow = ({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) => (
    <div className={`flex justify-between py-1.5 ${highlight ? 'bg-yellow-50 -mx-2 px-2 rounded' : ''}`}>
        <span className="text-gray-500">{label}</span>
        <span className={`font-medium text-gray-800 text-right ${highlight ? 'text-orange-600' : ''}`}>{value || '-'}</span>
    </div>
);

const EmptyState = ({ icon: Icon, message, hint }: { icon: React.ElementType; message: string; hint?: string }) => (
    <div className="text-center py-6">
        <Icon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500">{message}</p>
        {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
);

export default BiddingPackageDetail;
