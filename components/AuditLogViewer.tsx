import React, { useState, useMemo } from 'react';
import {
    History, Filter, Search, Calendar, User, FileText,
    Edit3, Trash2, Plus, Eye, Clock, ChevronLeft, ChevronRight,
    Download, Building2, Briefcase, CreditCard
} from 'lucide-react';
import { mockEmployees } from '../mockData';

// AuditLog types based on types.ts interface
interface AuditLog {
    id: string;
    timestamp: string;
    userId: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'EXPORT' | 'SYNC';
    entityType: 'Project' | 'Contract' | 'Payment' | 'Task' | 'Document' | 'Employee';
    entityId: string;
    entityName: string;
    details?: string;
    ipAddress?: string;
}

// Mock audit log data
const mockAuditLogs: AuditLog[] = [
    {
        id: 'log-001',
        timestamp: new Date().toISOString(),
        userId: 'EMP-001',
        action: 'SYNC',
        entityType: 'Project',
        entityId: 'P-001',
        entityName: 'Đồng bộ Cổng thông tin Quốc gia',
        details: 'Đồng bộ 5 dự án thành công',
        ipAddress: '192.168.1.100'
    },
    {
        id: 'log-002',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        userId: 'EMP-002',
        action: 'CREATE',
        entityType: 'Payment',
        entityId: 'PAY-123',
        entityName: 'Tạo phiếu thanh toán',
        details: 'Đợt 3 - HĐ-2024-001 - Giá trị: 500,000,000 VND',
        ipAddress: '192.168.1.105'
    },
    {
        id: 'log-003',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        userId: 'EMP-001',
        action: 'UPDATE',
        entityType: 'Contract',
        entityId: 'HD-2024-001',
        entityName: 'Cập nhật hợp đồng',
        details: 'Điều chỉnh tiến độ: 70% -> 75%',
        ipAddress: '192.168.1.100'
    },
    {
        id: 'log-004',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        userId: 'EMP-003',
        action: 'EXPORT',
        entityType: 'Document',
        entityId: 'DOC-001',
        entityName: 'Xuất báo cáo giám sát',
        details: 'BC-01 tháng 01/2026',
        ipAddress: '192.168.1.110'
    },
    {
        id: 'log-005',
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        userId: 'EMP-002',
        action: 'DELETE',
        entityType: 'Task',
        entityId: 'TASK-050',
        entityName: 'Xóa công việc',
        details: 'Công việc trùng lặp: "Nghiệm thu phần móng"',
        ipAddress: '192.168.1.105'
    },
    {
        id: 'log-006',
        timestamp: new Date(Date.now() - 259200000).toISOString(),
        userId: 'EMP-001',
        action: 'VIEW',
        entityType: 'Project',
        entityId: 'P-007',
        entityName: 'Xem chi tiết dự án',
        details: 'Dự án: Xây dựng Trường Chính trị tỉnh',
        ipAddress: '192.168.1.100'
    }
];

