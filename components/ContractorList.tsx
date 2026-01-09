import React, { useState } from 'react';
import { mockContractors } from '../mockData';
import { Contractor } from '../types';
import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2, Plus, X, Search, CheckCircle, AlertCircle } from 'lucide-react';

const ContractorList: React.FC = () => {
    const navigate = useNavigate();
    const [contractors, setContractors] = useState<Contractor[]>(mockContractors);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentContractor, setCurrentContractor] = useState<Partial<Contractor> | null>(null); // If null, it's Add mode

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
        e.stopPropagation(); // Prevent row click navigation
        setCurrentContractor({ ...contractor });
        setIsModalOpen(true);
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm('Bạn có chắc chắn muốn xóa nhà thầu này không?')) {
            setContractors(prev => prev.filter(c => c.ContractorID !== id));
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentContractor?.ContractorID || !currentContractor.FullName) {
            alert("Vui lòng nhập đầy đủ Mã số thuế và Tên nhà thầu");
            return;
        }

        const newContractor = currentContractor as Contractor;

        if (contractors.some(c => c.ContractorID === newContractor.ContractorID) && !mockContractors.find(c => c.ContractorID === newContractor.ContractorID && c !== currentContractor)) {
            // Basic duplicate check logic (simplified for edit/add distinction)
            // Real logic: if ADDing, check if ID exists. If EDITing, allow same ID.
            const isExisting = contractors.some(c => c.ContractorID === newContractor.ContractorID);
            // Logic simplified: just overwrite if ID matches, or add if new.
        }

        setContractors(prev => {
            const index = prev.findIndex(c => c.ContractorID === newContractor.ContractorID);
            if (index >= 0) {
                // Update
                const updated = [...prev];
                updated[index] = newContractor;
                return updated;
            } else {
                // Add
                return [...prev, newContractor];
            }
        });
        setIsModalOpen(false);
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-screen p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Danh sách Nhà thầu</h2>
                    <p className="text-sm text-gray-500 mt-1">Quản lý thông tin và năng lực các đơn vị tư vấn, thi công</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm nhà thầu..."
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleAdd}
                        className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center gap-2 whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" /> Thêm nhà thầu
                    </button>
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50/80 text-xs uppercase font-bold text-gray-500">
                        <tr>
                            <th className="px-6 py-4">Mã số DN</th>
                            <th className="px-6 py-4">Tên nhà thầu</th>
                            <th className="px-6 py-4">Chứng chỉ năng lực</th>
                            <th className="px-6 py-4 text-center">Loại hình</th>
                            <th className="px-6 py-4">Địa chỉ / Liên hệ</th>
                            <th className="px-6 py-4 text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredContractors.length > 0 ? (
                            filteredContractors.map((contractor) => (
                                <tr key={contractor.ContractorID} onClick={() => navigate(`/contractors/${contractor.ContractorID}`)} className="hover:bg-blue-50/30 transition-colors cursor-pointer group">
                                    <td className="px-6 py-4 font-mono font-bold text-gray-600">{contractor.ContractorID}</td>
                                    <td className="px-6 py-4 font-bold text-gray-800">{contractor.FullName}</td>
                                    <td className="px-6 py-4">
                                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-mono border border-gray-200">
                                            {contractor.CapCertCode}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {contractor.IsForeign ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200 uppercase">
                                                Nước ngoài
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 uppercase">
                                                Trong nước
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-xs">
                                        <div className="truncate max-w-xs font-medium text-gray-900" title={contractor.Address}>{contractor.Address}</div>
                                        <div className="text-gray-400 mt-0.5">{contractor.ContactInfo}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => handleEdit(e, contractor)}
                                                className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => handleDelete(e, contractor.ContractorID)}
                                                className="p-1.5 rounded-lg hover:bg-red-100 text-red-600 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">
                                    Không tìm thấy nhà thầu nào phù hợp.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && currentContractor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-gray-100 animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-800">
                                {contractors.some(c => c.ContractorID === currentContractor.ContractorID) ? 'Cập nhật thông tin' : 'Thêm nhà thầu mới'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Mã số thuế / DN <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" // Simple readOnly check if it's strictly ID based, but let's allow edit for flexibility
                                        value={currentContractor.ContractorID}
                                        onChange={e => setCurrentContractor(prev => ({ ...prev, ContractorID: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Mã chứng chỉ năng lực</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        value={currentContractor.CapCertCode}
                                        onChange={e => setCurrentContractor(prev => ({ ...prev, CapCertCode: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Tên nhà thầu <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    value={currentContractor.FullName}
                                    onChange={e => setCurrentContractor(prev => ({ ...prev, FullName: e.target.value }))}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Địa chỉ</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    value={currentContractor.Address}
                                    onChange={e => setCurrentContractor(prev => ({ ...prev, Address: e.target.value }))}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Thông tin liên hệ</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                                <label htmlFor="isForeign" className="text-sm text-gray-700 font-medium">Là nhà thầu nước ngoài?</label>
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-bold rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                                >
                                    Lưu thông tin
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContractorList;
