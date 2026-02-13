import React from 'react';
import { MessageSquare, X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Toast = ({ notification, onRemove }) => {
    const navigate = useNavigate();
    const { id, title, message, chatId, sender, type } = notification;

    const handleClick = () => {
        if (chatId) {
            navigate(`/chat/${chatId}`);
        }
        onRemove(id);
    };

    let icon;
    let iconBg;

    if (type === 'success') {
        icon = <CheckCircle size={20} color="white" />;
        iconBg = '#10b981';
    } else if (type === 'error') {
        icon = <AlertCircle size={20} color="white" />;
        iconBg = '#ef4444';
    } else if (sender) {
        icon = <MessageSquare size={20} color="white" />;
        iconBg = 'var(--primary, #3b82f6)';
    } else {
        icon = <Info size={20} color="white" />;
        iconBg = 'var(--primary, #3b82f6)';
    }

    return (
        <div
            className="toast-notification animate-slide-in"
            style={{
                background: 'rgba(30, 41, 59, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '12px 16px',
                marginBottom: '10px',
                width: '320px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                display: 'flex',
                gap: '12px',
                cursor: 'pointer',
                position: 'relative',
                pointerEvents: 'auto',
                animation: 'toastSlideIn 0.3s ease-out'
            }}
            onClick={handleClick}
        >
            <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: sender?.avatar ? `url(${sender.avatar}) center/cover` : iconBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
            }}>
                {!sender?.avatar && icon}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'white', marginBottom: '2px' }}>
                    {title}
                </div>
                <div style={{
                    fontSize: '0.8rem',
                    color: 'rgba(255, 255, 255, 0.7)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}>
                    {message}
                </div>
            </div>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove(id);
                }}
                style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.5)',
                    cursor: 'pointer',
                    padding: '4px'
                }}
            >
                <X size={16} />
            </button>
        </div>
    );
};

export const ToastContainer = ({ notifications, onRemove }) => {
    return (
        <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            pointerEvents: 'none'
        }}>
            {notifications.map((n) => (
                <Toast key={n.id} notification={n} onRemove={onRemove} />
            ))}
        </div>
    );
};

export default Toast;
