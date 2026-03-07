import React, { useState, useEffect } from 'react';
import { Disbursement, CapitalPlan } from '../../../types';
import { X, Receipt, Save } from 'lucide-react';

interface DisbursementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<Disbursement, 'DisbursementID'>) => void;
    editing?: Disbursement | null;
    projectID: string;
    capitalPlans?: CapitalPlan[];
    isSaving?: boolean;
}

const TYPES = [
    { value: 'TamUng', label: 'Tạm ứng' },
    { value: 'ThanhToanKLHT', label: 'Thanh toán KLHT' },
    { value: 'ThuHoiTamUng', label: 'Thu hồi tạm ứng' },
];

const FORM_TYPES = [
    { value: '03a', label: 'Mẫu 03a — Giấy đề nghị thanh toán vốn' },
    { value: '03b', label: 'Mẫu 03b — Bảng xác nhận giá trị KLHT' },
    { value: '04a', label: 'Mẫu 04a — Giấy rút vốn đầu tư' },
    { value: '04b', label: 'Mẫu 04b — Giấy đề nghị thu hồi vốn TƯ' },
    { value: '05', label: 'Mẫu 05 — Giấy nộp trả vốn' },
];

const SOURCE_LABELS: Record<string, string> = {
    NganSachTrungUong: 'NSTW',
    NganSachDiaPhuong: 'NSĐP',
    ODA: 'ODA',
    Khac: 'Khác',
};

export const DisbursementModal: React.FC<DisbursementModalProps> = ({
    isOpen, onClose, onSave, editing, projectID, capitalPlans = [], isSaving
}) => {
    const [date, setDate] = useState('');
    const [description, setDescription] = useState('');
    const [contractNumber, setContractNumber] = useState('');
    const [type, setType] = useState<string>('ThanhToanKLHT');
    const [formType, setFormType] = useState('03a');
    const [amount, setAmount] = useState('');
    const [treasuryCode, setTreasuryCode] = useState('');
    const [capitalPlanId, setCapitalPlanId] = useState('');

    useEffect(() => {
        if (editing) {
            setDate(editing.Date || '');
            setDescription(editing.Description || '');
            setContractNumber(editing.ContractNumber || '');
            setType(editing.Type || 'ThanhToanKLHT');
            setFormType(editing.FormType || '03a');
            setAmount(String(editing.Amount));
            setTreasuryCode(editing.TreasuryCode || '');
            setCapitalPlanId(editing.CapitalPlanID || '');
        } else {
            setDate(new Date().toISOString().split('T')[0]);
            setDescription('');
            setContractNumber('');
            setType('ThanhToanKLHT');
            setFormType('03a');
            setAmount('');
            setTreasuryCode('');
            setCapitalPlanId('');
        }
    }, [editing, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || Number(amount) <= 0 || !date) return;
        onSave({
            ProjectID: projectID,
            Date: date,
            Description: description,
            ContractNumber: contractNumber,
            Type: type as Disbursement['Type'],
            FormType: formType,
            Amount: Number(amount),
            TreasuryCode: treasuryCode,
            CapitalPlanID: capitalPlanId || undefined,
            AllocationID: capitalPlanId || undefined,
            Status: editing?.Status || 'Pending',
        });
    };

    const isEdit = !!editing;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 border border-gray-200 dark:border-slate-700 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-800 z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                            <Receipt className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800 dark:text-slate-100">
                                {isEdit ? 'Sửa bút toán giải ngân' : 'Đề nghị thanh toán mới'}
                            </h2>
                            <p className="text-xs text-gray-400 dark:text-slate-500">NĐ 99/2021/NĐ-CP</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Row 1: Ngày + Loại */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5">
                                Ngày <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5">
                                Loại thanh toán <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={type}
                                onChange={e => setType(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                            >
                                {TYPES.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Nội dung */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5">
                            Nội dung
                        </label>
                        <input
                            type="text"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="VD: Thanh toán đợt 3 gói thầu XL01..."
                            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                        />
                    </div>

                    {/* Row 2: HĐ số + Biểu mẫu */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5">
                                Số hợp đồng
                            </label>
                            <input
                                type="text"
                                value={contractNumber}
                                onChange={e => setContractNumber(e.target.value)}
                                placeholder="VD: HĐ-XL01/2025"
                                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5">
                                Biểu mẫu <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formType}
                                onChange={e => setFormType(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                            >
                                {FORM_TYPES.map(f => (
                                    <option key={f.value} value={f.value}>{f.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Row 3: Số tiền + Mã Kho bạc */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5">
                                Số tiền (VNĐ) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                placeholder="Nhập số tiền..."
                                min={0}
                                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5">
                                Mã Kho bạc
                            </label>
                            <input
                                type="text"
                                value={treasuryCode}
                                onChange={e => setTreasuryCode(e.target.value)}
                                placeholder="VD: KB-HCM-001"
                                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Kế hoạch vốn liên kết */}
                    {capitalPlans.length > 0 && (
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5">
                                Kế hoạch vốn liên kết
                            </label>
                            <select
                                value={capitalPlanId}
                                onChange={e => setCapitalPlanId(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                            >
                                <option value="">— Không chọn —</option>
                                {capitalPlans.map(p => (
                                    <option key={p.PlanID} value={p.PlanID}>
                                        Năm {p.Year} — {SOURCE_LABELS[p.Source] || p.Source} — {new Intl.NumberFormat('vi-VN').format(p.Amount)} đ
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving || !amount || !date}
                            className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-sm"
                        >
                            <Save className="w-4 h-4" />
                            {isSaving ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo mới'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
