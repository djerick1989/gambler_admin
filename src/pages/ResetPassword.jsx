import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';

const ResetPassword = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: location.state?.email || '',
        code: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.newPassword !== formData.confirmPassword) {
            alert(t('reset_password.error_mismatch'));
            return;
        }
        setLoading(true);
        try {
            const payload = {
                email: formData.email,
                code: formData.code,
                newPassword: formData.newPassword
            };
            await authService.resetPassword(payload);
            alert(t('reset_password.success'));
            navigate('/login');
        } catch (err) {
            alert('Error: ' + (err.response?.data?.message || 'Código inválido o error de sistema'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', position: 'relative' }}>
            <LanguageSwitcher />
            <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}>
                <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>{t('reset_password.title')}</h1>
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>{t('reset_password.email_sent')}</label>
                        <input type="text" value={formData.email} disabled style={{ backgroundColor: '#f0f0f0', color: '#666' }} />
                    </div>
                    <div className="input-group">
                        <label>{t('reset_password.code')}</label>
                        <input
                            type="text"
                            required
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value.replace(/\D/g, '') })}
                            placeholder={t('reset_password.code_placeholder')}
                        />
                    </div>
                    <div className="input-group">
                        <label>{t('reset_password.new_password')}</label>
                        <input type="password" required value={formData.newPassword} onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })} />
                    </div>
                    <div className="input-group">
                        <label>{t('reset_password.confirm_password')}</label>
                        <input type="password" required value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} />
                    </div>
                    <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
                        {loading ? t('reset_password.button_loading') : t('reset_password.button')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
