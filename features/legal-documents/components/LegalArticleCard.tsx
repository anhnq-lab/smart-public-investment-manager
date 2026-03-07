import React, { memo, useMemo, useState, useRef, useEffect } from 'react';
import { Bookmark, Link as LinkIcon, Check, Edit3, Save, X, Bold, Italic, Underline, List, ListOrdered, Undo, Redo, Eraser, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';
import { LegalArticle } from '../legalData';
import { HighlightText } from './LegalUI';

interface LegalArticleCardProps {
    article: LegalArticle;
    selectedDocId: string;
    isActive: boolean;
    isExpanded: boolean;
    bookmarked: boolean;
    searchQuery: string;
    copiedId: string | null;
    toggleArticleExpansion: (id: string, e: React.MouseEvent) => void;
    toggleBookmark: (articleId: string, docId: string) => void;
    handleCopy: (text: string, id: string) => void;
    onSaveEdit?: (articleId: string, newContent: string) => void;
}

// ============================================
// RICH CONTENT RENDERER - supports HTML tables in content
// ============================================
const RichLegalContent: React.FC<{
    content: string;
    searchQuery: string;
    isEditing: boolean;
    onContentChange: (newContent: string) => void;
}> = ({ content, searchQuery, isEditing, onContentChange }) => {
    const contentRef = useRef<HTMLDivElement>(null);

    const handleFormat = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        if (contentRef.current) contentRef.current.focus();
    };

    const handleBlur = () => {
        if (!isEditing || !contentRef.current) return;
        onContentChange(contentRef.current.innerHTML);
    };

    const finalHtml = useMemo(() => {
        let raw = content || '';

        // If content is pure text with \n, and contains tables, format it once to HTML
        // This targets the initial hardcoded data from legalData.ts
        if (!raw.includes('class="rich-legal-block"')) {
            raw = raw.replace(/\\n/g, '\n');
            const tableRegex = /<table[\s\S]*?<\/table>/gi;
            let lastIndex = 0;
            let match;
            let newHtml = '';

            while ((match = tableRegex.exec(raw)) !== null) {
                if (match.index > lastIndex) {
                    const textPart = raw.substring(lastIndex, match.index);
                    newHtml += `<div class="rich-legal-block whitespace-pre-line mb-4">${textPart}</div>`;
                }
                newHtml += `<div class="rich-legal-block legal-table-wrapper my-4 overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-600">${match[0]}</div>`;
                lastIndex = match.index + match[0].length;
            }
            if (lastIndex < raw.length) {
                const textPart = raw.substring(lastIndex);
                newHtml += `<div class="rich-legal-block whitespace-pre-line">${textPart}</div>`;
            }
            raw = newHtml;
        }

        // Apply Search Highlighting via simple RegExp replacement on string outside tags
        if (searchQuery && !isEditing) {
            const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(${escapedQuery})(?![^<]*>)`, 'gi');
            raw = raw.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100 rounded px-0.5 font-medium">$1</mark>');
        }

        return raw;
    }, [content, searchQuery, isEditing]);

    return (
        <div
            ref={contentRef}
            contentEditable={isEditing}
            onBlur={handleBlur}
            suppressContentEditableWarning={true}
            className={`transition-colors custom-scrollbar ${isEditing ? 'bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-xl border border-yellow-400 border-dashed outline-none min-h-[100px]' : ''}`}
            dangerouslySetInnerHTML={{ __html: finalHtml }}
        />
    );
};

const LegalArticleCard: React.FC<LegalArticleCardProps> = ({
    article, selectedDocId, isActive, isExpanded, bookmarked, searchQuery, copiedId,
    toggleArticleExpansion, toggleBookmark, handleCopy, onSaveEdit
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(article.content || '');

    // Reset edited content if article changes
    useEffect(() => {
        setEditedContent(article.content || '');
    }, [article.content]);

    const handleSaveEdit = () => {
        if (onSaveEdit) {
            onSaveEdit(article.id, editedContent);
        }
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setEditedContent(article.content || '');
        setIsEditing(false);
    };

    return (
        <div
            id={`article-${article.id}`}
            className={`p-5 rounded-2xl border transition-all duration-300 ${isActive
                ? 'bg-indigo-50/30 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800 shadow-sm ring-1 ring-indigo-500/20'
                : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 hover:shadow-sm'
                } ${isEditing ? 'ring-2 ring-yellow-400 ring-offset-2' : ''}`}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1" onClick={(e) => !isEditing && toggleArticleExpansion(article.id, e as unknown as React.MouseEvent)}>
                    <h5 className={`font-bold transition-colors ${isActive ? 'text-indigo-700 dark:text-indigo-400' : 'text-gray-900 dark:text-slate-100'} flex items-center gap-2 ${!isEditing ? 'cursor-pointer' : ''}`}>
                        <span className="font-black text-indigo-600 dark:text-indigo-400">{article.code}.</span>
                        <HighlightText text={article.title} query={searchQuery} />
                        {isEditing && (
                            <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full">
                                Chế độ chỉnh sửa
                            </span>
                        )}
                    </h5>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    {isEditing ? (
                        <>
                            <button
                                onClick={handleCancelEdit}
                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all flex items-center gap-1"
                                title="Hủy thay đổi"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-all flex items-center gap-1 font-medium"
                                title="Lưu thay đổi"
                            >
                                <Save className="w-4 h-4" />
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsEditing(true);
                                    // Make sure article is expanded when editing
                                    if (!isExpanded) {
                                        toggleArticleExpansion(article.id, e as unknown as React.MouseEvent);
                                    }
                                }}
                                className="p-1.5 text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 rounded-lg transition-all"
                                title="Chỉnh sửa nội dung"
                            >
                                <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleCopy(article.content || '', article.id)}
                                className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
                                title="Sao chép nội dung"
                            >
                                {copiedId === article.id ? <Check className="w-4 h-4 text-emerald-500" /> : <LinkIcon className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={() => toggleBookmark(article.id, selectedDocId)}
                                className={`p-1.5 rounded-lg transition-all ${bookmarked
                                    ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/30'
                                    : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30'
                                    }`}
                                title={bookmarked ? "Bỏ đánh dấu" : "Đánh dấu điều khoản này"}
                            >
                                <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                    <p className="text-gray-600 dark:text-slate-400 mb-4 pb-4 border-b border-dashed border-gray-200 dark:border-slate-700 italic opacity-80 leading-relaxed font-medium">
                        <HighlightText text={article.summary} query={searchQuery} />
                    </p>
                    <div className="text-gray-800 dark:text-slate-200 leading-loose space-y-2 font-normal relative">
                        {isEditing && (
                            <div className="sticky top-0 z-20 flex flex-wrap items-center gap-1 p-2 bg-yellow-100 dark:bg-yellow-900/50 border border-yellow-300 dark:border-yellow-700 rounded-xl mb-4 text-gray-700 dark:text-gray-300 shadow-sm">
                                <button onMouseDown={(e) => { e.preventDefault(); document.execCommand('bold', false); }} className="p-1.5 hover:bg-yellow-200 dark:hover:bg-yellow-800 rounded-lg transition-colors" title="In đậm"><Bold className="w-4 h-4" /></button>
                                <button onMouseDown={(e) => { e.preventDefault(); document.execCommand('italic', false); }} className="p-1.5 hover:bg-yellow-200 dark:hover:bg-yellow-800 rounded-lg transition-colors" title="In nghiêng"><Italic className="w-4 h-4" /></button>
                                <button onMouseDown={(e) => { e.preventDefault(); document.execCommand('underline', false); }} className="p-1.5 hover:bg-yellow-200 dark:hover:bg-yellow-800 rounded-lg transition-colors" title="Gạch chân"><Underline className="w-4 h-4" /></button>

                                <span className="w-px h-5 bg-yellow-300 dark:bg-yellow-700 mx-1"></span>

                                <button onMouseDown={(e) => { e.preventDefault(); document.execCommand('justifyLeft', false); }} className="p-1.5 hover:bg-yellow-200 dark:hover:bg-yellow-800 rounded-lg transition-colors" title="Căn trái"><AlignLeft className="w-4 h-4" /></button>
                                <button onMouseDown={(e) => { e.preventDefault(); document.execCommand('justifyCenter', false); }} className="p-1.5 hover:bg-yellow-200 dark:hover:bg-yellow-800 rounded-lg transition-colors" title="Căn giữa"><AlignCenter className="w-4 h-4" /></button>
                                <button onMouseDown={(e) => { e.preventDefault(); document.execCommand('justifyRight', false); }} className="p-1.5 hover:bg-yellow-200 dark:hover:bg-yellow-800 rounded-lg transition-colors" title="Căn phải"><AlignRight className="w-4 h-4" /></button>
                                <button onMouseDown={(e) => { e.preventDefault(); document.execCommand('justifyFull', false); }} className="p-1.5 hover:bg-yellow-200 dark:hover:bg-yellow-800 rounded-lg transition-colors" title="Căn đều"><AlignJustify className="w-4 h-4" /></button>

                                <span className="w-px h-5 bg-yellow-300 dark:bg-yellow-700 mx-1"></span>

                                <button onMouseDown={(e) => { e.preventDefault(); document.execCommand('insertUnorderedList', false); }} className="p-1.5 hover:bg-yellow-200 dark:hover:bg-yellow-800 rounded-lg transition-colors" title="Danh sách chấm"><List className="w-4 h-4" /></button>
                                <button onMouseDown={(e) => { e.preventDefault(); document.execCommand('insertOrderedList', false); }} className="p-1.5 hover:bg-yellow-200 dark:hover:bg-yellow-800 rounded-lg transition-colors" title="Danh sách số"><ListOrdered className="w-4 h-4" /></button>

                                <span className="w-px h-5 bg-yellow-300 dark:bg-yellow-700 mx-1"></span>

                                <button onMouseDown={(e) => { e.preventDefault(); document.execCommand('undo', false); }} className="p-1.5 hover:bg-yellow-200 dark:hover:bg-yellow-800 rounded-lg transition-colors" title="Hoàn tác"><Undo className="w-4 h-4" /></button>
                                <button onMouseDown={(e) => { e.preventDefault(); document.execCommand('redo', false); }} className="p-1.5 hover:bg-yellow-200 dark:hover:bg-yellow-800 rounded-lg transition-colors" title="Làm lại"><Redo className="w-4 h-4" /></button>
                                <button onMouseDown={(e) => { e.preventDefault(); document.execCommand('removeFormat', false); }} className="p-1.5 hover:bg-yellow-200 dark:hover:bg-yellow-800 rounded-lg transition-colors text-red-600 dark:text-red-400" title="Xóa định dạng"><Eraser className="w-4 h-4" /></button>

                                <div className="ml-auto text-xs font-semibold text-yellow-700 dark:text-yellow-400 bg-yellow-200 dark:bg-yellow-800/50 px-2 py-1 rounded-lg">
                                    Công cụ chỉnh sửa
                                </div>
                            </div>
                        )}
                        <RichLegalContent
                            content={editedContent}
                            searchQuery={searchQuery}
                            isEditing={isEditing}
                            onContentChange={setEditedContent}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default memo(LegalArticleCard);
