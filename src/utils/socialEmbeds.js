// Detección de enlaces de redes sociales para incrustar su contenido en una publicación.
//
// Reglas de seguridad que sostienen este archivo:
//
// 1. El host se compara contra una lista exacta, nunca con `includes`. Un `includes('youtube.com')`
//    aceptaría `youtube.com.sitio-atacante.net` y terminaríamos incrustando un iframe de un
//    dominio ajeno dentro de nuestra página.
// 2. La URL del iframe se construye a partir del identificador extraído, no de la URL que escribió
//    la persona. Así el usuario no puede elegir qué se carga en el iframe, solo de qué video habla.
//    La única excepción es Facebook, cuyo plugin exige la URL completa: ahí se reconstruye una URL
//    canónica con el host ya validado y solo su ruta, descartando query y fragmento.
// 3. Solo se acepta https.

const YOUTUBE_HOSTS = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com'];
const YOUTUBE_SHORT_HOSTS = ['youtu.be', 'www.youtu.be'];
const TIKTOK_HOSTS = ['tiktok.com', 'www.tiktok.com'];
const INSTAGRAM_HOSTS = ['instagram.com', 'www.instagram.com'];
const X_HOSTS = ['x.com', 'www.x.com', 'mobile.x.com', 'twitter.com', 'www.twitter.com', 'mobile.twitter.com'];
const FACEBOOK_HOSTS = ['facebook.com', 'www.facebook.com', 'web.facebook.com', 'm.facebook.com'];
const FACEBOOK_SHORT_HOSTS = ['fb.watch', 'www.fb.watch'];

const ID_SAFE = /^[A-Za-z0-9_-]{1,64}$/;
const DIGITS_ONLY = /^[0-9]{1,32}$/;

// Parametros que identifican una publicacion de Facebook. Cualquier otro se descarta.
const FACEBOOK_PARAMS = ['story_fbid', 'id', 'fbid', 'set', 'v'];
const FACEBOOK_PARAM_SAFE = /^[A-Za-z0-9_.-]{1,200}$/;

/**
 * URL canonica de una publicacion de Facebook: el host ya validado, la ruta, y solo los parametros
 * de la lista con un valor aceptable. El orden lo fija la lista, no la URL que llego.
 */
const construirCanonicaFacebook = (url) => {
    const parametros = new URLSearchParams();

    for (const nombre of FACEBOOK_PARAMS) {
        const valor = url.searchParams.get(nombre);
        if (valor && FACEBOOK_PARAM_SAFE.test(valor)) parametros.set(nombre, valor);
    }

    const query = parametros.toString();
    return `https://${url.hostname}${url.pathname}${query ? `?${query}` : ''}`;
};

/**
 * Cada proveedor devuelve la información necesaria para incrustar, o null si la URL pertenece al
 * dominio pero no apunta a algo incrustable (por ejemplo el perfil de alguien, no un video).
 */
