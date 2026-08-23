import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Loader2, Trophy, User, Building2, Search, Trash2, X, Plus, Minus } from 'lucide-react';
import { donationService, gamblerService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

const roundMoney = (value) => Math.round((Number(value) || 0) * 100) / 100;

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
    const [activeModal, setActiveModal] = useState(null);
    const [debtedUsers, setDebtedUsers] = useState([]);
    const [selectedDebtedIds, setSelectedDebtedIds] = useState([]);
    const [loadingDebted, setLoadingDebted] = useState(false);
    const [randomCount, setRandomCount] = useState(4);
    const [randomPreview, setRandomPreview] = useState([]);
    const [loadingRandom, setLoadingRandom] = useState(false);

    const isPersonDonation = type === 'PERSON';
    const isCommunityDonation = type === 'COMMUNITY';
    const isOrganizationDonation = type === 'ORGANIZATION';

    const presets = isOrganizationDonation
        ? [100, 200, 500, 1000, 5000]
        : [10, 25, 50, 100, 500];

    const toCandidate = (gambler) => ({
        gamblerId: gambler.gamblerId,
        userId: gambler.userId || gambler.user?.userId,
        nickName: gambler.nickName || gambler.user?.nickName,
        avatar: gambler.avatar || gambler.user?.avatar,
        isPremium: gambler.isPremium || gambler.user?.isPremium || false,
        totalDebt: gambler.totalDebt || 0
    });

    const recalculateBeneficiaries = (items, totalAmount = amount) => {
        const donationAmount = parseFloat(totalAmount) || 0;
        let accumulated = 0;

        return items.map((item, index) => {
            const percentage = Number(item.percentage) || 0;
            const isLast = index === items.length - 1;
            const itemAmount = isLast
                ? roundMoney(donationAmount - accumulated)
                : roundMoney((donationAmount * percentage) / 100);
            accumulated += itemAmount;

            return {
                ...item,
                amount: donationAmount > 0 ? Math.max(0, itemAmount) : 0
            };
        });
    };

    const rebalanceBeneficiaries = (items, totalAmount = amount) => {
        if (items.length === 0) return [];

        const base = Math.floor((100 / items.length) * 100) / 100;
        let used = 0;
        const withPercentages = items.map((item, index) => {
            const percentage = index === items.length - 1 ? roundMoney(100 - used) : base;
            used += percentage;
            return { ...item, percentage };
        });

        return recalculateBeneficiaries(withPercentages, totalAmount);
    };

    const normalizeBeneficiaryPercentages = (items) => {
        if (items.length === 0) return [];
        if (items.length === 1) return [{ ...items[0], percentage: 100 }];

        const basisPoints = items.map(item => Math.max(0, Math.round((Number(item.percentage) || 0) * 100)));
        const total = basisPoints.reduce((sum, value) => sum + value, 0);

        if (total <= 0) {
            const base = Math.floor(10000 / items.length);
            let used = 0;
            return items.map((item, index) => {
                const percentageBps = index === items.length - 1 ? 10000 - used : base;
                used += percentageBps;
                return { ...item, percentage: percentageBps / 100 };
            });
        }

        let used = 0;
        return items.map((item, index) => {
            const percentageBps = index === items.length - 1
                ? 10000 - used
                : Math.round((basisPoints[index] / total) * 10000);
            used += percentageBps;
            return { ...item, percentage: percentageBps / 100 };
        });
    };

    const distributeBasisPoints = (basisPoints, indexes, amount, mode = 'increase') => {
        if (indexes.length === 0 || amount <= 0) return;

        let remaining = amount;
        const pool = indexes.reduce((sum, index) => sum + basisPoints[index], 0);

        indexes.forEach((index, position) => {
            const isLast = position === indexes.length - 1;
            const share = isLast
                ? remaining
                : Math.round(amount * ((mode === 'reduce' && pool > 0) ? basisPoints[index] / pool : 1 / indexes.length));
            const applied = mode === 'reduce' ? Math.min(basisPoints[index], share) : share;
            basisPoints[index] += mode === 'reduce' ? -applied : applied;
            remaining -= applied;
        });

        let guard = 0;
        while (remaining > 0 && guard < indexes.length * 2) {
            for (const index of indexes) {
                if (remaining <= 0) break;
                if (mode === 'reduce' && basisPoints[index] <= 0) continue;
                basisPoints[index] += mode === 'reduce' ? -1 : 1;
                remaining -= 1;
            }
            guard += 1;
        }
    };

    const addBeneficiaries = (gamblers, replace = false) => {
        const candidates = gamblers.map(toCandidate).filter(item => item.gamblerId && item.nickName);
        const existing = replace ? [] : selectedBeneficiaries;
        const merged = [...existing];

        candidates.forEach(candidate => {
            if (!merged.some(item => item.gamblerId === candidate.gamblerId)) {
                merged.push({
                    ...candidate,
                    percentage: 0,
                    amount: 0
                });
            }
        });

        setSelectedBeneficiaries(rebalanceBeneficiaries(merged));
        setActiveModal(null);
        setSearchQuery('');
        setSearchResults([]);
    };

    useEffect(() => {
        if (!isPersonDonation || activeModal !== 'search' || searchQuery.length < 2) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setSearching(true);
            try {
                const response = await gamblerService.getAllGamblers(1, 10, searchQuery);
                if (response.status) {
                    setSearchResults((response.data.gamblersList || []).filter(g => g.receiveDonations !== false));
                }
            } catch (err) {
                console.error('Error searching users:', err);
            } finally {
                setSearching(false);
            }
        }, 350);

        return () => clearTimeout(timer);
    }, [searchQuery, isPersonDonation, activeModal]);

    useEffect(() => {
        if (!isPersonDonation || activeModal !== 'debt') return;

        const loadDebtedUsers = async () => {
            setLoadingDebted(true);
            try {
                const response = await gamblerService.getDebtedDonationCandidates(30);
                if (response.status) {
                    setDebtedUsers(response.data || []);
                }
            } catch (err) {
                console.error('Error loading debted users:', err);
                addToast('error', t('donations.form.load_debted_error'));
            } finally {
                setLoadingDebted(false);
            }
        };

        loadDebtedUsers();
    }, [activeModal, isPersonDonation, addToast, t]);

    useEffect(() => {
        if (!isPersonDonation || activeModal !== 'random') return;

        const loadRandomUsers = async () => {
            setLoadingRandom(true);
            try {
                const response = await gamblerService.getAllGamblers(1, 100, '');
                if (response.status) {
                    const alreadySelected = new Set(selectedBeneficiaries.map(item => item.gamblerId));
                    const candidates = (response.data.gamblersList || [])
                        .filter(g => g.receiveDonations !== false && !alreadySelected.has(g.gamblerId))
                        .sort(() => Math.random() - 0.5)
                        .slice(0, randomCount);
                    setRandomPreview(candidates);
                }
            } catch (err) {
                console.error('Error loading random users:', err);
                addToast('error', t('donations.form.load_random_error'));
            } finally {
                setLoadingRandom(false);
            }
        };

        loadRandomUsers();
    }, [activeModal, randomCount, isPersonDonation, selectedBeneficiaries, addToast, t]);

    const handleAmountChange = (value) => {
        setAmount(value);
        setSelectedBeneficiaries(prev => recalculateBeneficiaries(prev, value));
    };

    const handleRemoveBeneficiary = (id) => {
        setSelectedBeneficiaries(prev => rebalanceBeneficiaries(prev.filter(b => b.gamblerId !== id)));
    };

    const updateBeneficiaryPercentage = (id, delta) => {
        setSelectedBeneficiaries(prev => {
            const normalized = normalizeBeneficiaryPercentages(prev);
            if (normalized.length <= 1) return recalculateBeneficiaries(normalized);

            const targetIndex = normalized.findIndex(b => b.gamblerId === id);
            if (targetIndex < 0) return prev;

            const basisPoints = normalized.map(item => Math.max(0, Math.round((Number(item.percentage) || 0) * 100)));
            const otherIndexes = basisPoints.map((_, index) => index).filter(index => index !== targetIndex);
            const step = Math.abs(Math.round(delta * 100));

            if (delta > 0) {
                const availableFromOthers = otherIndexes.reduce((sum, index) => sum + basisPoints[index], 0);
                const increase = Math.min(step, 10000 - basisPoints[targetIndex], availableFromOthers);
                basisPoints[targetIndex] += increase;
                distributeBasisPoints(basisPoints, otherIndexes, increase, 'reduce');
            } else {
                const decrease = Math.min(step, basisPoints[targetIndex]);
                basisPoints[targetIndex] -= decrease;
                distributeBasisPoints(basisPoints, otherIndexes, decrease, 'increase');
            }

            const total = basisPoints.reduce((sum, value) => sum + value, 0);
            if (total !== 10000) {
                basisPoints[basisPoints.length - 1] += 10000 - total;
            }

            return recalculateBeneficiaries(normalized.map((item, index) => ({
                ...item,
                percentage: roundMoney(basisPoints[index] / 100)
            })));
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const donationAmount = parseFloat(amount);
        if (!amount || donationAmount <= 0) {
            addToast('error', t('donations.form.enter_amount'));
            return;
        }

        let beneficiariesPayload = [];
        if (isPersonDonation) {
            if (selectedBeneficiaries.length === 0) {
                addToast('error', t('donations.form.select_beneficiary'));
                return;
            }

            const totalPercentage = selectedBeneficiaries.reduce((sum, item) => sum + (Number(item.percentage) || 0), 0);
            if (Math.abs(totalPercentage - 100) > 0.01) {
                addToast('error', t('donations.form.beneficiary_percentage_mismatch'));
                return;
            }

            const recalculated = recalculateBeneficiaries(selectedBeneficiaries, donationAmount);
            const distributedAmount = recalculated.reduce((sum, beneficiary) => sum + (parseFloat(beneficiary.amount) || 0), 0);
            if (distributedAmount <= 0 || Math.abs(distributedAmount - donationAmount) > 0.01) {
                addToast('error', t('donations.form.beneficiary_total_mismatch'));
                return;
            }

            beneficiariesPayload = recalculated.map(b => ({
                gamblerId: b.gamblerId,
                amount: b.amount,
                percentage: b.percentage
            }));
        }

        setLoading(true);
        try {
            const donationData = {
                userId: user?.userId,
                amount: donationAmount,
                currency: 'USD',
                message,
                donationType: type,
                isAnonymous,
                donorName: isAnonymous ? 'Anonymous' : (user?.nickName || 'Guest'),
                beneficiaries: beneficiariesPayload,
                successUrl: `${window.location.origin}/donations?stripe=success`,
                cancelUrl: `${window.location.origin}/donations/new/${type}?stripe=cancel`
            };

            const response = await donationService.createCheckoutSession(donationData);
            const checkoutUrl = response?.data?.url || response?.data?.checkoutUrl || response?.url || response?.checkoutUrl;
            if (response?.status && checkoutUrl) {
                window.location.assign(checkoutUrl);
                return;
            }
            addToast('error', response?.errorMessage || t('donations.form.error'));
        } catch (err) {
            console.error('Error creating donation:', err);
            const apiMessage = err?.response?.data?.errorMessage || err?.response?.data?.message;
            addToast('error', apiMessage || t('donations.form.error'));
        } finally {
            setLoading(false);
        }
    };

    const getIcon = () => {
        if (isCommunityDonation) return <Trophy size={32} />;
        if (isPersonDonation) return <User size={32} />;
        return <Building2 size={32} />;
    };

    const getColor = () => '#D3920A';

    const avatar = (item, size = 28) => (
        <div style={{
            width: size,
            height: size,
            borderRadius: '50%',
            background: item.avatar ? `url(${item.avatar}) center/cover` : '#f1f5f9',
            border: '1px solid var(--stroke)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            {!item.avatar && <User size={Math.max(14, size / 2)} color="var(--text-muted)" />}
        </div>
    );

    const modalShell = (title, children) => (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.35)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
        }}>
            <div style={{
                width: 'min(520px, 100%)',
                maxHeight: '82vh',
                overflowY: 'auto',
                background: '#FFFFFF',
                border: '1px solid var(--stroke)',
                borderRadius: '1rem',
                padding: '1.25rem',
                boxShadow: '0 25px 60px rgba(15, 23, 42, 0.2)',
                position: 'relative'
            }}>
                <button type="button" onClick={() => setActiveModal(null)} style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '1rem',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer'
                }}>
                    <X size={20} />
                </button>
                <h3 style={{ margin: '0 2rem 1rem 0', textAlign: 'center', fontWeight: 900 }}>{title}</h3>
                {children}
            </div>
        </div>
    );

    return (
        <div className="animate-fade-in">
            <div className="glass-card" style={{ padding: '2.5rem', position: 'relative' }}>
                <button
                    onClick={() => navigate('/donations')}
                    className="btn-back-premium"
                    style={{ position: 'absolute', top: '2.5rem', right: '2.5rem' }}
                    title={t('common.back', 'Volver')}
                    aria-label={t('common.back', 'Volver')}
                >
                    <ArrowLeft size={20} />
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', paddingRight: '4rem' }}>
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
                        <h1 style={{ fontSize: '1.875rem', fontWeight: '800' }}>{t(`donations.${type.toLowerCase()}.title`)}</h1>
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
                                    onClick={() => handleAmountChange(p.toString())}
                                    style={{
                                        flex: 1,
                                        minWidth: '80px',
                                        height: '50px',
                                        border: `2px solid ${amount === p.toString() ? '#D49000' : 'var(--stroke)'}`,
                                        background: amount === p.toString() ? 'rgba(212, 144, 0, 0.1)' : '#FFFFFF',
                                        color: amount === p.toString() ? '#D49000' : 'var(--text-main)',
                                        fontWeight: '700',
                                        cursor: 'pointer'
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
                                min="1"
                                step="0.01"
                                value={amount}
                                onChange={(e) => handleAmountChange(e.target.value)}
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
                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{ marginBottom: '1rem', fontWeight: 800 }}>
                                {t('donations.form.donated_amount')}: ${roundMoney(parseFloat(amount) || 0).toFixed(2)}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                                <button type="button" onClick={() => setActiveModal('search')} style={actionButtonStyle}>
                                    {t('donations.form.search_user_button')}
                                </button>
                                <button type="button" onClick={() => setActiveModal('debt')} style={actionButtonStyle}>
                                    {t('donations.form.debted_users_button')}
                                </button>
                                <button type="button" onClick={() => setActiveModal('random')} style={actionButtonStyle}>
                                    {t('donations.form.random_users_button')}
                                </button>
                            </div>

                            <h3 style={{ fontSize: '1rem', fontWeight: 900, marginBottom: '0.75rem' }}>
                                {t('donations.form.beneficiary_list')}
                            </h3>
                            <div style={{ overflowX: 'auto', border: '1px solid var(--stroke)', borderRadius: '0.75rem' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', background: '#FFFFFF' }}>
                                    <thead>
                                        <tr style={{ background: '#f8fafc' }}>
                                            <th style={thStyle}>{t('donations.form.table_user')}</th>
                                            <th style={thStyle}>%</th>
                                            <th style={thStyle}>$</th>
                                            <th style={{ ...thStyle, width: 54 }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedBeneficiaries.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                                    {t('donations.form.no_beneficiaries')}
                                                </td>
                                            </tr>
                                        ) : selectedBeneficiaries.map(item => (
                                            <tr key={item.gamblerId} style={{ borderTop: '1px solid var(--stroke)' }}>
                                                <td style={tdStyle}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        {avatar(item)}
                                                        <span style={{ fontWeight: 700 }}>{item.nickName}</span>
                                                    </div>
                                                </td>
                                                <td style={tdStyle}>
                                                    <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--stroke)', borderRadius: '0.45rem', overflow: 'hidden' }}>
                                                        <button type="button" onClick={() => updateBeneficiaryPercentage(item.gamblerId, -5)} style={miniButtonStyle}><Minus size={12} /></button>
                                                        <span style={{ padding: '0.25rem 0.5rem', minWidth: 44, textAlign: 'center', fontWeight: 800 }}>{item.percentage}</span>
                                                        <button type="button" onClick={() => updateBeneficiaryPercentage(item.gamblerId, 5)} style={miniButtonStyle}><Plus size={12} /></button>
                                                    </div>
                                                </td>
                                                <td style={tdStyle}>{roundMoney(item.amount).toFixed(2)}</td>
                                                <td style={tdStyle}>
                                                    <button type="button" onClick={() => handleRemoveBeneficiary(item.gamblerId)} style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}>
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
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

                    <button type="submit" disabled={loading} style={paymentButtonStyle}>
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
                                src="/assets/ruleta_20260213013600_6483f016.png"
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

            {activeModal === 'search' && modalShell(t('donations.form.search_user_modal'), (
                <>
                    <div style={{ position: 'relative', marginBottom: '1rem' }}>
                        <Search size={18} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t('donations.form.search_user')}
                            style={modalInputStyle}
                            autoFocus
                        />
                    </div>
                    {searching && <div style={{ textAlign: 'center', padding: '1rem' }}><Loader2 className="animate-spin" /></div>}
                    {searchResults.map(gambler => {
                        const item = toCandidate(gambler);
                        return (
                            <button key={item.gamblerId} type="button" onClick={() => addBeneficiaries([item])} style={listButtonStyle}>
                                {avatar(item)}
                                <span>{item.nickName}</span>
                            </button>
                        );
                    })}
                    <SelectedModalList items={selectedBeneficiaries} avatar={avatar} onRemove={handleRemoveBeneficiary} t={t} />
                    <ModalAcceptButton onClick={() => setActiveModal(null)} label={t('common.accept', 'Accept')} />
                </>
            ))}

            {activeModal === 'debt' && modalShell(t('donations.form.debted_users_modal'), (
                <>
                    {loadingDebted ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><Loader2 className="animate-spin" /></div>
                    ) : (
                        <div style={{ overflowX: 'auto', border: '1px solid var(--stroke)', borderRadius: '0.75rem' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc' }}>
                                        <th style={thStyle}>{t('donations.form.table_user')}</th>
                                        <th style={thStyle}>{t('donations.form.debt')}</th>
                                        <th style={thStyle}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {debtedUsers.map(item => (
                                        <tr key={item.gamblerId} style={{ borderTop: '1px solid var(--stroke)' }}>
                                            <td style={tdStyle}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    {avatar(item)}
                                                    <span style={{ fontWeight: 700 }}>{item.nickName}</span>
                                                </div>
                                            </td>
                                            <td style={tdStyle}>$ {roundMoney(item.totalDebt).toFixed(2)}</td>
                                            <td style={tdStyle}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedDebtedIds.includes(item.gamblerId)}
                                                    onChange={(e) => {
                                                        setSelectedDebtedIds(prev => e.target.checked
                                                            ? [...prev, item.gamblerId]
                                                            : prev.filter(id => id !== item.gamblerId));
                                                    }}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <ModalAcceptButton
                        onClick={() => {
                            addBeneficiaries(debtedUsers.filter(item => selectedDebtedIds.includes(item.gamblerId)));
                            setSelectedDebtedIds([]);
                        }}
                        label={t('common.accept', 'Accept')}
                    />
                </>
            ))}

            {activeModal === 'random' && modalShell(t('donations.form.random_users_modal'), (
                <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <button type="button" onClick={() => setRandomCount(prev => Math.max(1, prev - 1))} style={miniButtonStyle}>-</button>
                        <strong style={{ minWidth: 38, textAlign: 'center' }}>{randomCount}</strong>
                        <button type="button" onClick={() => setRandomCount(prev => Math.min(20, prev + 1))} style={miniButtonStyle}>+</button>
                    </div>
                    <h4 style={{ textAlign: 'center', marginBottom: '0.75rem' }}>{t('donations.form.random_users')}</h4>
                    {loadingRandom ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><Loader2 className="animate-spin" /></div>
                    ) : (
                        <SelectedModalList items={randomPreview.map(toCandidate)} avatar={avatar} t={t} />
                    )}
                    <ModalAcceptButton onClick={() => addBeneficiaries(randomPreview, true)} label={t('common.accept', 'Accept')} />
                </>
            ))}
        </div>
    );
};

const actionButtonStyle = {
    flex: '1 1 180px',
    minHeight: '58px',
    padding: '0.85rem 1rem',
    background: '#1f2937',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '0.4rem',
    fontWeight: 800,
    cursor: 'pointer'
};

const thStyle = {
    padding: '0.75rem',
    textAlign: 'left',
    fontSize: '0.85rem',
    color: 'var(--text-main)',
    fontWeight: 900
};

const tdStyle = {
    padding: '0.65rem 0.75rem',
    fontSize: '0.9rem',
    verticalAlign: 'middle'
};

const miniButtonStyle = {
    border: 'none',
    background: '#f3f4f6',
    minWidth: 30,
    height: 30,
    cursor: 'pointer',
    fontWeight: 900,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center'
};

const modalInputStyle = {
    width: '100%',
    height: 46,
    border: '1px solid var(--stroke)',
    borderRadius: '999px',
    padding: '0 2.75rem 0 1rem',
    outline: 'none'
};

const listButtonStyle = {
    width: '100%',
    border: 'none',
    background: '#FFFFFF',
    borderBottom: '1px solid var(--stroke)',
    padding: '0.65rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    fontWeight: 700
};

const paymentButtonStyle = {
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
    boxShadow: '0 10px 20px rgba(212, 144, 0, 0.25)'
};

const SelectedModalList = ({ items, avatar, onRemove, t }) => (
    <div style={{ border: '1px solid var(--stroke)', borderRadius: '0.75rem', overflow: 'hidden', marginTop: '1rem' }}>
        <div style={{ padding: '0.75rem', fontWeight: 900, background: '#f8fafc' }}>
            {t('donations.form.selected_users')}
        </div>
        {items.length === 0 ? (
            <div style={{ padding: '1rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                {t('donations.form.no_beneficiaries')}
            </div>
        ) : items.map(item => (
            <div key={item.gamblerId} style={{ padding: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderTop: '1px solid var(--stroke)' }}>
                {avatar(item)}
                <span style={{ flex: 1, fontWeight: 700 }}>{item.nickName}</span>
                {onRemove && (
                    <button type="button" onClick={() => onRemove(item.gamblerId)} style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}>
                        <Trash2 size={17} />
                    </button>
                )}
            </div>
        ))}
    </div>
);

const ModalAcceptButton = ({ onClick, label }) => (
    <button type="button" onClick={onClick} style={{
        display: 'block',
        margin: '1rem auto 0',
        minWidth: 140,
        height: 42,
        border: 'none',
        borderRadius: '999px',
        background: 'var(--primary)',
        color: '#FFFFFF',
        fontWeight: 800,
        cursor: 'pointer'
    }}>
        {label}
    </button>
);

export default DonationForm;
