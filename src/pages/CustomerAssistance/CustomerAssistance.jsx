import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Headphones, Loader2, MessageCircle, Plus, Send, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { healthAgentService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { getLanguageId } from '../../utils/languages';
import SubscriptionGate from '../../components/SubscriptionGate';
import { FREE_LIMITS, getApiErrorMessage, isSubscriptionRequiredError } from '../../utils/subscription';
import PremiumAvatarBadge from '../../components/PremiumAvatarBadge';
import { useHealthAgentRealtime } from '../../context/HealthAgentRealtimeContext';
import './CustomerAssistance.css';

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

const MESSAGE_CACHE_PREFIX = 'health_agent_messages_';

const getConversationId = (conversation) => (
    conversation?.conversationId ||
    conversation?.externalConversationId ||
    conversation?.id ||
    ''
);

const getConversationStatus = (conversation) => String(conversation?.status || '').toLowerCase();
const isHumanStatus = (conversation) => ['waitingforagent', 'humanactive'].includes(getConversationStatus(conversation));

const getConversationTimestamp = (conversation) => (
    getCachedMessages(getConversationId(conversation)).slice(-1)[0]?.createdAt ||
    conversation?.updatedAt ||
    conversation?.closedAt ||
    conversation?.createdAt ||
    conversation?.timestamp
);

const buildLocalWelcomeMessage = (conversationId, t) => ({
    messageId: `assistant-welcome-${conversationId}`,
    role: 'assistant',
    content: t('assistance.health_agent_welcome'),
    createdAt: new Date().toISOString(),
    localOnly: true
});

const getCachedMessages = (conversationId) => {
    if (!conversationId) return [];
    try {
        return JSON.parse(localStorage.getItem(`${MESSAGE_CACHE_PREFIX}${conversationId}`) || '[]');
    } catch {
        return [];
    }
};

const setCachedMessages = (conversationId, messages) => {
    if (!conversationId) return;
    localStorage.setItem(`${MESSAGE_CACHE_PREFIX}${conversationId}`, JSON.stringify(messages));
};

const stripHtml = (html = '') => {
    const div = document.createElement('div');
    div.innerHTML = String(html)
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<\/(p|div|li|h[1-6])>/gi, ' ');
    return div.textContent || div.innerText || '';
};

const escapeHtml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const hasHtmlMarkup = (value = '') => /<\/?[a-z][\s\S]*>/i.test(String(value));

const formatAssistantContent = (value = '') => {
    const content = String(value).trim();
    if (!content) return '';
    if (hasHtmlMarkup(content)) return content;

    const normalized = content
        .replace(/\r\n/g, '\n')
        .replace(/\s+-\s+/g, '\n- ')
        .replace(/([.!?])\s+(?=(Primero|Segundo|Tambien|También|Si |Dime|Cuéntame|Cuentame|Puedes|Recuerda|First|Second|Also|If |Tell me|Can you)\b)/g, '$1\n\n');

    return normalized
        .split(/\n{2,}|\n(?=-\s+)/)
        .map(part => part.trim())
        .filter(Boolean)
        .map(part => part.startsWith('- ')
            ? `<p>${escapeHtml(part.replace(/^-+\s*/, ''))}</p>`
            : `<p>${escapeHtml(part)}</p>`)
        .join('');
};

const formatTime = (value, locale) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString(locale === 'es' ? 'es-ES' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
};

const getAssistantFallback = (locale) => locale === 'en'
    ? '<p>I am having trouble preparing the response.</p><p>Please send your message again in one short sentence so I can help you step by step.</p>'
    : '<p>Estoy teniendo problemas para preparar la respuesta.</p><p>Por favor envia tu mensaje otra vez en una frase corta para ayudarte paso a paso.</p>';

const formatSessionDate = (value, locale) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric'
    });
};

const getSessionPreview = (session, fallback) => {
    const lastMessage = toArray(session?.messages).slice(-1)[0];
    const content = stripHtml(lastMessage?.content || lastMessage?.message || '');
    if (content) return content;

    const cached = getCachedMessages(getConversationId(session)).slice(-1)[0];
    const cachedContent = stripHtml(cached?.content || cached?.message || '');
    return cachedContent || session?.summary || fallback;
};

