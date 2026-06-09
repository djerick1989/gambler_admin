import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { useNotification } from './NotificationContext';
import { useAuth } from './AuthContext';
import { chatService } from '../services/api';

const ChatContext = createContext();

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};

const HUB_URL = 'https://ga-c0745f1cf0154a6cab5f8599d47e9b0c.ecs.us-east-2.on.aws/chatHub';

export const ChatProvider = ({ children }) => {
    const [typingUsers, setTypingUsers] = useState({}); // { [chatId]: { [userId]: boolean } }
    const [activeChatId, setActiveChatId] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [chats, setChats] = useState([]);
    const [unreadCounts, setUnreadCounts] = useState({}); // { [chatId]: number }
    const [error, setError] = useState(null);
    const { showToast } = useNotification();

    // Calculate total unread count
    const totalUnreadCount = Object.values(unreadCounts).reduce((acc, count) => acc + count, 0);

    // Mark chat as read
    const markAsRead = useCallback((chatId) => {
        setUnreadCounts(prev => {
            if (!prev[chatId]) return prev;
            const newCounts = { ...prev };
            delete newCounts[chatId];
            return newCounts;
        });
    }, []);

    // Internal setter with logging
    const handleSetActiveChatId = useCallback((id) => {
        setActiveChatId(prev => {
            console.log('--- CONTEXT: setActiveChatId called ---', { old: prev, new: id });
            return id;
        });
    }, []);

    // Ref to keep track of connection status to avoid multiple starts
    const connectingRef = useRef(false);
    const connectionRef = useRef(null);
    const activeChatIdRef = useRef(activeChatId);
    const { user } = useAuth();
    const userRef = useRef(user);
    const chatsLoadedRef = useRef(false);
    const joinedChatIdsRef = useRef(new Set());
    const baseDocumentTitleRef = useRef(null);
    const baseFaviconHrefRef = useRef(null);
    const audioContextRef = useRef(null);
    const canPlayNotificationSoundRef = useRef(false);

    // Keep refs in sync with state
    useEffect(() => {
        activeChatIdRef.current = activeChatId;
    }, [activeChatId]);

    useEffect(() => {
        userRef.current = user;
    }, [user]);

    useEffect(() => {
        baseDocumentTitleRef.current = document.title || 'gambler_admin';
        const favicon = document.querySelector("link[rel~='icon']");
        baseFaviconHrefRef.current = favicon?.href || null;
    }, []);

    useEffect(() => {
        const enableNotificationSound = () => {
            canPlayNotificationSoundRef.current = true;
        };

        window.addEventListener('pointerdown', enableNotificationSound, { once: true });
        window.addEventListener('keydown', enableNotificationSound, { once: true });

        return () => {
            window.removeEventListener('pointerdown', enableNotificationSound);
            window.removeEventListener('keydown', enableNotificationSound);
        };
    }, []);

    const getFaviconLink = () => {
        let favicon = document.querySelector("link[rel~='icon']");
        if (!favicon) {
            favicon = document.createElement('link');
            favicon.rel = 'icon';
            document.head.appendChild(favicon);
        }
        return favicon;
    };

    const createUnreadFavicon = (count) => {
        const label = count > 9 ? '9+' : String(count);
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
                <rect width="64" height="64" rx="14" fill="#111827"/>
                <text x="18" y="43" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#ffffff">L</text>
                <circle cx="47" cy="17" r="15" fill="#ef4444"/>
                <text x="47" y="22" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="#ffffff">${label}</text>
            </svg>
        `;
        return `data:image/svg+xml,${encodeURIComponent(svg)}`;
    };

    const playNotificationSound = useCallback(() => {
        if (!canPlayNotificationSoundRef.current) return;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;

            const audioContext = audioContextRef.current || new AudioContext();
            audioContextRef.current = audioContext;

            if (audioContext.state === 'suspended') {
                audioContext.resume().catch(() => { });
            }

            const now = audioContext.currentTime;
            const gain = audioContext.createGain();
            gain.gain.setValueAtTime(0.0001, now);
            gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
            gain.connect(audioContext.destination);

            [880, 1175].forEach((frequency, index) => {
                const oscillator = audioContext.createOscillator();
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(frequency, now + index * 0.08);
                oscillator.connect(gain);
                oscillator.start(now + index * 0.08);
                oscillator.stop(now + index * 0.08 + 0.18);
            });
        } catch (err) {
            console.warn('Notification sound could not be played:', err);
        }
    }, []);

    useEffect(() => {
        const baseTitle = baseDocumentTitleRef.current || 'gambler_admin';
        const favicon = getFaviconLink();

        if (totalUnreadCount > 0) {
            const messageLabel = totalUnreadCount === 1 ? 'Nuevo mensaje' : 'Nuevos mensajes';
            document.title = `(${totalUnreadCount}) ${messageLabel} - ${baseTitle}`;
            favicon.href = createUnreadFavicon(totalUnreadCount);
            return;
        }

        document.title = baseTitle;
        if (baseFaviconHrefRef.current) {
            favicon.href = baseFaviconHrefRef.current;
        }
    }, [totalUnreadCount]);

    const normalizeChatId = (value) => String(value || '');

    const getMessageChatId = (message) => normalizeChatId(message.chatId || message.chatsId || message.ChatId);

    const getMessageSender = (message) => message.sender || message.Sender || {};

    const getMessageSenderId = (message) => {
        const sender = getMessageSender(message);
        return normalizeChatId(sender.userId || sender.UserId);
    };

    const invokeJoinChat = useCallback(async (chatId) => {
        const normalizedChatId = normalizeChatId(chatId);
        const hub = connectionRef.current;
        const isReady = hub && hub.state === signalR.HubConnectionState.Connected;

        console.log('--- SIGNALR INVOKE: JoinChat ---', { chatId: normalizedChatId, ready: isReady });

        if (!normalizedChatId || !isReady || joinedChatIdsRef.current.has(normalizedChatId)) return;

        try {
            await hub.invoke('JoinChat', normalizedChatId);
            joinedChatIdsRef.current.add(normalizedChatId);
            console.log('--- SIGNALR SUCCESS: JoinChat ---', normalizedChatId);
        } catch (err) {
            console.error('Error joining chat:', err);
        }
    }, []);

    const joinKnownChats = useCallback(async (chatList) => {
        if (!Array.isArray(chatList) || chatList.length === 0) return;

        await Promise.all(
            chatList
                .map(chat => normalizeChatId(chat?.chatsId))
                .filter(Boolean)
                .map(chatId => invokeJoinChat(chatId))
        );
    }, [invokeJoinChat]);

    const sortChatsByLastMessage = useCallback((chatList) => {
        return [...chatList].sort((a, b) => {
            const dateA = a.lastMessageAt ? new Date(a.lastMessageAt) : new Date(0);
            const dateB = b.lastMessageAt ? new Date(b.lastMessageAt) : new Date(0);
            return dateB - dateA;
        });
    }, []);

    const upsertChat = useCallback((chat) => {
        if (!chat?.chatsId) return;

        setChats(prev => {
            const exists = prev.some(c => normalizeChatId(c.chatsId) === normalizeChatId(chat.chatsId));
            const next = exists
                ? prev.map(c => normalizeChatId(c.chatsId) === normalizeChatId(chat.chatsId) ? { ...c, ...chat } : c)
                : [chat, ...prev];

            return sortChatsByLastMessage(next);
        });
    }, [sortChatsByLastMessage]);

    const refreshChats = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            chatsLoadedRef.current = false;
            setChats([]);
            setUnreadCounts({});
            return [];
        }

        try {
            const response = await chatService.getChats();
            const chatList = sortChatsByLastMessage(response.data || []);
            setChats(chatList);
            chatsLoadedRef.current = true;
            await joinKnownChats(chatList);
            return chatList;
        } catch (err) {
            console.error('Error refreshing chats:', err);
            return [];
        }
    }, [joinKnownChats, sortChatsByLastMessage]);

    useEffect(() => {
        if (!user) {
            chatsLoadedRef.current = false;
            queueMicrotask(() => {
                setChats([]);
                setUnreadCounts({});
            });
            return;
        }

        queueMicrotask(() => {
            refreshChats();
        });
    }, [user, refreshChats]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token || !user) {
            const hub = connectionRef.current;
            if (hub) {
                hub.stop().catch(err => console.error('Error stopping SignalR connection:', err));
                connectionRef.current = null;
            }
            joinedChatIdsRef.current.clear();
            connectingRef.current = false;
            queueMicrotask(() => setIsConnected(false));
            return;
        }

        // Evitamos múltiples intentos simultáneos
        if (connectingRef.current || connectionRef.current?.state === signalR.HubConnectionState.Connected) return;
        connectingRef.current = true;

        const startConnection = async () => {
            console.log('--- SIGNALR PRODUCTION CONFIG (ALL TRANSPORTS) ---');
            console.log('URL:', HUB_URL);

            const hubConnection = new signalR.HubConnectionBuilder()
                .withUrl(HUB_URL, {
                    accessTokenFactory: () => localStorage.getItem('token'),
                    // Permitimos todos los transportes. SignalR elegirá el mejor (WebSockets -> SSE -> Long Polling)
                    transport: signalR.HttpTransportType.WebSockets |
                        signalR.HttpTransportType.ServerSentEvents |
                        signalR.HttpTransportType.LongPolling
                })
                .withAutomaticReconnect()
                .configureLogging(signalR.LogLevel.Information)
                .build();

            hubConnection.onreconnecting((err) => {
                console.warn('--- SIGNALR RECONNECTING ---', err);
                setIsConnected(false);
            });

            hubConnection.onreconnected(async () => {
                console.log('--- SIGNALR RECONNECTED ---');
                joinedChatIdsRef.current.clear();
                setIsConnected(true);
                setError(null);
                await refreshChats();
            });

            hubConnection.onclose((err) => {
                console.warn('--- SIGNALR CLOSED ---', err);
                connectionRef.current = null;
                connectingRef.current = false;
                joinedChatIdsRef.current.clear();
                setIsConnected(false);
            });

            hubConnection.on('UserTyping', (data) => {
                // Handle both camelCase and PascalCase (common in .NET SignalR)
                const chatId = data.chatId || data.ChatId;
                const userId = data.userId || data.UserId;
                const isTyping = data.isTyping !== undefined ? data.isTyping : data.IsTyping;

                console.log('--- SIGNALR TYPING EVENT ---', { chatId, userId, isTyping });

                setTypingUsers(prev => ({
                    ...prev,
                    [chatId]: {
                        ...(prev[chatId] || {}),
                        [userId]: isTyping
                    }
                }));
            });

            hubConnection.on('ReceiveMessage', (message) => {
                const messageChatId = getMessageChatId(message);
                const sender = getMessageSender(message);
                const senderId = getMessageSenderId(message);
                const currentUserId = String(userRef.current?.userId || '');
                const isWindowActive = document.visibilityState === 'visible' && document.hasFocus();
                const isViewingMessageChat = String(activeChatIdRef.current) === messageChatId && isWindowActive;

                console.log('--- SIGNALR MESSAGE RECEIVED ---', {
                    messageChatId,
                    activeChatId: activeChatIdRef.current,
                    senderId,
                    currentUserId,
                    isWindowActive,
                    shouldNotify: senderId !== currentUserId && !isViewingMessageChat
                });

                // Only show notification if:
                // 1. Message is NOT from the current user
                // 2. The chat is not being actively viewed in the focused browser tab
                if (senderId !== currentUserId && !isViewingMessageChat) {
                    // Update unread count
                    setUnreadCounts(prev => ({
                        ...prev,
                        [messageChatId]: (prev[messageChatId] || 0) + 1
                    }));

                    showToast({
                        title: sender?.nickName || sender?.name || sender?.NickName || sender?.Name || 'Nuevo Mensaje',
                        message: message.content,
                        chatId: messageChatId,
                        sender
                    });
                    playNotificationSound();
                }

                setChats(prev => {
                    const exists = prev.some(c => normalizeChatId(c.chatsId) === messageChatId);
                    if (!exists) {
                        if (chatsLoadedRef.current) {
                            refreshChats();
                        }
                        return prev;
                    }

                    return sortChatsByLastMessage(prev.map(c =>
                        normalizeChatId(c.chatsId) === messageChatId
                            ? { ...c, lastMessage: message, lastMessageAt: message.createdAt || new Date().toISOString() }
                            : c
                    ));
                });

                window.dispatchEvent(new CustomEvent('new_chat_message', { detail: message }));
            });

            hubConnection.on('ChatCreated', async (data) => {
                const chatId = normalizeChatId(data?.chatId || data?.ChatId);
                console.log('--- SIGNALR CHAT CREATED ---', { chatId });
                await refreshChats();
            });

            try {
                await hubConnection.start();
                console.log('--- SIGNALR CONNECTED !!! ---');
                connectionRef.current = hubConnection;
                connectingRef.current = false;
                setIsConnected(true);
                setError(null);
                await refreshChats();
            } catch (err) {
                console.error('--- SIGNALR FAILED ---');
                console.group('Diagnostic Detail');
                console.error('Error Message:', err.message);
                console.error('Possible Root Cause: AWS App Runner Multi-Instance without Sticky Sessions.');
                console.warn('Action Required: Set AWS App Runner "Max Instances" to 1 OR ensure Redis Backplane is working on the Backend.');
                console.groupEnd();

                setError(err.message);
                // Reintento tras 10 segundos
                setTimeout(() => {
                    connectingRef.current = false;
                    startConnection();
                }, 10000);
            }
        };

        startConnection();

        return () => {
            // No detenemos la conexión aquí en desarrollo para evitar cortes por re-renders
        };
    }, [joinKnownChats, playNotificationSound, refreshChats, user]);

    const joinChat = useCallback(async (chatId) => {
        await invokeJoinChat(chatId);
    }, [invokeJoinChat]);

    const leaveChat = useCallback(async (chatId) => {
        const hub = connectionRef.current;
        const isReady = hub && hub.state === signalR.HubConnectionState.Connected;

        console.log('--- SIGNALR INVOKE: LeaveChat ---', { chatId, ready: isReady });

        if (isReady) {
            try {
                await hub.invoke('LeaveChat', String(chatId));
                joinedChatIdsRef.current.delete(normalizeChatId(chatId));
                console.log('--- SIGNALR SUCCESS: LeaveChat ---', chatId);
            } catch (err) {
                console.error('Error leaving chat:', err);
            }
        }
    }, []);

    const sendTypingStatus = useCallback(async (chatId, isTyping) => {
        const hub = connectionRef.current;
        const isReady = hub && hub.state === signalR.HubConnectionState.Connected;

        console.log('--- SIGNALR INVOKE: SendTypingStatus ---', { chatId, isTyping, ready: isReady });

        if (isReady) {
            try {
                await hub.invoke('SendTypingStatus', String(chatId), isTyping);
                console.log('--- SIGNALR SUCCESS: SendTypingStatus ---', { chatId, isTyping });
            } catch (err) {
                console.error('Error sending typing status:', err);
            }
        }
    }, []);

    const value = {
        isConnected,
        error,
        chats,
        typingUsers,
        unreadCounts,
        totalUnreadCount,
        activeChatId,
        setActiveChatId: handleSetActiveChatId,
        markAsRead,
        refreshChats,
        upsertChat,
        joinChat,
        leaveChat,
        sendTypingStatus
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
};
