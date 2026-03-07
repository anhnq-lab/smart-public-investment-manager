import React from 'react';

// ========================================
// SKELETON COMPONENT - Design System v2
// ========================================

export type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'rounded';

export interface SkeletonProps {
    variant?: SkeletonVariant;
    width?: string | number;
    height?: string | number;
    className?: string;
    animation?: 'pulse' | 'shimmer' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
    variant = 'text',
    width,
    height,
    className = '',
    animation = 'shimmer',
}) => {
    const variantStyles: Record<SkeletonVariant, string> = {
        text: 'rounded h-4',
        circular: 'rounded-full',
        rectangular: 'rounded-none',
        rounded: 'rounded-xl',
    };

    const animationStyles = {
        pulse: 'animate-pulse bg-gray-200',
        shimmer: 'skeleton',
        none: 'bg-gray-200',
    };

    const style: React.CSSProperties = {
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
    };

    // For circular variant, use width for both dimensions
    if (variant === 'circular') {
        style.height = style.height || style.width;
        style.width = style.width || style.height;
    }

    return (
        <div
            className={`
                ${variantStyles[variant]}
                ${animationStyles[animation]}
                ${className}
            `.trim()}
            style={style}
            aria-hidden="true"
        />
    );
};

// ========================================
// SKELETON TEXT - Multiple lines
// ========================================

interface SkeletonTextProps {
    lines?: number;
    lastLineWidth?: string;
    spacing?: 'sm' | 'md' | 'lg';
    className?: string;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
    lines = 3,
    lastLineWidth = '75%',
    spacing = 'md',
    className = '',
}) => {
    const spacingStyles = {
        sm: 'space-y-1.5',
        md: 'space-y-2',
        lg: 'space-y-3',
    };

    return (
        <div className={`${spacingStyles[spacing]} ${className}`}>
            {Array.from({ length: lines }).map((_, index) => (
                <Skeleton
                    key={index}
                    variant="text"
                    width={index === lines - 1 ? lastLineWidth : '100%'}
                />
            ))}
        </div>
    );
};

// ========================================
// SKELETON CARD - Common card layout
// ========================================

interface SkeletonCardProps {
    className?: string;
    hasImage?: boolean;
    hasAvatar?: boolean;
    lines?: number;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
    className = '',
    hasImage = false,
    hasAvatar = true,
    lines = 2,
}) => {
    return (
        <div className={`bg-white rounded-2xl border border-gray-200 p-6 ${className}`}>
            {hasImage && (
                <Skeleton
                    variant="rounded"
                    height={160}
                    className="mb-4"
                />
            )}

            {hasAvatar && (
                <div className="flex items-center gap-3 mb-4">
                    <Skeleton variant="circular" width={40} height={40} />
                    <div className="flex-1">
                        <Skeleton variant="text" width="60%" className="mb-2" />
                        <Skeleton variant="text" width="40%" height={12} />
                    </div>
                </div>
            )}

            <SkeletonText lines={lines} />
        </div>
    );
};

// ========================================
// SKELETON TABLE - Table rows
// ========================================

interface SkeletonTableProps {
    columns?: number;
    rows?: number;
    className?: string;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({
    columns = 4,
    rows = 5,
    className = '',
}) => {
    return (
        <div className={`overflow-hidden rounded-xl border border-gray-200 ${className}`}>
            {/* Header */}
            <div className="bg-gray-50 px-4 py-3 flex gap-4 border-b border-gray-200">
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton key={`header-${i}`} variant="text" height={14} className="flex-1" />
                ))}
            </div>

            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIdx) => (
                <div
                    key={`row-${rowIdx}`}
                    className="px-4 py-3 flex gap-4 border-b border-gray-200 last:border-0"
                >
                    {Array.from({ length: columns }).map((_, colIdx) => (
                        <Skeleton
                            key={`cell-${rowIdx}-${colIdx}`}
                            variant="text"
                            className="flex-1"
                        />
                    ))}
                </div>
            ))}
        </div>
    );
};

// ========================================
// SKELETON STAT CARD
// ========================================

export const SkeletonStatCard: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <div className={`bg-white rounded-2xl border border-gray-200 p-6 h-36 ${className}`}>
            <div className="flex justify-between items-start mb-4">
                <Skeleton variant="rounded" width={44} height={44} />
                <Skeleton variant="rounded" width={60} height={24} />
            </div>
            <Skeleton variant="text" width="50%" height={32} className="mb-2" />
            <Skeleton variant="text" width="70%" height={12} />
        </div>
    );
};

// ========================================
// SKELETON AVATAR GROUP
// ========================================

interface SkeletonAvatarGroupProps {
    count?: number;
    size?: number;
    className?: string;
}

export const SkeletonAvatarGroup: React.FC<SkeletonAvatarGroupProps> = ({
    count = 4,
    size = 32,
    className = '',
}) => {
    return (
        <div className={`flex -space-x-2 ${className}`}>
            {Array.from({ length: count }).map((_, i) => (
                <Skeleton
                    key={i}
                    variant="circular"
                    width={size}
                    height={size}
                    className="border-2 border-white"
                />
            ))}
        </div>
    );
};

export default Skeleton;
