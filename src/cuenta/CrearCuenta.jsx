// ---- #/cuenta/crear -------------------------------------------------------
// Nombre con apellido, correo, telefono de 9 cifras que empieza por 9 (+593
// delante), direccion opcional, contrasena con sus 4 requisitos visibles
// mientras se escribe, y repetirla (seccion 7 del plan). Con la sesion ya
// abierta, a Mis datos. Al crearla se va a verificar el correo: la cuenta no
// esta dentro hasta probar que el correo es suyo.
//
// Cada campo elige cuando se le puede reganar, como en el sitio presentado: el
// nombre, el correo y el telefono al salir de ellos; la contrasena nunca
// mientras se escribe (la lista de abajo ya dice lo que falta), solo al
// intentar crear la cuenta; la repeticion mientras se escribe, porque ahi no
// hay nada que adivinar, pero callada mientras este vacia.
//
// Las clases para frontend: cuenta-crear-datos (nombre, correo, telefono,
// direccion) y cuenta-crear-clave (las dos contrasenas), dentro de
// cuenta-crear-columnas, para las dos columnas de la computadora.
import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSesion } from '../estado/SesionProvider.jsx';
import { useAvisos } from '../comun/Avisos.jsx';
import { REGLAS, soloNueve, fallosCuenta, avisoFaltan, avisoDelCodigo } from '../servicios/cuenta.js';
import MarcoCuenta from './MarcoCuenta.jsx';
import CampoCuenta from './CampoCuenta.jsx';
import MarcaRegla from './MarcaRegla.jsx';
import TextoSuave from './TextoSuave.jsx';
import { Desvio, vieneDePagar } from './Desvio.jsx';
import { useEnterAvanza } from './useEnterAvanza.js';

const ORDEN = ['nombre', 'correo', 'telefono', 'direccion', 'clave', 'repite'];
// Las contrasenas van tal cual; lo demas se guarda sin espacios a los lados.
const limpios = (d) => Object.fromEntries(ORDEN.map((c) => [c, c === 'clave' || c === 'repite' ? d[c] : d[c].trim()]));

function CrearCuenta() {
  // Se mira al llegar y no despues (vease Desvio.jsx).
  const [conSesion] = useState(useSesion().dentro);
  if (conSesion) return <Desvio a="/cuenta" />;
  return <FormularioCrear />;
}

