// La pagina: cabecera, la vista que pide la direccion y el pie corto. Las
// vistas y sus direcciones estan en comun/vistas.js:
//   #/  #/nosotros  #/tienda-catalogo  #/tienda-<categoria>  #/contacto
//   #/confirmar  #/comprobante
// HashRouter las escribe con una barra detras del '#'. Las de antes, sin la
// barra (#tienda-panes), siguen entrando: React Router le pone la barra al
// leer la direccion. Las de cuando todo era una pagina (#historia,
// #visitanos...) llevan a su vista con replace; lo demas, a #/.
import { Navigate, useLocation } from 'react-router-dom';
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

function App() {
  const location = useLocation();
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
        {vista}
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
