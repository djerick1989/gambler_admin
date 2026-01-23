import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Plus, Edit2, Trash2, Image as ImageIcon, Loader2,
    ChevronLeft, ChevronRight, X, Layout, AlertCircle, CheckCircle
} from 'lucide-react';
import { onboardingService, mediaService, languageService } from '../services/api';
import { useTranslation } from 'react-i18next';

const LANGUAGE_IDS = {
    en: '11e8ba3a-b290-4a2c-9dad-0f40e457f72c',
    es: '6892a523-0dc1-4e3b-9ddd-c9a558c7920b'
};

const OnBoarding = () => {
    const { t, i18n } = useTranslation();
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

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOnboarding, setEditingOnboarding] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [formData, setFormData] = useState({
        description: '',
        imageUrl: '',
        order: 0,
        languageId: ''
    });

    const fileInputRef = useRef(null);

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

    const handleOpenModal = (onboarding = null) => {
        if (onboarding) {
            setEditingOnboarding(onboarding);
            setFormData({
                description: onboarding.description,
                imageUrl: onboarding.imageUrl,
                order: onboarding.order,
                languageId: onboarding.languageId
            });
        } else {
            setEditingOnboarding(null);
            setFormData({
                description: '',
                imageUrl: '',
                order: 0,
                languageId: currentLanguageId
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingOnboarding(null);
        setFormData({
            description: '',
            imageUrl: '',
            order: 0,
            languageId: currentLanguageId
        });
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const response = await mediaService.upload(file);
            if (response.status && response.data?.url) {
                setFormData(prev => ({ ...prev, imageUrl: response.data.url }));
            }
        } catch (err) {
            console.error("Error uploading image:", err);
            alert("Error uploading image");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.imageUrl) {
            alert(t('onboarding.form.image_hint'));
            return;
        }

        try {
            if (editingOnboarding) {
                await onboardingService.update({
                    onboardingConfigId: editingOnboarding.onboardingConfigId,
                    ...formData
                });
            } else {
                await onboardingService.create(formData);
            }
            handleCloseModal();
            fetchOnboardings();
        } catch (err) {
            console.error("Error saving onboarding:", err);
            alert("Error saving onboarding");
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
                    <button onClick={() => handleOpenModal()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                                        <div style={{ width: '80px', height: '60px', borderRadius: '0.5rem', overflow: 'hidden', background: 'rgba(255,255,255,0.05)' }}>
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
                                            <button onClick={() => handleOpenModal(item)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Edit2 size={18} /></button>
                                            <button onClick={() => handleDelete(item.onboardingConfigId)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={18} /></button>
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
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '0.4rem',
                                    color: 'white',
                                    padding: '0.25rem 0.5rem',
                                    fontSize: '0.875rem',
                                    cursor: 'pointer',
                                    outline: 'none'
                                }}
                            >
                                <option value={10} style={{ background: '#1a1a2e' }}>10</option>
                                <option value={20} style={{ background: '#1a1a2e' }}>20</option>
                                <option value={50} style={{ background: '#1a1a2e' }}>50</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                                style={{ background: 'none', border: 'none', color: page === 1 ? 'var(--text-muted)' : 'white', cursor: page === 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                                {t('common.page_x_of_y', { current: page, total: totalPages })}
                            </span>
                            <button
                                disabled={page >= totalPages}
                                onClick={() => setPage(page + 1)}
                                style={{ background: 'none', border: 'none', color: page >= totalPages ? 'var(--text-muted)' : 'white', cursor: page >= totalPages ? 'default' : 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
                    <div className="glass-card animate-scale-in" style={{ width: '100%', maxWidth: '500px', padding: '2rem', position: 'relative' }}>
                        <button onClick={handleCloseModal} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                            <X size={24} />
                        </button>

                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {editingOnboarding ? t('onboarding.edit') : t('onboarding.add_new')}
                        </h2>

                        <form onSubmit={handleSubmit}>
                            <div className="input-group">
                                <label>{t('onboarding.form.description')}</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder={t('onboarding.form.description_placeholder')}
                                    required
                                    style={{ width: '100%', minHeight: '100px', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '0.5rem', color: 'white' }}
                                />
                            </div>

                            <div className="input-group">
                                <label>{t('onboarding.form.order')}</label>
                                <input
                                    type="number"
                                    value={formData.order}
                                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label>{t('onboarding.form.image')}</label>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px dashed var(--glass-border)',
                                        borderRadius: '0.5rem',
                                        padding: '1.5rem',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        minHeight: '150px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    {isUploading ? (
                                        <Loader2 className="animate-spin" color="var(--primary)" />
                                    ) : formData.imageUrl ? (
                                        <>
                                            <img src={formData.imageUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '120px', borderRadius: '0.5rem', marginBottom: '1rem' }} />
                                            <div style={{ fontSize: '0.75rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <CheckCircle size={14} /> Change Image
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <ImageIcon size={32} color="var(--text-muted)" style={{ marginBottom: '0.5rem' }} />
                                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{t('onboarding.form.image_hint')}</p>
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button type="button" onClick={handleCloseModal} className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'white' }}>
                                    {t('onboarding.form.cancel')}
                                </button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isUploading}>
                                    {t('onboarding.form.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OnBoarding;
