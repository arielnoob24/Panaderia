// Un texto que aparece con un fundido suave en vez de saltar (seccion 15 del
// plan, "Movimiento de la cuenta", punto 6): los errores bajo cada campo y
// los avisos del pie. Sin sacudidas, que marean (WCAG 2.3.3), y quieto del
// todo con menos movimiento.
//
// Va dentro del parrafo que ya tenia el texto, y no en su lugar: ese parrafo
// sigue en el DOM con su id (aria-describedby apunta a el) y, si es un
// role="alert", el lector lo canta porque cambia lo de dentro. La clave es el
// texto: un error distinto vuelve a fundirse; el mismo no parpadea.
import { m, useReducedMotion } from 'motion/react';

const APARECE = { opacity: 0, y: -3 };
const QUIETO = { opacity: 1, y: 0 };
const SUAVE = { duration: 0.22, ease: [0.2, 0, 0, 1] };

function TextoSuave({ texto }) {
  const reducido = useReducedMotion();
  if (!texto) return null;
  return (
    <m.span key={texto} className="texto-suave" initial={reducido ? false : APARECE} animate={QUIETO} transition={SUAVE}>
      {texto}
    </m.span>
  );
}

export default TextoSuave;
