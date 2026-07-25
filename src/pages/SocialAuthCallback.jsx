import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const SocialAuthCallback = () => {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { fetchUser } = useAuth();
    const [message, setMessage] = useState(t('signup.social_finishing'));

    useEffect(() => {
        const complete = async () => {
            const token = searchParams.get('token');
            const error = searchParams.get('error');

            if (error || !token) {
                navigate('/signup', {
                    replace: true,
                    state: {
                        error: t(`signup.social_errors.${error}`, t('signup.social_error'))
                    }
                });
                return;
            }

            localStorage.setItem('token', token);
            setMessage(t('signup.social_success'));
            await fetchUser();
            navigate('/', { replace: true });
        };

        complete();
    }, [fetchUser, navigate, searchParams, t]);

    return (
        <div className="login-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '1rem' }}>
            <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem', textAlign: 'center' }}>
                <ShieldCheck size={48} color="var(--primary)" style={{ marginBottom: '1.5rem' }} />
                <h1 style={{ fontSize: '1.7rem', marginBottom: '0.75rem' }}>{t('signup.social_title')}</h1>
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>{message}</p>
            </div>
        </div>
    );
};

export default SocialAuthCallback;
