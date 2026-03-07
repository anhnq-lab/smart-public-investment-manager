import React from 'react';

// ========================================
// CARD COMPONENT - Design System v2
// ========================================

export type CardVariant = 'default' | 'outlined' | 'elevated' | 'glass' | 'gradient';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

export interface CardProps {
    variant?: CardVariant;
    padding?: CardPadding;
    hover?: boolean;
    clickable?: boolean;
    className?: string;
    children: React.ReactNode;
    onClick?: () => void;
}

const variantStyles: Record<CardVariant, string> = {
    default: `
        bg-white border border-gray-200 shadow-card
    `,
    outlined: `
        bg-white border-2 border-gray-200
    `,
    elevated: `
        bg-white border border-gray-50 shadow-lg
    `,
    glass: `
        bg-white/70 backdrop-blur-xl border border-white/30 shadow-lg
    `,
    gradient: `
        bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-card
    `,
};

const paddingStyles: Record<CardPadding, string> = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    (
        {
            variant = 'default',
            padding = 'lg',
            hover = false,
            clickable = false,
            className = '',
            children,
            onClick,
            ...props
        },
        ref
    ) => {
        const baseStyles = `
            rounded-2xl
            transition-all duration-200 ease-out
        `;

        const hoverStyles = hover || clickable ? `
            hover:shadow-card-hover hover:-translate-y-0.5
            cursor-pointer
        ` : '';

        const focusStyles = clickable ? `
            focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
        ` : '';

        const Component = clickable ? 'button' : 'div';

        return (
            <Component
                ref={ref as any}
                onClick={onClick}
                className={`
                    ${baseStyles}
                    ${variantStyles[variant]}
                    ${paddingStyles[padding]}
                    ${hoverStyles}
                    ${focusStyles}
                    ${className}
                `.replace(/\s+/g, ' ').trim()}
                {...props}
            >
                {children}
            </Component>
        );
    }
);

Card.displayName = 'Card';

// ========================================
// CARD HEADER
// ========================================

interface CardHeaderProps {
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    icon?: React.ReactNode;
    action?: React.ReactNode;
    className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
    title,
    subtitle,
    icon,
    action,
    className = '',
}) => {
    return (
        <div className={`flex items-start justify-between gap-4 ${className}`}>
            <div className="flex items-start gap-3">
                {icon && (
                    <div className="p-2 rounded-xl bg-primary-50 text-primary-600 shrink-0">
                        {icon}
                    </div>
                )}
                <div>
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                        {title}
                    </h3>
                    {subtitle && (
                        <p className="text-xs text-gray-500 mt-0.5">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </div>
    );
};

// ========================================
// CARD BODY
// ========================================

interface CardBodyProps {
    className?: string;
    children: React.ReactNode;
}

export const CardBody: React.FC<CardBodyProps> = ({ className = '', children }) => {
    return <div className={`mt-4 ${className}`}>{children}</div>;
};

// ========================================
// CARD FOOTER
// ========================================

interface CardFooterProps {
    className?: string;
    children: React.ReactNode;
    divider?: boolean;
}

export const CardFooter: React.FC<CardFooterProps> = ({
    className = '',
    children,
    divider = true
}) => {
    return (
        <div className={`
            mt-4 pt-4 
            ${divider ? 'border-t border-gray-200' : ''} 
            ${className}
        `}>
            {children}
        </div>
    );
};

// ========================================
// STAT CARD (Commonly used pattern)
// ========================================

interface StatCardProps {
    title: string;
    value: string | number;
    icon?: React.ElementType;
    trend?: string;
    trendUp?: boolean;
    description?: string;
    loading?: boolean;
    iconBgColor?: string;
    iconColor?: string;
    className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    icon: Icon,
    trend,
    trendUp,
    description,
    loading = false,
    iconBgColor = 'bg-primary-50',
    iconColor = 'text-primary-600',
    className = '',
}) => {
    // Extract color name from iconColor prop (e.g., 'text-blue-600' -> 'blue')
    const colorMatch = iconColor.match(/text-(\w+)-/);
    const colorName = colorMatch ? colorMatch[1] : 'blue';

    // Gradient mapping based on color
    const gradientMap: Record<string, string> = {
        blue: 'from-blue-500 via-blue-600 to-indigo-700',
        primary: 'from-blue-500 via-blue-600 to-indigo-700',
        indigo: 'from-indigo-500 via-indigo-600 to-violet-700',
        emerald: 'from-emerald-500 via-emerald-600 to-teal-700',
        green: 'from-emerald-500 via-emerald-600 to-teal-700',
        amber: 'from-amber-500 via-orange-500 to-red-500',
        orange: 'from-orange-500 via-orange-600 to-red-600',
        red: 'from-red-500 via-red-600 to-rose-700',
        violet: 'from-violet-500 via-violet-600 to-purple-700',
        purple: 'from-purple-500 via-purple-600 to-fuchsia-700',
        rose: 'from-rose-500 via-rose-600 to-pink-700',
    };

    const gradient = gradientMap[colorName] || gradientMap.blue;

    return (
        <div
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} text-white p-5 shadow-xl ring-1 ring-white/10 transition-transform hover:scale-[1.02] hover:shadow-2xl duration-300 h-36 ${className}`}
        >
            {/* Background Icon */}
            {Icon && (
                <div className="absolute -right-3 -top-3 opacity-[0.12]">
                    <Icon className="w-24 h-24" strokeWidth={1.2} />
                </div>
            )}

            <div className="relative z-10 h-full flex flex-col justify-center gap-2">
                {/* Header */}
                <div className="flex justify-between items-start">
                    {Icon && (
                        <div className="p-2.5 rounded-xl bg-white/20 shadow-sm">
                            <Icon className="w-5 h-5 text-white" />
                        </div>
                    )}
                    {trend && !loading && (
                        <span className={`
                            flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full
                            ${trendUp
                                ? 'bg-white/20 text-white'
                                : 'bg-white/20 text-white'
                            }
                        `}>
                            <svg
                                className={`w-3 h-3 ${trendUp ? '' : 'rotate-180'}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            {trend}
                        </span>
                    )}
                </div>

                {/* Content */}
                <div>
                    {loading ? (
                        <div className="h-8 w-24 bg-white/20 rounded animate-pulse my-1" />
                    ) : (
                        <h3 className="text-2xl font-black text-white tracking-tight my-1 drop-shadow-sm">
                            {value}
                        </h3>
                    )}
                    <p className="text-[10px] font-extrabold text-white/90 uppercase tracking-[0.15em]">
                        {title}
                    </p>
                    {description && (
                        <p className="text-[10px] text-white/70 mt-1 font-medium">
                            {description}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Card;
