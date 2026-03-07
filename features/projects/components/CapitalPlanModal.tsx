import React, { useState, useEffect } from 'react';
import { CapitalPlan } from '../../../types';
import { X, Landmark, Save } from 'lucide-react';
import { LegalReferenceLink } from '../../../components/common/LegalReferenceLink';

interface CapitalPlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<CapitalPlan, 'PlanID'>) => void;
    editingPlan?: CapitalPlan | null;
    projectID: string;
    isSaving?: boolean;
}

const SOURCES = [
    { value: 'NganSachTrungUong', label: 'Ngân sách Trung ương' },
    { value: 'NganSachDiaPhuong', label: 'Ngân sách Địa phương' },
    { value: 'ODA', label: 'Vốn ODA' },
    { value: 'Khac', label: 'Nguồn khác' },
];

export const CapitalPlanModal: React.FC<CapitalPlanModalProps> = ({
    isOpen, onClose, onSave, editingPlan, projectID, isSaving
}) => {
    const [year, setYear] = useState(new Date().getFullYear());
    const [amount, setAmount] = useState('');
    const [source, setSource] = useState('NganSachTrungUong');
    const [decisionNumber, setDecisionNumber] = useState('');
    const [dateAssigned, setDateAssigned] = useState('');

    useEffect(() => {
        if (editingPlan) {
            setYear(editingPlan.Year);
            setAmount(String(editingPlan.Amount));
            setSource(editingPlan.Source);
            setDecisionNumber(editingPlan.DecisionNumber || '');
            setDateAssigned(editingPlan.DateAssigned || '');
        } else {
            setYear(new Date().getFullYear());
            setAmount('');
            setSource('NganSachTrungUong');
            setDecisionNumber('');
            setDateAssigned('');
        }
    }, [editingPlan, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || Number(amount) <= 0) return;
        onSave({
            ProjectID: projectID,
            Year: year,
            Amount: Number(amount),
            Source: source,
            DecisionNumber: decisionNumber || undefined,
            DateAssigned: dateAssigned || undefined,
            DisbursedAmount: editingPlan?.DisbursedAmount || 0,
            Status: editingPlan?.Status || 'Approved',
        });
    };

    const isEdit = !!editingPlan;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 border border-gray-200 dark:border-slate-700 animate-in fade-in zoom-in-95"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Landmark className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800 dark:text-slate-100">
                                {isEdit ? 'Sửa kế hoạch vốn' : 'Bổ sung kế hoạch vốn'}
                            </h2>
                            <p className="text-xs text-gray-400 dark:text-slate-500"><LegalReferenceLink text="Luật ĐTC 58/2024/QH15" /></p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Năm */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5">
                                Năm <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                value={year}
                                onChange={e => setYear(Number(e.target.value))}
                                min={2020} max={2035}
                                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                required
                            />
                        </div>

                        {/* Nguồn vốn */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5">
                                Nguồn vốn <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={source}
                                onChange={e => setSource(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            >
                                {SOURCES.map(s => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Số tiền */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5">
                            Vốn giao (VNĐ) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            placeholder="Nhập số tiền..."
                            min={0}
                            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            required
                        />
                    </div>

                    {/* Quyết định */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5">
                                Số QĐ giao vốn
                            </label>
                            <input
                                type="text"
                                value={decisionNumber}
                                onChange={e => setDecisionNumber(e.target.value)}
                                placeholder="VD: 123/QĐ-UBND"
                                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5">
                                Ngày giao
                            </label>
                            <input
                                type="date"
                                value={dateAssigned}
                                onChange={e => setDateAssigned(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                    </div>

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
                            disabled={isSaving || !amount}
                            className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-sm"
                        >
                            <Save className="w-4 h-4" />
                            {isSaving ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Bổ sung'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
