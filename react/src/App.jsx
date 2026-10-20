// La pagina: cabecera, la vista que pide la direccion y el pie corto. Las
// vistas y sus direcciones estan en comun/vistas.js:
//   #/  #/nosotros  #/tienda-catalogo  #/tienda-<categoria>  #/contacto
//   #/confirmar  #/comprobante
//   #/cuenta/entrar  #/cuenta/crear  #/cuenta/verificar  #/cuenta  #/cuenta/pedidos
// HashRouter las escribe con una barra detras del '#'. Las de antes, sin la
// barra (#tienda-panes), siguen entrando: React Router le pone la barra al
// leer la direccion. Las de cuando todo era una pagina (#historia,
// #visitanos...) llevan a su vista con replace; lo demas, a #/.
import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, m, useIsPresent, useReducedMotion } from 'motion/react';
import Cabecera from './comun/Cabecera.jsx';
import Pie from './comun/Pie.jsx';
import Globo from './comun/Globo.jsx';
import { RegionAvisos } from './comun/Avisos.jsx';
import SaltoContenido from './comun/SaltoContenido.jsx';
import { VIEJAS, vistaDeRuta } from './comun/vistas.js';
import Inicio from './vistas/Inicio.jsx';
import Nosotros from './vistas/Nosotros.jsx';
import Contacto from './vistas/Contacto.jsx';
import Catalogo from './catalogo/Catalogo.jsx';
import { categoriaDeRuta } from './catalogo/categorias.js';
import Confirmar from './pedido/Confirmar.jsx';
import Comprobante from './pedido/Comprobante.jsx';
import Canasta from './pedido/Canasta.jsx';
import BarraDeshacer from './pedido/BarraDeshacer.jsx';
import Entrar from './cuenta/Entrar.jsx';
import CrearCuenta from './cuenta/CrearCuenta.jsx';
import Verificar from './cuenta/Verificar.jsx';
import MisDatos from './cuenta/MisDatos.jsx';
import MisPedidos from './cuenta/MisPedidos.jsx';

// La vista que toca. Las de la tienda son una sola: entre categorias el
// catalogo se queda montado y solo cambia "Filtrar por".
function Vista({ cual, pathname }) {
  if (cual === 'inicio') return <Inicio />;
  if (cual === 'nosotros') return <Nosotros />;
  if (cual === 'contacto') return <Contacto />;
  if (cual === 'confirmar') return <Confirmar />;
  if (cual === 'comprobante') return <Comprobante />;
  if (cual === 'cuenta-entrar') return <Entrar />;
  if (cual === 'cuenta-crear') return <CrearCuenta />;
  if (cual === 'cuenta-verificar') return <Verificar />;
  if (cual === 'cuenta') return <MisDatos />;
  if (cual === 'cuenta-pedidos') return <MisPedidos />;
  return <Catalogo categoria={categoriaDeRuta(pathname)} />;
}

// La vista nueva entra con un fundido y sube un poco (seccion 15 del plan):
// es el unico movimiento de entrada de cada vista. La de antes se va en el
// acto, sin salida animada: mientras saliera seguiria viva leyendo la
// direccion nueva (el comprobante, sin recibo, mandaria a #/ a medio camino).
const ENTRADA = { opacity: 0, y: 14 };
const QUIETA = { opacity: 1, x: 0, y: 0 };
const TRANSICION = { duration: 0.28, ease: [0.16, 1, 0.3, 1] };

// El grupo de la vista: entre categorias de la tienda no hay fundido, porque
// no se cambia de vista (el catalogo anima sus fichas).
const grupoDe = (cual) => cual || 'cambiando';

// De crear la cuenta a verificar el correo ("Movimiento de la cuenta", punto
// 2): el formulario sale hacia la izquierda y el codigo entra por la derecha,
// para que se lea como el paso siguiente. Es la unica vista que se anima al
// salir, y por eso va aparte, en su propio AnimatePresence: crear no tiene
// nada que cambie con la direccion nueva mientras se va (su desvio se miro al
// llegar), cosa que no se puede decir de todas.
const DESDE_LA_DERECHA = { opacity: 0, x: 56 };
const AL_LADO = { duration: 0.32, ease: [0.16, 1, 0.3, 1] };
const SALIDA = {
  // custom: a que vista se va, y si se pidio menos movimiento. A cualquier
  // otra que no sea verificar, crear se va en el acto, como las demas.
  sale: ({ siguiente, reducido }) => (siguiente === 'cuenta-verificar' && !reducido
    ? { opacity: 0, x: -56, transition: { duration: 0.22, ease: [0.4, 0, 1, 1] } }
    : { opacity: 0, transition: { duration: 0 } }),
};

// Mientras se va queda encima de la vista nueva, fuera del flujo (is-saliendo)
// e inert: ni el foco ni el lector de pantalla entran en lo que ya se fue.
function VistaQueSale({ children, ...animacion }) {
  const presente = useIsPresent();
  return (
    <m.div className={presente ? 'vista-marco' : 'vista-marco is-saliendo'} inert={!presente} variants={SALIDA} exit="sale" {...animacion}>
      {children}
    </m.div>
  );
}

function App() {
  const location = useLocation();
  const reducido = useReducedMotion();
  const { pathname } = location;
  const cual = vistaDeRuta(pathname);
  // De que vista se viene: decide por donde entra la nueva. Se ajusta
  // mientras se pinta, para que la vista nueva ya nazca sabiendolo.
  const [paso, setPaso] = useState({ antes: null, ahora: cual });
  if (paso.ahora !== cual) setPaso({ antes: paso.ahora, ahora: cual });
  const aVerificar = paso.antes === 'cuenta-crear' && cual === 'cuenta-verificar';

  // Una direccion vieja, o una que no existe: se cambia sin dejar rastro en
  // Atras y, si es la de abrir la pagina, sin mover el foco (useVista).
  const alAbrir = { alAbrir: location.key === 'default' };
  let entrada = ENTRADA;
  if (reducido || location.key === 'default') entrada = false;
  else if (aVerificar) entrada = DESDE_LA_DERECHA;
  let vista;
  if (cual) vista = <Vista cual={cual} pathname={pathname} />;
  else vista = <Navigate to={VIEJAS[pathname] || '/'} replace state={alAbrir} />;

  return (
    <>
      <SaltoContenido />
      <Cabecera />
      <main id="contenido" tabIndex={-1}>
        {/* Al abrir la pagina no hay fundido: la portada ya tiene su entrada
            propia, y con menos movimiento no se anima nada. */}
        {cual !== 'cuenta-crear' ? (
          <m.div
            key={grupoDe(cual)}
            className="vista-marco"
            initial={entrada}
            animate={QUIETA}
            transition={aVerificar ? AL_LADO : TRANSICION}
          >
            {vista}
          </m.div>
        ) : null}
        {/* Detras en el documento: lo que busque por clase encuentra antes
            la vista nueva que la que se va. */}
        <AnimatePresence custom={{ siguiente: cual, reducido }}>
          {cual === 'cuenta-crear' ? (
            <VistaQueSale key="cuenta-crear" initial={entrada} animate={QUIETA} transition={TRANSICION}>
              {vista}
            </VistaQueSale>
          ) : null}
        </AnimatePresence>
      </main>
      <Pie />
      {/* El boton de la canasta va en la cabecera; el panel y la barra de
          deshacer, fuera de la pagina, que queda inert detras del panel. */}
      <Canasta />
      <BarraDeshacer />
      <RegionAvisos />
      <Globo />
    </>
  );
}

export default App;
