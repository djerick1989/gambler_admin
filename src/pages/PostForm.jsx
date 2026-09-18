import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import {
    ArrowLeft, Loader2, Image as ImageIcon,
    Save, X, Type, Video, Plus, Globe, Smile, Play
} from 'lucide-react';
import EmojiPicker, { Theme as EmojiTheme } from 'emoji-picker-react';
import SocialEmbed from '../components/SocialEmbed';
import { SUPPORTED_SOCIAL_PLATFORMS } from '../utils/socialEmbeds';
import { useSocialEmbed } from '../hooks/useSocialEmbed';
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
import { useNotification } from '../context/NotificationContext';
import { getApiErrorMessage, isSubscriptionRequiredError } from '../utils/subscription';
import { optimizarImagen } from '../utils/imageOptimizer';

const LANGUAGE_IDS = {
    en: '11e8ba3a-b290-4a2c-9dad-0f40e457f72c',
    es: '6892a523-0dc1-4e3b-9ddd-c9a558c7920b'
};

const MAX_MEDIA_UPLOAD_BYTES = 500 * 1024 * 1024;

const formatBytes = (bytes = 0) => {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 MB';
    const units = ['B', 'KB', 'MB', 'GB'];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / Math.pow(1024, index);
    return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
};

const formatDuration = (seconds = 0) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return 'calculando...';
    if (seconds < 60) return `${Math.ceil(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.ceil(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
};

const createVideoThumbnail = (file) => new Promise((resolve) => {
    const videoUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    const cleanup = () => URL.revokeObjectURL(videoUrl);

    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.src = videoUrl;

    video.onloadedmetadata = () => {
        const captureTime = Math.min(1, Math.max(video.duration / 10, 0.1));
        video.currentTime = Number.isFinite(captureTime) ? captureTime : 0.1;
    };

    video.onseeked = () => {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 360;
            const context = canvas.getContext('2d');
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.82));
        } catch {
            resolve(null);
        } finally {
            cleanup();
        }
    };

    video.onerror = () => {
        cleanup();
        resolve(null);
    };
});

const SortableMediaItem = ({ media, index, onRemove, onPreview }) => {
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
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    {media.thumbnailUrl ? (
                        <img
                            src={media.thumbnailUrl}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : media.mediaUrl ? (
                        <video
                            src={media.mediaUrl}
                            muted
                            preload="metadata"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Video size={32} color="white" />
                        </div>
                    )}
                    <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => onPreview(media)}
                        style={{
                            position: 'absolute',
                            left: '50%',
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            border: '1px solid rgba(255,255,255,0.65)',
                            background: 'rgba(0,0,0,0.42)',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backdropFilter: 'blur(4px)'
                        }}
                        title="Ver video"
                    >
                        <Play size={18} fill="white" />
                    </button>
                </div>
            ) : (
                <img src={media.previewUrl || media.mediaUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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

/** Texto real de un contenido de Quill, sin etiquetas ni espacios duros. */
const tieneTexto = (html = '') => (
    html.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').trim().length > 0
);

const PostForm = ({ id: propId, onSuccess, autoOpenMedia, onDirtyChange }) => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { id: paramId } = useParams();
    const { user } = useAuth();
    const { addToast } = useNotification();
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
    const [uploadProgress, setUploadProgress] = useState(null);
    const [previewMedia, setPreviewMedia] = useState(null);

    const [formData, setFormData] = useState({
        contentHtml: '',
        languageId: '',
        postMediaList: []
    });
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    // Las URL blob: de la vista previa siguen ocupando memoria hasta que se revocan, así que se
    // liberan al desmontar; el ref evita que el efecto de limpieza se ate a cada cambio de la lista.
    const mediaListRef = useRef([]);
    useEffect(() => {
        mediaListRef.current = formData.postMediaList;
    }, [formData.postMediaList]);
    useEffect(() => () => {
        mediaListRef.current.forEach(media => media?.previewUrl && URL.revokeObjectURL(media.previewUrl));
    }, []);

    // El contenido se mira con retraso a propósito: mientras alguien escribe una URL, cada tecla
    // produciría un identificador distinto y el iframe se recargaría en cada pulsación.
    const [debouncedContent, setDebouncedContent] = useState('');

    useEffect(() => {
        const t = setTimeout(() => setDebouncedContent(formData.contentHtml || ''), 600);
        return () => clearTimeout(t);
    }, [formData.contentHtml]);

    // Los acortadores de Facebook se expanden contra el servidor antes de incrustarlos.
    const previewEmbed = useSocialEmbed(debouncedContent);

    // Quien contiene el formulario necesita saber si hay algo que se perdería al cerrar.
    useEffect(() => {
        if (!onDirtyChange) return;
        onDirtyChange(tieneTexto(formData.contentHtml) || formData.postMediaList.length > 0);
    }, [formData.contentHtml, formData.postMediaList, onDirtyChange]);

    // Hay un enlace pero no es de una plataforma reconocida: conviene decirlo, si no la persona
    // no entiende por qué el suyo no se previsualiza.
    const hasUnsupportedLink = useMemo(() => {
        if (previewEmbed || !debouncedContent) return false;
        const contenedor = document.createElement('div');
        contenedor.innerHTML = debouncedContent;
        const texto = contenedor.textContent || '';
        return /https?:\/\/\S+/.test(texto) || contenedor.querySelector('a[href]') !== null;
    }, [debouncedContent, previewEmbed]);

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

        const oversizedFile = files.find(file => file.size > MAX_MEDIA_UPLOAD_BYTES);
        if (oversizedFile) {
            alert(`El archivo "${oversizedFile.name}" pesa ${formatBytes(oversizedFile.size)}. El limite actual es ${formatBytes(MAX_MEDIA_UPLOAD_BYTES)}.`);
            e.target.value = '';
            return;
        }

        setUploadingMedia(true);
        setUploadProgress({
            fileName: files[0]?.name || '',
            percent: 0,
            uploadedBytes: 0,
            totalBytes: files.reduce((sum, file) => sum + file.size, 0),
            etaSeconds: null,
            preparando: true
        });

        // Las fotos se aligeran antes de empezar, no sobre la marcha: asi el total de bytes que se
        // van a subir se conoce de antemano y la barra dice la verdad en vez de encogerse a mitad.
        const preparados = [];
        for (const original of files) {
            preparados.push(await optimizarImagen(original));
        }

        const uploadStartedAt = Date.now();
        let completedBytes = 0;

        try {
            const newMediaList = [...formData.postMediaList];
            const totalBytes = preparados.reduce((sum, file) => sum + file.size, 0);

            for (const file of preparados) {
                const isVideo = file.type.startsWith('video');
                const thumbnailUrl = isVideo ? await createVideoThumbnail(file) : null;
                const response = await mediaService.upload(file, {
                    skipOptimization: true,
                    onUploadProgress: (progressEvent) => {
                        const currentLoaded = progressEvent.loaded || 0;
                        const uploadedBytes = Math.min(completedBytes + currentLoaded, totalBytes);
                        const elapsedSeconds = Math.max((Date.now() - uploadStartedAt) / 1000, 0.1);
                        const bytesPerSecond = uploadedBytes / elapsedSeconds;
                        const remainingBytes = Math.max(totalBytes - uploadedBytes, 0);

                        setUploadProgress({
                            fileName: file.name,
                            percent: totalBytes ? Math.min(Math.round((uploadedBytes / totalBytes) * 100), 100) : 0,
                            uploadedBytes,
                            totalBytes,
                            etaSeconds: bytesPerSecond > 0 ? remainingBytes / bytesPerSecond : null,
                            preparando: false
                        });
                    }
                });
                if (response.status && response.data?.url) {
                    newMediaList.push({
                        tempId: self.crypto.randomUUID(),
                        postMediaId: "",
                        postId: isEditing ? id : "",
                        mediaUrl: response.data.url,
                        // La URL del bucket es privada: solo funciona firmada, y el backend la firma
                        // al leer la publicacion (PostCase.ResolvePostMediaUrls). Para la vista previa
                        // usamos el archivo que ya esta en el navegador.
                        previewUrl: isVideo ? null : URL.createObjectURL(file),
                        thumbnailUrl,
                        height: 0,
                        width: 0,
                        mediaType: isVideo ? 1 : 0, // 0: Image, 1: Video
                        order: newMediaList.length
                    });
                }
                completedBytes += file.size;
            }

            setFormData(prev => ({ ...prev, postMediaList: newMediaList }));
        } catch (err) {
            console.error("Error uploading media:", err);
            const backendMessage = err.response?.data?.errorMessage || err.response?.data?.message;
            const statusMessage = err.response?.status === 413
                ? `El archivo es demasiado grande. El limite actual es ${formatBytes(MAX_MEDIA_UPLOAD_BYTES)}.`
                : null;
            alert(backendMessage || statusMessage || "No se pudo subir el archivo. Intenta con un video mas liviano o revisa tu conexion.");
        } finally {
            setUploadingMedia(false);
            setUploadProgress(null);
            e.target.value = '';
        }
    };

    const removeMedia = (index) => {
        const removed = formData.postMediaList[index];
        if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
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

    const onEmojiClick = (emojiData) => {
        const quill = quillRef.current.getEditor();
        const range = quill.getSelection(true);
        quill.insertText(range.index, emojiData.emoji);
        quill.setSelection(range.index + 2); // Emojis are usually 2 chars in length for selection
        setShowEmojiPicker(false);
    };

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
            const mediaWithOrder = formData.postMediaList.map((m, index) => {
                const media = { ...m, order: index };
                // previewUrl es una URL blob: local, no tiene sentido fuera de este navegador.
                delete media.previewUrl;
                return media;
            });

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
            const message = getApiErrorMessage(err, t('posts.save_error', 'Error saving post'));
            if (isSubscriptionRequiredError(err)) {
                addToast('error', message);
            } else {
                alert(message);
            }
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

    const uploadIsProcessing = uploadingMedia && (uploadProgress?.percent || 0) >= 100;

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
                        className="btn-back-premium"
                        title={t('common.back', 'Volver')}
                    >
                        <ArrowLeft size={20} />
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

                        <div className="input-group" style={{ marginBottom: 0, position: 'relative' }}>
                            <div style={{ background: '#FFFFFF', borderRadius: '0.5rem', border: '1px solid var(--stroke)' }}>
                                <style>{`
                                    .ql-toolbar.ql-snow { border: none; border-bottom: 1px solid var(--stroke); background: #f8fafc; display: flex; align-items: center; flex-wrap: wrap; }
                                    .ql-container.ql-snow { border: none; min-height: 200px; font-size: 1rem; color: var(--text-main); }
                                    .ql-editor.ql-blank::before { color: var(--text-muted); font-style: normal; }
                                    .ql-snow .ql-stroke { stroke: var(--text-main); }
                                    .ql-snow .ql-fill { fill: var(--text-main); }
                                    .ql-snow .ql-picker { color: var(--text-main); }
                                    /* Fix emoji picker search input conflict with global styles */
                                    .EmojiPickerReact .epr-search-container {
                                        padding: 10px !important;
                                        display: flex !important;
                                        align-items: center !important;
                                    }
                                    .EmojiPickerReact input.epr-search {
                                        padding: 0 12px !important;
                                        margin: 0 !important;
                                        border: 1px solid var(--stroke) !important;
                                        background: var(--bg-white) !important;
                                        border-radius: 8px !important;
                                        height: 36px !important;
                                        width: 100% !important;
                                        box-shadow: none !important;
                                    }
                                    .EmojiPickerReact .epr-icn-search {
                                        display: none !important;
                                    }
                                    /* Reset emoji button distortions */
                                    .EmojiPickerReact button {
                                        background: transparent !important;
                                        box-shadow: none !important;
                                        border-radius: 0 !important;
                                        width: auto !important;
                                        height: auto !important;
                                        padding: 0 !important;
                                    }
                                    .EmojiPickerReact button:hover {
                                        background: #f1f5f9 !important;
                                        transform: none !important;
                                    }
                                `}</style>
                                <div style={{ position: 'relative' }}>
                                    <ReactQuill
                                        ref={quillRef}
                                        theme="snow"
                                        value={formData.contentHtml}
                                        onChange={(content) => setFormData({ ...formData, contentHtml: content })}
                                        modules={modules}
                                        placeholder={t('posts.placeholder') || 'What story do you want to tell today?'}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        style={{
                                            position: 'absolute',
                                            top: '8px',
                                            right: '12px',
                                            background: showEmojiPicker ? 'var(--primary)' : '#f1f5f9',
                                            color: showEmojiPicker ? 'white' : 'var(--text-muted)',
                                            border: '1px solid var(--stroke)',
                                            borderRadius: '0.4rem',
                                            padding: '4px',
                                            cursor: 'pointer',
                                            zIndex: 10,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.2s'
                                        }}
                                        title="Emojis"
                                    >
                                        <Smile size={20} />
                                    </button>

                                    {showEmojiPicker && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '45px',
                                            right: '0',
                                            zIndex: 999999,
                                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
                                            borderRadius: '8px',
                                            overflow: 'hidden'
                                        }}>
                                            <EmojiPicker
                                                onEmojiClick={onEmojiClick}
                                                autoFocusSearch={false}
                                                theme={EmojiTheme.LIGHT}
                                                width={320}
                                                height={400}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* El editor muestra el enlace como texto plano, así que sin esto
                                    no hay forma de saber que se va a convertir en contenido. */}
                                {previewEmbed && (
                                    <div style={{ marginTop: '1rem' }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            marginBottom: '0.15rem',
                                            fontSize: '0.75rem',
                                            fontWeight: '700',
                                            letterSpacing: '0.04em',
                                            textTransform: 'uppercase',
                                            color: 'var(--text-muted)'
                                        }}>
                                            <Globe size={13} />
                                            {t('posts.embed_preview', { platform: previewEmbed.label })}
                                        </div>
                                        {/* La vista previa del editor no ancla nada: quien esta escribiendo no esta viendo un video. */}
                                        <SocialEmbed embed={previewEmbed} allowMiniPlayer={false} />
                                    </div>
                                )}

                                {hasUnsupportedLink && (
                                    <p style={{
                                        marginTop: '0.75rem',
                                        fontSize: '0.8rem',
                                        color: 'var(--text-muted)',
                                        lineHeight: '1.5'
                                    }}>
                                        {t('posts.embed_unsupported', { platforms: SUPPORTED_SOCIAL_PLATFORMS.join(', ') })}
                                    </p>
                                )}
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
                                            onPreview={setPreviewMedia}
                                        />
                                    ))}
                                </SortableContext>
                            </DndContext>

                            {uploadingMedia && (
                                <div style={{
                                    gridColumn: '1 / -1',
                                    padding: '1rem',
                                    background: '#fff8e6',
                                    borderRadius: '0.75rem',
                                    border: '1px solid rgba(217, 146, 0, 0.35)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.65rem'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-main)', fontWeight: 700 }}>
                                            <Loader2 size={18} className="animate-spin" color="var(--primary)" />
                                        {uploadProgress?.preparando ? 'Preparando' : uploadIsProcessing ? 'Procesando' : 'Subiendo'} {uploadProgress?.fileName || 'archivo'}...
                                        </div>
                                    <div style={{ height: '10px', borderRadius: '999px', background: '#f3e5bd', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${uploadProgress?.percent || 0}%`,
                                            height: '100%',
                                            borderRadius: '999px',
                                            background: 'var(--primary)',
                                            transition: 'width 0.2s ease'
                                        }} />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        <span>{uploadProgress?.percent || 0}% completado</span>
                                        <span>{formatBytes(uploadProgress?.uploadedBytes)} de {formatBytes(uploadProgress?.totalBytes)}</span>
                                        <span>{uploadIsProcessing ? 'Finalizando en el servidor...' : `Faltan ${formatDuration(uploadProgress?.etaSeconds)}`}</span>
                                    </div>
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
                            background: '#f1f5f9',
                            color: 'var(--text-main)',
                            border: '1px solid var(--stroke)'
                        }}
                    >
                        {t('common.cancel') || 'Cancel'}
                    </button>
                </div>
            </form>

            {previewMedia && (
                <div
                    onClick={() => setPreviewMedia(null)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(15, 23, 42, 0.78)',
                        zIndex: 100000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2rem'
                    }}
                >
                    <div
                        onClick={(event) => event.stopPropagation()}
                        style={{
                            width: 'min(760px, 92vw)',
                            background: 'white',
                            borderRadius: '1rem',
                            padding: '1rem',
                            boxShadow: '0 24px 70px rgba(0,0,0,0.35)'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <strong>Vista previa del video</strong>
                            <button
                                type="button"
                                onClick={() => setPreviewMedia(null)}
                                style={{
                                    border: 'none',
                                    background: '#f1f5f9',
                                    borderRadius: '0.5rem',
                                    width: '36px',
                                    height: '36px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <video
                            src={previewMedia.mediaUrl}
                            poster={previewMedia.thumbnailUrl || undefined}
                            controls
                            style={{
                                width: '100%',
                                maxHeight: '70vh',
                                borderRadius: '0.75rem',
                                background: '#000'
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default PostForm;
