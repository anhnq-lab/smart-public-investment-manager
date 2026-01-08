import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockEmployees, mockAuditLogs } from '../mockData';
import { Employee, EmployeeStatus, Role, AuditLog } from '../types';
import { Search, Filter, Phone, Mail, UserPlus, MoreVertical, Briefcase, Trash2, Edit, X, Save, Clock, History, Shield, Check, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const EmployeeList: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
    const [logs, setLogs] = useState<AuditLog[]>(mockAuditLogs);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDept, setSelectedDept] = useState('All');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [currentEmployee, setCurrentEmployee] = useState<Partial<Employee>>({});
    const [editMode, setEditMode] = useState<'create' | 'edit'>('create');
    const [selectedAuditLogs, setSelectedAuditLogs] = useState<AuditLog[]>([]);

    const departments = Array.from(new Set(mockEmployees.map(e => e.Department)));

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
            Department: departments[0],
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

    const handleDelete = (id: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) {
            setEmployees(employees.filter(e => e.EmployeeID !== id));

            // Log deletion
            const newLog: AuditLog = {
                LogID: `LOG-${Date.now()}`,
                Action: 'Delete',
                TargetEntity: 'Employee',
                TargetID: id,
                ChangedBy: currentUser?.Username || 'unknown',
                Timestamp: new Date().toLocaleString(),
                Details: `Đã xóa nhân viên ID: ${id}`
            };
            setLogs([newLog, ...logs]);
        }
    };

    const handleShowHistory = (empId: string) => {
        const history = logs.filter(l => l.TargetID === empId || (l.TargetID === empId && l.TargetEntity === 'Employee'));
        setSelectedAuditLogs(history);
        setIsHistoryModalOpen(true);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();

        if (editMode === 'create') {
            // Logic tạo mới
            const newId = `NV${1000 + employees.length + 1}`;
            // Generate username from email or name logic
            let username = currentEmployee.Email ? currentEmployee.Email.split('@')[0] : `user${newId}`;

            const newEmp: Employee = {
                ...currentEmployee as Employee,
                EmployeeID: newId,
                AvatarUrl: `https://i.pravatar.cc/150?u=${newId}`,
                Username: username,
                Password: currentEmployee.Password || '123'
            };

            setEmployees([newEmp, ...employees]);

            // Log Create
            const newLog: AuditLog = {
                LogID: `LOG-${Date.now()}`,
                Action: 'Create',
                TargetEntity: 'Employee',
                TargetID: newId,
                ChangedBy: currentUser?.Username || 'unknown',
                Timestamp: new Date().toLocaleString(),
                Details: `Tạo tài khoản mới: ${newEmp.FullName}`
            };
            setLogs([newLog, ...logs]);

        } else {
            // Logic cập nhật
            const oldData = employees.find(e => e.EmployeeID === currentEmployee.EmployeeID);
            setEmployees(employees.map(e => e.EmployeeID === currentEmployee.EmployeeID ? currentEmployee as Employee : e));

            // Detect changes for log
            const changes = [];
            if (oldData) {
                if (oldData.FullName !== currentEmployee.FullName) changes.push(`Tên: ${currentEmployee.FullName}`);
                if (oldData.Department !== currentEmployee.Department) changes.push(`Phòng: ${currentEmployee.Department}`);
                if (oldData.Role !== currentEmployee.Role) changes.push(`Quyền: ${currentEmployee.Role}`);
                if (oldData.Password !== currentEmployee.Password) changes.push(`Đổi mật khẩu`);
            }

            if (changes.length > 0) {
                const newLog: AuditLog = {
                    LogID: `LOG-${Date.now()}`,
                    Action: 'Update',
                    TargetEntity: 'Employee',
                    TargetID: currentEmployee.EmployeeID || '',
                    ChangedBy: currentUser?.Username || 'unknown',
                    Timestamp: new Date().toLocaleString(),
                    Details: `Cập nhật: ${changes.join(', ')}`
                };
                setLogs([newLog, ...logs]);
            }
        }
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Tìm nhân viên..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative">
                        <select
                            className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            value={selectedDept}
                            onChange={(e) => setSelectedDept(e.target.value)}
                        >
                            <option value="All">Tất cả phòng ban</option>
                            {departments.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                        <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                    </div>

                    {canManageUsers && (
                        <button
                            onClick={handleCreate}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                        >
                            <UserPlus className="w-4 h-4" />
                            <span>Thêm nhân sự</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Employee Grid */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
                            <tr>
                                <th className="px-6 py-4">Nhân viên</th>
                                <th className="px-6 py-4">Chức vụ / Phòng ban</th>
                                <th className="px-6 py-4">Vai trò</th>
                                <th className="px-6 py-4 text-center">Trạng thái</th>
                                <th className="px-6 py-4 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredEmployees.map((emp) => (
                                <tr key={emp.EmployeeID} onClick={() => navigate(`/employees/${emp.EmployeeID}`)} className="hover:bg-gray-50 transition-colors group cursor-pointer">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <img src={emp.AvatarUrl} alt={emp.FullName} className="w-10 h-10 rounded-full border border-gray-200 object-cover" />
                                            <div>
                                                <p className="font-bold text-gray-900">{emp.FullName}</p>
                                                <p className="text-xs text-gray-400">{emp.Username}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-800">{emp.Position}</span>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <Briefcase className="w-3 h-3 text-gray-400" />
                                                <span className="text-xs text-gray-500">{emp.Department}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${emp.Role === Role.Admin ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                            emp.Role === Role.Manager ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                'bg-gray-50 text-gray-700 border-gray-200'
                                            }`}>
                                            <Shield className="w-3 h-3" />
                                            {emp.Role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${emp.Status === EmployeeStatus.Active
                                            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
                                            : 'bg-gray-100 text-gray-600 ring-1 ring-gray-500/10'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${emp.Status === EmployeeStatus.Active ? 'bg-emerald-500' : 'bg-gray-400'
                                                }`}></span>
                                            {emp.Status === EmployeeStatus.Active ? 'Đang làm việc' : 'Đã nghỉ việc'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleShowHistory(emp.EmployeeID); }}
                                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                                title="Lịch sử hoạt động"
                                            >
                                                <History className="w-4 h-4" />
                                            </button>

                                            {canEdit(emp.EmployeeID) && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleEdit(emp); }}
                                                    className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                                    title="Chỉnh sửa"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            )}

                                            {canManageUsers && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(emp.EmployeeID); }}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                    title="Xóa"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredEmployees.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        Không tìm thấy nhân viên nào phù hợp.
                    </div>
                )}
            </div>

            {/* Edit/Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-xl font-bold text-gray-800">
                                {editMode === 'create' ? 'Thêm nhân sự mới' : 'Cập nhật thông tin'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-gray-200 rounded-full text-gray-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Họ và tên</label>
                                    <input
                                        required
                                        type="text"
                                        value={currentEmployee.FullName || ''}
                                        onChange={e => setCurrentEmployee({ ...currentEmployee, FullName: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phòng ban</label>
                                    <select
                                        disabled={!canManageUsers && editMode === 'edit'}
                                        value={currentEmployee.Department}
                                        onChange={e => setCurrentEmployee({ ...currentEmployee, Department: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    >
                                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Chức danh</label>
                                    <input
                                        disabled={!canManageUsers && editMode === 'edit'}
                                        type="text"
                                        value={currentEmployee.Position || ''}
                                        onChange={e => setCurrentEmployee({ ...currentEmployee, Position: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={currentEmployee.Email || ''}
                                        onChange={e => setCurrentEmployee({ ...currentEmployee, Email: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Số điện thoại</label>
                                    <input
                                        type="text"
                                        value={currentEmployee.Phone || ''}
                                        onChange={e => setCurrentEmployee({ ...currentEmployee, Phone: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Auth Section */}
                                <div className="col-span-2 mt-4 pt-4 border-t border-gray-100">
                                    <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-blue-600" /> Thiết lập tài khoản
                                    </h4>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Mật khẩu</label>
                                            <input
                                                type="password"
                                                value={currentEmployee.Password || ''}
                                                onChange={e => setCurrentEmployee({ ...currentEmployee, Password: e.target.value })}
                                                placeholder="••••••••"
                                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Mặc định là 123</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Vai trò hệ thống</label>
                                            <select
                                                disabled={!canManageUsers}
                                                value={currentEmployee.Role}
                                                onChange={e => setCurrentEmployee({ ...currentEmployee, Role: e.target.value as Role })}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value={Role.Staff}>Nhân viên</option>
                                                <option value={Role.Manager}>Quản lý</option>
                                                <option value={Role.Admin}>Quản trị viên (Admin)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium">Hủy bỏ</button>
                                <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-medium shadow-lg shadow-blue-200 flex items-center gap-2">
                                    <Save className="w-4 h-4" /> Lưu thay đổi
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* History Log Modal */}
            {isHistoryModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                                    <History className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">Nhật ký hoạt động</h3>
                                    <p className="text-sm text-gray-500">Lịch sử chỉnh sửa hồ sơ nhân viên</p>
                                </div>
                            </div>
                            <button onClick={() => setIsHistoryModalOpen(false)} className="p-1 hover:bg-gray-200 rounded-full text-gray-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            {selectedAuditLogs.length > 0 ? (
                                <div className="space-y-6 relative border-l-2 border-gray-100 ml-3">
                                    {selectedAuditLogs.map((log) => (
                                        <div key={log.LogID} className="relative pl-6">
                                            <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 border-white bg-blue-500 shadow-sm"></div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm font-bold text-gray-800">{log.Action === 'Create' ? 'Tạo mới' : log.Action === 'Update' ? 'Cập nhật' : 'Xóa'}</span>
                                                    <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded">{log.Timestamp}</span>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-1">{log.Details}</p>
                                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                                    <User className="w-3 h-3" /> Thực hiện bởi: <span className="font-medium text-gray-600">{log.ChangedBy}</span>
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400">
                                    <Clock className="w-12 h-12 mx-auto mb-2 text-gray-200" />
                                    Chưa có dữ liệu lịch sử nào.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeList;