import React, { useState, useMemo, useRef, useEffect } from 'react';
import { legalDocuments, searchDocuments, getDocStats, deepSearchArticles, DocType } from './legalData';
import { useBookmarks, useRecentlyViewed, useReadingPrefs } from './useLegalStorage';
import { LegalHeader } from './components/LegalHeader';
import { LegalSidebar } from './components/LegalSidebar';
import { LegalDetail } from './components/LegalDetail';
import { LegalTOC } from './components/LegalTOC';
import { useSearchParams } from 'react-router-dom';

const LegalDocumentSearch: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const urlDocId = searchParams.get('docId');
    const urlArticleId = searchParams.get('articleId');

    // 1. Shared State
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [selectedDocId, setSelectedDocId] = useState<string>(urlDocId || legalDocuments[0]?.id || '');
    const [filterType, setFilterType] = useState<DocType | 'all'>('all');

    // UI State
    const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
    const [showPdfViewer, setShowPdfViewer] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [readingMode, setReadingMode] = useState(false);
    const [showTOC, setShowTOC] = useState(true);
    const [showBookmarks, setShowBookmarks] = useState(false);
    const [activeArticleId, setActiveArticleId] = useState<string | null>(null);
    const [showDeepSearch, setShowDeepSearch] = useState(false);
    const [expandedArticles, setExpandedArticles] = useState<Set<string>>(new Set());
    const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

    // Hooks
    const { bookmarks, toggleBookmark, isBookmarked } = useBookmarks();
    const { recentlyViewed, addView } = useRecentlyViewed();
    const { prefs } = useReadingPrefs();
    const fontSize = prefs?.fontSize || 14;

    const contentRef = useRef<HTMLDivElement>(null);

    // Track viewed document
    useEffect(() => {
        if (selectedDocId) {
            addView(selectedDocId);
        }
    }, [selectedDocId, addView]);

    // Update debounced search
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    // Data Processing
    const stats = useMemo(() => getDocStats(), []);

    const filteredDocs = useMemo(() => {
        let docs = searchDocuments(debouncedSearchQuery);
        if (filterType !== 'all') {
            docs = docs.filter(d => d.type === filterType);
        }
        return docs;
    }, [debouncedSearchQuery, filterType]);

    const deepSearchResults = useMemo(() => {
        if (debouncedSearchQuery.length < 2) return [];
        return deepSearchArticles(debouncedSearchQuery).slice(0, 10);
    }, [debouncedSearchQuery]);

    const selectedDoc = useMemo(() =>
        legalDocuments.find(d => d.id === selectedDocId) || null
        , [selectedDocId]);

    // Set default expanded content on doc change and handle initial deep link
    useEffect(() => {
        if (selectedDoc) {
            setSearchParams({ docId: selectedDoc.id }); // update URL docId implicitly

            // if we haven't loaded anything yet or we switch docs
            if (expandedChapters.size === 0) {
                // If there's a urlArticleId, we should open that chapter instead
                let targetChapterId = selectedDoc.chapters[0]?.id;
                if (urlArticleId) {
                    const chapterWithArticle = selectedDoc.chapters.find(c => c.articles.some(a => a.id === urlArticleId));
                    if (chapterWithArticle) {
                        targetChapterId = chapterWithArticle.id;
                        setTimeout(() => scrollToArticle(urlArticleId, targetChapterId), 300);
                    }
                }
                setExpandedChapters(new Set([targetChapterId]));
                const allArticles = selectedDoc.chapters.flatMap(c => c.articles.map(a => a.id));
                setExpandedArticles(new Set(allArticles));
            }
        }
    }, [selectedDocId, selectedDoc]);

    // Handlers
    const toggleChapter = (chapterId: string) => {
        setExpandedChapters(prev => {
            const next = new Set(prev);
            if (next.has(chapterId)) next.delete(chapterId);
            else next.add(chapterId);
            return next;
        });
    };

    const toggleArticleExpansion = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedArticles(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const scrollToArticle = (articleId: string, chapterId: string) => {
        setExpandedChapters(prev => {
            const next = new Set(prev);
            next.add(chapterId);
            return next;
        });
        setExpandedArticles(prev => {
            const next = new Set(prev);
            next.add(articleId);
            return next;
        });

        setTimeout(() => {
            const element = document.getElementById(`article-\${articleId}`);
            if (element && contentRef.current) {
                const containerInfo = contentRef.current.getBoundingClientRect();
                const elementInfo = element.getBoundingClientRect();

                contentRef.current.scrollTo({
                    top: contentRef.current.scrollTop + (elementInfo.top - containerInfo.top) - 100,
                    behavior: 'smooth'
                });

                setActiveArticleId(articleId);
                setTimeout(() => setActiveArticleId(null), 3000);
            }
        }, 100);
    };

    const navigateDeepSearch = (docId: string, chapterId: string) => {
        setSelectedDocId(docId);
        setShowDeepSearch(false);
        setExpandedChapters(new Set([chapterId]));
        setShowPdfViewer(false);
    };

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleCopyLink = (articleId: string) => {
        const url = new URL(window.location.href);
        url.searchParams.set('docId', selectedDocId);
        url.searchParams.set('articleId', articleId);
        navigator.clipboard.writeText(url.toString());
        setCopiedLinkId(articleId);
        setTimeout(() => setCopiedLinkId(null), 2000);
    }

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className={`flex flex-col \${readingMode ? 'fixed inset-0 z-50 bg-white dark:bg-slate-900 p-6' : 'h-[calc(100vh-140px)'} animate-in fade-in duration-300`}>
            {/* Header Section */}
            <LegalHeader
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filterType={filterType}
                setFilterType={setFilterType}
                stats={stats}
                showDeepSearch={showDeepSearch}
                setShowDeepSearch={setShowDeepSearch}
                deepSearchResults={deepSearchResults}
                navigateDeepSearch={navigateDeepSearch}
                readingMode={readingMode}
            />

            {/* Main Content Area */}
            <div className="flex flex-1 gap-5 overflow-hidden">
                <LegalSidebar
                    readingMode={readingMode}
                    showBookmarks={showBookmarks}
                    setShowBookmarks={setShowBookmarks}
                    filteredDocs={filteredDocs}
                    bookmarks={bookmarks}
                    recentlyViewed={recentlyViewed}
                    selectedDocId={selectedDocId}
                    setSelectedDocId={setSelectedDocId}
                    scrollToArticle={scrollToArticle}
                    setExpandedChapters={setExpandedChapters}
                    setShowPdfViewer={setShowPdfViewer}
                    setShowDeepSearch={setShowDeepSearch}
                />

                <div className="flex-1 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col overflow-hidden">
                    {/* Content Area with optional TOC */}
                    {selectedDoc ? (
                        <div className="flex-1 flex overflow-hidden">
                            <LegalDetail
                                selectedDoc={selectedDoc}
                                contentRef={contentRef}
                                showPdfViewer={showPdfViewer}
                                setShowPdfViewer={setShowPdfViewer}
                                readingMode={readingMode}
                                setReadingMode={setReadingMode}
                                handlePrint={handlePrint}
                                fontSize={fontSize}
                                searchQuery={debouncedSearchQuery}
                                isBookmarked={isBookmarked}
                                toggleBookmark={toggleBookmark}
                                expandedChapters={expandedChapters}
                                toggleChapter={toggleChapter}
                                activeArticleId={activeArticleId}
                                expandedArticles={expandedArticles}
                                toggleArticleExpansion={toggleArticleExpansion}
                                copiedId={copiedId}
                                handleCopy={handleCopy}
                                copiedLinkId={copiedLinkId}
                                handleCopyLink={handleCopyLink}
                            />

                            {/* Quick TOC (Right Mini Panel) */}
                            {showTOC && selectedDoc.chapters.length > 0 && !showPdfViewer && (
                                <LegalTOC
                                    selectedDoc={selectedDoc}
                                    scrollToArticle={scrollToArticle}
                                    setExpandedChapters={setExpandedChapters}
                                />
                            )}
                        </div>
                    ) : (
                        <LegalDetail
                            selectedDoc={null}
                            contentRef={contentRef}
                            showPdfViewer={false} setShowPdfViewer={() => { }}
                            readingMode={false} setReadingMode={() => { }}
                            handlePrint={() => { }} fontSize={14}
                            searchQuery="" isBookmarked={() => false} toggleBookmark={() => { }}
                            expandedChapters={new Set()} toggleChapter={() => { }}
                            activeArticleId={null} expandedArticles={new Set()}
                            toggleArticleExpansion={() => { }} copiedId={null} handleCopy={() => { }}
                            copiedLinkId={null} handleCopyLink={() => { }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default LegalDocumentSearch;
