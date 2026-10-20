// Un enlace a una seccion de la pagina (ver secciones.js). El href se queda
// como en el sitio actual (#historia, sin barra), para que se lea igual; el
// clic normal no lo sigue. El clic con la rueda o "copiar enlace" si se lo
// llevan, y esa direccion abierta en otra pestana baja a la seccion porque
// Portada.jsx la reconoce.
import { useIrASeccion } from './secciones.js';

function EnlaceSeccion({ a, onClick, children, ref, ...resto }) {
  const irASeccion = useIrASeccion();
  return (
    <a
      ref={ref}
      href={`#${a}`}
      onClick={(e) => {
        onClick?.(e);
        // Con Ctrl, Mayus o la rueda se pide otra pestana: eso se respeta.
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        irASeccion(a);
      }}
      {...resto}
    >
      {children}
    </a>
  );
}

export default EnlaceSeccion;
