import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, MessageSquare, AlertCircle, MessageCircle } from 'lucide-react';
import { gamblerService, postService, chatService } from '../services/api';
import PostCard from '../components/PostCard';
import { useTranslation } from 'react-i18next';
import UserAvatar from '../components/UserAvatar';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

const LANGUAGE_IDS = {
    en: '11e8ba3a-b290-4a2c-9dad-0f40e457f72c',
    es: '6892a523-0dc1-4e3b-9ddd-c9a558c7920b'
};

/**
 * El mismo ancho que el muro.
 *
 * Esta pantalla no lo tenia y se estiraba hasta donde diera la ventana, asi que las mismas
 * publicaciones se veian anchas aqui y estrechas en el muro. Al pasar de una a otra parecian dos
 * sitios distintos, y la ficha de la persona quedaba como una franja casi vacia.
 */
const ANCHO_COLUMNA = { maxWidth: '800px', margin: '0 auto' };

const UserProfileView = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();

    const [gambler, setGambler] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [errorAlCargarMas, setErrorAlCargarMas] = useState(false);
    const cargandoMasRef = useRef(false);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 10,
        totalRecords: 0,
        lastPage: 1
    });

    useEffect(() => {
        if (userId) {
            fetchProfile();
            fetchPosts(1, true);
        }
    }, [userId, i18n.language]);

    const fetchProfile = async () => {
        try {
            const response = await gamblerService.getGamblerByUserId(userId);
            if (response.status) {
                setGambler(response.data);
            }
        } catch (err) {
            console.error("Error fetching profile:", err);
            setError("Error loading profile");
        }
    };

    const fetchPosts = async (page, reset = false) => {
        if (reset) setLoadingPosts(true);
        else setLoadingMore(true);

        try {
            const lang = i18n.language.substring(0, 2).toLowerCase();
            const languageId = LANGUAGE_IDS[lang] || LANGUAGE_IDS.en;

            const response = await postService.getPostsByUserId(userId, page, pagination.pageSize, languageId);
            if (response.status) {
                // Una respuesta buena borra el fallo anterior; ver la misma nota en PostList.
                setErrorAlCargarMas(false);

                if (reset) {
                    setPosts(response.data.posts);
                } else {
                    setPosts(prev => [...prev, ...response.data.posts]);
                }

                setPagination({
                    page: response.data.page,
                    pageSize: response.data.pageSize,
                    totalRecords: response.data.totalRecords,
                    lastPage: response.data.lastPage
                });
            }
        } catch (err) {
            console.error("Error fetching user posts:", err);
            if (!reset) setErrorAlCargarMas(true);
        } finally {
            setLoading(false);
            setLoadingPosts(false);
            setLoadingMore(false);
            cargandoMasRef.current = false;
        }
    };

    const hayMas = pagination.page < pagination.lastPage;

    const handleLoadMore = () => {
        if (!hayMas || cargandoMasRef.current) return;

        cargandoMasRef.current = true;
        setErrorAlCargarMas(false);
        fetchPosts(pagination.page + 1);
    };

    const { centinelaRef, soportado: scrollInfinitoDisponible } = useInfiniteScroll({
        hasMore: hayMas && !errorAlCargarMas,
        loading: loadingMore,
        onLoadMore: handleLoadMore
    });

    if (loading) {
        return (
            <div style={{ ...ANCHO_COLUMNA, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <Loader2 size={48} className="animate-spin" color="var(--primary)" />
            </div>
        );
    }

    if (!gambler) {
        return (
            <div style={{ ...ANCHO_COLUMNA, margin: '2rem auto' }} className="glass-card">
                <div style={{ padding: '3rem', textAlign: 'center' }}>
                    <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
                    <h3 style={{ color: 'var(--text-main)' }}>{t('user_profile.not_found')}</h3>
                    <button onClick={() => navigate(-1)} className="btn btn-primary" style={{ marginTop: '1rem' }}>
                        {t('common.back')}
                    </button>
                </div>
            </div>
        );
    }

    const apodo = gambler.user?.nickName || t('common.unknown', 'Usuario');
    const esPremium = gambler.user?.isPremium ?? gambler.user?.IsPremium ?? false;

    return (
        <div className="animate-fade-in" style={ANCHO_COLUMNA}>
            <style>{`
                /* index.css fija el tamano de todos los h1 con !important, asi que un tamano en
                   linea aqui no hacia nada: el titulo salia a 30 px y dominaba la pantalla. Se
                   sobreescribe con un selector mas especifico en vez de renunciar al h1, que es
                   el encabezado real de esta pagina. */
                .perfil-cabecera h1 { font-size: 1.5rem !important; }

                /* En una columna estrecha ya no caben el avatar y el texto uno al lado del otro:
                   ahi se apilan y se centran. */
                @media (max-width: 768px) {
                    .perfil-cabecera { flex-direction: column; align-items: center; text-align: center; }
                    .perfil-cabecera .perfil-acciones { justify-content: center; }
                }
            `}</style>

            <div style={{ marginBottom: '2rem' }}>
                <button
                    onClick={() => navigate(-1)}
                    className="btn-back-premium"
                    style={{ marginBottom: '1.5rem' }}
                    title={t('common.back', 'Volver')}
                >
                    <ArrowLeft size={20} />
                </button>

                <div
                    className="glass-card perfil-cabecera"
                    style={{ padding: '1.75rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}
                >
                    {/* El mismo avatar que en el resto de la aplicacion. Antes era un circulo escrito
                        a mano aqui, con otro gris y otro grosor de borde que los del muro. */}
                    <UserAvatar avatar={gambler.user?.avatar} isPremium={esPremium} size={96} alt={apodo} />

                    <div style={{ minWidth: 0, flex: 1 }}>
                        {/* La aplicación identifica a las personas por su apodo; el nombre real
                            solo lo conoce su dueño. */}
                        <h1 style={{
                            fontSize: '1.5rem',
                            fontWeight: '800',
                            margin: 0,
                            color: 'var(--text-main)',
                            // Un apodo largo y sin espacios se salia de la tarjeta.
                            overflowWrap: 'anywhere'
                        }}>
                            @{apodo}
                        </h1>

                        <p style={{ margin: '0.25rem 0 0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            {t('user_profile.post_count', { count: pagination.totalRecords })}
                        </p>

                        <div
                            style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '0.95rem' }}
                            dangerouslySetInnerHTML={{ __html: gambler.biography || `<p>${t('user_profile.no_bio')}</p>` }}
                        />

                        <div className="perfil-acciones" style={{ display: 'flex', marginTop: '1rem' }}>
                            <button
                                onClick={async () => {
                                    try {
                                        const response = await chatService.createDirectChat(userId);
                                        if (response.status) {
                                            navigate(`/chat/${response.data}`);
                                        }
                                    } catch (err) {
                                        console.error("Error creating chat:", err);
                                    }
                                }}
                                // Sin color propio: el verde de antes es el que la aplicacion usa
                                // para "correcto" o "aprobado", en ningun otro sitio para un boton
                                // de accion, y aqui desentonaba con todo lo demas.
                                className="btn btn-primary"
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.35rem' }}
                            >
                                <MessageCircle size={18} />
                                {t('common.chat')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Posts List */}
            <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '1.5rem' }}>
                    {t('user_profile.posts_by', { name: apodo })}
                </h2>

                {loadingPosts ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                        <Loader2 className="animate-spin" color="var(--primary)" />
                    </div>
                ) : posts.length === 0 ? (
                    <div className="glass-card" style={{ padding: '4rem', textAlign: 'center' }}>
                        <MessageSquare size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.5 }} />
                        <h3 style={{ color: 'var(--text-muted)' }}>{t('posts.empty')}</h3>
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {posts.map((post, indice) => (
                                <PostCard
                                    key={post.postId}
                                    post={post}
                                    // Las primeras estan a la vista al abrir, igual que en el muro.
                                    priority={indice < 2}
                                // Public view - no edit/delete actions normally, or they will be handled by PostCard internal check
                                />
                            ))}
                        </div>

                        {/* Marca el final de la lista: al acercarse a la pantalla se pide mas. */}
                        <div ref={centinelaRef} aria-hidden="true" />

                        {hayMas && (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '0.6rem',
                                minHeight: '4rem',
                                marginBottom: '2rem',
                                color: 'var(--text-muted)',
                                fontSize: '0.875rem'
                            }}>
                                {loadingMore && (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        {t('posts.loading_more')}
                                    </>
                                )}

                                {!loadingMore && (errorAlCargarMas || !scrollInfinitoDisponible) && (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                        {errorAlCargarMas && <span>{t('posts.load_more_error')}</span>}
                                        <button
                                            onClick={handleLoadMore}
                                            className="btn"
                                            style={{
                                                background: '#f1f5f9',
                                                color: 'var(--text-main)',
                                                border: '1px solid var(--stroke)',
                                                padding: '0.75rem 2rem'
                                            }}
                                        >
                                            {t('common.load_more')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default UserProfileView;
