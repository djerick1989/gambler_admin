import React from 'react';
import { Image as ImageIcon, Video, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const CreatePostSection = ({ onClick, onMediaClick }) => {
    const { user } = useAuth();
    const { t } = useTranslation();

    return (
        <div
            className="glass-card"
            style={{
                padding: '1.25rem',
                marginBottom: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: user?.avatar
                        ? `url(${user.avatar}) center/cover`
                        : '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    border: '1px solid var(--stroke)'
                }}>
                    {!user?.avatar && <UserIcon size={20} color="var(--text-muted)" />}
                </div>

                <div
                    onClick={onClick}
                    style={{
                        flex: 1,
                        background: '#f1f5f9',
                        borderRadius: '2rem',
                        padding: '0.75rem 1.25rem',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        fontSize: '0.95rem',
                        border: '1px solid var(--stroke)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#f1f5f9'}
                >
                    {t('posts.placeholder') || '¿Qué historia quieres contar hoy?'}
                </div>

                <button
                    onClick={onMediaClick}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0.6rem',
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: 'none',
                        color: '#10b981',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        flexShrink: 0
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)';
                        e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                    title={t('posts.media.photos') || 'Fotos/Videos'}
                >
                    <ImageIcon size={22} />
                </button>
            </div>
        </div>
    );
};

export default CreatePostSection;
