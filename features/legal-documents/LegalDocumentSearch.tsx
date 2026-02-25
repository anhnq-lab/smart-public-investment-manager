import React, { useState, useMemo } from 'react';
import {
    Search, ChevronRight, BookOpen, FileText, Scale, Filter,
    Calendar, Building2, ExternalLink, Link2, Tag, Eye,
    X, Hash, ScrollText, ShieldCheck, Landmark, Gavel,
    ArrowRight, Info, ChevronDown, ChevronUp, Sparkles
} from 'lucide-react';
import {
    legalDocuments, searchDocuments, getRelatedDocuments, getDocStats,
    DOC_TYPE_LABELS, DOC_TYPE_COLORS, DOC_STATUS_LABELS, DOC_STATUS_COLORS,
    type LegalDocument, type DocType, type DocStatus
} from './legalData';

// ============================================
// TYPE ICON MAP
// ============================================
const TYPE_ICONS: Record<DocType, React.ElementType> = {
    'luat': Landmark,
    'nghi-dinh': Gavel,
    'thong-tu': ScrollText,
    'qcvn': ShieldCheck,
    'quyet-dinh': FileText,
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
    doc: LegalDocument;
    isSelected: boolean;
    onClick: () => void;
}> = ({ doc, isSelected, onClick }) => {
    const typeColor = DOC_TYPE_COLORS[doc.type];
    const statusColor = DOC_STATUS_COLORS[doc.status];
    const Icon = TYPE_ICONS[doc.type];

    return (
        <button
            onClick={onClick}
            className={`w-full text-left p-3.5 rounded-2xl transition-all group border ${isSelected
                ? `${typeColor.bg} ${typeColor.border} ${typeColor.darkBg} ${typeColor.darkBorder} shadow-sm`
                : 'border-transparent hover:bg-gray-50 dark:hover:bg-slate-700/50'
                }`}
        >
            <div className="flex items-start gap-3">
                <div className={`mt-0.5 p-2 rounded-xl shrink-0 transition-colors ${isSelected
                    ? `${typeColor.bg} ${typeColor.text} ${typeColor.darkBg} ${typeColor.darkText}`
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500 group-hover:bg-white dark:group-hover:bg-slate-600'
                    }`}>
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
                    <p className={`text-[10px] mt-1 font-medium ${isSelected ? 'text-gray-500 dark:text-slate-400' : 'text-gray-400 dark:text-slate-500'}`}>
                        {doc.code}
                    </p>
                </div>
                {isSelected && <ChevronRight className={`w-4 h-4 mt-1 shrink-0 ${typeColor.text} ${typeColor.darkText}`} />}
            </div>
        </button>
    );
};

