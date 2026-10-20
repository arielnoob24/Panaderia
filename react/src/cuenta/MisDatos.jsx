// ---- #/cuenta: Mis datos ---------------------------------------------------
// Nombre, telefono y direccion, editables aqui mismo con las mismas reglas que
// al crear la cuenta; el correo se ve pero no se cambia: es con el que se
// entra y adonde llega el comprobante, y cambiarlo pediria verificarlo otra
// vez. "Guardar los cambios" y "Cerrar sesion", que no borra la cuenta y
// lleva a la portada (seccion 15 del plan, fase 5). Sin sesion, a entrar.
//
// Las clases para frontend: cuenta-datos-correo (el correo fijo),
// cuenta-guardar (el boton que pasa a "Guardado" un momento), cuenta-hecho
// (el renglon que confirma) y cuenta-salir.
import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useSesion } from '../estado/SesionProvider.jsx';
import { usePedido } from '../estado/PedidoProvider.jsx';
import { useAvisos } from '../comun/Avisos.jsx';
import { soloNueve, fallosEditar, avisoFaltan } from '../servicios/cuenta.js';
import MarcoCuenta from './MarcoCuenta.jsx';
import CampoCuenta from './CampoCuenta.jsx';
import { Desvio } from './Desvio.jsx';
import { useEnterAvanza } from './useEnterAvanza.js';
import { usePedidosGuardados } from './usePedidosGuardados.js';

const ORDEN = ['nombre', 'telefono', 'direccion'];
const limpios = (d) => Object.fromEntries(ORDEN.map((c) => [c, d[c].trim()]));

function MisDatos() {
  // Se mira al llegar y no despues: al cerrar la sesion, la vista se queda
  // hasta que llega la portada (vease Desvio.jsx).
  const [conSesion] = useState(useSesion().dentro);
  if (!conSesion) return <Desvio a="/cuenta/entrar" />;
  return <FormularioDatos />;
}

function FormularioDatos() {
  const sesion = useSesion();
  const { entrega, hacer } = usePedido();
  const avisar = useAvisos();
  const navegar = useNavigate();
  const pedidos = usePedidosGuardados();
  // El formulario arranca con lo que ya hay: se corrige, no se reescribe.
  const [datos, setDatos] = useState(() => ({
    nombre: sesion.nombre, telefono: sesion.telefono, direccion: sesion.direccion,
  }));
  const [tocados, setTocados] = useState(() => new Set());
  const [intentado, setIntentado] = useState(false);
  const [aviso, setAviso] = useState('');
  const [hecho, setHecho] = useState('');
  const refs = { nombre: useRef(null), telefono: useRef(null), direccion: useRef(null) };

  // Mismo momento que al crear la cuenta: un campo se marca cuando ya lo
  // dejaste o cuando intentaste guardar.
  const fallos = fallosEditar(limpios(datos));
  const errorDe = (campo) => (intentado || tocados.has(campo) ? fallos[campo] || '' : '');

  const alCambiar = (campo) => (e) => {
    const valor = campo === 'telefono' ? soloNueve(e.target.value) : e.target.value;
    setDatos((d) => ({ ...d, [campo]: valor }));
    // "Guardamos tus cambios" deja de ser verdad en cuanto se toca algo.
    setHecho('');
  };
  const alDejar = (campo) => () => setTocados((t) => (t.has(campo) ? t : new Set(t).add(campo)));

  const alGuardar = () => {
    const malos = ORDEN.filter((c) => fallos[c]);
    if (malos.length) {
      flushSync(() => { setIntentado(true); setAviso(avisoFaltan(malos.length)); });
      refs[malos[0]].current?.focus();
      return;
    }
    const v = limpios(datos);
    // Si la direccion del pedido era la de la cuenta, cambia con ella. Si en
    // el pedido se escribio otra, esa manda, igual que al entrar.
    if (entrega.direccion && entrega.direccion === sesion.direccion) {
      hacer({ tipo: 'entrega', campo: 'direccion', valor: v.direccion });
    } else if (!entrega.direccion && v.direccion) {
      hacer({ tipo: 'entrega', campo: 'direccion', valor: v.direccion });
    }
    sesion.editar(v);
    setDatos(v);
    setIntentado(false);
    setTocados(new Set());
    setAviso('');
    setHecho('Guardamos tus cambios.');
    avisar('Guardamos tus cambios.');
  };

  const alSalir = () => {
    const nombre = sesion.nombre;
    sesion.salir();
    // replace: Atras no vuelve a los datos de una sesion ya cerrada.
    navegar('/', { replace: true });
    avisar(`Cerraste la sesión de ${nombre}.`);
  };

  const alTeclear = useEnterAvanza(ORDEN.map((c) => refs[c]), alGuardar);
  const n = pedidos?.length || 0;

  const campo = (nombre, props) => (
    <CampoCuenta
      id={`editar-${nombre}`}
      value={datos[nombre]}
      error={errorDe(nombre)}
      campoRef={refs[nombre]}
      onChange={alCambiar(nombre)}
      onBlur={alDejar(nombre)}
      {...props}
    />
  );

  return (
    <MarcoCuenta paso="datos" titulo="Mis datos">
      <div className="cuenta-formulario" onKeyDown={alTeclear}>
        <div className="cuenta-cuerpo">
          <dl className="cuenta-datos cuenta-datos-correo">
            <div><dt>Correo</dt><dd>{sesion.correo}</dd></div>
          </dl>
          <p className="cuenta-nota cuenta-nota-izq">
            El correo no se cambia aquí: es con el que entras y adonde te llega el comprobante.
          </p>
          {campo('nombre', { etiqueta: 'Nombre y apellido', type: 'text', autoComplete: 'name', maxLength: 60 })}
          {campo('telefono', {
            etiqueta: 'Teléfono', type: 'tel', inputMode: 'numeric', autoComplete: 'tel',
            maxLength: 9, placeholder: '990001122', prefijo: '+593',
          })}
          {campo('direccion', {
            etiqueta: 'Dirección', type: 'text', autoComplete: 'street-address', maxLength: 200,
            placeholder: 'Calle, número y una referencia', opcional: true,
          })}
          <p className="cuenta-hecho" hidden={!hecho}>{hecho}</p>
        </div>
        <div className="cuenta-pie">
          <p className="cuenta-aviso" role="alert" hidden={!aviso}>{aviso}</p>
          <button className="button button-yellow cuenta-guardar" type="button" onClick={alGuardar}>
            Guardar los cambios
          </button>
          <Link className="cuenta-editar cuenta-ver-pedidos" to="/cuenta/pedidos">
            {n ? `Ver mis pedidos (${n})` : 'Ver mis pedidos'}
          </Link>
          <button className="cuenta-salir" type="button" onClick={alSalir}>Cerrar sesión</button>
          <p className="cuenta-nota">
            La cuenta se queda guardada en este navegador: puedes volver a entrar con tu correo y tu
            contraseña. No hay ningún otro lugar donde estuviera guardada.
          </p>
        </div>
      </div>
    </MarcoCuenta>
  );
}

export default MisDatos;
