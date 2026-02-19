import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, maxWidth = '600px' }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 99999,
                padding: '1rem',
                animation: 'modalFadeIn 0.3s ease-out'
            }}
            onClick={onClose}
        >
            <style>{`
                @keyframes modalFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes modalScaleIn {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
            `}</style>
            <div
                style={{
                    background: 'var(--bg-white)',
                    border: '1px solid var(--stroke)',
                    borderRadius: '1.25rem',
                    width: '100%',
                    maxWidth: maxWidth,
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                    overflow: 'hidden',
                    animation: 'modalScaleIn 0.3s ease-out'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    padding: '1.25rem 1.75rem',
                    borderBottom: '1px solid var(--stroke)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'var(--bg-light)'
                }}>
                    <h2 style={{
                        margin: 0,
                        fontSize: '1.25rem',
                        fontWeight: '700',
                        color: 'var(--text-main)',
                        letterSpacing: '-0.025em'
                    }}>
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: '#f1f5f9',
                            border: 'none',
                            borderRadius: '0.5rem',
                            padding: '0.5rem',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                            e.currentTarget.style.color = '#ef4444';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#f1f5f9';
                            e.currentTarget.style.color = 'var(--text-muted)';
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '1.75rem'
                }}>
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default Modal;
