import React, { useState, useEffect, useRef } from 'react';
import { Send, Smile } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useChat } from '../../context/ChatContext';
import EmojiPicker, { Theme as EmojiTheme } from 'emoji-picker-react';

const ChatInput = ({ onSendMessage, chatId }) => {
    const [message, setMessage] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const { t } = useTranslation();
    const { sendTypingStatus } = useChat();
    const typingTimeoutRef = useRef(null);
    const lastTypingSignalRef = useRef(0);
    const inputRef = useRef(null);

    const onEmojiClick = (emojiData) => {
        setMessage(prev => prev + emojiData.emoji);
        // Focus back to input
        if (inputRef.current) {
            inputRef.current.focus();
        }
        setShowEmojiPicker(false);
    };

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
        <div className="chat-input" style={{ position: 'relative' }}>
            {showEmojiPicker && (
                <div style={{ position: 'absolute', bottom: '100%', left: '0', zIndex: 1000, marginBottom: '10px' }}>
                    <EmojiPicker
                        onEmojiClick={onEmojiClick}
                        autoFocusSearch={false}
                        theme={EmojiTheme.LIGHT}
                        width={300}
                        height={400}
                        searchDisabled={false}
                        skinTonesDisabled={true}
                    />
                </div>
            )}
            <form onSubmit={handleSend} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                    type="button"
                    className="emoji-trigger"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <Smile size={24} color={showEmojiPicker ? 'var(--primary)' : 'currentColor'} />
                </button>
                <input
                    ref={inputRef}
                    type="text"
                    placeholder={t('chat.type_message')}
                    value={message}
                    onChange={handleChange}
                    onKeyPress={handleKeyPress}
                    style={{ flex: 1 }}
                />
                <button type="submit" disabled={!message.trim()}>
                    <Send size={20} />
                </button>
            </form>
            <style>{`
                /* Prevent emoji picker search conflict */
                .EmojiPickerReact .epr-search-container {
                    padding: 10px !important;
                }
                .EmojiPickerReact input.epr-search {
                    padding: 0 12px !important;
                    height: 36px !important;
                    border: 1px solid var(--stroke) !important;
                    background: var(--bg-white) !important;
                    border-radius: 8px !important;
                }
                .EmojiPickerReact .epr-icn-search {
                    display: none !important;
                }
                /* Reset emoji button distortions inherited from chat styles */
                .EmojiPickerReact button {
                    background: transparent !important;
                    box-shadow: none !important;
                    border-radius: 0 !important;
                    width: auto !important;
                    height: auto !important;
                    padding: 0 !important;
                    transform: none !important;
                }
                .EmojiPickerReact button:hover {
                    background: #f1f5f9 !important;
                }
            `}</style>
        </div>
    );
};

export default ChatInput;
