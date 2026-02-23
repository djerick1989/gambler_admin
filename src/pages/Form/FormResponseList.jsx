import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft, ChevronRight, Loader2, User,
    Calendar, CheckCircle, Info, Eye, ClipboardList
} from 'lucide-react';
import { formResponseService } from '../../services/api';
import { useTranslation } from 'react-i18next';

const FormResponseList = () => {
    const { t } = useTranslation();
    const { id: formId } = useParams();
    const navigate = useNavigate();

    const [responses, setResponses] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedResponse, setSelectedResponse] = useState(null);

    useEffect(() => {
        fetchResponses();
    }, [formId, page, pageSize]);

    const fetchResponses = async () => {
        setLoading(true);
        try {
            const response = await formResponseService.getAdminFormResponses(formId, page, pageSize);
            if (response.status) {
                setResponses(response.data.items);
                setTotalCount(response.data.totalCount);
                setTotalPages(response.data.totalPages);
            }
        } catch (err) {
            console.error("Error fetching form responses:", err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    if (loading && page === 1 && !selectedResponse) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                <Loader2 size={48} className="animate-spin" color="var(--primary)" />
            </div>
        );
    }

    return (
        <div style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    onClick={() => navigate('/forms')}
                    className="btn"
                    style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)' }}
                >
                    <ChevronLeft size={24} />
                </button>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: '800', marginBottom: '0.25rem' }}>
                        {t('forms.responses_title')}
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>
                        {t('forms.responses_count', { count: totalCount })}
                    </p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: selectedResponse ? '1fr 1.5fr' : '1fr', gap: '2rem', transition: 'all 0.3s' }}>
                {/* List of Responses */}
                <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)', fontWeight: '600' }}>
                        {t('forms.user')}
                    </div>
                    <div style={{ maxHeight: 'calc(100vh - 350px)', overflowY: 'auto' }}>
                        {responses.length === 0 ? (
                            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <ClipboardList size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                <p>{t('forms.no_responses')}</p>
                            </div>
                        ) : (
                            responses.map((resp) => (
                                <div
                                    key={resp.userFormResponseId}
                                    onClick={() => setSelectedResponse(resp)}
                                    style={{
                                        padding: '1.25rem 1.5rem',
                                        borderBottom: '1px solid var(--glass-border)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        background: selectedResponse?.userFormResponseId === resp.userFormResponseId ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        {resp.user?.avatar ? (
                                            <img src={resp.user.avatar} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <User size={20} color="var(--text-muted)" />
                                            </div>
                                        )}
                                        <div>
                                            <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{resp.user?.name || resp.user?.nickName || 'Anonymous'}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{resp.user?.email}</div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <Calendar size={12} />
                                            {new Date(resp.completedAt).toLocaleDateString()}
                                        </div>
                                        {resp.isComplete && (
                                            <span style={{ fontSize: '0.65rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '1px 6px', borderRadius: '4px', fontWeight: '600' }}>
                                                {t('common.active')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Pagination */}
                    <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', borderTop: '1px solid var(--glass-border)', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{t('common.rows_per_page')}</span>
                            <select
                                value={pageSize}
                                onChange={(e) => {
                                    setPage(1);
                                    setPageSize(parseInt(e.target.value));
                                }}
                                style={{
                                    background: '#FFFFFF',
                                    border: '1px solid var(--stroke)',
                                    borderRadius: '0.4rem',
                                    color: 'var(--text-main)',
                                    padding: '0.25rem 0.5rem',
                                    fontSize: '0.875rem',
                                    cursor: 'pointer',
                                    outline: 'none'
                                }}
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                style={{ background: 'none', border: 'none', color: page === 1 ? 'var(--text-muted)' : 'var(--text-main)', cursor: page === 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-main)' }}>
                                {t('common.page_x_of_y', { current: page, total: totalPages })}
                            </span>
                            <button
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                style={{ background: 'none', border: 'none', color: page >= totalPages ? 'var(--text-muted)' : 'var(--text-main)', cursor: page >= totalPages ? 'default' : 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Response Details */}
                {selectedResponse && (
                    <div className="glass-card" style={{ padding: '2rem', maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                            <div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>{t('forms.response_details')}</h2>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <User size={14} />
                                        {selectedResponse.user?.name} (@{selectedResponse.user?.nickName})
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <Calendar size={14} />
                                        {formatDate(selectedResponse.completedAt)}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedResponse(null)}
                                className="btn"
                                style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
                            >
                                {t('common.cancel')}
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            {selectedResponse.questions?.sort((a, b) => a.order - b.order).map((q) => (
                                <div key={q.questionId} style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--glass-border)' }}>
                                    <div style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-main)', display: 'flex', gap: '0.75rem' }}>
                                        <span style={{ color: 'var(--primary)', opacity: 0.6 }}>{q.order}.</span>
                                        {q.questionText}
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {q.answerOptions?.sort((a, b) => a.order - b.order).map((opt) => {
                                            const isSelected = opt.isSelected || q.userAnswers?.some(ua => ua.answerOptionId === opt.answerOptionId);
                                            return (
                                                <div
                                                    key={opt.answerOptionId}
                                                    style={{
                                                        padding: '0.75rem 1rem',
                                                        borderRadius: '0.75rem',
                                                        background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'rgba(0,0,0,0.05)',
                                                        border: `1px solid ${isSelected ? '#3b82f6' : 'transparent'}`,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.75rem',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <div style={{
                                                        width: '20px',
                                                        height: '20px',
                                                        borderRadius: q.questionType === 1 ? '4px' : '50%',
                                                        border: `2px solid ${isSelected ? '#3b82f6' : 'var(--text-muted)'}`,
                                                        background: isSelected ? '#3b82f6' : 'transparent',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}>
                                                        {isSelected && <CheckCircle size={14} color="white" />}
                                                    </div>
                                                    <span style={{
                                                        color: isSelected ? 'var(--text-main)' : 'var(--text-muted)',
                                                        fontWeight: isSelected ? '600' : '400'
                                                    }}>
                                                        {opt.optionText}
                                                    </span>
                                                </div>
                                            );
                                        })}

                                        {q.questionType === 2 && (
                                            <div style={{
                                                padding: '1rem',
                                                borderRadius: '0.75rem',
                                                background: 'rgba(59, 130, 246, 0.05)',
                                                border: '1px solid rgba(59, 130, 246, 0.2)',
                                                color: 'var(--text-main)',
                                                fontStyle: 'italic'
                                            }}>
                                                {q.userAnswers?.[0]?.answerText || t('common.none')}
                                            </div>
                                        )}

                                        {q.answerOptions?.length === 0 && q.questionType !== 2 && (
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                                {t('forms.empty_options')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FormResponseList;
