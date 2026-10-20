// ---- El catalogo (#catalogo) --------------------------------------------
// En la portada es la fila de "Los mas pedidos"; en #/tienda-catalogo y
// #/tienda-<categoria> es la vista de catalogo, en cuadricula y con sus mandos.
// Es la misma seccion y las mismas fichas en los dos casos, como en
// js/catalogo/view.js, del que esto sigue las reglas una por una:
//   - Entrar en una vista (enlace, "Ver el menu", "Volver al inicio") la deja
//     limpia: orden recomendado, todos, sin busqueda; sube arriba y el foco va
//     al titulo. Volver con Atras no la limpia: es volver a donde se estaba.
//   - Cambiar "Filtrar por" a mano cambia la direccion con replace, para que
//     Atras saque del catalogo en vez de deshacer filtros de uno en uno.
//   - El orden y "Mostrar" se recuerdan en sessionStorage (storage.js).
//   - Ordenar cambia la propiedad CSS order, no el orden de las fichas.
//   - Al cambiar de vista, las fichas se atenuan 160 ms y entran escalonadas.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { dinero } from '@raiz/js/comun/state.js';
import { recordarVista, vistaRecordada } from '@raiz/js/comun/storage.js';
import { catalogo } from '../servicios/catalogo.js';
import { useAvisos } from '../comun/Avisos.jsx';
import { useAparecer } from '../comun/useAparecer.js';
import { movimientoReducido } from '../comun/useMovimientoReducido.js';
import { irASeccionSiSeVe } from '../comun/secciones.js';
import { clases } from '../comun/useCargaImagen.js';
import { Chevron } from '../comun/iconos.jsx';
import FichaProducto from './FichaProducto.jsx';
import VistaCabeza from './VistaCabeza.jsx';
import { useFila } from './useFila.js';
import { vistaDe, filtroDe } from './categorias.js';

const { productos } = catalogo;
const ORDENES = ['recomendados', 'precio-asc', 'precio-desc', 'nombre'];
// "Todo el catalogo" no es una de las tres de Tienda, pero es una vista con
// nombre y direccion propia.
const TITULO_CATALOGO = 'Todo el catálogo';

// Se busca sin tildes ni mayusculas: quien escribe "limon" quiere el de limón.
const plano = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

