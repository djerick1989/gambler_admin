import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Loader2, Save, X, Plus, Trash2, Globe, Type
} from 'lucide-react';
import { i18nService, languageService } from '../../services/api';
import { useTranslation } from 'react-i18next';

const KeyForm = () => {
    const { t } = useTranslation();
    const { namespaceId, id: keyId } = useParams();
    const navigate = useNavigate();
    const isEditing = Boolean(keyId);

    const [loading, setLoading] = useState(isEditing);
    const [isSaving, setIsSaving] = useState(false);
    const [languages, setLanguages] = useState([]);
    const [formData, setFormData] = useState({
        key: '',
        translations: []
    });

    useEffect(() => {
        fetchLanguages();
        if (isEditing) {
            fetchKeyDetails();
        }
    }, [keyId, isEditing]);

    const fetchLanguages = async () => {
        try {
            const response = await languageService.getAll();
            if (response.status) setLanguages(response.data);
        } catch (err) {
            console.error("Error fetching languages:", err);
        }
    };

    const fetchKeyDetails = async () => {
        try {
            const response = await i18nService.getKeyById(keyId);
            if (response.status && response.data) {
                setFormData({
                    key: response.data.key,
                    translations: response.data.translations || []
                });
            }
        } catch (err) {
            console.error("Error fetching key details:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTranslation = () => {
        const availableLang = languages.find(l => !formData.translations.some(t => t.languageId === l.languageId));
        if (!availableLang) return;

        setFormData(prev => ({
            ...prev,
            translations: [...prev.translations, { languageId: availableLang.languageId, value: '' }]
        }));
    };

    const handleRemoveTranslation = (index) => {
        setFormData(prev => ({
            ...prev,
            translations: prev.translations.filter((_, i) => i !== index)
        }));
    };

    const handleUpdateTranslation = (index, field, value) => {
        const newTranslations = [...formData.translations];
        newTranslations[index] = { ...newTranslations[index], [field]: value };
        setFormData(prev => ({ ...prev, translations: newTranslations }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.translations.length === 0) {
            alert("Please add at least one translation.");
            return;
        }

        setIsSaving(true);
        try {
            if (isEditing) {
                // Update key itself and its namespace association
                await i18nService.updateKey({
                    keyId: keyId,
                    namespaceId: namespaceId,
                    key: formData.key,
                    translations: formData.translations
                });

                // Note: The API also has translationUpdate for individual translations if needed,
                // but keyUpdate should handle the bulk update.
            } else {
                await i18nService.createKey({
                    namespaceId: namespaceId,
                    key: formData.key,
                    translations: formData.translations
                });
            }
            navigate(`/i18n/namespace/${namespaceId}`);
        } catch (err) {
            console.error("Error saving key:", err);
            alert("Error saving key and translations");
        } finally {
            setIsSaving(false);
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
                    onClick={() => navigate(`/i18n/namespace/${namespaceId}`)}
                    className="btn"
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '0.5rem' }}
                >
                    <ChevronLeft size={24} />
                </button>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: '800' }}>
                        {isEditing ? t('i18n.edit_key') : t('i18n.add_key')}
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>{t('i18n.keys_subtitle', { name: '...' })}</p>
                </div>
            </div>

            <div className="glass-card" style={{ padding: '2rem' }}>
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Type size={16} /> {t('i18n.form.key')}
                        </label>
                        <input
                            type="text"
                            value={formData.key}
                            onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                            required
                            placeholder="e.g. welcome_message"
                            style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--primary)' }}
                        />
                    </div>

                    <div style={{ marginTop: '2.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Globe size={20} color="var(--primary)" /> {t('i18n.table.translations')}
                            </h3>
                            <button
                                type="button"
                                onClick={handleAddTranslation}
                                className="btn"
                                style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                                disabled={formData.translations.length >= languages.length}
                            >
                                <Plus size={16} style={{ marginRight: '0.4rem' }} /> Add Language
                            </button>
                        </div>

                        {formData.translations.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', border: '1px dashed var(--glass-border)', borderRadius: '0.5rem', color: 'var(--text-muted)' }}>
                                No translations added yet.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                {formData.translations.map((tr, index) => (
                                    <div key={index} className="glass-card" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <select
                                                value={tr.languageId}
                                                onChange={(e) => handleUpdateTranslation(index, 'languageId', e.target.value)}
                                                style={{
                                                    background: 'transparent', border: 'none', color: 'white',
                                                    fontWeight: 'bold', fontSize: '1rem', outline: 'none', cursor: 'pointer'
                                                }}
                                            >
                                                {languages.map(lang => (
                                                    <option
                                                        key={lang.languageId}
                                                        value={lang.languageId}
                                                        style={{ background: '#1a1a2e', color: 'white' }}
                                                        disabled={formData.translations.some((t, i) => i !== index && t.languageId === lang.languageId)}
                                                    >
                                                        {lang.name} ({lang.code})
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveTranslation(index)}
                                                style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                        <textarea
                                            value={tr.value}
                                            onChange={(e) => handleUpdateTranslation(index, 'value', e.target.value)}
                                            required
                                            placeholder="Enter translation text..."
                                            style={{
                                                width: '100%', minHeight: '80px', padding: '0.75rem',
                                                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)',
                                                borderRadius: '0.5rem', color: 'white', resize: 'vertical'
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '3rem' }}>
                        <button
                            type="button"
                            onClick={() => navigate(`/i18n/namespace/${namespaceId}`)}
                            className="btn"
                            style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                        >
                            <X size={20} /> {t('onboarding.form.cancel')}
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                            disabled={isSaving}
                        >
                            {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                            {t('onboarding.form.save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default KeyForm;
