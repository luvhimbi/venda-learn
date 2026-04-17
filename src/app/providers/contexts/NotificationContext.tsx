import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import NotificationToast from '../../../components/feedback/toasts/NotificationToast';

export type NotificationType = 'success' | 'warning' | 'info' | 'streak';

interface NotificationOptions {
    title: string;
    message: string;
    type?: NotificationType;
    duration?: number;
}

interface NotificationContextProps {
    showNotification: (options: NotificationOptions) => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toast, setToast] = useState<(NotificationOptions & { id: number }) | null>(null);

    const showNotification = useCallback((options: NotificationOptions) => {
        setToast({ ...options, id: Date.now() });
    }, []);

    const handleClose = useCallback(() => {
        setToast(null);
    }, []);

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            {toast && (
                <NotificationToast
                    key={toast.id}
                    title={toast.title}
                    message={toast.message}
                    type={toast.type || 'info'}
                    duration={toast.duration || 5000}
                    onClose={handleClose}
                />
            )}
        </NotificationContext.Provider>
    );
};






