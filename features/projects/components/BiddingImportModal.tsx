import React, { useState, useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    X, Upload, FileSpreadsheet, ChevronRight, ChevronLeft,
    CheckCircle2, AlertTriangle, Loader2, FileWarning, Trash2
} from 'lucide-react';
import { BiddingPackage } from '../../../types';
import { parseBiddingPackagesFromExcel, ImportResult } from '../../../utils/biddingExcelIO';
import { supabase } from '../../../lib/supabase';
import { biddingPackageToDb } from '../../../lib/dbMappers';
import { formatCurrency } from '../../../utils/format';

// ========================================
// BIDDING IMPORT MODAL — 3-step flow
// ========================================

interface BiddingImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
}

type Step = 'upload' | 'preview' | 'done';

export const BiddingImportModal: React.FC<BiddingImportModalProps> = ({
    isOpen,
    onClose,
    projectId,
}) => {
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [step, setStep] = useState<Step>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [isParsing, setIsParsing] = useState(false);
    const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

    // Reset state on close
    const handleClose = () => {
        setStep('upload');
        setFile(null);
        setImportResult(null);
        setIsParsing(false);
        setSelectedRows(new Set());
        onClose();
    };

    // Step 1: File selection
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setFile(f);
        await parseFile(f);
    };

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        const f = e.dataTransfer.files[0];
        if (!f) return;
        if (!f.name.match(/\.(xlsx|xls)$/i)) {
            alert('Chỉ hỗ trợ file .xlsx hoặc .xls');
            return;
        }
        setFile(f);
        await parseFile(f);
    }, [projectId]);

    const parseFile = async (f: File) => {
        setIsParsing(true);
        try {
            const result = await parseBiddingPackagesFromExcel(f, projectId);
            setImportResult(result);
            // Select all valid rows by default
            setSelectedRows(new Set(result.packages.map((_, i) => i)));
            if (result.errors.length === 0 && result.packages.length > 0) {
                setStep('preview');
            }
        } finally {
            setIsParsing(false);
        }
    };

    // Step 3: Insert into DB
    const insertMutation = useMutation({
        mutationFn: async (packages: Partial<BiddingPackage>[]) => {
            const dbRows = packages.map(bp => biddingPackageToDb(bp));
            const { error } = await supabase
                .from('bidding_packages')
                .insert(dbRows as any);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-packages', projectId] });
            setStep('done');
        },
    });

    const handleImport = () => {
        if (!importResult) return;
        const selectedPackages = importResult.packages.filter((_, i) => selectedRows.has(i));
        insertMutation.mutate(selectedPackages);
    };

    const toggleRow = (idx: number) => {
        setSelectedRows(prev => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx);
            else next.add(idx);
            return next;
        });
    };

    const toggleAll = () => {
        if (!importResult) return;
        if (selectedRows.size === importResult.packages.length) {
            setSelectedRows(new Set());
        } else {
            setSelectedRows(new Set(importResult.packages.map((_, i) => i)));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden animate-scale-in">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                            <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800 dark:text-slate-100">
                                Import gói thầu từ Excel
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-slate-400">
                                {step === 'upload' && 'Bước 1/3 — Chọn file'}
                                {step === 'preview' && 'Bước 2/3 — Xem trước dữ liệu'}
                                {step === 'done' && 'Hoàn tất'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Step Progress */}
                <div className="flex items-center gap-2 px-6 py-3 bg-gray-50 dark:bg-slate-750 border-b border-gray-200 dark:border-slate-700">
                    {['upload', 'preview', 'done'].map((s, i) => (
                        <React.Fragment key={s}>
                            {i > 0 && <ChevronRight className="w-4 h-4 text-gray-300 dark:text-slate-600" />}
                            <span className={`text-xs font-medium px-3 py-1 rounded-full ${step === s
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                : (['upload', 'preview', 'done'].indexOf(step) > i
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                    : 'bg-gray-100 text-gray-400 dark:bg-slate-700 dark:text-slate-500')
                                }`}>
                                {s === 'upload' && '📁 Chọn file'}
                                {s === 'preview' && '👁️ Xem trước'}
                                {s === 'done' && '✅ Hoàn tất'}
                            </span>
                        </React.Fragment>
                    ))}
                </div>

                {/* Content */}
                <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 180px)' }}>

                    {/* Step 1: Upload */}
                    {step === 'upload' && (
                        <div className="space-y-4">
                            {/* Drop zone */}
                            <div
                                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-12 text-center hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-all cursor-pointer group"
                            >
                                {isParsing ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                                        <p className="text-sm text-gray-600 dark:text-slate-300">Đang đọc file...</p>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-3 group-hover:text-blue-400 transition-colors" />
                                        <p className="text-gray-600 dark:text-slate-300 font-medium">
                                            Kéo thả file Excel vào đây
                                        </p>
                                        <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">
                                            hoặc click để chọn file (.xlsx, .xls)
                                        </p>
                                        {file && (
                                            <p className="mt-3 text-sm text-blue-600 dark:text-blue-400 font-medium">
                                                📄 {file.name}
                                            </p>
                                        )}
                                    </>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </div>

                            {/* Errors */}
                            {importResult && importResult.errors.length > 0 && (
                                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <FileWarning className="w-4 h-4 text-red-600" />
                                        <span className="text-sm font-bold text-red-700 dark:text-red-300">Lỗi đọc file</span>
                                    </div>
                                    {importResult.errors.map((err, i) => (
                                        <p key={i} className="text-sm text-red-600 dark:text-red-400 ml-6">{err}</p>
                                    ))}
                                </div>
                            )}

                            {/* Format hint */}
                            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                <h4 className="text-sm font-bold text-blue-800 dark:text-blue-200 mb-2">💡 Định dạng file</h4>
                                <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1 ml-4 list-disc">
                                    <li>Dòng đầu tiên là tiêu đề cột (header)</li>
                                    <li>Các cột bắt buộc: <strong>Tên gói thầu</strong>, <strong>Giá gói thầu</strong></li>
                                    <li>Cột "Hình thức LCNT" hỗ trợ: Đấu thầu rộng rãi, Chỉ định thầu, Chỉ định thầu rút gọn, Chào hàng cạnh tranh...</li>
                                    <li>Giá gói thầu có thể là số hoặc text có dấu phân cách nghìn</li>
                                    <li>Bạn có thể export trước rồi sửa file để dùng làm template</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Preview */}
                    {step === 'preview' && importResult && (
                        <div className="space-y-4">
                            {/* Summary */}
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-bold text-gray-700 dark:text-slate-200">
                                    📊 Tìm thấy {importResult.packages.length} gói thầu
                                </span>
                                <span className="text-sm text-gray-500 dark:text-slate-400">
                                    Đã chọn: {selectedRows.size}/{importResult.packages.length}
                                </span>
                                {importResult.warnings.length > 0 && (
                                    <span className="text-xs text-amber-600 dark:text-amber-400">
                                        ⚠️ {importResult.warnings.length} cảnh báo
                                    </span>
                                )}
                            </div>

                            {/* Warnings */}
                            {importResult.warnings.length > 0 && (
                                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                                    {importResult.warnings.map((w, i) => (
                                        <p key={i} className="text-xs text-amber-700 dark:text-amber-300">{w}</p>
                                    ))}
                                </div>
                            )}

                            {/* Preview Table */}
                            <div className="overflow-x-auto border border-gray-200 dark:border-slate-700 rounded-lg">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="bg-gray-100 dark:bg-slate-700">
                                            <th className="px-2 py-2 text-center w-8">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded"
                                                    checked={selectedRows.size === importResult.packages.length}
                                                    onChange={toggleAll}
                                                />
                                            </th>
                                            <th className="px-2 py-2 text-center w-10 font-bold text-slate-700 dark:text-slate-200">STT</th>
                                            <th className="px-2 py-2 text-left font-bold text-slate-700 dark:text-slate-200 min-w-[200px]">Tên gói thầu</th>
                                            <th className="px-2 py-2 text-left font-bold text-slate-700 dark:text-slate-200 min-w-[150px]">Tóm tắt công việc</th>
                                            <th className="px-2 py-2 text-center font-bold text-slate-700 dark:text-slate-200">Lĩnh vực</th>
                                            <th className="px-2 py-2 text-right font-bold text-slate-700 dark:text-slate-200 min-w-[120px]">Giá gói thầu</th>
                                            <th className="px-2 py-2 text-center font-bold text-slate-700 dark:text-slate-200">Hình thức</th>
                                            <th className="px-2 py-2 text-center font-bold text-slate-700 dark:text-slate-200">Phương thức</th>
                                            <th className="px-2 py-2 text-center font-bold text-slate-700 dark:text-slate-200">Loại HĐ</th>
                                            <th className="px-2 py-2 text-center font-bold text-slate-700 dark:text-slate-200">TG thực hiện</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {importResult.packages.map((pkg, idx) => (
                                            <tr
                                                key={idx}
                                                className={`border-t border-gray-200 dark:border-slate-700 ${selectedRows.has(idx)
                                                    ? 'bg-white dark:bg-slate-800'
                                                    : 'bg-gray-50 dark:bg-slate-850 opacity-50'
                                                    } hover:bg-blue-50 dark:hover:bg-slate-750 transition-colors`}
                                            >
                                                <td className="px-2 py-2 text-center">
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 rounded"
                                                        checked={selectedRows.has(idx)}
                                                        onChange={() => toggleRow(idx)}
                                                    />
                                                </td>
                                                <td className="px-2 py-2 text-center font-medium text-slate-600 dark:text-slate-300">
                                                    {pkg.PackageNumber || idx + 1}
                                                </td>
                                                <td className="px-2 py-2 text-slate-800 dark:text-slate-200 font-medium">
                                                    {pkg.PackageName}
                                                </td>
                                                <td className="px-2 py-2 text-slate-600 dark:text-slate-400">
                                                    {pkg.Description || '-'}
                                                </td>
                                                <td className="px-2 py-2 text-center text-slate-600 dark:text-slate-400">
                                                    {pkg.Field === 'Consultancy' ? 'Tư vấn' :
                                                        pkg.Field === 'Construction' ? 'Xây lắp' :
                                                            pkg.Field === 'Goods' ? 'Hàng hóa' : pkg.Field || '-'}
                                                </td>
                                                <td className="px-2 py-2 text-right font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                                                    {formatCurrency(pkg.Price)}
                                                </td>
                                                <td className="px-2 py-2 text-center text-slate-600 dark:text-slate-400">
                                                    {pkg.SelectionMethod === 'Appointed' ? 'CĐT' :
                                                        pkg.SelectionMethod === 'OpenBidding' ? 'ĐTRR' :
                                                            pkg.SelectionMethod || '-'}
                                                </td>
                                                <td className="px-2 py-2 text-center text-slate-600 dark:text-slate-400">
                                                    {pkg.SelectionProcedure === 'Reduced' ? 'Rút gọn' :
                                                        pkg.SelectionProcedure === 'OneStageOneEnvelope' ? '1GĐ1THS' :
                                                            pkg.SelectionProcedure === 'OneStageTwoEnvelope' ? '1GĐ2THS' :
                                                                pkg.SelectionProcedure || '-'}
                                                </td>
                                                <td className="px-2 py-2 text-center text-slate-600 dark:text-slate-400">
                                                    {pkg.ContractType === 'LumpSum' ? 'Trọn gói' : pkg.ContractType || '-'}
                                                </td>
                                                <td className="px-2 py-2 text-center text-slate-600 dark:text-slate-400">
                                                    {pkg.Duration || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-gray-50 dark:bg-slate-750 font-bold border-t border-gray-200 dark:border-slate-600">
                                            <td colSpan={5} className="px-2 py-2 text-right text-slate-700 dark:text-slate-200">
                                                Tổng ({selectedRows.size} gói đã chọn):
                                            </td>
                                            <td className="px-2 py-2 text-right text-slate-900 dark:text-slate-100 tabular-nums">
                                                {formatCurrency(
                                                    importResult.packages
                                                        .filter((_, i) => selectedRows.has(i))
                                                        .reduce((sum, p) => sum + (p.Price || 0), 0)
                                                )}
                                            </td>
                                            <td colSpan={4}></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Done */}
                    {step === 'done' && (
                        <div className="text-center py-12">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-slate-100">
                                Import thành công!
                            </h3>
                            <p className="text-gray-500 dark:text-slate-400 mt-2">
                                Đã thêm {selectedRows.size} gói thầu vào dự án
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-750">
                    <div>
                        {file && step !== 'done' && (
                            <span className="text-xs text-gray-500 dark:text-slate-400">
                                📄 {file.name} ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {step === 'upload' && (
                            <button
                                onClick={handleClose}
                                className="px-4 py-2 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                Hủy
                            </button>
                        )}

                        {step === 'preview' && (
                            <>
                                <button
                                    onClick={() => {
                                        setStep('upload');
                                        setFile(null);
                                        setImportResult(null);
                                        if (fileInputRef.current) fileInputRef.current.value = '';
                                    }}
                                    className="flex items-center gap-1 px-4 py-2 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    Chọn file khác
                                </button>
                                <button
                                    onClick={handleImport}
                                    disabled={selectedRows.size === 0 || insertMutation.isPending}
                                    className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                                >
                                    {insertMutation.isPending ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Upload className="w-4 h-4" />
                                    )}
                                    Import {selectedRows.size} gói thầu
                                </button>
                            </>
                        )}

                        {step === 'done' && (
                            <button
                                onClick={handleClose}
                                className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                Đóng
                            </button>
                        )}

                        {insertMutation.isError && (
                            <span className="text-xs text-red-600 dark:text-red-400">
                                ❌ {(insertMutation.error as Error)?.message || 'Lỗi khi import'}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BiddingImportModal;
