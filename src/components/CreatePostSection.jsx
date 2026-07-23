import React from 'react';
import { Image as ImageIcon, Video, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import PremiumAvatarBadge from './PremiumAvatarBadge';

const CreatePostSection = ({ onClick, onMediaClick }) => {
    const { user, isSubscribed } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();

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
                <div
                    onClick={() => navigate('/profile')}
                    style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: user?.avatar
                        ? `url(${user.avatar}) center/cover`
                        : 'rgba(217, 152, 0, 0.16)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    border: user?.avatar ? '1px solid var(--stroke)' : '1px solid var(--primary)',
                    boxShadow: user?.avatar ? 'none' : '0 3px 10px rgba(217, 152, 0, 0.18)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative'
                }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(217, 152, 0, 0.25)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = user?.avatar ? 'none' : '0 3px 10px rgba(217, 152, 0, 0.18)';
                    }}
                    title={t('common.profile')}
                >
                    {isSubscribed && <PremiumAvatarBadge size={20} top={-9} left={-7} />}
                    {!user?.avatar && <UserIcon size={20} color="var(--primary)" />}
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
                        background: 'rgba(217, 152, 0, 0.14)',
                        border: '1px solid rgba(217, 152, 0, 0.28)',
                        color: 'var(--primary)',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        flexShrink: 0,
                        boxShadow: '0 4px 12px rgba(217, 152, 0, 0.16)'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(217, 152, 0, 0.24)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(217, 152, 0, 0.25)';
                        e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(217, 152, 0, 0.14)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(217, 152, 0, 0.16)';
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
