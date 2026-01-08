
import React, { useState, useEffect, useMemo } from 'react';
import {
    Folder as FolderIcon, FileText, ChevronRight, ChevronDown,
    Upload, MoreVertical, Search, Filter, Eye, Download,
    CheckCircle2, Clock, AlertCircle, FileCheck, History,
    LayoutGrid, List as ListIcon, FolderOpen, ShieldCheck,
    ArrowRight, X, PenTool, RefreshCw
} from 'lucide-react';
import { Document, Folder, ISO19650Status } from '../types';
import { DocumentService, INTERLINKED_WORKFLOW_STEPS } from '../services/DocumentService';

interface CDEManagerProps {
    projectId: string;
    projectCode?: string;
}

export const CDEManager: React.FC<CDEManagerProps> = ({ projectId, projectCode }) => {
    const [folders, setFolders] = useState<Folder[]>([]);
    const [activeFolderId, setActiveFolderId] = useState<string>('FLD-ROOT');
    const [documents, setDocuments] = useState<Document[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Initial Load
    useEffect(() => {
        const loadData = () => {
            const allFolders = DocumentService.getFolders(projectId);
            setFolders(allFolders);
        };
        loadData();
    }, [projectId]);

    // Load docs when folder changes
    useEffect(() => {
        setIsLoading(true);
        setTimeout(() => {
            const docs = DocumentService.getDocumentsInFolder(activeFolderId);
            setDocuments(docs);
            setIsLoading(false);
        }, 300);
    }, [activeFolderId, projectId]);

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

    const nextStep = useMemo(() => {
        if (!selectedDoc) return null;
        return DocumentService.getNextWorkflowStep(selectedDoc);
    }, [selectedDoc]);

    const handleProcessStep = async (status: 'Approved' | 'Rejected') => {
        if (!selectedDoc || !nextStep) return;

        setIsProcessing(true);
        const comment = status === 'Approved' ? `Đã duyệt bước: ${nextStep.name}` : `Yêu cầu chỉnh sửa tại bước: ${nextStep.name}`;
        const success = await DocumentService.processStep(selectedDoc.DocID, status, comment, 'CURRENT_USER');

        if (success) {
            const docs = DocumentService.getDocumentsInFolder(activeFolderId);
            setDocuments(docs);
            const updatedDoc = docs.find(d => d.DocID === selectedDoc.DocID);
            setSelectedDoc(updatedDoc || null);
        }
        setIsProcessing(false);
    };

    const renderFolderTree = (parentId: string | undefined, level = 0) => {
        const children = folders.filter(f => f.ParentID === parentId);
        if (children.length === 0) return null;

        return (
            <div className={`space-y-1 ${level > 0 ? 'ml-4 border-l border-gray-100 pl-2' : ''}`}>
                {children.map(folder => {
                    const isActive = folder.FolderID === activeFolderId;
                    const hasChildren = folders.some(f => f.ParentID === folder.FolderID);

                    return (
                        <div key={folder.FolderID}>
                            <div
                                onClick={() => setActiveFolderId(folder.FolderID)}
                                className={`flex items-center gap-2 py-1.5 px-3 rounded-lg cursor-pointer transition-colors text-sm ${isActive ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                <FolderIcon className={`w-4 h-4 ${isActive ? 'text-blue-600 fill-blue-100' : 'text-gray-400'}`} />
                                <span className="truncate">{folder.Name}</span>
                            </div>
                            {hasChildren && renderFolderTree(folder.FolderID, level + 1)}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex h-[700px]">
            <div className="w-[300px] border-r border-gray-200 bg-gray-50/50 flex flex-col">
                <div className="p-4 border-b border-gray-200 bg-white">
                    <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-blue-600" /> Cấu trúc thư mục (ISO 19650)
                    </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {renderFolderTree(undefined)}
                </div>
                <div className="p-4 border-t border-gray-200 bg-white text-xs text-gray-400 text-center">
                    ISO 19650 Compliant
                </div>
            </div>

            <div className="flex-1 flex flex-col bg-white">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        {breadcrumbs.map((f, i) => (
                            <React.Fragment key={f.FolderID}>
                                {i > 0 && <ChevronRight className="w-4 h-4 text-gray-300" />}
                                <span className={i === breadcrumbs.length - 1 ? 'font-bold text-gray-900' : 'hover:text-blue-600 cursor-pointer'} onClick={() => setActiveFolderId(f.FolderID)}>
                                    {f.Name}
                                </span>
                            </React.Fragment>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-gray-400'}`}><ListIcon className="w-4 h-4" /></button>
                            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white shadow text-blue-600' : 'text-gray-400'}`}><LayoutGrid className="w-4 h-4" /></button>
                        </div>
                        <button className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm shadow-blue-200">
                            <Upload className="w-4 h-4" /> Tải lên
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full text-gray-400 text-sm">Đang tải dữ liệu...</div>
                    ) : documents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
                            <FolderOpen className="w-16 h-16 text-gray-200 mb-4" />
                            <p className="text-sm font-medium">Thư mục trống</p>
                        </div>
                    ) : (
                        viewMode === 'list' ? (
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50/80 text-gray-500 font-bold text-[11px] uppercase border-b border-gray-100">
                                        <tr>
                                            <th className="px-5 py-3 w-10"></th>
                                            <th className="px-5 py-3">Tên tài liệu</th>
                                            <th className="px-5 py-3">Phiên bản</th>
                                            <th className="px-5 py-3">Trạng thái ISO</th>
                                            <th className="px-5 py-3 text-right">Ngày tải lên</th>
                                            <th className="px-5 py-3 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {documents.map((doc) => (
                                            <tr key={doc.DocID} onClick={() => setSelectedDoc(doc)} className={`hover:bg-blue-50/50 cursor-pointer transition-colors ${selectedDoc?.DocID === doc.DocID ? 'bg-blue-50/80' : ''}`}>
                                                <td className="px-5 py-3 text-center">
                                                    {doc.DocName.endsWith('.pdf') ? <FileText className="w-5 h-5 text-red-500" /> : <FileText className="w-5 h-5 text-blue-500" />}
                                                </td>
                                                <td className="px-5 py-3 font-medium text-gray-800">
                                                    {doc.DocName}
                                                    <div className="text-[10px] text-gray-400 uppercase font-mono mt-0.5">{doc.DocID}</div>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-bold font-mono">{doc.Version || 'P01.01'}</span>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className="w-2.5 h-2.5 rounded-full"
                                                            style={{ backgroundColor: DocumentService.getStatusColor(doc.ISOStatus!) }}
                                                        ></span>
                                                        <span className="text-[11px] font-bold text-gray-600">{DocumentService.getStatusLabel(doc.ISOStatus!)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3 text-right text-xs text-gray-500 font-mono">{doc.UploadDate}</td>
                                                <td className="px-5 py-3 text-center">
                                                    <button className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"><MoreVertical className="w-4 h-4" /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {documents.map(doc => (
                                    <div key={doc.DocID} onClick={() => setSelectedDoc(doc)} className={`bg-white p-4 rounded-xl border hover:shadow-md transition-all cursor-pointer flex flex-col items-center text-center gap-3 ${selectedDoc?.DocID === doc.DocID ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-100'}`}>
                                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
                                            {doc.DocName.endsWith('.pdf') ? <FileText className="w-8 h-8 text-red-500" /> : <FileText className="w-8 h-8 text-blue-500" />}
                                        </div>
                                        <div className="w-full">
                                            <p className="text-sm font-bold text-gray-800 line-clamp-2 min-h-[40px]" title={doc.DocName}>{doc.DocName}</p>
                                            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-50">
                                                <span className="text-[10px] font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{doc.Version || 'v1.0'}</span>
                                                <span
                                                    className="w-2.5 h-2.5 rounded-full"
                                                    title={DocumentService.getStatusLabel(doc.ISOStatus!)}
                                                    style={{ backgroundColor: DocumentService.getStatusColor(doc.ISOStatus!) }}
                                                ></span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>
            </div>

            {selectedDoc && (
                <div className="w-[360px] bg-white border-l border-gray-200 flex flex-col shadow-xl animate-in slide-in-from-right-4 duration-300 relative z-10">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <span className="text-xs font-black text-gray-500 uppercase tracking-widest">PHÊ DUYỆT HỒ SƠ</span>
                        <button onClick={() => setSelectedDoc(null)} className="text-gray-400 hover:text-red-500"><X className="w-5 h-5" /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 space-y-6">
                        <div className="flex items-start gap-3 pb-4 border-b border-gray-100">
                            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0 shadow-inner">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-gray-800 line-clamp-2">{selectedDoc.DocName}</h4>
                                <p className="text-[10px] font-mono text-gray-400 mt-1 uppercase">Mã: {selectedDoc.DocID} • v{selectedDoc.Version}</p>
                            </div>
                        </div>

                        <div className="py-2">
                            <div className="flex justify-between mb-4">
                                {INTERLINKED_WORKFLOW_STEPS.map((step, idx) => {
                                    const isCompleted = selectedDoc.WorkflowHistory?.some(h => h.StepName === step.name && h.Status === 'Approved');
                                    const isCurrent = nextStep?.id === step.id;

                                    return (
                                        <div key={idx} className="flex flex-col items-center gap-1.5 flex-1 relative">
                                            {idx < INTERLINKED_WORKFLOW_STEPS.length - 1 && (
                                                <div className={`absolute left-1/2 right-[-50%] top-2.5 h-0.5 z-0 ${isCompleted ? 'bg-emerald-500' : 'bg-gray-100'}`}></div>
                                            )}

                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center z-10 text-[8px] font-black border-2 transition-all ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' :
                                                    isCurrent ? 'bg-white border-blue-600 text-blue-600 ring-2 ring-blue-100' :
                                                        'bg-white border-gray-200 text-gray-300'
                                                }`}>
                                                {isCompleted ? <CheckCircle2 className="w-3 h-3" /> : (idx + 1)}
                                            </div>
                                            <span className={`text-[8px] font-bold text-center uppercase tracking-tighter ${isCompleted ? 'text-emerald-600' :
                                                    isCurrent ? 'text-blue-600 font-extrabold' :
                                                        'text-gray-400'
                                                }`}>
                                                {step.name.split(' ').pop()}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                            <p className="text-[10px] font-bold text-blue-400 uppercase mb-2">Trạng thái hiện tại</p>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-gray-800">{DocumentService.getStatusLabel(selectedDoc.ISOStatus!)}</p>
                                    {nextStep && <p className="text-[10px] text-blue-600 font-bold mt-0.5">Đang chờ: {nextStep.name}</p>}
                                </div>
                            </div>
                        </div>

                        <div>
                            <h5 className="text-[11px] font-black text-gray-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <History className="w-3.5 h-3.5" /> Lịch sử luân chuyển
                            </h5>
                            <div className="relative pl-4 space-y-4 before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                                {selectedDoc.WorkflowHistory?.slice().reverse().map((hist, idx) => (
                                    <div key={idx} className="relative">
                                        <div className={`absolute -left-[19px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white ring-2 ${hist.Status === 'Approved' ? 'bg-emerald-500 ring-emerald-50' : 'bg-red-500 ring-red-50'}`}></div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-800">{hist.StepName}</p>
                                            <p className="text-[10px] text-gray-500 mt-0.5">Bởi: {hist.ActorID} • {new Date(hist.Timestamp || '').toLocaleString('vi-VN')}</p>
                                            <p className={`text-[10px] mt-1 p-2 rounded border italic ${hist.Status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                                "{hist.Comment}"
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-3">
                        {nextStep ? (
                            <>
                                <div className="flex flex-col gap-2">
                                    <div className="flex gap-2">
                                        <button
                                            disabled={isProcessing}
                                            onClick={() => handleProcessStep('Rejected')}
                                            className="flex-1 py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center justify-center gap-2"
                                        >
                                            <X className="w-4 h-4" /> Từ chối
                                        </button>
                                        <button
                                            disabled={isProcessing}
                                            onClick={() => handleProcessStep('Approved')}
                                            className={`flex-[2] py-2.5 text-white rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 ${nextStep.id === 'LEADER_SIGN' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                                                }`}
                                        >
                                            {isProcessing ? (
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
                                            ) : (
                                                <>
                                                    {nextStep.id === 'LEADER_SIGN' ? <PenTool className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                                                    {nextStep.name}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <p className="text-[9px] text-gray-400 text-center italic font-medium">Quyền hạn: {nextStep.role}</p>
                                </div>
                            </>
                        ) : (
                            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3 text-emerald-700">
                                <FileCheck className="w-6 h-6 shrink-0" />
                                <p className="text-[11px] font-bold">Hồ sơ đã hoàn tất quy trình phê duyệt & Ký số.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
