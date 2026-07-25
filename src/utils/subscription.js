export const FREE_LIMITS = {
    posts: 10,
    assistanceConversations: 1,
    assistanceUserMessages: 5,
    commitments: 1,
    relapses: 1
};

export const getApiErrorPayload = (errorOrResponse) => {
    const data = errorOrResponse?.response?.data || errorOrResponse?.data || errorOrResponse;
    return data?.data !== undefined && data?.statusCode === undefined ? data.data : data;
};

export const getApiErrorMessage = (errorOrResponse, fallback = 'Error') => {
    const payload = getApiErrorPayload(errorOrResponse);
    return payload?.errorMessage || payload?.message || fallback;
};

export const isSubscriptionRequiredError = (errorOrResponse) => {
    const payload = getApiErrorPayload(errorOrResponse);
    const message = String(payload?.errorMessage || payload?.message || '').toLowerCase();
    return payload?.errorCode === 'SUBSCRIPTION_REQUIRED' ||
        (payload?.statusCode === 403 && (
            message.includes('suscribete') ||
            message.includes('suscríbete') ||
            message.includes('suscripcion') ||
            message.includes('suscripción') ||
            message.includes('plan gratuito')
        ));
};

export const isPremiumStatus = (subscription) => {
    const status = subscription?.status;
    const statusName = typeof status === 'string' ? status.toUpperCase() : status === 1 ? 'PREMIUM' : 'FREE';
    if (statusName !== 'PREMIUM') return false;
    if (!subscription?.expiryDate) return true;
    return new Date(subscription.expiryDate).getTime() > Date.now();
};

export const isFreeForm = (form) => {
    const value = form?.isFree ?? form?.IsFree;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') return value.trim().toLowerCase() === 'true';
    return false;
};
