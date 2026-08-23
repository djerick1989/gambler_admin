import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en.json';
import esTranslations from './locales/es.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: enTranslations },
            es: { translation: esTranslations }
        },
        fallbackLng: 'en',
        supportedLngs: ['en', 'es'],
        nonExplicitSupportedLngs: true,
        load: 'languageOnly',
        cleanCode: true,
        returnNull: false,
        interpolation: {
            escapeValue: false
        },
        detection: {
            order: ['querystring', 'localStorage', 'navigator', 'htmlTag'],
            lookupQuerystring: 'lng',
            lookupLocalStorage: 'i18nextLng',
            caches: ['localStorage'],
            convertDetectedLanguage: (lng) => {
                if (!lng) return 'en';
                return lng.toLowerCase().startsWith('es') ? 'es' : 'en';
            }
        }
    });

export default i18n;
