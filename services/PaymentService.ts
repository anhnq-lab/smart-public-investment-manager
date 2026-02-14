// Payment Service - Supabase CRUD operations
import { supabase } from '../lib/supabase';
import { dbToPayment, paymentToDb } from '../lib/dbMappers';
import { Payment, PaymentType, PaymentStatus } from '../types';
import type { QueryParams } from '../types/api';

export class PaymentService {
    /**
     * Get all payments with optional filtering
     */
    static async getAll(params?: QueryParams): Promise<Payment[]> {
        let query = supabase.from('payments').select('*');

        if (params?.filters?.contractId) {
            query = query.eq('contract_id', params.filters.contractId);
        }

        if (params?.filters?.type) {
            query = query.eq('type', params.filters.type);
        }

        if (params?.filters?.status) {
            query = query.eq('status', params.filters.status);
        }

        const { data, error } = await query.order('batch_no', { ascending: true });
        if (error) throw new Error(`Failed to fetch payments: ${error.message}`);
        return (data || []).map(dbToPayment);
    }

    /**
     * Get a single payment by ID
     */
    static async getById(id: number): Promise<Payment | undefined> {
        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('payment_id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return undefined;
            throw new Error(`Failed to fetch payment: ${error.message}`);
        }
        return data ? dbToPayment(data) : undefined;
    }

    /**
     * Get payments by contract ID
     */
    static async getByContractId(contractId: string): Promise<Payment[]> {
        return this.getAll({ filters: { contractId } });
    }

    /**
     * Create a new payment
     */
    static async create(paymentData: Partial<Payment>): Promise<Payment> {
        // Get next batch number for this contract
        let nextBatch = 1;
        if (paymentData.ContractID) {
            const { data: existingPayments } = await supabase
                .from('payments')
                .select('batch_no')
                .eq('contract_id', paymentData.ContractID)
                .order('batch_no', { ascending: false })
                .limit(1);

            if (existingPayments && existingPayments.length > 0) {
                nextBatch = existingPayments[0].batch_no + 1;
            }
        }

        const insertData = paymentToDb({
            ContractID: paymentData.ContractID || '',
            BatchNo: paymentData.BatchNo || nextBatch,
            Type: paymentData.Type || PaymentType.Volume,
            Amount: paymentData.Amount || 0,
            Status: paymentData.Status || PaymentStatus.Pending,
            ...paymentData,
        });

        const { data, error } = await supabase
            .from('payments')
            .insert(insertData)
            .select()
            .single();

        if (error) throw new Error(`Failed to create payment: ${error.message}`);
        return dbToPayment(data);
    }

    /**
     * Update an existing payment
     */
    static async update(id: number, data: Partial<Payment>): Promise<Payment> {
        const updateData = paymentToDb(data);

        const { data: updated, error } = await supabase
            .from('payments')
            .update(updateData)
            .eq('payment_id', id)
            .select()
            .single();

        if (error) throw new Error(`Failed to update payment: ${error.message}`);
        return dbToPayment(updated);
    }

    /**
     * Delete a payment
     */
    static async delete(id: number): Promise<void> {
        const { error } = await supabase
            .from('payments')
            .delete()
            .eq('payment_id', id);

        if (error) throw new Error(`Failed to delete payment: ${error.message}`);
    }

    /**
     * Get payment statistics for a contract
     */
    static async getContractPaymentStats(contractId: string): Promise<{
        totalPaid: number;
        totalPending: number;
        paymentCount: number;
        advanceAmount: number;
        volumeAmount: number;
    }> {
        const payments = await this.getByContractId(contractId);

        let totalPaid = 0;
        let totalPending = 0;
        let advanceAmount = 0;
        let volumeAmount = 0;

        payments.forEach(p => {
            if (p.Status === PaymentStatus.Transferred) {
                totalPaid += p.Amount;
            } else {
                totalPending += p.Amount;
            }

            if (p.Type === PaymentType.Advance) {
                advanceAmount += p.Amount;
            } else {
                volumeAmount += p.Amount;
            }
        });

        return {
            totalPaid,
            totalPending,
            paymentCount: payments.length,
            advanceAmount,
            volumeAmount,
        };
    }

    /**
     * Get type label
     */
    static getTypeLabel(type: PaymentType): string {
        return type === PaymentType.Advance ? 'Tạm ứng' : 'Thanh toán khối lượng';
    }

    /**
     * Get status label
     */
    static getStatusLabel(status: PaymentStatus): string {
        return status === PaymentStatus.Transferred ? 'Đã chuyển tiền' : 'Chờ duyệt';
    }
}

export default PaymentService;
