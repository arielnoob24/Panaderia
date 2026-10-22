// La ficha de un producto, con las mismas clases y el mismo HTML que arma
// fichaHtml() en view.js del sitio presentado y que completaba cart.js con el
// control de cantidad: styles.css se importa tal cual y tiene que reconocerla
// sin cambiar una regla.
//
// La ficha no decide si se ve ni en que puesto va: eso lo calcula el catalogo
// (filtro, orden, entrada escalonada) y se lo pasa. Ella pinta y avisa del
// tamano elegido, que sube al catalogo porque ordenar por precio usa el precio
// del tamano que se esta viendo, como en el sitio presentado.
import { Fragment, memo, useRef } from 'react';
import { dinero, idDe } from '../servicios/state.js';
import { fotoDe, ANCHOS } from '../servicios/catalogo.js';
import { useCargaImagen, clases } from '../comun/useCargaImagen.js';
import { nombreCategoria } from './categorias.js';
import ControlCantidad from '../pedido/ControlCantidad.jsx';

// Cuanto mide la foto en cada vista, igual que SIZES_CUADRICULA y SIZES_FILA
// de view.js: sin esto el telefono bajaria la de 840 donde basta la de 420.
const SIZES = {
  cuadricula: '(max-width: 680px) calc(50vw - 23px), (max-width: 900px) calc(50vw - 40px), 280px',
  fila: '(max-width: 680px) calc(50vw - 23px), 272px',
};

// La etiqueta de agotado no viene en los datos: sale de que no haya existencia.
function Etiqueta({ producto }) {
  if (!producto.disponible) return <span className="product-tag agotado">Agotado</span>;
  if (!producto.etiqueta) return null;
  return <span className={`product-tag ${producto.etiqueta.color}`}>{producto.etiqueta.texto}</span>;
}

// Lo que viene en varios tamanos lleva un grupo de radios. El identificador
// sale del nombre, que es lo unico que distingue un producto de otro.
// Agotado es agotado en todos sus tamanos: se pueden ver, pero no elegir.
function Tamanos({ producto, elegido, onElegir }) {
  const id = idDe(producto.nombre);
  return (
    <div className="card-tamanos" role="group" aria-label={`Tamaño de ${producto.nombre}`}>
      {producto.tamanos.map((t, i) => (
        <Fragment key={t.valor}>
          <input
            className="tamano-input"
            type="radio"
            name={`tam-${id}`}
            id={`tam-${id}-${i}`}
            value={t.valor}
            data-precio={t.precio.toFixed(2)}
            checked={elegido === i}
            disabled={!producto.disponible}
            onChange={() => onElegir(producto, i)}
          />
          <label className="tamano" htmlFor={`tam-${id}-${i}`}>{t.valor}</label>
        </Fragment>
      ))}
    </div>
  );
}

// Lo agotado no lleva boton de pedir: lleva dicho que vuelve manana.
// Lo disponible lleva el control de cantidad de la canasta (pedido/), el mismo
// que pone cart.js: cerrado, solo el +; con algo pedido, quitar, cuenta y sumar.
function Pedir({ producto, nombre, precio, imagenRef }) {
  if (!producto.disponible) return <span className="card-agotado">Vuelve mañana</span>;
  return <ControlCantidad nombre={nombre} precio={precio} imagenRef={imagenRef} />;
}

function FichaProducto({ producto, vista, visible, orden, retraso, entrando, elegido = 0, onElegir }) {
  const srcSet = ANCHOS.map((w) => `${fotoDe(producto, w)} ${w}w`).join(', ');
  const categoria = nombreCategoria(producto.categoria);
  const tamano = producto.tamanos[elegido];
  // Con tamanos, el nombre y el precio son los del elegido, como los arma cart.js.
  const nombre = tamano ? `${producto.nombre} ${tamano.valor}` : producto.nombre;
  const precio = tamano ? tamano.precio : producto.precio;
  const carga = useCargaImagen();
  // La foto que vuela a la canasta al agregar sale de aqui.
  const imagenRef = useRef(null);
  return (
    <article
      className={entrando ? 'product-card catalog-enter' : 'product-card'}
      hidden={!visible}
      style={{ order: orden, '--catalog-delay': retraso === undefined ? undefined : `${retraso}ms` }}
      data-available={producto.disponible ? undefined : 'false'}
      data-destacado={producto.destacado ? 'true' : undefined}
      data-category={producto.categoria}
    >
      <div className={clases('product-image', carga.hueco)}>
        {/* El src es el de reserva para quien no entienda srcset: el grande. */}
        <img
          ref={imagenRef}
          src={fotoDe(producto, 840)}
          srcSet={srcSet}
          sizes={SIZES[vista]}
          alt={producto.alt}
          loading="lazy"
          width="840"
          height="630"
          {...carga.imagen}
        />
        <Etiqueta producto={producto} />
      </div>
      <div className="product-info">
        {/* Sin nombre conocido no se pone rotulo: mejor nada que 'bebidas-frias'. */}
        {categoria && <span className="product-categoria">{categoria}</span>}
        <h3>{producto.nombre}</h3>
        {producto.tamanos.length > 0 && <Tamanos producto={producto} elegido={elegido} onElegir={onElegir} />}
        <div className="product-bottom">
          <strong>{dinero(precio)}</strong>
          {/* Los puntos de la pizarra, del precio al control (seccion 4). */}
          <span className="product-puntos" aria-hidden="true"></span>
          <Pedir producto={producto} nombre={nombre} precio={precio} imagenRef={imagenRef} />
        </div>
      </div>
    </article>
  );
}

// Al escribir en el buscador cambian unas pocas fichas, no las diecisiete.
export default memo(FichaProducto);
