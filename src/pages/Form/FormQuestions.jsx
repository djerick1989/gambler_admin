import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Plus, Edit2, Trash2, ChevronLeft, Loader2,
    ChevronDown, ChevronUp, Check, X, List,
    MoreVertical, GripVertical
} from 'lucide-react';
import { formService } from '../../services/api';
import { useTranslation } from 'react-i18next';
import Modal from '../../components/Modal';

const FormQuestions = () => {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();

    const [form, setForm] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Modals
    const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
    const [isOptionModalOpen, setIsOptionModalOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [editingOption, setEditingOption] = useState(null);
    const [selectedQuestionId, setSelectedQuestionId] = useState(null);

    const LANGUAGE_IDS = {
        en: '11e8ba3a-b290-4a2c-9dad-0f40e457f72c',
        es: '6892a523-0dc1-4e3b-9ddd-c9a558c7920b'
    };
    const currentLanguageId = LANGUAGE_IDS[i18n.language.substring(0, 2)] || LANGUAGE_IDS.en;

    const [questionData, setQuestionData] = useState({
        formId: id,
        languageId: currentLanguageId,
        questionText: '',
        questionType: 0,
        order: 1,
        required: true,
        answerOptions: [] // Only for creation
    });

    const [optionData, setOptionData] = useState({
        questionId: '',
        languageId: currentLanguageId,
        optionText: '',
        order: 0
    });

    const QUESTION_TYPES = [
        { value: 0, label: t('forms.question_types.MULTIPLE_CHOICE_SINGLE') },
        { value: 1, label: t('forms.question_types.MULTIPLE_CHOICE_MULTIPLE') },
        { value: 2, label: t('forms.question_types.YES_NO') },
        { value: 3, label: t('forms.question_types.OPEN_TEXT') }
    ];

    useEffect(() => {
        fetchFormData();
    }, [id, currentLanguageId]);

    const fetchFormData = async () => {
        setLoading(true);
        try {
            const response = await formService.getFormById(id, currentLanguageId);
            if (response.status) {
                setForm(response.data);
            }
        } catch (err) {
            console.error("Error fetching form questions:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenQuestionModal = (question = null) => {
        if (question) {
            const translation = question.translations?.[0] || {};
            setEditingQuestion(question);
            setQuestionData({
                formId: id,
                languageId: currentLanguageId,
                questionText: translation.questionText || '',
                questionType: question.questionType,
                order: question.order,
                required: question.required,
                answerOptions: []
            });
        } else {
            setEditingQuestion(null);
            setQuestionData({
                formId: id,
                languageId: currentLanguageId,
                questionText: '',
                questionType: 0,
                order: form?.questions?.length ? Math.max(...form.questions.map(q => q.order)) + 1 : 1,
                required: true,
                answerOptions: []
            });
        }
        setIsQuestionModalOpen(true);
    };

    const handleSaveQuestion = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            let response;
            if (editingQuestion) {
                response = await formService.updateQuestion(editingQuestion.questionId, questionData, currentLanguageId);
            } else {
                // If YES_NO type, we might want to pre-fill answerOptions
                let finalData = { ...questionData };
                if (questionData.questionType === 2 && !questionData.answerOptions.length) {
                    finalData.answerOptions = ["Si", "No"];
                }
                response = await formService.createQuestion(finalData, currentLanguageId);
            }

            if (response.status) {
                setIsQuestionModalOpen(false);
                fetchFormData();
            }
        } catch (err) {
            console.error("Error saving question:", err);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteQuestion = async (questionId) => {
        if (window.confirm(t('common.delete_confirm'))) {
            try {
                const response = await formService.deleteQuestion(questionId, currentLanguageId);
                if (response.status) {
                    fetchFormData();
                }
            } catch (err) {
                console.error("Error deleting question:", err);
            }
        }
    };

    const handleOpenOptionModal = (questionId, option = null) => {
        setSelectedQuestionId(questionId);
        if (option) {
            const translation = option.translations?.[0] || {};
            setEditingOption(option);
            setOptionData({
                questionId: questionId,
                languageId: currentLanguageId,
                optionText: translation.optionText || '',
                order: option.order
            });
        } else {
            setEditingOption(null);
            const question = form.questions.find(q => q.questionId === questionId);
            setOptionData({
                questionId: questionId,
                languageId: currentLanguageId,
                optionText: '',
                order: question.answerOptions?.length || 0
            });
        }
        setIsOptionModalOpen(true);
    };

    const handleSaveOption = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            let response;
            if (editingOption) {
                response = await formService.updateOption(editingOption.answerOptionId, optionData, currentLanguageId);
            } else {
                response = await formService.createOption(optionData, currentLanguageId);
            }

            if (response.status) {
                setIsOptionModalOpen(false);
                fetchFormData();
            }
        } catch (err) {
            console.error("Error saving option:", err);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteOption = async (optionId) => {
        if (window.confirm(t('common.delete_confirm'))) {
            try {
                const response = await formService.deleteOption(optionId, currentLanguageId);
                if (response.status) {
                    fetchFormData();
                }
            } catch (err) {
                console.error("Error deleting option:", err);
            }
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <Loader2 size={48} className="animate-spin" color="var(--primary)" />
            </div>
        );
    }

    const formTitle = form?.translations?.[0]?.title || 'Form';

    return (
        <div style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate('/forms')} className="btn" style={{ padding: '0.5rem' }}>
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 style={{ fontSize: '1.875rem', fontWeight: '800' }}>
                            {t('forms.questions')}
                        </h1>
                        <p style={{ color: 'var(--text-muted)' }}>{formTitle}</p>
                    </div>
                </div>

                <button
                    onClick={() => handleOpenQuestionModal()}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Plus size={20} />
                    {t('forms.add_question')}
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {form?.questions?.sort((a, b) => a.order - b.order).map((question, index) => {
                    const translation = question.translations?.[0] || {};
                    return (
                        <div key={question.questionId} className="glass-card animate-fade-in" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{
                                padding: '1.25rem 1.5rem',
                                background: 'rgba(255,255,255,0.02)',
                                borderBottom: '1px solid var(--glass-border)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <span style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '50%',
                                        background: 'var(--primary)',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.875rem',
                                        fontWeight: '700'
                                    }}>
                                        {question.order}
                                    </span>
                                    <div>
                                        <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{translation.questionText || t('common.untitled_question')}</div>
                                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {QUESTION_TYPES.find(t => t.value === question.questionType)?.label}
                                            </span>
                                            {question.required && (
                                                <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: '600' }}>* {t('forms.required')}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => handleOpenQuestionModal(question)}
                                        className="btn"
                                        style={{ padding: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteQuestion(question.questionId)}
                                        className="btn"
                                        style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Options Section */}
                            {(question.questionType === 0 || question.questionType === 1 || question.questionType === 2) && (
                                <div style={{ padding: '1.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            {t('forms.options')}
                                        </h4>
                                        <button
                                            onClick={() => handleOpenOptionModal(question.questionId)}
                                            style={{
                                                background: 'transparent',
                                                border: '1px dashed var(--stroke)',
                                                color: 'var(--primary)',
                                                fontSize: '0.75rem',
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '0.5rem',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.25rem'
                                            }}
                                        >
                                            <Plus size={14} /> {t('forms.add_option')}
                                        </button>
                                    </div>

                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                                        {question.answerOptions?.sort((a, b) => a.order - b.order).map((option) => (
                                            <div key={option.answerOptionId} className="glass-card" style={{
                                                padding: '0.5rem 1rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.75rem',
                                                borderRadius: '0.75rem',
                                                border: '1px solid var(--glass-border)',
                                                background: 'rgba(255,255,255,0.03)'
                                            }}>
                                                <span style={{ fontSize: '0.9rem' }}>{option.translations?.[0]?.optionText}</span>
                                                <div style={{ display: 'flex', gap: '0.25rem', borderLeft: '1px solid var(--stroke)', paddingLeft: '0.5rem' }}>
                                                    <button
                                                        onClick={() => handleOpenOptionModal(question.questionId, option)}
                                                        style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '0.2rem' }}
                                                    >
                                                        <Edit2 size={12} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteOption(option.answerOptionId)}
                                                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.2rem' }}
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {(!question.answerOptions || question.answerOptions.length === 0) && (
                                            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                                {t('forms.empty_options')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                {(!form?.questions || form.questions.length === 0) && (
                    <div className="glass-card" style={{ padding: '4rem', textAlign: 'center' }}>
                        <List size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                        <p>{t('forms.empty_questions')}</p>
                    </div>
                )}
            </div>

            {/* Question Modal */}
            <Modal
                isOpen={isQuestionModalOpen}
                onClose={() => setIsQuestionModalOpen(false)}
                title={editingQuestion ? t('forms.edit_question') : t('forms.add_question')}
                maxWidth="600px"
            >
                <form onSubmit={handleSaveQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="input-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>{t('forms.question_text') || 'Question Text'}</label>
                        <textarea
                            className="form-control"
                            required
                            value={questionData.questionText}
                            onChange={(e) => setQuestionData(prev => ({ ...prev, questionText: e.target.value }))}
                            style={{ width: '100%', padding: '0.85rem', borderRadius: '0.75rem', background: 'var(--bg-light)', border: '1px solid var(--stroke)', color: 'var(--text-main)', minHeight: '80px' }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="input-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>{t('forms.question_type')}</label>
                            <select
                                className="form-control"
                                value={questionData.questionType}
                                onChange={(e) => setQuestionData(prev => ({ ...prev, questionType: parseInt(e.target.value) }))}
                                style={{ width: '100%', padding: '0.85rem', borderRadius: '0.75rem', background: 'var(--bg-light)', border: '1px solid var(--stroke)', color: 'var(--text-main)' }}
                            >
                                {QUESTION_TYPES.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="input-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>{t('forms.order')}</label>
                            <input
                                type="number"
                                className="form-control"
                                value={questionData.order}
                                onChange={(e) => setQuestionData(prev => ({ ...prev, order: parseInt(e.target.value) }))}
                                style={{ width: '100%', padding: '0.85rem', borderRadius: '0.75rem', background: 'var(--bg-light)', border: '1px solid var(--stroke)', color: 'var(--text-main)' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <input
                            type="checkbox"
                            id="required"
                            checked={questionData.required}
                            onChange={(e) => setQuestionData(prev => ({ ...prev, required: e.target.checked }))}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <label htmlFor="required" style={{ fontWeight: '600', cursor: 'pointer' }}>{t('forms.required')}</label>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                        <button type="button" onClick={() => setIsQuestionModalOpen(false)} className="btn" style={{ background: 'transparent', border: '1px solid var(--stroke)' }}>
                            {t('common.cancel')}
                        </button>
                        <button type="submit" disabled={saving} className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
                            {saving ? <Loader2 size={20} className="animate-spin" /> : t('common.save')}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Option Modal */}
            <Modal
                isOpen={isOptionModalOpen}
                onClose={() => setIsOptionModalOpen(false)}
                title={editingOption ? t('forms.edit_option') : t('forms.add_option')}
                maxWidth="500px"
            >
                <form onSubmit={handleSaveOption} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="input-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>{t('forms.option_text') || 'Option Text'}</label>
                        <input
                            type="text"
                            className="form-control"
                            required
                            value={optionData.optionText}
                            onChange={(e) => setOptionData(prev => ({ ...prev, optionText: e.target.value }))}
                            style={{ width: '100%', padding: '0.85rem', borderRadius: '0.75rem', background: 'var(--bg-light)', border: '1px solid var(--stroke)', color: 'var(--text-main)' }}
                        />
                    </div>

                    <div className="input-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>{t('forms.order')}</label>
                        <input
                            type="number"
                            className="form-control"
                            value={optionData.order}
                            onChange={(e) => setOptionData(prev => ({ ...prev, order: parseInt(e.target.value) }))}
                            style={{ width: '100%', padding: '0.85rem', borderRadius: '0.75rem', background: 'var(--bg-light)', border: '1px solid var(--stroke)', color: 'var(--text-main)' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                        <button type="button" onClick={() => setIsOptionModalOpen(false)} className="btn" style={{ background: 'transparent', border: '1px solid var(--stroke)' }}>
                            {t('common.cancel')}
                        </button>
                        <button type="submit" disabled={saving} className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
                            {saving ? <Loader2 size={20} className="animate-spin" /> : t('common.save')}
                        </button>
                    </div>
                </form>
            </Modal>

            <style>{`
                .animate-fade-in {
                    animation: fadeIn 0.3s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default FormQuestions;
