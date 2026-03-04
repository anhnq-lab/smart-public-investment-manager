/**
 * Format a number as Vietnamese currency with exact value.
 * Shows full number with thousand separators, e.g. "105.876.566"
 */
export const formatCurrency = (amount: number | undefined | null): string => {
    if (amount === undefined || amount === null) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
        maximumFractionDigits: 0
    }).format(amount);
};

/** Format currency with abbreviated units (Tỷ, Tr) — used in dashboards & cards */
export const formatShortCurrency = (amount: number): string => {
    if (amount >= 1_000_000_000) {
        return (amount / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + ' Tỷ';
    }
    if (amount >= 1_000_000) {
        return (amount / 1_000_000).toFixed(0) + ' Tr';
    }
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

/** Alias: full VND format */
export const formatFullCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

/** Format a date string to Vietnamese locale (dd/mm/yyyy) */
export const formatDate = (dateString: string | Date | undefined | null): string => {
    if (!dateString) return '';
    try {
        const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
        if (isNaN(date.getTime())) return typeof dateString === 'string' ? dateString : '';
        return new Intl.DateTimeFormat('vi-VN').format(date);
    } catch {
        return typeof dateString === 'string' ? dateString : '';
    }
};

/** Format a date + time to Vietnamese locale */
export const formatDateTime = (dateString: string | Date | undefined | null): string => {
    if (!dateString) return '';
    try {
        const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
        if (isNaN(date.getTime())) return '';
        return date.toLocaleString('vi-VN');
    } catch {
        return '';
    }
};

/** Format a number with thousand separators */
export const formatNumber = (value: number | undefined | null): string => {
    if (value === undefined || value === null || isNaN(value)) return '—';
    return new Intl.NumberFormat('vi-VN').format(value);
};

/** Format a percentage value */
export const formatPercent = (value: number | undefined | null, decimals = 1): string => {
    if (value === undefined || value === null || isNaN(value)) return '—';
    return `${value.toFixed(decimals)}%`;
};

/** Format file size in human-readable format */
export const formatFileSize = (bytes: number | undefined | null): string => {
    if (bytes === undefined || bytes === null || bytes === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${sizes[i]}`;
};
