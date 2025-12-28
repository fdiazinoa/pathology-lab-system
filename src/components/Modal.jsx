import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import Button from './Button';

const Modal = ({ isOpen, onClose, title, children, type = 'default', onConfirm, confirmText = 'Confirmar', cancelText = 'Cancelar' }) => {
    if (!isOpen) return null;

    const isWarning = type === 'warning';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                <div className={`px-6 py-4 border-b border-border flex justify-between items-center ${isWarning ? 'bg-amber-50' : ''}`}>
                    <div className="flex items-center gap-3">
                        {isWarning && <AlertTriangle className="text-amber-500" size={24} />}
                        <h3 className={`text-lg font-bold ${isWarning ? 'text-amber-700' : 'text-text-main'}`}>{title}</h3>
                    </div>
                    <button onClick={onClose} className="text-text-secondary hover:text-text-main transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 text-text-secondary">
                    {children}
                </div>

                <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-border">
                    <Button variant="ghost" onClick={onClose}>
                        {cancelText}
                    </Button>
                    <Button
                        onClick={onConfirm}
                        className={isWarning ? 'bg-amber-600 hover:bg-amber-700 text-white border-none' : ''}
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Modal;
