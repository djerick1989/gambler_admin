import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, EyeOff, Flag, Loader2, ShieldAlert, Trash2, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { postModerationService } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { confirmDialog } from '../../utils/dialog';

const PAGE_SIZE = 10;

const PostModerationList = () => {
    const { t, i18n } = useTranslation();
    const { addToast } = useNotification();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [onlyUnderReview, setOnlyUnderReview] = useState(true);
    const [applying, setApplying] = useState(null);

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        try {
            const response = await postModerationService.getReportedPosts(page, PAGE_SIZE, onlyUnderReview);
            if (response?.status) {
                setPosts(response.data?.posts || []);
                setLastPage(response.data?.lastPage || 1);
            }
        } catch (err) {
            console.error('Error fetching reported posts:', err);
            addToast('error', t('moderation.load_error'));
        } finally {
            setLoading(false);
        }
    }, [page, onlyUnderReview, addToast, t]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const applyDecision = async (post, decision) => {
        const confirmed = await confirmDialog(
            decision === 'REMOVE' ? t('moderation.confirm_remove') : t('moderation.confirm_restore'),
            { title: decision === 'REMOVE' ? t('moderation.confirm_remove_title') : t('moderation.confirm_restore_title') }
        );
        if (!confirmed) return;

        setApplying(post.postId);
        try {
            const response = await postModerationService.applyDecision(post.postId, decision);
            if (response?.status) {
                addToast('success', decision === 'REMOVE' ? t('moderation.removed') : t('moderation.restored'));
                fetchPosts();
            } else {
                addToast('error', response?.errorMessage || t('moderation.decision_error'));
            }
        } catch (err) {
            console.error('Error applying moderation decision:', err);
            addToast('error', t('moderation.decision_error'));
        } finally {
            setApplying(null);
        }
    };

    const formatDate = (value) => {
        if (!value) return '—';
        return new Date(value).toLocaleString(i18n.language, {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div style={{ paddingBottom: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.4rem' }}>
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '12px' }}>
                    <ShieldAlert size={30} color="#ef4444" />
                </div>
                <div>
                    <h1 style={{ margin: 0 }}>{t('moderation.title')}</h1>
                    <p style={{ margin: '4px 0 0', color: 'var(--text-muted)' }}>{t('moderation.subtitle')}</p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', margin: '1.5rem 0' }}>
                {[true, false].map((value) => (
                    <button
                        key={String(value)}
                        type="button"
                        onClick={() => { setOnlyUnderReview(value); setPage(1); }}
                        className={onlyUnderReview === value ? 'btn btn-primary' : 'btn btn-secondary'}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                    >
                        {value ? t('moderation.filter_under_review') : t('moderation.filter_all')}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ display: 'grid', placeItems: 'center', padding: '4rem' }}>
                    <Loader2 size={38} className="animate-spin" color="var(--primary)" />
                </div>
            ) : posts.length === 0 ? (
                <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                    <CheckCircle2 size={56} color="#10b981" style={{ opacity: 0.35 }} />
                    <h3 style={{ margin: '1rem 0 0.35rem' }}>{t('moderation.empty_title')}</h3>
                    <p style={{ margin: 0, color: 'var(--text-muted)' }}>{t('moderation.empty_subtitle')}</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {posts.map((post) => (
                        <article key={post.postId} className="glass-card" style={{ padding: '1.35rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                                    <div style={{
                                        width: '42px',
                                        height: '42px',
                                        borderRadius: '50%',
                                        flexShrink: 0,
                                        overflow: 'hidden',
                                        background: 'rgba(212, 144, 0, 0.12)',
                                        border: '1px solid var(--stroke)',
                                        display: 'grid',
                                        placeItems: 'center'
                                    }}>
                                        {post.author?.avatar
                                            ? <img src={post.author.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : <User size={20} color="var(--primary)" />}
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontWeight: '700' }}>@{post.author?.nickName || t('common.unknown')}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            {t('moderation.author_reported_posts', { count: post.authorReportedPostCount })}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.35rem',
                                        padding: '0.35rem 0.7rem',
                                        borderRadius: '999px',
                                        background: 'rgba(239, 68, 68, 0.12)',
                                        color: '#b91c1c',
                                        fontWeight: '800',
                                        fontSize: '0.8rem'
                                    }}>
                                        <Flag size={13} />
                                        {t('moderation.report_count', { count: post.reportCount })}
                                    </span>
                                    <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.35rem',
                                        padding: '0.35rem 0.7rem',
                                        borderRadius: '999px',
                                        background: post.moderationStatus === 'UNDER_REVIEW'
                                            ? 'rgba(212, 144, 0, 0.14)'
                                            : post.moderationStatus === 'REMOVED'
                                                ? 'rgba(15, 23, 42, 0.08)'
                                                : 'rgba(16, 185, 129, 0.12)',
                                        color: post.moderationStatus === 'UNDER_REVIEW'
                                            ? 'var(--primary)'
                                            : post.moderationStatus === 'REMOVED'
                                                ? 'var(--text-muted)'
                                                : '#047857',
                                        fontWeight: '800',
                                        fontSize: '0.8rem'
                                    }}>
                                        {post.moderationStatus === 'UNDER_REVIEW' && <EyeOff size={13} />}
                                        {t(`moderation.status.${post.moderationStatus.toLowerCase()}`)}
                                    </span>
                                </div>
                            </div>

                            <p style={{
                                margin: '1rem 0 0.85rem',
                                color: 'var(--text-main)',
                                lineHeight: 1.5,
                                fontSize: '0.95rem'
                            }}>
                                {post.contentPreview || <em style={{ color: 'var(--text-muted)' }}>{t('moderation.no_text')}</em>}
                                {post.mediaCount > 0 && (
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        {' '}· {t('moderation.media_count', { count: post.mediaCount })}
                                    </span>
                                )}
                            </p>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.85rem' }}>
                                {post.reasons?.map((r) => (
                                    <span key={r.reason} style={{
                                        padding: '0.25rem 0.6rem',
                                        borderRadius: '999px',
                                        border: '1px solid var(--stroke)',
                                        fontSize: '0.78rem',
                                        fontWeight: '600',
                                        color: 'var(--text-main)'
                                    }}>
                                        {t(`posts.report.reasons.${r.reason.toLowerCase()}`)} · {r.count}
                                    </span>
                                ))}
                            </div>

                            {post.comments?.length > 0 && (
                                <details style={{ marginBottom: '0.85rem' }}>
                                    <summary style={{ cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                                        {t('moderation.comments_count', { count: post.comments.length })}
                                    </summary>
                                    <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.1rem' }}>
                                        {post.comments.map((c, i) => (
                                            <li key={i} style={{ fontSize: '0.88rem', color: 'var(--text-main)', marginBottom: '0.3rem' }}>{c}</li>
                                        ))}
                                    </ul>
                                </details>
                            )}

                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '1rem',
                                flexWrap: 'wrap',
                                borderTop: '1px solid var(--stroke)',
                                paddingTop: '0.85rem'
                            }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    {t('moderation.under_review_at')}: {formatDate(post.underReviewAt)}
                                </span>

                                <div style={{ display: 'flex', gap: '0.6rem' }}>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}
                                        onClick={() => applyDecision(post, 'RESTORE')}
                                        disabled={applying === post.postId}
                                    >
                                        <CheckCircle2 size={15} />
                                        {t('moderation.restore')}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn"
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            padding: '0.5rem 0.9rem',
                                            fontSize: '0.85rem',
                                            background: '#ef4444',
                                            color: 'white'
                                        }}
                                        onClick={() => applyDecision(post, 'REMOVE')}
                                        disabled={applying === post.postId}
                                    >
                                        <Trash2 size={15} />
                                        {t('moderation.remove')}
                                    </button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            {lastPage > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                    <button type="button" className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                        {t('common.back')}
                    </button>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        {t('common.page_x_of_y', { current: page, total: lastPage })}
                    </span>
                    <button type="button" className="btn btn-secondary" disabled={page >= lastPage} onClick={() => setPage(p => p + 1)}>
                        {t('common.next')}
                    </button>
                </div>
            )}

            <p style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                marginTop: '2rem',
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                lineHeight: 1.5
            }}>
                <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                {t('moderation.footer_note')}
            </p>
        </div>
    );
};

export default PostModerationList;
