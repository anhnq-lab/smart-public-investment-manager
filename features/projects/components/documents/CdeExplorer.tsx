import React, { useMemo } from 'react';
import { Document, Folder } from '@/types';
import {
    Folder as FolderIcon, FolderOpen, ChevronRight, CheckCircle2, Upload,
    Clock, FileCheck, Send, Archive
} from 'lucide-react';
import { DocumentService } from '@/services';
import { getFileIcon } from '@/utils/fileIcons';
import { getStageColor } from '@/utils/stageColors';
import { DocActionMenu } from '@/components/common/ActionMenu';

// CDE folder structure per ISO 19650
const CDE_CONTAINERS = [
    { id: 'WIP', name: 'WIP - Đang xử lý', status: 'S0', color: 'gray', icon: Clock },
    { id: 'SHARED', name: 'SHARED - Chia sẻ', status: 'S1-S6', color: 'blue', icon: Send },
    { id: 'PUBLISHED', name: 'PUBLISHED - Phát hành', status: 'A1-A5', color: 'emerald', icon: FileCheck },
    { id: 'ARCHIVED', name: 'ARCHIVED - Lưu trữ', status: 'B1', color: 'purple', icon: Archive },
];

interface CdeExplorerProps {
    folders: Folder[];
    documents: Document[];
    filteredDocuments: Document[];
    isLoading: boolean;
    activeFolderId: string;
    setActiveFolderId: (id: string) => void;
    searchQuery: string;
    folderDocCount: (folderId: string) => number;
    onPreview: (doc: Document) => void;
    onHistory: (doc: Document) => void;
    onUpload: () => void;
}

