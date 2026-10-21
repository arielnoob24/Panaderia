// ---- Como arma Vite la version en React --------------------------------
// react/ vive dentro del repo del sitio actual mientras dura la migracion, y
// lo que comparten (styles.css, las fotos y data/productos.json) se queda en
// la raiz: una sola copia de cada cosa. Este
// archivo es el que le dice a Vite donde encontrarlas.
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// La raiz del repo, un piso por encima de react/.
const RAIZ = fileURLToPath(new URL('..', import.meta.url));

export default defineConfig({
  plugins: [react()],
  // Rutas relativas en el index.html construido: asi sirve igual en
  // /Panaderia/ de GitHub Pages que en la raiz de npm run preview.
  base: './',
  resolve: {
    // '@raiz/...' es la raiz del repo. Se importa de ahi en vez de copiar:
    // lo que se toca en assets/ o en data/ lo ven los dos sitios a la vez.
    alias: { '@raiz': RAIZ },
  },
  server: {
    // En npm run dev Vite solo sirve lo que hay dentro de react/; sin esto
    // las fotos y la hoja de estilos de la raiz darian 403.
    fs: { allow: [RAIZ] },
  },
});
