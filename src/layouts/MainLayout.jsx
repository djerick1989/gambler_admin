import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Languages, UserCheck, Lightbulb, LogOut, Menu, X, ChevronRight, Globe, Newspaper, MessageSquare, Image, User, FileText, Bell, Award, CreditCard, Trash2, ClipboardCheck, Wallet, Brain, LifeBuoy, RefreshCcw, Crown, CheckCircle2, Loader2, Headphones } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useNotification } from '../context/NotificationContext';
import { ToastContainer } from '../components/Common/Toast';
import { useTranslation } from 'react-i18next';
import { isPremiumStatus } from '../utils/subscription';
import PremiumAvatarBadge from '../components/PremiumAvatarBadge';
import { healthAgentService, subscriptionService } from '../services/api';

const SidebarLink = ({ to, icon: Icon, label, active, onClick, badge }) => (
    <Link
        to={to}
        onClick={onClick}
        style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0.68rem 1rem',
            color: active ? 'white' : 'var(--text-muted)',
            textDecoration: 'none',
            borderRadius: '0.5rem',
            backgroundColor: active ? 'var(--primary)' : 'transparent',
            transition: 'all 0.2s',
            marginBottom: '0.35rem',
            position: 'relative'
        }}
    >
        <Icon size={20} style={{ marginRight: '0.75rem' }} />
        <span style={{ flex: 1 }}>{label}</span>
        {badge > 0 && (
            <span style={{
                background: 'var(--danger)',
                color: 'white',
                fontSize: '0.7rem',
                padding: '2px 6px',
                borderRadius: '10px',
                minWidth: '18px',
                textAlign: 'center',
                marginRight: '8px',
                fontWeight: 'bold'
            }}>
                {badge}
            </span>
        )}
        {active && <ChevronRight size={16} />}
    </Link>
);

