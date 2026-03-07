import React, { useState, useMemo, useEffect } from 'react';
import { X, FileText, Download, ChevronRight, Building2, FileOutput, Send, ClipboardList } from 'lucide-react';
import { BiddingPackage, Project } from '../../../types';
import { formatCurrency } from '../../../utils/format';
import { exportKHLCNT, exportToTrinh, KHLCNTExportData } from '../../../utils/khlcntExport';
import { LegalReferenceLink } from '../../../components/common/LegalReferenceLink';

// ========================================
// KHLCNT EXPORT MODAL
// Xuất Tờ trình (Mẫu 07) & QĐ phê duyệt (Mẫu 09) KHLCNT
// ========================================

interface KHLCNTExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    packages: BiddingPackage[];
    project?: Project | null;
    projectId?: string;
}

export const KHLCNTExportModal: React.FC<KHLCNTExportModalProps> = ({
    isOpen,
    onClose,
    packages,
    project,
}) => {
    // Form state — auto-filled from project
    const [formData, setFormData] = useState({
        // Cơ quan ban hành / Cơ quan trình
        issuingAuthority: '',
        issuingDepartment: 'CHỦ TỊCH',
        // QĐ phê duyệt
        decisionNumber: '',
        decisionDate: new Date().toISOString().split('T')[0],
        signerName: '',
        signerTitle: 'CHỦ TỊCH',
        // Tờ trình
        submissionNumber: '',
        submissionDate: new Date().toISOString().split('T')[0],
        recipientAuthority: '',
        // Thông tin dự án (auto-fill)
        projectName: '',
        investmentDecision: '',
        investmentDecisionDate: '',
        totalInvestment: '',
        fundingSource: 'Ngân sách Nhà nước',
        investorName: '',
    });

    // Auto-fill from project data
    useEffect(() => {
        if (project) {
            setFormData(prev => ({
                ...prev,
                projectName: project.ProjectName || prev.projectName,
                totalInvestment: project.TotalInvestment ? String(project.TotalInvestment) : prev.totalInvestment,
                fundingSource: project.CapitalSource || prev.fundingSource,
                investorName: project.InvestorName || prev.investorName,
                investmentDecision: project.DecisionNumber || prev.investmentDecision,
                investmentDecisionDate: project.DecisionDate || prev.investmentDecisionDate,
                issuingAuthority: project.DecisionAuthority || prev.issuingAuthority || 'HỌC VIỆN CTQG HỒ CHÍ MINH',
                recipientAuthority: project.DecisionAuthority || prev.recipientAuthority,
            }));
        }
    }, [project]);

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Summary stats
    const stats = useMemo(() => {
        const totalPrice = packages.reduce((sum, pkg) => sum + (pkg.Price || 0), 0);
        const byField: Record<string, number> = {};
        packages.forEach(pkg => {
            const field = pkg.Field || 'Khác';
            byField[field] = (byField[field] || 0) + 1;
        });
        return { totalPrice, byField, count: packages.length };
    }, [packages]);

    const FIELD_LABELS: Record<string, string> = {
        Construction: 'Xây lắp',
        Consultancy: 'Tư vấn',
        NonConsultancy: 'Phi tư vấn',
        Goods: 'Hàng hóa',
        Mixed: 'Hỗn hợp',
    };

    const buildExportData = (): KHLCNTExportData => ({
        decisionNumber: formData.decisionNumber || '...../QĐ-UBND',
        decisionDate: formData.decisionDate,
        signerName: formData.signerName || '.....................',
        signerTitle: formData.signerTitle || 'CHỦ TỊCH',
        projectName: formData.projectName,
        investmentDecision: formData.investmentDecision || '...../QĐ-......',
        investmentDecisionDate: formData.investmentDecisionDate || '',
        totalInvestment: parseFloat(formData.totalInvestment) || stats.totalPrice,
        fundingSource: formData.fundingSource,
        investorName: formData.investorName || '.....................',
        issuingAuthority: formData.issuingAuthority,
        issuingDepartment: formData.issuingDepartment,
        submissionNumber: formData.submissionNumber || '...../TTr-...',
        submissionDate: formData.submissionDate,
        recipientAuthority: formData.recipientAuthority || formData.issuingAuthority,
        packages,
    });

    const handleExportToTrinh = async () => {
        await exportToTrinh(buildExportData());
        onClose();
    };

    const handleExportQuyetDinh = async () => {
        await exportKHLCNT(buildExportData());
        onClose();
    };

    if (!isOpen) return null;

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
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-xl">
                            <FileText className="w-5 h-5 text-blue-700" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">
                                Xuất văn bản KHLCNT
                            </h2>
                            <p className="text-xs text-gray-500">
                                Tờ trình (Mẫu 07) & QĐ phê duyệt (Mẫu 09) — TT 22/2024/TT-BKHĐT
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/80 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                    {/* Summary Banner */}
                    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-xl border border-blue-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Gói thầu đã chọn</p>
                                <p className="text-2xl font-bold text-gray-800">{stats.count} gói</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-medium text-gray-600">Tổng giá trị</p>
                                <p className="text-2xl font-bold text-blue-700">{formatCurrency(stats.totalPrice)}</p>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-3">
                            {Object.entries(stats.byField).map(([field, count]) => (
                                <span key={field} className="px-2 py-1 text-xs font-medium bg-white rounded-lg text-gray-600 shadow-sm">
                                    {FIELD_LABELS[field] || field}: {count}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Auto-fill indicator */}
                    {project && (
                        <div className="mb-4 p-2 bg-green-50 rounded-lg border border-green-200 flex items-center gap-2">
                            <span className="text-green-600 text-xs">✅</span>
                            <p className="text-xs text-green-700">
                                Thông tin dự án đã được tự động điền từ hệ thống. Bạn có thể chỉnh sửa nếu cần.
                            </p>
                        </div>
                    )}

                    {/* Form sections */}
                    <div className="space-y-5">
                        {/* Section: Thông tin dự án (auto-filled) */}
                        <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                            <h4 className="flex items-center gap-2 font-semibold text-gray-700 mb-3">
                                <ChevronRight className="w-4 h-4" />
                                Thông tin dự án
                                {project && <span className="text-xs text-green-600 font-normal ml-1">(tự động)</span>}
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-600 mb-1">
                                        Tên dự án <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.projectName}
                                        onChange={e => handleChange('projectName', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                                        placeholder="Tên đầy đủ của dự án"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">
                                        TMĐT (VNĐ)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.totalInvestment}
                                        onChange={e => handleChange('totalInvestment', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                        placeholder="0"
                                    />
                                    {formData.totalInvestment && (
                                        <p className="mt-1 text-xs text-gray-500">
                                            {formatCurrency(parseFloat(formData.totalInvestment) || 0)} đồng
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">
                                        Nguồn vốn
                                    </label>
                                    <select
                                        value={formData.fundingSource}
                                        onChange={e => handleChange('fundingSource', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                    >
                                        <option>Ngân sách Nhà nước</option>
                                        <option>Ngân sách Trung ương</option>
                                        <option>Ngân sách địa phương</option>
                                        <option>Ngân sách tỉnh</option>
                                        <option>Ngân sách tỉnh và Trung ương</option>
                                        <option>Vốn ODA</option>
                                        <option>Vốn vay ưu đãi</option>
                                        <option>Vốn hỗn hợp (NSNN + ODA)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">
                                        Chủ đầu tư
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.investorName}
                                        onChange={e => handleChange('investorName', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                        placeholder="VD: Ban QLDA ĐTXD tỉnh Hải Dương"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">
                                        Số QĐ phê duyệt dự án
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.investmentDecision}
                                        onChange={e => handleChange('investmentDecision', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                        placeholder="VD: 456/QĐ-UBND"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section: Cơ quan ban hành */}
                        <div className="p-4 bg-gray-50 rounded-xl">
                            <h4 className="flex items-center gap-2 font-semibold text-gray-700 mb-3">
                                <Building2 className="w-4 h-4" />
                                Cơ quan ban hành / Người có thẩm quyền
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">
                                        Cơ quan
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.issuingAuthority}
                                        onChange={e => handleChange('issuingAuthority', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                        placeholder="VD: HỌC VIỆN CTQG HỒ CHÍ MINH"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">
                                        Chức danh ký
                                    </label>
                                    <select
                                        value={formData.issuingDepartment}
                                        onChange={e => handleChange('issuingDepartment', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                    >
                                        <option value="CHỦ TỊCH">Chủ tịch</option>
                                        <option value="KT. CHỦ TỊCH / PHÓ CHỦ TỊCH">KT. Chủ tịch / Phó Chủ tịch</option>
                                        <option value="GIÁM ĐỐC">Giám đốc</option>
                                        <option value="KT. GIÁM ĐỐC / PHÓ GIÁM ĐỐC">KT. Giám đốc / Phó Giám đốc</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">
                                        Họ tên người ký
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.signerName}
                                        onChange={e => handleChange('signerName', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                        placeholder="Họ và tên"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">
                                        Ngày ký
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.decisionDate}
                                        onChange={e => handleChange('decisionDate', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section: Thông tin văn bản */}
                        <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                            <h4 className="flex items-center gap-2 font-semibold text-gray-700 mb-3">
                                <FileText className="w-4 h-4" />
                                Thông tin văn bản
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-white rounded-lg border">
                                    <p className="text-xs font-semibold text-amber-700 mb-2"><ClipboardList className="w-3.5 h-3.5 inline" /> Tờ trình (Mẫu 07)</p>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Số tờ trình</label>
                                            <input
                                                type="text"
                                                value={formData.submissionNumber}
                                                onChange={e => handleChange('submissionNumber', e.target.value)}
                                                className="w-full px-2.5 py-1.5 border border-gray-200 rounded-md focus:ring-2 focus:ring-amber-400 text-sm"
                                                placeholder="...../TTr-..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Ngày tờ trình</label>
                                            <input
                                                type="date"
                                                value={formData.submissionDate}
                                                onChange={e => handleChange('submissionDate', e.target.value)}
                                                className="w-full px-2.5 py-1.5 border border-gray-200 rounded-md focus:ring-2 focus:ring-amber-400 text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="p-3 bg-white rounded-lg border">
                                    <p className="text-xs font-semibold text-blue-700 mb-2">📜 Quyết định (Mẫu 09)</p>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Số quyết định</label>
                                            <input
                                                type="text"
                                                value={formData.decisionNumber}
                                                onChange={e => handleChange('decisionNumber', e.target.value)}
                                                className="w-full px-2.5 py-1.5 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-400 text-sm"
                                                placeholder="...../QĐ-UBND"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Kính gửi (cho Tờ trình)</label>
                                            <input
                                                type="text"
                                                value={formData.recipientAuthority}
                                                onChange={e => handleChange('recipientAuthority', e.target.value)}
                                                className="w-full px-2.5 py-1.5 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-400 text-sm"
                                                placeholder="Người có thẩm quyền"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Legal basis note */}
                    <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <p className="text-xs text-amber-800">
                            <strong>📜 Căn cứ pháp lý tự động:</strong>{' '}
                            <LegalReferenceLink text="Luật Đấu thầu 22/2023/QH15, NĐ 24/2024/NĐ-CP, NĐ 214/2025/NĐ-CP, Luật ĐTC 58/2024/QH15" />
                        </p>
                    </div>
                </div>

                {/* Footer — Two export buttons */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors text-sm"
                    >
                        Hủy
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={handleExportToTrinh}
                            disabled={!formData.projectName}
                            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm text-sm"
                        >
                            <Send className="w-4 h-4" />
                            Xuất Tờ trình
                        </button>
                        <button
                            onClick={handleExportQuyetDinh}
                            disabled={!formData.projectName}
                            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm text-sm"
                        >
                            <Download className="w-4 h-4" />
                            Xuất QĐ phê duyệt
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KHLCNTExportModal;
