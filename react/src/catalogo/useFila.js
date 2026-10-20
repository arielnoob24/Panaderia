// ---- "Los mas pedidos": la fila que se mueve ---------------------------
// Lo mismo que hace montarCatalogo() en js/catalogo/view.js con la fila de la
// portada: flechas, barra de avance, boton de pausa, el avance solo cada 4,2 s
// y, en el telefono, que la fila mida lo que piden las dos fichas que se ven.
//
// Lo que cambia a cada pixel (la barra de avance, el alto de la fila en el
// telefono) se escribe directo en el DOM por ref: pasarlo por el estado seria
// repintar el catalogo entero a cada paso del desplazamiento. Al estado solo
// van los si/no que cambian de tarde en tarde (hay flechas, se esta al final).
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { movimientoReducido } from '../comun/useMovimientoReducido.js';

const CADA = 4200;
// Tras tocarla a mano se le da un respiro largo: seguir empujando mientras
// alguien decide que lleva es la forma mas rapida de molestar.
const RESPIRO = CADA * 2;

// Una ficha por salto: el salto de casi una pantalla se pasaba de largo y
// habia que buscar donde se habia quedado uno. Lo usan la flecha y el reloj.
const pasoFila = (grid) => {
  const ficha = grid.querySelector('.product-card:not([hidden])');
  const hueco = parseFloat(getComputedStyle(grid).columnGap) || 0;
  return ficha ? ficha.getBoundingClientRect().width + hueco : 280;
};
// Con 8 px de margen: el desplazamiento suave a veces se queda a uno o dos
// pixeles de la punta exacta.
const enElFinal = (grid) => grid.scrollLeft > grid.scrollWidth - grid.clientWidth - 8;
const hayFila = (grid) => grid.classList.contains('is-fila');

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

// 'cambio' es cualquier valor que cambie cuando cambian las fichas que se ven
// o la vista: al cambiar, se vuelven a mirar las puntas y a medir.
function useFila({ gridRef, zonaRef, avanceRef, cambio, avisar }) {
  const [hayFlechas, setHayFlechas] = useState(false);
  const [alPrincipio, setAlPrincipio] = useState(true);
  const [alFinal, setAlFinal] = useState(false);
  // La fila se adelanta sola, y eso necesita un boton que la pare: no vale
  // que se detenga al pasar el raton o al entrar el foco, porque eso es un
  // efecto secundario de hacer otra cosa. Quien la para, la para hasta que
  // diga lo contrario.
  const [parada, setParada] = useState(false);

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
      if (!window.matchMedia('(max-width: 680px)').matches || !hayFila(grid)) {
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

  // Al principio se apaga la flecha de atras. La de adelante no se apaga: en
  // la ultima ficha cambia de nombre y lleva de vuelta a la primera.
  const mirarPuntas = useCallback(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const sobra = grid.scrollWidth - grid.clientWidth;
    setHayFlechas(hayFila(grid) && sobra >= 24);
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

  // Cada vez que cambian las fichas o la vista, las puntas y el alto son otros.
  // Antes de pintar, para que las flechas no aparezcan un instante tarde.
  useLayoutEffect(() => { mirarPuntas(); }, [cambio, mirarPuntas]);

  // ---- Avanzar sola -------------------------------------------------
  // Que senales de "hay alguien eligiendo" estan en pie: el raton encima, un
  // dedo, o el foco en alguna ficha. Antes era un solo si/no para las tres, y
  // la que se iba borraba a las otras.
  const cerca = useRef(new Set());
  // Y la ultima vez que se toco algo dentro. Hasta que pase un buen rato sin
  // tocarla, quieta.
  const tocada = useRef(0);
  const paradaRef = useRef(parada);
  useEffect(() => { paradaRef.current = parada; }, [parada]);

  useEffect(() => {
    const zona = zonaRef.current;
    if (!zona) return undefined;
    const quitas = [];
    const escuchar = (ev, fn) => {
      zona.addEventListener(ev, fn, { passive: true });
      quitas.push(() => zona.removeEventListener(ev, fn));
    };
    // Al irse la senal tampoco arranca en seguida: se cuenta como un toque mas.
    const vigilar = (entra, sale) => {
      escuchar(entra, () => { cerca.current.add(entra); });
      escuchar(sale, () => { cerca.current.delete(entra); tocada.current = Date.now(); });
    };
    vigilar('mouseenter', 'mouseleave');
    vigilar('focusin', 'focusout');
    vigilar('touchstart', 'touchend');
    // touchcancel tambien suelta el dedo: el navegador lo manda en vez de
    // touchend cuando el toque se convierte en desplazar la fila.
    escuchar('touchcancel', () => { cerca.current.delete('touchstart'); tocada.current = Date.now(); });
    // Las flechas y todo lo de las fichas cuentan como tocarla; el boton de
    // pausa queda fuera, en la cabecera de la fila, porque pulsarlo ya dice
    // por si solo lo que se quiere.
    ['pointerdown', 'click', 'input', 'change', 'keydown'].forEach((ev) => {
      escuchar(ev, () => { tocada.current = Date.now(); });
    });
    return () => quitas.forEach((q) => q());
  }, [zonaRef]);

  useEffect(() => {
    if (parada) return undefined;
    const puedeAndar = (grid) => hayFila(grid)
      && !movimientoReducido()
      && !document.hidden
      && !paradaRef.current
      && grid.scrollWidth - grid.clientWidth > 24;
    const avanzar = () => {
      const grid = gridRef.current;
      if (!grid || cerca.current.size || Date.now() - tocada.current < RESPIRO || !puedeAndar(grid)) return;
      // Al llegar al final vuelve al principio, para que no se quede parada
      // en seco dando la impresion de que se rompio.
      if (enElFinal(grid)) {
        grid.scrollTo({ left: 0, behavior: 'smooth' });
        return;
      }
      grid.scrollBy({ left: pasoFila(grid), behavior: 'smooth' });
    };
    let reloj = null;
    const arrancar = () => { if (!reloj) reloj = setInterval(avanzar, CADA); };
    const parar = () => { clearInterval(reloj); reloj = null; };
    const alCambiarVisibilidad = () => { if (document.hidden) parar(); else arrancar(); };
    document.addEventListener('visibilitychange', alCambiarVisibilidad);
    arrancar();
    return () => {
      parar();
      document.removeEventListener('visibilitychange', alCambiarVisibilidad);
    };
  }, [parada, gridRef]);

  // ---- Lo que pulsa la persona ---------------------------------------
  const irFlecha = (ir) => {
    const grid = gridRef.current;
    if (!grid) return;
    const behavior = movimientoReducido() ? 'auto' : 'smooth';
    // La de adelante, en la ultima ficha, vuelve a la primera: lo mismo que
    // hace la fila cuando avanza sola.
    if (ir === 1 && enElFinal(grid)) {
      grid.scrollTo({ left: 0, behavior });
      return;
    }
    grid.scrollBy({ left: ir * pasoFila(grid), behavior });
  };

  const alternarPausa = () => {
    const ahora = !parada;
    setParada(ahora);
    avisar(ahora
      ? 'Los más pedidos, detenidos. No se moverán hasta que lo reanudes.'
      : 'Los más pedidos, en marcha otra vez.');
  };

  return { hayFlechas, alPrincipio, alFinal, parada, irFlecha, alternarPausa };
}

export { useFila };
