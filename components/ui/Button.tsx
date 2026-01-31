import React from 'react';
import { Loader2 } from 'lucide-react';

// ========================================
// BUTTON COMPONENT - Design System v2
// ========================================

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline' | 'link';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    loadingText?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
    rounded?: boolean;
    children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
    primary: `
        bg-primary-500 text-white
        shadow-lg shadow-primary-500/20
        hover:bg-primary-600 hover:shadow-primary-500/30
        active:bg-primary-700
        focus-visible:ring-primary-500
    `,
    secondary: `
        bg-white text-gray-700 
        border border-gray-200 shadow-sm
        hover:bg-gray-50 hover:border-gray-300
        active:bg-gray-100
        focus-visible:ring-gray-400
    `,
    ghost: `
        bg-transparent text-gray-600
        hover:bg-gray-100 hover:text-gray-900
        active:bg-gray-200
        focus-visible:ring-gray-400
    `,
    danger: `
        bg-danger-500 text-white
        shadow-lg shadow-danger-500/20
        hover:bg-danger-600 hover:shadow-danger-500/30
        active:bg-danger-700
        focus-visible:ring-danger-500
    `,
    success: `
        bg-success-500 text-white
        shadow-lg shadow-success-500/20
        hover:bg-success-600 hover:shadow-success-500/30
        active:bg-success-700
        focus-visible:ring-success-500
    `,
    outline: `
        bg-transparent text-primary-500
        border-2 border-primary-500
        hover:bg-primary-50
        active:bg-primary-100
        focus-visible:ring-primary-500
    `,
    link: `
        bg-transparent text-primary-500
        underline-offset-4
        hover:underline hover:text-primary-600
        active:text-primary-700
        focus-visible:ring-primary-500
        p-0 h-auto
    `,
};

const sizeStyles: Record<ButtonSize, string> = {
    xs: 'px-2.5 py-1 text-xs gap-1',
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2',
    xl: 'px-6 py-3 text-lg gap-2.5',
};

const iconSizes: Record<ButtonSize, string> = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-5 h-5',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = 'primary',
            size = 'md',
            loading = false,
            loadingText,
            leftIcon,
            rightIcon,
            fullWidth = false,
            rounded = false,
            disabled,
            className = '',
            children,
            ...props
        },
        ref
    ) => {
        const isDisabled = disabled || loading;

        const baseStyles = `
            inline-flex items-center justify-center
            font-semibold
            transition-all duration-200 ease-out
            focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
            select-none
        `;

        const roundedStyle = rounded ? 'rounded-full' : 'rounded-xl';
        const widthStyle = fullWidth ? 'w-full' : '';

        return (
            <button
                ref={ref}
                disabled={isDisabled}
                className={`
                    ${baseStyles}
                    ${variantStyles[variant]}
                    ${sizeStyles[size]}
                    ${roundedStyle}
                    ${widthStyle}
                    ${className}
                `.replace(/\s+/g, ' ').trim()}
                {...props}
            >
                {/* Loading Spinner */}
                {loading && (
                    <Loader2
                        className={`${iconSizes[size]} animate-spin`}
                        aria-hidden="true"
                    />
                )}

                {/* Left Icon */}
                {!loading && leftIcon && (
                    <span className={iconSizes[size]} aria-hidden="true">
                        {leftIcon}
                    </span>
                )}

                {/* Button Text */}
                <span className={loading && !loadingText ? 'opacity-0' : ''}>
                    {loading && loadingText ? loadingText : children}
                </span>

                {/* Right Icon */}
                {!loading && rightIcon && (
                    <span className={iconSizes[size]} aria-hidden="true">
                        {rightIcon}
                    </span>
                )}
            </button>
        );
    }
);

Button.displayName = 'Button';

// ========================================
// ICON BUTTON VARIANT
// ========================================

export interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'loadingText' | 'children'> {
    icon: React.ReactNode;
    'aria-label': string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
    ({ icon, size = 'md', className = '', 'aria-label': ariaLabel, ...props }, ref) => {
        const iconOnlyPadding: Record<ButtonSize, string> = {
            xs: 'p-1',
            sm: 'p-1.5',
            md: 'p-2',
            lg: 'p-2.5',
            xl: 'p-3',
        };

        return (
            <Button
                ref={ref}
                size={size}
                className={`${iconOnlyPadding[size]} ${className}`}
                aria-label={ariaLabel}
                {...props}
            >
                <span className={iconSizes[size]}>{icon}</span>
            </Button>
        );
    }
);

IconButton.displayName = 'IconButton';

// ========================================
// BUTTON GROUP
// ========================================

interface ButtonGroupProps {
    children: React.ReactNode;
    className?: string;
    attached?: boolean;
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
    children,
    className = '',
    attached = false
}) => {
    if (attached) {
        return (
            <div className={`inline-flex ${className}`} role="group">
                {React.Children.map(children, (child, index) => {
                    if (!React.isValidElement(child)) return child;

                    const isFirst = index === 0;
                    const isLast = index === React.Children.count(children) - 1;

                    return React.cloneElement(child as React.ReactElement<ButtonProps>, {
                        className: `
                            ${(child as React.ReactElement<ButtonProps>).props.className || ''}
                            ${!isFirst ? '-ml-px' : ''}
                            ${isFirst ? 'rounded-r-none' : ''}
                            ${isLast ? 'rounded-l-none' : ''}
                            ${!isFirst && !isLast ? 'rounded-none' : ''}
                        `.trim(),
                    });
                })}
            </div>
        );
    }

    return (
        <div className={`inline-flex gap-2 ${className}`} role="group">
            {children}
        </div>
    );
};

export default Button;
