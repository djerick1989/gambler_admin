import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Mantiene visible un video incrustado cuando la persona sigue bajando por el muro.
 *
 * La restricción que manda sobre todo el diseño: un iframe que cambia de padre en el DOM se
 * recarga, y el video vuelve al segundo cero. Así que aquí no se mueve nada de sitio. El marco se
 * queda donde está en el árbol y solo cambian sus estilos: pasa de `absolute` dentro de la
 * publicación a `fixed` en la esquina. El nodo del iframe es el mismo, la reproducción continúa.
 *
 * Para encogerlo se usa `transform: scale` en lugar de cambiarle el ancho. Cambiar el tamaño de un
 * iframe hace que la página de dentro se redibuje con otro diseño (TikTok o Facebook a 200px de
 * ancho no muestran lo mismo que a 500px); escalarlo conserva la maqueta original, solo más
 * pequeña.
 *
 * Cuándo se ancla: solo si la persona tocó el video antes. No podemos saber si está reproduciendo
 * porque el iframe es de otro dominio, pero sí sabemos si recibió el foco, que es lo que ocurre al
 * hacer clic dentro. Anclar sin esa señal llenaría la esquina de videos que nadie pidió ver.
 */

// Un solo video sonando a la vez. Cuando alguien toca otro, el anterior no solo se suelta de la
// esquina: se detiene. Un video del que ya nadie se acuerda siguiendo de fondo es justo el defecto
// que este componente venía a arreglar.
let activoActual = null;
const oyentes = new Set();

/** id -> función que devuelve el iframe de ese video, para reconocerlo cuando tiene el foco. */
const marcos = new Map();
let sondeo = null;

/**
 * Cada cuánto se mira quién tiene el foco. Es una lectura de una propiedad, así que es barato, y
 * un cuarto de segundo de retraso no se nota: lo que importa es que el otro video se calle.
 */
const INTERVALO_SONDEO = 250;

const avisar = () => oyentes.forEach((fn) => fn(activoActual));

const activar = (id) => {
    if (activoActual === id) return;
    activoActual = id;
    avisar();
};

const desactivar = (id) => {
    if (activoActual !== id) return;
    activoActual = null;
    avisar();
};

/**
 * Quién tiene el foco decide quién manda.
 *
 * Aquí no sirve escuchar el `blur` de la ventana, que fue el primer intento: ese evento avisa
 * cuando el foco sale del documento principal, y al pasar de un iframe a otro el documento
 * principal nunca lo recupera. Resultado: el segundo clic no se detectaba y los dos videos sonaban
 * a la vez. Mirar el elemento activo cada poco no tiene ese punto ciego.
 *
 * Si el foco está en cualquier otro sitio (el fondo de la página, un botón) no se desactiva nada:
 * solo cambia el mando cuando otro video lo reclama.
 */
const revisarFoco = () => {
    const enfocado = document.activeElement;
    if (!enfocado || enfocado.tagName !== 'IFRAME') return;

    for (const [id, obtenerIframe] of marcos) {
        if (obtenerIframe() === enfocado) {
            activar(id);
            return;
        }
    }
};

const registrar = (id, obtenerIframe) => {
    marcos.set(id, obtenerIframe);
    if (!sondeo) sondeo = setInterval(revisarFoco, INTERVALO_SONDEO);
};

const olvidar = (id) => {
    marcos.delete(id);
    desactivar(id);

    if (marcos.size === 0 && sondeo) {
        clearInterval(sondeo);
        sondeo = null;
    }
};

/** Proporción máxima de la pantalla que puede ocupar la miniatura. */
const MINI_ANCHO_MAX = 320;
const MINI_ANCHO_VW = 0.55;
const MINI_ALTO_VH = 0.42;

const calcularEscala = (ancho, alto) => {
    if (!ancho || !alto) return 1;

    const anchoDestino = Math.min(MINI_ANCHO_MAX, window.innerWidth * MINI_ANCHO_VW);
    const altoMaximo = window.innerHeight * MINI_ALTO_VH;

    // Se toma la restricción más severa para que la miniatura entre entera, sin recortes.
    return Math.min(anchoDestino / ancho, altoMaximo / alto, 1);
};

