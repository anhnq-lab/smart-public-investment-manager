
import React, { useState, useEffect } from 'react';
import { Bell, Search, User, LogOut, Menu, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotificationCenter } from './NotificationCenter';

interface HeaderProps {
    onOpenSearch: () => void;
    onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch, onMenuClick }) => {
    const { currentUser, logout } = useAuth();
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

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

    // Detect scroll for subtle shadow
    useEffect(() => {
        const main = document.querySelector('main');
        if (!main) return;
        const onScroll = () => setScrolled(main.scrollTop > 10);
        main.addEventListener('scroll', onScroll);
        return () => main.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <header
            className="h-14 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 transition-shadow duration-300"
            style={{
                background: 'linear-gradient(90deg, #B04A0A 0%, #D45E0E 40%, #EC6710 70%, #F99715 100%)',
                boxShadow: scrolled ? '0 2px 16px rgba(180, 74, 10, 0.25)' : '0 1px 0 rgba(255,255,255,0.08)',
            }}
        >
            {/* Left: Mobile menu + Search */}
            <div className="flex items-center gap-3 flex-1">
                <button
                    onClick={onMenuClick}
                    className="p-1.5 -ml-1 rounded-lg lg:hidden transition-colors hover:bg-white/15"
                    style={{ color: 'rgba(255,255,255,0.9)' }}
                >
                    <Menu className="w-5 h-5" />
                </button>
                <button
                    onClick={onOpenSearch}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-left group max-w-sm w-full"
                    style={{
                        background: 'rgba(255,255,255,0.15)',
                        border: '1px solid rgba(255,255,255,0.18)',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)';
                    }}
                >
                    <Search className="w-4 h-4 shrink-0" style={{ color: 'rgba(255,255,255,0.65)' }} />
                    <span className="flex-1 text-[13px] truncate" style={{ color: 'rgba(255,255,255,0.6)' }}>Tìm kiếm dự án, nhà thầu...</span>
                    <kbd
                        className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium rounded"
                        style={{
                            color: 'rgba(255,255,255,0.5)',
                            background: 'rgba(255,255,255,0.12)',
                            border: '1px solid rgba(255,255,255,0.15)',
                        }}
                    >
                        <span className="text-[10px]">⌘</span>K
                    </kbd>
                </button>
            </div>

            {/* Right: Notifications + User */}
            <div className="flex items-center gap-2">
                {/* Notifications */}
                <div className="relative">
                    <button
                        onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                        className="relative p-2 rounded-lg transition-colors hover:bg-white/15"
                        style={{ color: 'rgba(255,255,255,0.9)' }}
                    >
                        <Bell className="w-5 h-5" />
                        <span
                            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                            style={{
                                background: '#FFD700',
                                border: '1.5px solid #B04A0A',
                                boxShadow: '0 0 6px rgba(255, 215, 0, 0.6)',
                            }}
                        ></span>
                    </button>
                    <NotificationCenter
                        isOpen={isNotificationOpen}
                        onClose={() => setIsNotificationOpen(false)}
                    />
                </div>

                {/* Divider */}
                <div className="w-px h-8 mx-1" style={{ background: 'rgba(255,255,255,0.2)' }}></div>

                {/* User Menu */}
                <div className="flex items-center gap-2.5 group relative cursor-pointer rounded-lg px-2 py-1 transition-colors hover:bg-white/10">
                    {/* Avatar */}
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden shrink-0"
                        style={{
                            background: 'rgba(255,255,255,0.2)',
                            border: '1.5px solid rgba(255,255,255,0.35)',
                            color: '#ffffff',
                        }}
                    >
                        {currentUser?.AvatarUrl ? (
                            <img src={currentUser.AvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-xs font-bold">{currentUser?.FullName?.charAt(0) || 'U'}</span>
                        )}
                    </div>
                    {/* Name */}
                    <div className="text-right hidden md:block">
                        <p className="text-[13px] font-semibold text-white leading-tight">{currentUser?.FullName || 'Khách'}</p>
                        <p className="text-[11px] leading-tight" style={{ color: 'rgba(255,255,255,0.6)' }}>{currentUser?.Department}</p>
                    </div>

                    {/* Dropdown */}
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 overflow-hidden hidden group-hover:block animate-in fade-in slide-in-from-top-2">
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
