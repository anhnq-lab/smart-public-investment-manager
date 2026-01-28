
import React from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';

interface BadgeProps {
    children: React.ReactNode;
    variant?: BadgeVariant;
    className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => {
    const variants = {
        default: "bg-gray-100 text-gray-800",
        success: "bg-emerald-100 text-emerald-700",
        warning: "bg-orange-100 text-orange-700",
        danger: "bg-red-100 text-red-700",
        info: "bg-blue-100 text-blue-700",
        outline: "bg-transparent border border-gray-200 text-gray-600"
    };

    return (
        <span className={`
            inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
            ${variants[variant]}
            ${className}
        `}>
            {children}
        </span>
    );
};
