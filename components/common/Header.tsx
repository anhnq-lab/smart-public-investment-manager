
import React, { useState, useEffect } from 'react';
import { Bell, Search, User, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotificationCenter } from './NotificationCenter';

interface HeaderProps {
    onOpenSearch: () => void;
    onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch, onMenuClick }) => {
    const { currentUser, logout } = useAuth();
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);

    // Keyboard shortcut for search (Ctrl+K or Cmd+K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                onOpenSearch();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onOpenSearch]);

    return (
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-10 transition-all">
            <div className="flex items-center gap-4 w-full md:w-96">
                <button
                    onClick={onMenuClick}
                    className="p-2 -ml-2 mr-2 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg lg:hidden"
                >
                    <Menu className="w-6 h-6" />
                </button>
                <button
                    onClick={onOpenSearch}
                    className="relative w-full flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 hover:border-gray-300 dark:hover:border-slate-500 transition-all text-left group"
                >
                    <Search className="w-5 h-5 text-gray-400 dark:text-slate-500 group-hover:text-gray-600 dark:group-hover:text-slate-300" />
                    <span className="flex-1 text-sm text-gray-400 dark:text-slate-500 group-hover:text-gray-600 dark:group-hover:text-slate-300">Tìm kiếm dự án, nhà thầu...</span>
                    <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-gray-400 dark:text-slate-500 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded">
                        <span className="text-xs">⌘</span>K
                    </kbd>
                </button>
            </div>

            <div className="flex items-center gap-6">
                {/* Notifications */}
                <div className="relative">
                    <button
                        onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                        className="relative p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <Bell className="w-6 h-6 text-gray-600 dark:text-slate-400" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                    </button>
                    <NotificationCenter
                        isOpen={isNotificationOpen}
                        onClose={() => setIsNotificationOpen(false)}
                    />
                </div>

                {/* User Menu */}
                <div className="flex items-center gap-3 pl-6 border-l border-gray-200 dark:border-slate-700 group relative cursor-pointer">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">{currentUser?.FullName || 'Khách'}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">{currentUser?.Department} - {currentUser?.Position}</p>
                    </div>
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 overflow-hidden border border-blue-200 dark:border-blue-800">
                        {currentUser?.AvatarUrl ? (
                            <img src={currentUser.AvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-6 h-6" />
                        )}
                    </div>

                    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden hidden group-hover:block animate-in fade-in slide-in-from-top-2">
                        <button
                            onClick={logout}
                            className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                        >
                            <LogOut className="w-4 h-4" />
                            Đăng xuất
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};
