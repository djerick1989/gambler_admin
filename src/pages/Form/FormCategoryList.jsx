import React, { useState, useEffect } from 'react';
import {
    Plus, Edit2, Trash2, ChevronLeft, Loader2, Image as ImageIcon,
    Check, X, Globe
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formService, mediaService } from '../../services/api';
import { useTranslation } from 'react-i18next';
import Modal from '../../components/Modal';

const FormCategoryList = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        icon: '',
        languageId: ''
    });

    const LANGUAGE_IDS = {
        en: '11e8ba3a-b290-4a2c-9dad-0f40e457f72c',
        es: '6892a523-0dc1-4e3b-9ddd-c9a558c7920b'
    };

    const currentLanguageId = LANGUAGE_IDS[i18n.language.substring(0, 2)] || LANGUAGE_IDS.en;

    useEffect(() => {
        fetchCategories();
    }, [i18n.language]);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await formService.getCategories(currentLanguageId);
            if (response.status) {
                setCategories(response.data);
            }
        } catch (err) {
            console.error("Error fetching categories:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (category = null) => {
        if (category) {
            const translation = category.translations?.find(tr => tr.languageId === currentLanguageId) || category.translations?.[0] || {};
            setEditingCategory(category);
            const initialIcon = translation.icon || category.icon || '';
            setFormData({
                name: translation.name || '',
                description: translation.description || category.description || '',
                icon: initialIcon,
                languageId: currentLanguageId
            });
        } else {
            setEditingCategory(null);
            setFormData({
                name: '',
                description: '',
                icon: '',
                languageId: currentLanguageId
            });
        }
        setIsModalOpen(true);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const response = await mediaService.upload(file);
            if (response.status && response.data?.url) {
                setFormData(prev => ({ ...prev, icon: response.data.url }));
            }
        } catch (err) {
            console.error("Error uploading file:", err);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let response;
            if (editingCategory) {
                response = await formService.updateCategory(editingCategory.formCategoryId, formData, currentLanguageId);
            } else {
                response = await formService.createCategory(formData, currentLanguageId);
            }

            if (response.status) {
                setIsModalOpen(false);
                fetchCategories();
            }
        } catch (err) {
            console.error("Error saving category:", err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm(t('common.delete_confirm'))) {
            try {
                const response = await formService.deleteCategory(id, currentLanguageId);
                if (response.status) {
                    fetchCategories();
                }
            } catch (err) {
                console.error("Error deleting category:", err);
            }
        }
    };

    return (
        <div style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate('/forms')} className="btn" style={{ padding: '0.5rem' }}>
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 style={{ fontSize: '1.875rem', fontWeight: '800' }}>
                            {t('forms.categories')}
                        </h1>
                        <p style={{ color: 'var(--text-muted)' }}>{t('forms.manage_categories')}</p>
                    </div>
                </div>

                <button
                    onClick={() => handleOpenModal()}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Plus size={20} />
                    {t('forms.add_category')}
                </button>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                    <Loader2 size={48} className="animate-spin" color="var(--primary)" />
                </div>
            ) : categories.length === 0 ? (
                <div className="glass-card" style={{ padding: '4rem', textAlign: 'center' }}>
                    <ImageIcon size={64} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                    <h3>{t('forms.empty_categories')}</h3>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '1.5rem'
                }}>
                    {categories.map((category) => {
                        const translation = category.translations?.find(tr => tr.languageId === currentLanguageId) || category.translations?.[0] || {};
                        return (
                            <div key={category.formCategoryId} className="glass-card" style={{
                                padding: '1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                transition: 'transform 0.2s',
                                position: 'relative'
                            }}>
                                <div style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '1rem',
                                    background: 'rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                    border: '1px solid var(--glass-border)'
                                }}>
                                    {category.icon || translation.icon ? (
                                        <img src={category.icon || translation.icon} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <ImageIcon size={30} color="var(--text-muted)" />
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>{translation.name || 'Untitled'}</div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{translation.description || category.description || 'No description'}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                                        {category.active ? (
                                            <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: '700', textTransform: 'uppercase' }}>{t('common.active')}</span>
                                        ) : (
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>{t('common.inactive')}</span>
                                        )}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => handleOpenModal(category)}
                                        style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'none', padding: '0.5rem', borderRadius: '0.5rem', cursor: 'pointer' }}
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(category.formCategoryId)}
                                        style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '0.5rem', borderRadius: '0.5rem', cursor: 'pointer' }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingCategory ? t('forms.edit_category') : t('forms.add_category')}
                maxWidth="500px"
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="input-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>{t('i18n.form.name')}</label>
                        <input
                            type="text"
                            className="form-control"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'var(--bg-light)', border: '1px solid var(--stroke)', color: 'var(--text-main)' }}
                        />
                    </div>

                    <div className="input-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>{t('i18n.form.description')}</label>
                        <textarea
                            className="form-control"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'var(--bg-light)', border: '1px solid var(--stroke)', color: 'var(--text-main)', minHeight: '80px' }}
                        />
                    </div>

                    <div className="input-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>{t('forms.icon')}</label>
                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                            <div
                                onClick={() => document.getElementById('icon-upload').click()}
                                style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '50%',
                                    background: formData.icon ? `url(${formData.icon}) center/cover` : 'var(--bg-light)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    border: '2px solid var(--stroke)',
                                    overflow: 'hidden'
                                }}>
                                {uploading ? (
                                    <Loader2 size={24} className="animate-spin" color="var(--primary)" />
                                ) : !formData.icon && (
                                    <ImageIcon size={30} color="var(--text-muted)" />
                                )}
                            </div>
                            <div style={{ flex: 1 }}>
                                <input
                                    type="file"
                                    id="icon-upload"
                                    hidden
                                    onChange={handleFileUpload}
                                    accept="image/*"
                                />
                                <div
                                    style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '0.25rem', cursor: 'pointer' }}
                                    onClick={() => document.getElementById('icon-upload').click()}
                                >
                                    {t('onboarding.form.image_hint')}
                                </div>
                                <div style={{
                                    fontSize: '0.7rem',
                                    color: 'var(--text-muted)',
                                    wordBreak: 'break-all',
                                    padding: '0.5rem',
                                    background: 'rgba(0,0,0,0.02)',
                                    borderRadius: '0.5rem',
                                    border: '1px solid var(--stroke)'
                                }}>
                                    {formData.icon || t('common.none')}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                        <button type="button" onClick={() => setIsModalOpen(false)} className="btn" style={{ background: 'transparent', border: '1px solid var(--stroke)' }}>
                            {t('common.cancel')}
                        </button>
                        <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
                            {t('common.save')}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default FormCategoryList;
