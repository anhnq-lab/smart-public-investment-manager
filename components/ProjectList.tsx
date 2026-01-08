import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockProjects, formatCurrency, formatFullCurrency, mockEmployees } from '../mockData';
import { ProjectStatus, ProjectGroup, Project, InvestmentType } from '../types';

import { Eye, Edit3, MapPin, ExternalLink, User, LayoutGrid, List as ListIcon, Search, Filter, RefreshCw, Plus, X, Check, Wand2, Info, Building, ArrowRight, UserPlus, Trash2 } from 'lucide-react';

// --- INLINED UTILS TO PREVENT IMPORT CRASHES ---
enum ProjectType {
    NoProject = '0',
    Civil = '1',
    Industrial = '2',
    Infrastructure = '3',
    Transport = '4',
    Agriculture = '5',
    Mixed = '6'
}

enum ProcedureType {
    Appraisal = '1',
    DesignAfterBasic = '2',
    Permit = '3'
}

interface ProjectCodeParams {
    provinceCode?: string;
    year?: string;
    projectType: ProjectType;
    procedureType?: ProcedureType;
    sequence?: number | string;
    modification?: string;
}

const generateProjectCode = (params: ProjectCodeParams): string => {
    const province = params.provinceCode || '42'; // Default Hà Tĩnh
    const year = params.year || new Date().getFullYear().toString().slice(-2);
    const type = params.projectType;
    const procedure = params.procedureType || ProcedureType.Appraisal;

    let seqStr = '';
    if (params.sequence) {
        seqStr = params.sequence.toString().padStart(5, '0');
    } else {
        seqStr = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    }

    const modification = params.modification || '00';

    return `${province}${year}${type}${procedure}${seqStr}${modification}`;
};
// -----------------------------------------------


const ProgressBar: React.FC<{ value: number; colorClass: string }> = ({ value, colorClass }) => (
    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div
            className={`h-full rounded-full ${colorClass}`}
            style={{ width: `${value}%` }}
        ></div>
    </div>
);

const getStatusLabel = (status: ProjectStatus) => {
    switch (status) {
        case ProjectStatus.Preparation: return 'Chuẩn bị đầu tư';
        case ProjectStatus.Execution: return 'Thực hiện đầu tư';
        case ProjectStatus.Finished: return 'Kết thúc đầu tư';
        case ProjectStatus.Operation: return 'Vận hành khai thác';
        default: return 'Không xác định';
    }
};

