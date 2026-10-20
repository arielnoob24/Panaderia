// ---- La cuenta en la cabecera ------------------------------------------
// El circulo de la cuenta, con las clases de js/cuenta/account.js (nav-cuenta,
// cuenta-menu...), pero con las vistas de la fase 5 (seccion 15 del plan):
//   - Sin sesion es la silueta, y es un enlace: lleva directo a
//     #/cuenta/entrar, donde esta tambien "Creala". No hay nada que elegir
//     antes, asi que no hace falta un menu de por medio.
//   - Con sesion son tus iniciales, y abren una ficha pequena con quien eres,
//     "Mis datos", "Mis pedidos (N)" y "Cerrar sesion". Es un boton con
//     aria-expanded y aria-controls; la ficha se recorre con las flechas,
//     Inicio y Fin, como la lista de Tienda. Escape la cierra y devuelve el
//     foco al circulo; un clic o el foco fuera la cierran, y tambien navegar.
// El circulo no lleva texto a la vista: el nombre va en aria-label para el
// lector de pantalla y en data-tip (el globo) para el raton.
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSesion } from '../estado/SesionProvider.jsx';
import { useAvisos } from '../comun/Avisos.jsx';
import { iniciales } from '../servicios/cuenta.js';
import { usePedidosGuardados } from './usePedidosGuardados.js';
import '../estilos/cuenta.css';

// Los dibujos de la ficha, los mismos de ICONOS en account.js.
const trazo = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '1.6', strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true', focusable: 'false' };
const PERSONA = (
  <>
    <circle cx="12" cy="8.2" r="3.6" />
    <path d="M5.2 20.2a6.8 6.8 0 0 1 13.6 0" />
  </>
);
const PEDIDOS = (
  <>
    <path d="M6 3.5h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3Z" />
    <path d="M9 8h6M9 11.5h6M9 15h3.5" />
  </>
);
const SALIR = (
  <>
    <path d="M14 4.5H7a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h7" />
    <path d="M11 12h9" />
    <path d="M17 8.5l3.5 3.5-3.5 3.5" />
  </>
);

// Lo de dentro de la ficha. Se monta de nuevo cada vez que se abre (la clave
// de quien la usa): asi el numero de pedidos se vuelve a leer, porque puede
// haberse pagado uno desde la ultima vez.
function OpcionesCuenta({ nombre, correo, ruta, opcionesRef, alElegir, alSalir }) {
  const pedidos = usePedidosGuardados();
  const n = pedidos?.length || 0;
  const guardar = (i) => (el) => { opcionesRef.current[i] = el; };
  // La opcion de la vista en la que se esta lo dice al lector de pantalla
  // ("pagina actual"), como la silueta en #/cuenta/entrar.
  const actual = (a) => (ruta === a ? 'page' : undefined);
  return (
    <>
      <div className="cuenta-menu-cabeza is-dentro">
        <span className="cuenta-menu-avatar" aria-hidden="true">{iniciales(nombre)}</span>
        <div>
          <p className="cuenta-menu-nombre">{nombre}</p>
          <p className="cuenta-menu-correo">{correo}</p>
        </div>
      </div>
      <Link ref={guardar(0)} className="cuenta-menu-opcion" to="/cuenta" aria-current={actual('/cuenta')} onClick={() => alElegir('/cuenta')}>
        <svg className="cuenta-icono" {...trazo}>{PERSONA}</svg>
        <span>Mis datos</span>
      </Link>
      <Link ref={guardar(1)} className="cuenta-menu-opcion" to="/cuenta/pedidos" aria-current={actual('/cuenta/pedidos')} onClick={() => alElegir('/cuenta/pedidos')}>
        <svg className="cuenta-icono" {...trazo}>{PEDIDOS}</svg>
        <span>Mis pedidos</span>
        {/* Los parentesis solo para el lector: "Mis pedidos (2)". A la vista,
            el numero va en su pastilla. */}
        {n ? <span className="cuenta-menu-numero"><span className="sr-only">(</span>{n}<span className="sr-only">)</span></span> : null}
      </Link>
      <hr className="cuenta-menu-raya" />
      <button ref={guardar(2)} className="cuenta-menu-opcion is-salir" type="button" onClick={alSalir}>
        <svg className="cuenta-icono" {...trazo}>{SALIR}</svg>
        <span>Cerrar sesión</span>
      </button>
    </>
  );
}

