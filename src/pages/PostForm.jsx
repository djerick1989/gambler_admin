import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import {
    ChevronLeft, Loader2, Image as ImageIcon,
    Save, X, Type, Video, Plus, Globe
} from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { postService, mediaService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const LANGUAGE_IDS = {
    en: '11e8ba3a-b290-4a2c-9dad-0f40e457f72c',
    es: '6892a523-0dc1-4e3b-9ddd-c9a558c7920b'
};

const SortableMediaItem = ({ media, index, onRemove }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: media.tempId || media.postMediaId });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        position: 'relative',
        aspectRatio: '1/1',
        borderRadius: '0.5rem',
        overflow: 'hidden',
        background: '#000',
        cursor: 'grab',
        touchAction: 'none'
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {media.mediaType === 1 ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Video size={32} color="white" />
                </div>
            ) : (
                <img src={media.mediaUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
            <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => onRemove(index)}
                style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    background: 'rgba(239, 68, 68, 0.8)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <X size={14} />
            </button>
        </div>
    );
};

const PostForm = ({ id: propId, onSuccess, autoOpenMedia }) => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { id: paramId } = useParams();
    const { user } = useAuth();
    const quillRef = useRef(null);

    const id = propId || paramId;
    const isEditing = Boolean(id);
    const isModal = Boolean(onSuccess);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const [loading, setLoading] = useState(isEditing);
    const [saving, setSaving] = useState(false);
    const [uploadingMedia, setUploadingMedia] = useState(false);

    const [formData, setFormData] = useState({
        contentHtml: '',
        languageId: '',
        postMediaList: []
    });

    const isAdmin = user?.role === 1 || user?.role === 2;

    useEffect(() => {
        if (!isEditing && isAdmin) {
            if (!isModal) {
                alert("Admins cannot create new posts");
                navigate('/posts');
            }
            return;
        }

        const lang = i18n.language.substring(0, 2).toLowerCase();
        const defaultLangId = LANGUAGE_IDS[lang] || LANGUAGE_IDS.en;

        if (isEditing) {
            fetchPostDetail(id);
        } else {
            setFormData(prev => ({
                ...prev,
                contentHtml: '', // Reset for new posts
                postMediaList: [],
                languageId: defaultLangId
            }));
        }
    }, [id, isEditing, isAdmin, isModal]); // Removed i18n.language to avoid resetting form data on language switch

    // Separate effect to keep languageId in sync with global language
    useEffect(() => {
        const lang = i18n.language.substring(0, 2).toLowerCase();
        const currentLangId = LANGUAGE_IDS[lang] || LANGUAGE_IDS.en;
        setFormData(prev => ({ ...prev, languageId: currentLangId }));
    }, [i18n.language]);

    useEffect(() => {
        if (autoOpenMedia && !isEditing) {
            const timer = setTimeout(() => {
                const uploadInput = document.getElementById('media-upload');
                if (uploadInput) uploadInput.click();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [autoOpenMedia, isEditing]);

    const fetchPostDetail = async (postId) => {
        try {
            const lang = i18n.language.substring(0, 2).toLowerCase();
            const languageId = LANGUAGE_IDS[lang] || LANGUAGE_IDS.en;
            const response = await postService.getPostById(postId, languageId);
            if (response.status && response.data) {
                const item = response.data;
                const sortedMedia = (item.postMedia || []).sort((a, b) => a.order - b.order);
                setFormData({
                    idPost: item.postId, // Required for update
                    contentHtml: item.postTranslations?.[0]?.contentHtml || item.contentHtml || '',
                    languageId: item.languageId || LANGUAGE_IDS.en,
                    active: item.active !== undefined ? item.active : true,
                    postMediaList: sortedMedia
                });
            }
        } catch (err) {
            console.error("Error fetching post detail:", err);
            if (!isModal) {
                alert("Error loading post data");
                navigate('/posts');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            setFormData((prev) => {
                const oldIndex = prev.postMediaList.findIndex((item) => (item.tempId || item.postMediaId) === active.id);
                const newIndex = prev.postMediaList.findIndex((item) => (item.tempId || item.postMediaId) === over.id);

                return {
                    ...prev,
                    postMediaList: arrayMove(prev.postMediaList, oldIndex, newIndex),
                };
            });
        }
    };

    const handleMediaUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploadingMedia(true);
        try {
            const newMediaList = [...formData.postMediaList];

            for (const file of files) {
                const response = await mediaService.upload(file);
                if (response.status && response.data?.url) {
                    newMediaList.push({
                        tempId: self.crypto.randomUUID(),
                        postMediaId: "",
                        postId: isEditing ? id : "",
                        mediaUrl: response.data.url,
                        height: 0,
                        width: 0,
                        mediaType: file.type.startsWith('video') ? 1 : 0, // 0: Image, 1: Video
                        order: newMediaList.length
                    });
                }
            }

            setFormData(prev => ({ ...prev, postMediaList: newMediaList }));
        } catch (err) {
            console.error("Error uploading media:", err);
            alert("Error uploading media");
        } finally {
            setUploadingMedia(false);
        }
    };

    const removeMedia = (index) => {
        setFormData(prev => ({
            ...prev,
            postMediaList: prev.postMediaList.filter((_, i) => i !== index)
        }));
    };


    const modules = useMemo(() => ({
        toolbar: {
            container: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                [{ 'color': [] }, { 'background': [] }],
                ['link'],
                ['clean']
            ]
        }
    }), []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic check for content presence (ignoring empty HTML tags)
        const hasContent = formData.contentHtml && formData.contentHtml.replace(/<[^>]*>/g, '').trim().length > 0;
        const hasMedia = formData.postMediaList.length > 0;

        if (!hasContent && !hasMedia) {
            alert(t('posts.form.empty_error') || "Please provide at least some text or an image/video");
            return;
        }

        setSaving(true);
        try {
            const mediaWithOrder = formData.postMediaList.map((m, index) => ({
                ...m,
                order: index
            }));

            if (isEditing) {
                const updatedMediaList = mediaWithOrder.map(m => ({
                    ...m,
                    postMediaId: m.postMediaId || "",
                    postId: m.postId || formData.idPost
                }));
                await postService.updatePost({ ...formData, postMediaList: updatedMediaList });
            } else {
                await postService.createPost({
                    ...formData,
                    postMediaList: mediaWithOrder,
                    userId: user?.userId
                });
            }

            if (onSuccess) {
                onSuccess();
            } else {
                navigate('/posts');
            }
        } catch (err) {
            console.error("Error saving post:", err);
            alert("Error saving post");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <Loader2 size={48} className="animate-spin" color="var(--primary)" />
            </div>
        );
    }

    return (
        <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            padding: isModal ? '0' : '2rem'
        }}>
            {!isModal && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <button
                        onClick={() => navigate('/posts')}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: 'none',
                            color: 'white',
                            padding: '0.5rem',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            display: 'flex'
                        }}
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 style={{ fontSize: '1.875rem', fontWeight: '800' }}>
                            {isEditing ? t('posts.edit') || 'Edit Post' : t('posts.add_new') || 'Add New Post'}
                        </h1>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '2rem'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className={isModal ? "" : "glass-card"} style={{ padding: isModal ? '0' : '1.5rem' }}>

                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
                                <style>{`
                                    .ql-toolbar.ql-snow { border: none; border-bottom: 1px solid var(--glass-border); background: rgba(255,255,255,0.05); }
                                    .ql-container.ql-snow { border: none; min-height: 200px; font-size: 1rem; color: white; }
                                    .ql-editor.ql-blank::before { color: var(--text-muted); font-style: normal; }
                                `}</style>
                                <ReactQuill
                                    ref={quillRef}
                                    theme="snow"
                                    value={formData.contentHtml}
                                    onChange={(content) => setFormData({ ...formData, contentHtml: content })}
                                    modules={modules}
                                    placeholder={t('posts.placeholder') || 'What story do you want to tell today?'}
                                />
                            </div>
                        </div>
                    </div>

                    <div className={isModal ? "" : "glass-card"} style={{ padding: isModal ? '0' : '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <label style={{ margin: 0 }}>{t('posts.form.media') || 'Gallery'}</label>
                            <button
                                type="button"
                                onClick={() => document.getElementById('media-upload').click()}
                                disabled={uploadingMedia}
                                style={{
                                    background: 'var(--primary)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.4rem',
                                    padding: '0.4rem 0.75rem',
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem'
                                }}
                            >
                                {uploadingMedia ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                {t('common.add') || 'Add'}
                            </button>
                            <input
                                id="media-upload"
                                type="file"
                                multiple
                                accept="image/*,video/*"
                                onChange={handleMediaUpload}
                                style={{ display: 'none' }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '1rem' }}>
                            {formData.postMediaList.length === 0 && !uploadingMedia && (
                                <div style={{
                                    gridColumn: '1 / -1',
                                    padding: '2rem',
                                    textAlign: 'center',
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px dashed var(--glass-border)',
                                    borderRadius: '0.5rem',
                                    color: 'var(--text-muted)',
                                    fontSize: '0.875rem'
                                }}>
                                    No media uploaded yet
                                </div>
                            )}

                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={formData.postMediaList.map(m => m.tempId || m.postMediaId)}
                                    strategy={rectSortingStrategy}
                                >
                                    {formData.postMediaList.map((media, index) => (
                                        <SortableMediaItem
                                            key={media.tempId || media.postMediaId}
                                            media={media}
                                            index={index}
                                            onRemove={removeMedia}
                                        />
                                    ))}
                                </SortableContext>
                            </DndContext>

                            {uploadingMedia && (
                                <div style={{ aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem', border: '1px dashed var(--glass-border)' }}>
                                    <Loader2 className="animate-spin" color="var(--primary)" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{
                    display: 'flex',
                    flexDirection: 'row-reverse',
                    gap: '1rem',
                    marginTop: '1rem'
                }}>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={saving || uploadingMedia}
                        style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {isEditing ? t('common.update') || 'Update Post' : t('common.publish') || 'Publish Post'}
                    </button>
                    <button
                        type="button"
                        onClick={() => isModal ? onSuccess() : navigate('/posts')}
                        className="btn"
                        style={{
                            flex: 1,
                            background: 'rgba(255,255,255,0.05)',
                            color: 'white'
                        }}
                    >
                        {t('common.cancel') || 'Cancel'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PostForm;
