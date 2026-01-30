import React from 'react';
import { Plus, User as UserIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const StoryCard = ({ status, isAdd, onClick }) => {
    const { t } = useTranslation();
    const { user: currentUser } = useAuth();

    const cardStyle = {
        width: '115px',
        height: '200px',
        borderRadius: '12px',
        overflow: 'hidden',
        position: 'relative',
        cursor: 'pointer',
        flexShrink: 0,
        background: 'var(--bg-dark)',
        border: '1px solid var(--glass-border)',
        transition: 'transform 0.2s, box-shadow 0.2s',
    };

    const handleMouseEnter = (e) => {
        e.currentTarget.style.transform = 'scale(1.02)';
        e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.3)';
    };

    const handleMouseLeave = (e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = 'none';
    };

    if (isAdd) {
        return (
            <div
                style={cardStyle}
                onClick={onClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <div style={{
                    height: '140px',
                    background: currentUser?.avatar ? `url(${currentUser.avatar}) center/cover` : 'var(--bg-darker)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {!currentUser?.avatar && <UserIcon size={40} color="var(--text-muted)" />}
                </div>
                <div style={{
                    height: '60px',
                    background: 'var(--glass-bg)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    paddingTop: '15px'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: '-16px',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '4px solid var(--bg-dark)'
                    }}>
                        <Plus size={20} color="white" />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: 'white' }}>{t('stories.add_story')}</span>
                </div>
            </div>
        );
    }

    const { user, content, type } = status;
    const isVideo = type === 2 || (type === 1 && /\.(mp4|mov|webm|quicktime)(\?.*)?$/i.test(content));

    return (
        <div
            style={cardStyle}
            onClick={() => onClick(status)}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Background */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: type === 2
                    ? 'black'
                    : type === 1
                        ? `url(${content}) center/cover`
                        : 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                zIndex: 0
            }}>
                {type === 2 && (
                    <video
                        src={content}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        muted
                        playsInline
                    />
                )}
                {type === 0 && (
                    <div style={{
                        padding: '10px',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        fontSize: '12px',
                        color: 'white',
                        fontWeight: '500'
                    }}>
                        {content}
                    </div>
                )}
            </div>

            {/* Overlay Gradient */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.5) 100%)',
                zIndex: 1
            }} />

            {/* User Avatar */}
            <div style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: '3px solid var(--primary)',
                background: user?.avatar ? `url(${user.avatar}) center/cover` : 'var(--primary)',
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                {!user?.avatar && <UserIcon size={18} color="white" />}
            </div>

            {/* User Name */}
            <div style={{
                position: 'absolute',
                bottom: '10px',
                left: '10px',
                right: '10px',
                zIndex: 2,
                fontSize: '12px',
                fontWeight: '600',
                color: 'white',
                textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
            }}>
                {status.user?.nickName}
            </div>
        </div>
    );
};

export default StoryCard;
