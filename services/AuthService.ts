// Auth Service - Authentication operations
import api from './api';
import { Employee } from '../types';
import { supabase } from '../lib/supabase';
import { validateCredentials } from '../config/authConfig';

const CURRENT_USER_KEY = 'currentUser';

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface LoginResponse {
    user: Employee;
    token?: string;
}

export class AuthService {
    /**
     * Login with username and password
     */
    static async login(credentials: LoginCredentials): Promise<LoginResponse | null> {
        // Validate credentials
        const employeeId = validateCredentials(credentials.username, credentials.password);
        if (!employeeId) return null;

        // Fetch employee from Supabase
        const { data, error } = await supabase
            .from('employees')
            .select('*')
            .eq('employee_id', employeeId)
            .single();

        if (error || !data) {
            console.error('Failed to fetch employee:', error);
            return null;
        }

        const user: Employee = {
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
            Username: credentials.username,
            Password: '',
        };

        // Store user in localStorage
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));

        return {
            user,
            token: `mock_token_${user.EmployeeID}_${Date.now()}`,
        };
    }

    /**
     * Logout current user
     */
    static async logout(): Promise<void> {
        return api.post('/auth/logout', {}, () => {
            localStorage.removeItem(CURRENT_USER_KEY);
        });
    }

    /**
     * Get current authenticated user
     */
    static getCurrentUser(): Employee | null {
        try {
            const saved = localStorage.getItem(CURRENT_USER_KEY);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error('Failed to get current user', e);
        }
        return null;
    }

    /**
     * Check if user is authenticated
     */
    static isAuthenticated(): boolean {
        return this.getCurrentUser() !== null;
    }

    /**
     * Update current user data
     */
    static updateCurrentUser(updates: Partial<Employee>): Employee | null {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return null;

        const updatedUser = { ...currentUser, ...updates };
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
        return updatedUser;
    }

    /**
     * Change password (stub - will be replaced by Supabase Auth)
     */
    static async changePassword(
        currentPassword: string,
        newPassword: string
    ): Promise<{ success: boolean; message: string }> {
        return api.post('/auth/change-password', { currentPassword, newPassword }, () => {
            const currentUser = this.getCurrentUser();

            if (!currentUser) {
                return { success: false, message: 'Chưa đăng nhập' };
            }

            // TODO: Implement with Supabase Auth
            return { success: true, message: 'Đổi mật khẩu thành công' };
        });
    }

    /**
     * Request password reset
     */
    static async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
        return api.post('/auth/forgot-password', { email }, () => {
            // TODO: Implement with Supabase Auth
            return { success: true, message: 'Đã gửi email hướng dẫn đặt lại mật khẩu' };
        });
    }

    /**
     * Check if current user has admin role
     */
    static isAdmin(): boolean {
        const user = this.getCurrentUser();
        return user?.Role === 'Admin';
    }

    /**
     * Check if current user has specific permission
     */
    static hasPermission(permission: string): boolean {
        const user = this.getCurrentUser();
        if (!user) return false;

        const adminPermissions = ['*'];
        const managerPermissions = ['read', 'write', 'manage_team'];
        const staffPermissions = ['read', 'write'];

        switch (user.Role) {
            case 'Admin':
                return adminPermissions.includes('*') || adminPermissions.includes(permission);
            case 'Manager':
                return managerPermissions.includes(permission);
            default:
                return staffPermissions.includes(permission);
        }
    }
}

export default AuthService;
