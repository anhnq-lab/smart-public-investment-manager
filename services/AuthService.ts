// Auth Service - Authentication operations
import api from './api';
import { mockEmployees } from '../mockData';
import { Employee } from '../types';

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
        return api.post('/auth/login', credentials, () => {
            const user = mockEmployees.find(e =>
                (e.Username === credentials.username || e.Email === credentials.username) &&
                e.Password === credentials.password
            );

            if (!user) {
                return null;
            }

            // Store user in localStorage
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));

            return {
                user,
                token: `mock_token_${user.EmployeeID}_${Date.now()}`,
            };
        });
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
     * Change password
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

            if (currentUser.Password !== currentPassword) {
                return { success: false, message: 'Mật khẩu hiện tại không đúng' };
            }

            // Update password in mock data (in real app, this would be server-side)
            currentUser.Password = newPassword;
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));

            return { success: true, message: 'Đổi mật khẩu thành công' };
        });
    }

    /**
     * Request password reset
     */
    static async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
        return api.post('/auth/forgot-password', { email }, () => {
            const user = mockEmployees.find(e => e.Email === email);

            if (!user) {
                return { success: false, message: 'Email không tồn tại trong hệ thống' };
            }

            // In real app, this would send an email
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

        // Simple role-based permission check
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
