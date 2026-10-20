// La portada. Fase 1: solo la seccion del catalogo con una ficha, para probar
// que styles.css aplica y que el catalogo carga, y los enlaces a las rutas.
// La cabecera, la portada de verdad y "Los mas pedidos" llegan en la fase 2.
import { Link } from 'react-router-dom';
import { catalogo } from '../servicios/catalogo.js';
import FichaProducto from './FichaProducto.jsx';
import { CATEGORIAS } from './categorias.js';

// La ficha de muestra es el primer destacado que se puede pedir: es lo que
// abriria "Los mas pedidos".
const muestra = catalogo.productos.find((p) => p.destacado && p.disponible)
  || catalogo.productos[0];

function Portada() {
  return (
    <section id="catalogo" className="catalog section-pad">
      <div className="container">
        <div className="section-heading heading-row">
          <div>
            <p className="eyebrow">La vitrina</p>
            <h2>Hecho a mano,<br /><em>como en casa</em></h2>
          </div>
          <p className="section-intro">
            Todo empieza con harina, agua y tiempo. Elige tu favorito, haz tu pedido y pasa a buscarlo calentito.
          </p>
        </div>
        <p className="catalog-status" role="status" aria-live="polite">
          {catalogo.error && `No pudimos cargar el catálogo: ${catalogo.error.message}.`}
        </p>
        <div className="product-grid">
          {muestra && <FichaProducto producto={muestra} />}
        </div>
        {/* Provisional, mientras no hay menu Tienda: deja llegar a cada ruta. */}
        <nav aria-label="Rutas en construcción">
          <ul>
            <li><Link to="/tienda-catalogo">Catálogo entero</Link></li>
            {CATEGORIAS.map((c) => (
              <li key={c.id}><Link to={`/tienda-${c.id}`}>{c.nombre}</Link></li>
            ))}
            <li><Link to="/confirmar">Confirmar el pedido</Link></li>
          </ul>
        </nav>
      </div>
    </section>
  );
}

export default Portada;
