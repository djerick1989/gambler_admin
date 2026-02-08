import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import * as signalR from '@microsoft/signalr';

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
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);

    // Ref to keep track of connection status to avoid multiple starts
    const connectingRef = useRef(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Evitamos múltiples intentos simultáneos
        if (connectingRef.current || isConnected) return;
        connectingRef.current = true;

        const startConnection = async () => {
            console.log('--- SIGNALR CONNECTION STARTING ---');

            const hubConnection = new signalR.HubConnectionBuilder()
                .withUrl(HUB_URL, {
                    accessTokenFactory: () => localStorage.getItem('token'),
                    skipNegotiation: true, // Crucial para AWS App Runner
                    transport: signalR.HttpTransportType.WebSockets
                })
                .withAutomaticReconnect()
                .configureLogging(signalR.LogLevel.Information)
                .build();

            hubConnection.on('UserTyping', ({ chatId, userId, isTyping }) => {
                setTypingUsers(prev => ({
                    ...prev,
                    [chatId]: {
                        ...(prev[chatId] || {}),
                        [userId]: isTyping
                    }
                }));
            });

            hubConnection.on('ReceiveMessage', (message) => {
                window.dispatchEvent(new CustomEvent('new_chat_message', { detail: message }));
            });

            try {
                await hubConnection.start();
                console.log('--- SIGNALR CONNECTED !!! ---');
                setConnection(hubConnection);
                setIsConnected(true);
                setError(null);
            } catch (err) {
                console.error('--- SIGNALR FAILED ---', err);
                setError(err.message);
                // Reintento tras 5 segundos
                setTimeout(() => {
                    connectingRef.current = false;
                    startConnection();
                }, 5000);
            }
        };

        startConnection();

        return () => {
            // No detenemos la conexión aquí en desarrollo para evitar cortes por re-renders
        };
    }, []); // Array vacío: Solo se ejecuta al montar el componente globalmente

    const joinChat = useCallback(async (chatId) => {
        if (connection && isConnected) {
            try {
                await connection.invoke('JoinChat', chatId);
            } catch (err) {
                console.error('Error joining chat:', err);
            }
        }
    }, [connection, isConnected]);

    const leaveChat = useCallback(async (chatId) => {
        if (connection && isConnected) {
            try {
                await connection.invoke('LeaveChat', chatId);
            } catch (err) {
                console.error('Error leaving chat:', err);
            }
        }
    }, [connection, isConnected]);

    const sendTypingStatus = useCallback(async (chatId, isTyping) => {
        if (connection && isConnected) {
            try {
                await connection.invoke('SendTypingStatus', chatId, isTyping);
            } catch (err) {
                console.error('Error sending typing status:', err);
            }
        }
    }, [connection, isConnected]);

    const value = {
        isConnected,
        error,
        typingUsers,
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
