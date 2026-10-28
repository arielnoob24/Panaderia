// ---- Panel, Compras: los proveedores y lo que vende cada uno --------------
// Primer paso del flujo de compras: antes de hacer una orden hay que tener a
// quien comprarle y que le compramos (la base solo deja pedir lo que el
// proveedor vende, con su precio de referencia por unidad de compra y sin
// IVA). Solo para quien tiene compras.aprobar. La cedula, el RUC, el correo y
// los telefonos los revisa la base y su mensaje sale tal cual junto al
// formulario; aqui solo se evita ir al servidor con lo que se ve mal.
//
// Cada boton lleva el nombre del proveedor o del material en su nombre
// accesible, el error de un formulario es un role="alert" y el foco va al
// primer campo, y los botones apagados son aria-disabled (el foco no se pierde).
import { useEffect, useRef, useState } from 'react';
import { dinero } from '../servicios/state.js';
import { pedirApi } from '../servicios/api.js';
import { useAvisos } from '../comun/Avisos.jsx';
import { useCarga, textoDeFallo } from './useCarga.js';
import Seccion from './Seccion.jsx';

const aNumero = (texto) => Number(String(texto).trim().replace(',', '.'));
const precioBueno = (texto) => /^\d{1,4}([.,]\d{1,4})?$/.test(String(texto).trim()) && aNumero(texto) > 0 && aNumero(texto) < 10000;
const diasBuenos = (texto) => /^\d{1,3}$/.test(String(texto).trim()) && Number(texto) <= 365;

const VACIO = { tipo: '05', identificacion: '', razonSocial: '', correo: '', celular: '', telefono: '', direccion: '', canton: '1501' };

function NuevoProveedor({ cantones, alCrear, alCerrar }) {
  const avisar = useAvisos();
  const [v, setV] = useState(VACIO);
  const [error, setError] = useState('');
  const [trabajando, setTrabajando] = useState(false);
  const formRef = useRef(null);
  const poner = (campo) => (e) => { setV((x) => ({ ...x, [campo]: e.target.value })); setError(''); };

  const crear = async (e) => {
    e.preventDefault();
    if (trabajando) return;
    setTrabajando(true);
    setError('');
    try {
      const nuevo = await pedirApi('/admin/proveedores', { metodo: 'POST', sesion: true, espera: 10000, cuerpo: v });
      alCrear(nuevo);
      avisar(`Creaste el proveedor ${nuevo.razonSocial}.`);
    } catch (err) {
      setError(textoDeFallo(err));
      formRef.current?.querySelector('input')?.focus();
    }
    setTrabajando(false);
  };

  return (
    <form ref={formRef} className="admin-formulario" onSubmit={crear} noValidate aria-labelledby="admin-nuevo-prov">
      <h3 id="admin-nuevo-prov" className="admin-subtitulo">Nuevo proveedor</h3>
      <div className="admin-campos">
        <label className="admin-campo"><span>Factura con</span>
          <select value={v.tipo} onChange={poner('tipo')}>
            <option value="05">Cédula</option>
            <option value="04">RUC</option>
          </select>
        </label>
        <label className="admin-campo"><span>{v.tipo === '04' ? 'RUC' : 'Cédula'}</span>
          <input type="text" inputMode="numeric" autoComplete="off" value={v.identificacion} onChange={poner('identificacion')} aria-describedby={error ? 'admin-error-prov' : undefined} />
        </label>
        <label className="admin-campo admin-ancho"><span>Nombre o razón social</span>
          <input type="text" autoComplete="off" value={v.razonSocial} onChange={poner('razonSocial')} />
        </label>
        <label className="admin-campo"><span>Correo</span>
          <input type="email" autoComplete="off" value={v.correo} onChange={poner('correo')} />
        </label>
        <label className="admin-campo"><span>Celular (opcional)</span>
          <input type="text" inputMode="tel" autoComplete="off" value={v.celular} onChange={poner('celular')} />
        </label>
        <label className="admin-campo"><span>Teléfono fijo (opcional)</span>
          <input type="text" inputMode="tel" autoComplete="off" value={v.telefono} onChange={poner('telefono')} />
        </label>
        <label className="admin-campo admin-ancho"><span>Dirección</span>
          <input type="text" autoComplete="off" value={v.direccion} onChange={poner('direccion')} />
        </label>
        <label className="admin-campo"><span>Cantón</span>
          <select value={v.canton} onChange={poner('canton')}>
            {cantones.map((c) => <option key={c.codigo} value={c.codigo}>{c.nombre}</option>)}
          </select>
        </label>
      </div>
      {error ? <p id="admin-error-prov" className="admin-error" role="alert">{error}</p> : null}
      <div className="admin-acciones">
        <button className="cuenta-pedido-otra admin-guardar" type="submit" aria-disabled={trabajando || undefined}>{trabajando ? 'Creando…' : 'Crear proveedor'}</button>
        <button className="admin-ver-mov" type="button" onClick={alCerrar}>Cancelar</button>
      </div>
    </form>
  );
}

