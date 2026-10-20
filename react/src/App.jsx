// La pagina: cabecera, la vista que pide la direccion y el pie corto. Las
// vistas y sus direcciones estan en comun/vistas.js:
//   #/  #/nosotros  #/tienda-catalogo  #/tienda-<categoria>  #/contacto
//   #/confirmar  #/comprobante
// HashRouter las escribe con una barra detras del '#'. Las de antes, sin la
// barra (#tienda-panes), siguen entrando: React Router le pone la barra al
// leer la direccion. Las de cuando todo era una pagina (#historia,
// #visitanos...) llevan a su vista con replace; lo demas, a #/.
import { Navigate, useLocation } from 'react-router-dom';
import { m, useReducedMotion } from 'motion/react';
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

// La vista que toca. Las de la tienda son una sola: entre categorias el
// catalogo se queda montado y solo cambia "Filtrar por".
function Vista({ cual, pathname }) {
  if (cual === 'inicio') return <Inicio />;
  if (cual === 'nosotros') return <Nosotros />;
  if (cual === 'contacto') return <Contacto />;
  if (cual === 'confirmar') return <Confirmar />;
  if (cual === 'comprobante') return <Comprobante />;
  return <Catalogo categoria={categoriaDeRuta(pathname)} />;
}

// La vista nueva entra con un fundido y sube un poco (seccion 15 del plan):
// es el unico movimiento de entrada de cada vista. La de antes se va en el
// acto, sin salida animada: mientras saliera seguiria viva leyendo la
// direccion nueva (el comprobante, sin recibo, mandaria a #/ a medio camino).
const ENTRADA = { opacity: 0, y: 14 };
const QUIETA = { opacity: 1, y: 0 };
const TRANSICION = { duration: 0.28, ease: [0.16, 1, 0.3, 1] };

// El grupo de la vista: entre categorias de la tienda no hay fundido, porque
// no se cambia de vista (el catalogo anima sus fichas).
const grupoDe = (cual) => cual || 'cambiando';

function App() {
  const location = useLocation();
  const reducido = useReducedMotion();
  const { pathname } = location;
  const cual = vistaDeRuta(pathname);

  // Una direccion vieja, o una que no existe: se cambia sin dejar rastro en
  // Atras y, si es la de abrir la pagina, sin mover el foco (useVista).
  const alAbrir = { alAbrir: location.key === 'default' };
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
        <m.div
          key={grupoDe(cual)}
          className="vista-marco"
          initial={reducido || location.key === 'default' ? false : ENTRADA}
          animate={QUIETA}
          transition={TRANSICION}
        >
          {vista}
        </m.div>
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
