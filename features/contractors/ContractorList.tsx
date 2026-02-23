import React, { useState } from 'react';
import { useContractors } from '../../hooks/useContractors';
import { Contractor } from '../../types';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ui/Toast';
import { Pencil, Trash2, Plus, X, Search, Users, Building2, Globe, MapPin } from 'lucide-react';

const ContractorList: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { contractors: supabaseContractors } = useContractors();
    const [contractors, setContractors] = useState<Contractor[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Sync Supabase data to local state
    React.useEffect(() => {
        if (supabaseContractors.length > 0) {
            setContractors(supabaseContractors);
        }
    }, [supabaseContractors]);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [currentContractor, setCurrentContractor] = useState<Partial<Contractor> | null>(null);

    // Stats
    const totalContractors = contractors.length;
    const foreignContractors = contractors.filter(c => c.IsForeign).length;
    const domesticContractors = totalContractors - foreignContractors;

    // Filter
    const filteredContractors = contractors.filter(c =>
        c.FullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.ContractorID.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAdd = () => {
        setCurrentContractor({
            ContractorID: '',
            FullName: '',
            CapCertCode: '',
            IsForeign: false,
            Address: '',
            ContactInfo: ''
        });
        setIsModalOpen(true);
    };

    const handleEdit = (e: React.MouseEvent, contractor: Contractor) => {
        e.stopPropagation();
        setCurrentContractor({ ...contractor });
        setIsModalOpen(true);
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setDeleteTarget(id);
        setIsDeleteConfirmOpen(true);
    };

    const confirmDelete = () => {
        if (deleteTarget) {
            setContractors(prev => prev.filter(c => c.ContractorID !== deleteTarget));
            showToast('Đã xóa nhà thầu thành công', 'success');
        }
        setIsDeleteConfirmOpen(false);
        setDeleteTarget(null);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentContractor?.ContractorID || !currentContractor.FullName) {
            showToast('Vui lòng nhập đầy đủ Mã số thuế và Tên nhà thầu', 'error');
            return;
        }

        const newContractor = currentContractor as Contractor;

        setContractors(prev => {
            const index = prev.findIndex(c => c.ContractorID === newContractor.ContractorID);
            if (index >= 0) {
                const updated = [...prev];
                updated[index] = newContractor;
                return updated;
            } else {
                return [...prev, newContractor];
            }
        });
        setIsModalOpen(false);
        showToast(
            contractors.some(c => c.ContractorID === newContractor.ContractorID)
                ? 'Đã cập nhật thông tin nhà thầu'
                : 'Đã thêm nhà thầu mới thành công',
            'success'
        );
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

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {stats.map(stat => (
                    <div key={stat.label} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-4 flex items-center gap-4 shadow-sm">
                        <div className={`p-3 rounded-xl ${stat.bg}`}>
                            <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800 dark:text-slate-100">{stat.value}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search Bar */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-slate-700">
                    <div className="relative max-w-sm">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên hoặc mã số thuế..."
                            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-slate-700">
                                <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">Mã số DN</th>
                                <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">Tên nhà thầu</th>
                                <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">Chứng chỉ năng lực</th>
                                <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 text-center">Loại hình</th>
                                <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">Địa chỉ / Liên hệ</th>
                                <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {filteredContractors.length > 0 ? (
                                filteredContractors.map((contractor) => (
                                    <tr key={contractor.ContractorID} onClick={() => navigate(`/contractors/${contractor.ContractorID}`)} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors cursor-pointer group">
                                        <td className="px-6 py-4 font-mono font-bold text-gray-600 dark:text-slate-300">{contractor.ContractorID}</td>
                                        <td className="px-6 py-4 font-bold text-gray-800 dark:text-slate-100">{contractor.FullName}</td>
                                        <td className="px-6 py-4">
                                            <span className="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 px-2 py-1 rounded-lg text-xs font-mono border border-gray-200 dark:border-slate-600">
                                                {contractor.CapCertCode}
                                            </span>
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
                                                {contractor.Address}
                                            </div>
                                            <div className="text-gray-400 dark:text-slate-500 mt-0.5 pl-[18px]">{contractor.ContactInfo}</div>
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
                <div className="px-6 py-3 border-t border-gray-100 dark:border-slate-700 text-xs text-gray-500 dark:text-slate-400">
                    Hiển thị {filteredContractors.length} / {totalContractors} nhà thầu
                </div>
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && currentContractor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg border border-gray-100 dark:border-slate-700 animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">
                                {contractors.some(c => c.ContractorID === currentContractor.ContractorID) ? 'Cập nhật thông tin' : 'Thêm nhà thầu mới'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Mã số thuế / DN <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        value={currentContractor.ContractorID}
                                        onChange={e => setCurrentContractor(prev => ({ ...prev, ContractorID: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Mã chứng chỉ năng lực</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        value={currentContractor.CapCertCode}
                                        onChange={e => setCurrentContractor(prev => ({ ...prev, CapCertCode: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Tên nhà thầu <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    value={currentContractor.FullName}
                                    onChange={e => setCurrentContractor(prev => ({ ...prev, FullName: e.target.value }))}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Địa chỉ</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    value={currentContractor.Address}
                                    onChange={e => setCurrentContractor(prev => ({ ...prev, Address: e.target.value }))}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Thông tin liên hệ</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    value={currentContractor.ContactInfo}
                                    onChange={e => setCurrentContractor(prev => ({ ...prev, ContactInfo: e.target.value }))}
                                    placeholder="Email, SĐT, Website..."
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="isForeign"
                                    checked={currentContractor.IsForeign}
                                    onChange={e => setCurrentContractor(prev => ({ ...prev, IsForeign: e.target.checked }))}
                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-slate-600 focus:ring-blue-500"
                                />
                                <label htmlFor="isForeign" className="text-sm text-gray-700 dark:text-slate-300 font-medium">Là nhà thầu nước ngoài?</label>
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-slate-700 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 text-sm font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 dark:shadow-blue-900/30"
                                >
                                    Lưu thông tin
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteConfirmOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm border border-gray-100 dark:border-slate-700 p-6 animate-in zoom-in-95 duration-200">
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
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors"
                            >
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
