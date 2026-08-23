import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Type, Loader2, Send, ArrowLeft, Upload, Trash2, RefreshCw, User as UserIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { statusService, mediaService } from '../services/api';
import Modal from './Modal';
import { STORY_BACKGROUNDS, DEFAULT_STORY_BACKGROUND, storyBackgroundToCss, isSameStoryBackground } from '../utils/storyBackgrounds';

const MAX_TEXT_LENGTH = 280;

const formatSize = (bytes) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

const CreateStoryModal = ({ isOpen, onClose, onSuccess }) => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [step, setStep] = useState('choose'); // 'choose' | 'edit'
    const [type, setType] = useState(1); // 0: TEXT, 1: IMAGE, 2: VIDEO
    const [content, setContent] = useState('');
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [background, setBackground] = useState(DEFAULT_STORY_BACKGROUND);
    const fileInputRef = useRef(null);

    const isMedia = type === 1 || type === 2;
    const isVideo = file?.type?.startsWith('video/');
    const canShare = isMedia ? !!file : !!content.trim();

    const takeFile = (selectedFile) => {
        if (!selectedFile) return;
        if (preview) URL.revokeObjectURL(preview);
        setFile(selectedFile);
        setPreview(URL.createObjectURL(selectedFile));
        setType(selectedFile.type.startsWith('video/') ? 2 : 1);
    };

    const handleFileChange = (e) => takeFile(e.target.files[0]);

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        takeFile(e.dataTransfer.files?.[0]);
    };

    const clearFile = () => {
        if (preview) URL.revokeObjectURL(preview);
        setFile(null);
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const startMedia = () => {
        setType(1);
        setContent('');
        setStep('edit');
        fileInputRef.current?.click();
    };

    const startText = () => {
        clearFile();
        setType(0);
        setStep('edit');
    };

    const resetForm = () => {
        clearFile();
        setStep('choose');
        setType(1);
        setContent('');
        setDragging(false);
        setBackground(DEFAULT_STORY_BACKGROUND);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = async () => {
        if (!canShare) return;

        setLoading(true);
        try {
            let finalContent = content;

            if (isMedia && file) {
                const uploadResponse = await mediaService.upload(file);
                if (uploadResponse.status) {
                    finalContent = uploadResponse.data.url || uploadResponse.data;
                } else {
                    throw new Error(t('stories.error_upload'));
                }
            }

            const response = await statusService.createStatus({
                content: finalContent,
                type: type,
                background: type === 0 ? background : null
            });

            if (response.status) {
                onSuccess();
                resetForm();
            }
        } catch (error) {
            console.error("Error creating story:", error);
            alert(t('stories.error_create'));
        } finally {
            setLoading(false);
        }
    };

    const previewFontSize = content.length > 180 ? '0.95rem'
        : content.length > 100 ? '1.1rem'
            : content.length > 45 ? '1.35rem'
                : '1.65rem';

    const authorName = user?.nickName || user?.name || t('common.admin');

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={t('stories.create_title')}
            maxWidth={step === 'choose' ? '560px' : '900px'}
        >
            <style>{`
                @keyframes cs-spin { to { transform: rotate(360deg); } }
                .cs-hint {
                    margin: 0 0 1.25rem;
                    text-align: center;
                    color: var(--text-muted);
                    font-size: 0.95rem;
                }
                .cs-tiles { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
                .cs-tile {
                    position: relative;
                    border: none;
                    border-radius: 1rem;
                    padding: 1.75rem 1rem;
                    min-height: 230px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    cursor: pointer;
                    color: white;
                    overflow: hidden;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                    box-shadow: 0 10px 24px -12px rgba(15, 23, 42, 0.45);
                }
                .cs-tile:hover { transform: translateY(-4px); box-shadow: 0 18px 32px -14px rgba(15, 23, 42, 0.5); }
                .cs-tile:focus-visible { outline: 3px solid var(--primary); outline-offset: 3px; }
                .cs-tile--media { background: linear-gradient(160deg, #D49000 0%, #8a5c00 100%); }
                .cs-tile--text { background: ${storyBackgroundToCss(DEFAULT_STORY_BACKGROUND)}; }
                .cs-tile-icon {
                    width: 56px; height: 56px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.22);
                    display: flex; align-items: center; justify-content: center;
                    margin-bottom: 0.35rem;
                }
                .cs-tile-title { font-size: 1.05rem; font-weight: 700; }
                .cs-tile-desc { font-size: 0.8rem; opacity: 0.85; text-align: center; line-height: 1.35; }

                .cs-editor { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 1.75rem; align-items: stretch; }
                .cs-panel { display: flex; flex-direction: column; gap: 1rem; min-width: 0; }
                .cs-back {
                    align-self: flex-start;
                    display: inline-flex; align-items: center; gap: 0.4rem;
                    background: transparent; border: none;
                    color: var(--text-muted); font-size: 0.85rem; font-weight: 600;
                    padding: 0.25rem 0; cursor: pointer;
                }
                .cs-back:hover { color: var(--primary); }
                .cs-author { display: flex; align-items: center; gap: 0.75rem; }
                .cs-author-name { font-size: 0.95rem; font-weight: 700; color: var(--text-main); }
                .cs-author-sub { font-size: 0.78rem; color: var(--text-muted); }
                .cs-label { font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
                .cs-textarea {
                    width: 100%; min-height: 150px; resize: none;
                    padding: 1rem;
                    border: 1px solid var(--stroke);
                    border-radius: 0.85rem;
                    background: var(--bg-light);
                    color: var(--text-main);
                    font-size: 1rem; line-height: 1.5;
                    font-family: inherit;
                    outline: none;
                    transition: border-color 0.2s ease, box-shadow 0.2s ease;
                }
                .cs-textarea:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(212, 144, 0, 0.15); background: var(--bg-white); }
                .cs-counter { align-self: flex-end; font-size: 0.75rem; color: var(--text-muted); margin-top: -0.5rem; }
                .cs-swatches { display: flex; flex-wrap: wrap; gap: 0.5rem; }
                .cs-swatch {
                    width: 34px; height: 34px;
                    border-radius: 50%;
                    border: 2px solid transparent;
                    box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.12);
                    cursor: pointer;
                    padding: 0;
                    transition: transform 0.15s ease, box-shadow 0.15s ease;
                }
                .cs-swatch:hover { transform: scale(1.08); }
                .cs-swatch--active {
                    border-color: var(--bg-white);
                    box-shadow: 0 0 0 2px var(--primary);
                    transform: scale(1.08);
                }
                .cs-swatch:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
                .cs-drop {
                    width: 100%;
                    border: 2px dashed var(--stroke);
                    border-radius: 0.85rem;
                    background: var(--bg-light);
                    padding: 2rem 1rem;
                    display: flex; flex-direction: column; align-items: center; gap: 0.6rem;
                    cursor: pointer; text-align: center;
                    transition: all 0.2s ease;
                }
                .cs-drop:hover, .cs-drop--active { border-color: var(--primary); background: rgba(212, 144, 0, 0.07); }
                .cs-drop-title { font-size: 0.95rem; font-weight: 600; color: var(--text-main); }
                .cs-drop-desc { font-size: 0.78rem; color: var(--text-muted); }
                .cs-file {
                    display: flex; align-items: center; gap: 0.75rem;
                    padding: 0.85rem;
                    border: 1px solid var(--stroke);
                    border-radius: 0.85rem;
                    background: var(--bg-light);
                }
                .cs-file-thumb { width: 44px; height: 44px; border-radius: 0.6rem; background: #0f172a center/cover; flex-shrink: 0; }
                .cs-file-info { min-width: 0; flex: 1; }
                .cs-file-name { font-size: 0.88rem; font-weight: 600; color: var(--text-main); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .cs-file-meta { font-size: 0.75rem; color: var(--text-muted); }
                .cs-icon-btn {
                    background: var(--bg-white); border: 1px solid var(--stroke);
                    border-radius: 0.5rem; padding: 0.45rem;
                    color: var(--text-muted); cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    transition: all 0.2s ease;
                }
                .cs-icon-btn:hover { color: var(--primary); border-color: var(--primary); }
                .cs-icon-btn--danger:hover { color: var(--danger); border-color: var(--danger); }
                .cs-actions { display: flex; gap: 0.75rem; margin-top: auto; padding-top: 0.5rem; }
                .cs-actions .btn { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; }
                .cs-actions .btn:disabled { opacity: 0.55; cursor: not-allowed; box-shadow: none; transform: none; }

                .cs-preview-col { display: flex; flex-direction: column; align-items: center; gap: 0.6rem; }
                .cs-preview-label { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
                .cs-phone {
                    position: relative;
                    height: clamp(300px, 44vh, 430px);
                    aspect-ratio: 9 / 16;
                    border-radius: 1.1rem;
                    overflow: hidden;
                    background: #0f172a;
                    box-shadow: 0 18px 36px -18px rgba(15, 23, 42, 0.55);
                }
                .cs-phone-media { width: 100%; height: 100%; object-fit: cover; }
                .cs-phone-text {
                    width: 100%; height: 100%;
                    display: flex; align-items: center; justify-content: center;
                    padding: 1.75rem 1.25rem;
                    text-align: center; color: white; font-weight: 700;
                    line-height: 1.35; overflow-wrap: anywhere;
                }
                .cs-phone-empty {
                    width: 100%; height: 100%;
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    gap: 0.5rem; color: rgba(255,255,255,0.6); font-size: 0.8rem;
                    background: linear-gradient(160deg, #1e293b 0%, #0f172a 100%);
                }
                .cs-phone-overlay {
                    position: absolute; inset: 0; z-index: 2; pointer-events: none;
                    background: linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 22%, transparent 82%, rgba(0,0,0,0.45) 100%);
                }
                .cs-phone-bar {
                    position: absolute; top: 10px; left: 10px; right: 10px; z-index: 3;
                    height: 3px; border-radius: 999px; background: rgba(255,255,255,0.35);
                }
                .cs-phone-bar::after {
                    content: ''; display: block; width: 35%; height: 100%;
                    border-radius: 999px; background: white;
                }
                .cs-phone-user {
                    position: absolute; top: 22px; left: 10px; right: 10px; z-index: 3;
                    display: flex; align-items: center; gap: 0.5rem;
                }
                .cs-phone-name {
                    font-size: 0.75rem; font-weight: 600; color: white;
                    text-shadow: 0 1px 3px rgba(0,0,0,0.7);
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                }

                @media (max-width: 780px) {
                    .cs-editor { grid-template-columns: 1fr; }
                    .cs-preview-col { order: -1; }
                    .cs-tiles { grid-template-columns: 1fr; }
                    .cs-tile { min-height: 150px; }
                }
            `}</style>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,video/*"
                style={{ display: 'none' }}
            />

            {step === 'choose' ? (
                <div>
                    <p className="cs-hint">{t('stories.choose_type')}</p>
                    <div className="cs-tiles">
                        <button type="button" className="cs-tile cs-tile--media" onClick={startMedia}>
                            <span className="cs-tile-icon"><ImageIcon size={26} /></span>
                            <span className="cs-tile-title">{t('stories.type_media')}</span>
                            <span className="cs-tile-desc">{t('stories.type_media_desc')}</span>
                        </button>
                        <button type="button" className="cs-tile cs-tile--text" onClick={startText}>
                            <span className="cs-tile-icon"><Type size={26} /></span>
                            <span className="cs-tile-title">{t('stories.type_text')}</span>
                            <span className="cs-tile-desc">{t('stories.type_text_desc')}</span>
                        </button>
                    </div>
                </div>
            ) : (
                <div className="cs-editor">
                    <div className="cs-panel">
                        <button type="button" className="cs-back" onClick={() => { resetForm(); }}>
                            <ArrowLeft size={16} />
                            {t('stories.back')}
                        </button>

                        <div className="cs-author">
                            <div style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '50%',
                                flexShrink: 0,
                                background: user?.avatar ? `url(${user.avatar}) center/cover` : 'rgba(212, 144, 0, 0.16)',
                                border: '2px solid var(--primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {!user?.avatar && <UserIcon size={20} color="var(--primary)" />}
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <div className="cs-author-name">{authorName}</div>
                                <div className="cs-author-sub">{t('stories.your_story')}</div>
                            </div>
                        </div>

                        {type === 0 ? (
                            <>
                                <span className="cs-label">{t('stories.text_label')}</span>
                                <textarea
                                    className="cs-textarea"
                                    value={content}
                                    maxLength={MAX_TEXT_LENGTH}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder={t('stories.write_placeholder')}
                                    autoFocus
                                />
                                <span className="cs-counter">{content.length}/{MAX_TEXT_LENGTH}</span>

                                <span className="cs-label">{t('stories.background_label')}</span>
                                <div className="cs-swatches">
                                    {STORY_BACKGROUNDS.map((option) => {
                                        const selected = isSameStoryBackground(option, background);
                                        return (
                                            <button
                                                key={option}
                                                type="button"
                                                className={`cs-swatch${selected ? ' cs-swatch--active' : ''}`}
                                                style={{ background: storyBackgroundToCss(option) }}
                                                onClick={() => setBackground(option)}
                                                aria-label={option}
                                                aria-pressed={selected}
                                            />
                                        );
                                    })}
                                </div>
                            </>
                        ) : (
                            <>
                                <span className="cs-label">{t('stories.file_label')}</span>
                                {!file ? (
                                    <div
                                        className={`cs-drop${dragging ? ' cs-drop--active' : ''}`}
                                        onClick={() => fileInputRef.current?.click()}
                                        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                                        onDragLeave={() => setDragging(false)}
                                        onDrop={handleDrop}
                                    >
                                        <Upload size={30} color="var(--primary)" />
                                        <span className="cs-drop-title">{t('stories.select_file')}</span>
                                        <span className="cs-drop-desc">{t('stories.drop_hint')}</span>
                                    </div>
                                ) : (
                                    <div className="cs-file">
                                        <div
                                            className="cs-file-thumb"
                                            style={!isVideo && preview ? { backgroundImage: `url(${preview})` } : undefined}
                                        >
                                            {isVideo && (
                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <ImageIcon size={18} color="white" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="cs-file-info">
                                            <div className="cs-file-name">{file.name}</div>
                                            <div className="cs-file-meta">{formatSize(file.size)}</div>
                                        </div>
                                        <button
                                            type="button"
                                            className="cs-icon-btn"
                                            title={t('stories.change_file')}
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <RefreshCw size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            className="cs-icon-btn cs-icon-btn--danger"
                                            title={t('stories.remove_file')}
                                            onClick={clearFile}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}

                        <div className="cs-actions">
                            <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={loading}>
                                {t('stories.discard')}
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleSubmit}
                                disabled={loading || !canShare}
                            >
                                {loading
                                    ? <Loader2 size={18} style={{ animation: 'cs-spin 1s linear infinite' }} />
                                    : <Send size={18} />}
                                {loading ? t('stories.sharing') : t('stories.share_button')}
                            </button>
                        </div>
                    </div>

                    <div className="cs-preview-col">
                        <span className="cs-preview-label">{t('stories.preview')}</span>
                        <div className="cs-phone" style={type === 0 ? { background: storyBackgroundToCss(background) } : undefined}>
                            {type === 0 ? (
                                <div className="cs-phone-text" style={{ fontSize: previewFontSize }}>
                                    {content.trim() || t('stories.write_placeholder')}
                                </div>
                            ) : preview ? (
                                isVideo ? (
                                    <video className="cs-phone-media" src={preview} autoPlay muted loop playsInline />
                                ) : (
                                    <img className="cs-phone-media" src={preview} alt="" />
                                )
                            ) : (
                                <div className="cs-phone-empty">
                                    <ImageIcon size={28} />
                                    <span>{t('stories.preview_empty')}</span>
                                </div>
                            )}

                            <div className="cs-phone-overlay" />
                            <div className="cs-phone-bar" />
                            <div className="cs-phone-user">
                                <div style={{
                                    width: '26px',
                                    height: '26px',
                                    borderRadius: '50%',
                                    flexShrink: 0,
                                    background: user?.avatar ? `url(${user.avatar}) center/cover` : 'var(--primary)',
                                    border: '2px solid white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {!user?.avatar && <UserIcon size={13} color="white" />}
                                </div>
                                <span className="cs-phone-name">{authorName}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default CreateStoryModal;
