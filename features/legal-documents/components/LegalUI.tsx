import React from 'react';
import { Landmark, Gavel, ScrollText, ShieldCheck, FileText, ChevronRight } from 'lucide-react';
import {
    LegalDocument, FlatArticle, DocType,
    DOC_TYPE_LABELS, DOC_STATUS_LABELS, DOC_TYPE_COLORS, DOC_STATUS_COLORS
} from '../legalData';

// ============================================
// TYPE ICON MAP
// ============================================
export const TYPE_ICONS: Record<DocType, React.ElementType> = {
    'luat': Landmark, 'nghi-dinh': Gavel, 'thong-tu': ScrollText,
    'qcvn': ShieldCheck, 'quyet-dinh': FileText,
};

// ============================================
// HIGHLIGHT TEXT
// ============================================
export const HighlightText: React.FC<{ text: string; query: string }> = ({ text, query }) => {
    if (!query.trim()) return <>{text}</>;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
        <>
            {parts.map((part, i) =>
                regex.test(part)
                    ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-700/60 text-inherit rounded px-0.5 font-bold">{part}</mark>
                    : part
            )}
        </>
    );
};

// ============================================
// STAT CARD
// ============================================
export const StatCard: React.FC<{ label: string; value: number; color: string; icon: React.ElementType }> = ({ label, value, color, icon: Icon }) => {
    // Map inline color classes to gradient — color prop is like 'bg-gray-50 dark:bg-slate-800 ...'
    // Detect the main color from the class string
    const colorMatch = color.match(/(?:text|bg)-(\w+)-/);
    const colorName = colorMatch ? colorMatch[1] : 'blue';
    const gradientMap: Record<string, string> = {
        gray: 'from-slate-600 via-slate-700 to-slate-800',
        indigo: 'from-indigo-500 via-indigo-600 to-violet-700',
        emerald: 'from-emerald-500 via-emerald-600 to-teal-700',
        blue: 'from-blue-500 via-blue-600 to-indigo-700',
    };
    const gradient = gradientMap[colorName] || gradientMap.blue;

    return (
        <div className={`relative overflow-hidden flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-xl ring-1 ring-white/10 transition-transform hover:scale-[1.02] hover:shadow-2xl duration-300`}>
            <div className="absolute -right-3 -top-3 opacity-[0.12]">
                <Icon className="w-20 h-20" strokeWidth={1.2} />
            </div>
            <div className="p-2 rounded-xl bg-white/20 shadow-sm relative z-10">
                <Icon className="w-4 h-4 text-white" />
            </div>
            <div className="relative z-10">
                <p className="text-2xl font-black tracking-tight text-white drop-shadow-sm">{value}</p>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-white/90">{label}</p>
            </div>
        </div>
    );
};

// ============================================
// DOCUMENT CARD (SIDEBAR)
// ============================================
export const DocSidebarItem: React.FC<{
    doc: LegalDocument; isSelected: boolean; onClick: () => void;
    articleCount: { chapters: number; articles: number };
}> = ({ doc, isSelected, onClick, articleCount }) => {
    const typeColor = DOC_TYPE_COLORS[doc.type];
    const statusColor = DOC_STATUS_COLORS[doc.status];
    const Icon = TYPE_ICONS[doc.type];
    return (
        <button
            onClick={onClick}
            className={`w-full text-left p-3.5 rounded-2xl transition-all group border ${isSelected
                ? `${typeColor.bg} ${typeColor.border} ${typeColor.darkBg} ${typeColor.darkBorder} shadow-sm`
                : 'border-transparent hover:bg-gray-50 dark:hover:bg-slate-700/50'}`}
        >
            <div className="flex items-start gap-3">
                <div className={`mt-0.5 p-2 rounded-xl shrink-0 transition-colors ${isSelected
                    ? `${typeColor.bg} ${typeColor.text} ${typeColor.darkBg} ${typeColor.darkText}`
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500 group-hover:bg-white dark:group-hover:bg-slate-600'}`}>
                    <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${typeColor.bg} ${typeColor.text} ${typeColor.darkBg} ${typeColor.darkText}`}>
                            {DOC_TYPE_LABELS[doc.type]}
                        </span>
                        <span className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${statusColor.bg} ${statusColor.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusColor.dot}`}></span>
                            {DOC_STATUS_LABELS[doc.status]}
                        </span>
                    </div>
                    <p className={`text-xs font-bold leading-snug line-clamp-2 ${isSelected ? 'text-gray-900 dark:text-slate-100' : 'text-gray-600 dark:text-slate-400'}`}>
                        {doc.shortTitle}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                        <p className={`text-[10px] font-medium ${isSelected ? 'text-gray-500 dark:text-slate-400' : 'text-gray-400 dark:text-slate-500'}`}>
                            {doc.code}
                        </p>
                        {articleCount.articles > 0 && (
                            <span className="text-[9px] font-bold text-gray-400 dark:text-slate-600 bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                {articleCount.chapters}ch · {articleCount.articles}đ
                            </span>
                        )}
                    </div>
                </div>
                {isSelected && <ChevronRight className={`w-4 h-4 mt-1 shrink-0 ${typeColor.text} ${typeColor.darkText}`} />}
            </div>
        </button>
    );
};

// ============================================
// DEEP SEARCH RESULT
// ============================================
export const DeepSearchResult: React.FC<{
    result: FlatArticle; query: string;
    onNavigate: (docId: string, chapterId: string) => void;
}> = ({ result, query, onNavigate }) => (
    <button
        onClick={() => onNavigate(result.docId, result.chapterId)}
        className="w-full text-left p-3 rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all group"
    >
        <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-black uppercase tracking-wider text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded">{result.docTitle}</span>
            <span className="text-[9px] font-bold text-gray-400 dark:text-slate-500">{result.chapterCode}</span>
        </div>
        <p className="text-xs font-bold text-gray-700 dark:text-slate-300">
            <span className="font-mono text-[10px] text-gray-400 mr-1">{result.article.code}</span>
            <HighlightText text={result.article.title} query={query} />
        </p>
        <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
            <HighlightText text={result.article.summary} query={query} />
        </p>
    </button>
);
