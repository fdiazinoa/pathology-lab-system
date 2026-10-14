import React from 'react';
import { useData } from '../services/DataContext';

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    isLoading = false,
    permission,
    ...props
}) => {
    const data = useData();
    const denied = permission && !data?.can(...permission);
    const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-primary text-white hover:bg-primary-hover focus:ring-primary",
        secondary: "bg-white text-text-main border border-border hover:bg-gray-50 focus:ring-gray-200",
        danger: "bg-danger text-white hover:bg-red-600 focus:ring-danger",
        ghost: "bg-transparent text-text-secondary hover:text-text-main hover:bg-gray-100",
    };

    const sizes = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base",
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
            disabled={Boolean(isLoading || props.disabled || denied)}
        >
            {isLoading ? (
                <span className="mr-2 animate-spin">⟳</span>
            ) : null}
            {children}
        </button>
    );
};

export default Button;
