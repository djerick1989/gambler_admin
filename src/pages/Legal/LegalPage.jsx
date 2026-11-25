import React, { useEffect } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import es, { ACTUALIZADO } from './content/es';
import en, { UPDATED } from './content/en';
import './legal.css';

// Páginas legales públicas: /legal/terms, /legal/privacy y /legal/refunds. No piden sesión porque
// las enlazan el registro, Stripe y las tiendas de anuncios, y tienen que poder leerse antes de
// crear una cuenta.
export const LEGAL_DOCS = ['terms', 'privacy', 'refunds'];

const CONTENIDO = {
    es: { docs: es, updated: ACTUALIZADO, updatedLabel: 'Última actualización', back: 'Volver' },
    en: { docs: en, updated: UPDATED, updatedLabel: 'Last updated', back: 'Back' }
};

const Bloque = ({ block }) =>
    Array.isArray(block)
        ? <ul>{block.map((item) => <li key={item}>{item}</li>)}</ul>
        : <p>{block}</p>;

const LegalPage = () => {
    const { doc } = useParams();
    const { i18n } = useTranslation();
    const navigate = useNavigate();

    const idioma = (i18n.resolvedLanguage || i18n.language || 'es').split('-')[0].toLowerCase();
    const contenido = CONTENIDO[idioma] || CONTENIDO.es;
    const documento = contenido.docs[doc];

    useEffect(() => {
        if (documento) document.title = `${documento.title} · Ludopata`;
        window.scrollTo(0, 0);
        return () => { document.title = 'Ludopata'; };
    }, [documento]);

    if (!documento) return <Navigate to="/legal/terms" replace />;

    // Quien llega desde un enlace externo (Stripe, un anuncio) no tiene a dónde volver dentro de
    // la app; en ese caso el botón lleva al inicio.
    const volver = () => (window.history.length > 1 ? navigate(-1) : navigate('/'));

    return (
        <div className="legal-page">
            <LanguageSwitcher />
            <header className="legal-header">
                <button type="button" className="legal-back" onClick={volver}>
                    <ArrowLeft size={18} /> {contenido.back}
                </button>
                <Link to="/" className="legal-brand">
                    <img src="/assets/logo_gambler.png" alt="" />
                    <span>Ludopata</span>
                </Link>
            </header>

            <nav className="legal-tabs" aria-label="Legal">
                {LEGAL_DOCS.map((clave) => (
                    <Link
                        key={clave}
                        to={`/legal/${clave}`}
                        className={clave === doc ? 'legal-tab active' : 'legal-tab'}
                        aria-current={clave === doc ? 'page' : undefined}
                    >
                        {contenido.docs[clave].title}
                    </Link>
                ))}
            </nav>

            <article className="legal-article">
                <h1>{documento.title}</h1>
                <p className="legal-updated">{contenido.updatedLabel}: {contenido.updated}</p>
                {documento.intro.map((block, index) => <Bloque key={index} block={block} />)}
                {documento.sections.map((section) => (
                    <section key={section.heading}>
                        <h2>{section.heading}</h2>
                        {section.body.map((block, index) => <Bloque key={index} block={block} />)}
                    </section>
                ))}
            </article>
        </div>
    );
};

export default LegalPage;
