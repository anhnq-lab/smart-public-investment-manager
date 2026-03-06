
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import MainLayout from './layouts/MainLayout';

// Auth Features (eager load - needed immediately)
import Login from './features/auth/Login';

// Lazy-loaded Feature Modules (code splitting)
const Dashboard = React.lazy(() => import('./features/dashboard/Dashboard'));
const PersonalDashboard = React.lazy(() => import('./features/dashboard/PersonalDashboard'));
const ProjectList = React.lazy(() => import('./features/projects/ProjectList'));
const ProjectDetail = React.lazy(() => import('./features/projects/ProjectDetail'));
const PackageDetail = React.lazy(() => import('./features/projects/PackageDetail'));
const ContractList = React.lazy(() => import('./features/contracts/ContractList'));
const ContractDetail = React.lazy(() => import('./features/contracts/ContractDetail'));
const ContractorList = React.lazy(() => import('./features/contractors/ContractorList'));
const ContractorDetail = React.lazy(() => import('./features/contractors/ContractorDetail'));
const EmployeeList = React.lazy(() => import('./features/employees/EmployeeList'));
const EmployeeDetail = React.lazy(() => import('./features/employees/EmployeeDetail'));
const TaskList = React.lazy(() => import('./features/tasks/TaskList'));
const TaskDetail = React.lazy(() => import('./features/tasks/TaskDetail'));
const PaymentList = React.lazy(() => import('./features/payments/PaymentList'));
const DocumentManager = React.lazy(() => import('./features/documents/DocumentManager'));
const CDEPage = React.lazy(() => import('./features/cde/CDEPage'));
const ReportCenter = React.lazy(() => import('./features/reports/ReportCenter'));
const Regulations = React.lazy(() => import('./features/regulations/Regulations'));
const LegalDocumentSearch = React.lazy(() => import('./features/legal-documents/LegalDocumentSearch'));
const Settings = React.lazy(() => import('./features/settings/Settings'));
const AuditLogViewer = React.lazy(() => import('./features/admin/AuditLogViewer'));
const UserAccountManager = React.lazy(() => import('./features/admin/UserAccountManager'));

import { ToastProvider } from './components/ui/Toast';

import { QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query';

const mutationCache = new MutationCache({
    onError: (error) => {
        console.error('[Global Mutation Error]', error);
    },
});

const queryClient = new QueryClient({
    mutationCache,
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 1,
        },
    },
});

const App: React.FC = () => {
    return (
        <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <ThemeProvider>
                    <AuthProvider>
                        <ToastProvider>
                            <Router>
                                <Routes>
                                    <Route path="/login" element={<Login />} />

                                    {/* Protected Routes inside MainLayout */}
                                    <Route path="/" element={<MainLayout />}>
                                        <Route index element={<Dashboard />} />
                                        <Route path="my-dashboard" element={<PersonalDashboard />} />

                                        {/* Projects Routes */}
                                        <Route path="projects" element={<ProjectList />} />
                                        <Route path="projects/:id" element={<ProjectDetail />} />
                                        <Route path="projects/:projectId/packages/:packageId" element={<PackageDetail />} />

                                        {/* Tasks Routes */}
                                        <Route path="tasks" element={<TaskList />} />
                                        <Route path="tasks/:id" element={<TaskDetail />} />

                                        {/* HR Routes */}
                                        <Route path="employees" element={<EmployeeList />} />
                                        <Route path="employees/:id" element={<EmployeeDetail />} />

                                        {/* Contractor Routes */}
                                        <Route path="contractors" element={<ContractorList />} />
                                        <Route path="contractors/:id" element={<ContractorDetail />} />

                                        {/* Contract Routes */}
                                        <Route path="contracts" element={<ContractList />} />
                                        <Route path="contracts/:id" element={<ContractDetail />} />

                                        {/* Finance Routes */}
                                        <Route path="payments" element={<PaymentList />} />

                                        {/* Documents & Reports */}
                                        <Route path="documents" element={<DocumentManager />} />
                                        <Route path="cde" element={<CDEPage />} />
                                        <Route path="legal-documents" element={<LegalDocumentSearch />} />
                                        <Route path="reports" element={<ReportCenter />} />
                                        <Route path="regulations" element={<Regulations />} />

                                        {/* Admin */}
                                        <Route path="audit-log" element={<AuditLogViewer />} />
                                        <Route path="user-accounts" element={<UserAccountManager />} />

                                        {/* Settings */}
                                        <Route path="settings" element={<Settings />} />

                                        {/* Fallback */}
                                        <Route path="*" element={<Navigate to="/" replace />} />
                                    </Route>
                                </Routes>
                            </Router>
                        </ToastProvider>
                    </AuthProvider>
                </ThemeProvider>
            </QueryClientProvider>
        </ErrorBoundary>
    );
};

export default App;
