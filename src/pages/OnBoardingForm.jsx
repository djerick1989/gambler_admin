import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ChevronLeft, Loader2, Image as ImageIcon,
    CheckCircle, Save, X
} from 'lucide-react';
import { onboardingService, mediaService } from '../services/api';
import { useTranslation } from 'react-i18next';

const LANGUAGE_IDS = {
    en: '11e8ba3a-b290-4a2c-9dad-0f40e457f72c',
    es: '6892a523-0dc1-4e3b-9ddd-c9a558c7920b'
};

const OnBoardingForm = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = Boolean(id);

    const [loading, setLoading] = useState(isEditing);
    const [isUploading, setIsUploading] = useState(false);
    const [formData, setFormData] = useState({
        description: '',
        imageUrl: '',
        order: 0,
        languageId: ''
    });

    const fileInputRef = useRef(null);

    useEffect(() => {
        const lang = i18n.language.substring(0, 2).toLowerCase();
        const defaultLangId = LANGUAGE_IDS[lang] || LANGUAGE_IDS.en;

        if (isEditing) {
            fetchOnboarding(id);
        } else {
            setFormData(prev => ({ ...prev, languageId: defaultLangId }));
        }
    }, [id, isEditing, i18n.language]);

    const fetchOnboarding = async (onboardingId) => {
        try {
            const response = await onboardingService.getAllByLanguage(LANGUAGE_IDS.en, 1, 100); // Temporary hack to find the item
            // Note: Ideally we would have a getById endpoint. Since we don't, we might need to search or rely on the service.
            // For now, let's assume we can at least find it in the current language context if we are editing.
            const lang = i18n.language.substring(0, 2).toLowerCase();
            const currentLangId = LANGUAGE_IDS[lang] || LANGUAGE_IDS.en;
            const res = await onboardingService.getAllByLanguage(currentLangId, 1, 100);

            const item = res.data.onBoardingConfigDtos.find(x => x.onboardingConfigId === onboardingId);
            if (item) {
                setFormData({
                    description: item.description,
                    imageUrl: item.imageUrl,
                    order: item.order,
                    languageId: item.languageId
                });
            }
        } catch (err) {
            console.error("Error fetching onboarding for edit:", err);
        } finally {
            setLoading(false);
        }
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
            if (isEditing) {
                await onboardingService.update({
                    onboardingConfigId: id,
                    ...formData
                });
            } else {
                await onboardingService.create(formData);
            }
            navigate('/onboarding');
        } catch (err) {
            console.error("Error saving onboarding:", err);
            alert("Error saving onboarding");
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <Loader2 size={48} className="animate-spin" color="var(--primary)" />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    onClick={() => navigate('/onboarding')}
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: 'none',
                        color: 'white',
                        padding: '0.5rem',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        display: 'flex'
                    }}
                >
                    <ChevronLeft size={24} />
                </button>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: '800' }}>
                        {isEditing ? t('onboarding.edit') : t('onboarding.add_new')}
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>{t('onboarding.subtitle')}</p>
                </div>
            </div>

            <div className="glass-card" style={{ padding: '2rem' }}>
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>{t('onboarding.form.description')}</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder={t('onboarding.form.description_placeholder')}
                            required
                            style={{
                                width: '100%',
                                minHeight: '150px',
                                padding: '1rem',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '0.5rem',
                                color: 'white',
                                fontSize: '1rem',
                                resize: 'vertical'
                            }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '1.25rem' }}>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label>{t('onboarding.form.order')}</label>
                            <input
                                type="number"
                                value={formData.order}
                                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                                required
                                style={{ fontSize: '1rem' }}
                            />
                        </div>

                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label>{t('common.language')}</label>
                            <select
                                value={formData.languageId}
                                onChange={(e) => setFormData({ ...formData, languageId: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '0.5rem',
                                    color: 'white',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                <option value={LANGUAGE_IDS.en} style={{ background: 'var(--bg-darker)' }}>English</option>
                                <option value={LANGUAGE_IDS.es} style={{ background: 'var(--bg-darker)' }}>Español</option>
                            </select>
                        </div>
                    </div>

                    <div className="input-group">
                        <label>{t('onboarding.form.image')}</label>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px dashed var(--glass-border)',
                                borderRadius: '0.5rem',
                                padding: '2rem',
                                textAlign: 'center',
                                cursor: 'pointer',
                                position: 'relative',
                                minHeight: '300px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                        >
                            {isUploading ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                    <Loader2 size={40} className="animate-spin" color="var(--primary)" />
                                    <p style={{ color: 'var(--text-muted)' }}>Uploading...</p>
                                </div>
                            ) : formData.imageUrl ? (
                                <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <img
                                        src={formData.imageUrl}
                                        alt="Preview"
                                        style={{
                                            maxWidth: '100%',
                                            maxHeight: '400px',
                                            borderRadius: '0.5rem',
                                            marginBottom: '1.5rem',
                                            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                                        }}
                                    />
                                    <div style={{
                                        background: 'rgba(16, 185, 129, 0.1)',
                                        color: 'var(--accent)',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '2rem',
                                        fontSize: '0.875rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        fontWeight: '600'
                                    }}>
                                        <CheckCircle size={16} /> Image Uploaded Successfully
                                    </div>
                                    <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Click to change</p>
                                </div>
                            ) : (
                                <>
                                    <div style={{
                                        width: '64px',
                                        height: '64px',
                                        borderRadius: '50%',
                                        background: 'rgba(255,255,255,0.05)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: '1rem'
                                    }}>
                                        <ImageIcon size={32} color="var(--text-muted)" />
                                    </div>
                                    <h3 style={{ marginBottom: '0.5rem' }}>Upload Onboarding Image</h3>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '250px' }}>
                                        {t('onboarding.form.image_hint')}
                                    </p>
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

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '3rem' }}>
                        <button
                            type="button"
                            onClick={() => navigate('/onboarding')}
                            className="btn"
                            style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                        >
                            <X size={20} /> {t('onboarding.form.cancel')}
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                            disabled={isUploading}
                        >
                            <Save size={20} /> {t('onboarding.form.save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OnBoardingForm;
