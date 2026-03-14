import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DebtPolicy = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1.5rem', paddingBottom: '4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                <button 
                    onClick={() => navigate('/customer/debts')}
                    style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '0.5rem', marginLeft: '-0.5rem' }}
                >
                    <ChevronLeft size={28} />
                </button>
                <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Info size={32} color="var(--primary)" />
                    {t('DebtPolicy.title')}
                </h1>
            </div>

            <div className="glass-card" style={{ padding: '2.5rem' }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem', fontWeight: '600' }}>
                    {t('DebtPolicy.last_update')}
                </p>

                <div style={{ 
                    whiteSpace: 'pre-wrap', 
                    lineHeight: '1.8', 
                    fontSize: '1.1rem', 
                    color: 'var(--text-main)',
                    opacity: 0.9 
                }}>
                    {t('DebtPolicy.policy')}
                </div>
            </div>
        </div>
    );
};

export default DebtPolicy;
