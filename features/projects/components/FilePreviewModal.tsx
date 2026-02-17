import React, { useMemo, useEffect } from 'react';
import { X, Printer, Download, FileText, Image as ImageIcon } from 'lucide-react';

interface FilePreviewModalProps {
    file: any;
    onClose: () => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ file, onClose }) => {
    const f = file as any;
    const fileName = (f.DocName || f.title || f.number || f.name || '').toLowerCase();
    const isPDF = fileName.endsWith('.pdf');
    const isImage = fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg');
    const isExcel = fileName.includes('vốn') || fileName.includes('dự toán') || fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

    // Create blob URL for local files
    const blobUrl = useMemo(() => {
        if (f.isLocal && f.fileObj) {
            return URL.createObjectURL(f.fileObj);
        }
        return null;
    }, [f]);

    // Cleanup blob URL
    useEffect(() => {
        return () => {
            if (blobUrl) URL.revokeObjectURL(blobUrl);
        };
    }, [blobUrl]);

    if (!file) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#F1F5F9] w-full max-w-6xl h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-white/20">
                {/* Header */}
                <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-gray-200">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                            {isImage ? <ImageIcon className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                        </div>
                        <div>
                            <h3 className="text-base font-black text-gray-800 tracking-tight">{f.DocName || f.title || f.number || f.name}</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{f.isLocal ? 'TÀI LIỆU VỪA TẢI LÊN' : f.Version ? `PHIÊN BẢN: ${f.Version}` : f.code || 'TÀI LIỆU DỰ ÁN'}{f.Size ? ` • ${f.Size}` : ''}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-xl transition-all" title="In tài liệu"><Printer className="w-5 h-5" /></button>
                        <button className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-xl transition-all" title="Tải xuống"><Download className="w-5 h-5" /></button>
                        <div className="w-px h-6 bg-gray-200 mx-2"></div>
                        <button onClick={onClose} className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-8 flex justify-center bg-[#525659]">
                    {(() => {
                        // Determine the viewable URL
                        const viewUrl = blobUrl || f.storage_path || f.StoragePath || f.url || null;
                        const canViewPDF = isPDF && viewUrl;
                        const canViewImage = isImage && viewUrl;

                        if (canViewPDF) {
                            return (
                                <div className="bg-white w-full h-full rounded-sm shadow-2xl overflow-hidden flex flex-col relative">
                                    <iframe
                                        src={`${viewUrl}#toolbar=0`}
                                        className="w-full h-full border-0"
                                        title="PDF Viewer"
                                    />
                                </div>
                            );
                        }

                        if (canViewImage) {
                            return (
                                <div className="bg-white w-full h-full rounded-sm shadow-2xl overflow-hidden flex items-center justify-center p-4 bg-gray-100">
                                    <img src={viewUrl} className="max-w-full max-h-full object-contain shadow-lg" alt="Preview" />
                                </div>
                            );
                        }

                        if (isExcel) {
                            return (
                                <div className="bg-white w-full max-w-5xl shadow-2xl rounded-sm overflow-hidden flex flex-col h-fit">
                                    <div className="bg-[#217346] text-white px-4 py-1 text-xs font-medium uppercase tracking-tighter">Microsoft Excel Viewer</div>
                                    <div className="overflow-x-auto p-6">
                                        <p className="text-gray-500 text-sm mb-4">
                                            Để xem nội dung file Excel, vui lòng tải xuống.
                                        </p>
                                        {viewUrl && (
                                            <a href={viewUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold">
                                                <Download className="w-4 h-4" /> Tải xuống
                                            </a>
                                        )}
                                    </div>
                                </div>
                            );
                        }

                        // Fallback — try to embed if we have a URL
                        if (viewUrl) {
                            return (
                                <div className="bg-white w-full h-full rounded-sm shadow-2xl overflow-hidden flex flex-col relative">
                                    <iframe
                                        src={viewUrl}
                                        className="w-full h-full border-0"
                                        title="Document Viewer"
                                    />
                                </div>
                            );
                        }

                        // No URL available — show placeholder
                        return (
                            <div className="bg-white w-full max-w-[800px] min-h-[1100px] shadow-2xl p-[60px] text-gray-800 font-serif leading-relaxed">
                                <div className="flex justify-between mb-12 italic text-sm">
                                    <div>BAN QLDA ĐẦU TƯ CÔNG<br /><b>SỐ: {f.code || f.number || '00/BQL'}</b></div>
                                    <div className="text-right">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br />Độc lập - Tự do - Hạnh phúc</div>
                                </div>
                                <div className="text-center mb-10">
                                    <h2 className="text-xl font-bold uppercase tracking-widest">{f.title || f.name || 'VĂN BẢN TRÌNH DUYỆT'}</h2>
                                </div>
                                <div className="space-y-6 text-justify">
                                    <p className="p-4 bg-blue-50 text-blue-800 rounded-xl text-sm border border-blue-100 font-sans italic">
                                        Hệ thống hiện tại hỗ trợ hiển thị nội dung thực cho file PDF và Hình ảnh (JPG, PNG).
                                        Đối với định dạng Office (.docx, .xlsx), vui lòng tải xuống để xem hoặc sử dụng trình xem chuyên dụng.
                                    </p>
                                    <p>Căn cứ tình hình triển khai thực tế của dự án, Ban Quản lý báo cáo nội dung sau:</p>
                                    <div className="h-4 bg-gray-50 rounded w-full animate-pulse"></div>
                                    <div className="h-4 bg-gray-50 rounded w-3/4 animate-pulse"></div>
                                    <div className="mt-20 flex justify-between">
                                        <div className="text-center font-bold">NGƯỜI LẬP BIỂU</div>
                                        <div className="text-center font-bold">GIÁM ĐỐC BAN</div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
};

export default FilePreviewModal;
