import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, CheckCircle2, FileText, Headphones, Loader2, Send, Trash2, Upload, UserPlus, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { healthAgentService } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { useHealthAgentRealtime } from '../../context/HealthAgentRealtimeContext';
import './HealthAgentAdmin.css';

const unwrapApiData = (response) => {
    const data = response?.data ?? response;
    return data?.data !== undefined ? data.data : data;
};

const toArray = (value) => {
    const data = unwrapApiData(value);
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.messages)) return data.messages;
    if (Array.isArray(data?.$values)) return data.$values;
    return data ? [data] : [];
};

const stripHtml = (value = '') => {
    const div = document.createElement('div');
    div.innerHTML = String(value);
    return div.textContent || div.innerText || '';
};

const HealthAgentAdmin = () => {
    const { i18n } = useTranslation();
    const { addToast } = useNotification();
    const { agentPresence, joinConversation, leaveConversation, setAgentAvailability } = useHealthAgentRealtime();
    const locale = i18n.language?.startsWith('es') ? 'es' : 'en';
    const text = {
        title: locale === 'es' ? 'Asistencia IA' : 'AI Assistance',
        subtitle: locale === 'es'
            ? 'Entrena el asistente y atiende conversaciones que requieren apoyo humano.'
            : 'Train the assistant and handle conversations that need human support.',
        docs: locale === 'es' ? 'Base de conocimiento' : 'Knowledge base',
        feedback: locale === 'es' ? 'Feedback pendiente' : 'Pending feedback',
        queue: locale === 'es' ? 'Cola humana' : 'Human queue',
        agents: locale === 'es' ? 'Agentes disponibles' : 'Available agents',
        agentAdmin: locale === 'es' ? 'Equipo de agentes' : 'Agent team',
        noAgents: locale === 'es' ? 'No hay agentes registrados.' : 'No agents registered.',
        nickName: locale === 'es' ? 'Usuario' : 'Username',
        name: locale === 'es' ? 'Nombre' : 'Name',
        email: 'Email',
        password: locale === 'es' ? 'Contrasena temporal' : 'Temporary password',
        createAgent: locale === 'es' ? 'Crear agente' : 'Create agent',
        agentCreated: locale === 'es' ? 'Agente creado correctamente.' : 'Agent created successfully.',
        upload: locale === 'es' ? 'Subir documento' : 'Upload document',
        onlyText: locale === 'es' ? 'Usa archivos .txt o .md para que puedan indexarse correctamente.' : 'Use .txt or .md files so they can be indexed correctly.',
        noDocs: locale === 'es' ? 'No hay documentos cargados.' : 'No documents uploaded.',
        noFeedback: locale === 'es' ? 'No hay feedback pendiente.' : 'No pending feedback.',
        noQueue: locale === 'es' ? 'No hay conversaciones esperando agente.' : 'No conversations waiting for an agent.',
        replyPlaceholder: locale === 'es' ? 'Escribe una respuesta humana...' : 'Write a human reply...',
        send: locale === 'es' ? 'Responder' : 'Reply',
        selectConversation: locale === 'es' ? 'Selecciona una conversación para atenderla.' : 'Select a conversation to handle it.',
        notified: locale === 'es' ? 'Nueva conversación esperando agente.' : 'New conversation waiting for an agent.',
        queueUnavailable: locale === 'es'
            ? 'La cola humana todavia no esta disponible en el backend desplegado.'
            : 'The human queue is not available in the deployed backend yet.'
    };

    const [documents, setDocuments] = useState([]);
    const [feedback, setFeedback] = useState([]);
    const [queue, setQueue] = useState([]);
    const [agentProfiles, setAgentProfiles] = useState([]);
    const [agentForm, setAgentForm] = useState({ nickName: '', name: '', email: '', password: '' });
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [reply, setReply] = useState('');
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [creatingAgent, setCreatingAgent] = useState(false);
    const [queueAvailable, setQueueAvailable] = useState(true);
    const lastQueueCount = useRef(0);

    const selectedMessages = useMemo(() => toArray(selectedConversation?.messages), [selectedConversation]);

    const loadAll = async ({ notifyNew = false } = {}) => {
        try {
            const [docsResponse, feedbackResponse, agentsResponse] = await Promise.all([
                healthAgentService.getDocuments(),
                healthAgentService.getPendingFeedback(),
                healthAgentService.getAgentProfiles().catch(() => [])
            ]);
            const nextDocs = toArray(docsResponse);
            const nextFeedback = toArray(feedbackResponse);
            const nextAgents = toArray(agentsResponse);
            let nextQueue = queue;
            if (queueAvailable) {
                try {
                    const queueResponse = await healthAgentService.getAgentQueue();
                    nextQueue = toArray(queueResponse);
                    if (notifyNew && nextQueue.length > lastQueueCount.current) {
                        addToast('info', text.notified);
                    }
                    lastQueueCount.current = nextQueue.length;
                } catch (err) {
                    if (err?.response?.status === 404) {
                        setQueueAvailable(false);
                        nextQueue = [];
                    } else {
                        throw err;
                    }
                }
            }
            setDocuments(nextDocs);
            setFeedback(nextFeedback);
            setAgentProfiles(nextAgents);
            setQueue(nextQueue);
            if (selectedConversation) {
                const updated = nextQueue.find(item => item.conversationId === selectedConversation.conversationId);
                if (updated) setSelectedConversation(updated);
            }
        } catch (err) {
            console.error('Error loading health agent admin:', err);
            addToast('error', locale === 'es' ? 'No se pudo cargar la asistencia IA.' : 'AI assistance could not be loaded.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAll();
        const id = window.setInterval(() => loadAll({ notifyNew: true }), 15000);
        return () => window.clearInterval(id);
    }, [locale]);

    useEffect(() => {
        setAgentAvailability(true);
        return () => setAgentAvailability(false);
    }, [setAgentAvailability]);

    useEffect(() => {
        const conversationId = selectedConversation?.conversationId;
        if (!conversationId) return undefined;
        joinConversation(conversationId);
        return () => leaveConversation(conversationId);
    }, [joinConversation, leaveConversation, selectedConversation?.conversationId]);

    useEffect(() => {
        const handleConversationUpdated = (event) => {
            const data = event.detail;
            if (!data?.conversationId) return;
            setQueue(prev => {
                const exists = prev.some(item => item.conversationId === data.conversationId);
                if (exists) return prev.map(item => item.conversationId === data.conversationId ? data : item);
                return [data, ...prev];
            });
            setSelectedConversation(prev => prev?.conversationId === data.conversationId ? data : prev);
        };

        const handleAgentRequested = (event) => {
            const data = event.detail;
            if (data?.conversationId) {
                setQueue(prev => prev.some(item => item.conversationId === data.conversationId) ? prev : [data, ...prev]);
                addToast('info', text.notified);
            }
        };

        window.addEventListener('health-agent:conversation-updated', handleConversationUpdated);
        window.addEventListener('health-agent:requested', handleAgentRequested);
        return () => {
            window.removeEventListener('health-agent:conversation-updated', handleConversationUpdated);
            window.removeEventListener('health-agent:requested', handleAgentRequested);
        };
    }, [addToast, text.notified]);

    const handleUpload = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('language', locale);
        formData.append('category', 'assistance');
        formData.append('version', '1.0');
        setUploading(true);
        try {
            await healthAgentService.uploadDocument(formData);
            addToast('success', locale === 'es' ? 'Documento cargado e indexado.' : 'Document uploaded and indexed.');
            await loadAll();
        } catch (err) {
            console.error('Error uploading health document:', err);
            addToast('error', locale === 'es' ? 'No se pudo cargar el documento. Usa .txt o .md.' : 'Document could not be uploaded. Use .txt or .md.');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteDocument = async (id) => {
        try {
            await healthAgentService.deleteDocument(id);
            setDocuments(prev => prev.filter(item => item.id !== id));
            addToast('success', locale === 'es' ? 'Documento eliminado.' : 'Document deleted.');
        } catch (err) {
            console.error('Error deleting health document:', err);
            addToast('error', locale === 'es' ? 'No se pudo eliminar el documento.' : 'Document could not be deleted.');
        }
    };

    const handleApproveFeedback = async (id) => {
        try {
            await healthAgentService.approveFeedback(id);
            setFeedback(prev => prev.filter(item => item.id !== id));
            addToast('success', locale === 'es' ? 'Feedback aprobado como conocimiento.' : 'Feedback approved as knowledge.');
        } catch (err) {
            console.error('Error approving feedback:', err);
            addToast('error', locale === 'es' ? 'No se pudo aprobar el feedback.' : 'Feedback could not be approved.');
        }
    };

    const handleRegisterAgent = async (event) => {
        event.preventDefault();
        const payload = {
            nickName: agentForm.nickName.trim(),
            name: agentForm.name.trim(),
            email: agentForm.email.trim(),
            password: agentForm.password,
            languageCode: locale.toUpperCase()
        };
        if (!payload.nickName || !payload.name || !payload.email || !payload.password) return;

        setCreatingAgent(true);
        try {
            await healthAgentService.registerAgent(payload);
            setAgentForm({ nickName: '', name: '', email: '', password: '' });
            addToast('success', text.agentCreated);
            await loadAll();
        } catch (err) {
            console.error('Error creating health agent:', err);
            addToast('error', locale === 'es' ? 'No se pudo crear el agente.' : 'Agent could not be created.');
        } finally {
            setCreatingAgent(false);
        }
    };

    const handleSelectConversation = async (conversation) => {
        setSelectedConversation(conversation);
        try {
            const response = await healthAgentService.getAgentConversation(conversation.conversationId);
            setSelectedConversation(unwrapApiData(response));
        } catch (err) {
            console.error('Error loading agent conversation:', err);
        }
    };

    const handleReply = async (event) => {
        event.preventDefault();
        const value = reply.trim();
        if (!selectedConversation || !value) return;
        setSending(true);
        try {
            const response = await healthAgentService.replyAsAgent(selectedConversation.conversationId, value);
            setSelectedConversation(unwrapApiData(response));
            setReply('');
            await loadAll();
        } catch (err) {
            console.error('Error sending agent reply:', err);
            addToast('error', locale === 'es' ? 'No se pudo enviar la respuesta.' : 'Reply could not be sent.');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="health-admin-page">
            <header className="health-admin-hero">
                <Bot size={34} />
                <div>
                    <h1>{text.title}</h1>
                    <p>{text.subtitle}</p>
                </div>
            </header>

            {loading ? (
                <div className="health-admin-loading"><Loader2 className="animate-spin" /> Loading...</div>
            ) : (
                <div className="health-admin-grid">
                    <section className="health-admin-card">
                        <div className="health-admin-card-head">
                            <h2><FileText size={21} /> {text.docs}</h2>
                            <label className="health-upload-button">
                                {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                                {text.upload}
                                <input type="file" accept=".txt,.md,.markdown,text/plain,text/markdown" onChange={handleUpload} disabled={uploading} />
                            </label>
                        </div>
                        <p className="health-admin-note">{text.onlyText}</p>
                        <div className="health-list">
                            {documents.length ? documents.map(item => (
                                <div className="health-row" key={item.id}>
                                    <span>
                                        <strong>{item.name}</strong>
                                        <small>{item.status} · {item.language || 'n/a'}</small>
                                    </span>
                                    <button type="button" onClick={() => handleDeleteDocument(item.id)}><Trash2 size={16} /></button>
                                </div>
                            )) : <p className="health-empty">{text.noDocs}</p>}
                        </div>
                    </section>

                    <section className="health-admin-card">
                        <div className="health-admin-card-head">
                            <h2><CheckCircle2 size={21} /> {text.feedback}</h2>
                        </div>
                        <div className="health-list">
                            {feedback.length ? feedback.map(item => (
                                <div className="health-feedback-row" key={item.id}>
                                    <strong>{item.rating}/5</strong>
                                    <p>{item.suggestedResponse || item.correction || 'Sin comentario'}</p>
                                    <button type="button" onClick={() => handleApproveFeedback(item.id)}>{locale === 'es' ? 'Aprobar' : 'Approve'}</button>
                                </div>
                            )) : <p className="health-empty">{text.noFeedback}</p>}
                        </div>
                    </section>

                    <section className="health-admin-card">
                        <div className="health-admin-card-head">
                            <h2><Users size={21} /> {text.agentAdmin}</h2>
                        </div>
                        <form className="health-agent-form" onSubmit={handleRegisterAgent}>
                            <input
                                value={agentForm.nickName}
                                onChange={(event) => setAgentForm(prev => ({ ...prev, nickName: event.target.value }))}
                                placeholder={text.nickName}
                            />
                            <input
                                value={agentForm.name}
                                onChange={(event) => setAgentForm(prev => ({ ...prev, name: event.target.value }))}
                                placeholder={text.name}
                            />
                            <input
                                value={agentForm.email}
                                onChange={(event) => setAgentForm(prev => ({ ...prev, email: event.target.value }))}
                                placeholder={text.email}
                                type="email"
                            />
                            <input
                                value={agentForm.password}
                                onChange={(event) => setAgentForm(prev => ({ ...prev, password: event.target.value }))}
                                placeholder={text.password}
                                type="password"
                            />
                            <button type="submit" disabled={creatingAgent}>
                                {creatingAgent ? <Loader2 size={17} className="animate-spin" /> : <UserPlus size={17} />}
                                {text.createAgent}
                            </button>
                        </form>
                        <div className="health-list">
                            {agentProfiles.length ? agentProfiles.map(agent => (
                                <div className="health-row" key={agent.userId || agent.email}>
                                    <span>
                                        <strong>{agent.name || agent.nickName || agent.email}</strong>
                                        <small>{agent.email} · {agent.role}</small>
                                    </span>
                                </div>
                            )) : <p className="health-empty">{text.noAgents}</p>}
                        </div>
                    </section>

                    <section className="health-admin-card health-queue-card">
                        <div className="health-admin-card-head">
                            <h2><Headphones size={21} /> {text.queue}</h2>
                            <span>{queue.length}</span>
                        </div>
                        <div className="health-agent-presence">
                            <strong>{text.agents}</strong>
                            <div>
                                {agentPresence.length ? agentPresence.map(agent => (
                                    <span key={agent.userId} className={agent.isOnline && agent.isAvailable ? 'online' : ''}>
                                        <i />
                                        {agent.name || agent.nickName || agent.email || 'Agent'}
                                    </span>
                                )) : <em>{locale === 'es' ? 'Sin agentes conectados' : 'No agents connected'}</em>}
                            </div>
                        </div>
                        <div className="health-queue-layout">
                            <div className="health-queue-list">
                                {queue.length ? queue.map(item => {
                                    const last = toArray(item.messages).slice(-1)[0];
                                    const active = item.conversationId === selectedConversation?.conversationId;
                                    return (
                                        <button
                                            type="button"
                                            className={active ? 'active' : ''}
                                            key={item.conversationId}
                                            onClick={() => handleSelectConversation(item)}
                                        >
                                            <strong>{item.userNickName || item.userName || item.userId}</strong>
                                            <small>{item.status} · {stripHtml(last?.content || '').slice(0, 90)}</small>
                                        </button>
                                    );
                                }) : <p className="health-empty">{queueAvailable ? text.noQueue : text.queueUnavailable}</p>}
                            </div>
                            <div className="health-conversation-panel">
                                {selectedConversation ? (
                                    <>
                                        <div className="health-thread">
                                            {selectedMessages.map(item => {
                                                const role = String(item.role || '').toLowerCase();
                                                const isUserMessage = role === 'user';
                                                return (
                                                    <article className={`health-thread-message ${role}`} key={item.id || `${role}-${item.createdAt}`}>
                                                        <strong>{isUserMessage ? (selectedConversation.userNickName || 'Usuario') : role === 'agent' ? (item.actorName || item.agentName || 'Agente') : 'Equipo Ludopata'}</strong>
                                                        {isUserMessage ? (
                                                            <p>{stripHtml(item.content)}</p>
                                                        ) : (
                                                            <div dangerouslySetInnerHTML={{ __html: item.content }} />
                                                        )}
                                                    </article>
                                                );
                                            })}
                                        </div>
                                        <form className="health-reply-form" onSubmit={handleReply}>
                                            <textarea value={reply} onChange={(event) => setReply(event.target.value)} placeholder={text.replyPlaceholder} />
                                            <button type="submit" disabled={sending || !reply.trim()}>
                                                {sending ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
                                                {text.send}
                                            </button>
                                        </form>
                                    </>
                                ) : (
                                    <p className="health-empty centered">{text.selectConversation}</p>
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
};

export default HealthAgentAdmin;
