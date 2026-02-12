import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { donationService } from '../../services/api';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Loader2, CheckCircle, XCircle, User, Calendar, DollarSign, Tag, Users, X } from 'lucide-react';

const DonationAdminList = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { addToast } = useNotification();

    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(null);
    const [selectedDonation, setSelectedDonation] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 10,
        totalCount: 0
    });

    useEffect(() => {
        fetchDonations();
    }, [pagination.page]);

    const fetchDonations = async () => {
        setLoading(true);
        try {
            const response = await donationService.getAllDonations(pagination.page, pagination.pageSize);
            if (response.status) {
                setDonations(response.data.items);
                setPagination(prev => ({
                    ...prev,
                    totalCount: response.data.totalCount
                }));
            }
        } catch (err) {
            console.error("Error fetching donations:", err);
            addToast('error', t('donations.admin.fetch_error'));
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (donationId, status) => {
        const confirmMsg = status === 'APPROVED'
            ? t('donations.admin.approve_confirm')
            : t('donations.admin.deny_confirm');

        if (!window.confirm(confirmMsg)) return;

        setProcessing(donationId);
        try {
            const response = await donationService.updateStatus({
                donationId,
                status,
                approvedByUserId: user.userId
            });
            if (response.status || response.statusCode === 200) {
                const statusLabel = status === 'APPROVED' ? t('donations.admin.status.approved') : t('donations.admin.status.denied');
                addToast('success', t('donations.admin.status_update_success', { status: statusLabel }));
                fetchDonations();
            }
        } catch (err) {
            console.error("Error updating donation status:", err);
            addToast('error', t('donations.admin.status_update_error'));
        } finally {
            setProcessing(null);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'APPROVED': return { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981' };
            case 'DENIED': return { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' };
            default: return { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' };
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'COMMUNITY': return '#3b82f6';
            case 'PERSON': return '#10b981';
            case 'ORGANIZATION': return '#8b5cf6';
            default: return 'white';
        }
    };

    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem' }}>
                    {t('donations.admin.title')}
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>{t('donations.admin.subtitle')}</p>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                    <Loader2 size={48} className="animate-spin" color="var(--primary)" />
                </div>
            ) : (
                <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                                    <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600' }}>{t('donations.admin.table.donor')}</th>
                                    <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600' }}>{t('donations.admin.table.amount')}</th>
                                    <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600' }}>{t('donations.admin.table.type')}</th>
                                    <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600' }}>{t('donations.admin.table.status')}</th>
                                    <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600' }}>{t('donations.admin.table.date')}</th>
                                    <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'right' }}>{t('donations.admin.table.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {donations.map((donation) => {
                                    const statusObj = getStatusStyle(donation.status);
                                    return (
                                        <tr key={donation.donationId} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                <Link
                                                    to={`/gamblers/${donation.donorGamblerId}`}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.75rem',
                                                        textDecoration: 'none',
                                                        color: 'inherit',
                                                        transition: 'opacity 0.2s'
                                                    }}
                                                    onMouseOver={(e) => e.currentTarget.style.opacity = '0.7'}
                                                    onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                                                >
                                                    <div style={{
                                                        width: '36px',
                                                        height: '36px',
                                                        borderRadius: '50%',
                                                        background: donation.donorAvatar ? `url(${donation.donorAvatar}) center/cover` : 'rgba(255,255,255,0.05)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        border: donation.donorAvatar ? '1px solid var(--glass-border)' : 'none'
                                                    }}>
                                                        {!donation.donorAvatar && <User size={18} color="var(--text-muted)" />}
                                                    </div>
                                                    <span style={{ fontWeight: '600' }}>{donation.donorName}</span>
                                                </Link>
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                <div style={{ fontWeight: '800', color: 'white', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
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
                                                                background: 'rgba(255,255,255,0.05)',
                                                                border: '1px solid var(--glass-border)',
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
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
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
                                                    {donation.status === 'APPROVED' && donation.approvedByUserId && (
                                                        <Link
                                                            to={`/user/${donation.approvedByUserId}`}
                                                            style={{
                                                                fontSize: '0.7rem',
                                                                color: 'var(--text-muted)',
                                                                textDecoration: 'none',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                transition: 'color 0.2s'
                                                            }}
                                                            onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary)'}
                                                            onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                                                        >
                                                            <User size={10} />
                                                            {donation.approvedByUserName || t('donations.admin.unknown_approver')}
                                                        </Link>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                    <Calendar size={14} />
                                                    {new Date(donation.createdAt).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                                                {donation.status === 'PENDING' && (
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                        <button
                                                            onClick={() => handleUpdateStatus(donation.donationId, 'APPROVED')}
                                                            disabled={processing === donation.donationId}
                                                            style={{
                                                                background: 'rgba(16, 185, 129, 0.1)',
                                                                color: '#10b981',
                                                                border: 'none',
                                                                borderRadius: '0.5rem',
                                                                padding: '0.5rem',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.2s'
                                                            }}
                                                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'}
                                                            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'}
                                                        >
                                                            {processing === donation.donationId ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateStatus(donation.donationId, 'DENIED')}
                                                            disabled={processing === donation.donationId}
                                                            style={{
                                                                background: 'rgba(239, 68, 68, 0.1)',
                                                                color: '#ef4444',
                                                                border: 'none',
                                                                borderRadius: '0.5rem',
                                                                padding: '0.5rem',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.2s'
                                                            }}
                                                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                                                            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                                        >
                                                            {processing === donation.donationId ? <Loader2 size={18} className="animate-spin" /> : <XCircle size={18} />}
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Beneficiaries Modal */}
            {selectedDonation && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)',
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
                        position: 'relative'
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

                        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1.5rem' }}>
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
                                        background: 'rgba(255,255,255,0.05)',
                                        borderRadius: '0.75rem',
                                        border: '1px solid var(--glass-border)'
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
                                                background: b.beneficiaryAvatar ? `url(${b.beneficiaryAvatar}) center/cover` : 'rgba(255,255,255,0.1)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: b.beneficiaryAvatar ? '1px solid var(--glass-border)' : 'none'
                                            }}>
                                                {!b.beneficiaryAvatar && <User size={20} color="var(--primary)" />}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '700' }}>{b.beneficiaryName}</div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                    {t('donations.admin.beneficiaries_modal.percentage')}: {b.percentage}%
                                                </div>
                                            </div>
                                        </Link>
                                        <div style={{ fontWeight: '800', color: 'var(--primary)', fontSize: '1.1rem' }}>
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
                                cursor: 'pointer'
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

export default DonationAdminList;
