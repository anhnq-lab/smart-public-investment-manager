import React, { useState, useCallback } from 'react';
import { ShieldCheck, RefreshCw, CheckCircle2, XCircle, AlertCircle, ChevronRight } from 'lucide-react';
import { checkPaymentApproval, checkContractApproval, ApprovalCheckResult } from '../../services/ai/smartApproval';

interface AISmartApprovalProps {
    mode: 'payment' | 'contract';
    contractId?: string;
    projectId?: string;
    amount?: number;
    className?: string;
    onResult?: (result: ApprovalCheckResult) => void;
}

export const AISmartApproval: React.FC<AISmartApprovalProps> = ({
    mode, contractId, projectId, amount = 0, className = '', onResult
}) => {
    const [result, setResult] = useState<ApprovalCheckResult | null>(null);
    const [loading, setLoading] = useState(false);

    const runCheck = useCallback(async () => {
        setLoading(true);
        try {
            let data: ApprovalCheckResult;
            if (mode === 'payment' && contractId) {
                data = await checkPaymentApproval(contractId, amount);
            } else if (mode === 'contract' && projectId) {
                data = await checkContractApproval(projectId, amount);
            } else {
                return;
            }
            setResult(data);
            onResult?.(data);
        } catch (e) {
            console.error('Approval check error:', e);
        } finally {
            setLoading(false);
        }
    }, [mode, contractId, projectId, amount, onResult]);

    const statusIcons = {
        passed: <CheckCircle2 size={12} className="text-emerald-600" />,
        failed: <XCircle size={12} className="text-red-600" />,
        warning: <AlertCircle size={12} className="text-amber-600" />,
        skipped: <span className="text-[10px] text-slate-400">—</span>,
    };

    return (
        <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden ${className}`}>
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${result?.canApprove === true ? 'bg-gradient-to-br from-emerald-500 to-green-500'
                            : result?.canApprove === false ? 'bg-gradient-to-br from-red-500 to-rose-500'
                                : 'bg-gradient-to-br from-indigo-500 to-purple-500'
                        }`}>
                        <ShieldCheck size={14} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                            {mode === 'payment' ? 'Kiểm tra Thanh toán' : 'Kiểm tra Hợp đồng'}
                        </h3>
                        <p className="text-[10px] text-slate-400">Phê duyệt thông minh AI</p>
                    </div>
                </div>
                <button onClick={runCheck} disabled={loading || (!contractId && !projectId)}
                    className="text-[11px] px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1 disabled:opacity-50">
                    {loading ? <RefreshCw size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
                    {loading ? 'Kiểm tra...' : 'Kiểm tra AI'}
                </button>
            </div>

            {result && (
                <div className="p-3 space-y-3">
                    {/* Score + verdict */}
                    <div className={`p-3 rounded-lg text-center ${result.canApprove
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                        }`}>
                        <p className={`text-2xl font-black ${result.canApprove ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
                            {result.score}/100
                        </p>
                        <p className={`text-xs font-bold mt-1 ${result.canApprove ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                            {result.canApprove ? '✅ ĐỦ ĐIỀU KIỆN PHÊ DUYỆT' : '❌ CHƯA ĐỦ ĐIỀU KIỆN'}
                        </p>
                    </div>

                    {/* Check results */}
                    <div className="space-y-1.5">
                        {result.checks.map(check => (
                            <div key={check.id} className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-700/30">
                                <div className="mt-0.5">{statusIcons[check.status]}</div>
                                <div className="flex-1">
                                    <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{check.name}</p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{check.detail}</p>
                                </div>
                                {check.isCritical && (
                                    <span className="text-[8px] px-1 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded font-bold">BẮT BUỘC</span>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Risk flags */}
                    {result.riskFlags.length > 0 && (
                        <div className="space-y-1">
                            {result.riskFlags.map((flag, i) => (
                                <div key={i} className="text-[10px] text-red-600 dark:text-red-400 flex items-center gap-1">
                                    <AlertCircle size={10} /> {flag}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* AI recommendation */}
                    {result.aiRecommendation && (
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/10 rounded-lg border border-indigo-200 dark:border-indigo-800/30 text-[11px] text-indigo-800 dark:text-indigo-300">
                            🤖 {result.aiRecommendation}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AISmartApproval;
