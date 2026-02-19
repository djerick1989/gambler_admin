import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import {
    ChevronLeft, Loader2, Image as ImageIcon,
    Save, X, CheckCircle, Globe
} from 'lucide-react';
import { newsService, mediaService } from '../services/api';
import { useTranslation } from 'react-i18next';
import NewsComments from './NewsComments';

const LANGUAGE_IDS = {
    en: '11e8ba3a-b290-4a2c-9dad-0f40e457f72c',
    es: '6892a523-0dc1-4e3b-9ddd-c9a558c7920b'
};

const NewsForm = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams();
    const quillRef = useRef(null);
    const isEditing = Boolean(id);

    const [loading, setLoading] = useState(isEditing);
    const [saving, setSaving] = useState(false);
    const [isUploadingThumb, setIsUploadingThumb] = useState(false);

    const [formData, setFormData] = useState({
        languageId: '',
        title: '',
        mediaUrl: '',
        mediaType: 0,
        contentHtml: ''
    });

    useEffect(() => {
        const lang = i18n.language.substring(0, 2).toLowerCase();
        const defaultLangId = LANGUAGE_IDS[lang] || LANGUAGE_IDS.en;

        if (isEditing) {
            fetchNewsDetail(id, defaultLangId);
        } else {
            setFormData(prev => ({ ...prev, languageId: defaultLangId }));
        }
    }, [id, isEditing]);

    const fetchNewsDetail = async (newsId, languageId) => {
        try {
            const response = await newsService.getNewsById(newsId, languageId);
            if (response.status && response.data) {
                const item = response.data;
                const translation = item.translations.find(t => t.languageId === languageId) || item.translations[0] || {};

                setFormData({
                    newsId: item.newsId,
                    languageId: translation.languageId || languageId,
                    title: translation.title || '',
                    mediaUrl: item.mediaUrl || '',
                    mediaType: item.mediaType || 0,
                    contentHtml: translation.contentHtml || ''
                });
            }
        } catch (err) {
            console.error("Error fetching news detail:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleThumbnailChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploadingThumb(true);
        try {
            const response = await mediaService.upload(file);
            if (response.status && response.data?.url) {
                setFormData(prev => ({ ...prev, mediaUrl: response.data.url }));
            }
        } catch (err) {
            console.error("Error uploading thumbnail:", err);
            alert("Error uploading thumbnail");
        } finally {
            setIsUploadingThumb(false);
        }
    };

    // Custom image handler for Quill
    const imageHandler = () => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = async () => {
            const file = input.files[0];
            if (!file) return;

            const quill = quillRef.current.getEditor();
            const range = quill.getSelection(true);

            // Placeholder to indicate uploading? Maybe just block? 
            // For now let's just upload.
            try {
                const response = await mediaService.upload(file);
                if (response.status && response.data?.url) {
                    quill.insertEmbed(range.index, 'image', response.data.url);
                    quill.setSelection(range.index + 1);
                }
            } catch (err) {
                console.error("Error uploading image to editor:", err);
                alert("Error uploading image to editor");
            }
        };
    };

    const modules = useMemo(() => ({
        toolbar: {
            container: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                [{ 'color': [] }, { 'background': [] }],
                ['link', 'image', 'video'],
                ['clean']
            ],
            handlers: {
                image: imageHandler
            }
        }
    }), []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.contentHtml) {
            alert("Please fill in all required fields");
            return;
        }

        setSaving(true);
        try {
            if (isEditing) {
                await newsService.updateNews(formData);
            } else {
                await newsService.createNews(formData);
            }
            navigate('/news');
        } catch (err) {
            console.error("Error saving news:", err);
            alert("Error saving news");
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
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    onClick={() => navigate('/news')}
                    style={{
                        background: 'var(--bg-light)',
                        border: '1px solid var(--stroke)',
                        color: 'var(--text-main)',
                        padding: '0.5rem',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        display: 'flex',
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#e2e8f0'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'var(--bg-light)'}
                >
                    <ChevronLeft size={24} />
                </button>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: '800' }}>
                        {isEditing ? t('news_mgmt.edit') : t('news_mgmt.add_new')}
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>{t('news_mgmt.subtitle')}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <div className="input-group">
                            <label>{t('news_mgmt.form.title')}</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder={t('news_mgmt.form.title_placeholder')}
                                required
                                style={{ width: '100%', fontSize: '1.125rem', fontWeight: '600' }}
                            />
                        </div>

                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label>{t('news_mgmt.form.content')}</label>
                            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
                                <style>{`
                                    .ql-toolbar.ql-snow { border: none; border-bottom: 1px solid var(--stroke); background: #f8fafc; }
                                    .ql-container.ql-snow { border: none; min-height: 400px; font-size: 1rem; color: var(--text-main); }
                                    .ql-editor.ql-blank::before { color: var(--text-muted); }
                                    .ql-snow .ql-stroke { stroke: var(--text-main); }
                                    .ql-snow .ql-fill { fill: var(--text-main); }
                                    .ql-snow .ql-picker { color: var(--text-main); }
                                    .ql-snow .ql-picker-options { background-color: white; border-color: var(--stroke); }
                                `}</style>
                                <ReactQuill
                                    ref={quillRef}
                                    theme="snow"
                                    value={formData.contentHtml}
                                    onChange={(content) => setFormData({ ...formData, contentHtml: content })}
                                    modules={modules}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <div className="input-group">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Globe size={16} /> {t('common.language')}
                            </label>
                            <select
                                value={formData.languageId}
                                onChange={(e) => setFormData({ ...formData, languageId: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    background: 'white',
                                    border: '1px solid var(--stroke)',
                                    borderRadius: '0.5rem',
                                    color: 'var(--text-main)'
                                }}
                            >
                                <option value={LANGUAGE_IDS.en}>English</option>
                                <option value={LANGUAGE_IDS.es}>Español</option>
                            </select>
                        </div>

                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label>{t('news_mgmt.form.thumbnail')}</label>
                            <div
                                onClick={() => document.getElementById('thumb-input').click()}
                                style={{
                                    width: '100%',
                                    aspectRatio: '16/9',
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px dashed var(--glass-border)',
                                    borderRadius: '0.5rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                    position: 'relative'
                                }}
                            >
                                {isUploadingThumb ? (
                                    <Loader2 className="animate-spin" color="var(--primary)" />
                                ) : formData.mediaUrl ? (
                                    <img src={formData.mediaUrl} alt="Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <>
                                        <ImageIcon size={32} color="var(--text-muted)" />
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Click to upload</span>
                                    </>
                                )}
                                <input
                                    id="thumb-input"
                                    type="file"
                                    onChange={handleThumbnailChange}
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={saving || isUploadingThumb}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                        >
                            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            {t('news_mgmt.form.save')}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/news')}
                            className="btn"
                            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                        >
                            {t('news_mgmt.form.cancel')}
                        </button>
                    </div>
                </div>
            </form>

            {isEditing && (
                <div style={{ marginTop: '3rem', paddingTop: '3rem', borderTop: '1px solid var(--glass-border)' }}>
                    <NewsComments newsId={id} />
                </div>
            )}
        </div>
    );
};

export default NewsForm;
