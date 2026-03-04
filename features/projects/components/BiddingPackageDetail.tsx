import React, { useState } from 'react';
import {
    X, ExternalLink, Calendar, FileText, Building2, Banknote, Clock, Award,
    TrendingDown, CreditCard, Receipt, Edit, ArrowLeft, BarChart3, Users,
    AlertTriangle, CheckCircle2, Phone, Mail, MapPin, Target, DollarSign,
    ClipboardList, Gavel, FileSignature, Calculator, Shield, Percent, Package
} from 'lucide-react';
import { BiddingPackage, PackageStatus, ContractStatus, PaymentStatus } from '../../../types';
import { formatCurrency, formatDate } from '../../../utils/format';
import { useContracts } from '../../../hooks/useContracts';
import { usePayments } from '../../../hooks/usePayments';
import { useContractors } from '../../../hooks/useContractors';
import { getMSCRequirements, getMSCPlanLink, getMSCPackageLink } from '../../../utils/mscCompliance';
import { LegalReferenceLink } from '../../../components/common/LegalReferenceLink';
import { WinningContractorSelector } from './WinningContractorSelector';
import { BidderListSection, EvaluationSection } from './BidderEvaluationSection';

// ========================================
// BIDDING PACKAGE DETAIL - Full Lifecycle Management
// Differentiated by Package Field:
// - XÂY LẮP: KHLCNT → TBMT → Bidding → Evaluation → Contract → Execution → Acceptance → Warranty → Settlement
// - TƯ VẤN: KHLCNT → TBMT → Bidding → Evaluation → Contract → Execution → Settlement (NO Acceptance/Warranty)
// - HÀNG HÓA: KHLCNT → TBMT → Bidding → Evaluation → Contract → Delivery → Warranty → Settlement
// ========================================

interface BiddingPackageDetailProps {
    isOpen: boolean;
    onClose: () => void;
    package_data: BiddingPackage | null;
    onEdit?: (pkg: BiddingPackage) => void;
}

type TabType = 'khlcnt' | 'selection' | 'contract' | 'settlement';

// Helper: Get lifecycle stages based on package field
const getLifecycleStages = (field?: string) => {
    // Stages 1-5 are common to all package types
    const commonStages = [
        { id: 1, name: 'Kế hoạch', status: ['Planning'], icon: ClipboardList },
        { id: 2, name: 'TBMT', status: ['Posted'], icon: ExternalLink },
        { id: 3, name: 'Mời thầu', status: ['Bidding'], icon: Users },
        { id: 4, name: 'Đánh giá', status: ['Evaluating'], icon: Gavel },
        { id: 5, name: 'Hợp đồng', status: ['Awarded'], icon: FileSignature },
    ];

    switch (field) {
        case 'Construction': // Xây lắp
            return [
                ...commonStages,
                { id: 6, name: 'Thực hiện', status: [], icon: Building2 },
                { id: 7, name: 'Nghiệm thu', status: [], icon: CheckCircle2 },
                { id: 8, name: 'Bảo hành', status: [], icon: Shield },
                { id: 9, name: 'Quyết toán', status: [], icon: Calculator },
            ];
        case 'Goods': // Hàng hóa
            return [
                ...commonStages,
                { id: 6, name: 'Giao hàng', status: [], icon: Package },
                { id: 7, name: 'Bảo hành', status: [], icon: Shield },
                { id: 8, name: 'Quyết toán', status: [], icon: Calculator },
            ];
        case 'Consultancy': // Tư vấn - NO acceptance/warranty for consulting services
        case 'NonConsultancy': // Phi tư vấn
        case 'Mixed':
        default:
            return [
                ...commonStages,
                { id: 6, name: 'Thực hiện', status: [], icon: Building2 },
                { id: 7, name: 'Quyết toán', status: [], icon: Calculator },
            ];
    }
};

