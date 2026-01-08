import React, { useState } from 'react';
import { mockPayments, formatCurrency } from '../mockData';
import { PaymentType, PaymentStatus, Payment } from '../types';
import { PaymentForm } from './PaymentForm';
import { CreditCard, Download, Filter, TrendingUp } from 'lucide-react';

const PaymentList: React.FC = () => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [payments, setPayments] = useState<Payment[]>(mockPayments);
    const [filterStatus, setFilterStatus] = useState<'all' | PaymentStatus>('all');

    const handleCreatePayment = (newPayment: Payment) => {
        setPayments(prev => [newPayment, ...prev]);
    };

    const filteredPayments = filterStatus === 'all'
        ? payments
        : payments.filter(p => p.Status === filterStatus);

    const totalAmount = filteredPayments.reduce((sum, p) => sum + p.Amount, 0);
    const transferredAmount = payments.filter(p => p.Status === PaymentStatus.Transferred).reduce((sum, p) => sum + p.Amount, 0);
    const pendingAmount = payments.filter(p => p.Status === PaymentStatus.Pending).reduce((sum, p) => sum + p.Amount, 0);

    return (
        <>
            <div className="space-y-6 animate-in fade-in duration-300">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Thanh toán & Giải ngân</h2>
                        <p className="text-sm text-gray-500 mt-1">Lịch sử giao dịch với Kho bạc Nhà nước</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2">
                            <Download className="w-4 h-4" />
                            Xuất Excel
                        </button>
                        <button
                            onClick={() => setIsFormOpen(true)}
                            className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 flex items-center gap-2"
                        >
                            <CreditCard className="w-4 h-4" />
                            Tạo phiếu thanh toán
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng giải ngân</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalAmount)}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Đã chuyển tiền</p>
                                <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(transferredAmount)}</p>
                            </div>
                            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                                <CreditCard className="w-6 h-6 text-emerald-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Đang chờ duyệt</p>
                                <p className="text-2xl font-bold text-amber-600 mt-1">{formatCurrency(pendingAmount)}</p>
                            </div>
                            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                                <Filter className="w-6 h-6 text-amber-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Filter Bar */}
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-4">
                        <span className="text-xs font-bold text-gray-500 uppercase">Lọc theo:</span>
                        <div className="flex gap-2">
                            {[
                                { value: 'all', label: 'Tất cả' },
                                { value: PaymentStatus.Transferred, label: 'Đã chuyển' },
                                { value: PaymentStatus.Pending, label: 'Chờ duyệt' }
                            ].map(option => (
                                <button
                                    key={option.value}
                                    onClick={() => setFilterStatus(option.value as any)}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${filterStatus === option.value
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                        <span className="ml-auto text-xs text-gray-400">{filteredPayments.length} phiếu</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
                                <tr>
                                    <th className="px-6 py-4">Mã TT</th>
                                    <th className="px-6 py-4">Số hợp đồng</th>
                                    <th className="px-6 py-4 text-center">Đợt</th>
                                    <th className="px-6 py-4">Loại thanh toán</th>
                                    <th className="px-6 py-4">Mã giao dịch KB</th>
                                    <th className="px-6 py-4 text-right">Số tiền</th>
                                    <th className="px-6 py-4 text-center">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredPayments.map((payment) => (
                                    <tr key={payment.PaymentID} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-gray-500">#{payment.PaymentID}</td>
                                        <td className="px-6 py-4 font-medium">{payment.ContractID}</td>
                                        <td className="px-6 py-4 text-center">{payment.BatchNo}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${payment.Type === PaymentType.Advance ? 'bg-purple-50 text-purple-700' : 'bg-cyan-50 text-cyan-700'
                                                }`}>
                                                {payment.Type === PaymentType.Advance ? 'Tạm ứng' : 'Khối lượng'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs">{payment.TreasuryRef}</td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-900">{formatCurrency(payment.Amount)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${payment.Status === PaymentStatus.Transferred ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {payment.Status === PaymentStatus.Transferred && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
                                                {payment.Status === PaymentStatus.Transferred ? 'Đã chuyển' : 'Chờ duyệt'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Payment Form Modal */}
            <PaymentForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSubmit={handleCreatePayment}
            />
        </>
    );
};

export default PaymentList;

