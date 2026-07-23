import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import {
    Loader2, User as UserIcon, Phone, Globe, Mail,
    Save, Shield, Bell, MessageSquare, Heart,
    Activity, Calendar, Info, MapPin, Languages, Edit2,
    Eye, Trash2, CreditCard, Crown, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { gamblerService, mediaService, dataDeletionService, subscriptionService } from '../services/api';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { countries } from '../utils/countries';
import { getLanguageId } from '../utils/languages';
import PremiumAvatarBadge from '../components/PremiumAvatarBadge';

const Profile = () => {
    const { t, i18n } = useTranslation();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const { user, fetchUser, subscription, isSubscribed, refreshSubscription } = useAuth();
    const handledStripeReturnRef = useRef(null);

    const [gambler, setGambler] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [cancelingSubscription, setCancelingSubscription] = useState(false);
    const [reactivatingSubscription, setReactivatingSubscription] = useState(false);
    const [subscriptionPlans, setSubscriptionPlans] = useState([]);
    const [loadingSubscriptionPlans, setLoadingSubscriptionPlans] = useState(false);
    const [changingPlanId, setChangingPlanId] = useState(null);
    const [activeSection, setActiveSection] = useState(location.state?.section || 'profile'); // profile, config, notifications, subscription
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (user?.userId) {
            fetchData();
            refreshSubscription(user.userId);
        }
    }, [user?.userId]);

    useEffect(() => {
        if (location.state?.section) {
            setActiveSection(location.state.section);
        }
    }, [location.state?.section]);

    useEffect(() => {
        if (!user?.userId || !isSubscribed) return;

        setLoadingSubscriptionPlans(true);
        subscriptionService.getPlans()
            .then(response => {
                if (response?.status) {
                    setSubscriptionPlans(response.data || []);
                }
            })
            .catch(error => console.error("Error fetching subscription plans:", error))
            .finally(() => setLoadingSubscriptionPlans(false));
    }, [isSubscribed, user?.userId]);

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

        if (stripeStatus === 'plan-change-success') {
            let cancelled = false;
            const confirmPlanChange = async () => {
                setActiveSection('subscription');
                if (sessionId && user?.userId) {
                    try {
                        await subscriptionService.confirmCheckoutSession({
                            userId: user.userId,
                            sessionId
                        });
                    } catch (error) {
                        console.error("Error confirming plan change checkout session:", error);
                    }
                }

                await refreshSubscription(user.userId);
                if (!cancelled) {
                    alert(t('subscriptions.plan_change_success'));
                }
            };

            confirmPlanChange();
            return () => {
                cancelled = true;
            };
        }

        if (stripeStatus === 'plan-change-cancel') {
            setActiveSection('subscription');
            alert(t('subscriptions.checkout_cancelled'));
        }
    }, [refreshSubscription, searchParams, setSearchParams, t, user?.userId]);

    const formatDate = (value) => {
        if (!value) return t('subscriptions.not_available');
        return new Date(value).toLocaleDateString();
    };

    const getPlanLabel = (sub = subscription) => {
        const planType = Number(sub?.planType);
        if (Number.isFinite(planType)) {
            const labels = [
                t('subscriptions.plan_monthly'),
                t('subscriptions.plan_quarterly'),
                t('subscriptions.plan_semiannual'),
                t('subscriptions.plan_annual')
            ];
            return labels[planType] || sub?.planName || t('subscriptions.premium');
        }

        return sub?.planName || t('subscriptions.premium');
    };

    const getCurrentPlanFromPlans = () => {
        if (!subscriptionPlans.length) return null;
        if (subscription?.planId) {
            const byId = subscriptionPlans.find(plan => plan.subscriptionPlanId === subscription.planId);
            if (byId) return byId;
        }

        const planType = Number(subscription?.planType);
        if (Number.isFinite(planType)) {
            return subscriptionPlans.find(plan => Number(plan.type) === planType) || null;
        }

        const durationDays = Number(subscription?.durationDays);
        if (Number.isFinite(durationDays) && durationDays > 0) {
            return subscriptionPlans.find(plan => Number(plan.durationDays) === durationDays) || null;
        }

        return null;
    };

    const getPlanPrice = () => {
        if (subscription?.planPrice !== null && subscription?.planPrice !== undefined) {
            return `$${subscription.planPrice}`;
        }

        const currentPlan = getCurrentPlanFromPlans();
        return currentPlan ? `$${currentPlan.price}` : null;
    };

    const hasRecurringStripeSubscription = Boolean(subscription?.stripeSubscriptionId);
    const isRenewalCancellationScheduled = hasRecurringStripeSubscription && Boolean(subscription?.cancelAtPeriodEnd);

    const getPlanLabelFromPlan = (plan) => {
        const planType = Number(plan?.type);
        const labels = [
            t('subscriptions.plan_monthly'),
            t('subscriptions.plan_quarterly'),
            t('subscriptions.plan_semiannual'),
            t('subscriptions.plan_annual')
        ];

        return labels[planType] || plan?.name || t('subscriptions.premium');
    };

    const estimateExpiryAfterPlanChange = (plan) => {
        const baseDate = subscription?.expiryDate || subscription?.currentPeriodEnd;
        const startDate = baseDate && new Date(baseDate).getTime() > Date.now()
            ? new Date(baseDate)
            : new Date();
        const nextDate = new Date(startDate);
        nextDate.setDate(nextDate.getDate() + Number(plan?.durationDays || 0));
        return nextDate.toLocaleDateString();
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const gamblerRes = await gamblerService.getGamblerByUserId(user.userId);

            if (gamblerRes.status) {
                setGambler(gamblerRes.data);
            }
        } catch (err) {
            console.error("Error fetching profile data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploadingAvatar(true);
        try {
            const response = await mediaService.upload(file);
            if (response.status && response.data?.url) {
                setGambler(prev => ({
                    ...prev,
                    user: {
                        ...prev.user,
                        avatar: response.data.url
                    }
                }));
            }
        } catch (err) {
            console.error("Error uploading avatar:", err);
            alert("Error uploading avatar");
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const validatePhone = (phone) => {
        if (!phone) return true;
        const phoneRegex = /^\+?[\d\s-]{7,15}$/;
        return phoneRegex.test(phone);
    };

    const handleChangeGlobalLanguage = async (language) => {
        if (!gambler?.gamblerId) return;

        const previousLanguage = i18n.language;
        const previousGambler = gambler;
        const languageId = getLanguageId(language);
        const updatedGambler = { ...gambler, languageId };

        i18n.changeLanguage(language);
        setGambler(updatedGambler);
        setSaving(true);

        try {
            const response = await gamblerService.updateGamblerConfiguration({
                gamblerId: updatedGambler.gamblerId,
                profileVisibility: updatedGambler.profileVisibility,
                receiveMessages: updatedGambler.receiveMessages,
                receiveDonations: updatedGambler.receiveDonations,
                languageId: updatedGambler.languageId
            });

            if (response.status) {
                await fetchUser();
            } else {
                throw new Error(response.errorMessage || "Error updating language");
            }
        } catch (err) {
            console.error("Error updating language:", err);
            setGambler(previousGambler);
            i18n.changeLanguage(previousLanguage);
            alert("Error updating language");
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();

        if (!validatePhone(gambler.phone)) {
            setErrors(prev => ({ ...prev, phone: "Please enter a valid phone number" }));
            return;
        }

        setSaving(true);
        try {
            const updateData = {
                gamblerId: gambler.gamblerId,
                avatar: gambler.user?.avatar,
                phone: gambler.phone,
                phoneVerified: gambler.phoneVerified,
                languageId: gambler.languageId,
                country: gambler.country,
                active: gambler.active,
                betting: gambler.betting,
                description: gambler.description,
                biography: gambler.biography,
                lastDateBetting: gambler.lastDateBetting
            };
            const response = await gamblerService.updateGambler(updateData);
            if (response.status) {
                await fetchUser();
                alert(t('profile.success_update'));
            }
        } catch (err) {
            console.error("Error updating profile:", err);
            alert("Error updating profile");
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateConfig = async () => {
        setSaving(true);
        try {
            const configData = {
                gamblerId: gambler.gamblerId,
                profileVisibility: gambler.profileVisibility,
                receiveMessages: gambler.receiveMessages,
                receiveDonations: gambler.receiveDonations,
                languageId: gambler.languageId
            };
            const response = await gamblerService.updateGamblerConfiguration(configData);
            if (response.status) {
                await fetchUser();
                alert(t('profile.success_update'));
            }
        } catch (err) {
            console.error("Error updating configuration:", err);
            alert("Error updating configuration");
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateNotifications = async () => {
        setSaving(true);
        try {
            const notifData = {
                gamblerId: gambler.gamblerId,
                receivePushNotifications: gambler.receivePushNotifications,
                receiveEmailNotifications: gambler.receiveEmailNotifications
            };
            const response = await gamblerService.updateNotificationConfiguration(notifData);
            if (response.status) {
                await fetchUser();
                alert(t('profile.success_update'));
            }
        } catch (err) {
            console.error("Error updating notifications:", err);
            alert("Error updating notifications");
        } finally {
            setSaving(false);
        }
    };

    const handleRequestDataDeletion = async () => {
        if (!window.confirm(t('profile.confirm_data_deletion') || "Are you sure you want to request your data deletion? This action cannot be undone.")) {
            return;
        }

        setSaving(true);
        try {
            const response = await dataDeletionService.request(user.userId);
            if (response.status) {
                alert(t('profile.data_deletion_requested') || "Data deletion request submitted successfully.");
            } else {
                alert(response.errorMessage || "Error requesting data deletion");
            }
        } catch (err) {
            console.error("Error requesting data deletion:", err);
            alert("Error requesting data deletion");
        } finally {
            setSaving(false);
        }
    };

    const handleCancelSubscription = async () => {
        if (!user?.userId || cancelingSubscription) return;
        if (!window.confirm(t('subscriptions.cancel_confirm'))) return;

        setCancelingSubscription(true);
        try {
            const response = await subscriptionService.cancelSubscription({ userId: user.userId });
            if (response.status) {
                await refreshSubscription(user.userId);
                alert(t('subscriptions.cancel_scheduled_success'));
            } else {
                alert(response.errorMessage || t('subscriptions.cancel_error'));
            }
        } catch (err) {
            console.error("Error cancelling subscription:", err);
            alert(t('subscriptions.cancel_error'));
        } finally {
            setCancelingSubscription(false);
        }
    };

    const handleReactivateSubscription = async () => {
        if (!user?.userId || reactivatingSubscription) return;

        setReactivatingSubscription(true);
        try {
            const response = await subscriptionService.reactivateSubscription({ userId: user.userId });
            if (response.status) {
                await refreshSubscription(user.userId);
                alert(t('subscriptions.reactivate_success'));
            } else {
                alert(response.errorMessage || t('subscriptions.reactivate_error'));
            }
        } catch (err) {
            console.error("Error reactivating subscription:", err);
            alert(t('subscriptions.reactivate_error'));
        } finally {
            setReactivatingSubscription(false);
        }
    };

    const handleChangeSubscriptionPlan = async (plan) => {
        if (!user?.userId || !plan?.subscriptionPlanId || changingPlanId) return;
        if (subscription?.planId === plan.subscriptionPlanId) return;

        const confirmed = window.confirm(t('subscriptions.plan_change_confirm', {
            plan: getPlanLabelFromPlan(plan),
            price: plan.price,
            expiry: estimateExpiryAfterPlanChange(plan)
        }));

        if (!confirmed) return;

        setChangingPlanId(plan.subscriptionPlanId);
        try {
            const response = await subscriptionService.createPlanChangeCheckoutSession({
                userId: user.userId,
                planId: plan.subscriptionPlanId,
                successUrl: `${window.location.origin}/profile?stripe=plan-change-success&session_id={CHECKOUT_SESSION_ID}`,
                cancelUrl: `${window.location.origin}/profile?stripe=plan-change-cancel`
            });

            const checkoutUrl = response?.data?.url || response?.data?.checkoutUrl || response?.url || response?.checkoutUrl;
            if (response?.status && checkoutUrl) {
                window.location.assign(checkoutUrl);
            } else {
                alert(response?.errorMessage || t('subscriptions.plan_change_error'));
                setChangingPlanId(null);
            }
        } catch (err) {
            console.error("Error changing subscription plan:", err);
            alert(t('subscriptions.plan_change_error'));
            setChangingPlanId(null);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <Loader2 size={48} className="animate-spin" color="var(--primary)" />
            </div>
        );
    }

    if (!gambler) return <div style={{ color: 'var(--text-main)' }}>Profile not found</div>;

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: '800', marginBottom: '0.5rem' }}>{t('profile.title')}</h1>
                <p style={{ color: 'var(--text-muted)' }}>{t('profile.subtitle')}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
                {/* Sidebar Navigation */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div className="glass-card" style={{ padding: '0.5rem' }}>
                        <button
                            onClick={() => setActiveSection('profile')}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                border: 'none',
                                borderRadius: '0.5rem',
                                background: activeSection === 'profile' ? 'var(--primary)' : 'transparent',
                                color: activeSection === 'profile' ? 'white' : 'var(--text-main)',
                                textAlign: 'left',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <UserIcon size={20} />
                            {t('gambler_mgmt.detail.profile_info')}
                        </button>
                        <button
                            onClick={() => setActiveSection('config')}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                border: 'none',
                                borderRadius: '0.5rem',
                                background: activeSection === 'config' ? 'var(--primary)' : 'transparent',
                                color: activeSection === 'config' ? 'white' : 'var(--text-main)',
                                textAlign: 'left',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Shield size={20} />
                            {t('gambler_mgmt.detail.configurations')}
                        </button>
                        <button
                            onClick={() => setActiveSection('notifications')}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                border: 'none',
                                borderRadius: '0.5rem',
                                background: activeSection === 'notifications' ? 'var(--primary)' : 'transparent',
                                color: activeSection === 'notifications' ? 'white' : 'var(--text-main)',
                                textAlign: 'left',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Bell size={20} />
                            {t('gambler_mgmt.detail.notifications')}
                        </button>
                        {isSubscribed && user?.role === 0 && (
                            <button
                                onClick={() => setActiveSection('subscription')}
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    background: activeSection === 'subscription' ? 'var(--primary)' : 'transparent',
                                    color: activeSection === 'subscription' ? 'white' : 'var(--text-main)',
                                    textAlign: 'left',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <CreditCard size={20} />
                                {t('subscriptions.title')}
                            </button>
                        )}
                    </div>

                    {/* Stats Card */}
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <h4 style={{ marginBottom: '1.5rem', fontWeight: 'bold' }}>Quick Stats</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Balance</span>
                                <span style={{ fontWeight: 'bold', color: '#10b981' }}>${gambler.balance.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Status</span>
                                <span style={{ fontWeight: 'bold', color: gambler.active ? '#10b981' : '#ef4444' }}>
                                    {gambler.active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Section */}
                <div className="glass-card" style={{ padding: '2rem' }}>
                    {activeSection === 'profile' && (
                        <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', paddingBottom: '2rem', borderBottom: '1px solid var(--stroke)' }}>
                                <div
                                    onClick={() => document.getElementById('avatar-upload').click()}
                                    style={{
                                        width: '80px',
                                        height: '80px',
                                        borderRadius: '50%',
                                        background: gambler.user?.avatar ? `url(${gambler.user.avatar}) center/cover` : '#f1f5f9',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        border: '2px solid var(--stroke)'
                                    }}>
                                    {isUploadingAvatar ? (
                                        <Loader2 className="animate-spin" />
                                    ) : !gambler.user?.avatar && (
                                        <UserIcon size={40} />
                                    )}
                                    {isSubscribed && <PremiumAvatarBadge size={24} top={-9} left={-7} />}
                                    <div style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        right: 0,
                                        background: 'var(--primary)',
                                        borderRadius: '50%',
                                        padding: '0.35rem',
                                        border: '2px solid #FFFFFF',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <Edit2 size={12} color="white" />
                                    </div>
                                    <input
                                        type="file"
                                        id="avatar-upload"
                                        style={{ display: 'none' }}
                                        accept="image/*"
                                        onChange={handleAvatarChange}
                                    />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{gambler.user?.nickName || 'My Profile'}</h3>
                                    <p style={{ color: 'var(--text-muted)' }}>{gambler.user?.email}</p>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div className="input-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Phone size={16} /> {t('gambler_mgmt.detail.phone')}</label>
                                    <input
                                        type="text"
                                        value={gambler.phone || ''}
                                        onChange={(e) => {
                                            setGambler({ ...gambler, phone: e.target.value });
                                            if (errors.phone) {
                                                setErrors(prev => {
                                                    const newErrors = { ...prev };
                                                    delete newErrors.phone;
                                                    return newErrors;
                                                });
                                            }
                                        }}
                                        placeholder="+1234567890"
                                        style={errors.phone ? { borderColor: '#ef4444' } : {}}
                                    />
                                    {errors.phone && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.phone}</span>}
                                </div>
                                <div className="input-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MapPin size={16} /> {t('gambler_mgmt.detail.country')}</label>
                                    <select
                                        value={gambler.country || ''}
                                        onChange={(e) => setGambler({ ...gambler, country: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem', background: '#FFFFFF', border: '1px solid var(--stroke)', borderRadius: '0.5rem', color: 'var(--text-main)' }}
                                    >
                                        <option value="">Select Country</option>
                                        {countries.map((country, index) => (
                                            <option key={index} value={country}>
                                                {country}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Calendar size={16} /> Member Since</label>
                                    <input
                                        type="text"
                                        value={new Date(gambler.createdAt).toLocaleDateString()}
                                        disabled
                                        style={{ opacity: 0.6 }}
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Info size={16} /> {t('gambler_mgmt.detail.description')}</label>
                                <div style={{ background: '#FFFFFF', borderRadius: '0.5rem', border: '1px solid var(--stroke)', overflow: 'hidden' }}>
                                    <ReactQuill
                                        theme="snow"
                                        value={gambler.description || ''}
                                        onChange={(content) => setGambler({ ...gambler, description: content })}
                                        modules={{
                                            toolbar: [
                                                ['bold', 'italic', 'underline', 'strike'],
                                                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                                ['clean']
                                            ]
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Activity size={16} /> {t('gambler_mgmt.detail.biography')}</label>
                                <div style={{ background: '#FFFFFF', borderRadius: '0.5rem', border: '1px solid var(--stroke)', overflow: 'hidden' }}>
                                    <ReactQuill
                                        theme="snow"
                                        value={gambler.biography || ''}
                                        onChange={(content) => setGambler({ ...gambler, biography: content })}
                                        modules={{
                                            toolbar: [
                                                ['bold', 'italic', 'underline', 'strike'],
                                                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                                ['clean']
                                            ]
                                        }}
                                    />
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary" disabled={saving} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', alignSelf: 'flex-start', minWidth: '200px' }}>
                                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                {t('gambler_mgmt.detail.save_changes')}
                            </button>
                        </form>
                    )}

                    {activeSection === 'config' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Shield color="var(--primary)" /> {t('gambler_mgmt.detail.configurations')}
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', background: '#f8fafc', borderRadius: '1rem', border: '1px solid var(--stroke)' }}>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <div style={{ padding: '0.75rem', background: 'rgba(217, 152, 0, 0.12)', borderRadius: '0.75rem' }}>
                                            <Languages size={24} color="var(--primary)" />
                                        </div>
                                        <div>
                                            <h4 style={{ fontWeight: 'bold' }}>{t('profile.global_language_title')}</h4>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{t('profile.global_language_desc')}</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#FFFFFF', padding: '0.35rem', borderRadius: '0.65rem', border: '1px solid var(--stroke)' }}>
                                        <button
                                            type="button"
                                            onClick={() => handleChangeGlobalLanguage('en')}
                                            disabled={saving}
                                            style={{
                                                padding: '0.45rem 0.9rem',
                                                borderRadius: '0.45rem',
                                                background: i18n.language.startsWith('en') ? 'var(--primary)' : 'rgba(0,0,0,0.05)',
                                                color: i18n.language.startsWith('en') ? 'white' : 'var(--text-main)',
                                                border: 'none',
                                                cursor: saving ? 'not-allowed' : 'pointer',
                                                fontSize: '0.85rem',
                                                fontWeight: '700',
                                                opacity: saving ? 0.75 : 1
                                            }}
                                        >
                                            EN
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleChangeGlobalLanguage('es')}
                                            disabled={saving}
                                            style={{
                                                padding: '0.45rem 0.9rem',
                                                borderRadius: '0.45rem',
                                                background: i18n.language.startsWith('es') ? 'var(--primary)' : 'rgba(0,0,0,0.05)',
                                                color: i18n.language.startsWith('es') ? 'white' : 'var(--text-main)',
                                                border: 'none',
                                                cursor: saving ? 'not-allowed' : 'pointer',
                                                fontSize: '0.85rem',
                                                fontWeight: '700',
                                                opacity: saving ? 0.75 : 1
                                            }}
                                        >
                                            ES
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', background: '#f8fafc', borderRadius: '1rem', border: '1px solid var(--stroke)' }}>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <div style={{ padding: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '0.75rem' }}>
                                            <Eye size={24} color="rgb(59, 130, 246)" />
                                        </div>
                                        <div>
                                            <h4 style={{ fontWeight: 'bold' }}>{t('gambler_mgmt.detail.visibility')}</h4>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Control if your profile is public or private.</p>
                                        </div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="toggle"
                                        checked={gambler.profileVisibility}
                                        onChange={(e) => setGambler({ ...gambler, profileVisibility: e.target.checked })}
                                    />
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', background: '#f8fafc', borderRadius: '1rem', border: '1px solid var(--stroke)' }}>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '0.75rem' }}>
                                            <MessageSquare size={24} color="#10b981" />
                                        </div>
                                        <div>
                                            <h4 style={{ fontWeight: 'bold' }}>{t('gambler_mgmt.detail.messages')}</h4>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Allow other users to send you direct messages.</p>
                                        </div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="toggle"
                                        checked={gambler.receiveMessages}
                                        onChange={(e) => setGambler({ ...gambler, receiveMessages: e.target.checked })}
                                    />
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', background: '#f8fafc', borderRadius: '1rem', border: '1px solid var(--stroke)' }}>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <div style={{ padding: '0.75rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '0.75rem' }}>
                                            <Heart size={24} color="#f59e0b" />
                                        </div>
                                        <div>
                                            <h4 style={{ fontWeight: 'bold' }}>{t('gambler_mgmt.detail.donations')}</h4>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Enable the ability to receive donations from the community.</p>
                                        </div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="toggle"
                                        checked={gambler.receiveDonations}
                                        onChange={(e) => setGambler({ ...gambler, receiveDonations: e.target.checked })}
                                    />
                                </div>

                                <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '1rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                    <h4 style={{ color: '#ef4444', fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Trash2 size={20} /> {t('profile.danger_zone') || "Danger Zone"}
                                    </h4>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                                        {t('profile.data_deletion_desc') || "Request the deletion of all your personal data from our systems."}
                                    </p>
                                    <button
                                        onClick={handleRequestDataDeletion}
                                        className="btn"
                                        disabled={saving}
                                        style={{
                                            background: '#ef4444',
                                            color: 'white',
                                            border: 'none',
                                            padding: '0.75rem 1.5rem',
                                            borderRadius: '0.5rem',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}
                                    >
                                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                        {t('profile.request_data_deletion') || "Request Data Deletion"}
                                    </button>
                                </div>
                            </div>
                            <button onClick={handleUpdateConfig} className="btn btn-primary" disabled={saving} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', alignSelf: 'flex-start', minWidth: '200px', marginTop: '1rem' }}>
                                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                {t('gambler_mgmt.detail.save_changes')}
                            </button>
                        </div>
                    )}

                    {activeSection === 'subscription' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Crown color="var(--primary)" /> {t('subscriptions.manage_title')}
                            </h3>

                            <div style={{
                                padding: '1.75rem',
                                borderRadius: '1.25rem',
                                border: '1px solid rgba(217, 152, 0, 0.28)',
                                background: 'linear-gradient(135deg, rgba(217, 152, 0, 0.12), rgba(255, 255, 255, 0.95))',
                                boxShadow: '0 18px 36px rgba(15, 23, 42, 0.06)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <div style={{
                                            width: 58,
                                            height: 58,
                                            borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #facc15, var(--primary))',
                                            display: 'grid',
                                            placeItems: 'center',
                                            color: 'white',
                                            boxShadow: '0 12px 24px rgba(217, 152, 0, 0.24)'
                                        }}>
                                            <Crown size={30} />
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, color: 'var(--text-muted)', fontWeight: 700 }}>{t('subscriptions.current_plan')}</p>
                                            <h2 style={{ margin: '0.25rem 0 0', fontSize: '1.8rem', fontWeight: 900 }}>{getPlanLabel()}</h2>
                                        </div>
                                    </div>
                                    <span style={{
                                        padding: '0.55rem 0.85rem',
                                        borderRadius: '999px',
                                        background: isRenewalCancellationScheduled ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                                        color: isRenewalCancellationScheduled ? '#b45309' : '#047857',
                                        fontWeight: 800,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.4rem'
                                    }}>
                                        {isRenewalCancellationScheduled ? <AlertCircle size={17} /> : <CheckCircle2 size={17} />}
                                        {isRenewalCancellationScheduled ? t('subscriptions.cancel_scheduled') : t('subscriptions.active')}
                                    </span>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1rem' }}>
                                    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.78)', border: '1px solid var(--stroke)', borderRadius: '0.9rem' }}>
                                        <p style={{ margin: '0 0 0.35rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700 }}>{t('subscriptions.price')}</p>
                                        <strong style={{ fontSize: '1.15rem' }}>{getPlanPrice() || t('subscriptions.not_available')}</strong>
                                    </div>
                                    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.78)', border: '1px solid var(--stroke)', borderRadius: '0.9rem' }}>
                                        <p style={{ margin: '0 0 0.35rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700 }}>{t('subscriptions.expires')}</p>
                                        <strong style={{ fontSize: '1.15rem' }}>{formatDate(subscription?.expiryDate || subscription?.currentPeriodEnd)}</strong>
                                    </div>
                                    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.78)', border: '1px solid var(--stroke)', borderRadius: '0.9rem' }}>
                                        <p style={{ margin: '0 0 0.35rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700 }}>{t('subscriptions.renewal')}</p>
                                        <strong style={{ fontSize: '1.15rem' }}>
                                            {isRenewalCancellationScheduled
                                                ? t('subscriptions.no_renewal')
                                                : t('subscriptions.auto_renewal')}
                                        </strong>
                                    </div>
                                </div>

                                <p style={{ margin: '1.25rem 0 0', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                                    {isRenewalCancellationScheduled
                                        ? t('subscriptions.cancel_scheduled_note')
                                        : t('subscriptions.manage_note')}
                                </p>
                            </div>

                            <div style={{
                                padding: '1.2rem',
                                border: '1px solid rgba(217, 152, 0, 0.22)',
                                borderRadius: '1rem',
                                background: '#fff',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem'
                            }}>
                                <div>
                                    <h4 style={{ margin: '0 0 0.35rem', fontWeight: 900 }}>{t('subscriptions.change_plan_title')}</h4>
                                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.45 }}>
                                        {t('subscriptions.change_plan_hint')}
                                    </p>
                                </div>

                                {loadingSubscriptionPlans ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                                        <Loader2 size={17} className="animate-spin" />
                                        {t('subscriptions.loading_plans')}
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
                                        {subscriptionPlans.map(plan => {
                                            const isCurrentPlan = subscription?.planId
                                                ? subscription.planId === plan.subscriptionPlanId
                                                : Number(subscription?.planType) === Number(plan.type);
                                            const isChanging = changingPlanId === plan.subscriptionPlanId;

                                            return (
                                                <button
                                                    type="button"
                                                    key={plan.subscriptionPlanId}
                                                    onClick={() => handleChangeSubscriptionPlan(plan)}
                                                    disabled={isCurrentPlan || Boolean(changingPlanId)}
                                                    style={{
                                                        border: isCurrentPlan ? '1px solid rgba(217, 152, 0, 0.45)' : '1px solid var(--stroke)',
                                                        background: isCurrentPlan ? 'rgba(217, 152, 0, 0.08)' : '#fff',
                                                        borderRadius: '0.85rem',
                                                        padding: '0.9rem',
                                                        textAlign: 'left',
                                                        cursor: isCurrentPlan || changingPlanId ? 'not-allowed' : 'pointer',
                                                        opacity: isCurrentPlan || (changingPlanId && !isChanging) ? 0.65 : 1
                                                    }}
                                                >
                                                    <strong style={{ display: 'block', fontSize: '1rem', marginBottom: '0.25rem' }}>
                                                        {getPlanLabelFromPlan(plan)}
                                                    </strong>
                                                    <span style={{ display: 'block', color: 'var(--primary)', fontWeight: 900 }}>
                                                        ${plan.price}
                                                    </span>
                                                    <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '0.35rem' }}>
                                                        {isCurrentPlan
                                                            ? t('subscriptions.current_plan_badge')
                                                            : t('subscriptions.new_expiry_after_change', { date: estimateExpiryAfterPlanChange(plan) })}
                                                    </small>
                                                    {isChanging && (
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.6rem', color: 'var(--primary)', fontWeight: 800 }}>
                                                            <Loader2 size={15} className="animate-spin" />
                                                            {t('subscriptions.opening_checkout')}
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {isRenewalCancellationScheduled ? (
                                <div style={{
                                    padding: '1.2rem',
                                    border: '1px solid rgba(217, 152, 0, 0.36)',
                                    borderRadius: '1rem',
                                    background: 'linear-gradient(135deg, rgba(217, 152, 0, 0.1), rgba(255,255,255,0.96))',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '1rem'
                                }}>
                                    <div>
                                        <h4 style={{ margin: '0 0 0.35rem', fontWeight: 900 }}>{t('subscriptions.reactivate_title')}</h4>
                                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.45 }}>
                                            {t('subscriptions.reactivate_hint')}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleReactivateSubscription}
                                        disabled={reactivatingSubscription}
                                        style={{
                                            border: 'none',
                                            background: 'linear-gradient(135deg, #facc15, var(--primary))',
                                            color: 'white',
                                            borderRadius: '0.75rem',
                                            padding: '0.8rem 1.2rem',
                                            fontWeight: 900,
                                            cursor: reactivatingSubscription ? 'not-allowed' : 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            boxShadow: '0 12px 24px rgba(217, 152, 0, 0.22)',
                                            whiteSpace: 'nowrap',
                                            opacity: reactivatingSubscription ? 0.7 : 1
                                        }}
                                    >
                                        {reactivatingSubscription ? <Loader2 size={17} className="animate-spin" /> : <CheckCircle2 size={17} />}
                                        {t('subscriptions.reactivate_subscription')}
                                    </button>
                                </div>
                            ) : hasRecurringStripeSubscription ? (
                                <div style={{
                                    alignSelf: 'flex-start',
                                    padding: '0.9rem 1rem',
                                    border: '1px solid var(--stroke)',
                                    borderRadius: '0.85rem',
                                    background: '#fff'
                                }}>
                                    <p style={{ margin: '0 0 0.7rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                        {t('subscriptions.cancel_hint')}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={handleCancelSubscription}
                                        disabled={cancelingSubscription}
                                        style={{
                                            border: '1px solid rgba(100, 116, 139, 0.35)',
                                            background: 'transparent',
                                            color: 'var(--text-muted)',
                                            borderRadius: '0.5rem',
                                            padding: '0.55rem 0.85rem',
                                            fontWeight: 700,
                                            cursor: cancelingSubscription ? 'not-allowed' : 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.45rem',
                                            opacity: cancelingSubscription ? 0.55 : 1
                                        }}
                                    >
                                        {cancelingSubscription ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                                        {t('subscriptions.cancel_subscription')}
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    )}

                    {activeSection === 'notifications' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Bell color="var(--primary)" /> {t('gambler_mgmt.detail.notifications')}
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', background: '#f8fafc', borderRadius: '1rem', border: '1px solid var(--stroke)' }}>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <div style={{ padding: '0.75rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '0.75rem' }}>
                                            <Bell size={24} color="#8b5cf6" />
                                        </div>
                                        <div>
                                            <h4 style={{ fontWeight: 'bold' }}>{t('gambler_mgmt.detail.push_notifications')}</h4>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Receive real-time alerts on your devices.</p>
                                        </div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="toggle"
                                        checked={gambler.receivePushNotifications}
                                        onChange={(e) => setGambler({ ...gambler, receivePushNotifications: e.target.checked })}
                                    />
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', background: '#f8fafc', borderRadius: '1rem', border: '1px solid var(--stroke)' }}>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <div style={{ padding: '0.75rem', background: 'rgba(236, 72, 153, 0.1)', borderRadius: '0.75rem' }}>
                                            <Mail size={24} color="#ec4899" />
                                        </div>
                                        <div>
                                            <h4 style={{ fontWeight: 'bold' }}>{t('gambler_mgmt.detail.email_notifications')}</h4>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Get updates and important notifications via email.</p>
                                        </div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="toggle"
                                        checked={gambler.receiveEmailNotifications}
                                        onChange={(e) => setGambler({ ...gambler, receiveEmailNotifications: e.target.checked })}
                                    />
                                </div>
                            </div>
                            <button onClick={handleUpdateNotifications} className="btn btn-primary" disabled={saving} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', alignSelf: 'flex-start', minWidth: '200px', marginTop: '1rem' }}>
                                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                {t('gambler_mgmt.detail.save_changes')}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .toggle {
                    appearance: none;
                    width: 50px;
                    height: 26px;
                    background: #e2e8f0;
                    border-radius: 13px;
                    position: relative;
                    cursor: pointer;
                    transition: background 0.3s;
                }
                .toggle:checked {
                    background: var(--primary);
                }
                .toggle::before {
                    content: '';
                    position: absolute;
                    width: 22px;
                    height: 22px;
                    border-radius: 50%;
                    background: white;
                    top: 2px;
                    left: 2px;
                    transition: transform 0.3s;
                }
                .toggle:checked::before {
                    transform: translateX(24px);
                }
                .ql-toolbar.ql-snow { border: none; border-bottom: 1px solid var(--stroke); background: #f8fafc; }
                .ql-container.ql-snow { border: none; min-height: 150px; font-size: 1rem; color: var(--text-main); }
                .ql-editor.ql-blank::before { color: var(--text-muted); }
                .ql-snow .ql-stroke { stroke: var(--text-main); }
                .ql-snow .ql-fill { fill: var(--text-main); }
                .ql-snow .ql-picker { color: var(--text-main); }
                .ql-snow .ql-picker-options { background-color: #FFFFFF; border-color: var(--stroke); }
            `}</style>
        </div>
    );
};

export default Profile;
