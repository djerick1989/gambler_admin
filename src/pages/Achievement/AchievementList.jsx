import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Search, Edit2, Trash2, Award,
    ChevronLeft, ChevronRight, Loader2, Image as ImageIcon
} from 'lucide-react';
import { achievementService } from '../../services/api';
import { useTranslation } from 'react-i18next';

import { getLanguageId } from '../../utils/languages';

const AchievementList = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const [achievements, setAchievements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchAchievements();
    }, []);

    const fetchAchievements = async () => {
        setLoading(true);
        try {
            const response = await achievementService.getAllAchievements();
            if (response.status) {
                const sortedAchievements = [...response.data].sort((a, b) => (a.orden || 0) - (b.orden || 0));
                setAchievements(sortedAchievements);
            }
        } catch (err) {
            console.error("Error fetching achievements:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm(t('common.delete_confirm') || 'Are you sure you want to delete this achievement?')) {
            try {
                const response = await achievementService.deleteAchievement(id);
                if (response.status) {
                    fetchAchievements();
                }
            } catch (err) {
                console.error("Error deleting achievement:", err);
                alert("Error deleting achievement");
            }
        }
    };

    const filteredAchievements = achievements.filter(ach => {
        const currentLangId = getLanguageId(i18n.language);
        const translation = ach.translations?.find(tr => tr.languageId === currentLangId) || ach.translations?.[0];
        const title = translation?.value || ach.title || '';
        return title.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <div style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: '800', marginBottom: '0.5rem' }}>
                        {t('achievements.title') || 'My Achievements'}
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>{t('achievements.subtitle') || 'Create and manage global achievements for all users'}</p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
                        <input
                            type="text"
                            placeholder={t('common.search') || 'Search...'}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                padding: '0.6rem 1rem 0.6rem 2.5rem',
                                borderRadius: '0.5rem',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--glass-border)',
                                color: 'white',
                                width: '250px'
                            }}
                        />
                    </div>
                    <button
                        onClick={() => navigate('/achievements/new')}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '42px' }}
                    >
                        <Plus size={20} />
                        {t('achievements.add_new') || 'Add New Achievement'}
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                    <Loader2 size={48} className="animate-spin" color="var(--primary)" />
                </div>
            ) : filteredAchievements.length === 0 ? (
                <div className="glass-card" style={{ padding: '4rem', textAlign: 'center' }}>
                    <Award size={64} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                    <h3>{t('achievements.empty') || 'No achievements found'}</h3>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '1.5rem'
                }}>
                    {filteredAchievements.map((ach) => {
                        const currentLangId = getLanguageId(i18n.language);
                        const translation = ach.translations?.find(tr => tr.languageId === currentLangId) || ach.translations?.[0];
                        const title = translation?.value || ach.title || 'Untitled';

                        return (
                            <div key={ach.achievementId} className="glass-card" style={{
                                padding: '1.5rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem',
                                border: '1px solid var(--glass-border)',
                                transition: 'transform 0.2s'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <div style={{
                                                width: '60px',
                                                height: '60px',
                                                borderRadius: '12px',
                                                background: 'rgba(255,255,255,0.05)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                overflow: 'hidden',
                                                border: '1px solid var(--glass-border)',
                                                position: 'relative'
                                            }}>
                                                {ach.imageUrlCompleted ? (
                                                    <img src={ach.imageUrlCompleted} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <ImageIcon size={24} color="var(--text-muted)" />
                                                )}
                                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(16, 185, 129, 0.8)', color: 'white', fontSize: '10px', textAlign: 'center' }}>Active</div>
                                            </div>

                                            <div style={{
                                                width: '60px',
                                                height: '60px',
                                                borderRadius: '12px',
                                                background: 'rgba(255,255,255,0.05)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                overflow: 'hidden',
                                                border: '1px solid var(--glass-border)',
                                                position: 'relative'
                                            }}>
                                                {ach.imageUrlPending ? (
                                                    <img src={ach.imageUrlPending} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <ImageIcon size={24} color="var(--text-muted)" />
                                                )}
                                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(239, 68, 68, 0.8)', color: 'white', fontSize: '10px', textAlign: 'center' }}>Inactive</div>
                                            </div>
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>{title}</h3>
                                            <span style={{
                                                fontSize: '0.75rem',
                                                padding: '2px 8px',
                                                borderRadius: '12px',
                                                background: ach.active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                color: ach.active ? '#10b981' : '#ef4444',
                                                display: 'inline-block',
                                                marginTop: '0.5rem'
                                            }}>
                                                {ach.active ? (t('common.active') || 'Active') : (t('common.inactive') || 'Inactive')}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => navigate(`/achievements/edit/${ach.achievementId}`)}
                                            style={{
                                                background: 'rgba(59, 130, 246, 0.1)',
                                                border: 'none',
                                                color: '#3b82f6',
                                                padding: '0.5rem',
                                                borderRadius: '0.5rem',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(ach.achievementId)}
                                            style={{
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                border: 'none',
                                                color: '#ef4444',
                                                padding: '0.5rem',
                                                borderRadius: '0.5rem',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>{t('achievements.date') || 'Date'}:</span>
                                        <span>{new Date(ach.achievementDate).toLocaleDateString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                                        <span>{t('achievements.order') || 'Order'}:</span>
                                        <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{ach.orden || 0}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AchievementList;
