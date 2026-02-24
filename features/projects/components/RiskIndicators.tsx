import React from 'react';
import { AlertTriangle, TrendingDown, Clock, FileWarning, CheckCircle2, AlertCircle } from 'lucide-react';

export interface RiskAlert {
    id: string;
    type: 'critical' | 'warning' | 'info';
    title: string;
    description: string;
    metric?: string;
}

interface RiskIndicatorsProps {
    physicalProgress: number;
    financialProgress: number;
    contractEndDate?: string;
    missingDocs?: string[];
    disbursedPercent?: number;
}

export const RiskIndicators: React.FC<RiskIndicatorsProps> = ({
    physicalProgress,
    financialProgress,
    contractEndDate,
    missingDocs = [],
    disbursedPercent = 0
}) => {
    const alerts: RiskAlert[] = [];

    // Check for schedule delay
    if (physicalProgress < financialProgress - 10) {
        alerts.push({
            id: 'schedule-delay',
            type: 'critical',
            title: 'Tiến độ chậm',
            description: `Tiến độ khối lượng (${physicalProgress}%) thấp hơn giải ngân (${financialProgress}%)`,
            metric: `${(financialProgress - physicalProgress).toFixed(1)}% chênh lệch`
        });
    }

    // Check for budget overrun risk
    if (disbursedPercent > 80 && physicalProgress < 60) {
        alerts.push({
            id: 'budget-risk',
            type: 'warning',
            title: 'Nguy cơ vượt ngân sách',
            description: `Đã giải ngân ${disbursedPercent}% nhưng chỉ hoàn thành ${physicalProgress}%`,
            metric: 'Cần đánh giá lại'
        });
    }

    // Check for contract expiration
    if (contractEndDate) {
        const daysLeft = Math.ceil((new Date(contractEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysLeft > 0 && daysLeft <= 30) {
            alerts.push({
                id: 'contract-expiry',
                type: 'warning',
                title: 'Hợp đồng sắp hết hạn',
                description: `Còn ${daysLeft} ngày đến hạn kết thúc hợp đồng`,
                metric: `${daysLeft} ngày`
            });
        } else if (daysLeft <= 0) {
            alerts.push({
                id: 'contract-expired',
                type: 'critical',
                title: 'Hợp đồng đã hết hạn',
                description: 'Cần gia hạn hoặc thanh lý hợp đồng',
                metric: 'Quá hạn'
            });
        }
    }

    // Check for missing documents
    if (missingDocs.length > 0) {
        alerts.push({
            id: 'missing-docs',
            type: 'info',
            title: 'Thiếu văn bản pháp lý',
            description: `${missingDocs.length} văn bản chưa có: ${missingDocs.slice(0, 2).join(', ')}${missingDocs.length > 2 ? '...' : ''}`,
            metric: `${missingDocs.length} văn bản`
        });
    }

    // If no alerts, show success
    if (alerts.length === 0) {
        return (
            <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                    <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Dự án hoạt động bình thường</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">Không có cảnh báo nào</p>
                </div>
            </div>
        );
    }

    const criticalCount = alerts.filter(a => a.type === 'critical').length;
    const warningCount = alerts.filter(a => a.type === 'warning').length;

    return (
        <div className="space-y-3">
            {/* Summary Header */}
            <div className={`flex items-center justify-between px-4 py-3 rounded-xl ${criticalCount > 0
                ? 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700'
                : 'bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700'
                }`}>
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${criticalCount > 0
                        ? 'bg-red-100 dark:bg-red-800'
                        : 'bg-amber-100 dark:bg-amber-800'
                        }`}>
                        <AlertTriangle className={`w-5 h-5 ${criticalCount > 0 ? 'text-red-600' : 'text-amber-600'}`} />
                    </div>
                    <div>
                        <p className={`text-sm font-bold ${criticalCount > 0 ? 'text-red-800 dark:text-red-300' : 'text-amber-800 dark:text-amber-300'}`}>
                            {criticalCount > 0 ? 'Có cảnh báo nghiêm trọng' : 'Cần chú ý'}
                        </p>
                        <p className={`text-xs ${criticalCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                            {criticalCount > 0 && `${criticalCount} nghiêm trọng`}
                            {criticalCount > 0 && warningCount > 0 && ' • '}
                            {warningCount > 0 && `${warningCount} cảnh báo`}
                        </p>
                    </div>
                </div>
                <span className={`text-2xl font-black ${criticalCount > 0 ? 'text-red-600' : 'text-amber-600'}`}>
                    {alerts.length}
                </span>
            </div>

            {/* Alert List */}
            <div className="space-y-2">
                {alerts.map(alert => (
                    <div
                        key={alert.id}
                        className={`flex items-start gap-3 px-4 py-3 rounded-lg border ${alert.type === 'critical'
                            ? 'bg-red-50/50 dark:bg-red-900/20 border-red-100 dark:border-red-800'
                            : alert.type === 'warning'
                                ? 'bg-amber-50/50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800'
                                : 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800'
                            }`}
                    >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${alert.type === 'critical'
                            ? 'bg-red-100'
                            : alert.type === 'warning'
                                ? 'bg-amber-100'
                                : 'bg-blue-100'
                            }`}>
                            {alert.type === 'critical' && <AlertTriangle className="w-4 h-4 text-red-600" />}
                            {alert.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-600" />}
                            {alert.type === 'info' && <FileWarning className="w-4 h-4 text-blue-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-bold ${alert.type === 'critical' ? 'text-red-800' :
                                alert.type === 'warning' ? 'text-amber-800' : 'text-blue-800'
                                }`}>
                                {alert.title}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-slate-400 mt-0.5">{alert.description}</p>
                        </div>
                        {alert.metric && (
                            <span className={`text-xs font-bold px-2 py-1 rounded-full shrink-0 ${alert.type === 'critical' ? 'bg-red-100 text-red-700' :
                                alert.type === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                {alert.metric}
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RiskIndicators;
