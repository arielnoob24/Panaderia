// ---- Panel, Produccion: las tandas que se hornean -------------------------
// Quien hornea o prepara registra aqui lo que ya hizo: que producto, en que
// tamaño y cuantas unidades. Al registrarla la base descuenta de los lotes lo
// que pide la receta (por FEFO, FIFO, LIFO o promedio segun cada material) y
// la tanda queda como "Producida"; si algun material no alcanza no se guarda
// nada y el mensaje dice cual falta. Una tanda producida ya no se anula. El
// costo de la tanda solo lo ve quien tiene reportes.ver (el Administrador).
import { useRef, useState } from 'react';
import { dinero } from '../servicios/state.js';
import { pedirApi } from '../servicios/api.js';
import { marcaBonita } from '../servicios/storage.js';
import { useAvisos } from '../comun/Avisos.jsx';
import { useCarga, textoDeFallo } from './useCarga.js';
import Seccion from './Seccion.jsx';

function Registrar({ productos, alRegistrar }) {
  const avisar = useAvisos();
  const [clave, setClave] = useState(`${productos[0].producto}|${productos[0].tamano}`);
  const [cantidad, setCantidad] = useState('');
  const [error, setError] = useState('');
  const [trabajando, setTrabajando] = useState(false);
  const cantidadRef = useRef(null);

  const registrar = async (e) => {
    e.preventDefault();
    if (trabajando) return;
    if (!/^\d{1,4}$/.test(cantidad.trim()) || Number(cantidad) < 1) {
      setError('Pon cuántas unidades salieron: un número entero de 1 a 9999.');
      cantidadRef.current?.focus();
      return;
    }
    const [producto, tamano] = clave.split('|');
    setTrabajando(true);
    setError('');
    try {
      await pedirApi('/admin/produccion', { metodo: 'POST', sesion: true, espera: 10000, cuerpo: { producto, tamano, cantidad: Number(cantidad) } });
      avisar(`Registraste ${cantidad} de ${productos.find((p) => p.producto === producto && p.tamano === tamano).nombre}.`);
      setCantidad('');
      await alRegistrar();
    } catch (err) {
      setError(textoDeFallo(err));
      cantidadRef.current?.focus();
    }
    setTrabajando(false);
  };

  return (
    <form className="admin-formulario" onSubmit={registrar} noValidate aria-labelledby="admin-registrar-tanda">
      <h3 id="admin-registrar-tanda" className="admin-subtitulo">Registrar una tanda</h3>
      <div className="admin-campos">
        <label className="admin-campo admin-ancho"><span>Producto</span>
          <select value={clave} onChange={(e) => { setClave(e.target.value); setError(''); }}>
            {productos.map((p) => <option key={`${p.producto}|${p.tamano}`} value={`${p.producto}|${p.tamano}`}>{p.nombre}</option>)}
          </select>
        </label>
        <label className="admin-campo"><span>Unidades que salieron</span>
          <input ref={cantidadRef} type="text" inputMode="numeric" autoComplete="off" value={cantidad} aria-describedby={error ? 'admin-error-tanda' : undefined}
            aria-invalid={error && !/^\d{1,4}$/.test(cantidad.trim()) ? true : undefined} onChange={(e) => { setCantidad(e.target.value); setError(''); }} />
        </label>
      </div>
      {error ? <p id="admin-error-tanda" className="admin-error" role="alert">{error}</p> : null}
      <div className="admin-acciones">
        <button className="cuenta-pedido-otra admin-guardar" type="submit" aria-disabled={trabajando || undefined}>{trabajando ? 'Registrando…' : 'Registrar tanda'}</button>
      </div>
    </form>
  );
}

function Produccion() {
  const carga = useCarga('/admin/produccion', null);
  const d = carga.datos;
  const recargarCallado = async () => {
    try { carga.ponerDatos(await pedirApi('/admin/produccion', { sesion: true, espera: 10000 })); } catch { carga.recargar(); }
  };

  return (
    <Seccion id="admin-produccion" titulo="Producción" que="la producción" carga={carga}>
      {d ? (
        <>
          <p className="admin-nota">Al registrar una tanda se descuentan de la bodega los materiales de su receta. Una tanda registrada ya no se anula.</p>
          {d.productos.length ? <Registrar productos={d.productos} alRegistrar={recargarCallado} /> : <p className="admin-vacio">Ningún producto tiene receta todavía.</p>}
          <h3 className="admin-subtitulo">Últimas tandas</h3>
          {d.ordenes.length ? (
            <ul className="admin-lista admin-tandas">
              {d.ordenes.map((o) => (
                <li key={o.codigo}>
                  <span>{o.producto}{o.tamano === 'Único' ? '' : ` ${o.tamano}`}
                    <small>{o.codigo} · {o.hizo} · {marcaBonita(new Date(o.fecha))}{d.costos && o.costoTotal !== null ? ` · costó ${dinero(Number(o.costoTotal))}` : ''}</small>
                  </span>
                  <strong>{o.cantidad} u · {o.estado}</strong>
                </li>
              ))}
            </ul>
          ) : <p className="admin-vacio">Todavía no se ha registrado ninguna tanda.</p>}
        </>
      ) : null}
    </Seccion>
  );
}

export default Produccion;
