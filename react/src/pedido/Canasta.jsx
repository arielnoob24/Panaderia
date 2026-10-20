// ---- El panel de la canasta --------------------------------------------
// El aside role="dialog" de cart.js, con sus mismas clases: cabecera con el
// titulo y la X, la lista, "Tu canasta esta vacia" cuando no hay nada, vaciar
// con pregunta, y el pie con el subtotal e "Ir a pagar". Siempre esta montado:
// styles.css lo esconde con visibility y lo desliza con is-open.
//
// Abierto: atrapa el foco (con la barra de deshacer como anexo), Escape o
// tocar el fondo lo cierran, la pagina de detras queda inert y al cerrar el
// foco vuelve a donde estaba.
import { useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { dinero } from '@raiz/js/comun/state.js';
import { usePedido } from '../estado/PedidoProvider.jsx';
import { unidades, productos } from '../estado/pedido.js';
import { useAvisos } from '../comun/Avisos.jsx';
import { useAtraparFoco, apagarDetras } from '../comun/useAtraparFoco.js';
import { movimientoReducido } from '../comun/useMovimientoReducido.js';
import { fotoDeLinea } from '../servicios/catalogo.js';
import { correoGuardado } from '../servicios/guardado.js';
import { useCanasta } from './CanastaProvider.jsx';
import LineaCanasta from './LineaCanasta.jsx';
import PideCuenta from './PideCuenta.jsx';

function Canasta() {
  const { lineas, unidades: n, subtotal, hacer } = usePedido();
  const { abierta, cerrar, barraRef, deshacerRef, tituloRef, enfocarLinea } = useCanasta();
  const avisar = useAvisos();

  // Que linea espera un si o un no ({ id, desde }), si se pregunta por
  // vaciar, y la hoja de la cuenta ({ tiene } o null).
  const [porConfirmar, setPorConfirmar] = useState(null);
  const [preguntaVaciar, setPreguntaVaciar] = useState(false);
  const [pide, setPide] = useState(null);
  // Una pregunta sin contestar no sobrevive al cierre: al volver, todo se ve
  // como estaba y no con un "¿lo quitamos?" de la visita anterior.
  if (!abierta && (porConfirmar || preguntaVaciar || pide)) {
    setPorConfirmar(null);
    setPreguntaVaciar(false);
    setPide(null);
  }

  const panelRef = useRef(null);
  const cerrarRef = useRef(null);
  const vaciarRef = useRef(null);
  const vaciarSiRef = useRef(null);
  const enviarRef = useRef(null);
  const principalRef = useRef(null);
  const ultimoFoco = useRef(null);
  const estabaAbierta = useRef(false);

  // Abrir y cerrar: el foco, el desplazamiento de la pagina y lo de detras.
  // Antes de pintar, para que el foco no se pierda un cuadro.
  useLayoutEffect(() => {
    if (abierta === estabaAbierta.current) return;
    estabaAbierta.current = abierta;
    if (abierta) {
      ultimoFoco.current = document.activeElement;
      document.body.style.overflow = 'hidden';
      apagarDetras(panelRef.current, true);
      cerrarRef.current?.focus();
    } else {
      document.body.style.overflow = '';
      // Se enciende antes de devolver el foco: a lo apagado no se le puede dar.
      apagarDetras(panelRef.current, false);
      ultimoFoco.current?.focus();
    }
  }, [abierta]);

  useAtraparFoco(abierta, [panelRef, barraRef], cerrar);

  // ---- Quitar una linea, con pregunta ----------------------------------
  const pedirQuitar = (id, desde) => {
    const l = lineas.find(([otro]) => otro === id)?.[1];
    if (!l) return;
    setPorConfirmar({ id, desde });
    // El foco va al "Si, quitar": quien pulso el basurero o la X ya dijo lo
    // que queria, y la pregunta esta para que lo vea.
    enfocarLinea(id, 'si');
    avisar(l.cantidad === 1
      ? `¿Quitar ${l.nombre} de la canasta?`
      : `¿Quitar las ${l.cantidad} unidades de ${l.nombre} de la canasta?`);
  };
  const cancelarQuitar = (id) => {
    if (porConfirmar?.id !== id) return;
    const nombre = lineas.find(([otro]) => otro === id)?.[1].nombre;
    setPorConfirmar(null);
    // De vuelta al boton del que salio la pregunta.
    enfocarLinea(id, porConfirmar.desde);
    avisar(`${nombre || 'El producto'} sigue en la canasta.`);
  };
  const confirmarQuitar = (id) => {
    const l = lineas.find(([otro]) => otro === id)?.[1];
    setPorConfirmar(null);
    if (!l) return;
    let despues;
    flushSync(() => { despues = hacer({ tipo: 'quitar', id }); });
    avisar(`Quitaste ${l.nombre}. ${productos(unidades(despues.lineas))} en la canasta.`);
    // La linea ya no existe: el foco pasa a "Deshacer", que acaba de aparecer.
    deshacerRef.current?.focus();
  };

  const alMenos = (id, l) => {
    if (l.cantidad === 1) { pedirQuitar(id, 'menos'); return; }
    hacer({ tipo: 'cambiar', id, cantidad: l.cantidad - 1 });
  };
  const alMas = (id, l) => hacer({ tipo: 'agregar', id, nombre: l.nombre, precio: l.precio });

  // ---- Vaciar, con pregunta y deshacer ---------------------------------
  const alVaciar = () => {
    flushSync(() => setPreguntaVaciar(true));
    // Como en la X de cada linea: el foco va al "Si", que es lo que se pidio.
    vaciarSiRef.current?.focus();
    avisar('¿Vaciar la canasta?');
  };
  const noVaciar = () => {
    flushSync(() => setPreguntaVaciar(false));
    vaciarRef.current?.focus();
  };
  const siVaciar = () => {
    flushSync(() => {
      setPreguntaVaciar(false);
      setPorConfirmar(null);
      hacer({ tipo: 'vaciar' });
    });
    avisar('Vaciaste la canasta.');
    deshacerRef.current?.focus();
  };
  // Escape contesta que no y se queda aqui: si subiera, cerraria el panel.
  const teclaVaciar = (e) => {
    if (e.key !== 'Escape') return;
    e.stopPropagation();
    noVaciar();
  };

  // ---- Ir a pagar ------------------------------------------------------
  // Pagar pide una cuenta con el correo verificado. En la fase 3 no hay
  // cuenta, asi que siempre sale el aviso (PideCuenta.jsx).
  const irAPagar = () => {
    if (!lineas.length) return;
    flushSync(() => setPide({ tiene: Boolean(correoGuardado()) }));
    principalRef.current?.focus();
  };
  const volverDePide = () => {
    flushSync(() => setPide(null));
    enviarRef.current?.focus();
  };

  // "Ver la vitrina": se cierra y se baja al catalogo.
  const verVitrina = () => {
    cerrar();
    document.getElementById('catalogo')?.scrollIntoView({ behavior: movimientoReducido() ? 'auto' : 'smooth' });
  };

  const hayAlgo = lineas.length > 0;
  const cuantos = productos(n);

  return (
    <>
      <div className={abierta ? 'canasta-fondo is-open' : 'canasta-fondo'} onClick={cerrar}></div>
      <aside
        ref={panelRef}
        className={abierta ? 'canasta-panel is-open' : 'canasta-panel'}
        role="dialog"
        aria-modal="true"
        aria-labelledby="canasta-titulo"
      >
        <div className="canasta-cabecera" inert={Boolean(pide)}>
          <div className="canasta-cabecera-titulo">
            <h2 ref={tituloRef} id="canasta-titulo" tabIndex={-1}>Tu canasta</h2>
            <span className="canasta-cabecera-cuenta" hidden={!hayAlgo}>{cuantos}</span>
          </div>
          <button ref={cerrarRef} className="canasta-cerrar" type="button" aria-label="Cerrar la canasta" onClick={cerrar}>×</button>
        </div>
        <div className="canasta-pasos" inert={Boolean(pide)}>
          <section className="canasta-paso" data-paso="canasta">
            <div className="canasta-cuerpo">
              <ul className="canasta-lista">
                {lineas.map(([id, l]) => (
                  <LineaCanasta
                    key={id}
                    id={id}
                    linea={l}
                    foto={fotoDeLinea(l.nombre)}
                    confirmando={porConfirmar?.id === id}
                    onMenos={alMenos}
                    onMas={alMas}
                    onQuitar={pedirQuitar}
                    onSi={confirmarQuitar}
                    onNo={cancelarQuitar}
                  />
                ))}
              </ul>
              {/* Vacia no se queda en un renglon gris: dice que hacer y lleva a hacerlo. */}
              <div className="canasta-vacio" hidden={hayAlgo}>
                <span className="canasta-vacio-dibujo" aria-hidden="true"></span>
                <p className="canasta-vacio-titulo">Tu canasta está vacía</p>
                <p className="canasta-vacio-dicho">Elige algo de la vitrina y aparecerá aquí.</p>
                <button className="canasta-vacio-ir" type="button" onClick={verVitrina}>Ver la vitrina</button>
              </div>
              <div className="canasta-vaciar-zona" hidden={!hayAlgo}>
                <button ref={vaciarRef} className="canasta-vaciar" type="button" hidden={preguntaVaciar} onClick={alVaciar}>Vaciar la canasta</button>
                <div className="canasta-vaciar-pregunta" hidden={!preguntaVaciar} onKeyDown={teclaVaciar}>
                  <p className="canasta-confirma-dicho">¿Quitamos todo lo que hay en la canasta?</p>
                  <div className="canasta-confirma">
                    <button ref={vaciarSiRef} className="canasta-confirma-si canasta-vaciar-si" type="button" onClick={siVaciar}>Sí, vaciar</button>
                    <button className="canasta-confirma-no canasta-vaciar-no" type="button" onClick={noVaciar}>Cancelar</button>
                  </div>
                </div>
              </div>
            </div>
            <div className="canasta-pie">
              <div className="canasta-total">
                <span>Subtotal <small className="canasta-total-cuenta">{hayAlgo ? `(${cuantos})` : ''}</small></span>
                <strong>{dinero(subtotal)}</strong>
              </div>
              <button
                ref={enviarRef}
                className="button button-yellow canasta-enviar"
                type="button"
                disabled={!hayAlgo}
                aria-disabled={!hayAlgo}
                onClick={irAPagar}
              >
                Ir a pagar <span aria-hidden="true">→</span>
              </button>
              <p className="canasta-nota">Después eliges cómo lo recibes y cómo pagas.</p>
            </div>
          </section>
        </div>
        <PideCuenta pide={pide} principalRef={principalRef} onVolver={volverDePide} />
      </aside>
    </>
  );
}

export default Canasta;
