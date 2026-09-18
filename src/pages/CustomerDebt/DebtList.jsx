import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Plus, Info, LayoutGrid, List as ListIcon, 
    ChevronRight, Loader2, AlertCircle,
    TrendingUp, Calendar, CreditCard
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { debtService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getLanguageId } from '../../utils/languages';
import {
    SORT_STRATEGIES,
    progressPercent,
    projectPayoff,
    sortDebts,
    strategyInterestGap,
    totalPaid
} from '../../utils/debtMath';

const DebtList = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [currentSlide, setCurrentSlide] = useState(0);
    const [showCancelled, setShowCancelled] = useState(false);
    // Bola de nieve por defecto: la victoria temprana es lo que sostiene la constancia, y una
    // estrategia que se abandona a los dos meses no sirve por muy optima que sea.
    const [strategy, setStrategy] = useState(SORT_STRATEGIES.SNOWBALL);
    const [incomeDraft, setIncomeDraft] = useState("");
    const [savingIncome, setSavingIncome] = useState(false);

    useEffect(() => {
        if (user?.gambler?.gamblerId) {
            fetchDebts();
        } else {
            setLoading(false);
        }
    }, [user?.gambler?.gamblerId, i18n.language]);

    const fetchDebts = async () => {
        setLoading(true);
        try {
            const languageId = getLanguageId(i18n.language);
            const res = await debtService.getByGamblerId(user.gambler.gamblerId, languageId);
            if (res.status) {
                setData(res.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveIncome = async () => {
        const amount = Number(incomeDraft);
        if (!Number.isFinite(amount) || amount <= 0) return;

        setSavingIncome(true);
        try {
            const currency = (Array.isArray(data?.summary) ? data.summary[0]?.currency : null) || 'USD';
            const res = await debtService.updateIncome(user.gambler.gamblerId, {
                monthlyIncome: amount,
                currency
            });
            if (res.status) {
                setIncomeDraft("");
                fetchDebts();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSavingIncome(false);
        }
    };

    /**
     * Descarga un resumen en CSV. Sirve para llevarselo a un asesor o a un familiar, que es la
     * conversacion en la que estos numeros hacen falta de verdad.
     */
    const handleExport = () => {
        const header = ['Acreedor', 'Moneda', 'Saldo', 'Cuota', 'Interes anual %', 'Frecuencia', 'Dia de pago', 'Estado'];
        const rows = (data?.debts || []).map(debt => [
            debt.creditor,
            debt.currency,
            debt.currentBalance,
            debt.monthlyInstallment,
            debt.annualInterestRate,
            debt.paymentFrequency || 'Monthly',
            debt.paymentDay,
            debt.status
        ]);

        const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
        const csv = [header, ...rows].map(row => row.map(escape).join(',')).join('\n');
        // El BOM hace que Excel abra los acentos correctamente.
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'deudas.csv';
        link.click();
        URL.revokeObjectURL(url);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return date.toLocaleDateString(i18n.language === 'es' ? 'es-ES' : 'en-US', {
            day: '2-digit',
            month: 'long'
        });
    };

    const formatCurrency = (amount, currency = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD',
        }).format(amount || 0);
    };

    const summaries = Array.isArray(data?.summary) ? data.summary : (data?.summary ? [data.summary] : []);

    const debtView = useMemo(() => {
        const all = data?.debts || [];
        const visible = all.filter(debt => showCancelled ? debt.status === 'Cancelled' : debt.status === 'Active');

        // Las canceladas no se reordenan: ahi el orden de ataque no significa nada.
        return {
            debts: showCancelled ? visible : sortDebts(visible, strategy),
            avalancheSaving: showCancelled ? 0 : strategyInterestGap(visible)
        };
    }, [data, showCancelled, strategy]);

    useEffect(() => {
        if (summaries.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % summaries.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [summaries.length]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <Loader2 size={48} className="animate-spin" color="var(--primary)" />
            </div>
        );
    }
    const { debts, avalancheSaving } = debtView;
    const affordability = data?.affordability || null;
    const gamblingImpact = data?.gamblingImpact || null;

    // El umbral no es decorativo: por encima del 40 % del ingreso, la situacion no se sostiene y
    // hay que decirlo, no pintarlo del mismo color que un 12 %.
    const dtiTone = !affordability
        ? { color: 'var(--text-main)', messageKey: 'debts.dti_ok' }
        : affordability.debtToIncomePercent >= 40
            ? { color: '#b91c1c', messageKey: 'debts.dti_critical' }
            : affordability.debtToIncomePercent >= 25
                ? { color: '#b45309', messageKey: 'debts.dti_warning' }
                : { color: '#15803d', messageKey: 'debts.dti_ok' };

    return (
        <div style={{ paddingBottom: '5rem' }}>

            {/* Summary Cards Container (Slider) */}
            <div style={{ position: 'relative', overflow: 'hidden', marginBottom: '2.5rem', borderRadius: '1.5rem', boxShadow: '0 15px 30px rgba(212, 144, 0, 0.25)' }}>
                <div style={{ 
                    display: 'flex', 
                    transition: 'transform 0.5s ease-in-out', 
                    transform: `translateX(-${currentSlide * 100}%)` 
                }}>
                    {summaries.map((summary, index) => (
                        <div key={index} className="glass-card" style={{ 
                            minWidth: '100%',
                            background: 'linear-gradient(135deg, #FFB82E 0%, #D49000 100%)',
                            padding: '2rem',
                            color: 'var(--text-main)',
                            position: 'relative',
                            overflow: 'hidden',
                            border: 'none'
                        }}>
                            <div style={{ position: 'relative', zIndex: 1, paddingBottom: summaries.length > 1 ? '1.5rem' : '0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800' }}>
                                        {summary.currency || t('debts.summary')}
                                    </h3>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div>
                                        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700', opacity: 0.8 }}>{t('debts.monthly_pago')}:</p>
                                        <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '900' }}>{formatCurrency(summary.totalMonthlyPayment, summary.currency)}</p>
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700', opacity: 0.8 }}>{t('debts.total_to_pay')}:</p>
                                        <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '900' }}>{formatCurrency(summary.totalBalance, summary.currency)}</p>
                                    </div>
                                </div>
                                {summary.nextPaymentCreditor && (
                                    <div style={{ borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '1rem' }}>
                                        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700', opacity: 0.8 }}>{t('debts.next_pago')}:</p>
                                        <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800' }}>
                                            {formatCurrency(summary.nextPaymentAmount, summary.currency)} 
                                            {summary.nextPaymentDate && ` (${formatDate(summary.nextPaymentDate)})`}
                                            {` - ${summary.nextPaymentCreditor}`}
                                        </p>
                                    </div>
                                )}
                            </div>
                            {/* Decorative circles */}
                            <div style={{ position: 'absolute', right: '-50px', top: '-50px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', zIndex: 0 }}></div>
                            <div style={{ position: 'absolute', left: '-20px', bottom: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', zIndex: 0 }}></div>
                        </div>
                    ))}
                </div>

                {/* Slider Indicators */}
                {summaries.length > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', position: 'absolute', bottom: '1rem', width: '100%', zIndex: 2 }}>
                        {summaries.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentSlide(index)}
                                aria-label={`Go to slide ${index + 1}`}
                                style={{
                                    width: currentSlide === index ? '24px' : '8px',
                                    height: '8px',
                                    borderRadius: '4px',
                                    background: currentSlide === index ? 'white' : 'rgba(255,255,255,0.5)',
                                    border: 'none',
                                    transition: 'all 0.3s ease',
                                    cursor: 'pointer',
                                    padding: 0
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Capacidad de pago: sin el ingreso, el modulo solo puede registrar, no aconsejar. */}
            <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '1.25rem', marginBottom: '1.5rem' }}>
                {affordability ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                                {t('debts.dti_label')}
                            </p>
                            <p style={{ margin: '0.2rem 0 0', fontSize: '1.6rem', fontWeight: '900', color: dtiTone.color }}>
                                {affordability.debtToIncomePercent} %
                            </p>
                            <p style={{ margin: '0.25rem 0 0', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                                {t(dtiTone.messageKey, {
                                    remaining: formatCurrency(affordability.remainingAfterDebt, affordability.currency)
                                })}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIncomeDraft(String(affordability.monthlyIncome))}
                            style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: '700', cursor: 'pointer' }}
                        >
                            {t('debts.income_change')}
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
                        <div style={{ flex: '1 1 240px' }}>
                            <p style={{ margin: 0, fontWeight: '800' }}>{t('debts.income_prompt_title')}</p>
                            <p style={{ margin: '0.2rem 0 0', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                                {t('debts.income_prompt_text')}
                            </p>
                        </div>
                        <input
                            type="number"
                            min="0"
                            value={incomeDraft}
                            onChange={(e) => setIncomeDraft(e.target.value)}
                            placeholder={t('debts.income_placeholder')}
                            style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--glass-border)', fontWeight: '700', maxWidth: '160px' }}
                        />
                        <button
                            type="button"
                            className="btn btn-primary"
                            disabled={savingIncome || !incomeDraft}
                            onClick={handleSaveIncome}
                            style={{ padding: '0.75rem 1.25rem', borderRadius: '0.75rem', fontWeight: '700' }}
                        >
                            {savingIncome ? <Loader2 size={18} className="animate-spin" /> : t('debts.income_save')}
                        </button>
                    </div>
                )}
            </div>

            {/* El cruce que solo puede hacer esta app: lo perdido jugando frente a lo que crecio la deuda. */}
            {gamblingImpact && (
                <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '1.25rem', marginBottom: '1.5rem', borderLeft: '4px solid #b91c1c' }}>
                    <p style={{ margin: 0, fontWeight: '800' }}>{t('debts.gambling_impact_title', { months: gamblingImpact.months })}</p>
                    <p style={{ margin: '0.4rem 0 0', fontSize: '0.95rem', color: 'var(--text-main)' }}>
                        {t('debts.gambling_impact_text', {
                            gambled: formatCurrency(gamblingImpact.amountGambled, gamblingImpact.currency),
                            relapses: gamblingImpact.relapseCount,
                            growth: formatCurrency(gamblingImpact.debtGrowth, gamblingImpact.currency)
                        })}
                    </p>
                </div>
            )}

            {/* Orden de ataque: con varias deudas, por cual empezar cambia el resultado. */}
            {!showCancelled && debts.length > 1 && (
                <div className="glass-card" style={{ padding: '1.1rem 1.25rem', borderRadius: '1.25rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-muted)' }}>
                            {t('debts.strategy_label')}
                        </span>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {[
                                { key: SORT_STRATEGIES.SNOWBALL, label: t('debts.strategy_snowball') },
                                { key: SORT_STRATEGIES.AVALANCHE, label: t('debts.strategy_avalanche') },
                                { key: SORT_STRATEGIES.DUE_DATE, label: t('debts.strategy_due_date') }
                            ].map(option => (
                                <button
                                    key={option.key}
                                    type="button"
                                    onClick={() => setStrategy(option.key)}
                                    aria-pressed={strategy === option.key}
                                    style={{
                                        padding: '0.45rem 0.9rem',
                                        borderRadius: '0.6rem',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontWeight: '700',
                                        transition: 'all 0.2s',
                                        background: strategy === option.key ? 'var(--primary)' : 'rgba(0,0,0,0.05)',
                                        color: strategy === option.key ? 'white' : 'var(--text-muted)'
                                    }}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                        {strategy === SORT_STRATEGIES.AVALANCHE && t('debts.strategy_hint_avalanche')}
                        {strategy === SORT_STRATEGIES.DUE_DATE && t('debts.strategy_hint_due_date')}
                        {strategy === SORT_STRATEGIES.SNOWBALL && (
                            <>
                                {t('debts.strategy_hint_snowball')}
                                {avalancheSaving > 0 && ` ${t('debts.strategy_saving', { amount: formatCurrency(avalancheSaving, debts[0]?.currency) })}`}
                            </>
                        )}
                    </p>
                </div>
            )}

            {/* Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div className="glass-card" style={{ padding: '0.5rem', display: 'flex', gap: '0.5rem', borderRadius: '0.75rem' }}>
                            <button 
                                onClick={() => setViewMode('grid')}
                                style={{ background: viewMode === 'grid' ? 'var(--primary)' : 'transparent', color: viewMode === 'grid' ? 'white' : 'var(--text-muted)', border: 'none', padding: '0.4rem', borderRadius: '0.5rem', cursor: 'pointer' }}
                            >
                                <LayoutGrid size={20} />
                            </button>
                            <button 
                                onClick={() => setViewMode('list')}
                                style={{ background: viewMode === 'list' ? 'var(--primary)' : 'transparent', color: viewMode === 'list' ? 'white' : 'var(--text-muted)', border: 'none', padding: '0.4rem', borderRadius: '0.5rem', cursor: 'pointer' }}
                            >
                                <ListIcon size={20} />
                            </button>
                        </div>
                    </div>

                    {(data?.debts || []).length > 0 && (
                        <button
                            type="button"
                            onClick={handleExport}
                            style={{ background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', padding: '0.5rem 1rem', fontWeight: '700', color: 'var(--text-muted)', cursor: 'pointer' }}
                        >
                            {t('debts.export')}
                        </button>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-muted)' }}>{t('debts.show_debts', 'Mostrar deudas:')}</span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={() => setShowCancelled(false)}
                                style={{ 
                                    padding: '0.5rem 1rem', 
                                    borderRadius: '0.5rem', 
                                    border: 'none', 
                                    background: !showCancelled ? 'var(--primary)' : 'rgba(0,0,0,0.05)', 
                                    color: !showCancelled ? 'white' : 'var(--text-muted)',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {t('debts.active', 'Activas')}
                            </button>
                            <button
                                onClick={() => setShowCancelled(true)}
                                style={{ 
                                    padding: '0.5rem 1rem', 
                                    borderRadius: '0.5rem', 
                                    border: 'none', 
                                    background: showCancelled ? 'var(--primary)' : 'rgba(0,0,0,0.05)', 
                                    color: showCancelled ? 'white' : 'var(--text-muted)',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {t('common.cancelled', 'Canceladas')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                    <button 
                        onClick={() => navigate('/customer/debts/new')}
                        className="btn-icon" 
                        style={{ background: 'var(--primary)', color: 'white', borderRadius: '50%', width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', boxShadow: '0 4px 10px rgba(212, 144, 0, 0.3)', flexShrink: 0 }}
                    >
                        <Plus size={20} strokeWidth={3} />
                    </button>
                    <button 
                        onClick={() => navigate('/customer/debts/policy')}
                        className="btn-icon" 
                        style={{ background: 'white', color: 'var(--primary)', borderRadius: '50%', width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--glass-border)', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', flexShrink: 0 }}
                    >
                        <Info size={20} strokeWidth={3} />
                    </button>
                </div>
            </div>

            {/* Debts List */}
            {debts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', opacity: 0.6 }}>
                    <AlertCircle size={48} style={{ marginBottom: '1rem' }} />
                    <p style={{ fontSize: '1.25rem', fontWeight: '700' }}>{showCancelled ? t('debts.no_cancelled_debts') : t('debts.no_debts')}</p>
                </div>
            ) : (
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(280px, 1fr))' : '1fr', 
                    gap: '1.25rem' 
                }}>
                    {debts.map(debt => {
                        // El progreso se mide contra lo que hay que pagar de verdad. Contra el importe
                        // inicial, en cuanto los intereses lo superan, se quedaba clavado en cero para
                        // alguien que si estaba pagando todos los meses.
                        const paid = totalPaid(debt.payments);
                        const progress = debt.status === 'Cancelled' ? 100 : progressPercent(paid, debt.currentBalance);
                        const payoff = debt.status === 'Active'
                            ? projectPayoff(debt.currentBalance, debt.annualInterestRate, debt.monthlyInstallment, debt.paymentFrequency)
                            : null;

                        return (
                            <div 
                                key={debt.id} 
                                className="glass-card clickable"
                                onClick={() => navigate(`/customer/debts/edit/${debt.id}`)}
                                style={{ 
                                    padding: '1.5rem', 
                                    borderRadius: '1.25rem',
                                    position: 'relative',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    border: debt.status === 'Cancelled' ? '1px solid #27AE60' : '1px solid var(--glass-border)'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800' }}>{debt.creditor}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                                            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)' }}>{t('debts.installment')}:</span>
                                            <span style={{ fontSize: '0.9rem', fontWeight: '900' }}>{formatCurrency(debt.monthlyInstallment, debt.currency)}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Circular Progress */}
                                    <div style={{ position: 'relative', width: '56px', height: '56px' }}>
                                        <svg width="56" height="56" viewBox="0 0 56 56">
                                            <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="6" />
                                            <circle 
                                                cx="28" cy="28" r="24" fill="none" stroke={progress > 90 ? '#27AE60' : 'var(--primary)'} 
                                                strokeWidth="6" strokeDasharray={`${2 * Math.PI * 24}`} 
                                                strokeDashoffset={`${2 * Math.PI * 24 * (1 - progress / 100)}`}
                                                strokeLinecap="round"
                                                style={{ transition: 'stroke-dashoffset 1s ease-in-out', transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                                            />
                                            <text x="28" y="32" textAnchor="middle" style={{ fontSize: '0.75rem', fontWeight: '900', fill: 'var(--text-main)' }}>
                                                {Math.round(progress)} %
                                            </text>
                                        </svg>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '1.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                        <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>{t('debts.next_payment_date')}:</span>
                                        <span style={{ fontWeight: '700' }}>{new Date(debt.loanDate).toLocaleDateString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                        <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>{t('debts.current_balance')}:</span>
                                        <span style={{ fontWeight: '700' }}>{formatCurrency(debt.currentBalance, debt.currency)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                        <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>{t('debts.monthly_interest')}:</span>
                                        <span style={{ fontWeight: '700' }}>{(debt.annualInterestRate / 12).toFixed(1)} %</span>
                                    </div>
                                </div>

                                {debt.status === 'Active' && (
                                    <div style={{
                                        marginTop: '0.9rem',
                                        paddingTop: '0.75rem',
                                        borderTop: '1px solid var(--glass-border)',
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: '0.5rem',
                                        fontSize: '0.85rem',
                                        fontWeight: '700'
                                    }}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: payoff ? 'var(--text-muted)' : '#b91c1c' }}>
                                            {payoff
                                                ? <><Calendar size={15} />{t('debts.payoff_months', { months: payoff.months })}</>
                                                : <><AlertCircle size={15} />{t('debts.payoff_never')}</>}
                                        </span>

                                        {/* Reconocer la constancia es justo lo que este modulo no hacia. */}
                                        {debt.compliance?.isOverdue ? (
                                            <span style={{ color: '#b91c1c' }}>{t('debts.compliance_overdue')}</span>
                                        ) : debt.compliance?.onTimeStreak > 0 ? (
                                            <span style={{ color: '#15803d' }}>
                                                {t('debts.compliance_streak', { count: debt.compliance.onTimeStreak })}
                                            </span>
                                        ) : null}
                                    </div>
                                )}

                                <div style={{ position: 'absolute', right: '1rem', bottom: '1rem' }}>
                                    <ChevronRight size={20} color="var(--text-muted)" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default DebtList;
