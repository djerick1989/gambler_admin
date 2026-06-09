export const FINANCING_OPTIONS = [
    { value: 0, apiValue: 'Savings', labelKey: 'relapses.financing_options.savings' },
    { value: 1, apiValue: 'Cash', labelKey: 'relapses.financing_options.cash' },
    { value: 2, apiValue: 'BorrowedMoney', labelKey: 'relapses.financing_options.borrowed_money' },
    { value: 3, apiValue: 'CreditCard', labelKey: 'relapses.financing_options.credit_card' }
];

export const EMOTION_OPTIONS = [
    { value: 0, apiValue: 'Anxiety', labelKey: 'relapses.emotion_options.anxiety' },
    { value: 1, apiValue: 'Sadness', labelKey: 'relapses.emotion_options.sadness' },
    { value: 2, apiValue: 'Boredom', labelKey: 'relapses.emotion_options.boredom' },
    { value: 3, apiValue: 'Anger', labelKey: 'relapses.emotion_options.anger' },
    { value: 4, apiValue: 'Stress', labelKey: 'relapses.emotion_options.stress' },
    { value: 5, apiValue: 'Loneliness', labelKey: 'relapses.emotion_options.loneliness' }
];

export const TRIGGER_OPTIONS = [
    { value: 0, apiValue: 'FamilyProblems', labelKey: 'relapses.trigger_options.family_problems' },
    { value: 1, apiValue: 'MoneyAvailable', labelKey: 'relapses.trigger_options.money_available' },
    { value: 2, apiValue: 'BeingAlone', labelKey: 'relapses.trigger_options.being_alone' },
    { value: 3, apiValue: 'SocialPressure', labelKey: 'relapses.trigger_options.social_pressure' },
    { value: 4, apiValue: 'Stress', labelKey: 'relapses.trigger_options.stress' },
    { value: 5, apiValue: 'Advertising', labelKey: 'relapses.trigger_options.advertising' }
];

export const findOptionByApiValue = (options, value) => {
    if (value === null || value === undefined || value === '') return options[0];
    if (typeof value === 'number') return options.find(option => option.value === value) || options[0];
    return options.find(option => option.apiValue?.toLowerCase() === String(value).toLowerCase()) || options[0];
};

export const getTranslatedRelapseText = (relapse, field, languageId) => {
    const translation = relapse?.translations?.find(item => item.languageId === languageId);
    return translation?.[field] || relapse?.[field] || '';
};

export const normalizeRelapseDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
    return date.toISOString().slice(0, 10);
};

export const normalizeRelapseTime = (value) => {
    if (!value) return '';
    return String(value).slice(0, 5);
};
