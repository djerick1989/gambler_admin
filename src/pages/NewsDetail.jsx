import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Calendar, User, MessageSquare, Loader2,
    Send, Trash2, Globe
} from 'lucide-react';
import { newsService, newsCommentService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useTranslation } from 'react-i18next';

const NewsDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const { showNotification } = useNotification();

    const [news, setNews] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const LANGUAGE_IDS = {
        en: '11e8ba3a-b290-4a2c-9dad-0f40e457f72c',
        es: '6892a523-0dc1-4e3b-9ddd-c9a558c7920b'
    };

    useEffect(() => {
        fetchData();
    }, [id, i18n.language]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const lang = i18n.language.substring(0, 2).toLowerCase();
            const languageId = LANGUAGE_IDS[lang] || LANGUAGE_IDS.en;

            const [newsRes, commentsRes] = await Promise.all([
                newsService.getNewsById(id, languageId),
                newsCommentService.getCommentsByNewsId(id, 1, 100)
            ]);

            if (newsRes.status) setNews(newsRes.data);
            if (commentsRes.status) setComments(commentsRes.data.newsComments || []);
        } catch (err) {
            console.error("Error fetching news details:", err);
            showNotification(t('common.error_loading'), 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        if (!user) {
            showNotification(t('news.must_login_comment') || 'You must be logged in to comment', 'warning');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await newsCommentService.createNewsComment({
                newsId: id,
                userId: user.userId,
                comment: commentText
            });

            if (response.status) {
                setCommentText('');
                // Optimized: fetch comments again
                const commentsRes = await newsCommentService.getCommentsByNewsId(id, 1, 100);
                if (commentsRes.status) setComments(commentsRes.data.newsComments || []);
                showNotification(t('news.comment_success') || 'Comment posted successfully!', 'success');
            }
        } catch (err) {
            console.error("Error posting comment:", err);
            showNotification(t('news.comment_error') || 'Error posting comment', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm(t('common.delete_confirm'))) return;

        try {
            const response = await newsCommentService.deleteNewsComment(commentId);
            if (response.status) {
                setComments(prev => prev.filter(c => c.newsCommentId !== commentId));
                showNotification(t('common.deleted_success'), 'success');
            }
        } catch (err) {
            console.error("Error deleting comment:", err);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <Loader2 size={48} className="animate-spin" color="var(--primary)" />
            </div>
        );
    }

    if (!news) return <div style={{ textAlign: 'center', padding: '5rem' }}><h3>News not found</h3></div>;

    const mainTranslation = news.translations?.[0] || { title: 'Untitled', contentHtml: '' };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '5rem' }}>
            <button
                onClick={() => navigate('/news')}
                className="btn btn-secondary"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '2rem',
                    padding: '0.75rem 1.25rem'
                }}
            >
                <ChevronLeft size={20} /> {t('common.back')}
            </button>

            <article className="glass-card" style={{ padding: 0, overflow: 'hidden', border: 'none', background: 'white' }}>
                <div style={{
                    height: '450px',
                    background: `url(${news.mediaUrl}) center/cover no-repeat`,
                }} />

                <div style={{ padding: '3rem' }}>
                    <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Calendar size={18} color="var(--primary)" />
                            {new Date(news.createdAt).toLocaleDateString(i18n.language, { year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <MessageSquare size={18} color="var(--primary)" />
                            {comments.length} {t('news.comments_count') || 'Comments'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Globe size={18} color="var(--primary)" />
                            {i18n.language.toUpperCase()}
                        </div>
                    </div>

                    <h1 style={{
                        fontSize: '2.5rem',
                        fontWeight: '900',
                        lineHeight: '1.2',
                        marginBottom: '2rem',
                        color: 'var(--text-main)'
                    }}>
                        {mainTranslation.title}
                    </h1>

                    <div
                        className="news-content"
                        style={{
                            fontSize: '1.15rem',
                            lineHeight: '1.8',
                            color: '#334155'
                        }}
                        dangerouslySetInnerHTML={{ __html: mainTranslation.contentHtml }}
                    />
                </div>
            </article>

            {/* Comments Section */}
            <div style={{ marginTop: '4rem' }}>
                <h3 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '2rem', color: 'var(--text-main)' }}>
                    {t('news.comments_section') || 'Discussion'}
                </h3>

                {/* Comment Form */}
                <form onSubmit={handleCommentSubmit} className="glass-card" style={{ padding: '1.5rem', marginBottom: '3rem', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{
                            width: '45px', height: '45px', borderRadius: '50%',
                            background: user?.avatar ? `url(${user.avatar}) center/cover` : 'var(--primary)',
                            flexShrink: 0
                        }}>
                            {!user?.avatar && <User size={24} color="white" style={{ margin: '10px' }} />}
                        </div>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <textarea
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder={t('news.comment_placeholder') || "Share your thoughts..."}
                                style={{
                                    width: '100%', minHeight: '100px', padding: '1rem',
                                    paddingBottom: '3rem', borderRadius: '0.75rem', border: '1px solid var(--stroke)',
                                    background: 'white', color: 'var(--text-main)', fontSize: '1rem',
                                    outline: 'none', resize: 'none'
                                }}
                            />
                            <button
                                type="submit"
                                disabled={isSubmitting || !commentText.trim()}
                                className="btn btn-primary"
                                style={{
                                    position: 'absolute', right: '0.75rem', bottom: '0.75rem',
                                    padding: '0.5rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
                                }}
                            >
                                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                {t('news.post_comment') || 'Post'}
                            </button>
                        </div>
                    </div>
                </form>

                {/* Comments List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {comments.length === 0 ? (
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                            {t('news.no_comments_yet') || 'No comments yet. Be the first to share your thoughts!'}
                        </p>
                    ) : (
                        comments.map(comment => (
                            <div key={comment.newsCommentId} className="glass-card" style={{ padding: '1.5rem', background: 'white' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <div style={{
                                            width: '40px', height: '40px', borderRadius: '50%',
                                            background: comment.avatar ? `url(${comment.avatar}) center/cover` : 'var(--bg-light)',
                                            flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            {!comment.avatar && <User size={20} color="var(--text-muted)" />}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>@{comment.nickName || comment.userName}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {new Date(comment.createdAt).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                    {(user?.userId === comment.userId || user?.role === 1 || user?.role === 2) && (
                                        <button
                                            onClick={() => handleDeleteComment(comment.newsCommentId)}
                                            style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                                <div style={{ marginTop: '1rem', color: 'var(--text-main)', lineHeight: '1.6' }}>
                                    {comment.comment}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <style>{`
                .news-content img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 1rem;
                    margin: 2rem 0;
                }
                .news-content p {
                    margin-bottom: 1.5rem;
                }
                .news-content h2, .news-content h3 {
                    margin: 2.5rem 0 1rem;
                    color: var(--text-main);
                }
            `}</style>
        </div>
    );
};

export default NewsDetail;
