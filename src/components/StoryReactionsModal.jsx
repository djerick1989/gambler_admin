import React, { useState, useEffect } from 'react';
import { User as UserIcon, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { statusService } from '../services/api';
import Modal from './Modal';

const StoryReactionsModal = ({ isOpen, onClose, statusId }) => {
    const { t } = useTranslation();
    const [reactions, setReactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && statusId) {
            fetchReactions();
        }
    }, [isOpen, statusId]);

    const fetchReactions = async () => {
        setLoading(true);
        try {
            const response = await statusService.getStatusReactions(statusId);
            if (response.status) {
                setReactions(response.data);
            }
        } catch (error) {
            console.error("Error fetching reactions:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('stories.reactions_title')}
            maxWidth="400px"
        >
            <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '1rem' }}>
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                        <Loader2 className="animate-spin" color="var(--primary)" />
                    </div>
                ) : reactions.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                        {t('stories.no_reactions')}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {reactions.map((user) => (
                            <div key={user.userId} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: user.avatar ? `url(${user.avatar}) center/cover` : 'var(--primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '2px solid var(--glass-border)'
                                }}>
                                    {!user.avatar && <UserIcon size={20} color="white" />}
                                </div>
                                <div>
                                    <div style={{ fontWeight: '600', color: 'white' }}>{user.name}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>@{user.nickName}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default StoryReactionsModal;
