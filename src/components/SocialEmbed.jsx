import React from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink, X, CornerUpLeft } from 'lucide-react';
import { useMiniPlayer } from '../hooks/useMiniPlayer';

/**
 * Incrusta contenido de una red social reconocida. Recibe los datos ya resueltos y validados por
 * utils/socialEmbeds: este componente no interpreta URLs, solo dibuja el iframe.
 *
 * El iframe se carga en diferido y con referrerPolicy restringido. Aun así, incrustar contenido
 * significa que el navegador de la persona se conecta a esa plataforma, así que el enlace de
 * respaldo de abajo permite abrirlo aparte si el iframe queda bloqueado.
 *
 * Si el contenido es un video y la persona lo estaba viendo, al seguir bajando por el muro el
 * marco se queda en la esquina en pequeño en vez de perderse (ver hooks/useMiniPlayer). El nodo
 * del iframe nunca cambia de sitio en el árbol: solo cambian sus estilos, porque moverlo lo
 * recargaría y el video volvería a empezar.
 */
const SocialEmbed = ({ embed, allowMiniPlayer = true }) => {
    const { t } = useTranslation();

    const puedeAnclarse = Boolean(allowMiniPlayer && embed?.esVideo && !embed?.unresolvedShortLink);
    const { slotRef, anclado, medida, escala, recargaKey, volver, cerrar } = useMiniPlayer(puedeAnclarse);

    if (!embed) return null;

    const { embedUrl, label, originalUrl, aspectRatio, height, maxWidth, allow, allowFullScreen } = embed;

    // El enlace corto no se pudo expandir. Incrustarlo mostraría el aviso de Facebook diciendo que
    // la publicación "ya no está disponible", que es falso y confunde: lo honesto es explicar qué
    // pasa y cómo arreglarlo.
    if (embed.unresolvedShortLink) {
        return (
            <div style={{
                marginTop: '0.85rem',
                padding: '1rem 1.15rem',
                borderRadius: '0.85rem',
                border: '1px solid var(--stroke)',
                background: 'var(--bg-light)'
            }}>
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)' }}>
                    {t('posts.embed_short_link_title', { platform: label })}
                </p>
                <p style={{ margin: '0.35rem 0 0.6rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {t('posts.embed_short_link_help')}
                </p>
                <a
                    href={originalUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                        fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '700', textDecoration: 'none'
                    }}
                >
                    <ExternalLink size={13} />
                    {t('posts.embed_open_in', { platform: label })}
                </a>
            </div>
        );
    }

    const marcoEnSitio = {
        position: 'absolute',
        inset: 0,
        borderRadius: '0.85rem',
        overflow: 'hidden',
        border: '1px solid var(--stroke)',
        background: 'var(--bg-light)'
    };

    const marcoAnclado = anclado ? {
        position: 'fixed',
        right: '1rem',
        bottom: '1rem',
        width: `${Math.round(medida.ancho * escala)}px`,
        height: `${Math.round(medida.alto * escala)}px`,
        zIndex: 150,
        borderRadius: '0.85rem',
        overflow: 'hidden',
        border: '1px solid var(--stroke)',
        background: '#000',
        boxShadow: '0 18px 45px rgba(15, 23, 42, 0.35)'
    } : null;

    // Encoger con `scale` en vez de con `width`: el iframe conserva el tamaño con el que se cargó,
    // así que la página de dentro sigue con su maqueta original, solo dibujada más pequeña.
    const lienzo = anclado
        ? {
            width: `${medida.ancho}px`,
            height: `${medida.alto}px`,
            transform: `scale(${escala})`,
            transformOrigin: 'top left'
        }
        : { width: '100%', height: '100%' };

    const botonMini = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        border: 'none',
        background: 'rgba(15, 23, 42, 0.65)',
        color: '#fff',
        cursor: 'pointer',
        padding: 0
    };

    return (
        <div style={{ marginTop: '0.85rem' }}>
            <div
                ref={slotRef}
                style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: maxWidth || '100%',
                    aspectRatio: aspectRatio || undefined,
                    height: aspectRatio ? undefined : height
                }}
            >
                {/* El hueco no se cierra mientras el video está en la esquina: si se cerrara, todo
                    lo que hay debajo saltaría hacia arriba mientras la persona está leyendo. */}
                {anclado && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '0.85rem',
                        border: '1px dashed var(--stroke)',
                        background: 'var(--bg-light)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.6rem',
                        padding: '1rem',
                        textAlign: 'center'
                    }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            {t('posts.mini_player_hint')}
                        </span>
                        <button
                            type="button"
                            onClick={volver}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                                fontSize: '0.85rem', fontWeight: '700', color: 'var(--primary)'
                            }}
                        >
                            <CornerUpLeft size={14} />
                            {t('posts.mini_player_back')}
                        </button>
                    </div>
                )}

                <div style={anclado ? marcoAnclado : marcoEnSitio}>
                    {anclado && (
                        <div style={{
                            position: 'absolute',
                            top: '0.4rem',
                            right: '0.4rem',
                            display: 'flex',
                            gap: '0.35rem',
                            zIndex: 2
                        }}>
                            <button
                                type="button"
                                onClick={volver}
                                title={t('posts.mini_player_back')}
                                aria-label={t('posts.mini_player_back')}
                                style={botonMini}
                            >
                                <CornerUpLeft size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={cerrar}
                                title={t('posts.mini_player_close')}
                                aria-label={t('posts.mini_player_close')}
                                style={botonMini}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    )}

                    <div style={lienzo}>
                        <iframe
                            key={recargaKey}
                            src={embedUrl}
                            title={`${label} — ${t('posts.embed_title')}`}
                            loading="lazy"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allow={allow}
                            allowFullScreen={allowFullScreen}
                            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                        />
                    </div>
                </div>
            </div>

            <a
                href={originalUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    marginTop: '0.4rem',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    textDecoration: 'none'
                }}
            >
                <ExternalLink size={13} />
                {t('posts.embed_open_in', { platform: label })}
            </a>
        </div>
    );
};

export default SocialEmbed;
