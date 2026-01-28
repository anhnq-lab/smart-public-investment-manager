
import React, { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Header } from '../components/common/Header'; // We need to extract Header too or keep it here
import { AIChatbot } from '../components/common/AIChatbot';
import { GlobalSearch } from '../components/common/GlobalSearch';
import { useAuth } from '../context/AuthContext';

const MainLayout: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    if (!isAuthenticated) return <Navigate to="/login" />;

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm animate-in fade-in"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`
                fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:block shrink-0
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <Sidebar onClose={() => setIsSidebarOpen(false)} />
            </div>

            <div className="flex-1 flex flex-col min-w-0">
                <Header
                    onOpenSearch={() => setIsSearchOpen(true)}
                    onMenuClick={() => setIsSidebarOpen(true)}
                />
                <main className="flex-1 p-8 overflow-y-auto">
                    <Outlet />
                </main>
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
