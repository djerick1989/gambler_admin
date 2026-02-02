import React, { useState, useEffect } from 'react';
import { X, Search, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { gamblerService, chatService } from '../../services/api';

const CreateGroupModal = ({ onClose, onGroupCreated }) => {
    const { t } = useTranslation();
    const [groupName, setGroupName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            // Fetching active gamblers to select from
            // In a real scenario, this might need pagination or better search
            const response = await gamblerService.getAllGamblers(1, 100, searchTerm);
            if (response.status) {
                setUsers(response.data.gamblersList);
            }
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        // Debounce search could be added here
    };

    // Effect to trigger search when term changes
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm) fetchUsers();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);


    const toggleUser = (userId) => {
        if (selectedUsers.includes(userId)) {
            setSelectedUsers(prev => prev.filter(id => id !== userId));
        } else {
            setSelectedUsers(prev => [...prev, userId]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!groupName.trim() || selectedUsers.length === 0) return;

        setCreating(true);
        try {
            const payload = {
                name: groupName,
                isGroup: true,
                participantIds: selectedUsers
            };

            const response = await chatService.createGroupChat(payload);
            if (response.status) {
                onGroupCreated(response.data); // Returns chatId usually
                onClose();
            }
        } catch (err) {
            console.error('Error creating group:', err);
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content glass-card" style={{ maxWidth: '500px', width: '100%', padding: '0', overflow: 'hidden' }}>
                <div className="modal-header" style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, color: 'white' }}>{t('chat.create_group')}</h3>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <div className="modal-body" style={{ padding: '1.5rem' }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', color: '#ccc', marginBottom: '0.5rem', fontSize: '0.9rem' }}>{t('chat.group_name')}</label>
                        <input
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder={t('chat.group_name_placeholder')}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: 'rgba(0,0,0,0.2)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '0.5rem',
                                color: 'white',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', color: '#ccc', marginBottom: '0.5rem', fontSize: '0.9rem' }}>{t('chat.select_participants')}</label>
                        <div style={{ position: 'relative', marginBottom: '1rem' }}>
                            <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                            <input
                                type="text"
                                placeholder={t('common.search')}
                                value={searchTerm}
                                onChange={handleSearch}
                                style={{
                                    width: '100%',
                                    padding: '0.6rem 0.6rem 0.6rem 2.5rem',
                                    background: 'rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '0.5rem',
                                    color: 'white',
                                    outline: 'none',
                                    fontSize: '0.9rem'
                                }}
                            />
                        </div>

                        <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {loading ? (
                                <p style={{ textAlign: 'center', color: '#888', padding: '1rem' }}>{t('common.loading')}</p>
                            ) : users.length === 0 ? (
                                <p style={{ textAlign: 'center', color: '#888', padding: '1rem' }}>{t('gambler_mgmt.empty')}</p>
                            ) : (
                                users.map(u => (
                                    <div
                                        key={u.userId}
                                        onClick={() => toggleUser(u.userId)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            padding: '8px',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            background: selectedUsers.includes(u.userId) ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                            border: selectedUsers.includes(u.userId) ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent'
                                        }}
                                    >
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: u.user?.avatar ? `url(${u.user.avatar}) center/cover` : '#333' }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ color: 'white', fontSize: '0.9rem' }}>{u.user?.nickName || u.user?.name}</div>
                                        </div>
                                        {selectedUsers.includes(u.userId) && <Check size={16} color="#3b82f6" />}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div style={{ marginTop: '1rem', textAlign: 'right', fontSize: '0.85rem', color: '#888' }}>
                        {selectedUsers.length} {t('chat.selected')}
                    </div>
                </div>

                <div className="modal-footer" style={{ padding: '1.5rem', paddingTop: '0', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button
                        onClick={onClose}
                        className="btn"
                        style={{ background: 'transparent', color: '#ccc', border: '1px solid rgba(255,255,255,0.1)', padding: '0.6rem 1.2rem' }}
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={creating || !groupName.trim() || selectedUsers.length === 0}
                        className="btn btn-primary"
                        style={{ padding: '0.6rem 1.5rem', opacity: (creating || !groupName.trim() || selectedUsers.length === 0) ? 0.5 : 1 }}
                    >
                        {creating ? t('common.loading') : t('posts.create')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateGroupModal;
