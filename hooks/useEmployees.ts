import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EmployeeService } from '../services/EmployeeService';
import { Employee } from '../types';
import { QueryParams } from '../types/api';

// Keys
export const employeeKeys = {
    all: ['employees'] as const,
    lists: () => [...employeeKeys.all, 'list'] as const,
    list: (params: QueryParams) => [...employeeKeys.lists(), { params }] as const,
    details: () => [...employeeKeys.all, 'detail'] as const,
    detail: (id: string) => [...employeeKeys.details(), id] as const,
    stats: () => [...employeeKeys.all, 'stats'] as const,
    departments: () => [...employeeKeys.all, 'departments'] as const,
};

// Hooks

export const useEmployees = (params?: QueryParams) => {
    return useQuery({
        queryKey: employeeKeys.list(params || {}),
        queryFn: () => EmployeeService.getAll(params),
        staleTime: 5 * 60 * 1000, // 5 mins
    });
};

export const useEmployee = (id: string) => {
    return useQuery({
        queryKey: employeeKeys.detail(id),
        queryFn: () => EmployeeService.getById(id),
        enabled: !!id,
    });
};

export const useEmployeeStats = () => {
    return useQuery({
        queryKey: employeeKeys.stats(),
        queryFn: () => EmployeeService.getStatistics(),
    });
};

export const useDepartments = () => {
    return useQuery({
        queryKey: employeeKeys.departments(),
        queryFn: () => EmployeeService.getDepartments(),
        staleTime: 24 * 60 * 60 * 1000, // 24 hours
    });
};

export const useCreateEmployee = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Partial<Employee>) => EmployeeService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
            queryClient.invalidateQueries({ queryKey: employeeKeys.stats() });
            queryClient.invalidateQueries({ queryKey: employeeKeys.departments() });
        },
    });
};

export const useUpdateEmployee = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Employee> }) => EmployeeService.update(id, data),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: employeeKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
            queryClient.invalidateQueries({ queryKey: employeeKeys.stats() });
        },
    });
};

export const useDeleteEmployee = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => EmployeeService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
            queryClient.invalidateQueries({ queryKey: employeeKeys.stats() });
        },
    });
};
