// El arranque: la hoja de estilos de siempre, el enrutador, la region de
// avisos (que la usan todas las zonas) y la aplicacion.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
// La misma hoja que usa el sitio actual, importada de la raiz y no copiada:
// las clases de los componentes son las mismas, asi que tiene que aplicar tal
// cual. Vite resuelve sus url() (las fotos de portada) y las mete en el build.
import '@raiz/assets/css/styles.css';
import { AvisosProvider } from './comun/Avisos.jsx';
import App from './App.jsx';

// HashRouter y no BrowserRouter: con la ruta despues del '#', GitHub Pages
// siempre sirve el mismo index.html y no hace falta el truco del 404.
createRoot(document.getElementById('raiz')).render(
  <StrictMode>
    <HashRouter>
      <AvisosProvider>
        <App />
      </AvisosProvider>
    </HashRouter>
  </StrictMode>,
);