const MainLayout = () => {
    const { t } = useTranslation();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [premiumWelcomeOpen, setPremiumWelcomeOpen] = useState(false);
    const [premiumChecking, setPremiumChecking] = useState(false);
    const [healthQueueCount, setHealthQueueCount] = useState(0);
    const { user, logout, isSubscribed, refreshSubscription } = useAuth();
    const { notifications, removeToast, addToast, unreadCount: unreadNotificationCount } = useNotification();
    const { setActiveChatId, totalUnreadCount } = useChat();
    // La campana suma los chats sin leer y las notificaciones del servidor (logros).
    const bellCount = totalUnreadCount + unreadNotificationCount;
    const location = useLocation();
    const navigate = useNavigate();
    const handledCheckoutSessionRef = React.useRef(null);
    const previousHealthQueueCountRef = React.useRef(0);

    // Safety effect: Clear activeChatId if we navigate away from the chat module
    React.useEffect(() => {
        console.log('--- LAYOUT: Path changed ---', location.pathname);
        if (!location.pathname.startsWith('/chat')) {
            console.log('--- LAYOUT: Not a chat path, resetting activeChatId ---');
            setActiveChatId(null);
        }
    }, [location.pathname, setActiveChatId]);

    React.useEffect(() => {
        const hasPendingWelcome = window.sessionStorage.getItem('premiumWelcomePending') === 'true';
        if (!location.state?.premiumWelcome && !hasPendingWelcome) return;

        window.sessionStorage.removeItem('premiumWelcomePending');
        setPremiumWelcomeOpen(true);
        navigate(location.pathname, { replace: true, state: null });
    }, [location.pathname, location.state, navigate]);

    React.useEffect(() => {
        const params = new URLSearchParams(location.search);
        const stripeStatus = params.get('stripe');
        const sessionId = params.get('session_id');

        if (stripeStatus !== 'success' || !sessionId || !user?.userId) return;
        if (handledCheckoutSessionRef.current === sessionId) return;
        handledCheckoutSessionRef.current = sessionId;

        const cleanParams = new URLSearchParams(location.search);
        cleanParams.delete('stripe');
        cleanParams.delete('session_id');
        const cleanSearch = cleanParams.toString();

        window.sessionStorage.setItem('premiumWelcomePending', 'true');
        setPremiumWelcomeOpen(true);
        setPremiumChecking(true);
        navigate(
            {
                pathname: '/posts',
                search: cleanSearch ? `?${cleanSearch}` : ''
            },
            { replace: true, state: { premiumWelcome: true } }
        );

        let cancelled = false;
        const confirmCheckout = async () => {
            try {
                await subscriptionService.confirmCheckoutSession({
                    userId: user.userId,
                    sessionId
                });
            } catch (error) {
                console.error('Error confirming Stripe checkout session from layout:', error);
            }

            try {
                await refreshSubscription(user.userId);
            } catch (error) {
                console.error('Error refreshing subscription after Stripe checkout:', error);
            }

            if (!cancelled) {
                window.sessionStorage.removeItem('premiumWelcomePending');
                setPremiumChecking(false);
            }
        };

        confirmCheckout();
        return () => {
            cancelled = true;
        };
    }, [location.search, navigate, refreshSubscription, user?.userId]);

    React.useEffect(() => {
        if (!premiumWelcomeOpen || isSubscribed || !user?.userId) return;

        let cancelled = false;
        const pollSubscription = async () => {
            setPremiumChecking(true);
            for (let attempt = 0; attempt < 10; attempt += 1) {
                const nextSubscription = await refreshSubscription(user.userId);
                if (cancelled || isPremiumStatus(nextSubscription)) break;
                await new Promise(resolve => setTimeout(resolve, 1200));
            }
            if (!cancelled) {
                setPremiumChecking(false);
            }
        };

        pollSubscription();
        return () => {
            cancelled = true;
        };
    }, [isSubscribed, premiumWelcomeOpen, refreshSubscription, user?.userId]);

    React.useEffect(() => {
        if (!premiumWelcomeOpen || premiumChecking) return undefined;
        const timeoutId = window.setTimeout(() => setPremiumWelcomeOpen(false), 4500);
        return () => window.clearTimeout(timeoutId);
    }, [premiumChecking, premiumWelcomeOpen]);

    React.useEffect(() => {
        if (![1, 2, 3, 4, 5].includes(user?.role)) return undefined;
        let cancelled = false;
        let queueEndpointAvailable = true;

        const pollHealthQueue = async () => {
            if (!queueEndpointAvailable) return;
            try {
                const response = await healthAgentService.getAgentQueue();
                const data = response?.data ?? response;
                const items = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
                if (cancelled) return;
                setHealthQueueCount(items.length);
                if (items.length > previousHealthQueueCountRef.current && previousHealthQueueCountRef.current > 0) {
                    addToast('info', t('health_agent.new_waiting') || 'Nueva conversación esperando agente.');
                }
                previousHealthQueueCountRef.current = items.length;
            } catch (error) {
                if (error?.response?.status === 404) {
                    queueEndpointAvailable = false;
                    return;
                }
                console.error('Error polling health agent queue:', error);
            }
        };

        pollHealthQueue();
        const intervalId = window.setInterval(pollHealthQueue, 20000);
        return () => {
            cancelled = true;
            window.clearInterval(intervalId);
        };
    }, [addToast, t, user?.role]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getRoleName = (role) => {
        const roles = ['CUSTOMER', 'ADMIN', 'SUPER_ADMIN', 'ADVISOR', 'AUTHOR', 'AGENT'];
        return roles[role] || 'Unknown';
    };

    const menuItems = [
        { path: '/', label: t('common.dashboard'), icon: LayoutDashboard, roles: [1, 2] },
        { path: '/language', label: t('common.language'), icon: Languages, roles: [1, 2] },
        { path: '/onboarding', label: t('common.onboarding'), icon: UserCheck, roles: [1, 2] },
        { path: '/i18n', label: t('common.i18n'), icon: Globe, roles: [1, 2] },
        { path: '/posts', label: t('common.posts') || 'Posts', icon: FileText },
        { path: '/chat', label: t('common.chat') || 'Chat', icon: MessageSquare },
        { path: '/news', label: t('common.news'), icon: Newspaper, roles: [1, 2] },
        { path: '/media', label: t('media_mgmt.title') || 'Media', icon: Image, roles: [1, 2] },
        { path: '/achievements', label: t('achievements.title') || 'Achievements', icon: Award },
        { path: '/donations', label: t('donations.title') || 'Donations', icon: CreditCard },
        { path: '/payment-platforms', label: t('payment_platforms.title') || 'Payment Platforms', icon: CreditCard, roles: [1, 2] },
        { path: '/forms', label: t('forms.title') || 'Formularios', icon: FileText, roles: [1, 2] },
        { path: '/support-feedback', label: t('help_support.admin_menu') || 'Soporte', icon: LifeBuoy, roles: [1, 2] },
        { path: '/health-agent', label: t('health_agent.menu') || 'Asistencia IA', icon: Headphones, roles: [1, 2, 3, 4, 5], badge: healthQueueCount },
        { path: '/dopamine', label: t('dopamine.title') || 'Dopamine', icon: Brain, roles: [1, 2] },
        { path: '/customer/forms', label: t('forms.autodiagnosis') || 'Formularios', icon: ClipboardCheck, roles: [0] },
        { path: '/subscriptions', label: t('subscriptions.title') || 'Suscripción', icon: CreditCard, roles: [0], hideWhenSubscribed: true },
        { path: '/customer/assistance', label: t('common.assistance') || 'Asistencia', icon: LifeBuoy, roles: [0] },
        { path: '/customer/help-support', label: t('help_support.title') || 'Ayuda y Soporte', icon: LifeBuoy, roles: [0] },
        { path: '/customer/relapses', label: t('relapses.title') || 'Recaídas', icon: RefreshCcw, roles: [0] },
        { path: '/customer/dopamine', label: t('dopamine.title') || 'Dopamina', icon: Brain, roles: [0] },
        { path: '/customer/debts', label: t('debts.title') || 'Deudas', icon: Wallet, roles: [0] },
        { path: '/customer/strategies', label: t('strategies.title') || 'Estrategias', icon: Lightbulb, roles: [0] },
        { path: '/gamblers', label: t('gambler_mgmt.title'), icon: UserCheck, roles: [1, 2] },
        { path: '/data-deletion-requests', label: t('data_deletion.title') || 'Data Deletion', icon: Trash2, roles: [1, 2] },
    ];

    const filteredMenuItems = menuItems.filter(item =>
        (!item.roles || item.roles.includes(user?.role)) &&
        !(item.hideWhenSubscribed && isSubscribed)
    );

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-light)' }}>
            {/* Sidebar */}
            <div className="glass-card" style={{
                width: sidebarOpen ? '260px' : '0',
                transition: 'width 0.3s',
                overflow: 'hidden',
                borderLeft: 'none',
                borderTop: 'none',
                borderBottom: 'none',
                borderRadius: 0,
                display: 'flex',
                flexDirection: 'column',
                zIndex: 50,
                position: 'sticky',
                top: 0,
                height: '100vh'
            }}>
                <div style={{ padding: '1rem 1.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img
                        src="/assets/logo_gambler.png"
                        alt="Logo"
                        style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                    />
                    <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)' }}>Ludopata</span>
                </div>

                <nav className="sidebar-nav" style={{ flex: 1, padding: '0.6rem 1rem 1rem', overflowY: 'auto' }}>
                    <style>{`
                        .sidebar-nav::-webkit-scrollbar {
                            width: 4px;
                        }
                        .sidebar-nav::-webkit-scrollbar-track {
                            background: transparent;
                        }
                        .sidebar-nav::-webkit-scrollbar-thumb {
                            background: transparent;
                            border-radius: 10px;
                            transition: background 0.3s;
                        }
                        .sidebar-nav:hover::-webkit-scrollbar-thumb {
                            background: rgba(0, 0, 0, 0.1);
                        }
                        /* Firefox */
                        .sidebar-nav {
                            scrollbar-width: thin;
                            scrollbar-color: transparent transparent;
                            transition: scrollbar-color 0.3s;
                        }
                        .sidebar-nav:hover {
                            scrollbar-color: rgba(0, 0, 0, 0.1) transparent;
                        }
                    `}</style>
                    {filteredMenuItems.map(item => (
                        <SidebarLink
                            key={item.path}
                            {...item}
                            to={item.path}
                            active={item.path === '/' ? location.pathname === '/' : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)}
                            badge={item.path === '/chat' ? totalUnreadCount : item.badge}
                        />
                    ))}
                </nav>
            </div>

            {/* Main Content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <header style={{
                    height: '70px',
                    borderBottom: '1px solid var(--glass-border)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 2rem',
                    justifyContent: 'space-between',
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(8px)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 40,
                    color: 'var(--text-main)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}
                        >
                            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>

                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', position: 'relative' }}>
                        <Link
                            to="/notifications"
                            style={{
                                color: 'var(--text-main)',
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <Bell size={22} color={bellCount > 0 ? '#ef4444' : 'var(--text-main)'} />
                            {bellCount > 0 && (
                                <span style={{
                                    position: 'absolute',
                                    top: '-4px',
                                    right: '-4px',
                                    background: '#ef4444',
                                    width: '10px',
                                    height: '10px',
                                    borderRadius: '50%',
                                    border: '2px solid var(--bg-white)'
                                }}></span>
                            )}
                        </Link>

                        <div
                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                cursor: 'pointer',
                                padding: '0.5rem',
                                borderRadius: '0.75rem',
                                transition: 'all 0.2s',
                                background: userMenuOpen ? 'rgba(0,0,0,0.03)' : 'transparent'
                            }}
                        >
                            <div style={{ textAlign: 'right', display: 'block' }}>
                                <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>{user?.nickName || user?.name || t('common.admin')}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{getRoleName(user?.role)}</div>
                            </div>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: user?.avatar ? `url(${user.avatar}) center/cover` : 'rgba(217, 152, 0, 0.16)',
                                border: user?.avatar ? '2px solid var(--bg-white)' : '2px solid var(--primary)',
                                boxShadow: user?.avatar ? '0 2px 4px rgba(0,0,0,0.1)' : '0 4px 12px rgba(217, 152, 0, 0.22)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative'
                            }}>
                                {isSubscribed && <PremiumAvatarBadge />}
                                {!user?.avatar && <User size={22} color="var(--primary)" />}
                            </div>
                        </div>

                        {userMenuOpen && (
                            <>
                                <div
                                    onClick={() => setUserMenuOpen(false)}
                                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 90 }}
                                />
                                <div className="glass-card animate-fade-in" style={{
                                    position: 'absolute',
                                    top: '100%',
                                    right: 0,
                                    marginTop: '0.5rem',
                                    width: '240px',
                                    zIndex: 100,
                                    padding: '0.5rem',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                    animation: 'fadeIn 0.2s ease-out'
                                }}>
                                    <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--stroke)', marginBottom: '0.5rem' }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{user?.nickName}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.email}</div>
                                    </div>

                                    <Link
                                        to="/profile"
                                        onClick={() => setUserMenuOpen(false)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '0.75rem 1rem',
                                            color: 'var(--text-main)',
                                            textDecoration: 'none',
                                            borderRadius: '0.5rem',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
                                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <User size={18} style={{ marginRight: '0.75rem' }} />
                                        <span>{t('common.profile')}</span>
                                    </Link>

                                    <button
                                        onClick={() => {
                                            setUserMenuOpen(false);
                                            handleLogout();
                                        }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            width: '100%',
                                            padding: '0.75rem 1rem',
                                            color: 'var(--danger)',
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            borderRadius: '0.5rem',
                                            transition: 'background 0.2s',
                                            textAlign: 'left'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <LogOut size={18} style={{ marginRight: '0.75rem' }} />
                                        <span>{t('common.logout')}</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </header>

                <main style={{ padding: '2rem', flex: 1 }}>
                    <div className="animate-fade-in">
                        <Outlet />
                    </div>
                </main>
                {premiumWelcomeOpen && (
                    <div
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 200,
                            display: 'grid',
                            placeItems: 'center',
                            background: 'rgba(15, 23, 42, 0.45)',
                            backdropFilter: 'blur(4px)',
                            padding: '1.25rem'
                        }}
                    >
                        <div
                            className="animate-fade-in"
                            style={{
                                width: 'min(440px, 100%)',
                                borderRadius: '18px',
                                background: 'linear-gradient(145deg, #fff 0%, #fff9e8 100%)',
                                border: '1px solid rgba(212, 144, 0, 0.35)',
                                boxShadow: '0 26px 70px rgba(15, 23, 42, 0.28)',
                                padding: '2rem',
                                textAlign: 'center',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => setPremiumWelcomeOpen(false)}
                                aria-label={t('common.close', { defaultValue: 'Close' })}
                                style={{
                                    position: 'absolute',
                                    top: '1rem',
                                    right: '1rem',
                                    border: 'none',
                                    background: 'rgba(15, 23, 42, 0.06)',
                                    borderRadius: '50%',
                                    width: 34,
                                    height: 34,
                                    display: 'grid',
                                    placeItems: 'center',
                                    cursor: 'pointer',
                                    color: 'var(--text-main)'
                                }}
                            >
                                <X size={18} />
                            </button>

                            <div
                                style={{
                                    width: 76,
                                    height: 76,
                                    margin: '0 auto 1rem',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #facc15, var(--primary))',
                                    color: '#fff',
                                    display: 'grid',
                                    placeItems: 'center',
                                    boxShadow: '0 16px 34px rgba(212, 144, 0, 0.35)'
                                }}
                            >
                                {premiumChecking && !isSubscribed ? (
                                    <Loader2 size={34} className="animate-spin" />
                                ) : (
                                    <Crown size={38} strokeWidth={2.4} />
                                )}
                            </div>

                            <h2 style={{ margin: '0 0 0.65rem', fontSize: '1.75rem', fontWeight: 900 }}>
                                {t('subscriptions.welcome_premium_title')}
                            </h2>
                            <p style={{ margin: '0 auto 1.5rem', color: 'var(--text-muted)', lineHeight: 1.55, maxWidth: 340 }}>
                                {isSubscribed
                                    ? t('subscriptions.redirecting_home')
                                    : t('subscriptions.activating_premium')}
                            </p>
                            <div
                                style={{
                                    display: 'grid',
                                    gap: '0.6rem',
                                    margin: '0 0 1.5rem',
                                    textAlign: 'left'
                                }}
                            >
                                {[
                                    t('subscriptions.benefit_alerts'),
                                    t('subscriptions.benefit_balance'),
                                    t('subscriptions.benefit_support')
                                ].map(item => (
                                    <div
                                        key={item}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.55rem',
                                            padding: '0.65rem 0.75rem',
                                            borderRadius: '0.75rem',
                                            background: 'rgba(217, 152, 0, 0.08)',
                                            color: 'var(--text-main)',
                                            fontWeight: 700
                                        }}
                                    >
                                        <CheckCircle2 size={18} color="var(--primary)" />
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => setPremiumWelcomeOpen(false)}
                                style={{
                                    minWidth: 190,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    fontWeight: 900
                                }}
                            >
                                <CheckCircle2 size={19} />
                                {t('subscriptions.continue_home') || 'Continuar'}
                            </button>
                        </div>
                    </div>
                )}
                <ToastContainer notifications={notifications} onRemove={removeToast} />
                <style>
                    {`
                        @keyframes toastSlideIn {
                            from { transform: translateX(100%); opacity: 0; }
                            to { transform: translateX(0); opacity: 1; }
                        }
                    `}
                </style>
            </div>
        </div >
    );
};

export default MainLayout;
