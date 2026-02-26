import React from 'react';
import { AlignLeft, Hash } from 'lucide-react';
import { LegalDocument } from '../legalData';

interface LegalTOCProps {
    selectedDoc: LegalDocument;
    scrollToArticle: (articleId: string, chapterId: string) => void;
    setExpandedChapters: React.Dispatch<React.SetStateAction<Set<string>>>;
}

export const LegalTOC: React.FC<LegalTOCProps> = ({ selectedDoc, scrollToArticle, setExpandedChapters }) => {
    return (
        <div className="w-52 border-l border-gray-100 dark:border-slate-700 bg-gray-50/30 dark:bg-slate-800/30 overflow-y-auto custom-scrollbar shrink-0">
            <div className="sticky top-0 bg-gray-50/95 dark:bg-slate-800/95 backdrop-blur-sm p-3 border-b border-gray-100 dark:border-slate-700 z-10 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
                    <AlignLeft className="w-3.5 h-3.5" />
                    Mục lục nhanh
                </span>
            </div>
            <div className="p-3 space-y-1">
                {selectedDoc.chapters.map(ch => (
                    <div key={`toc-${ch.id}`} className="mb-2">
                        <p className="text-[10px] font-bold text-gray-800 dark:text-slate-200 mb-1 sticky top-10 bg-gray-50/95 dark:bg-slate-800/95 py-1 z-10">
                            {ch.code}
                        </p>
                        <div className="pl-2 border-l-2 border-gray-200 dark:border-slate-700 space-y-0.5">
                            {ch.articles.map(art => (
                                <button
                                    key={`toc-${art.id}`}
                                    onClick={() => {
                                        setExpandedChapters(prev => {
                                            const next = new Set(prev);
                                            next.add(ch.id);
                                            return next;
                                        });
                                        scrollToArticle(art.id, ch.id);
                                    }}
                                    className="w-full text-left text-[10px] py-1 px-2 rounded hover:bg-white dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate flex items-center gap-1.5 group"
                                    title={`\${art.code}: \${art.title}`}
                                >
                                    <Hash className="w-3 h-3 opacity-40 group-hover:opacity-100 shrink-0" />
                                    <span className="truncate">{art.code}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
