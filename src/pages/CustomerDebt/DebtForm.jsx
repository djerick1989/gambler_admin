import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ChevronLeft, Loader2, DollarSign, Calendar, 
    Trash2, Plus, Calendar as CalendarIcon, Save,
    CheckCircle2, X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { debtService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { currencies } from '../../utils/currencies';

const DebtForm = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isEdit = !!id;

    const [loading, setLoading] = useState(isEdit);
    const [submitting, setSubmitting] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    
    const [formData, setFormData] = useState({
        gamblerId: user?.gambler?.gamblerId || "",
        creditor: "",
        initialAmount: "",
        currentBalance: "",
        annualInterestRate: "",
        monthlyInstallment: "",
        loanDate: new Date().toISOString().split('T')[0],
        paymentDay: 1,
        currency: "USD"
    });

    const [payments, setPayments] = useState([]);
    const [newPayment, setNewPayment] = useState({
        amount: "",
        paymentDate: new Date().toISOString().split('T')[0],
        notes: ""
    });

    const [apiCurrencies, setApiCurrencies] = useState([]);

    useEffect(() => {
        fetchCurrencies();
        if (isEdit) {
            fetchDebt();
        }
    }, [id]);

    const fetchCurrencies = async () => {
        try {
            const res = await debtService.getCurrencies();
            if (res.status && Array.isArray(res.data)) {
                const data = [...res.data];
                const usdIndex = data.findIndex(c => c.code === 'USD');
                if (usdIndex > 0) {
                    const usd = data.splice(usdIndex, 1)[0];
                    data.unshift(usd);
                }
                setApiCurrencies(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchDebt = async () => {
        try {
            const res = await debtService.getById(id);
            if (res.status) {
                const d = res.data;
                setFormData({
                    gamblerId: d.gamblerId,
                    creditor: d.creditor,
                    initialAmount: d.initialAmount,
                    currentBalance: d.currentBalance,
                    annualInterestRate: d.annualInterestRate,
                    monthlyInstallment: d.monthlyInstallment,
                    loanDate: d.loanDate.split('T')[0],
                    paymentDay: d.paymentDay,
                    currency: d.currency,
                    status: d.status
                });
                setPayments(d.payments || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        if (type === 'number' && Number(value) < 0) return;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                initialAmount: parseFloat(formData.initialAmount),
                currentBalance: parseFloat(formData.currentBalance),
                annualInterestRate: parseFloat(formData.annualInterestRate),
                monthlyInstallment: parseFloat(formData.monthlyInstallment),
                paymentDay: parseInt(formData.paymentDay),
                gamblerId: user.gambler.gamblerId,
                status: formData.status || 'Active'
            };

            const res = isEdit 
                ? await debtService.update(id, payload)
                : await debtService.create(payload);
            
            if (res.status) {
                navigate('/customer/debts');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddPayment = async () => {
        try {
            const res = await debtService.addPayment({
                debtId: id,
                amount: parseFloat(newPayment.amount),
                paymentDate: newPayment.paymentDate,
                notes: newPayment.notes
            });
            if (res.status) {
                setShowPaymentModal(false);
                setNewPayment({ amount: "", paymentDate: new Date().toISOString().split('T')[0], notes: "" });
                fetchDebt();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeletePayment = async (paymentId) => {
        if (window.confirm(t('debts.delete_confirm'))) {
            try {
                const res = await debtService.deletePayment(paymentId);
                if (res.status) {
                    fetchDebt();
                }
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleCancelDebt = async () => {
        try {
            const res = await debtService.cancelDebt(id);
            if (res.status) {
                setShowCancelModal(false);
                navigate('/customer/debts');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: formData.currency || 'USD',
        }).format(amount || 0);
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <Loader2 size={48} className="animate-spin" color="var(--primary)" />
            </div>
        );
    }

    const progress = (formData.status === 'Cancelled') ? 100 : Math.min(100, Math.max(0, 100 - (formData.currentBalance / formData.initialAmount * 100)));
    const currencyCode = formData.currency || 'USD';

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '5rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button 
                        onClick={() => navigate('/customer/debts')}
                        style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '0.5rem', marginLeft: '-0.5rem' }}
                    >
                        <ChevronLeft size={28} />
                    </button>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0 }}>
                            {isEdit ? t('debts.edit_debt') : t('debts.add_debt')}
                        </h1>
                        {formData.status === 'Cancelled' && (
                            <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#27AE60', background: 'rgba(39, 174, 96, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '0.5rem', width: 'fit-content', marginTop: '0.5rem' }}>
                                {t('debts.status_cancelled', 'Cancelada')}
                            </span>
                        )}
                    </div>
                </div>
                {isEdit && (
                    <div style={{ position: 'relative', width: '64px', height: '64px' }}>
                        <svg width="64" height="64" viewBox="0 0 64 64">
                            <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="6" />
                            <circle 
                                cx="32" cy="32" r="28" fill="none" stroke={progress > 90 ? '#27AE60' : 'var(--primary)'} 
                                strokeWidth="6" strokeDasharray={`${2 * Math.PI * 28}`} 
                                strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
                                strokeLinecap="round"
                                style={{ transition: 'stroke-dashoffset 1s ease-in-out', transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                            />
                            <text x="32" y="36" textAnchor="middle" style={{ fontSize: '0.9rem', fontWeight: '900', fill: 'var(--text-main)' }}>
                                {Math.round(progress)} %
                            </text>
                        </svg>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Entidad o Persona */}
                <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                        {t('debts.entity_person')}
                    </label>
                    <input 
                        className="glass-card debt-input"
                        type="text"
                        name="creditor"
                        value={formData.creditor}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '1.25rem', borderRadius: '1.25rem', border: '1px solid var(--glass-border)', background: 'white', color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: '700' }}
                    />
                </div>

                {/* Monto y Moneda */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                            {t('debts.initial_amount')}
                        </label>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '1.5rem', top: '50%', transform: 'translateY(-50%)', fontWeight: '800', color: 'var(--primary)' }}>{currencyCode}</span>
                            <input 
                                className="glass-card debt-input"
                                type="number"
                                min="0"
                                name="initialAmount"
                                value={formData.initialAmount}
                                onChange={handleChange}
                                onKeyDown={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
                                required
                                style={{ width: '100%', padding: '1.25rem 1.25rem 1.25rem 4.5rem', borderRadius: '1.25rem', border: '1px solid var(--glass-border)', background: 'white', color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: '700' }}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                            {t('debts.currency')}
                        </label>
                        <select 
                            className="glass-card debt-input"
                            name="currency"
                            value={formData.currency}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '1.25rem', borderRadius: '1.25rem', border: '1px solid var(--glass-border)', background: 'white', color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: '700', appearance: 'none' }}
                        >
                            {(apiCurrencies.length > 0 ? apiCurrencies : currencies).map(curr => {
                                const trans = t(`currencies.${curr.code}`);
                                const translated = trans.startsWith('currencies.') ? curr.name : trans;
                                return (
                                    <option key={curr.code} value={curr.code}>
                                        {curr.code} - {translated}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                </div>

                {/* Tasa de Interes y Fecha */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                            {t('debts.annual_interest')}
                        </label>
                        <div style={{ position: 'relative' }}>
                             <input 
                                className="glass-card debt-input"
                                type="number"
                                min="0"
                                step="0.01"
                                name="annualInterestRate"
                                value={formData.annualInterestRate}
                                onChange={handleChange}
                                onKeyDown={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
                                required
                                style={{ width: '100%', padding: '1.25rem 3rem 1.25rem 1.25rem', borderRadius: '1.25rem', border: '1px solid var(--glass-border)', background: 'white', color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: '700' }}
                            />
                            <span style={{ position: 'absolute', right: '1.5rem', top: '50%', transform: 'translateY(-50%)', fontWeight: '800', color: 'var(--text-muted)' }}>%</span>
                        </div>
                    </div>
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                            {t('debts.loan_date')}
                        </label>
                        <input 
                            className="glass-card debt-input"
                            type="date"
                            name="loanDate"
                            value={formData.loanDate}
                            onChange={handleChange}
                            required
                            style={{ width: '100%', padding: '1.25rem', borderRadius: '1.25rem', border: '1px solid var(--glass-border)', background: 'white', color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: '700' }}
                        />
                    </div>
                </div>

                {/* Saldo Actual y Cuota */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                            {t('debts.current_balance')}
                        </label>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '1.5rem', top: '50%', transform: 'translateY(-50%)', fontWeight: '800', color: 'var(--primary)' }}>{currencyCode}</span>
                            <input 
                                className="glass-card debt-input"
                                type="number"
                                min="0"
                                name="currentBalance"
                                value={formData.currentBalance}
                                onChange={handleChange}
                                onKeyDown={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
                                required
                                style={{ width: '100%', padding: '1.25rem 1.25rem 1.25rem 4.5rem', borderRadius: '1.25rem', border: '1px solid var(--glass-border)', background: 'white', color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: '700' }}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                            {t('debts.installment')}
                        </label>
                         <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '1.5rem', top: '50%', transform: 'translateY(-50%)', fontWeight: '800', color: 'var(--primary)' }}>{currencyCode}</span>
                             <input 
                                className="glass-card debt-input"
                                type="number"
                                min="0"
                                name="monthlyInstallment"
                                value={formData.monthlyInstallment}
                                onChange={handleChange}
                                onKeyDown={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
                                required
                                style={{ width: '100%', padding: '1.25rem 1.25rem 1.25rem 4.5rem', borderRadius: '1.25rem', border: '1px solid var(--glass-border)', background: 'white', color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: '700' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Dia de Pago */}
                <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                        {t('debts.payment_day')}
                    </label>
                    <input 
                        className="glass-card debt-input"
                        type="number"
                        min="1"
                        max="31"
                        name="paymentDay"
                        value={formData.paymentDay}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '1.25rem', borderRadius: '1.25rem', border: '1px solid var(--glass-border)', background: 'white', color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: '700' }}
                    />
                </div>

                {/* Historial de Pagos (Solo en Edit) */}
                {isEdit && (
                    <div style={{ marginTop: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                             <label style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--text-main)' }}>
                                {t('debts.payment_history')}
                            </label>
                            <button 
                                type="button"
                                onClick={() => setShowPaymentModal(true)}
                                style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 10px rgba(212, 144, 0, 0.2)' }}
                            >
                                <Plus size={20} strokeWidth={3} />
                            </button>
                        </div>

                        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--glass-border)' }}>
                                    <tr>
                                        <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('debts.payment_date')}</th>
                                        <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('debts.amount')}</th>
                                        <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'right' }}>{t('common.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.length === 0 ? (
                                        <tr>
                                            <td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                                No hay abonos registrados
                                            </td>
                                        </tr>
                                    ) : (
                                        payments.map(p => (
                                            <tr key={p.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                                <td style={{ padding: '1rem', fontSize: '0.95rem', fontWeight: '600' }}>
                                                    {new Date(p.paymentDate).toLocaleDateString()}
                                                </td>
                                                <td style={{ padding: '1rem', fontSize: '0.95rem', fontWeight: '800' }}>
                                                    {formatCurrency(p.amount)}
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleDeletePayment(p.id)}
                                                        style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '0.5rem', borderRadius: '0.5rem', cursor: 'pointer' }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Footer Buttons */}
                <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <button 
                        type="submit"
                        disabled={submitting}
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '1.25rem', fontSize: '1.1rem', fontWeight: '800', borderRadius: '1.25rem', boxShadow: '0 10px 20px rgba(212, 144, 0, 0.2)' }}
                    >
                        {submitting ? <Loader2 className="animate-spin" size={24} /> : t('debts.save')}
                    </button>

                    {isEdit && formData.status !== 'Cancelled' && (
                         <button 
                            type="button"
                            onClick={() => setShowCancelModal(true)}
                            style={{ width: '100%', padding: '1.25rem', fontSize: '1.1rem', fontWeight: '800', borderRadius: '1.25rem', background: '#D49000', color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 10px 20px rgba(212, 144, 0, 0.2)' }}
                        >
                            {t('debts.cancel_debt_button')}
                        </button>
                    )}

                    {isEdit && formData.status === 'Cancelled' && (
                         <div style={{ width: '100%', padding: '1.25rem', borderRadius: '1.25rem', background: 'rgba(0,0,0,0.03)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem' }}>
                            <div>
                                <p style={{ margin: 0, fontWeight: '800', fontSize: '1.1rem', color: 'var(--text-main)' }}>{t('debts.reactivate_title', '¿Cancelaste esta deuda por error?')}</p>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>{t('debts.reactivate_desc', 'Puedes reactivarla volviendo su estado a activo.')}</p>
                            </div>
                            <button 
                                type="button"
                                onClick={() => setFormData(prev => ({...prev, status: 'Active'}))}
                                style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', fontWeight: '800', borderRadius: '1rem', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 5px 15px rgba(212, 144, 0, 0.2)' }}
                            >
                                {t('debts.reactivate_button', 'Reactivar Deuda')}
                            </button>
                        </div>
                    )}
                </div>
            </form>

            {/* Payment Modal */}
            {showPaymentModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '2rem', position: 'relative', background: 'white' }}>
                        <button onClick={() => setShowPaymentModal(false)} style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', background: 'none', border: 'none', cursor: 'pointer' }}>
                            <X size={24} />
                        </button>
                        
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '900', textAlign: 'center', marginBottom: '2rem' }}>{t('debts.add_payment')}</h2>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '700', color: 'var(--text-muted)', textAlign: 'center' }}>{t('debts.amount')}</label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', fontWeight: '800', color: 'var(--primary)' }}>{currencyCode}</span>
                                    <input 
                                        className="debt-input"
                                        type="number"
                                        min="0"
                                        value={newPayment.amount}
                                        onChange={(e) => {
                                            if (Number(e.target.value) < 0) return;
                                            setNewPayment({...newPayment, amount: e.target.value});
                                        }}
                                        onKeyDown={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
                                        style={{ width: '100%', padding: '1.25rem 1.25rem 1.25rem 4rem', borderRadius: '1.25rem', border: '1px solid var(--glass-border)', fontSize: '1.25rem', fontWeight: '800' }}
                                    />
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '700', color: 'var(--text-muted)', textAlign: 'center' }}>{t('debts.payment_date')}</label>
                                <input 
                                    className="debt-input"
                                    type="date"
                                    value={newPayment.paymentDate}
                                    onChange={(e) => setNewPayment({...newPayment, paymentDate: e.target.value})}
                                    style={{ width: '100%', padding: '1.25rem', borderRadius: '1.25rem', border: '1px solid var(--glass-border)', fontSize: '1.1rem', fontWeight: '700' }}
                                />
                            </div>

                            <button 
                                onClick={handleAddPayment}
                                className="btn btn-primary"
                                style={{ padding: '1.25rem', fontSize: '1.1rem', fontWeight: '800', borderRadius: '1.25rem' }}
                            >
                                {t('debts.apply')}
                            </button>
                            <button 
                                onClick={() => setShowPaymentModal(false)}
                                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '700', cursor: 'pointer' }}
                            >
                                {t('debts.cancel')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Confirm Modal */}
            {showCancelModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem', textAlign: 'center', background: 'white' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '900', marginBottom: '2rem' }}>{t('debts.cancel_debt_confirm')}</h2>
                        
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button 
                                onClick={handleCancelDebt}
                                className="btn btn-primary"
                                style={{ flex: 1, padding: '1rem', borderRadius: '1rem' }}
                            >
                                {t('debts.yes')}
                            </button>
                            <button 
                                onClick={() => setShowCancelModal(false)}
                                className="btn"
                                style={{ flex: 1, padding: '1rem', borderRadius: '1rem', background: '#f5f5f5' }}
                            >
                                {t('debts.no')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DebtForm;
