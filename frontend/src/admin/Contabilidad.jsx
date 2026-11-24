// ---- Panel, Contabilidad: los asientos y los saldos -------------------------
// Solo el Administrador (contabilidad.aprobar). Lo que venden, compran, producen
// y pagan los otros modulos deja un asiento "Pendiente"; aqui se revisa y se
// aprueba (con el empleado de quien aprueba como contador) o se anula. Solo los
// asientos aprobados cuentan en los saldos de abajo. Uno que no cuadra no se
// aprueba: queda "Con error". Aprobar y anular no se deshacen y piden
// confirmar: aparecen "Sí" y "No, dejarlo", el foco va al "Sí", Escape lo deja
// como estaba y el foco vuelve al boton que lo armo.
import { useEffect, useRef, useState } from 'react';
import { dinero } from '../servicios/state.js';
import { marcaBonita } from '../servicios/storage.js';
import { pedirApi } from '../servicios/api.js';
import { useAvisos } from '../comun/Avisos.jsx';
import { useCarga, textoDeFallo } from './useCarga.js';
import Seccion from './Seccion.jsx';

const ABIERTOS = ['Abierto', 'Pendiente', 'Con error'];

function Asiento({ a, alCambiar }) {
  const avisar = useAvisos();
  const [pregunta, setPregunta] = useState(null); // 'Aprobado' | 'Anulado'
  const [error, setError] = useState('');
  const [trabajando, setTrabajando] = useState(false);
  const refs = useRef({});
  const confirmarRef = useRef(null);
  const devolver = useRef(null);
  const abierto = ABIERTOS.includes(a.estado);

  useEffect(() => {
    if (pregunta) { confirmarRef.current?.focus(); return; }
    if (devolver.current) { refs.current[devolver.current]?.focus(); devolver.current = null; }
  }, [pregunta]);

  const armar = (estado) => {
    if (trabajando) return;
    devolver.current = null;
    setPregunta(estado);
    avisar(`¿${estado === 'Aprobado' ? 'Aprobar' : 'Anular'} el asiento ${a.codigo}? Pulsa «Sí» para confirmar o Escape para dejarlo.`);
  };
  const dejar = () => { devolver.current = pregunta === 'Aprobado' ? 'aprobar' : 'anular'; setPregunta(null); };
  const alTeclear = (ev) => { if (ev.key === 'Escape') { ev.stopPropagation(); dejar(); } };
  const alSalir = (ev) => { if (!ev.currentTarget.contains(ev.relatedTarget)) setPregunta(null); };
  const confirmar = async () => {
    if (trabajando) return;
    const estado = pregunta;
    setTrabajando(true);
    setError('');
    setPregunta(null);
    try {
      const nuevo = await pedirApi(`/admin/contabilidad/${a.codigo}`, { metodo: 'PUT', sesion: true, espera: 10000, cuerpo: { estado } });
      alCambiar(nuevo);
      avisar(nuevo.estado === 'Con error' ? `El asiento ${a.codigo} no cuadra y no se pudo aprobar.` : `${nuevo.estado === 'Aprobado' ? 'Aprobaste' : 'Anulaste'} el asiento ${a.codigo}.`);
    } catch (err) {
      setError(textoDeFallo(err));
    }
    setTrabajando(false);
  };

  return (
    <li className="admin-material">
      <div className="admin-material-cabeza">
        <h4 className="admin-proveedor-nombre">{a.descripcion}</h4>
        <span className={a.estado === 'Anulado' || a.estado === 'Con error' ? 'admin-agotado' : `admin-estado${abierto ? ' is-abierto' : ''}`}>{a.estado}</span>
      </div>
      <p className="admin-material-datos">
        {a.codigo} · {a.origen} · <span className="admin-fecha">{marcaBonita(new Date(a.fecha))}</span>
        {a.aprobo ? <><br />Aprobó {a.aprobo}</> : null}
      </p>
      <ul className="admin-lista admin-orden-lineas" aria-label={`Líneas del asiento ${a.codigo}`}>
        {a.lineas.map((l) => (
          <li key={l.cuenta}>
            <span>{l.nombre}<small>{l.cuenta}</small></span>
            <span>{Number(l.debe) ? `Debe ${dinero(Number(l.debe))}` : `Haber ${dinero(Number(l.haber))}`}</span>
          </li>
        ))}
      </ul>
      <p className="admin-material-datos">
        Debe {dinero(Number(a.debe))} · Haber {dinero(Number(a.haber))} · {a.cuadra ? 'Cuadra' : <strong>No cuadra</strong>}
      </p>
      {abierto ? (
        <div className="admin-acciones">
          <button ref={(el) => { refs.current.aprobar = el; }} className="cuenta-pedido-otra admin-guardar" type="button" aria-disabled={trabajando || undefined} aria-label={`Aprobar el asiento ${a.codigo}`} onClick={() => armar('Aprobado')}>Aprobar</button>
          <button ref={(el) => { refs.current.anular = el; }} className="admin-cancelar" type="button" aria-disabled={trabajando || undefined} aria-label={`Anular el asiento ${a.codigo}`} onClick={() => armar('Anulado')}>Anular</button>
        </div>
      ) : null}
      {pregunta ? (
        <div className="admin-confirma" role="group" aria-label={`Confirmar sobre el asiento ${a.codigo}`} onKeyDown={alTeclear} onBlur={alSalir}>
          <p>{pregunta === 'Aprobado' ? `¿Aprobar el asiento ${a.codigo}? Entra a los saldos y ya no se puede cambiar.` : `¿Anular el asiento ${a.codigo}? No se puede deshacer.`}</p>
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

function Contabilidad() {
  const carga = useCarga('/admin/contabilidad', null);
  const [ver, setVer] = useState('porAprobar');
  const tituloRef = useRef(null);
  const alTitulo = useRef(false);
  const d = carga.datos;
  // Un asiento cerrado sale de "Por aprobar": el foco va al titulo y no se pierde.
  useEffect(() => {
    if (alTitulo.current) { alTitulo.current = false; tituloRef.current?.focus(); }
  });
  const reemplazar = (a) => {
    const asientos = d.asientos.map((x) => (x.codigo === a.codigo ? a : x));
    if (ver === 'porAprobar' && !ABIERTOS.includes(a.estado)) alTitulo.current = true;
    carga.ponerDatos({ ...d, asientos, porAprobar: asientos.filter((x) => ABIERTOS.includes(x.estado)).length });
    // Los saldos cambian al aprobar: se piden de nuevo sin tapar la pantalla.
    pedirApi('/admin/contabilidad', { sesion: true, espera: 10000 }).then((n) => carga.ponerDatos(n)).catch(() => {});
  };
  const lista = d ? (ver === 'porAprobar' ? d.asientos.filter((a) => ABIERTOS.includes(a.estado)) : d.asientos) : [];

  return (
    <Seccion id="admin-contabilidad" titulo="Contabilidad" que="la contabilidad" carga={carga} tituloRef={tituloRef}>
      {d ? (
        <>
          <p className="admin-nota">{d.porAprobar ? `${d.porAprobar} ${d.porAprobar === 1 ? 'asiento espera' : 'asientos esperan'} tu aprobación.` : 'No hay asientos por aprobar.'}</p>
          <div className="admin-acciones" role="group" aria-label="Qué asientos ver">
            <button type="button" className="admin-ver-mov" aria-pressed={ver === 'porAprobar'} onClick={() => setVer('porAprobar')}>Por aprobar</button>
            <button type="button" className="admin-ver-mov" aria-pressed={ver === 'todos'} onClick={() => setVer('todos')}>Todos</button>
          </div>
          <h3 className="admin-subtitulo">Asientos</h3>
          {lista.length ? (
            <ul className="admin-materiales">
              {lista.map((a) => <Asiento key={a.codigo} a={a} alCambiar={reemplazar} />)}
            </ul>
          ) : <p className="admin-vacio">{ver === 'porAprobar' ? 'No hay asientos por aprobar.' : 'Todavía no hay asientos.'}</p>}
          <h3 className="admin-subtitulo">Saldos de las cuentas</h3>
          {d.saldos.length ? (
            <ul className="admin-lista admin-orden-lineas" aria-label="Saldos de las cuentas">
              {d.saldos.map((c) => (
                <li key={c.cuenta}>
                  <span>{c.nombre}<small>{c.cuenta} · Debe {dinero(Number(c.debe))} · Haber {dinero(Number(c.haber))}</small></span>
                  <span>{dinero(Number(c.saldo))}</span>
                </li>
              ))}
            </ul>
          ) : <p className="admin-vacio">Todavía no hay asientos aprobados: los saldos salen de ellos.</p>}
        </>
      ) : null}
    </Seccion>
  );
}

export default Contabilidad;
