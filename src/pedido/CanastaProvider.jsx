// ---- La canasta en pantalla: lo que comparten sus piezas ----------------
// El boton de la cabecera, el panel, la barra de deshacer y el control de
// cantidad de cada ficha viven en sitios distintos de la pagina, pero se
// pasan el foco y la animacion entre ellos. Aqui esta lo que en cart.js eran
// variables del modulo: si el panel esta abierto, donde esta cada boton y a
// donde va el foco despues de quitar o de deshacer.
//
// El pedido en si no esta aqui: es de PedidoProvider (estado/).
import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { usePedido } from '../estado/PedidoProvider.jsx';
import { unidades, productos } from '../estado/pedido.js';
import { useAvisos } from '../comun/Avisos.jsx';
import { movimientoReducido } from '../comun/useMovimientoReducido.js';

const ContextoCanasta = createContext(null);

function CanastaProvider({ children }) {
  const { hacer } = usePedido();
  const avisar = useAvisos();
  const [abierta, setAbierta] = useState(false);
  // A que boton de que linea del panel tiene que ir el foco en cuanto se
  // pinte: { id, que } con que = 'si' | 'menos' | 'quitar' | 'mas'. Las lineas
  // se rehacen al cambiar, y el boton que tenia el foco puede no existir ya.
  const [focoLinea, setFocoLinea] = useState(null);
  // La hoja de "Inicia sesion para pagar" ({ tiene } o null). Vive aqui y
  // no en Canasta porque la barra de deshacer tambien la mira: la hoja es
  // modal, y mientras esta arriba la barra sale del cerco del foco.
  const [pide, setPide] = useState(null);

  // Atras o Adelante con la canasta abierta es irse a otra pagina: el panel
  // se cierra en el mismo pintado que trae la vista nueva, y asi lo de detras
  // ya no esta inert cuando esa vista pide el foco para su titulo. Vale para
  // cualquier cambio de direccion: los que salen de la propia canasta ("Ir a
  // pagar", "Ver la vitrina") ya la cierran antes.
  const { key: claveRuta } = useLocation();
  const [rutaAntes, setRutaAntes] = useState(claveRuta);
  if (claveRuta !== rutaAntes) {
    setRutaAntes(claveRuta);
    if (abierta) setAbierta(false);
  }
  // Cerrada, la hoja no sobrevive: al volver se ve la canasta como estaba.
  if (!abierta && pide) setPide(null);

  const botonRef = useRef(null);
  const barraRef = useRef(null);
  const deshacerRef = useRef(null);
  const tituloRef = useRef(null);
  // El "mas" de cada ficha, para devolverle el foco. Cada una dice si es la
  // de un id: lo que viene en tamanos cambia de id al cambiar el tamano.
  const fichas = useRef(new Set());
  const abiertaAhora = useRef(abierta);
  useLayoutEffect(() => { abiertaAhora.current = abierta; }, [abierta]);

  const abrir = useCallback(() => setAbierta(true), []);
  const cerrar = useCallback(() => setAbierta(false), []);
  const enfocarLinea = useCallback((id, que) => setFocoLinea(id ? { id, que } : null), []);
  const registrarFicha = useCallback((ficha) => {
    fichas.current.add(ficha);
    return () => fichas.current.delete(ficha);
  }, []);
  const masDeFicha = (id) => [...fichas.current].find((f) => f.coincide(id))?.boton.current;

  // ---- "Ya esta en la canasta" ---------------------------------------
  // La foto vuela de la ficha al boton de la canasta y la canasta da un
  // saltito al recibirla. Va por el DOM y no por estado: se mueve a cada
  // cuadro. La clase del boton no la pone React (su className no cambia), asi
  // que quitarla y ponerla aqui no se pisa al repintar.
  const latir = () => {
    const boton = botonRef.current;
    if (!boton) return;
    // Quitar y volver a poner la clase reinicia la animacion.
    boton.classList.remove('is-latido');
    void boton.offsetWidth;
    boton.classList.add('is-latido');
  };
  const volar = useCallback((img) => {
    const destino = botonRef.current?.getBoundingClientRect();
    const origen = img?.getBoundingClientRect();
    if (movimientoReducido() || !origen?.width || !destino?.width) { latir(); return; }
    const lado = 76;
    const bolita = document.createElement('span');
    bolita.className = 'vuela-canasta';
    bolita.setAttribute('aria-hidden', 'true');
    bolita.style.backgroundImage = `url("${img.currentSrc || img.src}")`;
    bolita.style.left = `${origen.left + origen.width / 2 - lado / 2}px`;
    bolita.style.top = `${origen.top + origen.height / 2 - lado / 2}px`;
    document.body.append(bolita);
    const dx = destino.left + destino.width / 2 - (origen.left + origen.width / 2);
    const dy = destino.top + destino.height / 2 - (origen.top + origen.height / 2);
    // Sale un poco hacia arriba, como lanzada, y cae en la canasta haciendose
    // pequena.
    const vuelo = bolita.animate([
      { transform: 'translate(0, 0) scale(.6)', opacity: 0 },
      { transform: 'translate(0, -24px) scale(1.1)', opacity: 1, offset: 0.18 },
      { transform: `translate(${dx * 0.55}px, ${dy * 0.55 - 70}px) scale(.75)`, opacity: 1, offset: 0.6 },
      { transform: `translate(${dx}px, ${dy}px) scale(.25)`, opacity: 0.7 },
    ], { duration: 750, easing: 'cubic-bezier(.45, 0, .55, 1)' });
    vuelo.onfinish = () => { bolita.remove(); latir(); };
    vuelo.oncancel = () => bolita.remove();
  }, []);

  // ---- Deshacer --------------------------------------------------------
  // La barra se esconde con el foco dentro, asi que hay que recogerlo: va al
  // "mas" de lo repuesto. Con el panel abierto el catalogo esta inert y no
  // admite el foco, asi que ahi es el "mas" de la linea, dentro del panel.
  const deshacer = useCallback((borrado) => {
    if (!borrado) return;
    const despues = hacer({ tipo: 'reponer' });
    const [id, linea] = borrado.lineas[0];
    const quien = borrado.lineas.length === 1 ? `${linea.nombre} vuelve` : 'Todo vuelve';
    avisar(`${quien} a la canasta. ${productos(unidades(despues.lineas))} en la canasta.`);
    if (abiertaAhora.current) enfocarLinea(id, 'mas');
    else masDeFicha(id)?.focus();
  }, [hacer, avisar, enfocarLinea]);

  // A los 12 s la barra se va sola. Si tenia el foco, se lo pasa al titulo
  // del panel o al "mas" de la ficha de lo quitado, para no dejarlo en el body.
  const olvidar = useCallback((borrado) => {
    const teniaFoco = barraRef.current?.contains(document.activeElement);
    hacer({ tipo: 'olvidar' });
    if (!teniaFoco) return;
    if (abiertaAhora.current) tituloRef.current?.focus();
    else masDeFicha(borrado?.lineas[0]?.[0])?.focus();
  }, [hacer]);

  const valor = useMemo(() => ({
    abierta, abrir, cerrar, pide, setPide,
    botonRef, barraRef, deshacerRef, tituloRef,
    focoLinea, enfocarLinea, registrarFicha,
    volar, deshacer, olvidar,
  }), [abierta, abrir, cerrar, pide, focoLinea, enfocarLinea, registrarFicha, volar, deshacer, olvidar]);

  return <ContextoCanasta.Provider value={valor}>{children}</ContextoCanasta.Provider>;
}

const useCanasta = () => useContext(ContextoCanasta);

export { CanastaProvider, useCanasta };
