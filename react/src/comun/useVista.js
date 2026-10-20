// Lo que hace cada vista al entrar (WCAG 2.4.3 y 2.4.2): el titulo de la
// pestana propio, arriba del todo y el foco en su h1, que el lector de
// pantalla lee y asi dice donde se ha llegado.
//
// Al abrir la pagina no se toca nada: el foco y el desplazamiento son los del
// navegador, como en cualquier pagina que se carga. Se sabe porque la primera
// direccion de React Router se llama 'default'; las direcciones viejas que se
// reescriben al abrir (vistas.js) llegan con alAbrir.
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function useVista(titulo, tituloRef) {
  const location = useLocation();
  const alAbrir = location.key === 'default' || Boolean(location.state?.alAbrir);

  // Solo al montarse, a proposito sin dependencias: lo que cambia dentro de
  // la vista (la categoria de la tienda) lo lleva la propia vista.
  useEffect(() => {
    if (alAbrir) return;
    // 'instant' y no 'auto': html lleva scroll-behavior: smooth, y la vista
    // nueva no tiene que llegar deslizandose desde donde estaba la anterior.
    window.scrollTo({ top: 0, behavior: 'instant' });
    tituloRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => { document.title = titulo; }, [titulo]);
}

export { useVista };
