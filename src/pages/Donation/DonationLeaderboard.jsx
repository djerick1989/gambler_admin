import React, { useState, useEffect } from 'react';
import { donationService } from '../../services/api';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../../context/NotificationContext';
import { Loader2, DollarSign, Calendar, ArrowLeft, User, Trophy } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const DonationLeaderboard = () => {
    const { t } = useTranslation();
    const { addToast } = useNotification();
    const navigate = useNavigate();

    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState('amount_desc');
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 10,
        totalCount: 0
    });

    useEffect(() => {
        fetchDonations();
    }, [pagination.page, sortBy]);

    const fetchDonations = async () => {
        setLoading(true);
        try {
            const response = await donationService.getDonationsSummary(pagination.page, pagination.pageSize, sortBy);
            if (response.status || response.statusCode === 200) {
                // Assuming response.data is the structure, or response.data.items
                const items = response.data?.items || response.data || [];
                setDonations(Array.isArray(items) ? items : []);
                setPagination(prev => ({
                    ...prev,
                    totalCount: response.data?.totalCount || 0
                }));
            }
        } catch (err) {
            console.error("Error fetching donation summary:", err);
            addToast('error', t('donations.admin.fetch_error'));
        } finally {
            setLoading(false);
        }
    };

    const getRankIcon = (index) => {
        switch (index) {
            case 0: return <Trophy size={20} color="#FFD700" fill="#FFD700" />; // Gold
            case 1: return <Trophy size={20} color="#C0C0C0" fill="#C0C0C0" />; // Silver
            case 2: return <Trophy size={20} color="#CD7F32" fill="#CD7F32" />; // Bronze
            default: return <span style={{ fontWeight: '700', color: 'var(--text-muted)' }}>#{index + 1}</span>;
        }
    };

    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                    onClick={() => navigate('/donations')}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '0.9rem'
                    }}
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem' }}>
                        {t('donations.leaderboard.title')}
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>
                        {t('donations.leaderboard.subtitle')}
                    </p>
                </div>
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
                    {donations.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <p>{t('donations.admin.table.empty')}</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--stroke)', background: '#f8fafc' }}>
                                        <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', width: '80px', textAlign: 'center' }}>
                                            {t('donations.leaderboard.rank')}
                                        </th>
                                        <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                                            {t('donations.admin.table.donor')}
                                        </th>
                                        <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                                            {t('donations.admin.table.amount')}
                                        </th>
                                        <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                                            {t('donations.admin.table.date')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {donations.map((donation, index) => {
                                        const globalIndex = (pagination.page - 1) * pagination.pageSize + index;
                                        const isAnonymous = donation.isAnonymous;

                                        return (
                                            <tr key={donation.donationId || index} style={{ borderBottom: '1px solid var(--stroke)' }}>
                                                <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                        {getRankIcon(globalIndex)}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1.25rem 1.5rem' }}>
                                                    {isAnonymous ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                            <div style={{
                                                                width: '36px',
                                                                height: '36px',
                                                                borderRadius: '50%',
                                                                background: '#f1f5f9',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                border: 'none'
                                                            }}>
                                                                <User size={18} color="var(--text-muted)" />
                                                            </div>
                                                            <span style={{ fontWeight: '600', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                                                {donation.donorName}
                                                            </span>
                                                        </div>
                                                    ) : (
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
                                                                background: donation.donorAvatar ? `url(${donation.donorAvatar}) center/cover` : '#f1f5f9',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                border: donation.donorAvatar ? '1px solid var(--stroke)' : 'none'
                                                            }}>
                                                                {!donation.donorAvatar && <User size={18} color="var(--text-muted)" />}
                                                            </div>
                                                            <span style={{ fontWeight: '600' }}>{donation.donorName}</span>
                                                        </Link>
                                                    )}
                                                </td>
                                                <td style={{ padding: '1.25rem 1.5rem' }}>
                                                    <div style={{ fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '1.1rem' }}>
                                                        <DollarSign size={16} />
                                                        {donation.amount.toFixed(2)}
                                                    </div>
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
                    )}
                </div>
            )}
        </div>
    );
};

export default DonationLeaderboard;
