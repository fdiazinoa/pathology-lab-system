import React from 'react';

const Card = ({ children, className = '', title, actions }) => {
    return (
        <div className={`bg-white rounded-lg shadow-sm border border-border overflow-hidden ${className}`}>
            {(title || actions) && (
                <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-gray-50/50">
                    {title && <h3 className="font-semibold text-text-main">{title}</h3>}
                    {actions && <div className="flex gap-2">{actions}</div>}
                </div>
            )}
            <div className="p-6">
                {children}
            </div>
        </div>
    );
};

export default Card;
