import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Loader2, 
    AlertTriangle,
    CheckCircle2,
    ChevronLeft
} from 'lucide-react';
import { formResponseService } from '../../services/api';
import { useTranslation } from 'react-i18next';

const CustomerFormResult = () => {
    const { t, i18n } = useTranslation();
    const { id: userFormResponseId } = useParams();
    const navigate = useNavigate();

    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const LANGUAGE_IDS = {
        en: '11e8ba3a-b290-4a2c-9dad-0f40e457f72c',
        es: '6892a523-0dc1-4e3b-9ddd-c9a558c7920b'
    };
    const currentLanguageId = LANGUAGE_IDS[i18n.language.substring(0, 2)] || LANGUAGE_IDS.en;

    useEffect(() => {
        fetchResult();
    }, [userFormResponseId, currentLanguageId]);

    const fetchResult = async () => {
        setLoading(true);
        try {
            const res = await formResponseService.getFormAnalysis(userFormResponseId, currentLanguageId);
            if (res.status) {
                const rawData = res.data;
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
            } else {
                setError('No se pudo cargar el resultado del análisis');
            }
        } catch (err) {
            console.error(err);
            setError('Error de conexión al obtener resultados');
        } finally {
            setLoading(false);
        }
    };

    // Gauge Component (Matches Admin Report)
    const RiskGauge = ({ value }) => {
        const score = parseInt(value) || 0;
        const radius = 120;
        const innerRadius = 75;
        const centerX = 200;
        const centerY = 210;
        
        const percentageToRad = (p) => Math.PI - (p / 100) * Math.PI;

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
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <svg width="400" height="300" viewBox="0 0 400 300">
                    {drawSegment(0, 50, '#27AE60')}
                    {drawSegment(50, 75, '#FFB82E')}
                    {drawSegment(75, 100, '#FF3B30')}

                    {[0, 25, 50, 75, 100].map(tick => {
                        const rad = percentageToRad(tick);
                        const x1 = centerX + (radius + 5) * Math.cos(rad);
                        const y1 = centerY - (radius + 5) * Math.sin(rad);
                        const x2 = centerX + (radius + 15) * Math.cos(rad);
                        const y2 = centerY - (radius + 15) * Math.sin(rad);
                        const lx = centerX + (radius + 40) * Math.cos(rad);
                        const ly = centerY - (radius + 40) * Math.sin(rad);

                        return (
                            <g key={tick}>
                                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--text-main)" strokeWidth="4" strokeLinecap="round" />
                                <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: '1rem', fontWeight: '700', fill: 'var(--text-main)' }}>
                                    {tick}%
                                </text>
                            </g>
                        );
                    })}

                    <circle cx={centerX} cy={centerY} r="8" fill="var(--text-main)" />
                    <g style={{ 
                        transform: `rotate(${score * 1.8}deg)`, 
                        transformOrigin: `${centerX}px ${centerY}px`,
                        transition: 'transform 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}>
                        <line x1={centerX} y1={centerY} x2={centerX - (radius - 10)} y2={centerY} stroke="var(--text-main)" strokeWidth="5" strokeLinecap="round" />
                    </g>

                    <text 
                        x={centerX} 
                        y={centerY + 40} 
                        textAnchor="middle" 
                        style={{ fontSize: '2.5rem', fontWeight: '900', fill: 'var(--text-main)' }}
                    >
                        {score}%
                    </text>
                    <text 
                        x={centerX} 
                        y={centerY + 65} 
                        textAnchor="middle" 
                        style={{ fontSize: '1.2rem', fontWeight: '700', fill: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}
                    >
                        {i18n.language.startsWith('es') ? 'Riesgo Actual' : 'Current Risk'}
                    </text>
                </svg>
            </div>
        );
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

    return (
        <div style={{ padding: '1.5rem', maxWidth: '900px', margin: '0 auto', paddingBottom: '4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <button 
                    onClick={() => navigate('/customer/forms')}
                    style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '0.5rem', marginLeft: '-0.5rem' }}
                    title={t('common.back', 'Volver')}
                >
                    <ChevronLeft size={28} />
                </button>
            </div>
            
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', textAlign: 'center', marginBottom: '2.5rem' }}>{t('forms.results_title') || 'RESULTADOS'}</h1>

            <div className="glass-card" style={{ padding: '2.5rem', marginBottom: '2rem', textAlign: 'center' }}>
                <RiskGauge value={analysis.riskLevel} />
            </div>

            <div className="glass-card" style={{ padding: '2.5rem', marginBottom: '3rem' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '800', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', color: 'var(--text-main)' }}>
                    {t('forms.conclusions') || 'Conclusiones:'}
                </h3>
                <p style={{ 
                    fontSize: '1.15rem', 
                    lineHeight: '1.8', 
                    color: 'var(--text-main)', 
                    whiteSpace: 'pre-wrap',
                    opacity: 0.95
                }}>
                    {analysis.recommendations || analysis.analysisText}
                </p>
            </div>

            <div style={{ padding: '1rem 0' }}>
                <button 
                    onClick={() => navigate('/customer/forms')}
                    className="btn btn-primary"
                    style={{ 
                        width: '100%', 
                        padding: '1.25rem',
                        fontSize: '1.1rem',
                        fontWeight: '800',
                        borderRadius: '1.25rem',
                        boxShadow: '0 10px 20px rgba(212, 144, 0, 0.2)'
                    }}
                >
                    {t('forms.finish') || 'Finalizar'}
                </button>
            </div>
        </div>
    );
};

export default CustomerFormResult;
