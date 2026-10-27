// ---- La cabecera ------------------------------------------------------
// Logo, navegacion, la cuenta, la canasta y el menu del telefono, con el
// HTML y el comportamiento de ui.js del sitio presentado: es horno desde
// que carga, gana sombra al bajar 40 px y una linea ambar sobre las
// secciones oscuras (seccion 10 del plan), el menu del
// telefono lleva el foco a su primer enlace al abrirse y Escape cierra lo
// que haya abierto. Cada opcion lleva a
// su vista (comun/vistas.js); la de la vista en la que se esta lleva
// aria-current="page", que NavLink pone solo.
import { useEffect, useRef, useState } from 'react';
import { LayoutGroup, useReducedMotion } from 'motion/react';
import logo from '/assets/img/logo.png';
import { Link, NavLink, useLocation } from 'react-router-dom';
import IndicadorNav from './IndicadorNav.jsx';
import BotonCanasta from '../pedido/BotonCanasta.jsx';
import FichaCuenta from '../cuenta/FichaCuenta.jsx';

// Las bandas oscuras son del mismo horno que la barra: cuando alguna pasa
// por detras de ella, la barra gana una linea ambar para no fundirse. Se
// buscan en cada vuelta y no una vez al montar: cada vista tiene las suyas.
const OSCURAS = '.banda-oscura';

function Cabecera() {
  const reducido = useReducedMotion();
  const { pathname } = useLocation();
  // Todas las categorias son la misma vista, la tienda: estando en
  // cualquiera, Tienda es la opcion actual (NavLink solo la marcaria en
  // #/tienda-catalogo).
  const enTienda = pathname.startsWith('/tienda-');
  const [pegada, setPegada] = useState(false);
  const [sobreOscuro, setSobreOscuro] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const cabeceraRef = useRef(null);
  const navRef = useRef(null);
  const botonMenuRef = useRef(null);
  const primerEnlaceRef = useRef(null);
  // Lo abierto, a mano de los escuchadores del documento, que se ponen una vez.
  const abierto = useRef(false);
  useEffect(() => { abierto.current = menuAbierto; });

  // La cabecera se queda arriba al bajar, y con sombra en cuanto se baja.
  // React no repinta si el valor no cambia, asi que no se toca el DOM a cada pixel.
  useEffect(() => {
    const mirarScroll = () => {
      const alto = cabeceraRef.current?.getBoundingClientRect().height || 0;
      const tapando = [...document.querySelectorAll(OSCURAS)].some((s) => {
        const r = s.getBoundingClientRect();
        return r.top < alto && r.bottom > 0;
      });
      setPegada(window.scrollY > 40);
      setSobreOscuro(tapando);
    };
    window.addEventListener('scroll', mirarScroll, { passive: true });
    mirarScroll();
    return () => window.removeEventListener('scroll', mirarScroll);
  }, []);

  const cerrarMenu = () => setMenuAbierto(false);

  useEffect(() => {
    // Un clic fuera del menu del telefono lo pliega, y el foco que se va
    // tambien: si no, al tabular mas alla de Contactanos el menu se quedaba
    // abierto tapando lo que tenia el foco.
    const plegarSiEsFuera = (e) => {
      if (!abierto.current) return;
      if (navRef.current?.contains(e.target) || botonMenuRef.current?.contains(e.target)) return;
      setMenuAbierto(false);
    };
    // Escape pliega el menu del telefono y devuelve el foco a su boton.
    const alTeclear = (e) => {
      if (e.key !== 'Escape' || !abierto.current) return;
      setMenuAbierto(false);
      botonMenuRef.current?.focus();
    };
    // En pantalla grande no hay menu del telefono que tener abierto.
    const alCambiarTamano = () => {
      if (window.innerWidth > 680) setMenuAbierto(false);
    };
    document.addEventListener('click', plegarSiEsFuera);
    document.addEventListener('focusin', plegarSiEsFuera);
    document.addEventListener('keydown', alTeclear);
    window.addEventListener('resize', alCambiarTamano);
    return () => {
      document.removeEventListener('click', plegarSiEsFuera);
      document.removeEventListener('focusin', plegarSiEsFuera);
      document.removeEventListener('keydown', alTeclear);
      window.removeEventListener('resize', alCambiarTamano);
    };
  }, []);

  const alPulsarMenu = () => {
    if (menuAbierto) { cerrarMenu(); return; }
    setMenuAbierto(true);
    // La navegacion va antes del boton en el documento, asi que al abrirla con
    // el teclado el siguiente tabulador se la salta por detras. Abriendola, el
    // foco entra en el primer enlace. El menu aparece con una transicion: hasta
    // el cuadro siguiente sigue escondido, y a lo escondido no se le da el foco.
    requestAnimationFrame(() => primerEnlaceRef.current?.focus());
  };

  const claseCabecera = ['site-header', pegada && 'is-pegada', sobreOscuro && 'is-sobre-oscuro']
    .filter(Boolean).join(' ');

  return (
    <header ref={cabeceraRef} className={claseCabecera}>
      <div className="container nav-wrap">
        <Link to="/" state={{ entrar: true }} className="brand" aria-label="El Tradicional, panadería y pastelería. Ir al inicio" onClick={cerrarMenu}>
          <img className="brand-logo" src={logo} alt="" width="420" height="184" />
        </Link>
        <nav ref={navRef} id="main-nav" className={menuAbierto ? 'main-nav is-open' : 'main-nav'} aria-label="Navegación principal">
          {/* Cada opcion se enciende en su sitio con el raton (M2, solo
              CSS en styles.css), y la de la vista actual lleva el aro. */}
          {/* Inicio delante (seccion 4 del plan), tambien en el menu del
              telefono. end: solo esta en Inicio quien esta en #/, no en
              cualquier vista que empiece por la barra. */}
          <LayoutGroup id="navegacion-principal">
            <NavLink ref={primerEnlaceRef} to="/" end state={{ entrar: true }} onClick={cerrarMenu}>
              {({ isActive }) => <>{isActive && <IndicadorNav reducido={reducido} />}Inicio</>}
            </NavLink>
            <NavLink to="/nosotros" state={{ entrar: true }} onClick={cerrarMenu}>
              {({ isActive }) => <>{isActive && <IndicadorNav reducido={reducido} />}Nosotros</>}
            </NavLink>
            {/* Tienda es un enlace simple al catalogo entero, sin
                desplegable (seccion 4 del plan): las categorias se eligen
                con "Filtrar por" o con la cinta de la portada. */}
            <Link to="/tienda-catalogo" state={{ entrar: true }} aria-current={enTienda ? 'page' : undefined} onClick={cerrarMenu}>
              {enTienda && <IndicadorNav reducido={reducido} />}Tienda
            </Link>
            <NavLink to="/contacto" state={{ entrar: true }} onClick={cerrarMenu}>
              {({ isActive }) => <>{isActive && <IndicadorNav reducido={reducido} />}Contáctanos</>}
            </NavLink>
          </LayoutGroup>
        </nav>
        <div className="nav-acciones">
          {/* Como en el sitio presentado: la cuenta primero, luego la canasta y el
              menu. En el telefono la cuenta se queda en la barra, al lado del
              menu, y styles.css deja la canasta flotando abajo. Abrir la
              ficha de la cuenta pliega el menu del telefono. */}
          <FichaCuenta alAbrir={cerrarMenu} />
          <BotonCanasta />
          <button
            ref={botonMenuRef}
            className="menu-toggle"
            type="button"
            aria-controls="main-nav"
            aria-expanded={menuAbierto}
            aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
            onClick={alPulsarMenu}
          >
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Cabecera;
