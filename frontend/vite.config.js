// ---- Como arma Vite el sitio --------------------------------------------
// Las fotos, la hoja de estilos y data/productos.json se importan desde la
// raiz del proyecto ('/assets/...', '/data/...'), que es como Vite entiende
// una ruta que empieza por barra: no hace falta alias.
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// ---- Variables del sitio (VITE_...) -------------------------------------
// Las direcciones y la clave publica que usa la pagina. Todas son publicas
// (cualquiera las ve en el navegador); lo secreto vive solo en el servidor.
// Se cambian sin tocar el codigo: en Netlify (Site configuration ->
// Environment variables), en el CI o en un .env.local (ver .env.example).
// Si nadie las pone, valen estas, las del proyecto de Supabase de hoy.
const PUBLICAS = {
  // La API: hoy la Edge Function; con el backend en Render, su direccion + /api.
  VITE_API_URL: 'https://ugscqizansixnsuzljtu.supabase.co/functions/v1/api',
  // El panel (/admin/...) se queda en la Edge Function aunque VITE_API_URL
  // apunte al backend Express.
  VITE_API_ADMIN_URL: 'https://ugscqizansixnsuzljtu.supabase.co/functions/v1/api',
  VITE_SUPABASE_URL: 'https://ugscqizansixnsuzljtu.supabase.co',
  VITE_SUPABASE_CLAVE_PUBLICA: 'sb_publishable_T4ayAx_e96H98bv_dlnCrg_AncGFwos',
  // Firestore (avisos del local): el proyecto de Firebase y su clave web,
  // publica; lo que protege los datos son las reglas (firebase/firestore.rules).
  VITE_FIREBASE_PROJECT_ID: 'el-tradicional-panaderia',
  VITE_FIREBASE_API_KEY: 'AIzaSyBS5cgMObB_2wA1J4ImnV2TZJPTYWzJuDQ',
};

// La foto que muestran WhatsApp y las redes al compartir el enlace (og:image,
// twitter:image y el JSON-LD de index.html) va con su direccion entera, asi
// que Vite no la ve. Se deja en dist/ en la misma ruta que tenia en el sitio
// presentado, sin huella, para que esa direccion siga valiendo.
const FIJAS = ['assets/img/hero-1200.jpg'];
function copiarFijas() {
  return {
    name: 'copiar-fijas',
    apply: 'build',
    generateBundle() {
      for (const ruta of FIJAS) {
        this.emitFile({ type: 'asset', fileName: ruta, source: readFileSync(fileURLToPath(new URL(ruta, import.meta.url))) });
      }
    },
  };
}

// Una entrada por pagina: todos los .html de la raiz (index.html y los que
// genera scripts/paginas.mjs). Cada uno sale en dist/ con su nombre.
const paginas = Object.fromEntries(
  readdirSync(fileURLToPath(new URL('.', import.meta.url)))
    .filter((f) => f.endsWith('.html'))
    .map((f) => [f.slice(0, -5), fileURLToPath(new URL(f, import.meta.url))]),
);

export default defineConfig(({ mode }) => {
  // Lo que ya venga del entorno o de un .env manda; lo que falte toma su
  // valor de PUBLICAS. Vite lee process.env despues de esta funcion, asi que
  // llega igual a import.meta.env y a los %VITE_...% de los .html.
  const puestas = loadEnv(mode, fileURLToPath(new URL('.', import.meta.url)), 'VITE_');
  for (const [nombre, valor] of Object.entries(PUBLICAS)) {
    if (!puestas[nombre]) process.env[nombre] = valor;
  }
  return {
    plugins: [react(), copiarFijas()],
    build: { rollupOptions: { input: paginas } },
    // Rutas relativas en el index.html construido: asi sirve igual en
    // /Panaderia/ de GitHub Pages que en la raiz de npm run preview.
    base: './',
  };
});
