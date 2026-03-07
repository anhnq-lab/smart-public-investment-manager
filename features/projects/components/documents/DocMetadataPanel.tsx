import React from 'react';
import { Document } from '@/types';
import { Eye, Download, FileCheck } from 'lucide-react';

interface DocMetadataPanelProps {
    doc: Document;
    meta: Record<string, any>;
    onMetaChange: (field: string, value: string) => void;
    onSave: () => void;
    onClose: () => void;
    onPreview: () => void;
    savingMeta: boolean;
}

export const DocMetadataPanel: React.FC<DocMetadataPanelProps> = ({
    doc, meta, onMetaChange, onSave, onClose, onPreview, savingMeta
}) => {
    return (
        <div className="mx-3 mb-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-700 space-y-3 animate-in slide-in-from-top-2 duration-200">
            {/* File info row */}
            <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-slate-700">
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-slate-400">Tệp đính kèm</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-slate-100 truncate">{doc.DocName}</p>
                </div>
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={(e) => { e.stopPropagation(); onPreview(); }}
                        className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                        title="Xem"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); /* download */ }}
                        className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all"
                        title="Tải về"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Metadata grid */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Số hiệu văn bản</label>
                    <input
                        type="text"
                        value={meta.document_number || ''}
                        onChange={e => onMetaChange('document_number', e.target.value)}
                        placeholder="VD: 123/QĐ-TTg"
                        className="mt-1 w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-300 dark:focus:border-blue-700 transition-all"
                    />
                </div>
                <div>
                    <label className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Ngày ban hành</label>
                    <input
                        type="date"
                        value={meta.issue_date || ''}
                        onChange={e => onMetaChange('issue_date', e.target.value)}
                        className="mt-1 w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-300 dark:focus:border-blue-700 transition-all"
                    />
                </div>
                <div>
                    <label className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Đơn vị ban hành</label>
                    <input
                        type="text"
                        value={meta.issuing_authority || ''}
                        onChange={e => onMetaChange('issuing_authority', e.target.value)}
                        placeholder="VD: Thủ tướng Chính phủ"
                        className="mt-1 w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-300 dark:focus:border-blue-700 transition-all"
                    />
                </div>
                <div>
                    <label className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Người cập nhật</label>
                    <input
                        type="text"
                        value={meta.updated_by || ''}
                        onChange={e => onMetaChange('updated_by', e.target.value)}
                        placeholder="VD: Nguyễn Văn A"
                        className="mt-1 w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-300 dark:focus:border-blue-700 transition-all"
                    />
                </div>
            </div>
            <div>
                <label className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Ghi chú</label>
                <textarea
                    value={meta.notes || ''}
                    onChange={e => onMetaChange('notes', e.target.value)}
                    placeholder="Nhập ghi chú..."
                    rows={2}
                    className="mt-1 w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-300 dark:focus:border-blue-700 transition-all resize-none"
                />
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-slate-700">
                <div className="text-[11px] text-gray-400 dark:text-slate-500">
                    {doc.Size && <span>Kích thước: {doc.Size}</span>}
                    {doc.Version && <span className="ml-3">Phiên bản: {doc.Version}</span>}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); onClose(); }}
                        className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                    >
                        Đóng
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onSave(); }}
                        disabled={savingMeta}
                        className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                    >
                        <FileCheck className="w-3.5 h-3.5" />
                        {savingMeta ? 'Đang lưu...' : 'Lưu thông tin'}
                    </button>
                </div>
            </div>
        </div>
    );
};
