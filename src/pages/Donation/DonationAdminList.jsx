import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { donationService } from '../../services/api';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Loader2, CheckCircle, XCircle, User, Calendar, DollarSign, Tag, Users, X, ChevronLeft, ChevronRight } from 'lucide-react';

const DonationAdminList = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { addToast } = useNotification();

    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(null);
    const [selectedDonation, setSelectedDonation] = useState(null);
    const [sortBy, setSortBy] = useState('date_desc');
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 10,
        totalCount: 0
    });

    useEffect(() => {
        fetchDonations();
    }, [pagination.page, pagination.pageSize, sortBy]);

    const fetchDonations = async () => {
        setLoading(true);
        try {
            const response = await donationService.getAllDonations(pagination.page, pagination.pageSize, sortBy);
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
                const statusLabel = status === 'APPROVED' ? t('donations.admin.status.approved') : t('donations.admin.status.rejected');
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
            case 'REJECTED': return { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' };
            default: return { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' };
        }
    };

    const getTypeColor = (type) => {
        return '#D49000';
    };

    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem' }}>
                    {t('donations.admin.title')}
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>{t('donations.admin.subtitle')}</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        border: '1px solid var(--stroke)',
                        background: '#FFFFFF',
                        color: 'var(--text-main)',
                        fontSize: '0.9rem',
                        outline: 'none',
                        cursor: 'pointer'
                    }}
                >
                    <option value="amount_desc">{t('donations.sort.amount_desc')}</option>
                    <option value="amount_asc">{t('donations.sort.amount_asc')}</option>
                    <option value="date_desc">{t('donations.sort.date_desc')}</option>
                    <option value="date_asc">{t('donations.sort.date_asc')}</option>
                </select>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                    <Loader2 size={48} className="animate-spin" color="#D49000" />
                </div>
            ) : (
                <div className="glass-card" style={{ padding: 0, overflow: 'hidden', background: '#FFFFFF', border: '1px solid var(--stroke)' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--stroke)', background: '#f8fafc' }}>
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
                                        <tr key={donation.donationId} style={{ borderBottom: '1px solid var(--stroke)' }}>
                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                {(() => {
                                                    const isAdmin = user?.role === 1 || user?.role === 2;
                                                    const isAnonymous = donation.isAnonymous;
                                                    const canViewProfile = !isAnonymous || isAdmin;
                                                    const Wrapper = canViewProfile ? Link : 'div';
                                                    const wrapperProps = canViewProfile ? { to: `/gamblers/${donation.donorGamblerId}` } : {};
                                                    const showAvatar = !isAnonymous && donation.donorAvatar;

                                                    return (
                                                        <Wrapper
                                                            {...wrapperProps}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '0.75rem',
                                                                textDecoration: 'none',
                                                                color: 'inherit',
                                                                transition: 'opacity 0.2s',
                                                                cursor: canViewProfile ? 'pointer' : 'default'
                                                            }}
                                                            onMouseOver={(e) => canViewProfile && (e.currentTarget.style.opacity = '0.7')}
                                                            onMouseOut={(e) => canViewProfile && (e.currentTarget.style.opacity = '1')}
                                                        >
                                                            <div style={{
                                                                width: '36px',
                                                                height: '36px',
                                                                borderRadius: '50%',
                                                                background: showAvatar ? `url(${donation.donorAvatar}) center/cover` : '#f1f5f9',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                border: showAvatar ? '1px solid var(--stroke)' : 'none'
                                                            }}>
                                                                {!showAvatar && <User size={18} color="var(--text-muted)" />}
                                                            </div>
                                                            <span style={{ fontWeight: '600' }}>{donation.donorName}</span>
                                                        </Wrapper>
                                                    );
                                                })()}
                                            </td>
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
                                                    {(donation.status === 'APPROVED' || donation.status === 'REJECTED') && donation.approvedByUserId && (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
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
                                                                {donation.approvedByUserName || t('donations.admin.unknown_admin')}
                                                            </Link>
                                                            {donation.approvedAt && (
                                                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                    <CheckCircle size={10} />
                                                                    {new Date(donation.approvedAt).toLocaleDateString()} {new Date(donation.approvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            )}
                                                        </div>
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
                                                            onClick={() => handleUpdateStatus(donation.donationId, 'REJECTED')}
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

                    <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', borderTop: '1px solid var(--stroke)', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{t('common.rows_per_page')}</span>
                            <select
                                value={pagination.pageSize}
                                onChange={(e) => {
                                    setPagination(prev => ({
                                        ...prev,
                                        pageSize: parseInt(e.target.value),
                                        page: 1
                                    }));
                                }}
                                style={{
                                    background: '#FFFFFF',
                                    border: '1px solid var(--stroke)',
                                    borderRadius: '0.4rem',
                                    color: 'var(--text-main)',
                                    padding: '0.25rem 0.5rem',
                                    fontSize: '0.875rem',
                                    cursor: 'pointer',
                                    outline: 'none'
                                }}
                            >
                                <option value={10} style={{ background: '#FFFFFF', color: 'var(--text-main)' }}>10</option>
                                <option value={20} style={{ background: '#FFFFFF', color: 'var(--text-main)' }}>20</option>
                                <option value={50} style={{ background: '#FFFFFF', color: 'var(--text-main)' }}>50</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button
                                disabled={pagination.page === 1}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                style={{ background: 'none', border: 'none', color: pagination.page === 1 ? 'var(--text-muted)' : 'var(--text-main)', cursor: pagination.page === 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-main)' }}>
                                {t('common.page_x_of_y', { current: pagination.page, total: Math.ceil(pagination.totalCount / pagination.pageSize) || 1 })}
                            </span>
                            <button
                                disabled={pagination.page >= Math.ceil(pagination.totalCount / pagination.pageSize)}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                style={{ background: 'none', border: 'none', color: pagination.page >= Math.ceil(pagination.totalCount / pagination.pageSize) ? 'var(--text-muted)' : 'var(--text-main)', cursor: pagination.page >= Math.ceil(pagination.totalCount / pagination.pageSize) ? 'default' : 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
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

export default DonationAdminList;
