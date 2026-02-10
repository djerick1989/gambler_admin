import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { chatService, authService } from '../../services/api';
import { useChat } from '../../context/ChatContext';
import ChatList from '../../components/Chat/ChatList';
import ChatWindow from '../../components/Chat/ChatWindow';
import ChatInput from '../../components/Chat/ChatInput';
import { MessageSquare } from 'lucide-react';
import './Chat.css';

const ChatPage = () => {
    const { chatId } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { joinChat, leaveChat, setActiveChatId } = useChat();

    const [chats, setChats] = useState([]);
    const [messages, setMessages] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeChat, setActiveChat] = useState(null);

    // Fetch current user and chats on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [userData, chatsData] = await Promise.all([
                    authService.getUserInformation(),
                    chatService.getChats()
                ]);
                setCurrentUser(userData.data);
                setChats(chatsData.data || []);
            } catch (err) {
                console.error('Error fetching chat data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Sync active chat metadata when chats list or chatId changes
    useEffect(() => {
        if (chatId && chats.length > 0) {
            const chat = chats.find(c => String(c.chatsId) === String(chatId));
            if (chat) {
                setActiveChat(chat);
            }
        }
    }, [chatId, chats]);

    // Fetch messages and manage SignalR room join/leave only when chatId changes
    useEffect(() => {
        if (chatId) {
            fetchMessages(chatId);
            joinChat(chatId);
            setActiveChatId(chatId);
            return () => {
                leaveChat(chatId);
                setActiveChatId(null);
            };
        } else {
            setActiveChatId(null);
            setActiveChat(null);
            setMessages([]);
        }
    }, [chatId, joinChat, leaveChat, setActiveChatId]); // Removed chats from dependencies to prevent re-fetching on list updates

    const fetchMessages = async (id) => {
        try {
            const response = await chatService.getMessages(id);
            const rawMessages = response.data || [];
            // Ensure messages are sorted chronologically ascending (oldest first, newest bottom)
            const sortedMessages = [...rawMessages].sort((a, b) =>
                new Date(a.createdAt) - new Date(b.createdAt)
            );
            setMessages(sortedMessages);
        } catch (err) {
            console.error('Error fetching messages:', err);
        }
    };

    const handleSendMessage = async (content) => {
        if (!chatId) return;
        try {
            const response = await chatService.sendMessage(chatId, content);
            // Locally add the message for immediate feedback
            if (response) {
                const newMessage = response.data || response;
                // Avoid duplicates if SignalR is very fast
                setMessages(prev => {
                    const exists = prev.some(m => (m.messageId && m.messageId === newMessage.messageId));
                    if (exists) return prev;
                    return [...prev, newMessage];
                });

                // Update last message in the list
                setChats(prev => {
                    const newChats = prev.map(c =>
                        String(c.chatsId) === String(chatId)
                            ? { ...c, lastMessage: newMessage, lastMessageAt: newMessage.createdAt || new Date().toISOString() }
                            : c
                    );
                    return newChats;
                });
            }
        } catch (err) {
            console.error('Error sending message:', err);
        }
    };

    const handleSelectChat = (id) => {
        navigate(`/chat/${id}`);
    };

    // Sort chats by lastMessageAt (newest last)
    const sortChatsByLastMessage = (chatList) => {
        return [...chatList].sort((a, b) => {
            const dateA = a.lastMessageAt ? new Date(a.lastMessageAt) : new Date(0);
            const dateB = b.lastMessageAt ? new Date(b.lastMessageAt) : new Date(0);
            return dateB - dateA; // Descending order (newest first)
        });
    };

    // Listen for real-time messages
    useEffect(() => {
        const handleNewMessage = (event) => {
            const newMessage = event.detail;

            // If the message is for the current active chat, add it to the messages list
            if (String(newMessage.chatId || newMessage.chatsId) === String(chatId)) {
                setMessages(prev => {
                    // Prevent duplicate messages (especially if sent by current user)
                    const isDuplicate = prev.some(m =>
                        (m.messageId && m.messageId === newMessage.messageId) ||
                        (m.content === newMessage.content &&
                            Math.abs(new Date(m.createdAt) - new Date(newMessage.createdAt)) < 5000 &&
                            m.sender?.userId === newMessage.sender?.userId)
                    );
                    if (isDuplicate) return prev;
                    return [...prev, newMessage];
                });
            }

            // Update the last message preview in the sidebar for ALL chats
            setChats(prev => {
                const targetChatId = String(newMessage.chatId || newMessage.chatsId);
                return prev.map(c =>
                    String(c.chatsId) === targetChatId
                        ? { ...c, lastMessage: newMessage, lastMessageAt: newMessage.createdAt || new Date().toISOString() }
                        : c
                );
            });
        };

        window.addEventListener('new_chat_message', handleNewMessage);
        return () => window.removeEventListener('new_chat_message', handleNewMessage);
    }, [chatId]);

    if (loading) {
        return (
            <div className="loading-container">
                <p>{t('common.loading')}</p>
            </div>
        );
    }

    return (
        <div className="chat-container">
            <div className={`chat-sidebar ${chatId ? 'hidden-mobile' : ''}`}>
                <ChatList
                    chats={sortChatsByLastMessage(chats)}
                    activeChatId={chatId}
                    onSelectChat={handleSelectChat}
                    currentUser={currentUser}
                />
            </div>
            <div className="chat-main">
                {chatId ? (
                    <>
                        <div className="chat-header">
                            <h3>{activeChat?.name || activeChat?.chatParticipants?.find(p => p.userId !== currentUser?.userId)?.nickName || t('chat.direct_message')}</h3>
                        </div>
                        <ChatWindow
                            messages={messages}
                            currentUser={currentUser}
                            chatId={chatId}
                        />
                        <ChatInput
                            onSendMessage={handleSendMessage}
                            chatId={chatId}
                        />
                    </>
                ) : (
                    <div className="chat-empty-state">
                        <MessageSquare size={64} opacity={0.2} />
                        <h2>{t('chat.welcome')}</h2>
                        <p>{t('chat.select_to_start')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatPage;
