import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ChevronLeft, Loader2, Save, X, Info
} from 'lucide-react';
import { paymentPlatformService } from '../services/api';
import { useTranslation } from 'react-i18next';

const PaymentPlatformForm = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = Boolean(id);

    const [loading, setLoading] = useState(isEditing);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        isActive: true
    });

    useEffect(() => {
        if (isEditing) {
            fetchPlatform(id);
        }
    }, [id, isEditing]);

    const fetchPlatform = async (platformId) => {
        try {
            const response = await paymentPlatformService.getById(platformId);
            if (response.status && response.data) {
                const data = response.data;
                setFormData({
                    name: data.name,
                    code: data.code,
                    description: data.description || '',
                    isActive: data.isActive
                });
            }
        } catch (err) {
            console.error("Error fetching platform for edit:", err);
            alert("Error fetching platform data");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                // Update only allows name, description, isActive based on request
                const updateData = {
                    name: formData.name,
                    description: formData.description,
                    isActive: formData.isActive
                };
                await paymentPlatformService.update(id, updateData);
            } else {
                await paymentPlatformService.create(formData);
            }
            navigate('/payment-platforms');
        } catch (err) {
            console.error("Error saving payment platform:", err);
            alert("Error saving payment platform");
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
                    onClick={() => navigate('/payment-platforms')}
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
                        {isEditing ? t('payment_platforms.edit') : t('payment_platforms.add_new')}
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>{t('payment_platforms.subtitle')}</p>
                </div>
            </div>

            <div className="glass-card" style={{ padding: '2rem' }}>
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label>{t('payment_platforms.form.name')}</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder={t('payment_platforms.form.name_placeholder')}
                                required
                                style={{ fontSize: '1rem' }}
                            />
                        </div>

                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label>{t('payment_platforms.form.code')}</label>
                            <input
                                type="text"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                placeholder={t('payment_platforms.form.code_placeholder')}
                                required
                                disabled={isEditing}
                                style={{
                                    fontSize: '1rem',
                                    backgroundColor: isEditing ? 'rgba(255,255,255,0.05)' : 'transparent',
                                    cursor: isEditing ? 'not-allowed' : 'text'
                                }}
                            />
                            {isEditing && (
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <Info size={12} /> The code cannot be changed once created.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="input-group">
                        <label>{t('payment_platforms.form.description')}</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder={t('payment_platforms.form.description_placeholder')}
                            style={{
                                width: '100%',
                                minHeight: '120px',
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

                    <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <label style={{ marginBottom: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <input
                                type="checkbox"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                            />
                            {t('payment_platforms.form.isActive')}
                        </label>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '3rem' }}>
                        <button
                            type="button"
                            onClick={() => navigate('/payment-platforms')}
                            className="btn"
                            style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                        >
                            <X size={20} /> {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                        >
                            <Save size={20} /> {t('payment_platforms.form.save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PaymentPlatformForm;
