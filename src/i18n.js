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

// El atributo lang del documento sigue al idioma de la app: lo usan los lectores de pantalla y el
// traductor del navegador, que si no ofrecería traducir una página que ya está en el idioma del usuario.
const sincronizarLangDelDocumento = (lng) => {
    if (lng) document.documentElement.lang = lng.split('-')[0];
};
sincronizarLangDelDocumento(i18n.resolvedLanguage || i18n.language);
i18n.on('languageChanged', sincronizarLangDelDocumento);

export default i18n;
