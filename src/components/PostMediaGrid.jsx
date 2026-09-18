import React, { useState, useEffect } from 'react';
import { Play, X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { createPortal } from 'react-dom';

/**
 * Foto del muro.
 *
 * Aqui hubo un `loading="lazy"` y se quito a proposito. Sobre el papel es lo correcto: no pedir las
 * fotos de publicaciones que estan a diez pantallas. En la practica salio mal, porque las fotos que
 * ya estan guardadas siguen siendo el original de la camara, de varios megas. Diferir una descarga
 * de varios megas hasta que la foto casi se ve significa empezarla justo cuando la persona llega:
 * antes ya estaban descargadas de fondo y aparecian al instante, y despues habia que esperarlas.
 *
 * Diferir no es la solucion mientras el archivo pese tanto; primero hay que aligerar lo guardado.
 * Cuando las fotos del bucket pesen como las nuevas, esto vuelve, y entonces basta el atributo del
 * navegador sin codigo propio.
 */
const FotoDelMuro = ({ src, inmediata }) => (
    <img
        src={src}
        alt=""
        // Descodificar fuera del hilo principal no retrasa la descarga, solo evita que pintar una
        // foto grande congele el desplazamiento.
        decoding="async"
        fetchPriority={inmediata ? 'high' : 'auto'}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
);

const PostMediaGrid = ({ mediaList = [], priority = false }) => {
    const [selectedMediaIndex, setSelectedMediaIndex] = useState(null);

    if (!mediaList || mediaList.length === 0) return null;

    const count = mediaList.length;

    const openLightbox = (e, index) => {
        e.stopPropagation();
        setSelectedMediaIndex(index);
    };

    const closeLightbox = () => {
        setSelectedMediaIndex(null);
    };

    const navigateLightbox = (e, direction) => {
        e.stopPropagation();
        if (direction === 'next') {
            setSelectedMediaIndex((prev) => (prev + 1) % count);
        } else {
            setSelectedMediaIndex((prev) => (prev - 1 + count) % count);
        }
    };

    const renderMediaItem = (media, index, style = {}, overlayCount = 0) => {
        const isVideo = media.mediaType === 1;

        return (
            <div
                key={media.postMediaId || index}
                onClick={(e) => openLightbox(e, index)}
                style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    overflow: 'hidden',
                    background: 'rgba(255,255,255,0.02)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s',
                    ...style
                }}
                className="media-grid-item"
            >
                {isVideo ? (
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                        <video
                            src={media.mediaUrl}
                            /* Aqui el video solo hace de portada. Sin esto el navegador se pone a
                               descargar el video de cada publicacion del muro sin que nadie le haya
                               dado a reproducir. */
                            preload="metadata"
                            muted
                            playsInline
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div style={{
                            position: 'absolute',
                            top: 0, left: 0, right: 0, bottom: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'rgba(0,0,0,0.2)'
                        }}>
                            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.5rem', borderRadius: '50%', backdropFilter: 'blur(4px)' }}>
                                <Play size={24} fill="white" color="white" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <FotoDelMuro src={media.mediaUrl} inmediata={priority} />
                )}

                {overlayCount > 0 && (
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        backdropFilter: 'blur(2px)',
                        zIndex: 10,
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                    }}>
                        +{overlayCount}
                    </div>
                )}

                <div className="hover-overlay" style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(255,255,255,0.05)',
                    opacity: 0,
                    transition: 'opacity 0.2s'
                }} />
            </div>
        );
    };

    const getLayout = () => {
        switch (count) {
            case 1:
                return (
                    <div style={{ borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid var(--stroke)' }}>
                        {renderMediaItem(mediaList[0], 0, { minHeight: '300px', maxHeight: '500px' })}
                    </div>
                );
            case 2:
                return (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', height: '300px', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid var(--stroke)' }}>
                        {renderMediaItem(mediaList[0], 0)}
                        {renderMediaItem(mediaList[1], 1)}
                    </div>
                );
            case 3:
                return (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '4px', height: '400px', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid var(--stroke)' }}>
                        <div style={{ gridRow: '1 / 3' }}>{renderMediaItem(mediaList[0], 0)}</div>
                        <div>{renderMediaItem(mediaList[1], 1)}</div>
                        <div>{renderMediaItem(mediaList[2], 2)}</div>
                    </div>
                );
            case 4:
                return (
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gridTemplateRows: 'repeat(3, 1fr)', gap: '4px', height: '400px', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid var(--stroke)' }}>
                        <div style={{ gridRow: '1 / 4' }}>{renderMediaItem(mediaList[0], 0)}</div>
                        <div>{renderMediaItem(mediaList[1], 1)}</div>
                        <div>{renderMediaItem(mediaList[2], 2)}</div>
                        <div>{renderMediaItem(mediaList[3], 3)}</div>
                    </div>
                );
            default: // 5+
                return (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'repeat(2, minmax(0, 1fr))', gap: '4px', height: '400px', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid var(--stroke)' }}>
                        <div style={{ gridColumn: '1 / 2', gridRow: '1 / 3' }}>{renderMediaItem(mediaList[0], 0)}</div>
                        <div style={{ gridColumn: '2 / 3', gridRow: '1 / 2' }}>{renderMediaItem(mediaList[1], 1)}</div>
                        <div style={{ gridColumn: '2 / 3', gridRow: '2 / 3', position: 'relative' }}>{renderMediaItem(mediaList[2], 2, { height: '100%' }, count - 3)}</div>
                    </div>
                );
        }
    };

    const Lightbox = () => {
        if (selectedMediaIndex === null) return null;
        const media = mediaList[selectedMediaIndex];
        const isVideo = media.mediaType === 1;

        return createPortal(
            <div
                style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.95)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(10px)'
                }}
                onClick={closeLightbox}
            >
                <button
                    onClick={closeLightbox}
                    style={{ position: 'absolute', top: '2rem', right: '2rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '0.75rem', borderRadius: '50%', cursor: 'pointer', zIndex: 10 }}
                >
                    <X size={24} />
                </button>

                {count > 1 && (
                    <>
                        <button
                            onClick={(e) => navigateLightbox(e, 'prev')}
                            style={{ position: 'absolute', left: '2rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '1rem', borderRadius: '50%', cursor: 'pointer', zIndex: 10 }}
                        >
                            <ChevronLeft size={32} />
                        </button>
                        <button
                            onClick={(e) => navigateLightbox(e, 'next')}
                            style={{ position: 'absolute', right: '2rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '1rem', borderRadius: '50%', cursor: 'pointer', zIndex: 10 }}
                        >
                            <ChevronRight size={32} />
                        </button>
                    </>
                )}

                <div
                    style={{ maxWidth: '90%', maxHeight: '90%', position: 'relative' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {isVideo ? (
                        <video
                            src={media.mediaUrl}
                            controls
                            autoPlay
                            style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '0.5rem', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
                        />
                    ) : (
                        <img
                            src={media.mediaUrl}
                            alt=""
                            style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: '0.5rem', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
                        />
                    )}

                    <div style={{ position: 'absolute', bottom: '-3rem', left: 0, right: 0, textAlign: 'center', color: 'white', fontSize: '0.875rem', opacity: 0.7 }}>
                        {selectedMediaIndex + 1} / {count}
                    </div>
                </div>
            </div>,
            document.body
        );
    };

    return (
        <div style={{ marginTop: '1rem' }}>
            <style>{`
                .media-grid-item:hover .hover-overlay { opacity: 1 !important; }
            `}</style>
            {getLayout()}
            <Lightbox />
        </div>
    );
};

export default PostMediaGrid;
