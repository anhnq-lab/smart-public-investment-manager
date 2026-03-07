import React, { useState } from 'react';
import { useContractors } from '../../hooks/useContractors';
import { ContractorService } from '../../services/ContractorService';
import { Contractor } from '../../types';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ui/Toast';
import { useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2, Plus, X, Search, Users, Building2, Globe, MapPin, Phone, User, Calendar, Loader2, Hash } from 'lucide-react';

const ContractorList: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const queryClient = useQueryClient();
    const { contractors, isLoading } = useContractors();
    const [searchTerm, setSearchTerm] = useState('');
    const [saving, setSaving] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [currentContractor, setCurrentContractor] = useState<Partial<Contractor>>({});

    // Stats
    const totalContractors = contractors.length;
    const foreignContractors = contractors.filter(c => c.IsForeign).length;
    const domesticContractors = totalContractors - foreignContractors;

    // Filter — search by name, tax code, address
    const filteredContractors = contractors.filter(c => {
        const term = searchTerm.toLowerCase();
        return c.FullName.toLowerCase().includes(term) ||
            (c.TaxCode || '').toLowerCase().includes(term) ||
            (c.Address || '').toLowerCase().includes(term) ||
            (c.Representative || '').toLowerCase().includes(term);
    });

    const handleAdd = () => {
        setIsEditing(false);
        setCurrentContractor({
            ContractorID: '',
            FullName: '',
            TaxCode: '',
            CapCertCode: '',
            IsForeign: false,
            Address: '',
            ContactInfo: '',
            Representative: '',
            EstablishedYear: undefined,
        });
        setIsModalOpen(true);
    };

    const handleEdit = (e: React.MouseEvent, contractor: Contractor) => {
        e.stopPropagation();
        setIsEditing(true);
        setCurrentContractor({ ...contractor });
        setIsModalOpen(true);
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setDeleteTarget(id);
        setIsDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            setSaving(true);
            await ContractorService.delete(deleteTarget);
            await queryClient.invalidateQueries({ queryKey: ['contractors'] });
            showToast('Đã xóa nhà thầu thành công', 'success');
        } catch (err: any) {
            showToast(`Lỗi xóa: ${err.message}`, 'error');
        } finally {
            setSaving(false);
            setIsDeleteConfirmOpen(false);
            setDeleteTarget(null);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentContractor?.FullName) {
            showToast('Vui lòng nhập tên nhà thầu', 'error');
            return;
        }

        try {
            setSaving(true);
            if (isEditing && currentContractor.ContractorID) {
                // Update existing
                await ContractorService.update(currentContractor.ContractorID, currentContractor);
                showToast('Đã cập nhật thông tin nhà thầu', 'success');
            } else {
                // Create new — auto-generate ID from tax code or timestamp
                const id = currentContractor.TaxCode
                    ? `NT-${currentContractor.TaxCode}`
                    : `NT-${Date.now()}`;
                await ContractorService.create({
                    ...currentContractor,
                    ContractorID: id,
                });
                showToast('Đã thêm nhà thầu mới thành công', 'success');
            }
            await queryClient.invalidateQueries({ queryKey: ['contractors'] });
            setIsModalOpen(false);
        } catch (err: any) {
            showToast(`Lỗi lưu: ${err.message}`, 'error');
        } finally {
            setSaving(false);
        }
    };

    const stats = [
        { label: 'Tổng nhà thầu', value: totalContractors, icon: Users, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30' },
        { label: 'Trong nước', value: domesticContractors, icon: Building2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
        { label: 'Nước ngoài', value: foreignContractors, icon: Globe, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/30' },
    ];

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100">Quản lý Nhà thầu</h2>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Quản lý thông tin và năng lực các đơn vị tư vấn, thi công</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 dark:shadow-blue-900/30 flex items-center gap-2 whitespace-nowrap"
                >
                    <Plus className="w-4 h-4" /> Thêm nhà thầu
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {stats.map(stat => {
                    // Map stat.color (e.g. 'text-blue-600') to gradient
                    const colorMatch = stat.color.match(/text-(\w+)-/);
                    const colorName = colorMatch ? colorMatch[1] : 'blue';
                    const gradientMap: Record<string, string> = {
                        blue: 'from-blue-500 via-blue-600 to-indigo-700',
                        emerald: 'from-emerald-500 via-emerald-600 to-teal-700',
                        amber: 'from-amber-500 via-orange-500 to-red-500',
                        red: 'from-red-500 via-red-600 to-rose-700',
                        violet: 'from-violet-500 via-violet-600 to-purple-700',
                        purple: 'from-purple-500 via-purple-600 to-fuchsia-700',
                    };
                    const gradient = gradientMap[colorName] || gradientMap.blue;
                    const ringMap: Record<string, string> = {
                        blue: 'ring-blue-400/30',
                        emerald: 'ring-emerald-400/30',
                        amber: 'ring-amber-400/30',
                        red: 'ring-red-400/30',
                        violet: 'ring-violet-400/30',
                        purple: 'ring-purple-400/30',
                    };
                    const ring = ringMap[colorName] || ringMap.blue;

                    return (
                        <div key={stat.label} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} text-white p-5 shadow-xl ring-1 ${ring} transition-transform hover:scale-[1.02] hover:shadow-2xl duration-300`}>
                            <div className="absolute -right-3 -top-3 opacity-[0.12]">
                                <stat.icon className="w-24 h-24" strokeWidth={1.2} />
                            </div>
                            <div className="relative z-10 flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-white/20 shadow-sm">
                                    <stat.icon className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-white drop-shadow-sm">{stat.value}</p>
                                    <p className="text-[10px] font-extrabold text-white/90 uppercase tracking-[0.15em]">{stat.label}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Search Bar + Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                    <div className="relative max-w-sm">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                        <input
                            type="text"
                            placeholder="Tìm theo tên, mã số thuế, địa chỉ..."
                            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-360px)]">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="table-header-row">
                                <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest">Mã số thuế</th>
                                <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest">Tên nhà thầu</th>
                                <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest">Người đại diện</th>
                                <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest text-center">Loại hình</th>
                                <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest">Địa chỉ / Liên hệ</th>
                                <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {isLoading ? (
                                // Loading skeleton
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        {Array.from({ length: 6 }).map((_, j) => (
                                            <td key={j} className="px-6 py-4">
                                                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : filteredContractors.length > 0 ? (
                                filteredContractors.map((contractor) => (
                                    <tr key={contractor.ContractorID} onClick={() => navigate(`/contractors/${contractor.ContractorID}`)} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors cursor-pointer group">
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-xs font-bold text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-lg border border-gray-200 dark:border-slate-600">
                                                {contractor.TaxCode || contractor.ContractorID}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-800 dark:text-slate-100 max-w-xs">
                                            <div className="truncate" title={contractor.FullName}>{contractor.FullName}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                                            {contractor.Representative ? (
                                                <div className="flex items-center gap-1.5">
                                                    <User className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 shrink-0" />
                                                    {contractor.Representative}
                                                </div>
                                            ) : (
                                                <span className="text-gray-300 dark:text-slate-600">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {contractor.IsForeign ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 uppercase">
                                                    Nước ngoài
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 uppercase">
                                                    Trong nước
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-xs">
                                            <div className="flex items-center gap-1.5 truncate max-w-xs font-medium text-gray-900 dark:text-slate-200" title={contractor.Address}>
                                                <MapPin className="w-3 h-3 text-gray-400 dark:text-slate-500 shrink-0" />
                                                {contractor.Address || '—'}
                                            </div>
                                            {contractor.ContactInfo && (
                                                <div className="flex items-center gap-1.5 text-gray-400 dark:text-slate-500 mt-0.5">
                                                    <Phone className="w-3 h-3 shrink-0" />
                                                    {contractor.ContactInfo}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => handleEdit(e, contractor)}
                                                    className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-colors"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDelete(e, contractor.ContractorID)}
                                                    className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center">
                                        <Search className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
                                        <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Không tìm thấy nhà thầu nào</p>
                                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Thử thay đổi từ khóa tìm kiếm</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Table Footer */}
                <div className="px-6 py-3 border-t border-gray-200 dark:border-slate-700 text-xs text-gray-500 dark:text-slate-400">
                    Hiển thị {filteredContractors.length} / {totalContractors} nhà thầu
                </div>
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg border border-gray-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">
                                {isEditing ? 'Cập nhật thông tin' : 'Thêm nhà thầu mới'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            {/* Row: Tên nhà thầu */}
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Tên nhà thầu <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    value={currentContractor.FullName || ''}
                                    onChange={e => setCurrentContractor(prev => ({ ...prev, FullName: e.target.value }))}
                                    placeholder="VD: Công Ty CP Tư Vấn XD..."
                                />
                            </div>

                            {/* Row: MST + Năm thành lập */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                                        <Hash className="w-3 h-3 inline mr-1" />Mã số thuế
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                                        value={currentContractor.TaxCode || ''}
                                        onChange={e => setCurrentContractor(prev => ({ ...prev, TaxCode: e.target.value }))}
                                        placeholder="0100106112"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                                        <Calendar className="w-3 h-3 inline mr-1" />Năm thành lập
                                    </label>
                                    <input
                                        type="number"
                                        min="1900"
                                        max="2030"
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        value={currentContractor.EstablishedYear || ''}
                                        onChange={e => setCurrentContractor(prev => ({ ...prev, EstablishedYear: e.target.value ? parseInt(e.target.value) : undefined }))}
                                        placeholder="1998"
                                    />
                                </div>
                            </div>

                            {/* Row: Người đại diện */}
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                                    <User className="w-3 h-3 inline mr-1" />Người đại diện
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    value={currentContractor.Representative || ''}
                                    onChange={e => setCurrentContractor(prev => ({ ...prev, Representative: e.target.value }))}
                                    placeholder="Nguyễn Văn A"
                                />
                            </div>

                            {/* Row: Địa chỉ */}
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                                    <MapPin className="w-3 h-3 inline mr-1" />Địa chỉ
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    value={currentContractor.Address || ''}
                                    onChange={e => setCurrentContractor(prev => ({ ...prev, Address: e.target.value }))}
                                />
                            </div>

                            {/* Row: Liên hệ + Chứng chỉ */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                                        <Phone className="w-3 h-3 inline mr-1" />Điện thoại
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        value={currentContractor.ContactInfo || ''}
                                        onChange={e => setCurrentContractor(prev => ({ ...prev, ContactInfo: e.target.value }))}
                                        placeholder="024 xxxx xxxx"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Mã chứng chỉ năng lực</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        value={currentContractor.CapCertCode || ''}
                                        onChange={e => setCurrentContractor(prev => ({ ...prev, CapCertCode: e.target.value }))}
                                    />
                                </div>
                            </div>

                            {/* Checkbox */}
                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="isForeign"
                                    checked={currentContractor.IsForeign || false}
                                    onChange={e => setCurrentContractor(prev => ({ ...prev, IsForeign: e.target.checked }))}
                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-slate-600 focus:ring-blue-500"
                                />
                                <label htmlFor="isForeign" className="text-sm text-gray-700 dark:text-slate-300 font-medium">Là nhà thầu nước ngoài?</label>
                            </div>

                            {/* Actions */}
                            <div className="pt-4 flex justify-end gap-3 border-t border-gray-200 dark:border-slate-700 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 text-sm font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                                    disabled={saving}
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-4 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 dark:shadow-blue-900/30 flex items-center gap-2 disabled:opacity-50"
                                >
                                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {saving ? 'Đang lưu...' : 'Lưu thông tin'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteConfirmOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm border border-gray-200 dark:border-slate-700 p-6 animate-in zoom-in-95 duration-200">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-2">Xác nhận xóa</h3>
                            <p className="text-sm text-gray-500 dark:text-slate-400">Bạn có chắc chắn muốn xóa nhà thầu này? Thao tác này không thể hoàn tác.</p>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => { setIsDeleteConfirmOpen(false); setDeleteTarget(null); }}
                                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 text-sm font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                                disabled={saving}
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={saving}
                                className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContractorList;
