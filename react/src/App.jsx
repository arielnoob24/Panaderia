// La pagina y sus rutas. Son las del sitio actual (secciones 4 y 6 del plan):
//   #/                      la portada, con "Los mas pedidos"
//   #/tienda-catalogo       el catalogo entero
//   #/tienda-<categoria>    el catalogo con "Filtrar por" puesto
//   #/confirmar             confirmar el pedido y pagar (fase 4)
//   #/comprobante           el comprobante del pedido pagado (fase 4)
// HashRouter las escribe con una barra detras del '#'. Las de antes, sin la
// barra (#tienda-panes), siguen entrando: React Router le pone la barra al
// leer la direccion, asi que los enlaces guardados no se rompen.
//
// La portada y las vistas de catalogo son una sola ruta a proposito (ver
// Portada.jsx): la vista aparta la portada en vez de reemplazarla.
import { Route, Routes } from 'react-router-dom';
import Cabecera from './comun/Cabecera.jsx';
import Pie from './comun/Pie.jsx';
import Globo from './comun/Globo.jsx';
import { RegionAvisos } from './comun/Avisos.jsx';
import EnlaceSeccion from './comun/EnlaceSeccion.jsx';
import Portada from './catalogo/Portada.jsx';
import Confirmar from './pedido/Confirmar.jsx';
import Comprobante from './pedido/Comprobante.jsx';
import Canasta from './pedido/Canasta.jsx';
import BarraDeshacer from './pedido/BarraDeshacer.jsx';

function App() {
  return (
    <>
      {/* Lleva el foco a <main> sin cambiar la direccion (secciones.js). */}
      <EnlaceSeccion a="contenido" className="skip-link">Saltar al contenido</EnlaceSeccion>
      <Cabecera />
      <main id="contenido" tabIndex={-1}>
        <Routes>
          <Route path="/confirmar" element={<Confirmar />} />
          <Route path="/comprobante" element={<Comprobante />} />
          {/* La portada decide si la direccion es una de las suyas; si no,
              vuelve a #/ con replace. */}
          <Route path="*" element={<Portada />} />
        </Routes>
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