const ProjectCard: React.FC<{ project: Project; onClick: () => void }> = ({ project, onClick }) => {
    // Determine badge color and text based on status
    let badgeColor = "bg-blue-500";

    if (project.Status === ProjectStatus.Finished) {
        badgeColor = "bg-emerald-500";
    } else if (project.Status === ProjectStatus.Preparation) {
        badgeColor = "bg-orange-400";
    }

    // Calculate disbursement amount for tooltip
    const disbursedAmount = (project.TotalInvestment * (project.PaymentProgress || 0)) / 100;

    return (
        <div
            onClick={onClick}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group flex flex-col h-full cursor-pointer hover:-translate-y-1"
        >
            {/* Image Header */}
            <div className="relative h-48 w-full overflow-hidden">
                <img
                    src={project.ImageUrl || "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=600&auto=format&fit=crop"}
                    alt={project.ProjectName}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute top-4 right-4">
                    <span className={`${badgeColor} text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wide shadow-sm`}>
                        {getStatusLabel(project.Status)}
                    </span>
                </div>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="font-bold text-lg leading-tight mb-1 truncate" title={project.ProjectName}>{project.ProjectName}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-gray-200">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{project.LocationCode}</span>
                    </div>
                </div>
            </div>

            {/* Content Body */}
            <div className="p-5 flex-1 flex flex-col">
                {/* Contractor Info (Replaces Investor) */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                        <Building className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">NHÀ THẦU CHÍNH</p>
                        <p className="text-sm font-medium text-gray-700 truncate" title={project.MainContractorName}>{project.MainContractorName || "Đang lựa chọn"}</p>
                    </div>
                    <span className="ml-auto text-xs text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded">
                        {(project.ProjectID || '').slice(-5)}
                    </span>
                </div>

                {/* Progress Stats */}
                <div className="space-y-4 mb-6">
                    <div>
                        <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-gray-500">Tiến độ dự án</span>
                            <span className="font-bold text-blue-600">{project.Progress || 0}%</span>
                        </div>
                        <ProgressBar value={project.Progress || 0} colorClass="bg-blue-500" />
                    </div>

                    {/* Disbursement with Tooltip */}
                    <div className="group/tooltip relative">
                        <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-gray-500">Tỷ lệ giải ngân</span>
                            <span className="font-bold text-emerald-600">{project.PaymentProgress || 0}%</span>
                        </div>
                        <ProgressBar value={project.PaymentProgress || 0} colorClass="bg-emerald-500" />

                        {/* Hover Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/tooltip:block z-10 w-max animate-in fade-in zoom-in-95 duration-200">
                            <div className="bg-slate-800 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg shadow-xl border border-slate-700 relative">
                                Đã giải ngân: {formatCurrency(disbursedAmount)}
                                <div className="w-2 h-2 bg-slate-800 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2 border-r border-b border-slate-700"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">NGÂN SÁCH</p>
                        <p className="text-base font-bold text-gray-900">{formatCurrency(project.TotalInvestment)}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <ArrowRight className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProjectList: React.FC = () => {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); // Default to grid as requested
    const [projects, setProjects] = useState<Project[]>(mockProjects);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    const [filters, setFilters] = useState({
        status: 'all',
        group: 'all',
        type: 'all',
        minCapital: '',
        maxCapital: '',
        year: ''
    });

    // Helper to remove Vietnamese tones
    const removeVietnameseTones = (str: string) => {
        return str
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd').replace(/Đ/g, 'D');
    };

    // Derived filtered projects
    const filteredProjects = React.useMemo(() => {
        return projects.filter(p => {
            // 1. Text Search (Wide Component Scan)
            const q = removeVietnameseTones(searchQuery.toLowerCase());

            const normalize = (val: string) => removeVietnameseTones((val || '').toLowerCase());

            const matchesSearch =
                normalize(p.ProjectName).includes(q) ||
                normalize(p.ProjectID).includes(q) ||
                normalize(p.MainContractorName || '').includes(q) ||
                normalize(p.InvestorName || '').includes(q);

            if (!matchesSearch) return false;

            // 2. Advanced Filters
            if (filters.status !== 'all' && p.Status !== Number(filters.status)) return false;
            if (filters.group !== 'all' && p.GroupCode !== filters.group) return false;
            if (filters.type !== 'all' && p.InvestmentType !== Number(filters.type)) return false;

            if (filters.minCapital && p.TotalInvestment < Number(filters.minCapital)) return false;
            if (filters.maxCapital && p.TotalInvestment > Number(filters.maxCapital)) return false;

            if (filters.year) {
                const pYear = new Date(p.ApprovalDate).getFullYear().toString();
                if (pYear !== filters.year) return false;
            }

            return true;
        });
    }, [projects, searchQuery, filters]);

    // Form State
    const defaultInvestor = 'Ban Quản lý dự án đầu tư xây dựng';
    const [newProject, setNewProject] = useState<Partial<Project>>({
        ProjectID: '',
        ProjectName: '',
        GroupCode: ProjectGroup.C,
        TotalInvestment: 0,
        LocationCode: 'Hà Nội',
        InvestorName: defaultInvestor,
        MainContractorName: '',
        InvestmentType: InvestmentType.Public,
        ConstructionType: 'Dân dụng',
        ConstructionGrade: 'II',
        ApprovalDate: new Date().toISOString().split('T')[0],
        Members: []
    });

    const handleProjectClick = (projectId: string) => {
        navigate(`/projects/${projectId}`);
    };

    // Helper to map Construction Type to Code Enum
    const getTypeCode = (constructionType?: string): ProjectType => {
        switch (constructionType) {
            case 'Dân dụng': return ProjectType.Civil;
            case 'Công nghiệp': return ProjectType.Industrial;
            case 'Hạ tầng kỹ thuật': return ProjectType.Infrastructure;
            case 'Giao thông': return ProjectType.Transport;
            case 'NN&PTNT': return ProjectType.Agriculture;
            default: return ProjectType.Mixed;
        }
    };

    const handleOpenModal = () => {
        // Initial ID generation
        const initialDate = new Date().toISOString().split('T')[0];
        const initialType = 'Dân dụng';

        const autoID = generateProjectCode({
            projectType: getTypeCode(initialType),
            year: initialDate.slice(2, 4),
            sequence: projects.length + 1
        });

        setNewProject({
            ProjectID: autoID,
            ProjectName: '',
            GroupCode: ProjectGroup.C,
            TotalInvestment: 0,
            LocationCode: 'Hà Nội',
            InvestorName: defaultInvestor,
            MainContractorName: '',
            InvestmentType: InvestmentType.Public,
            ConstructionType: initialType,
            ConstructionGrade: 'II',
            ApprovalDate: initialDate,
            Members: []
        });
        setIsModalOpen(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        // Clone current state for updates
        const updatedProject = { ...newProject, [name]: value };

        if (name === 'TotalInvestment') {
            const amount = Number(value);
            let group = ProjectGroup.C;
            if (amount >= 2300000000000) group = ProjectGroup.A;
            else if (amount >= 120000000000) group = ProjectGroup.B;
            updatedProject.GroupCode = group;
            updatedProject.TotalInvestment = amount;
        }

        // Auto-regenerate Code if Date or Type changes
        if (name === 'ConstructionType' || name === 'ApprovalDate') {
            const pType = getTypeCode(name === 'ConstructionType' ? value : newProject.ConstructionType);
            const pDate = name === 'ApprovalDate' ? value : newProject.ApprovalDate;
            const yearStr = pDate ? pDate.slice(2, 4) : new Date().getFullYear().toString().slice(-2);

            const newID = generateProjectCode({
                projectType: pType,
                year: yearStr,
                sequence: projects.length + 1
            });
            updatedProject.ProjectID = newID;
        }

        setNewProject(updatedProject);
    };

    const addMember = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const empId = e.target.value;
        if (empId && !newProject.Members?.includes(empId)) {
            setNewProject(prev => ({
                ...prev,
                Members: [...(prev.Members || []), empId]
            }));
        }
        e.target.value = ""; // Reset select
    };

    const removeMember = (empId: string) => {
        setNewProject(prev => ({
            ...prev,
            Members: prev.Members?.filter(id => id !== empId)
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const projectToAdd: Project = {
            ...newProject as Project,
            Status: ProjectStatus.Preparation,
            Progress: 0,
            PaymentProgress: 0,
            IsEmergency: false,
            DecisionMakerID: 1,
            CapitalSource: "Ngân sách Tỉnh",
            MainContractorName: newProject.MainContractorName || "Đang lựa chọn",
            ImageUrl: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=600&auto=format&fit=crop"
        };

        mockProjects.push(projectToAdd);
        setProjects([projectToAdd, ...projects]);
        setIsModalOpen(false);
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        setFilters({
            status: 'all',
            group: 'all',
            type: 'all',
            minCapital: '',
            maxCapital: '',
            year: ''
        });
    };

    // Style constants for Modern High Contrast
    const inputClass = "w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 transition-all shadow-sm";
    const labelClass = "block text-sm font-semibold text-gray-700 mb-2";

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Toolbar */}
            <div className="flex flex-col gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm transition-all">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm dự án, nhà thầu, chủ đầu tư..."
                            className="w-full pl-9 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all shadow-sm placeholder-gray-400"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-10 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                        <button
                            onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                            className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${isFilterPanelOpen ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100 text-gray-500'}`}
                        >
                            <Filter className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button
                            onClick={() => {
                                setProjects(mockProjects);
                                handleClearFilters();
                            }}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Tải lại dữ liệu"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>

                        <div className="h-8 w-px bg-gray-200 mx-1"></div>

                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <ListIcon className="w-4 h-4" />
                            </button>
                        </div>

                        <button
                            onClick={handleOpenModal}
                            className="flex-1 md:flex-none flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 hover:-translate-y-0.5"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Thêm mới</span>
                        </button>
                    </div>
                </div>

                {/* Advanced Filter Panel */}
                {isFilterPanelOpen && (
                    <div className="pt-4 border-t border-dashed border-gray-200 animate-in slide-in-from-top-2 duration-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Trạng thái</label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">Tất cả trạng thái</option>
                                    <option value={ProjectStatus.Preparation}>Chuẩn bị đầu tư</option>
                                    <option value={ProjectStatus.Execution}>Thực hiện đầu tư</option>
                                    <option value={ProjectStatus.Finished}>Kết thúc đầu tư</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Nhóm dự án</label>
                                <select
                                    value={filters.group}
                                    onChange={(e) => setFilters(prev => ({ ...prev, group: e.target.value }))}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">Tất cả nhóm</option>
                                    <option value={ProjectGroup.A}>Nhóm A</option>
                                    <option value={ProjectGroup.B}>Nhóm B</option>
                                    <option value={ProjectGroup.C}>Nhóm C</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Nguồn vốn</label>
                                <select
                                    value={filters.type}
                                    onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">Tất cả nguồn vốn</option>
                                    <option value={InvestmentType.Public}>Đầu tư công</option>
                                    <option value={InvestmentType.PPP}>Đối tác công tư (PPP)</option>
                                    <option value={InvestmentType.Other}>Khác</option>
                                </select>
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Tổng mức đầu tư (Tỷ đồng)</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        placeholder="Từ"
                                        value={filters.minCapital ? Number(filters.minCapital) / 1000000000 : ''}
                                        onChange={(e) => setFilters(prev => ({ ...prev, minCapital: e.target.value ? (Number(e.target.value) * 1000000000).toString() : '' }))}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-400">-</span>
                                    <input
                                        type="number"
                                        placeholder="Đến"
                                        value={filters.maxCapital ? Number(filters.maxCapital) / 1000000000 : ''}
                                        onChange={(e) => setFilters(prev => ({ ...prev, maxCapital: e.target.value ? (Number(e.target.value) * 1000000000).toString() : '' }))}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {(filters.status !== 'all' || filters.group !== 'all' || filters.type !== 'all' || filters.minCapital || filters.maxCapital) && (
                            <div className="flex justify-end mt-3">
                                <button
                                    onClick={handleClearFilters}
                                    className="text-xs font-medium text-red-500 hover:text-red-700 hover:underline flex items-center gap-1"
                                >
                                    <X className="w-3 h-3" />
                                    Xóa bộ lọc
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Project Count Info */}
            <div className="flex items-center justify-between text-sm text-gray-500 px-1">
                <p>Hiển thị <span className="font-bold text-gray-900">{filteredProjects.length}</span> dự án</p>
                {projects.length !== filteredProjects.length && (
                    <p>Tổng số: {projects.length}</p>
                )}
            </div>

            {/* Create Project Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in zoom-in-95 duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">Thêm dự án mới</h3>
                                <p className="text-sm text-gray-500">Thiết lập thông tin dự án đầu tư công</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                            <div className="p-6 space-y-8">

                                {/* BLOCK 1: MÃ DỰ ÁN & TÊN */}
                                <div className="space-y-6">
                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col md:flex-row items-center gap-4">
                                        <div className="p-3 bg-white rounded-lg text-blue-600 shadow-sm">
                                            <Wand2 className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1 text-center md:text-left">
                                            <label className="text-xs font-bold text-blue-700 uppercase tracking-wide">Mã dự án (Tự động)</label>
                                            <div className="font-mono font-bold text-gray-800 text-xl flex items-center justify-center md:justify-start gap-3 mt-1">
                                                {newProject.ProjectID}
                                                <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-blue-200 text-gray-500 font-sans font-normal">
                                                    Theo TT 24/2025/BXD
                                                </span>
                                            </div>
                                        </div>
                                        <div className="hidden md:block w-px h-10 bg-blue-200 mx-4"></div>
                                        <div className="flex-1 w-full">
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Ngày lập dự án</label>
                                            <input
                                                name="ApprovalDate"
                                                value={newProject.ApprovalDate}
                                                onChange={handleInputChange}
                                                type="date"
                                                className={`${inputClass} !py-2 [color-scheme:dark]`}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className={labelClass}>Tên dự án <span className="text-red-500">*</span></label>
                                        <input
                                            required
                                            name="ProjectName"
                                            value={newProject.ProjectName}
                                            onChange={handleInputChange}
                                            type="text"
                                            className={inputClass}
                                            placeholder="Nhập tên đầy đủ của dự án..."
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* BLOCK 2: THÔNG TIN CHUNG */}
                                    <div className="space-y-5">
                                        <h4 className="text-sm font-bold text-gray-500 uppercase border-b border-gray-100 pb-2 flex items-center gap-2">
                                            <Info className="w-4 h-4" /> Thông tin chung
                                        </h4>

                                        <div>
                                            <label className={labelClass}>Chủ đầu tư</label>
                                            <input
                                                name="InvestorName"
                                                value={newProject.InvestorName}
                                                disabled
                                                type="text"
                                                className={`${inputClass} !bg-slate-900 !text-gray-400 cursor-not-allowed`}
                                            />
                                            <p className="text-[10px] text-gray-400 mt-1">* Mặc định theo tài khoản đơn vị</p>
                                        </div>

                                        <div>
                                            <label className={labelClass}>Địa điểm thực hiện</label>
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                                <input
                                                    name="LocationCode"
                                                    value={newProject.LocationCode}
                                                    onChange={handleInputChange}
                                                    type="text"
                                                    className={`${inputClass} pl-10`}
                                                />
                                            </div>
                                        </div>

                                        {/* MEMBER SELECTION */}
                                        <div>
                                            <label className={labelClass}>Thành viên Ban QLDA</label>
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {newProject.Members?.map(memberId => {
                                                    const member = mockEmployees.find(e => e.EmployeeID === memberId);
                                                    if (!member) return null;
                                                    return (
                                                        <div key={memberId} className="flex items-center gap-2 bg-slate-100 pl-1 pr-2 py-1 rounded-full border border-slate-200">
                                                            <img src={member.AvatarUrl} alt="" className="w-6 h-6 rounded-full" />
                                                            <span className="text-xs font-medium text-slate-700">{member.FullName}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeMember(memberId)}
                                                                className="p-0.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-red-500"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <div className="relative">
                                                <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                                <select
                                                    onChange={addMember}
                                                    className={`${inputClass} pl-10 appearance-none`}
                                                    defaultValue=""
                                                >
                                                    <option value="" disabled>+ Thêm thành viên vào dự án</option>
                                                    {mockEmployees.filter(e => !newProject.Members?.includes(e.EmployeeID)).map(emp => (
                                                        <option key={emp.EmployeeID} value={emp.EmployeeID}>
                                                            {emp.FullName} - {emp.Position}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* BLOCK 3: THÔNG SỐ KỸ THUẬT */}
                                    <div className="space-y-5">
                                        <h4 className="text-sm font-bold text-gray-500 uppercase border-b border-gray-100 pb-2 flex items-center gap-2">
                                            <Building className="w-4 h-4" /> Thông số kỹ thuật
                                        </h4>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className={labelClass}>Loại công trình</label>
                                                <select
                                                    name="ConstructionType"
                                                    value={newProject.ConstructionType}
                                                    onChange={handleInputChange}
                                                    className={inputClass}
                                                >
                                                    <option value="Dân dụng">Dân dụng</option>
                                                    <option value="Công nghiệp">Công nghiệp</option>
                                                    <option value="Giao thông">Giao thông</option>
                                                    <option value="NN&PTNT">NN & PTNT</option>
                                                    <option value="Hạ tầng kỹ thuật">Hạ tầng kỹ thuật</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className={labelClass}>Cấp công trình</label>
                                                <select
                                                    name="ConstructionGrade"
                                                    value={newProject.ConstructionGrade}
                                                    onChange={handleInputChange}
                                                    className={inputClass}
                                                >
                                                    <option value="Đặc biệt">Đặc biệt</option>
                                                    <option value="I">Cấp I</option>
                                                    <option value="II">Cấp II</option>
                                                    <option value="III">Cấp III</option>
                                                    <option value="IV">Cấp IV</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className={labelClass}>Loại hình đầu tư</label>
                                            <select
                                                name="InvestmentType"
                                                value={newProject.InvestmentType}
                                                onChange={handleInputChange}
                                                className={inputClass}
                                            >
                                                <option value={InvestmentType.Public}>Đầu tư công</option>
                                                <option value={InvestmentType.PPP}>Đối tác công tư (PPP)</option>
                                                <option value={InvestmentType.StateNonPublic}>Vốn nhà nước ngoài ĐTC</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* BLOCK 4: TÀI CHÍNH & PHÂN LOẠI */}
                                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                    <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <Building className="w-4 h-4 text-emerald-600" /> Tài chính & Phân loại dự án
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                        <div>
                                            <label className={labelClass}>Tổng mức đầu tư (VNĐ)</label>
                                            <div className="relative">
                                                <input
                                                    name="TotalInvestment"
                                                    value={newProject.TotalInvestment}
                                                    onChange={handleInputChange}
                                                    type="number"
                                                    className={`${inputClass} !bg-emerald-900 pr-12`}
                                                    placeholder="0"
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400 font-bold">VNĐ</span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2 font-medium">
                                                Bằng chữ: {newProject.TotalInvestment ? formatFullCurrency(Number(newProject.TotalInvestment)) : 'Không đồng'}
                                            </p>
                                        </div>

                                        <div className="flex items-center h-full pt-1">
                                            <div className="hidden md:flex items-center justify-center w-12 text-gray-300">
                                                <ArrowRight className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1 bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nhóm dự án (Tự động)</label>
                                                <div className="flex items-center justify-between">
                                                    <select
                                                        name="GroupCode"
                                                        value={newProject.GroupCode}
                                                        onChange={handleInputChange}
                                                        className="bg-transparent font-bold text-gray-800 text-xl border-none focus:ring-0 p-0 cursor-pointer"
                                                    >
                                                        <option value={ProjectGroup.A}>Nhóm A</option>
                                                        <option value={ProjectGroup.B}>Nhóm B</option>
                                                        <option value={ProjectGroup.C}>Nhóm C</option>
                                                    </select>
                                                    <span className={`text-xs px-2 py-1 rounded font-medium ${newProject.GroupCode === ProjectGroup.A ? 'bg-red-100 text-red-700' :
                                                        newProject.GroupCode === ProjectGroup.B ? 'bg-blue-100 text-blue-700' :
                                                            'bg-green-100 text-green-700'
                                                        }`}>
                                                        {newProject.GroupCode === ProjectGroup.A ? 'Quan trọng QG' :
                                                            newProject.GroupCode === ProjectGroup.B ? 'Cấp Tỉnh/Bộ' : 'Quy mô nhỏ'}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-emerald-600 mt-2 flex items-center gap-1 font-semibold">
                                                    <Wand2 className="w-3 h-3" /> Phân loại theo Luật ĐTC
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </form>

                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-5 py-2.5 text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-100 font-medium transition-colors"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleSubmit}
                                type="button"
                                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium flex items-center gap-2 shadow-lg shadow-blue-200 transition-colors"
                            >
                                <Check className="w-4 h-4" />
                                Tạo dự án
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Content */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredProjects.map(project => (
                        <ProjectCard
                            key={project.ProjectID}
                            project={project}
                            onClick={() => handleProjectClick(project.ProjectID)}
                        />
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
                                <tr>
                                    <th className="px-6 py-4">Mã dự án</th>
                                    <th className="px-6 py-4">Tên dự án</th>
                                    <th className="px-6 py-4">Nhà thầu chính</th>
                                    <th className="px-6 py-4 text-right">Tổng mức ĐT</th>
                                    <th className="px-6 py-4 text-center">Tiến độ</th>
                                    <th className="px-6 py-4 text-center">Giai đoạn</th>
                                    <th className="px-6 py-4 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredProjects.map((project) => (
                                    <tr
                                        key={project.ProjectID}
                                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                                        onClick={() => handleProjectClick(project.ProjectID)}
                                    >
                                        <td className="px-6 py-4 font-medium text-gray-900">{project.ProjectID}</td>
                                        <td className="px-6 py-4">
                                            <div className="line-clamp-2 max-w-xs font-medium text-gray-800" title={project.ProjectName}>
                                                {project.ProjectName}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                <MapPin className="w-3 h-3" /> {project.LocationCode}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs font-medium text-gray-700">{project.MainContractorName || 'Chưa lựa chọn'}</div>
                                            {project.ConstructionType && (
                                                <div className="text-[10px] text-gray-400 mt-0.5">{project.ConstructionType} - Cấp {project.ConstructionGrade}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-gray-900">
                                            {formatFullCurrency(project.TotalInvestment)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="w-24 mx-auto">
                                                <div className="flex justify-between text-[10px] mb-1">
                                                    <span>{project.Progress || 0}%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${project.Progress || 0}%` }}></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${project.Status === ProjectStatus.Preparation ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                project.Status === ProjectStatus.Execution ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                    project.Status === ProjectStatus.Finished ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                        'bg-gray-50 text-gray-700 border-gray-200'
                                                }`}>
                                                {getStatusLabel(project.Status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"><Eye className="w-4 h-4" /></button>
                                                <button className="p-1.5 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"><Edit3 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectList;