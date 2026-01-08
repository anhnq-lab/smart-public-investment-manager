// Payment Service - CRUD operations for Payments
import api from './api';
import { mockPayments } from '../mockData';
import { Payment, PaymentType, PaymentStatus } from '../types';
import type { QueryParams } from '../types/api';

const PAYMENTS_STORAGE_KEY = 'app_payments';

const loadPaymentsFromStorage = (): Payment[] => {
    try {
        const saved = localStorage.getItem(PAYMENTS_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
    } catch (e) {
        console.error('Failed to load payments from storage', e);
    }
    return mockPayments;
};

const savePaymentsToStorage = (payments: Payment[]): void => {
    try {
        localStorage.setItem(PAYMENTS_STORAGE_KEY, JSON.stringify(payments));
    } catch (e) {
        console.error('Failed to save payments to storage', e);
    }
};

export class PaymentService {
    /**
     * Get all payments with optional filtering
     */
    static async getAll(params?: QueryParams): Promise<Payment[]> {
        return api.get('/payments', () => {
            let payments = loadPaymentsFromStorage();

            if (params?.filters?.contractId) {
                payments = payments.filter(p => p.ContractID === params.filters!.contractId);
            }

            if (params?.filters?.type) {
                payments = payments.filter(p => p.Type === params.filters!.type);
            }

            if (params?.filters?.status) {
                payments = payments.filter(p => p.Status === params.filters!.status);
            }

            // Sort by batch number
            payments.sort((a, b) => a.BatchNo - b.BatchNo);

            return payments;
        }, params);
    }

    /**
     * Get a single payment by ID
     */
    static async getById(id: number): Promise<Payment | undefined> {
        return api.get(`/payments/${id}`, () => {
            const payments = loadPaymentsFromStorage();
            return payments.find(p => p.PaymentID === id);
        });
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
        return api.post('/payments', paymentData, () => {
            const payments = loadPaymentsFromStorage();

            // Generate new ID
            const maxId = Math.max(0, ...payments.map(p => p.PaymentID));

            // Get next batch number for this contract
            const contractPayments = payments.filter(p => p.ContractID === paymentData.ContractID);
            const nextBatch = contractPayments.length > 0
                ? Math.max(...contractPayments.map(p => p.BatchNo)) + 1
                : 1;

            const newPayment: Payment = {
                PaymentID: maxId + 1,
                ContractID: paymentData.ContractID || '',
                BatchNo: paymentData.BatchNo || nextBatch,
                Type: paymentData.Type || PaymentType.Volume,
                Amount: paymentData.Amount || 0,
                TreasuryRef: paymentData.TreasuryRef || `TT${Date.now()}`,
                Status: paymentData.Status || PaymentStatus.Pending,
                ...paymentData,
                PaymentID: maxId + 1,
            };

            const updatedPayments = [...payments, newPayment];
            savePaymentsToStorage(updatedPayments);

            return newPayment;
        });
    }

    /**
     * Update an existing payment
     */
    static async update(id: number, data: Partial<Payment>): Promise<Payment> {
        return api.put(`/payments/${id}`, data, () => {
            const payments = loadPaymentsFromStorage();
            const index = payments.findIndex(p => p.PaymentID === id);

            if (index === -1) {
                throw new Error(`Payment ${id} not found`);
            }

            const updatedPayment = { ...payments[index], ...data };
            payments[index] = updatedPayment;
            savePaymentsToStorage(payments);

            return updatedPayment;
        });
    }

    /**
     * Delete a payment
     */
    static async delete(id: number): Promise<void> {
        return api.delete(`/payments/${id}`, () => {
            const payments = loadPaymentsFromStorage();
            const filtered = payments.filter(p => p.PaymentID !== id);
            savePaymentsToStorage(filtered);
        });
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
        return api.get(`/payments/stats/${contractId}`, () => {
            const payments = loadPaymentsFromStorage().filter(p => p.ContractID === contractId);

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
        });
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
