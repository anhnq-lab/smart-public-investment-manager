import React, { forwardRef } from 'react';

// ========================================
// INPUT COMPONENT - Design System v2
// ========================================

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
    label?: string;
    helperText?: string;
    error?: string;
    size?: InputSize;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    leftAddon?: React.ReactNode;
    rightAddon?: React.ReactNode;
    showCharCount?: boolean;
    maxLength?: number;
    fullWidth?: boolean;
}

const sizeStyles: Record<InputSize, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-4 py-3 text-base',
};

const iconSizes: Record<InputSize, string> = {
    sm: 'w-4 h-4',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            label,
            helperText,
            error,
            size = 'md',
            leftIcon,
            rightIcon,
            leftAddon,
            rightAddon,
            showCharCount = false,
            maxLength,
            fullWidth = true,
            className = '',
            id,
            value,
            ...props
        },
        ref
    ) => {
        const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
        const hasError = !!error;
        const charCount = typeof value === 'string' ? value.length : 0;

        const baseInputStyles = `
            w-full bg-white border rounded-xl
            text-gray-900 placeholder:text-gray-400
            transition-all duration-200
            focus:outline-none focus:ring-2
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
        `;

        const stateStyles = hasError
            ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-100'
            : 'border-gray-200 focus:border-primary-500 focus:ring-primary-100';

        const paddingStyles = {
            left: leftIcon ? 'pl-10' : '',
            right: rightIcon || (showCharCount && maxLength) ? 'pr-10' : '',
        };

        return (
            <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
                {/* Label */}
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-sm font-medium text-gray-700 mb-1.5"
                    >
                        {label}
                        {props.required && <span className="text-danger-500 ml-0.5">*</span>}
                    </label>
                )}

                {/* Input Container */}
                <div className="relative flex">
                    {/* Left Addon */}
                    {leftAddon && (
                        <div className="flex items-center px-3 bg-gray-50 border border-r-0 border-gray-200 rounded-l-xl text-gray-500 text-sm">
                            {leftAddon}
                        </div>
                    )}

                    {/* Input Wrapper */}
                    <div className="relative flex-1">
                        {/* Left Icon */}
                        {leftIcon && (
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                <span className={iconSizes[size]}>{leftIcon}</span>
                            </div>
                        )}

                        {/* Input */}
                        <input
                            ref={ref}
                            id={inputId}
                            value={value}
                            maxLength={maxLength}
                            aria-invalid={hasError}
                            aria-describedby={
                                hasError ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
                            }
                            className={`
                                ${baseInputStyles}
                                ${stateStyles}
                                ${sizeStyles[size]}
                                ${paddingStyles.left}
                                ${paddingStyles.right}
                                ${leftAddon ? 'rounded-l-none' : ''}
                                ${rightAddon ? 'rounded-r-none' : ''}
                            `.replace(/\s+/g, ' ').trim()}
                            {...props}
                        />

                        {/* Right Icon or Char Count */}
                        {(rightIcon || (showCharCount && maxLength)) && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                {showCharCount && maxLength ? (
                                    <span className="text-xs">
                                        {charCount}/{maxLength}
                                    </span>
                                ) : (
                                    <span className={iconSizes[size]}>{rightIcon}</span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right Addon */}
                    {rightAddon && (
                        <div className="flex items-center px-3 bg-gray-50 border border-l-0 border-gray-200 rounded-r-xl text-gray-500 text-sm">
                            {rightAddon}
                        </div>
                    )}
                </div>

                {/* Helper Text or Error */}
                {(error || helperText) && (
                    <p
                        id={hasError ? `${inputId}-error` : `${inputId}-helper`}
                        className={`mt-1.5 text-xs ${hasError ? 'text-danger-500' : 'text-gray-500'}`}
                    >
                        {error || helperText}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

// ========================================
// TEXTAREA COMPONENT
// ========================================

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    helperText?: string;
    error?: string;
    showCharCount?: boolean;
    maxLength?: number;
    fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    (
        {
            label,
            helperText,
            error,
            showCharCount = false,
            maxLength,
            fullWidth = true,
            className = '',
            id,
            value,
            ...props
        },
        ref
    ) => {
        const inputId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
        const hasError = !!error;
        const charCount = typeof value === 'string' ? value.length : 0;

        return (
            <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
                {label && (
                    <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1.5">
                        {label}
                        {props.required && <span className="text-danger-500 ml-0.5">*</span>}
                    </label>
                )}

                <textarea
                    ref={ref}
                    id={inputId}
                    value={value}
                    maxLength={maxLength}
                    aria-invalid={hasError}
                    className={`
                        w-full px-4 py-3 bg-white border rounded-xl
                        text-gray-900 placeholder:text-gray-400
                        transition-all duration-200
                        focus:outline-none focus:ring-2
                        resize-y min-h-[100px]
                        ${hasError
                            ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-100'
                            : 'border-gray-200 focus:border-primary-500 focus:ring-primary-100'
                        }
                    `.replace(/\s+/g, ' ').trim()}
                    {...props}
                />

                <div className="flex justify-between mt-1.5">
                    {(error || helperText) && (
                        <p className={`text-xs ${hasError ? 'text-danger-500' : 'text-gray-500'}`}>
                            {error || helperText}
                        </p>
                    )}
                    {showCharCount && maxLength && (
                        <p className="text-xs text-gray-400 ml-auto">
                            {charCount}/{maxLength}
                        </p>
                    )}
                </div>
            </div>
        );
    }
);

Textarea.displayName = 'Textarea';

// ========================================
// CHECKBOX COMPONENT
// ========================================

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: React.ReactNode;
    description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
    ({ label, description, className = '', id, ...props }, ref) => {
        const inputId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

        return (
            <div className={`flex items-start gap-3 ${className}`}>
                <input
                    ref={ref}
                    id={inputId}
                    type="checkbox"
                    className="
                        w-4 h-4 mt-0.5
                        text-primary-500 bg-white border-gray-300 rounded
                        focus:ring-2 focus:ring-primary-100 focus:ring-offset-0
                        transition-colors cursor-pointer
                        disabled:cursor-not-allowed disabled:opacity-50
                    "
                    {...props}
                />
                {(label || description) && (
                    <div>
                        {label && (
                            <label
                                htmlFor={inputId}
                                className="text-sm font-medium text-gray-700 cursor-pointer"
                            >
                                {label}
                            </label>
                        )}
                        {description && (
                            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                        )}
                    </div>
                )}
            </div>
        );
    }
);

Checkbox.displayName = 'Checkbox';

// ========================================
// RADIO COMPONENT
// ========================================

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: React.ReactNode;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
    ({ label, className = '', id, ...props }, ref) => {
        const inputId = id || `radio-${Math.random().toString(36).substr(2, 9)}`;

        return (
            <div className={`flex items-center gap-3 ${className}`}>
                <input
                    ref={ref}
                    id={inputId}
                    type="radio"
                    className="
                        w-4 h-4
                        text-primary-500 bg-white border-gray-300
                        focus:ring-2 focus:ring-primary-100 focus:ring-offset-0
                        transition-colors cursor-pointer
                        disabled:cursor-not-allowed disabled:opacity-50
                    "
                    {...props}
                />
                {label && (
                    <label
                        htmlFor={inputId}
                        className="text-sm font-medium text-gray-700 cursor-pointer"
                    >
                        {label}
                    </label>
                )}
            </div>
        );
    }
);

Radio.displayName = 'Radio';

export default Input;
