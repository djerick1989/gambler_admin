// Revisa el resultado de `vite build` antes de que salga de aqui.
//
// Existe por un incidente real: un .env.local con la URL de desarrollo se carga tambien al compilar
// para produccion, y el sitio publicado quedo llamando a http://localhost:5173. El login dejo de
// funcionar para todo el mundo y no habia forma de notarlo mirando el codigo.
//
// Uso: node scripts/verify-bundle.mjs [carpeta]   (por defecto ./dist)
import fs from 'fs';
import path from 'path';

// Se exige el puerto a proposito. React Router y Axios llevan dentro un "http://localhost" sin
// puerto como valor por defecto para cuando no hay navegador; eso es inofensivo y aparece en
// cualquier build. Lo que nunca debe salir es una direccion local con puerto, que solo puede venir
// de nuestra configuracion.
const PROHIBIDO = [
    { patron: /https?:\/\/localhost:\d+/g, motivo: 'apunta a localhost con puerto' },
    { patron: /https?:\/\/127\.0\.0\.1:\d+/g, motivo: 'apunta a 127.0.0.1 con puerto' }
];

const carpeta = process.argv[2] || 'dist';

const archivos = [];
const recorrer = (dir) => {
    for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
        const completo = path.join(dir, entrada.name);
        if (entrada.isDirectory()) recorrer(completo);
        else if (/\.(js|css|html)$/i.test(entrada.name)) archivos.push(completo);
    }
};

if (!fs.existsSync(carpeta)) {
    console.error(`No existe la carpeta ${carpeta}. ¿Se ejecuto el build?`);
    process.exit(1);
}

recorrer(carpeta);

const hallazgos = [];
for (const archivo of archivos) {
    const contenido = fs.readFileSync(archivo, 'utf8');
    for (const { patron, motivo } of PROHIBIDO) {
        const coincidencias = contenido.match(patron);
        if (coincidencias) {
            hallazgos.push({ archivo, motivo, ejemplo: [...new Set(coincidencias)].slice(0, 3).join(', ') });
        }
    }
}

if (hallazgos.length > 0) {
    console.error('\nBuild rechazado: el bundle no puede salir con direcciones locales.\n');
    for (const { archivo, motivo, ejemplo } of hallazgos) {
        console.error(`  ${archivo}\n    ${motivo}: ${ejemplo}`);
    }
    console.error('\nCausa habitual: un archivo .env.local con VITE_API_BASE_URL apuntando a localhost.');
    console.error('Vite lo carga tambien al compilar. Usa .env.development.local para lo local.\n');
    process.exit(1);
}

console.log(`Bundle verificado: ${archivos.length} archivos, sin direcciones locales.`);