const getStatusConfig = (status: PackageStatus) => {
    const configs = {
        [PackageStatus.Planning]: { label: 'Trong kế hoạch', bg: 'bg-gray-100 dark:bg-slate-700', text: 'text-gray-600 dark:text-slate-300', border: 'border-gray-200 dark:border-slate-600', stage: 1 },
        [PackageStatus.Posted]: { label: 'Đã đăng TBMT', bg: 'bg-indigo-100 dark:bg-indigo-900/40', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-700', stage: 2 },
        [PackageStatus.Bidding]: { label: 'Đang mời thầu', bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-700', stage: 3 },
        [PackageStatus.Evaluating]: { label: 'Đang xét thầu', bg: 'bg-yellow-100 dark:bg-yellow-900/40', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-200 dark:border-yellow-700', stage: 4 },
        [PackageStatus.Awarded]: { label: 'Đã có KQLCNT', bg: 'bg-green-100 dark:bg-green-900/40', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-700', stage: 5 },
        [PackageStatus.Cancelled]: { label: 'Hủy thầu', bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-300', border: 'border-red-200 dark:border-red-700', stage: 0 },
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

    // Hooks MUST be called before any conditional return (React Rules of Hooks)
    const { contracts } = useContracts();
    const { payments } = usePayments();
    const { contractors } = useContractors();

    if (!isOpen || !pkg) return null;

    // Get lifecycle stages based on package field type
    const lifecycleStages = getLifecycleStages(pkg.Field);
    const statusConfig = getStatusConfig(pkg.Status);
    const labels = getLabelMaps();
    const currentStage = statusConfig.stage;

    // Get related data
    const relatedContract = contracts.find(c => c.PackageID === pkg.PackageID);
    const relatedPayments = payments.filter(p => relatedContract && p.ContractID === relatedContract.ContractID);
    const winningContractor = pkg.WinningContractorID ? contractors.find(c => c.ContractorID === pkg.WinningContractorID) : null;

    // Calculate stats
    const savings = pkg.WinningPrice && pkg.Price ? pkg.Price - pkg.WinningPrice : 0;
    const savingsPercent = pkg.Price && savings > 0 ? ((savings / pkg.Price) * 100).toFixed(2) : '0';
    const totalPaid = relatedPayments.reduce((sum, p) => sum + p.Amount, 0);
    const contractValue = relatedContract?.Value || pkg.WinningPrice || 0; // Fixed: Value instead of ContractValue
    const paymentProgress = contractValue > 0 ? (totalPaid / contractValue * 100) : 0;

    // Determine actual stage (including contract execution stages) based on field type
    const maxStage = lifecycleStages.length;
    const settlementStageId = lifecycleStages[maxStage - 1].id; // Last stage is always settlement
    const executionStageId = 6; // Execution is always stage 6

    // Use enum values for comparison
    const actualStage = relatedContract
        ? (relatedContract.Status === ContractStatus.Liquidated ? settlementStageId : executionStageId)
        : currentStage;

    // Dynamic tabs based on package field type
    const hasWarranty = pkg.Field === 'Construction' || pkg.Field === 'Goods';
    const tabs = [
        { id: 'khlcnt', label: 'KHLCNT & TBMT', icon: ClipboardList, stages: [1, 2] },
        { id: 'selection', label: 'Lựa chọn nhà thầu', icon: Users, stages: [3, 4] },
        { id: 'contract', label: 'Hợp đồng & Thanh toán', icon: FileSignature, stages: [5, 6] },
        { id: 'settlement', label: hasWarranty ? 'Nghiệm thu & Quyết toán' : 'Quyết toán', icon: Calculator, stages: hasWarranty ? [7, 8, 9] : [7] },
    ] as const;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />

            {/* Modal - Full width */}
            <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden animate-scale-in flex flex-col">
                {/* Header with Package Info */}
                <div className="shrink-0 px-6 py-4 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <button
                                onClick={onClose}
                                className="flex items-center gap-1 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 mb-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Quay lại danh sách
                            </button>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-2xl font-bold text-gray-800 dark:text-slate-100">{pkg.PackageNumber}</span>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                                    {statusConfig.label}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${pkg.Field === 'Construction' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700' :
                                    pkg.Field === 'Consultancy' ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-700' :
                                        'bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-600'
                                    }`}>
                                    {labels.field[pkg.Field as keyof typeof labels.field] || pkg.Field}
                                </span>
                            </div>
                            <h2 className="text-base text-gray-600 dark:text-slate-400 leading-relaxed max-w-4xl line-clamp-2">{pkg.PackageName}</h2>

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
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 text-xs font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                                    >
                                        <Edit className="w-3.5 h-3.5" />
                                        Chỉnh sửa
                                    </button>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                        </button>
                    </div>
                </div>

                {/* LIFECYCLE TIMELINE HEADER */}
                <div className="shrink-0 bg-gradient-to-r from-slate-50 via-gray-50 to-slate-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-5">
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-4">Vòng đời gói thầu</h4>
                    <div className="relative flex items-center justify-between">
                        {/* Connector Line - Background */}
                        <div className="absolute left-0 right-0 top-5 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full" style={{ left: '2.5rem', right: '2.5rem' }} />
                        {/* Connector Line - Progress */}
                        <div
                            className="absolute top-5 h-1.5 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all duration-500"
                            style={{
                                left: '2.5rem',
                                width: actualStage > 0 ? `calc(${Math.min((actualStage - 1) / (lifecycleStages.length - 1) * 100, 100)}% - 5rem)` : '0%'
                            }}
                        />

                        {lifecycleStages.map((stage, idx) => {
                            const isCompleted = actualStage > stage.id;
                            const isCurrent = actualStage === stage.id;
                            const isPending = actualStage < stage.id;

                            return (
                                <div key={stage.id} className="flex flex-col items-center z-10 relative" style={{ width: `${100 / lifecycleStages.length}%` }}>
                                    <div className={`
                                        w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all shadow-sm
                                        ${isCompleted ? 'bg-gradient-to-br from-emerald-400 to-green-600 text-white shadow-green-200 dark:shadow-green-900' :
                                            isCurrent ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white ring-4 ring-blue-100 dark:ring-blue-900 shadow-blue-200 dark:shadow-blue-900' :
                                                'bg-white dark:bg-slate-700 text-gray-400 dark:text-slate-500 border-2 border-gray-200 dark:border-slate-600'}
                                    `}>
                                        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <stage.icon className="w-5 h-5" />}
                                    </div>
                                    <span className={`text-[11px] mt-2 font-medium whitespace-nowrap ${isCompleted ? 'text-green-600 dark:text-green-400' :
                                        isCurrent ? 'text-blue-600 dark:text-blue-400' :
                                            'text-gray-400 dark:text-slate-500'
                                        }`}>{stage.name}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Tabs - 4 Lifecycle Groups */}
                <div className="shrink-0 flex border-b border-gray-100 dark:border-slate-700 px-6 bg-gray-50 dark:bg-slate-800">
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
                                        ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400 bg-white dark:bg-slate-900'
                                        : tabHasProgress
                                            ? 'text-gray-600 dark:text-slate-400 border-transparent hover:text-gray-800 dark:hover:text-slate-200'
                                            : 'text-gray-400 dark:text-slate-600 border-transparent'}
                                `}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-slate-900">
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
                                    <InfoRow label="Giá gói thầu" value={<span className="font-bold text-gray-900 dark:text-slate-100">{formatCurrency(pkg.Price)}</span>} />
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
                                        value={<span className={pkg.BidType === 'Online' ? 'text-blue-600 dark:text-blue-400' : ''}>{pkg.BidType === 'Online' ? '🌐 Qua mạng (E-Bidding)' : '📋 Trực tiếp'}</span>}
                                    />
                                </SectionCard>
                            </div>

                            {/* Right: TBMT Info */}
                            <div className="space-y-4">
                                <SectionCard title="Thông báo mời thầu (TBMT)" icon={ExternalLink} color="indigo">
                                    {pkg.NotificationCode ? (
                                        <>
                                            <InfoRow label="Mã TBMT" value={<span className="font-mono text-blue-600 dark:text-blue-400">{pkg.NotificationCode}</span>} />
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
                                            <ExternalLink className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-2" />
                                            <p className="text-gray-500 dark:text-slate-400">Chưa đăng tải TBMT</p>
                                            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Gói thầu đang trong giai đoạn lập kế hoạch</p>
                                        </div>
                                    )}
                                </SectionCard>

                                <SectionCard title="Thời gian tổ chức LCNT" icon={Calendar} color="cyan">
                                    <InfoRow label="Thời gian tổ chức" value={pkg.SelectionDuration || '45 ngày'} />
                                    <InfoRow label="Thời gian bắt đầu" value={pkg.SelectionStartDate || '-'} />
                                    <InfoRow label="Tùy chọn mua thêm" value={pkg.HasOption ? 'Có' : 'Không'} />
                                    {pkg.PlanGroupName && (
                                        <>
                                            <div className="border-t border-gray-100 dark:border-slate-700 my-2" />
                                            <InfoRow label="Nhóm KH" value={<span className="font-medium text-indigo-600 dark:text-indigo-400">{pkg.PlanGroupName}</span>} />
                                            {pkg.PlanDecisionNumber && <InfoRow label="QĐ phê duyệt KH" value={pkg.PlanDecisionNumber} />}
                                            {pkg.PlanDecisionDate && <InfoRow label="Ngày QĐ" value={formatDate(pkg.PlanDecisionDate)} />}
                                        </>
                                    )}
                                </SectionCard>

                                {/* MSC Compliance Checklist */}
                                <SectionCard title="Đăng tải muasamcong.vn" icon={ExternalLink} color="green">
                                    {(() => {
                                        const reqs = getMSCRequirements(pkg);
                                        if (reqs.length === 0) return (
                                            <div className="text-center py-4">
                                                <CheckCircle2 className="w-8 h-8 text-green-400 dark:text-green-500 mx-auto mb-2" />
                                                <p className="text-sm text-gray-500 dark:text-slate-400">Không có yêu cầu đăng tải</p>
                                            </div>
                                        );
                                        return (
                                            <div className="space-y-2">
                                                {reqs.map((req, i) => (
                                                    <div key={i} className={`flex items-start gap-2 p-2 rounded-lg text-xs ${req.status === 'Done' ? 'bg-green-50 dark:bg-green-900/20' :
                                                        req.status === 'Overdue' ? 'bg-red-50 dark:bg-red-900/20' :
                                                            'bg-amber-50 dark:bg-amber-900/20'
                                                        }`}>
                                                        {req.status === 'Done' ? (
                                                            <CheckCircle2 className="w-4 h-4 text-green-500 dark:text-green-400 mt-0.5 shrink-0" />
                                                        ) : req.status === 'Overdue' ? (
                                                            <AlertTriangle className="w-4 h-4 text-red-500 dark:text-red-400 mt-0.5 shrink-0" />
                                                        ) : (
                                                            <Clock className="w-4 h-4 text-amber-500 dark:text-amber-400 mt-0.5 shrink-0" />
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`font-medium ${req.status === 'Done' ? 'text-green-800 dark:text-green-300' :
                                                                req.status === 'Overdue' ? 'text-red-800 dark:text-red-300' :
                                                                    'text-amber-800 dark:text-amber-300'
                                                                }`}>{req.documentType}</p>
                                                            <p className="text-gray-500 dark:text-slate-400 text-[10px] mt-0.5">
                                                                <LegalReferenceLink text={req.legalBasis} />
                                                                {req.deadline && ` • Hạn: ${req.deadline}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                                {/* MSC Links */}
                                                <div className="flex gap-2 mt-3 pt-2 border-t border-gray-100 dark:border-slate-700">
                                                    {pkg.MSCPlanCode && (
                                                        <a href={getMSCPlanLink(pkg.MSCPlanCode)} target="_blank" rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50">
                                                            <ExternalLink className="w-3 h-3" />
                                                            KHLCNT: {pkg.MSCPlanCode}
                                                        </a>
                                                    )}
                                                    {pkg.NotificationCode && (
                                                        <a href={getMSCPackageLink(pkg.NotificationCode)} target="_blank" rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/50">
                                                            <ExternalLink className="w-3 h-3" />
                                                            TBMT: {pkg.NotificationCode}
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </SectionCard>
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Lựa chọn nhà thầu */}
                    {activeTab === 'selection' && (
                        <div className="grid grid-cols-2 gap-6">
                            {/* Left: Bidders + Result */}
                            <div className="space-y-4">
                                <SectionCard title="Nhà thầu tham gia" icon={Users} color="blue">
                                    <BidderListSection packageId={pkg.PackageID} />
                                </SectionCard>

                                <SectionCard title="Kết quả lựa chọn nhà thầu" icon={Award} color="green">
                                    <WinningContractorSelector packageId={pkg.PackageID} />
                                    {pkg.WinningPrice ? (
                                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                                            <InfoRow label="Giá trúng thầu" value={<span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(pkg.WinningPrice)}</span>} />
                                            <InfoRow label="Tiết kiệm" value={savings > 0 ? <span className="text-blue-600 dark:text-blue-400">{formatCurrency(savings)} ({savingsPercent}%)</span> : '-'} />
                                            <InfoRow label="Ngày phê duyệt KQLCNT" value={pkg.ApprovalDate_Result ? formatDate(pkg.ApprovalDate_Result) : '-'} />
                                        </div>
                                    ) : null}
                                </SectionCard>
                            </div>

                            {/* Right: Evaluation */}
                            <div className="space-y-4">
                                <SectionCard title="Đánh giá HSDT" icon={BarChart3} color="yellow">
                                    <EvaluationSection packageId={pkg.PackageID} />
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
                                            <p className="font-semibold text-gray-800 dark:text-slate-100">{winningContractor.FullName}</p>
                                            <div className="text-sm text-gray-600 dark:text-slate-400 space-y-1.5">
                                                <p className="flex items-center gap-2"><Target className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" /> MST: {winningContractor.ContractorID}</p>
                                                {winningContractor.ContactInfo && <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" /> {winningContractor.ContactInfo}</p>}
                                                {winningContractor.Address && <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" /> {winningContractor.Address}</p>}
                                            </div>
                                        </div>
                                    ) : (
                                        <EmptyState icon={Building2} message="Chưa có nhà thầu" />
                                    )}
                                </SectionCard>

                                <SectionCard title="Hợp đồng" icon={FileSignature} color="blue">
                                    {relatedContract ? (
                                        <div className="space-y-2">
                                            <InfoRow label="Số hợp đồng" value={<span className="font-mono font-semibold">{relatedContract.ContractID}</span>} />
                                            <InfoRow label="Giá trị HĐ" value={<span className="font-bold text-blue-600 dark:text-blue-400">{formatCurrency(relatedContract.Value)}</span>} />
                                            <InfoRow label="Ngày ký" value={formatDate(relatedContract.SignDate)} />
                                            <InfoRow label="Thời gian thực hiện" value={pkg.Duration || '-'} />
                                            <InfoRow label="Trạng thái" value={
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${relatedContract.Status === ContractStatus.Executing ? 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400' :
                                                    relatedContract.Status === ContractStatus.Liquidated ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300'
                                                    }`}>
                                                    {relatedContract.Status === ContractStatus.Executing ? 'Đang thực hiện' :
                                                        relatedContract.Status === ContractStatus.Liquidated ? 'Đã thanh lý' : 'Tạm dừng'}
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
                                                <span className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(totalPaid)}</span>
                                                <span className="text-gray-400 dark:text-slate-500"> / </span>
                                                <span className="text-gray-600 dark:text-slate-300">{formatCurrency(contractValue)}</span>
                                            </div>
                                            <span className="text-lg font-bold text-green-600 dark:text-green-400">{paymentProgress.toFixed(1)}%</span>
                                        </div>
                                        <div className="h-4 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all"
                                                style={{ width: `${Math.min(paymentProgress, 100)}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-sm mt-2">
                                            <span className="text-gray-500 dark:text-slate-400">Đã thanh toán</span>
                                            <span className="text-orange-600 dark:text-orange-400 font-medium">Còn lại: {formatCurrency(contractValue - totalPaid)}</span>
                                        </div>
                                    </SectionCard>

                                    {/* Payment List */}
                                    <SectionCard title="Danh sách đợt thanh toán" icon={Receipt} color="gray" badge={`${relatedPayments.length} đợt`}>
                                        {relatedPayments.length > 0 ? (
                                            <div className="space-y-3">
                                                {relatedPayments.map((payment, idx) => (
                                                    <div key={payment.PaymentID} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${payment.Status === PaymentStatus.Transferred ? 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400'}`}>
                                                                {payment.Status === PaymentStatus.Transferred ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-800 dark:text-slate-200">Đợt {idx + 1}: {payment.Type}</p>
                                                                <p className="text-xs text-gray-500 dark:text-slate-400">Mã KB: {payment.TreasuryRef || 'Chờ thanh toán'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-bold text-gray-800 dark:text-slate-100">{formatCurrency(payment.Amount)}</p>
                                                            <span className={`text-xs px-2 py-0.5 rounded-full ${payment.Status === PaymentStatus.Transferred ? 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400'}`}>
                                                                {payment.Status === PaymentStatus.Transferred ? 'Đã chuyển tiền' : 'Chờ duyệt'}
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
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 text-center">
                                    <AlertTriangle className="w-12 h-12 text-yellow-400 dark:text-yellow-500 mx-auto mb-3" />
                                    <p className="font-medium text-gray-700 dark:text-slate-200">Chưa có hợp đồng để quản lý</p>
                                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Gói thầu cần có kết quả trúng thầu và hợp đồng ký kết</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab 4: Quyết toán */}
                    {activeTab === 'settlement' && (
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <SectionCard title="Nghiệm thu công trình" icon={CheckCircle2} color="green">
                                    {relatedContract?.Status === ContractStatus.Liquidated ? (
                                        <div className="space-y-2">
                                            <InfoRow label="Trạng thái" value={<span className="text-green-600 dark:text-green-400 font-medium">Đã nghiệm thu</span>} />
                                            <InfoRow label="Biên bản nghiệm thu" value="Đã ký" />
                                            <InfoRow label="Chất lượng" value={<span className="text-green-600 dark:text-green-400 font-medium">Đạt yêu cầu</span>} />
                                        </div>
                                    ) : (
                                        <EmptyState icon={CheckCircle2} message="Chưa nghiệm thu" hint="Hoàn thành hợp đồng để nghiệm thu" />
                                    )}
                                </SectionCard>

                                <SectionCard title="Quyết toán hợp đồng" icon={Calculator} color="blue">
                                    {relatedContract?.Status === ContractStatus.Liquidated ? (
                                        <div className="space-y-2">
                                            <InfoRow label="Giá trị quyết toán" value={<span className="font-bold text-blue-600 dark:text-blue-400">{formatCurrency(contractValue)}</span>} />
                                            <InfoRow label="Đã thanh toán" value={<span className="text-green-600 dark:text-green-400">{formatCurrency(totalPaid)}</span>} />
                                            <InfoRow label="Còn giữ lại (BH)" value={<span className="text-orange-600 dark:text-orange-400">{formatCurrency(contractValue * 0.05)}</span>} />
                                            <InfoRow label="Trạng thái" value={<span className="text-blue-600 dark:text-blue-400 font-medium">Đã thanh lý</span>} />
                                        </div>
                                    ) : (
                                        <EmptyState icon={Calculator} message="Chưa quyết toán" hint="Hoàn thành nghiệm thu để quyết toán" />
                                    )}
                                </SectionCard>
                            </div>

                            <div className="space-y-4">
                                <SectionCard title="Bảo hành công trình" icon={Shield} color="purple">
                                    {relatedContract?.Status === ContractStatus.Liquidated ? (
                                        <div className="space-y-2">
                                            <InfoRow label="Thời gian bảo hành" value={pkg.Field === 'Construction' ? '24 tháng (theo NĐ 06/2021)' : '12 tháng'} />
                                            <InfoRow label="Trạng thái" value={<span className="text-green-600 dark:text-green-400 font-medium">Đang trong bảo hành</span>} />
                                            <InfoRow label="Giá trị bảo lãnh BH" value={<span className="font-medium">{formatCurrency(contractValue * 0.05)}</span>} />
                                            <InfoRow label="Giá trị giữ lại (5%)" value={<span className="text-orange-600 dark:text-orange-400 font-medium">{formatCurrency(contractValue * 0.05)}</span>} />
                                        </div>
                                    ) : (
                                        <EmptyState icon={Shield} message="Chưa có thông tin bảo hành" hint="Hoàn thành quyết toán để bắt đầu bảo hành" />
                                    )}
                                </SectionCard>

                                <SectionCard title="Tổng hợp" icon={Package} color="slate">
                                    <div className="space-y-2">
                                        <InfoRow label="Giá gói thầu" value={formatCurrency(pkg.Price)} />
                                        <InfoRow label="Giá trúng thầu" value={pkg.WinningPrice ? formatCurrency(pkg.WinningPrice) : '-'} />
                                        <InfoRow label="Giá trị HĐ" value={relatedContract ? formatCurrency(relatedContract.Value) : '-'} />
                                        <div className="border-t border-gray-200 my-2" />
                                        <InfoRow label="Tiết kiệm so với dự toán" value={
                                            savings > 0
                                                ? <span className="font-bold text-blue-600 dark:text-blue-400">{formatCurrency(savings)} ({savingsPercent}%)</span>
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
    children?: React.ReactNode;
    badge?: string;
}) => {
    const colorMap: Record<string, string> = {
        blue: 'text-blue-600 dark:text-blue-400',
        green: 'text-green-600 dark:text-green-400',
        purple: 'text-purple-600 dark:text-purple-400',
        indigo: 'text-indigo-600 dark:text-indigo-400',
        yellow: 'text-yellow-600 dark:text-yellow-400',
        cyan: 'text-cyan-600 dark:text-cyan-400',
        emerald: 'text-emerald-600 dark:text-emerald-400',
        gray: 'text-gray-600 dark:text-slate-400',
        slate: 'text-slate-600 dark:text-slate-400',
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-800 dark:text-slate-200 flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${colorMap[color] || 'text-gray-500 dark:text-slate-400'}`} />
                    {title}
                </h4>
                {badge && (
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded text-xs font-medium">{badge}</span>
                )}
            </div>
            <div className="space-y-2 text-sm">{children}</div>
        </div>
    );
};

const InfoRow = ({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) => (
    <div className={`flex justify-between py-1.5 ${highlight ? 'bg-yellow-50 dark:bg-yellow-900/20 -mx-2 px-2 rounded' : ''}`}>
        <span className="text-gray-500 dark:text-slate-400">{label}</span>
        <span className={`font-medium text-gray-800 dark:text-slate-200 text-right ${highlight ? 'text-orange-600 dark:text-orange-400' : ''}`}>{value || '-'}</span>
    </div>
);

const EmptyState = ({ icon: Icon, message, hint }: { icon: React.ElementType; message: string; hint?: string }) => (
    <div className="text-center py-6">
        <Icon className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-2" />
        <p className="text-gray-500 dark:text-slate-400">{message}</p>
        {hint && <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{hint}</p>}
    </div>
);

export default BiddingPackageDetail;
