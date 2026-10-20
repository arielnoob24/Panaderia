// Las animaciones de entrada: lo mismo que motionMap y revealObserver de
// js/comun/ui.js. La zona lleva su patron (reveal, reveal-x...) y data-motion
// desde el principio, y gana is-visible la primera vez que entra en pantalla.
// Con menos movimiento, o sin IntersectionObserver, se ve ya, sin esperar.
import { useEffect, useRef, useState } from 'react';
import { useMovimientoReducido } from './useMovimientoReducido.js';

const HAY_OBSERVADOR = 'IntersectionObserver' in window;

function useAparecer(patron) {
  const ref = useRef(null);
  const reducido = useMovimientoReducido();
  const [visto, setVisto] = useState(false);
  useEffect(() => {
    if (visto || reducido || !HAY_OBSERVADOR || !ref.current) return undefined;
    const vigia = new IntersectionObserver((entradas) => {
      if (!entradas.some((e) => e.isIntersecting)) return;
      setVisto(true);
      vigia.disconnect();
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    vigia.observe(ref.current);
    return () => vigia.disconnect();
  }, [visto, reducido]);
  // Una vez visto se queda visto, aunque luego se pida menos movimiento.
  const visible = visto || reducido || !HAY_OBSERVADOR;
  return { ref, className: visible ? `${patron} is-visible` : patron, 'data-motion': patron };
}

export { useAparecer };
