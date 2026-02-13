import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const showToast = useCallback((notification) => {
        const id = Date.now();
        setNotifications((prev) => [...prev, { ...notification, id }]);

        // Auto remove after 5 seconds
        setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, 5000);
    }, []);

    const removeToast = useCallback((id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    const addToast = useCallback((type, message) => {
        showToast({
            title: type === 'error' ? 'Error' : 'Success',
            message,
            type
        });
    }, [showToast]);

    return (
        <NotificationContext.Provider value={{ showToast, addToast, removeToast, notifications }}>
            {children}
        </NotificationContext.Provider>
    );
};