// El orden y "solo disponibles" los dice la pestana, si lo que recordaba es de
// esta misma vista. Lo recordado se comprueba contra las opciones que existen:
// es un dato del navegador y se puede editar a mano.
const recordado = (vista) => {
  const antes = vistaRecordada();
  if (!antes || antes.categoria !== vista) return { orden: 'recomendados', solo: false };
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

// En la portada solo los mas pedidos y que se puedan pedir hoy: es un
// escaparate. Si no hubiera ninguno marcado, salen todos.
const hayDestacados = productos.some((p) => p.destacado);
const enPortada = (p) => !hayDestacados || (p.destacado && p.disponible);

function Catalogo({ categoria }) {
  const vista = vistaDe(categoria);
  // El filtro de categoria no se guarda en ningun sitio: lo dice la direccion.
  const subcategoria = filtroDe(categoria);
  const location = useLocation();
  const navegar = useNavigate();
  const avisar = useAvisos();

  const [orden, setOrden] = useState(() => recordado(vista).orden);
  const [soloDisponibles, setSoloDisponibles] = useState(() => recordado(vista).solo);
  const [busqueda, setBusqueda] = useState('');
  // El tamano elegido de cada producto, por nombre. Vive aqui y no en la ficha
  // porque ordenar por precio usa el del tamano que se ve.
  const [elegidos, setElegidos] = useState({});

  // Entrar en una vista la deja limpia. Se ajusta mientras se pinta, al ver
  // una direccion nueva, y no en un efecto: asi no hay un cuadro con lo de antes.
  const [claveVista, setClaveVista] = useState(location.key);
  if (claveVista !== location.key) {
    setClaveVista(location.key);
    if (location.state?.entrar) {
      setOrden('recomendados');
      setSoloDisponibles(false);
      setBusqueda('');
    }
  }

  // ---- El cambio de vista, con su salida ------------------------------
  // La vista que pintan las fichas va 160 ms por detras de la direccion: los
  // productos actuales se atenuan (is-filtering) y solo despues entra la vista
  // nueva. La cabeza y el titulo cambian en seguida, como en view.js.
  const [vistaPintada, setVistaPintada] = useState(vista);
  const [filtrando, setFiltrando] = useState(false);
  const [entrada, setEntrada] = useState(null);
  const gridRef = useRef(null);
  const zonaRef = useRef(null);
  const avanceRef = useRef(null);
  const tituloRef = useRef(null);

  // Las columnas se miden antes de cambiar nada, como en view.js.
  const animarEntrada = useCallback(() => {
    if (movimientoReducido()) return;
    setEntrada({ columnas: contarColumnas(gridRef.current) });
  }, []);

  useLayoutEffect(() => {
    if (vista === vistaPintada) { setFiltrando(false); return undefined; }
    // Al cambiar, la fila vuelve a su principio: si no, se entraria a la
    // mitad de lo nuevo sin saber que hay detras.
    if (gridRef.current) gridRef.current.scrollLeft = 0;
    if (movimientoReducido()) {
      setEntrada(null);
      setVistaPintada(vista);
      return undefined;
    }
    setFiltrando(true);
    const reloj = setTimeout(() => {
      animarEntrada();
      setVistaPintada(vista);
    }, 160);
    return () => clearTimeout(reloj);
  }, [vista, vistaPintada, animarEntrada]);

  // La entrada escalonada se quita al acabar, para que no se repita al volver
  // a pintar. 780 ms es lo que tarda la ultima ficha en llegar.
  useEffect(() => {
    if (!entrada) return undefined;
    const reloj = setTimeout(() => setEntrada(null), 780);
    return () => clearTimeout(reloj);
  }, [entrada]);

  // ---- Que se ve y en que orden ----------------------------------------
  const cuadro = useMemo(() => {
    const enCatalogo = vistaPintada === 'catalogo';
    const deLaCategoria = vistaPintada === 'todos' ? productos.filter(enPortada) : productos;
    const precioDe = (p) => p.tamanos[elegidos[p.nombre] ?? 0]?.precio ?? p.precio;
    const porOrden = [...deLaCategoria].sort((a, b) => {
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
      const deAqui = vistaPintada === 'todos' ? enPortada(p) : true;
      // El filtro solo manda en el catalogo; en el mostrador no hay con que tocarlo.
      const pasaFiltro = vistaPintada === 'todos' || !soloDisponibles || p.disponible;
      const pasaSub = !enCatalogo || subcategoria === 'todas' || p.categoria === subcategoria;
      const pasaBusqueda = !enCatalogo || !buscado || plano(p.nombre).includes(buscado);
      if (!(deAqui && pasaFiltro && pasaSub && pasaBusqueda)) return;
      visibles.set(p, visibles.size);
      if (!p.disponible) agotados += 1;
    });
    return { total: deLaCategoria.length, puesto, visibles, agotados, enCatalogo };
  }, [vistaPintada, orden, soloDisponibles, subcategoria, busqueda, elegidos]);

  const n = cuadro.visibles.size;
  // Dentro del catalogo lo util es saber cuantos se ven de los que hay: con un
  // filtro puesto, un numero suelto no dice si falta algo.
  const dice = vistaPintada === 'todos'
    ? ''
    : `Mostrando ${n} de ${cuadro.total} producto${cuadro.total === 1 ? '' : 's'}`;
  let estado;
  if (catalogo.error) {
    estado = 'No se pudo cargar el catálogo. Recarga la página; si sigue sin salir, escríbenos y te decimos qué hay hoy.';
  } else if (vistaPintada === 'todos') {
    // En la portada, el aviso dice cuantos hay en total: si no, la fila
    // parece el catalogo entero.
    estado = `Los ${n} más pedidos. En todo el catálogo hay ${productos.length}.`;
  } else {
    // Llamar "disponible" a lo que esta agotado seria mentira.
    const plural = n === 1 ? '' : 's';
    const cuantos = cuadro.agotados
      ? `${n} producto${plural}, ${cuadro.agotados} agotado${cuadro.agotados === 1 ? '' : 's'}`
      : `${n} producto${plural} disponible${plural}`;
    estado = `${dice}. ${cuantos} en esta categoría.`;
  }
  let vacio = '';
  if (cuadro.enCatalogo && n === 0) {
    vacio = busqueda
      ? `No encontramos nada que se llame «${busqueda.trim()}». Prueba con otra palabra o quita algún filtro.`
      : 'No hay productos con estos filtros.';
  }

  // ---- Lo que se recuerda y lo que va fuera de la seccion --------------
  // Donde estabas se apunta en cada cambio, no al salir: de la pagina se sale
  // cerrandola, y no hay un momento fiable para guardar al final.
  useEffect(() => {
    recordarVista({ categoria: vistaPintada, orden, soloDisponibles, subcategoria });
  }, [vistaPintada, orden, soloDisponibles, subcategoria]);

  // La vista aparta la portada y la historia (body.is-vista en styles.css) y
  // le da su nombre a la pestana.
  useEffect(() => {
    const enVista = vista !== 'todos';
    document.body.classList.toggle('is-vista', enVista);
    document.title = enVista ? `${TITULO_CATALOGO} | El Tradicional` : 'El Tradicional | Panadería & Pastelería';
    return () => document.body.classList.remove('is-vista');
  }, [vista]);

  // Al entrar: arriba del todo y el foco en el titulo de la vista. Con una
  // seccion pedida (Nosotros desde la vista), se espera a que la portada este
  // pintada para bajar a ella: antes, la cuadricula aun mide lo que media.
  const ultimaClave = useRef(location.key);
  const seccionPendiente = useRef(null);
  useEffect(() => {
    if (ultimaClave.current === location.key) return;
    ultimaClave.current = location.key;
    const { entrar, seccion } = location.state || {};
    if (seccion) { seccionPendiente.current = seccion; return; }
    if (!entrar) return;
    window.scrollTo({ top: 0, behavior: movimientoReducido() ? 'auto' : 'smooth' });
    if (vista !== 'todos') tituloRef.current?.focus({ preventScroll: true });
  }, [location.key, location.state, vista]);
  useEffect(() => {
    if (!seccionPendiente.current || vistaPintada !== vista) return;
    const id = seccionPendiente.current;
    seccionPendiente.current = null;
    irASeccionSiSeVe(id);
  }, [vistaPintada, vista, location.key]);

  // ---- Lo que se toca --------------------------------------------------
  const alSub = (sub) => {
    animarEntrada();
    navegar(`/tienda-${sub === 'todas' ? 'catalogo' : sub}`, { replace: true });
  };
  const alOrden = (valor) => { setOrden(valor); animarEntrada(); };
  const alSolo = (solo) => { setSoloDisponibles(solo); animarEntrada(); };
  // Mientras se escribe no se anima: las fichas entrando a cada tecla marean.
  const alBuscar = (texto) => setBusqueda(texto);
  const alVolver = () => navegar('/', { state: { entrar: true } });

  const alElegir = useCallback((producto, i) => {
    setElegidos((antes) => ({ ...antes, [producto.nombre]: i }));
    const t = producto.tamanos[i];
    avisar(`${producto.nombre} ${t.valor}, ${dinero(t.precio)}.`);
  }, [avisar]);

  const fila = useFila({
    gridRef, zonaRef, avanceRef, avisar,
    cambio: `${vistaPintada}|${[...cuadro.visibles.keys()].map((p) => p.nombre).join(',')}`,
  });

  const encabezado = useAparecer('reveal');
  const enFila = vistaPintada === 'todos';

  return (
    <section id="catalogo" className="catalog section-pad" tabIndex={-1}>
      <div className="container">
        <VistaCabeza
          visible={vista !== 'todos'}
          titulo={TITULO_CATALOGO}
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
        <div
          ref={encabezado.ref}
          className={clases('section-heading heading-row', encabezado.className)}
          data-motion={encabezado['data-motion']}
          hidden={vista !== 'todos'}
        >
          <div><p className="eyebrow">La vitrina</p><h2>Hecho a mano,<br /><em>como en casa</em></h2></div>
          <p className="section-intro">Todo empieza con harina, agua y tiempo. Elige tu favorito, haz tu pedido y pasa a buscarlo calentito.</p>
        </div>
        <p className="catalog-status" role="status" aria-live="polite">{estado}</p>
        {/* La fila necesita decir que es: sin nombre parecia el catalogo
            entero puesto de lado. Va fuera de la zona para no pasar por debajo
            de las flechas, que estan pegadas a los bordes. */}
        <div className="fila-cabeza">
          <h3 className="fila-rotulo">Los más pedidos</h3>
          {/* En el telefono se ve solo "Ver todo", pero se nombra entero para todos. */}
          <Link className="fila-ver-todo" to="/tienda-catalogo" state={{ entrar: true }} aria-label="Ver todo el catálogo">
            Ver todo<span className="fila-ver-todo-largo"> el catálogo</span> <span aria-hidden="true">→</span>
          </Link>
          <button
            className="fila-pausa"
            type="button"
            aria-pressed={fila.parada}
            aria-label={fila.parada ? 'Reanudar el avance de los más pedidos' : 'Detener el avance de los más pedidos'}
            data-tip={fila.parada ? 'Reanudar' : 'Pausar'}
            onClick={fila.alternarPausa}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
              {fila.parada
                ? <path d="M8 5.5l11 6.5-11 6.5z" />
                : <><rect x="7" y="5.5" width="3.4" height="13" rx="1" /><rect x="13.6" y="5.5" width="3.4" height="13" rx="1" /></>}
            </svg>
          </button>
        </div>
        <div ref={zonaRef} className="fila-zona">
          <div ref={gridRef} className={clases('product-grid', enFila && 'is-fila', filtrando && 'is-filtering')}>
            {productos.map((p) => {
              const i = cuadro.visibles.get(p);
              const visible = i !== undefined;
              const entrando = Boolean(entrada) && visible;
              return (
                <FichaProducto
                  key={p.nombre}
                  producto={p}
                  vista={enFila ? 'fila' : 'cuadricula'}
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
          {/* Las flechas van en un pie debajo de la fila, con una barra entre
              las dos. En la computadora el pie no pinta caja: las flechas
              flotan a los lados y la barra no sale. En el telefono si. */}
          <div className="fila-pie" hidden={!fila.hayFlechas}>
            <button
              className="fila-flecha"
              type="button"
              data-ir="-1"
              hidden={!fila.hayFlechas}
              disabled={fila.alPrincipio}
              aria-label="Ver los productos anteriores"
              data-tip="Anterior"
              onClick={() => fila.irFlecha(-1)}
            >
              <Chevron izquierda />
            </button>
            {/* Es un dibujo de lo que ya cuentan las fichas y las flechas. */}
            <div className="fila-barra" aria-hidden="true"><span ref={avanceRef} className="fila-avance"></span></div>
            <button
              className="fila-flecha"
              type="button"
              data-ir="1"
              hidden={!fila.hayFlechas}
              aria-label={fila.alFinal ? 'Volver al primer producto' : 'Ver más productos'}
              data-tip={fila.alFinal ? 'Volver al principio' : 'Siguiente'}
              onClick={() => fila.irFlecha(1)}
            >
              <Chevron />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Catalogo;
