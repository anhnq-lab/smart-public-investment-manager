import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bell, X, Clock, AlertTriangle, CheckCircle2, FileText,
    Building2, Calendar, ChevronRight, Trash2, BellOff
} from 'lucide-react';
import { mockTasks, mockProjects } from '../mockData';
import { TaskStatus } from '../types';

interface Notification {
    id: string;
    type: 'warning' | 'info' | 'success' | 'task';
    title: string;
    message: string;
    time: string;
    read: boolean;
    link?: string;
    icon: React.ElementType;
    iconColor: string;
}

interface NotificationCenterProps {
    isOpen: boolean;
    onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
    const navigate = useNavigate();

    // Generate notifications from real data
    const notifications = useMemo<Notification[]>(() => {
        const notifs: Notification[] = [];
        const now = new Date();

        // 1. Tasks due within 7 days
        mockTasks
            .filter(task => {
                if (task.Status === TaskStatus.Done) return false;
                const dueDate = new Date(task.DueDate);
                const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                return daysUntilDue >= 0 && daysUntilDue <= 7;
            })
            .slice(0, 3)
            .forEach((task, idx) => {
                const dueDate = new Date(task.DueDate);
                const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                notifs.push({
                    id: `task-${task.TaskID}`,
                    type: daysUntilDue <= 2 ? 'warning' : 'task',
                    title: daysUntilDue === 0 ? 'Công việc đến hạn hôm nay' :
                        daysUntilDue === 1 ? 'Công việc đến hạn ngày mai' :
                            `Công việc còn ${daysUntilDue} ngày`,
                    message: task.Title,
                    time: daysUntilDue === 0 ? 'Hôm nay' :
                        daysUntilDue === 1 ? 'Ngày mai' :
                            `${dueDate.toLocaleDateString('vi-VN')}`,
                    read: idx > 0,
                    link: `/tasks/${task.TaskID}`,
                    icon: daysUntilDue <= 2 ? AlertTriangle : Clock,
                    iconColor: daysUntilDue <= 2 ? 'text-amber-500 bg-amber-50' : 'text-blue-500 bg-blue-50'
                });
            });

        // 2. Project progress alerts
        mockProjects
            .filter(p => (p.Progress || 0) < 50 && p.Status === 2) // Execution status
            .slice(0, 2)
            .forEach((project, idx) => {
                notifs.push({
                    id: `project-${project.ProjectID}`,
                    type: 'warning',
                    title: 'Cảnh báo tiến độ dự án',
                    message: `${project.ProjectName} - Tiến độ: ${project.Progress || 0}%`,
                    time: '2 giờ trước',
                    read: true,
                    link: `/projects/${project.ProjectID}`,
                    icon: Building2,
                    iconColor: 'text-orange-500 bg-orange-50'
                });
            });

        // 3. System notifications (static examples)
        notifs.push({
            id: 'system-sync',
            type: 'success',
            title: 'Đồng bộ thành công',
            message: 'Dữ liệu đã được cập nhật từ Cổng thông tin Quốc gia',
            time: 'Hôm nay, 08:30',
            read: true,
            icon: CheckCircle2,
            iconColor: 'text-emerald-500 bg-emerald-50'
        });

        notifs.push({
            id: 'system-doc',
            type: 'info',
            title: 'Tài liệu mới được phê duyệt',
            message: 'Quyết định phê duyệt KHLCNT đã được ký số',
            time: 'Hôm qua',
            read: true,
            link: '/documents',
            icon: FileText,
            iconColor: 'text-purple-500 bg-purple-50'
        });

        return notifs;
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleNotificationClick = (notif: Notification) => {
        if (notif.link) {
            navigate(notif.link);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={onClose} />

            {/* Dropdown */}
            <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-gray-600" />
                        <h3 className="text-sm font-bold text-gray-800">Thông báo</h3>
                        {unreadCount > 0 && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Đánh dấu tất cả đã đọc"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Notification List */}
                <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-50">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center">
                            <BellOff className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p className="text-sm font-medium text-gray-500">Không có thông báo mới</p>
                        </div>
                    ) : (
                        notifications.map(notif => (
                            <div
                                key={notif.id}
                                onClick={() => handleNotificationClick(notif)}
                                className={`px-4 py-3 flex gap-3 transition-colors cursor-pointer group ${notif.read ? 'bg-white hover:bg-gray-50' : 'bg-blue-50/30 hover:bg-blue-50/50'
                                    }`}
                            >
                                {/* Icon */}
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${notif.iconColor}`}>
                                    <notif.icon className="w-4 h-4" />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className={`text-xs font-bold ${notif.read ? 'text-gray-700' : 'text-gray-900'}`}>
                                            {notif.title}
                                        </p>
                                        {!notif.read && (
                                            <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1"></span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5 truncate">{notif.message}</p>
                                    <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {notif.time}
                                    </p>
                                </div>

                                {/* Arrow */}
                                {notif.link && (
                                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 shrink-0 self-center transition-colors" />
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <button className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1">
                        <Trash2 className="w-3 h-3" />
                        Xóa tất cả
                    </button>
                    <button
                        onClick={() => {
                            navigate('/tasks');
                            onClose();
                        }}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                        Xem tất cả công việc
                    </button>
                </div>
            </div>
        </>
    );
};

export default NotificationCenter;
