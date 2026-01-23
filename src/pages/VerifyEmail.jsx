import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { ShieldCheck } from 'lucide-react';

const VerifyEmail = () => {
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
            navigate('/login', { state: { message: 'Email verificado correctamente' } });
        } catch (err) {
            setError(err.response?.data?.message || 'Código inválido');
        } finally {
            setLoading(false);
        }
    };

    const resendCode = async () => {
        try {
            await authService.resendVerificationCode({ email });
            alert('Código reenviado');
        } catch (err) {
            alert('Error al reenviar');
        }
    };

    return (
        <div className="login-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
            <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem', textAlign: 'center' }}>
                <ShieldCheck size={48} color="var(--primary)" style={{ marginBottom: '1.5rem' }} />
                <h1>Verificar Email</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Hemos enviado un código a {email}</p>

                {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <input
                            type="text"
                            placeholder="Código de 6 dígitos"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' }}
                        />
                    </div>
                    <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>Verificar</button>
                </form>

                <button onClick={resendCode} style={{ background: 'none', border: 'none', color: 'var(--primary)', marginTop: '1.5rem', cursor: 'pointer' }}>
                    Reenviar código
                </button>
            </div>
        </div>
    );
};

export default VerifyEmail;
