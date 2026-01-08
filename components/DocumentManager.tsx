import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    Folder, FileText, ChevronRight, ChevronDown, File as FileIcon,
    Download, Eye, ShieldCheck, PenTool, HardDrive, Box, X, Check, Loader2, Clock, Printer, Upload, Image as ImageIcon, History, Search
} from 'lucide-react';
import { mockProjects, mockDocuments } from '../mockData';
import { DocCategory } from '../types';

// --- COMPONENT: REUSABLE FILE PREVIEW (ACTUAL + MOCK) ---
const FilePreviewModal: React.FC<{ file: any, onClose: () => void }> = ({ file, onClose }) => {
    const f = file as any;
    const fileName = (f.DocName || f.name || '').toLowerCase();
    const isPDF = fileName.endsWith('.pdf');
    const isImage = fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg');
    const isIFC = fileName.endsWith('.ifc');
    const isExcel = fileName.includes('vốn') || fileName.includes('thanh_toan') || fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv');
    const isWord = fileName.includes('pháp lý') || fileName.includes('tờ trình') || fileName.endsWith('.docx') || fileName.endsWith('.doc');

    // Create a Blob URL for local files
    const blobUrl = useMemo(() => {
        if (f.isLocal && f.fileObj) {
            return URL.createObjectURL(f.fileObj);
        }
        return null;
    }, [f]);

    // Cleanup Blob URL
    useEffect(() => {
        return () => {
            if (blobUrl) URL.revokeObjectURL(blobUrl);
        };
    }, [blobUrl]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#F1F5F9] w-full max-w-6xl h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-white/20">
                <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-gray-200">
                    <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-xl ${isIFC ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                            {isIFC ? <Box className="w-6 h-6" /> : isImage ? <ImageIcon className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                        </div>
                        <div>
                            <h3 className="text-base font-black text-gray-800 tracking-tight">{f.DocName || f.name}</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                {f.isLocal ? 'TÀI LIỆU VỪA TẢI LÊN' : `PHIÊN BẢN: ${f.Version || '1.0'}`} • {f.Size || (f.fileObj ? (f.fileObj.size / 1024 / 1024).toFixed(2) + ' MB' : 'N/A')}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-xl transition-all"><Printer className="w-5 h-5" /></button>
                        <button className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-xl transition-all"><Download className="w-5 h-5" /></button>
                        <div className="w-px h-6 bg-gray-200 mx-2"></div>
                        <button onClick={onClose} className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><X className="w-6 h-6" /></button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-8 flex justify-center bg-[#525659]">
                    {f.isLocal && (isPDF || isImage) ? (
                        /* REAL CONTENT VIEW FOR LOCAL PDF/IMAGES */
                        <div className="bg-white w-full h-full rounded-sm shadow-2xl overflow-hidden flex flex-col relative">
                            {isPDF ? (
                                <iframe
                                    src={`${blobUrl}#toolbar=0`}
                                    className="w-full h-full border-0"
                                    title="PDF Viewer"
                                />
                            ) : (
                                <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4">
                                    <img src={blobUrl!} className="max-w-full max-h-full object-contain shadow-lg" alt="Preview" />
                                </div>
                            )}
                        </div>
                    ) : isIFC ? (
                        <div className="bg-gray-900 w-full h-full rounded-xl flex items-center justify-center relative group cursor-move shadow-inner">
                            <div className="text-center">
                                <Box className="w-24 h-24 text-blue-500 mx-auto mb-6 animate-pulse" />
                                <h3 className="text-xl font-bold text-gray-300 uppercase tracking-tighter">BIM INTEGRATED VIEWER</h3>
                                <p className="text-gray-500 mt-2 text-sm">Rendering 3D Model: {f.DocName || f.name}</p>
                            </div>
                        </div>
                    ) : isExcel ? (
                        <div className="bg-white w-full max-w-5xl shadow-2xl rounded-sm overflow-hidden flex flex-col h-fit">
                            <div className="bg-[#217346] text-white px-4 py-1 text-xs font-medium uppercase tracking-tighter">Microsoft Excel Online Preview</div>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-[12px]">
                                    <thead>
                                        <tr className="bg-[#E6E6E6] text-gray-600 text-center">
                                            <th className="border border-gray-300 w-10 py-1 font-normal"></th>
                                            <th className="border border-gray-300 px-4 py-1 font-normal uppercase">Cột A</th>
                                            <th className="border border-gray-300 px-4 py-1 font-normal uppercase">Cột B</th>
                                            <th className="border border-gray-300 px-4 py-1 font-normal uppercase">Cột C</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(row => (
                                            <tr key={row}>
                                                <td className="bg-[#E6E6E6] border border-gray-300 text-center text-gray-500 py-1">{row}</td>
                                                <td className="border border-gray-200 px-3 py-1 bg-white">Dữ liệu dòng {row}</td>
                                                <td className="border border-gray-200 px-3 py-1 bg-white"></td>
                                                <td className="border border-gray-200 px-3 py-1 bg-white"></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        /* MOCK TEMPLATE VIEW FOR NON-PDF/IMG OR REMOTE DOCS */
                        <div className="bg-white w-full max-w-[800px] min-h-[1100px] shadow-2xl p-[80px] text-gray-800 font-serif relative">
                            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 pointer-events-none select-none">
                                <h1 className="text-9xl font-black">CONFIDENTIAL</h1>
                            </div>
                            <div className="text-center mb-16 underline decoration-double underline-offset-8">
                                <h2 className="text-xl font-bold uppercase tracking-widest">{f.DocName || f.name}</h2>
                            </div>
                            <div className="space-y-6 text-justify text-[15px] leading-relaxed">
                                <p className="font-bold">Ghi chú quan trọng:</p>
                                <p>Định dạng Office (.docx, .xlsx) hiện tại đang được mô phỏng xem trước. Trong phiên bản chính thức, hệ thống sẽ tích hợp Microsoft Office 365 / Google Workspace Viewer API để hiển thị nội dung gốc.</p>
                                <p>Đối với định dạng PDF và Hình ảnh tải lên, hệ thống đã hỗ trợ xem trực tiếp 100%.</p>
                                <div className="mt-20 flex justify-between">
                                    <div className="text-center"><p className="font-bold">ĐƠN VỊ THỰC HIỆN</p><p className="text-xs italic">(Ký, ghi rõ họ tên)</p></div>
                                    <div className="text-center"><p className="font-bold">BAN QUẢN LÝ DỰ ÁN</p><p className="text-xs italic">(Ký tên và đóng dấu)</p></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- COMPONENT: VERSION HISTORY MODAL ---
const VersionHistoryModal: React.FC<{ file: any, onClose: () => void }> = ({ file, onClose }) => {
    // Current version as the first item
    const history = [
        {
            Version: file.Version || 'v1.0',
            Date: file.UploadDate,
            User: 'Admin', // In real app, current user
            Size: file.Size,
            isCurrent: true
        },
        ...(file.History || [])
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in zoom-in-95">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">Lịch sử phiên bản</h3>
                        <p className="text-sm text-gray-500 mt-1 truncate max-w-md">{file.DocName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-0">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500">
                            <tr>
                                <th className="px-6 py-4">Phiên bản</th>
                                <th className="px-6 py-4">Thời gian cập nhật</th>
                                <th className="px-6 py-4">Người cập nhật</th>
                                <th className="px-6 py-4 text-right">Dung lượng</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {history.map((ver: any, idx: number) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded-md font-mono text-xs font-bold ${ver.isCurrent ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {ver.Version}
                                            </span>
                                            {ver.isCurrent && <span className="text-[10px] uppercase font-bold text-emerald-600 bg-white border border-emerald-200 px-1.5 rounded">Hiện tại</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{ver.Date}</td>
                                    <td className="px-6 py-4 font-medium text-gray-800">{ver.User}</td>
                                    <td className="px-6 py-4 text-right font-mono text-gray-500">{ver.Size}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {history.length === 1 && (
                        <div className="p-8 text-center text-gray-400 italic text-sm">
                            Tài liệu này chưa có bản cập nhật nào.
                        </div>
                    )}
                </div>
                <div className="p-4 bg-gray-50 border-t border-gray-100 text-right">
                    <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Đóng</button>
                </div>
            </div>
        </div>
    );
};

const folders = [
    { id: 'F1', name: '01. Hồ sơ Pháp lý dự án', type: 'folder', children: [] },
    { id: 'F2', name: '02. Hồ sơ Thiết kế & Khảo sát', type: 'folder', children: [] },
    { id: 'F3', name: '03. Hồ sơ Đấu thầu', type: 'folder', children: [] },
    { id: 'F4', name: '04. Hồ sơ Quản lý chất lượng', type: 'folder', children: [] },
    { id: 'F5', name: '05. Hồ sơ Thanh quyết toán', type: 'folder', children: [] },
];

const FilterChip: React.FC<{ label: string, active: boolean, onClick: () => void, icon?: React.ReactNode }> = ({ label, active, onClick, icon }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${active
            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
            : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-700'
            }`}
    >
        {icon}
        {label}
    </button>
);

const DocumentManager: React.FC = () => {
    // Default to the first project or standard project
    const defaultProject = mockProjects.find(p => p.ProjectID === 'PR2400031160') || mockProjects[0];
    const [selectedProject, setSelectedProject] = useState<string>(defaultProject?.ProjectID || "");
    const [selectedFolder, setSelectedFolder] = useState<string | null>('F1');
    const [selectedFile, setSelectedFile] = useState<any>(null);
    const [isSignModalOpen, setIsSignModalOpen] = useState(false);
    const [signStep, setSignStep] = useState<number>(0);
    const [previewFile, setPreviewFile] = useState<any>(null);
    const [historyFile, setHistoryFile] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState<'all' | 'pdf' | 'office' | 'bim' | 'image'>('all');

    const [uploadedDocs, setUploadedDocs] = useState<Record<string, any[]>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0 && selectedFolder) {
            const currentDocsInFolder = [...(uploadedDocs[`${selectedProject}-${selectedFolder}`] || [])];
            let updatedCount = 0;
            let newCount = 0;

            Array.from(files).forEach((file: File) => {
                const existingDocIndex = currentDocsInFolder.findIndex(d => d.DocName === file.name);

                if (existingDocIndex > -1) {
                    // UPDATE EXISTING FILE (VERSIONING)
                    const oldDoc = currentDocsInFolder[existingDocIndex];
                    const oldVersionNum = parseFloat(oldDoc.Version.replace('v', ''));
                    const newVersion = `v${(oldVersionNum + 1.0).toFixed(1)}`;
                    const now = new Date();

                    // Push old version to history
                    const historyEntry = {
                        Version: oldDoc.Version,
                        Date: oldDoc.UploadDate,
                        User: 'Admin', // Mock user
                        Size: oldDoc.Size
                    };

                    const updatedDoc = {
                        ...oldDoc,
                        UploadDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
                        Size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
                        Version: newVersion,
                        fileObj: file,
                        isLocal: true,
                        History: [historyEntry, ...(oldDoc.History || [])]
                    };

                    currentDocsInFolder[existingDocIndex] = updatedDoc;
                    updatedCount++;
                } else {
                    // CREATE NEW FILE
                    const now = new Date();
                    const newDoc = {
                        DocID: Date.now() + Math.random(),
                        DocName: file.name,
                        UploadDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
                        IsDigitized: true,
                        Size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
                        Version: "v1.0",
                        isLocal: true,
                        fileObj: file,
                        History: []
                    };
                    currentDocsInFolder.unshift(newDoc); // Add to top
                    newCount++;
                }
            });

            setUploadedDocs(prev => ({
                ...prev,
                [`${selectedProject}-${selectedFolder}`]: currentDocsInFolder
            }));

            e.target.value = '';
            if (updatedCount > 0 && newCount > 0) {
                alert(`Đã thêm mới ${newCount} tài liệu và cập nhật phiên bản cho ${updatedCount} tài liệu.`);
            } else if (updatedCount > 0) {
                alert(`Đã cập nhật phiên bản mới cho ${updatedCount} tài liệu.`);
            } else {
                alert(`Đã tải lên ${newCount} tài liệu thành công.`);
            }
        }
    };

    // Filter docs by Selected Project AND Folder

    // Filter docs by Selected Project, Folder, Search, and Type
    const currentDocs = useMemo(() => {
        return mockDocuments.filter(doc => {
            const matchesProject = doc.ProjectID === selectedProject || doc.ReferenceID === selectedProject;

            // Context Filter (Folder)
            const matchesFolder =
                (selectedFolder === 'F1' && doc.Category === DocCategory.Legal) ||
                (selectedFolder === 'F2' && doc.Category === DocCategory.BIM) ||
                (selectedFolder === 'F4' && doc.Category === DocCategory.Quality) ||
                (selectedFolder === 'F1');

            // Search Filter
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch = !searchQuery || doc.DocName.toLowerCase().includes(searchLower);

            // Type Filter
            let matchesType = true;
            const ext = doc.DocName.split('.').pop()?.toLowerCase();
            if (filterType === 'pdf') matchesType = ext === 'pdf';
            if (filterType === 'office') matchesType = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext || '');
            if (filterType === 'image') matchesType = ['jpg', 'jpeg', 'png'].includes(ext || '');
            if (filterType === 'bim') matchesType = ['ifc', 'rvt', 'dwg'].includes(ext || '');

            return matchesProject && matchesFolder && matchesSearch && matchesType;
        });
    }, [selectedProject, selectedFolder, searchQuery, filterType]);

    const bimFile = {
        DocID: 9999,
        DocName: "Mo_hinh_BIM_Toa_nha_CT1.ifc",
        UploadDate: "2025-02-28",
        IsDigitized: true,
        Size: "145 MB",
        Version: "v2.1"
    };

    // Merge uploaded docs with mock docs (mock docs are static, uploaded ones take precedence visually if we fully implemented merging logic, but here we just list uploaded ones first)
    // For the sake of the demo, we only apply versioning to "uploaded" docs state.
    // Combine uploaded docs (client-side only for demo)
    const folderUploads = selectedFolder ? uploadedDocs[`${selectedProject}-${selectedFolder}`] || [] : [];

    // Combine but don't duplicate if we want to simulate full persistence (simplified here: Local uploads top, mocks bottom)
    const allDocs = [
        ...folderUploads,
        ...(selectedFolder === 'F2' ? [bimFile, ...currentDocs] : currentDocs)
    ];

    const handleSignClick = (file: any) => {
        setSelectedFile(file);
        setIsSignModalOpen(true);
        setSignStep(0);
    };

    const handleSimulateSign = async () => {
        setSignStep(1);
        setTimeout(() => setSignStep(2), 1500);
    };

    const handlePinSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSignStep(3);
        setTimeout(() => {
            setIsSignModalOpen(false);
            setSignStep(0);
            alert("Ký số văn bản thành công!");
        }, 1500);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] animate-in fade-in duration-300">
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                onChange={handleFileChange}
                accept=".pdf,.docx,.doc,.xlsx,.xls,.ifc,.png,.jpg,.jpeg"
            />

            {/* --- PREMIUM HEADER SECTION --- */}
            <div className="flex flex-col gap-6 mb-8">
                {/* TOP ROW: Title & Upload */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-gray-800 tracking-tight uppercase flex items-center gap-3">
                            <HardDrive className="w-8 h-8 text-blue-600" />
                            Kho lưu trữ số hóa hồ sơ
                        </h2>
                        <p className="text-sm text-gray-500 mt-1 font-medium ml-11">Quản lý hồ sơ dự án, thiết kế và văn bản pháp lý theo chuẩn lưu trữ Quốc gia</p>
                    </div>
                    <button
                        onClick={handleUploadClick}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest hover:shadow-xl hover:shadow-blue-200 transition-all transform hover:-translate-y-1"
                    >
                        <Upload className="w-5 h-5" /> Tải lên tài liệu
                    </button>
                </div>

                {/* MIDDLE ROW: Project Context & Search */}
                <div className="flex items-stretch gap-4">
                    {/* Project Selector Card */}
                    <div className="w-[450px] bg-white p-1 rounded-2xl shadow-sm border border-gray-200 flex flex-col">
                        <div className="flex items-center gap-3 px-4 py-3 h-full">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                                <Box className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Dự án đang làm việc</p>
                                <select
                                    value={selectedProject}
                                    onChange={(e) => setSelectedProject(e.target.value)}
                                    className="w-full text-sm font-bold text-gray-800 outline-none bg-transparent cursor-pointer hover:text-blue-600 transition-colors truncate"
                                >
                                    {mockProjects.map(p => (
                                        <option key={p.ProjectID} value={p.ProjectID}>{p.ProjectName}</option>
                                    ))}
                                </select>
                            </div>
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        </div>
                    </div>

                    {/* Smart Search Bar */}
                    <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 flex items-center px-4 transition-all focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400">
                        <Search className="w-5 h-5 text-gray-400 mr-3" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm tài liệu theo tên, mã số hoặc nội dung..."
                            className="flex-1 h-full outline-none text-sm font-medium text-gray-700 placeholder-gray-400 bg-transparent"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery("")} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* BOTTOM ROW: Quick Filters */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    <span className="text-xs font-bold text-gray-400 uppercase mr-2">Bộ lọc nhanh:</span>
                    <FilterChip label="Tất cả" active={filterType === 'all'} onClick={() => setFilterType('all')} />
                    <FilterChip label="Văn bản PDF" active={filterType === 'pdf'} onClick={() => setFilterType('pdf')} icon={<FileText className="w-3 h-3" />} />
                    <FilterChip label="Hồ sơ Office" active={filterType === 'office'} onClick={() => setFilterType('office')} icon={<FileIcon className="w-3 h-3" />} />
                    <FilterChip label="Bản vẽ & BIM" active={filterType === 'bim'} onClick={() => setFilterType('bim')} icon={<Box className="w-3 h-3" />} />
                    <FilterChip label="Hình ảnh" active={filterType === 'image'} onClick={() => setFilterType('image')} icon={<ImageIcon className="w-3 h-3" />} />
                </div>
            </div>

            <div className="flex flex-1 gap-6 overflow-hidden">
                <div className="w-80 bg-white rounded-3xl shadow-sm border border-gray-100 p-5 flex flex-col overflow-y-auto">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 px-2">Cấu trúc thư mục</h3>
                    <div className="space-y-2">
                        {folders.map(folder => (
                            <div
                                key={folder.id}
                                onClick={() => setSelectedFolder(folder.id)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-all ${selectedFolder === folder.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                <Folder className={`w-4 h-4 ${selectedFolder === folder.id ? 'fill-white/30' : ''}`} />
                                <span className="text-xs font-bold truncate">{folder.name}</span>
                                {(uploadedDocs[folder.id]?.length > 0) && (
                                    <span className="ml-auto bg-emerald-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black">+{uploadedDocs[folder.id].length}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                    <div className="p-5 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                        <h3 className="font-black text-gray-800 text-sm flex items-center gap-2 uppercase tracking-widest">
                            <Folder className="w-4 h-4 text-blue-500" /> {folders.find(f => f.id === selectedFolder)?.name}
                        </h3>
                        <span className="bg-white text-gray-400 text-[10px] px-3 py-1 rounded-xl font-black border border-gray-100">{allDocs.length} TÀI LIỆU</span>
                    </div>

                    <div className="flex-1 overflow-y-auto relative">
                        {allDocs.length === 0 ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in-95 duration-300">
                                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                                    <Folder className="w-10 h-10 text-gray-300" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 mb-2">Chưa có tài liệu nào</h3>
                                <p className="text-gray-400 text-sm text-center max-w-xs mb-6">Không tìm thấy tài liệu phù hợp với bộ lọc hoặc thư mục hiện tại.</p>
                                <button
                                    onClick={handleUploadClick}
                                    className="px-6 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-blue-100 transition-colors"
                                >
                                    Tải lên ngay
                                </button>
                            </div>
                        ) : (
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white text-[10px] uppercase font-black text-gray-400 sticky top-0 z-20 border-b border-gray-100 tracking-[0.1em] shadow-sm">
                                    <tr>
                                        <th className="px-6 py-5">Tên tài liệu</th>
                                        <th className="px-6 py-5 w-32 text-center">Phiên bản</th>
                                        <th className="px-6 py-5 w-48">Ngày cập nhật</th>
                                        <th className="px-6 py-5 text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {allDocs.map((doc, idx) => (
                                        <tr key={idx} className="hover:bg-blue-50/40 transition-all group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-3 rounded-2xl shadow-sm ${doc.DocName.toLowerCase().endsWith('.ifc') ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'} ${doc.isLocal ? 'ring-2 ring-emerald-400/30' : ''}`}>
                                                        {doc.DocName.toLowerCase().endsWith('.ifc') ? <Box className="w-6 h-6" /> : (doc.DocName.toLowerCase().endsWith('.png') || doc.DocName.toLowerCase().endsWith('.jpg')) ? <ImageIcon className="w-6 h-6" /> : <FileIcon className="w-6 h-6" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-gray-800 text-sm tracking-tight flex items-center gap-2 mb-1">
                                                            {doc.DocName}
                                                            {doc.isLocal && <span className="text-[9px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">Mới</span>}
                                                        </p>
                                                        <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-2">
                                                            <span>{doc.Size || '2.5 MB'}</span>
                                                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                            <span>{doc.UploadDate}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-[11px] font-black text-gray-600 bg-gray-100 px-3 py-1 rounded-full border border-gray-200 font-mono inline-block shadow-sm">
                                                    {doc.Version || 'v1.0'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-bold text-gray-500">{doc.UploadDate}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                                    <button
                                                        onClick={() => setPreviewFile(doc)}
                                                        className="p-2.5 bg-white text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white shadow-sm border border-gray-100 transition-all"
                                                        title="Xem nội dung"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleSignClick(doc)} className="p-2.5 bg-white text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white shadow-sm border border-gray-100 transition-all" title="Ký số"><PenTool className="w-4 h-4" /></button>
                                                    <button onClick={() => setHistoryFile(doc)} className="p-2.5 bg-white text-orange-600 rounded-xl hover:bg-orange-600 hover:text-white shadow-sm border border-gray-100 transition-all" title="Lịch sử"><History className="w-4 h-4" /></button>
                                                    <button className="p-2.5 bg-white text-gray-400 rounded-xl hover:bg-gray-600 hover:text-white shadow-sm border border-gray-100 transition-all"><Download className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {previewFile && <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}
            {historyFile && <VersionHistoryModal file={historyFile} onClose={() => setHistoryFile(null)} />}

            {isSignModalOpen && (
                <div className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden p-8 animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-black text-gray-800 flex items-center gap-3 tracking-tight">
                                <ShieldCheck className="w-6 h-6 text-emerald-600" /> Ký số văn bản (CA)
                            </h3>
                            <button onClick={() => setIsSignModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors"><X className="w-6 h-6" /></button>
                        </div>
                        <div className="space-y-6">
                            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 flex items-center gap-4">
                                <FileIcon className="w-10 h-10 text-blue-500" />
                                <div className="flex-1 overflow-hidden">
                                    <p className="font-black text-gray-800 truncate text-sm">{selectedFile?.DocName}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">HỒ SƠ DỰ ÁN • {selectedFile?.Size || '2.5 MB'}</p>
                                </div>
                            </div>
                            {signStep === 0 && (
                                <div className="text-center py-4">
                                    <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm"><HardDrive className="w-10 h-10 text-blue-600" /></div>
                                    <p className="text-gray-600 font-bold text-sm mb-8 px-4 leading-relaxed">Vui lòng kiểm tra USB Token của bạn để tiến hành xác thực chữ ký số.</p>
                                    <button onClick={handleSimulateSign} className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 uppercase tracking-widest text-xs transition-all">Đã cắm USB Token</button>
                                </div>
                            )}
                            {signStep === 1 && (
                                <div className="text-center py-10">
                                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-6" />
                                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Đang đọc thông tin chứng thư số...</p>
                                </div>
                            )}
                            {signStep === 2 && (
                                <form onSubmit={handlePinSubmit} className="space-y-5">
                                    <div className="text-left">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Chứng thư số</label>
                                        <select className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                                            <option>NGUYEN VAN A - VNPT CA (Hạn: 2026)</option>
                                        </select>
                                    </div>
                                    <div className="text-left">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Mã PIN</label>
                                        <input type="password" autoFocus className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-center text-lg font-black tracking-[1em] outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="******" />
                                    </div>
                                    <button type="submit" className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 shadow-xl shadow-emerald-100 uppercase tracking-widest text-xs transition-all">Xác nhận Ký số</button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentManager;