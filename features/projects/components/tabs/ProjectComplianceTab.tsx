import React, { useState, useCallback, useMemo } from 'react';
import { Project, ProjectStage, CostBreakdown } from '@/types';
import { ProjectService } from '@/services/ProjectService';
import {
    ChevronDown, ChevronUp, Save, RefreshCw, CheckCircle2, AlertCircle,
    Shield, Leaf, FileSearch, Ruler, PenTool, HardHat, ClipboardCheck,
    Building2, Lock, Unlock, Database
} from 'lucide-react';

// ══════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════

interface ProjectComplianceTabProps {
    project: Project;
    onUpdate: (updated: Partial<Project>) => void;
}

interface SectionConfig {
    id: string;
    title: string;
    icon: React.FC<any>;
    iconColor: string;
    bgGradient: string;
    allowedStages: ProjectStage[];
    fields: FieldConfig[];
}

interface FieldConfig {
    key: keyof Project;
    label: string;
    type: 'text' | 'date' | 'number' | 'select' | 'textarea';
    placeholder?: string;
    options?: { value: string; label: string }[];
    span2?: boolean;
    required?: boolean;
    prefix?: string;
}

// ══════════════════════════════════════════════
// Section Configurations
// ══════════════════════════════════════════════

const SECTIONS: SectionConfig[] = [
    {
        id: 'A1',
        title: 'A.I — Thông tin chung',
        icon: Building2,
        iconColor: 'text-blue-500',
        bgGradient: 'from-blue-500/10 to-indigo-500/10',
        allowedStages: [ProjectStage.Preparation, ProjectStage.Execution, ProjectStage.Completion],
        fields: [
            { key: 'InvestmentScale', label: 'Quy mô đầu tư', type: 'textarea', placeholder: 'VD: Diện tích 5.000m², 5 tầng, công suất 200 giường...', span2: true, required: true },
            {
                key: 'ConstructionType', label: 'Loại công trình', type: 'select', options: [
                    { value: '', label: '— Chọn —' },
                    { value: 'Dân dụng', label: 'Dân dụng' },
                    { value: 'Công nghiệp', label: 'Công nghiệp' },
                    { value: 'Giao thông', label: 'Giao thông' },
                    { value: 'Hạ tầng kỹ thuật', label: 'Hạ tầng kỹ thuật' },
                    { value: 'Nông nghiệp & PTNT', label: 'Nông nghiệp & PTNT' },
                    { value: 'Hỗn hợp', label: 'Công năng hỗn hợp' },
                ], required: true
            },
            {
                key: 'ConstructionGrade', label: 'Cấp công trình', type: 'select', options: [
                    { value: '', label: '— Chọn —' },
                    { value: 'Đặc biệt', label: 'Đặc biệt' },
                    { value: 'I', label: 'Cấp I' },
                    { value: 'II', label: 'Cấp II' },
                    { value: 'III', label: 'Cấp III' },
                    { value: 'IV', label: 'Cấp IV' },
                ], required: true
            },
            {
                key: 'ManagementForm', label: 'Hình thức quản lý dự án', type: 'select', options: [
                    { value: '', label: '— Chọn —' },
                    { value: 'Ban QLDA chuyên ngành', label: 'Ban QLDA chuyên ngành' },
                    { value: 'Ban QLDA khu vực', label: 'Ban QLDA khu vực' },
                    { value: 'CĐT trực tiếp quản lý', label: 'CĐT trực tiếp quản lý' },
                    { value: 'Tư vấn QLDA', label: 'Thuê Tư vấn QLDA' },
                ]
            },
        ],
    },
    {
        id: 'A2',
        title: 'A.II — Hồ sơ pháp lý dự án',
        icon: FileSearch,
        iconColor: 'text-violet-500',
        bgGradient: 'from-violet-500/10 to-purple-500/10',
        allowedStages: [ProjectStage.Preparation, ProjectStage.Execution],
        fields: [
            { key: 'PlanningApprovalNumber', label: 'Số QĐ phê duyệt QH', type: 'text', placeholder: 'VD: 123/QĐ-UBND' },
            { key: 'PlanningApprovalDate', label: 'Ngày phê duyệt QH', type: 'date' },
            { key: 'PCCCApprovalNumber', label: 'Số VB thủ tục PCCC', type: 'text', placeholder: 'Số văn bản kết quả PCCC', required: true },
            { key: 'PCCCApprovalDate', label: 'Ngày cấp PCCC', type: 'date' },
            { key: 'PCCCApprovalAgency', label: 'CQ cấp PCCC', type: 'text', placeholder: 'VD: Phòng Cảnh sát PCCC' },
            {
                key: 'EnvApprovalType', label: 'Loại thủ tục MT', type: 'select', options: [
                    { value: '', label: '— Chọn —' },
                    { value: 'ĐTM', label: 'Đánh giá tác động MT (ĐTM)' },
                    { value: 'KH_BVMT', label: 'Kế hoạch bảo vệ MT' },
                ], required: true
            },
            { key: 'EnvApprovalNumber', label: 'Số VB môi trường', type: 'text', placeholder: 'Số QĐ phê duyệt ĐTM' },
            { key: 'EnvApprovalDate', label: 'Ngày cấp MT', type: 'date' },
            { key: 'AppraisalResultNumber', label: 'Số TB thẩm định BCNCKT', type: 'text', placeholder: 'VD: 456/TB-SXD', required: true },
            { key: 'AppraisalResultDate', label: 'Ngày thẩm định', type: 'date' },
            { key: 'AppraisalAgency', label: 'CQ thẩm định', type: 'text', placeholder: 'VD: Sở Xây dựng' },
            { key: 'FeasibilityContractor', label: 'NT lập BCNCKT', type: 'text', placeholder: 'Tên nhà thầu & Mã CCNL' },
            { key: 'SurveyContractor', label: 'NT khảo sát XD', type: 'text', placeholder: 'Tên nhà thầu khảo sát' },
            { key: 'ReviewContractor', label: 'NT thẩm tra', type: 'text', placeholder: 'Tên nhà thầu thẩm tra' },
        ],
    },
    {
        id: 'B',
        title: 'B — Thiết kế triển khai',
        icon: PenTool,
        iconColor: 'text-cyan-500',
        bgGradient: 'from-cyan-500/10 to-teal-500/10',
        allowedStages: [ProjectStage.Preparation, ProjectStage.Execution],
        fields: [
            { key: 'DesignAppraisalNumber', label: 'Số TB thẩm định TK', type: 'text', placeholder: 'VD: 789/TB-SXD' },
            { key: 'DesignAppraisalDate', label: 'Ngày thẩm định TK', type: 'date' },
            { key: 'DesignApprovalNumber', label: 'Số QĐ phê duyệt TK', type: 'text', placeholder: 'VD: 012/QĐ-BQLDA', required: true },
            { key: 'DesignApprovalDate', label: 'Ngày phê duyệt TK', type: 'date', required: true },
            { key: 'DesignApprovalAuthority', label: 'CQ phê duyệt TK', type: 'text', placeholder: 'VD: Ban QLDA' },
            { key: 'DesignContractor', label: 'NT thiết kế', type: 'text', placeholder: 'Tên NT & Mã CCNL', required: true },
        ],
    },
    {
        id: 'C',
        title: 'C — Giấy phép xây dựng',
        icon: Shield,
        iconColor: 'text-emerald-500',
        bgGradient: 'from-emerald-500/10 to-green-500/10',
        allowedStages: [ProjectStage.Execution, ProjectStage.Completion],
        fields: [
            { key: 'ConstructionPermitNumber', label: 'Số GPXD', type: 'text', placeholder: 'VD: 345/GPXD', required: true },
            { key: 'ConstructionPermitDate', label: 'Ngày cấp', type: 'date', required: true },
            { key: 'ConstructionPermitAgency', label: 'CQ cấp phép', type: 'text', placeholder: 'VD: Sở Xây dựng' },
        ],
    },
    {
        id: 'D',
        title: 'D — Khởi công & Giám sát',
        icon: HardHat,
        iconColor: 'text-amber-500',
        bgGradient: 'from-amber-500/10 to-orange-500/10',
        allowedStages: [ProjectStage.Execution, ProjectStage.Completion],
        fields: [
            { key: 'ActualStartDateConstruction', label: 'Ngày khởi công thực tế', type: 'date', required: true },
            { key: 'SupervisionContractor', label: 'NT tư vấn giám sát', type: 'text', placeholder: 'Tên TVGS & Mã CCNL', required: true },
            { key: 'InsuranceContract', label: 'Số HĐ bảo hiểm CT', type: 'text', placeholder: 'VD: BH-2025-001' },
            { key: 'InsuranceValue', label: 'Giá trị bảo hiểm (VNĐ)', type: 'number', placeholder: '0' },
        ],
    },
    {
        id: 'E',
        title: 'E — Nghiệm thu & Bàn giao',
        icon: ClipboardCheck,
        iconColor: 'text-rose-500',
        bgGradient: 'from-rose-500/10 to-pink-500/10',
        allowedStages: [ProjectStage.Completion],
        fields: [
            {
                key: 'AcceptanceResult', label: 'Kết quả nghiệm thu', type: 'select', options: [
                    { value: '', label: '— Chọn —' },
                    { value: 'Đạt', label: 'Đạt yêu cầu' },
                    { value: 'Đạt có điều kiện', label: 'Đạt có điều kiện' },
                    { value: 'Không đạt', label: 'Không đạt' },
                ], required: true
            },
            { key: 'AcceptanceDate', label: 'Ngày nghiệm thu', type: 'date', required: true },
            { key: 'HandoverDate', label: 'Ngày bàn giao đưa vào sử dụng', type: 'date' },
        ],
    },
];

