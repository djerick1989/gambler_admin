import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { ArrowLeft, Globe, Loader2, Save, Upload, Video, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { dopamineService, mediaService } from '../../services/api';
import { getLanguageId, LANGUAGE_IDS } from '../../utils/languages';
import { DOPAMINE_TYPE, getYouTubeEmbedUrl, toArray, unwrapApiData } from '../CustomerDopamine/dopamineUtils';
import './AdminDopamine.css';

const VALID_TYPES = [
    DOPAMINE_TYPE.DOPAMINE,
    DOPAMINE_TYPE.ADRENALINE,
    DOPAMINE_TYPE.REWARD_SYSTEM
];

const normalizeByLanguage = (response, languageId, fallbackType) => {
    const data = unwrapApiData(response);
    const item = toArray(data)
        .map(entry => {
            const translations = toArray(entry?.translations);
            const exactTranslation = translations.find(translation => translation?.languageId === languageId);
            const rootMatchesLanguage = entry?.languageId === languageId;
            const score = exactTranslation ? 3 : rootMatchesLanguage ? 2 : !entry?.languageId ? 1 : 0;
            const updatedAt = entry?.updatedAt ? new Date(entry.updatedAt).getTime() : 0;

            return { entry, exactTranslation, rootMatchesLanguage, score, updatedAt };
        })
        .sort((a, b) => b.score - a.score || b.updatedAt - a.updatedAt)[0];
    if (!item) return null;

    const translations = toArray(item.entry.translations);
    const translation = item.exactTranslation || (!item.rootMatchesLanguage ? translations[0] : {}) || {};

    return {
        id: item.entry.id,
        type: item.entry.type ?? fallbackType,
        languageId: translation.languageId || languageId,
        title: translation.title || item.entry.title || '',
        description: translation.description || item.entry.description || '',
        videoUrl: translation.videoUrl || item.entry.videoUrl || ''
    };
};

const isDirectVideoUrl = (url = '') => /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url);

