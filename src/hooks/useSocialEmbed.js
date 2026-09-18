import { useEffect, useMemo, useState } from 'react';
import { findSocialEmbed, resolveSocialEmbed } from '../utils/socialEmbeds';
import { socialLinkService } from '../services/api';

// Lo que devuelve el servidor no cambia entre publicaciones: un enlace corto siempre expande a la
// misma URL. Se recuerda para no repetir la llamada cada vez que se pinta la misma tarjeta.
const cache = new Map();

const expandir = async (url) => {
    if (cache.has(url)) return cache.get(url);

    try {
        const res = await socialLinkService.resolve(url);
        const resuelta = res?.data?.resolvedUrl || res?.resolvedUrl || url;
        cache.set(url, resuelta);
        return resuelta;
    } catch {
        // Si el servidor no puede expandirlo se usa el enlace original: se verá el aviso de
        // Facebook, que es exactamente lo que pasaba antes de existir esto.
        cache.set(url, url);
        return url;
    }
};

/**
 * Busca en el contenido un enlace incrustable y, si es un acortador, lo expande contra el servidor
 * antes de devolverlo. Centralizado en un hook porque lo necesitan tanto la tarjeta de publicación
 * como la vista previa del editor, y el orden de los pasos es fácil de equivocar.
 */
export const useSocialEmbed = (html) => {
    const inicial = useMemo(() => findSocialEmbed(html), [html]);

    // El resultado expandido se guarda junto al enlace que lo originó. Así no hace falta reiniciar
    // el estado al cambiar de publicación: si no corresponde al enlace actual, se ignora.
    const [expandido, setExpandido] = useState(null);

    useEffect(() => {
        if (!inicial?.needsResolution) return;

        let cancelado = false;

        (async () => {
            const canonica = await expandir(inicial.originalUrl);
            if (cancelado) return;

            // No se pudo expandir. Se marca para que la tarjeta lo diga, en vez de incrustar el
            // enlace corto y dejar que Facebook responda que la publicación no existe.
            if (canonica === inicial.originalUrl) {
                setExpandido({
                    originalUrl: inicial.originalUrl,
                    embed: { ...inicial, unresolvedShortLink: true }
                });
                return;
            }

            const resuelto = resolveSocialEmbed(canonica);
            if (!resuelto) return;

            setExpandido({
                originalUrl: inicial.originalUrl,
                // matchedUrl tiene que seguir siendo el enlace que escribió la persona: es el texto
                // que hay que quitar del contenido, no la URL expandida que nunca estuvo ahí.
                embed: { ...resuelto, matchedUrl: inicial.matchedUrl, originalUrl: inicial.originalUrl }
            });
        })();

        return () => { cancelado = true; };
    }, [inicial]);

    return useMemo(() => (
        expandido && inicial && expandido.originalUrl === inicial.originalUrl
            ? expandido.embed
            : inicial
    ), [inicial, expandido]);
};
