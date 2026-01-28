
import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto remove after 3s
        setTimeout(() => {
            removeToast(id);
        }, 3000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`
                            pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-in slide-in-from-right-full duration-300
                            ${toast.type === 'success' ? 'bg-white border-emerald-100 text-emerald-800' : ''}
                            ${toast.type === 'error' ? 'bg-white border-red-100 text-red-800' : ''}
                            ${toast.type === 'info' ? 'bg-white border-blue-100 text-blue-800' : ''}
                            ${toast.type === 'warning' ? 'bg-white border-orange-100 text-orange-800' : ''}
                        `}
                    >
                        {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                        {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                        {toast.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
                        {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-orange-500" />}

                        <p className="text-sm font-medium">{toast.message}</p>

                        <button
                            onClick={() => removeToast(toast.id)}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors ml-2"
                        >
                            <X className="w-3 h-3 text-gray-400" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
