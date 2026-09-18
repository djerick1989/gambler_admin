import React, { useState } from 'react';
import { Flag, Loader2, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import { postModerationService } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { REPORT_REASONS } from '../utils/postReportReasons';

/**
 * Reporte de una publicación ajena. No se le dice a quien reporta cuántos reportes acumula la
 * publicación ni si pasó a revisión: eso permitiría medir el umbral y coordinar para tumbar
 * publicaciones. Solo se confirma que el reporte quedó registrado.
 */
const ReportPostModal = ({ postId, onClose }) => {
    const { t } = useTranslation();
    const { addToast } = useNotification();
    const [reason, setReason] = useState(null);
    const [comment, setComment] = useState('');
    const [sending, setSending] = useState(false);

    const submit = async () => {
        if (!reason) return;

        setSending(true);
        try {
            const response = await postModerationService.reportPost(postId, {
                reason,
                comment: comment.trim() || null
            });

            if (response?.status) {
                addToast('success', response.data?.registered
                    ? t('posts.report.success')
                    : t('posts.report.already_reported'));
                onClose();
            } else {
                addToast('error', response?.errorMessage || t('posts.report.error'));
            }
        } catch (err) {
            const mensaje = err.response?.data?.errorMessage || err.response?.data?.message;
            addToast('error', mensaje || t('posts.report.error'));
        } finally {
            setSending(false);
        }
    };

    return (
        <Modal isOpen onClose={onClose} title={t('posts.report.title')} maxWidth="480px">
            <p style={{ margin: '0 0 1.25rem', color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                {t('posts.report.subtitle')}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {REPORT_REASONS.map((option) => {
                    const { code } = option;
                    const Icon = option.icon;
                    const selected = reason === code;
                    return (
                        <button
                            key={code}
                            type="button"
                            onClick={() => setReason(code)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.8rem 0.9rem',
                                borderRadius: '0.7rem',
                                border: `1px solid ${selected ? 'var(--primary)' : 'var(--stroke)'}`,
                                background: selected ? 'rgba(212, 144, 0, 0.08)' : 'var(--bg-white)',
                                color: 'var(--text-main)',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            <Icon size={18} color={selected ? 'var(--primary)' : 'var(--text-muted)'} />
                            <span style={{ flex: 1, fontSize: '0.92rem', fontWeight: selected ? '700' : '500' }}>
                                {t(`posts.report.reasons.${code.toLowerCase()}`)}
                            </span>
                        </button>
                    );
                })}
            </div>

            <label style={{
                display: 'block',
                margin: '1.25rem 0 0.4rem',
                fontSize: '0.8rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: 'var(--text-muted)'
            }}>
                {t('posts.report.comment_label')}
            </label>
            <textarea
                value={comment}
                maxLength={1000}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t('posts.report.comment_placeholder')}
                style={{
                    width: '100%',
                    minHeight: '86px',
                    resize: 'vertical',
                    padding: '0.75rem',
                    borderRadius: '0.7rem',
                    border: '1px solid var(--stroke)',
                    background: 'var(--bg-light)',
                    color: 'var(--text-main)',
                    fontFamily: 'inherit',
                    fontSize: '0.92rem',
                    outline: 'none'
                }}
            />

            <p style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.45rem',
                margin: '1rem 0 0',
                fontSize: '0.82rem',
                color: 'var(--text-muted)',
                lineHeight: 1.45
            }}>
                <ShieldCheck size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                {t('posts.report.privacy_note')}
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose} disabled={sending}>
                    {t('common.cancel')}
                </button>
                <button
                    type="button"
                    className="btn btn-primary"
                    style={{
                        flex: 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        opacity: !reason || sending ? 0.6 : 1
                    }}
                    onClick={submit}
                    disabled={!reason || sending}
                >
                    {sending
                        ? <Loader2 size={17} style={{ animation: 'cs-spin 1s linear infinite' }} />
                        : <Flag size={17} />}
                    {t('posts.report.submit')}
                </button>
            </div>
        </Modal>
    );
};

export default ReportPostModal;
