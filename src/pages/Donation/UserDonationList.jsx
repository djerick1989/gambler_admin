import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { donationService } from '../../services/api';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Loader2, User, Calendar, DollarSign, Tag, Users, X, Heart } from 'lucide-react';

const UserDonationList = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { addToast } = useNotification();
    const navigate = useNavigate();

    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDonation, setSelectedDonation] = useState(null);

    useEffect(() => {
        if (user?.userId) {
            fetchDonations();
        }
    }, [user]);

    const fetchDonations = async () => {
        setLoading(true);
        try {
            const response = await donationService.getDonationsByUserId(user.userId);
            if (response.status || response.statusCode === 200) {
                // Determine if response.data is array or response.data.items
                // Based on API signature in api.js: getDonationsByUserId just returns response.data
                // And backend likely returns List<DonationDto> or similar wrapper.
                // Assuming it returns array directly or inside data property.
                // Let's assume it returns array based on common pattern for "getByUserId", 
                // but checking admin list it uses .items for pagination.
                // Let's safely check.
                const data = response.data?.items || response.data || [];
                // Ensure it's an array
                setDonations(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error("Error fetching user donations:", err);
            addToast('error', t('donations.admin.fetch_error'));
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'APPROVED': return { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981' };
            case 'REJECTED': return { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' };
            default: return { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' };
        }
    };

    const getTypeColor = (type) => {
        return '#D49000';
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                <Loader2 size={48} className="animate-spin" color="#D49000" />
            </div>
        );
    }

    if (donations.length === 0) {
        return (
            <div className="glass-card fade-in" style={{ padding: '3rem', textAlign: 'center', marginTop: '3rem', border: '1px solid var(--stroke)' }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'rgba(212, 144, 0, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem auto'
                }}>
                    <Heart size={40} color="#D49000" />
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--text-main)' }}>
                    {t('donations.user.title')}
                </h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem auto' }}>
                    {t('donations.user.empty_message')}
                </p>
                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    style={{
                        padding: '0.75rem 2rem',
                        background: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        boxShadow: '0 4px 6px -1px rgba(212, 144, 0, 0.3)'
                    }}
                >
                    {t('donations.user.empty_button')}
                </button>
            </div>
        );
    }

    return (
        <div className="animate-fade-in" style={{ marginTop: '3rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.5rem' }}>
                    {t('donations.user.title')}
                </h2>
            </div>

            <div className="glass-card" style={{ padding: 0, overflow: 'hidden', background: '#FFFFFF', border: '1px solid var(--stroke)' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--stroke)', background: '#f8fafc' }}>
                                <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600' }}>{t('donations.admin.table.amount')}</th>
                                <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600' }}>{t('donations.admin.table.type')}</th>
                                <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600' }}>{t('donations.admin.table.status')}</th>
                                <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600' }}>{t('donations.admin.table.date')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {donations.map((donation) => {
                                const statusObj = getStatusStyle(donation.status);
                                return (
                                    <tr key={donation.donationId} style={{ borderBottom: '1px solid var(--stroke)' }}>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <div style={{ fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <DollarSign size={14} />
                                                {donation.amount.toFixed(2)}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                <span style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    fontSize: '0.8rem',
                                                    fontWeight: '700',
                                                    color: getTypeColor(donation.donationType)
                                                }}>
                                                    <Tag size={12} />
                                                    {donation.donationType}
                                                </span>
                                                {donation.donationType === 'PERSON' && (
                                                    <button
                                                        onClick={() => setSelectedDonation(donation)}
                                                        style={{
                                                            background: '#f1f5f9',
                                                            border: '1px solid var(--stroke)',
                                                            borderRadius: '4px',
                                                            fontSize: '0.7rem',
                                                            color: 'var(--text-muted)',
                                                            padding: '2px 6px',
                                                            cursor: 'pointer',
                                                            width: 'fit-content',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px'
                                                        }}
                                                    >
                                                        <Users size={12} />
                                                        {t('donations.admin.table.beneficiaries')}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '2rem',
                                                fontSize: '0.75rem',
                                                fontWeight: '700',
                                                background: statusObj.bg,
                                                color: statusObj.color
                                            }}>
                                                {t(`donations.admin.status.${donation.status.toLowerCase()}`)}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                <Calendar size={14} />
                                                {new Date(donation.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Beneficiaries Modal */}
            {selectedDonation && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '2rem'
                }}>
                    <div className="glass-card animate-scale-in" style={{
                        width: '100%',
                        maxWidth: '500px',
                        padding: '2rem',
                        position: 'relative',
                        background: '#FFFFFF',
                        border: '1px solid var(--stroke)'
                    }}>
                        <button
                            onClick={() => setSelectedDonation(null)}
                            style={{
                                position: 'absolute',
                                top: '1.5rem',
                                right: '1.5rem',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer'
                            }}
                        >
                            <X size={24} />
                        </button>

                        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1.5rem', color: 'var(--text-main)' }}>
                            {t('donations.admin.beneficiaries_modal.title')}
                        </h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {selectedDonation.beneficiaries && selectedDonation.beneficiaries.length > 0 ? (
                                selectedDonation.beneficiaries.map((b, idx) => (
                                    <div key={idx} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        padding: '1rem',
                                        background: '#f8fafc',
                                        borderRadius: '0.75rem',
                                        border: '1px solid var(--stroke)'
                                    }}>
                                        <Link
                                            to={`/gamblers/${b.gamblerId}`}
                                            style={{
                                                flex: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '1rem',
                                                textDecoration: 'none',
                                                color: 'inherit',
                                                transition: 'opacity 0.2s'
                                            }}
                                            onMouseOver={(e) => e.currentTarget.style.opacity = '0.7'}
                                            onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                                        >
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                background: b.beneficiaryAvatar ? `url(${b.beneficiaryAvatar}) center/cover` : '#f1f5f9',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: b.beneficiaryAvatar ? '1px solid var(--stroke)' : 'none'
                                            }}>
                                                {!b.beneficiaryAvatar && <User size={20} color="#D49000" />}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{b.beneficiaryName}</div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                    {t('donations.admin.beneficiaries_modal.percentage')}: {b.percentage}%
                                                </div>
                                            </div>
                                        </Link>
                                        <div style={{ fontWeight: '800', color: '#D49000', fontSize: '1.1rem' }}>
                                            ${b.amount.toFixed(2)}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                                    {t('donations.admin.beneficiaries_modal.no_beneficiaries')}
                                </p>
                            )}
                        </div>

                        <button
                            onClick={() => setSelectedDonation(null)}
                            style={{
                                width: '100%',
                                marginTop: '2rem',
                                padding: '1rem',
                                background: 'var(--primary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.75rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(212, 144, 0, 0.2)'
                            }}
                        >
                            {t('donations.admin.beneficiaries_modal.close')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserDonationList;
