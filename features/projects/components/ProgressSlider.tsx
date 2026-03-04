import React from 'react';

interface ProgressSliderProps {
    value: number;
    onChange: (value: number) => void;
    disabled?: boolean;
    showLabel?: boolean;
    size?: 'sm' | 'md' | 'lg';
    color?: 'blue' | 'emerald' | 'orange' | 'purple';
}

export const ProgressSlider: React.FC<ProgressSliderProps> = ({
    value,
    onChange,
    disabled = false,
    showLabel = true,
    size = 'md',
    color = 'blue'
}) => {
    const sizeStyles = {
        sm: { track: 'h-1.5', thumb: 'w-3 h-3', text: 'text-xs' },
        md: { track: 'h-2', thumb: 'w-4 h-4', text: 'text-sm' },
        lg: { track: 'h-3', thumb: 'w-5 h-5', text: 'text-base' }
    };

    const colorStyles = {
        blue: { bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-700' },
        emerald: { bg: 'bg-emerald-500', light: 'bg-emerald-100', text: 'text-emerald-700' },
        orange: { bg: 'bg-orange-500', light: 'bg-orange-100', text: 'text-orange-700' },
        purple: { bg: 'bg-purple-500', light: 'bg-purple-100', text: 'text-purple-700' }
    };

    const getProgressColor = (percent: number) => {
        if (percent === 100) return colorStyles.emerald;
        if (percent >= 75) return colorStyles.blue;
        if (percent >= 50) return colorStyles.orange;
        return colorStyles[color];
    };

    const currentColor = getProgressColor(value);
    const { track, thumb, text } = sizeStyles[size];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(parseInt(e.target.value, 10));
    };

    const quickValues = [0, 25, 50, 75, 100];

    return (
        <div className="space-y-2">
            {/* Label with percentage */}
            {showLabel && (
                <div className="flex items-center justify-between">
                    <span className={`font-medium text-gray-700 ${text}`}>Tiến độ</span>
                    <span className={`font-black ${currentColor.text} ${text}`}>
                        {value}%
                    </span>
                </div>
            )}

            {/* Slider Container */}
            <div className="relative group">
                {/* Background Track */}
                <div className={`w-full ${track} ${currentColor.light} rounded-full overflow-hidden`}>
                    {/* Progress Fill */}
                    <div
                        className={`h-full ${currentColor.bg} rounded-full transition-all duration-300`}
                        style={{ width: `${value}%` }}
                    />
                </div>

                {/* Native Range Input (invisible but interactive) */}
                <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={value}
                    onChange={handleChange}
                    disabled={disabled}
                    className={`absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed`}
                    style={{ height: '100%' }}
                />

                {/* Custom Thumb */}
                <div
                    className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 ${thumb} rounded-full shadow-md border-2 border-white ${currentColor.bg} transition-all pointer-events-none ${disabled ? 'opacity-50' : 'group-hover:scale-110'
                        }`}
                    style={{ left: `${value}%` }}
                />
            </div>

            {/* Quick Value Buttons */}
            <div className="flex items-center justify-between gap-1">
                {quickValues.map(qv => (
                    <button
                        key={qv}
                        onClick={() => !disabled && onChange(qv)}
                        disabled={disabled}
                        className={`flex-1 px-2 py-1 text-[10px] font-bold rounded transition-all ${value === qv
                            ? `${currentColor.bg} text-white`
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {qv}%
                    </button>
                ))}
            </div>
        </div>
    );
};

// Compact inline version for tables
export const ProgressBadge: React.FC<{
    value: number;
    onClick?: () => void;
    size?: 'sm' | 'md';
}> = ({ value, onClick, size = 'sm' }) => {
    const getColor = (v: number) => {
        if (v === 100) return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700';
        if (v >= 75) return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700';
        if (v >= 50) return 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700';
        if (v > 0) return 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700';
        return 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-600';
    };

    return (
        <button
            onClick={onClick}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-bold transition-all hover:scale-105 ${getColor(value)} ${size === 'sm' ? 'text-[10px]' : 'text-xs'
                }`}
        >
            <div className="w-8 h-1.5 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                <div
                    className={`h-full transition-all ${value === 100 ? 'bg-emerald-500' :
                        value >= 75 ? 'bg-blue-500' :
                            value >= 50 ? 'bg-orange-500' :
                                'bg-amber-500'
                        }`}
                    style={{ width: `${value}%` }}
                />
            </div>
            {value}%
        </button>
    );
};

export default ProgressSlider;
