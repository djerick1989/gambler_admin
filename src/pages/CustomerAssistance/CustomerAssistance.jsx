import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Loader2, MessageCircle, Plus, Send, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { healthAgentService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { getLanguageId } from '../../utils/languages';
import SubscriptionGate from '../../components/SubscriptionGate';
import { FREE_LIMITS, getApiErrorMessage, isSubscriptionRequiredError } from '../../utils/subscription';
import PremiumAvatarBadge from '../../components/PremiumAvatarBadge';
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

const formatTime = (value, locale) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString(locale === 'es' ? 'es-ES' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
};

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
    const content = message?.content || message?.message || '';
    const avatar = isUser ? user?.avatar : 'https://s3.us-east-2.amazonaws.com/ludopata.org/logo_gambler.png';
    const displayName = isUser
        ? (user?.name || user?.fullName || user?.nickName || 'Customer')
        : 'Gambler Team';

    return (
        <article className={`assistance-message ${isUser ? 'user' : 'assistant'}`}>
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
                    <div className="assistance-message-html" dangerouslySetInnerHTML={{ __html: content }} />
                )}
            </div>
        </article>
    );
};

const CustomerAssistance = () => {
    const { t, i18n } = useTranslation();
    const { user, isSubscribed } = useAuth();
    const { addToast } = useNotification();
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
            const cachedMessages = getCachedMessages(conversationId);
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
            const assistantMessage = {
                messageId: `assistant-${data.timestamp || Date.now()}`,
                role: 'assistant',
                content: data.response || data.message || '',
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
