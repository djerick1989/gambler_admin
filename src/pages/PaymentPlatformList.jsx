import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Edit2, Trash2, Loader2,
    ChevronLeft, ChevronRight, CreditCard, AlertCircle
} from 'lucide-react';
import { paymentPlatformService } from '../services/api';
import { useTranslation } from 'react-i18next';

const PaymentPlatformList = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [platforms, setPlatforms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Pagination state
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        fetchPlatforms();
    }, [page, pageSize]);

    const fetchPlatforms = async () => {
        setLoading(true);
        try {
            const response = await paymentPlatformService.getAll(page, pageSize);
            if (response.status && response.data) {
                setPlatforms(response.data.paymentPlatforms || []);
                setTotalPages(response.data.lastPage || 1);
            } else {
                setPlatforms([]);
            }
        } catch (err) {
            console.error("Error fetching payment platforms:", err);
            setPlatforms([]);
            setError(t('payment_platforms.empty'));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm(t('payment_platforms.delete_confirm'))) {
            try {
                const response = await paymentPlatformService.delete(id);
                if (response.status) {
                    fetchPlatforms();
                } else {
                    alert(response.errorMessage || "Error deleting platform");
                }
            } catch (err) {
                console.error("Error deleting platform:", err);
                alert("Error deleting platform");
            }
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: '800' }}>{t('payment_platforms.title')}</h1>
                    <p style={{ color: 'var(--text-muted)' }}>{t('payment_platforms.subtitle')}</p>
                </div>
                <button
                    onClick={() => navigate('/payment-platforms/new')}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Plus size={20} /> {t('payment_platforms.add_new')}
                </button>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                    <Loader2 size={48} className="animate-spin" color="var(--primary)" />
                </div>
            ) : platforms.length === 0 ? (
                <div className="glass-card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <AlertCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                    <p>{t('payment_platforms.empty')}</p>
                </div>
            ) : (
                <div className="glass-card" style={{ overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--glass-border)' }}>
                                <th style={{ padding: '1.25rem' }}>{t('payment_platforms.table.name')}</th>
                                <th style={{ padding: '1.25rem' }}>{t('payment_platforms.form.description')}</th>
                                <th style={{ padding: '1.25rem' }}>{t('payment_platforms.table.code')}</th>
                                <th style={{ padding: '1.25rem' }}>{t('payment_platforms.table.status')}</th>
                                <th style={{ padding: '1.25rem' }}>{t('payment_platforms.table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {platforms.map(platform => (
                                <tr key={platform.paymentPlatformId} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                    <td style={{ padding: '1.25rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ padding: '0.5rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)' }}>
                                                <CreditCard size={20} color="var(--primary)" />
                                            </div>
                                            <span style={{ fontWeight: '500' }}>{platform.name}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.25rem', color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '300px' }}>
                                        <div style={{
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {platform.description || '-'}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.25rem' }}>
                                        <span style={{ fontFamily: 'monospace', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '0.25rem' }}>
                                            {platform.code}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1.25rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '1rem',
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            background: platform.isActive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                            color: platform.isActive ? '#22c55e' : '#ef4444'
                                        }}>
                                            {platform.isActive ? t('common.active') : t('common.inactive')}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1.25rem' }}>
                                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                                            <button
                                                onClick={() => navigate(`/payment-platforms/edit/${platform.paymentPlatformId}`)}
                                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                                                title={t('common.edit')}
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(platform.paymentPlatformId)}
                                                style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                                                title={t('common.delete')}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', borderTop: '1px solid var(--glass-border)', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{t('common.rows_per_page')}</span>
                            <select
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(parseInt(e.target.value));
                                    setPage(1);
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
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                                style={{ background: 'none', border: 'none', color: page === 1 ? 'var(--text-muted)' : 'var(--text-main)', cursor: page === 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-main)' }}>
                                {t('common.page_x_of_y', { current: page, total: totalPages })}
                            </span>
                            <button
                                disabled={page >= totalPages}
                                onClick={() => setPage(page + 1)}
                                style={{ background: 'none', border: 'none', color: page >= totalPages ? 'var(--text-muted)' : 'var(--text-main)', cursor: page >= totalPages ? 'default' : 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentPlatformList;
