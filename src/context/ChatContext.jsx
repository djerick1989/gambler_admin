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

        if (!token || connectingRef.current || connection) return;

        connectingRef.current = true;

        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl(HUB_URL, {
                accessTokenFactory: () => token,
                skipNegotiation: true,
                transport: signalR.HttpTransportType.WebSockets
            })
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Information)
            .build();

        setConnection(newConnection);

        const startConnection = async () => {
            try {
                await newConnection.start();
                console.log('SignalR Connected');
                setIsConnected(true);
                setError(null);
            } catch (err) {
                console.error('SignalR Connection Error: ', err);
                setError(err.message);
                setTimeout(startConnection, 5000); // Retry after 5 seconds
            } finally {
                connectingRef.current = false;
            }
        };

        startConnection();

        newConnection.on('UserTyping', ({ chatId, userId, isTyping }) => {
            setTypingUsers(prev => ({
                ...prev,
                [chatId]: {
                    ...(prev[chatId] || {}),
                    [userId]: isTyping
                }
            }));
        });

        // We can also listen for new messages here if the Hub sends them via SignalR
        // but the request only mentioned REST for sending messages. 
        // Usually, Hubs have a "ReceiveMessage" event.
        newConnection.on('ReceiveMessage', (message) => {
            // This would be handled by triggering a state update in the UI if we had a global message store
            // or using a custom event/callback system.
            window.dispatchEvent(new CustomEvent('new_chat_message', { detail: message }));
        });

        return () => {
            if (newConnection) {
                newConnection.stop();
            }
        };
    }, []);

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
