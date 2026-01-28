
import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick, hover = false }) => {
    return (
        <div
            onClick={onClick}
            className={`
                bg-white rounded-2xl border border-gray-100 shadow-sm
                ${hover ? 'hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer' : ''}
                ${className}
            `}
        >
            {children}
        </div>
    );
};

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`p-4 md:p-6 border-b border-gray-100 ${className}`}>
        {children}
    </div>
);

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`p-4 md:p-6 ${className}`}>
        {children}
    </div>
);
