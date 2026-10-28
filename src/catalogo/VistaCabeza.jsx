// ---- La cabeza de la vista de catalogo ---------------------------------
// Con el estilo de la portada (seccion 10 del plan, "La tienda con el estilo
// de la portada"), sobre la masa: el rotulo con la espiga, el titulo y la
// frase de la vista, "Filtrar por" como la cinta de #/, y los mandos
// (buscador, Ordenar por y la casilla de Mostrar) entre lineas dobles.
// Sin "Volver al inicio" (seccion 4 del plan): a la portada se vuelve con el
// logo o con Inicio. No decide nada, solo pinta lo que le da el
// catalogo y le cuenta lo que se toca.
//
// La escena de entrada es CSS de montaje (vistas.css): las categorias son la
// misma vista y el catalogo no se vuelve a montar entre ellas (App.jsx), asi
// que al cambiar de categoria no se repite; solo cambian el titulo, la frase
// y las fichas.
import { Fragment } from 'react';
import { LayoutGroup, m, useReducedMotion } from 'motion/react';
import { RESORTE } from '../comun/movimiento.js';
import { CATEGORIAS } from './categorias.js';
import { IconoCategoria, IconoTrigo } from '../comun/iconos.jsx';
import FondoDibujo from '../comun/FondoDibujo.jsx';
import TextoOla from '../comun/TextoOla.jsx';
import OrdenarPor from './OrdenarPor.jsx';

// La categoria se elige de un vistazo, con una etiqueta por cada una, y no
// abriendo un desplegable: son cuatro y caben. Por dentro son radios, asi que
// Tab entra una vez y las flechas cambian. "Todas" no lleva icono.
const OPCIONES = [['todas', 'Todas'], ...CATEGORIAS.map((c) => [c.id, c.nombre])];

// Los cuatro ordenes, con lo que dice el boton de "Ordenar por".
const ORDENES = [
  ['recomendados', 'Recomendados'],
  ['precio-asc', 'Precio: de menor a mayor', 'asc'],
  ['precio-desc', 'Precio: de mayor a menor', 'desc'],
  ['nombre', 'Nombre: de la A a la Z', 'asc'],
];

function VistaCabeza({
  visible, titulo, frase, tituloRef, subcategoria, onSub, busqueda, onBusqueda,
  orden, onOrden, soloDisponibles, onSolo, cuenta, vacio,
}) {
  const reducido = useReducedMotion();
  return (
    <div className="vista-cabeza es-catalogo con-fondo" hidden={!visible}>
      <FondoDibujo vista="tienda" />
      <div className="tienda-texto sube-en-orden">
        <p className="rotulo rotulo-espiga"><IconoTrigo />Nuestra vitrina</p>
        {/* Es el h1 de la vista: el de la portada queda apartado con ella. */}
        <h1 className="vista-titulo titular" tabIndex={-1} ref={tituloRef}>{titulo}</h1>
        <p className="frase tienda-frase">{frase}</p>
        {/* Como la cinta de #/: cada categoria con su icono y la ola de
            letras; la elegida en una pastilla horno. Sin adornos entre
            ellas. El nombre de cada radio es el de su etiqueta (TextoOla
            deja el texto entero escondido a la vista). */}
        <LayoutGroup id="filtro-categoria">
        <div className="vista-chips solo-catalogo" role="radiogroup" aria-labelledby="vista-sub-rotulo">
          <span id="vista-sub-rotulo" className="rotulo">Filtrar por</span>
          {OPCIONES.map(([valor, texto]) => (
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
              <label className={`chip chip-${valor}`} htmlFor={`vista-sub-${valor}`}>
                {valor !== 'todas' && <IconoCategoria id={valor} />}
                {/* La pastilla horno es una sola y viaja a la etiqueta elegida
                    (layoutId); con menos movimiento salta. Es adorno: el radio
                    sigue siendo quien dice cual esta elegida. */}
                {subcategoria === valor && (
                  <m.span
                    className="chip-pastilla"
                    layoutId="chip-pastilla"
                    style={{ borderRadius: 999 }}
                    transition={reducido ? { duration: 0 } : RESORTE.pastilla}
                    aria-hidden="true"
                  />
                )}
                <TextoOla>{texto}</TextoOla>
              </label>
            </Fragment>
          ))}
        </div>
        </LayoutGroup>
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
          <div className="vista-mando">
            <span id="vista-orden-rotulo">Ordenar por</span>
            <OrdenarPor opciones={ORDENES} valor={orden} onCambio={onOrden} rotuloId="vista-orden-rotulo" />
          </div>
          {/* "Mostrar solo disponibles" es un cuadrito con palomita (seccion 4
              del plan): un checkbox de verdad, con la caja y la palomita en
              CSS y SVG. */}
          <div className="vista-mando">
            <span id="vista-mostrar-rotulo">Mostrar</span>
            <label className="casilla">
              <input
                id="vista-mostrar-solo"
                className="casilla-input"
                type="checkbox"
                aria-labelledby="vista-mostrar-rotulo vista-mostrar-texto"
                checked={soloDisponibles}
                onChange={(e) => onSolo(e.target.checked)}
              />
              <span className="casilla-caja" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" focusable="false"><path d="M5 12.5l4.5 4.5L19 7.5" pathLength="1" /></svg>
              </span>
              <span id="vista-mostrar-texto">Solo disponibles</span>
            </label>
          </div>
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
