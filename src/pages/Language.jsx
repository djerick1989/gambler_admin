import React, { useState, useEffect } from 'react';
import { Globe, Edit2, Trash2, Loader2 } from 'lucide-react';
import { languageService } from '../services/api';
import { useTranslation } from 'react-i18next';

const Language = () => {
    const { t } = useTranslation();
    const [languages, setLanguages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLanguages = async () => {
            try {
                const response = await languageService.getAll();
                if (response.status && response.data) {
                    setLanguages(response.data);
                } else {
                    setError('Error loading languages');
                }
            } catch (err) {
                console.error("Error fetching languages:", err);
                setError('Failed to fetch languages from server');
            } finally {
                setLoading(false);
            }
        };

        fetchLanguages();
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', color: 'var(--text-muted)' }}>
                <Loader2 size={48} className="animate-spin" />
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: '800' }}>{t('language_mgmt.title')}</h1>
                    <p style={{ color: 'var(--text-muted)' }}>{t('language_mgmt.subtitle')}</p>
                </div>
            </div>

            {error ? (
                <div style={{ padding: '2rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', borderRadius: '0.75rem', color: 'var(--danger)', textAlign: 'center' }}>
                    {error}
                </div>
            ) : (
                <div className="glass-card" style={{ overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--glass-border)' }}>
                                <th style={{ padding: '1.25rem' }}>{t('language_mgmt.table.language')}</th>
                                <th style={{ padding: '1.25rem' }}>{t('language_mgmt.table.code')}</th>
                                <th style={{ padding: '1.25rem' }}>{t('language_mgmt.table.status')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {languages.map(lang => (
                                <tr key={lang.languageId} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                    <td style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        {lang.flag ? (
                                            <img src={lang.flag} alt={lang.name} style={{ width: '20px', height: '20px', borderRadius: '4px' }} />
                                        ) : (
                                            <Globe size={20} color="var(--primary)" />
                                        )}
                                        {lang.name}
                                    </td>
                                    <td style={{ padding: '1.25rem' }}><code>{lang.code}</code></td>
                                    <td style={{ padding: '1.25rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '1rem',
                                            fontSize: '0.75rem',
                                            background: 'rgba(16, 185, 129, 0.1)',
                                            color: 'var(--accent)'
                                        }}>
                                            {t('language_mgmt.status.active')}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Language;
