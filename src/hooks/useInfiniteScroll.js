import { useEffect, useRef } from 'react';

/**
 * Pide la siguiente pagina cuando el final de la lista se acerca a la pantalla.
 *
 * Se observa un elemento vacio colocado detras del ultimo elemento, no la posicion del scroll. Es
 * mas barato —el navegador avisa en vez de tener que preguntarle en cada pixel— y funciona igual
 * aunque el contenedor que desplaza no sea la ventana.
 *
 * El margen es la clave de que no se note: la peticion arranca cuando el final esta a media pantalla
 * de distancia, asi que para cuando la persona llega, las publicaciones ya estan puestas. Esperar a
 * que el centinela sea visible de verdad significaria ver siempre el hueco de carga.
 *
 * @param {boolean}  hasMore    Si queda alguna pagina por pedir.
 * @param {boolean}  loading    Si hay una peticion en curso; mientras tanto no se dispara otra.
 * @param {Function} onLoadMore Que hacer para traer la siguiente.
 */
export const useInfiniteScroll = ({ hasMore, loading, onLoadMore, rootMargin = '600px 0px' }) => {
    const centinelaRef = useRef(null);

    // La funcion se guarda en una referencia para que cambiarla no obligue a rehacer el observador
    // en cada pintado; el observador solo depende de si hay que seguir mirando o no.
    const alCargarRef = useRef(onLoadMore);
    alCargarRef.current = onLoadMore;

    const soportado = typeof IntersectionObserver === 'function';

    useEffect(() => {
        if (!soportado || !hasMore || loading) return undefined;

        const nodo = centinelaRef.current;
        if (!nodo) return undefined;

        const observador = new IntersectionObserver(([entrada]) => {
            if (entrada.isIntersecting) alCargarRef.current();
        }, { rootMargin });

        // Al terminar una carga el efecto se rehace, y observar dispara una comprobacion inmediata.
        // Eso resuelve el caso de una pantalla alta donde la pagina recien traida no llega a llenarla:
        // sin esta reevaluacion el centinela seguiria visible y nadie volveria a avisar.
        observador.observe(nodo);
        return () => observador.disconnect();
    }, [soportado, hasMore, loading, rootMargin]);

    return { centinelaRef, soportado };
};

export default useInfiniteScroll;
