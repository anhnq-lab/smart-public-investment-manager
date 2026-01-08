
import React, { useState, useEffect } from 'react';
import {
    Landmark, TrendingUp, AlertTriangle, FileText,
    Plus, Download, DollarSign, Calendar, PieChart
} from 'lucide-react';
import { CapitalPlan, Disbursement } from '../types';
import { CapitalService, DisbursementAlert } from '../services/CapitalService';
import { formatFullCurrency } from '../mockData';

interface CapitalManagerProps {
    projectId: string;
}

export const CapitalManager: React.FC<CapitalManagerProps> = ({ projectId }) => {
    const [plans, setPlans] = useState<CapitalPlan[]>([]);
    const [disbursements, setDisbursements] = useState<Disbursement[]>([]);
    const [stats, setStats] = useState({ totalPlanned: 0, totalDisbursed: 0, rate: 0 });
    const [alerts, setAlerts] = useState<DisbursementAlert[]>([]);

    useEffect(() => {
        const loadData = () => {
            setPlans(CapitalService.getCapitalPlans(projectId));
            setDisbursements(CapitalService.getDisbursements(projectId));
            setStats(CapitalService.getFinancialStats(projectId));
            setAlerts(CapitalService.getAlerts(projectId));
        };
        loadData();
    }, [projectId]);

    return (
        <div className="space-y-6">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Landmark className="w-5 h-5" /></div>
                        <span className="text-xs font-black text-gray-400 uppercase tracking-wider">KẾ HOẠCH VỐN</span>
                    </div>
                    <div>
                        <p className="text-2xl font-black text-gray-800">{formatFullCurrency(stats.totalPlanned)}</p>
                        <p className="text-xs text-gray-500 mt-1 font-medium">Tổng vốn được giao</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><DollarSign className="w-5 h-5" /></div>
                        <span className="text-xs font-black text-gray-400 uppercase tracking-wider">ĐÃ GIẢI NGÂN</span>
                    </div>
                    <div>
                        <p className="text-2xl font-black text-emerald-600">{formatFullCurrency(stats.totalDisbursed)}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500" style={{ width: `${stats.rate}%` }}></div>
                            </div>
                            <span className="text-xs font-bold text-gray-600">{stats.rate.toFixed(1)}%</span>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><AlertTriangle className="w-5 h-5" /></div>
                        <span className="text-xs font-black text-gray-400 uppercase tracking-wider">CẢNH BÁO</span>
                    </div>
                    <div>
                        {alerts.length > 0 ? (
                            alerts.map((alert, idx) => (
                                <div key={idx} className="bg-orange-50 border border-orange-100 p-2 rounded-lg mb-2 last:mb-0">
                                    <p className="text-[10px] font-bold text-orange-700 leading-tight">{alert.Message}</p>
                                    {alert.Deadline && <p className="text-[9px] text-orange-500 mt-1">Hạn: {alert.Deadline}</p>}
                                </div>
                            ))
                        ) : (
                            <p className="text-sm font-bold text-gray-400">Không có cảnh báo rủi ro.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Plans Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-600" /> Kế hoạch vốn (Trung hạn & Hàng năm)
                    </h3>
                    <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-lg shadow-sm flex items-center gap-2 transition-all">
                        <Plus className="w-3.5 h-3.5" /> Bổ sung vốn
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-bold text-[10px] uppercase border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4">Năm / Mã KH</th>
                                <th className="px-6 py-4">Quyết định số</th>
                                <th className="px-6 py-4 text-right">Vốn giao</th>
                                <th className="px-6 py-4 text-right">Đã giải ngân</th>
                                <th className="px-6 py-4 text-right">Tỷ lệ</th>
                                <th className="px-6 py-4">Nguồn vốn</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {plans.map((plan) => (
                                <tr key={plan.PlanID} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-black text-gray-800">{plan.Year}</p>
                                        <p className="text-[10px] text-gray-400 font-mono">{plan.PlanID}</p>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 font-medium">
                                        {plan.DecisionNumber}
                                        <div className="text-[10px] text-gray-400 italic">Ngày: {plan.DateAssigned}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono font-bold text-blue-700">{formatFullCurrency(plan.Amount)}</td>
                                    <td className="px-6 py-4 text-right font-mono font-medium text-emerald-600">{formatFullCurrency(plan.DisbursedAmount)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${(plan.DisbursedAmount / plan.Amount) >= 0.9 ? 'bg-emerald-100 text-emerald-600' :
                                                (plan.DisbursedAmount / plan.Amount) >= 0.5 ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                                            }`}>
                                            {((plan.DisbursedAmount / plan.Amount) * 100).toFixed(1)}%
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-bold text-gray-500">{plan.Source}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Disbursement History */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-600" /> Lịch sử giải ngân (KBNN)
                    </h3>
                    <div className="flex gap-2">
                        <button className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-[10px] font-bold rounded-lg flex items-center gap-2 transition-all">
                            <FileText className="w-3.5 h-3.5" /> Xuất mẫu 03a
                        </button>
                        <button className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg shadow-sm flex items-center gap-2 transition-all">
                            <Plus className="w-3.5 h-3.5" /> Đề nghị thanh toán mới
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-bold text-[10px] uppercase border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4">Mã giao dịch</th>
                                <th className="px-6 py-4">Ngày giao dịch</th>
                                <th className="px-6 py-4">Nội dung / Kế hoạch</th>
                                <th className="px-6 py-4 text-center">Biểu mẫu</th>
                                <th className="px-6 py-4 text-right">Giá trị giải ngân</th>
                                <th className="px-6 py-4 text-center">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {disbursements.map((d) => (
                                <tr key={d.DisbursementID} className="hover:bg-emerald-50/30 transition-colors">
                                    <td className="px-6 py-4 font-mono font-bold text-gray-800">{d.TreasuryCode}</td>
                                    <td className="px-6 py-4 text-gray-600">{d.Date}</td>
                                    <td className="px-6 py-4">
                                        <p className="font-semibold text-gray-800">{d.CapitalPlanID}</p>
                                        <p className="text-[10px] text-gray-400 italic">Thanh toán đợt...</p>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="px-2 py-1 bg-gray-100 border border-gray-200 text-gray-600 rounded text-[10px] font-mono font-bold">{d.FormType}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono font-black text-emerald-600">{formatFullCurrency(d.Amount)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wide">
                                            {d.Status === 'Approved' ? 'Đã duyệt' : d.Status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
