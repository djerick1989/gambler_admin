import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';
import { UserPlus, Mail, Lock, User as UserIcon } from 'lucide-react';

const Signup = () => {
    const [formData, setFormData] = useState({
        name: '',
        lastName: '',
        userName: '',
        email: '',
        password: '',
        confirmPassword: '',
        languageCode: 'es',
        loginType: 0
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (formData.password !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }
        setLoading(true);
        try {
            await authService.signup(formData);
            navigate('/verify-email', { state: { email: formData.email } });
        } catch (err) {
            setError(err.response?.data?.message || 'Error al registrarse');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '2rem' }}>
            <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '2.5rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: '800', marginBottom: '0.5rem' }}>Crear Cuenta</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Únete al panel de administración</p>
                </div>

                {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="input-group">
                        <label>Nombre</label>
                        <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div className="input-group">
                        <label>Apellido</label>
                        <input type="text" required value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
                    </div>
                    <div className="input-group" style={{ gridColumn: 'span 2' }}>
                        <label>Usuario</label>
                        <input type="text" required value={formData.userName} onChange={(e) => setFormData({ ...formData, userName: e.target.value })} />
                    </div>
                    <div className="input-group" style={{ gridColumn: 'span 2' }}>
                        <label>Email</label>
                        <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                    <div className="input-group">
                        <label>Contraseña</label>
                        <input type="password" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                    </div>
                    <div className="input-group">
                        <label>Confirmar</label>
                        <input type="password" required value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ gridColumn: 'span 2', marginTop: '1rem' }} disabled={loading}>
                        {loading ? 'Registrando...' : 'Registrarse'}
                    </button>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    ¿Ya tienes cuenta? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>Inicia Sesión</Link>
                </div>
            </div>
        </div>
    );
};

export default Signup;