const PROVIDERS = [
    {
        name: 'youtube',
        label: 'YouTube',
        hosts: [...YOUTUBE_HOSTS, ...YOUTUBE_SHORT_HOSTS],
        resolve: (url) => {
            let id = null;

            if (YOUTUBE_SHORT_HOSTS.includes(url.hostname)) {
                id = url.pathname.split('/').filter(Boolean)[0] || null;
            } else if (url.pathname === '/watch') {
                id = url.searchParams.get('v');
            } else {
                const partes = url.pathname.split('/').filter(Boolean);
                // /embed/ID, /shorts/ID, /live/ID
                if (['embed', 'shorts', 'live'].includes(partes[0])) id = partes[1] || null;
            }

            if (!id || !ID_SAFE.test(id)) return null;

            return {
                embedUrl: `https://www.youtube.com/embed/${id}`,
                aspectRatio: '16 / 9',
                esVideo: true,
                allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share',
                allowFullScreen: true
            };
        }
    },
    {
        name: 'tiktok',
        label: 'TikTok',
        hosts: TIKTOK_HOSTS,
        resolve: (url) => {
            // /@usuario/video/ID  ·  /v/ID
            const partes = url.pathname.split('/').filter(Boolean);
            const indiceVideo = partes.findIndex((p) => p === 'video' || p === 'v');
            const id = indiceVideo >= 0 ? (partes[indiceVideo + 1] || '').split('.')[0] : null;

            if (!id || !DIGITS_ONLY.test(id)) return null;

            return {
                embedUrl: `https://www.tiktok.com/embed/v2/${id}`,
                esVideo: true,
                // Alto propio en vez de relación de aspecto: la tarjeta de TikTok no es solo el
                // video, trae cabecera, descripción y acciones. Una caja 9:16 la recortaba y el
                // iframe quedaba con barra de desplazamiento. 400 * 16/9 + 170 de tarjeta ≈ 880.
                height: '880px',
                maxWidth: '400px',
                allow: 'encrypted-media; picture-in-picture',
                allowFullScreen: true
            };
        }
    },
    {
        name: 'instagram',
        label: 'Instagram',
        hosts: INSTAGRAM_HOSTS,
        resolve: (url) => {
            // /p/CODIGO  ·  /reel/CODIGO  ·  /tv/CODIGO
            const partes = url.pathname.split('/').filter(Boolean);
            if (!['p', 'reel', 'reels', 'tv'].includes(partes[0])) return null;

            const codigo = partes[1];
            if (!codigo || !ID_SAFE.test(codigo)) return null;

            const tipo = partes[0] === 'reels' ? 'reel' : partes[0];

            return {
                embedUrl: `https://www.instagram.com/${tipo}/${codigo}/embed`,
                // Una foto no necesita reproductor flotante; un reel si.
                esVideo: tipo !== 'p',
                // Instagram no respeta una relación de aspecto fija: su iframe necesita alto propio.
                height: '620px',
                maxWidth: '460px',
                allow: 'clipboard-write; encrypted-media; picture-in-picture',
                allowFullScreen: true
            };
        }
    },
    {
        name: 'x',
        label: 'X',
        hosts: X_HOSTS,
        resolve: (url) => {
            // /usuario/status/ID
            const partes = url.pathname.split('/').filter(Boolean);
            const indiceEstado = partes.findIndex((p) => p === 'status' || p === 'statuses');
            const id = indiceEstado >= 0 ? partes[indiceEstado + 1] : null;

            if (!id || !DIGITS_ONLY.test(id)) return null;

            return {
                embedUrl: `https://platform.twitter.com/embed/Tweet.html?id=${id}&theme=light&dnt=true`,
                height: '560px',
                maxWidth: '550px',
                allow: 'encrypted-media',
                allowFullScreen: false
            };
        }
    },
    {
        name: 'facebook',
        label: 'Facebook',
        hosts: [...FACEBOOK_HOSTS, ...FACEBOOK_SHORT_HOSTS],
        resolve: (url) => {
            const esVideo = FACEBOOK_SHORT_HOSTS.includes(url.hostname)
                || /\/(videos|reel|watch)(\/|$)/.test(url.pathname);

            // El plugin de Facebook no sigue sus propios acortadores: con un /share/p/... responde
            // que la publicación no está disponible, aunque sea pública. Hay que expandirlo antes,
            // y eso solo puede hacerlo el servidor.
            const esAcortador = FACEBOOK_SHORT_HOSTS.includes(url.hostname)
                || url.pathname.startsWith('/share/');

            // El plugin de Facebook necesita la URL completa. Se reconstruye con el host ya validado
            // y solo la ruta, mas los parametros que identifican la publicacion.
            //
            // Esos parametros no se pueden descartar: en permalink.php la publicacion ES la query
            // (story_fbid + id), y sin ella el plugin dice que ya no esta disponible. Se copian de
            // una lista fija y con el valor validado, asi que la persona sigue sin poder inyectar
            // nada: lo que no este en la lista (rdid, share_url y demas rastreo) se cae.
            const canonica = construirCanonicaFacebook(url);
            const plugin = esVideo ? 'video.php' : 'post.php';

            return {
                embedUrl: `https://www.facebook.com/plugins/${plugin}?href=${encodeURIComponent(canonica)}&show_text=true`,
                height: esVideo ? '480px' : '560px',
                esVideo,
                maxWidth: '560px',
                allow: 'clipboard-write; encrypted-media; picture-in-picture; web-share',
                allowFullScreen: true,
                needsResolution: esAcortador
            };
        }
    }
];

/** Nombres de las plataformas soportadas, para mostrarlos en la interfaz. */
export const SUPPORTED_SOCIAL_PLATFORMS = PROVIDERS.map((p) => p.label);

/**
 * Devuelve los datos para incrustar una URL, o null si no pertenece a una plataforma de la lista
 * o no apunta a contenido incrustable.
 */
export const resolveSocialEmbed = (rawUrl) => {
    if (!rawUrl || typeof rawUrl !== 'string') return null;

    let url;
    try {
        url = new URL(rawUrl.trim());
    } catch {
        return null;
    }

    if (url.protocol !== 'https:') return null;

    const host = url.hostname.toLowerCase();
    const provider = PROVIDERS.find((p) => p.hosts.includes(host));
    if (!provider) return null;

    const datos = provider.resolve(url);
    if (!datos) return null;

    return {
        provider: provider.name,
        label: provider.label,
        originalUrl: url.toString(),
        ...datos
    };
};

/**
 * Busca en el HTML de una publicación el primer enlace incrustable. Se limita al primero a
 * propósito: una publicación con cinco enlaces no debería convertirse en cinco iframes.
 */
