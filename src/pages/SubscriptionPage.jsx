import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Activity,
    CheckCircle2,
    CreditCard,
    HeartHandshake,
    Loader2,
    PiggyBank,
    ShieldAlert,
    ShieldCheck
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { subscriptionService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { getApiErrorMessage } from '../utils/subscription';

const benefitIcons = [ShieldAlert, Activity, HeartHandshake, CheckCircle2, PiggyBank];

const planMeta = (plan, t) => {
    const days = Number(plan.durationDays || 0);
    if (days >= 365) return { label: t('subscriptions.plan_annual'), cadence: t('subscriptions.year'), saving: t('subscriptions.save_20'), featured: true };
    if (days >= 180) return { label: t('subscriptions.plan_semiannual'), cadence: t('subscriptions.semester'), saving: t('subscriptions.save_10') };
    if (days >= 90) return { label: t('subscriptions.plan_quarterly'), cadence: t('subscriptions.quarter'), saving: t('subscriptions.save_5') };
    return { label: t('subscriptions.plan_monthly'), cadence: t('subscriptions.month'), saving: `${days || 30} ${t('subscriptions.days')}` };
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
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                    padding-bottom: 3rem;
                }
                .subscription-hero {
                    display: grid;
                    grid-template-columns: minmax(280px, 0.95fr) minmax(320px, 1.05fr);
                    gap: 1.5rem;
                    align-items: stretch;
                    margin-top: 0.15rem;
                }
                .subscription-card {
                    background: var(--bg-white);
                    border: 1px solid var(--stroke);
                    border-radius: 8px;
                    box-shadow: 0 14px 32px rgba(15, 23, 42, 0.06);
                }
                .subscription-benefits {
                    padding: 1.75rem 2rem 1.9rem;
                    height: 100%;
                }
                .subscription-plan-column {
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    min-height: 100%;
                    padding-top: 0;
                }
                .subscription-plan-heading {
                    position: absolute;
                    top: -2.45rem;
                    left: 0;
                    margin: 0;
                    font-size: 1.45rem;
                    line-height: 1.15;
                }
                .subscription-benefit {
                    display: grid;
                    grid-template-columns: 32px 1fr;
                    gap: 1rem;
                    align-items: center;
                    color: var(--text-main);
                    font-size: 1.05rem;
                    line-height: 1.45;
                    margin-top: 1.15rem;
                }
                .subscription-benefit svg {
                    color: var(--primary);
                }
                .subscription-plans {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 1rem;
                    flex: 1;
                }
                .subscription-plan {
                    border: 1px solid var(--stroke);
                    border-radius: 8px;
                    background: #fff;
                    padding: 1.35rem 1.5rem;
                    min-height: 156px;
                    text-align: left;
                    cursor: pointer;
                    position: relative;
                    transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
                }
                .subscription-plan:hover {
                    transform: translateY(-2px);
                    border-color: rgba(212, 144, 0, 0.5);
                }
                .subscription-plan.selected {
                    border: 2px solid var(--primary);
                    box-shadow: 0 16px 32px rgba(212, 144, 0, 0.14);
                }
                .subscription-price {
                    font-size: 2rem;
                    font-weight: 900;
                    color: #111827;
                    margin: 0 0 0.9rem;
                }
                .subscription-price small {
                    font-size: 1rem;
                    color: var(--text-muted);
                    font-weight: 700;
                }
                .subscription-plan h2 {
                    font-size: 1.35rem;
                    margin: 0 0 0.35rem;
                }
                .subscription-plan p {
                    margin: 0;
                    color: var(--text-muted);
                    font-size: 1rem;
                }
                .subscription-selected {
                    position: absolute;
                    right: 1rem;
                    bottom: 1rem;
                    width: 38px;
                    height: 38px;
                    border-radius: 50%;
                    background: var(--primary);
                    color: white;
                    display: grid;
                    place-items: center;
                }
                .subscription-trial {
                    border: 1px solid var(--stroke);
                    border-radius: 8px;
                    background: #fff;
                    padding: 0.95rem 1.35rem;
                    font-size: 1.2rem;
                    font-weight: 800;
                    color: #111827;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                }
                .subscription-actions {
                    margin-top: -0.45rem;
                }
                @media (max-width: 900px) {
                    .subscription-hero {
                        grid-template-columns: 1fr;
                    }
                    .subscription-plan-column {
                        padding-top: 0;
                    }
                    .subscription-plan-heading {
                        position: static;
                        margin-bottom: 1rem;
                    }
                }
                @media (max-width: 640px) {
                    .subscription-page {
                        gap: 1.35rem;
                    }
                    .subscription-benefits {
                        padding: 1.5rem;
                    }
                    .subscription-plans {
                        grid-template-columns: 1fr;
                    }
                    .subscription-plan {
                        min-height: 150px;
                    }
                    .subscription-actions {
                        margin-top: 0;
                    }
                }
            `}</style>

            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                    <h1 style={{ margin: 0 }}>{t('subscriptions.title')}</h1>
                    <p style={{ margin: '0.45rem 0 0', color: 'var(--text-muted)', fontSize: '1.05rem' }}>
                        {t('subscriptions.subtitle')}
                    </p>
                </div>
                <span style={{
                    padding: '0.65rem 1rem',
                    borderRadius: 8,
                    background: isSubscribed ? 'rgba(16, 185, 129, 0.12)' : 'rgba(212, 144, 0, 0.12)',
                    color: isSubscribed ? '#047857' : 'var(--primary)',
                    fontWeight: 800
                }}>
                    {isSubscribed ? t('subscriptions.premium') : t('subscriptions.free')}
                </span>
            </header>

            {subscription?.expiryDate && (
                <p style={{ color: 'var(--text-muted)', margin: '-1rem 0 0' }}>
                    {t('subscriptions.expires')}: {new Date(subscription.expiryDate).toLocaleDateString()}
                </p>
            )}

            <section className="subscription-hero">
                <article className="subscription-card subscription-benefits">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                        <ShieldCheck size={30} color="var(--primary)" />
                        <h2 style={{ margin: 0, fontSize: '1.6rem' }}>{t('subscriptions.benefits_title')}</h2>
                    </div>
                    {benefits.map((benefit, index) => {
                        const Icon = benefitIcons[index] || CheckCircle2;
                        return (
                            <div className="subscription-benefit" key={benefit}>
                                <Icon size={24} strokeWidth={2.1} />
                                <span>{benefit}</span>
                            </div>
                        );
                    })}
                </article>

                <div className="subscription-plan-column">
                    <div>
                        <h2 className="subscription-plan-heading">{t('subscriptions.select_plan')}</h2>
                        {loading ? (
                            <div className="subscription-card" style={{ display: 'grid', placeItems: 'center', minHeight: 280 }}>
                                <Loader2 size={42} className="animate-spin" color="var(--primary)" />
                            </div>
                        ) : (
                            <div className="subscription-plans">
                                {plans.map(plan => {
                                    const meta = planMeta(plan, t);
                                    const selected = selectedPlanId === plan.subscriptionPlanId;
                                    return (
                                        <button
                                            type="button"
                                            key={plan.subscriptionPlanId}
                                            className={`subscription-plan ${selected ? 'selected' : ''}`}
                                            onClick={() => setSelectedPlanId(plan.subscriptionPlanId)}
                                        >
                                            <p className="subscription-price">
                                                ${plan.price}<small> /{meta.cadence}</small>
                                            </p>
                                            <h2>{meta.label || plan.name}</h2>
                                            <p>{meta.saving}</p>
                                            {selected && (
                                                <span className="subscription-selected">
                                                    <CheckCircle2 size={24} />
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="subscription-trial">
                        {t('subscriptions.free_trial')}
                    </div>
                </div>
            </section>

            <div className="subscription-actions" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <button
                    type="button"
                    className="btn btn-primary"
                    disabled={!selectedPlanId || Boolean(buyingPlanId)}
                    onClick={() => purchase()}
                    style={{
                        minWidth: 260,
                        padding: '1rem 2rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.55rem',
                        fontSize: '1rem',
                        fontWeight: 900
                    }}
                >
                    {buyingPlanId === selectedPlanId ? <Loader2 size={20} className="animate-spin" /> : <CreditCard size={20} />}
                    {selectedPlan ? `${t('subscriptions.subscribe')} - $${selectedPlan.price}` : t('subscriptions.subscribe')}
                </button>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontWeight: 600 }}>
                    {t('subscriptions.cancel_anytime')}
                </p>
            </div>
        </div>
    );
};

export default SubscriptionPage;
