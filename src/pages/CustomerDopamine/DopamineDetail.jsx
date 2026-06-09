import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { dopamineService } from '../../services/api';
import { getLanguageId } from '../../utils/languages';
import { DOPAMINE_TYPE, getYouTubeEmbedUrl, normalizeHtmlContent, toArray, unwrapApiData } from './dopamineUtils';
import './Dopamine.css';

const normalizeDopamineByLanguage = (response, languageId) => {
    const data = unwrapApiData(response);
    const list = toArray(data);
    if (!list.length) return null;

    const scoredList = list
        .map(item => {
            const translations = toArray(item?.translations);
            const exactTranslation = translations.find(entry => entry?.languageId === languageId);
            const rootMatchesLanguage = item?.languageId === languageId;
            const score = exactTranslation ? 3 : rootMatchesLanguage ? 2 : !item?.languageId ? 1 : 0;
            const updatedAt = item?.updatedAt ? new Date(item.updatedAt).getTime() : 0;

            return {
                item,
                exactTranslation,
                rootMatchesLanguage,
                score,
                updatedAt
            };
        })
        .sort((a, b) => b.score - a.score || b.updatedAt - a.updatedAt);

    const selected = scoredList[0];
    const content = selected?.item;
    const translations = toArray(content?.translations);
    const translation = selected?.exactTranslation || (!selected?.rootMatchesLanguage ? translations[0] : {}) || {};

    return {
        ...content,
        title: translation.title || content?.title || '',
        description: translation.description || content?.description || '',
        videoUrl: translation.videoUrl || translation.videoURL || content?.videoUrl || content?.videoURL || ''
    };
};

const relatedTypes = [
    DOPAMINE_TYPE.DOPAMINE,
    DOPAMINE_TYPE.ADRENALINE,
    DOPAMINE_TYPE.REWARD_SYSTEM
];

const getContentHtml = (content) => (
    normalizeHtmlContent(
        content?.description ||
        content?.content ||
        content?.html ||
        content?.body ||
        ''
    )
);

const getVideoUrl = (content) => (
    content?.videoUrl ||
    content?.videoURL ||
    content?.urlVideo ||
    content?.video ||
    ''
);

const isDirectVideoUrl = (url = '') => /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url);

const DopamineDetail = () => {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const [item, setItem] = useState(null);
    const [related, setRelated] = useState([]);
    const [loading, setLoading] = useState(true);

    const languageId = getLanguageId(i18n.language);
    const type = Number.isInteger(Number(id)) ? Number(id) : DOPAMINE_TYPE.DOPAMINE;

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [type]);

    useEffect(() => {
        const fetchContent = async () => {
            setLoading(true);
            try {
                const response = await dopamineService.getByType(type);
                const content = normalizeDopamineByLanguage(response, languageId);
                setItem(content ? { ...content, type } : null);
            } catch (err) {
                console.error('Error loading dopamine detail:', err);
                setItem(null);
            } finally {
                setLoading(false);
            }
        };

        fetchContent();
    }, [languageId, type]);

    useEffect(() => {
        const fetchRelated = async () => {
            const items = await Promise.all(
                relatedTypes
                    .filter(relatedType => relatedType !== type)
                    .map(async (relatedType) => {
                        try {
                            const response = await dopamineService.getByType(relatedType);
                            const content = normalizeDopamineByLanguage(response, languageId);
                            return content ? { ...content, type: relatedType } : null;
                        } catch (err) {
                            console.error('Error loading dopamine related item:', err);
                            return null;
                        }
                    })
            );

            setRelated(items.filter(Boolean));
        };

        fetchRelated();
    }, [languageId, type]);

    const videoUrl = getVideoUrl(item);
    const embedUrl = useMemo(() => getYouTubeEmbedUrl(videoUrl), [videoUrl]);
    const hasYouTubeVideo = Boolean(embedUrl && embedUrl.includes('youtube.com/embed/'));
    const hasDirectVideo = Boolean(videoUrl && (!hasYouTubeVideo || isDirectVideoUrl(videoUrl)));

    if (loading) {
        return (
            <div style={{ display: 'flex', minHeight: '70vh', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 className="animate-spin" size={46} color="var(--primary)" />
            </div>
        );
    }

    if (!item) {
        return (
            <div className="dopamine-page">
                <button className="dopamine-back" onClick={() => navigate('/customer/dopamine')}>
                    <ArrowLeft size={22} />
                </button>
                <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                    {t('dopamine.empty_content')}
                </p>
            </div>
        );
    }

    return (
        <div className="dopamine-page">
            <div className="dopamine-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button className="dopamine-back" onClick={() => navigate('/customer/dopamine')}>
                        <ArrowLeft size={22} />
                    </button>
                    <h1>{item.title}</h1>
                </div>
            </div>

            <div className="dopamine-detail-layout">
                <article className="dopamine-main-column">
                    <section className="dopamine-video" aria-label={item.title}>
                        {hasYouTubeVideo ? (
                            <iframe
                                title={item.title}
                                src={embedUrl}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        ) : hasDirectVideo ? (
                            <video controls preload="metadata">
                                <source src={videoUrl} />
                            </video>
                        ) : (
                            <div className="dopamine-video-empty" />
                        )}
                    </section>

                    <div className="dopamine-article" dangerouslySetInnerHTML={{ __html: getContentHtml(item) }} />
                </article>

                <aside className="dopamine-side-panel">
                    <h3>{t('dopamine.next_steps')}</h3>
                    <div className="dopamine-list">
                        <button onClick={() => navigate('/customer/dopamine/control')}>
                            <ShieldCheck size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                            {t('dopamine.start_control')}
                        </button>
                        {related
                            .slice(0, 3)
                            .map(content => (
                                <button
                                    key={`${content.type}-${content.title}`}
                                    onClick={() => navigate(`/customer/dopamine/content/${content.type}`)}
                                >
                                    {content.title}
                                </button>
                            ))}
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default DopamineDetail;
