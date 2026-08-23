import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, HelpCircle, Loader2, MessageSquareText, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { userFeedbackService } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import './HelpSupport.css';

const escapeHtml = (value = '') => (
    String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
);

const toFeedbackHtml = (value = '') => (
    `<p>${escapeHtml(value.trim()).replace(/\n/g, '<br/>')}</p>`
);

const CustomerHelpSupport = () => {
    const { t } = useTranslation();
    const { addToast } = useNotification();
    const [content, setContent] = useState('');
    const [saving, setSaving] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!content.trim() || saving) return;

        setSaving(true);
        try {
            await userFeedbackService.create({ content: toFeedbackHtml(content) });
            setSent(true);
            setContent('');
            addToast('success', t('help_support.submit_success'));
        } catch (err) {
            console.error('Error sending user feedback:', err);
            addToast('error', t('help_support.submit_error'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="help-support-page">
            <section className="help-support-hero">
                <div className="help-support-copy">
                    <span className="help-support-eyebrow">{t('help_support.customer_module')}</span>
                    <h1>{t('help_support.title')}</h1>
                    <p>{t('help_support.hero_text')}</p>
                    <Link className="help-support-faq" to="/customer/help-support/faq">
                        {t('help_support.go_to_faq')}
                        <ArrowRight size={18} />
                    </Link>
                </div>

                <div className="help-support-visual">
                    <img src="/assets/logo_gambler.png" alt="Ludopata" />
                    <div>
                        <strong>{t('help_support.faq_stat')}</strong>
                        <span>{t('help_support.faq_hint')}</span>
                    </div>
                </div>
            </section>

            {sent ? (
                <section className="help-support-confirmation">
                    <div className="help-support-confirmation-icon">
                        <CheckCircle2 size={42} />
                    </div>
                    <h2>{t('help_support.confirmation_title')}</h2>
                    <p>{t('help_support.confirmation_text')}</p>
                    <div className="help-support-confirmation-steps">
                        <span><MessageSquareText size={18} />{t('help_support.confirmation_step_review')}</span>
                        <span><CheckCircle2 size={18} />{t('help_support.confirmation_step_contact')}</span>
                    </div>
                    <button type="button" onClick={() => setSent(false)}>
                        {t('help_support.send_another')}
                    </button>
                </section>
            ) : (
                <section className="help-support-grid">
                    <div className="help-support-info">
                        <div className="help-support-info-icon">
                            <HelpCircle size={28} />
                        </div>
                        <h2>{t('help_support.problem_title')}</h2>
                        <p>{t('help_support.problem_text')}</p>
                        <ul>
                            <li>{t('help_support.reason_technical')}</li>
                            <li>{t('help_support.reason_account')}</li>
                            <li>{t('help_support.reason_recovery')}</li>
                        </ul>
                    </div>

                    <form className="help-support-form" onSubmit={handleSubmit}>
                        <label>{t('help_support.comment_label')}</label>
                        <textarea
                            value={content}
                            onChange={(event) => setContent(event.target.value)}
                            placeholder={t('help_support.comment_placeholder')}
                        />
                        <button type="submit" disabled={saving || !content.trim()}>
                            {saving ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                            {t('help_support.submit')}
                        </button>
                    </form>
                </section>
            )}
        </div>
    );
};

export default CustomerHelpSupport;
