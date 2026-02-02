import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PlusCircle } from 'lucide-react';
import CreateGroupModal from './CreateGroupModal';

const ChatList = ({ chats, activeChatId, onSelectChat, currentUser }) => {
    const { t } = useTranslation();
    const [showCreateGroup, setShowCreateGroup] = useState(false);

    const getChatName = (chat) => {
        if (chat.isGroup) return chat.name;
        const otherParticipant = chat.chatParticipants.find(p => p.userId !== currentUser?.userId);
        return otherParticipant ? (otherParticipant.nickName || otherParticipant.name) : t('chat.unknown_user');
    };

    const getChatAvatar = (chat) => {
        if (chat.isGroup) return null; // Or a group icon
        const otherParticipant = chat.chatParticipants.find(p => p.userId !== currentUser?.userId);
        return otherParticipant?.avatar;
    };

    return (
        <div className="chat-list">
            <div className="chat-list-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>{t('chat.messages')}</h3>
                <button
                    onClick={() => setShowCreateGroup(true)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--primary-color, #3b82f6)', cursor: 'pointer' }}
                    title={t('chat.create_group')}
                >
                    <PlusCircle size={20} />
                </button>
            </div>
            <div className="chat-list-items">
                {chats.map(chat => (
                    <div
                        key={chat.chatsId}
                        className={`chat-item ${activeChatId === chat.chatsId ? 'active' : ''}`}
                        onClick={() => onSelectChat(chat.chatsId)}
                    >
                        <div className="chat-item-avatar">
                            {getChatAvatar(chat) ? (
                                <img src={getChatAvatar(chat)} alt="avatar" />
                            ) : (
                                <div className="avatar-placeholder">{getChatName(chat).charAt(0)}</div>
                            )}
                        </div>
                        <div className="chat-item-info">
                            <div className="chat-item-top">
                                <span className="chat-item-name">{getChatName(chat)}</span>
                                {chat.lastMessageAt && (
                                    <span className="chat-item-time">
                                        {new Date(chat.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                )}
                            </div>
                            <div className="chat-item-bottom">
                                <p className="chat-item-last-message">
                                    {chat.lastMessage?.content || t('chat.no_messages')}
                                </p>
                                {chat.unreadCount > 0 && <span className="unread-badge">{chat.unreadCount}</span>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showCreateGroup && (
                <CreateGroupModal
                    onClose={() => setShowCreateGroup(false)}
                    onGroupCreated={(chatId) => {
                        onSelectChat(chatId);
                        // Ideally we should also refresh the chat list here,
                        // but ChatPage handles it via SignalR or parent refresh
                    }}
                />
            )}
        </div>
    );
};

export default ChatList;
