/**
 * UserAccountService — CRUD tài khoản đăng nhập
 * 
 * Login hỗ trợ: username, email, hoặc phone
 * Password hash: SHA-256 (client-side)
 */
import { supabase } from '../lib/supabase';

// ============================================================
// Types
// ============================================================

export interface UserAccount {
    id: string;
    employee_id: string;
    username: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    created_by: string | null;
    last_login: string | null;
    // Joined from employees
    full_name?: string;
    email?: string;
    phone?: string;
    department?: string;
    role?: string;
    avatar_url?: string;
}

export interface CreateAccountInput {
    employee_id: string;
    username: string;
    password: string;
}

// ============================================================
// Helpers
// ============================================================

async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================
// Service
// ============================================================

export class UserAccountService {
    /**
     * Get all user accounts with employee info
     */
    static async getAll(): Promise<UserAccount[]> {
        const { data, error } = await supabase
            .from('user_accounts')
            .select(`
                *,
                employees!inner (
                    full_name,
                    email,
                    phone,
                    department,
                    role,
                    avatar_url
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw new Error(`Failed to fetch user accounts: ${error.message}`);

        return (data || []).map((row: any) => ({
            id: row.id,
            employee_id: row.employee_id,
            username: row.username,
            is_active: row.is_active,
            created_at: row.created_at,
            updated_at: row.updated_at,
            created_by: row.created_by,
            last_login: row.last_login,
            full_name: row.employees?.full_name,
            email: row.employees?.email,
            phone: row.employees?.phone,
            department: row.employees?.department,
            role: row.employees?.role,
            avatar_url: row.employees?.avatar_url,
        }));
    }

    /**
     * Create a new user account
     */
    static async create(input: CreateAccountInput, createdBy?: string): Promise<UserAccount> {
        const password_hash = await hashPassword(input.password);

        const { data, error } = await supabase
            .from('user_accounts')
            .insert({
                employee_id: input.employee_id,
                username: input.username,
                password_hash,
                created_by: createdBy || 'Admin',
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                if (error.message.includes('username')) {
                    throw new Error('Username đã tồn tại');
                }
                if (error.message.includes('employee')) {
                    throw new Error('Nhân viên này đã có tài khoản');
                }
            }
            throw new Error(`Failed to create account: ${error.message}`);
        }

        return data;
    }

    /**
     * Reset password for account
     */
    static async resetPassword(id: string, newPassword: string): Promise<void> {
        const password_hash = await hashPassword(newPassword);

        const { error } = await supabase
            .from('user_accounts')
            .update({ password_hash, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw new Error(`Failed to reset password: ${error.message}`);
    }

    /**
     * Toggle account active status
     */
    static async toggleActive(id: string, is_active: boolean): Promise<void> {
        const { error } = await supabase
            .from('user_accounts')
            .update({ is_active, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw new Error(`Failed to update account status: ${error.message}`);
    }

    /**
     * Delete account
     */
    static async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('user_accounts')
            .delete()
            .eq('id', id);

        if (error) throw new Error(`Failed to delete account: ${error.message}`);
    }

    /**
     * Validate login credentials — supports username, email, or phone
     * Returns employee_id if valid, null otherwise
     */
    static async validateLogin(identifier: string, password: string): Promise<string | null> {
        const password_hash = await hashPassword(password);

        // 1) Try matching by username
        const { data: byUsername } = await supabase
            .from('user_accounts')
            .select('employee_id, is_active')
            .eq('username', identifier)
            .eq('password_hash', password_hash)
            .single();

        if (byUsername) {
            if (!byUsername.is_active) return null;
            // Update last_login
            await supabase
                .from('user_accounts')
                .update({ last_login: new Date().toISOString() })
                .eq('employee_id', byUsername.employee_id);
            return byUsername.employee_id;
        }

        // 2) Try matching by email (look up employee by email, then check account)
        const { data: empByEmail } = await supabase
            .from('employees')
            .select('employee_id')
            .eq('email', identifier)
            .single();

        if (empByEmail) {
            const { data: acctByEmail } = await supabase
                .from('user_accounts')
                .select('employee_id, is_active')
                .eq('employee_id', empByEmail.employee_id)
                .eq('password_hash', password_hash)
                .single();

            if (acctByEmail && acctByEmail.is_active) {
                await supabase
                    .from('user_accounts')
                    .update({ last_login: new Date().toISOString() })
                    .eq('employee_id', acctByEmail.employee_id);
                return acctByEmail.employee_id;
            }
        }

        // 3) Try matching by phone
        const { data: empByPhone } = await supabase
            .from('employees')
            .select('employee_id')
            .eq('phone', identifier)
            .single();

        if (empByPhone) {
            const { data: acctByPhone } = await supabase
                .from('user_accounts')
                .select('employee_id, is_active')
                .eq('employee_id', empByPhone.employee_id)
                .eq('password_hash', password_hash)
                .single();

            if (acctByPhone && acctByPhone.is_active) {
                await supabase
                    .from('user_accounts')
                    .update({ last_login: new Date().toISOString() })
                    .eq('employee_id', acctByPhone.employee_id);
                return acctByPhone.employee_id;
            }
        }

        return null;
    }

    /**
     * Get employees that don't have accounts yet
     */
    static async getEmployeesWithoutAccount(): Promise<{ employee_id: string; full_name: string; email: string; phone: string; department: string }[]> {
        // Get all employee IDs that already have accounts
        const { data: accounts } = await supabase
            .from('user_accounts')
            .select('employee_id');

        const existingIds = (accounts || []).map((a: any) => a.employee_id);

        // Get employees without accounts
        let query = supabase
            .from('employees')
            .select('employee_id, full_name, email, phone, department')
            .eq('status', 1); // Active only

        if (existingIds.length > 0) {
            // Filter out employees that already have accounts
            query = query.not('employee_id', 'in', `(${existingIds.join(',')})`);
        }

        const { data, error } = await query.order('full_name');

        if (error) throw new Error(`Failed to fetch employees: ${error.message}`);
        return data || [];
    }

    /**
     * Generate a random password (8 chars)
     */
    static generatePassword(): string {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        let password = '';
        for (let i = 0; i < 8; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }
}

export default UserAccountService;