const AssistanceMessage = ({ message, user, locale, isSubscribed }) => {
    const role = String(message?.role || '').toLowerCase();
    const isUser = role === 'user';
    const isAgent = role === 'agent';
    const content = message?.content || message?.message || '';
    const avatar = isUser ? user?.avatar : 'https://s3.us-east-2.amazonaws.com/ludopata.org/logo_gambler.png';
    const displayName = isUser
        ? (user?.name || user?.fullName || user?.nickName || 'Customer')
        : isAgent ? (message?.actorName || message?.agentName || (locale === 'es' ? 'Agente' : 'Agent')) : 'Gambler Team';

    return (
        <article className={`assistance-message ${isUser ? 'user' : isAgent ? 'agent' : 'assistant'}`}>
            <div className="assistance-avatar">
                {avatar ? <img src={avatar} alt={displayName} /> : isUser ? <UserRound size={18} /> : <Bot size={18} />}
                {isUser && isSubscribed && <PremiumAvatarBadge size={18} top={-6} left={-6} />}
                <span />
            </div>
            <div className="assistance-message-body">
                <div className="assistance-message-meta">
                    <strong>{displayName}</strong>
                    <time>{formatTime(message?.createdAt || message?.timestamp, locale)}</time>
                </div>
                {isUser ? (
                    <p>{content}</p>
                ) : (
                    <div className="assistance-message-html" dangerouslySetInnerHTML={{ __html: formatAssistantContent(content) }} />
                )}
            </div>
        </article>
    );
};

