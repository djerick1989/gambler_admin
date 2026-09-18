import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Loader2, MessageSquare, Search, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { postService, statusService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

import CreatePostSection from '../components/CreatePostSection';
import Modal from '../components/Modal';
import PostForm from './PostForm';
import { useTranslation } from 'react-i18next';
import StoryCarousel from '../components/StoryCarousel';
import CreateStoryModal from '../components/CreateStoryModal';
import StoryViewer from '../components/StoryViewer';
import SubscriptionGate from '../components/SubscriptionGate';
import { FREE_LIMITS } from '../utils/subscription';
import { useNotification } from '../context/NotificationContext';
import { confirmDialog } from '../utils/dialog';


/**
 * Publicaciones cuyas fotos se piden nada mas abrir el muro, sin esperar a comprobar que se ven.
 * Diferir lo que ya esta en pantalla retrasa justo la primera foto, que es la que decide si el muro
 * parece rapido. Del resto se encarga la rejilla, que las pide con varias pantallas de antelacion.
 */
const PUBLICACIONES_INMEDIATAS = 2;

const LANGUAGE_IDS = {
    en: '11e8ba3a-b290-4a2c-9dad-0f40e457f72c',
    es: '6892a523-0dc1-4e3b-9ddd-c9a558c7920b'
};

const PostList = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { user, isSubscribed } = useAuth();
    const { addToast } = useNotification();

    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [errorAlCargarMas, setErrorAlCargarMas] = useState(false);
    const cargandoMasRef = useRef(false);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 25,
        totalRecords: 0,
        lastPage: 1
    });
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [hasDraft, setHasDraft] = useState(false);
    const [shouldAutoOpenMedia, setShouldAutoOpenMedia] = useState(false);
    const [isCreateStoryModalOpen, setIsCreateStoryModalOpen] = useState(false);
    const [selectedStory, setSelectedStory] = useState(null);
    const [allStories, setAllStories] = useState([]);
    const [isStoryViewerOpen, setIsStoryViewerOpen] = useState(false);
    const [loadingStories, setLoadingStories] = useState(true);
    const [ownPostCount, setOwnPostCount] = useState(0);
    const [subscriptionGateOpen, setSubscriptionGateOpen] = useState(false);

