import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import https from 'node:https'
import http from 'node:http'
import { crearResolutorConMemoria } from './scripts/dnsConMemoria.js'

const apiTarget = process.env.VITE_API_BASE_URL || 'https://api.ludopata.org'

const resolver = crearResolutorConMemoria({
  ttlMs: 60_000,
  alReutilizar: (hostname, error) =>
    console.log(`[proxy] DNS fallo para ${hostname} (${error.code}); se reutiliza la ultima direccion conocida`),
})

// Reutilizar conexiones hace que ademas haya muchas menos resoluciones que puedan fallar.
const opcionesAgente = { keepAlive: true, lookup: resolver }
const agente = apiTarget.startsWith('https')
  ? new https.Agent({ ...opcionesAgente, rejectUnauthorized: false })
  : new http.Agent(opcionesAgente)

/**
 * Un fallo del proxy tiene que terminar la peticion.
 *
 * Antes solo se escribia el error en la consola. Al poner un manejador propio se sustituye el que
 * trae http-proxy, asi que nadie cerraba la respuesta y el navegador se quedaba esperando hasta
 * agotar su tiempo. Ahora se responde 502 y el cliente puede reintentar de inmediato.
 */
const configurarProxy = (proxy) => {
  proxy.on('error', (error, _req, res) => {
    console.log(`[proxy] ${error.code || error.message}`)

    if (!res) return

    // En una conexion websocket lo que llega aqui es el socket, no una respuesta HTTP.
    if (typeof res.writeHead === 'function') {
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json' })
      }
      res.end(JSON.stringify({ error: 'proxy_unreachable', code: error.code }))
    } else if (typeof res.destroy === 'function') {
      res.destroy()
    }
  })
}

// Las tres rutas comparten configuracion. Antes estaba copiada tres veces, solo dos tenian
// manejador de errores, y esas dos escribian una linea por cada peticion y por cada respuesta.
const rutaProxy = (opciones = {}) => ({
  target: apiTarget,
  changeOrigin: true,
  secure: false,
  agent: agente,
  configure: configurarProxy,
  ...opciones,
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': rutaProxy(),
      '/chatHub': rutaProxy({ ws: true }),
      '/healthAgentHub': rutaProxy({ ws: true }),
    }
  }
})
