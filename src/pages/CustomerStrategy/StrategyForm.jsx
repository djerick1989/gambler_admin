import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { strategyService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { getLanguageId } from '../../utils/languages';

const StrategyForm = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams();
    const { user } = useAuth();
    const { addToast } = useNotification();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(isEditMode);
    const [saving, setSaving] = useState(false);
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        isPublic: true
    });

    const gamblerId = user?.gambler?.gamblerId;

    useEffect(() => {
        if (isEditMode) {
            fetchStrategy();
        }
    }, [isEditMode, i18n.language]);

    const fetchStrategy = async () => {
        try {
            const languageId = getLanguageId(i18n.language);
            const res = await strategyService.getStrategyById(id, languageId);
            if (res.status && res.data) {
                const translation = (res.data.translations && res.data.translations.length > 0) 
                    ? res.data.translations[0] 
                    : { title: '', description: '' };
                
                setFormData({
                    title: translation.title || '',
                    description: translation.description || '',
                    isPublic: res.data.isPublic
                });
            } else {
                addToast('error', t('common.error_loading', 'Error loading data'));
                navigate('/customer/strategies');
            }
        } catch (err) {
            console.error(err);
            navigate('/customer/strategies');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const languageId = getLanguageId(i18n.language);
            const payload = {
                title: formData.title,
                description: formData.description,
                isPublic: formData.isPublic,
                languageId: languageId
            };

            if (isEditMode) {
                await strategyService.updateStrategy(id, payload);
                addToast('success', t('common.success', 'Operación exitosa'));
                navigate('/customer/strategies');
            } else {
                payload.gamblerId = gamblerId;
                await strategyService.createStrategy(payload);
                addToast('success', t('common.success', 'Operación exitosa'));
                navigate('/customer/strategies');
            }
        } catch (err) {
            console.error(err);
            addToast('error', t('common.error_default', 'Error'));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(t('common.delete_confirm', 'Are you sure?'))) return;
        setSaving(true);
        try {
            await strategyService.deleteStrategy(id);
            addToast('success', t('common.deleted_success', 'Deleted successfully'));
            navigate('/customer/strategies');
        } catch (err) {
            console.error(err);
            addToast('error', t('common.error_default', 'Error'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <Loader2 size={48} className="animate-spin" color="var(--primary)" />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '5rem', paddingTop: '1rem' }}>
            {/* Header */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2.5rem' }}>
                <button 
                    onClick={() => navigate('/customer/strategies')}
                    className="btn-back-premium"
                    title={t('common.back', 'Volver')}
                    style={{ position: 'absolute', left: 0 }}
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 style={{ fontSize: '1.75rem', fontWeight: '800', textAlign: 'center', margin: 0 }}>
                    {isEditMode ? t('strategies.edit', 'Editar Estrategia') : t('strategies.add_new', 'Agregar Estrategia')}
                </h1>
                {isEditMode && (
                    <button 
                        onClick={handleDelete}
                        className="btn-back-premium"
                        style={{ position: 'absolute', right: 0, color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                        title={t('common.delete', 'Eliminar')}
                    >
                        <Trash2 size={20} />
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Título */}
                <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                        {t('strategies.title_label', 'Titulo')}
                    </label>
                    <input
                        className="glass-card"
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        style={{ 
                            width: '100%', 
                            padding: '1.25rem', 
                            borderRadius: '1.25rem', 
                            border: '1px solid var(--glass-border)', 
                            background: 'white', 
                            color: 'var(--text-main)', 
                            fontSize: '1.1rem', 
                            fontWeight: '700',
                            outline: 'none',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>

                {/* Descripción */}
                <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                        {t('strategies.description_label', 'Descripción')}
                    </label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        rows="8"
                        style={{ 
                            width: '100%', 
                            padding: '1.25rem', 
                            borderRadius: '1.25rem', 
                            border: '1px solid var(--glass-border)', 
                            background: 'white', 
                            color: 'var(--text-main)', 
                            fontSize: '1rem', 
                            resize: 'vertical', 
                            outline: 'none', 
                            boxSizing: 'border-box',
                            fontFamily: 'inherit',
                            fontWeight: '500',
                            lineHeight: '1.6'
                        }}
                    />
                </div>

                {/* Toggle Compartir */}
                <div className="glass-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '1.25rem' }}>
                    <div>
                        <p style={{ margin: 0, fontWeight: '800', fontSize: '1rem', color: 'var(--text-main)' }}>
                            {t('strategies.share_with_all', 'Compartir con todos')}
                        </p>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                            {formData.isPublic 
                                ? t('strategies.public_hint', 'Visible para toda la comunidad') 
                                : t('strategies.private_hint', 'Solo visible para ti')
                            }
                        </p>
                    </div>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                        <span style={{ fontWeight: '700', color: formData.isPublic ? 'var(--primary)' : 'var(--text-muted)' }}>
                            {formData.isPublic ? t('common.yes', 'SI') : t('common.no', 'NO')}
                        </span>
                        <div
                            onClick={() => setFormData(prev => ({ ...prev, isPublic: !prev.isPublic }))}
                            style={{
                                position: 'relative',
                                width: '50px',
                                height: '26px',
                                background: formData.isPublic ? 'var(--primary)' : '#ccc',
                                borderRadius: '13px',
                                transition: '0.3s',
                                cursor: 'pointer'
                            }}
                        >
                            <div style={{
                                position: 'absolute',
                                top: '2px',
                                left: formData.isPublic ? '26px' : '2px',
                                width: '22px',
                                height: '22px',
                                background: 'white',
                                borderRadius: '50%',
                                transition: '0.3s',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            }} />
                        </div>
                    </label>
                </div>

                {/* Botón Guardar */}
                <div style={{ marginTop: '1rem' }}>
                    <button
                        type="submit"
                        disabled={saving}
                        className="btn btn-primary"
                        style={{ 
                            width: '100%', 
                            padding: '1.25rem', 
                            fontSize: '1.1rem', 
                            fontWeight: '800', 
                            borderRadius: '1.25rem', 
                            boxShadow: '0 10px 20px rgba(212, 144, 0, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        {saving && <Loader2 size={20} className="animate-spin" />}
                        {t('strategies.save', 'Guardar')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default StrategyForm;
