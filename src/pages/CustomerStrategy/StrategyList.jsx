import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Plus, ThumbsUp, ThumbsDown, Loader2, AlertCircle, 
    TrendingUp, ChevronRight
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { strategyService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { getLanguageId } from '../../utils/languages';

const StrategyList = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addToast } = useNotification();
    
    const [strategies, setStrategies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('own'); // 'own' or 'popular'
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [ownTotal, setOwnTotal] = useState(0);
    const [popularTotal, setPopularTotal] = useState(0);

    const gamblerId = user?.gambler?.gamblerId;

    useEffect(() => {
        if (gamblerId) {
            fetchStrategies(1, true);
            // Fetch the other tab's total so the banner always shows both counts
            const languageId = getLanguageId(i18n.language);
            if (tab === 'own') {
                strategyService.getPopularStrategies(1, 1, languageId)
                    .then(res => { if (res.status && res.data) setPopularTotal(res.data.totalRecords || 0); })
                    .catch(() => {});
            } else {
                strategyService.getMyStrategies(gamblerId, 1, 1, languageId)
                    .then(res => { if (res.status && res.data) setOwnTotal(res.data.totalRecords || 0); })
                    .catch(() => {});
            }
        } else {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gamblerId, tab, i18n.language]);

    const fetchStrategies = async (currentPage = 1, reset = false) => {
        if (!gamblerId) return;
        setLoading(true);
        try {
            let res;
            const languageId = getLanguageId(i18n.language);
            if (tab === 'own') {
                res = await strategyService.getMyStrategies(gamblerId, currentPage, 10, languageId);
            } else {
                res = await strategyService.getPopularStrategies(currentPage, 10, languageId);
            }

            if (res.status && res.data) {
                const newStrats = res.data.strategies || [];
                if (reset) {
                    setStrategies(newStrats);
                } else {
                    setStrategies(prev => [...prev, ...newStrats]);
                }
                setHasMore(currentPage < res.data.lastPage);
                const total = res.data.totalRecords || 0;
                if (tab === 'own') setOwnTotal(total);
                else setPopularTotal(total);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async (e, strategyId, isPositive) => {
        e.stopPropagation();
        if (!gamblerId) return;
        
        try {
            const res = await strategyService.voteStrategy(strategyId, {
                gamblerId,
                isPositive
            });
            if (res.status) {
                const updatedStrats = strategies.map(s => {
                    if (s.id === strategyId) {
                        return {
                            ...s,
                            positiveVotes: res.data.positiveVotes,
                            negativeVotes: res.data.negativeVotes
                        };
                    }
                    return s;
                });
                setStrategies(updatedStrats);
            }
        } catch (err) {
            console.error(err);
            addToast("error", t('strategies.vote_error', 'Error sending vote'));
        }
    };

    const getTranslation = (strategy) => {
        if (!strategy.translations || strategy.translations.length === 0) return { title: '', description: '' };
        return strategy.translations[0];
    };

    if (loading && page === 1 && strategies.length === 0) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <Loader2 size={48} className="animate-spin" color="var(--primary)" />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '5rem' }}>

            {/* Hero Banner */}
            <div style={{ 
                borderRadius: '1.5rem', 
                background: 'linear-gradient(135deg, #FFB82E 0%, #D49000 100%)',
                padding: '2rem',
                marginBottom: '2.5rem',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 15px 30px rgba(212, 144, 0, 0.25)'
            }}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)' }}>
                            {t('strategies.title', 'Estrategias')}
                        </h3>
                        <button
                            onClick={() => navigate('/customer/strategies/new')}
                            style={{ background: 'rgba(0,0,0,0.15)', color: 'var(--text-main)', borderRadius: '50%', width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', flexShrink: 0, backdropFilter: 'blur(4px)' }}
                        >
                            <Plus size={22} strokeWidth={3} />
                        </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700', opacity: 0.8 }}>{t('strategies.own', 'PROPIAS')}:</p>
                            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '900' }}>
                                {ownTotal}
                            </p>
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700', opacity: 0.8 }}>{t('strategies.popular', 'POPULARES')}:</p>
                            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '900' }}>
                                {popularTotal}
                            </p>
                        </div>
                    </div>
                    <div style={{ borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '1rem', marginTop: '1rem' }}>
                        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700', opacity: 0.8 }}>
                            {tab === 'own' 
                                ? t('strategies.my_strategies_hint', 'Comparte tus estrategias con la comunidad') 
                                : t('strategies.popular_hint', 'Descubre las estrategias más votadas')
                            }
                        </p>
                    </div>
                </div>
                {/* Decorative circles */}
                <div style={{ position: 'absolute', right: '-50px', top: '-50px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', zIndex: 0 }}></div>
                <div style={{ position: 'absolute', left: '-20px', bottom: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', zIndex: 0 }}></div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', marginBottom: '1.5rem' }} className="glass-card" >
                <button
                    onClick={() => { setTab('own'); setPage(1); }}
                    style={{
                        flex: 1,
                        padding: '1rem',
                        background: tab === 'own' ? 'var(--primary)' : 'transparent',
                        border: 'none',
                        borderRadius: tab === 'own' ? '0.75rem' : '0',
                        color: tab === 'own' ? 'white' : 'var(--text-muted)',
                        fontWeight: '800',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    {t('strategies.own', 'PROPIAS')} ({ownTotal})
                </button>
                <button
                    onClick={() => { setTab('popular'); setPage(1); }}
                    style={{
                        flex: 1,
                        padding: '1rem',
                        background: tab === 'popular' ? 'var(--primary)' : 'transparent',
                        border: 'none',
                        borderRadius: tab === 'popular' ? '0.75rem' : '0',
                        color: tab === 'popular' ? 'white' : 'var(--text-muted)',
                        fontWeight: '800',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    {t('strategies.popular', 'POPULARES')} ({popularTotal})
                </button>
            </div>

            {/* Content */}
            {strategies.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', opacity: 0.6 }}>
                    <AlertCircle size={48} style={{ marginBottom: '1rem' }} />
                    <p style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                        {t('strategies.click_to_add', 'Haz click en el ícono + para agregar una nueva estrategia')}
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {strategies.map(strategy => {
                        const { title, description } = getTranslation(strategy);
                        const totalVotes = (strategy.positiveVotes || 0) + (strategy.negativeVotes || 0);
                        const positiveRatio = totalVotes > 0 ? ((strategy.positiveVotes || 0) / totalVotes) * 100 : 0;

                        return (
                            <div 
                                key={strategy.id} 
                                className="glass-card"
                                style={{ 
                                    padding: '1.5rem', 
                                    borderRadius: '1.25rem',
                                    position: 'relative',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    border: '1px solid var(--glass-border)',
                                    cursor: tab === 'own' ? 'pointer' : 'default'
                                }}
                                onClick={() => tab === 'own' ? navigate(`/customer/strategies/edit/${strategy.id}`) : null}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', flex: 1, paddingRight: '1rem' }}>
                                        {title}
                                    </h3>
                                    {strategy.isPublic && (
                                        <span style={{ 
                                            fontSize: '0.75rem', fontWeight: '700', 
                                            color: 'var(--primary)', 
                                            background: 'rgba(212,144,0,0.1)', 
                                            padding: '0.2rem 0.6rem', 
                                            borderRadius: '0.5rem',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            <TrendingUp size={12} style={{ marginRight: '0.25rem', display: 'inline' }} />
                                            {t('strategies.public', 'Pública')}
                                        </span>
                                    )}
                                </div>

                                <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text-muted)', fontWeight: '500' }}>
                                    {description}
                                </p>

                                {/* Vote section */}
                                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button 
                                            onClick={(e) => handleVote(e, strategy.id, true)}
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(39,174,96,0.1)', border: 'none', cursor: 'pointer', padding: '0.4rem 0.8rem', borderRadius: '0.75rem', color: '#27AE60' }}
                                        >
                                            <ThumbsUp size={16} strokeWidth={2.5} />
                                            <span style={{ fontWeight: '800', fontSize: '0.9rem' }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/customer/strategies/${strategy.id}/voters`);
                                                }}
                                            >
                                                {strategy.positiveVotes || 0}
                                            </span>
                                        </button>

                                        <button 
                                            onClick={(e) => handleVote(e, strategy.id, false)}
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(239,68,68,0.1)', border: 'none', cursor: 'pointer', padding: '0.4rem 0.8rem', borderRadius: '0.75rem', color: '#ef4444' }}
                                        >
                                            <span style={{ fontWeight: '800', fontSize: '0.9rem' }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/customer/strategies/${strategy.id}/voters`);
                                                }}
                                            >
                                                {strategy.negativeVotes || 0}
                                            </span>
                                            <ThumbsDown size={16} strokeWidth={2.5} />
                                        </button>
                                    </div>

                                    {tab === 'own' && (
                                        <ChevronRight size={20} color="var(--text-muted)" />
                                    )}
                                </div>

                                {/* Vote progress bar */}
                                {totalVotes > 0 && (
                                    <div style={{ marginTop: '0.75rem', height: '4px', background: 'rgba(239,68,68,0.2)', borderRadius: '2px', overflow: 'hidden' }}>
                                        <div style={{ 
                                            height: '100%', 
                                            width: `${positiveRatio}%`, 
                                            background: '#27AE60',
                                            borderRadius: '2px',
                                            transition: 'width 0.5s ease'
                                        }} />
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {hasMore && (
                        <button 
                            onClick={() => {
                                const nextPage = page + 1;
                                setPage(nextPage);
                                fetchStrategies(nextPage);
                            }}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                background: 'rgba(0,0,0,0.05)',
                                color: 'var(--text-main)',
                                border: 'none',
                                borderRadius: '1rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                marginTop: '0.5rem'
                            }}
                        >
                            {t('common.load_more', 'Cargar más')}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default StrategyList;
