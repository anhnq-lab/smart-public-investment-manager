import React from 'react';
import {
    FileCheck,
    FileSignature,
    HardHat,
    Building,
    CheckCircle2,
    Circle,
    Clock
} from 'lucide-react';

interface Milestone {
    id: string;
    title: string;
    description: string;
    phaseCode: string;
    icon: React.ElementType;
    date?: string;
    status: 'pending' | 'current' | 'completed';
}

interface MilestoneTimelineProps {
    currentStage?: string;
    milestoneData?: {
        policyApprovalDate?: string;
        projectApprovalDate?: string;
        groundbreakingDate?: string;
        completionDate?: string;
        handoverDate?: string;
    };
}

export const MilestoneTimeline: React.FC<MilestoneTimelineProps> = ({
    currentStage,
    milestoneData = {}
}) => {
    // Define standard milestones based on NĐ 175/2024
    const getStatus = (milestoneId: string, date?: string): 'pending' | 'current' | 'completed' => {
        if (date) return 'completed';
        // Simplified logic - can be enhanced based on currentStage
        return 'pending';
    };

    const milestones: Milestone[] = [
        {
            id: 'policy_approval',
            title: 'Phê duyệt chủ trương ĐT',
            description: 'Quyết định chủ trương đầu tư',
            phaseCode: 'PREP_POLICY',
            icon: FileCheck,
            date: milestoneData.policyApprovalDate,
            status: getStatus('policy_approval', milestoneData.policyApprovalDate)
        },
        {
            id: 'project_approval',
            title: 'Phê duyệt dự án',
            description: 'Quyết định đầu tư xây dựng',
            phaseCode: 'PREP_DECISION',
            icon: FileSignature,
            date: milestoneData.projectApprovalDate,
            status: getStatus('project_approval', milestoneData.projectApprovalDate)
        },
        {
            id: 'groundbreaking',
            title: 'Khởi công',
            description: 'Bắt đầu thi công xây dựng',
            phaseCode: 'IMPL_CONSTRUCTION',
            icon: HardHat,
            date: milestoneData.groundbreakingDate,
            status: getStatus('groundbreaking', milestoneData.groundbreakingDate)
        },
        {
            id: 'completion',
            title: 'Hoàn thành thi công',
            description: 'Nghiệm thu hoàn thành',
            phaseCode: 'IMPL_ACCEPTANCE',
            icon: Building,
            date: milestoneData.completionDate,
            status: getStatus('completion', milestoneData.completionDate)
        },
        {
            id: 'handover',
            title: 'Bàn giao đưa vào sử dụng',
            description: 'Quyết toán và bàn giao',
            phaseCode: 'CLOSE_HANDOVER',
            icon: CheckCircle2,
            date: milestoneData.handoverDate,
            status: getStatus('handover', milestoneData.handoverDate)
        }
    ];

    const getStatusConfig = (status: 'pending' | 'current' | 'completed') => {
        switch (status) {
            case 'completed':
                return {
                    iconBg: 'bg-emerald-500',
                    iconColor: 'text-white',
                    lineColor: 'bg-emerald-500',
                    textColor: 'text-emerald-700',
                    dotColor: 'bg-emerald-500'
                };
            case 'current':
                return {
                    iconBg: 'bg-blue-500',
                    iconColor: 'text-white',
                    lineColor: 'bg-blue-200',
                    textColor: 'text-blue-700',
                    dotColor: 'bg-blue-500 animate-pulse'
                };
            default:
                return {
                    iconBg: 'bg-gray-200',
                    iconColor: 'text-gray-400',
                    lineColor: 'bg-gray-200',
                    textColor: 'text-gray-500',
                    dotColor: 'bg-gray-300'
                };
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Các mốc quan trọng
            </h4>

            <div className="relative">
                {/* Vertical Timeline */}
                <div className="space-y-0">
                    {milestones.map((milestone, index) => {
                        const config = getStatusConfig(milestone.status);
                        const Icon = milestone.icon;
                        const isLast = index === milestones.length - 1;

                        return (
                            <div key={milestone.id} className="relative flex gap-4">
                                {/* Timeline Line & Dot */}
                                <div className="flex flex-col items-center">
                                    <div className={`w-8 h-8 rounded-full ${config.iconBg} flex items-center justify-center shadow-sm z-10`}>
                                        <Icon className={`w-4 h-4 ${config.iconColor}`} />
                                    </div>
                                    {!isLast && (
                                        <div className={`w-0.5 h-12 ${config.lineColor}`} />
                                    )}
                                </div>

                                {/* Content */}
                                <div className="pb-6 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h5 className={`text-sm font-semibold ${config.textColor}`}>
                                            {milestone.title}
                                        </h5>
                                        {milestone.date && (
                                            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-medium">
                                                {new Date(milestone.date).toLocaleDateString('vi-VN')}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {milestone.description}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default MilestoneTimeline;
