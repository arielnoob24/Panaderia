// ---- La tienda (#/tienda-catalogo, #/tienda-<categoria>) -----------------
// El catalogo en cuadricula y con sus mandos. Sigue las reglas de
// view.js del sitio presentado una por una:
//   - Entrar en la tienda (enlace, "Ver el menu", Tienda o una categoria) la
//     deja limpia: orden recomendado, todos, sin busqueda; sube arriba y el
//     foco va al titulo. Volver con Atras no la limpia: es volver a donde se
//     estaba.
//   - Cambiar "Filtrar por" a mano cambia la direccion con replace, para que
//     Atras saque de la tienda en vez de deshacer filtros de uno en uno.
//   - El orden y "Mostrar" se recuerdan en sessionStorage (storage.js).
//   - Ordenar cambia la propiedad CSS order, no el orden de las fichas.
//   - Al cambiar el filtro o el orden, las fichas entran escalonadas.
// Las categorias son la misma vista: entre ellas el catalogo no se vuelve a
// montar (App.jsx).
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { dinero } from '../servicios/state.js';
import { recordarVista, vistaRecordada } from '../servicios/storage.js';
import { catalogo } from '../servicios/catalogo.js';
import { useAvisos } from '../comun/Avisos.jsx';
import { movimientoReducido } from '../comun/useMovimientoReducido.js';
import { useVista } from '../comun/useVista.js';
import { posicionTienda } from '../comun/apertura.js';
import FichaProducto from './FichaProducto.jsx';
import VistaCabeza from './VistaCabeza.jsx';
import Franja from '../comun/Franja.jsx';
import { filtroDe, nombreCategoria } from './categorias.js';

const { productos } = catalogo;
const ORDENES = ['recomendados', 'precio-asc', 'precio-desc', 'nombre'];
// "Todo el catalogo" no es una de las tres de Tienda, pero es una vista con
// nombre y direccion propia.
const TITULO_CATALOGO = 'Todo el catálogo';
// Lo que se apunta en sessionStorage como vista: el mismo nombre que usaba el
// sitio presentado para su catalogo, para que lo recordado siga valiendo.
const VISTA = 'catalogo';

// Ordenar no cambia cuantos se ven, asi que el aviso del catalogo no dice nada
// nuevo: se anuncia el orden puesto.
const ORDEN_DICHO = {
  recomendados: 'Ordenado como lo recomendamos.',
  'precio-asc': 'Ordenado por precio, de menor a mayor.',
  'precio-desc': 'Ordenado por precio, de mayor a menor.',
  nombre: 'Ordenado por nombre, de la A a la Z.',
};

// Lo que se espera tras la ultima tecla para decir cuantos hay.
const ESPERA_BUSQUEDA = 400;

// Se busca sin tildes ni mayusculas: quien escribe "limon" quiere el de limón.
const plano = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

// El orden y "solo disponibles" los dice la pestana, si lo que recordaba es de
// esta misma vista. Lo recordado se comprueba contra las opciones que existen:
// es un dato del navegador y se puede editar a mano.
const recordado = () => {
  const antes = vistaRecordada();
  if (!antes || antes.categoria !== VISTA) return { orden: 'recomendados', solo: false };
  return {
    orden: ORDENES.includes(antes.orden) ? antes.orden : 'recomendados',
    solo: antes.soloDisponibles === true,
  };
};

// El stagger lineal recorre la cuadricula como una tabla. La diagonal se lee
// como una bandeja que se llena, asi que el retraso depende de fila mas columna.
const contarColumnas = (grid) => {
  if (!grid) return 1;
  const columnas = getComputedStyle(grid).gridTemplateColumns;
  if (!columnas || columnas === 'none') return 1;
  return columnas.split(' ').filter(Boolean).length || 1;
};
const retrasoDiagonal = (i, columnas) => Math.min((Math.floor(i / columnas) + (i % columnas)) * 40, 320);

