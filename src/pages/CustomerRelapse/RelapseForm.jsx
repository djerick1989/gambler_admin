import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, RefreshCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { relapseService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { getLanguageId } from '../../utils/languages';
import { getApiErrorMessage, isSubscriptionRequiredError } from '../../utils/subscription';
import {
    EMOTION_OPTIONS,
    FINANCING_OPTIONS,
    TRIGGER_OPTIONS,
    findOptionByApiValue,
    getTranslatedRelapseText,
    normalizeRelapseDate,
    normalizeRelapseTime
} from './relapseOptions';
import './Relapse.css';

const today = new Date().toISOString().slice(0, 10);

const emptyForm = {
    date: today,
    approximateTime: '',
    amountSpent: 0,
    financingMethod: '',
    emotion: '',
    trigger: '',
    sharedWithSomeone: false,
    reflection: ''
};

const RelapseForm = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();
    const { user } = useAuth();
    const { addToast } = useNotification();
    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(Boolean(id && !location.state?.relapse));
    const [saving, setSaving] = useState(false);

    const gamblerId = user?.gambler?.gamblerId;
    const languageId = getLanguageId(i18n.language);
    const isEdit = Boolean(id);

    useEffect(() => {
        const stateRelapse = location.state?.relapse;
        if (stateRelapse) {
            fillForm(stateRelapse);
            setLoading(false);
            return;
        }

        if (!id) {
            setForm(emptyForm);
            setLoading(false);
            return;
        }

        const fetchRelapse = async () => {
            setLoading(true);
            try {
                const response = await relapseService.getMy({ page: 1, pageSize: 100, languageId });
                const items = Array.isArray(response?.data) ? response.data : response?.data?.items || response?.data?.relapses || [];
                const found = items.find(item => item.relapseId === id);
                if (found) {
                    fillForm(found);
                } else {
                    addToast('error', t('relapses.not_found'));
                    navigate('/customer/relapses');
                }
            } catch (err) {
                console.error('Error loading relapse:', err);
                addToast('error', t('relapses.load_error'));
            } finally {
                setLoading(false);
            }
        };

        fetchRelapse();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, languageId]);

    const fillForm = (relapse) => {
        setForm({
            date: normalizeRelapseDate(relapse.date),
            approximateTime: normalizeRelapseTime(relapse.approximateTime),
            amountSpent: relapse.amountSpent ?? 0,
            financingMethod: findOptionByApiValue(FINANCING_OPTIONS, relapse.financingMethod).value,
            emotion: findOptionByApiValue(EMOTION_OPTIONS, relapse.emotion).value,
            trigger: findOptionByApiValue(TRIGGER_OPTIONS, relapse.trigger).value,
            sharedWithSomeone: Boolean(relapse.sharedWithSomeone),
            reflection: getTranslatedRelapseText(relapse, 'reflection', languageId)
        });
    };

    const isValid = useMemo(() => (
        Boolean(
            gamblerId &&
            form.date &&
            form.approximateTime &&
            Number(form.amountSpent) >= 0 &&
            form.financingMethod !== '' &&
            form.emotion !== '' &&
            form.trigger !== ''
        )
    ), [form, gamblerId]);

    const updateField = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!isValid || saving) return;

        setSaving(true);
        const payload = {
            gamblerId,
            date: form.date,
            approximateTime: form.approximateTime,
            amountSpent: Number(form.amountSpent) || 0,
            financingMethod: Number(form.financingMethod),
            emotion: Number(form.emotion),
            trigger: Number(form.trigger),
            sharedWithSomeone: form.sharedWithSomeone,
            reflection: form.reflection || ''
        };

        try {
            const response = isEdit
                ? await relapseService.update(id, payload, languageId)
                : await relapseService.create(payload, languageId);
            const relapse = response?.data;
            addToast('success', isEdit ? t('relapses.update_success') : t('relapses.create_success'));
            navigate(`/customer/relapses/${relapse?.relapseId || id}/conclusion`, { state: { relapse } });
        } catch (err) {
            console.error('Error saving relapse:', err);
            addToast('error', isSubscriptionRequiredError(err)
                ? getApiErrorMessage(err, t('subscriptions.relapses_limit'))
                : isEdit ? t('relapses.update_error') : t('relapses.create_error'));
        } finally {
            setSaving(false);
        }
    };

    const renderOptions = (options) => (
        <>
            <option value="">{t('relapses.select')}</option>
            {options.map(option => (
                <option key={option.value} value={option.value}>{t(option.labelKey)}</option>
            ))}
        </>
    );

    if (loading) {
        return (
            <div style={{ minHeight: '70vh', display: 'grid', placeItems: 'center' }}>
                <Loader2 size={48} className="animate-spin" color="var(--primary)" />
            </div>
        );
    }

    return (
        <div className="relapse-page">
            <header className="relapse-topbar">
                <div className="relapse-title">
                    <button type="button" className="relapse-back-button" onClick={() => navigate('/customer/relapses')}>
                        <ArrowLeft size={24} />
                    </button>
                    <h1>{isEdit ? t('relapses.edit_title') : t('relapses.add_title')}</h1>
                </div>
                <RefreshCcw size={32} color="var(--primary)" />
            </header>

            <form className="relapse-form-card" onSubmit={handleSubmit}>
                <div className="relapse-form-grid">
                    <div className="relapse-field">
                        <label>{t('relapses.date')}</label>
                        <input type="date" value={form.date} onChange={event => updateField('date', event.target.value)} />
                    </div>

                    <div className="relapse-field">
                        <label>{t('relapses.approximate_time')}</label>
                        <input type="time" value={form.approximateTime} onChange={event => updateField('approximateTime', event.target.value)} />
                    </div>

                    <div className="relapse-field">
                        <label>{t('relapses.amount_spent')}</label>
                        <div className="relapse-money-field">
                            <span>$</span>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.amountSpent}
                                onChange={event => updateField('amountSpent', event.target.value)}
                            />
                        </div>
                    </div>

                    <div className="relapse-field">
                        <label>{t('relapses.financing_method')}</label>
                        <select value={form.financingMethod} onChange={event => updateField('financingMethod', event.target.value)}>
                            {renderOptions(FINANCING_OPTIONS)}
                        </select>
                    </div>

                    <div className="relapse-field full">
                        <label>{t('relapses.emotion')}</label>
                        <select value={form.emotion} onChange={event => updateField('emotion', event.target.value)}>
                            {renderOptions(EMOTION_OPTIONS)}
                        </select>
                    </div>

                    <div className="relapse-field full">
                        <label>{t('relapses.trigger')}</label>
                        <select value={form.trigger} onChange={event => updateField('trigger', event.target.value)}>
                            {renderOptions(TRIGGER_OPTIONS)}
                        </select>
                    </div>

                    <div className="relapse-share-row">
                        <span className="relapse-share-label">{t('relapses.shared_with_someone')}</span>
                        <button
                            type="button"
                            className={`relapse-switch ${form.sharedWithSomeone ? 'on' : ''}`}
                            onClick={() => updateField('sharedWithSomeone', !form.sharedWithSomeone)}
                            aria-pressed={form.sharedWithSomeone}
                        >
                            <span>{form.sharedWithSomeone ? t('relapses.yes') : t('relapses.no')}</span>
                        </button>
                    </div>

                    <div className="relapse-field full">
                        <label>{t('relapses.reflection')}</label>
                        <textarea value={form.reflection} onChange={event => updateField('reflection', event.target.value)} />
                    </div>

                    <div className="relapse-form-actions">
                        <button className="relapse-primary-action" type="submit" disabled={!isValid || saving}>
                            {saving ? <Loader2 size={19} className="animate-spin" /> : null}
                            {isEdit ? t('common.edit') : t('common.send')}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default RelapseForm;
