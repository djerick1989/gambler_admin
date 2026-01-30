import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Heart, MessageCircle, Trash2, Users, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { statusService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StoryReactionsModal from './StoryReactionsModal';

const StoryViewer = ({ isOpen, onClose, initialStatus, allStatuses, onDeleteSuccess }) => {
    const { t } = useTranslation();
    const { user: currentUser } = useAuth();
    const [statuses, setStatuses] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showReactions, setShowReactions] = useState(false);
    const containerRef = useRef(null);
    const isProgrammaticScroll = useRef(false);

    useEffect(() => {
        if (isOpen && initialStatus) {
            const currentStatuses = allStatuses || [initialStatus];
            setStatuses(currentStatuses);

            const index = currentStatuses.findIndex(s => s.statusId === initialStatus.statusId);
            const targetIndex = index >= 0 ? index : 0;
            setCurrentIndex(targetIndex);

            // Set overflow hidden on body
            document.body.style.overflow = 'hidden';

            // Trigger initial scroll
            setTimeout(() => {
                if (containerRef.current) {
                    const element = containerRef.current.children[targetIndex];
                    if (element) {
                        isProgrammaticScroll.current = true;
                        element.scrollIntoView({ behavior: 'auto' });
                        setTimeout(() => {
                            isProgrammaticScroll.current = false;
                        }, 100);
                    }
                }
            }, 0);
        } else if (!isOpen) {
            document.body.style.overflow = 'auto';
        }
    }, [isOpen, initialStatus]);

    useEffect(() => {
        if (isOpen && allStatuses && allStatuses.length > 0) {
            setStatuses(allStatuses);
        }
    }, [allStatuses, isOpen]);

    const prevIndex = useRef(currentIndex);

    useEffect(() => {
        if (isOpen && containerRef.current) {
            const storyWrappers = containerRef.current.children;
            Array.from(storyWrappers).forEach((wrapper, index) => {
                const video = wrapper.querySelector('video');
                if (!video) return;

                if (index === currentIndex) {
                    if (prevIndex.current !== currentIndex) {
                        video.currentTime = 0;
                    }
                    video.play().catch(err => console.log('Autoplay blocked or failed:', err));
                } else {
                    video.pause();
                }
            });
            prevIndex.current = currentIndex;
        }
    }, [currentIndex, isOpen, statuses]);

    const handleScroll = (e) => {
        if (isProgrammaticScroll.current) return;

        const scrollTop = e.target.scrollTop;
        const height = e.target.clientHeight;
        const index = Math.round(scrollTop / height);

        if (index !== currentIndex && index >= 0 && index < statuses.length) {
            setCurrentIndex(index);
        }
    };

    const handleReact = async (statusId) => {
        try {
            const response = await statusService.reactToStatus(statusId, 0); // HEART
            if (response.status) {
                // Update local state
                setStatuses(prev => prev.map(s => {
                    if (s.statusId === statusId) {
                        return {
                            ...s,
                            likedByCurrentUser: !s.likedByCurrentUser,
                            heartCount: s.likedByCurrentUser ? s.heartCount - 1 : s.heartCount + 1
                        };
                    }
                    return s;
                }));
            }
        } catch (error) {
            console.error("Error reacting to status:", error);
        }
    };

    const handleDeleteStatus = async (statusId) => {
        if (window.confirm(t('stories.delete_confirm'))) {
            try {
                const response = await statusService.deleteStatus(statusId);
                if (response.status) {
                    onDeleteSuccess(statusId);
                    const newStatuses = statuses.filter(s => s.statusId !== statusId);
                    if (newStatuses.length === 0) {
                        onClose();
                    } else {
                        setStatuses(newStatuses);
                        setCurrentIndex(Math.min(currentIndex, newStatuses.length - 1));
                    }
                }
            } catch (error) {
                console.error("Error deleting status:", error);
            }
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'black',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Close Button */}
            <style>{`div::-webkit-scrollbar { display: none; }`}</style>
            <button
                onClick={onClose}
                style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    zIndex: 10001,
                    background: 'rgba(0,0,0,0.5)',
                    border: 'none',
                    borderRadius: '50%',
                    padding: '8px',
                    color: 'white',
                    cursor: 'pointer'
                }}
            >
                <X size={24} />
            </button>

            {/* Scrollable Container */}
            <div
                ref={containerRef}
                onScroll={handleScroll}
                style={{
                    height: '100%',
                    overflowY: 'scroll',
                    scrollSnapType: 'y mandatory',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                }}
            >

                {statuses.map((status, index) => (
                    <div key={status.statusId} style={{
                        height: '100vh',
                        width: '100%',
                        scrollSnapAlign: 'start',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {/* Background Content */}
                        <div style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: status.type === 0 ? 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' : 'black'
                        }}>
                            {status.type === 2 || (status.type === 1 && /\.(mp4|mov|webm|quicktime)(\?.*)?$/i.test(status.content)) ? (
                                <video
                                    src={status.content}
                                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                    autoPlay={index === currentIndex}
                                    muted
                                    loop
                                    playsInline
                                />
                            ) : status.type === 1 ? (
                                <img src={status.content} alt="Story content" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                            ) : (
                                <div style={{
                                    padding: '2rem',
                                    fontSize: '2rem',
                                    fontWeight: 'bold',
                                    color: 'white',
                                    textAlign: 'center'
                                }}>
                                    {status.content}
                                </div>
                            )}
                        </div>

                        {/* Overlays */}
                        <div style={{
                            position: 'absolute',
                            left: '20px',
                            bottom: '40px',
                            zIndex: 10000,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                border: '2px solid white',
                                background: status.user?.avatar ? `url(${status.user.avatar}) center/cover` : 'var(--primary)'
                            }} />
                            <div>
                                <div style={{ fontWeight: '600', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{status.user?.nickName || status.user?.name}</div>
                                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>@{status.user?.nickName}</div>
                            </div>
                        </div>

                        {/* Actions Sidebar */}
                        <div style={{
                            position: 'absolute',
                            right: '20px',
                            bottom: '100px',
                            zIndex: 10000,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '24px',
                            alignItems: 'center'
                        }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                <button
                                    onClick={() => handleReact(status.statusId)}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: status.likedByCurrentUser ? 'var(--danger)' : 'white',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Heart size={32} fill={status.likedByCurrentUser ? 'currentColor' : 'none'} />
                                </button>
                                <span style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>{status.heartCount}</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                <button
                                    onClick={() => setShowReactions(true)}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'white',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Users size={32} />
                                </button>
                                <span style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>{t('stories.viewed')}</span>
                            </div>

                            {status.userId === currentUser?.userId && (
                                <button
                                    onClick={() => handleDeleteStatus(status.statusId)}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#ef4444',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Trash2 size={32} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination Indicators */}
            <div style={{
                position: 'absolute',
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '4px',
                width: '80%',
                zIndex: 10000
            }}>
                {statuses.map((_, i) => (
                    <div key={i} style={{
                        height: '3px',
                        flex: 1,
                        background: i === currentIndex ? 'white' : 'rgba(255,255,255,0.3)',
                        borderRadius: '2px',
                        transition: 'background 0.3s'
                    }} />
                ))}
            </div>

            <StoryReactionsModal
                isOpen={showReactions}
                onClose={() => setShowReactions(false)}
                statusId={statuses[currentIndex]?.statusId}
            />
        </div>,
        document.body
    );
};

export default StoryViewer;
