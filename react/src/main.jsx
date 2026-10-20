// El arranque: la hoja de estilos de siempre, el enrutador, la region de
// avisos (que la usan todas las zonas), la sesion, el pedido (que necesita la
// sesion para rellenar la direccion), la canasta y la aplicacion.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { LazyMotion, MotionConfig, domAnimation } from 'motion/react';
// La misma hoja que usa el sitio actual, importada de la raiz y no copiada:
// las clases de los componentes son las mismas, asi que tiene que aplicar tal
// cual. Vite resuelve sus url() (las fotos de portada) y las mete en el build.
import '@raiz/assets/css/styles.css';
// Lo de la version en React (vistas, pie corto...), despues para que gane.
import './estilos/vistas.css';
import { AvisosProvider } from './comun/Avisos.jsx';
import { SesionProvider } from './estado/SesionProvider.jsx';
import { PedidoProvider } from './estado/PedidoProvider.jsx';
import { CanastaProvider } from './pedido/CanastaProvider.jsx';
import App from './App.jsx';
import { cederDesplazamiento } from './comun/apertura.js';

// Atras y Adelante entre vistas llevan arriba del todo, no adonde se estaba
// (comun/apertura.js).
cederDesplazamiento();

// HashRouter y no BrowserRouter: con la ruta despues del '#', GitHub Pages
// siempre sirve el mismo index.html y no hace falta el truco del 404.
// Motion (seccion 15 del plan): LazyMotion con domAnimation trae solo lo que
// se usa (opacidad, transformaciones, salida), no el paquete entero; los
// componentes animados se escriben con m.div y no con motion.div. Con
// reducedMotion="user", quien pidio menos movimiento al sistema no ve
// desplazamientos; lo que ademas tiene que quedarse quieto del todo lo mira
// con useReducedMotion.
createRoot(document.getElementById('raiz')).render(
  <StrictMode>
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user">
        <HashRouter>
          <AvisosProvider>
            <SesionProvider>
              <PedidoProvider>
                <CanastaProvider>
                  <App />
                </CanastaProvider>
              </PedidoProvider>
            </SesionProvider>
          </AvisosProvider>
        </HashRouter>
      </MotionConfig>
    </LazyMotion>
  </StrictMode>,
);
