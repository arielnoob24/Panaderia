// ---- El cerco del foco de los paneles ----------------------------------
// Lo de atraparFoco() y apagarDetras() de ui.js del sitio presentado, como hooks. Lo usa
// la canasta. La cuenta no: en React no es un panel sino vistas (#/cuenta/*,
// fase 5), y su ficha de la cabecera es un desplegable que no atrapa el foco.
//
// Mientras un panel esta abierto:
//   - Tab y Mayus+Tab dan la vuelta dentro de el (y de sus anexos, como la
//     barra de deshacer, que vive fuera del panel pero tiene que alcanzarse).
//   - Escape lo cierra. Quien tenga su propio Escape dentro (una pregunta que
//     se contesta con "no") lo para con stopPropagation y aqui no llega.
//   - La pagina de detras queda 'inert': ni el tabulador ni el lector de
//     pantalla entran en ella.
import { useEffect, useLayoutEffect, useRef } from 'react';

// Lo que el tabulador puede alcanzar. Un elemento escondido no cuenta:
// offsetParent nulo es como se nota que no esta en pantalla.
const FOCOS = 'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
const focosDe = (caja) => [...caja.querySelectorAll(FOCOS)]
  .filter((el) => el.offsetParent !== null && !el.disabled && el.getAttribute('aria-disabled') !== 'true'
    && !el.closest('[inert]'));

function useAtraparFoco(activo, cajas, alEscape) {
  // Lo ultimo de cada cosa, sin volver a poner el escuchador en cada pintado.
  const ultimo = useRef({ cajas, alEscape });
  useLayoutEffect(() => { ultimo.current = { cajas, alEscape }; });

  useEffect(() => {
    if (!activo) return undefined;
    const alTeclear = (e) => {
      if (e.key === 'Escape') { ultimo.current.alEscape(); return; }
      if (e.key !== 'Tab') return;
      const cajasVivas = ultimo.current.cajas.map((r) => r.current).filter(Boolean);
      const focos = cajasVivas.flatMap(focosDe);
      if (!focos.length) return;
      const primero = focos[0];
      const final = focos[focos.length - 1];
      // Si el foco acabo fuera (en el body, porque se escondio el boton que lo
      // tenia), la siguiente tecla lo devuelve dentro.
      const dentro = cajasVivas.some((caja) => caja.contains(document.activeElement));
      if (!dentro) {
        e.preventDefault();
        (e.shiftKey ? final : primero).focus();
        return;
      }
      if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); final.focus(); }
      else if (!e.shiftKey && document.activeElement === final) { e.preventDefault(); primero.focus(); }
    };
    document.addEventListener('keydown', alTeclear);
    return () => document.removeEventListener('keydown', alTeclear);
  }, [activo]);
}

// La pagina de detras se apaga mientras haya algun panel abierto. Se lleva en
// un conjunto para que el ultimo en cerrarse sea el que la encienda. Se buscan
// por clase e id porque son las zonas de la pagina, que viven en otros
// componentes (Cabecera, App), como hace ui.js.
const panelesAbiertos = new Set();
const detras = () => [
  document.querySelector('.site-header'),
  document.getElementById('contenido'),
].filter(Boolean);

const apagarDetras = (panel, apagado) => {
  if (apagado) panelesAbiertos.add(panel); else panelesAbiertos.delete(panel);
  const hayPanel = panelesAbiertos.size > 0;
  detras().forEach((zona) => { zona.inert = hayPanel; });
};

export { useAtraparFoco, apagarDetras };
