import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmployees, useDepartments, useCreateEmployee, useUpdateEmployee, useDeleteEmployee, useEmployeeStats } from '../../hooks/useEmployees';
import { useTasks } from '../../hooks/useTasks';
import { useProjects } from '../../hooks/useProjects';
import { Employee, EmployeeStatus, Role, TaskStatus } from '../../types';
import {
    Search, Phone, Mail, UserPlus, Briefcase, Trash2, Edit, X, Save,
    Shield, User, LayoutGrid, List, Users, Building2, UserCheck,
    ArrowUpRight, ChevronDown, ListTodo, Eye, Calendar, Hash, Lock,
    Sparkles, ClipboardList, FolderOpen, TrendingUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';

// ═══════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════

const getRoleInfo = (role: Role) => {
    switch (role) {
        case Role.Admin: return { label: 'ADMIN', color: 'bg-purple-500/10 text-purple-600 ring-1 ring-purple-500/20', dot: 'bg-purple-500' };
        case Role.Manager: return { label: 'QUẢN LÝ', color: 'bg-blue-500/10 text-blue-600 ring-1 ring-blue-500/20', dot: 'bg-blue-500' };
        default: return { label: 'STAFF', color: 'bg-slate-500/10 text-slate-500 ring-1 ring-slate-500/20', dot: 'bg-slate-400' };
    }
};

// ═══════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════

const EmployeeList: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDept, setSelectedDept] = useState('All');
    const [filterRole, setFilterRole] = useState('All');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    // Data Fetching
    const { data: employees = [], isLoading } = useEmployees();
    const { data: departments = [] } = useDepartments();
    const { data: stats } = useEmployeeStats();
    const { data: tasks = [] } = useTasks();
    const { projects = [] } = useProjects();

    // Mutations
    const createMutation = useCreateEmployee();
    const updateMutation = useUpdateEmployee();
    const deleteMutation = useDeleteEmployee();

    // Local state for UI
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentEmployee, setCurrentEmployee] = useState<Partial<Employee>>({});
    const [editMode, setEditMode] = useState<'create' | 'edit'>('create');

    // ── Cross-Module Data ──
    const employeeWorkload = useMemo(() => {
        const workloadMap: Record<string, { taskCount: number; activeTaskCount: number; projectCount: number }> = {};
        employees.forEach(emp => {
            const empTasks = tasks.filter(t => t.AssigneeID === emp.EmployeeID);
            const empActiveTasks = empTasks.filter(t => t.Status !== TaskStatus.Done);
            // Projects: either Member[] or via Task assignments
            const taskProjectIds = new Set(empTasks.map(t => t.ProjectID));
            const memberProjectIds = new Set(
                projects.filter(p => p.Members?.includes(emp.EmployeeID)).map(p => p.ProjectID)
            );
            const allProjectIds = new Set([...taskProjectIds, ...memberProjectIds]);

            workloadMap[emp.EmployeeID] = {
                taskCount: empTasks.length,
                activeTaskCount: empActiveTasks.length,
                projectCount: allProjectIds.size,
            };
        });
        return workloadMap;
    }, [employees, tasks, projects]);

    // ── Filtering ──
    const filteredEmployees = useMemo(() => employees.filter(emp => {
        const matchesSearch = emp.FullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.Email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.EmployeeID.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDept = selectedDept === 'All' || emp.Department === selectedDept;
        const matchesRole = filterRole === 'All' || emp.Role === filterRole;
        return matchesSearch && matchesDept && matchesRole;
    }), [employees, searchTerm, selectedDept, filterRole]);

    // ── Permissions ──
    const canManageUsers = currentUser?.Role === Role.Admin;
    const canEdit = (targetId: string) => canManageUsers || currentUser?.EmployeeID === targetId;

    // ── CRUD Handlers ──
    const handleCreate = () => {
        setEditMode('create');
        setCurrentEmployee({
            Department: departments[0] || 'Phòng Hành chính - Tổng hợp',
            Position: 'Chuyên viên',
            Status: EmployeeStatus.Active,
            Role: Role.Staff,
            JoinDate: new Date().toISOString().split('T')[0],
            Password: '123456',
            Email: '',
            Phone: '',
            FullName: '',
            Username: '',
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
            showToast('Đã xóa nhân sự thành công', 'success');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editMode === 'create') {
                await createMutation.mutateAsync(currentEmployee);
                showToast('Thêm nhân sự mới thành công!', 'success');
            } else {
                if (!currentEmployee.EmployeeID) return;
                await updateMutation.mutateAsync({
                    id: currentEmployee.EmployeeID,
                    data: currentEmployee
                });
                showToast('Cập nhật thông tin thành công!', 'success');
            }
            setIsModalOpen(false);
        } catch (err) {
            showToast('Có lỗi xảy ra. Vui lòng thử lại.', 'error');
        }
    };

    const hasActiveFilters = selectedDept !== 'All' || filterRole !== 'All' || searchTerm !== '';

    // ═══════════════════════════════════════════════════
    // Render
    // ═══════════════════════════════════════════════════
    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* ══════════ STATS DASHBOARD ══════════ */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Total - Hero Card */}
                <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-6 -translate-x-6" />
                    <div className="flex items-center gap-3 mb-3 relative z-10">
                        <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
                            <Users className="w-5 h-5 text-white/80" />
                        </div>
                        <span className="text-xs font-medium text-white/80 uppercase tracking-wider">Tổng nhân sự</span>
                    </div>
                    <p className="text-4xl font-black relative z-10">{stats?.total || 0}</p>
                    <div className="mt-3 flex items-center gap-2 relative z-10">
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-700"
                                style={{ width: stats?.total ? `${((stats?.active || 0) / stats.total * 100)}%` : '0%' }}
                            />
                        </div>
                        <span className="text-xs font-bold text-emerald-400">
                            {stats?.total ? Math.round((stats?.active || 0) / stats.total * 100) : 0}% active
                        </span>
                    </div>
                </div>

                {/* Active */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 text-white p-5 shadow-xl ring-1 ring-emerald-400/30 transition-transform hover:scale-[1.02] hover:shadow-2xl duration-300">
                    <div className="absolute -right-3 -top-3 opacity-[0.12]">
                        <UserCheck className="w-24 h-24" strokeWidth={1.2} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/90">Đang hoạt động</p>
                        <p className="text-3xl font-black mt-2 tracking-tight drop-shadow-sm">{stats?.active || 0}</p>
                    </div>
                </div>

                {/* Departments */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 via-violet-600 to-purple-700 text-white p-5 shadow-xl ring-1 ring-violet-400/30 transition-transform hover:scale-[1.02] hover:shadow-2xl duration-300">
                    <div className="absolute -right-3 -top-3 opacity-[0.12]">
                        <Building2 className="w-24 h-24" strokeWidth={1.2} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/90">Phòng ban</p>
                        <p className="text-3xl font-black mt-2 tracking-tight drop-shadow-sm">{departments.length}</p>
                    </div>
                </div>

                {/* Admins */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 via-purple-600 to-fuchsia-700 text-white p-5 shadow-xl ring-1 ring-purple-400/30 transition-transform hover:scale-[1.02] hover:shadow-2xl duration-300 cursor-pointer"
                    onClick={() => setFilterRole(filterRole === Role.Admin ? 'All' : Role.Admin)}>
                    <div className="absolute -right-3 -top-3 opacity-[0.12]">
                        <Shield className="w-24 h-24" strokeWidth={1.2} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/90">Quản trị viên</p>
                        <p className="text-3xl font-black mt-2 tracking-tight drop-shadow-sm">{stats?.byRole?.[Role.Admin] || 0}</p>
                    </div>
                </div>

                {/* Managers */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 text-white p-5 shadow-xl ring-1 ring-blue-400/30 transition-transform hover:scale-[1.02] hover:shadow-2xl duration-300 cursor-pointer"
                    onClick={() => setFilterRole(filterRole === Role.Manager ? 'All' : Role.Manager)}>
                    <div className="absolute -right-3 -top-3 opacity-[0.12]">
                        <TrendingUp className="w-24 h-24" strokeWidth={1.2} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/90">Quản lý</p>
                        <p className="text-3xl font-black mt-2 tracking-tight drop-shadow-sm">{stats?.byRole?.[Role.Manager] || 0}</p>
                    </div>
                </div>
            </div>

            {/* ══════════ MAIN LAYOUT ══════════ */}
            <div className="flex flex-col lg:flex-row gap-6">

                {/* LEFT SIDEBAR: DEPARTMENTS */}
                <div className="w-full lg:w-60 shrink-0">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden sticky top-4">
                        <div className="px-4 py-3 border-b-2 border-orange-200 dark:border-orange-900/40" style={{ background: 'linear-gradient(135deg, #fde5c9 0%, #fef0db 50%, #fdf4e5 100%)' }}>
                            <h3 className="text-xs font-black text-gray-800 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
                                <Building2 className="w-3.5 h-3.5 text-orange-600" /> Phòng ban
                            </h3>
                        </div>
                        <div className="p-2 space-y-0.5 max-h-[60vh] overflow-y-auto">
                            <button
                                onClick={() => setSelectedDept('All')}
                                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex justify-between items-center ${selectedDept === 'All'
                                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-700 dark:text-blue-400 shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                                    }`}
                            >
                                <span>Tất cả</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${selectedDept === 'All'
                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                                    }`}>{stats?.total || 0}</span>
                            </button>
                            {departments.map(dept => (
                                <button
                                    key={dept}
                                    onClick={() => setSelectedDept(dept)}
                                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex justify-between items-center gap-2 ${selectedDept === dept
                                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-700 dark:text-blue-400 shadow-sm'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    <span className="truncate">{dept}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${selectedDept === dept
                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                                        }`}>
                                        {stats?.byDepartment?.[dept] || 0}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT CONTENT: EMPLOYEE LIST */}
                <div className="flex-1 space-y-4">

                    {/* ══════════ TOOLBAR ══════════ */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                        <div className="p-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                            {/* Left: Search + Filters */}
                            <div className="flex items-center gap-3 flex-wrap flex-1 w-full lg:w-auto">
                                <div className="relative flex-1 min-w-[240px] max-w-[360px]">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm nhân sự..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
                                    />
                                    {searchTerm && (
                                        <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                <div className="relative">
                                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
                                    <select
                                        value={filterRole}
                                        onChange={(e) => setFilterRole(e.target.value)}
                                        className="pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 appearance-none cursor-pointer transition-all"
                                    >
                                        <option value="All">Tất cả vai trò</option>
                                        <option value={Role.Admin}>Admin</option>
                                        <option value={Role.Manager}>Quản lý</option>
                                        <option value={Role.Staff}>Nhân viên</option>
                                    </select>
                                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
                                </div>

                                {hasActiveFilters && (
                                    <button
                                        onClick={() => { setSearchTerm(''); setSelectedDept('All'); setFilterRole('All'); }}
                                        className="text-xs text-slate-500 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                                    >
                                        Xóa bộ lọc
                                    </button>
                                )}
                            </div>

                            {/* Right: View toggle + Create */}
                            <div className="flex items-center gap-2 shrink-0">
                                <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-xl p-1">
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-700 dark:text-slate-200' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                    >
                                        <List className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-700 dark:text-slate-200' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                    >
                                        <LayoutGrid className="w-4 h-4" />
                                    </button>
                                </div>

                                {canManageUsers && (
                                    <button
                                        onClick={handleCreate}
                                        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-600/25 active:scale-[0.98]"
                                    >
                                        <UserPlus className="w-4 h-4" />
                                        <span>Thêm nhân sự</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ══════════ CONTENT ══════════ */}
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                            <div className="flex flex-col items-center gap-3">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                                <p className="text-sm text-slate-400">Đang tải dữ liệu...</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {viewMode === 'list' ? (
                                /* ══════════ TABLE VIEW ══════════ */
                                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                                    <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-360px)]">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="table-header-row">
                                                    <th className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest">Nhân viên</th>
                                                    <th className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest">Chức vụ / Phòng ban</th>
                                                    <th className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest hidden md:table-cell">Liên hệ</th>
                                                    <th className="px-5 py-3.5 text-center text-[10px] font-black uppercase tracking-widest">Khối lượng CV</th>
                                                    <th className="px-5 py-3.5 text-center text-[10px] font-black uppercase tracking-widest">Vai trò</th>
                                                    <th className="px-5 py-3.5 text-center text-[10px] font-black uppercase tracking-widest w-12">TT</th>
                                                    <th className="px-5 py-3.5 w-20"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                                                {filteredEmployees.map((emp) => {
                                                    const roleInfo = getRoleInfo(emp.Role);
                                                    const workload = employeeWorkload[emp.EmployeeID];
                                                    return (
                                                        <tr
                                                            key={emp.EmployeeID}
                                                            onClick={() => navigate(`/employees/${emp.EmployeeID}`)}
                                                            className="hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-colors group cursor-pointer"
                                                        >
                                                            {/* Employee */}
                                                            <td className="px-5 py-3.5">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="relative">
                                                                        <img src={emp.AvatarUrl} alt={emp.FullName} className="w-10 h-10 rounded-full ring-2 ring-white shadow-sm object-cover" />
                                                                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${emp.Status === EmployeeStatus.Active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm group-hover:text-blue-600 transition-colors truncate">{emp.FullName}</p>
                                                                        <p className="text-[10px] text-slate-400 font-mono">{emp.EmployeeID}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            {/* Position */}
                                                            <td className="px-5 py-3.5">
                                                                <div className="min-w-0">
                                                                    <p className="font-medium text-slate-700 dark:text-slate-300 text-sm truncate">{emp.Position}</p>
                                                                    <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{emp.Department}</p>
                                                                </div>
                                                            </td>
                                                            {/* Contact */}
                                                            <td className="px-5 py-3.5 hidden md:table-cell">
                                                                <div className="flex flex-col gap-1">
                                                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                                                        <span className="truncate max-w-[180px]">{emp.Email}</span>
                                                                    </div>
                                                                    {emp.Phone && (
                                                                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                                                            <span>{emp.Phone}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            {/* Workload Badges */}
                                                            <td className="px-5 py-3.5">
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-sky-500/10 text-sky-600 ring-1 ring-sky-500/20" title="Công việc đang thực hiện">
                                                                        <ClipboardList className="w-3 h-3" />
                                                                        {workload?.activeTaskCount || 0}
                                                                    </span>
                                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 ring-1 ring-indigo-500/20" title="Dự án tham gia">
                                                                        <FolderOpen className="w-3 h-3" />
                                                                        {workload?.projectCount || 0}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            {/* Role */}
                                                            <td className="px-5 py-3.5 text-center">
                                                                <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-md ${roleInfo.color}`}>
                                                                    <span className={`w-1.5 h-1.5 rounded-full ${roleInfo.dot}`} />
                                                                    {roleInfo.label}
                                                                </span>
                                                            </td>
                                                            {/* Status */}
                                                            <td className="px-5 py-3.5 text-center">
                                                                <div
                                                                    className={`w-2.5 h-2.5 rounded-full mx-auto ring-2 ${emp.Status === EmployeeStatus.Active
                                                                        ? 'bg-emerald-500 ring-emerald-200'
                                                                        : 'bg-slate-300 ring-slate-200'
                                                                        }`}
                                                                    title={emp.Status === EmployeeStatus.Active ? 'Đang hoạt động' : 'Đã nghỉ'}
                                                                />
                                                            </td>
                                                            {/* Actions */}
                                                            <td className="px-5 py-3.5">
                                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                                    {canEdit(emp.EmployeeID) && (
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); handleEdit(emp); }}
                                                                            className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                                                                            title="Chỉnh sửa"
                                                                        >
                                                                            <Edit className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    )}
                                                                    {canManageUsers && (
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); handleDelete(emp.EmployeeID); }}
                                                                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                                                                            title="Xóa"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                    {/* Footer */}
                                    <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                                        <p className="text-xs text-slate-400 dark:text-slate-500">
                                            Hiển thị <span className="font-bold text-slate-600 dark:text-slate-300">{filteredEmployees.length}</span> / {employees.length} nhân sự
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                /* ══════════ GRID VIEW ══════════ */
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {filteredEmployees.map((emp) => {
                                        const roleInfo = getRoleInfo(emp.Role);
                                        const workload = employeeWorkload[emp.EmployeeID];
                                        return (
                                            <div
                                                key={emp.EmployeeID}
                                                onClick={() => navigate(`/employees/${emp.EmployeeID}`)}
                                                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-lg transition-all cursor-pointer group overflow-hidden"
                                            >
                                                {/* Header gradient */}
                                                <div className="h-20 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 relative">
                                                    <div className="absolute inset-0 bg-black/10" />
                                                    <div className="absolute top-3 right-3">
                                                        <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-md bg-white/20 backdrop-blur-sm text-white`}>
                                                            {roleInfo.label}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Avatar overlapping */}
                                                <div className="px-5 -mt-10 relative z-10">
                                                    <div className="relative inline-block">
                                                        <img
                                                            src={emp.AvatarUrl}
                                                            alt={emp.FullName}
                                                            className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-lg"
                                                        />
                                                        <div className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white ${emp.Status === EmployeeStatus.Active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                                    </div>
                                                </div>

                                                {/* Info */}
                                                <div className="px-5 pt-3 pb-5">
                                                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 transition-colors">{emp.FullName}</h3>
                                                    <p className="text-sm text-blue-600 font-medium">{emp.Position}</p>
                                                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{emp.Department}</p>

                                                    {/* Workload Badges */}
                                                    <div className="flex items-center gap-2 mt-4">
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400">
                                                            <ClipboardList className="w-3 h-3" /> {workload?.activeTaskCount || 0} công việc
                                                        </span>
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                                                            <FolderOpen className="w-3 h-3" /> {workload?.projectCount || 0} dự án
                                                        </span>
                                                    </div>

                                                    {/* Contact actions */}
                                                    <div className="flex gap-2 mt-4">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); }}
                                                            className="flex-1 py-2.5 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                                                        >
                                                            <Mail className="w-3 h-3" /> Email
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); }}
                                                            className="flex-1 py-2.5 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                                                        >
                                                            <Phone className="w-3 h-3" /> Gọi
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Empty State */}
                            {filteredEmployees.length === 0 && (
                                <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                                    <div className="w-14 h-14 bg-slate-50 dark:bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <Sparkles className="w-6 h-6 text-slate-300 dark:text-slate-500" />
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 font-medium">Không tìm thấy nhân sự nào.</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* ══════════ MODAL — Create / Edit ══════════ */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto ring-1 ring-black/5 dark:ring-slate-700">

                        {/* Header */}
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800 sticky top-0 z-10">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                                    {editMode === 'create' ? 'Thêm nhân sự mới' : 'Cập nhật thông tin'}
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    {editMode === 'create' ? 'Điền đầy đủ thông tin để tạo tài khoản' : 'Chỉnh sửa thông tin nhân sự'}
                                </p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSave} className="p-6 space-y-5">

                            {/* Section: Thông tin cơ bản */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <User className="w-3.5 h-3.5" /> Thông tin cơ bản
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Họ và tên *</label>
                                        <input
                                            required
                                            type="text"
                                            value={currentEmployee.FullName || ''}
                                            onChange={e => setCurrentEmployee({ ...currentEmployee, FullName: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-sm dark:text-slate-200 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
                                            placeholder="Nguyễn Văn A"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Phòng ban *</label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                                            <select
                                                disabled={!canManageUsers && editMode === 'edit'}
                                                value={currentEmployee.Department}
                                                onChange={e => setCurrentEmployee({ ...currentEmployee, Department: e.target.value })}
                                                className="w-full pl-10 pr-8 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all appearance-none"
                                            >
                                                {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Chức danh *</label>
                                        <div className="relative">
                                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                                            <input
                                                disabled={!canManageUsers && editMode === 'edit'}
                                                type="text"
                                                value={currentEmployee.Position || ''}
                                                onChange={e => setCurrentEmployee({ ...currentEmployee, Position: e.target.value })}
                                                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                                                placeholder="Trưởng phòng, Chuyên viên..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-slate-100 dark:border-slate-700" />

                            {/* Section: Liên hệ */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Mail className="w-3.5 h-3.5" /> Thông tin liên hệ
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Email *</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                                            <input
                                                required
                                                type="email"
                                                value={currentEmployee.Email || ''}
                                                onChange={e => setCurrentEmployee({ ...currentEmployee, Email: e.target.value })}
                                                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                                                placeholder="email@example.com"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Số điện thoại</label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                                            <input
                                                type="tel"
                                                value={currentEmployee.Phone || ''}
                                                onChange={e => setCurrentEmployee({ ...currentEmployee, Phone: e.target.value })}
                                                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                                                placeholder="0912345678"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-slate-100 dark:border-slate-700" />

                            {/* Section: Tài khoản & Quyền */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Lock className="w-3.5 h-3.5" /> Tài khoản & Phân quyền
                                </h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Tên đăng nhập</label>
                                        <div className="relative">
                                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                                            <input
                                                type="text"
                                                value={currentEmployee.Username || ''}
                                                onChange={e => setCurrentEmployee({ ...currentEmployee, Username: e.target.value })}
                                                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                                                placeholder="username"
                                            />
                                        </div>
                                    </div>
                                    {editMode === 'create' && (
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Mật khẩu</label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                                                <input
                                                    type="password"
                                                    value={currentEmployee.Password || ''}
                                                    onChange={e => setCurrentEmployee({ ...currentEmployee, Password: e.target.value })}
                                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                                                    placeholder="••••••"
                                                />
                                            </div>
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Vai trò *</label>
                                        <div className="relative">
                                            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                                            <select
                                                disabled={!canManageUsers}
                                                value={currentEmployee.Role}
                                                onChange={e => setCurrentEmployee({ ...currentEmployee, Role: e.target.value as Role })}
                                                className="w-full pl-10 pr-8 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all appearance-none"
                                            >
                                                <option value={Role.Staff}>Nhân viên (Staff)</option>
                                                <option value={Role.Manager}>Quản lý (Manager)</option>
                                                <option value={Role.Admin}>Admin</option>
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-slate-100 dark:border-slate-700" />

                            {/* Section: Thời gian & Trạng thái */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5" /> Thời gian & Trạng thái
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Ngày vào làm</label>
                                        <input
                                            type="date"
                                            value={currentEmployee.JoinDate || ''}
                                            onChange={e => setCurrentEmployee({ ...currentEmployee, JoinDate: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Trạng thái</label>
                                        <div className="relative">
                                            <select
                                                disabled={!canManageUsers}
                                                value={currentEmployee.Status}
                                                onChange={e => setCurrentEmployee({ ...currentEmployee, Status: parseInt(e.target.value) as EmployeeStatus })}
                                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all appearance-none"
                                            >
                                                <option value={EmployeeStatus.Active}>Đang làm việc</option>
                                                <option value={EmployeeStatus.Inactive}>Đã nghỉ việc</option>
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl shadow-lg shadow-blue-600/25 transition-all active:scale-[0.98] flex items-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    {editMode === 'create' ? 'Tạo nhân sự' : 'Lưu thay đổi'}
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