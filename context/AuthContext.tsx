
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Employee } from '../types';
import { supabase } from '../lib/supabase';
import { validateCredentials } from '../config/authConfig';

interface AuthContextType {
    currentUser: Employee | null;
    login: (username: string, pass: string) => Promise<boolean>;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<Employee | null>(null);

    // Persist login + Dev bypass
    useEffect(() => {
        const checkAutoLogin = async () => {
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                setCurrentUser(JSON.parse(savedUser));
                return;
            }

            // Dev mode: auto-login as Admin without requiring credentials
            if (import.meta.env.VITE_DEV_BYPASS_AUTH === 'true') {
                console.log('%c[DEV MODE] Auto-login enabled — bypassing authentication', 'color: #f59e0b; font-weight: bold;');
                const success = await login('Admin', '123456');
                if (!success) {
                    console.warn('[DEV MODE] Auto-login failed. Check Supabase connection or employee data.');
                }
            }
        };

        checkAutoLogin();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const login = async (username: string, pass: string): Promise<boolean> => {
        // Validate credentials from authConfig (Bypass in Dev mode for Admin)
        const isDevBypass = import.meta.env.VITE_DEV_BYPASS_AUTH === 'true' && username === 'Admin';

        const employeeId = isDevBypass ? 'ADMIN-DEV' : validateCredentials(username, pass);
        if (!employeeId) return false;

        let user: Employee;

        if (isDevBypass) {
            user = {
                EmployeeID: 'ADMIN-DEV',
                FullName: 'Administrator (Dev)',
                Role: 'Admin' as any,
                Department: 'System',
                Position: 'Root',
                Email: 'admin@cic.vn',
                Phone: '0123456789',
                AvatarUrl: 'https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff',
                JoinDate: new Date().toISOString().split('T')[0],
                Status: 'Active' as any,
                Username: username,
                Password: '',
            };
        } else {
            // Fetch employee profile from Supabase
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('employee_id', employeeId)
                .single();

            if (error || !data) {
                console.error('Failed to fetch employee from Supabase:', error);
                return false;
            }

            // Map DB snake_case to frontend camelCase
            user = {
                EmployeeID: data.employee_id,
                FullName: data.full_name,
                Role: data.role as any,
                Department: data.department || '',
                Position: data.position || '',
                Email: data.email || '',
                Phone: data.phone || '',
                AvatarUrl: data.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.full_name)}&background=0D8ABC&color=fff`,
                JoinDate: data.join_date || '',
                Status: data.status as any || 'Active',
                Username: username,
                Password: '', // Don't store password
            };
        }

        setCurrentUser(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        return true;
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem('currentUser');
    };

    return (
        <AuthContext.Provider value={{ currentUser, login, logout, isAuthenticated: !!currentUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
