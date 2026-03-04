// Shared file type icon utility
import { FileText, FileSpreadsheet, FileImage, File as FileIcon } from 'lucide-react';

export interface FileIconInfo {
    icon: typeof FileText;
    color: string;
    bg: string;
}

/**
 * Get icon, color, and background class based on file extension.
 * Reused across CDEPage, ProjectDocumentsTab, and document lists.
 */
export const getFileIcon = (fileName: string): FileIconInfo => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf') return { icon: FileText, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/30' };
    if (['doc', 'docx'].includes(ext)) return { icon: FileText, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30' };
    if (['xls', 'xlsx', 'csv'].includes(ext)) return { icon: FileSpreadsheet, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30' };
    if (['png', 'jpg', 'jpeg', 'gif'].includes(ext)) return { icon: FileImage, color: 'text-violet-500 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/30' };
    if (['dwg', 'dxf'].includes(ext)) return { icon: FileText, color: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/30' };
    if (['ifc', 'rvt', 'nwd'].includes(ext)) return { icon: FileText, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-900/30' };
    return { icon: FileIcon, color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-slate-700' };
};
