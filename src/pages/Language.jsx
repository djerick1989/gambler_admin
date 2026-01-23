import React from 'react';
import { Globe, Plus, Edit2, Trash2 } from 'lucide-react';

const Language = () => {
    const languages = [
        { id: 1, name: 'Español', code: 'es', status: 'Activo' },
        { id: 2, name: 'English', code: 'en', status: 'Activo' },
        { id: 3, name: 'Português', code: 'pt', status: 'Inactivo' },
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: '800' }}>Gestión de Idiomas</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Configura los idiomas habilitados en la plataforma.</p>
                </div>
                <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={20} /> Nuevo Idioma
                </button>
            </div>

            <div className="glass-card" style={{ overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--glass-border)' }}>
                            <th style={{ padding: '1.25rem' }}>Idioma</th>
                            <th style={{ padding: '1.25rem' }}>Código</th>
                            <th style={{ padding: '1.25rem' }}>Estado</th>
                            <th style={{ padding: '1.25rem' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {languages.map(lang => (
                            <tr key={lang.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                <td style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <Globe size={20} color="var(--primary)" />
                                    {lang.name}
                                </td>
                                <td style={{ padding: '1.25rem' }}><code>{lang.code}</code></td>
                                <td style={{ padding: '1.25rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '1rem',
                                        fontSize: '0.75rem',
                                        background: lang.status === 'Activo' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        color: lang.status === 'Activo' ? 'var(--accent)' : 'var(--danger)'
                                    }}>
                                        {lang.status}
                                    </span>
                                </td>
                                <td style={{ padding: '1.25rem' }}>
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Edit2 size={18} /></button>
                                        <button style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={18} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Language;
