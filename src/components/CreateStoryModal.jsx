import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Type, Upload, Loader2, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { statusService, mediaService } from '../services/api';
import Modal from './Modal';

const CreateStoryModal = ({ isOpen, onClose, onSuccess }) => {
    const { t } = useTranslation();
    const [type, setType] = useState(1); // 0: TEXT, 1: IMAGE, 2: VIDEO
    const [content, setContent] = useState('');
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
            setType(selectedFile.type.startsWith('video/') ? 2 : 1);
        }
    };

    const handleSubmit = async () => {
        if ((type === 1 || type === 2) && !file) return;
        if (type === 0 && !content.trim()) return;

        setLoading(true);
        try {
            let finalContent = content;

            if ((type === 1 || type === 2) && file) {
                const uploadResponse = await mediaService.upload(file);
                if (uploadResponse.status) {
                    finalContent = uploadResponse.data.url || uploadResponse.data;
                } else {
                    throw new Error(t('stories.error_upload'));
                }
            }

            const response = await statusService.createStatus({
                content: finalContent,
                type: type
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

    const resetForm = () => {
        setType(1);
        setContent('');
        setFile(null);
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => { resetForm(); onClose(); }}
            title={t('stories.create_title')}
            maxWidth="500px"
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={() => { setType(1); setContent(''); }}
                        style={{
                            flex: 1,
                            padding: '1rem',
                            borderRadius: '12px',
                            border: `2px solid ${(type === 1 || type === 2) ? 'var(--primary)' : 'var(--glass-border)'}`,
                            background: (type === 1 || type === 2) ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                            color: (type === 1 || type === 2) ? 'var(--primary)' : 'var(--text-muted)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.5rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        <ImageIcon size={24} />
                        <span style={{ fontWeight: '600' }}>{t('stories.type_media')}</span>
                    </button>
                    <button
                        onClick={() => { setType(0); setPreview(null); setFile(null); }}
                        style={{
                            flex: 1,
                            padding: '1rem',
                            borderRadius: '12px',
                            border: `2px solid ${type === 0 ? 'var(--primary)' : 'var(--glass-border)'}`,
                            background: type === 0 ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                            color: type === 0 ? 'var(--primary)' : 'var(--text-muted)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.5rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        <Type size={24} />
                        <span style={{ fontWeight: '600' }}>{t('stories.type_text')}</span>
                    </button>
                </div>

                {type !== 0 ? (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            height: '300px',
                            borderRadius: '12px',
                            border: '2px dashed var(--glass-border)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            overflow: 'hidden',
                            position: 'relative',
                            background: 'rgba(0,0,0,0.2)'
                        }}
                    >
                        {preview ? (
                            file?.type?.startsWith('video/') ? (
                                <video
                                    src={preview}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    autoPlay
                                    muted
                                    loop
                                />
                            ) : (
                                <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            )
                        ) : (
                            <>
                                <Upload size={48} color="var(--text-muted)" />
                                <span style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>{t('stories.select_file')}</span>
                            </>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*,video/*"
                            style={{ display: 'none' }}
                        />
                    </div>
                ) : (
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={t('stories.write_placeholder')}
                        style={{
                            height: '200px',
                            width: '100%',
                            background: 'white',
                            color: 'black',
                            padding: '1.5rem',
                            borderRadius: '12px',
                            border: 'none',
                            fontSize: '1.25rem',
                            fontWeight: '600',
                            textAlign: 'center',
                            resize: 'none',
                            outline: 'none'
                        }}
                    />
                )}

                <button
                    onClick={handleSubmit}
                    disabled={loading || ((type === 1 || type === 2) && !file) || (type === 0 && !content.trim())}
                    className="btn btn-primary"
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '1rem'
                    }}
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                    {t('stories.share_button')}
                </button>
            </div>
        </Modal>
    );
};

export default CreateStoryModal;
