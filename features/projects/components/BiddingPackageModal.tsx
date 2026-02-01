import React, { useState, useEffect, useMemo } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { X, Loader2, Save, Calendar, FileText, Building2, AlertCircle, Lightbulb } from 'lucide-react';
import { BiddingPackage, PackageStatus, BIDDING_THRESHOLDS } from '../../../types';
import { formatCurrency } from '../../../utils/format';
import ApiClient from '../../../services/api';
import { detectApplicableMethod, getMethodGuidance, formatThreshold } from '../../../utils/biddingCompliance';

// ========================================
// BIDDING PACKAGE MODAL - NĐ 214/2025 Compliance
// ========================================

interface BiddingPackageModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    packageToEdit?: BiddingPackage | null;
}

// Options theo Luật Đấu thầu
const FIELD_OPTIONS = [
    { value: 'Construction', label: 'Xây lắp' },
    { value: 'Consultancy', label: 'Tư vấn' },
    { value: 'NonConsultancy', label: 'Phi tư vấn' },
    { value: 'Goods', label: 'Hàng hóa' },
    { value: 'Mixed', label: 'Hỗn hợp' },
];

const SELECTION_METHOD_OPTIONS = [
    { value: 'OpenBidding', label: 'Đấu thầu rộng rãi' },
    { value: 'LimitedBidding', label: 'Đấu thầu hạn chế' },
    { value: 'Appointed', label: 'Chỉ định thầu' },
    { value: 'CompetitiveShopping', label: 'Chào hàng cạnh tranh' },
    { value: 'DirectProcurement', label: 'Mua sắm trực tiếp' },
    { value: 'SelfExecution', label: 'Tự thực hiện' },
    { value: 'CommunityParticipation', label: 'Cộng đồng tham gia' },
];

const SELECTION_PROCEDURE_OPTIONS = [
    { value: 'OneStageOneEnvelope', label: '1 giai đoạn 1 túi hồ sơ' },
    { value: 'OneStageTwoEnvelope', label: '1 giai đoạn 2 túi hồ sơ' },
    { value: 'TwoStageOneEnvelope', label: '2 giai đoạn 1 túi hồ sơ' },
    { value: 'TwoStageTwoEnvelope', label: '2 giai đoạn 2 túi hồ sơ' },
    { value: 'Reduced', label: 'Rút gọn' },
    { value: 'Normal', label: 'Thông thường' },
];

const BID_TYPE_OPTIONS = [
    { value: 'Online', label: 'Đấu thầu qua mạng' },
    { value: 'Offline', label: 'Đấu thầu trực tiếp' },
];

const CONTRACT_TYPE_OPTIONS = [
    { value: 'LumpSum', label: 'Trọn gói' },
    { value: 'UnitPrice', label: 'Đơn giá cố định' },
    { value: 'AdjustableUnitPrice', label: 'Đơn giá điều chỉnh' },
    { value: 'TimeBased', label: 'Theo thời gian' },
    { value: 'Percentage', label: 'Theo tỷ lệ phần trăm' },
    { value: 'Mixed', label: 'Hỗn hợp' },
];

const STATUS_OPTIONS = [
    { value: PackageStatus.Planning, label: 'Trong kế hoạch' },
    { value: PackageStatus.Posted, label: 'Đã đăng tải TBMT' },
    { value: PackageStatus.Bidding, label: 'Đang mời thầu' },
    { value: PackageStatus.Evaluating, label: 'Đang xét thầu' },
    { value: PackageStatus.Awarded, label: 'Đã có kết quả' },
    { value: PackageStatus.Cancelled, label: 'Hủy thầu' },
];

interface FormData {
    PackageNumber: string;
    PackageName: string;
    Price: string;
    Duration: string;
    Field: string;
    SelectionMethod: string;
    SelectionProcedure: string;
    BidType: string;
    ContractType: string;
    Status: string;
    KHLCNTCode: string;
    NotificationCode: string;
    DecisionNumber: string;
    DecisionDate: string;
    PostingDate: string;
    BidClosingDate: string;
    BidOpeningDate: string;
    WinningContractorID: string;
    WinningPrice: string;
    ApprovalDate_Result: string;
}

