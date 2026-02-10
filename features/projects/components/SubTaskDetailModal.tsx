import React, { useState } from 'react';
import {
    X, Building2, Scale, Clock, FileText, ChevronRight,
    Users, Briefcase
} from 'lucide-react';
import { SubTaskDef } from '@/utils/stepSubtasksRegistry';
import { TemplateViewer } from './TemplateViewer';

interface SubTaskDetailModalProps {
    subTask: SubTaskDef | null;
    stepTitle?: string;
    isOpen: boolean;
    onClose: () => void;
}

export const SubTaskDetailModal: React.FC<SubTaskDetailModalProps> = ({
    subTask,
    stepTitle,
    isOpen,
    onClose
}) => {
    const [showTemplate, setShowTemplate] = useState(false);

    if (!isOpen || !subTask) return null;

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                onClick={onClose}>
                <div className="bg-[var(--bg-primary)] rounded-2xl shadow-2xl w-[90vw] max-w-lg flex flex-col border border-[var(--border-primary)]"
                    onClick={e => e.stopPropagation()}>
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b border-[var(--border-primary)]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                                <Briefcase size={20} className="text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-[var(--text-primary)]">
                                    {subTask.title}
                                </h3>
                                {stepTitle && (
                                    <p className="text-xs text-[var(--text-tertiary)]">
                                        Thuộc: {stepTitle}
                                    </p>
                                )}
                            </div>
                        </div>
                        <button onClick={onClose}
                            className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-5 space-y-4">
                        {/* Mã công việc */}
                        <div className="flex items-center gap-2 text-xs">
                            <span className="px-2 py-1 rounded-md bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] font-mono">
                                {subTask.code}
                            </span>
                        </div>

                        {/* Mô tả */}
                        {subTask.description && (
                            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                                <p className="text-sm text-amber-300/90">{subTask.description}</p>
                            </div>
                        )}

                        {/* Đơn vị phụ trách */}
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-secondary)]">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Building2 size={16} className="text-blue-400" />
                            </div>
                            <div>
                                <p className="text-xs text-[var(--text-tertiary)] mb-1">Đơn vị phụ trách</p>
                                <p className="text-sm font-medium text-[var(--text-primary)]">
                                    {subTask.responsible}
                                </p>
                            </div>
                        </div>

                        {/* Căn cứ pháp lý */}
                        {subTask.legalBasis && (
                            <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-secondary)]">
                                <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Scale size={16} className="text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--text-tertiary)] mb-1">Căn cứ pháp lý</p>
                                    <p className="text-sm text-[var(--text-secondary)]">
                                        {subTask.legalBasis}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Thời gian */}
                        {subTask.estimatedDays && (
                            <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-secondary)]">
                                <div className="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Clock size={16} className="text-orange-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--text-tertiary)] mb-1">Thời gian ước tính</p>
                                    <p className="text-sm font-medium text-[var(--text-primary)]">
                                        {subTask.estimatedDays} ngày
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Biểu mẫu liên kết */}
                        {subTask.templatePath && (
                            <button
                                onClick={() => setShowTemplate(true)}
                                className="w-full flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors group"
                            >
                                <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center flex-shrink-0">
                                    <FileText size={16} className="text-cyan-400" />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="text-xs text-[var(--text-tertiary)] mb-0.5">Biểu mẫu liên kết</p>
                                    <p className="text-sm text-cyan-400 font-medium">
                                        {subTask.templateLabel || subTask.templatePath}
                                    </p>
                                </div>
                                <ChevronRight size={16} className="text-[var(--text-tertiary)] group-hover:text-cyan-400 transition-colors" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Template Viewer (nested modal) */}
            {subTask.templatePath && (
                <TemplateViewer
                    templatePath={subTask.templatePath}
                    templateLabel={subTask.templateLabel}
                    isOpen={showTemplate}
                    onClose={() => setShowTemplate(false)}
                />
            )}
        </>
    );
};
