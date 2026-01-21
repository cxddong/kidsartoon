import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
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
        const id = Math.random().toString(36).substring(7);
        setToasts((prev) => [...prev, { id, type, message }]);

        // Auto remove
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Singleton Toast Container */}
            <div className="fixed top-4 left-0 right-0 z-[100] flex flex-col items-center gap-2 pointer-events-none p-4">
                <AnimatePresence mode="popLayout">
                    {toasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, y: -20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            layout
                            className={cn(
                                "pointer-events-auto min-w-[300px] max-w-sm rounded-[2rem] p-4 flex items-center gap-3 shadow-2xl border-2 backdrop-blur-xl relative overflow-hidden",
                                toast.type === 'success' && "bg-white/90 border-green-400/50 text-green-900",
                                toast.type === 'error' && "bg-white/90 border-pink-500/50 text-pink-900",
                                toast.type === 'info' && "bg-white/90 border-indigo-400/50 text-indigo-900",
                            )}
                        >
                            {/* Icon Box */}
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2",
                                toast.type === 'success' && "bg-green-100 border-green-200 text-green-600",
                                toast.type === 'error' && "bg-pink-100 border-pink-200 text-pink-500",
                                toast.type === 'info' && "bg-indigo-100 border-indigo-200 text-indigo-600",
                            )}>
                                {toast.type === 'success' && <CheckCircle2 className="w-6 h-6" />}
                                {toast.type === 'error' && <span className="text-xl">😿</span>}
                                {toast.type === 'info' && <Sparkles className="w-5 h-5" />}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <h4 className={cn(
                                    "font-black text-xs uppercase tracking-wider mb-0.5",
                                    toast.type === 'success' && "text-green-600",
                                    toast.type === 'error' && "text-pink-600",
                                    toast.type === 'info' && "text-indigo-600",
                                )}>
                                    {toast.type === 'success' ? 'Magic Success!' :
                                        toast.type === 'error' ? 'Oopsie Daisy!' :
                                            'Magic Note'}
                                </h4>
                                <p className="text-sm font-bold opacity-90 leading-tight">{toast.message}</p>
                            </div>

                            {/* Close */}
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="p-1 rounded-full hover:bg-black/5 transition-colors"
                            >
                                <X className="w-4 h-4 opacity-50" />
                            </button>

                            {/* Decorative Sparkle for Info */}
                            {toast.type === 'info' && (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                                    className="absolute -top-4 -right-4 opacity-20"
                                >
                                    <Sparkles className="w-16 h-16 text-indigo-500" />
                                </motion.div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};
