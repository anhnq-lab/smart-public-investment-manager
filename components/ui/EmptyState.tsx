import React from 'react';
import { Inbox, Search, AlertCircle, FolderOpen, Plus } from 'lucide-react';

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    variant?: 'default' | 'search' | 'error' | 'folder';
    className?: string;
}

const iconMap = {
    default: <Inbox className="w-12 h-12" />,
    search: <Search className="w-12 h-12" />,
    error: <AlertCircle className="w-12 h-12" />,
    folder: <FolderOpen className="w-12 h-12" />,
};

/**
 * EmptyState — Hiển thị khi không có dữ liệu
 * Sử dụng cho tất cả các trang list, search, folder...
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    title,
    description,
    actionLabel,
    onAction,
    variant = 'default',
    className = '',
}) => {
    const displayIcon = icon || iconMap[variant];

    return (
        <div className={`flex flex-col items-center justify-center py-16 px-8 ${className}`}>
            {/* Icon */}
            <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-6 text-gray-400 dark:text-slate-500">
                {displayIcon}
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-gray-700 dark:text-slate-300 mb-2 text-center">
                {title}
            </h3>

            {/* Description */}
            {description && (
                <p className="text-sm text-gray-500 dark:text-slate-400 text-center max-w-md mb-6">
                    {description}
                </p>
            )}

            {/* Action Button */}
            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    {actionLabel}
                </button>
            )}
        </div>
    );
};

export default EmptyState;
