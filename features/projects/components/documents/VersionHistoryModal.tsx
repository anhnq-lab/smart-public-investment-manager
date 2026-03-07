import React from 'react';
import { Document } from '@/types';
import { History, X } from 'lucide-react';

interface VersionHistoryModalProps {
    doc: Document;
    onClose: () => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({ doc, onClose }) => {
    const history = [
        { version: doc.Version || 'P01.01', date: doc.UploadDate, user: 'Ban QLDA', isCurrent: true },
        ...(doc.WorkflowHistory || []).map((wh, i) => ({
            version: `P01.${String(i + 1).padStart(2, '0')}`,
            date: wh.Timestamp ? new Date(wh.Timestamp).toLocaleDateString('vi-VN') : '',
            user: wh.ActorID || '',
            isCurrent: false,
        }))
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-5 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white dark:from-slate-700 dark:to-slate-800">
                    <div className="min-w-0">
                        <h3 className="text-base font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
                            <History className="w-5 h-5 text-amber-500" /> Lịch sử phiên bản
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 truncate">{doc.DocName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-slate-700 text-xs uppercase font-bold text-gray-500 dark:text-slate-400 sticky top-0">
                            <tr>
                                <th className="px-5 py-3">Phiên bản</th>
                                <th className="px-5 py-3">Ngày</th>
                                <th className="px-5 py-3">Người cập nhật</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                            {history.map((h, idx) => (
                                <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-slate-700">
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${h.isCurrent ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                                                {h.version}
                                            </span>
                                            {h.isCurrent && <span className="text-[10px] uppercase font-bold text-emerald-600">Hiện tại</span>}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-gray-600 dark:text-slate-400 text-xs">{h.date}</td>
                                    <td className="px-5 py-3 text-gray-700 dark:text-slate-300 font-medium text-xs">{h.user}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {history.length <= 1 && (
                        <div className="p-8 text-center text-gray-400 dark:text-slate-500 text-sm">
                            Tài liệu này chưa có bản cập nhật nào.
                        </div>
                    )}
                </div>
                <div className="p-4 bg-gray-50 dark:bg-slate-700 border-t border-gray-200 dark:border-slate-600 text-right">
                    <button onClick={onClose} className="px-4 py-2 bg-white dark:bg-slate-600 border border-gray-200 dark:border-slate-500 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-500 transition-colors dark:text-slate-200">
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};
