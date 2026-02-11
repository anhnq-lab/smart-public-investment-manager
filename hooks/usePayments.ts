import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PaymentService } from '../services/PaymentService';
import { Payment } from '../types';

export const paymentKeys = {
    all: ['payments'] as const,
    byContract: (contractId: string) => ['payments', 'contract', contractId] as const,
};

export const usePayments = () => {
    const { data: payments = [], isLoading, error, refetch } = useQuery<Payment[]>({
        queryKey: paymentKeys.all,
        queryFn: () => PaymentService.getAll(),
    });

    return { payments, isLoading, error, refetch };
};

export const useCreatePayment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Partial<Payment>) => PaymentService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: paymentKeys.all });
        },
    });
};

export const useUpdatePayment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<Payment> }) => PaymentService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: paymentKeys.all });
        },
    });
};

export const useDeletePayment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => PaymentService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: paymentKeys.all });
        },
    });
};