// Lo que vende un proveedor, con su formulario para agregar o cambiar un material.
function Vende({ p, materiales, alCambiar }) {
  const avisar = useAvisos();
  const libres = materiales.filter((m) => !p.materiales.some((x) => x.codigo === m.codigo));
  const [material, setMaterial] = useState('');
  const [precio, setPrecio] = useState('');
  const [dias, setDias] = useState('1');
  const [error, setError] = useState('');
  const [trabajando, setTrabajando] = useState(false);
  const idError = `admin-error-vende-${p.codigo}`;
  const elegido = material || libres[0]?.codigo || '';

  const llamar = async (ruta, metodo, cuerpo, aviso) => {
    setTrabajando(true);
    setError('');
    try {
      alCambiar(await pedirApi(ruta, { metodo, sesion: true, espera: 10000, cuerpo }));
      avisar(aviso);
      return true;
    } catch (err) {
      setError(textoDeFallo(err));
      return false;
    } finally {
      setTrabajando(false);
    }
  };

  const agregar = async (e) => {
    e.preventDefault();
    if (trabajando || !elegido) return;
    if (!precioBueno(precio)) { setError('El precio va mayor que 0 y menor que 10000, sin IVA.'); return; }
    if (!diasBuenos(dias)) { setError('Los días de entrega van de 0 a 365.'); return; }
    const nombre = materiales.find((m) => m.codigo === elegido)?.nombre;
    const bien = await llamar(`/admin/proveedores/${p.codigo}/materiales/${elegido}`, 'PUT',
      { precio: aNumero(precio), dias: Number(dias) }, `${p.razonSocial} vende ${nombre}.`);
    if (bien) { setMaterial(''); setPrecio(''); }
  };

  return (
    <div className="admin-vende">
      <h4 className="admin-subtitulo">Qué vende</h4>
      {p.materiales.length ? (
        <ul className="admin-lista">
          {p.materiales.map((m) => (
            <li key={m.codigo}>
              <span>{m.nombre}<small>{dinero(Number(m.precio))} por {m.unidad} sin IVA · entrega en {m.dias} {m.dias === 1 ? 'día' : 'días'}</small></span>
              <button
                className="admin-ver-mov" type="button" aria-label={`Quitar ${m.nombre} de lo que vende ${p.razonSocial}`}
                aria-disabled={trabajando || undefined}
                onClick={() => !trabajando && llamar(`/admin/proveedores/${p.codigo}/materiales/${m.codigo}/quitar`, 'POST', undefined, `${p.razonSocial} ya no vende ${m.nombre}.`)}
              >Quitar</button>
            </li>
          ))}
        </ul>
      ) : <p className="admin-vacio">Todavía no se le ha puesto nada. Sin esto no se le puede hacer una orden de compra.</p>}
      {libres.length ? (
        <form className="admin-campos admin-vende-form" onSubmit={agregar} noValidate aria-label={`Agregar lo que vende ${p.razonSocial}`}>
          <label className="admin-campo"><span>Material</span>
            <select value={elegido} onChange={(e) => { setMaterial(e.target.value); setError(''); }}>
              {libres.map((m) => <option key={m.codigo} value={m.codigo}>{m.nombre} ({m.unidad})</option>)}
            </select>
          </label>
          <label className="admin-campo"><span>Precio sin IVA</span>
            <input type="text" inputMode="decimal" value={precio} aria-describedby={error ? idError : undefined} aria-invalid={error && !precioBueno(precio) ? true : undefined}
              onChange={(e) => { setPrecio(e.target.value); setError(''); }} />
          </label>
          <label className="admin-campo"><span>Días de entrega</span>
            <input type="text" inputMode="numeric" value={dias} onChange={(e) => { setDias(e.target.value); setError(''); }} />
          </label>
          <button className="cuenta-pedido-otra admin-guardar" type="submit" aria-disabled={trabajando || undefined}>Agregar</button>
        </form>
      ) : null}
      {error ? <p id={idError} className="admin-error" role="alert">{error}</p> : null}
    </div>
  );
}

