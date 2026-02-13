import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import {
    ChevronLeft, Loader2, User, Phone, Globe, Mail,
    Save, Trash2, Shield, Bell, MessageSquare, Heart,
    Activity, Calendar, Info, MapPin, Languages, Edit2,
    Eye, Award
} from 'lucide-react';
import { gamblerService, languageService, mediaService } from '../services/api';
import GamblerAchievementManager from '../components/Achievement/GamblerAchievementManager';
import { useTranslation } from 'react-i18next';
import { countries } from '../utils/countries';

const GamblerDetail = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();

    const [gambler, setGambler] = useState(null);
    const [languages, setLanguages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [activeSection, setActiveSection] = useState('profile'); // profile, config, notifications
    const [errors, setErrors] = useState({});

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [gamblerRes, languagesRes] = await Promise.all([
                gamblerService.getGamblerById(id),
                languageService.getAll()
            ]);

            if (gamblerRes.status) {
                setGambler(gamblerRes.data);
            }
            if (languagesRes.status) {
                setLanguages(languagesRes.data);
            }
        } catch (err) {
            console.error("Error fetching gambler data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploadingAvatar(true);
        try {
            const response = await mediaService.upload(file);
            if (response.status && response.data?.url) {
                setGambler(prev => ({
                    ...prev,
                    user: {
                        ...prev.user,
                        avatar: response.data.url
                    }
                }));
            }
        } catch (err) {
            console.error("Error uploading avatar:", err);
            alert("Error uploading avatar");
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const validatePhone = (phone) => {
        if (!phone) return true; // Optional field
        const phoneRegex = /^\+?[\d\s-]{7,15}$/;
        return phoneRegex.test(phone);
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();

        // Validate phone
        if (!validatePhone(gambler.phone)) {
            setErrors(prev => ({ ...prev, phone: "Please enter a valid phone number" }));
            return;
        } else {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.phone;
                return newErrors;
            });
        }

        setSaving(true);
        try {
            const updateData = {
                gamblerId: gambler.gamblerId,
                avatar: gambler.user?.avatar,
                phone: gambler.phone,
                phoneVerified: gambler.phoneVerified,
                languageId: gambler.languageId,
                country: gambler.country,
                active: gambler.active,
                betting: gambler.betting,
                description: gambler.description,
                biography: gambler.biography,
                lastDateBetting: gambler.lastDateBetting
            };
            const response = await gamblerService.updateGambler(updateData);
            if (response.status) {
                alert("Profile updated successfully");
            }
        } catch (err) {
            console.error("Error updating profile:", err);
            alert("Error updating profile");
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateConfig = async () => {
        setSaving(true);
        try {
            const configData = {
                gamblerId: gambler.gamblerId,
                profileVisibility: gambler.profileVisibility,
                receiveMessages: gambler.receiveMessages,
                receiveDonations: gambler.receiveDonations,
                languageId: gambler.languageId
            };
            const response = await gamblerService.updateGamblerConfiguration(configData);
            if (response.status) {
                alert("Configuration updated successfully");
            }
        } catch (err) {
            console.error("Error updating configuration:", err);
            alert("Error updating configuration");
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateNotifications = async () => {
        setSaving(true);
        try {
            const notifData = {
                gamblerId: gambler.gamblerId,
                receivePushNotifications: gambler.receivePushNotifications,
                receiveEmailNotifications: gambler.receiveEmailNotifications
            };
            const response = await gamblerService.updateNotificationConfiguration(notifData);
            if (response.status) {
                alert("Notifications updated successfully");
            }
        } catch (err) {
            console.error("Error updating notifications:", err);
            alert("Error updating notifications");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm(t('gambler_mgmt.detail.delete_confirm'))) {
            try {
                const response = await gamblerService.deleteGambler(id);
                if (response.status) {
                    navigate('/gamblers');
                }
            } catch (err) {
                console.error("Error deleting gambler:", err);
                alert("Error deleting gambler");
            }
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <Loader2 size={48} className="animate-spin" color="var(--primary)" />
            </div>
        );
    }

    if (!gambler) return <div>Gambler not found</div>;

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    onClick={() => navigate('/gamblers')}
                    className="btn"
                    style={{ background: '#f1f5f9', color: 'var(--text-main)', padding: '0.5rem', border: '1px solid var(--stroke)' }}
                >
                    <ChevronLeft size={24} />
                </button>
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: '800' }}>{t('gambler_mgmt.detail.title')}</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                        <span style={{ fontWeight: '600', color: 'var(--primary)' }}>@{gambler.user?.nickName}</span>
                        <span>•</span>
                        <span>ID: {gambler.gamblerId}</span>
                    </div>
                </div>
                <button
                    onClick={handleDelete}
                    className="btn"
                    style={{ background: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Trash2 size={18} />
                    {t('gambler_mgmt.detail.delete_account')}
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
                {/* Sidebar Navigation */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div className="glass-card" style={{ padding: '0.5rem' }}>
                        <button
                            onClick={() => setActiveSection('profile')}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                border: 'none',
                                borderRadius: '0.5rem',
                                background: activeSection === 'profile' ? 'var(--primary)' : 'transparent',
                                color: activeSection === 'profile' ? 'white' : 'var(--text-main)',
                                textAlign: 'left',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <User size={20} />
                            {t('gambler_mgmt.detail.profile_info')}
                        </button>
                        <button
                            onClick={() => setActiveSection('config')}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                border: 'none',
                                borderRadius: '0.5rem',
                                background: activeSection === 'config' ? 'var(--primary)' : 'transparent',
                                color: activeSection === 'config' ? 'white' : 'var(--text-main)',
                                textAlign: 'left',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Shield size={20} />
                            {t('gambler_mgmt.detail.configurations')}
                        </button>
                        <button
                            onClick={() => setActiveSection('notifications')}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                border: 'none',
                                borderRadius: '0.5rem',
                                background: activeSection === 'notifications' ? 'var(--primary)' : 'transparent',
                                color: activeSection === 'notifications' ? 'white' : 'var(--text-main)',
                                textAlign: 'left',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Bell size={20} />
                            {t('gambler_mgmt.detail.notifications')}
                        </button>
                        <button
                            onClick={() => setActiveSection('achievements')}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                border: 'none',
                                borderRadius: '0.5rem',
                                background: activeSection === 'achievements' ? 'var(--primary)' : 'transparent',
                                color: activeSection === 'achievements' ? 'white' : 'var(--text-main)',
                                textAlign: 'left',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Award size={20} />
                            {t('achievements.title') || 'Achievements'}
                        </button>
                    </div>

                    {/* Stats Card */}
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <h4 style={{ marginBottom: '1.5rem', fontWeight: 'bold' }}>Quick Stats</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Balance</span>
                                <span style={{ fontWeight: 'bold', color: '#10b981' }}>${gambler.balance.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Status</span>
                                <span style={{ fontWeight: 'bold', color: gambler.active ? '#10b981' : '#ef4444' }}>
                                    {gambler.active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Betting</span>
                                <span style={{ fontWeight: 'bold', color: gambler.betting ? 'var(--primary)' : 'var(--text-muted)' }}>
                                    {gambler.betting ? 'Yes' : 'No'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Section */}
                <div className="glass-card" style={{ padding: '2rem' }}>
                    {activeSection === 'profile' && (
                        <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', paddingBottom: '2rem', borderBottom: '1px solid var(--glass-border)' }}>
                                <div
                                    onClick={() => document.getElementById('avatar-upload').click()}
                                    style={{
                                        width: '80px',
                                        height: '80px',
                                        borderRadius: '50%',
                                        background: gambler.user?.avatar ? `url(${gambler.user.avatar}) center/cover` : '#f1f5f9',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        border: '1px solid var(--stroke)'
                                    }}>
                                    {isUploadingAvatar ? (
                                        <Loader2 className="animate-spin" />
                                    ) : !gambler.user?.avatar && (
                                        <User size={40} />
                                    )}
                                    <div style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        right: 0,
                                        background: 'var(--primary)',
                                        borderRadius: '50%',
                                        padding: '0.35rem',
                                        border: '2px solid #FFFFFF',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <Edit2 size={12} color="white" />
                                    </div>
                                    <input
                                        type="file"
                                        id="avatar-upload"
                                        style={{ display: 'none' }}
                                        accept="image/*"
                                        onChange={handleAvatarChange}
                                    />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{gambler.user?.nickName || 'Incomplete Profile'}</h3>
                                    <p style={{ color: 'var(--text-muted)' }}>{gambler.user?.email}</p>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div className="input-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Phone size={16} /> {t('gambler_mgmt.detail.phone')}</label>
                                    <input
                                        type="text"
                                        value={gambler.phone || ''}
                                        onChange={(e) => {
                                            setGambler({ ...gambler, phone: e.target.value });
                                            if (errors.phone) {
                                                setErrors(prev => {
                                                    const newErrors = { ...prev };
                                                    delete newErrors.phone;
                                                    return newErrors;
                                                });
                                            }
                                        }}
                                        placeholder="+1234567890"
                                        style={errors.phone ? { borderColor: '#ef4444' } : {}}
                                    />
                                    {errors.phone && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.phone}</span>}
                                </div>
                                <div className="input-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MapPin size={16} /> {t('gambler_mgmt.detail.country')}</label>
                                    <select
                                        value={gambler.country || ''}
                                        onChange={(e) => setGambler({ ...gambler, country: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem', background: '#FFFFFF', border: '1px solid var(--stroke)', borderRadius: '0.5rem', color: 'var(--text-main)' }}
                                    >
                                        <option value="">Select Country</option>
                                        {countries.map((country, index) => (
                                            <option key={index} value={country} style={{ background: 'var(--bg-darker)' }}>
                                                {country}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Languages size={16} /> {t('gambler_mgmt.detail.language')}</label>
                                    <select
                                        value={gambler.languageId || ''}
                                        onChange={(e) => setGambler({ ...gambler, languageId: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem', background: '#FFFFFF', border: '1px solid var(--stroke)', borderRadius: '0.5rem', color: 'var(--text-main)' }}
                                    >
                                        <option value="">Select Language</option>
                                        {languages.map(lang => (
                                            <option key={lang.languageId} value={lang.languageId}>
                                                {lang.name} ({lang.code})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Calendar size={16} /> Created At</label>
                                    <input
                                        type="text"
                                        value={new Date(gambler.createdAt).toLocaleString()}
                                        disabled
                                        style={{ opacity: 0.6 }}
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Info size={16} /> {t('gambler_mgmt.detail.description')}</label>
                                <div style={{ background: '#FFFFFF', borderRadius: '0.5rem', border: '1px solid var(--stroke)', overflow: 'hidden' }}>
                                    <ReactQuill
                                        theme="snow"
                                        value={gambler.description || ''}
                                        onChange={(content) => setGambler({ ...gambler, description: content })}
                                        modules={{
                                            toolbar: [
                                                ['bold', 'italic', 'underline', 'strike'],
                                                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                                ['clean']
                                            ]
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Activity size={16} /> {t('gambler_mgmt.detail.biography')}</label>
                                <div style={{ background: '#FFFFFF', borderRadius: '0.5rem', border: '1px solid var(--stroke)', overflow: 'hidden' }}>
                                    <ReactQuill
                                        theme="snow"
                                        value={gambler.biography || ''}
                                        onChange={(content) => setGambler({ ...gambler, biography: content })}
                                        modules={{
                                            toolbar: [
                                                ['bold', 'italic', 'underline', 'strike'],
                                                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                                ['clean']
                                            ]
                                        }}
                                    />
                                </div>
                            </div>

                            <style>{`
                                .ql-toolbar.ql-snow { border: none; border-bottom: 1px solid var(--stroke); background: #f8fafc; }
                                .ql-container.ql-snow { border: none; min-height: 150px; font-size: 1rem; color: var(--text-main); }
                                .ql-editor.ql-blank::before { color: var(--text-muted); font-style: normal; }
                                .ql-snow .ql-stroke { stroke: var(--text-main); }
                                .ql-snow .ql-fill { fill: var(--text-main); }
                                .ql-snow .ql-picker { color: var(--text-main); }
                                .ql-snow .ql-picker-options { background-color: #FFFFFF; border-color: var(--stroke); }
                            `}</style>

                            <div style={{ display: 'flex', gap: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={gambler.active}
                                        onChange={(e) => setGambler({ ...gambler, active: e.target.checked })}
                                    />
                                    {t('gambler_mgmt.detail.active')}
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={gambler.betting}
                                        onChange={(e) => setGambler({ ...gambler, betting: e.target.checked })}
                                    />
                                    {t('gambler_mgmt.detail.betting')}
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={gambler.phoneVerified}
                                        onChange={(e) => setGambler({ ...gambler, phoneVerified: e.target.checked })}
                                    />
                                    Phone Verified
                                </label>
                            </div>

                            <button type="submit" className="btn btn-primary" disabled={saving} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', alignSelf: 'flex-start', minWidth: '200px' }}>
                                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                {t('gambler_mgmt.detail.save_changes')}
                            </button>
                        </form>
                    )}

                    {activeSection === 'config' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Shield color="var(--primary)" /> {t('gambler_mgmt.detail.configurations')}
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', background: '#f8fafc', borderRadius: '1rem', border: '1px solid var(--stroke)' }}>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <div style={{ padding: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '0.75rem' }}>
                                            <Eye size={24} color="rgb(59, 130, 246)" />
                                        </div>
                                        <div>
                                            <h4 style={{ fontWeight: 'bold' }}>{t('gambler_mgmt.detail.visibility')}</h4>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Control if the profile is public or private.</p>
                                        </div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="toggle"
                                        checked={gambler.profileVisibility}
                                        onChange={(e) => setGambler({ ...gambler, profileVisibility: e.target.checked })}
                                    />
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', background: '#f8fafc', borderRadius: '1rem', border: '1px solid var(--stroke)' }}>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '0.75rem' }}>
                                            <MessageSquare size={24} color="#10b981" />
                                        </div>
                                        <div>
                                            <h4 style={{ fontWeight: 'bold' }}>{t('gambler_mgmt.detail.messages')}</h4>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Allow other users to send direct messages.</p>
                                        </div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="toggle"
                                        checked={gambler.receiveMessages}
                                        onChange={(e) => setGambler({ ...gambler, receiveMessages: e.target.checked })}
                                    />
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', background: '#f8fafc', borderRadius: '1rem', border: '1px solid var(--stroke)' }}>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <div style={{ padding: '0.75rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '0.75rem' }}>
                                            <Heart size={24} color="#f59e0b" />
                                        </div>
                                        <div>
                                            <h4 style={{ fontWeight: 'bold' }}>{t('gambler_mgmt.detail.donations')}</h4>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Enable the ability to receive donations from the community.</p>
                                        </div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="toggle"
                                        checked={gambler.receiveDonations}
                                        onChange={(e) => setGambler({ ...gambler, receiveDonations: e.target.checked })}
                                    />
                                </div>
                            </div>
                            <button onClick={handleUpdateConfig} className="btn btn-primary" disabled={saving} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', alignSelf: 'flex-start', minWidth: '200px', marginTop: '1rem' }}>
                                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                {t('gambler_mgmt.detail.save_changes')}
                            </button>
                        </div>
                    )}

                    {activeSection === 'notifications' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Bell color="var(--primary)" /> {t('gambler_mgmt.detail.notifications')}
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', background: '#f8fafc', borderRadius: '1rem', border: '1px solid var(--stroke)' }}>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <div style={{ padding: '0.75rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '0.75rem' }}>
                                            <Bell size={24} color="#8b5cf6" />
                                        </div>
                                        <div>
                                            <h4 style={{ fontWeight: 'bold' }}>{t('gambler_mgmt.detail.push_notifications')}</h4>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Receive real-time alerts on the mobile app.</p>
                                        </div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="toggle"
                                        checked={gambler.receivePushNotifications}
                                        onChange={(e) => setGambler({ ...gambler, receivePushNotifications: e.target.checked })}
                                    />
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', background: '#f8fafc', borderRadius: '1rem', border: '1px solid var(--stroke)' }}>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <div style={{ padding: '0.75rem', background: 'rgba(236, 72, 153, 0.1)', borderRadius: '0.75rem' }}>
                                            <Mail size={24} color="#ec4899" />
                                        </div>
                                        <div>
                                            <h4 style={{ fontWeight: 'bold' }}>{t('gambler_mgmt.detail.email_notifications')}</h4>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Get daily summaries and important updates via email.</p>
                                        </div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="toggle"
                                        checked={gambler.receiveEmailNotifications}
                                        onChange={(e) => setGambler({ ...gambler, receiveEmailNotifications: e.target.checked })}
                                    />
                                </div>
                            </div>
                            <button onClick={handleUpdateNotifications} className="btn btn-primary" disabled={saving} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', alignSelf: 'flex-start', minWidth: '200px', marginTop: '1rem' }}>
                                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                {t('gambler_mgmt.detail.save_changes')}
                            </button>
                        </div>
                    )}

                    {activeSection === 'achievements' && (
                        <GamblerAchievementManager gamblerId={id} />
                    )}
                </div>
            </div>

            <style>{`
                .toggle {
                    appearance: none;
                    width: 50px;
                    height: 26px;
                    background: #e2e8f0;
                    border: 1px solid var(--stroke);
                    border-radius: 13px;
                    position: relative;
                    cursor: pointer;
                    transition: background 0.3s;
                }
                .toggle:checked {
                    background: var(--primary);
                }
                .toggle::before {
                    content: '';
                    position: absolute;
                    width: 22px;
                    height: 22px;
                    border-radius: 50%;
                    background: white;
                    top: 2px;
                    left: 2px;
                    transition: transform 0.3s;
                }
                .toggle:checked::before {
                    transform: translateX(24px);
                }
            `}</style>
        </div>
    );
};

export default GamblerDetail;
