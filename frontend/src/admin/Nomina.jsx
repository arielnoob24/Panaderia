// ---- Panel, Nómina: los roles de pago --------------------------------------
// Solo el Administrador (nomina.aprobar). Se abre el rol de un empleado en un
// mes (la base le pone el sueldo y el aporte al IESS), se le agregan horas
// extra, fondo de reserva, préstamo o impuesto a la renta, y se aprueba (crea
// el asiento y fija la fecha de pago) o se anula. Aprobar y anular no se
// deshacen y piden confirmar: aparecen "Sí" y "No, dejarlo", el foco va al
// "Sí", Escape lo deja como estaba y el foco vuelve al boton que lo armo.
import { useEffect, useRef, useState } from 'react';
import { dinero } from '../servicios/state.js';
import { pedirApi } from '../servicios/api.js';
import { useAvisos } from '../comun/Avisos.jsx';
import { useCarga, textoDeFallo } from './useCarga.js';
import Seccion from './Seccion.jsx';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function AbrirRol({ empleados, alCrear, alCerrar }) {
  const avisar = useAvisos();
  const hoy = new Date();
  const [v, setV] = useState({ empleado: empleados[0]?.codigo || '', mes: String(hoy.getMonth() + 1), anio: String(hoy.getFullYear()) });
  const [error, setError] = useState('');
  const [trabajando, setTrabajando] = useState(false);
  const poner = (campo) => (e) => { setV((x) => ({ ...x, [campo]: e.target.value })); setError(''); };
  const crear = async (e) => {
    e.preventDefault();
    if (trabajando) return;
    setTrabajando(true);
    setError('');
    try {
      const rol = await pedirApi('/admin/nomina', { metodo: 'POST', sesion: true, espera: 10000, cuerpo: { empleado: v.empleado, mes: Number(v.mes), anio: Number(v.anio) } });
      alCrear(rol);
      avisar(`Abriste el rol de ${rol.nombre} de ${MESES[rol.mes - 1]} de ${rol.anio}.`);
    } catch (err) {
      setError(textoDeFallo(err));
    }
    setTrabajando(false);
  };
  return (
    <form className="admin-formulario" onSubmit={crear} noValidate aria-labelledby="admin-abrir-rol">
      <h3 id="admin-abrir-rol" className="admin-subtitulo">Abrir un rol</h3>
      <div className="admin-campos">
        <label className="admin-campo"><span>Empleado</span>
          <select value={v.empleado} onChange={poner('empleado')}>{empleados.map((e) => <option key={e.codigo} value={e.codigo}>{e.nombre}</option>)}</select>
        </label>
        <label className="admin-campo"><span>Mes</span>
          <select value={v.mes} onChange={poner('mes')}>{MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select>
        </label>
        <label className="admin-campo"><span>Año</span>
          <input type="text" inputMode="numeric" autoComplete="off" value={v.anio} onChange={poner('anio')} />
        </label>
      </div>
      <div className="admin-acciones">
        <button className="cuenta-pedido-otra admin-guardar" type="submit" aria-disabled={trabajando || undefined}>Abrir rol</button>
        <button className="admin-no" type="button" onClick={alCerrar}>Cancelar</button>
      </div>
      {error ? <p className="admin-error" role="alert">{error}</p> : null}
    </form>
  );
}

function Rol({ r, conceptos, alCambiar }) {
  const avisar = useAvisos();
  const abierto = r.estado === 'Abierto';
  const [concepto, setConcepto] = useState(conceptos[0]?.numero || '');
  const [cantidad, setCantidad] = useState('1');
  const [valor, setValor] = useState('');
  const [pregunta, setPregunta] = useState(null); // 'Aprobado' | 'Anulado'
  const [error, setError] = useState('');
  const [trabajando, setTrabajando] = useState(false);
  const refs = useRef({});
  const confirmarRef = useRef(null);
  const devolver = useRef(null);
  const periodo = `${MESES[r.mes - 1]} de ${r.anio}`;

  useEffect(() => {
    if (pregunta) { confirmarRef.current?.focus(); return; }
    if (devolver.current) { refs.current[devolver.current]?.focus(); devolver.current = null; }
  }, [pregunta]);

  const llamar = async (ruta, metodo, cuerpo, aviso) => {
    if (trabajando) return false;
    setTrabajando(true);
    setError('');
    setPregunta(null);
    try {
      alCambiar(await pedirApi(ruta, { metodo, sesion: true, espera: 10000, cuerpo }));
      avisar(aviso);
      setTrabajando(false);
      return true;
    } catch (err) {
      setError(textoDeFallo(err));
      setTrabajando(false);
      return false;
    }
  };

  const agregar = async (ev) => {
    ev.preventDefault();
    const c = Number(cantidad.trim().replace(',', '.'));
    const val = Number(valor.trim().replace(',', '.'));
    if (!(c > 0) || !(val > 0)) { setError('Escribe una cantidad y un valor mayores que 0.'); return; }
    if (await llamar(`/admin/nomina/${r.codigo}/lineas`, 'PUT', { concepto, cantidad: c, valor: val }, `Guardaste la línea en el rol de ${r.nombre}.`)) setValor('');
  };
  const quitar = (l) => llamar(`/admin/nomina/${r.codigo}/lineas/quitar`, 'POST', { concepto: l.numero }, `Quitaste «${l.nombre}» del rol de ${r.nombre}.`);
  const armar = (estado) => {
    if (trabajando) return;
    devolver.current = null;
    setPregunta(estado);
    avisar(`¿${estado === 'Aprobado' ? 'Aprobar' : 'Anular'} el rol de ${r.nombre} de ${periodo}? Pulsa «Sí» para confirmar o Escape para dejarlo.`);
  };
  const dejar = () => { devolver.current = pregunta === 'Aprobado' ? 'aprobar' : 'anular'; setPregunta(null); };
  const alTeclear = (ev) => { if (ev.key === 'Escape') { ev.stopPropagation(); dejar(); } };
  const alSalir = (ev) => { if (!ev.currentTarget.contains(ev.relatedTarget)) setPregunta(null); };
  const confirmar = () => llamar(`/admin/nomina/${r.codigo}`, 'PUT', { estado: pregunta },
    pregunta === 'Aprobado' ? `Aprobaste el rol de ${r.nombre}.` : `Anulaste el rol de ${r.nombre}.`);

  return (
    <li className="admin-material">
      <div className="admin-material-cabeza">
        <h4 className="admin-proveedor-nombre">{r.nombre} · {periodo}</h4>
        <span className={r.estado === 'Anulado' ? 'admin-agotado' : `admin-estado${abierto ? ' is-abierto' : ''}`}>{r.estado}</span>
      </div>
      <ul className="admin-lista admin-orden-lineas" aria-label={`Líneas del rol de ${r.nombre} de ${periodo}`}>
        {r.lineas.map((l) => (
          <li key={l.numero}>
            <span>{l.nombre}<small>{l.tipo === 'ING' ? 'ingreso' : 'descuento'}{Number(l.cantidad) !== 1 ? ` · ${Number(l.cantidad)}` : ''}</small></span>
            <span>{l.tipo === 'DES' ? '−' : ''}{dinero(Number(l.valor))}</span>
            {abierto && !l.fija ? (
              <button className="admin-ver-mov" type="button" aria-disabled={trabajando || undefined} aria-label={`Quitar ${l.nombre} del rol de ${r.nombre}`} onClick={() => quitar(l)}>Quitar</button>
            ) : null}
          </li>
        ))}
      </ul>
      <p className="admin-material-datos">
        Ingresos {dinero(Number(r.ingresos))} · Descuentos {dinero(Number(r.descuentos))} · <strong>Neto {dinero(Number(r.neto))}</strong>
        {r.fechaPago ? <><br />Pagado el {r.fechaPago}</> : null}
      </p>

      {abierto ? (
        <>
          <form className="admin-campos admin-vende-form" onSubmit={agregar} noValidate aria-label={`Agregar una línea al rol de ${r.nombre} de ${periodo}`}>
            <label className="admin-campo"><span>Concepto</span>
              <select value={concepto} onChange={(ev) => { setConcepto(ev.target.value); setError(''); }}>{conceptos.map((c) => <option key={c.numero} value={c.numero}>{c.nombre}</option>)}</select>
            </label>
            <label className="admin-campo"><span>Cantidad (días u horas)</span>
              <input type="text" inputMode="decimal" value={cantidad} onChange={(ev) => { setCantidad(ev.target.value); setError(''); }} />
            </label>
            <label className="admin-campo"><span>Valor ($)</span>
              <input type="text" inputMode="decimal" value={valor} onChange={(ev) => { setValor(ev.target.value); setError(''); }} />
            </label>
            <button className="cuenta-pedido-otra admin-guardar" type="submit" aria-disabled={trabajando || undefined}>Agregar línea</button>
          </form>
          <div className="admin-acciones">
            <button ref={(el) => { refs.current.aprobar = el; }} className="cuenta-pedido-otra admin-guardar" type="button" aria-disabled={trabajando || undefined} aria-label={`Aprobar el rol de ${r.nombre} de ${periodo}`} onClick={() => armar('Aprobado')}>Aprobar</button>
            <button ref={(el) => { refs.current.anular = el; }} className="admin-cancelar" type="button" aria-disabled={trabajando || undefined} aria-label={`Anular el rol de ${r.nombre} de ${periodo}`} onClick={() => armar('Anulado')}>Anular</button>
          </div>
        </>
      ) : null}

      {pregunta ? (
        <div className="admin-confirma" role="group" aria-label={`Confirmar sobre el rol de ${r.nombre}`} onKeyDown={alTeclear} onBlur={alSalir}>
          <p>{pregunta === 'Aprobado' ? `¿Aprobar el rol de ${r.nombre} de ${periodo}? Se crea su asiento y ya no se puede cambiar.` : `¿Anular el rol de ${r.nombre} de ${periodo}? No se puede deshacer.`}</p>
          <button ref={confirmarRef} type="button" className={pregunta === 'Anulado' ? 'admin-confirmar is-cancelar' : 'admin-confirmar'} aria-disabled={trabajando || undefined} onClick={confirmar}>
            {pregunta === 'Aprobado' ? 'Sí, aprobar' : 'Sí, anular'}
          </button>
          <button type="button" className="admin-no" onClick={dejar}>No, dejarlo</button>
        </div>
      ) : null}
      {error ? <p className="admin-error" role="alert">{error}</p> : null}
    </li>
  );
}

function Nomina() {
  const carga = useCarga('/admin/nomina', null);
  const [abrir, setAbrir] = useState(false);
  const botonRef = useRef(null);
  const volver = useRef(false);
  const d = carga.datos;

  useEffect(() => {
    if (!abrir && volver.current) { volver.current = false; botonRef.current?.focus(); }
  }, [abrir]);
  const cerrar = () => { volver.current = true; setAbrir(false); };
  const reemplazar = (r) => carga.ponerDatos({ ...d, nominas: d.nominas.map((x) => (x.codigo === r.codigo ? r : x)) });

  return (
    <Seccion id="admin-nomina" titulo="Nómina" que="la nómina" carga={carga}>
      {d ? (
        <>
          {abrir ? (
            <AbrirRol empleados={d.empleados} alCerrar={cerrar} alCrear={(r) => { carga.ponerDatos({ ...d, nominas: [r, ...d.nominas] }); cerrar(); }} />
          ) : <button ref={botonRef} className="cuenta-pedido-otra admin-guardar" type="button" onClick={() => setAbrir(true)}>Abrir un rol</button>}
          <h3 className="admin-subtitulo">Roles de pago</h3>
          {d.nominas.length ? (
            <ul className="admin-materiales">
              {d.nominas.map((r) => <Rol key={r.codigo} r={r} conceptos={d.conceptos} alCambiar={reemplazar} />)}
            </ul>
          ) : <p className="admin-vacio">Todavía no hay roles de pago.</p>}
        </>
      ) : null}
    </Seccion>
  );
}

export default Nomina;
