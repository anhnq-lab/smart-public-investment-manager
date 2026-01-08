import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Building2, Users, FileText, Briefcase, ArrowRight, Clock, TrendingUp } from 'lucide-react';
import { mockProjects, mockContractors, mockContracts, mockEmployees, mockBiddingPackages } from '../mockData';
import { ProjectStatus } from '../types';

interface SearchResult {
    id: string;
    title: string;
    subtitle: string;
    type: 'project' | 'contractor' | 'contract' | 'employee' | 'package';
    url: string;
    icon: React.ElementType;
    meta?: string;
}

interface GlobalSearchProps {
    isOpen: boolean;
    onClose: () => void;
    initialQuery?: string;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose, initialQuery = '' }) => {
    const [query, setQuery] = useState(initialQuery);
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
            setQuery(initialQuery);
        }
    }, [isOpen, initialQuery]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex(prev => Math.min(prev + 1, results.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex(prev => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter' && results[activeIndex]) {
                handleSelect(results[activeIndex]);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, activeIndex]);

    const results = useMemo<SearchResult[]>(() => {
        if (!query.trim()) return [];

        const q = query.toLowerCase();
        const matches: SearchResult[] = [];

        // Search Projects
        mockProjects
            .filter(p => p.ProjectName.toLowerCase().includes(q) || p.ProjectID.toLowerCase().includes(q))
            .slice(0, 5)
            .forEach(p => {
                matches.push({
                    id: p.ProjectID,
                    title: p.ProjectName,
                    subtitle: `Mã: ${p.ProjectID} • Nhóm ${p.GroupCode}`,
                    type: 'project',
                    url: `/projects/${p.ProjectID}`,
                    icon: Building2,
                    meta: p.Status === ProjectStatus.Execution ? 'Đang triển khai' :
                        p.Status === ProjectStatus.Finished ? 'Đã hoàn thành' : 'Chuẩn bị'
                });
            });

        // Search Contractors
        mockContractors
            .filter(c => c.FullName.toLowerCase().includes(q) || c.ContractorID.toLowerCase().includes(q))
            .slice(0, 3)
            .forEach(c => {
                matches.push({
                    id: c.ContractorID,
                    title: c.FullName,
                    subtitle: `MST: ${c.ContractorID}`,
                    type: 'contractor',
                    url: `/contractors/${c.ContractorID}`,
                    icon: Briefcase,
                    meta: c.IsForeign ? 'Nhà thầu nước ngoài' : 'Nhà thầu trong nước'
                });
            });

        // Search Employees
        mockEmployees
            .filter(e => e.FullName.toLowerCase().includes(q) || e.Position.toLowerCase().includes(q))
            .slice(0, 3)
            .forEach(e => {
                matches.push({
                    id: e.EmployeeID,
                    title: e.FullName,
                    subtitle: `${e.Position} • ${e.Department}`,
                    type: 'employee',
                    url: `/employees/${e.EmployeeID}`,
                    icon: Users
                });
            });

        // Search Contracts
        mockContracts
            .filter(c => c.ContractID.toLowerCase().includes(q))
            .slice(0, 3)
            .forEach(c => {
                const contractor = mockContractors.find(ct => ct.ContractorID === c.ContractorID);
                matches.push({
                    id: c.ContractID,
                    title: `Hợp đồng ${c.ContractID}`,
                    subtitle: contractor?.FullName || 'Nhà thầu',
                    type: 'contract',
                    url: `/contracts/${c.ContractID}`,
                    icon: FileText
                });
            });

        // Search Packages
        mockBiddingPackages
            .filter(p => p.PackageName.toLowerCase().includes(q) || p.PackageNumber.toLowerCase().includes(q))
            .slice(0, 3)
            .forEach(p => {
                matches.push({
                    id: p.PackageID,
                    title: p.PackageName,
                    subtitle: `Số hiệu: ${p.PackageNumber}`,
                    type: 'package',
                    url: `/projects/${p.ProjectID}/packages/${p.PackageID}`,
                    icon: TrendingUp
                });
            });

        return matches.slice(0, 10);
    }, [query]);

    const handleSelect = (result: SearchResult) => {
        navigate(result.url);
        onClose();
        setQuery('');
    };

    const typeLabels: Record<string, string> = {
        project: 'Dự án',
        contractor: 'Nhà thầu',
        contract: 'Hợp đồng',
        employee: 'Nhân sự',
        package: 'Gói thầu'
    };

    const typeColors: Record<string, string> = {
        project: 'bg-blue-100 text-blue-700',
        contractor: 'bg-purple-100 text-purple-700',
        contract: 'bg-emerald-100 text-emerald-700',
        employee: 'bg-orange-100 text-orange-700',
        package: 'bg-cyan-100 text-cyan-700'
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Search Input */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                    <Search className="w-5 h-5 text-gray-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => {
                            setQuery(e.target.value);
                            setActiveIndex(0);
                        }}
                        placeholder="Tìm kiếm dự án, nhà thầu, hợp đồng, nhân sự..."
                        className="flex-1 text-gray-800 placeholder-gray-400 focus:outline-none text-base"
                        autoComplete="off"
                    />
                    {query && (
                        <button
                            onClick={() => setQuery('')}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="w-4 h-4 text-gray-400" />
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="px-2 py-1 text-xs font-medium text-gray-400 bg-gray-100 rounded border border-gray-200"
                    >
                        ESC
                    </button>
                </div>

                {/* Results */}
                <div className="max-h-[400px] overflow-y-auto">
                    {query && results.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p className="font-medium">Không tìm thấy kết quả</p>
                            <p className="text-sm mt-1">Thử tìm với từ khóa khác</p>
                        </div>
                    )}

                    {!query && (
                        <div className="p-6">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Gợi ý tìm kiếm</p>
                            <div className="flex flex-wrap gap-2">
                                {['Trường Chính trị', 'Cầu Đông', 'Bệnh viện', 'HĐ-2024'].map(suggestion => (
                                    <button
                                        key={suggestion}
                                        onClick={() => setQuery(suggestion)}
                                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-full transition-colors flex items-center gap-1"
                                    >
                                        <Clock className="w-3 h-3 text-gray-400" />
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {results.length > 0 && (
                        <div className="py-2">
                            {results.map((result, idx) => (
                                <button
                                    key={`${result.type}-${result.id}`}
                                    onClick={() => handleSelect(result)}
                                    onMouseEnter={() => setActiveIndex(idx)}
                                    className={`w-full px-5 py-3 flex items-center gap-4 text-left transition-colors ${activeIndex === idx ? 'bg-blue-50' : 'hover:bg-gray-50'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${typeColors[result.type]}`}>
                                        <result.icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-800 truncate">{result.title}</p>
                                        <p className="text-xs text-gray-500 truncate">{result.subtitle}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {result.meta && (
                                            <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                                                {result.meta}
                                            </span>
                                        )}
                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${typeColors[result.type]}`}>
                                            {typeLabels[result.type]}
                                        </span>
                                        <ArrowRight className={`w-4 h-4 transition-opacity ${activeIndex === idx ? 'opacity-100 text-blue-600' : 'opacity-0'}`} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-mono">↑</kbd>
                            <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-mono">↓</kbd>
                            để di chuyển
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-mono">Enter</kbd>
                            để chọn
                        </span>
                    </div>
                    <span>{results.length} kết quả</span>
                </div>
            </div>

            {/* Backdrop click to close */}
            <div className="absolute inset-0 -z-10" onClick={onClose} />
        </div>
    );
};

export default GlobalSearch;
