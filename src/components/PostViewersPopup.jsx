import React, { useState, useEffect } from 'react';
import { postViewedService } from '../services/api';
import { Loader2, User as UserIcon, Calendar, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PostViewersPopup = ({ postId, onClose }) => {
    const { t } = useTranslation();
    const [viewers, setViewers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 5, // Small page size for popup
        totalRecords: 0,
        lastPage: 1
    });

    useEffect(() => {
        if (postId) {
            fetchViewers(1, true);
        }
    }, [postId]);

    const fetchViewers = async (page, reset = false) => {
        if (reset) setLoading(true);
        else setLoadingMore(true);

        try {
            const response = await postViewedService.getAllPostViewedByPostId(postId, page, pagination.pageSize);
            if (response.status) {
                const newData = response.data.postVieweds || [];
                if (reset) {
                    setViewers(newData);
                } else {
                    setViewers(prev => [...prev, ...newData]);
                }

                setPagination({
                    page: response.data.page,
                    pageSize: response.data.pageSize,
                    totalRecords: response.data.totalRecords,
                    lastPage: response.data.lastPage
                });
            }
        } catch (err) {
            console.error("Error fetching viewers:", err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const handleLoadMore = (e) => {
        e.stopPropagation();
        if (pagination.page < pagination.lastPage) {
            fetchViewers(pagination.page + 1);
        }
    };

    if (loading) {
        return (
            <div style={{
                position: 'absolute', bottom: '100%', left: '0', marginBottom: '10px',
                background: 'rgba(15, 23, 42, 0.95)', border: '1px solid var(--glass-border)',
                borderRadius: '0.75rem', padding: '1rem', width: '250px', zIndex: 100,
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(8px)',
                display: 'flex', justifyContent: 'center'
            }}>
                <Loader2 size={24} className="animate-spin" color="var(--primary)" />
            </div>
        );
    }

    return (
        <div style={{
            position: 'absolute', bottom: '100%', left: '0', marginBottom: '10px',
            background: 'rgba(15, 23, 42, 0.98)', border: '1px solid var(--glass-border)',
            borderRadius: '0.75rem', padding: '0.75rem', width: '280px', zIndex: 100,
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(12px)'
        }}
            onClick={(e) => e.stopPropagation()}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {t('posts.viewed_by') || 'Viewed by'}
                </div>
                <button
                    onClick={onClose}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                >
                    <X size={16} />
                </button>
            </div>

            {viewers.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    {t('posts.no_views') || 'No views yet'}
                </div>
            ) : (
                <>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '4px' }}>
                        {viewers.map((view, idx) => (
                            <div key={view.postViewedId || idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.4rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.03)' }}>
                                <div style={{
                                    width: '28px', height: '28px', borderRadius: '50%',
                                    background: view.user?.avatar ? `url(${view.user.avatar}) center/cover` : 'rgba(255,255,255,0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                }}>
                                    {!view.user?.avatar && <UserIcon size={14} color="var(--text-muted)" />}
                                </div>
                                <div style={{ overflow: 'hidden' }}>
                                    <div style={{ fontSize: '0.875rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {view.user?.nickName || view.userId?.substring(0, 8) || 'User'}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <Calendar size={10} />
                                        {new Date(view.viewedAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {pagination.page < pagination.lastPage && (
                        <button
                            onClick={handleLoadMore}
                            disabled={loadingMore}
                            style={{
                                width: '100%', marginTop: '0.75rem', padding: '0.5rem',
                                background: 'rgba(255,255,255,0.05)', border: 'none',
                                borderRadius: '0.5rem', color: 'var(--primary)',
                                fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                            }}
                        >
                            {loadingMore && <Loader2 size={12} className="animate-spin" />}
                            {t('common.load_more') || 'Load more'}
                        </button>
                    )}
                </>
            )}

            {/* Arrow */}
            <div style={{
                position: 'absolute', top: '100%', left: '1.5rem',
                borderLeft: '8px solid transparent', borderRight: '8px solid transparent',
                borderTop: '8px solid rgba(15, 23, 42, 0.95)',
                width: 0, height: 0
            }} />
        </div>
    );
};

export default PostViewersPopup;
