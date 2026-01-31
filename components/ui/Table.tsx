import React from 'react';

// ========================================
// TABLE COMPONENT - Design System v2
// ========================================

interface Column<T> {
    key: keyof T | string;
    header: React.ReactNode;
    render?: (value: any, row: T, index: number) => React.ReactNode;
    sortable?: boolean;
    width?: string;
    align?: 'left' | 'center' | 'right';
    className?: string;
}

interface TableProps<T> {
    columns: Column<T>[];
    data: T[];
    loading?: boolean;
    loadingRows?: number;
    emptyState?: React.ReactNode;
    onRowClick?: (row: T, index: number) => void;
    rowClassName?: (row: T, index: number) => string;
    striped?: boolean;
    hoverable?: boolean;
    compact?: boolean;
    stickyHeader?: boolean;
    className?: string;
}

export function Table<T extends Record<string, any>>({
    columns,
    data,
    loading = false,
    loadingRows = 5,
    emptyState,
    onRowClick,
    rowClassName,
    striped = false,
    hoverable = true,
    compact = false,
    stickyHeader = false,
    className = '',
}: TableProps<T>) {
    const getCellValue = (row: T, key: keyof T | string): any => {
        if (typeof key === 'string' && key.includes('.')) {
            return key.split('.').reduce((obj, k) => obj?.[k], row as any);
        }
        return row[key as keyof T];
    };

    const alignClass = {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
    };

    const cellPadding = compact ? 'px-3 py-2' : 'px-4 py-3';

    return (
        <div className={`overflow-x-auto rounded-xl border border-gray-200 ${className}`}>
            <table className="w-full text-sm">
                {/* Header */}
                <thead className={`bg-gray-50 ${stickyHeader ? 'sticky top-0 z-10' : ''}`}>
                    <tr>
                        {columns.map((column, idx) => (
                            <th
                                key={String(column.key) + idx}
                                style={{ width: column.width }}
                                className={`
                                    ${cellPadding}
                                    ${alignClass[column.align || 'left']}
                                    text-xs font-bold text-gray-600 uppercase tracking-wider
                                    border-b border-gray-200
                                    ${column.className || ''}
                                `}
                            >
                                <div className="flex items-center gap-1">
                                    {column.header}
                                    {column.sortable && (
                                        <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                        </svg>
                                    )}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>

                {/* Body */}
                <tbody className="bg-white divide-y divide-gray-100">
                    {loading ? (
                        // Loading skeleton rows
                        Array.from({ length: loadingRows }).map((_, rowIdx) => (
                            <tr key={`skeleton-${rowIdx}`}>
                                {columns.map((column, colIdx) => (
                                    <td
                                        key={`skeleton-${rowIdx}-${colIdx}`}
                                        className={cellPadding}
                                    >
                                        <div className="h-4 bg-gray-200 rounded animate-pulse" />
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : data.length === 0 ? (
                        // Empty state
                        <tr>
                            <td colSpan={columns.length} className="px-4 py-12 text-center">
                                {emptyState || (
                                    <div className="text-gray-500">
                                        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                        </svg>
                                        <p className="text-sm font-medium">Không có dữ liệu</p>
                                    </div>
                                )}
                            </td>
                        </tr>
                    ) : (
                        // Data rows
                        data.map((row, rowIdx) => (
                            <tr
                                key={rowIdx}
                                onClick={() => onRowClick?.(row, rowIdx)}
                                className={`
                                    ${striped && rowIdx % 2 === 1 ? 'bg-gray-50/50' : ''}
                                    ${hoverable ? 'hover:bg-gray-50 transition-colors' : ''}
                                    ${onRowClick ? 'cursor-pointer' : ''}
                                    ${rowClassName?.(row, rowIdx) || ''}
                                `}
                            >
                                {columns.map((column, colIdx) => {
                                    const value = getCellValue(row, column.key);
                                    return (
                                        <td
                                            key={`${rowIdx}-${colIdx}`}
                                            className={`
                                                ${cellPadding}
                                                ${alignClass[column.align || 'left']}
                                                text-gray-700
                                                ${column.className || ''}
                                            `}
                                        >
                                            {column.render
                                                ? column.render(value, row, rowIdx)
                                                : value ?? '-'}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

// ========================================
// TABLE PAGINATION
// ========================================

interface TablePaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    pageSizeOptions?: number[];
    className?: string;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [10, 20, 50, 100],
    className = '',
}) => {
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    return (
        <div className={`flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 ${className}`}>
            {/* Info */}
            <div className="text-sm text-gray-600">
                Hiển thị <span className="font-medium">{startItem}</span> - <span className="font-medium">{endItem}</span> trong <span className="font-medium">{totalItems}</span> kết quả
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
                {/* Page Size Selector */}
                {onPageSizeChange && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Hiển thị</span>
                        <select
                            value={pageSize}
                            onChange={(e) => onPageSizeChange(Number(e.target.value))}
                            className="px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            {pageSizeOptions.map((size) => (
                                <option key={size} value={size}>
                                    {size}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Page Navigation */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onPageChange(1)}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="First page"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Previous page"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    <span className="px-3 py-1 text-sm font-medium">
                        {currentPage} / {totalPages}
                    </span>

                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Next page"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                    <button
                        onClick={() => onPageChange(totalPages)}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Last page"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Table;
