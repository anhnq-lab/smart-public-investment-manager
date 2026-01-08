import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
    fullScreen?: boolean;
}

/**
 * Reusable loading spinner component
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'md',
    text,
    fullScreen = false,
}) => {
    const sizeClasses = {
        sm: 'w-5 h-5',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
    };

    const content = (
        <div className="flex flex-col items-center justify-center gap-3">
            <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-500`} />
            {text && (
                <p className="text-sm text-gray-500 animate-pulse">{text}</p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
                {content}
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center p-8">
            {content}
        </div>
    );
};

/**
 * Skeleton loader for cards
 */
export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 1 }) => {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse"
                >
                    <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-xl" />
                        <div className="flex-1 space-y-3">
                            <div className="h-5 bg-gray-200 rounded w-3/4" />
                            <div className="h-4 bg-gray-200 rounded w-1/2" />
                        </div>
                    </div>
                    <div className="mt-4 space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-full" />
                        <div className="h-3 bg-gray-200 rounded w-4/5" />
                    </div>
                    <div className="mt-4 flex gap-2">
                        <div className="h-8 bg-gray-200 rounded-full w-20" />
                        <div className="h-8 bg-gray-200 rounded-full w-16" />
                    </div>
                </div>
            ))}
        </>
    );
};

/**
 * Skeleton loader for table rows
 */
export const TableRowSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
    rows = 5,
    columns = 4,
}) => {
    return (
        <>
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <tr key={rowIndex} className="animate-pulse">
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <td key={colIndex} className="px-6 py-4">
                            <div className="h-4 bg-gray-200 rounded w-full" />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
};

export default LoadingSpinner;
