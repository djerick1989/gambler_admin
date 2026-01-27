import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Search, Edit2, Trash2, Newspaper,
    Calendar, MessageSquare, ChevronLeft, ChevronRight, Loader2
} from 'lucide-react';
import { newsService } from '../services/api';
import { useTranslation } from 'react-i18next';

import NewsComments from './NewsComments';

const NewsList = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('news'); // 'news' or 'comments'
    const [selectedNewsId, setSelectedNewsId] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 10,
        totalRecords: 0,
        lastPage: 1
    });

    const LANGUAGE_IDS = {
        en: '11e8ba3a-b290-4a2c-9dad-0f40e457f72c',
        es: '6892a523-0dc1-4e3b-9ddd-c9a558c7920b'
    };

    useEffect(() => {
        if (activeTab === 'news') {
            fetchNews();
        }
    }, [pagination.page, i18n.language, activeTab]);

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

    const handleDelete = async (id) => {
        if (window.confirm(t('news_mgmt.delete_confirm'))) {
            try {
                const response = await newsService.deleteNews(id);
                if (response.status) {
                    fetchNews();
                }
            } catch (err) {
                console.error("Error deleting news:", err);
                alert("Error deleting news");
            }
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString(i18n.language, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleCommentClick = (e, newsId) => {
        e.stopPropagation();
        setSelectedNewsId(newsId);
        setActiveTab('comments');
    };

    return (
        <div style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: '800', marginBottom: '0.5rem' }}>
                        {t('news_mgmt.title')}
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>{t('news_mgmt.subtitle')}</p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {/* Tab Switcher */}
                    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '0.25rem', borderRadius: '0.5rem' }}>
                        <button
                            onClick={() => { setActiveTab('news'); setSelectedNewsId(null); }}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '0.4rem',
                                border: 'none',
                                background: activeTab === 'news' ? 'var(--primary)' : 'transparent',
                                color: 'white',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                transition: 'all 0.2s',
                                fontSize: '0.875rem',
                                fontWeight: '600'
                            }}
                        >
                            <Newspaper size={18} />
                            {t('news_mgmt.news_tab') || 'News'}
                        </button>
                        <button
                            onClick={() => { setActiveTab('comments'); setSelectedNewsId(null); }}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '0.4rem',
                                border: 'none',
                                background: activeTab === 'comments' ? 'var(--primary)' : 'transparent',
                                color: 'white',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                transition: 'all 0.2s',
                                fontSize: '0.875rem',
                                fontWeight: '600'
                            }}
                        >
                            <MessageSquare size={18} />
                            {t('news_mgmt.comments_tab') || 'Comments'}
                        </button>
                    </div>

                    <button
                        onClick={() => navigate('/news/new')}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '42px' }}
                    >
                        <Plus size={20} />
                        {t('news_mgmt.add_new')}
                    </button>
                </div>
            </div>

            {activeTab === 'news' ? (
                <>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                            <Loader2 size={48} className="animate-spin" color="var(--primary)" />
                        </div>
                    ) : news.length === 0 ? (
                        <div className="glass-card" style={{ padding: '4rem', textAlign: 'center' }}>
                            <Newspaper size={64} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                            <h3>{t('news_mgmt.empty')}</h3>
                        </div>
                    ) : (
                        <>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                                gap: '2rem',
                                marginBottom: '2rem'
                            }}>
                                {news.map((item) => {
                                    const mainTranslation = item.translations[0] || { title: 'Untitled', contentHtml: '' };
                                    return (
                                        <div key={item.newsId} className="glass-card" style={{
                                            padding: 0,
                                            overflow: 'hidden',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            transition: 'transform 0.2s',
                                            border: '1px solid var(--glass-border)'
                                        }}>
                                            <div style={{
                                                height: '200px',
                                                background: `url(${item.mediaUrl}) center/cover no-repeat`,
                                                position: 'relative'
                                            }}>
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '1rem',
                                                    right: '1rem',
                                                    display: 'flex',
                                                    gap: '0.5rem'
                                                }}>
                                                    <button
                                                        onClick={() => navigate(`/news/edit/${item.newsId}`)}
                                                        style={{
                                                            background: 'rgba(59, 130, 246, 0.9)',
                                                            border: 'none',
                                                            color: 'white',
                                                            padding: '0.5rem',
                                                            borderRadius: '0.5rem',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item.newsId)}
                                                        style={{
                                                            background: 'rgba(239, 68, 68, 0.9)',
                                                            border: 'none',
                                                            color: 'white',
                                                            padding: '0.5rem',
                                                            borderRadius: '0.5rem',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                    {mainTranslation.title}
                                                </h3>

                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 'auto' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                        <Calendar size={14} />
                                                        {formatDate(item.createdAt)}
                                                    </div>
                                                    <div
                                                        onClick={(e) => handleCommentClick(e, item.newsId)}
                                                        style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', color: 'var(--primary)', fontWeight: '600' }}
                                                    >
                                                        <MessageSquare size={14} />
                                                        {item.totalComments}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Pagination */}
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
                                <button
                                    disabled={pagination.page === 1}
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                    className="btn"
                                    style={{ padding: '0.5rem', opacity: pagination.page === 1 ? 0.5 : 1 }}
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <span style={{ fontWeight: '600' }}>
                                    {t('common.page_x_of_y', { current: pagination.page, total: pagination.lastPage })}
                                </span>
                                <button
                                    disabled={pagination.page === pagination.lastPage}
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                    className="btn"
                                    style={{ padding: '0.5rem', opacity: pagination.page === pagination.lastPage ? 0.5 : 1 }}
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </>
                    )}
                </>
            ) : (
                <NewsComments
                    newsId={selectedNewsId}
                    onBack={() => { setSelectedNewsId(null); setActiveTab('news'); }}
                />
            )}
        </div>
    );
};

export default NewsList;
