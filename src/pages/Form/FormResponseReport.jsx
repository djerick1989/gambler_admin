import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Loader2, User, Calendar,
    MessageSquare, ShieldCheck, Zap, Info,
    AlertTriangle, FileText
} from 'lucide-react';
import { formResponseService } from '../../services/api';
import { useTranslation } from 'react-i18next';

const FormResponseReport = () => {
    const { t, i18n } = useTranslation();
    const { id: responseId } = useParams();
    const navigate = useNavigate();

    const [response, setResponse] = useState(null);
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
        setLoading(true);
        try {
            // First fetch the base response to get user data
            const respData = await formResponseService.getFormResponseById(responseId, currentLanguageId);
            if (respData && respData.status) {
                setResponse(respData.data);
            }

            // Then fetch the analysis
            const analysisData = await formResponseService.getFormAnalysis(responseId, currentLanguageId);
            if (analysisData && analysisData.status) {
                const rawData = analysisData.data;
                
                // Find matching translation or fallback to top level
                const translation = rawData.translations?.find(t => t.languageId === currentLanguageId);
                
                if (translation) {
                    setAnalysis({
                        ...rawData,
                        analysisText: translation.analysisText || rawData.analysisText,
                        recommendations: translation.recommendations || rawData.recommendations,
                        riskLevel: translation.riskLevel || rawData.riskLevel
                    });
                } else {
                    setAnalysis(rawData);
                }
            }
        } catch (err) {
            console.error("Error fetching report data:", err);
            setError('Error al obtener el reporte de análisis.');
        } finally {
            setLoading(false);
        }
    };

    const getRiskColor = (level) => {
        const score = parseInt(level);
        if (score > 75) return '#FF383C'; // Rojo
        if (score > 50) return '#FEBC2F'; // Anaranjado
        if (score > 25) return '#F2C94C'; // Amarillo
        return '#27AE60'; // Verde
    };

    // Gauge Component
    const RiskGauge = ({ value }) => {
        const score = parseInt(value) || 0;
        const radius = 120;
        const innerRadius = 75;
        const centerX = 200;
        const centerY = 210; // Increased more to give space at the top
        
        // Helper to convert percentage to radians
        const percentageToRad = (p) => {
            return Math.PI - (p / 100) * Math.PI;
        };

        const drawSegment = (startP, endP, color) => {
            const startRad = percentageToRad(startP);
            const endRad = percentageToRad(endP);
            
            const x1 = centerX + radius * Math.cos(startRad);
            const y1 = centerY - radius * Math.sin(startRad);
            const x2 = centerX + radius * Math.cos(endRad);
            const y2 = centerY - radius * Math.sin(endRad);
            
            const innerX1 = centerX + innerRadius * Math.cos(startRad);
            const innerY1 = centerY - innerRadius * Math.sin(startRad);
            const innerX2 = centerX + innerRadius * Math.cos(endRad);
            const innerY2 = centerY - innerRadius * Math.sin(endRad);

            return (
                <path
                    d={`M ${innerX1} ${innerY1} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} L ${innerX2} ${innerY2} A ${innerRadius} ${innerRadius} 0 0 0 ${innerX1} ${innerY1} Z`}
                    fill={color}
                    stroke="none"
                />
            );
        };

        return (
            <div style={{ 
                background: 'white', 
                borderRadius: '30px', 
                padding: '2rem', 
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'center',
                margin: '1rem auto'
            }}>
                <svg width="400" height="320" viewBox="0 0 400 320">
                    {/* Gauge Background Segments */}
                    {drawSegment(0, 50, '#27AE60')}
                    {drawSegment(50, 75, '#FFB82E')}
                    {drawSegment(75, 100, '#FF3B30')}

                    {/* Ticks and Labels */}
                    {[0, 25, 50, 75, 100].map(tick => {
                        const rad = percentageToRad(tick);
                        const x1 = centerX + (radius + 5) * Math.cos(rad);
                        const y1 = centerY - (radius + 5) * Math.sin(rad);
                        const x2 = centerX + (radius + 20) * Math.cos(rad);
                        const y2 = centerY - (radius + 20) * Math.sin(rad);
                        
                        const lx = centerX + (radius + 45) * Math.cos(rad);
                        const ly = centerY - (radius + 45) * Math.sin(rad);

                        return (
                            <g key={tick}>
                                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="black" strokeWidth="5" strokeLinecap="round" />
                                <text 
                                    x={lx} 
                                    y={ly} 
                                    textAnchor="middle" 
                                    dominantBaseline="middle" 
                                    style={{ fontSize: '1.2rem', fontWeight: '700', fill: '#333' }}
                                >
                                    {tick}%
                                </text>
                            </g>
                        );
                    })}

                    {/* Center Base */}
                    <circle cx={centerX} cy={centerY} r="10" fill="black" />
                    
                    {/* Needle */}
                    <g style={{ 
                        transform: `rotate(${score * 1.8}deg)`, 
                        transformOrigin: `${centerX}px ${centerY}px`,
                        transition: 'transform 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}>
                        <line 
                            x1={centerX} 
                            y1={centerY} 
                            x2={centerX - (radius - 10)} 
                            y2={centerY} 
                            stroke="black" 
                            strokeWidth="6" 
                            strokeLinecap="round" 
                        />
                    </g>

                    {/* Percentage and Label below needle base */}
                    <text 
                        x={centerX} 
                        y={centerY + 45} 
                        textAnchor="middle" 
                        style={{ fontSize: '2rem', fontWeight: '800', fill: 'black' }}
                    >
                        {score}%
                    </text>
                    <text 
                        x={centerX} 
                        y={centerY + 75} 
                        textAnchor="middle" 
                        style={{ fontSize: '1.25rem', fontWeight: '700', fill: 'black' }}
                    >
                        {i18n.language.startsWith('es') ? 'Riesgo Actual' : 'Current Risk'}
                    </text>
                </svg>
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
        <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
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
                        {t('forms.analysis_report')}
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', color: 'var(--text-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <User size={18} /> {response?.user?.name || response?.user?.nickName || 'Anonymous'}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Calendar size={18} /> {new Date(response?.completedAt).toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                {/* Risk Level Gauge Card */}
                <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
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
                            <Info size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                            <p>{t('forms.analysis_not_available')}</p>
                        </div>
                    )}
                </div>

                {/* Analysis Report Card */}
                {analysis && (
                    <div className="glass-card" style={{ padding: '3rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                            <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px' }}>
                                <MessageSquare size={24} color="#10b981" />
                            </div>
                            <h4 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)' }}>
                                {t('forms.analysis_report')}
                            </h4>
                        </div>

                        <p style={{
                            fontSize: '1.15rem',
                            lineHeight: '1.8',
                            color: 'var(--text-main)',
                            opacity: 0.9,
                            whiteSpace: 'pre-wrap',
                            marginBottom: '3rem',
                            padding: '2rem',
                            background: 'rgba(255,255,255,0.02)',
                            borderRadius: '1.5rem',
                            border: '1px solid var(--glass-border)'
                        }}>
                            {analysis.analysisText}
                        </p>

                        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '3rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                                <div style={{ padding: '0.75rem', background: 'rgba(212, 144, 0, 0.1)', borderRadius: '12px' }}>
                                    <Zap size={24} color="var(--primary)" />
                                </div>
                                <h4 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)' }}>
                                    {t('forms.recommendations')}
                                </h4>
                            </div>
                            <p style={{
                                fontSize: '1.15rem',
                                lineHeight: '1.8',
                                color: 'var(--text-main)',
                                opacity: 0.9,
                                whiteSpace: 'pre-wrap',
                                padding: '2rem',
                                background: 'rgba(255,255,255,0.02)',
                                borderRadius: '1.5rem',
                                border: '1px solid var(--glass-border)'
                            }}>
                                {analysis.recommendations}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FormResponseReport;
