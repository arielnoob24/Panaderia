// ---- La pastilla que se desliza por el menu de arriba ---------------------
// N3 de la muestra editorial (seccion 10 del plan, "Estilo"): con el raton o
// el lapiz, una pastilla ambar viaja hasta la opcion que hay debajo, que pasa
// a horno, y al salir del menu se desvanece. "Tienda" (la palabra y su
// flecha, .nav-grupo) cuenta como una sola opcion, y su desplegable tambien:
// bajar a las categorias deja la pastilla en Tienda.
//
// Se mira el pointerType de cada evento y no la media query (hover: hover),
// que en el portatil tactil del usuario da falso. Con el dedo no aparece, y
// el foco del teclado no la mueve: el anillo ya dice donde se esta. El CSS
// ademas solo la pinta bajo html.con-puntero y con la barra de escritorio.
//
// La pastilla es un nodo que React no repinta: se mueve a mano, con estilo en
// linea, porque sigue al puntero y no al estado de la pagina.
import { useEffect, useRef } from 'react';
import { movimientoReducido } from './useMovimientoReducido.js';

const esRaton = (e) => e.pointerType === 'mouse' || e.pointerType === 'pen';
// En el telefono el menu es otro (el de hamburguesa) y no lleva pastilla.
const hayBarra = () => window.innerWidth > 680;
const OPCION = '.main-nav > a, .main-nav > .nav-grupo';

function usePastillaMenu(navRef) {
  const pastillaRef = useRef(null);

  useEffect(() => {
    const nav = navRef.current;
    const pastilla = pastillaRef.current;
    if (!nav || !pastilla) return undefined;
    let bajo = null;

    // Con un atributo y no una clase: React reescribe className al abrir el
    // desplegable de Tienda (o al cambiar de vista) y se llevaria la marca.
    const marcar = (opcion) => {
      if (bajo === opcion) return;
      bajo?.removeAttribute('data-bajo');
      opcion?.setAttribute('data-bajo', '');
      bajo = opcion;
    };
    const esconder = () => {
      marcar(null);
      pastilla.classList.remove('is-vista');
    };

    const alPasar = (e) => {
      if (!esRaton(e) || !hayBarra()) return;
      const opcion = e.target.closest?.(OPCION);
      if (!opcion || !nav.contains(opcion) || opcion === bajo) return;
      // Si no se veia, aparece ya en su sitio (viajar desde el borde no dice
      // nada); despues viaja de una opcion a otra. Con menos movimiento,
      // siempre aparece sin viajar.
      const quieta = !pastilla.classList.contains('is-vista') || movimientoReducido();
      pastilla.classList.toggle('is-quieta', quieta);
      pastilla.style.width = `${opcion.offsetWidth}px`;
      pastilla.style.transform = `translate(${opcion.offsetLeft}px, -50%)`;
      pastilla.classList.add('is-vista');
      marcar(opcion);
    };
    const alSalir = (e) => { if (esRaton(e)) esconder(); };
    // Un dedo que toca la quita: en el telefono no se quedaria pegada.
    const alTocar = (e) => { if (e.pointerType === 'touch') esconder(); };

    nav.addEventListener('pointerover', alPasar);
    nav.addEventListener('pointerleave', alSalir);
    window.addEventListener('pointerdown', alTocar, { passive: true });
    // Al cambiar el ancho las opciones se mueven: mejor esconderla que dejarla
    // donde ya no hay nada.
    window.addEventListener('resize', esconder);
    return () => {
      nav.removeEventListener('pointerover', alPasar);
      nav.removeEventListener('pointerleave', alSalir);
      window.removeEventListener('pointerdown', alTocar);
      window.removeEventListener('resize', esconder);
    };
  }, [navRef]);

  return pastillaRef;
}

export default usePastillaMenu;
