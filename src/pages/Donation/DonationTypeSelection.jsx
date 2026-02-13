import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Users, User, Building2 } from 'lucide-react';

const DonationTypeSelection = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const types = [
        {
            id: 'COMMUNITY',
            title: t('donations.community.title'),
            subtitle: t('donations.community.subtitle'),
            icon: Users,
            color: '#D3920A'
        },
        {
            id: 'PERSON',
            title: t('donations.person.title'),
            subtitle: t('donations.person.subtitle'),
            icon: User,
            color: '#D3920A'
        },
        {
            id: 'ORGANIZATION',
            title: t('donations.organization.title'),
            subtitle: t('donations.organization.subtitle'),
            icon: Building2,
            color: '#D3920A'
        }
    ];

    return (
        <div className="animate-fade-in">
            <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem' }}>{t('donations.title')}</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>{t('donations.subtitle')}</p>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1.5rem'
            }}>
                {types.map((type) => (
                    <div
                        key={type.id}
                        className="glass-card"
                        onClick={() => navigate(`/donations/new/${type.id}`)}
                        style={{
                            padding: '2rem',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            hover: {
                                transform: 'translateY(-5px)',
                                borderColor: type.color
                            }
                        }}
                    >
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '1rem',
                            backgroundColor: `${type.color}20`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '1.5rem',
                            color: type.color
                        }}>
                            <type.icon size={32} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.75rem' }}>{type.title}</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>{type.subtitle}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DonationTypeSelection;