// ============================================
// MAIN COMPONENT
// ============================================
const LegalDocumentSearch: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDocId, setSelectedDocId] = useState<string>(legalDocuments[0]?.id || '');
    const [filterType, setFilterType] = useState<DocType | 'all'>('all');
    const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
    const [showPdfViewer, setShowPdfViewer] = useState(false);

    const stats = useMemo(() => getDocStats(), []);

    const filteredDocs = useMemo(() => {
        let docs = searchQuery ? searchDocuments(searchQuery) : legalDocuments;
        if (filterType !== 'all') {
            docs = docs.filter(d => d.type === filterType);
        }
        return docs;
    }, [searchQuery, filterType]);

    const selectedDoc = useMemo(() =>
        legalDocuments.find(d => d.id === selectedDocId),
        [selectedDocId]
    );

    const relatedDocs = useMemo(() =>
        selectedDoc ? getRelatedDocuments(selectedDoc) : [],
        [selectedDoc]
    );

    const toggleChapter = (chapterId: string) => {
        setExpandedChapters(prev => {
            const next = new Set(prev);
            if (next.has(chapterId)) next.delete(chapterId);
            else next.add(chapterId);
            return next;
        });
    };

    const expandAll = () => {
        if (selectedDoc) {
            setExpandedChapters(new Set(selectedDoc.chapters.map(c => c.id)));
        }
    };

    const collapseAll = () => setExpandedChapters(new Set());

    const typeColor = selectedDoc ? DOC_TYPE_COLORS[selectedDoc.type] : null;
    const statusColor = selectedDoc ? DOC_STATUS_COLORS[selectedDoc.status] : null;

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] animate-in fade-in duration-300">
            {/* ═══ HEADER SECTION ═══ */}
            <div className="flex flex-col gap-5 mb-6">
                {/* Title Row */}
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
                    {/* Stats */}
                    <div className="flex gap-3">
                        <StatCard label="Tổng văn bản" value={stats.total} color="bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300" icon={FileText} />
                        <StatCard label="Còn hiệu lực" value={stats.active} color="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400" icon={ShieldCheck} />
                    </div>
                </div>

                {/* Search + Filters Row */}
                <div className="flex items-center gap-4">
                    {/* Search Bar */}
                    <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 flex items-center px-4 h-12 transition-all focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-900/40 focus-within:border-indigo-400">
                        <Search className="w-5 h-5 text-gray-400 dark:text-slate-500 mr-3" />
                        <input
                            type="text"
                            placeholder="Tìm theo số hiệu, tên văn bản, nội dung điều khoản..."
                            className="flex-1 h-full outline-none text-sm font-medium text-gray-700 dark:text-slate-300 placeholder-gray-400 dark:placeholder-slate-500 bg-transparent"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Filter Chips */}
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                        {(['all', 'luat', 'nghi-dinh', 'thong-tu', 'qcvn', 'quyet-dinh'] as const).map(type => {
                            const isActive = filterType === type;
                            const label = type === 'all' ? 'Tất cả' : DOC_TYPE_LABELS[type];
                            const count = type === 'all' ? stats.total : stats.byType[type];
                            return (
                                <button
                                    key={type}
                                    onClick={() => setFilterType(type)}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${isActive
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200 dark:shadow-indigo-900/30'
                                        : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    {label}
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${isActive ? 'bg-white/20' : 'bg-gray-100 dark:bg-slate-700'}`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ═══ MAIN CONTENT AREA ═══ */}
            <div className="flex flex-1 gap-5 overflow-hidden">

                {/* ── LEFT SIDEBAR: DOCUMENT LIST ── */}
                <div className="w-96 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                                Danh sách văn bản
                            </h3>
                            <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 bg-white dark:bg-slate-700 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-slate-600">
                                {filteredDocs.length} VĂN BẢN
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                        {filteredDocs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <Search className="w-12 h-12 text-gray-200 dark:text-slate-700 mb-4" />
                                <p className="text-sm font-bold text-gray-400 dark:text-slate-500">Không tìm thấy văn bản</p>
                                <p className="text-xs text-gray-300 dark:text-slate-600 mt-1">Thử tìm với từ khóa khác</p>
                            </div>
                        ) : (
                            filteredDocs.map(doc => (
                                <DocSidebarItem
                                    key={doc.id}
                                    doc={doc}
                                    isSelected={selectedDocId === doc.id}
                                    onClick={() => {
                                        setSelectedDocId(doc.id);
                                        setShowPdfViewer(false);
                                        setExpandedChapters(new Set());
                                    }}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* ── RIGHT CONTENT: DOCUMENT DETAIL ── */}
                <div className="flex-1 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col overflow-hidden">
                    {selectedDoc ? (
                        <>
                            {/* Document Header */}
                            <div className="px-8 py-5 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-gray-50/80 to-white dark:from-slate-800/80 dark:to-slate-800 shrink-0">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        {/* Badges Row */}
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg border ${typeColor?.bg} ${typeColor?.text} ${typeColor?.border} ${typeColor?.darkBg} ${typeColor?.darkText} ${typeColor?.darkBorder}`}>
                                                {DOC_TYPE_LABELS[selectedDoc.type]}
                                            </span>
                                            <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-lg ${statusColor?.bg} ${statusColor?.text}`}>
                                                <span className={`w-2 h-2 rounded-full ${statusColor?.dot} animate-pulse`}></span>
                                                {DOC_STATUS_LABELS[selectedDoc.status]}
                                            </span>
                                        </div>

                                        {/* Code & Title */}
                                        <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">
                                            {selectedDoc.code}
                                        </p>
                                        <h1 className="text-lg font-black text-gray-900 dark:text-slate-100 leading-snug tracking-tight">
                                            {selectedDoc.title}
                                        </h1>

                                        {/* Meta Info */}
                                        <div className="flex items-center gap-4 mt-3 flex-wrap">
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
                                                <Building2 className="w-3.5 h-3.5" />
                                                <span className="font-medium">{selectedDoc.issuedBy}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span className="font-medium">Ban hành: {selectedDoc.issuedDate}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span className="font-medium">Hiệu lực: {selectedDoc.effectiveDate}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
                                                <Hash className="w-3.5 h-3.5" />
                                                <span className="font-medium">{selectedDoc.fileSize}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2 shrink-0">
                                        <button
                                            onClick={() => setShowPdfViewer(!showPdfViewer)}
                                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${showPdfViewer
                                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30'
                                                : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300'
                                                }`}
                                        >
                                            <Eye className="w-4 h-4" />
                                            {showPdfViewer ? 'Ẩn PDF' : 'Xem PDF'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                {showPdfViewer ? (
                                    /* ── PDF VIEWER ── */
                                    <div className="h-full bg-[#525659] flex items-center justify-center p-4">
                                        <iframe
                                            src={`${selectedDoc.filePath}#toolbar=1`}
                                            className="w-full h-full rounded-lg shadow-2xl bg-white"
                                            title={selectedDoc.title}
                                        />
                                    </div>
                                ) : (
                                    /* ── STRUCTURED CONTENT ── */
                                    <div className="p-8 space-y-6">
                                        {/* Summary */}
                                        <div className={`p-5 rounded-2xl border ${typeColor?.bg} ${typeColor?.border} ${typeColor?.darkBg} ${typeColor?.darkBorder}`}>
                                            <div className="flex items-start gap-3">
                                                <Sparkles className={`w-5 h-5 shrink-0 mt-0.5 ${typeColor?.text} ${typeColor?.darkText}`} />
                                                <div>
                                                    <h3 className={`text-xs font-black uppercase tracking-widest mb-2 ${typeColor?.text} ${typeColor?.darkText}`}>Tóm tắt nội dung</h3>
                                                    <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed font-medium">
                                                        {selectedDoc.summary}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Tags */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Tag className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />
                                            {selectedDoc.tags.map(tag => (
                                                <span
                                                    key={tag}
                                                    onClick={() => setSearchQuery(tag)}
                                                    className="px-2.5 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>

                                        {/* Chapters & Articles */}
                                        <div>
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                                    <BookOpen className="w-4 h-4" />
                                                    Mục lục nội dung
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
                                                    return (
                                                        <div key={chapter.id} className="border border-gray-200 dark:border-slate-700 rounded-2xl overflow-hidden transition-all hover:shadow-sm">
                                                            {/* Chapter Header */}
                                                            <button
                                                                onClick={() => toggleChapter(chapter.id)}
                                                                className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors text-left"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${typeColor?.bg} ${typeColor?.text} ${typeColor?.darkBg} ${typeColor?.darkText} uppercase tracking-wider`}>
                                                                        {chapter.code}
                                                                    </span>
                                                                    <span className="text-sm font-bold text-gray-800 dark:text-slate-200">{chapter.title}</span>
                                                                    <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 bg-white dark:bg-slate-700 px-2 py-0.5 rounded-md border border-gray-100 dark:border-slate-600">
                                                                        {chapter.articles.length} điều
                                                                    </span>
                                                                </div>
                                                                {isExpanded
                                                                    ? <ChevronUp className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                                                                    : <ChevronDown className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                                                                }
                                                            </button>

                                                            {/* Articles */}
                                                            {isExpanded && (
                                                                <div className="divide-y divide-gray-100 dark:divide-slate-700 animate-in slide-in-from-top-1 duration-200">
                                                                    {chapter.articles.map(article => (
                                                                        <div key={article.id} className="px-6 py-3.5 hover:bg-blue-50/30 dark:hover:bg-slate-700/30 transition-colors">
                                                                            <div className="flex items-start gap-3">
                                                                                <span className="text-[10px] font-black text-gray-500 dark:text-slate-500 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-md mt-0.5 shrink-0 font-mono">
                                                                                    {article.code}
                                                                                </span>
                                                                                <div>
                                                                                    <p className="text-sm font-bold text-gray-800 dark:text-slate-200 mb-1">
                                                                                        {article.title}
                                                                                    </p>
                                                                                    <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                                                                                        {article.summary}
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
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
                                                    <Link2 className="w-4 h-4" />
                                                    Văn bản liên quan
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {relatedDocs.map(rd => {
                                                        const rdTypeColor = DOC_TYPE_COLORS[rd.type];
                                                        const rdStatusColor = DOC_STATUS_COLORS[rd.status];
                                                        return (
                                                            <button
                                                                key={rd.id}
                                                                onClick={() => {
                                                                    setSelectedDocId(rd.id);
                                                                    setShowPdfViewer(false);
                                                                    setExpandedChapters(new Set());
                                                                }}
                                                                className="flex items-center gap-4 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-all text-left group hover:shadow-sm"
                                                            >
                                                                <div className={`p-2.5 rounded-xl ${rdTypeColor.bg} ${rdTypeColor.text} ${rdTypeColor.darkBg} ${rdTypeColor.darkText}`}>
                                                                    {React.createElement(TYPE_ICONS[rd.type], { className: 'w-5 h-5' })}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-1.5 mb-1">
                                                                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${rdTypeColor.bg} ${rdTypeColor.text} ${rdTypeColor.darkBg} ${rdTypeColor.darkText}`}>
                                                                            {DOC_TYPE_LABELS[rd.type]}
                                                                        </span>
                                                                        <span className={`flex items-center gap-1 text-[9px] font-bold ${rdStatusColor.text}`}>
                                                                            <span className={`w-1.5 h-1.5 rounded-full ${rdStatusColor.dot}`}></span>
                                                                            {DOC_STATUS_LABELS[rd.status]}
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
                        </>
                    ) : (
                        /* No Selection State */
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
