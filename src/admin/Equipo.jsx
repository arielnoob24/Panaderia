// ---- Panel, Equipo: los empleados y quien entra al panel --------------------
// Solo el Administrador (usuarios.gestionar). Tres cosas: dar de alta a un
// empleado (la base revisa cedula, correo, celular y edad), cambiarle el cargo
// o el sueldo, y darle o quitarle el acceso al panel ligando su cuenta del sitio
// (la que creo con su correo) con el rol Empleado o Administrador. Dar de baja a
// un empleado le quita el acceso a sus cuentas. Nadie cambia su propia cuenta:
// esos botones no se pintan en la ficha propia y la API tambien lo niega.
// Quitar acceso y dar de baja piden confirmar ("Sí" y "No, dejarlo": el foco va
// al "Sí", Escape lo deja como estaba y el foco vuelve al boton que lo armo).
import { useEffect, useRef, useState } from 'react';
import { dinero } from '../servicios/state.js';
import { pedirApi } from '../servicios/api.js';
import { useSesion } from '../estado/SesionProvider.jsx';
import { useAvisos } from '../comun/Avisos.jsx';
import { useCarga, textoDeFallo } from './useCarga.js';
import Seccion from './Seccion.jsx';

const VACIO = {
  cedula: '', primerNombre: '', segundoNombre: '', primerApellido: '', segundoApellido: '', nacimiento: '', sexo: 'H',
  correo: '', celular: '', direccion: '', canton: '1501', cargo: '', contrato: 'PER', sueldo: '',
};
const CONTRATOS = [['PER', 'Permanente'], ['TEM', 'Temporal'], ['TER', 'Tercerizado'], ['SPR', 'Servicios profesionales']];

function NuevoEmpleado({ cargos, cantones, alCrear, alCerrar }) {
  const avisar = useAvisos();
  const [v, setV] = useState({ ...VACIO, cargo: cargos[0]?.codigo || '' });
  const [error, setError] = useState('');
  const [trabajando, setTrabajando] = useState(false);
  const formRef = useRef(null);
  const poner = (campo) => (e) => { setV((x) => ({ ...x, [campo]: e.target.value })); setError(''); };
  const texto = (campo, etiqueta, extra = {}) => (
    <label className="admin-campo"><span>{etiqueta}</span>
      <input type="text" autoComplete="off" value={v[campo]} onChange={poner(campo)} {...extra} />
    </label>
  );

  const crear = async (e) => {
    e.preventDefault();
    if (trabajando) return;
    setTrabajando(true);
    setError('');
    try {
      const nuevo = await pedirApi('/admin/equipo', { metodo: 'POST', sesion: true, espera: 10000, cuerpo: { ...v, sueldo: v.sueldo.trim().replace(',', '.') } });
      alCrear(nuevo);
      avisar(`Diste de alta a ${nuevo.nombre}.`);
    } catch (err) {
      setError(textoDeFallo(err));
      formRef.current?.querySelector('input')?.focus();
    }
    setTrabajando(false);
  };

  return (
    <form ref={formRef} className="admin-formulario" onSubmit={crear} noValidate aria-labelledby="admin-nuevo-emp">
      <h3 id="admin-nuevo-emp" className="admin-subtitulo">Nuevo empleado</h3>
      <div className="admin-campos">
        {texto('cedula', 'Cédula', { inputMode: 'numeric' })}
        {texto('primerNombre', 'Primer nombre')}
        {texto('segundoNombre', 'Segundo nombre (opcional)')}
        {texto('primerApellido', 'Primer apellido')}
        {texto('segundoApellido', 'Segundo apellido (opcional)')}
        <label className="admin-campo"><span>Fecha de nacimiento</span>
          <input type="date" value={v.nacimiento} onChange={poner('nacimiento')} />
        </label>
        <label className="admin-campo"><span>Sexo</span>
          <select value={v.sexo} onChange={poner('sexo')}><option value="H">Hombre</option><option value="M">Mujer</option></select>
        </label>
        <label className="admin-campo"><span>Correo</span>
          <input type="email" autoComplete="off" value={v.correo} onChange={poner('correo')} />
        </label>
        {texto('celular', 'Celular', { inputMode: 'tel' })}
        <label className="admin-campo admin-ancho"><span>Dirección</span>
          <input type="text" autoComplete="off" value={v.direccion} onChange={poner('direccion')} />
        </label>
        <label className="admin-campo"><span>Cantón</span>
          <select value={v.canton} onChange={poner('canton')}>{cantones.map((c) => <option key={c.codigo} value={c.codigo}>{c.nombre}</option>)}</select>
        </label>
        <label className="admin-campo"><span>Cargo</span>
          <select value={v.cargo} onChange={poner('cargo')}>{cargos.map((c) => <option key={c.codigo} value={c.codigo}>{c.nombre}</option>)}</select>
        </label>
        <label className="admin-campo"><span>Contrato</span>
          <select value={v.contrato} onChange={poner('contrato')}>{CONTRATOS.map(([c, n]) => <option key={c} value={c}>{n}</option>)}</select>
        </label>
        {texto('sueldo', 'Sueldo mensual ($)', { inputMode: 'decimal' })}
      </div>
      {error ? <p className="admin-error" role="alert">{error}</p> : null}
      <div className="admin-acciones">
        <button className="cuenta-pedido-otra admin-guardar" type="submit" aria-disabled={trabajando || undefined}>{trabajando ? 'Guardando…' : 'Dar de alta'}</button>
        <button className="admin-ver-mov" type="button" onClick={alCerrar}>Cancelar</button>
      </div>
    </form>
  );
}

