
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

    if (!isAuthenticated) return <Navigate to="/login" />;

    return (
        <div className="flex min-h-screen bg-gray-50">
            <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-20 hidden lg:block">
                <Sidebar />
            </div>
            <div className="flex-1 lg:ml-64 flex flex-col">
                <Header onOpenSearch={() => setIsSearchOpen(true)} />
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
