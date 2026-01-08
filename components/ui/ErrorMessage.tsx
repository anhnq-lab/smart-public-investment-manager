import React from 'react';
import { AlertCircle, RefreshCw, WifiOff, ServerCrash, FileWarning } from 'lucide-react';

interface ErrorMessageProps {
    error: Error | string | null;
    onRetry?: () => void;
    variant?: 'inline' | 'card' | 'fullPage';
    title?: string;
}

/**
 * Determine error type and get appropriate icon/message
 */
const getErrorDetails = (error: Error | string | null): {
    icon: React.ReactNode;
    title: string;
    message: string;
} => {
    const errorMessage = typeof error === 'string' ? error : error?.message || 'Đã xảy ra lỗi';

    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        return {
            icon: <WifiOff className="w-8 h-8 text-orange-500" />,
            title: 'Lỗi kết nối',
            message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.',
        };
    }

    if (errorMessage.includes('500') || errorMessage.includes('server')) {
        return {
            icon: <ServerCrash className="w-8 h-8 text-red-500" />,
            title: 'Lỗi máy chủ',
            message: 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.',
        };
    }

    if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        return {
            icon: <FileWarning className="w-8 h-8 text-yellow-500" />,
            title: 'Không tìm thấy',
            message: 'Dữ liệu yêu cầu không tồn tại hoặc đã bị xóa.',
        };
    }

    return {
        icon: <AlertCircle className="w-8 h-8 text-red-500" />,
        title: 'Đã xảy ra lỗi',
        message: errorMessage,
    };
};

/**
 * Reusable error message component
 */
export const ErrorMessage: React.FC<ErrorMessageProps> = ({
    error,
    onRetry,
    variant = 'card',
    title: customTitle,
}) => {
    if (!error) return null;

    const { icon, title, message } = getErrorDetails(error);
    const displayTitle = customTitle || title;

    if (variant === 'inline') {
        return (
            <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{message}</span>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="text-red-700 hover:underline font-medium"
                    >
                        Thử lại
                    </button>
                )}
            </div>
        );
    }

    if (variant === 'fullPage') {
        return (
            <div className="min-h-[60vh] flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        {icon}
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-3">{displayTitle}</h2>
                    <p className="text-gray-500 mb-6">{message}</p>
                    {onRetry && (
                        <button
                            onClick={onRetry}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
                        >
                            <RefreshCw className="w-5 h-5" />
                            Thử lại
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Card variant (default)
    return (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    {icon}
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-red-800 mb-1">{displayTitle}</h3>
                    <p className="text-red-600 text-sm">{message}</p>
                    {onRetry && (
                        <button
                            onClick={onRetry}
                            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Thử lại
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

/**
 * Empty state component for when no data is available
 */
export const EmptyState: React.FC<{
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}> = ({ icon, title, description, action }) => {
    return (
        <div className="text-center py-12 px-4">
            {icon && (
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    {icon}
                </div>
            )}
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
            {description && (
                <p className="text-gray-500 text-sm max-w-md mx-auto mb-4">{description}</p>
            )}
            {action && (
                <button
                    onClick={action.onClick}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
};

export default ErrorMessage;
