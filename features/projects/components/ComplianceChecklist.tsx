import React from 'react';
import { CheckCircle2, AlertCircle, Clock, FileText, Shield, Database } from 'lucide-react';
import { Project, ProjectGroup, ProjectStage } from '@/types';
import { requiresBIM } from '@/utils/projectCompliance';

interface ComplianceChecklistProps {
    project: Project & {
        Stage?: ProjectStage;
        RequiresBIM?: boolean;
        BIMStatus?: string;
        FeasibilityStudy?: { ApprovalNumber?: string };
        EnvironmentalApproval?: string;
    };
}

interface ChecklistItem {
    id: string;
    label: string;
    description?: string;
    status: 'passed' | 'warning' | 'pending' | 'na';
    icon: React.ReactNode;
}

export const ComplianceChecklist: React.FC<ComplianceChecklistProps> = ({ project }) => {
    const isBIMRequired = project.RequiresBIM ??
        requiresBIM(project.GroupCode as ProjectGroup, project.ConstructionGrade);

    const checklistItems: ChecklistItem[] = [
        {
            id: 'decision',
            label: 'QĐ Phê duyệt dự án',
            description: project.DecisionNumber || undefined,
            status: project.DecisionNumber ? 'passed' : 'pending',
            icon: <FileText className="w-4 h-4" />
        },
        {
            id: 'feasibility',
            label: project.GroupCode === 'GC' ? 'Báo cáo KT-KT' : 'Báo cáo NCKT',
            description: project.FeasibilityStudy?.ApprovalNumber || undefined,
            status: project.FeasibilityStudy?.ApprovalNumber ? 'passed' : 'pending',
            icon: <FileText className="w-4 h-4" />
        },
        {
            id: 'environmental',
            label: 'ĐTM / Cam kết BVMT',
            description: project.EnvironmentalApproval || undefined,
            status: project.EnvironmentalApproval ? 'passed' : 'warning',
            icon: <Shield className="w-4 h-4" />
        },
        {
            id: 'bim',
            label: 'BIM (NĐ 175/2024)',
            description: isBIMRequired ? project.BIMStatus || 'Chưa triển khai' : 'Không bắt buộc',
            status: !isBIMRequired ? 'na' :
                project.BIMStatus === 'Active' ? 'passed' :
                    project.BIMStatus === 'EIRApproved' || project.BIMStatus === 'BEPApproved' ? 'warning' :
                        'pending',
            icon: <Database className="w-4 h-4" />
        }
    ];

    const getStatusStyles = (status: ChecklistItem['status']) => {
        switch (status) {
            case 'passed':
                return {
                    bg: 'bg-emerald-50',
                    border: 'border-emerald-200',
                    icon: 'text-emerald-600',
                    text: 'text-emerald-700'
                };
            case 'warning':
                return {
                    bg: 'bg-amber-50',
                    border: 'border-amber-200',
                    icon: 'text-amber-600',
                    text: 'text-amber-700'
                };
            case 'pending':
                return {
                    bg: 'bg-gray-50',
                    border: 'border-gray-200',
                    icon: 'text-gray-400',
                    text: 'text-gray-600'
                };
            case 'na':
                return {
                    bg: 'bg-slate-50',
                    border: 'border-slate-200',
                    icon: 'text-slate-400',
                    text: 'text-slate-500'
                };
        }
    };

    const getStatusIcon = (status: ChecklistItem['status']) => {
        switch (status) {
            case 'passed': return <CheckCircle2 className="w-4 h-4" />;
            case 'warning': return <AlertCircle className="w-4 h-4" />;
            case 'pending': return <Clock className="w-4 h-4" />;
            case 'na': return <span className="text-xs">N/A</span>;
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                    Tuân thủ pháp lý
                </h4>
            </div>
            <div className="p-4 space-y-2">
                {checklistItems.map(item => {
                    const styles = getStatusStyles(item.status);
                    return (
                        <div
                            key={item.id}
                            className={`flex items-center gap-3 p-2.5 rounded-lg border ${styles.bg} ${styles.border}`}
                        >
                            <div className={styles.icon}>
                                {item.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className={`text-xs font-medium ${styles.text}`}>
                                    {item.label}
                                </span>
                                {item.description && (
                                    <span className="text-[10px] text-gray-500 block truncate">
                                        {item.description}
                                    </span>
                                )}
                            </div>
                            <div className={styles.icon}>
                                {getStatusIcon(item.status)}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ComplianceChecklist;