function Proveedor({ p, materiales, alCambiar }) {
  const avisar = useAvisos();
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState('');
  const [trabajando, setTrabajando] = useState(false);

  const cambiarActivo = async () => {
    if (trabajando) return;
    setTrabajando(true);
    setError('');
    try {
      alCambiar(await pedirApi(`/admin/proveedores/${p.codigo}`, { metodo: 'PUT', sesion: true, espera: 10000, cuerpo: { activo: !p.activo } }));
      avisar(`${p.razonSocial} quedó ${p.activo ? 'desactivado' : 'activo'}.`);
    } catch (err) {
      setError(textoDeFallo(err));
    }
    setTrabajando(false);
  };

  return (
    <li className="admin-material">
      <div className="admin-material-cabeza">
        <h3 className="admin-proveedor-nombre">{p.razonSocial}</h3>
        {p.activo ? null : <span className="admin-agotado">Desactivado</span>}
      </div>
      <p className="admin-material-datos">
        {p.tipo} {p.identificacion} · {p.canton}
        <br />{p.correo}{p.celular ? ` · ${p.celular}` : ''}{p.telefono ? ` · ${p.telefono}` : ''}
        <br />{p.direccion}
        <br />Vende {p.materiales.length} {p.materiales.length === 1 ? 'material' : 'materiales'}
      </p>
      <div className="admin-acciones">
        <button className="admin-ver-mov" type="button" aria-expanded={abierto} aria-label={`${abierto ? 'Ocultar' : 'Ver'} lo que vende ${p.razonSocial}`} onClick={() => setAbierto((a) => !a)}>
          {abierto ? 'Ocultar lo que vende' : 'Lo que vende'}
        </button>
        <button className="admin-ver-mov" type="button" aria-disabled={trabajando || undefined} aria-label={`${p.activo ? 'Desactivar' : 'Activar'} a ${p.razonSocial}`} onClick={cambiarActivo}>
          {p.activo ? 'Desactivar' : 'Activar'}
        </button>
      </div>
      {error ? <p className="admin-error" role="alert">{error}</p> : null}
      {abierto ? <Vende p={p} materiales={materiales} alCambiar={alCambiar} /> : null}
    </li>
  );
}

function Compras() {
  const carga = useCarga('/admin/proveedores', null);
  const [nuevo, setNuevo] = useState(false);
  const botonRef = useRef(null);
  const volver = useRef(false);
  const d = carga.datos;

  // Al cerrar el formulario, el foco vuelve al boton que lo abrio (ya pintado).
  useEffect(() => {
    if (!nuevo && volver.current) { volver.current = false; botonRef.current?.focus(); }
  }, [nuevo]);
  const cerrar = () => { volver.current = true; setNuevo(false); };

  const reemplazar = (p) => carga.ponerDatos({ ...d, proveedores: d.proveedores.map((x) => (x.codigo === p.codigo ? p : x)) });
  const agregado = (p) => {
    const todos = [...d.proveedores, p].sort((a, b) => a.razonSocial.localeCompare(b.razonSocial, 'es'));
    carga.ponerDatos({ ...d, proveedores: todos });
    cerrar();
  };

  return (
    <Seccion id="admin-compras" titulo="Compras" que="los proveedores" carga={carga}>
      {d ? (
        <>
          <h3 className="admin-subtitulo">Proveedores</h3>
          <p className="admin-nota">A un proveedor solo se le puede pedir lo que tiene en «Lo que vende», con su precio de referencia.</p>
          {nuevo ? (
            <NuevoProveedor cantones={d.cantones} alCrear={agregado} alCerrar={cerrar} />
          ) : (
            <button ref={botonRef} className="cuenta-pedido-otra admin-guardar" type="button" onClick={() => setNuevo(true)}>Nuevo proveedor</button>
          )}
          {d.proveedores.length ? (
            <ul className="admin-materiales">{d.proveedores.map((p) => <Proveedor key={p.codigo} p={p} materiales={d.materiales} alCambiar={reemplazar} />)}</ul>
          ) : <p className="admin-vacio">Todavía no hay proveedores. Crea el primero para poder hacer una orden de compra.</p>}
        </>
      ) : null}
    </Seccion>
  );
}

export default Compras;