export const findSocialEmbed = (html) => {
    if (!html) return null;

    const contenedor = document.createElement('div');
    contenedor.innerHTML = html;

    // Primero los enlaces reales que dejó el editor, después las URL escritas como texto suelto.
    const candidatos = [...contenedor.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'));

    // Las URL sueltas se buscan nodo por nodo, no sobre el textContent completo: ese concatena los
    // párrafos sin separador, así que una URL al final de un párrafo se pegaba con la primera
    // palabra del siguiente y quedaba una cadena que después no se podía encontrar para quitarla.
    const recorrido = document.createTreeWalker(contenedor, NodeFilter.SHOW_TEXT);
    while (recorrido.nextNode()) {
        const encontrados = (recorrido.currentNode.nodeValue || '').match(/https:\/\/[^\s<>"')]+/g);
        if (encontrados) candidatos.push(...encontrados);
    }

    for (const candidato of candidatos) {
        const embed = resolveSocialEmbed(candidato);
        if (embed) return { ...embed, matchedUrl: candidato };
    }

    return null;
};

// Fragmentos que las plataformas dan en su boton de "copiar codigo de insercion". La gente los pega
// tal cual en el editor y quedan guardados como texto, asi que hay que reconocerlos escritos, no
// como nodos del arbol.
//
// Los patrones son deliberadamente estrechos: la clase concreta del blockquote y, en los scripts,
// el host de la plataforma. Un `<script>` generico borraria texto legitimo de alguien que escribe
// sobre programacion.
const EMBED_BLOCKQUOTE = /<blockquote[^>]*class\s*=\s*["'][^"']*(?:twitter-tweet|instagram-media|tiktok-embed)[^"']*["'][\s\S]*?<\/blockquote>/gi;
const EMBED_BLOCKQUOTE_ABIERTO = /<blockquote[^>]*class\s*=\s*["'][^"']*(?:twitter-tweet|instagram-media|tiktok-embed)[^"']*["'][\s\S]*$/i;
const EMBED_SCRIPT = /<script[^>]*(?:platform\.(?:twitter|x)\.com|instagram\.com|tiktok\.com|connect\.facebook\.net)[^>]*>(?:[\s\S]*?<\/script>)?/gi;
const EMBED_IFRAME = /<iframe[^>]*(?:youtube(?:-nocookie)?\.com|youtu\.be|tiktok\.com|instagram\.com|platform\.(?:twitter|x)\.com|facebook\.com)[^>]*>(?:[\s\S]*?<\/iframe>)?/gi;

/**
 * Quita el codigo de insercion que la persona pego como texto. El contenido ya se muestra en el
 * iframe de abajo, asi que ese bloque de marcado no aporta nada y ademas ocupa media publicacion.
 */
export const stripEmbedMarkup = (html) => {
    if (!html) return html;

    const contenedor = document.createElement('div');
    contenedor.innerHTML = html;

    // Si llegaron como nodos de verdad (no como texto), fuera tambien.
    contenedor.querySelectorAll(
        'script, blockquote.twitter-tweet, blockquote.instagram-media, blockquote.tiktok-embed'
    ).forEach((el) => el.remove());

    const recorrido = document.createTreeWalker(contenedor, NodeFilter.SHOW_TEXT);
    const nodos = [];
    while (recorrido.nextNode()) nodos.push(recorrido.currentNode);

    nodos.forEach((nodo) => {
        const original = nodo.nodeValue || '';
        let limpio = original
            .replace(EMBED_BLOCKQUOTE, '')
            .replace(EMBED_SCRIPT, '')
            .replace(EMBED_IFRAME, '');

        // Un fragmento pegado a medias deja el blockquote sin cerrar: se corta desde ahi.
        limpio = limpio.replace(EMBED_BLOCKQUOTE_ABIERTO, '');

        if (limpio !== original) {
            nodo.nodeValue = limpio.replace(/[ \t]{2,}/g, ' ').trim();
        }
    });

    limpiarContenedoresVacios(contenedor);
    return contenedor.innerHTML;
};

/**
 * Los parrafos que quedaron sin nada dejarian huecos. Los que solo tienen un <br> son saltos de
 * linea que el editor usa a proposito, asi que esos se conservan.
 */
const limpiarContenedoresVacios = (contenedor) => {
    contenedor.querySelectorAll('p, div, span, h1, h2, h3').forEach((el) => {
        if (!el.textContent.trim() && !el.querySelector('img, iframe, br')) el.remove();
    });
};

/**
 * Quita del HTML el enlace que ya se muestra incrustado. Sin esto la publicacion repite la URL
 * cruda arriba del contenido, que es justo lo que las redes sociales no hacen.
 */
export const stripEmbedUrlFromHtml = (html, rawUrl) => {
    if (!html || !rawUrl) return html;

    const contenedor = document.createElement('div');
    contenedor.innerHTML = html;

    contenedor.querySelectorAll('a[href]').forEach((a) => {
        if (a.getAttribute('href') === rawUrl) a.remove();
    });

    const recorrido = document.createTreeWalker(contenedor, NodeFilter.SHOW_TEXT);
    const nodos = [];
    while (recorrido.nextNode()) nodos.push(recorrido.currentNode);
    nodos.forEach((nodo) => {
        if (nodo.nodeValue.includes(rawUrl)) {
            // El espacio doble que queda al sacar la URL de media frase se colapsa.
            nodo.nodeValue = nodo.nodeValue
                .replace(rawUrl, '')
                .replace(/[ \t]{2,}/g, ' ')
                .trim();
        }
    });

    limpiarContenedoresVacios(contenedor);
    return contenedor.innerHTML;
};
