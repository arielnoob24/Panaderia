// El boton de la canasta, con su contador. Es el mismo elemento que cart.js
// hace con el flotante de WhatsApp: las clases floating-whatsapp e is-canasta
// son las que styles.css usa para dejarlo en la cabecera en la computadora y
// flotando abajo en el telefono. Va dentro de .nav-acciones, delante del menu.
//
// Es un <a> con role="button", como en el sitio presentado, y no un <button>: la
// hoja de estilos esta hecha para el enlace (un boton traeria su borde).
//
// El numero salta al cambiar (Motion, seccion 15 del plan): el viejo se va y
// el nuevo entra por abajo si se anadio, por arriba si se quito. Asi se ve
// que cambio y hacia donde, sin leerlo. El saltito de la canasta al llegar la
// foto sigue siendo el de styles.css (CanastaProvider).
import { useState } from 'react';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { usePedido } from '../estado/PedidoProvider.jsx';
import { productos } from '../estado/pedido.js';
import { useCanasta } from './CanastaProvider.jsx';
import { IconoCestaAsa } from '../comun/iconos.jsx';
import { PULSAR, RESORTE } from '../comun/movimiento.js';

// 'sube' es true si el numero crecio: el nuevo llega desde abajo.
const NUMERO = {
  entra: (sube) => ({ y: sube ? 12 : -12, opacity: 0 }),
  quieto: { y: 0, opacity: 1 },
  sale: (sube) => ({ y: sube ? -12 : 12, opacity: 0 }),
};
const SALTO = RESORTE.salto;

function BotonCanasta() {
  const { unidades: n } = usePedido();
  const reducido = useReducedMotion();
  // Hacia donde fue el ultimo cambio. Se ajusta mientras se pinta, no en un
  // efecto, para que el numero nuevo ya salga con la direccion buena.
  const [antes, setAntes] = useState(n);
  const [sube, setSube] = useState(true);
  if (antes !== n) {
    setSube(n > antes);
    setAntes(n);
  }
  const { abrir, botonRef } = useCanasta();
  const alTeclear = (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    abrir();
  };
  return (
    // Al pulsar se hunde un poco: responde al dedo antes de que se abra el panel.
    <m.a
      ref={botonRef}
      whileTap={reducido ? undefined : PULSAR}
      className="floating-whatsapp is-canasta"
      role="button"
      tabIndex={0}
      data-tip="Tu canasta"
      aria-label={n ? `Ver la canasta, ${productos(n)}` : 'Ver la canasta, vacía'}
      onClick={abrir}
      onKeyDown={alTeclear}
    >
      <IconoCestaAsa />
      <span className="canasta-cuenta" hidden={n === 0}>
        <AnimatePresence initial={false} mode="popLayout" custom={sube}>
          <m.span
            key={n}
            className="canasta-cuenta-numero"
            custom={sube}
            variants={NUMERO}
            initial="entra"
            animate="quieto"
            exit="sale"
            transition={reducido ? { duration: 0 } : SALTO}
          >
            {n}
          </m.span>
        </AnimatePresence>
      </span>
    </m.a>
  );
}

export default BotonCanasta;
