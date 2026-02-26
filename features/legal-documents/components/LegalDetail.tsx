import React from 'react';
import { Share2, Printer, Download, Maximize2, Minimize2, FileText, FileDown, Bookmark, Link as LinkIcon, Check, ChevronDown, ChevronRight, Scale, Info } from 'lucide-react';
import { LegalDocument, DOC_TYPE_LABELS, DOC_STATUS_LABELS, DOC_TYPE_COLORS, DOC_STATUS_COLORS } from '../legalData';
import { HighlightText, TYPE_ICONS } from './LegalUI';
import LegalArticleCard from './LegalArticleCard';

interface LegalDetailProps {
    selectedDoc: LegalDocument | null;
    contentRef: React.RefObject<HTMLDivElement>;
    showPdfViewer: boolean;
    setShowPdfViewer: (val: boolean) => void;
    readingMode: boolean;
    setReadingMode: (val: boolean) => void;
    handlePrint: () => void;
    fontSize: number;
    searchQuery: string;
    isBookmarked: (articleId: string) => boolean;
    toggleBookmark: (articleId: string, docId: string) => void;
    expandedChapters: Set<string>;
    toggleChapter: (chapterId: string) => void;
    activeArticleId: string | null;
    expandedArticles: Set<string>;
    toggleArticleExpansion: (id: string, e: React.MouseEvent) => void;
    copiedId: string | null;
    handleCopy: (text: string, id: string) => void;
    children?: React.ReactNode;
}

