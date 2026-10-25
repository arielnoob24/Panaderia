// ---- La cabeza de la vista de catalogo ---------------------------------
// Con el estilo de la portada (seccion 10 del plan, "La tienda con el estilo
// de la portada"), sobre la masa: "Volver al inicio" con la ola de "Cómo
// llegar", el rotulo con la espiga, el titulo y la frase de la vista,
// "Filtrar por" como la cinta de #/, y los mandos (buscador, Ordenar por y
// Mostrar) entre lineas dobles. No decide nada, solo pinta lo que le da el
// catalogo y le cuenta lo que se toca.
//
// La escena de entrada es CSS de montaje (vistas.css): las categorias son la
// misma vista y el catalogo no se vuelve a montar entre ellas (App.jsx), asi
// que al cambiar de categoria no se repite; solo cambian el titulo, la frase
// y las fichas.
import { Fragment } from 'react';
import { CATEGORIAS } from './categorias.js';
import { Chevron, IconoCategoria, IconoTrigo } from '../comun/iconos.jsx';
import FondoDibujo from '../comun/FondoDibujo.jsx';
import TextoOla from '../comun/TextoOla.jsx';

// La categoria se elige de un vistazo, con una etiqueta por cada una, y no
// abriendo un desplegable: son cuatro y caben. Por dentro son radios, asi que
// Tab entra una vez y las flechas cambian. "Todas" no lleva icono.
const OPCIONES = [['todas', 'Todas'], ...CATEGORIAS.map((c) => [c.id, c.nombre])];

function VistaCabeza({
  visible, titulo, frase, tituloRef, subcategoria, onSub, busqueda, onBusqueda,
  orden, onOrden, soloDisponibles, onSolo, cuenta, vacio, onVolver,
}) {
  return (
    <div className="vista-cabeza es-catalogo con-fondo" hidden={!visible}>
      <FondoDibujo vista="tienda" />
      <div className="tienda-texto sube-en-orden">
        {/* Un boton y no un enlace (vuelve con onVolver), con el aspecto y la
            ola de "Cómo llegar" (.enlace-llegar). */}
        <button className="vista-volver enlace-llegar" type="button" onClick={onVolver}>
          <Chevron izquierda />
          <TextoOla>Volver al inicio</TextoOla>
        </button>
        <p className="rotulo rotulo-espiga"><IconoTrigo />Nuestra vitrina</p>
        {/* Es el h1 de la vista: el de la portada queda apartado con ella. */}
        <h1 className="vista-titulo titular" tabIndex={-1} ref={tituloRef}>{titulo}</h1>
        <p className="frase tienda-frase">{frase}</p>
        {/* Como la cinta de #/: cada categoria con su icono y la ola de
            letras; la elegida en una pastilla horno. Las estrellas son
            adorno. El nombre de cada radio es el de su etiqueta (TextoOla
            deja el texto entero escondido a la vista). */}
        <div className="vista-chips solo-catalogo" role="radiogroup" aria-labelledby="vista-sub-rotulo">
          <span id="vista-sub-rotulo" className="rotulo">Filtrar por</span>
          {OPCIONES.map(([valor, texto], i) => (
            <Fragment key={valor}>
              {i > 0 && <span className="chip-estrella" aria-hidden="true">✦</span>}
              <input
                className="chip-input"
                type="radio"
                name="vista-sub"
                id={`vista-sub-${valor}`}
                value={valor}
                checked={subcategoria === valor}
                onChange={() => onSub(valor)}
              />
              <label className={`chip chip-${valor}`} htmlFor={`vista-sub-${valor}`}>
                {valor !== 'todas' && <IconoCategoria id={valor} />}
                <TextoOla>{texto}</TextoOla>
              </label>
            </Fragment>
          ))}
        </div>
      </div>
      {/* Ordenar y filtrar viven aqui y no en el mostrador: la fila de la
          portada es un escaparate, y ordenar seis no le hace falta a nadie.
          Entre las lineas dobles de la cabecera de periodico. */}
      <div className="vista-barra">
        <span className="linea-doble" aria-hidden="true"></span>
        <div className="vista-mandos">
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
        <span className="linea-doble" aria-hidden="true"></span>
      </div>
      {/* Lo que se ve de lo que hay. Mudo para el lector de pantalla, que ya
          tiene el aviso del catalogo y oirlo dos veces es peor que no oirlo. */}
      <p className="vista-cuenta rotulo" aria-hidden="true">{cuenta}</p>
      {/* Una busqueda sin resultados no se queda en una pantalla vacia: se dice
          que no hay y por que. Sin role="status": lo dice el aviso del
          catalogo, que ya lleva la cuenta, y dos avisos a la vez se pisaban. */}
      <p className="vista-vacio" hidden={!vacio}>{vacio}</p>
      {/* Los nombres de las fichas son h3: sin este h2 colgarian directamente
          del h1 y quien recorre los titulos se saltaria un nivel. */}
      <h2 className="sr-only">Productos</h2>
    </div>
  );
}

export default VistaCabeza;
