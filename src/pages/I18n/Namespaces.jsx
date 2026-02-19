import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Edit2, Trash2, Loader2,
    AlertCircle, Search, ChevronLeft, ChevronRight, X, Save
} from 'lucide-react';
import { i18nService } from '../../services/api';
import { useTranslation } from 'react-i18next';

const Namespaces = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    // State
    const [namespaces, setNamespaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);

    // Modal state for Create/Edit
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNamespace, setEditingNamespace] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchNamespaces();
    }, [page, pageSize]);

    const fetchNamespaces = async () => {
        setLoading(true);
        try {
            const response = await i18nService.getAllNamespaces(page, pageSize);
            if (response.status && response.data) {
                setNamespaces(response.data.namespaceDtos || []);
                setTotalPages(response.data.lastPage || 1);
                setTotalRecords(response.data.totalRecords || 0);
            }
        } catch (err) {
            console.error("Error fetching namespaces:", err);
            setError("Error loading namespaces");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (ns = null) => {
        if (ns) {
            setEditingNamespace(ns);
            setFormData({ name: ns.name, description: ns.description || '' });
        } else {
            setEditingNamespace(null);
            setFormData({ name: '', description: '' });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingNamespace(null);
        setFormData({ name: '', description: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (editingNamespace) {
                await i18nService.updateNamespace({
                    namespaceId: editingNamespace.namespaceId,
                    ...formData
                });
            } else {
                await i18nService.createNamespace(formData);
            }
            handleCloseModal();
            fetchNamespaces();
        } catch (err) {
            console.error("Error saving namespace:", err);
            alert("Error saving namespace");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this namespace?")) {
            try {
                await i18nService.deleteNamespace(id);
                fetchNamespaces();
            } catch (err) {
                console.error("Error deleting namespace:", err);
                alert("Error deleting namespace");
            }
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: '800' }}>{t('i18n.namespaces_title')}</h1>
                    <p style={{ color: 'var(--text-muted)' }}>{t('i18n.namespaces_subtitle')}</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Plus size={20} /> {t('i18n.add_namespace')}
                </button>
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
            ) : (
                <div className="glass-card" style={{ overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--glass-border)' }}>
                                <th style={{ padding: '1.25rem' }}>{t('i18n.table.name')}</th>
                                <th style={{ padding: '1.25rem' }}>{t('i18n.table.description')}</th>
                                <th style={{ padding: '1.25rem', textAlign: 'right' }}>{t('i18n.table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {namespaces.map(ns => (
                                <tr key={ns.namespaceId} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }} className="table-row-hover">
                                    <td
                                        style={{ padding: '1.25rem', fontWeight: '600', color: 'var(--primary)', cursor: 'pointer' }}
                                        onClick={() => navigate(`/i18n/namespace/${ns.namespaceId}`)}
                                    >
                                        {ns.name}
                                    </td>
                                    <td style={{ padding: '1.25rem', color: 'var(--text-muted)' }}>{ns.description || '-'}</td>
                                    <td style={{ padding: '1.25rem' }}>
                                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => handleOpenModal(ns)}
                                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(ns.namespaceId)}
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
                                <option value={10} style={{ background: '#FFFFFF', color: 'var(--text-main)' }}>10</option>
                                <option value={20} style={{ background: '#FFFFFF', color: 'var(--text-main)' }}>20</option>
                                <option value={50} style={{ background: '#FFFFFF', color: 'var(--text-main)' }}>50</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                                style={{ background: 'none', border: 'none', color: page === 1 ? 'var(--text-muted)' : 'var(--text-main)', cursor: page === 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                                {t('common.page_x_of_y', { current: page, total: totalPages })}
                            </span>
                            <button
                                disabled={page >= totalPages}
                                onClick={() => setPage(page + 1)}
                                style={{ background: 'none', border: 'none', color: page >= totalPages ? 'var(--text-muted)' : 'var(--text-main)', cursor: page >= totalPages ? 'default' : 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Namespace Modal */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)'
                }}>
                    <div className="glass-card animate-scale-in" style={{ width: '100%', maxWidth: '500px', padding: '2rem', position: 'relative' }}>
                        <button onClick={handleCloseModal} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                            <X size={24} />
                        </button>

                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                            {editingNamespace ? t('i18n.edit_namespace') : t('i18n.add_namespace')}
                        </h2>

                        <form onSubmit={handleSubmit}>
                            <div className="input-group">
                                <label>{t('i18n.form.name')}</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="e.g. OnboardingScreen"
                                />
                            </div>
                            <div className="input-group">
                                <label>{t('i18n.form.description')}</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    style={{
                                        width: '100%', minHeight: '100px', padding: '0.75rem',
                                        background: 'white', border: '1px solid var(--stroke)',
                                        borderRadius: '0.5rem', color: 'var(--text-main)',
                                        outline: 'none'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button type="button" onClick={handleCloseModal} className="btn btn-secondary" style={{ flex: 1 }}>
                                    {t('onboarding.form.cancel')}
                                </button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} disabled={isSaving}>
                                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                    {t('onboarding.form.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Namespaces;
