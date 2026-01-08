// Employee Service - CRUD operations for Employees
import api from './api';
import { mockEmployees } from '../mockData';
import { Employee, EmployeeStatus, Role } from '../types';
import type { QueryParams } from '../types/api';

const EMPLOYEES_STORAGE_KEY = 'app_employees';

const loadEmployeesFromStorage = (): Employee[] => {
    try {
        const saved = localStorage.getItem(EMPLOYEES_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
    } catch (e) {
        console.error('Failed to load employees from storage', e);
    }
    return mockEmployees;
};

const saveEmployeesToStorage = (employees: Employee[]): void => {
    try {
        localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(employees));
    } catch (e) {
        console.error('Failed to save employees to storage', e);
    }
};

export class EmployeeService {
    /**
     * Get all employees with optional filtering
     */
    static async getAll(params?: QueryParams): Promise<Employee[]> {
        return api.get('/employees', () => {
            let employees = loadEmployeesFromStorage();

            if (params?.search) {
                const searchLower = params.search.toLowerCase();
                employees = employees.filter(e =>
                    e.FullName.toLowerCase().includes(searchLower) ||
                    e.Department.toLowerCase().includes(searchLower) ||
                    e.Email.toLowerCase().includes(searchLower)
                );
            }

            if (params?.filters?.department) {
                employees = employees.filter(e => e.Department === params.filters!.department);
            }

            if (params?.filters?.status !== undefined) {
                employees = employees.filter(e => e.Status === params.filters!.status);
            }

            if (params?.filters?.role) {
                employees = employees.filter(e => e.Role === params.filters!.role);
            }

            return employees;
        }, params);
    }

    /**
     * Get a single employee by ID
     */
    static async getById(id: string): Promise<Employee | undefined> {
        return api.get(`/employees/${id}`, () => {
            const employees = loadEmployeesFromStorage();
            return employees.find(e => e.EmployeeID === id);
        });
    }

    /**
     * Get employees by department
     */
    static async getByDepartment(department: string): Promise<Employee[]> {
        return this.getAll({ filters: { department } });
    }

    /**
     * Get employee name by ID (sync helper)
     */
    static getNameById(id: string): string {
        const employees = loadEmployeesFromStorage();
        const employee = employees.find(e => e.EmployeeID === id);
        return employee?.FullName || 'Unknown';
    }

    /**
     * Create a new employee
     */
    static async create(employeeData: Partial<Employee>): Promise<Employee> {
        return api.post('/employees', employeeData, () => {
            const employees = loadEmployeesFromStorage();

            // Generate new ID
            const maxId = Math.max(...employees.map(e => parseInt(e.EmployeeID.replace('NV', ''))));
            const newId = `NV${maxId + 1}`;

            const newEmployee: Employee = {
                EmployeeID: newId,
                FullName: employeeData.FullName || 'Nhân viên mới',
                Department: employeeData.Department || 'Phòng Hành chính - Tổng hợp',
                Position: employeeData.Position || 'Nhân viên',
                Email: employeeData.Email || '',
                Phone: employeeData.Phone || '',
                AvatarUrl: employeeData.AvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(employeeData.FullName || 'NV')}&background=random&color=fff`,
                Status: employeeData.Status ?? EmployeeStatus.Active,
                JoinDate: employeeData.JoinDate || new Date().toISOString().split('T')[0],
                Username: employeeData.Username || newId,
                Password: employeeData.Password || '123456',
                Role: employeeData.Role || Role.Staff,
                ...employeeData,
                EmployeeID: newId,
            };

            const updatedEmployees = [newEmployee, ...employees];
            saveEmployeesToStorage(updatedEmployees);

            return newEmployee;
        });
    }

    /**
     * Update an existing employee
     */
    static async update(id: string, data: Partial<Employee>): Promise<Employee> {
        return api.put(`/employees/${id}`, data, () => {
            const employees = loadEmployeesFromStorage();
            const index = employees.findIndex(e => e.EmployeeID === id);

            if (index === -1) {
                throw new Error(`Employee ${id} not found`);
            }

            const updatedEmployee = { ...employees[index], ...data };
            employees[index] = updatedEmployee;
            saveEmployeesToStorage(employees);

            // Update current user in localStorage if it's the same user
            const currentUser = localStorage.getItem('currentUser');
            if (currentUser) {
                const parsed = JSON.parse(currentUser);
                if (parsed.EmployeeID === id) {
                    localStorage.setItem('currentUser', JSON.stringify(updatedEmployee));
                }
            }

            return updatedEmployee;
        });
    }

    /**
     * Delete an employee
     */
    static async delete(id: string): Promise<void> {
        return api.delete(`/employees/${id}`, () => {
            const employees = loadEmployeesFromStorage();
            const filtered = employees.filter(e => e.EmployeeID !== id);
            saveEmployeesToStorage(filtered);
        });
    }

    /**
     * Get unique departments
     */
    static async getDepartments(): Promise<string[]> {
        const employees = await this.getAll();
        return [...new Set(employees.map(e => e.Department))];
    }

    /**
     * Get employee count by department
     */
    static async getStatistics(): Promise<{
        total: number;
        active: number;
        byDepartment: Record<string, number>;
        byRole: Record<Role, number>;
    }> {
        return api.get('/employees/statistics', () => {
            const employees = loadEmployeesFromStorage();

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

            return {
                total: employees.length,
                active,
                byDepartment,
                byRole,
            };
        });
    }
}

export default EmployeeService;
