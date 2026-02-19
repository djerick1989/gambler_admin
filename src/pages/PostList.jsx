import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Loader2, MessageSquare, Search, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { postService, statusService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import CreatePostSection from '../components/CreatePostSection';
import Modal from '../components/Modal';
import PostForm from './PostForm';
import { useTranslation } from 'react-i18next';
import StoryCarousel from '../components/StoryCarousel';
import CreateStoryModal from '../components/CreateStoryModal';
import StoryViewer from '../components/StoryViewer';

const LANGUAGE_IDS = {
    en: '11e8ba3a-b290-4a2c-9dad-0f40e457f72c',
    es: '6892a523-0dc1-4e3b-9ddd-c9a558c7920b'
};

const PostList = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 25,
        totalRecords: 0,
        lastPage: 1
    });
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [shouldAutoOpenMedia, setShouldAutoOpenMedia] = useState(false);
    const [isCreateStoryModalOpen, setIsCreateStoryModalOpen] = useState(false);
    const [selectedStory, setSelectedStory] = useState(null);
    const [allStories, setAllStories] = useState([]);
    const [isStoryViewerOpen, setIsStoryViewerOpen] = useState(false);
    const [loadingStories, setLoadingStories] = useState(true);

    const isAdmin = user?.role === 1 || user?.role === 2;

    useEffect(() => {
        if (user?.userId) {
            fetchPosts(1, true);
            fetchStories();
        }
    }, [user?.userId, i18n.language]);

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
            setError("Failed to load posts");
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const handleLoadMore = () => {
        if (pagination.page < pagination.lastPage) {
            fetchPosts(pagination.page + 1);
        }
    };

    const handleDelete = async (postId) => {
        if (window.confirm(t('common.delete_confirm') || 'Are you sure you want to delete this post?')) {
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
                    onClick={() => {
                        setShouldAutoOpenMedia(false);
                        setIsCreateModalOpen(true);
                    }}
                    onMediaClick={() => {
                        setShouldAutoOpenMedia(true);
                        setIsCreateModalOpen(true);
                    }}
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
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setShouldAutoOpenMedia(false);
                }}
                title={t('posts.add_new') || 'Add New Post'}
                maxWidth="800px"
            >
                <PostForm
                    autoOpenMedia={shouldAutoOpenMedia}
                    onSuccess={() => {
                        setIsCreateModalOpen(false);
                        setShouldAutoOpenMedia(false);
                        fetchPosts(1, true);
                    }}
                />
            </Modal>

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
                        {posts.map(post => (
                            <PostCard
                                key={post.postId}
                                post={post}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>

                    {pagination.page < pagination.lastPage && (
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem', marginBottom: '3rem' }}>
                            <button
                                onClick={handleLoadMore}
                                disabled={loadingMore}
                                className="btn"
                                style={{
                                    background: '#f1f5f9',
                                    color: 'var(--text-main)',
                                    border: '1px solid var(--stroke)',
                                    padding: '0.75rem 2rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                {loadingMore && <Loader2 size={18} className="animate-spin" />}
                                {t('common.load_more') || 'Load more posts'}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default PostList;
