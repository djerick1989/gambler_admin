import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { mediaService } from '../services/api';
import { Trash2, ExternalLink, Image as ImageIcon, Film, FileText, Loader2, AlertCircle } from 'lucide-react';

const MediaList = () => {
    const { t } = useTranslation();
    const [media, setMedia] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [continuationToken, setContinuationToken] = useState(null);
    const [error, setError] = useState(null);

    const fetchMedia = async (token = null, isLoadMore = false) => {
        try {
            if (isLoadMore) setLoadingMore(true);
            else setLoading(true);

            const response = await mediaService.listAWSMedia(20, token);

            if (response.status) {
                if (isLoadMore) {
                    setMedia(prev => [...prev, ...response.data.items]);
                } else {
                    setMedia(response.data.items);
                }
                setContinuationToken(response.data.nextContinuationToken);
            } else {
                setError(response.errorMessage || 'Error fetching media');
            }
        } catch (err) {
            setError(err.message || 'Error fetching media');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchMedia();
    }, []);

    const handleDelete = async (key) => {
        if (window.confirm(t('media_mgmt.delete_confirm'))) {
            try {
                const response = await mediaService.deleteAWSMedia(key);
                if (response.status) {
                    setMedia(prev => prev.filter(item => item.key !== key));
                } else {
                    alert(response.errorMessage || 'Error deleting media');
                }
            } catch (err) {
                alert(err.message || 'Error deleting media');
            }
        }
    };

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (key) => {
        const ext = key.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <ImageIcon size={20} />;
        if (['mp4', 'webm', 'ogg', 'mov'].includes(ext)) return <Film size={20} />;
        return <FileText size={20} />;
    };

    const isImage = (key) => {
        const ext = key.split('.').pop().toLowerCase();
        return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
    };

    if (loading && media.length === 0) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <Loader2 className="animate-spin" size={48} color="var(--primary)" />
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: '800', marginBottom: '0.5rem' }}>{t('media_mgmt.title')}</h1>
                <p style={{ color: 'var(--text-muted)' }}>{t('media_mgmt.subtitle')}</p>
            </div>

            {error && (
                <div className="glass-card" style={{ padding: '1rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderColor: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)' }}>
                    <AlertCircle size={20} color="var(--danger)" />
                    <span style={{ color: 'var(--danger)' }}>{error}</span>
                </div>
            )}

            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                                <th style={{ padding: '1rem' }}>Preview</th>
                                <th style={{ padding: '1rem' }}>{t('media_mgmt.table.key')}</th>
                                <th style={{ padding: '1rem' }}>{t('media_mgmt.table.size')}</th>
                                <th style={{ padding: '1rem' }}>{t('media_mgmt.table.lastModified')}</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>{t('media_mgmt.table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {media.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        {t('media_mgmt.empty')}
                                    </td>
                                </tr>
                            ) : (
                                media.map((item) => (
                                    <tr key={item.key} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ width: '60px', height: '60px', borderRadius: '0.5rem', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                {isImage(item.key) ? (
                                                    <img src={item.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    getFileIcon(item.key)
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontSize: '0.875rem', fontWeight: '500', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {item.key}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                            {formatSize(item.sizeBytes)}
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                            {new Date(item.lastModified).toLocaleString()}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                <a href={item.url} target="_blank" rel="noopener noreferrer" className="btn-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', color: 'white', transition: 'all 0.2s' }}>
                                                    <ExternalLink size={16} />
                                                </a>
                                                <button onClick={() => handleDelete(item.key)} className="btn-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {continuationToken && (
                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
                    <button
                        onClick={() => fetchMedia(continuationToken, true)}
                        disabled={loadingMore}
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 2rem' }}
                    >
                        {loadingMore ? <Loader2 className="animate-spin" size={20} /> : null}
                        {t('media_mgmt.load_more')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default MediaList;
