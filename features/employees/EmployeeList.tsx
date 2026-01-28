import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockAuditLogs } from '../../mockData';
import { useEmployees, useDepartments, useCreateEmployee, useUpdateEmployee, useDeleteEmployee, useEmployeeStats } from '../../hooks/useEmployees';
import { Employee, EmployeeStatus, Role, AuditLog } from '../../types';
import { Search, Filter, Phone, Mail, UserPlus, MoreVertical, Briefcase, Trash2, Edit, X, Save, Clock, History, Shield, Check, User, LayoutGrid, List, Users, Building2, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const EmployeeList: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDept, setSelectedDept] = useState('All');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    // Data Fetching
    const { data: employees = [], isLoading } = useEmployees();
    const { data: departments = [] } = useDepartments();
    const { data: stats } = useEmployeeStats();

    // Mutations
    const createMutation = useCreateEmployee();
    const updateMutation = useUpdateEmployee();
    const deleteMutation = useDeleteEmployee();

    // Local state for UI
    const [logs, setLogs] = useState<AuditLog[]>(mockAuditLogs);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [currentEmployee, setCurrentEmployee] = useState<Partial<Employee>>({});
    const [editMode, setEditMode] = useState<'create' | 'edit'>('create');
    const [selectedAuditLogs, setSelectedAuditLogs] = useState<AuditLog[]>([]);

    const filteredEmployees = employees.filter(emp => {
        const matchesSearch = emp.FullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.Email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDept = selectedDept === 'All' || emp.Department === selectedDept;
        return matchesSearch && matchesDept;
    });

    // Permission Checks
    const canManageUsers = currentUser?.Role === Role.Admin;
    const canEdit = (targetId: string) => canManageUsers || currentUser?.EmployeeID === targetId;

    // --- ACTIONS ---

    const handleCreate = () => {
        setEditMode('create');
        setCurrentEmployee({
            Department: departments[0] || 'Phòng Hành chính - Tổng hợp',
            Position: 'Chuyên viên',
            Status: EmployeeStatus.Active,
            Role: Role.Staff,
            JoinDate: new Date().toISOString().split('T')[0],
            Password: '123'
        });
        setIsModalOpen(true);
    };

    const handleEdit = (emp: Employee) => {
        setEditMode('edit');
        setCurrentEmployee({ ...emp });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) {
            await deleteMutation.mutateAsync(id);
            // Log deletion locally if needed, or rely on backend
        }
    };

    const handleShowHistory = (empId: string) => {
        const history = logs.filter(l => l.TargetID === empId || (l.TargetID === empId && l.TargetEntity === 'Employee'));
        setSelectedAuditLogs(history);
        setIsHistoryModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editMode === 'create') {
            await createMutation.mutateAsync(currentEmployee);
        } else {
            if (!currentEmployee.EmployeeID) return;
            await updateMutation.mutateAsync({
                id: currentEmployee.EmployeeID,
                data: currentEmployee
            });
        }
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-300 pb-20">

            {/* 1. STATS OVERVIEW */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Tổng nhân sự</p>
                        <h3 className="text-2xl font-black text-gray-800">{stats?.total || 0}</h3>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                        <UserCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Đang hoạt động</p>
                        <h3 className="text-2xl font-black text-gray-800">{stats?.active || 0}</h3>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                        <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Phòng ban</p>
                        <h3 className="text-2xl font-black text-gray-800">{departments.length}</h3>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                        <Shield className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Quản trị viên</p>
                        <h3 className="text-2xl font-black text-gray-800">{employees.filter(e => e.Role === Role.Admin).length}</h3>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* LEFT SIDEBAR: DEPARTMENTS */}
                <div className="w-full lg:w-64 space-y-4 shrink-0">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest marginBottom-4 px-2">Phòng ban</h3>
                        <div className="space-y-1 mt-3">
                            <button
                                onClick={() => setSelectedDept('All')}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex justify-between items-center ${selectedDept === 'All' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <span>Tất cả</span>
                                <span className="bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded text-[10px]">{stats?.total || 0}</span>
                            </button>
                            {departments.map(dept => (
                                <button
                                    key={dept}
                                    onClick={() => setSelectedDept(dept)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex justify-between items-center ${selectedDept === dept ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    <span className="truncate pr-2">{dept}</span>
                                    <span className="bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded text-[10px] shrink-0">
                                        {stats?.byDepartment?.[dept] || 0}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT CONTENT: EMPLOYEE LIST */}
                <div className="flex-1 space-y-6">
                    {/* Toolbar */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm nhân sự..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                            />
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                            </div>

                            {canManageUsers && (
                                <button
                                    onClick={handleCreate}
                                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 whitespace-nowrap"
                                >
                                    <UserPlus className="w-4 h-4" />
                                    <span>Thêm nhân sự</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* CONTENT AREA */}
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <>
                            {viewMode === 'list' ? (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm text-gray-600">
                                            <thead className="bg-gray-50/50 text-xs uppercase font-extrabold text-gray-400 tracking-wider">
                                                <tr>
                                                    <th className="px-6 py-4">Nhân viên</th>
                                                    <th className="px-6 py-4">Chức vụ / Phòng ban</th>
                                                    <th className="px-6 py-4">Liên hệ</th>
                                                    <th className="px-6 py-4">Vai trò</th>
                                                    <th className="px-6 py-4 text-center">TT</th>
                                                    <th className="px-6 py-4 text-right"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {filteredEmployees.map((emp) => (
                                                    <tr key={emp.EmployeeID} onClick={() => navigate(`/employees/${emp.EmployeeID}`)} className="hover:bg-gray-50 transition-colors group cursor-pointer">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <img src={emp.AvatarUrl} alt={emp.FullName} className="w-10 h-10 rounded-full border border-gray-200 object-cover" />
                                                                <div>
                                                                    <p className="font-bold text-gray-900">{emp.FullName}</p>
                                                                    <p className="text-xs text-gray-400 font-mono">{emp.EmployeeID}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-gray-800">{emp.Position}</span>
                                                                <span className="text-xs text-gray-500">{emp.Department}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col gap-1">
                                                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                                    <Mail className="w-3 h-3 text-gray-400" /> {emp.Email}
                                                                </div>
                                                                {emp.Phone && (
                                                                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                                        <Phone className="w-3 h-3 text-gray-400" /> {emp.Phone}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide ${emp.Role === Role.Admin ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                                    emp.Role === Role.Manager ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                                        'bg-gray-50 text-gray-600 border-gray-200'
                                                                }`}>
                                                                {emp.Role}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <div className={`w-2.5 h-2.5 rounded-full mx-auto ${emp.Status === EmployeeStatus.Active ? 'bg-emerald-500 ring-2 ring-emerald-200' : 'bg-gray-300'}`} title={emp.Status === EmployeeStatus.Active ? 'Đang hoạt động' : 'Đã nghỉ'}></div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                {canEdit(emp.EmployeeID) && (
                                                                    <button onClick={(e) => { e.stopPropagation(); handleEdit(emp); }} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit className="w-4 h-4" /></button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredEmployees.map((emp) => (
                                        <div key={emp.EmployeeID} onClick={() => navigate(`/employees/${emp.EmployeeID}`)} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group flex flex-col items-center">
                                            <div className="relative mb-4">
                                                <img src={emp.AvatarUrl} alt={emp.FullName} className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-sm" />
                                                <div className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-white ${emp.Status === EmployeeStatus.Active ? 'bg-emerald-500' : 'bg-gray-400'}`}></div>
                                            </div>
                                            <h3 className="text-lg font-black text-gray-800 text-center">{emp.FullName}</h3>
                                            <p className="text-sm font-medium text-blue-600 mb-1">{emp.Position}</p>
                                            <p className="text-xs text-gray-500 mb-4 text-center h-8 line-clamp-2">{emp.Department}</p>

                                            <div className="flex gap-2 w-full mt-auto">
                                                <button className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2">
                                                    <Mail className="w-3 h-3" /> Email
                                                </button>
                                                <button className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2">
                                                    <Phone className="w-3 h-3" /> Gọi
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {filteredEmployees.length === 0 && (
                                <div className="p-12 text-center">
                                    <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Search className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800">Không tìm thấy kết quả</h3>
                                    <p className="text-gray-500 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Modal Components (Create/Edit - keeping functionality) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-xl font-bold text-gray-800">
                                {editMode === 'create' ? 'Thêm nhân sự mới' : 'Cập nhật thông tin'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-gray-200 rounded-full text-gray-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        {/* Form Body - Reusing existing form logic but styled */}
                        <form onSubmit={handleSave} className="p-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Họ và tên</label>
                                    <input required type="text" value={currentEmployee.FullName || ''} onChange={e => setCurrentEmployee({ ...currentEmployee, FullName: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Phòng ban</label>
                                    <select disabled={!canManageUsers && editMode === 'edit'} value={currentEmployee.Department} onChange={e => setCurrentEmployee({ ...currentEmployee, Department: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Chức danh</label>
                                    <input disabled={!canManageUsers && editMode === 'edit'} type="text" value={currentEmployee.Position || ''} onChange={e => setCurrentEmployee({ ...currentEmployee, Position: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                                {/* ... Other fields (Email, Phone, etc) ... */}
                            </div>
                            <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-gray-50">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-bold text-sm transition-colors">Hủy bỏ</button>
                                <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-bold text-sm shadow-lg shadow-blue-200 flex items-center gap-2 transition-colors">
                                    <Save className="w-4 h-4" /> Lưu thông tin
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeList;