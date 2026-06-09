import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { relapseService } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { getLanguageId } from '../../utils/languages';
import { getTranslatedRelapseText } from './relapseOptions';
import './Relapse.css';

const RelapseConclusion = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();
    const { addToast } = useNotification();
    const [relapse, setRelapse] = useState(location.state?.relapse || null);
    const [loading, setLoading] = useState(!location.state?.relapse);

    const languageId = getLanguageId(i18n.language);

    useEffect(() => {
        if (relapse) return;

        const fetchRelapse = async () => {
            setLoading(true);
            try {
                const response = await relapseService.getMy({ page: 1, pageSize: 100, languageId });
                const items = Array.isArray(response?.data) ? response.data : response?.data?.items || response?.data?.relapses || [];
                const found = items.find(item => item.relapseId === id);
                if (found) {
                    setRelapse(found);
                } else {
                    addToast('error', t('relapses.not_found'));
                    navigate('/customer/relapses');
                }
            } catch (err) {
                console.error('Error loading relapse conclusion:', err);
                addToast('error', t('relapses.load_error'));
            } finally {
                setLoading(false);
            }
        };

        fetchRelapse();
    }, [addToast, id, languageId, navigate, relapse, t]);

    const advice = getTranslatedRelapseText(relapse, 'aiAdvice', languageId);
    const paragraphs = (advice || t('relapses.no_advice')).split(/\n{2,}|\r\n{2,}/).map(item => item.trim()).filter(Boolean);

    if (loading) {
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
                    <button type="button" className="relapse-back-button" onClick={() => navigate('/customer/relapses')}>
                        <ArrowLeft size={24} />
                    </button>
                    <h1>{t('relapses.conclusion_title')}</h1>
                </div>
                {relapse?.relapseId && (
                    <button
                        type="button"
                        className="relapse-icon-button"
                        onClick={() => navigate(`/customer/relapses/edit/${relapse.relapseId}`, { state: { relapse } })}
                    >
                        {t('common.edit')}
                    </button>
                )}
            </header>

            <main className="relapse-conclusion-card">
                <h2>{t('relapses.conclusions')}</h2>
                <div className="relapse-advice">
                    {paragraphs.map((paragraph, index) => (
                        <p key={`${paragraph.slice(0, 20)}-${index}`}>{paragraph}</p>
                    ))}
                </div>
                <div className="relapse-conclusion-actions">
                    <button type="button" className="relapse-primary-action" onClick={() => navigate('/customer/relapses')}>
                        {t('relapses.accept')}
                    </button>
                </div>
            </main>
        </div>
    );
};

export default RelapseConclusion;
