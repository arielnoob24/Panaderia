// La ficha de un producto, con las mismas clases y el mismo HTML que arma
// fichaHtml() en js/catalogo/view.js: styles.css se importa tal cual y tiene
// que reconocerla sin cambiar una regla.
// Fase 1: sin tamanos ni control de cantidad, que llegan con el catalogo y la
// canasta (fases 2 y 3).
import { useState } from 'react';
import { dinero } from '@raiz/js/comun/state.js';
import { fotoDe, ANCHOS } from '../servicios/catalogo.js';
import { nombreCategoria } from './categorias.js';

// Cuanto mide la foto en cada vista, igual que SIZES_CUADRICULA y SIZES_FILA
// de view.js: sin esto el telefono bajaria la de 840 donde basta la de 420.
const SIZES = {
  cuadricula: '(max-width: 680px) calc(50vw - 23px), (max-width: 900px) calc(50vw - 40px), 280px',
  fila: '(max-width: 680px) calc(50vw - 23px), 272px',
};

// La clase del hueco de la foto segun como va la carga.
const ESTADO_HUECO = { cargando: 'is-loading', fallo: 'image-unavailable' };

// La etiqueta de agotado no viene en los datos: sale de que no haya existencia.
function Etiqueta({ producto }) {
  if (!producto.disponible) return <span className="product-tag agotado">Agotado</span>;
  if (!producto.etiqueta) return null;
  return <span className={`product-tag ${producto.etiqueta.color}`}>{producto.etiqueta.texto}</span>;
}

function FichaProducto({ producto, vista = 'cuadricula' }) {
  const srcSet = ANCHOS.map((w) => `${fotoDe(producto, w)} ${w}w`).join(', ');
  const categoria = nombreCategoria(producto.categoria);
  // Lo mismo que vigilarImagenes() de js/comun/ui.js: styles.css deja la foto
  // transparente hasta que llega (is-loaded) y late el hueco mientras tanto
  // (is-loading). Si no llega, se quita en vez de dejar el icono roto.
  const [foto, setFoto] = useState('cargando');
  return (
    <article
      className="product-card"
      data-available={producto.disponible ? undefined : 'false'}
      data-destacado={producto.destacado ? 'true' : undefined}
      data-category={producto.categoria}
    >
      <div className={['product-image', ESTADO_HUECO[foto]].filter(Boolean).join(' ')}>
        {/* El src es el de reserva para quien no entienda srcset: el grande. */}
        <img
          src={fotoDe(producto, 840)}
          srcSet={srcSet}
          sizes={SIZES[vista]}
          alt={producto.alt}
          loading="lazy"
          width="840"
          height="630"
          className={foto === 'lista' ? 'is-loaded' : undefined}
          hidden={foto === 'fallo'}
          onLoad={() => setFoto('lista')}
          onError={() => setFoto('fallo')}
        />
        <Etiqueta producto={producto} />
      </div>
      <div className="product-info">
        {/* Sin nombre conocido no se pone rotulo: mejor nada que 'bebidas-frias'. */}
        {categoria && <span className="product-categoria">{categoria}</span>}
        <h3>{producto.nombre}</h3>
        <div className="product-bottom">
          <strong>{dinero(producto.precio)}</strong>
          {!producto.disponible && <span className="card-agotado">Vuelve mañana</span>}
        </div>
      </div>
    </article>
  );
}

export default FichaProducto;
