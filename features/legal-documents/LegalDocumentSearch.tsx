import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
    Search, ChevronRight, BookOpen, FileText, Scale, Filter,
    Calendar, Building2, Eye, X, Hash, ScrollText, ShieldCheck,
    Landmark, Gavel, ArrowRight, ChevronDown, ChevronUp, Sparkles,
    Bookmark, BookmarkCheck, Copy, Check, Printer, Maximize2, Minimize2,
    Clock, Tag, Link2, BarChart3, Layers, ArrowUp, Type
} from 'lucide-react';
import {
    legalDocuments, searchDocuments, getRelatedDocuments, getDocStats,
    DOC_TYPE_LABELS, DOC_TYPE_COLORS, DOC_STATUS_LABELS, DOC_STATUS_COLORS,
    getDocArticleCount, deepSearchArticles,
    type LegalDocument, type LegalArticle, type DocType, type FlatArticle
} from './legalData';
import { useBookmarks, useRecentlyViewed, useReadingPrefs } from './useLegalStorage';

// ============================================
// TYPE ICON MAP
// ============================================
const TYPE_ICONS: Record<DocType, React.ElementType> = {
    'luat': Landmark, 'nghi-dinh': Gavel, 'thong-tu': ScrollText,
    'qcvn': ShieldCheck, 'quyet-dinh': FileText,
};

