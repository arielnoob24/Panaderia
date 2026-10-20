// Una linea de la canasta, con el HTML que arma pintar() en cart.js: foto, el
// nombre con la X que quita el producto entero, el precio por unidad y abajo
// la cantidad y lo que suma. Con una sola unidad el "menos" es un basurero.
//
// Cuando se pide quitarla, la misma linea pregunta "¿Lo quitamos?" en el
// sitio del control: preguntar en otra ventana obligaria a mirar a otro lado.
// Escape contesta que no y se queda aqui (sin subir al panel, que lo
// entenderia como cerrar la canasta).
import { useLayoutEffect, useRef } from 'react';
import { dinero } from '@raiz/js/comun/state.js';
import { useCanasta } from './CanastaProvider.jsx';
import { Basurero } from './iconosPedido.jsx';

// Sin alt: el nombre va justo al lado, y leerlo dos veces no ayuda a nadie.
function Foto({ src }) {
  return (
    <span className="canasta-foto">
      {src ? <img src={src} alt="" width="64" height="64" loading="lazy" /> : null}
    </span>
  );
}

function LineaCanasta({ id, linea, foto, confirmando, onMenos, onMas, onQuitar, onSi, onNo }) {
  const { focoLinea, enfocarLinea } = useCanasta();
  const refs = {
    si: useRef(null), menos: useRef(null), quitar: useRef(null), mas: useRef(null),
  };
  // Si el foco tiene que venir a esta linea (se acaba de preguntar, de
  // cancelar o de deshacer), se le da en cuanto esta pintada, y se olvida el
  // encargo para que no se repita al volver a montarse.
  useLayoutEffect(() => {
    if (!focoLinea || focoLinea.id !== id) return;
    refs[focoLinea.que]?.current?.focus();
    enfocarLinea(null);
  });

  const { nombre, cantidad, precio } = linea;

  if (confirmando) {
    const alTeclear = (e) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      onNo(id);
    };
    return (
      <li className="canasta-linea is-confirmando" data-id={id} onKeyDown={alTeclear}>
        <Foto src={foto} />
        <div className="canasta-info">
          <h3>{nombre}</h3>
          <p className="canasta-confirma-dicho">
            {cantidad === 1 ? '¿Lo quitamos de la canasta?' : `¿Quitamos las ${cantidad} unidades?`}
          </p>
          <div className="canasta-confirma">
            <button ref={refs.si} className="canasta-confirma-si" type="button" aria-label={`Sí, quitar ${nombre} de la canasta`} onClick={() => onSi(id)}>Sí, quitar</button>
            <button className="canasta-confirma-no" type="button" aria-label={`Cancelar, dejar ${nombre} en la canasta`} onClick={() => onNo(id)}>Cancelar</button>
          </div>
        </div>
      </li>
    );
  }

  const ultima = cantidad === 1;
  return (
    <li className="canasta-linea" data-id={id}>
      <Foto src={foto} />
      <div className="canasta-info">
        <div className="canasta-fila">
          <h3>{nombre}</h3>
          {/* La X quita el producto entero, lleve las unidades que lleve. */}
          <button ref={refs.quitar} className="canasta-quitar" type="button" aria-label={`Quitar ${nombre} de la canasta`} data-tip="Quitar de la canasta" onClick={() => onQuitar(id, 'quitar')}>×</button>
        </div>
        <p className="canasta-precio">{dinero(precio)} c/u</p>
        <div className="canasta-fila canasta-fila-baja">
          <div className="canasta-cantidad">
            <button ref={refs.menos} type="button" data-menos="" aria-label={ultima ? `Quitar ${nombre} de la canasta` : `Quitar uno de ${nombre}`} onClick={() => onMenos(id, linea)}>
              {ultima ? <Basurero /> : '−'}
            </button>
            <output>{cantidad}</output>
            <button ref={refs.mas} type="button" data-mas="" aria-label={`Añadir uno de ${nombre}`} onClick={() => onMas(id, linea)}>+</button>
          </div>
          <span className="canasta-subtotal">{dinero(precio * cantidad)}</span>
        </div>
      </div>
    </li>
  );
}

export default LineaCanasta;
