// La vista de catalogo (#/tienda-catalogo y #/tienda-<categoria>).
// Fase 1: solo dice que se esta ahi. Fichas, filtros, orden y buscador
// llegan en la fase 2.
import { Link } from 'react-router-dom';
import { nombreCategoria } from './categorias.js';

function VistaTienda({ categoria }) {
  const titulo = categoria === 'catalogo' ? 'Todo el catálogo' : nombreCategoria(categoria);
  return (
    <section className="catalog section-pad" data-vista={categoria}>
      <div className="container">
        <h2>{titulo}</h2>
        <p>Esta vista se arma en la fase 2.</p>
        <p><Link to="/">Volver a la portada</Link></p>
      </div>
    </section>
  );
}

export default VistaTienda;
