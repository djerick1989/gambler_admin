import React, { useState, useEffect } from 'react';
import { postCommentService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Loader2, Send, Edit2, Trash2, User, X, Check } from 'lucide-react';

const PostComments = ({ postId, onCommentAdded, onCommentDeleted }) => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 5,
        totalRecords: 0,
        lastPage: 1
    });

    const isAdmin = user?.role === 1 || user?.role === 2;

    useEffect(() => {
        if (postId) {
            fetchComments(1, true);
        }
    }, [postId]);

    const fetchComments = async (page, reset = false) => {
        if (reset) setLoading(true);
        else setLoadingMore(true);

        try {
            const response = await postCommentService.getAllPostCommentByPostId(postId, page, pagination.pageSize);
            if (response.status) {
                if (reset) {
                    setComments(response.data.postComments);
                } else {
                    setComments(prev => [...prev, ...response.data.postComments]);
                }

                setPagination({
                    page: response.data.page,
                    pageSize: response.data.pageSize,
                    totalRecords: response.data.totalRecords,
                    lastPage: response.data.lastPage
                });
            }
        } catch (err) {
            console.error("Error fetching comments:", err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const handleCreateComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || isAdmin) return;

        setSubmitting(true);
        try {
            const response = await postCommentService.createPostComment({
                postId,
                userId: user?.userId,
                comment: newComment,
                isActive: true
            });
            if (response.status) {
                setNewComment('');
                fetchComments(1, true);
                if (onCommentAdded) onCommentAdded();
            }
        } catch (err) {
            console.error("Error creating comment:", err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateComment = async (commentId) => {
        if (!editValue.trim()) return;

        try {
            const response = await postCommentService.updatePostComment({
                postCommentId: commentId,
                postId,
                userId: user?.userId,
                comment: editValue,
                isActive: true
            });
            if (response.status) {
                setComments(prev => prev.map(c =>
                    c.postCommentId === commentId ? { ...c, comment: editValue } : c
                ));
                setEditingCommentId(null);
            }
        } catch (err) {
            console.error("Error updating comment:", err);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (window.confirm(t('common.delete_confirm') || 'Delete this comment?')) {
            try {
                const response = await postCommentService.deletePostComment(commentId);
                if (response.status) {
                    setComments(prev => prev.filter(c => c.postCommentId !== commentId));
                    if (onCommentDeleted) onCommentDeleted();
                }
            } catch (err) {
                console.error("Error deleting comment:", err);
            }
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '1rem', textAlign: 'center' }}>
                <Loader2 size={24} className="animate-spin" color="var(--primary)" />
            </div>
        );
    }

    return (
        <div style={{ marginTop: '1rem' }}>
            {/* Create Comment Form */}
            {!isAdmin && (
                <form onSubmit={handleCreateComment} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: user?.avatar ? `url(${user.avatar}) center/cover` : 'rgba(255,255,255,0.1)',
                        flexShrink: 0
                    }} />
                    <div style={{ flex: 1, position: 'relative' }}>
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder={t('posts.write_comment') || "Write a comment..."}
                            style={{
                                width: '100%',
                                padding: '0.6rem 2.5rem 0.6rem 1rem',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '1.5rem',
                                color: 'white',
                                fontSize: '0.875rem'
                            }}
                        />
                        <button
                            type="submit"
                            disabled={submitting || !newComment.trim()}
                            style={{
                                position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)',
                                background: 'var(--primary)', border: 'none', borderRadius: '50%',
                                width: '28px', height: '28px', color: 'white', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >
                            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                        </button>
                    </div>
                </form>
            )}

            {/* Comments List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {comments.map(comment => (
                    <div key={comment.postCommentId} style={{ display: 'flex', gap: '0.75rem' }}>
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            background: comment.user?.avatar ? `url(${comment.user.avatar}) center/cover` : 'rgba(255,255,255,0.1)',
                            flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            {!comment.user?.avatar && <User size={14} color="var(--text-muted)" />}
                        </div>

                        <div style={{ flex: 1 }}>
                            <div style={{
                                background: 'rgba(255,255,255,0.03)',
                                padding: '0.75rem 1rem',
                                borderRadius: '1rem',
                                position: 'relative'
                            }}>
                                <div style={{ fontWeight: '700', fontSize: '0.8rem', marginBottom: '0.25rem' }}>{comment.user?.nickName}</div>

                                {editingCommentId === comment.postCommentId ? (
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <input
                                            autoFocus
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            style={{
                                                flex: 1, background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid var(--primary)', borderRadius: '0.5rem',
                                                padding: '0.25rem 0.5rem', color: 'white', fontSize: '0.875rem'
                                            }}
                                        />
                                        <button onClick={() => handleUpdateComment(comment.postCommentId)} style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer' }}><Check size={16} /></button>
                                        <button onClick={() => setEditingCommentId(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={16} /></button>
                                    </div>
                                ) : (
                                    <div style={{ fontSize: '0.875rem', lineHeight: '1.4' }}>{comment.comment}</div>
                                )}
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem', paddingLeft: '0.5rem' }}>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    {new Date(comment.createdAt).toLocaleDateString()}
                                </span>
                                {(isAdmin || user?.userId === comment.userId) && editingCommentId !== comment.postCommentId && (
                                    <>
                                        <button
                                            onClick={() => { setEditingCommentId(comment.postCommentId); setEditValue(comment.comment); }}
                                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.7rem', cursor: 'pointer' }}
                                        >
                                            {t('common.edit') || 'Edit'}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteComment(comment.postCommentId)}
                                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.7rem', cursor: 'pointer' }}
                                        >
                                            {t('common.delete') || 'Delete'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Load More Comments */}
            {pagination.page < pagination.lastPage && (
                <button
                    onClick={() => fetchComments(pagination.page + 1)}
                    disabled={loadingMore}
                    style={{
                        background: 'none', border: 'none', color: 'var(--primary)',
                        fontSize: '0.8rem', fontWeight: 'bold', marginTop: '1rem', cursor: 'pointer',
                        padding: '0.5rem'
                    }}
                >
                    {loadingMore ? <Loader2 size={14} className="animate-spin" /> : t('common.load_more_comments') || 'Load more comments'}
                </button>
            )}
        </div>
    );
};

export default PostComments;
