// Una linea de la canasta, con el HTML que arma pintar() en cart.js: foto, el
// nombre con la X que quita el producto entero, el precio por unidad y abajo
// la cantidad y lo que suma. Con una sola unidad el "menos" es un basurero y
// la X no sale: haria lo mismo y se llamaba igual. En el tope de cien el mas
// sigue enfocable, pero con aria-disabled, y al pulsarlo dice por que.
//
// Quitarla es directo: la barra de Deshacer da 12 s para recuperarla (antes
// la linea preguntaba "¿Lo quitamos?"; cambiado el 27 de octubre de 2026).
//
// Con Motion (seccion 15 del plan) la linea entra desde la derecha, de donde
// llega la gaveta, sale hacia la izquierda al quitarla, y las demas suben a
// ocupar su hueco en vez de saltar. Solo se anima la posicion (layout
// "position"): al preguntar "¿Lo quitamos?" la linea cambia de alto, y
// escalarla deformaria el texto. Con menos movimiento, nada de esto.
//
// Su "− n +" se mueve igual que el de las fichas (seccion 4 del plan, con
// comun/golpes.js): cada toque suelta un "+1" o "−1", el + que agrega hace
// destellar la pastilla y el numero entra deslizandose. La canasta de
// arriba no brinca: ya esta abierta. Es aspecto, no cambia lo que se pide.
import { useLayoutEffect, useRef } from 'react';
import { m, useReducedMotion } from 'motion/react';
import { dinero } from '../servicios/state.js';
import { CURVA, DURACION } from '../comun/movimiento.js';
import { destellar, soltarGolpe, useNumeroQueEntra } from '../comun/golpes.js';
import { useCanasta } from './CanastaProvider.jsx';
import { Basurero } from './iconosPedido.jsx';
import { enTope, consejoTope } from '../estado/pedido.js';

// Sin alt: el nombre va justo al lado, y leerlo dos veces no ayuda a nadie.
function Foto({ src }) {
  return (
    <span className="canasta-foto">
      {src ? <img src={src} alt="" width="64" height="64" loading="lazy" /> : null}
    </span>
  );
}

const ENTRA = { opacity: 0, x: 28 };
const ESTA = { opacity: 1, x: 0 };
// La que sale tarda la mitad que la que entra.
const SALE = { opacity: 0, x: -28, transition: { duration: DURACION.rapida, ease: CURVA.salida } };
const MUEVE = { duration: DURACION.base, ease: CURVA.salida };

function LineaCanasta({ id, linea, foto, onMenos, onMas, onQuitar }) {
  const { focoLinea, enfocarLinea } = useCanasta();
  const reducido = useReducedMotion();
  const movimiento = reducido
    ? {}
    : { layout: 'position', initial: ENTRA, animate: ESTA, exit: SALE, transition: MUEVE };
  const refs = {
    menos: useRef(null), quitar: useRef(null), mas: useRef(null),
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

  // El movimiento del control. El destello se pide en el clic y se enciende
  // despues de pintar la cantidad nueva, como en ControlCantidad.jsx.
  const pastillaRef = useRef(null);
  const golpesRef = useRef(null);
  const numeroRef = useRef(null);
  useNumeroQueEntra(numeroRef, cantidad);
  const pideDestello = useRef(false);
  useLayoutEffect(() => {
    if (!pideDestello.current) return;
    pideDestello.current = false;
    destellar(pastillaRef.current);
  }, [cantidad]);
  // En el tope el + no suma (solo avisa): ni "+1" ni destello. Con la ultima
  // unidad el − pregunta antes de quitar: todavia no se quito nada.
  const alMas = () => {
    if (!enTope(cantidad)) {
      soltarGolpe(golpesRef.current, '+1');
      pideDestello.current = true;
    }
    onMas(id, linea);
  };
  const alMenos = () => {
    if (cantidad > 1) soltarGolpe(golpesRef.current, '−1');
    onMenos(id, linea);
  };

  const ultima = cantidad === 1;
  const tope = enTope(cantidad);
  return (
    <m.li className="canasta-linea" data-id={id} {...movimiento}>
      <Foto src={foto} />
      <div className="canasta-info">
        <div className="canasta-fila">
          <h3>{nombre}</h3>
          {/* La X quita el producto entero, lleve las unidades que lleve. */}
          {ultima ? null : (
            <button ref={refs.quitar} className="canasta-quitar" type="button" aria-label={`Quitar ${nombre} de la canasta`} data-tip="Quitar de la canasta" onClick={() => onQuitar(id)}>×</button>
          )}
        </div>
        <p className="canasta-precio">{dinero(precio)} c/u</p>
        <div className="canasta-fila canasta-fila-baja">
          <div ref={pastillaRef} className="canasta-cantidad">
            <button ref={refs.menos} type="button" data-menos="" aria-label={ultima ? `Quitar ${nombre} de la canasta` : `Quitar uno de ${nombre}`} onClick={alMenos}>
              {ultima ? <Basurero /> : '−'}
            </button>
            <output ref={numeroRef}>{cantidad}</output>
            <button ref={refs.mas} type="button" data-mas="" aria-label={`Añadir uno de ${nombre}`} aria-disabled={tope || undefined} data-tip={tope ? consejoTope : undefined} onClick={alMas}>+</button>
            <span ref={golpesRef} className="card-golpes" aria-hidden="true"></span>
          </div>
          <span className="canasta-subtotal">{dinero(precio * cantidad)}</span>
        </div>
      </div>
    </m.li>
  );
}

export default LineaCanasta;
