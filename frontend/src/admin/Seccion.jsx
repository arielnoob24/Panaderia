// Una seccion del panel: su titulo (h2) siempre, y debajo lo que llego de la
// API, o el "Cargando…" / el fallo. El titulo se puede enfocar (tabIndex -1):
// cuando algo desaparece de la lista (un pedido que se cierra) o se reintenta
// una carga, el foco va ahi y no se pierde en el body.
import { useRef } from 'react';
import Cargando from './Cargando.jsx';

function Seccion({ id, titulo, que, carga, tituloRef, children }) {
  const propio = useRef(null);
  const ref = tituloRef || propio;
  const reintentar = () => {
    carga.recargar();
    ref.current?.focus();
  };
  return (
    <section aria-labelledby={`${id}-titulo`}>
      <h2 ref={ref} id={`${id}-titulo`} className="admin-titulo" tabIndex={-1}>{titulo}</h2>
      {carga.fase === 'listo' ? children : <Cargando carga={carga} que={que} alReintentar={reintentar} />}
    </section>
  );
}

export default Seccion;
