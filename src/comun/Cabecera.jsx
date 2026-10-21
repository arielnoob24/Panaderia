// ---- La cabecera ------------------------------------------------------
// Logo, navegacion, la cuenta, la canasta y el menu del telefono, con el
// HTML y el comportamiento de ui.js del sitio presentado: se pega al
// bajar 40 px, se da la vuelta sobre las secciones oscuras, el menu del
// telefono lleva el foco a su primer enlace al abrirse y Escape cierra lo
// que haya abierto. Cada opcion lleva a
// su vista (comun/vistas.js); la de la vista en la que se esta lleva
// aria-current="page", que NavLink pone solo.
import { useEffect, useRef, useState } from 'react';
import mascota from '/assets/img/mascota.png';
import logo from '/assets/img/logo.png';
import { Link, NavLink } from 'react-router-dom';
import MenuTienda from './MenuTienda.jsx';
import BotonCanasta from '../pedido/BotonCanasta.jsx';
import FichaCuenta from '../cuenta/FichaCuenta.jsx';

// Las bandas oscuras y el pie son del mismo marron que la barra pegada: cuando
// alguno pasa por detras de ella, la barra se da la vuelta para no fundirse.
// Se buscan en cada vuelta y no una vez al montar: cada vista tiene las suyas.
const OSCURAS = '.banda-oscura, .site-footer';

function Cabecera() {
  const [pegada, setPegada] = useState(false);
  const [sobreOscuro, setSobreOscuro] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [tiendaAbierta, setTiendaAbierta] = useState(false);
  const cabeceraRef = useRef(null);
  const navRef = useRef(null);
  const botonMenuRef = useRef(null);
  const primerEnlaceRef = useRef(null);
  const botonTiendaRef = useRef(null);
  // Lo abierto, a mano de los escuchadores del documento, que se ponen una vez.
  const abierto = useRef({ menu: false, tienda: false });
  useEffect(() => { abierto.current = { menu: menuAbierto, tienda: tiendaAbierta }; });

  // La cabecera se queda arriba al bajar. Sin fondo mientras se esta en lo
  // alto -ahi la sostiene el velo del hero- y con fondo en cuanto se baja.
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

  const cerrarMenu = () => {
    setMenuAbierto(false);
    // Al plegarse el menu del telefono, la tienda no se queda abierta debajo.
    setTiendaAbierta(false);
  };

  useEffect(() => {
    // Un clic fuera del menu del telefono lo pliega, y el foco que se va
    // tambien: si no, al tabular mas alla de Contactanos el menu se quedaba
    // abierto tapando lo que tenia el foco.
    const plegarSiEsFuera = (e) => {
      if (!abierto.current.menu) return;
      if (navRef.current?.contains(e.target) || botonMenuRef.current?.contains(e.target)) return;
      setMenuAbierto(false);
      setTiendaAbierta(false);
    };
    // Escape cierra lo que haya abierto y devuelve el foco a quien lo abrio:
    // al boton del menu en el telefono, o a la flecha de Tienda en la barra,
    // que en pantalla grande el del menu ni siquiera se ve.
    const alTeclear = (e) => {
      if (e.key !== 'Escape') return;
      const { menu, tienda } = abierto.current;
      if (!menu && !tienda) return;
      setMenuAbierto(false);
      setTiendaAbierta(false);
      if (menu) botonMenuRef.current?.focus();
      else botonTiendaRef.current?.focus();
    };
    // En pantalla grande no hay menu del telefono que tener abierto.
    const alCambiarTamano = () => {
      if (window.innerWidth > 680) { setMenuAbierto(false); setTiendaAbierta(false); }
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
          <span className="mascot-slot mascot-brand"><img src={mascota} alt="" width="224" height="210" /></span>
          <img className="brand-logo" src={logo} alt="" width="420" height="184" />
        </Link>
        <nav ref={navRef} id="main-nav" className={menuAbierto ? 'main-nav is-open' : 'main-nav'} aria-label="Navegación principal">
          <NavLink ref={primerEnlaceRef} to="/nosotros" state={{ entrar: true }} onClick={cerrarMenu}>Nosotros</NavLink>
          <MenuTienda
            abierta={tiendaAbierta}
            setAbierta={setTiendaAbierta}
            botonRef={botonTiendaRef}
            alElegir={cerrarMenu}
          />
          <NavLink to="/contacto" state={{ entrar: true }} onClick={cerrarMenu}>Contáctanos</NavLink>
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
