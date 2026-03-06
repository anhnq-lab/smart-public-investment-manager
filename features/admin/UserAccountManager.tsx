import React, { useState, useEffect, useCallback } from 'react';
import {
    ShieldCheck, Plus, RotateCcw, ToggleLeft, ToggleRight,
    Copy, Check, Search, AlertCircle, Eye, EyeOff,
    Users, UserPlus, Key, Mail, Phone, User as UserIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserAccountService, UserAccount } from '../../services/UserAccountService';

// ============================================================
// ADMIN USER ACCOUNT MANAGER
// ============================================================

const UserAccountManager: React.FC = () => {
    const { currentUser } = useAuth();
    const [accounts, setAccounts] = useState<UserAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

    // Create modal
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Reset password modal
    const [resetTarget, setResetTarget] = useState<UserAccount | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [copiedPassword, setCopiedPassword] = useState(false);

    // Check admin
    const isAdmin = currentUser?.Role === 'Admin';

    const loadAccounts = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await UserAccountService.getAll();
            setAccounts(data);
        } catch (err: any) {
            setError(err.message || 'Không thể tải danh sách tài khoản');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAccounts();
    }, [loadAccounts]);

    // Filter
    const filtered = accounts.filter(a => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
            a.username.toLowerCase().includes(s) ||
            a.full_name?.toLowerCase().includes(s) ||
            a.email?.toLowerCase().includes(s) ||
            a.phone?.toLowerCase().includes(s) ||
            a.department?.toLowerCase().includes(s)
        );
    });

    // Toggle active
    const handleToggleActive = async (account: UserAccount) => {
        try {
            await UserAccountService.toggleActive(account.id, !account.is_active);
            await loadAccounts();
        } catch (err: any) {
            setError(err.message);
        }
    };

    // Reset password
    const handleResetPassword = async () => {
        if (!resetTarget || !newPassword) return;
        try {
            await UserAccountService.resetPassword(resetTarget.id, newPassword);
            setResetTarget(null);
            setNewPassword('');
            await loadAccounts();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const openResetModal = (account: UserAccount) => {
        const pwd = UserAccountService.generatePassword();
        setNewPassword(pwd);
        setShowNewPassword(true);
        setCopiedPassword(false);
        setResetTarget(account);
    };

    const copyPassword = () => {
        navigator.clipboard.writeText(newPassword);
        setCopiedPassword(true);
        setTimeout(() => setCopiedPassword(false), 2000);
    };

    // Format date
    const formatDate = (d: string | null) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-slate-400">
                <ShieldCheck className="w-16 h-16 mb-4 text-gray-300 dark:text-slate-600" />
                <h2 className="text-xl font-semibold mb-2">Không có quyền truy cập</h2>
                <p>Chỉ Admin mới có thể quản lý tài khoản người dùng.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20">
                            <ShieldCheck className="w-6 h-6 text-white" />
                        </div>
                        Quản lý tài khoản
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                        Tạo và quản lý tài khoản đăng nhập cho nhân viên
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                    <UserPlus className="w-5 h-5" />
                    Tạo tài khoản
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{accounts.length}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-400">Tổng tài khoản</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
                            <ToggleRight className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{accounts.filter(a => a.is_active).length}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-400">Đang hoạt động</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
                            <ToggleLeft className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{accounts.filter(a => !a.is_active).length}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-400">Đã tắt</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-800 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                    <button onClick={() => setError('')} className="ml-auto text-xs underline">Đóng</button>
                </div>
            )}

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Tìm theo tên, username, email, SĐT..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900 dark:text-slate-100"
                />
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-400">
                        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-3" />
                        Đang tải...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 dark:text-slate-500">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        {search ? 'Không tìm thấy kết quả' : 'Chưa có tài khoản nào'}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-700">
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-slate-300">#</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-slate-300">Nhân viên</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-slate-300">Username</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-slate-300">
                                        <div className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> Email</div>
                                    </th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-slate-300">
                                        <div className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> SĐT</div>
                                    </th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-slate-300">Vai trò</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-slate-300">Trạng thái</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-slate-300">Đăng nhập lần cuối</th>
                                    <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-slate-300">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                                {filtered.map((account, idx) => (
                                    <tr key={account.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={account.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(account.full_name || 'U')}&background=random&color=fff&size=32`}
                                                    alt=""
                                                    className="w-8 h-8 rounded-full"
                                                />
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-slate-100">{account.full_name || '—'}</p>
                                                    <p className="text-xs text-gray-500 dark:text-slate-400">{account.department || ''}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded-md font-mono text-xs text-gray-700 dark:text-slate-300">
                                                {account.username}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-slate-400 text-xs">{account.email || '—'}</td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-slate-400 text-xs">{account.phone || '—'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${account.role === 'Admin' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' :
                                                    account.role === 'Manager' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                                                        'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400'
                                                }`}>
                                                {account.role || 'Staff'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => handleToggleActive(account)}
                                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${account.is_active
                                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200'
                                                        : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200'
                                                    }`}
                                                title={account.is_active ? 'Nhấn để tắt' : 'Nhấn để bật'}
                                            >
                                                {account.is_active ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                                                {account.is_active ? 'Hoạt động' : 'Đã tắt'}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-400">
                                            {formatDate(account.last_login)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => openResetModal(account)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                                            >
                                                <Key className="w-3.5 h-3.5" />
                                                Reset MK
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Ghi chú */}
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-xl p-4 text-sm text-blue-700 dark:text-blue-400">
                <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                        <p className="font-medium mb-1">Hướng dẫn đăng nhập</p>
                        <p>Người dùng có thể đăng nhập bằng <strong>Username</strong>, <strong>Email</strong>, hoặc <strong>Số điện thoại</strong> kèm mật khẩu.</p>
                    </div>
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <CreateAccountModal
                    onClose={() => setShowCreateModal(false)}
                    onCreated={() => {
                        setShowCreateModal(false);
                        loadAccounts();
                    }}
                    createdBy={currentUser?.EmployeeID}
                />
            )}

            {/* Reset Password Modal */}
            {resetTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setResetTarget(null)}>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-1">Reset mật khẩu</h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
                            Đặt mật khẩu mới cho <strong>{resetTarget.full_name}</strong> ({resetTarget.username})
                        </p>

                        <div className="space-y-4">
                            <div className="relative">
                                <input
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-3 pr-24 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-gray-900 dark:text-slate-100"
                                    placeholder="Mật khẩu mới"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="p-1.5 text-gray-400 hover:text-gray-600"
                                    >
                                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={copyPassword}
                                        className="p-1.5 text-gray-400 hover:text-indigo-600"
                                        title="Copy mật khẩu"
                                    >
                                        {copiedPassword ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    setNewPassword(UserAccountService.generatePassword());
                                    setCopiedPassword(false);
                                }}
                                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                                ↻ Sinh mật khẩu ngẫu nhiên
                            </button>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setResetTarget(null)}
                                className="flex-1 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleResetPassword}
                                disabled={!newPassword}
                                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-lg shadow-indigo-500/25"
                            >
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ============================================================
// CREATE ACCOUNT MODAL
// ============================================================

interface CreateModalProps {
    onClose: () => void;
    onCreated: () => void;
    createdBy?: string;
}

const CreateAccountModal: React.FC<CreateModalProps> = ({ onClose, onCreated, createdBy }) => {
    const [employees, setEmployees] = useState<{ employee_id: string; full_name: string; email: string; phone: string; department: string }[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState(UserAccountService.generatePassword());
    const [showPassword, setShowPassword] = useState(true);
    const [copied, setCopied] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        UserAccountService.getEmployeesWithoutAccount().then(data => {
            setEmployees(data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    // Auto-generate username from employee name
    useEffect(() => {
        if (!selectedEmployee) return;
        const emp = employees.find(e => e.employee_id === selectedEmployee);
        if (emp) {
            // Generate username from name: remove Vietnamese chars, join with dot
            const parts = emp.full_name.split(' ').filter(Boolean);
            if (parts.length >= 2) {
                const lastName = parts[parts.length - 1];
                const initials = parts.slice(0, -1).map(p => p.charAt(0)).join('');
                setUsername(`${removeVietnamese(lastName)}.${removeVietnamese(initials)}`.toUpperCase());
            } else {
                setUsername(removeVietnamese(emp.full_name).toUpperCase());
            }
        }
    }, [selectedEmployee, employees]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEmployee || !username || !password) return;

        setSubmitting(true);
        setError('');
        try {
            await UserAccountService.create({
                employee_id: selectedEmployee,
                username,
                password,
            }, createdBy);
            onCreated();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const copyPwd = () => {
        navigator.clipboard.writeText(password);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const selectedEmp = employees.find(e => e.employee_id === selectedEmployee);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                        <UserPlus className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Tạo tài khoản mới</h3>
                        <p className="text-xs text-gray-500 dark:text-slate-400">Gán tài khoản đăng nhập cho nhân viên</p>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Employee select */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                            Chọn nhân viên <span className="text-red-500">*</span>
                        </label>
                        {loading ? (
                            <div className="py-3 text-sm text-gray-400">Đang tải...</div>
                        ) : employees.length === 0 ? (
                            <div className="py-3 text-sm text-gray-400">Tất cả nhân viên đều đã có tài khoản</div>
                        ) : (
                            <select
                                value={selectedEmployee}
                                onChange={e => setSelectedEmployee(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-slate-100"
                                required
                            >
                                <option value="">-- Chọn nhân viên --</option>
                                {employees.map(emp => (
                                    <option key={emp.employee_id} value={emp.employee_id}>
                                        {emp.full_name} — {emp.department || 'Chưa phân phòng'}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Selected employee info */}
                    {selectedEmp && (
                        <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 rounded-xl p-3 text-sm">
                            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                                <UserIcon className="w-4 h-4" />
                                <strong>{selectedEmp.full_name}</strong>
                            </div>
                            <div className="mt-1 space-y-0.5 text-indigo-600/70 dark:text-indigo-400/70 text-xs">
                                {selectedEmp.email && <p className="flex items-center gap-1"><Mail className="w-3 h-3" /> {selectedEmp.email}</p>}
                                {selectedEmp.phone && <p className="flex items-center gap-1"><Phone className="w-3 h-3" /> {selectedEmp.phone}</p>}
                            </div>
                        </div>
                    )}

                    {/* Username */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                            Username <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-gray-900 dark:text-slate-100"
                                placeholder="VD: NGUYEN.VA"
                                required
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                            Mật khẩu <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full pl-11 pr-28 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-gray-900 dark:text-slate-100"
                                required
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="p-1.5 text-gray-400 hover:text-gray-600">
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                                <button type="button" onClick={copyPwd} className="p-1.5 text-gray-400 hover:text-indigo-600" title="Copy">
                                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setPassword(UserAccountService.generatePassword()); setCopied(false); }}
                                    className="p-1.5 text-gray-400 hover:text-indigo-600"
                                    title="Sinh mới"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Gửi mật khẩu này cho nhân viên. Người dùng có thể đổi sau.</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || !selectedEmployee || !username || !password}
                            className="flex-1 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/25"
                        >
                            {submitting ? 'Đang tạo...' : 'Tạo tài khoản'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ============================================================
// HELPER
// ============================================================

function removeVietnamese(str: string): string {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .replace(/[^a-zA-Z0-9.]/g, '');
}

export default UserAccountManager;
