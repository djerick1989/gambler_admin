import React from 'react';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, Users, DollarSign, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const StatCard = ({ title, value, icon: Icon, change, t }) => (
    <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{title}</p>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{value}</h3>
            </div>
            <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '0.75rem', borderRadius: '0.75rem', color: 'var(--primary)' }}>
                <Icon size={24} />
            </div>
        </div>
        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--accent)', fontWeight: '600' }}>{change}</span>
            <span style={{ color: 'var(--text-muted)' }}>{t('dashboard.stats.vs_last_month')}</span>
        </div>
    </div>
);

const Dashboard = () => {
    const { user } = useAuth();
    const { t } = useTranslation();

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: '800' }}>{t('dashboard.overview')}</h1>
                <p style={{ color: 'var(--text-muted)' }}>{t('dashboard.welcome_message', { name: user?.nickName || user?.name || t('common.admin') })}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <StatCard title={t('dashboard.stats.total_users')} value="12,543" icon={Users} change="+12%" t={t} />
                <StatCard title={t('dashboard.stats.revenue')} value="$45,210" icon={DollarSign} change="+8%" t={t} />
                <StatCard title={t('dashboard.stats.active_sessions')} value="1,204" icon={Activity} change="+5%" t={t} />
                <StatCard title={t('dashboard.stats.conversion_rate')} value="3.2%" icon={TrendingUp} change="+2%" t={t} />
            </div>

            <div className="glass-card" style={{ padding: '2rem', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                <div style={{ textAlign: 'center' }}>
                    <TrendingUp size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <p>{t('dashboard.charts_placeholder')}</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
