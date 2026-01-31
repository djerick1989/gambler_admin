import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, User, ChevronLeft, MessageSquare, AlertCircle } from 'lucide-react';
import { gamblerService, postService } from '../services/api';
import PostCard from '../components/PostCard';
import { useTranslation } from 'react-i18next';

const LANGUAGE_IDS = {
    en: '11e8ba3a-b290-4a2c-9dad-0f40e457f72c',
    es: '6892a523-0dc1-4e3b-9ddd-c9a558c7920b'
};

const UserProfileView = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();

    const [gambler, setGambler] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 10,
        totalRecords: 0,
        lastPage: 1
    });

    useEffect(() => {
        if (userId) {
            fetchProfile();
            fetchPosts(1, true);
        }
    }, [userId, i18n.language]);

    const fetchProfile = async () => {
        try {
            const response = await gamblerService.getGamblerByUserId(userId);
            if (response.status) {
                setGambler(response.data);
            }
        } catch (err) {
            console.error("Error fetching profile:", err);
            setError("Error loading profile");
        }
    };

    const fetchPosts = async (page, reset = false) => {
        if (reset) setLoadingPosts(true);
        else setLoadingMore(true);

        try {
            const lang = i18n.language.substring(0, 2).toLowerCase();
            const languageId = LANGUAGE_IDS[lang] || LANGUAGE_IDS.en;

            const response = await postService.getPostsByUserId(userId, page, pagination.pageSize, languageId);
            if (response.status) {
                if (reset) {
                    setPosts(response.data.posts);
                } else {
                    setPosts(prev => [...prev, ...response.data.posts]);
                }

                setPagination({
                    page: response.data.page,
                    pageSize: response.data.pageSize,
                    totalRecords: response.data.totalRecords,
                    lastPage: response.data.lastPage
                });
            }
        } catch (err) {
            console.error("Error fetching user posts:", err);
        } finally {
            setLoading(false);
            setLoadingPosts(false);
            setLoadingMore(false);
        }
    };

    const handleLoadMore = () => {
        if (pagination.page < pagination.lastPage) {
            fetchPosts(pagination.page + 1);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <Loader2 size={48} className="animate-spin" color="var(--primary)" />
            </div>
        );
    }

    if (!gambler) {
        return (
            <div style={{ maxWidth: '800px', margin: '2rem auto' }} className="glass-card">
                <div style={{ padding: '3rem', textAlign: 'center' }}>
                    <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
                    <h3 style={{ color: 'white' }}>Profile not found</h3>
                    <button onClick={() => navigate(-1)} className="btn btn-primary" style={{ marginTop: '1rem' }}>
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }} className="animate-fade-in">
            {/* Header / Back Button */}
            <div style={{ marginBottom: '2rem' }}>
                <button
                    onClick={() => navigate(-1)}
                    className="btn"
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '0.5rem', marginBottom: '1.5rem' }}
                >
                    <ChevronLeft size={24} />
                </button>

                {/* Profile Info Card */}
                <div className="glass-card" style={{ padding: '2rem', display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    <div style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        background: gambler.user?.avatar ? `url(${gambler.user.avatar}) center/cover` : 'rgba(255,255,255,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '3px solid var(--primary)',
                        flexShrink: 0
                    }}>
                        {!gambler.user?.avatar && <User size={48} color="var(--text-muted)" />}
                    </div>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.25rem', color: 'white' }}>
                            {gambler.user?.name || 'User'}
                        </h1>
                        <p style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '1.1rem', marginBottom: '1rem' }}>
                            @{gambler.user?.nickName}
                        </p>
                        <div
                            style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}
                            dangerouslySetInnerHTML={{ __html: gambler.biography || `<p>${t('user_profile.no_bio')}</p>` }}
                        />
                    </div>
                </div>
            </div>

            {/* Posts List */}
            <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'white', marginBottom: '1.5rem' }}>
                    {t('user_profile.posts_by', { name: gambler.user?.nickName })}
                </h2>

                {loadingPosts ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                        <Loader2 className="animate-spin" color="var(--primary)" />
                    </div>
                ) : posts.length === 0 ? (
                    <div className="glass-card" style={{ padding: '4rem', textAlign: 'center' }}>
                        <MessageSquare size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.5 }} />
                        <h3 style={{ color: 'var(--text-muted)' }}>{t('posts.empty')}</h3>
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {posts.map(post => (
                                <PostCard
                                    key={post.postId}
                                    post={post}
                                // Public view - no edit/delete actions normally, or they will be handled by PostCard internal check
                                />
                            ))}
                        </div>

                        {pagination.page < pagination.lastPage && (
                            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem', marginBottom: '3rem' }}>
                                <button
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                    className="btn"
                                    style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        color: 'white',
                                        padding: '0.75rem 2rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    {loadingMore && <Loader2 size={18} className="animate-spin" />}
                                    {t('common.load_more')}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default UserProfileView;
