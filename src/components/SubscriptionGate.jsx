import React, { useEffect, useState } from 'react';
import { CreditCard, Loader2, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import { subscriptionService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const SubscriptionGate = ({ isOpen, onClose, message }) => {
    const { t } = useTranslation();
    const { user, refreshSubscription } = useAuth();
    const { addToast } = useNotification();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [buyingPlanId, setBuyingPlanId] = useState(null);

    useEffect(() => {
        if (!isOpen) return;
        setLoading(true);
        subscriptionService.getPlans()
            .then(response => {
                if (response?.status) setPlans(response.data || []);
            })
            .catch(() => setPlans([]))
            .finally(() => setLoading(false));
    }, [isOpen]);

    const purchase = async (planId) => {
        if (!user?.userId || buyingPlanId) return;
        setBuyingPlanId(planId);
        try {
            const response = await subscriptionService.purchasePlan({ userId: user.userId, planId });
            if (response?.status) {
                await refreshSubscription();
                addToast('success', t('subscriptions.purchase_success'));
                onClose?.();
            } else {
                addToast('error', response?.errorMessage || t('subscriptions.purchase_error'));
            }
        } catch (err) {
            addToast('error', t('subscriptions.purchase_error'));
        } finally {
            setBuyingPlanId(null);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('subscriptions.required_title')} maxWidth="720px">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: 8,
                        background: 'rgba(212, 144, 0, 0.12)',
                        color: 'var(--primary)',
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0
                    }}>
                        <Lock size={24} />
                    </div>
                    <div>
                        <h3 style={{ margin: '0 0 0.4rem', fontSize: '1.15rem', fontWeight: 800 }}>
                            {t('subscriptions.upgrade_title')}
                        </h3>
                        <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.55 }}>
                            {message || t('subscriptions.required_message')}
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div style={{ display: 'grid', placeItems: 'center', minHeight: 140 }}>
                        <Loader2 className="animate-spin" size={32} color="var(--primary)" />
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                        {plans.map(plan => (
                            <button
                                type="button"
                                key={plan.subscriptionPlanId}
                                onClick={() => purchase(plan.subscriptionPlanId)}
                                disabled={Boolean(buyingPlanId)}
                                style={{
                                    textAlign: 'left',
                                    padding: '1.1rem',
                                    border: '1px solid var(--stroke)',
                                    borderRadius: 8,
                                    background: 'var(--bg-light)',
                                    color: 'var(--text-main)',
                                    cursor: 'pointer'
                                }}
                            >
                                <strong style={{ display: 'block', fontSize: '1rem', marginBottom: '0.35rem' }}>{plan.name}</strong>
                                <span style={{ display: 'block', color: 'var(--primary)', fontWeight: 900, fontSize: '1.35rem' }}>${plan.price}</span>
                                <small style={{ color: 'var(--text-muted)' }}>{plan.durationDays} {t('subscriptions.days')}</small>
                                <span style={{ marginTop: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800 }}>
                                    {buyingPlanId === plan.subscriptionPlanId ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                                    {t('subscriptions.subscribe')}
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default SubscriptionGate;
