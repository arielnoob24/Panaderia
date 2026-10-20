// ---- La cabeza de la vista de catalogo ---------------------------------
// "Volver al inicio", el titulo y la barra de mandos: Filtrar por, el
// buscador, Ordenar por y Mostrar. El mismo HTML que arma view.js; no decide
// nada, solo pinta lo que le da el catalogo y le cuenta lo que se toca.
import { Fragment } from 'react';
import { CATEGORIAS } from './categorias.js';
import { Chevron } from '../comun/iconos.jsx';
import FondoDibujo from '../comun/FondoDibujo.jsx';

// La categoria va primero y en su propia fila. Se elige de un vistazo, con un
// boton por cada una, y no abriendo un desplegable: son cuatro y caben. Por
// dentro son radios, asi que Tab entra una vez y las flechas cambian.
const CHIPS = [['todas', 'Todas'], ...CATEGORIAS.map((c) => [c.id, c.nombre])];

function VistaCabeza({
  visible, titulo, tituloRef, subcategoria, onSub, busqueda, onBusqueda,
  orden, onOrden, soloDisponibles, onSolo, cuenta, vacio, onVolver,
}) {
  return (
    // En React la cabeza es la banda oscura de la tienda (la parte de horno
    // del 60-30-10, seccion 15 del plan), con sus panes dibujados detras.
    <div className="vista-cabeza es-catalogo banda-oscura con-fondo" hidden={!visible}>
      <FondoDibujo vista="tienda" />
      <button className="vista-volver" type="button" onClick={onVolver}>
        <Chevron izquierda />Volver al inicio
      </button>
      {/* Es el h1 de la vista: el de la portada queda apartado con ella. */}
      <h1 className="vista-titulo" tabIndex={-1} ref={tituloRef}>{titulo}</h1>
      {/* Ordenar y filtrar viven aqui y no en el mostrador: la fila de la
          portada es un escaparate, y ordenar seis no le hace falta a nadie. */}
      <div className="vista-barra">
        <div className="vista-mandos">
          <div className="vista-mando vista-chips solo-catalogo" role="radiogroup" aria-labelledby="vista-sub-rotulo">
            <span id="vista-sub-rotulo">Filtrar por</span>
            {CHIPS.map(([valor, texto]) => (
              <Fragment key={valor}>
                <input
                  className="chip-input"
                  type="radio"
                  name="vista-sub"
                  id={`vista-sub-${valor}`}
                  value={valor}
                  checked={subcategoria === valor}
                  onChange={() => onSub(valor)}
                />
                <label className="chip" htmlFor={`vista-sub-${valor}`}>{texto}</label>
              </Fragment>
            ))}
          </div>
          <label className="vista-mando vista-buscar solo-catalogo">
            <span className="sr-only">Buscar en el catálogo</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></svg>
            <input
              className="vista-busca"
              type="search"
              placeholder="Buscar un producto"
              autoComplete="off"
              value={busqueda}
              onChange={(e) => onBusqueda(e.target.value)}
            />
          </label>
          <label className="vista-mando">
            <span>Ordenar por</span>
            <select className="vista-orden" value={orden} onChange={(e) => onOrden(e.target.value)}>
              <option value="recomendados">Recomendados</option>
              <option value="precio-asc">Precio: de menor a mayor</option>
              <option value="precio-desc">Precio: de mayor a menor</option>
              <option value="nombre">Nombre: de la A a la Z</option>
            </select>
          </label>
          <label className="vista-mando">
            <span>Mostrar</span>
            <select className="vista-filtro" value={soloDisponibles ? 'disponibles' : 'todos'} onChange={(e) => onSolo(e.target.value === 'disponibles')}>
              <option value="todos">Todos</option>
              <option value="disponibles">Solo los disponibles</option>
            </select>
          </label>
        </div>
        {/* Lo que se ve de lo que hay. Mudo para el lector de pantalla, que ya
            tiene el aviso del catalogo y oirlo dos veces es peor que no oirlo. */}
        <p className="vista-cuenta" aria-hidden="true">{cuenta}</p>
      </div>
      {/* Una busqueda sin resultados no se queda en una pantalla vacia: se dice
          que no hay y por que. */}
      <p className="vista-vacio" role="status" hidden={!vacio}>{vacio}</p>
      {/* Los nombres de las fichas son h3: sin este h2 colgarian directamente
          del h1 y quien recorre los titulos se saltaria un nivel. */}
      <h2 className="sr-only">Productos</h2>
    </div>
  );
}

export default VistaCabeza;
