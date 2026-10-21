// ---- El cambio de paso dentro de una vista de la cuenta ------------------
// Recuperar la contrasena tiene tres pasos en la misma vista (correo, codigo,
// clave). Entre ellos, el mismo movimiento que de crear a verificar (seccion
// 15 del plan, "Movimiento de la cuenta", punto 2): la hoja de antes sale
// hacia la izquierda y la nueva entra por la derecha, para que se lea como
// el paso siguiente. Al volver a un paso de antes ("Cambiar el correo"), la
// nueva entra por la izquierda y la vieja se va en el acto. Con menos
// movimiento no se mueve nada.
//
// La hoja que sale ya no es de React: React la quita en el acto, como
// cualquier paso que deja de pintarse, y lo que se ve salir es su nodo, que
// se vuelve a poner un momento encima (is-saliendo), inert y detras en el
// documento. Asi no sigue viva leyendo la sesion (el paso del codigo, con la
// contrasena ya cambiada, no tendria codigo que ensenar), ni el foco, ni el
// lector, ni lo que busque por clase entran en lo que ya se fue. El foco lo
// pone el paso nuevo al montarse (en su primer campo); aqui no se toca.
import { useLayoutEffect, useRef, useState } from 'react';
import { m, useReducedMotion } from 'motion/react';

const QUIETA = { opacity: 1, x: 0 };
const ENTRA = { duration: 0.32, ease: [0.16, 1, 0.3, 1] };
const DE = { delante: { opacity: 0, x: 56 }, atras: { opacity: 0, x: -56 } };
// La salida, con la animacion del navegador: el nodo ya no es de Motion.
const SALE = [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(-56px)' }];
const SALE_COMO = { duration: 220, easing: 'cubic-bezier(.4, 0, 1, 1)', fill: 'forwards' };

// paso: el que se ensena; orden: todos, del primero al ultimo.
function PasoQueCambia({ paso, orden, children }) {
  const reducido = useReducedMotion();
  const cajaRef = useRef(null);
  const hojaRef = useRef(null);

  // De que paso se viene. Se ajusta mientras se pinta, para que la hoja
  // nueva ya nazca sabiendo por donde entrar.
  const [cambio, setCambio] = useState({ ahora: paso, hacia: null });
  if (cambio.ahora !== paso) {
    const atras = orden.indexOf(paso) < orden.indexOf(cambio.ahora);
    setCambio({ ahora: paso, hacia: atras ? 'atras' : 'delante' });
  }

  // La hoja pintada en el ultimo cambio, con su paso. Se apunta despues de
  // pintar (no se lee el ref mientras se pinta): en el pintado en que cambia
  // el paso, lo apuntado sigue siendo la hoja vieja, que React ya quito. Se
  // vuelve a poner detras de la nueva y se va. Sin limpieza: el nodo se quita
  // solo al acabar, y si la vista se va antes, se va con su caja.
  const pintada = useRef(null);
  useLayoutEffect(() => {
    const antes = pintada.current;
    pintada.current = { paso, nodo: hojaRef.current };
    const caja = cajaRef.current;
    const sale = antes?.nodo;
    if (!antes || antes.paso === paso || cambio.hacia !== 'delante' || reducido) return;
    if (!sale || !caja || sale.isConnected || typeof sale.animate !== 'function') return;
    sale.classList.add('is-saliendo');
    sale.inert = true;
    sale.setAttribute('aria-hidden', 'true');
    // Sin ids repetidos mientras dura: getElementById tiene que dar la nueva.
    sale.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
    caja.append(sale);
    sale.animate(SALE, SALE_COMO).finished.then(() => sale.remove(), () => sale.remove());
  }, [paso]);

  // Al llegar a la vista no se anima: ya entra la vista entera.
  const entrada = !cambio.hacia || reducido ? false : DE[cambio.hacia];
  return (
    <div ref={cajaRef} className="pasos-cuenta">
      <m.div ref={hojaRef} key={paso} className="paso-marco" initial={entrada} animate={QUIETA} transition={ENTRA}>
        {children}
      </m.div>
    </div>
  );
}

export default PasoQueCambia;
