// Calculos de deuda. Todo son funciones puras para poder probarlas sin montar la interfaz.
//
// El interes sigue el mismo criterio que el backend (DebtInterestWorker): tasa anual nominal
// dividida entre doce y capitalizada cada mes. Si eso cambia en el servidor, tiene que cambiar aqui.

const MAX_PROJECTED_PERIODS = 600; // Mas alla de esto la deuda no es larga: es inviable.

const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

export const PAYMENT_FREQUENCIES = {
    MONTHLY: 'Monthly',
    BIWEEKLY: 'Biweekly',
    WEEKLY: 'Weekly',
    DAILY: 'Daily'
};

/** Ciclos por año. Tiene que coincidir con DebtSchedule.PeriodsPerYear del backend. */
export const periodsPerYear = (frequency) => {
    switch (frequency) {
        case PAYMENT_FREQUENCIES.DAILY: return 365;
        case PAYMENT_FREQUENCIES.WEEKLY: return 52;
        case PAYMENT_FREQUENCIES.BIWEEKLY: return 26;
        default: return 12;
    }
};

/** Dias que dura un ciclo, para traducir periodos a fechas. */
const daysPerPeriod = (frequency) => {
    switch (frequency) {
        case PAYMENT_FREQUENCIES.DAILY: return 1;
        case PAYMENT_FREQUENCIES.WEEKLY: return 7;
        case PAYMENT_FREQUENCIES.BIWEEKLY: return 14;
        default: return 30;
    }
};

/** Interes que genera el saldo en un ciclo. */
export const monthlyInterest = (balance, annualInterestRate, frequency = PAYMENT_FREQUENCIES.MONTHLY) => {
    const amount = toNumber(balance);
    const rate = toNumber(annualInterestRate);
    if (amount <= 0 || rate <= 0) return 0;
    return (amount * (rate / 100)) / periodsPerYear(frequency);
};

/**
 * La cuota no cubre ni el interes del mes: por mucho que se pague, el saldo sube.
 * Es la trampa mas comun de la deuda de juego y la app tiene que decirlo en voz alta.
 */
export const isNegativeAmortization = (balance, annualInterestRate, monthlyInstallment, frequency) => {
    const installment = toNumber(monthlyInstallment);
    if (installment <= 0) return toNumber(balance) > 0;
    return installment <= monthlyInterest(balance, annualInterestRate, frequency);
};

/**
 * Proyeccion de liquidacion, ciclo a ciclo.
 * Devuelve null cuando la deuda no se termina de pagar nunca con esa cuota.
 */
export const projectPayoff = (
    balance,
    annualInterestRate,
    monthlyInstallment,
    frequency = PAYMENT_FREQUENCIES.MONTHLY,
    from = new Date()
) => {
    let remaining = toNumber(balance);
    const installment = toNumber(monthlyInstallment);
    const rate = toNumber(annualInterestRate);
    const periods = periodsPerYear(frequency);

    if (remaining <= 0) {
        return { months: 0, periods: 0, payoffDate: from, totalInterest: 0, totalPaid: 0 };
    }
    if (installment <= 0) return null;

    let elapsed = 0;
    let totalInterest = 0;
    let totalPaid = 0;

    while (remaining > 0 && elapsed < MAX_PROJECTED_PERIODS) {
        const interest = (remaining * (rate / 100)) / periods;
        const next = remaining + interest - installment;

        // Sin avance en un ciclo completo, tampoco lo habra en los siguientes.
        if (next >= remaining) return null;

        const payment = Math.min(installment, remaining + interest);
        totalInterest += interest;
        totalPaid += payment;
        remaining = Math.max(0, next);
        elapsed += 1;
    }

    if (remaining > 0) return null;

    const payoffDate = new Date(from);
    payoffDate.setDate(payoffDate.getDate() + elapsed * daysPerPeriod(frequency));

    // Los meses son lo que la persona entiende, aunque el ciclo sea semanal o diario.
    const months = Math.max(1, Math.round((elapsed * daysPerPeriod(frequency)) / 30));

    return { months, periods: elapsed, payoffDate, totalInterest, totalPaid };
};

