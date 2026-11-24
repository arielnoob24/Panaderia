// ---- Panel, Ajustes: corregir el inventario con el fisico -----------------
// Un faltante (se cayo, se daño, caduco) o un sobrante de un lote. Lo reporta
// quien tiene inventario.reportar (Administrador y Empleado) y lo aprueba otra
// persona con inventario.ajustar (el Administrador): la base no deja aprobar
// el propio. Aprobar descuenta o suma al lote y crea el asiento de perdida o
// sobrante, asi que pide confirmar igual que aprobar una orden de compra. Las
// cantidades van en la unidad de produccion del material.
import { useEffect, useRef, useState } from 'react';
import { dinero } from '../servicios/state.js';
import { pedirApi } from '../servicios/api.js';
import { marcaBonita } from '../servicios/storage.js';
import { useAvisos } from '../comun/Avisos.jsx';
import { useCarga, textoDeFallo } from './useCarga.js';
import { usePanel } from './usePanel.js';
import Seccion from './Seccion.jsx';

const numero = new Intl.NumberFormat('es-EC', { maximumFractionDigits: 3 });
const claseDe = (estado) => (estado === 'Anulado' ? 'is-cancelado' : estado === 'Aprobado' ? 'is-espera' : 'is-abierto');

function Reportar({ lotes, alReportar }) {
  const avisar = useAvisos();
  const [lote, setLote] = useState(lotes[0].codigo);
  const [tipo, setTipo] = useState('falta');
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');
  const [trabajando, setTrabajando] = useState(false);
  const motivoRef = useRef(null);
  const elegido = lotes.find((l) => l.codigo === lote);

  const reportar = async (e) => {
    e.preventDefault();
    if (trabajando) return;
    const n = cantidad.trim().replace(',', '.');
    if (!/^\d{1,8}(\.\d{1,3})?$/.test(n) || Number(n) <= 0) {
      setError('Pon cuánto falta o sobra: un número mayor que 0, con hasta 3 decimales.');
      return;
    }
    setTrabajando(true);
    setError('');
    try {
      await pedirApi('/admin/ajustes', {
        metodo: 'POST', sesion: true, espera: 10000,
        cuerpo: { motivo, lineas: [{ lote, cantidad: `${tipo === 'falta' ? '-' : ''}${n}` }] },
      });
      avisar('Reportaste el ajuste. Falta que otra persona lo apruebe.');
      setCantidad('');
      setMotivo('');
      await alReportar();
    } catch (err) {
      setError(textoDeFallo(err));
      motivoRef.current?.focus();
    }
    setTrabajando(false);
  };

  return (
    <form className="admin-formulario" onSubmit={reportar} noValidate aria-labelledby="admin-reportar-ajuste">
      <h3 id="admin-reportar-ajuste" className="admin-subtitulo">Reportar un faltante o sobrante</h3>
      <div className="admin-campos">
        <label className="admin-campo admin-ancho"><span>Lote</span>
          <select value={lote} onChange={(e) => { setLote(e.target.value); setError(''); }}>
            {lotes.map((l) => (
              <option key={l.codigo} value={l.codigo}>
                {l.material} · {numero.format(Number(l.saldo))} {l.unidad}{l.caduca ? ` · caduca ${l.caduca}` : ''}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-campo"><span>Qué pasó</span>
          <select value={tipo} onChange={(e) => { setTipo(e.target.value); setError(''); }}>
            <option value="falta">Falta (se pierde)</option>
            <option value="sobra">Sobra (se suma)</option>
          </select>
        </label>
        <label className="admin-campo"><span>Cuánto ({elegido.unidad})</span>
          <input type="text" inputMode="decimal" autoComplete="off" value={cantidad} onChange={(e) => { setCantidad(e.target.value); setError(''); }} />
        </label>
        <label className="admin-campo admin-ancho"><span>Motivo</span>
          <input ref={motivoRef} type="text" autoComplete="off" value={motivo} onChange={(e) => { setMotivo(e.target.value); setError(''); }} />
        </label>
      </div>
      {error ? <p className="admin-error" role="alert">{error}</p> : null}
      <div className="admin-acciones">
        <button className="cuenta-pedido-otra admin-guardar" type="submit" aria-disabled={trabajando || undefined}>{trabajando ? 'Enviando…' : 'Reportar'}</button>
      </div>
    </form>
  );
}

function Ajuste({ a, costos, puedeAprobar, alCambiar }) {
  const avisar = useAvisos();
  const [pregunta, setPregunta] = useState(null);
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState('');
  const aprobarRef = useRef(null);
  const anularRef = useRef(null);
  const confirmarRef = useRef(null);
  const devolver = useRef(null);

  useEffect(() => {
    if (pregunta) { confirmarRef.current?.focus(); return; }
    if (devolver.current) {
      (devolver.current === 'Anulado' ? anularRef : aprobarRef).current?.focus();
      devolver.current = null;
    }
  }, [pregunta]);

  const armar = (estado) => {
    if (trabajando) return;
    setPregunta(estado);
    avisar(`¿${estado === 'Aprobado' ? 'Aprobar' : 'Anular'} el ajuste ${a.codigo}? Pulsa «Sí» para confirmar o Escape para dejarlo.`);
  };
  const dejar = () => { devolver.current = pregunta; setPregunta(null); };
  const alTeclear = (e) => { if (e.key === 'Escape') { e.stopPropagation(); dejar(); } };
  const alSalir = (e) => { if (!e.currentTarget.contains(e.relatedTarget)) setPregunta(null); };

  const cambiar = async () => {
    if (trabajando) return;
    const estado = pregunta;
    setTrabajando(true);
    setError('');
    setPregunta(null);
    try {
      await pedirApi(`/admin/ajustes/${a.codigo}`, { metodo: 'PUT', sesion: true, espera: 10000, cuerpo: { estado } });
      avisar(`El ajuste ${a.codigo} quedó ${estado.toLowerCase()}.`);
      await alCambiar();
      return;
    } catch (err) {
      setError(textoDeFallo(err));
    }
    setTrabajando(false);
  };

  const aprobando = pregunta === 'Aprobado';
  return (
    <li className="admin-material">
      <div className="admin-material-cabeza">
        <h4 className="admin-proveedor-nombre">{a.codigo}</h4>
        <span className={`admin-estado ${claseDe(a.estado)}`}>{a.estado}</span>
      </div>
      <p className="admin-material-datos">
        {a.motivo}<br />
        Lo reportó {a.hizo} · {marcaBonita(new Date(a.fecha))}{a.autorizo ? ` · lo aprobó ${a.autorizo}` : ''}
      </p>
      <ul className="admin-lista admin-orden-lineas" aria-label={`Lo que ajusta ${a.codigo}`}>
        {a.lineas.map((l) => (
          <li key={l.lote}>
            <span>{l.material}<small>lote {l.lote}</small></span>
            <strong>{Number(l.cantidad) > 0 ? '+' : ''}{numero.format(Number(l.cantidad))} {l.unidad}{costos && l.valor !== null ? ` · ${dinero(Number(l.valor))}` : ''}</strong>
          </li>
        ))}
      </ul>
      {a.estado === 'Abierto' && puedeAprobar && !pregunta ? (
        <div className="admin-acciones">
          <button ref={aprobarRef} className="cuenta-pedido-otra admin-guardar" type="button" aria-disabled={trabajando || undefined} aria-label={`Aprobar el ajuste ${a.codigo}`} onClick={() => armar('Aprobado')}>Aprobar</button>
          <button ref={anularRef} className="admin-cancelar" type="button" aria-disabled={trabajando || undefined} aria-label={`Anular el ajuste ${a.codigo}`} onClick={() => armar('Anulado')}>Anular</button>
        </div>
      ) : null}
      {pregunta ? (
        <div className="admin-confirma" role="group" aria-label={`Confirmar el ajuste ${a.codigo}`} onKeyDown={alTeclear} onBlur={alSalir}>
          <p>{aprobando ? `¿Aprobar el ajuste ${a.codigo}? Cambia el inventario y la contabilidad, y ya no se anula.` : `¿Anular el ajuste ${a.codigo}? No se puede deshacer.`}</p>
          <button ref={confirmarRef} type="button" className={`admin-confirmar${aprobando ? '' : ' is-cancelar'}`} aria-disabled={trabajando || undefined} onClick={cambiar}>
            {aprobando ? `Sí, aprobar el ${a.codigo}` : `Sí, anular el ${a.codigo}`}
          </button>
          <button type="button" className="admin-no" onClick={dejar}>No, dejarlo</button>
        </div>
      ) : null}
      {error ? <p className="admin-error" role="alert">{error}</p> : null}
    </li>
  );
}

function Ajustes() {
  const { permisos } = usePanel();
  const carga = useCarga('/admin/ajustes', null);
  const d = carga.datos;
  const puedeAprobar = permisos.includes('inventario.ajustar');
  const recargarCallado = async () => {
    try { carga.ponerDatos(await pedirApi('/admin/ajustes', { sesion: true, espera: 10000 })); } catch { carga.recargar(); }
  };

  return (
    <Seccion id="admin-ajustes" titulo="Ajustes" que="los ajustes" carga={carga}>
      {d ? (
        <>
          <p className="admin-nota">
            Para corregir el inventario con lo que hay de verdad. Lo aprueba otra persona{puedeAprobar ? ': no puedes aprobar un ajuste que reportaste tú' : ' (el dueño)'}.
          </p>
          {d.lotes.length ? <Reportar lotes={d.lotes} alReportar={recargarCallado} /> : <p className="admin-vacio">No hay lotes con saldo que ajustar: primero hay que recibir una compra.</p>}
          <h3 className="admin-subtitulo">Ajustes</h3>
          {d.ajustes.length ? (
            <ul className="admin-materiales">
              {d.ajustes.map((a) => <Ajuste key={a.codigo} a={a} costos={d.costos} puedeAprobar={puedeAprobar} alCambiar={recargarCallado} />)}
            </ul>
          ) : <p className="admin-vacio">Todavía no hay ajustes.</p>}
        </>
      ) : null}
    </Seccion>
  );
}

export default Ajustes;
