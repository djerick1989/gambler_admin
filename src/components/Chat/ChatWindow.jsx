import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useChat } from '../../context/ChatContext';
import { formatChatTimestamp } from '../../utils/dateUtils';

const ChatWindow = ({ messages, currentUser, chatId }) => {
    const { t, i18n } = useTranslation();
    const { typingUsers } = useChat();
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const activeTypingUsers = typingUsers[chatId] || {};
    const typingUserIds = Object.keys(activeTypingUsers).filter(uid => activeTypingUsers[uid] && uid !== currentUser?.userId);

    return (
        <div className="chat-window">
            <div className="messages-list">
                {messages.length === 0 ? (
                    <div className="no-messages">
                        <p>{t('chat.start_conversation')}</p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isOwnMessage = msg.sender?.userId === currentUser?.userId;
                        return (
                            <div key={msg.messageId || index} className={`message-bubble-container ${isOwnMessage ? 'own' : 'other'}`}>
                                {!isOwnMessage && (
                                    <div className="message-sender-avatar">
                                        <img src={msg.sender?.avatar} alt="avatar" />
                                    </div>
                                )}
                                <div className="message-content-wrapper">
                                    {!isOwnMessage && <span className="message-sender-name">{msg.sender?.nickName || msg.sender?.name}</span>}
                                    <div className="message-bubble">
                                        <p className="message-text">{msg.content}</p>
                                        <span className="message-time">
                                            {formatChatTimestamp(msg.createdAt, t, i18n.language)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>
            {typingUserIds.length > 0 && (
                <div className="typing-indicator">
                    <span>{typingUserIds.length === 1 ? t('chat.is_typing') : t('chat.are_typing')}</span>
                    <div className="typing-dots">
                        <span>.</span><span>.</span><span>.</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatWindow;