function Empleado({ e, cargos, miCorreo, alCambiar }) {
  const avisar = useAvisos();
  const [panel, setPanel] = useState(null); // 'acceso' | 'datos'
  const [pregunta, setPregunta] = useState(null); // { tipo: 'baja' } | { tipo: 'quitar', correo }
  const [correo, setCorreo] = useState('');
  const [rol, setRol] = useState('Empleado');
  const [sueldo, setSueldo] = useState(String(Number(e.sueldo).toFixed(2)));
  const [cargo, setCargo] = useState(e.cargoCodigo);
  const [error, setError] = useState('');
  const [trabajando, setTrabajando] = useState(false);
  const refs = useRef({});
  const confirmarRef = useRef(null);
  const devolver = useRef(null);
  const esYo = e.cuentas.some((c) => c.correo === miCorreo);

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

  const darAcceso = async (ev) => {
    ev.preventDefault();
    if (!correo.trim()) { setError('Escribe el correo de la cuenta del sitio.'); return; }
    if (await llamar(`/admin/equipo/${e.codigo}/cuenta`, 'PUT', { correo, rol }, `${e.nombre} tiene acceso al panel como ${rol.toLowerCase()}.`)) setCorreo('');
  };
  const guardarDatos = async (ev) => {
    ev.preventDefault();
    await llamar(`/admin/equipo/${e.codigo}`, 'PUT', { cargo, sueldo: sueldo.trim().replace(',', '.') }, `Guardaste a ${e.nombre}.`);
  };
  const armar = (p, origen) => {
    if (trabajando) return;
    devolver.current = null;
    setPregunta({ ...p, origen });
    avisar(`${p.tipo === 'baja' ? `¿Dar de baja a ${e.nombre}?` : `¿Quitar el acceso de ${p.correo}?`} Pulsa «Sí» para confirmar o Escape para dejarlo.`);
  };
  const dejar = () => { devolver.current = pregunta?.origen; setPregunta(null); };
  const alTeclear = (ev) => { if (ev.key === 'Escape') { ev.stopPropagation(); dejar(); } };
  const alSalir = (ev) => { if (!ev.currentTarget.contains(ev.relatedTarget)) setPregunta(null); };
  const confirmar = () => (pregunta.tipo === 'baja'
    ? llamar(`/admin/equipo/${e.codigo}`, 'PUT', { activo: false }, `${e.nombre} quedó de baja.`)
    : llamar(`/admin/equipo/${e.codigo}/cuenta/quitar`, 'POST', { correo: pregunta.correo }, `${pregunta.correo} ya no entra al panel.`));

  return (
    <li className="admin-material">
      <div className="admin-material-cabeza">
        <h4 className="admin-proveedor-nombre">{e.nombre}</h4>
        {e.activo ? null : <span className="admin-agotado">De baja</span>}
      </div>
      <p className="admin-material-datos">
        {e.cargo} · {e.contrato} · {dinero(Number(e.sueldo))} al mes<br />
        Cédula {e.cedula} · {e.correo} · {e.celular}
      </p>
      {e.cuentas.length ? (
        <ul className="admin-lista admin-orden-lineas" aria-label={`Cuentas de ${e.nombre} con acceso al panel`}>
          {e.cuentas.map((c) => (
            <li key={c.correo}>
              <span>{c.correo}<small>entra como {c.rol.toLowerCase()}{c.activa ? '' : ' (cuenta desactivada)'}</small></span>
              {c.correo === miCorreo ? <small>tu cuenta</small> : (
                <button
                  ref={(el) => { refs.current[`q-${c.correo}`] = el; }} className="admin-ver-mov" type="button" aria-disabled={trabajando || undefined}
                  aria-label={`Quitar el acceso al panel de ${c.correo}`} onClick={() => armar({ tipo: 'quitar', correo: c.correo }, `q-${c.correo}`)}
                >Quitar acceso</button>
              )}
            </li>
          ))}
        </ul>
      ) : <p className="admin-vacio">Sin acceso al panel: ninguna cuenta del sitio está ligada a {e.nombre}.</p>}

      {e.activo ? (
        <div className="admin-acciones">
          <button ref={(el) => { refs.current.acceso = el; }} className="admin-ver-mov" type="button" aria-expanded={panel === 'acceso'} aria-label={`Dar acceso al panel a ${e.nombre}`} onClick={() => { setPanel(panel === 'acceso' ? null : 'acceso'); setError(''); }}>Dar acceso</button>
          <button ref={(el) => { refs.current.datos = el; }} className="admin-ver-mov" type="button" aria-expanded={panel === 'datos'} aria-label={`Cambiar el cargo o el sueldo de ${e.nombre}`} onClick={() => { setPanel(panel === 'datos' ? null : 'datos'); setError(''); }}>Cargo y sueldo</button>
          {esYo ? null : (
            <button ref={(el) => { refs.current.baja = el; }} className="admin-cancelar" type="button" aria-disabled={trabajando || undefined} aria-label={`Dar de baja a ${e.nombre}`} onClick={() => armar({ tipo: 'baja' }, 'baja')}>Dar de baja</button>
          )}
        </div>
      ) : null}

      {panel === 'acceso' ? (
        <form className="admin-campos admin-vende-form" onSubmit={darAcceso} noValidate aria-label={`Dar acceso al panel a ${e.nombre}`}>
          <label className="admin-campo"><span>Correo de su cuenta del sitio</span>
            <input type="email" autoComplete="off" value={correo} onChange={(ev) => { setCorreo(ev.target.value); setError(''); }} />
          </label>
          <label className="admin-campo"><span>Entra como</span>
            <select value={rol} onChange={(ev) => setRol(ev.target.value)}><option>Empleado</option><option>Administrador</option></select>
          </label>
          <button className="cuenta-pedido-otra admin-guardar" type="submit" aria-disabled={trabajando || undefined}>Dar acceso</button>
        </form>
      ) : null}
      {panel === 'datos' ? (
        <form className="admin-campos admin-vende-form" onSubmit={guardarDatos} noValidate aria-label={`Cargo y sueldo de ${e.nombre}`}>
          <label className="admin-campo"><span>Cargo</span>
            <select value={cargo} onChange={(ev) => { setCargo(ev.target.value); setError(''); }}>{cargos.map((c) => <option key={c.codigo} value={c.codigo}>{c.nombre}</option>)}</select>
          </label>
          <label className="admin-campo"><span>Sueldo mensual ($)</span>
            <input type="text" inputMode="decimal" value={sueldo} onChange={(ev) => { setSueldo(ev.target.value); setError(''); }} />
          </label>
          <button className="cuenta-pedido-otra admin-guardar" type="submit" aria-disabled={trabajando || undefined}>Guardar</button>
        </form>
      ) : null}

      {pregunta ? (
        <div className="admin-confirma" role="group" aria-label={`Confirmar sobre ${e.nombre}`} onKeyDown={alTeclear} onBlur={alSalir}>
          <p>{pregunta.tipo === 'baja' ? `¿Dar de baja a ${e.nombre}? Sus cuentas dejan de entrar al panel.` : `¿Quitar el acceso al panel de ${pregunta.correo}? Vuelve a ser una cuenta de cliente.`}</p>
          <button ref={confirmarRef} type="button" className="admin-confirmar is-cancelar" aria-disabled={trabajando || undefined} onClick={confirmar}>
            {pregunta.tipo === 'baja' ? 'Sí, dar de baja' : 'Sí, quitar el acceso'}
          </button>
          <button type="button" className="admin-no" onClick={dejar}>No, dejarlo</button>
        </div>
      ) : null}
      {error ? <p className="admin-error" role="alert">{error}</p> : null}
    </li>
  );
}

