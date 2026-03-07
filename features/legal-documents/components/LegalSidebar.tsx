import React from 'react';
import { Bookmark, Search, Clock, FileText } from 'lucide-react';
import { LegalDocument, legalDocuments, getDocArticleCount, LegalArticle } from '../legalData';
import { DocSidebarItem } from './LegalUI';
import { BookmarkItem, RecentlyViewedItem } from '../useLegalStorage';

interface LegalSidebarProps {
    readingMode: boolean;
    showBookmarks: boolean;
    setShowBookmarks: (val: boolean) => void;
    filteredDocs: LegalDocument[];
    bookmarks: BookmarkItem[];
    recentlyViewed: RecentlyViewedItem[];
    selectedDocId: string;
    setSelectedDocId: (id: string) => void;
    scrollToArticle: (articleId: string, chapterId: string) => void;
    setExpandedChapters: (chapters: Set<string>) => void;
    setShowPdfViewer: (val: boolean) => void;
    setShowDeepSearch: (val: boolean) => void;
}

export const LegalSidebar: React.FC<LegalSidebarProps> = ({
    readingMode, showBookmarks, setShowBookmarks, filteredDocs, bookmarks,
    recentlyViewed, selectedDocId, setSelectedDocId, scrollToArticle,
    setExpandedChapters, setShowPdfViewer, setShowDeepSearch
}) => {
    return (
        <div className={`${readingMode ? 'hidden' : 'w-96'} bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-200 dark:border-slate-700 flex flex-col overflow-hidden`}>
            {/* Sidebar Header with tabs */}
            <div className="px-5 py-3 border-b border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowBookmarks(false)}
                        className={`text-[10px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-lg transition-all ${!showBookmarks ? 'bg-indigo-600 text-white' : 'text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-700'}`}>
                        <FileText className="w-4 h-4 inline" /> Văn bản ({filteredDocs.length})
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
    );
};
