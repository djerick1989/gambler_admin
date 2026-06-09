import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, Loader2, Plus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { dopamineCommitmentService, relapseService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { getLanguageId } from '../../utils/languages';
import { FREE_LIMITS } from '../../utils/subscription';
import SubscriptionGate from '../../components/SubscriptionGate';
import { EMOTION_OPTIONS, findOptionByApiValue, getTranslatedRelapseText } from './relapseOptions';
import './Relapse.css';

const RelapseList = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { user, isSubscribed } = useAuth();
    const { addToast } = useNotification();
    const [relapses, setRelapses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [hasCommitment, setHasCommitment] = useState(false);
    const [showCommitmentModal, setShowCommitmentModal] = useState(false);
    const [subscriptionGateOpen, setSubscriptionGateOpen] = useState(false);

    const languageId = getLanguageId(i18n.language);
    const gamblerId = user?.gambler?.gamblerId;

    useEffect(() => {
        fetchInitialData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gamblerId, i18n.language]);

    const fetchInitialData = async () => {
        if (!gamblerId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const [relapseResponse, commitmentResponse] = await Promise.all([
                relapseService.getMy({ page: 1, pageSize: 10, languageId }),
                dopamineCommitmentService.getByGamblerId(gamblerId).catch(() => null)
            ]);
            const relapseData = Array.isArray(relapseResponse?.data)
                ? relapseResponse.data
                : relapseResponse?.data?.items || relapseResponse?.data?.relapses || [];
            setRelapses(relapseData);
            setHasMore(Boolean(relapseResponse?.data?.lastPage ? 1 < relapseResponse.data.lastPage : relapseData.length >= 10));

            const commitments = Array.isArray(commitmentResponse?.data)
                ? commitmentResponse.data
                : commitmentResponse?.data ? [commitmentResponse.data] : [];
            setHasCommitment(commitments.length > 0);
            setPage(1);
        } catch (err) {
            console.error('Error loading relapses:', err);
            addToast('error', t('relapses.load_error'));
        } finally {
            setLoading(false);
        }
    };

    const loadMore = async () => {
        const nextPage = page + 1;
        setLoading(true);
        try {
            const response = await relapseService.getMy({ page: nextPage, pageSize: 10, languageId });
            const newItems = Array.isArray(response?.data) ? response.data : response?.data?.items || response?.data?.relapses || [];
            setRelapses(prev => [...prev, ...newItems]);
            setHasMore(Boolean(response?.data?.lastPage ? nextPage < response.data.lastPage : newItems.length >= 10));
            setPage(nextPage);
        } catch (err) {
            console.error('Error loading more relapses:', err);
            addToast('error', t('relapses.load_error'));
        } finally {
            setLoading(false);
        }
    };

    const sortedRelapses = useMemo(() => (
        [...relapses].sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0))
    ), [relapses]);

    const formatDate = (value) => {
        if (!value) return '';
        const datePart = String(value).slice(0, 10);
        const [year, month, day] = datePart.split('-').map(Number);
        const date = year && month && day ? new Date(year, month - 1, day) : new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        return date.toLocaleDateString(i18n.language === 'es' ? 'es-ES' : 'en-US', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getEmotionLabel = (relapse) => {
        const option = findOptionByApiValue(EMOTION_OPTIONS, relapse.emotion);
        return t(option.labelKey);
    };

    const getPreview = (relapse) => {
        const advice = getTranslatedRelapseText(relapse, 'aiAdvice', languageId);
        const reflection = getTranslatedRelapseText(relapse, 'reflection', languageId);
        return (advice || reflection || t('relapses.no_advice')).replace(/\s+/g, ' ').trim();
    };

    const handleAdd = () => {
        if (!hasCommitment) {
            setShowCommitmentModal(true);
            return;
        }
        if (!isSubscribed && sortedRelapses.length >= FREE_LIMITS.relapses) {
            setSubscriptionGateOpen(true);
            return;
        }
        navigate('/customer/relapses/new');
    };

    if (loading && relapses.length === 0) {
        return (
            <div style={{ minHeight: '70vh', display: 'grid', placeItems: 'center' }}>
                <Loader2 size={48} className="animate-spin" color="var(--primary)" />
            </div>
        );
    }

    return (
        <div className="relapse-page">
            <header className="relapse-topbar">
                <div className="relapse-title">
                    <h1>{t('relapses.title')}</h1>
                </div>
                <div className="relapse-actions">
                    <button type="button" className="relapse-icon-button relapse-primary-icon" onClick={handleAdd} aria-label={t('relapses.add')}>
                        <Plus size={25} strokeWidth={3} />
                    </button>
                    <button type="button" className="relapse-icon-button" onClick={() => navigate('/customer/help-support/faq')} aria-label={t('common.info', 'Info')}>
                        <Info size={23} strokeWidth={2.4} />
                    </button>
                </div>
            </header>

            <section className="relapse-hero">
                <div className="relapse-summary">
                    <h2>{t('relapses.summary_title')}</h2>
                    <p>{t('relapses.summary_text')}</p>
                </div>
                <div className="relapse-info-card">
                    <h2>{t('relapses.count_title')}</h2>
                    <p>{t('relapses.count_text', { count: sortedRelapses.length })}</p>
                </div>
            </section>

            {sortedRelapses.length === 0 ? (
                <div className="relapse-empty">
                    <p>{t('relapses.empty')}</p>
                </div>
            ) : (
                <div className="relapse-list">
                    {sortedRelapses.map((relapse, index) => {
                        const preview = getPreview(relapse);
                        return (
                            <article
                                className="relapse-card"
                                key={relapse.relapseId}
                                onClick={() => navigate(`/customer/relapses/${relapse.relapseId}/conclusion`, { state: { relapse } })}
                            >
                                <div className="relapse-card-head">
                                    <span className="relapse-card-number">{sortedRelapses.length - index}</span>
                                    <h3>{getEmotionLabel(relapse)}</h3>
                                    <span className="relapse-card-date">{formatDate(relapse.date || relapse.createdAt)}</span>
                                </div>
                                <p>{preview.length > 230 ? `${preview.slice(0, 230)}...` : preview}</p>
                                <span className="relapse-card-more">{t('common.see_more')}</span>
                            </article>
                        );
                    })}

                    {hasMore && (
                        <button className="relapse-load-more" type="button" disabled={loading} onClick={loadMore}>
                            {loading ? t('common.loading') : t('common.load_more')}
                        </button>
                    )}
                </div>
            )}

            {showCommitmentModal && (
                <div className="relapse-modal-backdrop">
                    <div className="relapse-commitment-modal">
                        <button className="relapse-close" type="button" onClick={() => setShowCommitmentModal(false)}>
                            <X size={30} />
                        </button>
                        <h2>{t('relapses.commitment_required')}</h2>
                        <button className="relapse-primary-action" type="button" onClick={() => navigate('/customer/dopamine/control')}>
                            {t('relapses.make_commitment')}
                        </button>
                    </div>
                </div>
            )}

            <SubscriptionGate
                isOpen={subscriptionGateOpen}
                onClose={() => setSubscriptionGateOpen(false)}
                message={t('subscriptions.relapses_limit', { count: FREE_LIMITS.relapses })}
            />
        </div>
    );
};

export default RelapseList;
