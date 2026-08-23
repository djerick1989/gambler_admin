import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { authService } from '../services/api';
import { ArrowRight, CheckCircle2, Facebook, HeartHandshake, ShieldCheck, Target, Twitter, Chrome, Smartphone, Asterisk, WalletCards } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';

const SIGNUP_ERROR_KEYS = {
    'user already exists': 'signup.errors.user_exists'
};

const SHOW_SOCIAL_SIGNUP = false;

const Signup = () => {
    const { t, i18n } = useTranslation();
    const location = useLocation();
    const [formData, setFormData] = useState({
        name: '',
        nickName: '',
        email: '',
        password: '',
        confirmPassword: '',
        languageCode: i18n.language ? i18n.language.toUpperCase() : 'ES',
        loginType: 0
    });

    React.useEffect(() => {
        setFormData(prev => ({ ...prev, languageCode: i18n.language ? i18n.language.toUpperCase() : 'ES' }));
    }, [i18n.language]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    React.useEffect(() => {
        if (location.state?.error) {
            setError(location.state.error);
            navigate(location.pathname, { replace: true });
        }
    }, [location.pathname, location.state, navigate]);

    const updateField = (field) => (event) => {
        event.currentTarget.setCustomValidity('');
        setFormData(prev => ({ ...prev, [field]: event.target.value }));
    };

    const handleInvalidField = (event) => {
        const input = event.currentTarget;

        if (input.validity.valueMissing) {
            input.setCustomValidity(t('signup.validation.required'));
            return;
        }

        if (input.validity.typeMismatch) {
            input.setCustomValidity(t('signup.validation.email'));
            return;
        }

        input.setCustomValidity('');
    };

    const handleSocialSignup = (provider) => {
        setError('');
        window.location.href = authService.getExternalLoginUrl(
            provider,
            i18n.language ? i18n.language.toUpperCase() : 'ES'
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (formData.password !== formData.confirmPassword) {
            setError(t('signup.password_mismatch'));
            return;
        }
        setLoading(true);
        try {
            await authService.signup(formData);
            sessionStorage.setItem('pendingVerificationEmail', formData.email);
            navigate('/verify-email', { state: { email: formData.email } });
        } catch (err) {
            const payload = err.response?.data;
            const backendMessage = payload?.errorMessage || payload?.message || (typeof payload?.data === 'string' ? payload.data : null);
            const normalizedMessage = backendMessage?.trim().toLowerCase();
            const translationKey = SIGNUP_ERROR_KEYS[normalizedMessage];
            setError(translationKey ? t(translationKey) : backendMessage || t('signup.error_default'));
        } finally {
            setLoading(false);
        }
    };

  const reasonIcons = [Target, WalletCards, HeartHandshake];

  return (
    <div className="login-container signup-marketing-page">
      <section className="signup-story-panel animate-fade-in">
                <div className="landing-kicker">
                    <ShieldCheck size={18} />
                    <span>{t('signup.landing_kicker')}</span>
                </div>
                <h1 className="signup-story-title">{t('signup.landing_title')}</h1>
                <p className="signup-story-subtitle">{t('signup.landing_subtitle')}</p>
                <div className="signup-start-flow" aria-label={t('signup.flow_title')}>
                    {[0, 1, 2].map((index) => (
                        <div className="signup-flow-step" key={index}>
                            <strong>{index + 1}</strong>
                            <span>{t(`signup.flow.${index}`)}</span>
                        </div>
                    ))}
                </div>
                <div className="signup-reasons" aria-label={t('signup.reasons_title')}>
                    {[0, 1, 2].map((index) => {
                        const Icon = reasonIcons[index];
                        return (
                            <article className="signup-reason" key={index}>
                                <span className="signup-reason-icon"><Icon size={22} /></span>
                                <div>
                                    <h2>{t(`signup.reasons.${index}.title`)}</h2>
                                    <p>{t(`signup.reasons.${index}.description`)}</p>
                                </div>
                            </article>
                        );
                    })}
                </div>
                <div className="signup-trust-note">
                    <CheckCircle2 size={18} />
                    <span>{t('signup.privacy_note')}</span>
                </div>
            </section>

      <div className="glass-card animate-fade-in signup-card">
        <div className="signup-language-row">
          <LanguageSwitcher style={{ position: 'static', top: 'auto', right: 'auto' }} />
        </div>
        <div className="signup-card-header">
          <img src="/assets/logo_gambler.png" alt="Logo" className="landing-login-logo" />
                    <h1>{t('signup.title')}</h1>
                    <p>{t('signup.subtitle')}</p>
                    <div className="signup-form-hints" aria-label={t('signup.form_hints_title')}>
                        {[0, 1, 2].map((index) => (
                            <span key={index}>{t(`signup.form_hints.${index}`)}</span>
                        ))}
                    </div>
                </div>

                {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="input-group" style={{ gridColumn: 'span 2' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {t('signup.nickName')} <Asterisk size={12} color="var(--danger)" />
                        </label>
                        <input type="text" required value={formData.nickName} onInvalid={handleInvalidField} onChange={updateField('nickName')} />
                    </div>
                    <div className="input-group" style={{ gridColumn: 'span 2' }}>
                        <label>{t('signup.name')}</label>
                        <input type="text" value={formData.name} onChange={updateField('name')} />
                    </div>
                    <div className="input-group" style={{ gridColumn: 'span 2' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {t('signup.email')} <Asterisk size={12} color="var(--danger)" />
                        </label>
                        <input type="email" required value={formData.email} onInvalid={handleInvalidField} onChange={updateField('email')} />
                    </div>
                    <div className="input-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {t('signup.password')} <Asterisk size={12} color="var(--danger)" />
                        </label>
                        <input type="password" required value={formData.password} onInvalid={handleInvalidField} onChange={updateField('password')} />
                    </div>
                    <div className="input-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {t('signup.confirm')} <Asterisk size={12} color="var(--danger)" />
                        </label>
                        <input type="password" required value={formData.confirmPassword} onInvalid={handleInvalidField} onChange={updateField('confirmPassword')} />
                    </div>
                    <div className="signup-form-note">
                        <CheckCircle2 size={16} />
                        <span>{t('signup.form_note')}</span>
                    </div>
                    <button type="submit" className="btn btn-primary signup-submit" style={{ gridColumn: 'span 2', marginTop: '1rem' }} disabled={loading}>
                        {loading ? t('signup.button_loading') : t('signup.button')}
                        {!loading && <ArrowRight size={20} />}
                    </button>

                    {SHOW_SOCIAL_SIGNUP && (
                        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                            <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{t('signup.or_social')}</div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                <button type="button" className="btn-social" aria-label={t('signup.social_facebook')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', background: 'var(--bg-card)' }} onClick={() => handleSocialSignup('facebook')}>
                                    <Facebook size={20} color="#1877F2" />
                                </button>
                                <button type="button" className="btn-social" aria-label={t('signup.social_google')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', background: 'var(--bg-card)' }} onClick={() => handleSocialSignup('google')}>
                                    <Chrome size={20} color="#DB4437" />
                                </button>
                                <button type="button" className="btn-social" aria-label={t('signup.social_x')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', background: 'var(--bg-card)' }} onClick={() => handleSocialSignup('x')}>
                                    <Twitter size={20} color="#000000" />
                                </button>
                                <button type="button" className="btn-social" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', background: 'var(--bg-card)' }} onClick={() => console.log('Apple login')}>
                                    <Smartphone size={20} color="#000000" />
                                </button>
                            </div>
                        </div>
                    )}
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    {t('signup.has_account')} <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>{t('signup.login')}</Link>
                </div>
            </div>
        </div >
    );
};

export default Signup;
