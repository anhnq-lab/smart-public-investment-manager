import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

// ========================================
// SELECT COMPONENT - Design System v2
// ========================================

export interface SelectOption {
    value: string | number;
    label: string;
    disabled?: boolean;
    icon?: React.ReactNode;
}

export interface SelectProps {
    options: SelectOption[];
    value?: string | number | (string | number)[];
    onChange?: (value: string | number | (string | number)[]) => void;
    placeholder?: string;
    label?: string;
    helperText?: string;
    error?: string;
    disabled?: boolean;
    searchable?: boolean;
    multiple?: boolean;
    clearable?: boolean;
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    className?: string;
}

const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-4 py-3 text-base',
};

export const Select: React.FC<SelectProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Chọn...',
    label,
    helperText,
    error,
    disabled = false,
    searchable = false,
    multiple = false,
    clearable = false,
    size = 'md',
    fullWidth = true,
    className = '',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const hasError = !!error;

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setSearchQuery('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus search input when opened
    useEffect(() => {
        if (isOpen && searchable && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen, searchable]);

    const filteredOptions = searchable
        ? options.filter(opt =>
            opt.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : options;

    const selectedOptions = Array.isArray(value)
        ? options.filter(opt => value.includes(opt.value))
        : options.find(opt => opt.value === value);

    const handleSelect = useCallback((option: SelectOption) => {
        if (option.disabled) return;

        if (multiple) {
            const currentValues = Array.isArray(value) ? value : [];
            const newValues = currentValues.includes(option.value)
                ? currentValues.filter(v => v !== option.value)
                : [...currentValues, option.value];
            onChange?.(newValues);
        } else {
            onChange?.(option.value);
            setIsOpen(false);
            setSearchQuery('');
        }
    }, [multiple, value, onChange]);

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange?.(multiple ? [] : '');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setIsOpen(false);
            setSearchQuery('');
        }
        if (e.key === 'Enter' && !isOpen) {
            setIsOpen(true);
        }
    };

    const displayValue = () => {
        if (multiple) {
            const selected = Array.isArray(selectedOptions) ? selectedOptions : [];
            if (selected.length === 0) return placeholder;
            if (selected.length === 1) return selected[0].label;
            return `${selected.length} đã chọn`;
        }
        return (selectedOptions as SelectOption)?.label || placeholder;
    };

    const hasValue = multiple
        ? Array.isArray(value) && value.length > 0
        : value !== undefined && value !== '';

    return (
        <div ref={containerRef} className={`relative ${fullWidth ? 'w-full' : ''} ${className}`}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {label}
                </label>
            )}

            {/* Trigger Button */}
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                onKeyDown={handleKeyDown}
                className={`
                    w-full flex items-center justify-between gap-2
                    bg-white border rounded-xl
                    text-left transition-all duration-200
                    focus:outline-none focus:ring-2
                    disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
                    ${sizeStyles[size]}
                    ${isOpen ? 'ring-2 ring-primary-100 border-primary-500' : ''}
                    ${hasError
                        ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-100'
                        : 'border-gray-200 focus:border-primary-500 focus:ring-primary-100'
                    }
                `}
            >
                <span className={hasValue ? 'text-gray-900' : 'text-gray-400'}>
                    {displayValue()}
                </span>
                <div className="flex items-center gap-1">
                    {clearable && hasValue && (
                        <span
                            onClick={handleClear}
                            className="p-0.5 hover:bg-gray-100 rounded transition-colors"
                        >
                            <X className="w-3.5 h-3.5 text-gray-400" />
                        </span>
                    )}
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-dropdown overflow-hidden animate-fade-in-down">
                    {/* Search Input */}
                    {searchable && (
                        <div className="p-2 border-b border-gray-200">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Tìm kiếm..."
                                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-100"
                                />
                            </div>
                        </div>
                    )}

                    {/* Options List */}
                    <div className="max-h-60 overflow-y-auto scrollbar-thin">
                        {filteredOptions.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                Không tìm thấy kết quả
                            </div>
                        ) : (
                            filteredOptions.map((option) => {
                                const isSelected = multiple
                                    ? Array.isArray(value) && value.includes(option.value)
                                    : value === option.value;

                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        disabled={option.disabled}
                                        onClick={() => handleSelect(option)}
                                        className={`
                                            w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left
                                            transition-colors
                                            ${option.disabled
                                                ? 'text-gray-400 cursor-not-allowed'
                                                : 'hover:bg-gray-50'
                                            }
                                            ${isSelected ? 'bg-primary-50 text-primary-700' : 'text-gray-700'}
                                        `}
                                    >
                                        {multiple && (
                                            <div className={`
                                                w-4 h-4 border rounded flex items-center justify-center
                                                ${isSelected
                                                    ? 'bg-primary-500 border-primary-500'
                                                    : 'border-gray-300'
                                                }
                                            `}>
                                                {isSelected && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                        )}
                                        {option.icon && <span className="shrink-0">{option.icon}</span>}
                                        <span className="flex-1">{option.label}</span>
                                        {!multiple && isSelected && (
                                            <Check className="w-4 h-4 text-primary-500" />
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* Helper/Error Text */}
            {(error || helperText) && (
                <p className={`mt-1.5 text-xs ${hasError ? 'text-danger-500' : 'text-gray-500'}`}>
                    {error || helperText}
                </p>
            )}
        </div>
    );
};

export default Select;
