import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock, Loader2, RefreshCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { userFeedbackService } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import './HelpSupport.css';

const unwrapApiData = (response) => {
    const data = response?.data ?? response;
    return data?.data !== undefined ? data.data : data;
};

const toArray = (value) => {
    const data = unwrapApiData(value);
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.records)) return data.records;
    if (Array.isArray(data?.$values)) return data.$values;
    return data ? [data] : [];
};

const stripHtml = (html = '') => {
    const div = document.createElement('div');
    div.innerHTML = String(html)
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/(p|div|li|h[1-6])>/gi, '\n');
    return (div.textContent || div.innerText || '').trim();
};

const AdminFeedbackList = () => {
    const { t, i18n } = useTranslation();
    const { addToast } = useNotification();
    const [feedbacks, setFeedbacks] = useState([]);
    const [filter, setFilter] = useState('pending');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [reviewingId, setReviewingId] = useState(null);
    const pageSize = 10;

    const isReviewedParam = useMemo(() => {
        if (filter === 'reviewed') return true;
        if (filter === 'pending') return false;
        return null;
    }, [filter]);

    const formatDate = (value) => {
        if (!value) return t('common.none');
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return t('common.none');
        return date.toLocaleString(i18n.language === 'es' ? 'es-ES' : 'en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const loadFeedbacks = async () => {
        setLoading(true);
        try {
            const response = await userFeedbackService.getAll({ page, pageSize, isReviewed: isReviewedParam });
            setFeedbacks(toArray(response));
        } catch (err) {
            console.error('Error loading feedbacks:', err);
            addToast('error', t('help_support.admin_load_error'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFeedbacks();
    }, [page, isReviewedParam]);

    const changeFilter = (nextFilter) => {
        setFilter(nextFilter);
        setPage(1);
    };

    const markReviewed = async (feedbackId) => {
        setReviewingId(feedbackId);
        try {
            await userFeedbackService.markReviewed(feedbackId);
            setFeedbacks(prev => prev.map(item => (
                item.feedbackId === feedbackId
                    ? { ...item, isReviewed: true, reviewedAt: new Date().toISOString() }
                    : item
            )));
            addToast('success', t('help_support.admin_review_success'));
        } catch (err) {
            console.error('Error marking feedback as reviewed:', err);
            addToast('error', t('help_support.admin_review_error'));
        } finally {
            setReviewingId(null);
        }
    };

    return (
        <div className="feedback-admin-page">
            <header className="feedback-admin-header">
                <div>
                    <span>{t('help_support.admin_menu')}</span>
                    <h1>{t('help_support.admin_title')}</h1>
                    <p>{t('help_support.admin_subtitle')}</p>
                </div>
                <button className="feedback-refresh" type="button" onClick={loadFeedbacks} disabled={loading}>
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCcw size={18} />}
                    {t('common.update')}
                </button>
            </header>

            <div className="feedback-admin-filters">
                {['pending', 'reviewed', 'all'].map(item => (
                    <button
                        key={item}
                        type="button"
                        className={filter === item ? 'active' : ''}
                        onClick={() => changeFilter(item)}
                    >
                        {t(`help_support.filters.${item}`)}
                    </button>
                ))}
            </div>

            <section className="feedback-list">
                {loading ? (
                    <div className="feedback-loading">
                        <Loader2 size={42} className="animate-spin" />
                    </div>
                ) : feedbacks.length ? (
                    feedbacks.map(item => (
                        <article className="feedback-card" key={item.feedbackId}>
                            <div className="feedback-card-head">
                                <div>
                                    <strong>{item.userNickname || t('help_support.unknown_user')}</strong>
                                    <span>{formatDate(item.createdAt)}</span>
                                </div>
                                <span className={`feedback-status ${item.isReviewed ? 'reviewed' : 'pending'}`}>
                                    {item.isReviewed ? <CheckCircle2 size={15} /> : <Clock size={15} />}
                                    {item.isReviewed ? t('help_support.reviewed') : t('help_support.pending')}
                                </span>
                            </div>
                            <p>{stripHtml(item.content)}</p>
                            <div className="feedback-card-actions">
                                <span>{item.feedbackId}</span>
                                {!item.isReviewed && (
                                    <button
                                        type="button"
                                        onClick={() => markReviewed(item.feedbackId)}
                                        disabled={reviewingId === item.feedbackId}
                                    >
                                        {reviewingId === item.feedbackId ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                        {t('help_support.mark_reviewed')}
                                    </button>
                                )}
                            </div>
                        </article>
                    ))
                ) : (
                    <div className="feedback-empty">
                        <CheckCircle2 size={42} />
                        <p>{t('help_support.no_feedbacks')}</p>
                    </div>
                )}
            </section>

            <div className="feedback-pagination">
                <button type="button" disabled={page === 1 || loading} onClick={() => setPage(prev => Math.max(1, prev - 1))}>
                    {t('common.back')}
                </button>
                <span>{t('common.page_x_of_y', { current: page, total: '?' })}</span>
                <button type="button" disabled={loading || feedbacks.length < pageSize} onClick={() => setPage(prev => prev + 1)}>
                    {t('common.next')}
                </button>
            </div>
        </div>
    );
};

export default AdminFeedbackList;
