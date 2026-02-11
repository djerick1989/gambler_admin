import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Loader2, Save, ImageIcon,
    Plus, Trash2, Languages, Upload
} from 'lucide-react';
import { achievementService, languageService, mediaService } from '../../services/api';
import { useTranslation } from 'react-i18next';
import { getLanguageId } from '../../utils/languages';
import { useAuth } from '../../context/AuthContext';

const AchievementForm = () => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);

    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [uploadingCompleted, setUploadingCompleted] = useState(false);
    const [uploadingPending, setUploadingPending] = useState(false);
    const [languages, setLanguages] = useState([]);

    const [formData, setFormData] = useState({
        title: '', // For creation if needed, though API uses translations
        imageUrlCompleted: '',
        imageUrlPending: '',
        achievementDate: new Date().toISOString(),
        active: true,
        translations: [],
        orden: 0
    });

    useEffect(() => {
        fetchInitialData();
    }, [id]);

    const fetchInitialData = async () => {
        try {
            const langRes = await languageService.getAll();
            if (langRes.status) {
                setLanguages(langRes.data);

                if (!isEdit) {
                    // Initialize empty translations for all languages
                    setFormData(prev => ({
                        ...prev,
                        translations: langRes.data.map(l => ({
                            languageId: l.languageId,
                            value: '',
                            languageName: l.name
                        }))
                    }));
                }
            }

            if (isEdit) {
                const res = await achievementService.getAchievementById(id);
                if (res.status) {
                    const ach = res.data;
                    setFormData({
                        achievementId: ach.achievementId,
                        titleKeyId: ach.titleKeyId,
                        imageUrlCompleted: ach.imageUrlCompleted,
                        imageUrlPending: ach.imageUrlPending,
                        achievementDate: ach.achievementDate,
                        active: ach.active,
                        createdBy: ach.createdBy,
                        orden: ach.orden || 0,
                        translations: ach.translations.map(tr => ({
                            ...tr,
                            languageName: langRes.data.find(l => l.languageId === tr.languageId)?.name || 'Unknown'
                        }))
                    });
                }
            }
        } catch (err) {
            console.error("Error fetching form data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        const isCompleted = type === 'completed';
        if (isCompleted) setUploadingCompleted(true);
        else setUploadingPending(true);

        try {
            const response = await mediaService.upload(file);
            if (response.status && response.data?.url) {
                setFormData(prev => ({
                    ...prev,
                    [isCompleted ? 'imageUrlCompleted' : 'imageUrlPending']: response.data.url
                }));
            }
        } catch (err) {
            console.error("Error uploading image:", err);
            alert("Error uploading image");
        } finally {
            if (isCompleted) setUploadingCompleted(false);
            else setUploadingPending(false);
        }
    };

    const handleTranslationChange = (langId, value) => {
        setFormData(prev => ({
            ...prev,
            translations: prev.translations.map(tr =>
                tr.languageId === langId ? { ...tr, value } : tr
            )
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            let response;
            if (isEdit) {
                response = await achievementService.updateAchievement(formData);
            } else {
                const currentLangId = getLanguageId(i18n.language);
                const primaryTranslation = formData.translations.find(tr => tr.languageId === currentLangId) || formData.translations[0];

                const createData = {
                    title: primaryTranslation?.value || '',
                    imageUrlCompleted: formData.imageUrlCompleted,
                    imageUrlPending: formData.imageUrlPending,
                    languageId: primaryTranslation?.languageId || currentLangId,
                    achievementDate: formData.achievementDate,
                    active: formData.active,
                    createdBy: user?.userId,
                    orden: formData.orden
                };
                response = await achievementService.createAchievement(createData);
            }

            if (response.status) {
                navigate('/achievements');
            }
        } catch (err) {
            console.error("Error saving achievement:", err);
            alert("Error saving achievement");
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
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    onClick={() => navigate('/achievements')}
                    className="btn"
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '0.5rem' }}
                >
                    <ChevronLeft size={24} />
                </button>
                <h1 style={{ fontSize: '1.875rem', fontWeight: '800' }}>
                    {isEdit ? (t('achievements.edit') || 'Edit Achievement') : (t('achievements.new') || 'New Achievement')}
                </h1>
            </div>

            <form onSubmit={handleSubmit} className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div className="input-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ImageIcon size={16} /> {t('achievements.img_completed') || 'Completed Image'}
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{
                                width: '100%',
                                height: '200px',
                                borderRadius: '0.5rem',
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px dashed var(--glass-border)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                position: 'relative'
                            }}>
                                {formData.imageUrlCompleted ? (
                                    <img src={formData.imageUrlCompleted} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                ) : (
                                    <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                        <ImageIcon size={48} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                                        <p style={{ fontSize: '0.875rem' }}>No image selected</p>
                                    </div>
                                )}
                                {uploadingCompleted && (
                                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Loader2 className="animate-spin" color="var(--primary)" />
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="text"
                                    readOnly
                                    value={formData.imageUrlCompleted}
                                    placeholder="No image uploaded"
                                    style={{ flex: 1, fontSize: '0.8rem', opacity: 0.7 }}
                                />
                                <label className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                    <Upload size={16} /> {t('common.upload') || 'Upload'}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, 'completed')}
                                        style={{ display: 'none' }}
                                        disabled={uploadingCompleted}
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="input-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ImageIcon size={16} /> {t('achievements.img_pending') || 'Pending Image'}
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{
                                width: '100%',
                                height: '200px',
                                borderRadius: '0.5rem',
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px dashed var(--glass-border)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                position: 'relative'
                            }}>
                                {formData.imageUrlPending ? (
                                    <img src={formData.imageUrlPending} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                ) : (
                                    <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                        <ImageIcon size={48} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                                        <p style={{ fontSize: '0.875rem' }}>No image selected</p>
                                    </div>
                                )}
                                {uploadingPending && (
                                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Loader2 className="animate-spin" color="var(--primary)" />
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="text"
                                    readOnly
                                    value={formData.imageUrlPending}
                                    placeholder="No image uploaded"
                                    style={{ flex: 1, fontSize: '0.8rem', opacity: 0.7 }}
                                />
                                <label className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                    <Upload size={16} /> {t('common.upload') || 'Upload'}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, 'pending')}
                                        style={{ display: 'none' }}
                                        disabled={uploadingPending}
                                    />
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Languages size={18} color="var(--primary)" /> {t('achievements.translations') || 'Translations'}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {formData.translations.map((tr) => (
                            <div key={tr.languageId} className="input-group">
                                <label>{tr.languageName}</label>
                                <input
                                    type="text"
                                    value={tr.value}
                                    onChange={(e) => handleTranslationChange(tr.languageId, e.target.value)}
                                    placeholder={t('achievements.enter_title') || 'Enter title in this language'}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={formData.active}
                            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                        />
                        {t('common.active') || 'Active'}
                    </label>

                    <div className="input-group" style={{ width: '150px' }}>
                        <label>{t('achievements.order') || 'Order'}</label>
                        <input
                            type="number"
                            step="1"
                            value={formData.orden}
                            onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) || 0 })}
                        />
                    </div>

                    <div className="input-group" style={{ flex: 1 }}>
                        <label>{t('achievements.date') || 'Achievement Date'}</label>
                        <input
                            type="datetime-local"
                            value={formData.achievementDate ? new Date(formData.achievementDate).toISOString().slice(0, 16) : ''}
                            onChange={(e) => setFormData({ ...formData, achievementDate: new Date(e.target.value).toISOString() })}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button type="submit" className="btn btn-primary" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, justifyContent: 'center' }}>
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {isEdit ? (t('common.save_changes') || 'Save Changes') : (t('common.create') || 'Create Achievement')}
                    </button>
                    <button type="button" onClick={() => navigate('/achievements')} className="btn" style={{ background: 'rgba(255,255,255,0.05)', color: 'white', flex: 1 }}>
                        {t('common.cancel') || 'Cancel'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AchievementForm;