const initialFormData: FormData = {
    PackageNumber: '',
    PackageName: '',
    Price: '',
    Duration: '',
    Field: 'Construction',
    SelectionMethod: 'OpenBidding',
    SelectionProcedure: 'OneStageOneEnvelope',
    BidType: 'Online',
    ContractType: 'LumpSum',
    Status: PackageStatus.Planning,
    KHLCNTCode: '',
    NotificationCode: '',
    DecisionNumber: '',
    DecisionDate: '',
    PostingDate: '',
    BidClosingDate: '',
    BidOpeningDate: '',
    WinningContractorID: '',
    WinningPrice: '',
    ApprovalDate_Result: '',
};

export const BiddingPackageModal: React.FC<BiddingPackageModalProps> = ({
    isOpen,
    onClose,
    projectId,
    packageToEdit,
}) => {
    const queryClient = useQueryClient();
    const isEditMode = !!packageToEdit;

    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
    const [activeTab, setActiveTab] = useState<'basic' | 'legal' | 'timeline' | 'result'>('basic');

    // Fetch contractors for winner selection
    const { data: contractors } = useQuery({
        queryKey: ['contractors'],
        queryFn: () => ApiClient.get('/api/contractors'),
        enabled: isOpen,
    });

    // NĐ 214/2025: Auto-detect applicable selection method based on price + field
    const methodGuidance = useMemo(() => {
        const price = parseFloat(formData.Price) || 0;
        if (price === 0) return null;

        const field = formData.Field as BiddingPackage['Field'];
        const method = detectApplicableMethod(price, field, true);
        return getMethodGuidance(method);
    }, [formData.Price, formData.Field]);

    // Initialize form when editing
    useEffect(() => {
        if (packageToEdit) {
            setFormData({
                PackageNumber: packageToEdit.PackageNumber || '',
                PackageName: packageToEdit.PackageName || '',
                Price: packageToEdit.Price?.toString() || '',
                Duration: packageToEdit.Duration || '',
                Field: packageToEdit.Field || 'Construction',
                SelectionMethod: packageToEdit.SelectionMethod || 'OpenBidding',
                SelectionProcedure: packageToEdit.SelectionProcedure || 'OneStageOneEnvelope',
                BidType: packageToEdit.BidType || 'Online',
                ContractType: packageToEdit.ContractType || 'LumpSum',
                Status: packageToEdit.Status || PackageStatus.Planning,
                KHLCNTCode: packageToEdit.KHLCNTCode || '',
                NotificationCode: packageToEdit.NotificationCode || '',
                DecisionNumber: packageToEdit.DecisionNumber || '',
                DecisionDate: packageToEdit.DecisionDate || '',
                PostingDate: packageToEdit.PostingDate || '',
                BidClosingDate: packageToEdit.BidClosingDate || '',
                BidOpeningDate: packageToEdit.BidOpeningDate || '',
                WinningContractorID: packageToEdit.WinningContractorID || '',
                WinningPrice: packageToEdit.WinningPrice?.toString() || '',
                ApprovalDate_Result: packageToEdit.ApprovalDate_Result || '',
            });
        } else {
            setFormData(initialFormData);
        }
        setErrors({});
        setActiveTab('basic');
    }, [packageToEdit, isOpen]);

    // Create mutation
    const createMutation = useMutation({
        mutationFn: (data: Partial<BiddingPackage>) =>
            ApiClient.post('/api/bidding-packages', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-packages', projectId] });
            onClose();
        },
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: (data: Partial<BiddingPackage>) =>
            ApiClient.put(`/api/bidding-packages/${packageToEdit?.PackageID}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-packages', projectId] });
            onClose();
        },
    });

    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    const handleChange = (field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const validate = (): boolean => {
        const newErrors: Partial<Record<keyof FormData, string>> = {};

        if (!formData.PackageNumber.trim()) {
            newErrors.PackageNumber = 'Số hiệu gói thầu là bắt buộc';
        }
        if (!formData.PackageName.trim()) {
            newErrors.PackageName = 'Tên gói thầu là bắt buộc';
        }
        if (!formData.Price || parseFloat(formData.Price) <= 0) {
            newErrors.Price = 'Giá gói thầu phải lớn hơn 0';
        }
        if (!formData.Duration.trim()) {
            newErrors.Duration = 'Thời gian thực hiện là bắt buộc';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        const payload: Partial<BiddingPackage> = {
            ProjectID: projectId,
            PackageNumber: formData.PackageNumber,
            PackageName: formData.PackageName,
            Price: parseFloat(formData.Price),
            Duration: formData.Duration,
            Field: formData.Field as any,
            SelectionMethod: formData.SelectionMethod as any,
            SelectionProcedure: formData.SelectionProcedure as any,
            BidType: formData.BidType as any,
            ContractType: formData.ContractType as any,
            Status: formData.Status as PackageStatus,
            KHLCNTCode: formData.KHLCNTCode || undefined,
            NotificationCode: formData.NotificationCode || undefined,
            DecisionNumber: formData.DecisionNumber || undefined,
            DecisionDate: formData.DecisionDate || undefined,
            PostingDate: formData.PostingDate || undefined,
            BidClosingDate: formData.BidClosingDate || undefined,
            BidOpeningDate: formData.BidOpeningDate || undefined,
            WinningContractorID: formData.WinningContractorID || undefined,
            WinningPrice: formData.WinningPrice ? parseFloat(formData.WinningPrice) : undefined,
            ApprovalDate_Result: formData.ApprovalDate_Result || undefined,
        };

        if (isEditMode) {
            updateMutation.mutate(payload);
        } else {
            createMutation.mutate(payload);
        }
    };

    if (!isOpen) return null;

    const tabs = [
        { id: 'basic', label: 'Thông tin cơ bản', icon: FileText },
        { id: 'legal', label: 'Phân loại pháp lý', icon: Building2 },
        { id: 'timeline', label: 'Mốc thời gian', icon: Calendar },
        { id: 'result', label: 'Kết quả LCNT', icon: AlertCircle },
    ] as const;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">
                            {isEditMode ? 'Chỉnh sửa gói thầu' : 'Thêm gói thầu mới'}
                        </h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Theo quy định NĐ 175/2024 và Luật Đấu thầu
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100 px-6">
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
                        </button>
                    ))}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                        {/* Tab: Basic Info */}
                        {activeTab === 'basic' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Số hiệu gói thầu <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="VD: XL-01"
                                        value={formData.PackageNumber}
                                        onChange={(e) => handleChange('PackageNumber', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${errors.PackageNumber ? 'border-red-500' : 'border-gray-200'}`}
                                    />
                                    {errors.PackageNumber && (
                                        <p className="mt-1 text-xs text-red-500">{errors.PackageNumber}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Trạng thái <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.Status}
                                        onChange={(e) => handleChange('Status', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    >
                                        {STATUS_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tên gói thầu <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        placeholder="Nhập tên đầy đủ của gói thầu..."
                                        value={formData.PackageName}
                                        onChange={(e) => handleChange('PackageName', e.target.value)}
                                        rows={2}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none ${errors.PackageName ? 'border-red-500' : 'border-gray-200'}`}
                                    />
                                    {errors.PackageName && (
                                        <p className="mt-1 text-xs text-red-500">{errors.PackageName}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Giá gói thầu (VNĐ) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={formData.Price}
                                        onChange={(e) => handleChange('Price', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.Price ? 'border-red-500' : 'border-gray-200'}`}
                                    />
                                    {formData.Price && (
                                        <p className="mt-1 text-xs text-gray-500">
                                            {formatCurrency(parseFloat(formData.Price) || 0)}
                                        </p>
                                    )}
                                    {errors.Price && (
                                        <p className="mt-1 text-xs text-red-500">{errors.Price}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Thời gian thực hiện <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="VD: 360 ngày"
                                        value={formData.Duration}
                                        onChange={(e) => handleChange('Duration', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.Duration ? 'border-red-500' : 'border-gray-200'}`}
                                    />
                                    {errors.Duration && (
                                        <p className="mt-1 text-xs text-red-500">{errors.Duration}</p>
                                    )}
                                </div>

                                {/* NĐ 214/2025 Guidance Banner */}
                                {methodGuidance && (
                                    <div className="col-span-2 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                        <div className="flex items-start gap-3">
                                            <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                                <h5 className="text-sm font-semibold text-blue-800">
                                                    Gợi ý theo NĐ 214/2025
                                                </h5>
                                                <p className="text-sm text-blue-700 mt-1">
                                                    Với giá gói thầu <strong>{formatCurrency(parseFloat(formData.Price) || 0)}</strong>
                                                    {' '}và lĩnh vực <strong>{FIELD_OPTIONS.find(o => o.value === formData.Field)?.label}</strong>,
                                                    {' '}có thể áp dụng: <strong>{methodGuidance.label}</strong>
                                                </p>
                                                <p className="text-xs text-blue-600 mt-1">
                                                    {methodGuidance.description} • <em>{methodGuidance.legalBasis}</em>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Tab: Legal Classification */}
                        {activeTab === 'legal' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Lĩnh vực
                                    </label>
                                    <select
                                        value={formData.Field}
                                        onChange={(e) => handleChange('Field', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    >
                                        {FIELD_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Hình thức lựa chọn nhà thầu
                                    </label>
                                    <select
                                        value={formData.SelectionMethod}
                                        onChange={(e) => handleChange('SelectionMethod', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    >
                                        {SELECTION_METHOD_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Phương thức lựa chọn
                                    </label>
                                    <select
                                        value={formData.SelectionProcedure}
                                        onChange={(e) => handleChange('SelectionProcedure', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    >
                                        {SELECTION_PROCEDURE_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Hình thức đấu thầu
                                    </label>
                                    <select
                                        value={formData.BidType}
                                        onChange={(e) => handleChange('BidType', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    >
                                        {BID_TYPE_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Loại hợp đồng
                                    </label>
                                    <select
                                        value={formData.ContractType}
                                        onChange={(e) => handleChange('ContractType', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    >
                                        {CONTRACT_TYPE_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Tab: Timeline */}
                        {activeTab === 'timeline' && (
                            <div className="space-y-6">
                                {/* KHLCNT Section */}
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <h4 className="font-semibold text-gray-800 mb-3">Kế hoạch lựa chọn nhà thầu</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Mã KHLCNT
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="VD: PL202400001"
                                                value={formData.KHLCNTCode}
                                                onChange={(e) => handleChange('KHLCNTCode', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Số QĐ phê duyệt KHLCNT
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="VD: 123/QĐ-UBND"
                                                value={formData.DecisionNumber}
                                                onChange={(e) => handleChange('DecisionNumber', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Ngày phê duyệt KHLCNT
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.DecisionDate}
                                                onChange={(e) => handleChange('DecisionDate', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* TBMT Section */}
                                <div className="p-4 bg-blue-50 rounded-xl">
                                    <h4 className="font-semibold text-gray-800 mb-3">Thông báo mời thầu (E-TBMT)</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Mã TBMT
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="VD: IB2400001234"
                                                value={formData.NotificationCode}
                                                onChange={(e) => handleChange('NotificationCode', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Ngày đăng tải
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.PostingDate}
                                                onChange={(e) => handleChange('PostingDate', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Thời điểm đóng thầu
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.BidClosingDate}
                                                onChange={(e) => handleChange('BidClosingDate', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Thời điểm mở thầu
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.BidOpeningDate}
                                                onChange={(e) => handleChange('BidOpeningDate', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab: Result */}
                        {activeTab === 'result' && (
                            <div className="space-y-4">
                                {formData.Status !== PackageStatus.Awarded && formData.Status !== 'Awarded' ? (
                                    <div className="p-8 text-center bg-gray-50 rounded-xl">
                                        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                        <p className="text-gray-600">
                                            Chỉ nhập kết quả khi gói thầu có trạng thái <strong>"Đã có kết quả"</strong>
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Thay đổi trạng thái ở tab "Thông tin cơ bản"
                                        </p>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-green-50 rounded-xl">
                                        <h4 className="font-semibold text-gray-800 mb-3">Kết quả lựa chọn nhà thầu</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Nhà thầu trúng thầu
                                                </label>
                                                <select
                                                    value={formData.WinningContractorID}
                                                    onChange={(e) => handleChange('WinningContractorID', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                                                >
                                                    <option value="">-- Chọn nhà thầu --</option>
                                                    {contractors?.data?.map((c: any) => (
                                                        <option key={c.ContractorID} value={c.ContractorID}>
                                                            {c.ContractorName}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Giá trúng thầu (VNĐ)
                                                </label>
                                                <input
                                                    type="number"
                                                    placeholder="0"
                                                    value={formData.WinningPrice}
                                                    onChange={(e) => handleChange('WinningPrice', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                                                />
                                                {formData.WinningPrice && (
                                                    <p className="mt-1 text-xs text-green-600 font-medium">
                                                        {formatCurrency(parseFloat(formData.WinningPrice) || 0)}
                                                    </p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Ngày phê duyệt KQLCNT
                                                </label>
                                                <input
                                                    type="date"
                                                    value={formData.ApprovalDate_Result}
                                                    onChange={(e) => handleChange('ApprovalDate_Result', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    {isEditMode ? 'Cập nhật' : 'Tạo gói thầu'}
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Error display */}
                {(createMutation.isError || updateMutation.isError) && (
                    <div className="absolute bottom-20 left-6 right-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        Có lỗi xảy ra. Vui lòng thử lại.
                    </div>
                )}
            </div>
        </div>
    );
};

export default BiddingPackageModal;
