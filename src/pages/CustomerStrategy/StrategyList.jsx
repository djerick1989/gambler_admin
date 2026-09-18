import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Plus, ThumbsUp, ThumbsDown, Loader2, AlertCircle,
    TrendingUp, ChevronRight, Bookmark, BookmarkCheck, Search
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { strategyService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { getLanguageId } from '../../utils/languages';
import { confirmDialog } from '../../utils/dialog';
import { getApiErrorMessage } from '../../utils/subscription';
import SubscriptionGate from '../../components/SubscriptionGate';
import UserAvatar from '../../components/UserAvatar';

const StrategyList = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { user, isSubscribed } = useAuth();
    const { addToast } = useNotification();
    
    const [strategies, setStrategies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('own'); // 'own' or 'popular'
    const [tabResolved, setTabResolved] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [ownTotal, setOwnTotal] = useState(0);
    const [popularTotal, setPopularTotal] = useState(0);
    const [savedTotal, setSavedTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [subscriptionGateOpen, setSubscriptionGateOpen] = useState(false);

    const gamblerId = user?.gambler?.gamblerId;

    // Al entrar se abre la pestaña que tiene algo que enseñar. Quien llega por primera vez no tiene
    // estrategias propias, y recibirle con una pantalla vacía es la peor presentación posible de una
    // sección cuyo valor está justo en lo que ha escrito el resto de la gente.
    useEffect(() => {
        if (!gamblerId) {
            setTabResolved(true);
            return;
        }

        let cancelado = false;

        (async () => {
            try {
                const languageId = getLanguageId(i18n.language);
                const res = await strategyService.getMyStrategies(gamblerId, 1, 1, languageId);
                if (cancelado) return;

                const propias = res?.status ? (res.data?.totalRecords || 0) : 0;
                setOwnTotal(propias);
                if (propias === 0) setTab('popular');
            } catch (err) {
                // Si esta consulta falla se queda en la pestaña por defecto: el error de verdad lo
                // reportará la carga siguiente, no hace falta duplicarlo aquí.
                console.error(err);
            } finally {
                if (!cancelado) setTabResolved(true);
            }
        })();

        return () => { cancelado = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gamblerId]);

    useEffect(() => {
        if (!tabResolved) return;

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
    }, [gamblerId, tab, i18n.language, tabResolved]);

    const fetchStrategies = async (currentPage = 1, reset = false) => {
        if (!gamblerId) return;
        setLoading(true);
        try {
            let res;
            const languageId = getLanguageId(i18n.language);
            if (tab === 'own') {
                res = await strategyService.getMyStrategies(gamblerId, currentPage, 10, languageId);
            } else if (tab === 'saved') {
                res = await strategyService.getSavedStrategies(gamblerId, currentPage, 10, languageId);
            } else {
                // El gamblerId va en la consulta para que el backend diga si ya votaste y si la guardaste.
                res = await strategyService.getPopularStrategies(currentPage, 10, languageId, gamblerId);
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
                else if (tab === 'saved') setSavedTotal(total);
                else setPopularTotal(total);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Retirar el voto es directo; emitirlo o cambiarlo pide confirmación.
    //
    // La asimetría es deliberada: un voto queda asociado a la persona y visible en la lista de
    // quiénes votaron, así que un toque accidental no debería registrarlo. Deshacer, en cambio, no
    // necesita fricción: nadie retira un voto sin querer.
    const handleVote = async (e, strategy, isPositive) => {
        e.stopPropagation();
        if (!gamblerId) return;

        const retirando = strategy.myVote === isPositive;

        if (!retirando) {
            const cambiando = strategy.myVote != null;
            const mensaje = cambiando
                ? t(isPositive ? 'strategies.confirm_change_to_up' : 'strategies.confirm_change_to_down')
                : t(isPositive ? 'strategies.confirm_vote_up' : 'strategies.confirm_vote_down');

            if (!(await confirmDialog(mensaje))) return;
        }

        try {
            const res = retirando
                ? await strategyService.removeVote(strategy.id, gamblerId)
                : await strategyService.voteStrategy(strategy.id, { gamblerId, isPositive });

            if (!res.status) {
                // El motivo lo sabe el servidor: repetirlo ayuda mucho más que un "error" genérico.
                addToast('error', getApiErrorMessage(res, t('strategies.vote_error', 'Error sending vote')));
                return;
            }

            setStrategies(prev => prev.map(s => {
                if (s.id !== strategy.id) return s;
                return {
                    ...s,
                    myVote: retirando ? null : isPositive,
                    positiveVotes: res.data?.positiveVotes ?? s.positiveVotes,
                    negativeVotes: res.data?.negativeVotes ?? s.negativeVotes
                };
            }));
        } catch (err) {
            console.error(err);
            addToast('error', getApiErrorMessage(err, t('strategies.vote_error', 'Error sending vote')));
        }
    };

    // El backend ya devuelve la traducción del idioma pedido, con respaldo al original si falta.
    // Aun así se elige aquí por idioma en vez de tomar la primera: si algún día llegan varias, la
    // que se muestre no puede depender del orden en que vinieran.
    const getTranslation = (strategy) => {
        const traducciones = strategy.translations || [];
        if (traducciones.length === 0) return { title: '', description: '' };

        const idiomaActual = getLanguageId(i18n.language);
        return traducciones.find(t => t.languageId === idiomaActual) || traducciones[0];
    };

    const handleToggleSave = async (e, strategy) => {
        e.stopPropagation();
        if (!gamblerId) return;

        try {
            const res = strategy.isSaved
                ? await strategyService.unsaveStrategy(strategy.id, gamblerId)
                : await strategyService.saveStrategy(strategy.id, gamblerId);

            if (!res.status) {
                addToast('error', getApiErrorMessage(res, t('strategies.save_error')));
                return;
            }

            setStrategies(prev => prev.map(s => (
                s.id === strategy.id
                    ? { ...s, isSaved: !strategy.isSaved, savedCount: (s.savedCount || 0) + (strategy.isSaved ? -1 : 1) }
                    : s
            )));
            setSavedTotal(prev => Math.max(0, prev + (strategy.isSaved ? -1 : 1)));
            addToast('success', strategy.isSaved ? t('strategies.unsaved') : t('strategies.saved'));
        } catch (err) {
            console.error(err);
            addToast('error', getApiErrorMessage(err, t('strategies.save_error')));
        }
    };

    // El filtro es sobre lo ya cargado: con estas cantidades no compensa una búsqueda en servidor,
    // y así responde mientras se escribe.
    const terminoBusqueda = search.trim().toLowerCase();
    const strategiesVisibles = terminoBusqueda
        ? strategies.filter(s => {
            const { title, description } = getTranslation(s);
            return `${title} ${description}`.toLowerCase().includes(terminoBusqueda);
        })
        : strategies;

    if (loading && page === 1 && strategies.length === 0) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <Loader2 size={48} className="animate-spin" color="var(--primary)" />
            </div>
        );
    }

    return (
        <div style={{ paddingBottom: '5rem' }}>

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
                            onClick={() => {
                                if (!isSubscribed) {
                                    setSubscriptionGateOpen(true);
                                    return;
                                }
                                navigate('/customer/strategies/new');
                            }}
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
            <div style={{ display: 'flex', marginBottom: '1rem' }} className="glass-card" >
                {[
                    { key: 'own', label: t('strategies.own', 'PROPIAS'), total: ownTotal },
                    { key: 'popular', label: t('strategies.popular', 'POPULARES'), total: popularTotal },
                    { key: 'saved', label: t('strategies.saved_tab'), total: savedTotal }
                ].map(opcion => (
                    <button
                        key={opcion.key}
                        onClick={() => { setTab(opcion.key); setPage(1); setSearch(''); }}
                        style={{
                            flex: 1,
                            padding: '1rem 0.5rem',
                            background: tab === opcion.key ? 'var(--primary)' : 'transparent',
                            border: 'none',
                            borderRadius: tab === opcion.key ? '0.75rem' : '0',
                            color: tab === opcion.key ? 'white' : 'var(--text-muted)',
                            fontWeight: '800',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        {opcion.label} ({opcion.total})
                    </button>
                ))}
            </div>

            {/* Buscador: con pocas estrategias sobra, pero es lo primero que falta al crecer. */}
            {strategies.length > 3 && (
                <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                    <Search
                        size={18}
                        style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                    />
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('strategies.search_placeholder')}
                        style={{
                            width: '100%',
                            padding: '0.85rem 1rem 0.85rem 2.75rem',
                            borderRadius: '0.85rem',
                            border: '1px solid var(--glass-border)',
                            background: 'white',
                            fontWeight: '600'
                        }}
                    />
                </div>
            )}

            {/* Content */}
            {strategiesVisibles.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', opacity: 0.6 }}>
                    <AlertCircle size={48} style={{ marginBottom: '1rem' }} />
                    <p style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                        {terminoBusqueda && strategies.length > 0
                            ? t('strategies.search_empty')
                            : (
                                <>
                                    {tab === 'own' && t('strategies.click_to_add', 'Haz click en el ícono + para agregar una nueva estrategia')}
                                    {tab === 'popular' && t('strategies.empty_popular')}
                                    {tab === 'saved' && t('strategies.empty_saved')}
                                </>
                            )}
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {strategiesVisibles.map(strategy => {
                        const { title, description } = getTranslation(strategy);
                        const esPropia = strategy.gamblerId === gamblerId;
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

                                {!esPropia && strategy.author && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                        <UserAvatar
                                            avatar={strategy.author.avatar}
                                            isPremium={Boolean(strategy.author.isPremium)}
                                            size={26}
                                        />
                                        <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                                            {strategy.author.nickName}
                                        </span>
                                    </div>
                                )}

                                <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text-muted)', fontWeight: '500' }}>
                                    {description}
                                </p>

                                {/* Vote section */}
                                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button
                                            type="button"
                                            onClick={(e) => handleVote(e, strategy, true)}
                                            aria-pressed={strategy.myVote === true}
                                            title={strategy.myVote === true ? t('strategies.vote_remove') : t('strategies.vote_up')}
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: strategy.myVote === true ? '#27AE60' : 'rgba(39,174,96,0.1)', border: 'none', cursor: 'pointer', padding: '0.4rem 0.8rem', borderRadius: '0.75rem', color: strategy.myVote === true ? 'white' : '#27AE60' }}
                                        >
                                            <ThumbsUp size={16} strokeWidth={2.5} />
                                            <span style={{ fontWeight: '800', fontSize: '0.9rem' }}>
                                                {strategy.positiveVotes || 0}
                                            </span>
                                        </button>

                                        <button 
                                            type="button"
                                            onClick={(e) => handleVote(e, strategy, false)}
                                            aria-pressed={strategy.myVote === false}
                                            title={strategy.myVote === false ? t('strategies.vote_remove') : t('strategies.vote_down')}
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: strategy.myVote === false ? '#ef4444' : 'rgba(239,68,68,0.1)', border: 'none', cursor: 'pointer', padding: '0.4rem 0.8rem', borderRadius: '0.75rem', color: strategy.myVote === false ? 'white' : '#ef4444' }}
                                        >
                                            <span style={{ fontWeight: '800', fontSize: '0.9rem' }}>
                                                {strategy.negativeVotes || 0}
                                            </span>
                                            <ThumbsDown size={16} strokeWidth={2.5} />
                                        </button>

                                        {/* Ver quién votó deja de ser un control dentro de otro. */}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/customer/strategies/${strategy.id}/voters`);
                                            }}
                                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontWeight: '700', fontSize: '0.8rem', padding: '0.4rem' }}
                                        >
                                            {t('strategies.voters')}
                                        </button>
                                    </div>

                                    {/* Guardar una estrategia ajena: el punto de leer lo que a otro le
                                        funcionó es poder usarlo cuando haga falta. */}
                                    {!esPropia && (
                                        <button
                                            type="button"
                                            onClick={(e) => handleToggleSave(e, strategy)}
                                            aria-pressed={!!strategy.isSaved}
                                            title={strategy.isSaved ? t('strategies.unsave_action') : t('strategies.save_action')}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.4rem',
                                                background: strategy.isSaved ? 'var(--primary)' : 'rgba(212,144,0,0.1)',
                                                color: strategy.isSaved ? 'white' : 'var(--primary)',
                                                border: 'none',
                                                cursor: 'pointer',
                                                padding: '0.4rem 0.8rem',
                                                borderRadius: '0.75rem',
                                                fontWeight: '800',
                                                fontSize: '0.8rem'
                                            }}
                                        >
                                            {strategy.isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                                            {strategy.isSaved ? t('strategies.saved_short') : t('strategies.save_action')}
                                        </button>
                                    )}

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

            <SubscriptionGate
                isOpen={subscriptionGateOpen}
                onClose={() => setSubscriptionGateOpen(false)}
                message={t('subscriptions.strategies_locked')}
            />
        </div>
    );
};

export default StrategyList;
