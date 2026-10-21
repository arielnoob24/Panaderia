// ---- Como arma Vite el sitio --------------------------------------------
// Las fotos, la hoja de estilos y data/productos.json se importan desde la
// raiz del proyecto ('/assets/...', '/data/...'), que es como Vite entiende
// una ruta que empieza por barra: no hace falta alias.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

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

export default defineConfig({
  plugins: [react(), copiarFijas()],
  // Rutas relativas en el index.html construido: asi sirve igual en
  // /Panaderia/ de GitHub Pages que en la raiz de npm run preview.
  base: './',
});