// Cerrar con contenido escrito pide confirmacion. El boton de cerrar es intencionado, pero
    // tambien se pulsa por error, y ahi se pierde una publicacion entera.
    const closeCreateModal = async () => {
        if (hasDraft && !(await confirmDialog(t('posts.discard_confirm')))) return;
        setHasDraft(false);
        setIsCreateModalOpen(false);
        setShouldAutoOpenMedia(false);
    };

    const isAdmin = user?.role === 1 || user?.role === 2;

    useEffect(() => {
        if (user?.userId) {
            fetchPosts(1, true);
            fetchStories();
            fetchOwnPostCount();
        }
    }, [user?.userId, i18n.language]);

    const fetchOwnPostCount = async () => {
        if (!user?.userId || isAdmin) return;
        try {
            const response = await postService.getPostsByUserId(user.userId, 1, 1);
            if (response?.status) {
                setOwnPostCount(response.data?.totalRecords || response.data?.posts?.length || 0);
            }
        } catch (error) {
            console.error("Error fetching own post count:", error);
        }
    };

    const openCreatePost = (openMedia = false) => {
        if (!isSubscribed && ownPostCount >= FREE_LIMITS.posts) {
            setSubscriptionGateOpen(true);
            return;
        }
        setShouldAutoOpenMedia(openMedia);
        setIsCreateModalOpen(true);
    };

    const fetchStories = async () => {
        setLoadingStories(true);
        try {
            const response = await statusService.getLatestStatuses(1, 20);
            if (response.status) {
                setAllStories(response.data.statusList);
            }
        } catch (error) {
            console.error("Error fetching statuses:", error);
        } finally {
            setLoadingStories(false);
        }
    };

    const fetchPosts = async (page, reset = false) => {
        if (reset) setLoading(true);
        else setLoadingMore(true);

        try {
            const lang = i18n.language.substring(0, 2).toLowerCase();
            const languageId = LANGUAGE_IDS[lang] || LANGUAGE_IDS.en;

            const response = await postService.getAllPosts(user?.userId, page, pagination.pageSize, languageId);
            if (response.status) {
                // Una respuesta buena borra el fallo anterior. Sin esto, un unico corte de red
                // dejaba el scroll infinito apagado para el resto de la sesion: al marcar el fallo
                // se deja de observar el final de la lista, y nada lo volvia a encender aunque la
                // conexion se recuperara. Quedaba el boton, que es la salida de emergencia, no el
                // comportamiento normal.
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
            console.error("Error fetching posts:", err);

            // Un fallo al traer la primera pagina deja la pantalla vacia y merece el aviso grande.
            // Uno al continuar no: lo que ya se esta leyendo sigue ahi, y basta con parar y ofrecer
            // reintentar donde se quedo.
            if (reset) setError("Failed to load posts");
            else setErrorAlCargarMas(true);
        } finally {
            setLoading(false);
            setLoadingMore(false);
            cargandoMasRef.current = false;
        }
    };

    const hayMas = pagination.page < pagination.lastPage;

    const handleLoadMore = () => {
        if (!hayMas) return;

        // El estado de React tarda un pintado en actualizarse, y el observador puede avisar dos
        // veces antes de eso. Con la referencia el segundo aviso se descarta y no se pide la misma
        // pagina por duplicado.
        if (cargandoMasRef.current) return;

        cargandoMasRef.current = true;
        setErrorAlCargarMas(false);
        fetchPosts(pagination.page + 1);
    };

    // Si la peticion falla se deja de cargar solo. Reintentar automaticamente contra un servidor
    // caido seria machacarlo una vez por cada movimiento del scroll; mejor ofrecer un boton.
    const { centinelaRef, soportado: scrollInfinitoDisponible } = useInfiniteScroll({
        hasMore: hayMas && !errorAlCargarMas,
        loading: loadingMore,
        onLoadMore: handleLoadMore
    });

    const handleDelete = async (postId) => {
        if (await confirmDialog(t('common.delete_confirm') || 'Are you sure you want to delete this post?')) {
            try {
                const response = await postService.deletePost(postId);
                if (response.status) {
                    setPosts(prev => prev.filter(p => p.postId !== postId));
                }
            } catch (err) {
                console.error("Error deleting post:", err);
                alert("Error deleting post");
            }
        }
    };

    const handleEdit = (post) => {
        navigate(`/posts/edit/${post.postId}`);
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <Loader2 size={48} className="animate-spin" color="var(--primary)" />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {!isAdmin && (
                <CreatePostSection
                    onClick={() => openCreatePost(false)}
                    onMediaClick={() => openCreatePost(true)}
                />
            )}

            <StoryCarousel
                statuses={allStories}
                loading={loadingStories}
                onAddStory={() => setIsCreateStoryModalOpen(true)}
                onSelectStory={(story) => {
                    setSelectedStory(story);
                    setIsStoryViewerOpen(true);
                }}
            />

            <CreateStoryModal
                isOpen={isCreateStoryModalOpen}
                onClose={() => setIsCreateStoryModalOpen(false)}
                onSuccess={() => {
                    setIsCreateStoryModalOpen(false);
                    fetchStories();
                }}
            />

            <StoryViewer
                isOpen={isStoryViewerOpen}
                onClose={() => setIsStoryViewerOpen(false)}
                initialStatus={selectedStory}
                allStatuses={allStories}
                onDeleteSuccess={(id) => {
                    setAllStories(prev => prev.filter(s => s.statusId !== id));
                }}
            />

            <Modal
                isOpen={isCreateModalOpen}
                onClose={closeCreateModal}
                // Un clic en la zona gris ya no cierra: escribir una publicación larga y perderla
                // por rozar fuera del recuadro era la peor forma posible de fallar.
                closeOnBackdrop={false}
                title={t('posts.add_new') || 'Add New Post'}
                maxWidth="800px"
            >
                <PostForm
                    autoOpenMedia={shouldAutoOpenMedia}
                    onDirtyChange={setHasDraft}
                    onSuccess={() => {
                        setHasDraft(false);
                        setIsCreateModalOpen(false);
                        setShouldAutoOpenMedia(false);
                        fetchPosts(1, true);
                        fetchOwnPostCount();
                    }}
                />
            </Modal>

            <SubscriptionGate
                isOpen={subscriptionGateOpen}
                onClose={() => setSubscriptionGateOpen(false)}
                message={t('subscriptions.posts_limit', { count: FREE_LIMITS.posts })}
            />

            {error && (
                <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', borderColor: 'var(--danger)' }}>
                    <AlertCircle color="#ef4444" />
                    <span style={{ color: '#ef4444' }}>{error}</span>
                </div>
            )}

            {posts.length === 0 ? (
                <div className="glass-card" style={{ padding: '4rem', textAlign: 'center' }}>
                    <MessageSquare size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.5 }} />
                    <h3 style={{ color: 'var(--text-muted)' }}>{t('posts.empty') || 'No posts found'}</h3>
                </div>
            ) : (
                <>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {posts.map((post, indice) => (
                            <PostCard
                                key={post.postId}
                                post={post}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                priority={indice < PUBLICACIONES_INMEDIATAS}
                            />
                        ))}
                    </div>

                    {/* Elemento vacio que marca el final de la lista. Cuando se acerca a la pantalla,
                        el hook pide la siguiente pagina. No ocupa nada ni se ve. */}
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

                            {/* El boton solo aparece cuando el automatismo no puede hacerse cargo:
                                porque fallo la ultima peticion, o porque el navegador no soporta
                                IntersectionObserver. Nadie se queda sin poder seguir leyendo. */}
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

                    {!hayMas && posts.length > 0 && (
                        <div style={{
                            textAlign: 'center',
                            padding: '2rem 0 3rem',
                            color: 'var(--text-muted)',
                            fontSize: '0.85rem'
                        }}>
                            {t('posts.end_of_feed')}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default PostList;
