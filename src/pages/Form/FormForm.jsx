import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft, Loader2, Save, Image as ImageIcon,
    AlertCircle, FileText, Info
} from 'lucide-react';
import { formService, mediaService } from '../../services/api';
import { useTranslation } from 'react-i18next';

const FormForm = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = !!id;

    const [loading, setLoading] = useState(isEditing);
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');

    const LANGUAGE_IDS = {
        en: '11e8ba3a-b290-4a2c-9dad-0f40e457f72c',
        es: '6892a523-0dc1-4e3b-9ddd-c9a558c7920b'
    };

    const currentLanguageId = LANGUAGE_IDS[i18n.language.substring(0, 2)] || LANGUAGE_IDS.en;

    const [formData, setFormData] = useState({
        formCategoryId: '',
        languageId: currentLanguageId,
        title: '',
        icon: '',
        description: '',
        formType: 0
    });

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // Load categories
                const catRes = await formService.getCategories(currentLanguageId);
                if (catRes.status) {
                    setCategories(catRes.data);
                }

                if (isEditing) {
                    const formRes = await formService.getFormById(id, currentLanguageId);
                    if (formRes.status) {
                        const form = formRes.data;
                        const translation = form.translations?.find(tr => tr.languageId === currentLanguageId) || form.translations?.[0] || {};

                        const formIcon = form.icon || translation.icon || '';
                        setFormData({
                            formCategoryId: form.formCategoryId,
                            languageId: currentLanguageId,
                            title: translation.title || '',
                            icon: formIcon,
                            description: translation.description || '',
                            formType: form.formType
                        });
                        setPreviewUrl(formIcon);
                    }
                }
            } catch (err) {
                console.error("Error loading form data:", err);
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, [id, isEditing, currentLanguageId]);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const response = await mediaService.upload(file);
            if (response.status && response.data?.url) {
                setFormData(prev => ({ ...prev, icon: response.data.url }));
                setPreviewUrl(response.data.presignedUrl || response.data.url);
            }
        } catch (err) {
            console.error("Error uploading file:", err);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            let response;
            if (isEditing) {
                response = await formService.updateForm(id, formData, currentLanguageId);
            } else {
                response = await formService.createForm(formData, currentLanguageId);
            }

            if (response.status) {
                navigate('/forms');
            }
        } catch (err) {
            console.error("Error saving form:", err);
        } finally {
            setSaving(false);
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
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    onClick={() => navigate('/forms')}
                    className="btn-back-premium"
                    title={t('common.back', 'Volver')}
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: '800' }}>
                        {isEditing ? t('forms.edit_form') : t('forms.add_form')}
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>{t('forms.subtitle')}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="glass-card" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div className="input-group">
                        <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600' }}>{t('forms.category')}</label>
                        <select
                            className="form-control"
                            required
                            value={formData.formCategoryId}
                            onChange={(e) => setFormData(prev => ({ ...prev, formCategoryId: e.target.value }))}
                            style={{ width: '100%', padding: '0.85rem', borderRadius: '0.75rem', background: 'var(--bg-light)', border: '1px solid var(--stroke)', color: 'var(--text-main)' }}
                        >
                            <option value="">{t('forms.select_category')}</option>
                            {categories.map(cat => {
                                const translation = cat.translations?.find(tr => tr.languageId === currentLanguageId) || cat.translations?.[0] || {};
                                return (
                                    <option key={cat.formCategoryId} value={cat.formCategoryId}>
                                        {translation.name || t('common.untitled')}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    <div className="input-group">
                        <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600' }}>{t('forms.form_type')}</label>
                        <select
                            className="form-control"
                            required
                            value={formData.formType}
                            onChange={(e) => setFormData(prev => ({ ...prev, formType: parseInt(e.target.value) }))}
                            style={{ width: '100%', padding: '0.85rem', borderRadius: '0.75rem', background: 'var(--bg-light)', border: '1px solid var(--stroke)', color: 'var(--text-main)' }}
                        >
                            <option value={0}>{t('forms.types.SELF_ASSESSMENT')}</option>
                            <option value={1}>{t('forms.types.GAMBLING_PROBLEM')}</option>
                            <option value={2}>{t('forms.types.ADDICTION_EVALUATION')}</option>
                        </select>
                    </div>
                </div>

                <div className="input-group">
                    <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600' }}>{t('common.title')}</label>
                    <input
                        type="text"
                        className="form-control"
                        required
                        placeholder={t('forms.title_placeholder')}
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        style={{ width: '100%', padding: '0.85rem', borderRadius: '0.75rem', background: 'var(--bg-light)', border: '1px solid var(--stroke)', color: 'var(--text-main)' }}
                    />
                </div>

                <div className="input-group">
                    <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600' }}>{t('common.description')}</label>
                    <textarea
                        className="form-control"
                        placeholder={t('forms.description_placeholder')}
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        style={{ width: '100%', padding: '0.85rem', borderRadius: '0.75rem', background: 'var(--bg-light)', border: '1px solid var(--stroke)', color: 'var(--text-main)', minHeight: '120px' }}
                    />
                </div>

                <div className="input-group">
                    <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600' }}>{t('forms.icon')}</label>
                    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                        <div
                            onClick={() => document.getElementById('form-icon-upload').click()}
                            style={{
                                width: '120px',
                                height: '120px',
                                borderRadius: '1rem',
                                border: '2px dashed var(--stroke)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                                overflow: 'hidden',
                                background: previewUrl ? `url(${previewUrl}) center/cover` : 'var(--bg-light)',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}>
                            {!previewUrl && !uploading && (
                                <ImageIcon size={40} color="var(--text-muted)" />
                            )}
                            {uploading && (
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Loader2 size={32} className="animate-spin" color="white" />
                                </div>
                            )}
                        </div>
                        <div style={{ flex: 1 }}>
                            <input
                                type="file"
                                id="form-icon-upload"
                                hidden
                                onChange={handleFileUpload}
                                accept="image/*"
                            />
                            <label
                                htmlFor="form-icon-upload"
                                className="btn btn-secondary"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.75rem 1.5rem', background: 'var(--bg-light)', border: '1px solid var(--stroke)' }}
                            >
                                <ImageIcon size={18} />
                                {t('onboarding.form.image_hint')}
                            </label>
                        </div>
                    </div>
                </div>

                <div style={{
                    marginTop: '1rem',
                    padding: '1.5rem',
                    background: 'rgba(59, 130, 246, 0.05)',
                    borderRadius: '1rem',
                    border: '1px solid rgba(59, 130, 246, 0.1)',
                    display: 'flex',
                    gap: '1rem'
                }}>
                    <Info color="#3b82f6" />
                    <p style={{ fontSize: '0.875rem', color: '#1e40af', margin: 0 }}>
                        {t('forms.questions_info') || 'Once you create the form, you can add questions and options to it from the form list.'}
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <button
                        type="button"
                        onClick={() => navigate('/forms')}
                        className="btn"
                        style={{ padding: '0.85rem 2rem', background: 'transparent', border: '1px solid var(--stroke)' }}
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="btn btn-primary"
                        style={{ padding: '0.85rem 3rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                    >
                        {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                        {t('common.save')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default FormForm;
