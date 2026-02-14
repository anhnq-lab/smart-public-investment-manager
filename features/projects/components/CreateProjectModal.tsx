import React, { useState, useEffect } from 'react';
import { X, Building2, Calendar, DollarSign, MapPin, User, Clock, FileText, HardHat, Search, Shield } from 'lucide-react';
import { ProjectGroup, InvestmentType, Project } from '../../../types';
import { generateProjectCode } from '../../../utils/projectCodeGenerator';

interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<Project> & { StartDate: Date }) => Promise<void>;
}

const CONSTRUCTION_TYPES = [
    'Dân dụng', 'Công nghiệp', 'Giao thông', 'Nông nghiệp & PTNT',
    'Hạ tầng kỹ thuật', 'Quốc phòng, an ninh'
];

const CONSTRUCTION_GRADES = [
    { value: 'ĐB', label: 'Đặc biệt' },
    { value: 'I', label: 'Cấp I' },
    { value: 'II', label: 'Cấp II' },
    { value: 'III', label: 'Cấp III' },
    { value: 'IV', label: 'Cấp IV' },
];

/** Danh sách 34 tỉnh thành theo QĐ 19/2025/QĐ-TTg (từ 01/07/2025) */
const PROVINCES = [
    { code: '01', name: 'TP. Hà Nội' },
    { code: '04', name: 'Cao Bằng' },
    { code: '08', name: 'Tuyên Quang' },
    { code: '11', name: 'Điện Biên' },
    { code: '12', name: 'Lai Châu' },
    { code: '14', name: 'Sơn La' },
    { code: '15', name: 'Lào Cai' },
    { code: '19', name: 'Thái Nguyên' },
    { code: '20', name: 'Lạng Sơn' },
    { code: '22', name: 'Quảng Ninh' },
    { code: '24', name: 'Bắc Ninh' },
    { code: '25', name: 'Phú Thọ' },
    { code: '31', name: 'TP. Hải Phòng' },
    { code: '33', name: 'Hưng Yên' },
    { code: '37', name: 'Ninh Bình' },
    { code: '38', name: 'Thanh Hóa' },
    { code: '40', name: 'Nghệ An' },
    { code: '42', name: 'Hà Tĩnh' },
    { code: '44', name: 'Quảng Trị' },
    { code: '46', name: 'TP. Huế' },
    { code: '48', name: 'TP. Đà Nẵng' },
    { code: '51', name: 'Quảng Ngãi' },
    { code: '52', name: 'Gia Lai' },
    { code: '56', name: 'Khánh Hòa' },
    { code: '66', name: 'Đắk Lắk' },
    { code: '68', name: 'Lâm Đồng' },
    { code: '75', name: 'Đồng Nai' },
    { code: '79', name: 'TP. Hồ Chí Minh' },
    { code: '80', name: 'Tây Ninh' },
    { code: '82', name: 'Đồng Tháp' },
    { code: '86', name: 'Vĩnh Long' },
    { code: '91', name: 'An Giang' },
    { code: '92', name: 'TP. Cần Thơ' },
    { code: '96', name: 'Cà Mau' },
];

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose, onSave }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        // Section 1 - Thông tin cơ bản
        ProjectID: '',
        ProjectName: '',
        GroupCode: ProjectGroup.C,
        InvestmentType: InvestmentType.Public,
        StartDate: new Date().toISOString().split('T')[0],
        // Section 2 - Thông tin đầu tư
        TotalInvestment: 0,
        CapitalSource: 'Ngân sách Tỉnh',
        ProvinceCode: '42', // Hà Tĩnh default
        LocationCode: '',
        ConstructionType: '',
        ConstructionGrade: '',
        CompetentAuthority: '',
        InvestorName: '',
        Duration: '',
        // Section 3 - Nhà thầu & Tiêu chuẩn
        ApplicableStandards: '',
        FeasibilityContractor: '',
        SurveyContractor: '',
        ReviewContractor: '',
    });

    // Auto-generate Project Code
    useEffect(() => {
        if (isOpen) {
            const year = new Date(formData.StartDate).getFullYear();
            const code = generateProjectCode(formData.ProvinceCode, formData.GroupCode, formData.InvestmentType, year);
            setFormData(prev => ({ ...prev, ProjectID: code }));
        }
    }, [isOpen, formData.GroupCode, formData.InvestmentType, formData.StartDate, formData.ProvinceCode]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsLoading(true);
            await onSave({
                ...formData,
                Progress: 0,
                StartDate: new Date(formData.StartDate)
            });
            onClose();
        } catch (error) {
            console.error('Failed to create project:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const updateField = (field: string, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const SectionHeader = ({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string }) => (
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Icon className="w-4 h-4 text-blue-600" />
            </div>
            <div>
                <h3 className="text-sm font-bold text-gray-800">{title}</h3>
                <p className="text-[11px] text-gray-400">{subtitle}</p>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-blue-600" />
                            Thêm mới dự án
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">
                            Theo mẫu Phụ lục I (NĐ 175/2024) • Hệ thống tự động tạo mã dự án
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/80 rounded-full text-gray-400 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-8">

                    {/* ═══ SECTION 1: Thông tin cơ bản ═══ */}
                    <div>
                        <SectionHeader icon={Building2} title="Thông tin cơ bản" subtitle="Định danh và phân loại dự án" />

                        {/* Project Code (Auto) */}
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Mã dự án <span className="text-blue-500 text-xs font-normal">(Tự động theo TT24/2025)</span>
                            </label>
                            <input
                                type="text"
                                readOnly
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 font-mono outline-none cursor-not-allowed"
                                value={formData.ProjectID}
                            />
                        </div>

                        {/* Project Name */}
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Tên dự án <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                required
                                placeholder="VD: Xây dựng Đường Cao tốc Bắc Nam..."
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                value={formData.ProjectName}
                                onChange={e => updateField('ProjectName', e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Group Selection */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Nhóm dự án <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <select
                                        className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none bg-white"
                                        value={formData.GroupCode}
                                        onChange={e => updateField('GroupCode', e.target.value)}
                                    >
                                        <option value={ProjectGroup.C}>Nhóm C</option>
                                        <option value={ProjectGroup.B}>Nhóm B</option>
                                        <option value={ProjectGroup.A}>Nhóm A</option>
                                        <option value={ProjectGroup.QN}>Quan trọng Quốc gia</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                        <Building2 className="w-4 h-4 text-gray-400" />
                                    </div>
                                </div>
                            </div>

                            {/* Construction Type */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Loại công trình</label>
                                <select
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none bg-white"
                                    value={formData.ConstructionType}
                                    onChange={e => updateField('ConstructionType', e.target.value)}
                                >
                                    <option value="">-- Chọn loại --</option>
                                    {CONSTRUCTION_TYPES.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Construction Grade */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Cấp công trình</label>
                                <select
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none bg-white"
                                    value={formData.ConstructionGrade}
                                    onChange={e => updateField('ConstructionGrade', e.target.value)}
                                >
                                    <option value="">-- Chọn cấp --</option>
                                    {CONSTRUCTION_GRADES.map(g => (
                                        <option key={g.value} value={g.value}>{g.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <p className="text-[11px] text-blue-600 mt-2 flex items-center gap-1">
                            <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                            Nhóm dự án tự động áp dụng thời gian chuẩn theo Luật ĐTC
                        </p>
                    </div>

                    {/* ═══ SECTION 2: Thông tin đầu tư ═══ */}
                    <div>
                        <SectionHeader icon={DollarSign} title="Thông tin đầu tư" subtitle="Vốn, địa điểm và thời gian thực hiện" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Total Investment */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Tổng mức đầu tư (VNĐ)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        value={formData.TotalInvestment}
                                        onChange={e => updateField('TotalInvestment', Number(e.target.value))}
                                    />
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                </div>
                            </div>

                            {/* Start Date */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Ngày bắt đầu dự kiến</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        value={formData.StartDate}
                                        onChange={e => updateField('StartDate', e.target.value)}
                                    />
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                </div>
                            </div>

                            {/* Capital Source */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Nguồn vốn đầu tư</label>
                                <input
                                    type="text"
                                    placeholder="Ngân sách Tỉnh, NSTW..."
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    value={formData.CapitalSource}
                                    onChange={e => updateField('CapitalSource', e.target.value)}
                                />
                            </div>

                            {/* Province */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Tỉnh/Thành phố <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <select
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none bg-white"
                                        value={formData.ProvinceCode}
                                        onChange={e => updateField('ProvinceCode', e.target.value)}
                                    >
                                        {PROVINCES.map(p => (
                                            <option key={p.code} value={p.code}>{p.name} ({p.code})</option>
                                        ))}
                                    </select>
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                </div>
                                <p className="text-[11px] text-blue-600 mt-1 flex items-center gap-1">
                                    <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                    Mã tỉnh dùng cho mã dự án tự động
                                </p>
                            </div>

                            {/* Location (free text) */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Địa điểm xây dựng</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="VD: Xã Thạch Hạ, TP. Hà Tĩnh"
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        value={formData.LocationCode}
                                        onChange={e => updateField('LocationCode', e.target.value)}
                                    />
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                </div>
                            </div>

                            {/* Duration */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Thời gian thực hiện</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="VD: 36 tháng (2025-2028)"
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        value={formData.Duration}
                                        onChange={e => updateField('Duration', e.target.value)}
                                    />
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                </div>
                            </div>

                            {/* Competent Authority */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Người quyết định đầu tư</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="VD: Giám đốc Học viện CTQG HCM"
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        value={formData.CompetentAuthority}
                                        onChange={e => updateField('CompetentAuthority', e.target.value)}
                                    />
                                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                </div>
                            </div>
                        </div>

                        {/* Investor Name - full width */}
                        <div className="mt-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Tên chủ đầu tư</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="VD: Ban QLDA Đầu tư xây dựng khu vực..."
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    value={formData.InvestorName}
                                    onChange={e => updateField('InvestorName', e.target.value)}
                                />
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            </div>
                        </div>
                    </div>

                    {/* ═══ SECTION 3: Nhà thầu & Tiêu chuẩn ═══ */}
                    <div>
                        <SectionHeader icon={HardHat} title="Nhà thầu & Tiêu chuẩn" subtitle="Theo mục I.10-13 Mẫu 05 Phụ lục I" />

                        {/* Applicable Standards - full width */}
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Tiêu chuẩn, quy chuẩn áp dụng
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="VD: TCVN 5574:2018, QCVN 03:2022/BXD..."
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    value={formData.ApplicableStandards}
                                    onChange={e => updateField('ApplicableStandards', e.target.value)}
                                />
                                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Feasibility Contractor */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">NT lập BCNCKT</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Tên nhà thầu..."
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        value={formData.FeasibilityContractor}
                                        onChange={e => updateField('FeasibilityContractor', e.target.value)}
                                    />
                                    <HardHat className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                </div>
                            </div>

                            {/* Survey Contractor */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">NT khảo sát XD</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Tên nhà thầu..."
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        value={formData.SurveyContractor}
                                        onChange={e => updateField('SurveyContractor', e.target.value)}
                                    />
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                </div>
                            </div>

                            {/* Review Contractor */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">NT thẩm tra</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Tên nhà thầu..."
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        value={formData.ReviewContractor}
                                        onChange={e => updateField('ReviewContractor', e.target.value)}
                                    />
                                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                </form>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                    <p className="text-[11px] text-gray-400">
                        Các trường không bắt buộc có thể bổ sung sau
                    </p>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-gray-600 font-medium hover:bg-gray-200 transition-colors"
                            disabled={isLoading}
                        >
                            Hủy bỏ
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="px-6 py-2 rounded-lg bg-blue-600 text-white font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Đang xử lý...
                                </>
                            ) : (
                                'Tạo dự án'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
