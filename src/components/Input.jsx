import React from 'react';

const Input = ({
    label,
    error,
    className = '',
    type = 'text',
    textarea = false,
    ...props
}) => {
    const Component = textarea ? 'textarea' : 'input';

    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            {label && (
                <label className="text-sm font-medium text-text-main">
                    {label}
                </label>
            )}
            <Component
                className={`
          flex w-full rounded-md border border-border bg-white px-3 py-2 text-sm placeholder:text-text-secondary
          focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
          disabled:cursor-not-allowed disabled:opacity-50
          ${error ? 'border-danger focus:ring-danger' : ''}
          ${textarea ? 'min-h-[100px] resize-y' : ''}
        `}
                type={type}
                {...props}
            />
            {error && (
                <p className="text-xs text-danger">{error}</p>
            )}
        </div>
    );
};

export default Input;
