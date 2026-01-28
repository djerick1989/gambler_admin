import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Languages, UserCheck, LogOut, Menu, X, ChevronRight, Globe, Newspaper, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const SidebarLink = ({ to, icon: Icon, label, active, onClick }) => (
    <Link
        to={to}
        onClick={onClick}
        style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0.75rem 1rem',
            color: active ? 'white' : 'var(--text-muted)',
            textDecoration: 'none',
            borderRadius: '0.5rem',
            backgroundColor: active ? 'var(--primary)' : 'transparent',
            transition: 'all 0.2s',
            marginBottom: '0.5rem'
        }}
    >
        <Icon size={20} style={{ marginRight: '0.75rem' }} />
        <span style={{ flex: 1 }}>{label}</span>
        {active && <ChevronRight size={16} />}
    </Link>
);

const MainLayout = () => {
    const { t, i18n } = useTranslation();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    const getRoleName = (role) => {
        const roles = ['CUSTOMER', 'ADMIN', 'SUPER_ADMIN', 'ADVISOR', 'AUTHOR'];
        return roles[role] || 'Unknown';
    };

    const menuItems = [
        { path: '/', label: t('common.dashboard'), icon: LayoutDashboard },
        { path: '/language', label: t('common.language'), icon: Languages },
        { path: '/onboarding', label: t('common.onboarding'), icon: UserCheck },
        { path: '/i18n', label: t('common.i18n'), icon: Globe },
        { path: '/news', label: t('common.news'), icon: Newspaper },
        { path: '/posts', label: t('common.posts') || 'Posts', icon: MessageSquare },
        { path: '/gamblers', label: t('gambler_mgmt.title'), icon: UserCheck },
    ];

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-darker)' }}>
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
                zIndex: 50
            }}>
                <div style={{ padding: '2rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img
                        src="https://s3.us-east-2.amazonaws.com/ludopata.org/logo_gambler.png"
                        alt="Logo"
                        style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                    />
                    <span style={{ fontSize: '1.25rem', fontWeight: '800' }}>{t('sidebar.title')}</span>
                </div>

                <nav style={{ flex: 1, padding: '1rem' }}>
                    {menuItems.map(item => (
                        <SidebarLink
                            key={item.path}
                            {...item}
                            to={item.path}
                            active={location.pathname === item.path}
                        />
                    ))}
                </nav>

                <div style={{ padding: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                    <button
                        onClick={handleLogout}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            width: '100%',
                            padding: '0.75rem',
                            color: 'var(--danger)',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            borderRadius: '0.5rem',
                            transition: 'background 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        <LogOut size={20} style={{ marginRight: '0.75rem' }} />
                        <span>{t('common.logout')}</span>
                    </button>
                </div>
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
                    background: 'rgba(2, 6, 23, 0.8)',
                    backdropFilter: 'blur(8px)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 40
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}
                        >
                            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.25rem', borderRadius: '0.5rem' }}>
                            <button
                                onClick={() => changeLanguage('en')}
                                style={{
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '0.25rem',
                                    background: i18n.language.startsWith('en') ? 'var(--primary)' : 'transparent',
                                    color: 'white',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    fontWeight: '600'
                                }}
                            >
                                EN
                            </button>
                            <button
                                onClick={() => changeLanguage('es')}
                                style={{
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '0.25rem',
                                    background: i18n.language.startsWith('es') ? 'var(--primary)' : 'transparent',
                                    color: 'white',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    fontWeight: '600'
                                }}
                            >
                                ES
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>{user?.nickName || user?.name || t('common.admin')}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{getRoleName(user?.role)}</div>
                        </div>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: user?.avatar ? `url(${user.avatar}) center/cover` : 'linear-gradient(45deg, var(--primary), var(--accent))'
                        }}></div>
                    </div>
                </header>

                <main style={{ padding: '2rem', flex: 1 }}>
                    <div className="animate-fade-in">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