const CustomerAssistance = () => {
    const { t, i18n } = useTranslation();
    const { user, isSubscribed } = useAuth();
    const { addToast } = useNotification();
    const { joinConversation, leaveConversation } = useHealthAgentRealtime();
    const messagesEndRef = useRef(null);

    const [sessions, setSessions] = useState([]);
    const [selectedConversationId, setSelectedConversationId] = useState(null);
    const [conversation, setConversation] = useState(null);
    const [message, setMessage] = useState('');
    const [loadingSessions, setLoadingSessions] = useState(true);
    const [loadingConversation, setLoadingConversation] = useState(false);
    const [starting, setStarting] = useState(false);
    const [sending, setSending] = useState(false);
    const [subscriptionGate, setSubscriptionGate] = useState({ open: false, message: '' });

    const languageId = getLanguageId(i18n.language);
    const locale = i18n.language?.startsWith('es') ? 'es' : 'en';

    const sortedSessions = useMemo(() => (
        [...sessions].sort((a, b) => new Date(getConversationTimestamp(b) || 0) - new Date(getConversationTimestamp(a) || 0))
    ), [sessions]);

    const messages = useMemo(() => toArray(conversation?.messages), [conversation]);
    const userMessageCount = useMemo(() => messages.filter(item => String(item?.role || '').toLowerCase() === 'user').length, [messages]);
    const waitingForAgent = getConversationStatus(conversation) === 'waitingforagent';

    const loadSessions = async () => {
        setLoadingSessions(true);
        try {
            const response = await healthAgentService.getConversations();
            const sessionList = toArray(response);
            setSessions(sessionList);
            const firstSession = sessionList.sort((a, b) => new Date(getConversationTimestamp(b) || 0) - new Date(getConversationTimestamp(a) || 0))[0];
            const firstConversationId = getConversationId(firstSession);
            if (firstConversationId && !selectedConversationId) {
                setSelectedConversationId(firstConversationId);
            }
        } catch (err) {
            console.error('Error loading health agent sessions:', err);
            addToast('error', t('assistance.sessions_error'));
        } finally {
            setLoadingSessions(false);
        }
    };

    const loadConversation = async (conversationId) => {
        if (!conversationId) return;
        setLoadingConversation(true);
        try {
            const response = await healthAgentService.getConversation(conversationId);
            const data = unwrapApiData(response);
            const serverMessages = toArray(data?.messages).map(item => ({
                ...item,
                messageId: item.messageId || item.id,
                role: String(item.role || '').toLowerCase(),
                actorName: item.actorName || item.agentName
            }));
            const cachedMessages = serverMessages.length ? serverMessages : getCachedMessages(conversationId);
            setConversation({
                ...data,
                conversationId: getConversationId(data) || conversationId,
                messages: cachedMessages
            });
        } catch (err) {
            console.error('Error loading health agent conversation:', err);
            addToast('error', t('assistance.conversation_error'));
        } finally {
            setLoadingConversation(false);
        }
    };

    useEffect(() => {
        loadSessions();
    }, []);

    useEffect(() => {
        if (selectedConversationId) {
            loadConversation(selectedConversationId);
        }
    }, [selectedConversationId]);

    useEffect(() => {
        if (!selectedConversationId) return undefined;
        joinConversation(selectedConversationId);
        return () => leaveConversation(selectedConversationId);
    }, [joinConversation, leaveConversation, selectedConversationId]);

    useEffect(() => {
        const handleConversationUpdated = (event) => {
            const data = event.detail;
            const conversationId = getConversationId(data);
            if (!conversationId) return;
            const serverMessages = toArray(data?.messages).map(item => ({
                ...item,
                messageId: item.messageId || item.id,
                role: String(item.role || '').toLowerCase(),
                actorName: item.actorName || item.agentName
            }));
            setCachedMessages(conversationId, serverMessages);
            setSessions(prev => {
                const exists = prev.some(item => getConversationId(item) === conversationId);
                const next = { ...data, conversationId, messages: serverMessages };
                return exists
                    ? prev.map(item => getConversationId(item) === conversationId ? next : item)
                    : [next, ...prev];
            });
            if (conversationId === selectedConversationId) {
                setConversation({ ...data, conversationId, messages: serverMessages });
            }
        };

        window.addEventListener('health-agent:conversation-updated', handleConversationUpdated);
        return () => window.removeEventListener('health-agent:conversation-updated', handleConversationUpdated);
    }, [selectedConversationId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length, sending, loadingConversation]);

    const handleStartConversation = async () => {
        if (!isSubscribed && sortedSessions.length >= FREE_LIMITS.assistanceConversations) {
            setSubscriptionGate({
                open: true,
                message: t('subscriptions.assistance_conversation_limit')
            });
            return;
        }
        setStarting(true);
        try {
            const conversationId = crypto.randomUUID();
            const response = await healthAgentService.createConversation(conversationId);
            const data = unwrapApiData(response);
            const newConversationId = getConversationId(data) || conversationId;
            const assistantMessage = buildLocalWelcomeMessage(newConversationId, t);
            const newSession = {
                ...data,
                conversationId: newConversationId,
                languageId,
                status: data?.status || 'Active',
                createdAt: data?.createdAt || new Date().toISOString(),
                updatedAt: data?.updatedAt || data?.createdAt || new Date().toISOString(),
                messages: [assistantMessage]
            };
            setCachedMessages(newConversationId, [assistantMessage]);
            setSessions(prev => [newSession, ...prev.filter(item => getConversationId(item) !== newConversationId)]);
            setConversation(newSession);
            setSelectedConversationId(newConversationId);
        } catch (err) {
            console.error('Error starting health agent conversation:', err);
            if (isSubscriptionRequiredError(err)) {
                setSubscriptionGate({ open: true, message: getApiErrorMessage(err, t('subscriptions.assistance_conversation_limit')) });
            } else {
                addToast('error', t('assistance.start_error'));
            }
        } finally {
            setStarting(false);
        }
    };

    const handleSendMessage = async (event) => {
        event.preventDefault();
        const text = message.trim();
        if (!text || sending) return;
        if (!isSubscribed && selectedConversationId && userMessageCount >= FREE_LIMITS.assistanceUserMessages) {
            setSubscriptionGate({
                open: true,
                message: t('subscriptions.assistance_message_limit', { count: FREE_LIMITS.assistanceUserMessages })
            });
            return;
        }

        let conversationId = selectedConversationId;
        setMessage('');
        setSending(true);

        try {
            if (!conversationId) {
                conversationId = crypto.randomUUID();
                const startResponse = await healthAgentService.createConversation(conversationId);
                const startData = unwrapApiData(startResponse);
                conversationId = getConversationId(startData) || conversationId;
                const assistantMessage = buildLocalWelcomeMessage(conversationId, t);
                setSelectedConversationId(conversationId);
                setConversation({
                    ...startData,
                    conversationId,
                    languageId,
                    messages: [assistantMessage]
                });
                setCachedMessages(conversationId, [assistantMessage]);
            }

            const userMessage = {
                messageId: `local-${Date.now()}`,
                role: 'user',
                content: text,
                createdAt: new Date().toISOString()
            };
            setConversation(prev => ({
                ...(prev || { conversationId, messages: [] }),
                messages: [...toArray(prev?.messages), userMessage]
            }));
            setCachedMessages(conversationId, [...getCachedMessages(conversationId), userMessage]);

            const response = await healthAgentService.sendMessage({
                conversationId,
                message: text,
                metadata: { languageId, locale }
            });
            const data = unwrapApiData(response);
            const assistantContent = String(data.response || data.message || '').trim();
            if (assistantContent) {
                const assistantMessage = {
                    messageId: `assistant-${data.timestamp || Date.now()}`,
                    role: 'assistant',
                    content: assistantContent,
                    createdAt: data.timestamp || new Date().toISOString(),
                    sources: data.sources || [],
                    safety: data.safety || null
                };

                const nextConversation = prev => ({
                    ...(prev || { conversationId, messages: [] }),
                    conversationId: data.conversationId || conversationId,
                    messages: [...toArray(prev?.messages), assistantMessage]
                });
                setConversation(nextConversation);
                setCachedMessages(conversationId, [...getCachedMessages(conversationId), assistantMessage]);
            } else if (!data?.safety?.requiresEscalation) {
                const fallbackMessage = {
                    messageId: `assistant-fallback-${Date.now()}`,
                    role: 'assistant',
                    content: getAssistantFallback(locale),
                    createdAt: new Date().toISOString()
                };
                setConversation(prev => ({
                    ...(prev || { conversationId, messages: [] }),
                    messages: [...toArray(prev?.messages), fallbackMessage]
                }));
            }
            if (data?.safety?.requiresEscalation || !assistantContent) {
                await loadConversation(conversationId);
            }
            await loadSessions();
        } catch (err) {
            console.error('Error sending health agent message:', err);
            setMessage(text);
            if (isSubscriptionRequiredError(err)) {
                setSubscriptionGate({ open: true, message: getApiErrorMessage(err, t('subscriptions.assistance_message_limit', { count: FREE_LIMITS.assistanceUserMessages })) });
            } else {
                addToast('error', t('assistance.send_error'));
            }
        } finally {
            setSending(false);
        }
    };

    const handleRequestHuman = async () => {
        if (!selectedConversationId || sending || starting) return;
        if (!isSubscribed) {
            setSubscriptionGate({
                open: true,
                message: locale === 'es'
                    ? 'La asistencia con agente humano esta disponible para usuarios Premium.'
                    : 'Human agent support is available for Premium users.'
            });
            return;
        }
        setSending(true);
        try {
            const response = await healthAgentService.requestHuman(
                selectedConversationId,
                locale === 'es' ? 'Solicitado por el usuario' : 'Requested by user'
            );
            const data = unwrapApiData(response);
            const serverMessages = toArray(data?.messages).map(item => ({
                ...item,
                messageId: item.messageId || item.id,
                role: String(item.role || '').toLowerCase(),
                actorName: item.actorName || item.agentName
            }));
            setConversation({ ...data, conversationId: getConversationId(data) || selectedConversationId, messages: serverMessages });
            setCachedMessages(selectedConversationId, serverMessages);
            await loadSessions();
            addToast('success', locale === 'es' ? 'El equipo humano fue notificado.' : 'The human team was notified.');
        } catch (err) {
            console.error('Error requesting human support:', err);
            addToast('error', locale === 'es' ? 'No se pudo solicitar apoyo humano.' : 'Human support could not be requested.');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="assistance-page">
            <section className="assistance-shell">
                <aside className="assistance-sessions">
                    <div className="assistance-sessions-head">
                        <div>
                            <h1>{t('assistance.title')}</h1>
                        </div>
                        <button type="button" onClick={handleStartConversation} disabled={starting}>
                            {starting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                        </button>
                    </div>

                    <div className="assistance-session-list">
                        {loadingSessions ? (
                            <div className="assistance-loading">
                                <Loader2 size={24} className="animate-spin" />
                            </div>
                        ) : sortedSessions.length ? (
                            sortedSessions.map(session => {
                                const sessionConversationId = getConversationId(session);
                                const active = sessionConversationId === selectedConversationId;
                                return (
                                    <button
                                        type="button"
                                        className={`assistance-session ${active ? 'active' : ''}`}
                                        key={sessionConversationId}
                                        onClick={() => setSelectedConversationId(sessionConversationId)}
                                    >
                                        <span className="assistance-session-icon">
                                            <MessageCircle size={17} />
                                        </span>
                                        <span className="assistance-session-copy">
                                            <strong>{formatSessionDate(session.updatedAt || session.createdAt, locale)}</strong>
                                            <small>{getSessionPreview(session, t('assistance.new_conversation'))}</small>
                                        </span>
                                        {getConversationStatus(session) === 'active' && <i>{t('assistance.active')}</i>}
                                        {isHumanStatus(session) && <i className="human">{locale === 'es' ? 'Humano' : 'Human'}</i>}
                                    </button>
                                );
                            })
                        ) : (
                            <div className="assistance-empty-sessions">
                                <Bot size={30} />
                                <p>{t('assistance.no_sessions')}</p>
                                <button type="button" onClick={handleStartConversation} disabled={starting}>
                                    {t('assistance.start_conversation')}
                                </button>
                            </div>
                        )}
                    </div>
                </aside>

                <main className="assistance-chat">
                    <header className="assistance-chat-head">
                        <div className="assistance-team-mark">
                            <img src="https://s3.us-east-2.amazonaws.com/ludopata.org/logo_gambler.png" alt="Gambler Team" />
                            <span />
                        </div>
                        <div>
                            <h2>{t('assistance.team_name')}</h2>
                        </div>
                        {selectedConversationId && (
                            <button
                                type="button"
                                className={`assistance-human-button ${isHumanStatus(conversation) ? 'active' : ''}`}
                                onClick={handleRequestHuman}
                                disabled={sending || starting || isHumanStatus(conversation)}
                            >
                                <Headphones size={17} />
                                {isHumanStatus(conversation)
                                    ? (locale === 'es' ? 'Agente notificado' : 'Agent notified')
                                    : (locale === 'es' ? 'Hablar con humano' : 'Talk to a human')}
                            </button>
                        )}
                    </header>

                    <div className="assistance-messages">
                        {loadingConversation ? (
                            <div className="assistance-loading grow">
                                <Loader2 size={34} className="animate-spin" />
                            </div>
                        ) : messages.length ? (
                            <>
                                {messages.map(item => (
                                    <AssistanceMessage
                                        key={item.messageId || `${item.role}-${item.createdAt}-${item.content}`}
                                        message={item}
                                        user={user}
                                        locale={locale}
                                        isSubscribed={isSubscribed}
                                    />
                                ))}
                                {sending && (
                                    <div className="assistance-typing">
                                        <span />
                                        <span />
                                        <span />
                                    </div>
                                )}
                                {waitingForAgent && !sending && (
                                    <div className="assistance-waiting-agent">
                                        <Headphones size={16} />
                                        {locale === 'es' ? 'Esperando a un agente' : 'Waiting for an agent'}
                                        <span className="assistance-waiting-dots"><i /> <i /> <i /></span>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </>
                        ) : (
                            <div className="assistance-empty-chat">
                                <Bot size={42} />
                                <h3>{t('assistance.empty_title')}</h3>
                                <button type="button" onClick={handleStartConversation} disabled={starting}>
                                    {starting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                                    {t('assistance.start_conversation')}
                                </button>
                            </div>
                        )}
                    </div>

                    <form className="assistance-input-bar" onSubmit={handleSendMessage}>
                        <input
                            value={message}
                            onChange={(event) => setMessage(event.target.value)}
                            placeholder={t('assistance.message_placeholder')}
                            disabled={sending || starting}
                        />
                        <button type="submit" disabled={!message.trim() || sending || starting}>
                            {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                        </button>
                    </form>
                </main>
            </section>
            <SubscriptionGate
                isOpen={subscriptionGate.open}
                onClose={() => setSubscriptionGate({ open: false, message: '' })}
                message={subscriptionGate.message}
            />
        </div>
    );
};

export default CustomerAssistance;
