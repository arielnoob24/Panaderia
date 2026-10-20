// ---- #/cuenta/entrar ------------------------------------------------------
// Correo y contrasena, que se compara por su huella PBKDF2 con sal (seccion 7
// del plan). Con la sesion ya abierta no hay nada que entrar: a Mis datos.
//
// Cuando sale cada error, como en el sitio actual: el correo se revisa al
// salir del campo (solo si tiene forma de correo; vacio no se marca, puede que
// solo se este pasando) y, si ya salio marcado, sigue lo que se escribe; la
// contrasena se marca al intentar entrar y se limpia al corregirla. Que no
// haya cuenta con ese correo o que la contrasena no sea esa se sabe al pulsar
// "Iniciar sesion", y se canta en la region de avisos.
//
// La accion se llama "Iniciar sesion" en todas partes (cabecera, hoja de
// pagar, titulo y boton), aunque la direccion siga siendo #/cuenta/entrar.
// "¿Olvidaste tu contrasena?" lleva a #/cuenta/recuperar con el correo que ya
// se hubiera escrito.
import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSesion } from '../estado/SesionProvider.jsx';
import { useAvisos } from '../comun/Avisos.jsx';
import { fallaCorreo, avisoDelCodigo } from '../servicios/cuenta.js';
import MarcoCuenta from './MarcoCuenta.jsx';
import CampoCuenta from './CampoCuenta.jsx';
import TextoSuave from './TextoSuave.jsx';
import { Desvio, vieneDePagar } from './Desvio.jsx';
import { useEnterAvanza } from './useEnterAvanza.js';
import { useTerminarEntrada } from './useTerminarEntrada.js';

function Entrar() {
  // Se mira al llegar y no despues: al entrar, la vista se queda hasta que
  // llega la siguiente (vease Desvio.jsx).
  const [conSesion] = useState(useSesion().dentro);
  if (conSesion) return <Desvio a="/cuenta" />;
  return <FormularioEntrar />;
}

function FormularioEntrar() {
  const { entrar } = useSesion();
  const avisar = useAvisos();
  const navegar = useNavigate();
  const location = useLocation();
  const terminar = useTerminarEntrada();
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [errores, setErrores] = useState({ correo: '', clave: '' });
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const correoRef = useRef(null);
  const claveRef = useRef(null);

  const marcar = (campo, texto, decir = false) => {
    flushSync(() => setErrores((e) => ({ ...e, [campo]: texto })));
    if (texto && decir) avisar(texto);
  };

  const alEntrar = async () => {
    if (ocupado) return;
    const escrito = correo.trim();
    setAviso('');
    // Primero lo que se ve sin buscar nada: que el correo tenga forma de
    // correo y que haya una contrasena escrita.
    const malCorreo = fallaCorreo(escrito);
    const malClave = clave ? '' : 'Escribe tu contraseña.';
    flushSync(() => setErrores({ correo: malCorreo, clave: malClave }));
    if (malCorreo) { correoRef.current?.focus(); return; }
    if (malClave) { claveRef.current?.focus(); return; }
    setOcupado(true);
    const r = await entrar(escrito, clave);
    setOcupado(false);
    if (r.campo) {
      // La contrasena no se borra: con "Mostrar" se puede ver lo que se
      // escribio y corregir la letra que falla.
      marcar(r.campo, r.texto, true);
      (r.campo === 'correo' ? correoRef : claveRef).current?.focus();
      return;
    }
    if (r.aviso) { setAviso(r.aviso); return; }
    if (r.hecho === 'verificar') {
      navegar('/cuenta/verificar', { replace: true, state: { pagar: vieneDePagar(location) } });
      avisar(avisoDelCodigo(`Te enviamos un código a ${escrito}.`));
      return;
    }
    terminar(r, `Iniciaste sesión como ${r.nombre}.`);
  };

  const alTeclear = useEnterAvanza([correoRef, claveRef], alEntrar);

  return (
    <MarcoCuenta paso="entrar" titulo="Iniciar sesión">
      <div className="cuenta-formulario" onKeyDown={alTeclear}>
        <div className="cuenta-cuerpo">
          <p className="cuenta-maqueta">
            <strong>Maqueta académica.</strong> Sin servidor, solo se puede iniciar sesión con la
            cuenta que creaste en este navegador.
          </p>
          <CampoCuenta
            id="entrar-correo"
            etiqueta="Correo"
            type="email"
            autoComplete="email"
            maxLength={80}
            placeholder="tu@correo.com"
            value={correo}
            error={errores.correo}
            campoRef={correoRef}
            onChange={(e) => {
              setCorreo(e.target.value);
              // Al poner el @ pasa a pedir lo que falta despues, y al
              // completarlo se va. "No hay ninguna cuenta" tambien deja de valer.
              if (errores.correo) marcar('correo', fallaCorreo(e.target.value.trim()));
            }}
            onBlur={() => { if (correo.trim()) marcar('correo', fallaCorreo(correo.trim())); }}
          />
          <CampoCuenta
            id="entrar-clave"
            etiqueta="Contraseña"
            clave
            autoComplete="current-password"
            maxLength={40}
            value={clave}
            error={errores.clave}
            campoRef={claveRef}
            onChange={(e) => {
              setClave(e.target.value);
              if (errores.clave) marcar('clave', '');
            }}
          />
          <p className="cuenta-olvide">
            <Link
              className="cuenta-otro-enlace cuenta-olvide-enlace"
              to="/cuenta/recuperar"
              state={{ pagar: vieneDePagar(location), correo: correo.trim() }}
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </p>
        </div>
        <div className="cuenta-pie">
          <p className="cuenta-aviso" role="alert" hidden={!aviso}><TextoSuave texto={aviso} /></p>
          <button className="button button-yellow cuenta-entrar" type="button" onClick={alEntrar} aria-disabled={ocupado}>
            Iniciar sesión
          </button>
          <p className="cuenta-otro-paso">
            ¿No tienes cuenta?{' '}
            <Link className="cuenta-otro-enlace" to="/cuenta/crear" state={{ pagar: vieneDePagar(location) }}>Créala</Link>
          </p>
        </div>
      </div>
    </MarcoCuenta>
  );
}

export default Entrar;
