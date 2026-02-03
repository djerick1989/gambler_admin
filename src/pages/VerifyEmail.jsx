import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';

const VerifyEmail = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const [code, setCode] = useState('');
    const [email] = useState(location.state?.email || '');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await authService.verifyEmail({ email, code });
            navigate('/login', { state: { message: t('verify.success_message') } });
        } catch (err) {
            setError(err.response?.data?.message || t('verify.error_default'));
        } finally {
            setLoading(false);
        }
    };

    const resendCode = async () => {
        try {
            await authService.resendVerificationCode({ email });
            alert(t('verify.resend_success'));
        } catch (err) {
            alert(t('verify.resend_error'));
        }
    };

    return (
        <div className="login-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', position: 'relative' }}>
            <LanguageSwitcher />
            <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem', textAlign: 'center' }}>
                <ShieldCheck size={48} color="var(--primary)" style={{ marginBottom: '1.5rem' }} />
                <h1>{t('verify.title')}</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>{t('verify.subtitle', { email })}</p>

                {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <input
                            type="text"
                            placeholder={t('verify.placeholder')}
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' }}
                        />
                    </div>
                    <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>{t('verify.button')}</button>
                </form>

                <button onClick={resendCode} style={{ background: 'none', border: 'none', color: 'var(--primary)', marginTop: '1.5rem', cursor: 'pointer' }}>
                    {t('verify.resend')}
                </button>
            </div>
        </div>
    );
};

export default VerifyEmail;
