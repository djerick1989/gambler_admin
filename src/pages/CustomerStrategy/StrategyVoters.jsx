import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, User, Search, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { strategyService } from '../../services/api';
import { getLanguageId } from '../../utils/languages';

const StrategyVoters = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams();
    
    const [totalLikes, setTotalLikes] = useState(0);
    const [totalDislikes, setTotalDislikes] = useState(0);
    const [likesVoters, setLikesVoters] = useState([]);
    const [dislikesVoters, setDislikesVoters] = useState([]);
    const [likesPage, setLikesPage] = useState(1);
    const [dislikesPage, setDislikesPage] = useState(1);
    const [hasMoreLikes, setHasMoreLikes] = useState(false);
    const [hasMoreDislikes, setHasMoreDislikes] = useState(false);
    const [loadingLikes, setLoadingLikes] = useState(true);
    const [loadingDislikes, setLoadingDislikes] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchStrategyDetails();
        fetchLikes(1, true);
        fetchDislikes(1, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, i18n.language]);

    const fetchStrategyDetails = async () => {
        try {
            const languageId = getLanguageId(i18n.language);
            const res = await strategyService.getStrategyById(id, languageId);
            if (res.status && res.data) {
                setTotalLikes(res.data.positiveVotes || 0);
                setTotalDislikes(res.data.negativeVotes || 0);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchLikes = async (currentPage = 1, reset = false) => {
        setLoadingLikes(true);
        try {
            const languageId = getLanguageId(i18n.language);
            const res = await strategyService.getStrategyVoters(id, true, currentPage, 10, languageId);
            if (res.status && res.data) {
                const newVoters = res.data.voters || [];
                if (reset) {
                    setLikesVoters(newVoters);
                } else {
                    setLikesVoters(prev => [...prev, ...newVoters]);
                }
                setHasMoreLikes(currentPage < res.data.lastPage);
                if (reset) setTotalLikes(res.data.totalRecords || 0);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingLikes(false);
        }
    };

    const fetchDislikes = async (currentPage = 1, reset = false) => {
        setLoadingDislikes(true);
        try {
            const languageId = getLanguageId(i18n.language);
            const res = await strategyService.getStrategyVoters(id, false, currentPage, 10, languageId);
            if (res.status && res.data) {
                const newVoters = res.data.voters || [];
                if (reset) {
                    setDislikesVoters(newVoters);
                } else {
                    setDislikesVoters(prev => [...prev, ...newVoters]);
                }
                setHasMoreDislikes(currentPage < res.data.lastPage);
                if (reset) setTotalDislikes(res.data.totalRecords || 0);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingDislikes(false);
        }
    };

    const filterVoters = (list) => {
        return list.filter(vote => {
            const name = (vote.user?.nickName || vote.user?.name || '').toLowerCase();
            return name.includes(searchTerm.toLowerCase());
        });
    };

    const filteredLikes = filterVoters(likesVoters);
    const filteredDislikes = filterVoters(dislikesVoters);

    const isLoading = loadingLikes && loadingDislikes && likesVoters.length === 0 && dislikesVoters.length === 0;

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <Loader2 size={48} className="animate-spin" color="var(--primary)" />
            </div>
        );
    }

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const options = {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        };
        const datePart = date.toLocaleDateString(i18n.language === 'es' ? 'es-ES' : 'en-US', options);
        const timePart = date.toLocaleTimeString(i18n.language === 'es' ? 'es-ES' : 'en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        return `${datePart}${i18n.language === 'es' ? ' a las ' : ' at '}${timePart}`;
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 1.5rem', paddingBottom: '6rem' }}>
            
            {/* Horizontal Header for Web */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3rem', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <button 
                        onClick={() => navigate(-1)} 
                        className="btn-icon"
                        style={{ 
                            background: 'white', 
                            border: '1px solid var(--glass-border)', 
                            borderRadius: '12px', 
                            width: '40px', 
                            height: '40px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            cursor: 'pointer',
                            color: 'var(--text-main)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                        }}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
                            {t('strategies.voters_title', 'Personas que reaccionaron')}
                        </h1>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: '500' }}>
                           {totalLikes + totalDislikes} {t('strategies.voters_count', 'interacciones totales')}
                        </p>
                    </div>
                </div>

                {/* Global Search Bar */}
                <div style={{ position: 'relative', minWidth: '300px' }}>
                    <Search size={20} style={{ position: 'absolute', left: '1.1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                        type="text" 
                        placeholder={t('common.search_voters', 'Buscar por nombre o apodo...')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ 
                            width: '100%',
                            padding: '0.85rem 1rem 0.85rem 3.25rem', 
                            borderRadius: '14px', 
                            border: '1px solid var(--glass-border)', 
                            background: 'white', 
                            outline: 'none',
                            fontSize: '0.95rem',
                            fontWeight: '600',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>
            </div>

            {/* Two Column Layout for Web */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem' }}>
                
                {/* Column: Likes */}
                <div className="glass-card" style={{ background: 'white', borderRadius: '24px', border: '1px solid var(--glass-border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ 
                        padding: '1.5rem', 
                        borderBottom: '2px solid rgba(39, 174, 96, 0.1)', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        background: 'rgba(39, 174, 96, 0.02)'
                    }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#27AE60', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <span style={{ fontSize: '1.4rem' }}>👍</span>
                            {t('strategies.likes', 'LES GUSTA').toUpperCase()}
                        </h3>
                        <span style={{ background: '#27AE60', color: 'white', padding: '0.2rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '800' }}>
                            {totalLikes}
                        </span>
                    </div>

                    <div style={{ padding: '1.25rem', flex: 1, minHeight: '300px' }}>
                        {filteredLikes.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '4rem 1rem', opacity: 0.5 }}>
                                <User size={40} style={{ marginBottom: '1rem' }} />
                                <p style={{ fontSize: '0.9rem', fontWeight: '600' }}>{t('common.empty', 'Sin reacciones')}</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {filteredLikes.map(vote => (
                                    <VoterCard key={vote.strategyVoteId} vote={vote} t={t} navigate={navigate} formatDate={formatDate} />
                                ))}
                            </div>
                        )}

                        {hasMoreLikes && !searchTerm && (
                            <button 
                                onClick={() => {
                                    const nextPage = likesPage + 1;
                                    setLikesPage(nextPage);
                                    fetchLikes(nextPage);
                                }}
                                style={{
                                    width: '100%', padding: '0.75rem', marginTop: '1.5rem',
                                    background: 'rgba(39, 174, 96, 0.05)', color: '#27AE60',
                                    border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer'
                                }}
                            >
                                {t('common.load_more', 'Cargar más')}
                            </button>
                        )}
                    </div>
                </div>

                {/* Column: Dislikes */}
                <div className="glass-card" style={{ background: 'white', borderRadius: '24px', border: '1px solid var(--glass-border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ 
                        padding: '1.5rem', 
                        borderBottom: '2px solid rgba(239, 68, 68, 0.1)', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        background: 'rgba(239, 68, 68, 0.02)'
                    }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <span style={{ fontSize: '1.4rem' }}>👎</span>
                            {t('strategies.dislikes', 'NO LES GUSTA').toUpperCase()}
                        </h3>
                        <span style={{ background: '#EF4444', color: 'white', padding: '0.2rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '800' }}>
                            {totalDislikes}
                        </span>
                    </div>

                    <div style={{ padding: '1.25rem', flex: 1, minHeight: '300px' }}>
                        {filteredDislikes.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '4rem 1rem', opacity: 0.5 }}>
                                <User size={40} style={{ marginBottom: '1rem' }} />
                                <p style={{ fontSize: '0.9rem', fontWeight: '600' }}>{t('common.empty', 'Sin reacciones')}</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {filteredDislikes.map(vote => (
                                    <VoterCard key={vote.strategyVoteId} vote={vote} t={t} navigate={navigate} formatDate={formatDate} />
                                ))}
                            </div>
                        )}

                        {hasMoreDislikes && !searchTerm && (
                            <button 
                                onClick={() => {
                                    const nextPage = dislikesPage + 1;
                                    setDislikesPage(nextPage);
                                    fetchDislikes(nextPage);
                                }}
                                style={{
                                    width: '100%', padding: '0.75rem', marginTop: '1.5rem',
                                    background: 'rgba(239, 68, 68, 0.05)', color: '#EF4444',
                                    border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer'
                                }}
                            >
                                {t('common.load_more', 'Cargar más')}
                            </button>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

// Helper Sub-component for Voter Cards in Web Layout
const VoterCard = ({ vote, t, navigate, formatDate }) => (
    <div 
        onClick={() => vote.user?.userId && navigate(`/user/${vote.user.userId}`)}
        style={{ 
            padding: '1rem 1.25rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1.25rem',
            background: 'white',
            borderRadius: '16px',
            border: '1px solid var(--glass-border)',
            transition: 'all 0.23s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.06)';
            e.currentTarget.style.borderColor = 'var(--primary)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.borderColor = 'var(--glass-border)';
        }}
    >
        <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '12px', 
            background: vote.user?.avatar ? `url(${vote.user.avatar}) center/cover` : 'var(--glass-bg)',
            border: '2px solid white',
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
            {!vote.user?.avatar && <User size={22} color="var(--text-muted)" />}
        </div>
        <div style={{ overflow: 'hidden', flex: 1 }}>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {vote.user?.nickName || vote.user?.name || t('common.unknown', 'Usuario')}
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem', color: 'var(--text-muted)' }}>
                <Calendar size={14} />
                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '600' }}>
                    {formatDate(vote.createdAt)}
                </p>
            </div>
        </div>
    </div>
);

export default StrategyVoters;
