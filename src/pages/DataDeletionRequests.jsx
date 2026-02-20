import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Trash2, CheckCircle, XCircle, Loader2, User,
    Calendar, AlertCircle, Send
} from 'lucide-react';
import { dataDeletionService } from '../services/api';
import { useTranslation } from 'react-i18next';
import Modal from '../components/Modal';

const DataDeletionRequests = () => {
    const { t } = useTranslation();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    // Modal state
    const [isDenialModalOpen, setIsDenialModalOpen] = useState(false);
    const [selectedRequestId, setSelectedRequestId] = useState(null);
    const [denialReason, setDenialReason] = useState("");

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const response = await dataDeletionService.list();
            if (response.status) {
                setRequests(response.data);
            }
        } catch (err) {
            console.error("Error fetching data deletion requests:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleOpenDenialModal = (requestId) => {
        setSelectedRequestId(requestId);
        setDenialReason("");
        setIsDenialModalOpen(true);
    };

    const handleProcess = async (requestId, status, reason = "") => {
        if (!window.confirm(t('common.confirm_action'))) {
            return;
        }

        setProcessingId(requestId);
        try {
            const response = await dataDeletionService.process({
                dataDeletionRequestId: requestId,
                status,
                denialReason: reason
            });
            if (response.status) {
                alert(t('common.success'));
                fetchRequests();
                setIsDenialModalOpen(false);
            } else {
                alert(response.errorMessage || "Error processing request");
            }
        } catch (err) {
            console.error("Error processing request:", err);
            alert("Error processing request");
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 0: // PENDING
                return <span style={{ padding: '0.25rem 0.75rem', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: '600', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>PENDING</span>;
            case 1: // APPROVED
                return <span style={{ padding: '0.25rem 0.75rem', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: '600', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>APPROVED</span>;
            case 2: // DENIED
                return <span style={{ padding: '0.25rem 0.75rem', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: '600', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>DENIED</span>;
            default:
                return null;
        }
    };

    return (
        <div style={{ padding: '1rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: '800', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Trash2 /> {t('data_deletion.title')}
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>{t('data_deletion.subtitle')}</p>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                    <Loader2 size={48} className="animate-spin" color="var(--primary)" />
                </div>
            ) : requests.length === 0 ? (
                <div className="glass-card" style={{ padding: '4rem', textAlign: 'center' }}>
                    <Trash2 size={64} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                    <h3>{t('data_deletion.empty')}</h3>
                </div>
            ) : (
                <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600' }}>User</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600' }}>Requested At</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600' }}>Status</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600' }}>Processed At</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map((request) => (
                                <tr key={request.dataDeletionRequestId} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }}>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                background: 'rgba(255,255,255,0.1)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                <User size={20} color="var(--text-muted)" />
                                            </div>
                                            <Link to={`/user/${request.userId}`} style={{ textDecoration: 'none' }}>
                                                <span style={{ color: 'var(--primary)', fontWeight: '600' }}>@{request.nickName}</span>
                                            </Link>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                                            <Calendar size={14} />
                                            {new Date(request.requestedAt).toLocaleString()}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        {getStatusBadge(request.status)}
                                        {request.denialReason && (
                                            <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <AlertCircle size={12} /> {request.denialReason}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>
                                        {request.processedAt ? new Date(request.processedAt).toLocaleString() : '-'}
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                        {request.status === 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => handleProcess(request.dataDeletionRequestId, 1)}
                                                    className="btn"
                                                    disabled={processingId === request.dataDeletionRequestId}
                                                    style={{ padding: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                                                >
                                                    {processingId === request.dataDeletionRequestId ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                                    {t('common.approve') || 'Approve'}
                                                </button>
                                                <button
                                                    onClick={() => handleOpenDenialModal(request.dataDeletionRequestId)}
                                                    className="btn"
                                                    disabled={processingId === request.dataDeletionRequestId}
                                                    style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                                                >
                                                    <XCircle size={16} />
                                                    {t('common.deny') || 'Deny'}
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Denial Reason Modal */}
            <Modal
                isOpen={isDenialModalOpen}
                onClose={() => setIsDenialModalOpen(false)}
                title={t('data_deletion.denial_reason_title') || "Denial Reason"}
                maxWidth="500px"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        {t('data_deletion.denial_reason_prompt')}
                    </p>
                    <textarea
                        value={denialReason}
                        onChange={(e) => setDenialReason(e.target.value)}
                        placeholder={t('data_deletion.denial_reason_placeholder') || "Write the reason here..."}
                        style={{
                            width: '100%',
                            minHeight: '120px',
                            padding: '1rem',
                            background: 'var(--bg-light)',
                            border: '1px solid var(--stroke)',
                            borderRadius: '0.75rem',
                            color: 'var(--text-main)',
                            fontSize: '1rem',
                            outline: 'none',
                            resize: 'vertical'
                        }}
                    />
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button
                            onClick={() => setIsDenialModalOpen(false)}
                            className="btn"
                            style={{ padding: '0.75rem 1.5rem', background: 'transparent', border: '1px solid var(--stroke)' }}
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            onClick={() => handleProcess(selectedRequestId, 2, denialReason)}
                            disabled={!denialReason.trim() || processingId === selectedRequestId}
                            className="btn btn-primary"
                            style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            {processingId === selectedRequestId ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                            {t('common.send') || 'Send'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default DataDeletionRequests;
