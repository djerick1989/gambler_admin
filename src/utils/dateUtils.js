/**
 * Formats a date string for chat timestamps based on the following rules:
 * - Today: HH:mm
 * - Yesterday: Yesterday HH:mm
 * - Within 7 days: Day_of_week HH:mm
 * - Older: Month Day, HH:mm
 * 
 * @param {string|Date} dateString - The date to format
 * @param {Function} t - Translation function
 * @param {string} locale - Current locale code (e.g., 'en', 'es')
 * @returns {string} Formatted date string
 */
export const formatChatTimestamp = (dateString, t, locale = 'en') => {
    if (!dateString) return '';

    const messageDate = new Date(dateString);
    const now = new Date();

    // Reset time to midnight for date comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const msgDate = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());

    const diffTime = today - msgDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    const timeString = messageDate.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

    // Same day - show time only
    if (diffDays === 0) {
        return timeString;
    }

    // Yesterday
    if (diffDays === 1) {
        return `${t('chat.yesterday')} ${timeString}`;
    }

    // Within the last 7 days - show day of week + time
    if (diffDays < 7) {
        const dayName = messageDate.toLocaleDateString(locale, { weekday: 'long' });
        // Capitalize first letter
        const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
        return `${capitalizedDay} ${timeString}`;
    }

    // Older than a week - show date + time
    const fullDate = messageDate.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
    return `${fullDate}, ${timeString}`;
};
