import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { registerDialogHandlers } from '../utils/dialog';

const DialogContext = createContext(null);

export const useDialog = () => {
    const context = useContext(DialogContext);
    if (!context) {
        throw new Error('useDialog must be used within a DialogProvider');
    }
    return context;
};

const TYPE_CONFIG = {
    info: {
        icon: Info,
        accent: '#D49000',
        bg: 'rgba(212, 144, 0, 0.12)'
    },
    success: {
        icon: CheckCircle2,
        accent: '#059669',
        bg: 'rgba(16, 185, 129, 0.12)'
    },
    warning: {
        icon: AlertTriangle,
        accent: '#D49000',
        bg: 'rgba(212, 144, 0, 0.14)'
    },
    danger: {
        icon: XCircle,
        accent: '#ef4444',
        bg: 'rgba(239, 68, 68, 0.12)'
    }
};

export const DialogProvider = ({ children }) => {
    const { t } = useTranslation();
    const [dialog, setDialog] = useState(null);
    const resolverRef = useRef(null);

    const closeDialog = useCallback((result) => {
        setDialog(null);
        if (resolverRef.current) {
            resolverRef.current(result);
            resolverRef.current = null;
        }
    }, []);

    const openDialog = useCallback((nextDialog) => {
        return new Promise((resolve) => {
            resolverRef.current = resolve;
            setDialog(nextDialog);
        });
    }, []);

    const alertDialog = useCallback((options) => {
        return openDialog({
            mode: 'alert',
            type: options.type || 'info',
            title: options.title || t('common.message', 'Mensaje'),
            message: options.message,
            confirmText: options.confirmText || t('common.ok', 'Aceptar')
        }).then(() => undefined);
    }, [openDialog, t]);

    const confirmDialog = useCallback((options) => {
        return openDialog({
            mode: 'confirm',
            type: options.type || 'warning',
            title: options.title || t('common.confirm_action', 'Confirmar acción'),
            message: options.message,
            confirmText: options.confirmText || t('common.ok', 'Aceptar'),
            cancelText: options.cancelText || t('common.cancel', 'Cancelar')
        });
    }, [openDialog, t]);

    useEffect(() => {
        const originalAlert = window.alert;
        const unregister = registerDialogHandlers({
            alert: alertDialog,
            confirm: confirmDialog
        });

        window.alert = (message) => {
            alertDialog({ message: String(message ?? '') });
        };

        return () => {
            window.alert = originalAlert;
            unregister();
        };
    }, [alertDialog, confirmDialog]);

    useEffect(() => {
        if (!dialog) return;

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                closeDialog(false);
            }
            if (event.key === 'Enter') {
                event.preventDefault();
                closeDialog(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [closeDialog, dialog]);

    const config = TYPE_CONFIG[dialog?.type] || TYPE_CONFIG.info;
    const Icon = config.icon;

    return (
        <DialogContext.Provider value={{ alertDialog, confirmDialog }}>
            {children}

            {dialog && (
                <div
                    role="presentation"
                    onClick={() => closeDialog(dialog.mode === 'confirm' ? false : true)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 200000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1rem',
                        background: 'rgba(15, 23, 42, 0.62)',
                        backdropFilter: 'blur(7px)',
                        animation: 'dialogFadeIn 0.18s ease-out'
                    }}
                >
                    <style>{`
                        @keyframes dialogFadeIn {
                            from { opacity: 0; }
                            to { opacity: 1; }
                        }
                        @keyframes dialogScaleIn {
                            from { transform: translateY(10px) scale(0.96); opacity: 0; }
                            to { transform: translateY(0) scale(1); opacity: 1; }
                        }
                        .app-dialog-button {
                            transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
                        }
                        .app-dialog-button:hover:not(:disabled) {
                            transform: translateY(-1px);
                        }
                    `}</style>
                    <section
                        role={dialog.mode === 'confirm' ? 'alertdialog' : 'dialog'}
                        aria-modal="true"
                        aria-labelledby="app-dialog-title"
                        aria-describedby="app-dialog-message"
                        onClick={(event) => event.stopPropagation()}
                        style={{
                            width: 'min(460px, 100%)',
                            background: '#FFFFFF',
                            border: '1px solid rgba(212, 144, 0, 0.28)',
                            borderRadius: '1.25rem',
                            boxShadow: '0 30px 80px rgba(15, 23, 42, 0.32)',
                            overflow: 'hidden',
                            animation: 'dialogScaleIn 0.22s ease-out'
                        }}
                    >
                        <div
                            style={{
                                padding: '1.4rem 1.5rem 1rem',
                                display: 'flex',
                                gap: '1rem',
                                alignItems: 'flex-start',
                                background: 'linear-gradient(135deg, #fff 0%, #fff8e8 100%)'
                            }}
                        >
                            <div
                                style={{
                                    width: '46px',
                                    height: '46px',
                                    borderRadius: '50%',
                                    flex: '0 0 auto',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: config.bg,
                                    color: config.accent,
                                    boxShadow: `0 12px 26px ${config.bg}`
                                }}
                            >
                                <Icon size={24} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <h2
                                    id="app-dialog-title"
                                    style={{
                                        margin: '0 2rem 0.45rem 0',
                                        color: 'var(--text-main)',
                                        fontSize: '1.15rem',
                                        fontWeight: 900,
                                        letterSpacing: '-0.02em'
                                    }}
                                >
                                    {dialog.title}
                                </h2>
                                <p
                                    id="app-dialog-message"
                                    style={{
                                        margin: 0,
                                        color: 'var(--text-muted)',
                                        fontSize: '0.98rem',
                                        lineHeight: 1.55,
                                        whiteSpace: 'pre-wrap'
                                    }}
                                >
                                    {dialog.message}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => closeDialog(dialog.mode === 'confirm' ? false : true)}
                                aria-label="Cerrar"
                                style={{
                                    width: '34px',
                                    height: '34px',
                                    border: 'none',
                                    borderRadius: '0.65rem',
                                    background: 'rgba(15, 23, 42, 0.06)',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div
                            style={{
                                padding: '1rem 1.5rem 1.35rem',
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: '0.75rem',
                                background: '#FFFFFF'
                            }}
                        >
                            {dialog.mode === 'confirm' && (
                                <button
                                    type="button"
                                    className="app-dialog-button"
                                    onClick={() => closeDialog(false)}
                                    style={{
                                        padding: '0.75rem 1.05rem',
                                        borderRadius: '0.75rem',
                                        border: '1px solid var(--stroke)',
                                        background: '#f8fafc',
                                        color: 'var(--text-main)',
                                        fontWeight: 800,
                                        cursor: 'pointer'
                                    }}
                                >
                                    {dialog.cancelText}
                                </button>
                            )}
                            <button
                                type="button"
                                className="app-dialog-button"
                                onClick={() => closeDialog(true)}
                                autoFocus
                                style={{
                                    padding: '0.75rem 1.25rem',
                                    borderRadius: '0.75rem',
                                    border: 'none',
                                    background: config.accent,
                                    color: '#FFFFFF',
                                    fontWeight: 900,
                                    cursor: 'pointer',
                                    boxShadow: `0 14px 28px ${config.bg}`
                                }}
                            >
                                {dialog.confirmText}
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </DialogContext.Provider>
    );
};
