import React from 'react';
import { Link } from 'react-router-dom';
import { Trans } from 'react-i18next';

// Aviso con enlaces a las páginas legales, para el pie de registro, login y suscripción.
// `variant` elige el texto: "signup" (al crear la cuenta), "subscribe" (al pagar) o "footer" (solo
// los enlaces). Los enlaces abren en otra pestaña para no perder lo que la persona estaba llenando.
const LegalLinks = ({ variant = 'footer', style }) => {
    const enlace = (doc) => <Link to={`/legal/${doc}`} target="_blank" rel="noopener" />;

    return (
        <p className="legal-links" style={style}>
            <Trans
                i18nKey={`legal.${variant}`}
                components={{ terms: enlace('terms'), privacy: enlace('privacy'), refunds: enlace('refunds') }}
            />
        </p>
    );
};

export default LegalLinks;
