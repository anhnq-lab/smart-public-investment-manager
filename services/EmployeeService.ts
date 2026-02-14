// Employee Service - Supabase CRUD operations
import { supabase } from '../lib/supabase';
import { dbToEmployee, employeeToDb } from '../lib/dbMappers';
import { Employee, EmployeeStatus, Role } from '../types';
import type { QueryParams } from '../types/api';

export class EmployeeService {
    /**
     * Get all employees with optional filtering
     */
    static async getAll(params?: QueryParams): Promise<Employee[]> {
        let query = supabase.from('employees').select('*');

        if (params?.search) {
            const s = params.search;
            query = query.or(`full_name.ilike.%${s}%,department.ilike.%${s}%,email.ilike.%${s}%`);
        }

        if (params?.filters?.department) {
            query = query.eq('department', params.filters.department);
        }

        if (params?.filters?.status !== undefined) {
            query = query.eq('status', params.filters.status);
        }

        if (params?.filters?.role) {
            query = query.eq('role', params.filters.role);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw new Error(`Failed to fetch employees: ${error.message}`);
        return (data || []).map(dbToEmployee);
    }

    /**
     * Get a single employee by ID
     */
    static async getById(id: string): Promise<Employee | undefined> {
        const { data, error } = await supabase
            .from('employees')
            .select('*')
            .eq('employee_id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return undefined; // Not found
            throw new Error(`Failed to fetch employee: ${error.message}`);
        }
        return data ? dbToEmployee(data) : undefined;
    }

    /**
     * Get employees by department
     */
    static async getByDepartment(department: string): Promise<Employee[]> {
        return this.getAll({ filters: { department } });
    }

    /**
     * Get employee name by ID (async version for Supabase)
     */
    static getNameById(id: string): string {
        // Keep sync fallback for UI compatibility — use cached data
        const cached = localStorage.getItem('cached_employees');
        if (cached) {
            try {
                const employees: Employee[] = JSON.parse(cached);
                const found = employees.find(e => e.EmployeeID === id);
                if (found) return found.FullName;
            } catch { /* ignore */ }
        }
        return id || 'Unknown';
    }

    /**
     * Create a new employee
     */
    static async create(employeeData: Partial<Employee>): Promise<Employee> {
        // Generate new ID
        const { count } = await supabase.from('employees').select('*', { count: 'exact', head: true });
        const newId = employeeData.EmployeeID || `NV${(count || 0) + 1}`;

        const insertData = employeeToDb({
            ...employeeData,
            EmployeeID: newId,
            AvatarUrl: employeeData.AvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(employeeData.FullName || 'NV')}&background=random&color=fff`,
            Status: employeeData.Status ?? EmployeeStatus.Active,
            JoinDate: employeeData.JoinDate || new Date().toISOString().split('T')[0],
        });

        const { data, error } = await supabase
            .from('employees')
            .insert(insertData)
            .select()
            .single();

        if (error) throw new Error(`Failed to create employee: ${error.message}`);
        return dbToEmployee(data);
    }

    /**
     * Update an existing employee
     */
    static async update(id: string, data: Partial<Employee>): Promise<Employee> {
        const updateData = employeeToDb(data);

        const { data: updated, error } = await supabase
            .from('employees')
            .update(updateData)
            .eq('employee_id', id)
            .select()
            .single();

        if (error) throw new Error(`Failed to update employee: ${error.message}`);

        const employee = dbToEmployee(updated);

        // Update current user in localStorage if it's the same user
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
            try {
                const parsed = JSON.parse(currentUser);
                if (parsed.EmployeeID === id) {
                    localStorage.setItem('currentUser', JSON.stringify(employee));
                }
            } catch { /* ignore */ }
        }

        return employee;
    }

    /**
     * Delete an employee
     */
    static async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('employees')
            .delete()
            .eq('employee_id', id);

        if (error) throw new Error(`Failed to delete employee: ${error.message}`);
    }

    /**
     * Get unique departments
     */
    static async getDepartments(): Promise<string[]> {
        const employees = await this.getAll();
        return [...new Set(employees.map(e => e.Department))];
    }

    /**
     * Get employee statistics
     */
    static async getStatistics(): Promise<{
        total: number;
        active: number;
        byDepartment: Record<string, number>;
        byRole: Record<Role, number>;
    }> {
        const employees = await this.getAll();

        const byDepartment: Record<string, number> = {};
        const byRole = {
            [Role.Admin]: 0,
            [Role.Manager]: 0,
            [Role.Staff]: 0,
        };

        let active = 0;

        employees.forEach(e => {
            if (e.Status === EmployeeStatus.Active) active++;
            byDepartment[e.Department] = (byDepartment[e.Department] || 0) + 1;
            byRole[e.Role]++;
        });

        // Cache employees for getNameById sync fallback
        localStorage.setItem('cached_employees', JSON.stringify(employees));

        return {
            total: employees.length,
            active,
            byDepartment,
            byRole,
        };
    }
}

export default EmployeeService;
