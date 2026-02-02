import React, { useState } from 'react';
import {
    CheckCircle2, Circle, Briefcase, Settings, PlayCircle, Flag, Cog,
    ChevronRight, Calendar, FileText, X, ArrowRight, AlertCircle,
    History, Plus
} from 'lucide-react';
import { ProjectStage } from '@/types';

// Stage history entry type
export interface StageHistoryEntry {
    stage: ProjectStage;
    startDate: string;
    endDate?: string;
    decisionNumber?: string;
    notes?: string;
}

interface LifecycleStepperProps {
    currentStage: ProjectStage;
    stageHistory?: StageHistoryEntry[];
    compact?: boolean;
    editable?: boolean;
    onStageChange?: (newStage: ProjectStage, entry: StageHistoryEntry) => void;
    onHistoryUpdate?: (history: StageHistoryEntry[]) => void;
}

// 5 giai đoạn theo NĐ 175/2024
const STAGES = [
    {
        key: ProjectStage.InvestmentPolicy,
        label: 'Chủ trương ĐT',
        icon: Briefcase,
        description: 'Phê duyệt chủ trương đầu tư',
        requiredDocs: ['QĐ phê duyệt chủ trương', 'Tờ trình']
    },
    {
        key: ProjectStage.Preparation,
        label: 'Chuẩn bị ĐT',
        icon: Settings,
        description: 'Lập BCNCKT, phê duyệt dự án',
        requiredDocs: ['Báo cáo NCKT', 'QĐ phê duyệt dự án']
    },
    {
        key: ProjectStage.Execution,
        label: 'Thực hiện',
        icon: PlayCircle,
        description: 'Thiết kế, đấu thầu, thi công',
        requiredDocs: ['QĐ phê duyệt TKKT', 'Hợp đồng thi công']
    },
    {
        key: ProjectStage.Completion,
        label: 'Kết thúc',
        icon: Flag,
        description: 'Nghiệm thu, quyết toán',
        requiredDocs: ['BB nghiệm thu', 'QĐ quyết toán']
    },
    {
        key: ProjectStage.Operation,
        label: 'Vận hành',
        icon: Cog,
        description: 'Bảo trì, bảo hành',
        requiredDocs: ['Biên bản bàn giao']
    }
];

