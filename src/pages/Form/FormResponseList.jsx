import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, ChevronRight, Loader2, User,
    Calendar, CheckCircle, Info, Eye, ClipboardList
} from 'lucide-react';
import { formResponseService } from '../../services/api';
import { useTranslation } from 'react-i18next';
const LANGUAGE_IDS = {
    en: '11e8ba3a-b290-4a2c-9dad-0f40e457f72c',
    es: '6892a523-0dc1-4e3b-9ddd-c9a558c7920b'
};

const FormResponseList = () => {
    const { t, i18n } = useTranslation();
    const { id: formId } = useParams();
    const navigate = useNavigate();

    const [responses, setResponses] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchResponses();
    }, [formId, page, pageSize, i18n.language]);

    const fetchResponses = async () => {
        setLoading(true);
        try {
            const lang = i18n.language.substring(0, 2).toLowerCase();
            const languageId = LANGUAGE_IDS[lang] || LANGUAGE_IDS.en;
            const response = await formResponseService.getAdminFormResponses(formId, page, pageSize, languageId);
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

    if (loading && page === 1) {
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
                    className="btn-back-premium"
                    title={t('common.back', 'Volver')}
                >
                    <ArrowLeft size={20} />
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
                                onClick={() => navigate(`/forms/response/${resp.userFormResponseId}`, { state: { response: resp } })}
                                style={{
                                    padding: '1.25rem 1.5rem',
                                    borderBottom: '1px solid var(--glass-border)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}
                                className="hover-item"
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
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {resp.isComplete && (
                                            <span style={{ fontSize: '0.65rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '1px 6px', borderRadius: '4px', fontWeight: '600' }}>
                                                {t('common.active')}
                                            </span>
                                        )}
                                        <ChevronRight size={16} color="var(--text-muted)" />
                                    </div>
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
        </div>
    );
};

export default FormResponseList;
