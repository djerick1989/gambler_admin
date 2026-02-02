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
    const { joinChat, leaveChat } = useChat();

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

    // Sync active chat when chatId param changes
    useEffect(() => {
        if (chatId) {
            const chat = chats.find(c => c.chatsId === chatId);
            if (chat) {
                setActiveChat(chat);
                fetchMessages(chatId);
                joinChat(chatId);
            }
        } else {
            setActiveChat(null);
            setMessages([]);
        }

        return () => {
            if (chatId) leaveChat(chatId);
        };
    }, [chatId, chats, joinChat, leaveChat]);

    const fetchMessages = async (id) => {
        try {
            const response = await chatService.getMessages(id);
            setMessages(response.data || []);
        } catch (err) {
            console.error('Error fetching messages:', err);
        }
    };

    const handleSendMessage = async (content) => {
        if (!chatId) return;
        try {
            const response = await chatService.sendMessage(chatId, content);
            // Locally add the message for immediate feedback
            // The message will also be sent via SignalR to others
            if (response.status) {
                const newMessage = response.data;
                setMessages(prev => [...prev, newMessage]);

                // Update last message in the list
                setChats(prev => prev.map(c =>
                    c.chatsId === chatId
                        ? { ...c, lastMessage: newMessage, lastMessageAt: newMessage.createdAt }
                        : c
                ));
            }
        } catch (err) {
            console.error('Error sending message:', err);
        }
    };

    const handleSelectChat = (id) => {
        navigate(`/chat/${id}`);
    };

    // Listen for real-time messages
    useEffect(() => {
        const handleNewMessage = (event) => {
            const newMessage = event.detail;
            if (newMessage.chatId === chatId) {
                setMessages(prev => [...prev, newMessage]);
            }

            // Update the chat list regardless of which chat got the message
            setChats(prev => prev.map(c =>
                c.chatsId === newMessage.chatId
                    ? { ...c, lastMessage: newMessage, lastMessageAt: newMessage.createdAt }
                    : c
            ));
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
                    chats={chats}
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
