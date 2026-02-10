import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { useNotification } from './NotificationContext';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};

const HUB_URL = 'https://2evbm9ctw5.us-east-2.awsapprunner.com/chatHub';

export const ChatProvider = ({ children }) => {
    const [connection, setConnection] = useState(null);
    const [typingUsers, setTypingUsers] = useState({}); // { [chatId]: { [userId]: boolean } }
    const [activeChatId, setActiveChatId] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
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
    const handleSetActiveChatId = (id) => {
        console.log('--- CONTEXT: setActiveChatId called ---', { old: activeChatId, new: id });
        setActiveChatId(id);
    };

    // Ref to keep track of connection status to avoid multiple starts
    const connectingRef = useRef(false);
    const connectionRef = useRef(null);
    const activeChatIdRef = useRef(activeChatId);
    const { user } = useAuth();
    const userRef = useRef(user);

    // Keep refs in sync with state
    useEffect(() => {
        activeChatIdRef.current = activeChatId;
    }, [activeChatId]);

    useEffect(() => {
        userRef.current = user;
    }, [user]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Evitamos múltiples intentos simultáneos
        if (connectingRef.current || isConnected) return;
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
                const messageChatId = String(message.chatId || message.chatsId || message.ChatId || '');
                const senderId = String(message.sender?.userId || message.sender?.UserId || '');
                const currentUserId = String(userRef.current?.userId || '');

                console.log('--- SIGNALR MESSAGE RECEIVED ---', {
                    messageChatId,
                    activeChatId: activeChatIdRef.current,
                    senderId,
                    currentUserId,
                    shouldNotify: senderId !== currentUserId && String(activeChatIdRef.current) !== messageChatId
                });

                // Only show notification if:
                // 1. Message is NOT from the current user
                // 2. The chat is NOT the one currently being viewed
                if (senderId !== currentUserId && String(activeChatIdRef.current) !== messageChatId) {
                    // Update unread count
                    setUnreadCounts(prev => ({
                        ...prev,
                        [messageChatId]: (prev[messageChatId] || 0) + 1
                    }));

                    showToast({
                        title: message.sender?.nickName || message.sender?.name || 'Nuevo Mensaje',
                        message: message.content,
                        chatId: messageChatId,
                        sender: message.sender
                    });
                }

                window.dispatchEvent(new CustomEvent('new_chat_message', { detail: message }));
            });

            try {
                await hubConnection.start();
                console.log('--- SIGNALR CONNECTED !!! ---');
                connectionRef.current = hubConnection;
                setConnection(hubConnection);
                setIsConnected(true);
                setError(null);
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
    }, []); // Array vacío: Solo se ejecuta al montar el componente globalmente

    const joinChat = useCallback(async (chatId) => {
        const hub = connectionRef.current;
        const isReady = hub && hub.state === signalR.HubConnectionState.Connected;

        console.log('--- SIGNALR INVOKE: JoinChat ---', { chatId, ready: isReady });

        if (isReady) {
            try {
                await hub.invoke('JoinChat', String(chatId));
                console.log('--- SIGNALR SUCCESS: JoinChat ---', chatId);
            } catch (err) {
                console.error('Error joining chat:', err);
            }
        }
    }, []);

    const leaveChat = useCallback(async (chatId) => {
        const hub = connectionRef.current;
        const isReady = hub && hub.state === signalR.HubConnectionState.Connected;

        console.log('--- SIGNALR INVOKE: LeaveChat ---', { chatId, ready: isReady });

        if (isReady) {
            try {
                await hub.invoke('LeaveChat', String(chatId));
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
        typingUsers,
        unreadCounts,
        totalUnreadCount,
        activeChatId,
        setActiveChatId: handleSetActiveChatId,
        markAsRead,
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