function Catalogo({ categoria }) {
  // El filtro de categoria no se guarda en ningun sitio: lo dice la direccion.
  const subcategoria = filtroDe(categoria);
  const location = useLocation();
  const navegar = useNavigate();
  const tipoNavegacion = useNavigationType();
  const avisar = useAvisos();

  const [orden, setOrden] = useState(() => recordado().orden);
  const [soloDisponibles, setSoloDisponibles] = useState(() => recordado().solo);
  const [busqueda, setBusqueda] = useState('');
  // El tamano elegido de cada producto, por nombre. Vive aqui y no en la ficha
  // porque ordenar por precio usa el del tamano que se ve.
  const [elegidos, setElegidos] = useState({});

  // Entrar de nuevo con un enlace estando ya en la tienda (otra categoria desde
  // el menu) la deja limpia. Se ajusta mientras se pinta, al ver una direccion
  // nueva, y no en un efecto: asi no hay un cuadro con lo de antes.
  // Volver con Atras o Adelante a una entrada abierta con un enlace no es
  // entrar: esa entrada guarda su state.entrar, pero se vuelve a donde se
  // estaba, con sus filtros.
  const [claveVista, setClaveVista] = useState(location.key);
  if (claveVista !== location.key) {
    setClaveVista(location.key);
    if (location.state?.entrar && tipoNavegacion !== 'POP') {
      setOrden('recomendados');
      setSoloDisponibles(false);
      setBusqueda('');
    }
  }

  // ---- La entrada escalonada --------------------------------------------
  const [entrada, setEntrada] = useState(null);
  const gridRef = useRef(null);
  const tituloRef = useRef(null);

  // Las columnas se miden antes de cambiar nada, como en view.js.
  const animarEntrada = useCallback(() => {
    if (movimientoReducido()) return;
    setEntrada({ columnas: contarColumnas(gridRef.current) });
  }, []);

  // Se quita al acabar, para que no se repita al volver a pintar. 780 ms es
  // lo que tarda la ultima ficha en llegar.
  useEffect(() => {
    if (!entrada) return undefined;
    const reloj = setTimeout(() => setEntrada(null), 780);
    return () => clearTimeout(reloj);
  }, [entrada]);

  // ---- Que se ve y en que orden ----------------------------------------
  const cuadro = useMemo(() => {
    const precioDe = (p) => p.tamanos[elegidos[p.nombre] ?? 0]?.precio ?? p.precio;
    const porOrden = [...productos].sort((a, b) => {
      if (orden === 'precio-asc') return precioDe(a) - precioDe(b);
      if (orden === 'precio-desc') return precioDe(b) - precioDe(a);
      if (orden === 'nombre') return a.nombre.localeCompare(b.nombre, 'es');
      return productos.indexOf(a) - productos.indexOf(b);
    });
    const puesto = new Map(porOrden.map((p, i) => [p, i]));
    const buscado = plano(busqueda);
    const visibles = new Map();
    let agotados = 0;
    productos.forEach((p) => {
      const pasaFiltro = !soloDisponibles || p.disponible;
      const pasaSub = subcategoria === 'todas' || p.categoria === subcategoria;
      const pasaBusqueda = !buscado || plano(p.nombre).includes(buscado);
      if (!(pasaFiltro && pasaSub && pasaBusqueda)) return;
      visibles.set(p, visibles.size);
      if (!p.disponible) agotados += 1;
    });
    return { total: productos.length, puesto, visibles, agotados };
  }, [orden, soloDisponibles, subcategoria, busqueda, elegidos]);

  const n = cuadro.visibles.size;
  // Lo util es saber cuantos se ven de los que hay: con un filtro puesto, un
  // numero suelto no dice si falta algo.
  const dice = `Mostrando ${n} de ${cuadro.total} producto${cuadro.total === 1 ? '' : 's'}`;
  let estado;
  if (catalogo.error) {
    estado = 'No se pudo cargar el catálogo. Recarga la página; si sigue sin salir, escríbenos y te decimos qué hay hoy.';
  } else {
    // Llamar "disponible" a lo que esta agotado seria mentira.
    const plural = n === 1 ? '' : 's';
    const cuantos = cuadro.agotados
      ? `${n} producto${plural}, ${cuadro.agotados} agotado${cuadro.agotados === 1 ? '' : 's'}`
      : `${n} producto${plural} disponible${plural}`;
    // Con "Todas" puesto no hay ninguna categoria de la que hablar.
    const donde = subcategoria === 'todas' ? 'en todo el catálogo' : 'en esta categoría';
    estado = `${dice}. ${cuantos} ${donde}.`;
  }
  // La region de avisos nace con la vista, y lo que ya trae al nacer el lector
  // de pantalla no lo lee: se llena un momento despues, para que al entrar
  // se oiga cuantos hay, como cuando la tienda y la portada eran una pagina.
  const [hablar, setHablar] = useState(false);
  useEffect(() => {
    const reloj = setTimeout(() => setHablar(true), 150);
    return () => clearTimeout(reloj);
  }, []);
  let vacio = '';
  if (n === 0) {
    vacio = busqueda
      ? `No encontramos nada que se llame «${busqueda.trim()}». Prueba con otra palabra o quita algún filtro.`
      : 'No hay productos con estos filtros.';
  }
  // Sin nada que mostrar, el aviso dice tambien por que: es el unico que
  // habla (el texto grande de la vista es mudo), y dos avisos a la vez se
  // pisaban.
  const anuncio = vacio && !catalogo.error ? `${dice}. ${vacio}` : estado;
  // Mientras se escribe el aviso calla: decia la cuenta a cada tecla. Habla
  // una vez, cuando la busqueda lleva un momento quieta.
  const [busquedaQuieta, setBusquedaQuieta] = useState(busqueda);
  useEffect(() => {
    const reloj = setTimeout(() => setBusquedaQuieta(busqueda), ESPERA_BUSQUEDA);
    return () => clearTimeout(reloj);
  }, [busqueda]);
  const dicho = hablar && busquedaQuieta === busqueda ? anuncio : '';

  // ---- Lo que se recuerda, el titulo y el foco --------------------------
  // Donde estabas se apunta en cada cambio, no al salir: de la pagina se sale
  // cerrandola, y no hay un momento fiable para guardar al final.
  useEffect(() => {
    recordarVista({ categoria: VISTA, orden, soloDisponibles, subcategoria });
  }, [orden, soloDisponibles, subcategoria]);

  // Con una categoria puesta en "Filtrar por", el titulo y la pestana dicen
  // cual: "Todo el catalogo" estando en Dulces no decia donde se estaba.
  const nombreFiltro = subcategoria === 'todas' ? null : nombreCategoria(subcategoria);
  const titulo = nombreFiltro || TITULO_CATALOGO;
  useVista(nombreFiltro ? `${nombreFiltro} · Catálogo | El Tradicional` : `${TITULO_CATALOGO} | El Tradicional`, tituloRef);

  // body.is-vista: styles.css le da a la tienda su margen bajo la cabecera.
  useEffect(() => {
    document.body.classList.add('is-vista');
    return () => document.body.classList.remove('is-vista');
  }, []);

  // Al entrar en la tienda manda useVista. Aqui, lo que pasa ya dentro: otra
  // categoria con un enlace (arriba del todo y el foco en el titulo) o Atras y
  // Adelante entre categorias (el foco al titulo; si no, se quedaba en body
  // sin decir donde se estaba). Cambiar el filtro a mano no mueve nada.
  // Con Atras y Adelante entre categorias se vuelve a donde se estaba en esa
  // entrada, como hacia el navegador; ahora lo hace la tienda, porque el
  // navegador ya no devuelve el desplazamiento (comun/apertura.js). Se apunta
  // al desplazarse, con la clave de la entrada en la que se esta: la clave
  // cambia antes que los efectos, asi que subir al entrar en otra categoria
  // ya se apunta en la nueva.
  const claveActual = useRef(location.key);
  useLayoutEffect(() => { claveActual.current = location.key; }, [location.key]);
  useEffect(() => {
    const apuntar = () => { posicionTienda.set(claveActual.current, window.scrollY); };
    window.addEventListener('scroll', apuntar, { passive: true });
    return () => window.removeEventListener('scroll', apuntar);
  }, []);

  const ultimaClave = useRef(location.key);
  useEffect(() => {
    if (ultimaClave.current === location.key) return;
    ultimaClave.current = location.key;
    // La entrada guarda su state.entrar tambien al volver a ella con Atras:
    // eso no es entrar con el enlace.
    const vuelta = tipoNavegacion === 'POP';
    const entrar = location.state?.entrar && !vuelta;
    if (!entrar && !vuelta) return;
    if (entrar) window.scrollTo({ top: 0, behavior: movimientoReducido() ? 'instant' : 'smooth' });
    else window.scrollTo({ top: posicionTienda.get(location.key) ?? 0, behavior: 'instant' });
    tituloRef.current?.focus({ preventScroll: true });
  }, [location.key, location.state, tipoNavegacion]);

  // ---- Lo que se toca --------------------------------------------------
  const alSub = (sub) => {
    animarEntrada();
    navegar(`/tienda-${sub === 'todas' ? 'catalogo' : sub}`, { replace: true });
  };
  const alOrden = (valor) => { setOrden(valor); animarEntrada(); avisar(ORDEN_DICHO[valor] || ''); };
  const alSolo = (solo) => { setSoloDisponibles(solo); animarEntrada(); };
  // Mientras se escribe no se anima: las fichas entrando a cada tecla marean.
  const alBuscar = (texto) => setBusqueda(texto);
  const alVolver = () => navegar('/', { state: { entrar: true } });

  const alElegir = useCallback((producto, i) => {
    setElegidos((antes) => ({ ...antes, [producto.nombre]: i }));
    const t = producto.tamanos[i];
    avisar(`${producto.nombre} ${t.valor}, ${dinero(t.precio)}.`);
  }, [avisar]);

  // Encima del pie, la franja de las espigas (la parte de acento de la vista).
  return (
    <>
      <section id="catalogo" className="catalog section-pad vista-tienda">
        <div className="container">
          <VistaCabeza
            visible
            titulo={titulo}
            tituloRef={tituloRef}
            subcategoria={subcategoria}
            onSub={alSub}
            busqueda={busqueda}
            onBusqueda={alBuscar}
            orden={orden}
            onOrden={alOrden}
            soloDisponibles={soloDisponibles}
            onSolo={alSolo}
            cuenta={dice}
            vacio={vacio}
            onVolver={alVolver}
          />
          <p className="catalog-status" role="status" aria-live="polite">{dicho}</p>
          <div ref={gridRef} className="product-grid">
            {productos.map((p) => {
              const i = cuadro.visibles.get(p);
              const visible = i !== undefined;
              const entrando = Boolean(entrada) && visible;
              return (
                <FichaProducto
                  key={p.nombre}
                  producto={p}
                  vista="cuadricula"
                  visible={visible}
                  orden={cuadro.puesto.get(p)}
                  retraso={entrando ? retrasoDiagonal(i, entrada.columnas) : undefined}
                  entrando={entrando}
                  elegido={elegidos[p.nombre] ?? 0}
                  onElegir={alElegir}
                />
              );
            })}
          </div>
        </div>
      </section>
      <Franja className="franja-pie" />
    </>
  );
}

export default Catalogo;
