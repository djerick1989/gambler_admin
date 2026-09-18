import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { authService } from '../services/api';
import { ArrowRight, CheckCircle2, HeartHandshake, Lock, Mail, ShieldCheck, Sparkles, WalletCards } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';

const Login = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const verifiedEmail = location.state?.verifiedEmail || '';
    const [formData, setFormData] = useState({ login: verifiedEmail, password: '', loginType: 0 });
    const [error, setError] = useState('');
    const [successMessage] = useState(location.state?.message || '');
    const [loading, setLoading] = useState(false);
    const { fetchUser } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await authService.signin(formData);
            await fetchUser();
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || t('login.error_default'));
        } finally {
            setLoading(false);
        }
    };

    const benefitIcons = [WalletCards, ShieldCheck, HeartHandshake];

    return (
        <div className="login-container landing-login-page landing-login-page-focused">
            <LanguageSwitcher />
            <section className="landing-hero animate-fade-in">
                <div className="landing-hero-copy">
                    <div className="landing-kicker">
                        <Sparkles size={18} />
                        <span>{t('login.landing_kicker')}</span>
                    </div>
                    <h1 className="landing-title">{t('login.landing_title')}</h1>
                    <p className="landing-subtitle">{t('login.landing_subtitle')}</p>
                    <div className="landing-impact-strip" aria-label={t('login.impact_label')}>
                        <div>
                            <strong>{t('login.impact_1_value')}</strong>
                            <span>{t('login.impact_1_label')}</span>
                        </div>
                        <div>
                            <strong>{t('login.impact_2_value')}</strong>
                            <span>{t('login.impact_2_label')}</span>
                        </div>
                        <div>
                            <strong>{t('login.impact_3_value')}</strong>
                            <span>{t('login.impact_3_label')}</span>
                        </div>
                    </div>
                    <div className="landing-actions">
                        <Link to="/signup" className="landing-primary-cta">
                            {t('login.landing_cta')}
                            <ArrowRight size={20} />
                        </Link>
                    </div>
                    <div className="landing-proof">
                        <CheckCircle2 size={18} />
                        <span>{t('login.landing_proof')}</span>
                    </div>
                </div>

                <div className="landing-benefits">
                    {[0, 1, 2].map((index) => {
                        const Icon = benefitIcons[index];
                        return (
                            <article className="landing-benefit-card" key={index}>
                                <div className="landing-benefit-icon"><Icon size={24} /></div>
                                <div>
                                    <h2>{t(`login.benefits.${index}.title`)}</h2>
                                    <p>{t(`login.benefits.${index}.description`)}</p>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </section>

            <aside className="landing-login-side animate-fade-in">
                <div id="login-form" className="glass-card landing-login-card">
                    <div className="landing-login-header">
                        <img
                            src="/assets/logo_gambler.png"
                            alt="Logo"
                            className="landing-login-logo"
                        />
                        <h2>{t('login.title')}</h2>
                        <p>{t('login.subtitle')}</p>
                    </div>

                    {successMessage && <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid #10b981', color: '#047857', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem', fontWeight: 700 }}>{successMessage}</div>}
                    {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>{error}</div>}

                    <form onSubmit={handleSubmit} autoComplete="off">
                        <div className="input-group">
                            <label>{t('login.email_user')}</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="email"
                                    name="login"
                                    autoComplete="email"
                                    placeholder={t('login.email_placeholder')}
                                    style={{ paddingLeft: '2.5rem' }}
                                    value={formData.login}
                                    onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>{t('login.password')}</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="password"
                                    name="password"
                                    autoComplete="current-password"
                                    placeholder={t('login.password_placeholder')}
                                    style={{ paddingLeft: '2.5rem' }}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
                            {loading ? t('login.button_loading') : t('login.button')}
                        </button>
                    </form>

                    <div style={{ marginTop: '1.35rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        <Link to="/recovery-password" style={{ color: 'var(--primary)', textDecoration: 'none' }}>{t('login.forgot_password')}</Link>
                        <div style={{ marginTop: '0.75rem' }}>
                            {t('login.no_account')} <Link to="/signup" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>{t('login.signup')}</Link>
                        </div>
                    </div>
                </div>

            </aside>
        </div>
    );
};

export default Login;
