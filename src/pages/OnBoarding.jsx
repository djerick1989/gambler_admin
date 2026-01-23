import React from 'react';
import { UserCheck, Image as ImageIcon, Send, Layout } from 'lucide-react';

const OnBoarding = () => {
    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: '800' }}>Configuración OnBoarding</h1>
                <p style={{ color: 'var(--text-muted)' }}>Gestiona los pasos de bienvenida para nuevos usuarios.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                <div className="glass-card" style={{ padding: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Layout size={24} color="var(--primary)" /> Paso 1: Introducción
                    </h2>
                    <div className="input-group">
                        <label>Título</label>
                        <input type="text" defaultValue="¡Bienvenido a Gambler!" />
                    </div>
                    <div className="input-group">
                        <label>Descripción</label>
                        <textarea style={{
                            width: '100%',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '0.5rem',
                            color: 'white',
                            padding: '0.75rem',
                            minHeight: '100px'
                        }}>Comienza tu viaje hacia una vida saludable y libre de adicciones con nuestra ayuda experta.</textarea>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--glass-border)', borderRadius: '0.5rem', padding: '2rem', textAlign: 'center', cursor: 'pointer' }}>
                        <ImageIcon size={32} color="var(--text-muted)" style={{ marginBottom: '0.5rem' }} />
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Click para subir imagen</p>
                    </div>
                    <button className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }}>Guardar Cambios</button>
                </div>

                <div className="glass-card" style={{ padding: '2rem', borderStyle: 'dashed', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    <Plus size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <p>Añadir Nuevo Paso</p>
                </div>
            </div>
        </div>
    );
};

const Plus = ({ size, style }) => (
    <svg width={size} height={size} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

export default OnBoarding;
