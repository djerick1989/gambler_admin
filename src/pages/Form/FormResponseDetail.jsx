import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    ChevronLeft, Loader2, User, Calendar,
    CheckCircle, ClipboardList, AlertTriangle, FileText
} from 'lucide-react';
import { formResponseService } from '../../services/api';
import { useTranslation } from 'react-i18next';

const FormResponseDetail = () => {
    const { t, i18n } = useTranslation();
    const { id: responseId } = useParams();
    const navigate = useNavigate();

    const { state } = useLocation();
    const [response, setResponse] = useState(state?.response || null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const LANGUAGE_IDS = {
        en: '11e8ba3a-b290-4a2c-9dad-0f40e457f72c',
        es: '6892a523-0dc1-4e3b-9ddd-c9a558c7920b'
    };

    const currentLanguageId = LANGUAGE_IDS[i18n.language.substring(0, 2)] || LANGUAGE_IDS.en;

    useEffect(() => {
        fetchData();
    }, [responseId, currentLanguageId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const respData = await formResponseService.getFormResponseById(responseId, currentLanguageId);
            if (respData && respData.status) {
                setResponse(respData.data);
                setError(null);
            } else {
                setError('No se pudo encontrar la información de la respuesta.');
            }
        } catch (err) {
            console.error("Error fetching response details:", err);
            setError('Error al obtener los detalles de la respuesta.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleString();
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '1rem' }}>
                <Loader2 size={64} className="animate-spin" color="var(--primary)" />
                <p style={{ color: 'var(--text-muted)', fontWeight: '600' }}>{t('common.loading')}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <AlertTriangle size={64} color="#ef4444" style={{ marginBottom: '1.5rem' }} />
                <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1rem' }}>{t('common.error')}</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>{error}</p>
                <button onClick={() => navigate(-1)} className="btn btn-primary">{t('common.back')}</button>
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3rem', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <button
                        onClick={() => navigate(-1)}
                        className="btn"
                        style={{
                            padding: '0.75rem',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '12px',
                            border: '1px solid var(--glass-border)',
                            color: 'var(--text-main)'
                        }}
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-0.025em', marginBottom: '0.25rem' }}>
                            {t('forms.response_details')}
                        </h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', color: 'var(--text-muted)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <User size={18} /> {response?.user?.name || response?.user?.nickName || 'Anonymous'}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Calendar size={18} /> {formatDate(response?.completedAt)}
                            </span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => navigate(`/forms/response/${responseId}/report`)}
                    className="btn btn-primary"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem 1.5rem',
                        fontSize: '1rem',
                        fontWeight: '700',
                        borderRadius: '12px',
                        boxShadow: '0 4px 15px rgba(212, 144, 0, 0.3)'
                    }}
                >
                    <FileText size={20} />
                    {t('forms.view_report')}
                </button>
            </div>

            {/* Questions and Answers */}
            <div className="glass-card" style={{ padding: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '2rem' }}>
                    <div style={{ padding: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px' }}>
                        <ClipboardList size={28} color="#3b82f6" />
                    </div>
                    <h3 style={{ fontSize: '2rem', fontWeight: '800' }}>{t('forms.user_answers')}</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                    {(response?.questions || response?.form?.questions)?.sort((a, b) => a.order - b.order).map((q) => (
                        <div key={q.questionId} style={{ background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '1.5rem', border: '1px solid var(--glass-border)' }}>
                            <div style={{ fontWeight: '700', fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--text-main)', display: 'flex', gap: '1rem', lineHeight: '1.4' }}>
                                <span style={{ color: 'var(--primary)', opacity: 0.8 }}>{q.order}.</span>
                                {q.questionText || q.translations?.[0]?.questionText}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                {q.answerOptions?.sort((a, b) => a.order - b.order).map((opt) => {
                                    const isSelected = opt.isSelected || q.userAnswers?.some(ua => ua.answerOptionId === opt.answerOptionId);
                                    return (
                                        <div
                                            key={opt.answerOptionId}
                                            style={{
                                                padding: '1.25rem 1.5rem',
                                                borderRadius: '1.25rem',
                                                background: isSelected ? 'rgba(212, 144, 0, 0.1)' : 'rgba(0,0,0,0.03)',
                                                border: `1px solid ${isSelected ? 'var(--primary)' : 'transparent'}`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '1.25rem',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <div style={{
                                                width: '28px',
                                                height: '28px',
                                                borderRadius: q.questionType === 1 ? '8px' : '50%',
                                                border: `2.5px solid ${isSelected ? 'var(--primary)' : 'var(--stroke)'}`,
                                                background: isSelected ? 'var(--primary)' : 'transparent',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                {isSelected && <CheckCircle size={18} color="white" />}
                                            </div>
                                            <span style={{
                                                color: isSelected ? 'var(--text-main)' : 'var(--text-muted)',
                                                fontWeight: isSelected ? '700' : '400',
                                                fontSize: '1.1rem'
                                            }}>
                                                {opt.optionText}
                                            </span>
                                        </div>
                                    );
                                })}

                                {q.questionType === 2 && (
                                    <div style={{
                                        padding: '1.5rem',
                                        borderRadius: '1.25rem',
                                        background: 'rgba(0,0,0,0.03)',
                                        border: '1px solid var(--glass-border)',
                                        color: 'var(--text-main)',
                                        lineHeight: '1.8'
                                    }}>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('forms.open_answer')}</div>
                                        <p style={{ fontSize: '1.1rem' }}>{q.userAnswers?.[0]?.answerText || t('common.none')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FormResponseDetail;
