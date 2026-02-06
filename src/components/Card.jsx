import React from 'react';

const Card = ({ children, className = '', title, actions }) => {
    return (
        <div className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden ${className}`}>
            {(title || actions) && (
                <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center">
                    {title && <h3 className="font-semibold text-lg text-text-main tracking-tight">{title}</h3>}
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
