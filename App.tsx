
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';

// Auth Features
import Login from './features/auth/Login';

// Dashboard Features
import Dashboard from './features/dashboard/Dashboard';
import PersonalDashboard from './features/dashboard/PersonalDashboard';

// Projects Features
import ProjectList from './features/projects/ProjectList';
import ProjectDetail from './features/projects/ProjectDetail';
import PackageDetail from './features/projects/PackageDetail';

// Contracts Features
import ContractList from './features/contracts/ContractList';
import ContractDetail from './features/contracts/ContractDetail';
import ContractorList from './features/contractors/ContractorList';
import ContractorDetail from './features/contractors/ContractorDetail';

// HR Features
import EmployeeList from './features/employees/EmployeeList';
import EmployeeDetail from './features/employees/EmployeeDetail';

// Task Features
import TaskList from './features/tasks/TaskList';
import TaskDetail from './features/tasks/TaskDetail';

// Finance Features
import PaymentList from './features/payments/PaymentList';

// Core Features (Documents, Reports, etc.)
import DocumentManager from './features/documents/DocumentManager';
import ReportCenter from './features/reports/ReportCenter';
import Regulations from './features/regulations/Regulations';
import AuditLogViewer from './features/admin/AuditLogViewer';

const App: React.FC = () => {
    return (
        <AuthProvider>
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
                        <Route path="reports" element={<ReportCenter />} />
                        <Route path="regulations" element={<Regulations />} />

                        {/* Admin */}
                        <Route path="audit-log" element={<AuditLogViewer />} />

                        {/* Fallback */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                </Routes>
            </Router>
        </AuthProvider>
    );
};

export default App;
