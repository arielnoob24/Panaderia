// Lo que hace cada vista al entrar (WCAG 2.4.3 y 2.4.2): el titulo de la
// pestana propio, arriba del todo y el foco en su h1, que el lector de
// pantalla lee y asi dice donde se ha llegado.
//
// Al abrir la pagina no se toca nada: el foco y el desplazamiento son los del
// navegador, como en cualquier pagina que se carga. Lo dice la marca de
// apertura.js, que gasta la primera vista que se monta (tambien despues de un
// desvio, y no al volver con Atras a la direccion con que se abrio).
import { useEffect, useRef } from 'react';
import { esLaDeAbrir } from './apertura.js';

function useVista(titulo, tituloRef) {
  // Guardado en la vista: en desarrollo, StrictMode monta los efectos dos
  // veces, y la segunda ya no encontraria la marca.
  const deAbrir = useRef(null);

  // Solo al montarse, a proposito sin dependencias: lo que cambia dentro de
  // la vista (la categoria de la tienda) lo lleva la propia vista.
  useEffect(() => {
    if (deAbrir.current === null) deAbrir.current = esLaDeAbrir();
    if (deAbrir.current) return;
    // Tambien con Atras y Adelante: el navegador ya no devuelve el
    // desplazamiento de la entrada (comun/apertura.js), asi que el h1
    // enfocado queda a la vista. 'instant' y no 'auto': html lleva scroll-behavior: smooth, y la vista
    // nueva no tiene que llegar deslizandose desde donde estaba la anterior.
    window.scrollTo({ top: 0, behavior: 'instant' });
    tituloRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => { document.title = titulo; }, [titulo]);
}

export { useVista };
