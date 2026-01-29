import React, { useState, useEffect } from 'react';
import { X, Building2, Calendar, DollarSign, MapPin } from 'lucide-react';
import { ProjectGroup, InvestmentType, Project } from '../../../types';
import { generateProjectCode } from '../../../utils/projectCodeGenerator';

interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<Project> & { StartDate: Date }) => Promise<void>;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose, onSave }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        ProjectID: '',
        ProjectName: '',
        GroupCode: ProjectGroup.C,
        InvestmentType: InvestmentType.Public,
        TotalInvestment: 0,
        LocationCode: 'Hà Tĩnh',
        CapitalSource: 'Ngân sách Tỉnh',
        StartDate: new Date().toISOString().split('T')[0] // YYYY-MM-DD
    });

    // Auto-generate Project Code
    useEffect(() => {
        if (isOpen) {
            const year = new Date(formData.StartDate).getFullYear();
            const code = generateProjectCode('38', formData.GroupCode, formData.InvestmentType, year);
            setFormData(prev => ({ ...prev, ProjectID: code }));
        }
    }, [isOpen, formData.GroupCode, formData.InvestmentType, formData.StartDate]);

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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-blue-600" />
                            Thêm mới dự án
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">
                            Hệ thống sẽ tự động tạo kế hoạch thực hiện dựa trên nhóm dự án.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">

                    {/* Project Code (Auto) */}
                    <div>
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
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Tên dự án <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            required
                            placeholder="VD: Xây dựng Đường Cao tốc Bắc Nam..."
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            value={formData.ProjectName}
                            onChange={e => setFormData({ ...formData, ProjectName: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Group Selection */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Nhóm dự án <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <select
                                    className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none bg-white"
                                    value={formData.GroupCode}
                                    onChange={e => setFormData({ ...formData, GroupCode: e.target.value as ProjectGroup })}
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
                            <p className="text-[11px] text-blue-600 mt-1.5 flex items-center gap-1">
                                <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                Tự động áp dụng thời gian chuẩn theo Luật ĐTC
                            </p>
                        </div>

                        {/* Start Date */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Ngày bắt đầu dự kiến</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    value={formData.StartDate}
                                    onChange={e => setFormData({ ...formData, StartDate: e.target.value })}
                                />
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            </div>
                        </div>

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
                                    onChange={e => setFormData({ ...formData, TotalInvestment: Number(e.target.value) })}
                                />
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            </div>
                        </div>

                        {/* Location */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Địa điểm</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Hà Tĩnh"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    value={formData.LocationCode}
                                    onChange={e => setFormData({ ...formData, LocationCode: e.target.value })}
                                />
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            </div>
                        </div>
                    </div>

                    {/* Capital Source */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Nguồn vốn</label>
                        <input
                            type="text"
                            placeholder="Ngân sách Tỉnh, NSTW..."
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                            value={formData.CapitalSource}
                            onChange={e => setFormData({ ...formData, CapitalSource: e.target.value })}
                        />
                    </div>

                </form>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
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
    );
};