function Equipo() {
  const { correo } = useSesion();
  const carga = useCarga('/admin/equipo', null);
  const [nuevo, setNuevo] = useState(false);
  const botonRef = useRef(null);
  const volver = useRef(false);
  const d = carga.datos;

  useEffect(() => {
    if (!nuevo && volver.current) { volver.current = false; botonRef.current?.focus(); }
  }, [nuevo]);
  const cerrar = () => { volver.current = true; setNuevo(false); };
  const reemplazar = (e) => carga.ponerDatos({ ...d, empleados: d.empleados.map((x) => (x.codigo === e.codigo ? e : x)) });

  return (
    <Seccion id="admin-equipo" titulo="Equipo" que="el equipo" carga={carga}>
      {d ? (
        <>
          <p className="admin-nota">Para dar acceso al panel, la persona crea primero su cuenta en el sitio con su correo; aquí se la liga a su ficha de empleado.</p>
          {nuevo ? (
            <NuevoEmpleado
              cargos={d.cargos} cantones={d.cantones} alCerrar={cerrar}
              alCrear={(e) => { carga.ponerDatos({ ...d, empleados: [...d.empleados, e] }); cerrar(); }}
            />
          ) : <button ref={botonRef} className="cuenta-pedido-otra admin-guardar" type="button" onClick={() => setNuevo(true)}>Nuevo empleado</button>}
          <h3 className="admin-subtitulo">Empleados</h3>
          <ul className="admin-materiales">
            {d.empleados.map((e) => <Empleado key={e.codigo} e={e} cargos={d.cargos} miCorreo={(correo || '').toLowerCase()} alCambiar={reemplazar} />)}
          </ul>
        </>
      ) : null}
    </Seccion>
  );
}

export default Equipo;