const AdminDopamineForm = () => {
    const { t, i18n } = useTranslation();
    const { type: typeParam } = useParams();
    const navigate = useNavigate();
    const quillRef = useRef(null);

    const selectedType = VALID_TYPES.includes(Number(typeParam)) ? Number(typeParam) : DOPAMINE_TYPE.DOPAMINE;
    const languageId = getLanguageId(i18n.language);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingVideo, setUploadingVideo] = useState(false);
    const [formData, setFormData] = useState({
        id: null,
        type: selectedType,
        languageId,
        title: '',
        videoUrl: '',
        description: ''
    });

    const fetchContent = async () => {
        setLoading(true);
        try {
            const response = await dopamineService.getByType(selectedType);
            const item = normalizeByLanguage(response, languageId, selectedType);
            setFormData({
                id: item?.id || null,
                type: selectedType,
                languageId,
                title: item?.title || '',
                videoUrl: item?.videoUrl || '',
                description: item?.description || ''
            });
        } catch (err) {
            console.error('Error loading dopamine form:', err);
            setFormData(prev => ({
                ...prev,
                id: null,
                type: selectedType,
                languageId
            }));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContent();
    }, [selectedType, languageId]);

    const imageHandler = () => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = async () => {
            const file = input.files[0];
            if (!file) return;

            try {
                const response = await mediaService.upload(file);
                if (response.status && response.data?.url) {
                    const quill = quillRef.current.getEditor();
                    const range = quill.getSelection(true);
                    quill.insertEmbed(range.index, 'image', response.data.url);
                    quill.setSelection(range.index + 1);
                }
            } catch (err) {
                console.error('Error uploading dopamine editor image:', err);
                alert(t('dopamine_admin.upload_error'));
            }
        };
    };

    const modules = useMemo(() => ({
        toolbar: {
            container: [
                [{ header: [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ list: 'ordered' }, { list: 'bullet' }],
                [{ color: [] }, { background: [] }],
                ['link', 'image', 'video'],
                ['clean']
            ],
            handlers: {
                image: imageHandler
            }
        }
    }), []);

    const videoPreviewUrl = useMemo(() => getYouTubeEmbedUrl(formData.videoUrl), [formData.videoUrl]);
    const isDirectVideo = isDirectVideoUrl(formData.videoUrl);

    const handleVideoUpload = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;

        if (!file.type.startsWith('video/')) {
            alert(t('dopamine_admin.video_only'));
            return;
        }

        setUploadingVideo(true);
        try {
            const response = await mediaService.upload(file);
            if (response.status && response.data?.url) {
                setFormData(prev => ({ ...prev, videoUrl: response.data.url }));
            }
        } catch (err) {
            console.error('Error uploading dopamine video:', err);
            alert(t('dopamine_admin.video_upload_error'));
        } finally {
            setUploadingVideo(false);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!formData.title.trim()) {
            alert(t('dopamine_admin.required_title'));
            return;
        }

        setSaving(true);
        const payload = {
            type: selectedType,
            languageId: formData.languageId,
            title: formData.title,
            description: formData.description,
            videoUrl: formData.videoUrl
        };

        try {
            if (formData.id) {
                await dopamineService.update(formData.id, payload);
            } else {
                await dopamineService.create(payload);
            }
            navigate('/dopamine');
        } catch (err) {
            console.error('Error saving dopamine option:', err);
            alert(t('dopamine_admin.save_error'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="admin-dopamine-loading">
                <Loader2 size={48} className="animate-spin" color="var(--primary)" />
            </div>
        );
    }

    return (
        <div className="admin-dopamine-form-page">
            <div className="admin-dopamine-form-header">
                <button className="btn-back-premium" onClick={() => navigate('/dopamine')}>
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1>{t('dopamine_admin.form_title', { type: t(`dopamine_admin.types.${selectedType}`) })}</h1>
                    <p>{t('dopamine_admin.form_subtitle')}</p>
                </div>
            </div>

            <form className="admin-dopamine-form" onSubmit={handleSubmit}>
                <div className="admin-dopamine-editor-card">
                    <div className="input-group">
                        <label>{t('dopamine_admin.fields.title')}</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(event) => setFormData(prev => ({ ...prev, title: event.target.value }))}
                            placeholder={t('dopamine_admin.fields.title_placeholder')}
                        />
                    </div>

                    <div className="input-group">
                        <label>{t('dopamine_admin.fields.description')}</label>
                        <div className="admin-dopamine-quill">
                            <ReactQuill
                                ref={quillRef}
                                theme="snow"
                                value={formData.description}
                                onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                                modules={modules}
                            />
                        </div>
                    </div>
                </div>

                <aside className="admin-dopamine-side">
                    <div className="glass-card">
                        <div className="input-group">
                            <label>
                                <Globe size={16} />
                                {t('common.language')}
                            </label>
                            <select
                                value={formData.languageId}
                                onChange={(event) => {
                                    const language = event.target.value === LANGUAGE_IDS.es ? 'es' : 'en';
                                    i18n.changeLanguage(language);
                                }}
                            >
                                <option value={LANGUAGE_IDS.en}>English</option>
                                <option value={LANGUAGE_IDS.es}>Español</option>
                            </select>
                        </div>

                        <div className="input-group">
                            <label>
                                <Video size={16} />
                                {t('dopamine_admin.fields.video_url')}
                            </label>
                            <div className="admin-dopamine-video-preview">
                                {formData.videoUrl ? (
                                    isDirectVideo ? (
                                        <video src={formData.videoUrl} controls />
                                    ) : (
                                        <iframe
                                            title={t('dopamine_admin.video_preview')}
                                            src={videoPreviewUrl}
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    )
                                ) : (
                                    <div className="admin-dopamine-video-empty">
                                        <Video size={34} />
                                        <span>{t('dopamine_admin.no_video')}</span>
                                    </div>
                                )}
                            </div>
                            <input
                                type="url"
                                value={formData.videoUrl}
                                onChange={(event) => setFormData(prev => ({ ...prev, videoUrl: event.target.value }))}
                                placeholder="https://www.youtube.com/watch?v=..."
                            />
                            <div className="admin-dopamine-video-actions">
                                <button
                                    type="button"
                                    className="btn"
                                    disabled={uploadingVideo}
                                    onClick={() => document.getElementById('dopamine-video-upload').click()}
                                >
                                    {uploadingVideo ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                    {t('dopamine_admin.upload_video')}
                                </button>
                                <button
                                    type="button"
                                    className="btn"
                                    disabled={!formData.videoUrl || uploadingVideo}
                                    onClick={() => setFormData(prev => ({ ...prev, videoUrl: '' }))}
                                >
                                    <X size={16} />
                                    {t('dopamine_admin.clear_video')}
                                </button>
                                <input
                                    id="dopamine-video-upload"
                                    type="file"
                                    accept="video/*"
                                    onChange={handleVideoUpload}
                                    style={{ display: 'none' }}
                                />
                            </div>
                        </div>
                    </div>

                    <button className="btn btn-primary admin-dopamine-save" type="submit" disabled={saving || uploadingVideo}>
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {t('dopamine_admin.save')}
                    </button>
                    <button className="btn" type="button" onClick={() => navigate('/dopamine')}>
                        {t('dopamine_admin.cancel')}
                    </button>
                </aside>
            </form>
        </div>
    );
};

export default AdminDopamineForm;
