/**
 * Reduce una foto al tamaño con el que realmente se va a ver antes de subirla.
 *
 * El teléfono de cualquiera saca fotos de 4000 px de ancho y varios megas. En el muro esa foto se
 * dibuja en una columna de unos 600 px, así que se descargaban millones de píxeles para tirar el
 * 97% en el momento de pintarlos. Lo paga dos veces la misma persona: al subir y al mirar.
 *
 * Se hace en el navegador y no en el servidor por una razón concreta: así también se acorta la
 * subida, que es la parte lenta desde un móvil con datos. El servidor no tiene forma de ahorrar eso,
 * porque cuando el archivo le llega ya viajó entero.
 *
 * Reglas que se respetan siempre:
 *  - Nunca se devuelve algo más pesado que el original. Si comprimir no gana, se sube el original.
 *  - No se tocan los GIF: recomprimirlos les quita la animación.
 *  - No se tocan los SVG: son texto, y el lienzo los rasterizaría.
 *  - La transparencia se conserva. Si el navegador no sabe escribir WebP, un PNG no se convierte a
 *    JPEG, porque lo transparente saldría negro.
 */

/** Lado mayor al que se reduce. Cubre pantallas de retina sin pasarse. */
const MAX_LADO = 1920;

/** Calidad de reencodado. Por debajo de 0.8 se empiezan a ver los bloques en fotos con cielo. */
const CALIDAD = 0.82;

/** Por debajo de este peso el ahorro no compensa el trabajo ni el riesgo de perder calidad. */
const PESO_MINIMO = 200 * 1024;

/** Formatos que no se deben recomprimir. */
const INTOCABLES = new Set(['image/gif', 'image/svg+xml']);

const esImagen = (file) => typeof file?.type === 'string' && file.type.startsWith('image/');

/**
 * Descodifica respetando la orientación EXIF. Sin esto, las fotos hechas en vertical con algunos
 * móviles se suben giradas: el lienzo ignora la etiqueta de rotación que sí respeta el visor.
 */
const decodificar = async (file) => {
    try {
        return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
        // Navegador sin soporte para esa opción: se intenta sin ella antes de rendirse.
        try {
            return await createImageBitmap(file);
        } catch {
            return null;
        }
    }
};

const aBlob = (canvas, tipo, calidad) => new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), tipo, calidad);
});

/**
 * Elige el formato de salida. WebP pesa bastante menos a igual calidad, pero hay que comprobar que
 * el navegador sepa escribirlo: los que no saben devuelven un PNG sin avisar, y ese PNG puede pesar
 * más que la foto original.
 */
const codificar = async (canvas, tipoOriginal) => {
    const webp = await aBlob(canvas, 'image/webp', CALIDAD);
    if (webp && webp.type === 'image/webp') return { blob: webp, extension: 'webp' };

    // Sin WebP: el JPEG solo vale si el original tampoco tenía transparencia.
    if (tipoOriginal === 'image/jpeg' || tipoOriginal === 'image/jpg') {
        const jpeg = await aBlob(canvas, 'image/jpeg', CALIDAD);
        if (jpeg) return { blob: jpeg, extension: 'jpg' };
    }

    const png = await aBlob(canvas, 'image/png');
    return png ? { blob: png, extension: 'png' } : null;
};

const cambiarExtension = (nombre, extension) => {
    const punto = nombre.lastIndexOf('.');
    const base = punto === -1 ? nombre : nombre.slice(0, punto);
    return `${base}.${extension}`;
};

/**
 * Devuelve una versión ligera de la imagen, o el archivo original si no hay nada que ganar.
 * Nunca lanza: si algo falla, sube el original, que es el comportamiento que había antes.
 */
export const optimizarImagen = async (file) => {
    try {
        if (!esImagen(file) || INTOCABLES.has(file.type)) return file;
        if (typeof createImageBitmap !== 'function') return file;

        const bitmap = await decodificar(file);
        if (!bitmap) return file;

        const { width, height } = bitmap;
        const escala = Math.min(1, MAX_LADO / Math.max(width, height));

        // Ya cabe en pantalla y no pesa: no se toca. Recomprimir solo le quitaría calidad.
        if (escala === 1 && file.size <= PESO_MINIMO) {
            bitmap.close?.();
            return file;
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.round(width * escala);
        canvas.height = Math.round(height * escala);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            bitmap.close?.();
            return file;
        }

        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close?.();

        const resultado = await codificar(canvas, file.type);
        if (!resultado || resultado.blob.size >= file.size) return file;

        return new File(
            [resultado.blob],
            cambiarExtension(file.name || 'imagen', resultado.extension),
            { type: resultado.blob.type, lastModified: Date.now() }
        );
    } catch {
        // Optimizar es una mejora, no un requisito: ante cualquier fallo se sube lo que había.
        return file;
    }
};

export const AJUSTES_IMAGEN = { MAX_LADO, CALIDAD, PESO_MINIMO };
