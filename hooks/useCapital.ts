import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CapitalService } from '../services/CapitalService';
import { CapitalPlan, Disbursement } from '../types';

export const useCapitalPlans = (projectId: string) => {
    return useQuery({
        queryKey: ['capitalPlans', projectId],
        queryFn: () => CapitalService.getCapitalPlans(projectId),
        enabled: !!projectId
    });
};

export const useDisbursements = (projectId: string) => {
    return useQuery({
        queryKey: ['disbursements', projectId],
        queryFn: () => CapitalService.getDisbursements(projectId),
        enabled: !!projectId
    });
};

export const useCapitalStats = (projectId: string) => {
    return useQuery({
        queryKey: ['capitalStats', projectId],
        queryFn: () => CapitalService.getFinancialStats(projectId),
        enabled: !!projectId
    });
};

export const useCapitalAlerts = (projectId: string) => {
    return useQuery({
        queryKey: ['capitalAlerts', projectId],
        queryFn: () => CapitalService.getAlerts(projectId),
        enabled: !!projectId
    });
};
