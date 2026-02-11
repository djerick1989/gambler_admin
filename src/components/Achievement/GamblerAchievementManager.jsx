import React, { useState, useEffect } from 'react';
import { Award, Plus, Loader2, CheckCircle2, XCircle, Search, Trash2 } from 'lucide-react';
import { achievementService } from '../../services/api';
import { useTranslation } from 'react-i18next';

import { getLanguageId } from '../../utils/languages';

const GamblerAchievementManager = ({ gamblerId }) => {
    const { t, i18n } = useTranslation();
    const [gamblerAchievements, setGamblerAchievements] = useState([]);
    const [allAchievements, setAllAchievements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        if (gamblerId) {
            fetchData();
        }
    }, [gamblerId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [gRes, aRes] = await Promise.all([
                achievementService.getGamblerAchievements(gamblerId),
                achievementService.getAllAchievements()
            ]);

            if (gRes.status) {
                const sortedG = [...gRes.data].sort((a, b) => (a.achievement?.orden || 0) - (b.achievement?.orden || 0));
                setGamblerAchievements(sortedG);
            }
            if (aRes.status) {
                const sortedA = [...aRes.data].sort((a, b) => (a.orden || 0) - (b.orden || 0));
                setAllAchievements(sortedA);
            }
        } catch (err) {
            console.error("Error fetching achievement data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async (achievementId) => {
        setAssigning(true);
        try {
            const res = await achievementService.assignAchievementToGambler(gamblerId, achievementId, false);
            if (res.status) {
                fetchData();
                setShowAddModal(false);
            }
        } catch (err) {
            console.error("Error assigning achievement:", err);
        } finally {
            setAssigning(false);
        }
    };

    const handleToggleStatus = async (achievementId, currentStatus) => {
        try {
            const res = await achievementService.updateGamblerAchievementProgress(gamblerId, achievementId, !currentStatus);
            if (res.status) {
                fetchData();
            }
        } catch (err) {
            console.error("Error updating status:", err);
        }
    };

    const filteredAvailable = allAchievements.filter(ach => {
        const currentLangId = getLanguageId(i18n.language);
        const translation = ach.translations?.find(tr => tr.languageId === currentLangId) || ach.translations?.[0];
        return !gamblerAchievements.some(ga => ga.achievementId === ach.achievementId) &&
            (translation?.value || ach.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    });

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><Loader2 className="animate-spin" /></div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Award color="var(--primary)" /> {t('achievements.gambler_management') || 'Gambler Achievements'}
                </h3>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}
                >
                    <Plus size={16} /> {t('achievements.assign') || 'Assign Achievement'}
                </button>
            </div>

            {gamblerAchievements.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px dashed var(--glass-border)' }}>
                    <p style={{ color: 'var(--text-muted)' }}>{t('achievements.user_no_achievements') || 'This gambler has no achievements yet.'}</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                    {gamblerAchievements.map((item) => {
                        const { achievement, isCompleted, completedAt } = item;
                        const currentLangId = getLanguageId(i18n.language);
                        const translation = achievement.translations?.find(tr => tr.languageId === currentLangId) || achievement.translations?.[0];
                        const title = translation?.value || achievement.title || 'Untitled';

                        return (
                            <div key={achievement.achievementId} style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '1rem',
                                background: 'rgba(255,255,255,0.02)',
                                borderRadius: '0.75rem',
                                border: '1px solid var(--glass-border)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <img
                                        src={isCompleted ? achievement.imageUrlCompleted : achievement.imageUrlPending}
                                        alt={title}
                                        style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                                    />
                                    <div>
                                        <h4 style={{ fontWeight: '600', fontSize: '0.95rem' }}>{title}</h4>
                                        {isCompleted && completedAt && (
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {new Date(completedAt).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        padding: '2px 8px',
                                        borderRadius: '10px',
                                        background: isCompleted ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)',
                                        color: isCompleted ? '#10b981' : 'var(--text-muted)'
                                    }}>
                                        {isCompleted ? 'Completed' : 'Pending'}
                                    </span>
                                    <button
                                        onClick={() => handleToggleStatus(achievement.achievementId, isCompleted)}
                                        style={{
                                            background: isCompleted ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                            border: 'none',
                                            color: isCompleted ? '#ef4444' : '#10b981',
                                            padding: '0.4rem',
                                            borderRadius: '0.4rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.35rem',
                                            fontSize: '0.8rem'
                                        }}
                                    >
                                        {isCompleted ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
                                        {isCompleted ? 'Mark Pending' : 'Mark Completed'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Simple Modal overlay */}
            {showAddModal && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem'
                }}>
                    <div className="glass-card" style={{ width: '100%', maxWidth: '500px', padding: '2rem', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Select Achievement</h3>
                            <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>Close</button>
                        </div>

                        <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Search achievement..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem 0.75rem 2.5rem',
                                    borderRadius: '0.5rem',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--glass-border)',
                                    color: 'white'
                                }}
                            />
                        </div>

                        <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {filteredAvailable.length === 0 ? (
                                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>No achievements available to assign.</p>
                            ) : (
                                filteredAvailable.map(ach => {
                                    const currentLangId = getLanguageId(i18n.language);
                                    const translation = ach.translations?.find(tr => tr.languageId === currentLangId) || ach.translations?.[0];
                                    return (
                                        <div key={ach.achievementId} onClick={() => handleAssign(ach.achievementId)} style={{
                                            padding: '0.75rem',
                                            background: 'rgba(255,255,255,0.03)',
                                            borderRadius: '0.5rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem',
                                            transition: 'background 0.2s'
                                        }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                                            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}>
                                            <img src={ach.imageUrlCompleted} alt="" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                                            <span>{translation?.value || ach.title}</span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GamblerAchievementManager;