export const useMiniPlayer = (habilitado) => {
    const slotRef = useRef(null);
    const idRef = useRef(null);
    if (idRef.current === null) idRef.current = Symbol('mini-player');

    const [activo, setActivo] = useState(false);
    const [anclado, setAnclado] = useState(false);
    const [medida, setMedida] = useState(null);
    // Cambiar esta clave vuelve a montar el iframe. Es la única forma de detener un video de otro
    // dominio al que no le hemos pedido permiso de control por JavaScript: se recarga y se calla.
    const [recargaKey, setRecargaKey] = useState(0);

    // Se apunta al registro para enterarse cuando otro video toma el relevo.
    useEffect(() => {
        if (!habilitado) return undefined;

        const id = idRef.current;
        const alCambiar = () => setActivo(activoActual === id);

        oyentes.add(alCambiar);
        registrar(id, () => slotRef.current?.querySelector('iframe') || null);

        return () => {
            oyentes.delete(alCambiar);
            olvidar(id);
        };
    }, [habilitado]);

    // El `blur` de la ventana no basta por sí solo (ver revisarFoco), pero sí adelanta el primer
    // clic: el sondeo lo detectaría igual, un cuarto de segundo después.
    useEffect(() => {
        if (!habilitado) return undefined;

        const alPerderFoco = () => setTimeout(revisarFoco, 0);

        window.addEventListener('blur', alPerderFoco);
        return () => window.removeEventListener('blur', alPerderFoco);
    }, [habilitado]);

    // Perder el mando significa callarse. Vale tanto cuando otro video lo reclama como cuando la
    // persona cierra la miniatura: en los dos casos lo que quiere es que este deje de sonar.
    const teniaElMando = useRef(false);

    useEffect(() => {
        if (teniaElMando.current && !activo) {
            setAnclado(false);
            setRecargaKey((valor) => valor + 1);
        }

        teniaElMando.current = activo;
    }, [activo]);

    // Anclar y soltar según lo que queda visible del hueco original. Los dos umbrales distintos
    // evitan el parpadeo cuando el borde del video queda justo en el filo de la pantalla.
    useEffect(() => {
        const slot = slotRef.current;
        if (!habilitado || !activo || !slot) {
            setAnclado(false);
            return undefined;
        }

        const observador = new IntersectionObserver(([entrada]) => {
            if (entrada.intersectionRatio <= 0.05) {
                const caja = slot.getBoundingClientRect();
                setMedida({ ancho: caja.width, alto: caja.height });
                setAnclado(true);
            } else if (entrada.intersectionRatio >= 0.5) {
                setAnclado(false);
            }
        }, { threshold: [0, 0.05, 0.5, 1] });

        observador.observe(slot);
        return () => observador.disconnect();
    }, [habilitado, activo]);

    // El hueco sigue ocupando su sitio mientras el video está en la esquina, así que al cambiar el
    // tamaño de la ventana se vuelve a medir desde ahí.
    useEffect(() => {
        if (!anclado) return undefined;

        const alRedimensionar = () => {
            const caja = slotRef.current?.getBoundingClientRect();
            if (caja) setMedida({ ancho: caja.width, alto: caja.height });
        };

        window.addEventListener('resize', alRedimensionar);
        return () => window.removeEventListener('resize', alRedimensionar);
    }, [anclado]);

    const volver = useCallback(() => {
        slotRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, []);

    // Ceder el mando es todo lo que hace falta: el efecto de arriba se encarga de soltar la esquina
    // y de recargar el iframe para que el video pare.
    const cerrar = useCallback(() => {
        desactivar(idRef.current);
    }, []);

    const escala = anclado && medida ? calcularEscala(medida.ancho, medida.alto) : 1;

    return {
        slotRef,
        anclado: anclado && !!medida,
        medida,
        escala,
        recargaKey,
        volver,
        cerrar
    };
};

export default useMiniPlayer;