function FormularioCrear() {
  const { pendiente, crear } = useSesion();
  const avisar = useAvisos();
  const navegar = useNavigate();
  const location = useLocation();
  // Si se vuelve de verificar con "Cambiar el correo", lo escrito sigue ahi;
  // las contrasenas no, que no se guardan en ninguna parte.
  const [datos, setDatos] = useState(() => ({
    nombre: pendiente?.nombre || '', correo: pendiente?.correo || '',
    telefono: pendiente?.telefono || '', direccion: pendiente?.direccion || '', clave: '', repite: '',
  }));
  const [tocados, setTocados] = useState(() => new Set());
  const [intentado, setIntentado] = useState(false);
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const refs = {
    nombre: useRef(null), correo: useRef(null), telefono: useRef(null),
    direccion: useRef(null), clave: useRef(null), repite: useRef(null),
  };

  const fallos = fallosCuenta(limpios(datos));
  const errorDe = (campo) => {
    let toca;
    if (campo === 'clave') toca = intentado;
    else toca = intentado || tocados.has(campo) || (campo === 'repite' && Boolean(datos.repite));
    return toca ? fallos[campo] || '' : '';
  };

  const alCambiar = (campo) => (e) => {
    // El telefono solo admite cifras. El 0 de 09... se lo come el +593, asi
    // que escribir el numero de memoria tambien funciona.
    const valor = campo === 'telefono' ? soloNueve(e.target.value) : e.target.value;
    setDatos((d) => ({ ...d, [campo]: valor }));
  };
  const alDejar = (campo) => () => setTocados((t) => (t.has(campo) ? t : new Set(t).add(campo)));

  const alCrear = async () => {
    if (ocupado) return;
    const malos = ORDEN.filter((c) => fallos[c]);
    flushSync(() => {
      setIntentado(true);
      setAviso(malos.length ? avisoFaltan(malos.length) : '');
    });
    if (malos.length) { refs[malos[0]].current?.focus(); return; }
    const d = limpios(datos);
    setOcupado(true);
    const problema = await crear(d);
    setOcupado(false);
    if (problema) { setAviso(problema); return; }
    navegar('/cuenta/verificar', { replace: true, state: { pagar: vieneDePagar(location) } });
    avisar(avisoDelCodigo(`Te enviamos un código a ${d.correo}.`));
  };

  const alTeclear = useEnterAvanza(ORDEN.map((c) => refs[c]), alCrear);

  const campo = (nombre, props) => (
    <CampoCuenta
      id={nombre}
      value={datos[nombre]}
      error={errorDe(nombre)}
      campoRef={refs[nombre]}
      onChange={alCambiar(nombre)}
      onBlur={alDejar(nombre)}
      {...props}
    />
  );

  // La unica parte del formulario que contesta mientras se escribe, y por eso
  // no hay que adivinar. Cada requisito dice al lector si ya se cumple.
  const reglas = (
    <ul className="cuenta-reglas" id="cuenta-clave-reglas">
      {REGLAS.map((r) => {
        const hecha = r.cumple(datos.clave);
        return (
          <li key={r.id} data-regla={r.id} className={hecha ? 'is-hecha' : undefined}>
            <MarcaRegla hecha={hecha} />
            {r.texto}
            <span className="sr-only cuenta-regla-estado">{hecha ? ', cumplido' : ', falta'}</span>
          </li>
        );
      })}
    </ul>
  );

  return (
    <MarcoCuenta paso="crear" titulo="Crear cuenta">
      <div className="cuenta-formulario" onKeyDown={alTeclear}>
        <div className="cuenta-cuerpo">
          <p className="cuenta-maqueta">
            <strong>Maqueta académica.</strong> La cuenta se guarda en el servidor del proyecto
            (Supabase) y te llega un código a tu correo para verificarla. Aun así, no uses una
            contraseña que tengas en otro sitio.
          </p>
          <div className="cuenta-crear-columnas">
            <div className="cuenta-crear-datos">
              {campo('nombre', { etiqueta: 'Nombre y apellido', type: 'text', autoComplete: 'name', maxLength: 60, placeholder: 'María Pérez' })}
              {campo('correo', { etiqueta: 'Correo', type: 'email', autoComplete: 'email', maxLength: 80, placeholder: 'tu@correo.com' })}
              {/* Sin maxLength: recortaria lo pegado (0991234567, +593 99...)
                  antes de que soloNueve le quite el prefijo. */}
              {campo('telefono', {
                etiqueta: 'Teléfono', type: 'tel', inputMode: 'numeric', autoComplete: 'tel-national',
                placeholder: '990001122', prefijo: '+593',
              })}
              {campo('direccion', {
                etiqueta: 'Dirección', type: 'text', autoComplete: 'street-address', maxLength: 80,
                placeholder: 'Calle, número y una referencia', opcional: true,
              })}
            </div>
            <div className="cuenta-crear-clave">
              {campo('clave', {
                etiqueta: 'Contraseña', clave: true, autoComplete: 'new-password', maxLength: 40,
                describe: 'cuenta-clave-reglas', children: reglas,
              })}
              {campo('repite', { etiqueta: 'Repite la contraseña', clave: true, autoComplete: 'new-password', maxLength: 40 })}
            </div>
          </div>
        </div>
        <div className="cuenta-pie">
          <p className="cuenta-aviso" role="alert" hidden={!aviso}><TextoSuave texto={aviso} /></p>
          <button className="button button-yellow cuenta-crear" type="button" onClick={alCrear} aria-disabled={ocupado}>
            Crear la cuenta
          </button>
          <p className="cuenta-otro-paso">
            ¿Ya tienes cuenta?{' '}
            <Link className="cuenta-otro-enlace" to="/cuenta/entrar" state={{ pagar: vieneDePagar(location) }}>Inicia sesión</Link>
          </p>
        </div>
      </div>
    </MarcoCuenta>
  );
}

export default CrearCuenta;