// ============================================
// HIGHLIGHT TEXT
// ============================================
const HighlightText: React.FC<{ text: string; query: string }> = ({ text, query }) => {
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
const StatCard: React.FC<{ label: string; value: number; color: string; icon: React.ElementType }> = ({ label, value, color, icon: Icon }) => (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${color} transition-all hover:shadow-sm`}>
        <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/80 shadow-sm">
            <Icon className="w-4 h-4" />
        </div>
        <div>
            <p className="text-2xl font-black tracking-tight">{value}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">{label}</p>
        </div>
    </div>
);

// ============================================
// DOCUMENT CARD (SIDEBAR)
// ============================================
const DocSidebarItem: React.FC<{
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
const DeepSearchResult: React.FC<{
    result: FlatArticle; query: string;
    onNavigate: (docId: string, chapterId: string) => void;
}> = ({ result, query, onNavigate }) => (
    <button
        onClick={() => onNavigate(result.docId, result.chapterId)}
        className="w-full text-left p-3 rounded-xl border border-gray-100 dark:border-slate-700 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all group"
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

// ============================================
// MAIN COMPONENT
// ============================================
const LegalDocumentSearch: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDocId, setSelectedDocId] = useState<string>(legalDocuments[0]?.id || '');
    const [filterType, setFilterType] = useState<DocType | 'all'>('all');
    const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
    const [showPdfViewer, setShowPdfViewer] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [readingMode, setReadingMode] = useState(false);
    const [showTOC, setShowTOC] = useState(true);
    const [showBookmarks, setShowBookmarks] = useState(false);
    const [activeArticleId, setActiveArticleId] = useState<string | null>(null);
    const [showDeepSearch, setShowDeepSearch] = useState(false);
    const [expandedArticles, setExpandedArticles] = useState<Set<string>>(new Set());

    const contentRef = useRef<HTMLDivElement>(null);
    const articleRefs = useRef<Map<string, HTMLDivElement>>(new Map());

    const { bookmarks, toggleBookmark, isBookmarked } = useBookmarks();
    const { recentlyViewed, addView } = useRecentlyViewed();
    const { prefs, setFontSize } = useReadingPrefs();

    const stats = useMemo(() => getDocStats(), []);

    const filteredDocs = useMemo(() => {
        let docs = searchQuery ? searchDocuments(searchQuery) : legalDocuments;
        if (filterType !== 'all') docs = docs.filter(d => d.type === filterType);
        return docs;
    }, [searchQuery, filterType]);

    const selectedDoc = useMemo(() => legalDocuments.find(d => d.id === selectedDocId), [selectedDocId]);
    const relatedDocs = useMemo(() => selectedDoc ? getRelatedDocuments(selectedDoc) : [], [selectedDoc]);

    // Deep search results
    const deepSearchResults = useMemo(() => {
        if (!searchQuery || searchQuery.length < 2) return [];
        return deepSearchArticles(searchQuery).slice(0, 20);
    }, [searchQuery]);

    // Track recently viewed
    useEffect(() => { if (selectedDocId) addView(selectedDocId); }, [selectedDocId]);

    // Keyboard navigation
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement) return;
            const idx = filteredDocs.findIndex(d => d.id === selectedDocId);
            if (e.key === 'ArrowDown' && idx < filteredDocs.length - 1) {
                e.preventDefault();
                setSelectedDocId(filteredDocs[idx + 1].id);
            } else if (e.key === 'ArrowUp' && idx > 0) {
                e.preventDefault();
                setSelectedDocId(filteredDocs[idx - 1].id);
            } else if (e.key === 'Escape') {
                setReadingMode(false); setShowPdfViewer(false);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [filteredDocs, selectedDocId]);

    const toggleChapter = (chapterId: string) => {
        setExpandedChapters(prev => {
            const next = new Set(prev);
            next.has(chapterId) ? next.delete(chapterId) : next.add(chapterId);
            return next;
        });
    };
    const expandAll = () => { if (selectedDoc) setExpandedChapters(new Set(selectedDoc.chapters.map(c => c.id))); };
    const collapseAll = () => setExpandedChapters(new Set());

    const scrollToArticle = useCallback((articleId: string, chapterId: string) => {
        setExpandedChapters(prev => new Set(prev).add(chapterId));
        setActiveArticleId(articleId);
        setTimeout(() => {
            articleRefs.current.get(articleId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);
    }, []);

    const toggleArticleExpand = useCallback((articleId: string) => {
        setExpandedArticles(prev => {
            const next = new Set(prev);
            next.has(articleId) ? next.delete(articleId) : next.add(articleId);
            return next;
        });
    }, []);

    const copyArticle = useCallback((article: LegalArticle) => {
        const text = `${article.code}. ${article.title}\n\n${article.content || article.summary}`;
        navigator.clipboard.writeText(text);
        setCopiedId(article.id);
        setTimeout(() => setCopiedId(null), 2000);
    }, []);

    const handlePrint = useCallback(() => {
        if (!selectedDoc) return;
        const w = window.open('', '_blank');
        if (!w) return;
        const content = selectedDoc.chapters.map(ch =>
            `<h2 style="color:#1e40af;margin-top:24px">${ch.code}: ${ch.title}</h2>` +
            ch.articles.map(a =>
                `<div style="margin:12px 0 12px 16px"><strong>${a.code}. ${a.title}</strong><div style="color:#333;margin:4px 0;white-space:pre-line;line-height:1.8">${a.content || a.summary}</div></div>`
            ).join('')
        ).join('');
        w.document.write(`<!DOCTYPE html><html><head><title>${selectedDoc.code} - ${selectedDoc.title}</title>
            <style>body{font-family:serif;max-width:800px;margin:40px auto;line-height:1.6;color:#222}h1{text-align:center;color:#1a1a2e}h2{border-bottom:1px solid #ddd;padding-bottom:6px}</style></head>
            <body><h1>${selectedDoc.code}</h1><h1>${selectedDoc.title}</h1><p style="text-align:center;color:#666">${selectedDoc.issuedBy} — Hiệu lực: ${selectedDoc.effectiveDate}</p><hr/>${content}</body></html>`);
        w.document.close();
        w.print();
    }, [selectedDoc]);

    const navigateDeepSearch = useCallback((docId: string, chapterId: string) => {
        setSelectedDocId(docId);
        setShowPdfViewer(false);
        setShowDeepSearch(false);
        setTimeout(() => {
            setExpandedChapters(prev => new Set(prev).add(chapterId));
        }, 100);
    }, []);

    const typeColor = selectedDoc ? DOC_TYPE_COLORS[selectedDoc.type] : null;
    const statusColor = selectedDoc ? DOC_STATUS_COLORS[selectedDoc.status] : null;
    const fontSizeClass = prefs.fontSize === 'sm' ? 'text-xs' : prefs.fontSize === 'lg' ? 'text-sm' : 'text-[13px]';
    const docCounts = useMemo(() => selectedDoc ? getDocArticleCount(selectedDoc.id) : { chapters: 0, articles: 0 }, [selectedDoc]);

    return (
        <div className={`flex flex-col ${readingMode ? 'fixed inset-0 z-50 bg-white dark:bg-slate-900 p-6' : 'h-[calc(100vh-140px)]'} animate-in fade-in duration-300`}>
            {/* ═══ HEADER SECTION ═══ */}
            <div className={`flex flex-col gap-4 mb-5 ${readingMode ? '' : ''}`}>
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

            {/* ═══ MAIN CONTENT AREA ═══ */}
            <div className="flex flex-1 gap-5 overflow-hidden">

                {/* ── LEFT SIDEBAR: DOCUMENT LIST ── */}
                <div className={`${readingMode ? 'hidden' : 'w-96'} bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col overflow-hidden`}>
                    {/* Sidebar Header with tabs */}
                    <div className="px-5 py-3 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
                        <div className="flex items-center gap-2">
                            <button onClick={() => setShowBookmarks(false)}
                                className={`text-[10px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-lg transition-all ${!showBookmarks ? 'bg-indigo-600 text-white' : 'text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-700'}`}>
                                📄 Văn bản ({filteredDocs.length})
                            </button>
                            <button onClick={() => setShowBookmarks(true)}
                                className={`text-[10px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-lg transition-all ${showBookmarks ? 'bg-amber-500 text-white' : 'text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-700'}`}>
                                🔖 Đánh dấu ({bookmarks.length})
                            </button>
                            {recentlyViewed.length > 0 && (
                                <span className="ml-auto flex items-center gap-1 text-[9px] font-bold text-gray-400 dark:text-slate-500">
                                    <Clock className="w-3 h-3" />
                                    {recentlyViewed.length}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                        {showBookmarks ? (
                            // Bookmarks View
                            bookmarks.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <Bookmark className="w-12 h-12 text-gray-200 dark:text-slate-700 mb-4" />
                                    <p className="text-sm font-bold text-gray-400 dark:text-slate-500">Chưa có mục đánh dấu</p>
                                    <p className="text-xs text-gray-300 dark:text-slate-600 mt-1">Nhấn 🔖 trên điều khoản để đánh dấu</p>
                                </div>
                            ) : (
                                bookmarks.map(bm => {
                                    const doc = legalDocuments.find(d => d.id === bm.docId);
                                    if (!doc) return null;
                                    let foundArticle: LegalArticle | null = null;
                                    let foundChapterId = '';
                                    for (const ch of doc.chapters) {
                                        const art = ch.articles.find(a => a.id === bm.articleId);
                                        if (art) { foundArticle = art; foundChapterId = ch.id; break; }
                                    }
                                    if (!foundArticle) return null;
                                    return (
                                        <button key={bm.articleId}
                                            onClick={() => { setSelectedDocId(bm.docId); setShowBookmarks(false); scrollToArticle(bm.articleId, foundChapterId); }}
                                            className="w-full text-left p-3 rounded-xl border border-amber-100 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-900/10 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all">
                                            <p className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">{doc.shortTitle}</p>
                                            <p className="text-xs font-bold text-gray-700 dark:text-slate-300 mt-0.5">
                                                <span className="text-gray-400 font-mono text-[10px] mr-1">{foundArticle.code}</span>
                                                {foundArticle.title}
                                            </p>
                                        </button>
                                    );
                                })
                            )
                        ) : (
                            // Document List
                            filteredDocs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <Search className="w-12 h-12 text-gray-200 dark:text-slate-700 mb-4" />
                                    <p className="text-sm font-bold text-gray-400 dark:text-slate-500">Không tìm thấy văn bản</p>
                                    <p className="text-xs text-gray-300 dark:text-slate-600 mt-1">Thử tìm với từ khóa khác</p>
                                </div>
                            ) : filteredDocs.map(doc => (
                                <DocSidebarItem key={doc.id} doc={doc} isSelected={selectedDocId === doc.id}
                                    articleCount={getDocArticleCount(doc.id)}
                                    onClick={() => { setSelectedDocId(doc.id); setShowPdfViewer(false); setExpandedChapters(new Set()); setShowDeepSearch(false); }} />
                            ))
                        )}
                    </div>
                </div>

                {/* ── RIGHT CONTENT: DOCUMENT DETAIL ── */}
                <div className="flex-1 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col overflow-hidden">
                    {selectedDoc ? (
                        <>
                            {/* Document Header */}
                            <div className="px-8 py-4 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-gray-50/80 to-white dark:from-slate-800/80 dark:to-slate-800 shrink-0">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg border ${typeColor?.bg} ${typeColor?.text} ${typeColor?.border} ${typeColor?.darkBg} ${typeColor?.darkText} ${typeColor?.darkBorder}`}>
                                                {DOC_TYPE_LABELS[selectedDoc.type]}
                                            </span>
                                            <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-lg ${statusColor?.bg} ${statusColor?.text}`}>
                                                <span className={`w-2 h-2 rounded-full ${statusColor?.dot} animate-pulse`}></span>
                                                {DOC_STATUS_LABELS[selectedDoc.status]}
                                            </span>
                                            <span className="text-[9px] font-bold text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-lg">
                                                {docCounts.chapters} chương · {docCounts.articles} điều
                                            </span>
                                        </div>
                                        <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-0.5">{selectedDoc.code}</p>
                                        <h1 className="text-lg font-black text-gray-900 dark:text-slate-100 leading-snug tracking-tight">{selectedDoc.title}</h1>
                                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400"><Building2 className="w-3.5 h-3.5" /><span className="font-medium">{selectedDoc.issuedBy}</span></div>
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400"><Calendar className="w-3.5 h-3.5" /><span className="font-medium">Ban hành: {selectedDoc.issuedDate}</span></div>
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400"><Calendar className="w-3.5 h-3.5" /><span className="font-medium">Hiệu lực: {selectedDoc.effectiveDate}</span></div>
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400"><Hash className="w-3.5 h-3.5" /><span className="font-medium">{selectedDoc.fileSize}</span></div>
                                        </div>
                                    </div>
                                    {/* Action Buttons */}
                                    <div className="flex gap-2 shrink-0 flex-wrap justify-end">
                                        <button onClick={() => setShowPdfViewer(!showPdfViewer)}
                                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${showPdfViewer
                                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30'
                                                : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'}`}>
                                            <Eye className="w-3.5 h-3.5" />{showPdfViewer ? 'Ẩn PDF' : 'Xem PDF'}
                                        </button>
                                        <button onClick={handlePrint}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border bg-white dark:bg-slate-700 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600 transition-all">
                                            <Printer className="w-3.5 h-3.5" />In
                                        </button>
                                        <button onClick={() => setReadingMode(!readingMode)}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border bg-white dark:bg-slate-700 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600 transition-all">
                                            {readingMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                                            {readingMode ? 'Thu nhỏ' : 'Đọc'}
                                        </button>
                                        {/* Font size control */}
                                        <div className="flex items-center border border-gray-200 dark:border-slate-600 rounded-xl overflow-hidden">
                                            {(['sm', 'base', 'lg'] as const).map(sz => (
                                                <button key={sz} onClick={() => setFontSize(sz)}
                                                    className={`px-2 py-2 text-[10px] font-bold transition-all ${prefs.fontSize === sz ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'}`}>
                                                    {sz === 'sm' ? 'A' : sz === 'base' ? 'A' : 'A'}
                                                    {sz === 'lg' && <span className="text-[8px]">+</span>}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Content Area with optional TOC */}
                            <div className="flex-1 flex overflow-hidden">
                                {/* Main Content */}
                                <div ref={contentRef} className="flex-1 overflow-y-auto custom-scrollbar">
                                    {showPdfViewer ? (
                                        <div className="h-full bg-[#525659] flex items-center justify-center p-4">
                                            <iframe src={`${selectedDoc.filePath}#toolbar=1`} className="w-full h-full rounded-lg shadow-2xl bg-white" title={selectedDoc.title} />
                                        </div>
                                    ) : (
                                        <div className={`p-8 space-y-6 ${fontSizeClass}`}>
                                            {/* Summary */}
                                            <div className={`p-5 rounded-2xl border ${typeColor?.bg} ${typeColor?.border} ${typeColor?.darkBg} ${typeColor?.darkBorder}`}>
                                                <div className="flex items-start gap-3">
                                                    <Sparkles className={`w-5 h-5 shrink-0 mt-0.5 ${typeColor?.text} ${typeColor?.darkText}`} />
                                                    <div>
                                                        <h3 className={`text-xs font-black uppercase tracking-widest mb-2 ${typeColor?.text} ${typeColor?.darkText}`}>Tóm tắt nội dung</h3>
                                                        <p className="text-gray-700 dark:text-slate-300 leading-relaxed font-medium">{selectedDoc.summary}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Tags */}
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Tag className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />
                                                {selectedDoc.tags.map(tag => (
                                                    <span key={tag} onClick={() => { setSearchQuery(tag); setShowDeepSearch(true); }}
                                                        className="px-2.5 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>

                                            {/* Chapters & Articles */}
                                            <div>
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                                        <BookOpen className="w-4 h-4" /> Mục lục nội dung
                                                    </h3>
                                                    <div className="flex gap-2">
                                                        <button onClick={expandAll} className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline">Mở tất cả</button>
                                                        <span className="text-gray-300 dark:text-slate-600">|</span>
                                                        <button onClick={collapseAll} className="text-[10px] font-bold text-gray-400 dark:text-slate-500 hover:underline">Thu gọn</button>
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    {selectedDoc.chapters.map(chapter => {
                                                        const isExpanded = expandedChapters.has(chapter.id);
                                                        const chBookmarkCount = chapter.articles.filter(a => isBookmarked(a.id)).length;
                                                        return (
                                                            <div key={chapter.id} className="border border-gray-200 dark:border-slate-700 rounded-2xl overflow-hidden transition-all hover:shadow-sm">
                                                                <button onClick={() => toggleChapter(chapter.id)}
                                                                    className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors text-left">
                                                                    <div className="flex items-center gap-3">
                                                                        <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${typeColor?.bg} ${typeColor?.text} ${typeColor?.darkBg} ${typeColor?.darkText} uppercase tracking-wider`}>{chapter.code}</span>
                                                                        <span className="text-sm font-bold text-gray-800 dark:text-slate-200">{chapter.title}</span>
                                                                        <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 bg-white dark:bg-slate-700 px-2 py-0.5 rounded-md border border-gray-100 dark:border-slate-600">
                                                                            {chapter.articles.length} điều
                                                                        </span>
                                                                        {chBookmarkCount > 0 && (
                                                                            <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded">
                                                                                🔖 {chBookmarkCount}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400 dark:text-slate-500" /> : <ChevronDown className="w-4 h-4 text-gray-400 dark:text-slate-500" />}
                                                                </button>

                                                                {isExpanded && (
                                                                    <div className="divide-y divide-gray-100 dark:divide-slate-700 animate-in slide-in-from-top-1 duration-200">
                                                                        {chapter.articles.map(article => {
                                                                            const isActive = activeArticleId === article.id;
                                                                            const isBM = isBookmarked(article.id);
                                                                            return (
                                                                                <div key={article.id}
                                                                                    ref={el => { if (el) articleRefs.current.set(article.id, el); }}
                                                                                    className={`px-6 py-3.5 transition-all group/article ${isActive ? 'bg-indigo-50/60 dark:bg-indigo-900/15 ring-1 ring-indigo-200 dark:ring-indigo-800' : 'hover:bg-blue-50/30 dark:hover:bg-slate-700/30'}`}>
                                                                                    <div className="flex items-start gap-3">
                                                                                        <span className="text-[10px] font-black text-gray-500 dark:text-slate-500 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-md mt-0.5 shrink-0 font-mono">
                                                                                            {article.code}
                                                                                        </span>
                                                                                        <div className="flex-1 min-w-0">
                                                                                            <p className="font-bold text-gray-800 dark:text-slate-200 mb-1">
                                                                                                <HighlightText text={article.title} query={searchQuery} />
                                                                                            </p>
                                                                                            {/* Summary always shown */}
                                                                                            <p className="text-gray-500 dark:text-slate-400 leading-relaxed text-[11px] italic">
                                                                                                <HighlightText text={article.summary} query={searchQuery} />
                                                                                            </p>
                                                                                            {/* Full content with expand/collapse */}
                                                                                            {article.content && (
                                                                                                <div className="mt-2">
                                                                                                    <button onClick={() => toggleArticleExpand(article.id)}
                                                                                                        className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors mb-1.5">
                                                                                                        {expandedArticles.has(article.id) ? (
                                                                                                            <><ChevronUp className="w-3 h-3" />Thu gọn nội dung</>
                                                                                                        ) : (
                                                                                                            <><ChevronDown className="w-3 h-3" />Xem toàn văn ({(article.content.length / 1000).toFixed(1)}k ký tự)</>
                                                                                                        )}
                                                                                                    </button>
                                                                                                    {expandedArticles.has(article.id) && (
                                                                                                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 animate-in slide-in-from-top-2 duration-200">
                                                                                                            <pre className="whitespace-pre-wrap text-[12px] leading-[1.8] text-gray-700 dark:text-slate-300 font-sans">
                                                                                                                <HighlightText text={article.content} query={searchQuery} />
                                                                                                            </pre>
                                                                                                        </div>
                                                                                                    )}
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                        {/* Article Actions */}
                                                                                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover/article:opacity-100 transition-opacity">
                                                                                            <button onClick={() => toggleBookmark(article.id, selectedDoc.id)}
                                                                                                className={`p-1.5 rounded-lg transition-all ${isBM ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'text-gray-300 dark:text-slate-600 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'}`}
                                                                                                title={isBM ? 'Bỏ đánh dấu' : 'Đánh dấu'}>
                                                                                                {isBM ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                                                                                            </button>
                                                                                            <button onClick={() => copyArticle(article)}
                                                                                                className="p-1.5 rounded-lg text-gray-300 dark:text-slate-600 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                                                                                                title="Sao chép">
                                                                                                {copiedId === article.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Related Documents */}
                                            {relatedDocs.length > 0 && (
                                                <div>
                                                    <h3 className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                                        <Link2 className="w-4 h-4" /> Văn bản liên quan
                                                    </h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        {relatedDocs.map(rd => {
                                                            const rdTypeColor = DOC_TYPE_COLORS[rd.type];
                                                            const rdStatusColor = DOC_STATUS_COLORS[rd.status];
                                                            return (
                                                                <button key={rd.id}
                                                                    onClick={() => { setSelectedDocId(rd.id); setShowPdfViewer(false); setExpandedChapters(new Set()); }}
                                                                    className="flex items-center gap-4 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-all text-left group hover:shadow-sm">
                                                                    <div className={`p-2.5 rounded-xl ${rdTypeColor.bg} ${rdTypeColor.text} ${rdTypeColor.darkBg} ${rdTypeColor.darkText}`}>
                                                                        {React.createElement(TYPE_ICONS[rd.type], { className: 'w-5 h-5' })}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-1.5 mb-1">
                                                                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${rdTypeColor.bg} ${rdTypeColor.text} ${rdTypeColor.darkBg} ${rdTypeColor.darkText}`}>{DOC_TYPE_LABELS[rd.type]}</span>
                                                                            <span className={`flex items-center gap-1 text-[9px] font-bold ${rdStatusColor.text}`}>
                                                                                <span className={`w-1.5 h-1.5 rounded-full ${rdStatusColor.dot}`}></span>{DOC_STATUS_LABELS[rd.status]}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-xs font-bold text-gray-800 dark:text-slate-200 truncate">{rd.shortTitle}</p>
                                                                        <p className="text-[10px] text-gray-400 dark:text-slate-500 font-medium mt-0.5">{rd.code}</p>
                                                                    </div>
                                                                    <ArrowRight className="w-4 h-4 text-gray-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors shrink-0" />
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* ── QUICK TOC (Right Mini Panel) ── */}
                                {showTOC && selectedDoc.chapters.length > 0 && !showPdfViewer && (
                                    <div className="w-52 border-l border-gray-100 dark:border-slate-700 bg-gray-50/30 dark:bg-slate-800/30 overflow-y-auto custom-scrollbar shrink-0">
                                        <div className="p-3">
                                            <h4 className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-1.5">
                                                <BarChart3 className="w-3 h-3" /> Mục lục nhanh
                                            </h4>
                                            <div className="space-y-1">
                                                {selectedDoc.chapters.map(ch => (
                                                    <button key={ch.id} onClick={() => { toggleChapter(ch.id); setTimeout(() => document.getElementById(`ch-${ch.id}`)?.scrollIntoView({ behavior: 'smooth' }), 100); }}
                                                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${expandedChapters.has(ch.id) ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' : 'text-gray-500 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-700'}`}>
                                                        <span className="font-black text-[9px] mr-1">{ch.code}</span>
                                                        <span className="line-clamp-1">{ch.title}</span>
                                                        <span className="text-[8px] text-gray-400 dark:text-slate-600 ml-1">({ch.articles.length}đ)</span>
                                                    </button>
                                                ))}
                                            </div>
                                            {/* Scroll to top button */}
                                            <button onClick={() => contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                                                className="w-full mt-4 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-bold text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all border border-gray-200 dark:border-slate-700">
                                                <ArrowUp className="w-3 h-3" /> Về đầu trang
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-8">
                            <Scale className="w-16 h-16 text-gray-200 dark:text-slate-700 mb-4" />
                            <h3 className="text-lg font-bold text-gray-400 dark:text-slate-500">Chọn văn bản để xem chi tiết</h3>
                            <p className="text-sm text-gray-300 dark:text-slate-600 mt-1">Sử dụng thanh tìm kiếm hoặc bộ lọc bên trên</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LegalDocumentSearch;
