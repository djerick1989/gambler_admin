import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Activity,
    CheckCircle2,
    CreditCard,
    HeartHandshake,
    Loader2,
    PiggyBank,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    Gift
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { subscriptionService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { getApiErrorMessage } from '../utils/subscription';

const benefitIcons = [ShieldAlert, Activity, HeartHandshake, CheckCircle2, PiggyBank];

/**
 * Datos de presentación de un plan.
 *
 * El ahorro y el equivalente mensual se calculan a partir del plan mensual en vez de escribirse a
 * mano: los textos fijos ya decían "Ahorra 5%" para el trimestral cuando el ahorro real es del 7%,
 * y cualquier cambio de precio los dejaría mintiendo.
 */
const planMeta = (plan, t, monthlyPrice) => {
    const days = Number(plan.durationDays || 0);
    const price = Number(plan.price || 0);

    // Los meses se redondean sobre la duración media de un mes (30.4375 días). Dividir entre 30
    // haría que un plan de 365 días valiera 12.17 meses y el equivalente mensual saldría más bajo
    // de lo que es: un año son 12 meses, no 12.17.
    const months = days > 0 ? Math.max(1, Math.round(days / 30.4375)) : 1;

    const perMonth = months >= 2 ? price / months : null;
    const savingPercent = monthlyPrice > 0 && months >= 2
        ? Math.round((1 - price / (monthlyPrice * months)) * 100)
        : 0;

    const base = {
        perMonth,
        savingPercent: savingPercent > 0 ? savingPercent : 0
    };

    if (days >= 365) return { ...base, label: t('subscriptions.plan_annual'), cadence: t('subscriptions.year'), featured: true };
    if (days >= 180) return { ...base, label: t('subscriptions.plan_semiannual'), cadence: t('subscriptions.semester') };
    if (days >= 90) return { ...base, label: t('subscriptions.plan_quarterly'), cadence: t('subscriptions.quarter') };
    return { ...base, label: t('subscriptions.plan_monthly'), cadence: t('subscriptions.month'), note: `${days || 30} ${t('subscriptions.days')}` };
};

const SubscriptionPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { user, subscription, isSubscribed, refreshSubscription } = useAuth();
    const { addToast } = useNotification();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlanId, setSelectedPlanId] = useState(null);
    const [buyingPlanId, setBuyingPlanId] = useState(null);
    const [processingStripeReturn, setProcessingStripeReturn] = useState(false);
    const handledStripeReturnRef = useRef(null);

    useEffect(() => {
        subscriptionService.getPlans()
            .then(response => {
                if (response?.status) {
                    const nextPlans = response.data || [];
                    setPlans(nextPlans);
                    const annual = nextPlans.find(plan => Number(plan.durationDays || 0) >= 365);
                    setSelectedPlanId((annual || nextPlans[0])?.subscriptionPlanId || null);
                }
            })
            .catch(() => addToast('error', t('subscriptions.plans_error')))
            .finally(() => setLoading(false));
    }, [addToast, t]);

    useEffect(() => {
        const stripeStatus = searchParams.get('stripe');
        if (!stripeStatus) return;

        const sessionId = searchParams.get('session_id') || '';
        const returnKey = `${stripeStatus}:${sessionId}`;
        if (handledStripeReturnRef.current === returnKey) return;
        handledStripeReturnRef.current = returnKey;

        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete('stripe');
        nextParams.delete('session_id');
        setSearchParams(nextParams, { replace: true });

        if (stripeStatus === 'success') {
            setProcessingStripeReturn(true);
            let cancelled = false;
            const confirmAndRedirect = async () => {
                if (sessionId && user?.userId) {
                    try {
                        await subscriptionService.confirmCheckoutSession({
                            userId: user.userId,
                            sessionId
                        });
                    } catch (error) {
                        console.error('Error confirming Stripe checkout session:', error);
                    }
                }

                try {
                    await refreshSubscription();
                } catch (error) {
                    console.error('Error refreshing subscription after checkout:', error);
                }

                if (!cancelled) {
                    window.sessionStorage.setItem('premiumWelcomePending', 'true');
                    navigate('/posts', { replace: true, state: { premiumWelcome: true } });
                }
            };

            confirmAndRedirect();
            return () => {
                cancelled = true;
            };
        }
        if (stripeStatus === 'cancel') {
            addToast('error', t('subscriptions.checkout_cancelled'));
        }
    }, [addToast, navigate, refreshSubscription, searchParams, setSearchParams, t, user?.userId]);

    useEffect(() => {
        if (isSubscribed && !searchParams.get('stripe') && !processingStripeReturn) {
            navigate('/profile', { replace: true, state: { section: 'subscription' } });
        }
    }, [isSubscribed, navigate, processingStripeReturn, searchParams]);

    // Precio del plan mensual: es la referencia contra la que se calcula el ahorro de los demás.
    const monthlyPrice = useMemo(() => {
        const mensual = plans.find(plan => Number(plan.durationDays || 0) < 90);
        return Number(mensual?.price || 0);
    }, [plans]);

    const selectedPlan = useMemo(
        () => plans.find(plan => plan.subscriptionPlanId === selectedPlanId),
        [plans, selectedPlanId]
    );

    const purchase = async (planId = selectedPlanId) => {
        if (!user?.userId || !planId) return;
        setBuyingPlanId(planId);
        try {
            const response = await subscriptionService.createCheckoutSession({
                userId: user.userId,
                planId,
                successUrl: `${window.location.origin}/posts?stripe=success&session_id={CHECKOUT_SESSION_ID}`,
                cancelUrl: `${window.location.origin}/subscriptions?stripe=cancel`
            });
            const checkoutUrl = response?.data?.url || response?.data?.checkoutUrl || response?.url || response?.checkoutUrl;
            if (response?.status && checkoutUrl) {
                window.location.assign(checkoutUrl);
            } else {
                addToast('error', response?.errorMessage || t('subscriptions.purchase_error'));
                setBuyingPlanId(null);
            }
        } catch (err) {
            addToast('error', getApiErrorMessage(err, t('subscriptions.purchase_error')));
            setBuyingPlanId(null);
        }
    };

    const benefits = [
        t('subscriptions.benefit_alerts'),
        t('subscriptions.benefit_balance'),
        t('subscriptions.benefit_mentors'),
        t('subscriptions.benefit_support'),
        t('subscriptions.benefit_finances')
    ];

    return (
        <div className="subscription-page">
            <style>{`
                .subscription-page {
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    gap: 1.3rem;
                    padding: 0 0 3rem;
                }
                /* El mismo lenguaje visual de las pantallas de entrada: la pared de pago no debería
                   parecer otra aplicación. */
                .subscription-page::before {
                    content: "";
                    position: absolute;
                    inset: -1.5rem -1.5rem auto;
                    height: 320px;
                    z-index: 0;
                    pointer-events: none;
                    border-radius: 1.5rem;
                    background:
                        radial-gradient(circle at 12% 12%, rgba(245, 158, 11, 0.16), transparent 42%),
                        radial-gradient(circle at 88% 8%, rgba(16, 185, 129, 0.12), transparent 40%);
                }
                .subscription-page > * {
                    position: relative;
                    z-index: 1;
                }
                .subscription-header {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) minmax(240px, auto);
                    align-items: start;
                    gap: 1.25rem 2rem;
                }
                .subscription-header-aside {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 0.7rem;
                }
                .subscription-eyebrow {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.45rem;
                    padding: 0.35rem 0.75rem;
                    margin-bottom: 0.55rem;
                    border: 1px solid rgba(212, 144, 0, 0.24);
                    border-radius: 999px;
                    background: rgba(255, 248, 230, 0.9);
                    color: #9a6700;
                    font-size: 0.78rem;
                    font-weight: 800;
                    letter-spacing: 0.02em;
                }
                .subscription-title {
                    margin: 0;
                    font-size: clamp(1.9rem, 3vw, 2.5rem) !important;
                    line-height: 1.08 !important;
                    letter-spacing: -0.03em !important;
                    font-weight: 900 !important;
                }
                .subscription-subtitle {
                    margin: 0.4rem 0 0;
                    /* La frase en español mide 443px a este tamaño y con 46ch (416px) se partía
                       justo en la última palabra. Sigue siendo max-width y no nowrap, para que en
                       pantallas angostas se acomode en lugar de desbordar. */
                    max-width: 54ch;
                    color: var(--text-muted);
                    font-size: 1.05rem;
                    line-height: 1.5;
                }
                .subscription-status {
                    padding: 0.55rem 0.95rem;
                    border-radius: 999px;
                    font-weight: 800;
                    font-size: 0.85rem;
                    white-space: nowrap;
                }
                .subscription-hero {
                    display: grid;
                    grid-template-columns: minmax(280px, 0.9fr) minmax(340px, 1.1fr);
                    gap: 1.5rem;
                    align-items: start;
                }
                .subscription-card {
                    background: var(--bg-white);
                    border: 1px solid var(--stroke);
                    border-radius: 1.1rem;
                    box-shadow: 0 18px 40px rgba(15, 23, 42, 0.07);
                }
                .subscription-benefits {
                    padding: 1.75rem 1.9rem 1.9rem;
                }
                .subscription-benefits h2 {
                    margin: 0;
                    font-size: 1.3rem !important;
                }
                .subscription-benefit {
                    display: grid;
                    grid-template-columns: 40px 1fr;
                    gap: 0.9rem;
                    align-items: center;
                    color: var(--text-main);
                    font-size: 1rem;
                    line-height: 1.4;
                    margin-top: 1.15rem;
                    font-weight: 600;
                }
                /* Cada beneficio con su ficha, como en las razones del registro: la lista plana de
                   iconos sueltos no daba jerarquía. */
                .subscription-benefit-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 0.75rem;
                    display: grid;
                    place-items: center;
                    background: rgba(212, 144, 0, 0.1);
                    color: var(--primary);
                }
                .subscription-plan-column {
                    display: flex;
                    flex-direction: column;
                    gap: 0.85rem;
                    margin-top: -1.9rem;
                }
                .subscription-plan-heading {
                    margin: 0;
                    font-size: 1.3rem !important;
                }
                .subscription-plans {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 0.9rem;
                }
                .subscription-plan {
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    gap: 0.3rem;
                    border: 1px solid var(--stroke);
                    border-radius: 1.1rem;
                    background: var(--bg-white);
                    padding: 1.25rem 1.3rem 1.3rem;
                    text-align: left;
                    cursor: pointer;
                    transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
                }
                .subscription-plan:hover {
                    transform: translateY(-2px);
                    border-color: rgba(212, 144, 0, 0.55);
                    box-shadow: 0 16px 30px rgba(212, 144, 0, 0.12);
                }
                .subscription-plan:focus-visible {
                    outline: 2px solid var(--primary);
                    outline-offset: 3px;
                }
                .subscription-plan.selected {
                    border-color: var(--primary);
                    box-shadow: 0 0 0 1px var(--primary), 0 20px 38px rgba(212, 144, 0, 0.18);
                    background: linear-gradient(180deg, rgba(255, 248, 230, 0.85) 0%, var(--bg-white) 55%);
                }
                .subscription-plan-name {
                    margin: 0;
                    font-size: 1.1rem !important;
                    font-weight: 800 !important;
                    color: var(--text-main);
                }
                .subscription-price {
                    display: flex;
                    align-items: baseline;
                    gap: 0.25rem;
                    margin: 0.15rem 0 0;
                    font-size: 2.15rem;
                    font-weight: 900;
                    line-height: 1;
                    color: #111827;
                    font-variant-numeric: tabular-nums;
                }
                .subscription-price small {
                    font-size: 0.9rem;
                    color: var(--text-muted);
                    font-weight: 700;
                }
                .subscription-permonth {
                    margin: 0.3rem 0 0;
                    color: var(--text-muted);
                    font-size: 0.85rem;
                    font-weight: 600;
                }
                /* El ahorro es el argumento de venta: pasa de texto gris a distintivo verde. */
                .subscription-saving {
                    align-self: flex-start;
                    margin-top: 0.55rem;
                    padding: 0.22rem 0.55rem;
                    border-radius: 999px;
                    background: rgba(16, 185, 129, 0.12);
                    color: #047857;
                    font-size: 0.78rem;
                    font-weight: 800;
                }
                .subscription-ribbon {
                    position: absolute;
                    top: -0.7rem;
                    right: 1rem;
                    padding: 0.25rem 0.6rem;
                    border-radius: 999px;
                    background: linear-gradient(135deg, #b87300 0%, #e29a00 48%, #f5b400 100%);
                    color: #fff;
                    font-size: 0.7rem;
                    font-weight: 900;
                    letter-spacing: 0.04em;
                    text-transform: uppercase;
                    box-shadow: 0 8px 18px rgba(212, 144, 0, 0.3);
                }
                .subscription-selected {
                    position: absolute;
                    right: 0.9rem;
                    bottom: 0.9rem;
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    background: var(--primary);
                    color: white;
                    display: grid;
                    place-items: center;
                }
                .subscription-trial {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    border: 1px solid rgba(16, 185, 129, 0.35);
                    border-radius: 1.1rem;
                    background: rgba(16, 185, 129, 0.08);
                    padding: 0.95rem 1.15rem;
                    color: #065f46;
                    font-size: 1rem;
                    font-weight: 800;
                    line-height: 1.35;
                }
                .subscription-trial svg {
                    flex-shrink: 0;
                }
                /* En la cabecera es una tarjeta, no una franja a todo el ancho. El texto va en una
                   sola linea: partido en dos se leia como un parrafo y perdia fuerza. */
                .subscription-header-aside .subscription-trial {
                    font-size: 0.9rem;
                    line-height: 1.25;
                    text-align: left;
                    padding: 0.8rem 1.1rem;
                }
                .subscription-actions {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.85rem;
                }
                .subscription-cta {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.6rem;
                    min-width: 300px;
                    min-height: 3.6rem;
                    padding: 1rem 2.25rem;
                    border: none;
                    border-radius: 1rem;
                    color: #fff;
                    font-size: 1.05rem;
                    font-weight: 900;
                    cursor: pointer;
                    background: linear-gradient(135deg, #b87300 0%, #e29a00 48%, #f5b400 100%);
                    box-shadow: 0 20px 42px rgba(212, 144, 0, 0.34);
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                .subscription-cta:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 24px 48px rgba(212, 144, 0, 0.4);
                }
                .subscription-cta:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    box-shadow: none;
                }
                .subscription-reassurance {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                    gap: 0.4rem 1.15rem;
                    margin: 0;
                    color: var(--text-muted);
                    font-size: 0.85rem;
                    font-weight: 600;
                }
                .subscription-reassurance span {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.35rem;
                }
                @media (max-width: 900px) {
                    .subscription-hero {
                        grid-template-columns: 1fr;
                    }
                    .subscription-header {
                        grid-template-columns: 1fr;
                    }
                    .subscription-header-aside {
                        align-items: stretch;
                    }
                    .subscription-plan-column {
                        margin-top: 0;
                    }
                }
                /* La frase completa necesita unos 480px: solo se fuerza a una linea cuando el
                   ancho lo permite, si no desbordaria la cabecera. */
                @media (min-width: 1100px) {
                    .subscription-header-aside .subscription-trial {
                        white-space: nowrap;
                    }
                }
                @media (max-width: 640px) {
                    .subscription-plans {
                        grid-template-columns: 1fr;
                    }
                    .subscription-cta {
                        width: 100%;
                        min-width: 0;
                    }
                }
`}</style>

            <header className="subscription-header">
                <div>
                    <span className="subscription-eyebrow">
                        <Sparkles size={14} />
                        {t('subscriptions.eyebrow')}
                    </span>
                    <h1 className="subscription-title">{t('subscriptions.title')}</h1>
                    <p className="subscription-subtitle">{t('subscriptions.subtitle')}</p>
                </div>
                {/* La franja de prueba gratuita vivía debajo de los planes, dejando este costado
                    vacío. Arriba llena el hueco y además es lo primero que se lee. */}
                <div className="subscription-header-aside">
                    {/* El estado solo dice algo cuando hay un plan: "Gratis" es la ausencia de
                        plan, no un plan, y en esta pantalla además compite con la oferta. */}
                    {isSubscribed && (
                        <span className="subscription-status" style={{
                            background: 'rgba(16, 185, 129, 0.12)',
                            color: '#047857'
                        }}>
                            {t('subscriptions.premium')}
                        </span>
                    )}

                    <div className="subscription-trial">
                        <Gift size={22} />
                        <span>{t('subscriptions.first_bonus')}</span>
                    </div>
                </div>
            </header>

            {subscription?.expiryDate && (
                <p style={{ color: 'var(--text-muted)', margin: '-0.9rem 0 0' }}>
                    {t('subscriptions.expires')}: {new Date(subscription.expiryDate).toLocaleDateString()}
                </p>
            )}

            <section className="subscription-hero">
                <article className="subscription-card subscription-benefits">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <ShieldCheck size={24} color="var(--primary)" />
                        <h2>{t('subscriptions.benefits_title')}</h2>
                    </div>
                    {benefits.map((benefit, index) => {
                        const Icon = benefitIcons[index] || CheckCircle2;
                        return (
                            <div className="subscription-benefit" key={benefit}>
                                <span className="subscription-benefit-icon">
                                    <Icon size={20} strokeWidth={2.2} />
                                </span>
                                <span>{benefit}</span>
                            </div>
                        );
                    })}
                </article>

                <div className="subscription-plan-column">
                    <h2 className="subscription-plan-heading">{t('subscriptions.select_plan')}</h2>

                    {loading ? (
                        <div className="subscription-card" style={{ display: 'grid', placeItems: 'center', minHeight: 280 }}>
                            <Loader2 size={42} className="animate-spin" color="var(--primary)" />
                        </div>
                    ) : (
                        <div className="subscription-plans">
                            {plans.map(plan => {
                                const meta = planMeta(plan, t, monthlyPrice);
                                const selected = selectedPlanId === plan.subscriptionPlanId;
                                return (
                                    <button
                                        type="button"
                                        key={plan.subscriptionPlanId}
                                        className={`subscription-plan ${selected ? 'selected' : ''}`}
                                        aria-pressed={selected}
                                        onClick={() => setSelectedPlanId(plan.subscriptionPlanId)}
                                    >
                                        {meta.featured && (
                                            <span className="subscription-ribbon">{t('subscriptions.recommended')}</span>
                                        )}
                                        <h3 className="subscription-plan-name">{meta.label || plan.name}</h3>
                                        <p className="subscription-price">
                                            ${plan.price}<small>/{meta.cadence}</small>
                                        </p>
                                        {meta.perMonth ? (
                                            <p className="subscription-permonth">
                                                {t('subscriptions.per_month_equivalent', {
                                                    price: Number.isInteger(meta.perMonth)
                                                        ? meta.perMonth
                                                        : meta.perMonth.toFixed(2)
                                                })}
                                            </p>
                                        ) : (
                                            <p className="subscription-permonth">{meta.note}</p>
                                        )}
                                        {meta.savingPercent > 0 && (
                                            <span className="subscription-saving">
                                                {t('subscriptions.save_percent', { percent: meta.savingPercent })}
                                            </span>
                                        )}
                                        {selected && (
                                            <span className="subscription-selected">
                                                <CheckCircle2 size={20} />
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                </div>
            </section>

            <div className="subscription-actions">
                <button
                    type="button"
                    className="subscription-cta"
                    disabled={!selectedPlanId || Boolean(buyingPlanId)}
                    onClick={() => purchase()}
                >
                    {buyingPlanId === selectedPlanId ? <Loader2 size={20} className="animate-spin" /> : <CreditCard size={20} />}
                    {selectedPlan
                        ? t('subscriptions.subscribe_for', { price: selectedPlan.price })
                        : t('subscriptions.subscribe')}
                </button>

                <p className="subscription-reassurance">
                    <span><ShieldCheck size={14} /> {t('subscriptions.secure_payment')}</span>
                    <span><CheckCircle2 size={14} /> {t('subscriptions.cancel_anytime')}</span>
                </p>
            </div>
        </div>
    );
};

export default SubscriptionPage;
