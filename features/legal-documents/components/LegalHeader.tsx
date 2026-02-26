import React from 'react';
import { Search, Scale, Filter, X, FileText, Layers, ShieldCheck } from 'lucide-react';
import { DocType, DOC_TYPE_LABELS, FlatArticle } from '../legalData';
import { StatCard, DeepSearchResult } from './LegalUI';

interface LegalHeaderProps {
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    filterType: DocType | 'all';
    setFilterType: (type: DocType | 'all') => void;
    stats: any;
    showDeepSearch: boolean;
    setShowDeepSearch: (val: boolean) => void;
    deepSearchResults: FlatArticle[];
    navigateDeepSearch: (docId: string, chapterId: string) => void;
    readingMode: boolean;
}

export const LegalHeader: React.FC<LegalHeaderProps> = ({
    searchQuery, setSearchQuery, filterType, setFilterType, stats,
    showDeepSearch, setShowDeepSearch, deepSearchResults, navigateDeepSearch,
    readingMode
}) => {
    return (
        <div className="flex flex-col gap-4 mb-5">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-gray-800 dark:text-slate-100 tracking-tight uppercase flex items-center gap-3">
                        <Scale className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                        Văn bản Pháp luật Xây dựng
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 font-medium ml-11">
                        Tra cứu thông minh Luật, Nghị định, Thông tư, Quy chuẩn về xây dựng và đầu tư công
                    </p>
                </div>
                <div className="flex gap-3">
                    <StatCard label="Tổng văn bản" value={stats.total} color="bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300" icon={FileText} />
                    <StatCard label="Điều khoản" value={stats.totalArticles} color="bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400" icon={Layers} />
                    <StatCard label="Còn hiệu lực" value={stats.active} color="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400" icon={ShieldCheck} />
                </div>
            </div>

            {/* Search + Filters */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 flex items-center px-4 h-12 transition-all focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-900/40 focus-within:border-indigo-400">
                        <Search className="w-5 h-5 text-gray-400 dark:text-slate-500 mr-3" />
                        <input
                            type="text"
                            placeholder="Tìm theo số hiệu, tên văn bản, nội dung điều khoản..."
                            className="flex-1 h-full outline-none text-sm font-medium text-gray-700 dark:text-slate-300 placeholder-gray-400 dark:placeholder-slate-500 bg-transparent"
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setShowDeepSearch(e.target.value.length >= 2); }}
                            onFocus={() => { if (searchQuery.length >= 2) setShowDeepSearch(true); }}
                        />
                        {searchQuery && (
                            <button onClick={() => { setSearchQuery(''); setShowDeepSearch(false); }} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    {/* Deep Search Dropdown */}
                    {showDeepSearch && deepSearchResults.length > 0 && (
                        <div className="absolute top-14 left-0 right-0 z-50 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 max-h-96 overflow-y-auto p-3 space-y-2 animate-in slide-in-from-top-2 duration-200">
                            <div className="flex items-center justify-between px-2 pb-2 border-b border-gray-100 dark:border-slate-700">
                                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                                    🔍 Tìm thấy {deepSearchResults.length} điều khoản
                                </span>
                                <button onClick={() => setShowDeepSearch(false)} className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
                            </div>
                            {deepSearchResults.map(r => (
                                <DeepSearchResult key={r.article.id} result={r} query={searchQuery} onNavigate={navigateDeepSearch} />
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                    {(['all', 'luat', 'nghi-dinh', 'thong-tu', 'qcvn', 'quyet-dinh'] as const).map(type => {
                        const isActive = filterType === type;
                        const label = type === 'all' ? 'Tất cả' : DOC_TYPE_LABELS[type];
                        const count = type === 'all' ? stats.total : stats.byType[type];
                        return (
                            <button key={type} onClick={() => setFilterType(type)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${isActive
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200 dark:shadow-indigo-900/30'
                                    : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
                                {label}
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${isActive ? 'bg-white/20' : 'bg-gray-100 dark:bg-slate-700'}`}>{count}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
