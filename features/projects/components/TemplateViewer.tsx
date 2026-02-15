import React, { useState, useEffect } from 'react';
import { X, FileText, ExternalLink, Copy, Check } from 'lucide-react';

interface TemplateViewerProps {
    templatePath: string;
    templateLabel?: string;
    isOpen: boolean;
    onClose: () => void;
}

export const TemplateViewer: React.FC<TemplateViewerProps> = ({
    templatePath,
    templateLabel,
    isOpen,
    onClose
}) => {
    const [content, setContent] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (isOpen && templatePath) {
            setLoading(true);
            fetch(`/templates/${templatePath}`)
                .then(res => {
                    if (!res.ok) throw new Error('Template not found');
                    return res.text();
                })
                .then(text => {
                    setContent(text);
                    setLoading(false);
                })
                .catch(() => {
                    setContent('⚠️ Không tải được biểu mẫu. Kiểm tra file: templates/' + templatePath);
                    setLoading(false);
                });
        }
    }, [isOpen, templatePath]);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={onClose}>
            <div className="bg-[#0f172a] rounded-2xl shadow-2xl w-[90vw] max-w-4xl max-h-[85vh] flex flex-col border border-[#334155]"
                onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-[#334155]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                            <FileText size={20} className="text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-[#f8fafc]">
                                {templateLabel || templatePath}
                            </h3>
                            <p className="text-xs text-[#94a3b8]">templates/{templatePath}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleCopy}
                            className="p-2 rounded-lg hover:bg-[#334155] text-[#cbd5e1] transition-colors"
                            title="Sao chép nội dung">
                            {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                        </button>
                        <button onClick={onClose}
                            className="p-2 rounded-lg hover:bg-[#334155] text-[#cbd5e1] transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-40">
                            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
                        </div>
                    ) : (
                        <pre className="whitespace-pre-wrap text-sm text-[#cbd5e1] font-mono leading-relaxed">
                            {content}
                        </pre>
                    )}
                </div>
            </div>
        </div>
    );
};