function FichaCuenta({ alAbrir }) {
  const sesion = useSesion();
  const { dentro, nombre, correo } = sesion;
  const avisar = useAvisos();
  const navegar = useNavigate();
  const location = useLocation();
  const [abierta, setAbierta] = useState(false);
  // Cuantas veces se abrio: es la clave de OpcionesCuenta.
  const [vez, setVez] = useState(0);
  const botonRef = useRef(null);
  const entrarRef = useRef(null);
  const fichaRef = useRef(null);
  const opcionesRef = useRef([]);
  // Tras cerrar la sesion, el circulo deja de ser boton y pasa a ser enlace:
  // el foco tiene que ir al enlace nuevo, que no existe hasta el pintado.
  const enfocarEntrar = useRef(false);

  // Navegar cierra la ficha: lo que ensenaba era para la vista de antes. Se
  // ajusta mientras se pinta, para que la vista nueva ya llegue sin ella.
  const [donde, setDonde] = useState(location.key);
  if (donde !== location.key) {
    setDonde(location.key);
    setAbierta(false);
  }
  // Sin sesion no hay ficha que tener abierta.
  if (!dentro && abierta) setAbierta(false);

  useEffect(() => {
    if (!dentro && enfocarEntrar.current) {
      enfocarEntrar.current = false;
      entrarRef.current?.focus();
    }
  }, [dentro]);

  useEffect(() => {
    if (!abierta) return undefined;
    const fuera = (e) => {
      if (botonRef.current?.contains(e.target) || fichaRef.current?.contains(e.target)) return;
      setAbierta(false);
    };
    const alTeclear = (e) => {
      if (e.key !== 'Escape') return;
      setAbierta(false);
      botonRef.current?.focus();
    };
    document.addEventListener('click', fuera);
    document.addEventListener('focusin', fuera);
    document.addEventListener('keydown', alTeclear);
    return () => {
      document.removeEventListener('click', fuera);
      document.removeEventListener('focusin', fuera);
      document.removeEventListener('keydown', alTeclear);
    };
  }, [abierta]);

  const abrir = () => {
    setVez((v) => v + 1);
    setAbierta(true);
    // El menu del telefono y la ficha no caben a la vez.
    alAbrir?.();
  };

  const irA = (i) => {
    const lista = opcionesRef.current.filter(Boolean);
    if (!lista.length) return;
    lista[(i + lista.length) % lista.length].focus();
  };
  const mover = (paso) => {
    const lista = opcionesRef.current.filter(Boolean);
    const i = lista.indexOf(document.activeElement);
    irA(i === -1 ? (paso > 0 ? 0 : lista.length - 1) : i + paso);
  };
  const alTeclearBoton = (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    if (!abierta) abrir();
    // La ficha se hace visible al pintarse: hasta el cuadro siguiente no se
    // le puede dar el foco.
    const primero = e.key === 'ArrowDown';
    requestAnimationFrame(() => irA(primero ? 0 : -1));
  };
  const alTeclearFicha = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); mover(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); mover(-1); }
    else if (e.key === 'Home') { e.preventDefault(); irA(0); }
    else if (e.key === 'End') { e.preventDefault(); irA(-1); }
  };

  // Elegir la vista en la que ya se esta no cambia de vista, y el foco se
  // quedaria en la ficha escondida: vuelve al circulo.
  const alElegir = (a) => {
    setAbierta(false);
    if (location.pathname === a) botonRef.current?.focus();
  };

  // Lo mismo que "Cerrar sesion" de Mis datos: no borra la cuenta y lleva a
  // la portada. Desde una vista de la cuenta, con replace, para que Atras no
  // vuelva a los datos de una sesion cerrada. Si ya se esta en la portada no
  // hay vista nueva que se lleve el foco: va al circulo, que ahora es la
  // silueta de "Iniciar sesion / Registrarse".
  const alSalir = () => {
    const quien = nombre;
    setAbierta(false);
    sesion.salir();
    if (location.pathname === '/') enfocarEntrar.current = true;
    else navegar('/', { replace: location.pathname.startsWith('/cuenta') });
    avisar(`Cerraste la sesión de ${quien}.`);
  };

  if (!dentro) {
    return (
      <Link
        ref={entrarRef}
        className="nav-cuenta"
        to="/cuenta/entrar"
        aria-label="Iniciar sesión / Registrarse"
        data-tip="Iniciar sesión / Registrarse"
        aria-current={location.pathname === '/cuenta/entrar' ? 'page' : undefined}
      >
        <svg className="nav-cuenta-icono" {...trazo} strokeWidth="1.5">{PERSONA}</svg>
      </Link>
    );
  }

  return (
    <>
      <button
        ref={botonRef}
        className="nav-cuenta is-dentro"
        type="button"
        aria-expanded={abierta}
        aria-controls="cuenta-menu"
        aria-label={`Tu cuenta, ${nombre}`}
        data-tip="Tu cuenta"
        onClick={() => (abierta ? setAbierta(false) : abrir())}
        onKeyDown={alTeclearBoton}
      >
        <span className="nav-cuenta-iniciales" aria-hidden="true">{iniciales(nombre)}</span>
      </button>
      <div
        ref={fichaRef}
        id="cuenta-menu"
        className={abierta ? 'cuenta-menu is-open' : 'cuenta-menu'}
        onKeyDown={alTeclearFicha}
      >
        <OpcionesCuenta
          key={vez}
          nombre={nombre}
          correo={correo}
          ruta={location.pathname}
          opcionesRef={opcionesRef}
          alElegir={alElegir}
          alSalir={alSalir}
        />
      </div>
    </>
  );
}

export default FichaCuenta;
