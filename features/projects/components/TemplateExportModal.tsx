/**
 * TemplateExportModal
 * ===================
 * Smart modal for exporting Vietnamese government documents from templates.
 * 
 * Features:
 * - Auto-fill project data with green indicators
 * - Manual fields highlighted in yellow
 * - Real-time markdown preview with filled data
 * - One-click DOCX export
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    X, Download, FileText, Eye, Edit3, CheckCircle2,
    AlertCircle, Sparkles, ChevronRight, Loader2,
    Copy, Check, Scale, Building2, Calendar, User,
    Printer
} from 'lucide-react';
import { LegalReferenceLink } from '@/components/common/LegalReferenceLink';
import { Project } from '@/types';
import {
    TemplateConfig, ExportDataContext, autoFillFields, getTemplateConfig,
    getCategoryLabel, getCategoryColor
} from '@/utils/templateRegistry';
import {
    exportTemplateAsDocx, getFilledTemplatePreview
} from '@/utils/templateEngine';

// ========================================
// PROPS
// ========================================

interface TemplateExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    templatePath: string;
    templateLabel?: string;
    project?: Project | null;
    // Optional extra context
    stepTitle?: string;
    stepCode?: string;
}

// ========================================
// COMPONENT
// ========================================

export const TemplateExportModal: React.FC<TemplateExportModalProps> = ({
    isOpen,
    onClose,
    templatePath,
    templateLabel,
    project,
    stepTitle,
}) => {
    // State
    const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [previewContent, setPreviewContent] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [copied, setCopied] = useState(false);

    // Get template config
    const config = useMemo(() => getTemplateConfig(templatePath), [templatePath]);

    // Build context
    const context = useMemo<ExportDataContext>(() => ({
        project,
        locationName: 'Hà Nội',
    }), [project]);

    // Auto-fill on open
    useEffect(() => {
        if (isOpen && config) {
            const autoFilled = autoFillFields(config, context);
            setFormData(prev => ({ ...autoFilled, ...prev }));
            setActiveTab('edit');
        }
    }, [isOpen, config, context]);

    // Reset on close
    useEffect(() => {
        if (!isOpen) {
            setFormData({});
            setPreviewContent('');
            setCopied(false);
        }
    }, [isOpen]);

    // Load preview
    const loadPreview = useCallback(async () => {
        if (!config) return;
        setLoading(true);
        try {
            const content = await getFilledTemplatePreview(
                config.templatePath,
                formData,
                context,
            );
            setPreviewContent(content);
        } catch (err) {
            setPreviewContent('⚠️ Không tải được biểu mẫu.');
        }
        setLoading(false);
    }, [config, formData, context]);

    // Load preview when switching to preview tab
    useEffect(() => {
        if (activeTab === 'preview') {
            loadPreview();
        }
    }, [activeTab, loadPreview]);

    // Handlers
    const handleChange = (key: string, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleExport = async () => {
        if (!config) return;
        setExporting(true);
        try {
            await exportTemplateAsDocx(config, formData, context);
        } catch (err) {
            console.error('Export failed:', err);
            alert('Lỗi khi xuất file. Vui lòng thử lại.');
        }
        setExporting(false);
    };

    const handleCopy = async () => {
        if (previewContent) {
            await navigator.clipboard.writeText(previewContent);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                <head>
                    <title>${config?.label || 'Biểu mẫu'}</title>
                    <style>
                        body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; }
                        h1 { font-size: 16pt; text-align: center; }
                        h2 { font-size: 14pt; }
                        h3 { font-size: 13pt; }
                        table { border-collapse: collapse; width: 100%; margin: 10px 0; }
                        th, td { border: 1px solid #000; padding: 5px 8px; font-size: 12pt; }
                        th { background: #f0f0f0; font-weight: bold; }
                        hr { border: none; border-top: 1px solid #ccc; margin: 15px 0; }
                    </style>
                </head>
                <body>${previewContent.replace(/\n/g, '<br>')}</body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
    };

    // Count auto-filled vs manual fields
    const fieldStats = useMemo(() => {
        if (!config) return { filled: 0, manual: 0, total: 0 };
        const filled = config.fields.filter(f => formData[f.key] && f.autoFillFrom).length;
        const manual = config.fields.filter(f => !formData[f.key] && f.required).length;
        return { filled, manual, total: config.fields.length };
    }, [config, formData]);

    if (!isOpen || !config) return null;

    const categoryGradient = getCategoryColor(config.category);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={onClose}>
            <div className="bg-[#0f172a] rounded-2xl shadow-2xl w-[95vw] max-w-5xl max-h-[92vh] flex flex-col border border-[#334155] animate-scale-in"
                onClick={e => e.stopPropagation()}>

                {/* ═══════════ HEADER ═══════════ */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#334155]">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${categoryGradient} flex items-center justify-center shadow-lg`}>
                            <FileText size={20} className="text-white" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-lg font-bold text-[#f8fafc] truncate">
                                {config.icon} {templateLabel || config.label}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                                {stepTitle && (
                                    <span className="text-xs text-[#94a3b8] truncate max-w-[200px]">
                                        📌 {stepTitle}
                                    </span>
                                )}
                                <span className="text-xs px-2 py-0.5 rounded-full bg-[#334155] text-[#cbd5e1]">
                                    {getCategoryLabel(config.category)}
                                </span>
                                {config.legalBasis && (
                                    <span className="text-xs text-[#94a3b8] flex items-center gap-1">
                                        <Scale size={10} /> <LegalReferenceLink text={config.legalBasis!} />
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose}
                        className="p-2 rounded-lg hover:bg-[#334155] text-[#cbd5e1] transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* ═══════════ TAB BAR ═══════════ */}
                <div className="flex items-center justify-between px-6 py-2 border-b border-[#334155] bg-[#1e293b]">
                    <div className="flex gap-1">
                        <button
                            onClick={() => setActiveTab('edit')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'edit'
                                ? 'bg-blue-500/10 text-blue-400 shadow-sm'
                                : 'text-[#94a3b8] hover:text-[#cbd5e1] hover:bg-[#334155]'
                                }`}
                        >
                            <Edit3 size={14} />
                            Điền thông tin
                            {fieldStats.manual > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-amber-500/20 text-amber-400">
                                    {fieldStats.manual}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('preview')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'preview'
                                ? 'bg-blue-500/10 text-blue-400 shadow-sm'
                                : 'text-[#94a3b8] hover:text-[#cbd5e1] hover:bg-[#334155]'
                                }`}
                        >
                            <Eye size={14} />
                            Xem trước
                        </button>
                    </div>

                    {/* Auto-fill status */}
                    <div className="flex items-center gap-3 text-xs">
                        {fieldStats.filled > 0 && (
                            <span className="flex items-center gap-1 text-emerald-400">
                                <Sparkles size={12} />
                                {fieldStats.filled} trường tự động
                            </span>
                        )}
                        {fieldStats.manual > 0 && (
                            <span className="flex items-center gap-1 text-amber-400">
                                <AlertCircle size={12} />
                                {fieldStats.manual} cần nhập
                            </span>
                        )}
                    </div>
                </div>

                {/* ═══════════ CONTENT ═══════════ */}
                <div className="flex-1 overflow-y-auto">
                    {activeTab === 'edit' ? (
                        <div className="h-full overflow-y-auto p-6">
                            {/* Auto-fill indicator */}
                            {project && (
                                <div className="mb-5 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                        <Sparkles size={16} className="text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-emerald-400">
                                            Dữ liệu tự động từ dự án
                                        </p>
                                        <p className="text-xs text-emerald-400/70">
                                            {project.ProjectName} • {project.ProjectID}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Fields grouped by sections */}
                            <div className="space-y-4">
                                {/* Group fields smartly */}
                                {groupFields(config.fields).map((group, gi) => (
                                    <div key={gi} className="p-4 rounded-xl border border-[#334155] bg-[#1e293b]">
                                        <h4 className="flex items-center gap-2 font-semibold text-sm text-[#f8fafc] mb-3">
                                            {group.icon}
                                            {group.label}
                                        </h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            {group.fields.map(field => {
                                                const value = formData[field.key] || '';
                                                const isAutoFilled = !!field.autoFillFrom && !!value;

                                                return (
                                                    <div key={field.key} className={field.type === 'textarea' ? 'col-span-2' : ''}>
                                                        <label className="flex items-center gap-1 text-xs font-medium text-[#cbd5e1] mb-1">
                                                            {field.label}
                                                            {field.required && <span className="text-red-400">*</span>}
                                                            {isAutoFilled && (
                                                                <span className="ml-1 px-1.5 py-0.5 text-[9px] rounded-full bg-emerald-500/20 text-emerald-400">
                                                                    tự động
                                                                </span>
                                                            )}
                                                        </label>
                                                        {field.type === 'select' ? (
                                                            <select
                                                                value={value}
                                                                onChange={e => handleChange(field.key, e.target.value)}
                                                                className="w-full px-3 py-2 rounded-lg bg-[#0f172a] border border-[#334155] text-sm text-[#f8fafc] focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-colors"
                                                            >
                                                                <option value="">-- Chọn --</option>
                                                                {field.options?.map(opt => (
                                                                    <option key={opt} value={opt}>{opt}</option>
                                                                ))}
                                                            </select>
                                                        ) : field.type === 'textarea' ? (
                                                            <textarea
                                                                value={value}
                                                                onChange={e => handleChange(field.key, e.target.value)}
                                                                rows={3}
                                                                className="w-full px-3 py-2 rounded-lg bg-[#0f172a] border border-[#334155] text-sm text-[#f8fafc] focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 resize-none transition-colors"
                                                                placeholder={field.placeholder || ''}
                                                            />
                                                        ) : (
                                                            <input
                                                                type={field.type}
                                                                value={value}
                                                                onChange={e => handleChange(field.key, e.target.value)}
                                                                className={`w-full px-3 py-2 rounded-lg bg-[#0f172a] border text-sm text-[#f8fafc] focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-colors ${isAutoFilled
                                                                    ? 'border-emerald-500/30'
                                                                    : 'border-[#334155]'
                                                                    }`}
                                                                placeholder={field.placeholder || ''}
                                                            />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* PREVIEW TAB */
                        <div className="h-full overflow-y-auto p-6">
                            {loading ? (
                                <div className="flex items-center justify-center h-60">
                                    <Loader2 size={32} className="text-blue-400 animate-spin" />
                                </div>
                            ) : (
                                <div className="bg-white rounded-xl p-8 shadow-lg max-w-3xl mx-auto min-h-[400px]">
                                    <pre className="whitespace-pre-wrap text-sm text-gray-800 font-serif leading-relaxed"
                                        style={{ fontFamily: "'Times New Roman', 'Noto Serif', serif" }}>
                                        {previewContent || '(Chưa có nội dung)'}
                                    </pre>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ═══════════ FOOTER ═══════════ */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-[#334155] bg-[#1e293b]">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-[#cbd5e1] hover:bg-[#334155] rounded-lg transition-colors text-sm"
                    >
                        Đóng
                    </button>
                    <div className="flex gap-2">
                        {activeTab === 'preview' && (
                            <>
                                <button
                                    onClick={handleCopy}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-[#334155] text-[#cbd5e1] hover:bg-[#334155] transition-colors"
                                >
                                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                    {copied ? 'Đã sao chép' : 'Sao chép'}
                                </button>
                                <button
                                    onClick={handlePrint}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-[#334155] text-[#cbd5e1] hover:bg-[#334155] transition-colors"
                                >
                                    <Printer size={14} />
                                    In
                                </button>
                            </>
                        )}
                        <button
                            onClick={handleExport}
                            disabled={exporting}
                            className={`flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r ${categoryGradient} text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg shadow-blue-500/20 text-sm`}
                        >
                            {exporting ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Download size={16} />
                            )}
                            {exporting ? 'Đang xuất...' : 'Xuất file DOCX'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ========================================
// FIELD GROUPING HELPER
// ========================================

interface FieldGroup {
    label: string;
    icon: React.ReactNode;
    fields: TemplateConfig['fields'];
}

function groupFields(fields: TemplateConfig['fields']): FieldGroup[] {
    const projectFields = fields.filter(f =>
        ['projectName', 'projectGroup', 'totalInvestment', 'capitalSource',
            'investorName', 'location', 'objective', 'duration',
            'constructionType', 'constructionGrade', 'managementForm',
            'projectCode'].includes(f.key)
    );

    const signerFields = fields.filter(f =>
        ['signerName', 'signerTitle', 'issuingAuthority'].includes(f.key)
    );

    const docFields = fields.filter(f =>
        ['documentNumber', 'documentDate', 'recipientAuthority',
            'decisionNumber', 'decisionDate', 'decisionAuthority'].includes(f.key)
    );

    const otherFields = fields.filter(f =>
        !projectFields.includes(f) && !signerFields.includes(f) && !docFields.includes(f)
    );

    const groups: FieldGroup[] = [];

    if (projectFields.length > 0) {
        groups.push({
            label: 'Thông tin dự án',
            icon: <Building2 size={14} className="text-blue-400" />,
            fields: projectFields,
        });
    }

    if (docFields.length > 0) {
        groups.push({
            label: 'Thông tin văn bản',
            icon: <FileText size={14} className="text-amber-400" />,
            fields: docFields,
        });
    }

    if (signerFields.length > 0) {
        groups.push({
            label: 'Người ký / Cơ quan ban hành',
            icon: <User size={14} className="text-purple-400" />,
            fields: signerFields,
        });
    }

    if (otherFields.length > 0) {
        groups.push({
            label: 'Thông tin bổ sung',
            icon: <ChevronRight size={14} className="text-gray-400" />,
            fields: otherFields,
        });
    }

    return groups;
}

export default TemplateExportModal;
