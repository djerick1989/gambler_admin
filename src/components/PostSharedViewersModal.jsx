import React, { useState, useEffect } from 'react';
import { postSharedService } from '../services/api';
import { Loader2, User as UserIcon, Calendar, X, Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PostSharedViewersModal = ({ postId, onClose }) => {
    const { t } = useTranslation();
    const [viewers, setViewers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 10,
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
            const response = await postSharedService.getAllPostSharedByPostId(postId, page, pagination.pageSize);
            if (response.status) {
                const newData = response.data.postShares || [];
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
            console.error("Error fetching share viewers:", err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const handleLoadMore = () => {
        if (pagination.page < pagination.lastPage) {
            fetchViewers(pagination.page + 1);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '1rem'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: '#FFFFFF',
                    border: '1px solid var(--stroke)',
                    borderRadius: '1rem',
                    width: '100%',
                    maxWidth: '600px',
                    maxHeight: '80vh',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
                    overflow: 'hidden'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid var(--glass-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <h2 style={{
                            margin: 0,
                            fontSize: '1.5rem',
                            fontWeight: '700',
                            color: 'var(--text-main)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <Share2 size={24} color="var(--primary)" />
                            {t('posts.shared_by') || 'Shared by'}
                        </h2>
                        <p style={{
                            margin: '0.25rem 0 0 0',
                            fontSize: '0.875rem',
                            color: 'var(--text-muted)'
                        }}>
                            {pagination.totalRecords} {pagination.totalRecords === 1 ? 'share' : 'shares'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: 'none',
                            borderRadius: '0.5rem',
                            padding: '0.5rem',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                            e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                            e.currentTarget.style.color = 'var(--text-muted)';
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '1rem'
                }}>
                    {loading ? (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: '3rem'
                        }}>
                            <Loader2 size={32} className="animate-spin" color="var(--primary)" />
                        </div>
                    ) : viewers.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '3rem',
                            color: 'var(--text-muted)'
                        }}>
                            <Share2 size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                            <p>{t('posts.no_shares') || 'No shares yet'}</p>
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gap: '0.75rem'
                        }}>
                            {viewers.map((share, idx) => (
                                <div
                                    key={share.postSharedId || idx}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        padding: '1rem',
                                        borderRadius: '0.75rem',
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        border: '1px solid rgba(255, 255, 255, 0.05)',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                                    }}
                                >
                                    {/* Avatar */}
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '50%',
                                        background: share.user?.avatar
                                            ? `url(${share.user.avatar}) center/cover`
                                            : '#f1f5f9',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        border: '2px solid rgba(255, 255, 255, 0.1)'
                                    }}>
                                        {!share.user?.avatar && <UserIcon size={24} color="var(--text-muted)" />}
                                    </div>

                                    {/* User Info */}
                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                        <div style={{
                                            fontSize: '1rem',
                                            fontWeight: '600',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            marginBottom: '0.25rem'
                                        }}>
                                            {share.user?.nickName || share.user?.name || share.userId?.substring(0, 8) || 'User'}
                                        </div>
                                        <div style={{
                                            fontSize: '0.875rem',
                                            color: 'var(--text-muted)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}>
                                            <Calendar size={14} />
                                            {formatDate(share.sharedAt)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer - Load More */}
                {!loading && pagination.page < pagination.lastPage && (
                    <div style={{
                        padding: '1rem',
                        borderTop: '1px solid var(--glass-border)'
                    }}>
                        <button
                            onClick={handleLoadMore}
                            disabled={loadingMore}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: 'var(--primary)',
                                border: 'none',
                                borderRadius: '0.5rem',
                                color: 'white',
                                fontSize: '0.875rem',
                                fontWeight: '700',
                                cursor: loadingMore ? 'default' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                transition: 'all 0.2s',
                                opacity: loadingMore ? 0.7 : 1
                            }}
                        >
                            {loadingMore && <Loader2 size={16} className="animate-spin" />}
                            {t('common.load_more') || 'Load more'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PostSharedViewersModal;
