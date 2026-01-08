// Custom hook for Employees data fetching
import { useState, useEffect, useCallback } from 'react';
import { EmployeeService } from '../services/EmployeeService';
import { Employee, EmployeeStatus } from '../types';
import type { QueryParams } from '../types/api';

interface UseEmployeesOptions {
    autoFetch?: boolean;
    department?: string;
}

interface UseEmployeesResult {
    employees: Employee[];
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
    search: (query: string) => Promise<void>;
    filterByDepartment: (department: string | null) => Promise<void>;
    create: (data: Partial<Employee>) => Promise<Employee>;
    update: (id: string, data: Partial<Employee>) => Promise<Employee>;
    remove: (id: string) => Promise<void>;
}

/**
 * Hook to fetch and manage employees list
 */
export const useEmployees = (options: UseEmployeesOptions = {}): UseEmployeesResult => {
    const { autoFetch = true, department } = options;

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [params, setParams] = useState<QueryParams>({
        filters: department ? { department } : undefined,
    });

    const fetchEmployees = useCallback(async (queryParams?: QueryParams) => {
        setLoading(true);
        setError(null);
        try {
            const data = await EmployeeService.getAll(queryParams || params);
            setEmployees(data);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [params]);

    const refetch = useCallback(async () => {
        await fetchEmployees();
    }, [fetchEmployees]);

    const search = useCallback(async (query: string) => {
        const newParams = { ...params, search: query };
        setParams(newParams);
        await fetchEmployees(newParams);
    }, [params, fetchEmployees]);

    const filterByDepartment = useCallback(async (dept: string | null) => {
        const newParams = {
            ...params,
            filters: dept ? { ...params.filters, department: dept } : { ...params.filters, department: undefined },
        };
        setParams(newParams);
        await fetchEmployees(newParams);
    }, [params, fetchEmployees]);

    const create = useCallback(async (data: Partial<Employee>): Promise<Employee> => {
        const newEmployee = await EmployeeService.create(data);
        setEmployees(prev => [newEmployee, ...prev]);
        return newEmployee;
    }, []);

    const update = useCallback(async (id: string, data: Partial<Employee>): Promise<Employee> => {
        const updated = await EmployeeService.update(id, data);
        setEmployees(prev => prev.map(e => e.EmployeeID === id ? updated : e));
        return updated;
    }, []);

    const remove = useCallback(async (id: string): Promise<void> => {
        await EmployeeService.delete(id);
        setEmployees(prev => prev.filter(e => e.EmployeeID !== id));
    }, []);

    useEffect(() => {
        if (autoFetch) {
            fetchEmployees();
        }
    }, [autoFetch]); // eslint-disable-line react-hooks/exhaustive-deps

    return { employees, loading, error, refetch, search, filterByDepartment, create, update, remove };
};

interface UseEmployeeResult {
    employee: Employee | null;
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
    update: (data: Partial<Employee>) => Promise<void>;
}

/**
 * Hook to fetch and manage a single employee
 */
export const useEmployee = (id: string | undefined): UseEmployeeResult => {
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchEmployee = useCallback(async () => {
        if (!id) {
            setEmployee(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const data = await EmployeeService.getById(id);
            setEmployee(data || null);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    const refetch = useCallback(async () => {
        await fetchEmployee();
    }, [fetchEmployee]);

    const update = useCallback(async (data: Partial<Employee>) => {
        if (!id || !employee) return;
        try {
            const updated = await EmployeeService.update(id, data);
            setEmployee(updated);
        } catch (err) {
            setError(err as Error);
            throw err;
        }
    }, [id, employee]);

    useEffect(() => {
        fetchEmployee();
    }, [fetchEmployee]);

    return { employee, loading, error, refetch, update };
};

/**
 * Hook for departments list
 */
export const useDepartments = () => {
    const [departments, setDepartments] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const data = await EmployeeService.getDepartments();
                setDepartments(data);
            } catch (err) {
                console.error('Failed to fetch departments', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDepartments();
    }, []);

    return { departments, loading };
};