export const CdeExplorer: React.FC<CdeExplorerProps> = ({
    folders, documents, filteredDocuments, isLoading,
    activeFolderId, setActiveFolderId, searchQuery,
    folderDocCount, onPreview, onHistory, onUpload,
}) => {
    const activeFolder = folders.find(f => f.FolderID === activeFolderId);
    const breadcrumbs = useMemo(() => {
        const path: Folder[] = [];
        let current = activeFolder;
        while (current) {
            path.unshift(current);
            if (!current.ParentID) break;
            current = folders.find(f => f.FolderID === current!.ParentID);
        }
        return path;
    }, [activeFolder, folders]);

    // Recursive folder tree renderer
    const renderFolderTree = (parentId: string | undefined, level = 0) => {
        const children = folders.filter(f => f.ParentID === parentId);
        if (children.length === 0) return null;

        return (
            <div className={`space-y-0.5 ${level > 0 ? 'ml-4 border-l border-gray-200/50 dark:border-slate-600/50 pl-2' : ''}`}>
                {children.map(folder => {
                    const isActive = folder.FolderID === activeFolderId;
                    const hasChildren = folders.some(f => f.ParentID === folder.FolderID);
                    const docCount = folderDocCount(folder.FolderID);

                    return (
                        <div key={folder.FolderID}>
                            <div
                                onClick={() => setActiveFolderId(folder.FolderID)}
                                className={`flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-all text-sm group ${isActive
                                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold shadow-sm'
                                    : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                                    }`}
                            >
                                <FolderIcon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400 fill-blue-100 dark:fill-blue-900/40' : 'text-gray-400 dark:text-slate-500 group-hover:text-gray-500 dark:group-hover:text-slate-400'}`} />
                                <span className="truncate flex-1">{folder.Name}</span>
                                {docCount > 0 && (
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'}`}>
                                        {docCount}
                                    </span>
                                )}
                            </div>
                            {hasChildren && renderFolderTree(folder.FolderID, level + 1)}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden flex h-[600px]">
            {/* Folder Tree Sidebar */}
            <div className="w-[280px] border-r border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50 flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <h3 className="text-xs font-black text-gray-800 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-blue-600" />
                        Cấu trúc CDE
                    </h3>
                </div>

                {/* Container Quick Access */}
                <div className="p-3 space-y-1 border-b border-gray-200 dark:border-slate-700">
                    {CDE_CONTAINERS.map(container => {
                        const colors = getStageColor(container.color);
                        const ContainerIcon = container.icon;
                        return (
                            <button
                                key={container.id}
                                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-all ${colors.bg} hover:opacity-80`}
                            >
                                <ContainerIcon className={`w-4 h-4 ${colors.text}`} />
                                <div className="flex-1 min-w-0">
                                    <span className={`text-xs font-bold ${colors.text} block truncate`}>{container.name}</span>
                                </div>
                                <span className={`text-[10px] font-mono ${colors.text} shrink-0`}>{container.status}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Folder Tree */}
                <div className="flex-1 overflow-y-auto p-4">
                    {renderFolderTree(undefined)}
                    {folders.length === 0 && (
                        <div className="text-center text-gray-400 dark:text-slate-500 text-xs py-8">
                            <FolderIcon className="w-8 h-8 text-gray-200 dark:text-slate-600 mx-auto mb-2" />
                            Chưa có cấu trúc thư mục
                        </div>
                    )}
                </div>

                <div className="p-3 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-gray-400 dark:text-slate-500 text-center flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3" />
                    ISO 19650 Compliant
                </div>
            </div>

            {/* Document List Area */}
            <div className="flex-1 flex flex-col">
                {/* Breadcrumb */}
                <div className="px-5 py-3 border-b border-gray-200 dark:border-slate-700 flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400 bg-white dark:bg-slate-800">
                    <FolderIcon className="w-4 h-4 text-gray-300" />
                    {breadcrumbs.map((f, i) => (
                        <React.Fragment key={f.FolderID}>
                            {i > 0 && <ChevronRight className="w-4 h-4 text-gray-300" />}
                            <span
                                className={`${i === breadcrumbs.length - 1 ? 'font-bold text-gray-900 dark:text-slate-100' : 'hover:text-blue-600 cursor-pointer transition-colors'}`}
                                onClick={() => setActiveFolderId(f.FolderID)}
                            >
                                {f.Name}
                            </span>
                        </React.Fragment>
                    ))}
                </div>

                {/* Document List */}
                <div className="flex-1 overflow-y-auto p-5 bg-gray-50/30 dark:bg-slate-900/30">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full gap-3 text-gray-400 text-sm">
                            <div className="w-5 h-5 border-2 border-blue-300 border-t-transparent rounded-full animate-spin" />
                            Đang tải...
                        </div>
                    ) : filteredDocuments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                                <FolderOpen className="w-10 h-10 text-gray-200" />
                            </div>
                            <p className="text-sm font-bold text-gray-500 dark:text-slate-400 mb-1">Thư mục trống</p>
                            <p className="text-xs text-gray-400 dark:text-slate-500 mb-4">
                                {searchQuery ? 'Không tìm thấy tài liệu phù hợp' : 'Tải lên tài liệu đầu tiên vào thư mục này'}
                            </p>
                            {!searchQuery && (
                                <button
                                    onClick={onUpload}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                                >
                                    <Upload className="w-3.5 h-3.5" /> Tải lên ngay
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50/80 dark:bg-slate-700/80 text-gray-500 dark:text-slate-400 font-bold text-[11px] uppercase border-b border-gray-200 dark:border-slate-600">
                                    <tr>
                                        <th className="px-5 py-3 w-10"></th>
                                        <th className="px-5 py-3">Tên tài liệu</th>
                                        <th className="px-5 py-3 w-28">Phiên bản</th>
                                        <th className="px-5 py-3 w-48">Trạng thái</th>
                                        <th className="px-5 py-3 text-right w-28">Ngày</th>
                                        <th className="px-5 py-3 w-16"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                                    {filteredDocuments.map((doc) => {
                                        const fIcon = getFileIcon(doc.DocName);
                                        return (
                                            <tr
                                                key={doc.DocID}
                                                className="hover:bg-blue-50/50 dark:hover:bg-slate-700 cursor-pointer transition-colors group"
                                                onClick={() => onPreview(doc)}
                                            >
                                                <td className="px-5 py-3 text-center">
                                                    <div className={`w-8 h-8 rounded-lg ${fIcon.bg} flex items-center justify-center`}>
                                                        <fIcon.icon className={`w-4 h-4 ${fIcon.color}`} />
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <p className="font-medium text-gray-800 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">{doc.DocName}</p>
                                                    <p className="text-[10px] text-gray-400 uppercase font-mono mt-0.5">{doc.DocID}</p>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 rounded text-[10px] font-bold font-mono">
                                                        {doc.Version || 'P01.01'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className="w-2.5 h-2.5 rounded-full shrink-0"
                                                            style={{ backgroundColor: DocumentService.getStatusColor(doc.ISOStatus!) }}
                                                        />
                                                        <span className="text-[11px] font-bold text-gray-600 dark:text-slate-400">
                                                            {DocumentService.getStatusLabel(doc.ISOStatus!)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3 text-right text-xs text-gray-500 dark:text-slate-400 font-mono">{doc.UploadDate}</td>
                                                <td className="px-5 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                    <DocActionMenu
                                                        onView={() => onPreview(doc)}
                                                        onDownload={() => { }}
                                                        onHistory={() => onHistory(doc)}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
