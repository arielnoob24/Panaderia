// ---- Tienda y sus categorias ------------------------------------------
// "Tienda" son dos piezas, como en index.html: la palabra lleva al catalogo
// entero y la flecha de al lado abre la lista de categorias. Manda el clic en
// la flecha, que es lo que funciona con teclado y con el dedo; con raton,
// ademas, se asoma al pasar por encima. La lista se recorre con las flechas,
// Inicio y Fin, y Escape la cierra (eso lo lleva la cabecera, que es quien
// sabe si tambien hay que plegar el menu del telefono). La flecha no lleva
// aria-haspopup: anunciaria un menu de aplicacion (role=menu), y esto es una
// lista de enlaces que se abre y se cierra; aria-expanded ya lo dice.
import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CATEGORIAS } from '../catalogo/categorias.js';
import IndicadorNav from './IndicadorNav.jsx';

// Se mira quien entra cada vez, por pointerType, y no con la media query
// (hover: hover): en un portatil con pantalla tactil el navegador dice que no
// hay raton aunque lo haya, y el desplegable nunca se asomaba.
const esRaton = (e) => e.pointerType === 'mouse' || e.pointerType === 'pen';
// En el telefono la lista vive dentro del menu de hamburguesa y no se asoma.
const hayBarra = () => window.innerWidth > 680;

function MenuTienda({ abierta, setAbierta, botonRef, alElegir, reducido }) {
  const { pathname } = useLocation();
  const grupoRef = useRef(null);
  const enlacesRef = useRef([]);
  // El cursor solo la asoma: al apartarlo se cierra. El clic la deja fijada,
  // y entonces se queda aunque el cursor se vaya, hasta que se vuelve a pulsar
  // o se toca otra cosa. No se pinta, asi que va en una ref.
  const fijada = useRef(false);
  // Cerrada desde fuera (Escape, elegir, plegar el menu): ya no esta fijada.
  useEffect(() => { if (!abierta) fijada.current = false; }, [abierta]);

  // Si el clic o el foco se van a otra parte, el desplegable ya no pinta nada.
  useEffect(() => {
    const fuera = (e) => {
      if (grupoRef.current?.contains(e.target)) return;
      fijada.current = false;
      setAbierta(false);
    };
    document.addEventListener('click', fuera);
    document.addEventListener('focusin', fuera);
    return () => {
      document.removeEventListener('click', fuera);
      document.removeEventListener('focusin', fuera);
    };
  }, [setAbierta]);

  const irA = (i) => {
    const lista = enlacesRef.current.filter(Boolean);
    if (!lista.length) return;
    lista[(i + lista.length) % lista.length].focus();
  };
  const mover = (paso) => {
    const lista = enlacesRef.current.filter(Boolean);
    const donde = lista.indexOf(document.activeElement);
    irA(donde === -1 ? (paso > 0 ? 0 : lista.length - 1) : donde + paso);
  };

  // Con las flechas se entra y se recorre. Quien abre con el teclado la deja
  // fijada: si no, el primer movimiento del raton se la cerraria en la cara.
  const alTeclearBoton = (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    if (!abierta) { fijada.current = true; setAbierta(true); }
    // El desplegable aparece con una transicion; hasta que no es visible no
    // se le puede dar el foco, de ahi el salto al siguiente cuadro.
    const primero = e.key === 'ArrowDown';
    requestAnimationFrame(() => irA(primero ? 0 : -1));
  };
  const alTeclearLista = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); mover(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); mover(-1); }
    else if (e.key === 'Home') { e.preventDefault(); irA(0); }
    else if (e.key === 'End') { e.preventDefault(); irA(-1); }
  };

  // Elegir algo de la tienda cierra la lista y el menu del telefono.
  const elegir = () => {
    fijada.current = false;
    setAbierta(false);
    alElegir();
  };

  return (
    <div
      ref={grupoRef}
      className={abierta ? 'nav-grupo is-open' : 'nav-grupo'}
      onPointerEnter={(e) => { if (esRaton(e) && hayBarra()) setAbierta(true); }}
      onPointerLeave={(e) => { if (esRaton(e) && !fijada.current) setAbierta(false); }}
    >
      {/* La palabra Tienda lleva al catalogo entero, igual que "Ver el menu". */}
      {/* Todas las categorias son la misma vista, la tienda: estando en
          cualquiera, Tienda es la opcion actual. */}
      <Link
        className="nav-grupo-enlace"
        to="/tienda-catalogo"
        state={{ entrar: true }}
        aria-current={pathname.startsWith('/tienda-') ? 'page' : undefined}
        onClick={elegir}
      >
        {pathname.startsWith('/tienda-') && <IndicadorNav reducido={reducido} />}
        Tienda
      </Link>
      <button
        ref={botonRef}
        className="nav-grupo-boton"
        type="button"
        aria-expanded={abierta}
        aria-controls="nav-tienda"
        aria-label="Categorías de la tienda"
        onClick={() => {
          fijada.current = !fijada.current;
          setAbierta(fijada.current);
        }}
        onKeyDown={alTeclearBoton}
      >
        <svg className="nav-grupo-flecha" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M6 9.5l6 5.5 6-5.5" /></svg>
      </button>
      <div className="nav-submenu" id="nav-tienda" onKeyDown={alTeclearLista}>
        {CATEGORIAS.map((c, i) => (
          <Link
            key={c.id}
            ref={(el) => { enlacesRef.current[i] = el; }}
            to={`/tienda-${c.id}`}
            state={{ entrar: true }}
            data-filtro={c.id}
            onClick={elegir}
          >
            {c.nombre}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default MenuTienda;
