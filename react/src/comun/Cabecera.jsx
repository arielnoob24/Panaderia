// ---- La cabecera ------------------------------------------------------
// Logo, navegacion y el menu del telefono, con el mismo HTML que index.html y
// el comportamiento de js/comun/ui.js: se pega al bajar 40 px, se da la vuelta
// sobre las secciones oscuras, el menu del telefono lleva el foco a su primer
// enlace al abrirse y Escape cierra lo que haya abierto.
import { useEffect, useRef, useState } from 'react';
import mascota from '@raiz/assets/img/mascota.png';
import logo from '@raiz/assets/img/logo.png';
import EnlaceSeccion from './EnlaceSeccion.jsx';
import MenuTienda from './MenuTienda.jsx';

// La historia y el pie son del mismo marron que la barra pegada: cuando alguno
// pasa por detras de ella, la barra se da la vuelta para no fundirse. Se
// buscan en cada vuelta y no una vez al montar: la historia no existe en las
// vistas de confirmar y comprobante.
const OSCURAS = '.story, .site-footer';

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
    // Un clic fuera del menu del telefono lo pliega.
    const alClicar = (e) => {
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
    document.addEventListener('click', alClicar);
    document.addEventListener('keydown', alTeclear);
    window.addEventListener('resize', alCambiarTamano);
    return () => {
      document.removeEventListener('click', alClicar);
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
        <EnlaceSeccion a="inicio" className="brand" aria-label="El Tradicional, panadería y pastelería. Ir al inicio">
          <span className="mascot-slot mascot-brand"><img src={mascota} alt="" width="224" height="210" /></span>
          <img className="brand-logo" src={logo} alt="" width="420" height="184" />
        </EnlaceSeccion>
        <nav ref={navRef} id="main-nav" className={menuAbierto ? 'main-nav is-open' : 'main-nav'} aria-label="Navegación principal">
          <EnlaceSeccion ref={primerEnlaceRef} a="historia" onClick={cerrarMenu}>Nosotros</EnlaceSeccion>
          <MenuTienda
            abierta={tiendaAbierta}
            setAbierta={setTiendaAbierta}
            botonRef={botonTiendaRef}
            alElegir={cerrarMenu}
          />
          <EnlaceSeccion a="visitanos" onClick={cerrarMenu}>Contáctanos</EnlaceSeccion>
        </nav>
        <div className="nav-acciones">
          {/* Aqui iran el boton de la canasta (fase 3) y el de la cuenta
              (fase 5), delante del menu, como los pone el sitio actual. */}
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
