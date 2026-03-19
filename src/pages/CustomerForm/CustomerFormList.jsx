import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ChevronRight, 
    FileText, 
    Loader2, 
    AlertCircle,
    ClipboardCheck
} from 'lucide-react';
import { formService, formResponseService } from '../../services/api';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';

const CustomerFormList = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const [categories, setCategories] = useState([]);
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const LANGUAGE_IDS = {
        en: '11e8ba3a-b290-4a2c-9dad-0f40e457f72c',
        es: '6892a523-0dc1-4e3b-9ddd-c9a558c7920b'
    };
    const currentLanguageId = LANGUAGE_IDS[i18n.language.substring(0, 2)] || LANGUAGE_IDS.en;

    useEffect(() => {
        fetchData();
    }, [currentLanguageId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [catsRes, summariesRes] = await Promise.all([
                formService.getCategories(currentLanguageId),
                formService.getFormSummaries(currentLanguageId)
            ]);

            if (catsRes.status && summariesRes.status) {
                setCategories(catsRes.data);
                setForms(summariesRes.data);
            } else {
                setError('Error al cargar los formularios');
            }
        } catch (err) {
            console.error(err);
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const handleStartForm = async (formId) => {
        try {
            const res = await formResponseService.startFormResponse({
                userId: user.userId,
                formId: formId
            }, currentLanguageId);

            if (res.status) {
                navigate(`/customer/forms/process/${formId}`, { 
                    state: { userFormResponseId: res.data } 
                });
            }
        } catch (err) {
            console.error(err);
            alert('No se pudo iniciar el formulario');
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <Loader2 className="animate-spin" size={48} color="var(--primary)" />
            </div>
        );
    }

    // Group forms by category
    const groupedForms = categories.map(cat => ({
        ...cat,
        forms: forms.filter(f => f.formCategoryId === cat.formCategoryId)
    })).filter(cat => cat.forms.length > 0);

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '2rem', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {t('forms.title', 'Formularios')}
            </h1>

            {groupedForms.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    <FileText size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                    <p>{t('forms.no_forms', 'No hay formularios disponibles actualmente')}</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                    {groupedForms.map(group => (
                        <div key={group.formCategoryId}>
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '1rem', 
                                marginBottom: '1.5rem',
                                marginTop: '0.5rem'
                            }}>
                                <h3 style={{ 
                                    fontSize: '0.85rem', 
                                    fontWeight: '700', 
                                    color: '#717171', 
                                    letterSpacing: '0.5px',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {group.translations?.find(t => t.languageId === currentLanguageId)?.name || group.name}
                                </h3>
                                <div style={{ flex: 1, height: '1px', background: '#D1D5DB' }}></div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {group.forms.map(form => {
                                    const translation = form.translations?.find(t => t.languageId === currentLanguageId);
                                    const isGold = !!form.userFormResponseId;
                                    const color = isGold ? 'var(--primary)' : '#888';
                                    
                                    return (
                                        <div 
                                            key={form.formId}
                                            onClick={() => {
                                                if (form.userFormResponseId) {
                                                    navigate(`/customer/forms/result/${form.userFormResponseId}`);
                                                } else {
                                                    handleStartForm(form.formId);
                                                }
                                            }}
                                            className="glass-card"
                                            style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '1.5rem', 
                                                padding: '1.5rem', 
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                border: isGold ? '1px solid rgba(212, 144, 0, 0.2)' : '1px solid var(--glass-border)'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                        >
                                            <div style={{ 
                                                width: '60px', 
                                                height: '60px', 
                                                borderRadius: '12px', 
                                                background: isGold ? 'rgba(212, 144, 0, 0.1)' : 'rgba(255,255,255,0.05)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                                overflow: 'hidden'
                                            }}>
                                                {translation?.icon ? (
                                                    <img 
                                                        src={translation.icon} 
                                                        alt="" 
                                                        style={{ 
                                                            width: '32px', 
                                                            height: '32px', 
                                                            objectFit: 'contain',
                                                            filter: isGold ? 'none' : 'grayscale(100%) opacity(0.5)'
                                                        }} 
                                                    />
                                                ) : (
                                                    <FileText size={32} color={color} />
                                                )}
                                            </div>

                                            <div style={{ flex: 1 }}>
                                                <h4 style={{ 
                                                    fontSize: '1.25rem', 
                                                    fontWeight: '700', 
                                                    color: isGold ? 'var(--primary)' : 'var(--text-main)',
                                                    marginBottom: '0.25rem'
                                                }}>
                                                    {translation?.title || 'Sin Título'}
                                                </h4>
                                                <p style={{ 
                                                    fontSize: '0.9rem', 
                                                    color: 'var(--text-muted)',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden'
                                                }}>
                                                    {translation?.description || 'Sin descripción disponible'}
                                                </p>
                                            </div>

                                            <ChevronRight size={24} color="var(--text-muted)" style={{ opacity: 0.5 }} />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CustomerFormList;
