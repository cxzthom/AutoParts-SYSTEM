import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

// Simple event bus pattern to trigger toasts from anywhere
type Listener = (toast: ToastMessage) => void;
let listeners: Listener[] = [];

export const showNotification = (message: string, type: ToastType = 'info') => {
  const id = Math.random().toString(36).substring(2, 9);
  const toast: ToastMessage = { id, message, type };
  listeners.forEach(l => l(toast));
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handler = (newToast: ToastMessage) => {
      setToasts(prev => [...prev, newToast]);
      
      // Auto dismiss after 4 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== newToast.id));
      }, 4000);
    };

    listeners.push(handler);
    return () => {
      listeners = listeners.filter(l => l !== handler);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div 
          key={toast.id} 
          className={`pointer-events-auto min-w-[300px] max-w-sm w-full bg-white shadow-lg rounded-lg border-l-4 p-4 flex items-start gap-3 transition-all animate-in slide-in-from-right fade-in duration-300 ${
            toast.type === 'success' ? 'border-green-500' :
            toast.type === 'error' ? 'border-red-500' :
            toast.type === 'warning' ? 'border-yellow-500' :
            'border-blue-500'
          }`}
        >
          <div className="shrink-0 mt-0.5">
            {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
            {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-500" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
          </div>
          <div className="flex-1">
             <p className="text-sm font-medium text-gray-800 leading-snug">
              {toast.message}
             </p>
          </div>
          <button 
            onClick={() => removeToast(toast.id)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};