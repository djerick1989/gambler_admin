import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Plus, Info, LayoutGrid, List as ListIcon, 
    ChevronRight, Loader2, AlertCircle,
    TrendingUp, Calendar, CreditCard
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { debtService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const DebtList = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [currentSlide, setCurrentSlide] = useState(0);
    const [showCancelled, setShowCancelled] = useState(false);

    useEffect(() => {
        if (user?.gambler?.gamblerId) {
            fetchDebts();
        } else {
            setLoading(false);
        }
    }, [user?.gambler?.gamblerId]);

    const fetchDebts = async () => {
        setLoading(true);
        try {
            const res = await debtService.getByGamblerId(user.gambler.gamblerId);
            if (res.status) {
                setData(res.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return date.toLocaleDateString(i18n.language === 'es' ? 'es-ES' : 'en-US', {
            day: '2-digit',
            month: 'long'
        });
    };

    const formatCurrency = (amount, currency = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD',
        }).format(amount || 0);
    };

    const summaries = Array.isArray(data?.summary) ? data.summary : (data?.summary ? [data.summary] : []);

    useEffect(() => {
        if (summaries.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % summaries.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [summaries.length]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <Loader2 size={48} className="animate-spin" color="var(--primary)" />
            </div>
        );
    }
    const allDebts = data?.debts || [];
    const debts = allDebts.filter(debt => showCancelled ? debt.status === 'Cancelled' : debt.status === 'Active');

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '5rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '500', margin: 0, color: 'var(--text-muted)' }}>
                        {t('debts.hello')}
                    </h2>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: '900', margin: 0, color: 'var(--text-main)' }}>
                        {user?.name}!
                    </h1>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button 
                        onClick={() => navigate('/customer/debts/new')}
                        className="btn-icon" 
                        style={{ background: 'var(--primary)', color: 'white', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', boxShadow: '0 4px 10px rgba(212, 144, 0, 0.3)' }}
                    >
                        <Plus size={24} strokeWidth={3} />
                    </button>
                    <button 
                        onClick={() => navigate('/customer/debts/policy')}
                        className="btn-icon" 
                        style={{ background: 'white', color: 'var(--primary)', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--glass-border)', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}
                    >
                        <Info size={24} strokeWidth={3} />
                    </button>
                </div>
            </div>

            {/* Summary Cards Container (Slider) */}
            <div style={{ position: 'relative', overflow: 'hidden', marginBottom: '2.5rem', borderRadius: '1.5rem', boxShadow: '0 15px 30px rgba(212, 144, 0, 0.25)' }}>
                <div style={{ 
                    display: 'flex', 
                    transition: 'transform 0.5s ease-in-out', 
                    transform: `translateX(-${currentSlide * 100}%)` 
                }}>
                    {summaries.map((summary, index) => (
                        <div key={index} className="glass-card" style={{ 
                            minWidth: '100%',
                            background: 'linear-gradient(135deg, #FFB82E 0%, #D49000 100%)',
                            padding: '2rem',
                            color: 'var(--text-main)',
                            position: 'relative',
                            overflow: 'hidden',
                            border: 'none'
                        }}>
                            <div style={{ position: 'relative', zIndex: 1, paddingBottom: summaries.length > 1 ? '1.5rem' : '0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800' }}>
                                        {summary.currency || t('debts.summary')}
                                    </h3>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div>
                                        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700', opacity: 0.8 }}>{t('debts.monthly_pago')}:</p>
                                        <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '900' }}>{formatCurrency(summary.totalMonthlyPayment, summary.currency)}</p>
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700', opacity: 0.8 }}>{t('debts.total_to_pay')}:</p>
                                        <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '900' }}>{formatCurrency(summary.totalBalance, summary.currency)}</p>
                                    </div>
                                </div>
                                {summary.nextPaymentCreditor && (
                                    <div style={{ borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '1rem' }}>
                                        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700', opacity: 0.8 }}>{t('debts.next_pago')}:</p>
                                        <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800' }}>
                                            {formatCurrency(summary.nextPaymentAmount, summary.currency)} 
                                            {summary.nextPaymentDate && ` (${formatDate(summary.nextPaymentDate)})`}
                                            {` - ${summary.nextPaymentCreditor}`}
                                        </p>
                                    </div>
                                )}
                            </div>
                            {/* Decorative circles */}
                            <div style={{ position: 'absolute', right: '-50px', top: '-50px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', zIndex: 0 }}></div>
                            <div style={{ position: 'absolute', left: '-20px', bottom: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', zIndex: 0 }}></div>
                        </div>
                    ))}
                </div>

                {/* Slider Indicators */}
                {summaries.length > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', position: 'absolute', bottom: '1rem', width: '100%', zIndex: 2 }}>
                        {summaries.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentSlide(index)}
                                aria-label={`Go to slide ${index + 1}`}
                                style={{
                                    width: currentSlide === index ? '24px' : '8px',
                                    height: '8px',
                                    borderRadius: '4px',
                                    background: currentSlide === index ? 'white' : 'rgba(255,255,255,0.5)',
                                    border: 'none',
                                    transition: 'all 0.3s ease',
                                    cursor: 'pointer',
                                    padding: 0
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-muted)' }}>{t('debts.sort_by', 'Sort by:')}</span>
                    <div className="glass-card" style={{ padding: '0.5rem', display: 'flex', gap: '0.5rem', borderRadius: '0.75rem' }}>
                        <button 
                            onClick={() => setViewMode('grid')}
                            style={{ background: viewMode === 'grid' ? 'var(--primary)' : 'transparent', color: viewMode === 'grid' ? 'white' : 'var(--text-muted)', border: 'none', padding: '0.4rem', borderRadius: '0.5rem', cursor: 'pointer' }}
                        >
                            <LayoutGrid size={20} />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            style={{ background: viewMode === 'list' ? 'var(--primary)' : 'transparent', color: viewMode === 'list' ? 'white' : 'var(--text-muted)', border: 'none', padding: '0.4rem', borderRadius: '0.5rem', cursor: 'pointer' }}
                        >
                            <ListIcon size={20} />
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-muted)' }}>{t('debts.show_debts', 'Mostrar deudas:')}</span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={() => setShowCancelled(false)}
                            style={{ 
                                padding: '0.5rem 1rem', 
                                borderRadius: '0.5rem', 
                                border: 'none', 
                                background: !showCancelled ? 'var(--primary)' : 'rgba(0,0,0,0.05)', 
                                color: !showCancelled ? 'white' : 'var(--text-muted)',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {t('debts.active', 'Activas')}
                        </button>
                        <button
                            onClick={() => setShowCancelled(true)}
                            style={{ 
                                padding: '0.5rem 1rem', 
                                borderRadius: '0.5rem', 
                                border: 'none', 
                                background: showCancelled ? 'var(--primary)' : 'rgba(0,0,0,0.05)', 
                                color: showCancelled ? 'white' : 'var(--text-muted)',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {t('common.cancelled', 'Canceladas')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Debts List */}
            {debts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', opacity: 0.6 }}>
                    <AlertCircle size={48} style={{ marginBottom: '1rem' }} />
                    <p style={{ fontSize: '1.25rem', fontWeight: '700' }}>{showCancelled ? t('debts.no_cancelled_debts') : t('debts.no_debts')}</p>
                </div>
            ) : (
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(280px, 1fr))' : '1fr', 
                    gap: '1.25rem' 
                }}>
                    {debts.map(debt => {
                        const progress = debt.status === 'Cancelled' ? 100 : Math.min(100, Math.max(0, 100 - (debt.currentBalance / debt.initialAmount * 100)));
                        
                        return (
                            <div 
                                key={debt.id} 
                                className="glass-card clickable"
                                onClick={() => navigate(`/customer/debts/edit/${debt.id}`)}
                                style={{ 
                                    padding: '1.5rem', 
                                    borderRadius: '1.25rem',
                                    position: 'relative',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    border: debt.status === 'Cancelled' ? '1px solid #27AE60' : '1px solid var(--glass-border)'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800' }}>{debt.creditor}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                                            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)' }}>{t('debts.installment')}:</span>
                                            <span style={{ fontSize: '0.9rem', fontWeight: '900' }}>{formatCurrency(debt.monthlyInstallment, debt.currency)}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Circular Progress */}
                                    <div style={{ position: 'relative', width: '56px', height: '56px' }}>
                                        <svg width="56" height="56" viewBox="0 0 56 56">
                                            <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="6" />
                                            <circle 
                                                cx="28" cy="28" r="24" fill="none" stroke={progress > 90 ? '#27AE60' : 'var(--primary)'} 
                                                strokeWidth="6" strokeDasharray={`${2 * Math.PI * 24}`} 
                                                strokeDashoffset={`${2 * Math.PI * 24 * (1 - progress / 100)}`}
                                                strokeLinecap="round"
                                                style={{ transition: 'stroke-dashoffset 1s ease-in-out', transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                                            />
                                            <text x="28" y="32" textAnchor="middle" style={{ fontSize: '0.75rem', fontWeight: '900', fill: 'var(--text-main)' }}>
                                                {Math.round(progress)} %
                                            </text>
                                        </svg>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '1.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                        <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>{t('debts.next_payment_date')}:</span>
                                        <span style={{ fontWeight: '700' }}>{new Date(debt.loanDate).toLocaleDateString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                        <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>{t('debts.current_balance')}:</span>
                                        <span style={{ fontWeight: '700' }}>{formatCurrency(debt.currentBalance, debt.currency)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                        <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>{t('debts.monthly_interest')}:</span>
                                        <span style={{ fontWeight: '700' }}>{(debt.annualInterestRate / 12).toFixed(1)} %</span>
                                    </div>
                                </div>
                                
                                <div style={{ position: 'absolute', right: '1rem', bottom: '1rem' }}>
                                    <ChevronRight size={20} color="var(--text-muted)" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default DebtList;
