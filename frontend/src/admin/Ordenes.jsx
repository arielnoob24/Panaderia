// ---- Panel, Compras: las ordenes de compra --------------------------------
// Segundo paso del flujo de compras. Una orden se arma con los materiales que
// vende un proveedor activo (la base copia el precio y el IVA de ese momento),
// nace abierta y se aprueba o se anula. Aprobarla crea la recepcion pendiente
// para bodega y el asiento de contabilidad, asi que no se deshace: pide
// confirmar igual que entregar o cancelar un pedido (aparecen "Sí" y "No,
// dejarlo", el foco va al "Sí", Escape lo deja como estaba y devuelve el foco
// al boton que lo armo). Una orden aprobada ya no se anula.
import { useEffect, useRef, useState } from 'react';
import { dinero } from '../servicios/state.js';
import { pedirApi } from '../servicios/api.js';
import { useAvisos } from '../comun/Avisos.jsx';
import { useCarga, textoDeFallo } from './useCarga.js';
import Cargando from './Cargando.jsx';

const numero = new Intl.NumberFormat('es-EC', { maximumFractionDigits: 2 });
const dia = (iso) => new Date(`${String(iso).slice(0, 10)}T12:00:00`).toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' });
const aNumero = (texto) => Number(String(texto).trim().replace(',', '.'));
// AAAA-MM-DD de hoy mas n dias, en la hora de quien mira.
const fechaEn = (n) => {
  const d = new Date(Date.now() + n * 864e5);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const claseDe = (estado) => (estado === 'Anulada' ? 'is-cancelado' : estado === 'Aprobada' ? 'is-espera' : 'is-abierto');

function NuevaOrden({ proveedores, alCrear, alCerrar }) {
  const avisar = useAvisos();
  const [proveedor, setProveedor] = useState(proveedores[0].codigo);
  const [entrega, setEntrega] = useState(fechaEn(3));
  const [observacion, setObservacion] = useState('');
  const [cantidades, setCantidades] = useState({});
  const [error, setError] = useState('');
  const [trabajando, setTrabajando] = useState(false);
  const formRef = useRef(null);
  const elegido = proveedores.find((p) => p.codigo === proveedor);

  const subtotal = elegido.materiales.reduce((s, m) => {
    const c = aNumero(cantidades[m.codigo] ?? '');
    return Number.isFinite(c) && c > 0 ? s + c * Number(m.precio) : s;
  }, 0);

  const crear = async (e) => {
    e.preventDefault();
    if (trabajando) return;
    const lineas = elegido.materiales
      .filter((m) => String(cantidades[m.codigo] ?? '').trim() !== '')
      .map((m) => ({ material: m.codigo, cantidad: String(cantidades[m.codigo]).trim().replace(',', '.') }));
    setTrabajando(true);
    setError('');
    try {
      const nueva = await pedirApi('/admin/ordenes', { metodo: 'POST', sesion: true, espera: 10000, cuerpo: { proveedor, entrega, observacion, lineas } });
      alCrear(nueva);
      avisar(`Creaste la orden ${nueva.codigo}. Falta aprobarla.`);
    } catch (err) {
      setError(textoDeFallo(err));
      formRef.current?.querySelector('input, select')?.focus();
    }
    setTrabajando(false);
  };

  return (
    <form ref={formRef} className="admin-formulario" onSubmit={crear} noValidate aria-labelledby="admin-nueva-orden">
      <h3 id="admin-nueva-orden" className="admin-subtitulo">Nueva orden de compra</h3>
      <div className="admin-campos">
        <label className="admin-campo"><span>Proveedor</span>
          <select value={proveedor} onChange={(e) => { setProveedor(e.target.value); setCantidades({}); setError(''); }}>
            {proveedores.map((p) => <option key={p.codigo} value={p.codigo}>{p.razonSocial}</option>)}
          </select>
        </label>
        <label className="admin-campo"><span>Fecha de entrega</span>
          <input type="date" min={fechaEn(0)} value={entrega} onChange={(e) => { setEntrega(e.target.value); setError(''); }} />
        </label>
        <label className="admin-campo admin-ancho"><span>Observación (opcional)</span>
          <input type="text" autoComplete="off" value={observacion} onChange={(e) => setObservacion(e.target.value)} />
        </label>
      </div>
      <fieldset className="admin-lineas">
        <legend>Cuánto pedir (deja en blanco lo que no pidas)</legend>
        {elegido.materiales.map((m) => (
          <label key={m.codigo} className="admin-campo admin-linea-oc">
            <span>{m.nombre}<small>{dinero(Number(m.precio))} por {m.unidad} sin IVA</small></span>
            <span className="admin-precio-caja">
              <input
                type="text" inputMode="decimal" value={cantidades[m.codigo] ?? ''} aria-label={`Cantidad de ${m.nombre} en ${m.unidad}`}
                onChange={(e) => { setCantidades((x) => ({ ...x, [m.codigo]: e.target.value })); setError(''); }}
              />
              <span aria-hidden="true">{m.unidad}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <p className="admin-nota">Subtotal sin IVA: <strong>{dinero(subtotal)}</strong>. El IVA se suma al crear la orden.</p>
      {error ? <p className="admin-error" role="alert">{error}</p> : null}
      <div className="admin-acciones">
        <button className="cuenta-pedido-otra admin-guardar" type="submit" aria-disabled={trabajando || undefined}>{trabajando ? 'Creando…' : 'Crear orden'}</button>
        <button className="admin-ver-mov" type="button" onClick={alCerrar}>Cancelar</button>
      </div>
    </form>
  );
}

function Orden({ o, alCambiar }) {
  const avisar = useAvisos();
  const [pregunta, setPregunta] = useState(null); // { estado, origen }
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState('');
  const aprobarRef = useRef(null);
  const anularRef = useRef(null);
  const confirmarRef = useRef(null);
  const devolver = useRef(null);

  useEffect(() => {
    if (pregunta) { confirmarRef.current?.focus(); return; }
    if (devolver.current) {
      (devolver.current === 'Anulada' ? anularRef : aprobarRef).current?.focus();
      devolver.current = null;
    }
  }, [pregunta]);

  const armar = (estado) => {
    if (trabajando) return;
    setPregunta({ estado, origen: estado });
    avisar(`¿${estado === 'Aprobada' ? 'Aprobar' : 'Anular'} la orden ${o.codigo}? Pulsa «Sí» para confirmar o Escape para dejarla.`);
  };
  const dejar = () => { devolver.current = pregunta?.origen; setPregunta(null); };
  const alTeclear = (e) => { if (e.key === 'Escape') { e.stopPropagation(); dejar(); } };
  const alSalir = (e) => { if (!e.currentTarget.contains(e.relatedTarget)) setPregunta(null); };

  const cambiar = async () => {
    if (trabajando) return;
    const estado = pregunta.estado;
    setTrabajando(true);
    setError('');
    setPregunta(null);
    try {
      alCambiar(await pedirApi(`/admin/ordenes/${o.codigo}`, { metodo: 'PUT', sesion: true, espera: 10000, cuerpo: { estado } }));
      avisar(`La orden ${o.codigo} quedó ${estado.toLowerCase()}.`);
    } catch (err) {
      setError(textoDeFallo(err));
    }
    setTrabajando(false);
  };

  const aprobando = pregunta?.estado === 'Aprobada';
  return (
    <li className="admin-material">
      <div className="admin-material-cabeza">
        <h4 className="admin-proveedor-nombre">{o.codigo}</h4>
        <span className={`admin-estado ${claseDe(o.estado)}`}>{o.estado}</span>
        <span className="admin-pedido-total">{dinero(Number(o.total))}</span>
      </div>
      <p className="admin-material-datos">
        {o.proveedor} · entrega el {dia(o.entrega)}
        {o.recepcion ? ` · recepción ${o.recepcion.estado.toLowerCase()}` : ''}
        {o.observacion ? <><br />{o.observacion}</> : null}
      </p>
      <ul className="admin-lista admin-orden-lineas" aria-label={`Lo que pide la orden ${o.codigo}`}>
        {o.lineas.map((l) => (
          <li key={l.codigo}>
            <span>{l.nombre}
              <small>
                {numero.format(Number(l.cantidad))} {l.unidad} a {dinero(Number(l.precio))}
                {o.estado === 'Aprobada' ? ` · recibido ${numero.format(Number(l.recibido))}` : ''}
              </small>
            </span>
            <strong>{dinero(Number(l.cantidad) * Number(l.precio))}</strong>
          </li>
        ))}
      </ul>
      <p className="admin-nota">Subtotal {dinero(Number(o.subtotal))} + IVA {dinero(Number(o.iva))} = {dinero(Number(o.total))}</p>
      {o.estado === 'Abierta' && !pregunta ? (
        <div className="admin-acciones">
          <button ref={aprobarRef} className="cuenta-pedido-otra admin-guardar" type="button" aria-disabled={trabajando || undefined} aria-label={`Aprobar la orden ${o.codigo}`} onClick={() => armar('Aprobada')}>Aprobar</button>
          <button ref={anularRef} className="admin-cancelar" type="button" aria-disabled={trabajando || undefined} aria-label={`Anular la orden ${o.codigo}`} onClick={() => armar('Anulada')}>Anular</button>
        </div>
      ) : null}
      {pregunta ? (
        <div className="admin-confirma" role="group" aria-label={`Confirmar la orden ${o.codigo}`} onKeyDown={alTeclear} onBlur={alSalir}>
          <p>{aprobando ? `¿Aprobar la orden ${o.codigo}? Pasa a bodega y a contabilidad, y ya no se anula.` : `¿Anular la orden ${o.codigo}? No se puede deshacer.`}</p>
          <button ref={confirmarRef} type="button" className={`admin-confirmar${aprobando ? '' : ' is-cancelar'}`} aria-disabled={trabajando || undefined} onClick={cambiar}>
            {aprobando ? `Sí, aprobar la ${o.codigo}` : `Sí, anular la ${o.codigo}`}
          </button>
          <button type="button" className="admin-no" onClick={dejar}>No, dejarla</button>
        </div>
      ) : null}
      {error ? <p className="admin-error" role="alert">{error}</p> : null}
    </li>
  );
}

function Ordenes({ proveedores }) {
  const carga = useCarga('/admin/ordenes', 'ordenes');
  const [nueva, setNueva] = useState(false);
  const botonRef = useRef(null);
  const volver = useRef(false);
  // Solo se le pide a un proveedor activo que venda algo.
  const sirven = proveedores.filter((p) => p.activo && p.materiales.length);

  useEffect(() => {
    if (!nueva && volver.current) { volver.current = false; botonRef.current?.focus(); }
  }, [nueva]);
  const cerrar = () => { volver.current = true; setNueva(false); };

  return (
    <>
      <h3 className="admin-subtitulo">Órdenes de compra</h3>
      {carga.fase !== 'listo' ? <Cargando carga={carga} que="las órdenes de compra" alReintentar={carga.recargar} /> : (
        <>
          {sirven.length ? null : <p className="admin-nota">Para hacer una orden hace falta un proveedor activo que venda algo: ponle «Lo que vende» arriba.</p>}
          {nueva && sirven.length ? (
            <NuevaOrden
              proveedores={sirven} alCerrar={cerrar}
              alCrear={(o) => { carga.ponerDatos([o, ...carga.datos]); cerrar(); }}
            />
          ) : sirven.length ? (
            <button ref={botonRef} className="cuenta-pedido-otra admin-guardar" type="button" onClick={() => setNueva(true)}>Nueva orden</button>
          ) : null}
          {carga.datos.length ? (
            <ul className="admin-materiales">
              {carga.datos.map((o) => <Orden key={o.codigo} o={o} alCambiar={(n) => carga.ponerDatos(carga.datos.map((x) => (x.codigo === n.codigo ? n : x)))} />)}
            </ul>
          ) : <p className="admin-vacio">Todavía no hay órdenes de compra.</p>}
        </>
      )}
    </>
  );
}

export default Ordenes;
