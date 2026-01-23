import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Plus, Edit2, Trash2, Loader2,
    AlertCircle, ChevronLeft, ChevronRight, Type, Globe, ArrowLeft
} from 'lucide-react';
import { i18nService, languageService } from '../../services/api';
import { useTranslation } from 'react-i18next';

const Keys = () => {
    const { t, i18n: i18nInstance } = useTranslation();
    const { id: namespaceId } = useParams();
    const navigate = useNavigate();

    // State
    const [keys, setKeys] = useState([]);
    const [namespace, setNamespace] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [languages, setLanguages] = useState([]);
    const [selectedLanguageId, setSelectedLanguageId] = useState('');

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [totalRecords, setTotalRecords] = useState(0);

    useEffect(() => {
        fetchNamespace();
        fetchLanguages();
    }, [namespaceId]);

    useEffect(() => {
        fetchKeys();
    }, [namespaceId, page, pageSize, selectedLanguageId]);

    const fetchNamespace = async () => {
        try {
            const response = await i18nService.getNamespaceById(namespaceId);
            if (response.status) setNamespace(response.data);
        } catch (err) {
            console.error("Error fetching namespace details:", err);
        }
    };

    const fetchLanguages = async () => {
        try {
            const response = await languageService.getAll();
            if (response.status) setLanguages(response.data);
        } catch (err) {
            console.error("Error fetching languages:", err);
        }
    };

    const fetchKeys = async () => {
        setLoading(true);
        try {
            const response = await i18nService.getKeysByNamespaceId(
                namespaceId, page, pageSize, selectedLanguageId || null
            );
            if (response.status && response.data) {
                setKeys(response.data.keyDtos || []);
                setTotalPages(response.data.lastPage || 1);
                setTotalRecords(response.data.totalRecords || 0);
            }
        } catch (err) {
            console.error("Error fetching keys:", err);
            setError("Error loading keys");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteKey = async (keyId) => {
        if (window.confirm("Are you sure you want to delete this key and all its translations?")) {
            try {
                await i18nService.deleteKey(keyId);
                fetchKeys();
            } catch (err) {
                console.error("Error deleting key:", err);
                alert("Error deleting key");
            }
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={() => navigate('/i18n')}
                        className="btn"
                        style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '0.5rem' }}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 style={{ fontSize: '1.875rem', fontWeight: '800' }}>
                            {t('i18n.keys_title')}
                        </h1>
                        <p style={{ color: 'var(--text-muted)' }}>
                            {t('i18n.keys_subtitle', { name: namespace?.name || '...' })}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => navigate(`/i18n/namespace/${namespaceId}/key/new`)}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Plus size={20} /> {t('i18n.add_key')}
                </button>
            </div>

            {/* Filters */}
            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Globe size={18} color="var(--text-muted)" />
                    <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{t('common.language')}:</span>
                    <select
                        value={selectedLanguageId}
                        onChange={(e) => { setSelectedLanguageId(e.target.value); setPage(1); }}
                        style={{
                            background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
                            borderRadius: '0.4rem', color: 'white', padding: '0.4rem 0.8rem', outline: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="" style={{ background: '#1a1a2e', color: 'white' }}>{i18nInstance.language.startsWith('es') ? 'Todos' : 'All'}</option>
                        {languages.map(lang => (
                            <option key={lang.languageId} value={lang.languageId} style={{ background: '#1a1a2e', color: 'white' }}>{lang.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                    <Loader2 size={48} className="animate-spin" color="var(--primary)" />
                </div>
            ) : error ? (
                <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)' }}>
                    <AlertCircle size={48} style={{ margin: '0 auto 1rem' }} />
                    <p>{error}</p>
                </div>
            ) : keys.length === 0 ? (
                <div className="glass-card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Type size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                    <p>No keys found for this namespace.</p>
                </div>
            ) : (
                <div className="glass-card" style={{ overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--glass-border)' }}>
                                <th style={{ padding: '1.25rem' }}>{t('i18n.table.key')}</th>
                                <th style={{ padding: '1.25rem' }}>{t('i18n.table.translations')}</th>
                                <th style={{ padding: '1.25rem', textAlign: 'right' }}>{t('i18n.table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {keys.map(k => (
                                <tr key={k.keyId} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                    <td style={{ padding: '1.25rem', verticalAlign: 'top' }}>
                                        <code style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', padding: '0.2rem 0.4rem', borderRadius: '0.3rem', fontSize: '0.9rem' }}>
                                            {k.key}
                                        </code>
                                    </td>
                                    <td style={{ padding: '1.25rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            {k.translations?.map(tr => (
                                                <div key={tr.translationId} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.875rem' }}>
                                                    <span style={{ fontWeight: 'bold', color: 'var(--text-muted)', minWidth: '30px' }}>
                                                        {languages.find(l => l.languageId === tr.languageId)?.code?.toUpperCase() || tr.languageId.substring(0, 2).toUpperCase()}
                                                    </span>
                                                    <span style={{ color: 'var(--text-main)' }}>{tr.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.25rem', verticalAlign: 'top' }}>
                                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => navigate(`/i18n/namespace/${namespaceId}/key/edit/${k.keyId}`)}
                                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteKey(k.keyId)}
                                                style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', borderTop: '1px solid var(--glass-border)', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{t('common.rows_per_page')}</span>
                            <select
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(parseInt(e.target.value));
                                    setPage(1);
                                }}
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '0.4rem',
                                    color: 'white',
                                    padding: '0.25rem 0.5rem',
                                    fontSize: '0.875rem',
                                    cursor: 'pointer',
                                    outline: 'none'
                                }}
                            >
                                <option value={10} style={{ background: '#1a1a2e', color: 'white' }}>10</option>
                                <option value={20} style={{ background: '#1a1a2e', color: 'white' }}>20</option>
                                <option value={50} style={{ background: '#1a1a2e', color: 'white' }}>50</option>
                                <option value={100} style={{ background: '#1a1a2e', color: 'white' }}>100</option>
                                <option value={200} style={{ background: '#1a1a2e', color: 'white' }}>200</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                                style={{ background: 'none', border: 'none', color: page === 1 ? 'var(--text-muted)' : 'white', cursor: page === 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                                {t('common.page_x_of_y', { current: page, total: totalPages })}
                            </span>
                            <button
                                disabled={page >= totalPages}
                                onClick={() => setPage(page + 1)}
                                style={{ background: 'none', border: 'none', color: page >= totalPages ? 'var(--text-muted)' : 'white', cursor: page >= totalPages ? 'default' : 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Keys;
