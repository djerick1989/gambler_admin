import React, { useState, useEffect } from 'react';
import {
    MessageSquare, Trash2, Loader2, ChevronLeft, ChevronRight,
    Calendar, User, Newspaper, Search, X
} from 'lucide-react';
import { newsCommentService } from '../services/api';
import { useTranslation } from 'react-i18next';

const NewsComments = ({ newsId = null, onBack = null }) => {
    const { t, i18n } = useTranslation();
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 10,
        totalRecords: 0,
        lastPage: 1
    });

    useEffect(() => {
        fetchComments();
    }, [pagination.page, pagination.pageSize, newsId]);

    const fetchComments = async () => {
        setLoading(true);
        try {
            let response;
            if (newsId) {
                response = await newsCommentService.getCommentsByNewsId(newsId, pagination.page, pagination.pageSize);
            } else {
                response = await newsCommentService.getAllNewsComments(pagination.page, pagination.pageSize);
            }

            if (response.status) {
                setComments(response.data.newsComments);
                setPagination(prev => ({
                    ...prev,
                    totalRecords: response.data.totalRecords,
                    lastPage: response.data.lastPage
                }));
            }
        } catch (err) {
            console.error("Error fetching comments:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm(t('common.delete_confirm') || 'Are you sure you want to delete this comment?')) {
            try {
                const response = await newsCommentService.deleteNewsComment(id);
                if (response.status) {
                    fetchComments();
                }
            } catch (err) {
                console.error("Error deleting comment:", err);
                alert("Error deleting comment");
            }
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString(i18n.language, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Filter comments based on search term (local filtering for simplicity if needed, 
    // but the API doesn't seem to have a search param for comments yet)
    const filteredComments = comments.filter(c =>
        c.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.nickName || c.userName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.newsTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Header & Search */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {newsId && onBack && (
                        <button
                            onClick={onBack}
                            className="btn btn-secondary"
                            style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <X size={20} />
                        </button>
                    )}
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                            {newsId ? t('news_mgmt.comments_for_news') : t('news_mgmt.all_comments')}
                        </h2>
                        {newsId && comments.length > 0 && (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                {comments[0].newsTitle}
                            </p>
                        )}
                    </div>
                </div>

                <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder={t('common.search') || "Search comments..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '300px',
                            padding: '0.75rem 1rem 0.75rem 3rem',
                            background: 'white',
                            border: '1px solid var(--stroke)',
                            borderRadius: '0.5rem',
                            color: 'var(--text-main)',
                            fontSize: '0.875rem',
                            outline: 'none'
                        }}
                    />
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                    <Loader2 size={40} className="animate-spin" color="var(--primary)" />
                </div>
            ) : filteredComments.length === 0 ? (
                <div className="glass-card" style={{ padding: '4rem', textAlign: 'center' }}>
                    <MessageSquare size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.5 }} />
                    <h3 style={{ color: 'var(--text-muted)' }}>{t('news_mgmt.no_comments') || "No comments found"}</h3>
                </div>
            ) : (
                <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.875rem' }}>{t('news_mgmt.comment_user')}</th>
                                    {!newsId && <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.875rem' }}>{t('news_mgmt.news_title')}</th>}
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.875rem' }}>{t('news_mgmt.comment_text')}</th>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.875rem' }}>{t('common.date')}</th>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.875rem', textAlign: 'right' }}>{t('common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredComments.map((comment) => (
                                    <tr key={comment.newsCommentId} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '50%',
                                                    background: comment.avatar ? `url(${comment.avatar}) center/cover` : 'var(--bg-light)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0
                                                }}>
                                                    {!comment.avatar && <User size={16} color="var(--text-muted)" />}
                                                </div>
                                                <span style={{ fontWeight: '500', fontSize: '0.875rem' }}>@{comment.nickName || comment.userName}</span>
                                            </div>
                                        </td>
                                        {!newsId && (
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', maxWidth: '200px' }}>
                                                    <Newspaper size={14} color="var(--primary)" style={{ flexShrink: 0 }} />
                                                    <span style={{ fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {comment.newsTitle}
                                                    </span>
                                                </div>
                                            </td>
                                        )}
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <p style={{ fontSize: '0.875rem', maxWidth: '400px', margin: 0 }}>
                                                {comment.comment}
                                            </p>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                                <Calendar size={14} />
                                                {formatDate(comment.createdAt)}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                            <button
                                                onClick={() => handleDelete(comment.newsCommentId)}
                                                style={{
                                                    padding: '0.5rem',
                                                    background: 'rgba(239, 68, 68, 0.1)',
                                                    color: '#ef4444',
                                                    border: 'none',
                                                    borderRadius: '0.4rem',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                                                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--stroke)', background: '#f8fafc' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('common.rows_per_page')}</span>
                            <select
                                value={pagination.pageSize}
                                onChange={(e) => setPagination(prev => ({ ...prev, pageSize: parseInt(e.target.value), page: 1 }))}
                                style={{
                                    background: '#FFFFFF',
                                    border: '1px solid var(--stroke)',
                                    borderRadius: '0.4rem',
                                    color: 'var(--text-main)',
                                    padding: '0.25rem 0.5rem',
                                    fontSize: '0.75rem',
                                    cursor: 'pointer',
                                    outline: 'none'
                                }}
                            >
                                <option value={10} style={{ background: '#FFFFFF', color: 'var(--text-main)' }}>10</option>
                                <option value={20} style={{ background: '#FFFFFF', color: 'var(--text-main)' }}>20</option>
                                <option value={50} style={{ background: '#FFFFFF', color: 'var(--text-main)' }}>50</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button
                                disabled={pagination.page === 1}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                style={{ background: 'none', border: 'none', color: pagination.page === 1 ? 'var(--text-muted)' : 'var(--text-main)', cursor: pagination.page === 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-main)' }}>
                                {t('common.page_x_of_y', { current: pagination.page, total: pagination.lastPage })}
                            </span>
                            <button
                                disabled={pagination.page >= pagination.lastPage}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                style={{ background: 'none', border: 'none', color: pagination.page >= pagination.lastPage ? 'var(--text-muted)' : 'var(--text-main)', cursor: pagination.page >= pagination.lastPage ? 'default' : 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NewsComments;
