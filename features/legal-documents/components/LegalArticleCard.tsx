import React, { memo } from 'react';
import { Bookmark, Link as LinkIcon, Check } from 'lucide-react';
import { FlatArticle } from '../legalData';
import { HighlightText } from './LegalUI';

interface LegalArticleCardProps {
    article: any; // LegalArticle
    selectedDocId: string;
    isActive: boolean;
    isExpanded: boolean;
    bookmarked: boolean;
    searchQuery: string;
    copiedId: string | null;
    toggleArticleExpansion: (id: string, e: React.MouseEvent) => void;
    toggleBookmark: (articleId: string, docId: string) => void;
    handleCopy: (text: string, id: string) => void;
}

const LegalArticleCard: React.FC<LegalArticleCardProps> = ({
    article, selectedDocId, isActive, isExpanded, bookmarked, searchQuery, copiedId,
    toggleArticleExpansion, toggleBookmark, handleCopy
}) => {
    return (
        <div
            id={`article-\${article.id}`}
            className={`p-5 rounded-2xl border transition-all duration-300 \${isActive
                ? 'bg-indigo-50/30 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800 shadow-sm ring-1 ring-indigo-500/20'
                : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 hover:shadow-sm'
                }`}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1" onClick={(e) => toggleArticleExpansion(article.id, e as unknown as React.MouseEvent)}>
                    <h5 className={`font-bold transition-colors \${isActive ? 'text-indigo-700 dark:text-indigo-400' : 'text-gray-900 dark:text-slate-100'} flex items-center gap-2 cursor-pointer`}>
                        <span className="font-black text-indigo-600 dark:text-indigo-400">{article.code}.</span>
                        <HighlightText text={article.title} query={searchQuery} />
                    </h5>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <button
                        onClick={() => handleCopy(article.content, article.id)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
                        title="Sao chép nội dung"
                    >
                        {copiedId === article.id ? <Check className="w-4 h-4 text-emerald-500" /> : <LinkIcon className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={() => toggleBookmark(article.id, selectedDocId)}
                        className={`p-1.5 rounded-lg transition-all \${bookmarked
                            ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/30'
                            : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30'
                            }`}
                        title={bookmarked ? "Bỏ đánh dấu" : "Đánh dấu điều khoản này"}
                    >
                        <Bookmark className={`w-4 h-4 \${bookmarked ? 'fill-current' : ''}`} />
                    </button>
                </div>
            </div>

            {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                    <p className="text-gray-600 dark:text-slate-400 mb-4 pb-4 border-b border-dashed border-gray-200 dark:border-slate-700 italic opacity-80 leading-relaxed font-medium">
                        <HighlightText text={article.summary} query={searchQuery} />
                    </p>
                    <div className="text-gray-800 dark:text-slate-200 leading-loose space-y-4 font-normal whitespace-pre-line">
                        <HighlightText text={article.content.replace(/\\\\n/g, '\\n')} query={searchQuery} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default memo(LegalArticleCard);
