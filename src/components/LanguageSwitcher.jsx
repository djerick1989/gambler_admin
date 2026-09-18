import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown, Check } from 'lucide-react';

const LANGUAGES = [
    { code: 'es', label: 'Español' },
    { code: 'en', label: 'English' }
];

// El componente usaba --card-bg, --border-color, --text-color y --hover-bg, que no existen en este
// proyecto. Un var() sin definir deja la propiedad en su valor inicial, así que el panel quedaba
// con fondo transparente y se veía distinto según lo que tuviera detrás: sobre la página en login,
// encima de la tarjeta en registro. Ahora usa los tokens reales y se ve igual en todas las páginas.
const LanguageSwitcher = ({ style = {} }) => {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const currentLanguage = i18n.resolvedLanguage || i18n.language || 'en';
    const currentCode = currentLanguage.split('-')[0].toLowerCase();

    useEffect(() => {
        if (!isOpen) return;

        const handlePointerDown = (event) => {
            if (!containerRef.current?.contains(event.target)) setIsOpen(false);
        };
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') setIsOpen(false);
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
        setIsOpen(false);
    };

    return (
        <div
            ref={containerRef}
            style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 1000, ...style }}
        >
            <div style={{ position: 'relative', display: 'inline-block' }}>
                {/* Cerrado se apoya en el fondo de la página; la tarjeta blanca aparece solo al
                    desplegar, junto con el panel de opciones. */}
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 0.85rem',
                        backgroundColor: isOpen ? 'var(--bg-white)' : 'transparent',
                        border: `1px solid ${isOpen ? 'var(--stroke)' : 'transparent'}`,
                        borderRadius: '0.5rem',
                        boxShadow: isOpen ? '0 1px 2px rgba(15, 23, 42, 0.06)' : 'none',
                        cursor: 'pointer',
                        color: 'var(--text-main)',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        transition: 'background-color 0.15s ease, border-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                        if (!isOpen) e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                        if (!isOpen) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                >
                    <Globe size={16} />
                    <span>{currentCode.toUpperCase()}</span>
                    <ChevronDown
                        size={14}
                        style={{
                            transform: isOpen ? 'rotate(180deg)' : 'none',
                            transition: 'transform 0.2s ease'
                        }}
                    />
                </button>

                {isOpen && (
                    <div
                        role="listbox"
                        style={{
                            position: 'absolute',
                            top: 'calc(100% + 0.4rem)',
                            right: 0,
                            minWidth: '170px',
                            backgroundColor: 'var(--bg-white)',
                            border: '1px solid var(--stroke)',
                            borderRadius: '0.65rem',
                            boxShadow: '0 12px 24px -8px rgba(15, 23, 42, 0.25)',
                            overflow: 'hidden',
                            padding: '0.25rem'
                        }}
                    >
                        {LANGUAGES.map(({ code, label }) => {
                            const isCurrent = code === currentCode;
                            return (
                                <button
                                    key={code}
                                    type="button"
                                    role="option"
                                    aria-selected={isCurrent}
                                    onClick={() => changeLanguage(code)}
                                    style={{
                                        width: '100%',
                                        padding: '0.55rem 0.75rem',
                                        border: 'none',
                                        borderRadius: '0.45rem',
                                        backgroundColor: isCurrent ? 'rgba(212, 144, 0, 0.1)' : 'transparent',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        color: isCurrent ? 'var(--primary)' : 'var(--text-main)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.6rem',
                                        fontSize: '0.875rem',
                                        fontWeight: isCurrent ? '700' : '500'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isCurrent) e.currentTarget.style.backgroundColor = 'var(--bg-light)';
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isCurrent) e.currentTarget.style.backgroundColor = 'transparent';
                                    }}
                                >
                                    <span style={{ fontWeight: '700', minWidth: '22px' }}>{code.toUpperCase()}</span>
                                    <span style={{ flex: 1 }}>{label}</span>
                                    {isCurrent && <Check size={15} />}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LanguageSwitcher;
