
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    leftIcon,
    rightIcon,
    className = '',
    ...props
}) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {label} {props.required && <span className="text-red-500">*</span>}
                </label>
            )}
            <div className="relative">
                {leftIcon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {leftIcon}
                    </div>
                )}
                <input
                    className={`
                        w-full bg-white border rounded-xl text-sm transition-all
                        focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                        disabled:bg-gray-50 disabled:text-gray-500
                        ${leftIcon ? 'pl-10' : 'pl-4'}
                        ${rightIcon ? 'pr-10' : 'pr-4'}
                        ${props.height ? '' : 'py-2.5'}
                        ${error ? 'border-red-300 focus:ring-red-200 focus:border-red-500' : 'border-gray-200'}
                        ${className}
                    `}
                    {...props}
                />
                {rightIcon && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {rightIcon}
                    </div>
                )}
            </div>
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
};
