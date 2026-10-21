// ---- "Los mas pedidos": el carrusel de #/ --------------------------------
// Scroll-snap del navegador: se arrastra con el dedo, la rueda o el teclado,
// y cada ficha se queda bien puesta al soltar. Aqui solo van las flechas
// Anterior y Siguiente (una ficha por salto, apagadas en las puntas), la barra
// de avance del telefono y su alto. No avanza solo (seccion 15 del plan):
// lo que se mueve sin que nadie lo pida es lo que mas molesta mientras se elige.
//
// Lo que cambia a cada pixel (la barra de avance, el alto de la fila en el
// telefono) se escribe directo en el DOM por ref: pasarlo por el estado seria
// repintar las fichas a cada paso del desplazamiento. Al estado solo van los
// si/no que cambian de tarde en tarde (hay flechas, se esta en una punta).
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { movimientoReducido } from '../comun/useMovimientoReducido.js';

// Una ficha por salto: el salto de casi una pantalla se pasaba de largo y
// habia que buscar donde se habia quedado uno.
const pasoFila = (grid) => {
  const ficha = grid.querySelector('.product-card:not([hidden])');
  const hueco = parseFloat(getComputedStyle(grid).columnGap) || 0;
  return ficha ? ficha.getBoundingClientRect().width + hueco : 280;
};
// Con 8 px de margen: el desplazamiento suave a veces se queda a uno o dos
// pixeles de la punta exacta.
const enElFinal = (grid) => grid.scrollLeft > grid.scrollWidth - grid.clientWidth - 8;

// Lo que mide la ficha sin estirar: el aire que el margen automatico mete
// encima del precio es justo lo que sobra.
const altoPropio = (ficha) => {
  const fondo = ficha.querySelector('.product-bottom');
  const antes = fondo?.previousElementSibling;
  if (!antes) return ficha.offsetHeight;
  const sobra = fondo.getBoundingClientRect().top - antes.getBoundingClientRect().bottom
    - (parseFloat(getComputedStyle(antes).marginBottom) || 0);
  return ficha.offsetHeight - Math.max(0, sobra);
};

function useFila({ gridRef, avanceRef }) {
  const [hayFlechas, setHayFlechas] = useState(false);
  const [alPrincipio, setAlPrincipio] = useState(true);
  const [alFinal, setAlFinal] = useState(false);

  // ---- Medir --------------------------------------------------------
  // Una fila de lado mide lo que su ficha mas alta, aunque este al otro
  // extremo: en el telefono, con dos a la vista, los panes quedaban estirados
  // a la altura del cheesecake. Ahi la fila mide lo que piden las que se ven.
  const midiendo = useRef(0);
  const medirFila = useCallback(() => {
    if (midiendo.current) return;
    midiendo.current = requestAnimationFrame(() => {
      midiendo.current = 0;
      const grid = gridRef.current;
      if (!grid) return;
      const fichas = [...grid.querySelectorAll('.product-card')].filter((p) => !p.hidden);
      if (!window.matchMedia('(max-width: 680px)').matches) {
        grid.style.height = '';
        fichas.forEach((p) => { p.style.minHeight = ''; });
        return;
      }
      const caja = grid.getBoundingClientRect();
      const vistas = fichas.filter((p) => {
        const r = p.getBoundingClientRect();
        return r.right > caja.left + 1 && r.left < caja.right - 1;
      });
      const alto = Math.ceil(Math.max(0, ...vistas.map(altoPropio)));
      if (!alto) return;
      fichas.forEach((p) => { p.style.minHeight = vistas.includes(p) ? `${alto}px` : ''; });
      const estilo = getComputedStyle(grid);
      grid.style.height = `${alto + parseFloat(estilo.paddingTop) + parseFloat(estilo.paddingBottom)}px`;
    });
  }, [gridRef]);

  // En cada punta se apaga su flecha: no hay nada mas alla, y una flecha que
  // no hace nada (o que salta al otro extremo) desorienta.
  const mirarPuntas = useCallback(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const sobra = grid.scrollWidth - grid.clientWidth;
    setHayFlechas(sobra >= 24);
    setAlPrincipio(grid.scrollLeft < 8);
    setAlFinal(enElFinal(grid));
    // El trozo lleno mide lo que se ve de la fila y se corre lo que se ha
    // avanzado. El translateX va en % de su propio ancho, de ahi /clientWidth.
    const avance = avanceRef.current;
    if (avance && grid.scrollWidth) {
      avance.style.width = `${(grid.clientWidth / grid.scrollWidth) * 100}%`;
      avance.style.transform = `translateX(${(grid.scrollLeft / grid.clientWidth) * 100}%)`;
    }
    medirFila();
  }, [gridRef, avanceRef, medirFila]);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return undefined;
    const telefono = window.matchMedia('(max-width: 680px)');
    grid.addEventListener('scroll', mirarPuntas, { passive: true });
    window.addEventListener('resize', mirarPuntas, { passive: true });
    telefono.addEventListener('change', medirFila);
    document.fonts?.ready.then(medirFila);
    // Al anadir, en el telefono estrecho la ficha puede crecer: hay que
    // volver a medir para no cortarle el pie.
    let vigia = null;
    if ('ResizeObserver' in window) {
      vigia = new ResizeObserver(medirFila);
      grid.querySelectorAll('.product-bottom').forEach((f) => vigia.observe(f));
    }
    return () => {
      grid.removeEventListener('scroll', mirarPuntas);
      window.removeEventListener('resize', mirarPuntas);
      telefono.removeEventListener('change', medirFila);
      vigia?.disconnect();
      cancelAnimationFrame(midiendo.current);
      midiendo.current = 0;
    };
  }, [gridRef, mirarPuntas, medirFila]);

  // Antes de pintar, para que las flechas no aparezcan un instante tarde.
  useLayoutEffect(() => { mirarPuntas(); }, [mirarPuntas]);

  const irFlecha = (ir) => {
    const grid = gridRef.current;
    if (!grid) return;
    grid.scrollBy({ left: ir * pasoFila(grid), behavior: movimientoReducido() ? 'instant' : 'smooth' });
  };

  return { hayFlechas, alPrincipio, alFinal, irFlecha };
}

export { useFila };
