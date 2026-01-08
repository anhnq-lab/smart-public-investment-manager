
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ProjectList from './components/ProjectList';
import ProjectDetail from './components/ProjectDetail';
import PackageDetail from './components/PackageDetail';
import ContractorList from './components/ContractorList';
import ContractList from './components/ContractList';
import ContractDetail from './components/ContractDetail';
import PaymentList from './components/PaymentList';
import EmployeeList from './components/EmployeeList';
import EmployeeDetail from './components/EmployeeDetail';
import TaskList from './components/TaskList';
import TaskDetail from './components/TaskDetail';
import Login from './components/Login';
import DocumentManager from './components/DocumentManager';
import ReportCenter from './components/ReportCenter';
import Regulations from './components/Regulations';
import ContractorDetail from './components/ContractorDetail';
import AuditLogViewer from './components/AuditLogViewer';
import PersonalDashboard from './components/PersonalDashboard';
import { Bell, Search, User, LogOut } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AIChatbot } from './components/AIChatbot';
import { GlobalSearch } from './components/GlobalSearch';
import { NotificationCenter } from './components/NotificationCenter';

const Header: React.FC<{ onOpenSearch: () => void }> = ({ onOpenSearch }) => {
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
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10">
            <div className="flex items-center gap-4 w-96">
                <button
                    onClick={onOpenSearch}
                    className="relative w-full flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 hover:border-gray-300 transition-all text-left group"
                >
                    <Search className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                    <span className="flex-1 text-sm text-gray-400 group-hover:text-gray-600">Tìm kiếm dự án, nhà thầu...</span>
                    <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-gray-400 bg-white border border-gray-200 rounded">
                        <span className="text-xs">⌘</span>K
                    </kbd>
                </button>
            </div>

            <div className="flex items-center gap-6">
                {/* Notifications */}
                <div className="relative">
                    <button
                        onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <Bell className="w-6 h-6 text-gray-600" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>
                    <NotificationCenter
                        isOpen={isNotificationOpen}
                        onClose={() => setIsNotificationOpen(false)}
                    />
                </div>

                {/* User Menu */}
                <div className="flex items-center gap-3 pl-6 border-l border-gray-200 group relative cursor-pointer">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-semibold text-gray-800">{currentUser?.FullName || 'Khách'}</p>
                        <p className="text-xs text-gray-500">{currentUser?.Department} - {currentUser?.Position}</p>
                    </div>
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 overflow-hidden border border-blue-200">
                        {currentUser?.AvatarUrl ? (
                            <img src={currentUser.AvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-6 h-6" />
                        )}
                    </div>

                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden hidden group-hover:block animate-in fade-in slide-in-from-top-2">
                        <button
                            onClick={logout}
                            className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
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

const Layout: React.FC = () => {
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
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/my-dashboard" element={<PersonalDashboard />} />
                        <Route path="/projects" element={<ProjectList />} />
                        <Route path="/projects/:id" element={<ProjectDetail />} />
                        <Route path="/projects/:projectId/packages/:packageId" element={<PackageDetail />} />
                        <Route path="/tasks" element={<TaskList />} />
                        <Route path="/tasks/:id" element={<TaskDetail />} />
                        <Route path="/employees" element={<EmployeeList />} />
                        <Route path="/employees/:id" element={<EmployeeDetail />} />
                        <Route path="/contractors" element={<ContractorList />} />
                        <Route path="/contractors/:id" element={<ContractorDetail />} />
                        <Route path="/contracts" element={<ContractList />} />
                        <Route path="/contracts/:id" element={<ContractDetail />} />
                        <Route path="/payments" element={<PaymentList />} />
                        <Route path="/documents" element={<DocumentManager />} />
                        <Route path="/reports" element={<ReportCenter />} />
                        <Route path="/regulations" element={<Regulations />} />
                        <Route path="/audit-log" element={<AuditLogViewer />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
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
}

const App: React.FC = () => {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/*" element={<Layout />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
};

export default App;
