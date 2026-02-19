import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Newspaper, Calendar, MessageSquare, ChevronLeft, ChevronRight,
    Loader2, ArrowRight
} from 'lucide-react';
import { newsService } from '../services/api';
import { useTranslation } from 'react-i18next';

const NewsGallery = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 12,
        totalRecords: 0,
        lastPage: 1
    });

    const LANGUAGE_IDS = {
        en: '11e8ba3a-b290-4a2c-9dad-0f40e457f72c',
        es: '6892a523-0dc1-4e3b-9ddd-c9a558c7920b'
    };

    useEffect(() => {
        fetchNews();
    }, [pagination.page, i18n.language]);

    const fetchNews = async () => {
        setLoading(true);
        try {
            const lang = i18n.language.substring(0, 2).toLowerCase();
            const languageId = LANGUAGE_IDS[lang] || LANGUAGE_IDS.en;
            const response = await newsService.getAllNews(pagination.page, pagination.pageSize, languageId);

            if (response.status) {
                setNews(response.data.newsList);
                setPagination(prev => ({
                    ...prev,
                    totalRecords: response.data.totalRecords,
                    lastPage: response.data.lastPage
                }));
            }
        } catch (err) {
            console.error("Error fetching news:", err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString(i18n.language, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div style={{ padding: '1rem' }}>
            <div style={{ marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                    {t('news.gallery.title') || 'Latest News'}
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                    {t('news.gallery.subtitle') || 'Explore our latest updates and stories'}
                </p>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                    <Loader2 size={48} className="animate-spin" color="var(--primary)" />
                </div>
            ) : news.length === 0 ? (
                <div className="glass-card" style={{ padding: '5rem', textAlign: 'center' }}>
                    <Newspaper size={80} style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', opacity: 0.2 }} />
                    <h3 style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>{t('news_mgmt.empty')}</h3>
                </div>
            ) : (
                <>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                        gap: '2.5rem',
                        marginBottom: '4rem'
                    }}>
                        {news.map((item) => {
                            const mainTranslation = item.translations[0] || { title: 'Untitled', contentHtml: '' };
                            return (
                                <div
                                    key={item.newsId}
                                    className="glass-card"
                                    onClick={() => navigate(`/news/view/${item.newsId}`)}
                                    style={{
                                        padding: 0,
                                        overflow: 'hidden',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        border: '1px solid var(--stroke)',
                                        background: 'white',
                                        borderRadius: '1.25rem',
                                        position: 'relative'
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-10px)';
                                        e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <div style={{
                                        height: '220px',
                                        background: `url(${item.mediaUrl}) center/cover no-repeat`,
                                        position: 'relative'
                                    }}>
                                        <div style={{
                                            position: 'absolute',
                                            bottom: 0,
                                            left: 0,
                                            right: 0,
                                            padding: '2rem 1rem 1rem',
                                            background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
                                            display: 'flex',
                                            justifyContent: 'flex-end'
                                        }}>
                                            <span style={{
                                                background: 'rgba(255,255,255,0.2)',
                                                backdropFilter: 'blur(5px)',
                                                color: 'white',
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '2rem',
                                                fontSize: '0.75rem',
                                                fontWeight: 'bold'
                                            }}>
                                                {formatDate(item.createdAt)}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <h3 style={{
                                            fontSize: '1.25rem',
                                            fontWeight: '800',
                                            marginBottom: '1rem',
                                            color: 'var(--text-main)',
                                            lineHeight: '1.4',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden'
                                        }}>
                                            {mainTranslation.title}
                                        </h3>

                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            marginTop: 'auto',
                                            paddingTop: '1rem',
                                            borderTop: '1px solid #f1f5f9'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                                <MessageSquare size={16} />
                                                {item.totalComments} {t('news.comments') || 'Comments'}
                                            </div>
                                            <div style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: '700', fontSize: '0.875rem' }}>
                                                {t('news.read_more') || 'Read More'}
                                                <ArrowRight size={16} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {pagination.lastPage > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', paddingBottom: '2rem' }}>
                            <button
                                disabled={pagination.page === 1}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                className="btn btn-outline"
                                style={{
                                    width: '45px',
                                    height: '45px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: 0,
                                    opacity: pagination.page === 1 ? 0.3 : 1
                                }}
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <span style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--text-main)' }}>
                                {pagination.page} / {pagination.lastPage}
                            </span>
                            <button
                                disabled={pagination.page === pagination.lastPage}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                className="btn btn-outline"
                                style={{
                                    width: '45px',
                                    height: '45px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: 0,
                                    opacity: pagination.page === pagination.lastPage ? 0.3 : 1
                                }}
                            >
                                <ChevronRight size={24} />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default NewsGallery;
