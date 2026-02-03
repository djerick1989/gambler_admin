import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';
import { UserPlus, Mail, Lock, User as UserIcon, Facebook, Twitter, Chrome, Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';

const Signup = () => {
    const { t, i18n } = useTranslation();
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
            navigate('/verify-email', { state: { email: formData.email } });
        } catch (err) {
            setError(err.response?.data?.message || t('signup.error_default'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '2rem', position: 'relative' }} >
            <LanguageSwitcher />
            <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '2.5rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: '800', marginBottom: '0.5rem' }}>{t('signup.title')}</h1>
                    <p style={{ color: 'var(--text-muted)' }}>{t('signup.subtitle')}</p>
                </div>

                {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="input-group" style={{ gridColumn: 'span 2' }}>
                        <label>{t('signup.name')}</label>
                        <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div className="input-group" style={{ gridColumn: 'span 2' }}>
                        <label>{t('signup.nickName')}</label>
                        <input type="text" required value={formData.nickName} onChange={(e) => setFormData({ ...formData, nickName: e.target.value })} />
                    </div>
                    <div className="input-group" style={{ gridColumn: 'span 2' }}>
                        <label>{t('signup.email')}</label>
                        <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                    <div className="input-group">
                        <label>{t('signup.password')}</label>
                        <input type="password" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                    </div>
                    <div className="input-group">
                        <label>{t('signup.confirm')}</label>
                        <input type="password" required value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ gridColumn: 'span 2', marginTop: '1rem' }} disabled={loading}>
                        {loading ? t('signup.button_loading') : t('signup.button')}
                    </button>

                    <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                        <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{t('signup.or_social')}</div>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button type="button" className="btn-social" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', background: 'var(--bg-card)' }} onClick={() => console.log('Facebook login')}>
                                <Facebook size={20} color="#1877F2" />
                            </button>
                            <button type="button" className="btn-social" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', background: 'var(--bg-card)' }} onClick={() => console.log('Google login')}>
                                <Chrome size={20} color="#DB4437" />
                            </button>
                            <button type="button" className="btn-social" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', background: 'var(--bg-card)' }} onClick={() => console.log('X login')}>
                                <Twitter size={20} color="#000000" />
                            </button>
                            <button type="button" className="btn-social" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', background: 'var(--bg-card)' }} onClick={() => console.log('Apple login')}>
                                <Smartphone size={20} color="#000000" />
                            </button>
                        </div>
                    </div>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    {t('signup.has_account')} <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>{t('signup.login')}</Link>
                </div>
            </div>
        </div >
    );
};

export default Signup;
