import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown } from 'lucide-react';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
        setIsOpen(false);
    };

    return (
        <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 1000 }}>
            <div className="relative inline-block text-left">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="btn btn-secondary"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        color: 'var(--text-color)'
                    }}
                >
                    <Globe size={16} />
                    <span>{i18n.language ? i18n.language.toUpperCase() : 'EN'}</span>
                    <ChevronDown size={14} />
                </button>

                {isOpen && (
                    <div style={{
                        position: 'absolute',
                        right: 0,
                        marginTop: '0.5rem',
                        backgroundColor: 'var(--card-bg)',
                        minWidth: '150px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        zIndex: 50,
                        borderRadius: '0.5rem',
                        border: '1px solid var(--border-color)',
                        overflow: 'hidden'
                    }}>
                        <div style={{ padding: '0.25rem' }}>
                            <button
                                onClick={() => changeLanguage('es')}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem 1rem',
                                    border: 'none',
                                    background: 'transparent',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    color: 'var(--text-color)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    fontSize: '0.875rem'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <span style={{ fontWeight: 600, minWidth: '20px' }}>ES</span>
                                <span>Español</span>
                            </button>
                            <button
                                onClick={() => changeLanguage('en')}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem 1rem',
                                    border: 'none',
                                    background: 'transparent',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    color: 'var(--text-color)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    fontSize: '0.875rem'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <span style={{ fontWeight: 600, minWidth: '20px' }}>EN</span>
                                <span>English</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LanguageSwitcher;
