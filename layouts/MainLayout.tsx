import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Header } from '../components/common/Header';
import { AIChatbot } from '../components/common/AIChatbot';
import { GlobalSearch } from '../components/common/GlobalSearch';
import { Breadcrumb } from '../components/common/Breadcrumb';
import { useAuth } from '../context/AuthContext';

// ========================================
// MAIN LAYOUT - Design System v2
// ========================================

const MainLayout: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Persist sidebar collapse state
    useEffect(() => {
        const saved = localStorage.getItem('sidebar-collapsed');
        if (saved) setIsSidebarCollapsed(saved === 'true');
    }, []);

    const handleToggleCollapse = () => {
        const newState = !isSidebarCollapsed;
        setIsSidebarCollapsed(newState);
        localStorage.setItem('sidebar-collapsed', String(newState));
    };

    if (!isAuthenticated) return <Navigate to="/login" />;

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm animate-fade-in"
                    onClick={() => setIsSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar - Desktop */}
            <aside className={`
                hidden lg:block shrink-0 sticky top-0 h-screen
                transition-all duration-300 ease-out
                ${isSidebarCollapsed ? 'w-20' : 'w-64'}
            `}>
                <Sidebar
                    isCollapsed={isSidebarCollapsed}
                    onToggleCollapse={handleToggleCollapse}
                />
            </aside>

            {/* Sidebar - Mobile */}
            <aside className={`
                fixed inset-y-0 left-0 w-64 z-50 lg:hidden
                transform transition-transform duration-300 ease-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <Sidebar onClose={() => setIsSidebarOpen(false)} />
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <Header
                    onOpenSearch={() => setIsSearchOpen(true)}
                    onMenuClick={() => setIsSidebarOpen(true)}
                />

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto">
                    {/* Breadcrumb */}
                    <div className="px-6 pt-6 pb-2">
                        <Breadcrumb />
                    </div>

                    {/* Content */}
                    <div className="px-6 pb-8">
                        <Outlet />
                    </div>
                </main>

                {/* AI Chatbot */}
                <AIChatbot />
            </div>

            {/* Global Search Modal */}
            <GlobalSearch
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
            />
        </div>
    );
};

export default MainLayout;
