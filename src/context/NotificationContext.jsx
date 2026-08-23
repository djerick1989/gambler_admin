import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { notificationService } from '../services/api';
import { useAuth } from './AuthContext';
import i18n from '../i18n';

const NotificationContext = createContext();

// Cada cuánto se vuelven a pedir las notificaciones del servidor.
const POLL_INTERVAL_MS = 60000;

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);

    // Notificaciones persistidas en el backend (hoy: logros conseguidos).
    const [items, setItems] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loadingItems, setLoadingItems] = useState(false);
    const seenIdsRef = useRef(null);

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

    const refreshNotifications = useCallback(async ({ silent = true } = {}) => {
        if (!user?.userId) return;

        if (!silent) setLoadingItems(true);
        try {
            const response = await notificationService.getMyNotifications(1, 20, false, user?.gambler?.languageId || null);
            if (response?.status && response.data) {
                const list = response.data.notifications || [];
                setItems(list);
                setUnreadCount(response.data.unreadCount || 0);

                // La primera carga solo siembra la lista: si no, al entrar a la app saldrían
                // toasts de logros que el usuario ya conocía.
                if (seenIdsRef.current === null) {
                    seenIdsRef.current = new Set(list.map((n) => n.notificationId));
                } else {
                    list
                        .filter((n) => !n.isRead && !seenIdsRef.current.has(n.notificationId))
                        .forEach((n) => {
                            seenIdsRef.current.add(n.notificationId);
                            showToast({
                                type: 'achievement',
                                title: i18n.t('notifications.achievement_unlocked'),
                                message: n.title || '',
                                link: '/achievements'
                            });
                        });
                }
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            if (!silent) setLoadingItems(false);
        }
    }, [user?.userId, user?.gambler?.languageId, showToast]);

    useEffect(() => {
        if (!user?.userId) {
            setItems([]);
            setUnreadCount(0);
            seenIdsRef.current = null;
            return;
        }

        refreshNotifications({ silent: false });
        const interval = setInterval(() => refreshNotifications(), POLL_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [user?.userId, refreshNotifications]);

    const markAsRead = useCallback(async (notificationId) => {
        setItems((prev) => prev.map((n) => (
            n.notificationId === notificationId && !n.isRead
                ? { ...n, isRead: true, readAt: new Date().toISOString() }
                : n
        )));
        setUnreadCount((prev) => Math.max(0, prev - 1));

        try {
            await notificationService.markAsRead(notificationId);
        } catch (error) {
            console.error('Error marking notification as read:', error);
            refreshNotifications();
        }
    }, [refreshNotifications]);

    const markAllAsRead = useCallback(async () => {
        setItems((prev) => prev.map((n) => (n.isRead ? n : { ...n, isRead: true })));
        setUnreadCount(0);

        try {
            await notificationService.markAllAsRead();
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            refreshNotifications();
        }
    }, [refreshNotifications]);

    return (
        <NotificationContext.Provider value={{
            showToast,
            addToast,
            removeToast,
            notifications,
            items,
            unreadCount,
            loadingItems,
            refreshNotifications,
            markAsRead,
            markAllAsRead
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
