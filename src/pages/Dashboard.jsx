import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Activity, AlertCircle, Crown, DollarSign, FileText, Heart, Loader2, MessageCircle, RefreshCw, TrendingUp, Users } from 'lucide-react';
import { dashboardService } from '../services/api';

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const number = new Intl.NumberFormat('en-US');

const formatNumber = (value) => number.format(Number(value) || 0);
const formatCurrency = (value) => currency.format(Number(value) || 0);
const formatDate = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const metricChange = (value) => {
    const change = Number(value) || 0;
    if (change === 0) return '0%';
    return `${change > 0 ? '+' : ''}${change}%`;
};

const StatCard = ({ title, value, icon: Icon, change, tone = 'gold', subtitle }) => {
    const isPositive = Number(change) >= 0;
    const colors = {
        gold: ['rgba(217, 152, 0, 0.12)', 'var(--primary)'],
        green: ['rgba(16, 185, 129, 0.12)', '#059669'],
        blue: ['rgba(59, 130, 246, 0.12)', '#2563eb'],
        red: ['rgba(239, 68, 68, 0.12)', '#dc2626']
    };
    const [bg, fg] = colors[tone] || colors.gold;

    return (
        <div className="glass-card" style={{ padding: '1.5rem', minHeight: 150 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.6rem', fontWeight: 700 }}>{title}</p>
                    <h3 style={{ fontSize: '1.75rem', fontWeight: 900, margin: 0 }}>{value}</h3>
                    {subtitle && <p style={{ margin: '0.45rem 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{subtitle}</p>}
                </div>
                <div style={{ background: bg, padding: '0.85rem', borderRadius: '0.9rem', color: fg }}>
                    <Icon size={25} />
                </div>
            </div>
            <div style={{ marginTop: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.875rem' }}>
                <span style={{ color: isPositive ? '#059669' : '#dc2626', fontWeight: 900 }}>{metricChange(change)}</span>
                <span style={{ color: 'var(--text-muted)' }}>vs mes anterior</span>
            </div>
        </div>
    );
};

const SectionCard = ({ title, subtitle, children }) => (
    <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ marginBottom: '1.2rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900 }}>{title}</h2>
            {subtitle && <p style={{ margin: '0.35rem 0 0', color: 'var(--text-muted)', fontWeight: 600 }}>{subtitle}</p>}
        </div>
        {children}
    </div>
);

const BarList = ({ items, labelKey = 'type', amountKey = 'amount', countKey = 'count', valueFormatter = formatCurrency }) => {
    const max = Math.max(...items.map(item => Number(item[amountKey]) || Number(item[countKey]) || 0), 1);
    if (!items.length) {
        return <p style={{ color: 'var(--text-muted)', fontWeight: 700 }}>No hay datos todavía.</p>;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {items.map(item => {
                const value = Number(item[amountKey]) || Number(item[countKey]) || 0;
                return (
                    <div key={item[labelKey]}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontWeight: 800 }}>
                            <span>{item[labelKey]}</span>
                            <span style={{ color: 'var(--primary)' }}>{valueFormatter(value)}</span>
                        </div>
                        <div style={{ height: 10, borderRadius: 999, background: 'rgba(100, 116, 139, 0.15)', overflow: 'hidden' }}>
                            <div style={{
                                width: `${Math.max(6, (value / max) * 100)}%`,
                                height: '100%',
                                borderRadius: 999,
                                background: 'linear-gradient(90deg, var(--primary), #facc15)'
                            }} />
                        </div>
                        {countKey && item[countKey] !== undefined && (
                            <div style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '0.8rem', fontWeight: 700 }}>
                                {formatNumber(item[countKey])} registros
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

const Dashboard = () => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadDashboard = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await dashboardService.getAdminDashboard();
            if (response.status) {
                setDashboard(response.data);
            } else {
                setError(response.errorMessage || 'No se pudo cargar el dashboard.');
            }
        } catch (err) {
            console.error('Error loading dashboard:', err);
            setError(err?.response?.data?.errorMessage || 'No se pudo cargar el dashboard.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, []);

    const activityCards = useMemo(() => {
        if (!dashboard) return [];
        return [
            { label: 'Posts este mes', value: dashboard.postsThisMonth, icon: FileText },
            { label: 'Historias este mes', value: dashboard.storiesThisMonth, icon: Activity },
            { label: 'Comentarios este mes', value: dashboard.commentsThisMonth, icon: MessageCircle },
            { label: 'Likes este mes', value: dashboard.likesThisMonth, icon: Heart }
        ];
    }, [dashboard]);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.95rem', fontWeight: 900, margin: 0 }}>{t('dashboard.overview')}</h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                        {t('dashboard.welcome_message', { name: user?.nickName || user?.name || t('common.admin') })}
                    </p>
                </div>
                <button
                    onClick={loadDashboard}
                    disabled={loading}
                    style={{
                        border: '1px solid var(--glass-border)',
                        background: 'white',
                        borderRadius: '0.8rem',
                        padding: '0.75rem 1rem',
                        fontWeight: 800,
                        color: 'var(--text-main)',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                    Actualizar
                </button>
            </div>

            {loading && !dashboard ? (
                <div className="glass-card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Loader2 size={36} className="animate-spin" />
                    <p style={{ fontWeight: 800 }}>Cargando métricas...</p>
                </div>
            ) : error ? (
                <div className="glass-card" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', color: '#dc2626' }}>
                    <AlertCircle />
                    <strong>{error}</strong>
                </div>
            ) : dashboard && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                        <StatCard title="Usuarios activos" value={formatNumber(dashboard.totalUsers?.value)} icon={Users} change={dashboard.totalUsers?.changePercentage} tone="blue" />
                        <StatCard title="Usuarios premium" value={formatNumber(dashboard.premiumUsers?.value)} icon={Crown} change={dashboard.premiumUsers?.changePercentage} subtitle={`${dashboard.premiumConversionRate || 0}% conversión`} />
                        <StatCard title="Ingresos por donaciones del mes" value={formatCurrency(dashboard.donationRevenue?.value)} icon={DollarSign} change={dashboard.donationRevenue?.changePercentage} tone="green" />
                        <StatCard title="Donaciones pendientes" value={formatNumber(dashboard.pendingDonations?.value)} icon={AlertCircle} change={dashboard.pendingDonations?.changePercentage} tone="red" subtitle={formatCurrency(dashboard.pendingDonationAmount)} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div className="glass-card" style={{ padding: '1.25rem', background: 'linear-gradient(135deg, rgba(217, 152, 0, 0.12), rgba(255,255,255,0.92))' }}>
                            <p style={{ color: 'var(--text-muted)', fontWeight: 800, margin: 0 }}>Total aprobado histórico</p>
                            <h3 style={{ margin: '0.5rem 0 0', fontSize: '1.45rem' }}>{formatCurrency(dashboard.approvedDonationAmount)}</h3>
                        </div>
                        <div className="glass-card" style={{ padding: '1.25rem' }}>
                            <p style={{ color: 'var(--text-muted)', fontWeight: 800, margin: 0 }}>Suscripciones activas</p>
                            <h3 style={{ margin: '0.5rem 0 0', fontSize: '1.45rem' }}>{formatNumber(dashboard.activeSubscriptions)}</h3>
                        </div>
                        <div className="glass-card" style={{ padding: '1.25rem' }}>
                            <p style={{ color: 'var(--text-muted)', fontWeight: 800, margin: 0 }}>Vencen en 30 días</p>
                            <h3 style={{ margin: '0.5rem 0 0', fontSize: '1.45rem' }}>{formatNumber(dashboard.expiringSubscriptions30Days)}</h3>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                        {activityCards.map(item => (
                            <div key={item.label} className="glass-card" style={{ padding: '1.15rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <p style={{ margin: 0, color: 'var(--text-muted)', fontWeight: 800 }}>{item.label}</p>
                                    <strong style={{ fontSize: '1.5rem' }}>{formatNumber(item.value)}</strong>
                                </div>
                                <item.icon color="var(--primary)" />
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <SectionCard title="Donaciones por tipo" subtitle="Montos aprobados y completados">
                            <BarList items={dashboard.donationsByType || []} />
                        </SectionCard>
                        <SectionCard title="Suscripciones por plan" subtitle="Distribución premium activa y MRR estimado">
                            <BarList
                                items={dashboard.subscriptionsByPlan || []}
                                labelKey="plan"
                                amountKey="monthlyRecurringRevenue"
                                countKey="count"
                            />
                        </SectionCard>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(320px, 0.8fr)', gap: '1.5rem' }}>
                        <SectionCard title="Últimas donaciones" subtitle="Actividad financiera reciente">
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ color: 'var(--text-muted)', textAlign: 'left', fontSize: '0.85rem' }}>
                                            <th style={{ padding: '0.75rem' }}>Donante</th>
                                            <th style={{ padding: '0.75rem' }}>Tipo</th>
                                            <th style={{ padding: '0.75rem' }}>Estado</th>
                                            <th style={{ padding: '0.75rem' }}>Monto</th>
                                            <th style={{ padding: '0.75rem' }}>Fecha</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(dashboard.recentDonations || []).map(item => (
                                            <tr key={item.donationId} style={{ borderTop: '1px solid var(--glass-border)' }}>
                                                <td style={{ padding: '0.85rem', fontWeight: 800 }}>{item.donorName}</td>
                                                <td style={{ padding: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>{item.type}</td>
                                                <td style={{ padding: '0.85rem' }}>
                                                    <span style={{ padding: '0.3rem 0.65rem', borderRadius: 999, background: 'rgba(217, 152, 0, 0.12)', color: 'var(--primary)', fontWeight: 900, fontSize: '0.78rem' }}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '0.85rem', fontWeight: 900 }}>{formatCurrency(item.amount)}</td>
                                                <td style={{ padding: '0.85rem', color: 'var(--text-muted)' }}>{formatDate(item.createdAt)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </SectionCard>

                        <SectionCard title="Top donantes" subtitle="Mayor aporte histórico aprobado">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                {(dashboard.topDonors || []).length === 0 && <p style={{ color: 'var(--text-muted)', fontWeight: 700 }}>No hay donantes aprobados todavía.</p>}
                                {(dashboard.topDonors || []).map((donor, index) => (
                                    <div key={`${donor.donorName}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem', border: '1px solid var(--glass-border)', borderRadius: '0.9rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(217, 152, 0, 0.14)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
                                                {index + 1}
                                            </div>
                                            <div>
                                                <strong>{donor.donorName}</strong>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700 }}>{formatNumber(donor.donations)} donaciones</div>
                                            </div>
                                        </div>
                                        <strong style={{ color: 'var(--primary)' }}>{formatCurrency(donor.amount)}</strong>
                                    </div>
                                ))}
                            </div>
                        </SectionCard>
                    </div>
                </>
            )}

            <style>{`
                @media (max-width: 980px) {
                    .glass-card + .glass-card {}
                    div[style*="grid-template-columns: minmax(0, 1fr) minmax(0, 1fr)"],
                    div[style*="grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr)"] {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default Dashboard;
