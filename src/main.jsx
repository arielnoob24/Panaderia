// El arranque: la hoja de estilos de siempre, el enrutador, la region de
// avisos (que la usan todas las zonas), la sesion, el pedido (que necesita la
// sesion para rellenar la direccion), la canasta y la aplicacion.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { LazyMotion, MotionConfig, domMax } from 'motion/react';
// Fraunces, la letra de los titulos (seccion 10 del plan), servida desde el
// propio sitio: Vite copia sus woff2 al build y nada se pide a Google. full
// trae todos los ejes (opsz, SOFT, WONK y el peso), en recta y en cursiva;
// cada archivo se baja solo si en la pagina hay letras de su alfabeto.
import '@fontsource-variable/fraunces/full.css';
import '@fontsource-variable/fraunces/full-italic.css';
// La hoja de siempre, la del sitio presentado (assets/css/styles.css):
// las clases de los componentes son las mismas, asi que tiene que aplicar tal
// cual. Vite resuelve sus url() (las fotos de portada) y las mete en el build.
import '/assets/css/styles.css';
// Lo propio de las vistas (portada, cuenta...), despues para que gane.
import './estilos/vistas.css';
import { AvisosProvider } from './comun/Avisos.jsx';
import { SesionProvider } from './estado/SesionProvider.jsx';
import { PedidoProvider } from './estado/PedidoProvider.jsx';
import { CanastaProvider } from './pedido/CanastaProvider.jsx';
import App from './App.jsx';
import { cederDesplazamiento } from './comun/apertura.js';
import { precargarEnReposo } from './comun/cargaPorPartes.js';
import { vigilarPuntero } from './comun/puntero.js';

// Los efectos de pasar por encima, solo con raton o lapiz (comun/puntero.js).
vigilarPuntero();

// Atras y Adelante entre vistas llevan arriba del todo, no adonde se estaba
// (comun/apertura.js).
cederDesplazamiento();

// La cuenta y el pago van en su propio archivo; ya cargada la pagina, se
// traen sin prisa para que esten cuando se abran (comun/cargaPorPartes.js).
precargarEnReposo();

// HashRouter y no BrowserRouter: con la ruta despues del '#', GitHub Pages
// siempre sirve el mismo index.html y no hace falta el truco del 404.
// Motion (seccion 15 del plan): LazyMotion con domMax activa tambien las
// transiciones de layout del indicador compartido; los componentes animados
// se escriben con m.div y no con motion.div. Con
// reducedMotion="user", quien pidio menos movimiento al sistema no ve
// desplazamientos; lo que ademas tiene que quedarse quieto del todo lo mira
// con useReducedMotion.
createRoot(document.getElementById('raiz')).render(
  <StrictMode>
    <LazyMotion features={domMax}>
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
