import React, { useState } from 'react';
import { Users, X, Phone, Trash2, Plus, Search } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { Employee } from '@/types';

interface ProjectMembersModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentMembers: string[];
    onUpdateMembers: (newMembers: string[]) => void;
}

export const ProjectMembersModal: React.FC<ProjectMembersModalProps> = ({ isOpen, onClose, currentMembers, onUpdateMembers }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const { data: employees = [] } = useEmployees();

    // Employees not in the project
    const availableEmployees = employees.filter(e =>
        !currentMembers.includes(e.EmployeeID) &&
        (e.FullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.Position.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Employees currently in the project
    const activeMembers = currentMembers.map(id => employees.find(e => e.EmployeeID === id)).filter(Boolean) as Employee[];

    const handleAddMember = (id: string) => {
        onUpdateMembers([...currentMembers, id]);
    };

    const handleRemoveMember = (id: string) => {
        onUpdateMembers(currentMembers.filter(mId => mId !== id));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-4xl h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 animate-in zoom-in-95">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-lg font-black text-gray-800 flex items-center gap-3">
                        <Users className="w-5 h-5 text-blue-600" /> Quản lý nhân sự dự án
                    </h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Current Members */}
                    <div className="flex-1 border-r border-gray-200 flex flex-col bg-white">
                        <div className="p-4 bg-blue-50/30 border-b border-blue-50">
                            <h4 className="text-xs font-bold text-blue-800 uppercase tracking-widest mb-1">Danh sách hiện tại ({activeMembers.length})</h4>
                            <p className="text-[10px] text-blue-600/70">Thành viên đang tham gia dự án</p>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {activeMembers.map((member) => (
                                <div key={member.EmployeeID} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-blue-100 hover:bg-blue-50/20 transition-all group">
                                    <div className="relative">
                                        <img src={member.AvatarUrl} alt="" className="w-10 h-10 rounded-full border border-gray-200" />
                                        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${member.Status === 1 ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-800 truncate">{member.FullName}</p>
                                        <p className="text-xs text-gray-500 truncate">{member.Position} • {member.Department}</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1"><Phone className="w-3 h-3" /> {member.Phone}</p>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveMember(member.EmployeeID)}
                                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        title="Xóa khỏi dự án"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {activeMembers.length === 0 && (
                                <div className="text-center py-10 text-gray-400 italic text-sm">Chưa có thành viên nào.</div>
                            )}
                        </div>
                    </div>

                    {/* Right: Add New */}
                    <div className="w-[400px] flex flex-col bg-gray-50/50">
                        <div className="p-4 border-b border-gray-200">
                            <h4 className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-3">Thêm thành viên mới</h4>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm tên, chức vụ..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {availableEmployees.map((emp) => (
                                <div key={emp.EmployeeID} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-all shadow-sm">
                                    <img src={emp.AvatarUrl} alt="" className="w-8 h-8 rounded-full bg-gray-100" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-gray-800 truncate">{emp.FullName}</p>
                                        <p className="text-[10px] text-gray-500 truncate">{emp.Position}</p>
                                    </div>
                                    <button
                                        onClick={() => handleAddMember(emp.EmployeeID)}
                                        className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
