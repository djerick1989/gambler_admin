import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DollarSign, ArrowLeft, Loader2, Users, User, Building2, Search, Plus, Trash2 } from 'lucide-react';
import { donationService, gamblerService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

const DonationForm = () => {
    const { type } = useParams();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addToast } = useNotification();

    const [amount, setAmount] = useState('');
    const [message, setMessage] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedBeneficiaries, setSelectedBeneficiaries] = useState([]);
    const [searching, setSearching] = useState(false);

    const isPersonDonation = type === 'PERSON';
    const isCommunityDonation = type === 'COMMUNITY';
    const isOrganizationDonation = type === 'ORGANIZATION';

    const presets = isOrganizationDonation
        ? [100, 200, 500, 1000, 5000]
        : [10, 25, 50, 100, 500];

    useEffect(() => {
        if (isPersonDonation && searchQuery.length > 2) {
            const timer = setTimeout(async () => {
                setSearching(true);
                try {
                    const response = await gamblerService.getAllGamblers(1, 10, searchQuery);
                    if (response.status) {
                        setSearchResults(response.data.gamblersList);
                    }
                } catch (err) {
                    console.error("Error searching users:", err);
                } finally {
                    setSearching(false);
                }
            }, 500);
            return () => clearTimeout(timer);
        } else {
            setSearchResults([]);
        }
    }, [searchQuery, isPersonDonation]);

    const handleAddBeneficiary = (gambler) => {
        if (!selectedBeneficiaries.find(b => b.gamblerId === gambler.gamblerId)) {
            setSelectedBeneficiaries([...selectedBeneficiaries, {
                gamblerId: gambler.gamblerId,
                nickName: gambler.user.nickName,
                avatar: gambler.user.avatar,
                percentage: 0,
                amount: 0
            }]);
        }
        setSearchQuery('');
        setSearchResults([]);
    };

    const handleRemoveBeneficiary = (id) => {
        setSelectedBeneficiaries(selectedBeneficiaries.filter(b => b.gamblerId !== id));
    };

    const updateBeneficiaryAmount = (id, val) => {
        const numVal = parseFloat(val) || 0;
        const totalAmount = parseFloat(amount) || 0;

        setSelectedBeneficiaries(selectedBeneficiaries.map(b => {
            if (b.gamblerId === id) {
                return {
                    ...b,
                    amount: numVal,
                    percentage: totalAmount > 0 ? (numVal / totalAmount) * 100 : 0
                };
            }
            return b;
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!amount || parseFloat(amount) <= 0) {
            addToast('error', t('donations.form.enter_amount'));
            return;
        }

        setLoading(true);
        try {
            const donationData = {
                userId: user.userId,
                amount: parseFloat(amount),
                currency: "USD",
                message: message,
                donationType: type,
                paymentPlatformId: "e2f36fef-c383-4c39-817f-4a0d41bb3a2e", // Placeholder
                isAnonymous: isAnonymous,
                donorName: isAnonymous ? "Anonymous" : (user.name || user.nickName),
                transactionId: crypto.randomUUID(), // Placeholder
                beneficiaries: selectedBeneficiaries.map(b => ({
                    gamblerId: b.gamblerId,
                    amount: b.amount,
                    percentage: b.percentage
                }))
            };

            const response = await donationService.createDonation(donationData);
            if (response.status) {
                addToast('success', 'Donación creada con éxito (Pendiente de Pago)');
                navigate('/donations');
            }
        } catch (err) {
            console.error("Error creating donation:", err);
            addToast('error', 'Error al crear la donación');
        } finally {
            setLoading(false);
        }
    };

    const getIcon = () => {
        if (isCommunityDonation) return <Users size={32} />;
        if (isPersonDonation) return <User size={32} />;
        return <Building2 size={32} />;
    };

    const getColor = () => {
        return '#D3920A';
    };

    return (
        <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <button
                onClick={() => navigate('/donations')}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    marginBottom: '1.5rem',
                    padding: 0
                }}
            >
                <ArrowLeft size={20} />
            </button>

            <div className="glass-card" style={{ padding: '2.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '1rem',
                        backgroundColor: `${getColor()}20`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: getColor()
                    }}>
                        {getIcon()}
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: '800' }}>{t(`donations.${type.toLowerCase()}.title`)}</h1>
                        <p style={{ color: 'var(--text-muted)' }}>{t(`donations.${type.toLowerCase()}.subtitle`)}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '1rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                            {t('donations.form.select_amount')}
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                            {presets.map(p => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setAmount(p.toString())}
                                    style={{
                                        flex: 1,
                                        minWidth: '80px',
                                        height: '50px',
                                        border: `2px solid ${amount === p.toString() ? '#D49000' : 'var(--stroke)'}`,
                                        background: amount === p.toString() ? 'rgba(212, 144, 0, 0.1)' : '#FFFFFF',
                                        color: amount === p.toString() ? '#D49000' : 'var(--text-main)',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    ${p}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                            {t('donations.form.enter_amount')}
                        </label>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: '700' }}>$</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                style={{
                                    width: '100%',
                                    height: '60px',
                                    padding: '0 1rem 0 2.5rem',
                                    background: '#FFFFFF',
                                    border: '1px solid var(--stroke)',
                                    borderRadius: '1rem',
                                    color: 'var(--text-main)',
                                    fontSize: '1.25rem',
                                    fontWeight: '700',
                                    outline: 'none'
                                }}
                            />
                        </div>
                    </div>

                    {isPersonDonation && (
                        <div style={{ marginBottom: '2rem', padding: '1.5rem', borderRadius: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                            <label style={{ display: 'block', marginBottom: '1rem', fontWeight: '600' }}>
                                {t('donations.form.beneficiaries')}
                            </label>

                            <div style={{ position: 'relative', marginBottom: '1rem' }}>
                                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    placeholder={t('donations.form.search_user')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{
                                        width: '100%',
                                        height: '50px',
                                        paddingLeft: '3rem',
                                        background: '#FFFFFF',
                                        border: '1px solid var(--stroke)',
                                        borderRadius: '0.75rem',
                                        color: 'var(--text-main)'
                                    }}
                                />
                                {searching && <Loader2 size={18} className="animate-spin" style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)' }} />}

                                {searchResults.length > 0 && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '110%',
                                        left: 0,
                                        right: 0,
                                        background: '#FFFFFF',
                                        borderRadius: '0.75rem',
                                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                                        zIndex: 10,
                                        overflow: 'hidden',
                                        border: '1px solid var(--stroke)'
                                    }}>
                                        {searchResults.map(gambler => (
                                            <div
                                                key={gambler.gamblerId}
                                                onClick={() => handleAddBeneficiary(gambler)}
                                                style={{
                                                    padding: '0.75rem 1rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.75rem',
                                                    cursor: 'pointer',
                                                    transition: 'background 0.2s'
                                                }}
                                                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: gambler.user.avatar ? `url(${gambler.user.avatar}) center/cover` : 'rgba(255,255,255,0.1)' }}></div>
                                                <span style={{ fontWeight: '600' }}>@{gambler.user.nickName}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {selectedBeneficiaries.map(b => (
                                    <div key={b.gamblerId} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'var(--bg-light)', borderRadius: '0.75rem', border: '1px solid var(--stroke)' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: b.avatar ? `url(${b.avatar}) center/cover` : '#e2e8f0' }}></div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>@{b.nickName}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.percentage.toFixed(1)}%</div>
                                        </div>
                                        <div style={{ position: 'relative', width: '120px' }}>
                                            <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.875rem' }}>$</span>
                                            <input
                                                type="number"
                                                value={b.amount}
                                                onChange={(e) => updateBeneficiaryAmount(b.gamblerId, e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.5rem 0.5rem 0.5rem 1.5rem',
                                                    background: '#FFFFFF',
                                                    border: '1px solid var(--stroke)',
                                                    borderRadius: '0.5rem',
                                                    color: 'var(--text-main)',
                                                    fontSize: '0.875rem'
                                                }}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveBeneficiary(b.gamblerId)}
                                            style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={isAnonymous}
                                onChange={(e) => setIsAnonymous(e.target.checked)}
                                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                            />
                            <span style={{ fontWeight: '600' }}>{t('donations.form.anonymous')}</span>
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            height: '60px',
                            background: 'var(--primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '1rem',
                            fontSize: '1.25rem',
                            fontWeight: '800',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.75rem',
                            boxShadow: '0 10px 20px rgba(212, 144, 0, 0.25)',
                            transition: 'all 0.2s'
                        }}
                    >
                        {loading ? <Loader2 size={24} className="animate-spin" /> : t('donations.form.payment_button')}
                    </button>
                </form>

                <div style={{ marginTop: '3rem', padding: '2rem', background: '#f8fafc', borderRadius: '1rem', border: '1px solid var(--stroke)' }}>
                    <h4 style={{
                        color: getColor(),
                        marginBottom: '1rem',
                        fontWeight: '800',
                        fontSize: '1.1rem',
                        textAlign: isCommunityDonation ? 'center' : 'left'
                    }}>
                        {t('donations.form.additional_info')}
                    </h4>
                    <p style={{
                        color: 'var(--text-muted)',
                        fontSize: '0.95rem',
                        lineHeight: '1.6',
                        whiteSpace: 'pre-wrap',
                        textAlign: isCommunityDonation ? 'center' : 'left'
                    }}>
                        {t(`donations.${type.toLowerCase()}.description`)}
                    </p>
                    {isCommunityDonation && (
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
                            <img
                                src="https://s3.us-east-2.amazonaws.com/ludopata.org/ruleta_20260213013600_6483f016.png"
                                alt="Ruleta"
                                style={{
                                    maxWidth: '400px',
                                    width: '100%',
                                    height: 'auto',
                                    borderRadius: '1rem',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DonationForm;
