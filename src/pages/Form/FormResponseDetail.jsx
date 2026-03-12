import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    ChevronLeft, Loader2, User, Calendar,
    CheckCircle, MessageSquare, ClipboardList,
    AlertTriangle, ShieldCheck, Zap, Info
} from 'lucide-react';
import { formResponseService } from '../../services/api';
import { useTranslation } from 'react-i18next';

const FormResponseDetail = () => {
    const { t, i18n } = useTranslation();
    const { id: responseId } = useParams();
    const navigate = useNavigate();

    const { state } = useLocation();
    const [response, setResponse] = useState(state?.response || null);
    const [analysis, setAnalysis] = useState(null);
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
        // We try to use the response object passed via state first
        // If it's missing (e.g., direct URL access), we attempt to fetch it but respect that the user 
        // says the primary source should be the state from the list.
        if (response && (response.questions || response.form?.questions)) {
            // Already have the data from state
        } else {
            setLoading(true);
            try {
                const respData = await formResponseService.getFormResponseById(responseId, currentLanguageId);
                if (respData && respData.status) {
                    setResponse(respData.data);
                } else {
                    setError('No se pudo encontrar la información de la respuesta.');
                    setLoading(false);
                    return;
                }
            } catch (err) {
                console.error("Error fetching response details:", err);
                setError('Error al obtener los detalles de la respuesta.');
                setLoading(false);
                return;
            }
        }

        setError(null);
        setLoading(true);

        try {
            // Fetch analysis independently
            try {
                const analysisData = await formResponseService.getFormAnalysis(responseId, currentLanguageId);
                if (analysisData && analysisData.status) {
                    setAnalysis(analysisData.data);
                }
            } catch (err) {
                console.error("Error fetching analysis:", err);
            }
        } catch (err) {
            console.error("General fetch error:", err);
            setError('Error al conectar con el servidor para obtener el análisis.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    const getRiskColor = (level) => {
        const score = parseInt(level);
        if (score > 75) return '#FF383C'; // Rojo
        if (score > 50) return '#FEBC2F'; // Anaranjado
        if (score > 25) return '#F2C94C'; // Amarillo (Transicional)
        return '#27AE60'; // Verde
    };

    // Gauge Component
    const RiskGauge = ({ value }) => {
        const score = parseInt(value) || 0;
        const radius = 90;
        const strokeWidth = 18;
        const normalizedRadius = radius - strokeWidth / 2;
        const circumference = normalizedRadius * 2 * Math.PI;
        const halfCircumference = circumference / 2;
        const strokeDashoffset = halfCircumference - (score / 100) * halfCircumference;
        const color = getRiskColor(score);

        return (
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem' }}>
                <svg
                    height={radius + 10}
                    width={radius * 2}
                    viewBox={`0 0 ${radius * 2} ${radius + 10}`}
                >
                    <defs>
                        <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#27AE60" />
                            <stop offset="25%" stopColor="#F2C94C" />
                            <stop offset="50%" stopColor="#FEBC2F" />
                            <stop offset="75%" stopColor="#FF383C" />
                        </linearGradient>
                        <filter id="needleShadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur in="SourceAlpha" stdDeviation="1" />
                            <feOffset dx="0" dy="1" result="offsetblur" />
                            <feComponentTransfer>
                                <feFuncA type="linear" slope="0.3" />
                            </feComponentTransfer>
                            <feMerge>
                                <feMergeNode />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Background Track with Zones */}
                    <path
                        d={`M ${strokeWidth / 2},${radius} A ${normalizedRadius},${normalizedRadius} 0 0,1 ${radius * 2 - strokeWidth / 2},${radius}`}
                        fill="transparent"
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                    />

                    {/* Colored Track */}
                    <path
                        d={`M ${strokeWidth / 2},${radius} A ${normalizedRadius},${normalizedRadius} 0 0,1 ${radius * 2 - strokeWidth / 2},${radius}`}
                        fill="transparent"
                        stroke="url(#gaugeGradient)"
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        style={{ opacity: 0.15 }}
                    />

                    {/* Active Track */}
                    <path
                        d={`M ${strokeWidth / 2},${radius} A ${normalizedRadius},${normalizedRadius} 0 0,1 ${radius * 2 - strokeWidth / 2},${radius}`}
                        fill="transparent"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${halfCircumference} ${halfCircumference}`}
                        style={{
                            strokeDashoffset,
                            transition: 'stroke-dashoffset 1.5s cubic-bezier(0.34, 1.56, 0.64, 1), stroke 1s ease',
                            filter: `drop-shadow(0 0 5px ${color}44)`
                        }}
                        strokeLinecap="round"
                    />

                    {/* Ticks */}
                    {[0, 25, 50, 75, 100].map(tick => {
                        const angle = (180 + (tick / 100) * 180) * Math.PI / 180;
                        const x1 = radius + (normalizedRadius - 15) * Math.cos(angle);
                        const y1 = radius + (normalizedRadius - 15) * Math.sin(angle);
                        const x2 = radius + (normalizedRadius - 22) * Math.cos(angle);
                        const y2 = radius + (normalizedRadius - 22) * Math.sin(angle);
                        return (
                            <line
                                key={tick}
                                x1={x1} y1={y1} x2={x2} y2={y2}
                                stroke="rgba(255,255,255,0.3)"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                        );
                    })}

                    {/* Needle */}
                    <g style={{
                        transform: `rotate(${(score / 100) * 180}deg)`,
                        transformOrigin: `${radius}px ${radius}px`,
                        transition: 'transform 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        filter: 'url(#needleShadow)'
                    }}>
                        <path
                            d={`M ${radius - 4},${radius} L ${radius},15 L ${radius + 4},${radius} Z`}
                            fill="var(--text-main)"
                        />
                        <circle cx={radius} cy={radius} r="6" fill="var(--text-main)" />
                        <circle cx={radius} cy={radius} r="3" fill="var(--bg-main)" />
                    </g>
                </svg>

                <div style={{ marginTop: '-10px', textAlign: 'center' }}>
                    <div style={{
                        fontSize: '3rem',
                        fontWeight: '900',
                        color: 'var(--text-main)',
                        textShadow: '0 4px 12px rgba(0,0,0,0.2)',
                        lineHeight: 1
                    }}>
                        {score}%
                    </div>
                    <div style={{
                        fontSize: '0.9rem',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        letterSpacing: '2px',
                        color: color,
                        marginTop: '0.5rem',
                        transition: 'color 1s ease'
                    }}>
                        {score > 75 ? t('forms.risk_high') : score > 50 ? t('forms.risk_medium') : score > 25 ? t('forms.risk_low') : t('forms.risk_minimal')}
                    </div>
                </div>
            </div>
        );
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
        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '3rem' }}>
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

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: '2.5rem', alignItems: 'start' }}>
                {/* Left Side: Questions and Answers */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="glass-card" style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1.5rem' }}>
                            <div style={{ padding: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px' }}>
                                <ClipboardList size={24} color="#3b82f6" />
                            </div>
                            <h3 style={{ fontSize: '1.75rem', fontWeight: '800' }}>{t('forms.user_answers')}</h3>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            {(response?.questions || response?.form?.questions)?.sort((a, b) => a.order - b.order).map((q) => (
                                <div key={q.questionId} style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid var(--glass-border)' }}>
                                    <div style={{ fontWeight: '700', fontSize: '1.15rem', marginBottom: '1.25rem', color: 'var(--text-main)', display: 'flex', gap: '0.75rem' }}>
                                        <span style={{ color: 'var(--primary)', opacity: 0.8 }}>{q.order}.</span>
                                        {q.questionText || q.translations?.[0]?.questionText}
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {q.answerOptions?.sort((a, b) => a.order - b.order).map((opt) => {
                                            const isSelected = opt.isSelected || q.userAnswers?.some(ua => ua.answerOptionId === opt.answerOptionId);
                                            return (
                                                <div
                                                    key={opt.answerOptionId}
                                                    style={{
                                                        padding: '1rem 1.25rem',
                                                        borderRadius: '1rem',
                                                        background: isSelected ? 'rgba(212, 144, 0, 0.1)' : 'rgba(0,0,0,0.03)',
                                                        border: `1px solid ${isSelected ? 'var(--primary)' : 'transparent'}`,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '1rem',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <div style={{
                                                        width: '24px',
                                                        height: '24px',
                                                        borderRadius: q.questionType === 1 ? '6px' : '50%',
                                                        border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--stroke)'}`,
                                                        background: isSelected ? 'var(--primary)' : 'transparent',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}>
                                                        {isSelected && <CheckCircle size={16} color="white" />}
                                                    </div>
                                                    <span style={{
                                                        color: isSelected ? 'var(--text-main)' : 'var(--text-muted)',
                                                        fontWeight: isSelected ? '700' : '400',
                                                        fontSize: '1rem'
                                                    }}>
                                                        {opt.optionText}
                                                    </span>
                                                </div>
                                            );
                                        })}

                                        {q.questionType === 2 && (
                                            <div style={{
                                                padding: '1.25rem',
                                                borderRadius: '1rem',
                                                background: 'rgba(0,0,0,0.03)',
                                                border: '1px solid var(--glass-border)',
                                                color: 'var(--text-main)',
                                                lineHeight: '1.6'
                                            }}>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '600' }}>{t('forms.open_answer')}</div>
                                                {q.userAnswers?.[0]?.answerText || t('common.none')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Side: Analysis and Risk */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', position: 'sticky', top: '2rem' }}>
                    {/* Risk Level Gauge Card */}
                    <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                            <ShieldCheck size={24} color="var(--primary)" />
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                {t('forms.risk_assessment')}
                            </h3>
                        </div>

                        {analysis ? (
                            <RiskGauge value={analysis.riskLevel} />
                        ) : (
                            <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>
                                <Loader2 className="animate-spin" style={{ margin: '0 auto 1rem' }} />
                                {t('forms.generating_analysis')}
                            </div>
                        )}
                    </div>

                    {/* Analysis Report Card */}
                    {analysis && (
                        <div className="glass-card" style={{ padding: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div style={{ padding: '0.6rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '10px' }}>
                                    <MessageSquare size={20} color="#10b981" />
                                </div>
                                <h4 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)' }}>
                                    {t('forms.analysis_report')}
                                </h4>
                            </div>

                            <p style={{
                                fontSize: '1rem',
                                lineHeight: '1.8',
                                color: 'var(--text-main)',
                                opacity: 0.9,
                                whiteSpace: 'pre-wrap',
                                marginBottom: '2rem'
                            }}>
                                {analysis.analysisText}
                            </p>

                            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                    <div style={{ padding: '0.6rem', background: 'rgba(212, 144, 0, 0.1)', borderRadius: '10px' }}>
                                        <Zap size={20} color="var(--primary)" />
                                    </div>
                                    <h4 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)' }}>
                                        {t('forms.recommendations')}
                                    </h4>
                                </div>
                                <p style={{
                                    fontSize: '1rem',
                                    lineHeight: '1.8',
                                    color: 'var(--text-main)',
                                    opacity: 0.9,
                                    whiteSpace: 'pre-wrap'
                                }}>
                                    {analysis.recommendations}
                                </p>
                            </div>
                        </div>
                    )}

                    {!analysis && !loading && (
                        <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <Info size={32} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                            <p>{t('forms.analysis_not_available')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FormResponseDetail;
