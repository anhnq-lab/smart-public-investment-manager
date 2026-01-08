import React, { useState } from 'react';
import { X, CreditCard, FileText, Calendar, DollarSign, Building2, Hash, AlertCircle, CheckCircle2 } from 'lucide-react';
import { mockContracts, mockContractors, formatCurrency } from '../mockData';
import { PaymentType, PaymentStatus } from '../types';

interface PaymentFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (payment: any) => void;
    contractId?: string;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ isOpen, onClose, onSubmit, contractId }) => {
    const [formData, setFormData] = useState({
        contractId: contractId || '',
        batchNo: 1,
        type: PaymentType.Advance,
        amount: 0,
        treasuryRef: '',
        note: '',
        formType: '03a' as '03a' | '04a'
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const selectedContract = mockContracts.find(c => c.ContractID === formData.contractId);
    const contractor = selectedContract ? mockContractors.find(ct => ct.ContractorID === selectedContract.ContractorID) : null;

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!formData.contractId) errs.contractId = 'Vui lòng chọn hợp đồng';
        if (!formData.amount || formData.amount <= 0) errs.amount = 'Số tiền phải lớn hơn 0';
        if (!formData.treasuryRef) errs.treasuryRef = 'Vui lòng nhập mã giao dịch kho bạc';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSubmitting(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        const newPayment = {
            PaymentID: Date.now(),
            ContractID: formData.contractId,
            BatchNo: formData.batchNo,
            Type: formData.type,
            Amount: formData.amount,
            TreasuryRef: formData.treasuryRef,
            Status: PaymentStatus.Pending
        };

        onSubmit(newPayment);
        setIsSubmitting(false);
        setShowSuccess(true);

        setTimeout(() => {
            setShowSuccess(false);
            onClose();
        }, 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Tạo phiếu thanh toán</h2>
                            <p className="text-emerald-100 text-xs">Biểu mẫu kho bạc Nhà nước</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {showSuccess ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in">
                            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Tạo phiếu thành công!</h3>
                        <p className="text-sm text-gray-500">Phiếu thanh toán đã được gửi để chờ duyệt</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {/* Contract Selection */}
                        <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                                <Building2 className="w-3.5 h-3.5 inline mr-1" />
                                Hợp đồng
                            </label>
                            <select
                                value={formData.contractId}
                                onChange={e => setFormData({ ...formData, contractId: e.target.value })}
                                className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.contractId ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                    }`}
                            >
                                <option value="">-- Chọn hợp đồng --</option>
                                {mockContracts.map(c => {
                                    const ct = mockContractors.find(x => x.ContractorID === c.ContractorID);
                                    return (
                                        <option key={c.ContractID} value={c.ContractID}>
                                            {c.ContractID} - {ct?.FullName || 'Nhà thầu'} ({formatCurrency(c.Value)})
                                        </option>
                                    );
                                })}
                            </select>
                            {errors.contractId && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.contractId}</p>}
                        </div>

                        {/* Contract Info */}
                        {selectedContract && (
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-500">Nhà thầu:</span>
                                        <p className="font-medium text-gray-800">{contractor?.FullName}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Giá trị HĐ:</span>
                                        <p className="font-bold text-emerald-600">{formatCurrency(selectedContract.Value)}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Tỷ lệ tạm ứng:</span>
                                        <p className="font-medium text-gray-800">{selectedContract.AdvanceRate}%</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Bảo hành:</span>
                                        <p className="font-medium text-gray-800">{selectedContract.Warranty} tháng</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Form Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Batch Number */}
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                                    <Hash className="w-3.5 h-3.5 inline mr-1" />
                                    Đợt thanh toán
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.batchNo}
                                    onChange={e => setFormData({ ...formData, batchNo: parseInt(e.target.value) || 1 })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            {/* Payment Type */}
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                                    <FileText className="w-3.5 h-3.5 inline mr-1" />
                                    Loại thanh toán
                                </label>
                                <select
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value as PaymentType })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value={PaymentType.Advance}>Tạm ứng</option>
                                    <option value={PaymentType.Volume}>Thanh toán khối lượng</option>
                                </select>
                            </div>
                        </div>

                        {/* Amount */}
                        <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                                <DollarSign className="w-3.5 h-3.5 inline mr-1" />
                                Số tiền đề nghị thanh toán (VNĐ)
                            </label>
                            <input
                                type="number"
                                value={formData.amount}
                                onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                                placeholder="0"
                                className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-lg font-bold ${errors.amount ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                    }`}
                            />
                            {formData.amount > 0 && (
                                <p className="text-xs text-emerald-600 mt-1 font-medium">
                                    = {formatCurrency(formData.amount)}
                                </p>
                            )}
                            {errors.amount && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.amount}</p>}
                        </div>

                        {/* Treasury Reference */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                                    Mã giao dịch Kho bạc
                                </label>
                                <input
                                    type="text"
                                    value={formData.treasuryRef}
                                    onChange={e => setFormData({ ...formData, treasuryRef: e.target.value })}
                                    placeholder="VD: KB-2025-001234"
                                    className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono ${errors.treasuryRef ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                        }`}
                                />
                                {errors.treasuryRef && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.treasuryRef}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                                    Biểu mẫu Kho bạc
                                </label>
                                <div className="flex gap-3">
                                    <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border rounded-xl cursor-pointer transition-all ${formData.formType === '03a' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 hover:bg-gray-50'
                                        }`}>
                                        <input
                                            type="radio"
                                            name="formType"
                                            value="03a"
                                            checked={formData.formType === '03a'}
                                            onChange={() => setFormData({ ...formData, formType: '03a' })}
                                            className="sr-only"
                                        />
                                        <span className="text-sm font-bold">Mẫu 03a</span>
                                    </label>
                                    <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border rounded-xl cursor-pointer transition-all ${formData.formType === '04a' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 hover:bg-gray-50'
                                        }`}>
                                        <input
                                            type="radio"
                                            name="formType"
                                            value="04a"
                                            checked={formData.formType === '04a'}
                                            onChange={() => setFormData({ ...formData, formType: '04a' })}
                                            className="sr-only"
                                        />
                                        <span className="text-sm font-bold">Mẫu 04a</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Note */}
                        <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                                Ghi chú
                            </label>
                            <textarea
                                value={formData.note}
                                onChange={e => setFormData({ ...formData, note: e.target.value })}
                                placeholder="Nhập nội dung ghi chú (nếu có)"
                                rows={2}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 flex items-center gap-2 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Đang tạo...
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="w-4 h-4" />
                                        Tạo phiếu thanh toán
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default PaymentForm;
