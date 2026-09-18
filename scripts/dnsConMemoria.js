import { lookup as resolverDns } from 'node:dns'

/**
 * Resolucion de nombres con memoria y con red de seguridad, para el proxy del servidor de
 * desarrollo (vite.config.js).
 *
 * El problema que resuelve: el proxy resolvia el nombre de la API en cada peticion, y basta un
 * tropiezo del resolutor para que Node devuelva ENOTFOUND y la peticion muera. Con SignalR se nota
 * mucho, porque los dos hubs renegocian cada pocos segundos: un microcorte del DNS se convertia en
 * una pared de errores en la consola.
 *
 * Dos medidas, en este orden:
 *  1. Se recuerda la ultima direccion resuelta durante un rato, asi que hay muchas menos consultas.
 *  2. Si el resolutor falla pero teniamos una respuesta anterior, se reutiliza. Un corte de dos
 *     segundos no deberia tumbar una peticion cuando sabemos perfectamente a donde ibamos.
 *
 * El error solo se propaga cuando no hay nada guardado, que es el caso en el que de verdad no
 * sabemos a donde ir.
 *
 * Vive solo en desarrollo: en produccion el navegador habla directamente con la API.
 */
export const crearResolutorConMemoria = ({
  ttlMs = 60_000,
  alReutilizar,
  // Se puede sustituir el resolutor real. Existe para poder provocar el fallo de DNS en una prueba:
  // la red de seguridad de aqui abajo no sirve de nada si nadie ha comprobado que funciona.
  resolver = resolverDns,
} = {}) => {
  const cache = new Map()

  const resolutor = (hostname, opciones, callback) => {
    if (typeof opciones === 'function') {
      callback = opciones
      opciones = {}
    }

    const clave = `${hostname}|${opciones.family || 0}|${opciones.all ? 1 : 0}`
    const guardado = cache.get(clave)
    const ahora = Date.now()

    if (guardado && ahora < guardado.expira) {
      process.nextTick(() => callback(null, ...guardado.resultado))
      return
    }

    resolver(hostname, opciones, (error, ...resultado) => {
      if (error) {
        // Se acepta incluso una entrada caducada: mas vale una direccion de hace un minuto que
        // ninguna. Solo se guarda lo que el resolutor devolvio alguna vez de verdad.
        if (guardado) {
          alReutilizar?.(hostname, error)
          callback(null, ...guardado.resultado)
          return
        }
        callback(error)
        return
      }

      cache.set(clave, { resultado, expira: ahora + ttlMs })
      callback(null, ...resultado)
    })
  }

  resolutor.cache = cache
  return resolutor
}
