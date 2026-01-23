import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { Lock } from 'lucide-react';

const ResetPassword = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: location.state?.email || '',
        code: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            alert('Las contraseñas no coinciden');
            return;
        }
        setLoading(true);
        try {
            await authService.resetPassword(formData);
            alert('Contraseña actualizada');
            navigate('/login');
        } catch (err) {
            alert('Error: ' + (err.response?.data?.message || 'Código inválido o error de sistema'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
            <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}>
                <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Nueva Contraseña</h1>
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Código de Verificación</label>
                        <input type="text" required value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} />
                    </div>
                    <div className="input-group">
                        <label>Nueva Contraseña</label>
                        <input type="password" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                    </div>
                    <div className="input-group">
                        <label>Confirmar Contraseña</label>
                        <input type="password" required value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} />
                    </div>
                    <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
                        {loading ? 'Actualizando...' : 'Restablecer Contraseña'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