export const LegalDetail: React.FC<LegalDetailProps> = ({
    selectedDoc, contentRef, showPdfViewer, setShowPdfViewer,
    readingMode, setReadingMode, handlePrint, fontSize, searchQuery,
    isBookmarked, toggleBookmark, expandedChapters, toggleChapter,
    activeArticleId, expandedArticles, toggleArticleExpansion,
    copiedId, handleCopy, children
}) => {
    if (!selectedDoc) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
                <Scale className="w-16 h-16 text-gray-200 dark:text-slate-700 mb-4" />
                <h3 className="text-lg font-bold text-gray-400 dark:text-slate-500">Chọn văn bản để xem chi tiết</h3>
                <p className="text-sm text-gray-300 dark:text-slate-600 mt-1">Sử dụng thanh tìm kiếm hoặc bộ lọc bên trên</p>
            </div>
        );
    }

    const typeColor = DOC_TYPE_COLORS[selectedDoc.type];
    const statusColor = DOC_STATUS_COLORS[selectedDoc.status];
    const TypeIcon = TYPE_ICONS[selectedDoc.type];

    return (
        <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
            {/* Document Header */}
            <div className="px-8 py-4 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-gray-50/80 to-white dark:from-slate-800/80 dark:to-slate-800 shrink-0">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider title-shadow \${typeColor.bg} \${typeColor.text} \${typeColor.border} border \${typeColor.darkBg} \${typeColor.darkText} \${typeColor.darkBorder}`}>
                                <TypeIcon className="w-3.5 h-3.5" />
                                {DOC_TYPE_LABELS[selectedDoc.type]}
                            </span>
                            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border \${statusColor.bg} \${statusColor.text} \${statusColor.border}`}>
                                <span className={`w-1.5 h-1.5 rounded-full animate-pulse \${statusColor.dot}`}></span>
                                {DOC_STATUS_LABELS[selectedDoc.status]}
                            </span>
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600 flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5" />
                                {selectedDoc.code}
                            </span>
                        </div>
                        <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-gray-100 leading-tight mb-2 tracking-tight">
                            {selectedDoc.title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] font-medium text-gray-500 dark:text-slate-400">
                            <p className="flex items-center gap-1.5"><CalendarIcon className="w-3.5 h-3.5 text-gray-400" /> Ban hành: <span className="font-bold text-gray-700 dark:text-slate-300">{selectedDoc.issuedDate}</span></p>
                            <p className="flex items-center gap-1.5"><ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-500" /> Hiệu lực: <span className="font-bold text-gray-700 dark:text-slate-300">{selectedDoc.effectiveDate}</span></p>
                            <p className="flex items-center gap-1.5"><BuildingIcon className="w-3.5 h-3.5 text-indigo-400" /> Cơ quan: <span className="font-bold text-gray-700 dark:text-slate-300">{selectedDoc.issuedBy}</span></p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => setShowPdfViewer(!showPdfViewer)}
                            className={`p-2 rounded-xl transition-all \${showPdfViewer ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'}`}
                            title={showPdfViewer ? "Đóng PDF" : "Xem PDF bản gốc"}>
                            <FileDown className="w-5 h-5" />
                        </button>
                        <button className="p-2 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors" title="Chia sẻ">
                            <Share2 className="w-5 h-5" />
                        </button>
                        <button onClick={handlePrint} className="p-2 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors" title="In tài liệu">
                            <Printer className="w-5 h-5" />
                        </button>
                        <button className="p-2 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors" title="Tải xuống">
                            <Download className="w-5 h-5" />
                        </button>
                        <button onClick={() => setReadingMode(!readingMode)}
                            className={`p-2 rounded-xl transition-all \${readingMode ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'}`}
                            title={readingMode ? "Mặc định" : "Chế độ đọc tập trung"}>
                            {readingMode ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {!showPdfViewer && selectedDoc.summary && (
                    <div className="mt-4 p-3.5 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100/50 dark:border-indigo-800/30 rounded-2xl flex items-start gap-3">
                        <Info className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                        <p className="text-xs leading-relaxed text-indigo-900/80 dark:text-indigo-200/80 font-medium">
                            {selectedDoc.summary}
                        </p>
                    </div>
                )}
            </div>

            {/* Content Area with optional TOC next to it */}
            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 overflow-hidden relative">
                    <div ref={contentRef} className="absolute inset-0 overflow-y-auto custom-scrollbar">
                        {showPdfViewer ? (
                            <div className="h-full w-full bg-gray-100/50 dark:bg-slate-900 p-4">
                                <div className="w-full h-full bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden flex flex-col">
                                    <div className="bg-gray-100 dark:bg-slate-700 px-4 py-2 border-b border-gray-200 dark:border-slate-600 flex justify-between items-center">
                                        <span className="text-xs font-bold text-gray-600 dark:text-slate-300 flex items-center gap-2">
                                            <FileDown className="w-4 h-4" /> Bản gốc PDF
                                        </span>
                                        <span className="text-[10px] bg-white dark:bg-slate-800 px-2 py-1 rounded font-mono text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-600">{selectedDoc.fileSize}</span>
                                    </div>
                                    <iframe src={`${selectedDoc.filePath}#toolbar=0&navpanes=0`} className="w-full flex-1" title="PDF Viewer" />
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 lg:px-12 xl:px-16 max-w-4xl mx-auto" style={{ fontSize: `\${fontSize}px` }}>
                                {selectedDoc.chapters.map(chapter => (
                                    <div key={chapter.id} className="mb-10 last:mb-0">
                                        <div
                                            onClick={() => toggleChapter(chapter.id)}
                                            className="sticky top-0 z-10 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md py-3 -mx-4 px-4 mb-4 border-b-2 border-gray-100 dark:border-slate-700 flex items-center justify-between cursor-pointer group"
                                        >
                                            <div>
                                                <h3 className="text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">{chapter.code}</h3>
                                                <h4 className="text-lg font-bold text-gray-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{chapter.title}</h4>
                                            </div>
                                            <div className="p-2 bg-gray-50 dark:bg-slate-700 rounded-xl group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-colors">
                                                {expandedChapters.has(chapter.id) ? (
                                                    <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-indigo-500" />
                                                ) : (
                                                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-500" />
                                                )}
                                            </div>
                                        </div>

                                        {expandedChapters.has(chapter.id) && (
                                            <div className="space-y-4">
                                                {chapter.articles.map(article => {
                                                    const isActive = activeArticleId === article.id;
                                                    const bookmarked = isBookmarked(article.id);
                                                    const isExpanded = expandedArticles.has(article.id);

                                                    return (
                                                        <LegalArticleCard
                                                            key={article.id}
                                                            article={article}
                                                            selectedDocId={selectedDoc.id}
                                                            isActive={isActive}
                                                            isExpanded={isExpanded}
                                                            bookmarked={bookmarked}
                                                            searchQuery={searchQuery}
                                                            copiedId={copiedId}
                                                            toggleArticleExpansion={toggleArticleExpansion}
                                                            toggleBookmark={toggleBookmark}
                                                            handleCopy={handleCopy}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                {/* TOC renders here as child */}
                {children}
            </div>
        </div>
    );
};

// SVG Icons
const CalendarIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

const ShieldCheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
    </svg>
);

const BuildingIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
        <path d="M9 22v-4h6v4" />
        <path d="M8 6h.01" />
        <path d="M16 6h.01" />
        <path d="M12 6h.01" />
        <path d="M12 10h.01" />
        <path d="M12 14h.01" />
        <path d="M16 10h.01" />
        <path d="M16 14h.01" />
        <path d="M8 10h.01" />
        <path d="M8 14h.01" />
    </svg>
);
