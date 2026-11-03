// ---- El enrutador: una pagina HTML por pantalla ------------------------
// Sustituye al HashRouter. Las vistas y los enlaces siguen escritos con rutas
// ('/nosotros', '/cuenta/entrar') y con Link, NavLink y useNavigate de React
// Router, pero cambiar de pantalla abre el archivo HTML de esa pantalla
// (comun/paginas.js): son paginas independientes, no una sola con rutas.
//
// Dentro de una misma pagina (la tienda cambia de categoria, el panel de
// pestana) no se recarga: se cambia la direccion con la API de historial y el
// catalogo sigue montado, como antes.
//
// El estado que lleva un enlace (state={{ pagar: true }}) no cruza una carga
// de pagina; se deja en sessionStorage con la direccion de destino como
// clave, y la pagina nueva lo lee al abrirse (tambien con Atras y Adelante).
import { useEffect, useMemo, useState } from 'react';
import { Router } from 'react-router-dom';
import { VIEJAS } from './vistas.js';
import { marcarSalida } from './apertura.js';
import { archivoDe, archivoDeRuta, rutaDeDireccion } from './paginas.js';

const PREFIJO = 'tradicional:estado:';
const claveDe = (url) => PREFIJO + url.pathname + url.search;

function leerEstado(url) {
  try {
    const texto = sessionStorage.getItem(claveDe(url));
    return texto ? JSON.parse(texto) : null;
  } catch { return null; }
}

function guardarEstado(url, estado) {
  try {
    if (estado == null) sessionStorage.removeItem(claveDe(url));
    else sessionStorage.setItem(claveDe(url), JSON.stringify(estado));
  } catch { /* sin almacenamiento: el estado solo adorna */ }
}

// Donde se esta, con la forma que espera React Router.
const ubicacionActual = () => ({
  pathname: rutaDeDireccion(window.location),
  search: '',
  hash: '',
  state: leerEstado(window.location),
  key: window.history.state?.k || 'default',
});

// A que direccion lleva una ruta de las vistas, o null si no es ninguna.
function direccionDe(to) {
  const ruta = (typeof to === 'string' ? to : to.pathname || '').split(/[?#]/)[0];
  const archivo = archivoDeRuta(ruta);
  return archivo ? new URL(archivo, window.location.href) : null;
}

// Los enlaces de cuando todo era una pagina (#/tienda-panes, #historia,
// #visitanos...) estan guardados y compartidos: la portada los lleva a su
// pagina. Devuelve true si se va, para que no se pinte la portada.
function abrirDireccionVieja() {
  const { hash, pathname } = window.location;
  if (archivoDe(pathname) !== 'index.html' || hash.length < 2 || hash === '#contenido') return false;
  const sinBarra = hash.slice(1).replace(/^\//, '');
  const ruta = `/${sinBarra}`;
  const destino = direccionDe(VIEJAS[ruta] || ruta);
  if (!destino || ruta === '/') return false;
  window.location.replace(destino.href);
  return true;
}

function Enrutador({ children }) {
  const [{ ubicacion, tipo }, poner] = useState(() => ({ ubicacion: ubicacionActual(), tipo: 'POP' }));

  const navegador = useMemo(() => {
    const ir = (to, state, reemplazar) => {
      const destino = direccionDe(to);
      if (!destino) return;
      guardarEstado(destino, state);
      const mismaPagina = archivoDe(destino.pathname) === archivoDe(window.location.pathname);
      if (!mismaPagina) {
        marcarSalida();
        // Otra pagina: carga real. Con replace no deja la de antes en Atras.
        if (reemplazar) window.location.replace(destino.href);
        else window.location.assign(destino.href);
        return;
      }
      // Ir a donde ya se esta cambia la entrada en vez de apilar otra.
      const cambia = reemplazar || destino.href === window.location.href;
      const k = Math.random().toString(36).slice(2, 10);
      window.history[cambia ? 'replaceState' : 'pushState']({ k }, '', destino.href);
      poner({ ubicacion: ubicacionActual(), tipo: cambia ? 'REPLACE' : 'PUSH' });
    };
    return {
      createHref: (to) => {
        const destino = direccionDe(to);
        return destino ? destino.pathname + destino.search : '#';
      },
      go: (n) => window.history.go(n),
      push: (to, state) => ir(to, state, false),
      replace: (to, state) => ir(to, state, true),
    };
  }, []);

  useEffect(() => {
    const alVolver = () => poner({ ubicacion: ubicacionActual(), tipo: 'POP' });
    window.addEventListener('popstate', alVolver);
    return () => window.removeEventListener('popstate', alVolver);
  }, []);

  return (
    <Router location={ubicacion} navigationType={tipo} navigator={navegador}>
      {children}
    </Router>
  );
}

export { abrirDireccionVieja };
export default Enrutador;
