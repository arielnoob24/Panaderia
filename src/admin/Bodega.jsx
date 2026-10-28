// ---- Panel, Bodega: recibir lo que compro el local -------------------------
// Ultimo paso del flujo de compras. Cada orden aprobada deja una recepcion
// pendiente; aqui quien recibe pone cuanto llego de cada material (ya viene
// escrito lo que falta, para el caso comun de que llego todo) y, si es
// perecible, hasta cuando dura (si no se pone, la base usa los dias de vida
// util del material). Cada linea se vuelve un lote y de ahi sale el
// Inventario. No se recibe mas de lo que falta, y si llega menos hay que
// decir por que. Sin precios: quien recibe no los ve (bodega.recibir lo tienen
// el Administrador y el Empleado).
import { useRef, useState } from 'react';
import { pedirApi } from '../servicios/api.js';
import { marcaBonita } from '../servicios/storage.js';
import { useAvisos } from '../comun/Avisos.jsx';
import { useCarga, textoDeFallo } from './useCarga.js';
import Seccion from './Seccion.jsx';

const numero = new Intl.NumberFormat('es-EC', { maximumFractionDigits: 2 });
const dia = (iso) => new Date(`${String(iso).slice(0, 10)}T12:00:00`).toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' });

function Pendiente({ r, alRecibir }) {
  const avisar = useAvisos();
  const [cantidades, setCantidades] = useState(() => Object.fromEntries(r.lineas.map((l) => [l.codigo, String(Number(l.falta))])));
  const [caducidades, setCaducidades] = useState({});
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');
  const [trabajando, setTrabajando] = useState(false);
  const formRef = useRef(null);
  const idError = `admin-error-${r.codigo}`;
  const corto = r.lineas.some((l) => Number(String(cantidades[l.codigo] ?? '0').replace(',', '.')) < Number(l.falta));

  const recibir = async (e) => {
    e.preventDefault();
    if (trabajando) return;
    setTrabajando(true);
    setError('');
    try {
      await pedirApi(`/admin/recepciones/${r.codigo}`, {
        metodo: 'POST', sesion: true, espera: 10000,
        cuerpo: {
          observacion: motivo,
          lineas: r.lineas.map((l) => ({
            material: l.codigo, cantidad: String(cantidades[l.codigo] ?? '0').trim().replace(',', '.') || '0', caducidad: caducidades[l.codigo] || '',
          })),
        },
      });
      avisar(`Recibiste la compra de ${r.proveedor} (${r.orden}).`);
      await alRecibir();
      return;
    } catch (err) {
      setError(textoDeFallo(err));
      formRef.current?.querySelector('input')?.focus();
    }
    setTrabajando(false);
  };

  return (
    <li className="admin-material">
      <form ref={formRef} onSubmit={recibir} noValidate aria-label={`Recibir la orden ${r.orden} de ${r.proveedor}`}>
        <div className="admin-material-cabeza">
          <h4 className="admin-proveedor-nombre">{r.proveedor}</h4>
          <span className="admin-estado is-abierto">Por recibir</span>
        </div>
        <p className="admin-material-datos">Orden {r.orden} · se espera el {dia(r.entrega)}</p>
        <div className="admin-lineas-recibir">
          {r.lineas.map((l) => (
            <div key={l.codigo} className="admin-campos admin-linea-recibir">
              <label className="admin-campo"><span>{l.nombre}<small>pedido {numero.format(Number(l.pedido))} {l.unidad}, falta {numero.format(Number(l.falta))}</small></span>
                <span className="admin-precio-caja">
                  <input
                    type="text" inputMode="decimal" value={cantidades[l.codigo]} aria-label={`Cuánto llegó de ${l.nombre} en ${l.unidad}`}
                    aria-describedby={error ? idError : undefined}
                    onChange={(e) => { setCantidades((x) => ({ ...x, [l.codigo]: e.target.value })); setError(''); }}
                  />
                  <span aria-hidden="true">{l.unidad}</span>
                </span>
              </label>
              {l.perecible ? (
                <label className="admin-campo"><span>Caduca{l.diasVida ? ` (si no, ${l.diasVida} días)` : ''}<span className="sr-only"> {l.nombre}</span></span>
                  <input type="date" value={caducidades[l.codigo] || ''} onChange={(e) => setCaducidades((x) => ({ ...x, [l.codigo]: e.target.value }))} />
                </label>
              ) : null}
            </div>
          ))}
        </div>
        <label className="admin-campo admin-ancho">
          <span>{corto ? 'Motivo: llegó menos de lo pedido' : 'Observación (opcional)'}</span>
          <input type="text" autoComplete="off" value={motivo} aria-invalid={corto && !motivo.trim() && error ? true : undefined} onChange={(e) => { setMotivo(e.target.value); setError(''); }} />
        </label>
        {error ? <p id={idError} className="admin-error" role="alert">{error}</p> : null}
        <div className="admin-acciones">
          <button className="cuenta-pedido-otra admin-guardar" type="submit" aria-disabled={trabajando || undefined} aria-label={`Confirmar la recepción de ${r.orden}`}>
            {trabajando ? 'Guardando…' : 'Confirmar recepción'}
          </button>
        </div>
      </form>
    </li>
  );
}

function Bodega() {
  const carga = useCarga('/admin/recepciones', null);
  const tituloRef = useRef(null);
  const d = carga.datos;

  // Vuelve a pedir la lista sin mostrar "Cargando…" (el foco no se pierde) y
  // lleva el foco al titulo, porque lo recibido sale de la lista.
  const recargarCallado = async () => {
    try { carga.ponerDatos(await pedirApi('/admin/recepciones', { sesion: true, espera: 10000 })); } catch { carga.recargar(); }
    requestAnimationFrame(() => tituloRef.current?.focus());
  };

  return (
    <Seccion id="admin-bodega" titulo="Bodega" que="la bodega" carga={carga} tituloRef={tituloRef}>
      {d ? (
        <>
          <h3 className="admin-subtitulo">Por recibir</h3>
          {d.pendientes.length ? (
            <ul className="admin-materiales">{d.pendientes.map((r) => <Pendiente key={r.codigo} r={r} alRecibir={recargarCallado} />)}</ul>
          ) : <p className="admin-vacio">No hay compras por recibir. Aparecen aquí cuando el dueño aprueba una orden de compra.</p>}

          <h3 className="admin-subtitulo">Recibido hace poco</h3>
          {d.recibidas.length ? (
            <ul className="admin-lista admin-recibidas">
              {d.recibidas.map((r) => (
                <li key={r.codigo}>
                  <span>{r.proveedor} · {r.orden}
                    <small>{r.lotes.map((l) => `${numero.format(Number(l.cantidad))} ${l.unidad} de ${l.nombre}`).join(', ')}</small>
                    {r.observacion ? <small>Motivo: {r.observacion}</small> : null}
                  </span>
                  <strong>{marcaBonita(new Date(r.fecha))}</strong>
                </li>
              ))}
            </ul>
          ) : <p className="admin-vacio">Todavía no se ha recibido nada.</p>}
        </>
      ) : null}
    </Seccion>
  );
}

export default Bodega;
