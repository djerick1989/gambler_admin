import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { chatService } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { MessageSquare, BellOff, ArrowRight, User, Award, CheckCheck } from 'lucide-react';
import { formatChatTimestamp } from '../../utils/dateUtils';

const NotificationsPage = () => {
    const { t, i18n } = useTranslation();
    const i18nLocale = i18n?.language || 'en';
    const navigate = useNavigate();
    const { unreadCounts, totalUnreadCount } = useChat();
    const { user: currentUser } = useAuth();
    const {
        items: serverNotifications,
        unreadCount: unreadNotificationCount,
        markAsRead,
        markAllAsRead
    } = useNotification();
    const [allChats, setAllChats] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchChats = async () => {
            try {
                const response = await chatService.getChats();
                if (response.status && response.data) {
                    setAllChats(response.data);
                }
            } catch (error) {
                console.error('Error fetching chats in notifications:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchChats();
    }, []);

    // Filter chats that have unread messages
    const unreadChats = allChats.filter(chat => unreadCounts[String(chat.chatsId)] > 0);

    const handleChatClick = (chatId) => {
        navigate(`/chat/${chatId}`);
    };

    const handleNotificationClick = (notification) => {
        if (!notification.isRead) {
            markAsRead(notification.notificationId);
        }
        if (notification.type === 'ACHIEVEMENT') {
            navigate('/achievements');
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '2rem' }}>
                <p>{t('common.loading')}</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '0 1rem 1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    padding: '12px',
                    borderRadius: '12px'
                }}>
                    <MessageSquare size={32} color="#3b82f6" />
                </div>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: '800', margin: 0 }}>
                        {t('common.not_read')}
                    </h1>
                    <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                        {totalUnreadCount === 0
                            ? t('notifications.all_clear')
                            : totalUnreadCount === 1
                                ? t('notifications.pending_one')
                                : t('notifications.pending_many', { count: totalUnreadCount })}
                    </p>
                </div>
            </div>

            {serverNotifications.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.75rem',
                        gap: '1rem'
                    }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>
                            {t('notifications.achievements_section')}
                        </h2>
                        {unreadNotificationCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="btn btn-secondary"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    padding: '0.4rem 0.8rem',
                                    fontSize: '0.8rem'
                                }}
                            >
                                <CheckCheck size={16} />
                                {t('notifications.mark_all_read')}
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {serverNotifications.map(notification => (
                            <div
                                key={notification.notificationId}
                                className="glass-card"
                                style={{
                                    padding: '1rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    transition: 'transform 0.2s',
                                    borderLeft: `4px solid ${notification.isRead ? 'transparent' : 'var(--primary)'}`,
                                    opacity: notification.isRead ? 0.7 : 1
                                }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <div style={{
                                    width: '50px',
                                    height: '50px',
                                    borderRadius: '50%',
                                    background: 'rgba(212, 144, 0, 0.12)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <Award size={24} color="var(--primary)" />
                                </div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                                        <h4 style={{ margin: 0, fontSize: '1.05rem' }}>
                                            {t('notifications.achievement_unlocked')}
                                        </h4>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                                            {formatChatTimestamp(notification.createdAt, t, i18nLocale)}
                                        </span>
                                    </div>
                                    <p style={{
                                        margin: '4px 0 0 0',
                                        color: 'var(--text-muted)',
                                        fontSize: '0.9rem',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {notification.title || t('notifications.achievement_generic')}
                                    </p>
                                </div>

                                <ArrowRight size={20} style={{ opacity: 0.3 }} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {unreadChats.length === 0 ? (
                <div className="glass-card" style={{
                    padding: '4rem 2rem',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1rem'
                }}>
                    <BellOff size={64} style={{ opacity: 0.1 }} />
                    <h3 style={{ margin: 0 }}>{t('notifications.no_unread')}</h3>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                        {t('notifications.empty_state')}
                    </p>
                    <button
                        onClick={() => navigate('/chat')}
                        className="btn-primary"
                        style={{ marginTop: '1rem' }}
                    >
                        {t('notifications.go_to_chat')}
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {unreadChats.map(chat => (
                        <div
                            key={chat.chatsId}
                            className="glass-card"
                            style={{
                                padding: '1rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                transition: 'transform 0.2s',
                                borderLeft: '4px solid #ef4444'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            onClick={() => handleChatClick(chat.chatsId)}
                        >
                            <div style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '50%',
                                background: 'rgba(255,255,255,0.05)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden'
                            }}>
                                {chat.isGroup ? (
                                    <MessageSquare size={24} style={{ opacity: 0.5 }} />
                                ) : (
                                    <User size={24} style={{ opacity: 0.5 }} />
                                )}
                            </div>

                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h4 style={{ margin: 0, fontSize: '1.1rem' }}>
                                        {chat.name || chat.chatParticipants?.find(p => p.userId !== currentUser?.userId)?.nickName || 'Chat'}
                                    </h4>
                                    <span style={{
                                        background: '#ef4444',
                                        color: 'white',
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '0.8rem',
                                        fontWeight: 'bold'
                                    }}>
                                        {unreadCounts[chat.chatsId]}
                                    </span>
                                </div>
                                <p style={{
                                    margin: '4px 0 0 0',
                                    color: 'var(--text-muted)',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    fontSize: '0.9rem'
                                }}>
                                    {chat.lastMessage?.content || t('notifications.new_message')}
                                </p>
                            </div>

                            <ArrowRight size={20} style={{ opacity: 0.3 }} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;
