// ---- "Los mas pedidos": el carrusel de #/ --------------------------------
// Scroll-snap del navegador: se arrastra con el dedo, la rueda o el teclado,
// y cada ficha se queda bien puesta al soltar. Aqui solo van las flechas
// Anterior y Siguiente (una ficha por salto, apagadas en las puntas, con
// movimiento de escena), la barra de avance y el alto de la fila. No avanza solo (seccion 15 del plan):
// lo que se mueve sin que nadie lo pida es lo que mas molesta mientras se elige.
//
// Lo que cambia a cada pixel (la barra de avance, el alto de la fila) se escribe directo en el DOM por ref: pasarlo por el estado seria
// repintar las fichas a cada paso del desplazamiento. Al estado solo van los
// si/no que cambian de tarde en tarde (hay flechas, se esta en una punta).
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { movimientoReducido } from '../comun/useMovimientoReducido.js';
import { CURVA, DURACION, curvaFuncion, ms } from '../comun/movimiento.js';

// Una ficha por salto: el salto de casi una pantalla se pasaba de largo y
// habia que buscar donde se habia quedado uno. El destino es el sitio donde
// la ficha de al lado queda encajada (su borde en el scroll-padding), para
// que al soltar el encaje del navegador no la mueva otra vez.
const destinoFila = (grid, desde, ir) => {
  const caja = grid.getBoundingClientRect();
  const margen = parseFloat(getComputedStyle(grid).scrollPaddingLeft) || 0;
  const maximo = grid.scrollWidth - grid.clientWidth;
  const encajes = [...grid.querySelectorAll('.product-card:not([hidden])')]
    .map((f) => Math.min(maximo, Math.max(0, grid.scrollLeft + f.getBoundingClientRect().left - caja.left - margen)));
  const siguiente = ir > 0
    ? encajes.find((x) => x > desde + 2)
    : encajes.filter((x) => x < desde - 2).pop();
  return siguiente ?? (ir > 0 ? maximo : 0);
};
const suave = curvaFuncion(CURVA.suave);
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
  // extremo: los panes quedaban estirados a la altura de la Coca-Cola, con un
  // hueco entre el nombre y el precio. La fila mide lo que piden las que se
  // ven, en todos los anchos, y crece despacio si entra una mas alta.
  const midiendo = useRef(0);
  const medirFila = useCallback(() => {
    if (midiendo.current) return;
    midiendo.current = requestAnimationFrame(() => {
      midiendo.current = 0;
      const grid = gridRef.current;
      if (!grid) return;
      const fichas = [...grid.querySelectorAll('.product-card')].filter((p) => !p.hidden);
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
    // La ficha puede crecer (al anadir en el telefono estrecho, con el texto
    // espaciado de WCAG 1.4.12, al cargar la letra): hay que volver a medir
    // para no cortarle el pie. Se mira la ficha entera, no solo su pie.
    let vigia = null;
    if ('ResizeObserver' in window) {
      vigia = new ResizeObserver(medirFila);
      grid.querySelectorAll('.product-info').forEach((f) => vigia.observe(f));
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

  // ---- Las flechas ---------------------------------------------------
  // scrollBy({ behavior: 'smooth' }) no deja elegir cuanto dura (el navegador
  // le da unos 300 ms, que es respuesta y no escena), asi que el salto se
  // mueve a mano, cuadro a cuadro, con --dur-slow y --ease-soft. Mientras
  // dura se quita el encaje: con el encaje puesto el navegador corrige cada
  // cuadro hacia la ficha mas cercana y la fila tiembla. Si la persona toca,
  // arrastra o mueve la rueda a medio camino, se para ahi y manda ella.
  const salto = useRef(null);
  const pararSalto = useCallback(() => {
    if (!salto.current) return;
    cancelAnimationFrame(salto.current.cuadro);
    salto.current.grid.style.scrollSnapType = '';
    salto.current = null;
  }, []);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return undefined;
    const opciones = { passive: true };
    grid.addEventListener('pointerdown', pararSalto, opciones);
    grid.addEventListener('wheel', pararSalto, opciones);
    grid.addEventListener('touchstart', pararSalto, opciones);
    return () => {
      pararSalto();
      grid.removeEventListener('pointerdown', pararSalto, opciones);
      grid.removeEventListener('wheel', pararSalto, opciones);
      grid.removeEventListener('touchstart', pararSalto, opciones);
    };
  }, [gridRef, pararSalto]);

  const irFlecha = (ir) => {
    const grid = gridRef.current;
    if (!grid) return;
    // Pulsar otra vez a medio salto sigue desde donde iba a acabar el anterior.
    const hasta = destinoFila(grid, salto.current?.hasta ?? grid.scrollLeft, ir);
    pararSalto();
    if (movimientoReducido()) { grid.scrollTo({ left: hasta, behavior: 'instant' }); return; }
    const desde = grid.scrollLeft;
    const inicio = performance.now();
    const dura = ms(DURACION.lenta);
    grid.style.scrollSnapType = 'none';
    const cuadro = (ahora) => {
      const p = Math.min(1, (ahora - inicio) / dura);
      grid.scrollLeft = desde + (hasta - desde) * suave(p);
      if (p < 1) salto.current.cuadro = requestAnimationFrame(cuadro);
      else pararSalto();
    };
    salto.current = { grid, hasta, cuadro: requestAnimationFrame(cuadro) };
  };

  return { hayFlechas, alPrincipio, alFinal, irFlecha };
}

export { useFila };
