import React, { useState, useCallback } from 'react';
import {
    FileText, Sparkles, Copy, Download, X, ChevronDown, RefreshCw, Check, AlertCircle
} from 'lucide-react';
import { generateDocument, DOCUMENT_TYPES, DocumentType } from '../../services/ai/documentDrafter';
import { generateNd30Docx } from '../../services/ai/docxGenerator';

interface AIDocumentDrafterProps {
    projectId: string;
    projectName: string;
    isOpen: boolean;
    onClose: () => void;
}

export const AIDocumentDrafter: React.FC<AIDocumentDrafterProps> = ({
    projectId,
    projectName,
    isOpen,
    onClose,
}) => {
    const [selectedType, setSelectedType] = useState<DocumentType | ''>('');
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [draftContent, setDraftContent] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleGenerate = useCallback(async () => {
        if (!selectedType) return;
        setLoading(true);
        setError(null);
        setDraftContent(null);

        try {
            const content = await generateDocument(projectId, selectedType);
            setDraftContent(content);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Lỗi không xác định');
        } finally {
            setLoading(false);
        }
    }, [projectId, selectedType]);

    const handleCopy = useCallback(() => {
        if (!draftContent) return;
        navigator.clipboard.writeText(draftContent).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }, [draftContent]);

    const handleDownloadDocx = useCallback(async () => {
        if (!draftContent) return;
        setDownloading(true);
        try {
            const typeInfo = DOCUMENT_TYPES.find(t => t.type === selectedType);
            const title = typeInfo?.label || 'VĂN BẢN';
            const docSymbol = selectedType === 'monitoring_report' ? 'BC-BQLDA'
                : selectedType === 'settlement_report' ? 'BC-QT'
                    : selectedType === 'extension_request' ? 'CV-BQLDA'
                        : selectedType === 'acceptance_record' ? 'BB-NT'
                            : selectedType === 'adjustment_proposal' ? 'TTr-BQLDA'
                                : selectedType === 'progress_report' ? 'BC-TĐ'
                                    : 'CV-BQLDA';

            const blob = await generateNd30Docx({
                organizationParent: 'HỌC VIỆN CTQG HỒ CHÍ MINH',
                organizationName: 'BAN QUẢN LÝ DỰ ÁN ĐTXD CN',
                documentNumber: `……/${docSymbol}`,
                title,
                content: draftContent,
                date: new Date(),
                location: 'Hà Nội',
                signerTitle: 'TRƯỞNG BAN',
                signerName: '(Ký, ghi rõ họ tên)',
            });

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${typeInfo?.label || 'van-ban'}_${projectId}_${new Date().toISOString().slice(0, 10)}.docx`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error('DOCX generation failed:', e);
            setError('Không thể tạo file DOCX. Vui lòng thử "Sao chép" nội dung.');
        } finally {
            setDownloading(false);
        }
    }, [draftContent, selectedType, projectId]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-[700px] max-h-[85vh] flex flex-col border border-slate-200 dark:border-slate-700">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <Sparkles size={18} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                Soạn văn bản AI
                            </h2>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-[400px]">
                                {projectName}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <X size={18} className="text-slate-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5">
                    {/* Document type selector */}
                    <div className="mb-4">
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                            Chọn loại văn bản
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {DOCUMENT_TYPES.map(dt => (
                                <button
                                    key={dt.type}
                                    onClick={() => { setSelectedType(dt.type); setDraftContent(null); setError(null); }}
                                    className={`flex items-start gap-2.5 p-3 rounded-lg border text-left transition-all
                                        ${selectedType === dt.type
                                            ? 'border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-400/50'
                                            : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                                        }`}
                                >
                                    <span className="text-lg mt-0.5">{dt.icon}</span>
                                    <div>
                                        <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                                            {dt.label}
                                        </p>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">
                                            {dt.description}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Generate button */}
                    {selectedType && !draftContent && (
                        <button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-400 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <RefreshCw size={16} className="animate-spin" />
                                    Đang soạn thảo...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={16} />
                                    Tạo bản nháp
                                </>
                            )}
                        </button>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400 text-xs flex items-start gap-2">
                            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Draft content */}
                    {draftContent && (
                        <div className="mt-4">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                                    <FileText size={14} />
                                    Bản nháp
                                </h3>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={handleGenerate}
                                        disabled={loading}
                                        className="text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                                    >
                                        <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                                        Tạo lại
                                    </button>
                                    <button
                                        onClick={handleCopy}
                                        className="text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                                    >
                                        {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                        {copied ? 'Đã sao chép' : 'Sao chép'}
                                    </button>
                                    <button
                                        onClick={handleDownloadDocx}
                                        disabled={downloading}
                                        className="text-[11px] px-2.5 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400 transition-colors flex items-center gap-1"
                                    >
                                        {downloading ? <RefreshCw size={12} className="animate-spin" /> : <Download size={12} />}
                                        {downloading ? 'Đang tạo DOCX...' : 'Tải DOCX'}
                                    </button>
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 max-h-[50vh] overflow-y-auto">
                                <pre className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                                    {draftContent}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIDocumentDrafter;