/**
 * Que cambia si en este ciclo se abona mas que la cuota. Sin esto, un esfuerzo extra no se
 * distingue del pago normal y la persona no ve para que le sirvio.
 */
export const extraPaymentImpact = (debt, paymentAmount) => {
    const amount = toNumber(paymentAmount);
    const installment = toNumber(debt?.monthlyInstallment);
    if (amount <= installment) return null;

    const frequency = debt?.paymentFrequency || PAYMENT_FREQUENCIES.MONTHLY;
    const before = projectPayoff(debt?.currentBalance, debt?.annualInterestRate, installment, frequency);
    if (!before) return null;

    const balanceAfter = Math.max(0, toNumber(debt?.currentBalance) - (amount - installment));
    const after = projectPayoff(balanceAfter, debt?.annualInterestRate, installment, frequency);
    if (!after) return null;

    return {
        periodsSaved: Math.max(0, before.periods - after.periods),
        monthsSaved: Math.max(0, before.months - after.months),
        interestSaved: Math.max(0, before.totalInterest - after.totalInterest)
    };
};

/**
 * Progreso medido contra lo que realmente hay que pagar: lo abonado sobre lo abonado mas lo que
 * queda. Nunca se queda clavado en cero cuando los intereses superan el importe inicial, que es lo
 * que hacia el calculo anterior contra initialAmount.
 */
export const progressPercent = (amountPaid, currentBalance) => {
    const paid = Math.max(0, toNumber(amountPaid));
    const remaining = Math.max(0, toNumber(currentBalance));
    const total = paid + remaining;
    if (total <= 0) return 0;
    return Math.min(100, Math.max(0, (paid / total) * 100));
};

/** Suma de los abonos registrados en una deuda. */
export const totalPaid = (payments) => {
    if (!Array.isArray(payments)) return 0;
    return payments.reduce((sum, payment) => sum + toNumber(payment?.amount), 0);
};

export const SORT_STRATEGIES = {
    /** Menor saldo primero: victorias tempranas, que es lo que sostiene la constancia. */
    SNOWBALL: 'snowball',
    /** Mayor tasa primero: ahorra mas dinero a la larga. */
    AVALANCHE: 'avalanche',
    /** Por fecha de vencimiento mas cercana. */
    DUE_DATE: 'due_date'
};

export const sortDebts = (debts, strategy) => {
    const list = Array.isArray(debts) ? [...debts] : [];

    switch (strategy) {
        case SORT_STRATEGIES.AVALANCHE:
            return list.sort((a, b) => toNumber(b.annualInterestRate) - toNumber(a.annualInterestRate));
        case SORT_STRATEGIES.DUE_DATE:
            return list.sort((a, b) => toNumber(a.paymentDay) - toNumber(b.paymentDay));
        case SORT_STRATEGIES.SNOWBALL:
        default:
            return list.sort((a, b) => toNumber(a.currentBalance) - toNumber(b.currentBalance));
    }
};

/**
 * Cuanto se ahorraria en intereses atacando primero la de mayor tasa en vez de la de menor saldo.
 * Sirve para que la persona elija con el dato delante en vez de a ciegas.
 */
export const strategyInterestGap = (debts) => {
    const list = Array.isArray(debts) ? debts : [];
    if (list.length < 2) return 0;

    const totalInterestFor = (ordered) => ordered.reduce((sum, debt) => {
        const projection = projectPayoff(
            debt.currentBalance, debt.annualInterestRate, debt.monthlyInstallment, debt.paymentFrequency);
        return projection ? sum + projection.totalInterest : sum;
    }, 0);

    const snowball = totalInterestFor(sortDebts(list, SORT_STRATEGIES.SNOWBALL));
    const avalanche = totalInterestFor(sortDebts(list, SORT_STRATEGIES.AVALANCHE));
    return Math.max(0, snowball - avalanche);
};
