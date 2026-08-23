import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../services/api';

const HealthAgentRealtimeContext = createContext(null);

const HUB_URL = `${API_BASE_URL}/healthAgentHub`;

const normalizeId = (value) => String(value || '');

const isNegotiationAbort = (err) => {
    const message = String(err?.message || err || '').toLowerCase();
    return message.includes('stopped during negotiation') ||
        message.includes('aborterror') ||
        message.includes('aborted');
};

export const HealthAgentRealtimeProvider = ({ children }) => {
    const { user } = useAuth();
    const [isConnected, setIsConnected] = useState(false);
    const [agentPresence, setAgentPresence] = useState([]);
    const connectionRef = useRef(null);
    const connectionUserIdRef = useRef('');
    const connectingRef = useRef(false);
    const joinedConversationsRef = useRef(new Set());
    const userId = normalizeId(user?.userId || user?.UserId || user?.id || user?.Id);

    const upsertPresence = useCallback((agent) => {
        if (!agent?.userId) return;
        setAgentPresence(prev => {
            const exists = prev.some(item => normalizeId(item.userId) === normalizeId(agent.userId));
            return exists
                ? prev.map(item => normalizeId(item.userId) === normalizeId(agent.userId) ? { ...item, ...agent } : item)
                : [...prev, agent];
        });
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token || !userId) {
            if (connectionRef.current) {
                connectionRef.current.stop().catch(() => { });
                connectionRef.current = null;
            }
            connectionUserIdRef.current = '';
            connectingRef.current = false;
            joinedConversationsRef.current.clear();
            setIsConnected(false);
            setAgentPresence([]);
            return;
        }

        if (connectionRef.current && connectionUserIdRef.current && connectionUserIdRef.current !== userId) {
            connectionRef.current.stop().catch(() => { });
            connectionRef.current = null;
            connectionUserIdRef.current = '';
            connectingRef.current = false;
            joinedConversationsRef.current.clear();
            setIsConnected(false);
        }

        const currentState = connectionRef.current?.state;
        if (connectingRef.current ||
            currentState === signalR.HubConnectionState.Connected ||
            currentState === signalR.HubConnectionState.Connecting ||
            currentState === signalR.HubConnectionState.Reconnecting) {
            return;
        }

        connectingRef.current = true;

        const hubConnection = new signalR.HubConnectionBuilder()
            .withUrl(HUB_URL, {
                accessTokenFactory: () => localStorage.getItem('token'),
                transport: signalR.HttpTransportType.WebSockets |
                    signalR.HttpTransportType.ServerSentEvents |
                    signalR.HttpTransportType.LongPolling
            })
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Warning)
            .build();

        connectionRef.current = hubConnection;
        connectionUserIdRef.current = userId;

        hubConnection.on('HealthConversationUpdated', (conversation) => {
            window.dispatchEvent(new CustomEvent('health-agent:conversation-updated', { detail: conversation }));
        });

        hubConnection.on('HealthAgentRequested', (conversation) => {
            window.dispatchEvent(new CustomEvent('health-agent:requested', { detail: conversation }));
        });

        hubConnection.on('AgentPresenceSnapshot', (agents) => {
            setAgentPresence(Array.isArray(agents) ? agents : []);
        });

        hubConnection.on('AgentPresenceChanged', upsertPresence);

        hubConnection.onreconnected(async () => {
            setIsConnected(true);
            const conversations = Array.from(joinedConversationsRef.current);
            joinedConversationsRef.current.clear();
            await Promise.all(conversations.map(id => hubConnection.invoke('JoinConversation', id).catch(() => { })));
            conversations.forEach(id => joinedConversationsRef.current.add(id));
        });

        hubConnection.onreconnecting(() => setIsConnected(false));
        hubConnection.onclose(() => {
            if (connectionRef.current === hubConnection) {
                connectionRef.current = null;
                connectionUserIdRef.current = '';
                connectingRef.current = false;
                joinedConversationsRef.current.clear();
                setIsConnected(false);
            }
        });

        hubConnection.start()
            .then(() => {
                if (connectionRef.current !== hubConnection) {
                    hubConnection.stop().catch(() => { });
                    return;
                }
                connectingRef.current = false;
                setIsConnected(true);
            })
            .catch((err) => {
                if (!isNegotiationAbort(err)) {
                    console.error('Health agent realtime connection failed:', err);
                }
                if (connectionRef.current === hubConnection) {
                    connectionRef.current = null;
                    connectionUserIdRef.current = '';
                    connectingRef.current = false;
                    joinedConversationsRef.current.clear();
                    setIsConnected(false);
                }
            });

        return () => {
            // React remonta efectos en desarrollo; detener aqui corta la negociacion
            // de SignalR. La conexion se cierra al cerrar sesion o cambiar de usuario.
        };
    }, [upsertPresence, userId]);

    const joinConversation = useCallback(async (conversationId) => {
        const id = normalizeId(conversationId);
        const hub = connectionRef.current;
        if (!id || !hub || hub.state !== signalR.HubConnectionState.Connected || joinedConversationsRef.current.has(id)) return;
        try {
            await hub.invoke('JoinConversation', id);
            joinedConversationsRef.current.add(id);
        } catch (err) {
            console.error('Error joining health agent conversation:', err);
        }
    }, []);

    const leaveConversation = useCallback(async (conversationId) => {
        const id = normalizeId(conversationId);
        const hub = connectionRef.current;
        if (!id || !hub || hub.state !== signalR.HubConnectionState.Connected) return;
        try {
            await hub.invoke('LeaveConversation', id);
            joinedConversationsRef.current.delete(id);
        } catch (err) {
            console.error('Error leaving health agent conversation:', err);
        }
    }, []);

    const setAgentAvailability = useCallback(async (isAvailable) => {
        const hub = connectionRef.current;
        if (!hub || hub.state !== signalR.HubConnectionState.Connected) return;
        try {
            await hub.invoke('SetAgentAvailability', Boolean(isAvailable));
        } catch (err) {
            console.error('Error updating health agent availability:', err);
        }
    }, []);

    const value = useMemo(() => ({
        isConnected,
        agentPresence,
        joinConversation,
        leaveConversation,
        setAgentAvailability
    }), [agentPresence, isConnected, joinConversation, leaveConversation, setAgentAvailability]);

    return (
        <HealthAgentRealtimeContext.Provider value={value}>
            {children}
        </HealthAgentRealtimeContext.Provider>
    );
};

export const useHealthAgentRealtime = () => {
    const context = useContext(HealthAgentRealtimeContext);
    if (!context) {
        throw new Error('useHealthAgentRealtime must be used within a HealthAgentRealtimeProvider');
    }
    return context;
};
