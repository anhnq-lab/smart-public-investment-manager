export const formatCurrency = (amount: number | undefined | null): string => {
    if (amount === undefined || amount === null) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0
    }).format(amount);
};

export const formatDate = (dateString: string | undefined | null): string => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('vi-VN').format(date);
    } catch {
        return dateString;
    }
};
