// "Saltar al contenido" (WCAG 2.4.1). El clic no sigue el href="#contenido":
// el foco pasa a <main> y se baja hasta el, sin tocar la direccion. Con Ctrl,
// Mayus o la rueda se respeta lo que pide el navegador.
import { movimientoReducido } from './useMovimientoReducido.js';

function SaltoContenido() {
  const alPulsar = (e) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    const main = document.getElementById('contenido');
    if (!main) return;
    main.scrollIntoView({ behavior: movimientoReducido() ? 'instant' : 'smooth', block: 'start' });
    main.focus({ preventScroll: true });
  };
  return <a className="skip-link" href="#contenido" onClick={alPulsar}>Saltar al contenido</a>;
}

export default SaltoContenido;
