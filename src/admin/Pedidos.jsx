// ---- Panel, Pedidos: los de todos los clientes -----------------------------
// El mas nuevo arriba. "Por atender" (lo de siempre) o "Todos". Cada pedido
// ensena quien lo hizo, que lleva y como se entrega, y un boton para pasarlo
// al estado siguiente: Pendiente de pago -> Pagado -> En preparacion -> Listo
// para retirar (o En camino, si es a domicilio) -> Entregado. Lo que no se
// puede deshacer (Entregado y Cancelado) pide confirmar: aparecen "Sí" y "No,
// dejarlo", el foco va al "Sí", Escape o salir del grupo lo deja como estaba y
// a los 8 s se retira solo. Las reglas las vuelve a poner la base
// (FN_ADMIN_PEDIDO_ESTADO): aqui solo se ofrece lo que tiene sentido.
//
// El foco no se pierde: lo ocupado es aria-disabled y no disabled, y cuando un
// pedido se cierra y sale de la lista el foco va al titulo de la seccion.
import { useEffect, useRef, useState } from 'react';
import { dinero } from '../servicios/state.js';
import { marcaBonita } from '../servicios/storage.js';
import { pedirApi } from '../servicios/api.js';
import { useAvisos } from '../comun/Avisos.jsx';
import { useCarga, textoDeFallo } from './useCarga.js';
import Seccion from './Seccion.jsx';

const FINALES = ['Entregado', 'Cancelado'];
const ESPERA_CONFIRMAR = 8000;

// El estado que sigue, o '' si el pedido ya esta cerrado.
function siguiente(p) {
  switch (p.estado) {
    case 'Pendiente de pago': return 'Pagado';
    case 'Pagado': return 'En preparación';
    case 'En preparación': return p.modo === 'domicilio' ? 'En camino' : 'Listo para retirar';
    case 'Listo para retirar':
    case 'En camino': return 'Entregado';
    default: return '';
  }
}

// Cómo se ve cada estado: abierto (ámbar), esperando al cliente (horno),
// entregado (con ✓) o cancelado (con ✕ y tachado). Siempre va escrito.
const claseDeEstado = (estado) => {
  if (estado === 'Entregado') return 'is-entregado';
  if (estado === 'Cancelado') return 'is-cancelado';
  if (estado === 'Listo para retirar' || estado === 'En camino') return 'is-espera';
  return 'is-abierto';
};

