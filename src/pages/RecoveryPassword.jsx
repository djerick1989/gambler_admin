import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';
import { KeyRound, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';

const RecoveryPassword = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await authService.recoveryPassword({ email });
            setSent(true);
            setTimeout(() => navigate('/reset-password', { state: { email } }), 2000);
        } catch (err) {
            alert('Error: ' + (err.response?.data?.message || t('recovery.error_default')));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', position: 'relative' }}>
            <LanguageSwitcher />
            <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem', textAlign: 'center' }}>
                <KeyRound size={48} color="var(--primary)" style={{ marginBottom: '1.5rem' }} />
                <h1>{t('recovery.title')}</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                    {sent ? t('recovery.sent_subtitle') : t('recovery.subtitle')}
                </p>

                {!sent && (
                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <input
                                type="email"
                                placeholder={t('recovery.email_placeholder')}
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                            {loading ? t('recovery.button_loading') : t('recovery.button')}
                        </button>
                    </form>
                )}

                <div style={{ marginTop: '2rem' }}>
                    <Link to="/login" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>{t('recovery.back_login')}</Link>
                </div>
            </div>
        </div>
    );
};

export default RecoveryPassword;
