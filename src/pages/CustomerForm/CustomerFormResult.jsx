import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertTriangle, CheckCircle2, LifeBuoy, Headphones } from 'lucide-react';
import { formResponseService, formService } from '../../services/api';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { isFreeForm } from '../../utils/subscription';
import { FormRiskBands } from '../../utils/formRiskBands';

const CustomerFormResult = () => {
    const { t, i18n } = useTranslation();
    const { id: userFormResponseId } = useParams();
    const navigate = useNavigate();
    const { isSubscribed } = useAuth();

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
            if (!isSubscribed) {
                const responseData = await formResponseService.getFormResponseById(userFormResponseId, currentLanguageId);
                const response = responseData?.data;
                const form = response?.form || (response?.formId ? (await formService.getFormById(response.formId, currentLanguageId))?.data : null);
                if (form && !isFreeForm(form)) {
                    navigate('/subscriptions');
                    return;
                }
            }

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

    // Se muestra antes que cualquier resultado cuando la persona marcó el ítem de seguridad.
    // Los números de emergencia cambian por país, así que aquí se ofrece la vía que la
    // plataforma sí controla: el apoyo humano de la app.
    const ImmediateSupportPanel = () => (
        <div style={{
            border: '2px solid #ef4444',
            background: 'rgba(239, 68, 68, 0.08)',
            borderRadius: '1rem',
            padding: '1.5rem',
            marginBottom: '2rem',
            textAlign: 'left'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                <LifeBuoy size={24} color="#ef4444" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    {t('forms.support_title')}
                </h3>
            </div>
            <p style={{ margin: '0 0 1rem', fontSize: '1rem', lineHeight: '1.6', color: 'var(--text-main)' }}>
                {t('forms.support_body')}
            </p>
            <button
                onClick={() => navigate('/customer/assistance')}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
                <Headphones size={18} />
                {t('forms.support_cta')}
            </button>
        </div>
    );

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

    // Los análisis generados antes del sistema de puntuación guardaron el riesgo como un número
    // suelto, sin banda ni puntaje. Se siguen mostrando con ese número para no dejar sin resultado
    // a quien vuelve a ver un formulario que ya había respondido.
    const legacyRisk = Number(analysis.riskLevel);
    const hasLegacyRisk = !Number.isNaN(legacyRisk) && analysis.riskLevel !== null && analysis.riskLevel !== '';
    const gaugeValue = typeof analysis.scorePercent === 'number'
        ? analysis.scorePercent
        : (hasLegacyRisk ? legacyRisk : null);
    const bandLabel = typeof analysis.scorePercent === 'number'
        ? t(`forms.risk_band.${(analysis.riskLevel || '').toLowerCase()}`, analysis.riskLevel || '')
        : (hasLegacyRisk ? t(`forms.risk_band.${FormRiskBands.forPercent(legacyRisk)}`) : '');

    return (
        <div style={{ paddingBottom: '4rem' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2.5rem' }}>
                <button 
                    onClick={() => navigate('/customer/forms')}
                    className="btn-back-premium"
                    title={t('common.back', 'Volver')}
                    style={{ position: 'absolute', left: 0 }}
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 style={{ fontSize: '1.875rem', fontWeight: '800', margin: 0, textAlign: 'center' }}>
                    {t('forms.results_title') || 'RESULTADOS'}
                </h1>
            </div>

            <div className="glass-card" style={{ padding: '2.5rem', marginBottom: '2rem', textAlign: 'center' }}>
                {analysis.requiresImmediateSupport && <ImmediateSupportPanel />}

                {typeof gaugeValue === 'number' && (
                    <>
                        <RiskGauge value={gaugeValue} />
                        <div style={{ marginTop: '1rem', fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)' }}>
                            {bandLabel}
                        </div>
                        <div style={{ marginTop: '0.35rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            {t('forms.orientation_disclaimer')}
                        </div>
                    </>
                )}
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
