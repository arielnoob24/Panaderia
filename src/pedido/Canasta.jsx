// ---- El panel de la canasta --------------------------------------------
// El panel role="dialog" de cart.js, con sus mismas clases: cabecera con el
// titulo y la X, la lista, "Tu canasta esta vacia" cuando no hay nada, vaciar
// con pregunta, y el pie con el subtotal e "Ir a pagar". Siempre esta montado:
// styles.css lo esconde con visibility y lo desliza con is-open.
//
// Abierto: atrapa el foco (con la barra de deshacer como anexo), Escape o
// tocar el fondo lo cierran, la pagina de detras queda inert y al cerrar el
// foco vuelve a donde estaba.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { AnimatePresence } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { dinero } from '../servicios/state.js';
import { usePedido } from '../estado/PedidoProvider.jsx';
import { unidades, productos, enTope, avisoTope } from '../estado/pedido.js';
import { useAvisos } from '../comun/Avisos.jsx';
import { useAtraparFoco, apagarDetras } from '../comun/useAtraparFoco.js';
import { precargar } from '../comun/cargaPorPartes.js';
import { fotoDeLinea } from '../servicios/catalogo.js';
import { useSesion } from '../estado/SesionProvider.jsx';
import { useCanasta } from './CanastaProvider.jsx';
import LineaCanasta from './LineaCanasta.jsx';
import PideCuenta from './PideCuenta.jsx';

function Canasta() {
  const { lineas, unidades: n, subtotal, hacer } = usePedido();
  const {
    abierta, cerrar, pide, setPide, botonRef, barraRef, deshacerRef, tituloRef, enfocarLinea,
  } = useCanasta();
  const avisar = useAvisos();
  const sesion = useSesion();
  const navegar = useNavigate();
  const { pathname } = useLocation();

  // Que linea espera un si o un no ({ id, desde }) y si se pregunta por
  // vaciar. La hoja de la cuenta (pide) es de CanastaProvider.
  const [porConfirmar, setPorConfirmar] = useState(null);
  const [preguntaVaciar, setPreguntaVaciar] = useState(false);
  // Una pregunta sin contestar no sobrevive al cierre: al volver, todo se ve
  // como estaba y no con un "¿lo quitamos?" de la visita anterior.
  if (!abierta && (porConfirmar || preguntaVaciar)) {
    setPorConfirmar(null);
    setPreguntaVaciar(false);
  }

  const panelRef = useRef(null);
  const cerrarRef = useRef(null);
  const vaciarRef = useRef(null);
  const vaciarSiRef = useRef(null);
  const enviarRef = useRef(null);
  const principalRef = useRef(null);
  const ultimoFoco = useRef(null);
  const estabaAbierta = useRef(false);
  const recienCerrada = useRef(false);

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
      recienCerrada.current = true;
    }
  }, [abierta]);
  // Cerrada por Atras o Adelante, quien la abrio puede haberse ido con la
  // vista ("Editar la canasta" de #/confirmar) y el foco se queda sin sitio.
  // Entonces va al boton de la canasta, que no se mueve. Es un efecto y no va
  // arriba porque el boton no se ve hasta que la vista que se va quita
  // is-checkout, y porque si la vista que llega pide el foco para su titulo,
  // ya lo tiene y aqui no se toca.
  useEffect(() => {
    if (abierta || !recienCerrada.current) return;
    recienCerrada.current = false;
    // Sin sitio es el body, algo que ya no esta en la pagina o algo del panel
    // recien cerrado (el navegador tarda un cuadro en soltarlo).
    const a = document.activeElement;
    if (!a || a === document.body || !a.isConnected || panelRef.current?.contains(a)) botonRef.current?.focus();
  }, [abierta, botonRef]);

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

  // El mas y el menos de una linea dicen como queda, como la ficha. El foco
  // se queda en el boton pulsado: la linea no se rehace.
  const decirComoQueda = (despues, id, nombre) => {
    const queda = despues.lineas.find(([otro]) => otro === id)?.[1].cantidad;
    avisar(`${queda} de ${nombre}. ${productos(unidades(despues.lineas))} en la canasta.`);
  };
  const alMenos = (id, l) => {
    if (l.cantidad === 1) { pedirQuitar(id, 'menos'); return; }
    decirComoQueda(hacer({ tipo: 'cambiar', id, cantidad: l.cantidad - 1 }), id, l.nombre);
  };
  const alMas = (id, l) => {
    // En el tope no suma: dice por que (el boton lleva aria-disabled).
    if (enTope(l.cantidad)) { avisar(avisoTope(l.nombre)); return; }
    decirComoQueda(hacer({ tipo: 'agregar', id, nombre: l.nombre, precio: l.precio }), id, l.nombre);
  };

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
  // Pagar pide una cuenta con el correo verificado: el comprobante va a ese
  // correo. Sin ella sale la hoja de "Inicia sesion para pagar" dentro de
  // la canasta (PideCuenta.jsx), sin echar a nadie a otra parte. Con ella, la
  // canasta se cierra y se va a #/confirmar; si ya se estaba ahi (se abrio con
  // "Editar la canasta"), solo se cierra, sin apilar otra entrada en Atras.
  const irAPagar = () => {
    if (!lineas.length) return;
    if (sesion.puedePedir) {
      cerrar();
      if (pathname !== '/confirmar') navegar('/confirmar');
      return;
    }
    flushSync(() => setPide({ tiene: sesion.hayCuenta }));
    principalRef.current?.focus();
  };
  // #/confirmar y la cuenta van en su propio archivo (comun/cargaPorPartes.js):
  // con el puntero o el foco en "Ir a pagar" se piden los dos, porque sin
  // sesion se pasa por la cuenta antes de pagar.
  const pedirPago = () => precargar('pago', 'cuenta');
  const volverDePide = () => {
    flushSync(() => setPide(null));
    enviarRef.current?.focus();
  };

  // "Ver la vitrina" lleva al catalogo entero, como "Ver el menu": la vista
  // de catalogo sube arriba y deja el foco en su titulo (Catalogo.jsx).
  const verVitrina = () => {
    cerrar();
    navegar('/tienda-catalogo', { state: { entrar: true } });
  };

  const hayAlgo = lineas.length > 0;
  const cuantos = productos(n);

  return (
    <>
      <div className={abierta ? 'canasta-fondo is-open' : 'canasta-fondo'} onClick={cerrar}></div>
      {/* div y no aside: es un dialogo; un aside con role="dialog" no vale (axe). */}
      <div
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
                {/* Las lineas que se van terminan su salida antes de irse del
                    todo (LineaCanasta.jsx); al abrir la canasta no se anima. */}
                <AnimatePresence initial={false}>
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
                </AnimatePresence>
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
                onPointerEnter={pedirPago}
                onFocus={pedirPago}
              >
                Ir a pagar <span aria-hidden="true">→</span>
              </button>
              <p className="canasta-nota">Después eliges cómo lo recibes y cómo pagas.</p>
            </div>
          </section>
        </div>
        <PideCuenta pide={pide} principalRef={principalRef} onVolver={volverDePide} />
      </div>
    </>
  );
}

export default Canasta;