export const LifecycleStepper: React.FC<LifecycleStepperProps> = ({
    currentStage,
    stageHistory = [],
    compact = false,
    editable = false,
    onStageChange,
    onHistoryUpdate
}) => {
    const [showTransitionModal, setShowTransitionModal] = useState(false);
    const [showHistoryPanel, setShowHistoryPanel] = useState(false);
    const [transitionData, setTransitionData] = useState<Partial<StageHistoryEntry>>({});

    const currentIndex = STAGES.findIndex(s => s.key === currentStage);

    const getStepStatus = (index: number) => {
        if (index < currentIndex) return 'completed';
        if (index === currentIndex) return 'current';
        return 'upcoming';
    };

    const getStageInfo = (stageKey: ProjectStage) => {
        return stageHistory.find(h => h.stage === stageKey);
    };

    const getNextStage = () => {
        if (currentIndex < STAGES.length - 1) {
            return STAGES[currentIndex + 1];
        }
        return null;
    };

    const handleAdvanceStage = () => {
        const nextStage = getNextStage();
        if (nextStage) {
            setTransitionData({
                stage: nextStage.key,
                startDate: new Date().toISOString().split('T')[0]
            });
            setShowTransitionModal(true);
        }
    };

    const confirmTransition = () => {
        if (transitionData.stage && transitionData.startDate && onStageChange) {
            // Complete current stage
            const updatedHistory = [...stageHistory];
            const currentEntry = updatedHistory.find(h => h.stage === currentStage);
            if (currentEntry) {
                currentEntry.endDate = transitionData.startDate;
            }

            // Add new stage
            const newEntry: StageHistoryEntry = {
                stage: transitionData.stage,
                startDate: transitionData.startDate,
                decisionNumber: transitionData.decisionNumber,
                notes: transitionData.notes
            };

            onStageChange(transitionData.stage, newEntry);
            onHistoryUpdate?.([...updatedHistory, newEntry]);
            setShowTransitionModal(false);
            setTransitionData({});
        }
    };

    // Compact mode
    if (compact) {
        return (
            <div className="flex items-center gap-1 bg-gray-50 rounded-full px-3 py-1.5">
                {STAGES.map((stage, index) => {
                    const status = getStepStatus(index);
                    return (
                        <React.Fragment key={stage.key}>
                            <div
                                className={`w-2 h-2 rounded-full transition-all ${status === 'completed' ? 'bg-emerald-500' :
                                    status === 'current' ? 'bg-blue-500 ring-2 ring-blue-200' :
                                        'bg-gray-300'
                                    }`}
                                title={stage.label}
                            />
                            {index < STAGES.length - 1 && (
                                <div className={`w-2 h-0.5 ${status === 'completed' ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        );
    }

    const nextStage = getNextStage();

    return (
        <>
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200 p-6 shadow-sm">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                        <Circle className="w-3 h-3" />
                        Vòng đời dự án (NĐ 175/2024)
                    </h3>
                    <div className="flex items-center gap-2">
                        {stageHistory.length > 0 && (
                            <button
                                onClick={() => setShowHistoryPanel(!showHistoryPanel)}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold text-gray-600 hover:bg-white rounded-lg transition-colors"
                            >
                                <History className="w-3.5 h-3.5" />
                                Lịch sử
                            </button>
                        )}
                        {editable && nextStage && (
                            <button
                                onClick={handleAdvanceStage}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg transition-colors shadow-sm"
                            >
                                <ArrowRight className="w-3.5 h-3.5" />
                                Chuyển giai đoạn
                            </button>
                        )}
                    </div>
                </div>

                {/* Progress Steps */}
                <div className="flex items-start justify-between relative">
                    {/* Progress line */}
                    <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 rounded-full" style={{ margin: '0 40px' }}>
                        <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(0, (currentIndex / (STAGES.length - 1)) * 100)}%` }}
                        />
                    </div>

                    {STAGES.map((stage, index) => {
                        const status = getStepStatus(index);
                        const stageInfo = getStageInfo(stage.key);
                        const Icon = stage.icon;

                        return (
                            <div
                                key={stage.key}
                                className="flex flex-col items-center relative z-10 flex-1 group"
                            >
                                {/* Circle/Icon */}
                                <div
                                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm cursor-pointer
                                        ${status === 'completed'
                                            ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white'
                                            : status === 'current'
                                                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white ring-4 ring-blue-100'
                                                : 'bg-white border-2 border-gray-300 text-gray-400 hover:border-gray-400'
                                        }`}
                                    title={stage.description}
                                >
                                    {status === 'completed' ? (
                                        <CheckCircle2 className="w-6 h-6" />
                                    ) : (
                                        <Icon className="w-5 h-5" />
                                    )}
                                </div>

                                {/* Label */}
                                <div className="mt-3 text-center">
                                    <span className={`text-xs font-bold ${status === 'current' ? 'text-blue-700' :
                                        status === 'completed' ? 'text-emerald-700' :
                                            'text-gray-500'
                                        }`}>
                                        {stage.label}
                                    </span>
                                </div>

                                {/* Stage info (dates, decision) */}
                                {stageInfo && (
                                    <div className="mt-2 text-center">
                                        <span className="text-[10px] text-gray-400 block">
                                            {stageInfo.startDate}
                                            {stageInfo.endDate && ` → ${stageInfo.endDate}`}
                                        </span>
                                        {stageInfo.decisionNumber && (
                                            <span className="text-[10px] text-blue-600 font-medium block mt-0.5">
                                                {stageInfo.decisionNumber}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Required docs tooltip on hover */}
                                <div className="absolute top-full mt-8 hidden group-hover:block z-20">
                                    <div className="bg-gray-900 text-white text-[10px] rounded-lg px-3 py-2 shadow-xl min-w-[140px]">
                                        <p className="font-bold mb-1.5 text-gray-300 uppercase">Văn bản cần có:</p>
                                        <ul className="space-y-1">
                                            {stage.requiredDocs.map((doc, i) => (
                                                <li key={i} className="flex items-center gap-1.5">
                                                    <FileText className="w-3 h-3 text-gray-400" />
                                                    {doc}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* History Panel */}
                {showHistoryPanel && stageHistory.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                        <h4 className="text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                            <History className="w-3.5 h-3.5" />
                            Lịch sử chuyển giai đoạn
                        </h4>
                        <div className="space-y-2">
                            {stageHistory.map((entry, idx) => {
                                const stageConfig = STAGES.find(s => s.key === entry.stage);
                                const Icon = stageConfig?.icon || Circle;
                                return (
                                    <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 hover:shadow-sm transition-shadow">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-gray-800">{stageConfig?.label}</p>
                                            <p className="text-[10px] text-gray-500">
                                                {entry.startDate}
                                                {entry.endDate && ` → ${entry.endDate}`}
                                                {entry.decisionNumber && ` • ${entry.decisionNumber}`}
                                            </p>
                                        </div>
                                        {entry.notes && (
                                            <span className="text-[10px] text-gray-400 italic max-w-[150px] truncate" title={entry.notes}>
                                                "{entry.notes}"
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Stage Transition Modal */}
            {showTransitionModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md m-4 animate-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-black text-gray-800">Chuyển giai đoạn dự án</h3>
                            <button
                                onClick={() => setShowTransitionModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            {/* Current → Next Stage visual */}
                            <div className="flex items-center justify-center gap-4 py-4 bg-gray-50 rounded-xl">
                                <div className="text-center">
                                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-2">
                                        {React.createElement(STAGES[currentIndex].icon, { className: "w-5 h-5 text-emerald-600" })}
                                    </div>
                                    <span className="text-xs font-bold text-gray-600">{STAGES[currentIndex].label}</span>
                                </div>
                                <ArrowRight className="w-6 h-6 text-gray-400" />
                                <div className="text-center">
                                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2 ring-2 ring-blue-200">
                                        {nextStage && React.createElement(nextStage.icon, { className: "w-5 h-5 text-blue-600" })}
                                    </div>
                                    <span className="text-xs font-bold text-blue-700">{nextStage?.label}</span>
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1.5">
                                        Ngày bắt đầu giai đoạn mới *
                                    </label>
                                    <input
                                        type="date"
                                        value={transitionData.startDate || ''}
                                        onChange={(e) => setTransitionData(d => ({ ...d, startDate: e.target.value }))}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1.5">
                                        Số quyết định/văn bản
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="VD: QĐ 123/QĐ-UBND"
                                        value={transitionData.decisionNumber || ''}
                                        onChange={(e) => setTransitionData(d => ({ ...d, decisionNumber: e.target.value }))}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1.5">
                                        Ghi chú
                                    </label>
                                    <textarea
                                        rows={2}
                                        placeholder="Ghi chú thêm về việc chuyển giai đoạn..."
                                        value={transitionData.notes || ''}
                                        onChange={(e) => setTransitionData(d => ({ ...d, notes: e.target.value }))}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 resize-none"
                                    />
                                </div>
                            </div>

                            {/* Warning */}
                            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-amber-700">
                                    Việc chuyển giai đoạn sẽ được ghi lại vào lịch sử dự án. Hành động này không thể hoàn tác.
                                </p>
                            </div>
                        </div>

                        <div className="p-5 border-t border-gray-100 flex gap-3">
                            <button
                                onClick={() => setShowTransitionModal(false)}
                                className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-bold rounded-xl text-sm hover:bg-gray-50 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={confirmTransition}
                                disabled={!transitionData.startDate}
                                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
                            >
                                Xác nhận chuyển
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default LifecycleStepper;
