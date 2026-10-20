// ---- Los enlaces de seccion -------------------------------------------
// "Saltar al contenido", el logo (#inicio), Nosotros (#historia), Contactanos
// y "Como llegar" (#visitanos) no son rutas: con HashRouter, un href="#historia"
// de verdad cambiaria la ruta y sacaria de la vista. Asi que se desplazan
// hasta la seccion y le dan el foco, sin tocar la direccion (seccion 15 del
// plan). Para quien usa la pagina es lo mismo que el salto de ancla de antes,
// y quien usa lector de pantalla o teclado sigue desde la seccion.
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { movimientoReducido } from './useMovimientoReducido.js';

// Se buscan por id y no por ref: los id son el contrato de la pagina (los usan
// los enlaces y scroll-margin-top de styles.css), y las secciones viven en
// componentes distintos de los enlaces que llevan a ellas.
const llevarA = (seccion) => {
  // scroll-margin-top de styles.css deja la seccion por debajo de la cabecera.
  seccion.scrollIntoView({ behavior: movimientoReducido() ? 'auto' : 'smooth', block: 'start' });
  seccion.focus({ preventScroll: true });
};

// Devuelve true si la seccion esta en pantalla y se fue hasta ella.
const irASeccionSiSeVe = (id) => {
  const seccion = document.getElementById(id);
  // getClientRects vacio: la seccion existe pero no se pinta (la portada esta
  // apartada por la vista de catalogo, body.is-vista).
  if (!seccion || !seccion.getClientRects().length) return false;
  llevarA(seccion);
  return true;
};

// Desde la vista de catalogo, la historia y la portada no se ven: entonces se
// vuelve a la portada (como pasaba antes, al cambiar el hash) y es ella la que
// baja a la seccion cuando ya esta pintada.
function useIrASeccion() {
  const navegar = useNavigate();
  return useCallback((id) => {
    if (irASeccionSiSeVe(id)) return;
    navegar('/', { state: { entrar: true, seccion: id } });
  }, [navegar]);
}

export { useIrASeccion, irASeccionSiSeVe };
