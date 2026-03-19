import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { formService, formResponseService, formAnalysisService } from '../../services/api';
import { useTranslation } from 'react-i18next';

const CustomerFormProcess = () => {
    const { t, i18n } = useTranslation();
    const { id: formId } = useParams();
    const navigate = useNavigate();
    const { state } = useLocation();
    const userFormResponseId = state?.userFormResponseId;

    const [form, setForm] = useState(null);
    const [answers, setAnswers] = useState({}); // { questionId: [optionId1, optionId2] or text }
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const LANGUAGE_IDS = {
        en: '11e8ba3a-b290-4a2c-9dad-0f40e457f72c',
        es: '6892a523-0dc1-4e3b-9ddd-c9a558c7920b'
    };
    const currentLanguageId = LANGUAGE_IDS[i18n.language.substring(0, 2)] || LANGUAGE_IDS.en;

    useEffect(() => {
        if (!userFormResponseId) {
            navigate('/customer/forms');
            return;
        }
        fetchForm();
    }, [formId, currentLanguageId]);

    const fetchForm = async () => {
        setLoading(true);
        try {
            const res = await formService.getFormById(formId, currentLanguageId);
            if (res.status) {
                setForm(res.data);
                // Initialize answers
                const initialAnswers = {};
                res.data.questions.forEach(q => {
                    // Type 3 is OPEN_TEXT
                    initialAnswers[q.questionId] = q.questionType === 3 ? "" : [];
                });
                setAnswers(initialAnswers);
            } else {
                setError('No se pudo cargar el formulario');
            }
        } catch (err) {
            console.error(err);
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const handleOptionToggle = (questionId, optionId, multiple = true) => {
        setAnswers(prev => {
            const current = Array.isArray(prev[questionId]) ? prev[questionId] : [];
            if (multiple) {
                if (current.includes(optionId)) {
                    return { ...prev, [questionId]: current.filter(id => id !== optionId) };
                } else {
                    return { ...prev, [questionId]: [...current, optionId] };
                }
            } else {
                return { ...prev, [questionId]: [optionId] };
            }
        });
    };

    const handleTextChange = (questionId, text) => {
        setAnswers(prev => ({ ...prev, [questionId]: text }));
    };

    const validateAnswers = () => {
        if (!form || !form.questions) return false;
        for (const q of form.questions) {
            if (q.required) {
                const ans = answers[q.questionId];
                if (q.questionType === 3) { // OPEN_TEXT
                    if (!ans || ans.trim() === "") return false;
                } else {
                    if (!ans || ans.length === 0) return false;
                }
            }
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateAnswers()) {
            alert('Por favor responde todas las preguntas obligatorias');
            return;
        }

        setSubmitting(true);
        try {
            // Prepare answers for API
            const formattedAnswers = [];
            Object.keys(answers).forEach(qId => {
                const ans = answers[qId];
                if (Array.isArray(ans)) {
                    ans.forEach(optId => {
                        formattedAnswers.push({
                            questionId: qId,
                            answerOptionId: optId,
                            answerText: ""
                        });
                    });
                } else {
                    formattedAnswers.push({
                        questionId: qId,
                        answerOptionId: null,
                        answerText: ans
                    });
                }
            });

            const submitRes = await formResponseService.submitFormResponse({
                userFormResponseId: userFormResponseId,
                answers: formattedAnswers
            }, currentLanguageId);

            if (submitRes.status) {
                // Generate analysis immediately
                const analysisRes = await formAnalysisService.generateAnalysis(userFormResponseId, currentLanguageId);
                if (analysisRes.status) {
                    navigate(`/customer/forms/result/${userFormResponseId}`);
                } else {
                    navigate('/customer/forms');
                }
            } else {
                alert('Error al guardar las respuestas');
            }
        } catch (err) {
            console.error(err);
            alert('Error al enviar el formulario');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <Loader2 className="animate-spin" size={48} color="var(--primary)" />
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ textAlign: 'center', padding: '4rem' }}>
                <AlertTriangle size={64} color="#ef4444" style={{ marginBottom: '1rem' }} />
                <p>{error}</p>
                <button onClick={() => navigate('/customer/forms')} className="btn btn-primary" style={{ marginTop: '2rem' }}>Volver</button>
            </div>
        );
    }

    const formTitle = form.translations?.find(t => t.languageId === currentLanguageId)?.title || "Formulario";

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                    <button 
                        onClick={() => navigate('/customer/forms')}
                        className="btn-icon"
                        style={{ 
                            background: 'white', 
                            border: '1px solid var(--glass-border)', 
                            borderRadius: '12px', 
                            width: '40px', 
                            height: '40px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            cursor: 'pointer',
                            color: 'var(--text-main)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <ArrowLeft size={20} />
                    </button>
                <h1 style={{ fontSize: '1.75rem', fontWeight: '800' }}>{formTitle}</h1>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {form.questions.sort((a,b) => a.order - b.order).map((q, idx) => {
                    const qText = q.translations?.find(t => t.languageId === currentLanguageId)?.questionText || q.questionText;
                    const isAnswered = q.questionType === 3 ? (answers[q.questionId]?.trim() !== "") : (answers[q.questionId]?.length > 0);

                    return (
                        <div key={q.questionId} className="glass-card" style={{ 
                            padding: '1.75rem', 
                            border: isAnswered ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                            transition: 'all 0.3s ease',
                            background: isAnswered ? 'rgba(212, 144, 0, 0.02)' : 'var(--bg-white)'
                        }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.25rem', lineHeight: '1.4' }}>
                                {qText} {q.required && <span style={{ color: '#ef4444' }}>*</span>}
                            </h3>

                            {q.questionType === 3 ? (
                                <textarea 
                                    value={answers[q.questionId]}
                                    onChange={(e) => handleTextChange(q.questionId, e.target.value)}
                                    placeholder={t('forms.open_placeholder', 'Escribe tu respuesta aquí...')}
                                    style={{ 
                                        width: '100%', 
                                        minHeight: '100px', 
                                        padding: '1rem',
                                        borderRadius: '0.75rem',
                                        background: 'var(--bg-light)',
                                        border: '1px solid var(--stroke)',
                                        color: 'var(--text-main)',
                                        fontSize: '1rem',
                                        resize: 'vertical',
                                        outline: 'none'
                                    }}
                                />
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                    {q.answerOptions.sort((a,b) => a.order - b.order).map(opt => {
                                        const optText = opt.translations?.find(t => t.languageId === currentLanguageId)?.optionText || opt.optionText;
                                        const isSelected = answers[q.questionId]?.includes(opt.answerOptionId);
                                        
                                        return (
                                            <div 
                                                key={opt.answerOptionId}
                                                onClick={() => handleOptionToggle(q.questionId, opt.answerOptionId, q.questionType === 1)}
                                                style={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: '0.85rem', 
                                                    padding: '0.85rem 1.25rem', 
                                                    borderRadius: '0.75rem',
                                                    background: isSelected ? 'rgba(212, 144, 0, 0.08)' : 'transparent',
                                                    cursor: 'pointer',
                                                    border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--stroke)'}`,
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                <div style={{ 
                                                    width: '20px', 
                                                    height: '20px', 
                                                    borderRadius: '5px', 
                                                    border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--stroke)'}`,
                                                    background: isSelected ? 'var(--primary)' : 'transparent',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0
                                                }}>
                                                    {isSelected && <CheckCircle2 size={14} color="white" />}
                                                </div>
                                                <span style={{ 
                                                    fontSize: '0.95rem', 
                                                    fontWeight: isSelected ? '600' : '400',
                                                    color: isSelected ? 'var(--text-main)' : 'var(--text-main)'
                                                }}>
                                                    {optText}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div style={{ 
                marginTop: '3rem',
                paddingTop: '2rem',
                borderTop: '1px solid var(--glass-border)'
            }}>
                <button 
                    onClick={handleSubmit}
                    disabled={submitting || !validateAnswers()}
                    className="btn btn-primary"
                    style={{ 
                        width: '100%', 
                        padding: '1.25rem',
                        fontSize: '1.1rem',
                        fontWeight: '800',
                        borderRadius: '1.25rem',
                        opacity: !validateAnswers() ? 0.5 : 1,
                        boxShadow: '0 10px 20px rgba(212, 144, 0, 0.2)'
                    }}
                >
                    {submitting ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                            <Loader2 className="animate-spin" size={20} />
                            {t('forms.generating_analysis', 'Generando Análisis...')}
                        </div>
                    ) : t('forms.review', 'Revisar')}
                </button>
            </div>
        </div>
    );
};

export default CustomerFormProcess;
