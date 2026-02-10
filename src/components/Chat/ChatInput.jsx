import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useChat } from '../../context/ChatContext';

const ChatInput = ({ onSendMessage, chatId }) => {
    const [message, setMessage] = useState('');
    const { t } = useTranslation();
    const { sendTypingStatus } = useChat();
    const typingTimeoutRef = useRef(null);
    const lastTypingSignalRef = useRef(0);

    const handleSend = (e) => {
        if (e) e.preventDefault();
        if (message.trim()) {
            onSendMessage(message);
            setMessage('');
            // Immediately stop typing status on send
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            sendTypingStatus(chatId, false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            handleSend(e);
        }
    };

    const handleChange = (e) => {
        const val = e.target.value;
        setMessage(val);

        const now = Date.now();

        // Typing status logic with throttling
        if (val.length > 0) {
            // Only send 'true' if it has been more than 2 seconds since the last 'true' signal
            if (now - lastTypingSignalRef.current > 2000) {
                sendTypingStatus(chatId, true);
                lastTypingSignalRef.current = now;
            }

            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

            typingTimeoutRef.current = setTimeout(() => {
                sendTypingStatus(chatId, false);
                lastTypingSignalRef.current = 0; // Reset so next typing sends 'true' immediately
            }, 3000);
        } else {
            sendTypingStatus(chatId, false);
            lastTypingSignalRef.current = 0;
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        }
    };

    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, []);

    return (
        <div className="chat-input">
            <form onSubmit={handleSend}>
                <input
                    type="text"
                    placeholder={t('chat.type_message')}
                    value={message}
                    onChange={handleChange}
                    onKeyPress={handleKeyPress}
                />
                <button type="submit" disabled={!message.trim()}>
                    <Send size={20} />
                </button>
            </form>
        </div>
    );
};

export default ChatInput;
