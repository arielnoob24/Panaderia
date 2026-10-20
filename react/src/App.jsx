// Las rutas del sitio. Son las del sitio actual (seccion 4 y 6 del plan):
//   #/                      la portada
//   #/tienda-catalogo       el catalogo entero
//   #/tienda-<categoria>    el catalogo con el filtro puesto
//   #/confirmar             confirmar el pedido y pagar
//   #/comprobante           el comprobante del pedido pagado
// HashRouter las escribe con una barra detras del '#'. Las de antes, sin la
// barra (#tienda-panes), siguen entrando: React Router le pone la barra al
// leer la direccion, asi que los enlaces guardados no se rompen.
// Fase 1: las vistas solo dicen donde se esta; se llenan en las fases 2 a 4.
import { Navigate, Route, Routes } from 'react-router-dom';
import Portada from './catalogo/Portada.jsx';
import VistaTienda from './catalogo/VistaTienda.jsx';
import { CATEGORIAS } from './catalogo/categorias.js';
import Confirmar from './pedido/Confirmar.jsx';
import Comprobante from './pedido/Comprobante.jsx';

function App() {
  return (
    <main id="contenido">
      <Routes>
        <Route path="/" element={<Portada />} />
        {/* Una ruta por categoria, y no 'tienda-:categoria': React Router no
            admite un parametro pegado a un texto dentro del mismo tramo. */}
        <Route path="/tienda-catalogo" element={<VistaTienda categoria="catalogo" />} />
        {CATEGORIAS.map((c) => (
          <Route key={c.id} path={`/tienda-${c.id}`} element={<VistaTienda categoria={c.id} />} />
        ))}
        <Route path="/confirmar" element={<Confirmar />} />
        <Route path="/comprobante" element={<Comprobante />} />
        {/* Lo que no es una ruta vuelve a la portada, sin dejar rastro en Atras. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  );
}

export default App;
