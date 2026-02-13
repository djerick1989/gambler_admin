import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Edit2, Trash2, Loader2,
    ChevronLeft, ChevronRight, X, AlertCircle
} from 'lucide-react';
import { onboardingService } from '../services/api';
import { useTranslation } from 'react-i18next';

const LANGUAGE_IDS = {
    en: '11e8ba3a-b290-4a2c-9dad-0f40e457f72c',
    es: '6892a523-0dc1-4e3b-9ddd-c9a558c7920b'
};

const OnBoarding = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [onboardings, setOnboardings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Global language mapping
    const currentLanguageId = useMemo(() => {
        const lang = i18n.language.substring(0, 2).toLowerCase();
        return LANGUAGE_IDS[lang] || LANGUAGE_IDS.en;
    }, [i18n.language]);

    // Pagination state
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [previewImage, setPreviewImage] = useState(null); // Full-screen preview state

    useEffect(() => {
        setPage(1); // Reset page when language changes
    }, [currentLanguageId]);

    useEffect(() => {
        fetchOnboardings();
    }, [currentLanguageId, page, pageSize]);

    const fetchOnboardings = async () => {
        setLoading(true);
        try {
            const response = await onboardingService.getAllByLanguage(currentLanguageId, page, pageSize);
            if (response.status && response.data) {
                const data = response.data.onBoardingConfigDtos || [];
                setOnboardings(data);
                setTotalPages(response.data.lastPage || 1);
            } else {
                setOnboardings([]);
            }
        } catch (err) {
            console.error("Error fetching onboardings:", err);
            setOnboardings([]);
            setError(t('onboarding.empty'));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm(t('onboarding.delete_confirm'))) {
            try {
                await onboardingService.delete(id);
                fetchOnboardings();
            } catch (err) {
                console.error("Error deleting onboarding:", err);
                alert("Error deleting onboarding");
            }
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: '800' }}>{t('onboarding.title')}</h1>
                    <p style={{ color: 'var(--text-muted)' }}>{t('onboarding.subtitle')}</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button
                        onClick={() => navigate('/onboarding/new')}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Plus size={20} /> {t('onboarding.add_new')}
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                    <Loader2 size={48} className="animate-spin" color="var(--primary)" />
                </div>
            ) : (onboardings?.length === 0) ? (
                <div className="glass-card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <AlertCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                    <p>{t('onboarding.empty')}</p>
                </div>
            ) : (
                <div className="glass-card" style={{ overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--glass-border)' }}>
                                <th style={{ padding: '1.25rem' }}>{t('onboarding.table.image')}</th>
                                <th style={{ padding: '1.25rem' }}>{t('onboarding.table.description')}</th>
                                <th style={{ padding: '1.25rem' }}>{t('onboarding.table.order')}</th>
                                <th style={{ padding: '1.25rem' }}>{t('onboarding.table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {onboardings?.map(item => (
                                <tr key={item.onboardingConfigId} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                    <td style={{ padding: '1rem 1.25rem' }}>
                                        <div
                                            onClick={() => setPreviewImage(item.imageUrl)}
                                            style={{
                                                width: '120px',
                                                height: '90px',
                                                borderRadius: '0.5rem',
                                                overflow: 'hidden',
                                                background: 'rgba(255,255,255,0.05)',
                                                cursor: 'zoom-in',
                                                transition: 'transform 0.2s'
                                            }}
                                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                        >
                                            <img src={item.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.25rem' }}>{item.description}</td>
                                    <td style={{ padding: '1.25rem' }}>
                                        <span style={{ padding: '0.25rem 0.75rem', borderRadius: '1rem', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', fontSize: '0.875rem', fontWeight: 'bold' }}>
                                            {item.order}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1.25rem' }}>
                                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                                            <button
                                                onClick={() => navigate(`/onboarding/edit/${item.onboardingConfigId}`)}
                                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.onboardingConfigId)}
                                                style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', borderTop: '1px solid var(--glass-border)', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{t('common.rows_per_page')}</span>
                            <select
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(parseInt(e.target.value));
                                    setPage(1);
                                }}
                                style={{
                                    background: '#FFFFFF',
                                    border: '1px solid var(--stroke)',
                                    borderRadius: '0.4rem',
                                    color: 'var(--text-main)',
                                    padding: '0.25rem 0.5rem',
                                    fontSize: '0.875rem',
                                    cursor: 'pointer',
                                    outline: 'none'
                                }}
                            >
                                <option value={10} style={{ background: '#FFFFFF', color: 'var(--text-main)' }}>10</option>
                                <option value={20} style={{ background: '#FFFFFF', color: 'var(--text-main)' }}>20</option>
                                <option value={50} style={{ background: '#FFFFFF', color: 'var(--text-main)' }}>50</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                                style={{ background: 'none', border: 'none', color: page === 1 ? 'var(--text-muted)' : 'var(--text-main)', cursor: page === 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-main)' }}>
                                {t('common.page_x_of_y', { current: page, total: totalPages })}
                            </span>
                            <button
                                disabled={page >= totalPages}
                                onClick={() => setPage(page + 1)}
                                style={{ background: 'none', border: 'none', color: page >= totalPages ? 'var(--text-muted)' : 'var(--text-main)', cursor: page >= totalPages ? 'default' : 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Preview Modal */}
            {previewImage && (
                <div
                    onClick={() => setPreviewImage(null)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2000,
                        backdropFilter: 'blur(10px)',
                        cursor: 'zoom-out'
                    }}
                >
                    <button
                        onClick={() => setPreviewImage(null)}
                        style={{ position: 'absolute', top: '2rem', right: '2rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%', display: 'flex' }}
                    >
                        <X size={32} />
                    </button>
                    <img
                        src={previewImage}
                        alt="Full Preview"
                        style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: '0.5rem', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
};

export default OnBoarding;
