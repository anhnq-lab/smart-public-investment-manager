// Reusable Action Dropdown Menu — 3-dot dropdown for document/entity actions
import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Eye, Download, History, Trash2, Edit2, Copy } from 'lucide-react';

export interface ActionMenuItem {
    label: string;
    icon: React.ElementType;
    onClick: () => void;
    variant?: 'default' | 'danger';
    dividerBefore?: boolean;
}

interface ActionMenuProps {
    items: ActionMenuItem[];
    className?: string;
}

/**
 * Reusable 3-dot action menu dropdown.
 * Used in document lists, task lists, contract lists, etc.
 */
export const ActionMenu: React.FC<ActionMenuProps> = ({ items, className = '' }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        if (open) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    return (
        <div className={`relative ${className}`} ref={ref}>
            <button
                onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
            >
                <MoreVertical className="w-4 h-4" />
            </button>
            {open && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-slate-600 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {items.map((item, idx) => (
                        <React.Fragment key={idx}>
                            {item.dividerBefore && (
                                <div className="border-t border-gray-200 dark:border-slate-700 my-1" />
                            )}
                            <button
                                onClick={() => { item.onClick(); setOpen(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${item.variant === 'danger'
                                        ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                                        : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                                    }`}
                            >
                                <item.icon className="w-4 h-4" />
                                {item.label}
                            </button>
                        </React.Fragment>
                    ))}
                </div>
            )}
        </div>
    );
};

// Convenience — pre-built document action menu
interface DocActionMenuProps {
    onView: () => void;
    onDownload: () => void;
    onHistory: () => void;
}

export const DocActionMenu: React.FC<DocActionMenuProps> = ({ onView, onDownload, onHistory }) => (
    <ActionMenu items={[
        { label: 'Xem tài liệu', icon: Eye, onClick: onView },
        { label: 'Tải xuống', icon: Download, onClick: onDownload },
        { label: 'Lịch sử phiên bản', icon: History, onClick: onHistory, dividerBefore: true },
    ]} />
);

export { Eye, Download, History, Trash2, Edit2, Copy };
