import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Search, Edit2, Trash2, FileText,
    ChevronLeft, ChevronRight, Loader2, List, Settings, Eye
} from 'lucide-react';
import { formService } from '../../services/api';
import { useTranslation } from 'react-i18next';

const LANGUAGE_IDS = {
    en: '11e8ba3a-b290-4a2c-9dad-0f40e457f72c',
    es: '6892a523-0dc1-4e3b-9ddd-c9a558c7920b'
};

const FormList = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchForms();
    }, [i18n.language]);

    const fetchForms = async () => {
        setLoading(true);
        try {
            const lang = i18n.language.substring(0, 2).toLowerCase();
            const languageId = LANGUAGE_IDS[lang] || LANGUAGE_IDS.en;

            const response = await formService.getAllForms(languageId);
            if (response.status) {
                setForms(response.data);
            }
        } catch (err) {
            console.error("Error fetching forms:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm(t('common.delete_confirm'))) {
            try {
                const response = await formService.deleteForm(id);
                if (response.status) {
                    fetchForms();
                }
            } catch (err) {
                console.error("Error deleting form:", err);
            }
        }
    };

    const getFormTypeName = (type) => {
        const types = {
            0: t('forms.types.SELF_ASSESSMENT'),
            1: t('forms.types.GAMBLING_PROBLEM'),
            2: t('forms.types.ADDICTION_EVALUATION')
        };
        return types[type] || 'Unknown';
    };

    const filteredForms = forms.filter(form => {
        const langCode = i18n.language.substring(0, 2).toLowerCase();
        const langId = LANGUAGE_IDS[langCode] || LANGUAGE_IDS.en;
        const translation = form.translations?.find(tr => tr.languageId === langId) || form.translations?.[0] || {};
        const title = translation.title?.toLowerCase() || '';
        return title.includes(searchTerm.toLowerCase());
    });

    return (
        <div style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: '800', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <FileText size={32} color="var(--primary)" />
                        {t('forms.title')}
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>{t('forms.subtitle')}</p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button
                        onClick={() => navigate('/forms/categories')}
                        className="btn"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.05)', color: 'var(--text-main)' }}
                    >
                        <Settings size={20} />
                        {t('forms.manage_categories')}
                    </button>
                    <button
                        onClick={() => navigate('/forms/new')}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Plus size={20} />
                        {t('forms.add_form')}
                    </button>
                </div>
            </div>

            <div className="glass-card" style={{ marginBottom: '2rem', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Search size={20} color="var(--text-muted)" />
                <input
                    type="text"
                    placeholder={t('common.search')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-main)',
                        fontSize: '1rem',
                        outline: 'none',
                        width: '100%'
                    }}
                />
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                    <Loader2 size={48} className="animate-spin" color="var(--primary)" />
                </div>
            ) : filteredForms.length === 0 ? (
                <div className="glass-card" style={{ padding: '4rem', textAlign: 'center' }}>
                    <FileText size={64} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                    <h3>{t('forms.empty_forms')}</h3>
                </div>
            ) : (
                <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                                <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600' }}>{t('common.title')}</th>
                                <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600' }}>{t('forms.form_type')}</th>
                                <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600' }}>{t('common.status')}</th>
                                <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600' }}>{t('common.date')}</th>
                                <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'right' }}>{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredForms.map((form) => {
                                const langCode = i18n.language.substring(0, 2).toLowerCase();
                                const langId = LANGUAGE_IDS[langCode] || LANGUAGE_IDS.en;
                                const mainTranslation = form.translations?.find(tr => tr.languageId === langId) || form.translations?.[0] || {};
                                return (
                                    <tr key={form.formId} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                {form.icon || mainTranslation.icon ? (
                                                    <img src={form.icon || mainTranslation.icon} alt="" style={{ width: '40px', height: '40px', borderRadius: '0.5rem', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '0.5rem', background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <FileText size={20} color="var(--text-muted)" />
                                                    </div>
                                                )}
                                                <div>
                                                    <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{mainTranslation.title || 'Untitled'}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {mainTranslation.description}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <span style={{
                                                padding: '0.4rem 0.8rem',
                                                borderRadius: '0.5rem',
                                                fontSize: '0.75rem',
                                                fontWeight: '600',
                                                background: 'rgba(59, 130, 246, 0.1)',
                                                color: '#3b82f6'
                                            }}>
                                                {getFormTypeName(form.formType)}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            {form.active ? (
                                                <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', fontWeight: '600' }}>
                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                                                    {t('common.active')}
                                                </span>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', fontWeight: '600' }}>
                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--text-muted)' }} />
                                                    {t('common.inactive')}
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                            {new Date(form.createdAt).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => navigate(`/forms/${form.formId}/responses`)}
                                                    className="btn"
                                                    style={{ padding: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}
                                                    title={t('forms.view_responses')}
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/forms/${form.formId}/questions`)}
                                                    className="btn"
                                                    style={{ padding: '0.5rem', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}
                                                    title={t('forms.manage_questions')}
                                                >
                                                    <List size={18} />
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/forms/edit/${form.formId}`)}
                                                    className="btn"
                                                    style={{ padding: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}
                                                    title={t('common.edit')}
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(form.formId)}
                                                    className="btn"
                                                    style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
                                                    title={t('common.delete')}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default FormList;
