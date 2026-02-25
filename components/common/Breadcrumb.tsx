import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

// ========================================
// BREADCRUMB COMPONENT - Design System v2
// ========================================

interface BreadcrumbItem {
    label: string;
    href?: string;
    icon?: React.ReactNode;
}

interface BreadcrumbProps {
    items?: BreadcrumbItem[];
    showHome?: boolean;
    separator?: React.ReactNode;
    maxItems?: number;
    className?: string;
}

// Route to label mapping
const routeLabels: Record<string, string> = {
    '': 'Tổng quan',
    'my-dashboard': 'Dashboard cá nhân',
    'projects': 'Dự án đầu tư',
    'tasks': 'Công việc',
    'employees': 'Nhân sự',
    'contractors': 'Nhà thầu',
    'contracts': 'Hợp đồng',
    'payments': 'Thanh toán',
    'documents': 'Hồ sơ tài liệu',
    'legal-documents': 'Văn bản pháp luật',
    'reports': 'Báo cáo',
    'regulations': 'Quy chế làm việc',
    'settings': 'Cài đặt',
    'new': 'Tạo mới',
    'edit': 'Chỉnh sửa',
};

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
    items,
    showHome = true,
    separator,
    maxItems = 4,
    className = '',
}) => {
    const location = useLocation();

    // Auto-generate breadcrumbs from current path if no items provided
    const generatedItems: BreadcrumbItem[] = React.useMemo(() => {
        if (items) return items;

        const pathSegments = location.pathname.split('/').filter(Boolean);

        const breadcrumbs: BreadcrumbItem[] = [];
        let currentPath = '';

        pathSegments.forEach((segment, index) => {
            currentPath += `/${segment}`;
            const isLast = index === pathSegments.length - 1;

            // Check if segment is an ID (UUID or number)
            const isId = /^[0-9a-f-]{36}$/i.test(segment) || /^\d+$/.test(segment);

            breadcrumbs.push({
                label: isId ? 'Chi tiết' : (routeLabels[segment] || segment),
                href: isLast ? undefined : currentPath,
            });
        });

        return breadcrumbs;
    }, [items, location.pathname]);

    const displayItems = React.useMemo(() => {
        if (generatedItems.length <= maxItems) return generatedItems;

        // Show first, ellipsis, and last items
        return [
            generatedItems[0],
            { label: '...', href: undefined },
            ...generatedItems.slice(-2),
        ];
    }, [generatedItems, maxItems]);

    const defaultSeparator = (
        <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
    );

    return (
        <nav aria-label="Breadcrumb" className={className}>
            <ol className="flex items-center gap-1 text-sm">
                {/* Home */}
                {showHome && (
                    <>
                        <li>
                            <Link
                                to="/"
                                className="flex items-center gap-1 px-2 py-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <Home className="w-4 h-4" />
                                <span className="sr-only">Trang chủ</span>
                            </Link>
                        </li>
                        {displayItems.length > 0 && (
                            <li className="flex items-center">
                                {separator || defaultSeparator}
                            </li>
                        )}
                    </>
                )}

                {/* Items */}
                {displayItems.map((item, index) => (
                    <React.Fragment key={index}>
                        <li>
                            {item.href ? (
                                <Link
                                    to={item.href}
                                    className="px-2 py-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors line-clamp-1"
                                >
                                    {item.label}
                                </Link>
                            ) : (
                                <span className="px-2 py-1 text-gray-800 font-medium line-clamp-1">
                                    {item.label}
                                </span>
                            )}
                        </li>
                        {index < displayItems.length - 1 && (
                            <li className="flex items-center">
                                {separator || defaultSeparator}
                            </li>
                        )}
                    </React.Fragment>
                ))}
            </ol>
        </nav>
    );
};

export default Breadcrumb;
