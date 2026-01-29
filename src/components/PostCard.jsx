import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageSquare, MoreVertical, Edit2, Trash2, Calendar, User, Share2 } from 'lucide-react';
import PostMediaGrid from './PostMediaGrid';
import PostComments from './PostComments';
import PostViewersModal from './PostViewersModal';
import { useAuth } from '../context/AuthContext';
import { postViewedService, postLikeService } from '../services/api';
import { useTranslation } from 'react-i18next';
import 'react-quill-new/dist/quill.snow.css';

const PostCard = ({ post, onEdit, onDelete }) => {
    const { t, i18n } = useTranslation();
    const { user, loading: authLoading } = useAuth();
    const [isExpanded, setIsExpanded] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [isLiked, setIsLiked] = useState(Boolean(post.likePostByCurrentUser));
    const [likesCount, setLikesCount] = useState(post.totalLikes || 0);
    const [commentsCount, setCommentsCount] = useState(post.totalComments || 0);
    const [currentLikeId, setCurrentLikeId] = useState(post.likePostByCurrentUser?.postLikeId);
    const [showViewersModal, setShowViewersModal] = useState(false);
    const [showHoverTooltip, setShowHoverTooltip] = useState(false);
    const cardRef = useRef(null);
    const hasReportedView = useRef(false);
    const tooltipTimeoutRef = useRef(null);

    const isAdmin = user?.role === 1 || user?.role === 2;

    useEffect(() => {
        if (authLoading || !user) return;
        if (isAdmin) return;

        if (post.postId && !hasReportedView.current) {
            const observer = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting) {
                        reportView();
                        observer.disconnect();
                    }
                },
                { threshold: 0.5 }
            );

            if (cardRef.current) {
                observer.observe(cardRef.current);
            }

            return () => observer.disconnect();
        }
    }, [post.postId, isAdmin]);

    const reportView = async () => {
        try {
            await postViewedService.createPostViewed({
                postId: post.postId,
                userId: user?.userId,
                viewedAt: new Date().toISOString()
            });
            hasReportedView.current = true;
        } catch (err) {
            console.error("Error reporting view:", err);
        }
    };

    const handleShare = async () => {
        const shareUrl = `${window.location.origin}/posts/${post.postId}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Gambler Community Post',
                    url: shareUrl
                });
            } catch (err) {
                console.error("Error sharing:", err);
            }
        } else {
            try {
                await navigator.clipboard.writeText(shareUrl);
                alert(t('common.link_copied') || 'Link copied to clipboard!');
            } catch (err) {
                console.error("Error copying link:", err);
            }
        }
    };

    const handleTooltipMouseEnter = () => {
        if (likesCount === 0) return;
        if (tooltipTimeoutRef.current) {
            clearTimeout(tooltipTimeoutRef.current);
        }
        setShowHoverTooltip(true);
    };

    const handleTooltipMouseLeave = () => {
        tooltipTimeoutRef.current = setTimeout(() => {
            setShowHoverTooltip(false);
        }, 200); // 200ms delay before hiding
    };

    const handleLike = async () => {
        if (isAdmin) return;

        try {
            if (isLiked) {
                const likeId = currentLikeId;
                if (likeId) {
                    await postLikeService.deletePostLike(likeId);
                    setIsLiked(false);
                    setCurrentLikeId(null);
                    setLikesCount(prev => Math.max(0, prev - 1));
                }
            } else {
                const response = await postLikeService.createPostLike({
                    postId: post.postId,
                    userId: user?.userId,
                    likeType: 0
                });

                // Extract ID from common response patterns
                const newLikeId = response.data?.postLikeId || response.data?.id || response.data;

                setIsLiked(true);
                setCurrentLikeId(newLikeId);
                setLikesCount(prev => prev + 1);
            }
        } catch (err) {
            console.error("Error toggling like:", err);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        const lang = i18n.language.substring(0, 2).toLowerCase();
        const isEs = lang === 'es';

        if (diffInSeconds < 60) {
            const val = Math.max(1, Math.floor(diffInSeconds));
            if (isEs) return `Hace ${val} ${val === 1 ? 'minuto' : 'minutos'}`;
            return `${val} ${val === 1 ? 'minute' : 'minutes'} ago`;
        }

        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) {
            if (isEs) return `Hace ${diffInMinutes} ${diffInMinutes === 1 ? 'minuto' : 'minutos'}`;
            return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
        }

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) {
            if (isEs) return `Hace ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`;
            return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
        }

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) {
            if (isEs) return `Hace ${diffInDays} ${diffInDays === 1 ? 'día' : 'días'}`;
            return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
        }

        const diffInWeeks = Math.floor(diffInDays / 7);
        if (diffInDays < 30) {
            if (isEs) return `Hace ${diffInWeeks} ${diffInWeeks === 1 ? 'semana' : 'semanas'}`;
            return `${diffInWeeks} ${diffInWeeks === 1 ? 'week' : 'weeks'} ago`;
        }

        const diffInMonths = Math.floor(diffInDays / 30);
        if (diffInMonths < 1) { // This case is actually covered by weeks but for safety
            if (isEs) return `Hace 1 mes`;
            return `1 month ago`;
        }

        // Default to absolute date if more than a month
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const stripHtml = (html) => {
        if (!html) return "";
        const tmp = document.createElement("DIV");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    };

    // Extract content from postTranslations if available (nested structure)
    // Otherwise fallback to post.contentHtml or post.content
    const translationContent = post.postTranslations?.[0]?.contentHtml;
    const rawContent = translationContent || post.contentHtml || post.content || "";

    const contentText = stripHtml(rawContent);
    const shouldTruncate = contentText.length > 200;

    let displayedContent = rawContent;

    if (shouldTruncate && !isExpanded) {
        // Simple truncation that avoids breaking in the middle of a tag if possible
        const previewSize = 300;
        const truncated = rawContent.substring(0, previewSize);
        const lastTagOpen = truncated.lastIndexOf('<');
        const lastTagClose = truncated.lastIndexOf('>');

        if (lastTagOpen > lastTagClose) {
            displayedContent = rawContent.substring(0, lastTagOpen) + '...';
        } else {
            displayedContent = truncated + '...';
        }
    }

    return (
        <div ref={cardRef} className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: post.user?.avatar ? `url(${post.user.avatar}) center/cover` : 'rgba(255,255,255,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {!post.user?.avatar && <User color="var(--text-muted)" />}
                    </div>
                    <div>
                        <div style={{ fontWeight: '700', fontSize: '1rem' }}>{post.user?.nickName || 'User'}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            <Calendar size={12} />
                            {formatDate(post.createdAt)}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {(isAdmin || user?.userId === post.userId) && (
                        <>
                            <button
                                onClick={() => onEdit(post)}
                                style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '0.5rem', color: 'white', cursor: 'pointer' }}
                            >
                                <Edit2 size={16} />
                            </button>
                            <button
                                onClick={() => onDelete(post.postId)}
                                style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', border: 'none', borderRadius: '0.5rem', color: '#ef4444', cursor: 'pointer' }}
                            >
                                <Trash2 size={16} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Content Preview / Full Content */}
            <div style={{ marginBottom: '1rem' }}>
                <style>{`
                    .rich-text-content.ql-editor {
                        padding: 0;
                        overflow: hidden;
                        color: inherit;
                        font-family: inherit;
                    }
                    .rich-text-content.ql-editor p, 
                    .rich-text-content.ql-editor ol, 
                    .rich-text-content.ql-editor ul,
                    .rich-text-content.ql-editor h1,
                    .rich-text-content.ql-editor h2,
                    .rich-text-content.ql-editor h3 {
                        margin-bottom: 1rem !important;
                    }
                    .rich-text-content.ql-editor p:last-child {
                        margin-bottom: 0 !important;
                    }
                    .rich-text-content.ql-editor ol, 
                    .rich-text-content.ql-editor ul {
                        padding-left: 1.5rem;
                    }
                    .rich-text-content.ql-editor.ql-truncated {
                        max-height: 120px;
                    }
                `}</style>
                {displayedContent && (
                    <div
                        className={`rich-text-content ql-editor ${isExpanded ? '' : 'ql-truncated'}`}
                        style={{
                            fontSize: '1rem',
                            lineHeight: '1.6',
                            color: 'var(--text-main)',
                            fontWeight: isExpanded ? '400' : '500'
                        }}
                        dangerouslySetInnerHTML={{ __html: displayedContent }}
                    />
                )}

                {shouldTruncate && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '600', padding: '0.5rem 0', cursor: 'pointer', fontSize: '0.875rem' }}
                    >
                        {isExpanded ? t('common.see_less') || 'See less' : t('common.see_more') || 'See more'}
                    </button>
                )}
            </div>

            {/* Media */}
            <PostMediaGrid mediaList={post.postMedia} />

            {/* Footer / Interactions */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '1.5rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--glass-border)'
            }}>
                <div
                    style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
                    onMouseEnter={handleTooltipMouseEnter}
                    onMouseLeave={handleTooltipMouseLeave}
                >
                    {/* Hover Tooltip */}
                    {showHoverTooltip && (
                        <div
                            style={{
                                position: 'absolute',
                                bottom: '100%',
                                left: '0',
                                marginBottom: '0px',
                                paddingBottom: '8px',
                                background: 'rgba(15, 23, 42, 0.98)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '0.5rem',
                                padding: '0.5rem 0.75rem',
                                paddingBottom: 'calc(0.5rem + 8px)',
                                whiteSpace: 'nowrap',
                                zIndex: 50,
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                                backdropFilter: 'blur(8px)'
                            }}
                            onMouseEnter={handleTooltipMouseEnter}
                            onMouseLeave={handleTooltipMouseLeave}
                        >
                            <button
                                onClick={() => setShowViewersModal(true)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--primary)',
                                    fontSize: '0.75rem',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    padding: 0,
                                    transition: 'color 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--secondary)'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--primary)'}
                            >
                                {t('posts.show_users') || 'Show users'}
                            </button>
                            {/* Arrow */}
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: '1rem',
                                marginTop: '-8px',
                                borderLeft: '6px solid transparent',
                                borderRight: '6px solid transparent',
                                borderTop: '6px solid rgba(15, 23, 42, 0.98)',
                                width: 0,
                                height: 0
                            }} />
                        </div>
                    )}

                    <button
                        onClick={handleLike}
                        disabled={isAdmin}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: 'none',
                            border: 'none',
                            color: isLiked ? 'var(--danger)' : 'var(--text-muted)',
                            cursor: isAdmin ? 'default' : 'pointer',
                            transition: 'all 0.2s',
                            padding: 0
                        }}
                    >
                        <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
                        <span style={{ fontWeight: '600' }}>{likesCount}</span>
                    </button>
                </div>

                <button
                    onClick={() => setShowComments(!showComments)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: 'none',
                        border: 'none',
                        color: showComments ? 'var(--primary)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        padding: 0
                    }}
                >
                    <MessageSquare size={20} />
                    <span style={{ fontWeight: '600' }}>{commentsCount}</span>
                </button>

                <button
                    onClick={handleShare}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        padding: 0
                    }}
                    title={t('common.share') || 'Share'}
                >
                    <Share2 size={20} />
                </button>
            </div>

            {showComments && (
                <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                    <PostComments
                        postId={post.postId}
                        onCommentAdded={() => setCommentsCount(prev => prev + 1)}
                        onCommentDeleted={() => setCommentsCount(prev => Math.max(0, prev - 1))}
                    />
                </div>
            )}

            {/* Viewers Modal */}
            {showViewersModal && (
                <PostViewersModal
                    postId={post.postId}
                    onClose={() => setShowViewersModal(false)}
                />
            )}
        </div>
    );
};

export default PostCard;
