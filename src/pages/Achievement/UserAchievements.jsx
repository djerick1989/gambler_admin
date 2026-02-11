import React, { useState, useEffect } from 'react';
import { Award, Loader2, Image as ImageIcon, CheckCircle2, Clock } from 'lucide-react';
import { achievementService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

import { getLanguageId } from '../../utils/languages';

const UserAchievements = () => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const [achievements, setAchievements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.gambler?.gamblerId) {
            fetchUserAchievements();
        }
    }, [user]);

    const fetchUserAchievements = async () => {
        setLoading(true);
        try {
            const response = await achievementService.getGamblerAchievements(user.gambler.gamblerId);
            if (response.status) {
                const sortedAchievements = [...response.data].sort((a, b) => (a.achievement?.orden || 0) - (b.achievement?.orden || 0));
                setAchievements(sortedAchievements);
            }
        } catch (err) {
            console.error("Error fetching user achievements:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <Loader2 size={48} className="animate-spin" color="var(--primary)" />
            </div>
        );
    }

    return (
        <div style={{ padding: '1rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: '800', marginBottom: '0.5rem' }}>
                    {t('achievements.user_title') || 'My Achievements'}
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>
                    {t('achievements.user_subtitle') || 'Earn rewards and track your progress in the community'}
                </p>
            </div>

            {achievements.length === 0 ? (
                <div className="glass-card" style={{ padding: '4rem', textAlign: 'center' }}>
                    <Award size={64} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                    <h3>{t('achievements.user_empty') || 'You haven\'t earned any achievements yet. Keep participating!'}</h3>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '2rem'
                }}>
                    {achievements.map((item) => {
                        const { achievement, isCompleted, completedAt } = item;
                        // Find current language translation or fallback to first
                        const currentLangId = getLanguageId(i18n.language);
                        const translation = achievement.translations?.find(tr => tr.languageId === currentLangId) || achievement.translations?.[0];
                        const title = translation?.value || achievement.title || 'Untitled';

                        return (
                            <div key={achievement.achievementId} className="glass-card" style={{
                                padding: '1.5rem',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textAlign: 'center',
                                gap: '1rem',
                                border: '1px solid var(--glass-border)',
                                position: 'relative',
                                opacity: isCompleted ? 1 : 0.6,
                                filter: isCompleted ? 'none' : 'grayscale(0.5)'
                            }}>
                                <div style={{
                                    width: '100px',
                                    height: '100px',
                                    borderRadius: '50%',
                                    background: isCompleted ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '0.5rem',
                                    border: `2px solid ${isCompleted ? '#10b981' : 'var(--glass-border)'}`,
                                    boxShadow: isCompleted ? '0 0 15px rgba(16, 185, 129, 0.3)' : 'none'
                                }}>
                                    <img
                                        src={isCompleted ? achievement.imageUrlCompleted : achievement.imageUrlPending}
                                        alt={title}
                                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'https://via.placeholder.com/100?text=No+Image';
                                        }}
                                    />
                                </div>

                                <div>
                                    <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.25rem' }}>{title}</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', fontSize: '0.75rem', color: isCompleted ? '#10b981' : 'var(--text-muted)' }}>
                                        {isCompleted ? (
                                            <>
                                                <CheckCircle2 size={12} />
                                                <span>{t('achievements.earned') || 'Earned'}</span>
                                            </>
                                        ) : null}
                                    </div>
                                    {isCompleted && completedAt && (
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                            {new Date(completedAt).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default UserAchievements;