// ══════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════

const formatCurrency = (n?: number) => {
    if (!n) return '—';
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} tỷ`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)} triệu`;
    return n.toLocaleString('vi-VN') + ' đ';
};

const formatDate = (d?: string) => {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString('vi-VN'); }
    catch { return d; }
};

const calculateCompletion = (project: Project): number => {
    const allFields: (keyof Project)[] = SECTIONS.flatMap(s => s.fields.filter(f => f.required).map(f => f.key));
    if (allFields.length === 0) return 100;
    const filled = allFields.filter(k => {
        const v = project[k];
        return v !== undefined && v !== '' && v !== null && v !== 0;
    }).length;
    return Math.round((filled / allFields.length) * 100);
};

// ══════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════

export const ProjectComplianceTab: React.FC<ProjectComplianceTabProps> = ({ project, onUpdate }) => {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['A1']));
    const [editingSection, setEditingSection] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Project>>({});
    const [saving, setSaving] = useState(false);
    const [costBreakdown, setCostBreakdown] = useState<CostBreakdown>(project.CostBreakdown || {});

    const currentStage = (project.Stage as ProjectStage) || ProjectStage.Preparation;
    const completionPct = useMemo(() => calculateCompletion(project), [project]);

    const toggleSection = (id: string) => {
        setExpandedSections(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const startEditing = (sectionId: string) => {
        setEditingSection(sectionId);
        setFormData({});
        setCostBreakdown(project.CostBreakdown || {});
    };

    const cancelEditing = () => {
        setEditingSection(null);
        setFormData({});
    };

    const handleFieldChange = useCallback((key: keyof Project, value: any) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    }, []);

    const handleSave = async () => {
        if (!editingSection) return;
        setSaving(true);
        try {
            const dataToSave: Partial<Project> = { ...formData };
            if (editingSection === 'A2' || editingSection === 'A1') {
                dataToSave.CostBreakdown = costBreakdown;
            }
            // Calculate new completion
            const mergedProject = { ...project, ...dataToSave };
            dataToSave.TT24CompletionPct = calculateCompletion(mergedProject as Project);

            await ProjectService.update(project.ProjectID, dataToSave);
            onUpdate(dataToSave);
            setEditingSection(null);
            setFormData({});
        } catch (err) {
            console.error('Save error:', err);
            alert('Lỗi khi lưu dữ liệu TT24');
        } finally {
            setSaving(false);
        }
    };

    const isSectionEditable = (section: SectionConfig): boolean => {
        return section.allowedStages.includes(currentStage);
    };

    const getFieldValue = (key: keyof Project): any => {
        if (key in formData) return formData[key];
        return project[key] ?? '';
    };

    return (
        <div className="animate-in slide-in-from-bottom-2 duration-500 space-y-6 py-4">

            {/* ── Header Card ── */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                            <Database className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black tracking-wide">
                                Dữ liệu TT24/2025/TT-BXD
                            </h2>
                            <p className="text-blue-200 text-xs mt-0.5">
                                Phụ lục III — Bảng số 01 • CSDL Quốc gia về hoạt động xây dựng
                            </p>
                        </div>
                    </div>
                    <button
                        className="px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
                        onClick={() => alert('Chức năng đồng bộ CSDL Quốc gia sẽ được triển khai khi có API kết nối.')}
                    >
                        <RefreshCw className="w-4 h-4" />
                        Đồng bộ CSDL QG
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="mt-5">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-blue-200">
                            Tiến độ hoàn thành dữ liệu
                        </span>
                        <span className="text-sm font-black">{completionPct}%</span>
                    </div>
                    <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ${completionPct >= 80 ? 'bg-emerald-400' :
                                    completionPct >= 50 ? 'bg-amber-400' : 'bg-red-400'
                                }`}
                            style={{ width: `${completionPct}%` }}
                        />
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-blue-200">
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-emerald-400 rounded-full" /> ≥80%: Sẵn sàng đồng bộ
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-amber-400 rounded-full" /> 50-79%: Thiếu dữ liệu
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-red-400 rounded-full" /> &lt;50%: Cần bổ sung
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Cost Breakdown Card (Only shown when editing A1 or A2) ── */}
            {(editingSection === 'A1' || editingSection === 'A2' || Object.values(project.CostBreakdown || {}).some(v => v)) && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                    <div className="px-5 py-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-b border-gray-200 dark:border-slate-600">
                        <h3 className="font-bold text-gray-800 dark:text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2">
                            <Ruler className="w-4 h-4 text-amber-500" />
                            A.II.7.4 — Chi tiết tổng mức đầu tư
                        </h3>
                    </div>
                    <div className="p-5">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {(['construction', 'equipment', 'management', 'consultancy', 'other', 'contingency'] as (keyof CostBreakdown)[]).map(key => {
                                const labels: Record<string, string> = {
                                    construction: 'Chi phí xây dựng',
                                    equipment: 'Chi phí thiết bị',
                                    management: 'Chi phí QLDA',
                                    consultancy: 'Chi phí TVXD',
                                    other: 'Chi phí khác',
                                    contingency: 'Dự phòng',
                                };
                                const isEditing = editingSection === 'A1' || editingSection === 'A2';
                                return (
                                    <div key={key} className="flex flex-col">
                                        <label className="text-xs text-gray-500 dark:text-slate-400 mb-1.5 font-medium">{labels[key]}</label>
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                value={costBreakdown[key] || ''}
                                                onChange={e => setCostBreakdown(prev => ({ ...prev, [key]: Number(e.target.value) || 0 }))}
                                                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="0"
                                            />
                                        ) : (
                                            <span className="text-sm font-semibold text-gray-900 dark:text-slate-200">
                                                {formatCurrency(costBreakdown[key])}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        {/* Total */}
                        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-slate-600 flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-600 dark:text-slate-300">Tổng cộng</span>
                            <span className="text-sm font-black text-blue-700 dark:text-blue-400">
                                {formatCurrency(Object.values(costBreakdown).reduce((sum, v) => sum + (v || 0), 0))}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Sections ── */}
            <div className="space-y-3">
                {SECTIONS.map(section => {
                    const isExpanded = expandedSections.has(section.id);
                    const isEditing = editingSection === section.id;
                    const editable = isSectionEditable(section);
                    const SectionIcon = section.icon;

                    // Count filled required fields in this section
                    const reqFields = section.fields.filter(f => f.required);
                    const filledReq = reqFields.filter(f => {
                        const v = project[f.key];
                        return v !== undefined && v !== '' && v !== null && v !== 0;
                    }).length;

                    return (
                        <div
                            key={section.id}
                            className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border overflow-hidden transition-all ${isEditing
                                    ? 'border-blue-400 dark:border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                                    : 'border-gray-200 dark:border-slate-700'
                                }`}
                        >
                            {/* Section Header */}
                            <button
                                onClick={() => toggleSection(section.id)}
                                className={`w-full px-5 py-4 flex items-center justify-between bg-gradient-to-r ${section.bgGradient} hover:opacity-90 transition-all`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm ${section.iconColor}`}>
                                        <SectionIcon className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-bold text-gray-800 dark:text-slate-200 text-sm">{section.title}</h3>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            {reqFields.length > 0 && (
                                                <span className={`text-xs font-semibold ${filledReq === reqFields.length
                                                        ? 'text-emerald-600'
                                                        : filledReq > 0
                                                            ? 'text-amber-600'
                                                            : 'text-gray-400'
                                                    }`}>
                                                    {filledReq}/{reqFields.length} bắt buộc
                                                </span>
                                            )}
                                            {!editable && (
                                                <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500">
                                                    <Lock className="w-3 h-3" /> Khóa (khác giai đoạn)
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {filledReq === reqFields.length && reqFields.length > 0 && (
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                    )}
                                    {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                                </div>
                            </button>

                            {/* Section Content */}
                            {isExpanded && (
                                <div className="px-5 py-4 border-t border-gray-100 dark:border-slate-700">
                                    {/* Edit/Cancel Buttons */}
                                    <div className="flex justify-end gap-2 mb-4">
                                        {!isEditing && editable && (
                                            <button
                                                onClick={() => startEditing(section.id)}
                                                className="px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 flex items-center gap-1.5 transition-all"
                                            >
                                                <Unlock className="w-3.5 h-3.5" />
                                                Chỉnh sửa
                                            </button>
                                        )}
                                        {isEditing && (
                                            <>
                                                <button
                                                    onClick={cancelEditing}
                                                    className="px-3 py-1.5 text-xs font-bold text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-all"
                                                >
                                                    Hủy
                                                </button>
                                                <button
                                                    onClick={handleSave}
                                                    disabled={saving}
                                                    className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 transition-all disabled:opacity-50"
                                                >
                                                    {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                                    {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    {/* Fields Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {section.fields.map(field => {
                                            const value = getFieldValue(field.key);
                                            return (
                                                <div key={String(field.key)} className={`flex flex-col ${field.span2 ? 'md:col-span-2' : ''}`}>
                                                    <label className="text-xs text-gray-500 dark:text-slate-400 mb-1.5 font-medium flex items-center gap-1">
                                                        {field.label}
                                                        {field.required && <span className="text-red-500">*</span>}
                                                    </label>
                                                    {isEditing ? (
                                                        field.type === 'select' ? (
                                                            <select
                                                                value={String(value)}
                                                                onChange={e => handleFieldChange(field.key, e.target.value)}
                                                                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                            >
                                                                {field.options?.map(o => (
                                                                    <option key={o.value} value={o.value}>{o.label}</option>
                                                                ))}
                                                            </select>
                                                        ) : field.type === 'textarea' ? (
                                                            <textarea
                                                                value={String(value)}
                                                                onChange={e => handleFieldChange(field.key, e.target.value)}
                                                                rows={3}
                                                                placeholder={field.placeholder}
                                                                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                                            />
                                                        ) : (
                                                            <input
                                                                type={field.type}
                                                                value={String(value)}
                                                                onChange={e => handleFieldChange(field.key, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                                                                placeholder={field.placeholder}
                                                                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                            />
                                                        )
                                                    ) : (
                                                        <span className={`text-sm ${value && value !== '' && value !== 0
                                                                ? 'font-medium text-gray-900 dark:text-slate-200'
                                                                : 'text-gray-300 dark:text-slate-600 italic'
                                                            }`}>
                                                            {field.type === 'date' ? (formatDate(String(value)) || '— chưa nhập —') :
                                                                field.type === 'number' ? (value ? formatCurrency(Number(value)) : '— chưa nhập —') :
                                                                    field.type === 'select' ? (field.options?.find(o => o.value === String(value))?.label || '— chưa chọn —') :
                                                                        (String(value) || '— chưa nhập —')}
                                                        </span>
                                                    )}
                                                    {!isEditing && field.required && (!value || value === '' || value === 0) && (
                                                        <span className="text-xs text-red-400 mt-0.5 flex items-center gap-1">
                                                            <AlertCircle className="w-3 h-3" /> Trường bắt buộc
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* ── Legend ── */}
            <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
                <p className="text-xs text-gray-500 dark:text-slate-400">
                    <strong>Ghi chú:</strong> Các trường đánh dấu <span className="text-red-500">*</span> là bắt buộc để đồng bộ lên CSDL Quốc gia.
                    Các section bị khóa (<Lock className="w-3 h-3 inline" />) chỉ mở khi dự án chuyển sang giai đoạn tương ứng.
                    Dữ liệu tuân thủ TT24/2025/TT-BXD, hiệu lực 15/10/2025.
                </p>
            </div>
        </div>
    );
};

export default ProjectComplianceTab;
