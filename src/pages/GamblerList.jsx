import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, User, Mail, DollarSign, ChevronLeft, ChevronRight, Loader2,
    Filter, Trash2, Eye, UserX, Users
} from 'lucide-react';
import { gamblerService } from '../services/api';
import { useTranslation } from 'react-i18next';

const GamblerList = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [gamblers, setGamblers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [nickname, setNickname] = useState('');
    const [activeTab, setActiveTab] = useState('all'); // 'all' or 'inactive'
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 10,
        totalRecords: 0,
        lastPage: 1
    });

    useEffect(() => {
        fetchGamblers();
    }, [pagination.page, activeTab]);

    const fetchGamblers = async () => {
        setLoading(true);
        try {
            let response;
            if (activeTab === 'inactive') {
                response = await gamblerService.getInactiveGamblers(pagination.page, pagination.pageSize, nickname);
            } else {
                response = await gamblerService.getAllGamblers(pagination.page, pagination.pageSize, nickname);
            }

            if (response.status) {
                setGamblers(response.data.gamblersList);
                setPagination(prev => ({
                    ...prev,
                    totalRecords: response.data.totalRecords,
                    lastPage: response.data.lastPage
                }));
            }
        } catch (err) {
            console.error("Error fetching gamblers:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchGamblers();
    };

    const handleDelete = async (id) => {
        if (window.confirm(t('gambler_mgmt.detail.delete_confirm'))) {
            try {
                const response = await gamblerService.deleteGambler(id);
                if (response.status) {
                    fetchGamblers();
                }
            } catch (err) {
                console.error("Error deleting gambler:", err);
                alert("Error deleting gambler");
            }
        }
    };

    return (
        <div style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.875rem', fontWeight: '800', marginBottom: '0.25rem' }}>
                            {t('gambler_mgmt.title')}
                        </h1>
                        <p style={{ color: 'var(--text-muted)' }}>{t('gambler_mgmt.subtitle')}</p>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '0.25rem', borderRadius: '0.5rem' }}>
                            <button
                                onClick={() => { setActiveTab('all'); setPagination(prev => ({ ...prev, page: 1 })); }}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '0.4rem',
                                    border: 'none',
                                    background: activeTab === 'all' ? 'var(--primary)' : 'transparent',
                                    color: 'white',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Users size={18} />
                                {t('gambler_mgmt.all_gamblers')}
                            </button>
                            <button
                                onClick={() => { setActiveTab('inactive'); setPagination(prev => ({ ...prev, page: 1 })); }}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '0.4rem',
                                    border: 'none',
                                    background: activeTab === 'inactive' ? 'var(--danger)' : 'transparent',
                                    color: 'white',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <UserX size={18} />
                                {t('gambler_mgmt.inactive_gamblers')}
                            </button>
                        </div>

                        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
                            <div style={{ position: 'relative' }}>
                                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    placeholder={t('gambler_mgmt.search_placeholder')}
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                    style={{
                                        width: '250px',
                                        height: '50px',
                                        paddingLeft: '3rem',
                                        paddingRight: '1rem',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '0.5rem',
                                        color: 'white',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ height: '50px', padding: '0 1.5rem' }}>
                                Search
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                    <Loader2 size={48} className="animate-spin" color="var(--primary)" />
                </div>
            ) : gamblers.length === 0 ? (
                <div className="glass-card" style={{ padding: '4rem', textAlign: 'center' }}>
                    <User size={64} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                    <h3>{t('gambler_mgmt.empty')}</h3>
                </div>
            ) : (
                <>
                    <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600' }}>{t('gambler_mgmt.table.nickname')}</th>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600' }}>{t('gambler_mgmt.table.email')}</th>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600' }}>{t('gambler_mgmt.table.balance')}</th>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600' }}>{t('gambler_mgmt.table.status')}</th>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'right' }}>{t('gambler_mgmt.table.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {gamblers.map((gambler) => (
                                    <tr key={gambler.gamblerId} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    flexShrink: 0,
                                                    borderRadius: '50%',
                                                    background: gambler.user?.avatar ? `url(${gambler.user.avatar}) center/cover` : 'rgba(255,255,255,0.1)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    {!gambler.user?.avatar && <User size={20} color="var(--text-muted)" />}
                                                </div>
                                                <span
                                                    onClick={() => navigate(`/gamblers/${gambler.gamblerId}`)}
                                                    style={{ color: 'var(--primary)', fontWeight: '600', cursor: 'pointer' }}
                                                >
                                                    @{gambler.user?.nickName}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                                                <Mail size={14} />
                                                {gambler.user?.email}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 'bold', color: '#10b981' }}>
                                                <DollarSign size={14} />
                                                {gambler.balance.toFixed(2)}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '2rem',
                                                fontSize: '0.75rem',
                                                fontWeight: '600',
                                                background: gambler.active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                color: gambler.active ? '#10b981' : '#ef4444'
                                            }}>
                                                {gambler.active ? t('gambler_mgmt.table.active') : t('gambler_mgmt.table.inactive')}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => navigate(`/gamblers/${gambler.gamblerId}`)}
                                                    className="btn"
                                                    style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(gambler.gamblerId)}
                                                    className="btn"
                                                    style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', borderTop: '1px solid var(--glass-border)', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{t('common.rows_per_page')}</span>
                            <select
                                value={pagination.pageSize}
                                onChange={(e) => {
                                    setPagination(prev => ({ ...prev, pageSize: parseInt(e.target.value), page: 1 }));
                                }}
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '0.4rem',
                                    color: 'white',
                                    padding: '0.25rem 0.5rem',
                                    fontSize: '0.875rem',
                                    cursor: 'pointer',
                                    outline: 'none'
                                }}
                            >
                                <option value={10} style={{ background: '#1a1a2e' }}>10</option>
                                <option value={20} style={{ background: '#1a1a2e' }}>20</option>
                                <option value={50} style={{ background: '#1a1a2e' }}>50</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button
                                disabled={pagination.page === 1}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                style={{ background: 'none', border: 'none', color: pagination.page === 1 ? 'var(--text-muted)' : 'white', cursor: pagination.page === 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                                {t('common.page_x_of_y', { current: pagination.page, total: pagination.lastPage })}
                            </span>
                            <button
                                disabled={pagination.page >= pagination.lastPage}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                style={{ background: 'none', border: 'none', color: pagination.page >= pagination.lastPage ? 'var(--text-muted)' : 'white', cursor: pagination.page >= pagination.lastPage ? 'default' : 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default GamblerList;
