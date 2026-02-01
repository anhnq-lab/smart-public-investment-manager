import React from 'react';
import { CheckCircle2, Circle, ArrowRight, Briefcase, Settings, PlayCircle, Flag, Cog } from 'lucide-react';
import { ProjectStage } from '@/types';

interface LifecycleStepperProps {
    currentStage: ProjectStage;
    stageHistory?: Array<{
        stage: ProjectStage;
        startDate: string;
        endDate?: string;
        decisionNumber?: string;
    }>;
    compact?: boolean;
}

// 5 giai đoạn theo NĐ 175/2024
const STAGES = [
    {
        key: ProjectStage.InvestmentPolicy,
        label: 'Chủ trương ĐT',
        icon: Briefcase,
        description: 'Phê duyệt chủ trương đầu tư'
    },
    {
        key: ProjectStage.Preparation,
        label: 'Chuẩn bị ĐT',
        icon: Settings,
        description: 'Lập BCNCKT, phê duyệt dự án'
    },
    {
        key: ProjectStage.Execution,
        label: 'Thực hiện',
        icon: PlayCircle,
        description: 'Thiết kế, đấu thầu, thi công'
    },
    {
        key: ProjectStage.Completion,
        label: 'Kết thúc',
        icon: Flag,
        description: 'Nghiệm thu, quyết toán'
    },
    {
        key: ProjectStage.Operation,
        label: 'Vận hành',
        icon: Cog,
        description: 'Bảo trì, bảo hành'
    }
];

export const LifecycleStepper: React.FC<LifecycleStepperProps> = ({
    currentStage,
    stageHistory,
    compact = false
}) => {
    const currentIndex = STAGES.findIndex(s => s.key === currentStage);

    const getStepStatus = (index: number) => {
        if (index < currentIndex) return 'completed';
        if (index === currentIndex) return 'current';
        return 'upcoming';
    };

    const getStageInfo = (stageKey: ProjectStage) => {
        return stageHistory?.find(h => h.stage === stageKey);
    };

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
                                <div className={`w-2 h-0.5 ${status === 'completed' ? 'bg-emerald-500' : 'bg-gray-200'
                                    }`} />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-5">
                Vòng đời dự án
            </h3>
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
                            className="flex flex-col items-center relative z-10 flex-1"
                        >
                            {/* Circle/Icon */}
                            <div
                                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${status === 'completed'
                                    ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white'
                                    : status === 'current'
                                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white ring-4 ring-blue-100'
                                        : 'bg-white border-2 border-gray-300 text-gray-400'
                                    }`}
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
                                    </span>
                                    {stageInfo.decisionNumber && (
                                        <span className="text-[10px] text-blue-600 font-medium block">
                                            {stageInfo.decisionNumber}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default LifecycleStepper;
