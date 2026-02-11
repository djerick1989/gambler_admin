export const LANGUAGE_IDS = {
    en: '11e8ba3a-b290-4a2c-9dad-0f40e457f72c',
    es: '6892a523-0dc1-4e3b-9ddd-c9a558c7920b'
};

/**
 * Gets the database language ID based on the i18next language code.
 * @param {string} lang - The language code (e.g., 'en', 'es', 'en-US').
 * @returns {string} The database language ID.
 */
export const getLanguageId = (lang) => {
    const code = lang.substring(0, 2).toLowerCase();
    return LANGUAGE_IDS[code] || LANGUAGE_IDS.en;
};
