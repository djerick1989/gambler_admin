import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';
import { LogIn, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const Login = () => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({ login: '', password: '', loginType: 0 });
    const [error, setError] = useState('');
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

    return (
        <div className="login-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '1rem' }}>
            <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <img
                        src="https://s3.us-east-2.amazonaws.com/ludopata.org/logo_gambler.png"
                        alt="Logo"
                        style={{ width: '80px', height: '80px', objectFit: 'contain', margin: '0 auto 1.5rem', display: 'block' }}
                    />
                    <h1 style={{ fontSize: '1.875rem', fontWeight: '800', marginBottom: '0.5rem' }}>{t('login.title')}</h1>
                    <p style={{ color: 'var(--text-muted)' }}>{t('login.subtitle')}</p>
                </div>

                {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>{t('login.email_user')}</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
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

                <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    <Link to="/recovery-password" style={{ color: 'var(--primary)', textDecoration: 'none' }}>{t('login.forgot_password')}</Link>
                    <div style={{ marginTop: '1rem' }}>
                        {t('login.no_account')} <Link to="/signup" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>{t('login.signup')}</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