function Pedido({ p, alCambiar }) {
  const avisar = useAvisos();
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState('');
  // Lo que espera confirmacion: { estado, origen } ('avanzar' o 'cancelar').
  const [confirmando, setConfirmando] = useState(null);
  const avanzarRef = useRef(null);
  const cancelarRef = useRef(null);
  const confirmarRef = useRef(null);
  const devolver = useRef(null);
  const sigue = siguiente(p);

  // Al armar la confirmacion el foco va al "Sí"; al dejarla (Escape, "No" o el
  // tiempo) vuelve al boton que la armo.
  useEffect(() => {
    if (confirmando) { confirmarRef.current?.focus(); return undefined; }
    if (devolver.current) {
      (devolver.current === 'cancelar' ? cancelarRef : avanzarRef).current?.focus();
      devolver.current = null;
    }
    return undefined;
  }, [confirmando]);
  useEffect(() => {
    if (!confirmando) return undefined;
    const id = setTimeout(() => { devolver.current = confirmando.origen; setConfirmando(null); }, ESPERA_CONFIRMAR);
    return () => clearTimeout(id);
  }, [confirmando]);

  const cambiar = async (estado) => {
    if (trabajando) return;
    setTrabajando(true);
    setError('');
    setConfirmando(null);
    try {
      const nuevo = await pedirApi(`/admin/pedidos/${p.numero}`, { metodo: 'PUT', cuerpo: { estado }, sesion: true, espera: 10000 });
      alCambiar({ ...p, ...nuevo });
      avisar(`El pedido ${p.numero} pasó a ${estado}.`);
    } catch (e) {
      setError(textoDeFallo(e));
    }
    setTrabajando(false);
  };

  const armar = (estado, origen) => {
    if (trabajando) return;
    setConfirmando({ estado, origen });
    avisar(estado === 'Cancelado'
      ? `¿Cancelar el pedido ${p.numero}? Pulsa «Sí, cancelar» para confirmar o Escape para dejarlo.`
      : `¿Marcar el pedido ${p.numero} como entregado? Pulsa «Sí, entregado» para confirmar o Escape para dejarlo.`);
  };
  const dejar = () => { devolver.current = confirmando?.origen; setConfirmando(null); };
  const alTeclear = (e) => { if (e.key === 'Escape') { e.stopPropagation(); dejar(); } };
  // Salir del grupo sin elegir lo deja como estaba (sin llevar el foco atras).
  const alSalir = (e) => { if (!e.currentTarget.contains(e.relatedTarget)) setConfirmando(null); };

  const unidades = p.lineas.reduce((s, l) => s + l.cantidad, 0);
  const cancelando = confirmando?.estado === 'Cancelado';
  return (
    <li className="admin-pedido">
      <div className="admin-pedido-cabeza">
        <h3 className="admin-pedido-numero">{p.numero}</h3>
        <span className={`admin-estado ${claseDeEstado(p.estado)}`}>{p.estado}</span>
        <span className="admin-pedido-total">{dinero(Number(p.total))}</span>
      </div>
      <p className="admin-pedido-quien">
        <strong>{p.cliente}</strong> · <a href={`tel:${p.celular}`}>{p.celular}</a> · <span className="admin-fecha">{marcaBonita(new Date(p.fecha))}</span>
      </p>
      <p className="admin-pedido-entrega">
        {p.modo === 'domicilio' ? `A domicilio: ${p.direccion || 'sin dirección'}` : 'Para retirar en el local'} · {p.metodo}
      </p>
      <ul className="admin-pedido-lineas" aria-label={`Lo que lleva el pedido ${p.numero}, ${unidades} unidades`}>
        {p.lineas.map((l) => <li key={l.nombre}><span>{l.cantidad} × {l.nombre}</span><span>{dinero(Number(l.precio) * l.cantidad)}</span></li>)}
      </ul>
      {sigue && !confirmando ? (
        <div className="admin-acciones">
          <button
            ref={avanzarRef} className="cuenta-pedido-otra admin-avanzar" type="button" aria-disabled={trabajando || undefined}
            aria-label={`Pasar a «${sigue}» el pedido ${p.numero}`}
            onClick={() => (sigue === 'Entregado' ? armar('Entregado', 'avanzar') : cambiar(sigue))}
          >
            Pasar a «{sigue}»
          </button>
          <button
            ref={cancelarRef} className="admin-cancelar" type="button" aria-disabled={trabajando || undefined}
            aria-label={`Cancelar pedido ${p.numero}`} onClick={() => armar('Cancelado', 'cancelar')}
          >
            Cancelar pedido
          </button>
        </div>
      ) : null}
      {confirmando ? (
        <div className="admin-confirma" role="group" aria-label={`Confirmar el pedido ${p.numero}`} onKeyDown={alTeclear} onBlur={alSalir}>
          <p>{cancelando ? `¿Cancelar el pedido ${p.numero}? No se puede deshacer.` : `¿Marcar el pedido ${p.numero} como entregado? No se puede deshacer.`}</p>
          <button
            ref={confirmarRef} type="button" className={`admin-confirmar${cancelando ? ' is-cancelar' : ''}`} aria-disabled={trabajando || undefined}
            onClick={() => cambiar(confirmando.estado)}
          >
            {cancelando ? `Sí, cancelar el ${p.numero}` : 'Sí, entregado'}
          </button>
          <button type="button" className="admin-no" onClick={dejar}>No, dejarlo</button>
        </div>
      ) : null}
      {error ? <p className="admin-error" role="alert">{error}</p> : null}
    </li>
  );
}

function Pedidos() {
  const avisar = useAvisos();
  const carga = useCarga('/admin/pedidos', 'pedidos');
  const [ver, setVer] = useState('atender');
  const tituloRef = useRef(null);

  const todos = carga.datos || [];
  const abiertos = todos.filter((p) => !FINALES.includes(p.estado));
  const lista = ver === 'todos' ? todos : abiertos;
  const elegir = (cual) => {
    setVer(cual);
    const n = cual === 'todos' ? todos.length : abiertos.length;
    avisar(`Mostrando ${n} ${n === 1 ? 'pedido' : 'pedidos'}.`);
  };
  // Un pedido cerrado ya no tiene botones (y en "Por atender" ni siquiera
  // esta): el foco va al titulo de la seccion.
  const cambiado = (nuevo) => {
    carga.ponerDatos(todos.map((p) => (p.numero === nuevo.numero ? nuevo : p)));
    if (FINALES.includes(nuevo.estado)) requestAnimationFrame(() => tituloRef.current?.focus());
  };

  return (
    <Seccion id="admin-pedidos" titulo="Pedidos" que="los pedidos" carga={carga} tituloRef={tituloRef}>
      <div className="admin-filtros" role="group" aria-label="Qué pedidos ver">
        <button type="button" className="admin-filtro" aria-pressed={ver === 'atender'} onClick={() => elegir('atender')}>Por atender</button>
        <button type="button" className="admin-filtro" aria-pressed={ver === 'todos'} onClick={() => elegir('todos')}>Todos (últimos 100)</button>
      </div>
      {lista.length ? (
        <ul className="admin-pedidos">
          {lista.map((p) => <Pedido key={p.numero} p={p} alCambiar={cambiado} />)}
        </ul>
      ) : (
        <p className="admin-vacio">{ver === 'todos' ? 'Todavía no hay pedidos.' : 'No hay pedidos por atender.'}</p>
      )}
    </Seccion>
  );
}

export default Pedidos;
