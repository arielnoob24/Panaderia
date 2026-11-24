// El circulo de cada requisito de la contrasena (seccion 15 del plan,
// "Movimiento de la cuenta", punto 1): al cumplirse se llena con un ✓ que
// entra con un pequeno rebote, y se va encogiendo si deja de cumplirse. Asi
// se ve cual acaba de cambiar sin releer la lista. Es solo dibujo: lo que el
// lector oye (", cumplido" o ", falta") va en el texto del requisito.
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { CURVA, DURACION, RESORTE } from '../comun/movimiento.js';

const REBOTE = RESORTE.rebote;
const SALE = { scale: 0.4, opacity: 0, transition: { duration: DURACION.micro, ease: CURVA.salida } };

function MarcaRegla({ hecha }) {
  const reducido = useReducedMotion();
  return (
    <span className="cuenta-regla-marca" aria-hidden="true">
      <AnimatePresence initial={false}>
        {hecha ? (
          <m.span
            key="visto"
            className="cuenta-regla-visto"
            initial={reducido ? false : { scale: 0.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={reducido ? { opacity: 0, transition: { duration: 0 } } : SALE}
            transition={REBOTE}
          >
            ✓
          </m.span>
        ) : null}
      </AnimatePresence>
    </span>
  );
}

export default MarcaRegla;