interface AuditLogViewerProps {
    isOpen?: boolean;
    onClose?: () => void;
    standalone?: boolean;
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ isOpen = true, onClose, standalone = true }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterAction, setFilterAction] = useState<string>('all');
    const [filterEntity, setFilterEntity] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const actionIcons: Record<string, React.ElementType> = {
        CREATE: Plus,
        UPDATE: Edit3,
        DELETE: Trash2,
        VIEW: Eye,
        EXPORT: Download,
        SYNC: History
    };

    const actionColors: Record<string, string> = {
        CREATE: 'bg-emerald-100 text-emerald-700',
        UPDATE: 'bg-blue-100 text-blue-700',
        DELETE: 'bg-red-100 text-red-700',
        VIEW: 'bg-gray-100 text-gray-700',
        EXPORT: 'bg-purple-100 text-purple-700',
        SYNC: 'bg-indigo-100 text-indigo-700'
    };

    const entityIcons: Record<string, React.ElementType> = {
        Project: Building2,
        Contract: FileText,
        Payment: CreditCard,
        Task: Clock,
        Document: FileText,
        Employee: User
    };

    const filteredLogs = useMemo(() => {
        return mockAuditLogs.filter(log => {
            const matchesSearch =
                log.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.details?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.entityId.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesAction = filterAction === 'all' || log.action === filterAction;
            const matchesEntity = filterEntity === 'all' || log.entityType === filterEntity;

            return matchesSearch && matchesAction && matchesEntity;
        });
    }, [searchQuery, filterAction, filterEntity]);

    const paginatedLogs = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredLogs.slice(start, start + itemsPerPage);
    }, [filteredLogs, currentPage]);

    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffHours < 1) return 'Vừa xong';
        if (diffHours < 24) return `${diffHours} giờ trước`;
        if (diffDays < 7) return `${diffDays} ngày trước`;
        return date.toLocaleDateString('vi-VN');
    };

    const getUserName = (userId: string) => {
        const employee = mockEmployees.find(e => e.EmployeeID === userId);
        return employee?.FullName || userId;
    };

    const content = (
        <div className={`space-y-6 ${standalone ? 'animate-in fade-in duration-300' : ''}`}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                        <History className="w-7 h-7 text-blue-600" />
                        Nhật ký hệ thống
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Theo dõi mọi hoạt động và thay đổi trong hệ thống</p>
                </div>
                <button className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Xuất log
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex flex-wrap gap-4">
                    {/* Search */}
                    <div className="flex-1 min-w-[250px] relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm theo tên, ID, chi tiết..."
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Action Filter */}
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <select
                            value={filterAction}
                            onChange={e => setFilterAction(e.target.value)}
                            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Tất cả hành động</option>
                            <option value="CREATE">Tạo mới</option>
                            <option value="UPDATE">Cập nhật</option>
                            <option value="DELETE">Xóa</option>
                            <option value="VIEW">Xem</option>
                            <option value="EXPORT">Xuất file</option>
                            <option value="SYNC">Đồng bộ</option>
                        </select>
                    </div>

                    {/* Entity Filter */}
                    <select
                        value={filterEntity}
                        onChange={e => setFilterEntity(e.target.value)}
                        className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Tất cả đối tượng</option>
                        <option value="Project">Dự án</option>
                        <option value="Contract">Hợp đồng</option>
                        <option value="Payment">Thanh toán</option>
                        <option value="Task">Công việc</option>
                        <option value="Document">Tài liệu</option>
                    </select>
                </div>
            </div>

            {/* Log Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500">
                            <tr>
                                <th className="px-6 py-4 text-left">Thời gian</th>
                                <th className="px-6 py-4 text-left">Người thực hiện</th>
                                <th className="px-6 py-4 text-left">Hành động</th>
                                <th className="px-6 py-4 text-left">Đối tượng</th>
                                <th className="px-6 py-4 text-left">Chi tiết</th>
                                <th className="px-6 py-4 text-left">IP</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedLogs.map(log => {
                                const ActionIcon = actionIcons[log.action] || History;
                                const EntityIcon = entityIcons[log.entityType] || FileText;

                                return (
                                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <div>
                                                    <p className="font-medium text-gray-800">{formatTime(log.timestamp)}</p>
                                                    <p className="text-[10px] text-gray-400">
                                                        {new Date(log.timestamp).toLocaleTimeString('vi-VN')}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <User className="w-4 h-4 text-blue-600" />
                                                </div>
                                                <span className="font-medium text-gray-700">{getUserName(log.userId)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${actionColors[log.action]}`}>
                                                <ActionIcon className="w-3.5 h-3.5" />
                                                {log.action === 'CREATE' ? 'Tạo mới' :
                                                    log.action === 'UPDATE' ? 'Cập nhật' :
                                                        log.action === 'DELETE' ? 'Xóa' :
                                                            log.action === 'VIEW' ? 'Xem' :
                                                                log.action === 'EXPORT' ? 'Xuất file' : 'Đồng bộ'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <EntityIcon className="w-4 h-4 text-gray-400" />
                                                <div>
                                                    <p className="font-medium text-gray-800">{log.entityName}</p>
                                                    <p className="text-[10px] text-gray-400 font-mono">{log.entityId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-gray-600 text-xs max-w-[200px] truncate" title={log.details}>
                                                {log.details || '-'}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-xs text-gray-400">{log.ipAddress || '-'}</span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                        Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredLogs.length)} / {filteredLogs.length} bản ghi
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="px-3 py-1 text-sm font-medium">
                            {currentPage} / {totalPages || 1}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage >= totalPages}
                            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    if (!standalone) {
        if (!isOpen) return null;
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/60 backdrop-blur-sm">
                <div className="bg-white w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-6">
                    {content}
                </div>
            </div>
        );
    }

    return content;
};

export default AuditLogViewer;
