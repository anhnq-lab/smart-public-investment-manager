import React, { useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    /** Auto-focus on mount */
    autoFocus?: boolean;
    /** Keyboard shortcut hint, e.g. "⌘K" */
    shortcutHint?: string;
    /** Debounce delay in ms (0 = no debounce) */
    debounceMs?: number;
}

/**
 * Reusable search input with consistent styling, clear button, and optional keyboard shortcut hint.
 * Uses design system `.search-input-wrapper` classes from index.css.
 */
export const SearchInput: React.FC<SearchInputProps> = ({
    value,
    onChange,
    placeholder = 'Tìm kiếm...',
    className = '',
    autoFocus = false,
    shortcutHint,
}) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (autoFocus && inputRef.current) {
            inputRef.current.focus();
        }
    }, [autoFocus]);

    return (
        <div className={`search-input-wrapper ${className}`}>
            <Search className="search-icon" />
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="pr-20"
            />
            {/* Clear button */}
            {value && (
                <button
                    type="button"
                    onClick={() => onChange('')}
                    className="absolute right-2 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                    aria-label="Xóa tìm kiếm"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            )}
            {/* Shortcut hint */}
            {shortcutHint && !value && (
                <span className="absolute right-3 text-[10px] text-gray-300 dark:text-slate-600 font-mono pointer-events-none">
                    {shortcutHint}
                </span>
            )}
        </div>
    );
};
