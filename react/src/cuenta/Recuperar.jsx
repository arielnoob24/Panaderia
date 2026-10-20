// ---- #/cuenta/recuperar ---------------------------------------------------
// Cambiar la contrasena olvidada con un codigo al correo, en tres pasos en la
// misma vista (seccion 15 del plan, fase 5, "Recuperar la contrasena"):
//   correo  el de la cuenta de este navegador; si no, el error de iniciar sesion
//   codigo  las 6 casillas de verificar; 10 minutos, 5 intentos, otro cada 45 s
//   clave   la nueva con sus 4 requisitos y repetirla
// Al terminar, la sesion queda abierta y se va a #/confirmar si se venia de
// pagar, si no a #/cuenta, con replace: Atras no vuelve al codigo.
//
// Si el correo no sale no se recupera, y aqui no hay recuadro con el codigo:
// con el en pantalla, cualquiera que abriera este navegador cambiaria la
// contrasena. El paso en que se esta lo dice la sesion (recuperacion), asi que
// salir de la vista y volver no pierde el codigo ni reinicia los 45 s.
//
// Los errores de cada campo van debajo de el, unidos con aria-describedby, y
// el foco va al campo: el lector lo lee al llegar. Si el foco ya estaba ahi,
// se dice por la region de avisos. El role="alert" del pie es solo para lo
// que no es de un campo (que el correo no salio).
//
// Clases para frontend: recuperar-paso y recuperar-paso-<correo|codigo|clave>
// en la hoja de cada paso (cuenta-formulario), con la clave del paso para
// animar el cambio; recuperar-dicho (lo que se pide en ese paso),
// recuperar-limite (que se recupera desde este navegador), cuenta-recuperar
// (el boton principal de cada paso).
import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { useSesion } from '../estado/SesionProvider.jsx';
import { useAvisos } from '../comun/Avisos.jsx';
import { REENVIO, REGLAS, fallaCorreo } from '../servicios/cuenta.js';
import MarcoCuenta from './MarcoCuenta.jsx';
import PasoQueCambia from './PasoQueCambia.jsx';
import CampoCuenta from './CampoCuenta.jsx';
import CasillasCodigo from './CasillasCodigo.jsx';
import MarcaRegla from './MarcaRegla.jsx';
import TextoSuave from './TextoSuave.jsx';
import { Desvio, vieneDePagar } from './Desvio.jsx';
import { useEnterAvanza } from './useEnterAvanza.js';
import { useTerminarEntrada } from './useTerminarEntrada.js';

const VACIAS = ['', '', '', '', '', ''];
// Los pasos en orden: PasoQueCambia sabe asi si se avanza o se vuelve.
const PASOS = ['correo', 'codigo', 'clave'];

// Marca el error y lleva el foco al campo; si ya estaba ahi, el foco no se
// mueve y el lector no volveria a leer la descripcion: va por los avisos.
const senalar = (ref, avisar, texto) => {
  const el = ref.current;
  if (!el) return;
  if (document.activeElement === el) avisar(texto);
  else el.focus();
};

function Recuperar() {
  // Se mira al llegar y no despues (vease Desvio.jsx): al cambiar la
  // contrasena se queda dentro, y la vista se queda hasta que llega la siguiente.
  const [conSesion] = useState(useSesion().dentro);
  if (conSesion) return <Desvio a="/cuenta" />;
  return <PasosRecuperar />;
}

function PasosRecuperar() {
  const { recuperacion, dentro } = useSesion();
  let paso = 'correo';
  if (recuperacion) paso = recuperacion.listo ? 'clave' : 'codigo';
  // Al llegar a la vista el foco es del titulo (useVista); al pasar de un
  // paso a otro, el boton pulsado desaparece y el foco va a lo primero que
  // hay que escribir en el paso nuevo.
  const [visto, setVisto] = useState({ paso, cambiado: false });
  // Con la contrasena cambiada ya no hay recuperacion, pero la vista se queda
  // hasta que llega la siguiente: mientras, el ultimo paso y no el primero.
  if (dentro) paso = visto.paso;
  if (visto.paso !== paso) setVisto({ paso, cambiado: true });
  const enfocar = visto.cambiado;
  return (
    <MarcoCuenta paso="recuperar" titulo="Recuperar la contraseña">
      {/* El movimiento entre pasos (frontend): la hoja vieja sale a la
          izquierda y la nueva entra por la derecha (PasoQueCambia.jsx). */}
      <PasoQueCambia paso={paso} orden={PASOS}>
        {paso === 'correo' ? <PasoCorreo key="correo" enfocar={enfocar} /> : null}
        {paso === 'codigo' ? <PasoCodigo key="codigo" enfocar={enfocar} /> : null}
        {paso === 'clave' ? <PasoClave key="clave" enfocar={enfocar} /> : null}
      </PasoQueCambia>
    </MarcoCuenta>
  );
}

function PasoCorreo({ enfocar }) {
  const { pedirRecuperar } = useSesion();
  const avisar = useAvisos();
  const location = useLocation();
  // El que se habia escrito en Iniciar sesion, para no escribirlo dos veces.
  const [correo, setCorreo] = useState(() => String(location.state?.correo || ''));
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const correoRef = useRef(null);
  useEffect(() => { if (enfocar) correoRef.current?.focus(); }, [enfocar]);

  const marcar = (texto) => flushSync(() => setError(texto));

  const alPedir = async () => {
    if (ocupado) return;
    const escrito = correo.trim();
    setAviso('');
    const mal = fallaCorreo(escrito);
    if (mal) { marcar(mal); senalar(correoRef, avisar, mal); return; }
    setOcupado(true);
    const r = await pedirRecuperar(escrito);
    setOcupado(false);
    if (r.campo) { marcar(r.texto); senalar(correoRef, avisar, r.texto); return; }
    if (r.aviso) { setAviso(r.aviso); return; }
    // Las casillas se llevan el foco al montarse (PasoCodigo).
    avisar(`Te enviamos un código a ${escrito}.`);
  };

  const alTeclear = useEnterAvanza([correoRef], alPedir);

  return (
    <div className="cuenta-formulario recuperar-paso recuperar-paso-correo" onKeyDown={alTeclear}>
      <div className="cuenta-cuerpo">
        <p className="cuenta-maqueta recuperar-limite">
          <strong>Maqueta académica.</strong> La cuenta vive en este navegador: solo se puede
          recuperar desde el mismo navegador donde la creaste.
        </p>
        <p className="recuperar-dicho">
          Escribe el correo de tu cuenta y te enviaremos un código para cambiar tu contraseña.
        </p>
        <CampoCuenta
          id="recuperar-correo"
          etiqueta="Correo"
          type="email"
          autoComplete="email"
          maxLength={80}
          placeholder="tu@correo.com"
          value={correo}
          error={error}
          campoRef={correoRef}
          onChange={(e) => {
            setCorreo(e.target.value);
            if (error) marcar(fallaCorreo(e.target.value.trim()));
          }}
          onBlur={() => { if (correo.trim()) marcar(fallaCorreo(correo.trim())); }}
        />
      </div>
      <div className="cuenta-pie">
        <p className="cuenta-aviso" role="alert" hidden={!aviso}><TextoSuave texto={aviso} /></p>
        <button className="button button-yellow cuenta-recuperar" type="button" onClick={alPedir} aria-disabled={ocupado}>
          {ocupado ? 'Enviando el código…' : 'Enviarme el código'}
        </button>
        <p className="cuenta-otro-paso">
          ¿Ya la recordaste?{' '}
          <Link className="cuenta-otro-enlace" to="/cuenta/entrar" state={{ pagar: vieneDePagar(location) }}>Inicia sesión</Link>
        </p>
        {/* El error de "no hay ninguna cuenta" manda a crearla con el enlace de abajo. */}
        <p className="cuenta-otro-paso">
          ¿No tienes cuenta?{' '}
          <Link className="cuenta-otro-enlace" to="/cuenta/crear" state={{ pagar: vieneDePagar(location) }}>Créala</Link>
        </p>
      </div>
    </div>
  );
}

function PasoCodigo({ enfocar }) {
  const { recuperacion, comprobarRecuperar, reenviarRecuperar, olvidarRecuperar } = useSesion();
  const avisar = useAvisos();
  const [cifras, setCifras] = useState(VACIAS);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const casillas = useRef([]);

  useEffect(() => { if (enfocar) casillas.current[0]?.focus(); }, [enfocar]);

  const [ahora, setAhora] = useState(() => Date.now());
  const quedan = Math.min(REENVIO, REENVIO - Math.floor((ahora - recuperacion.enviadoEn) / 1000));
  const esperando = quedan > 0;
  useEffect(() => {
    if (!esperando) return undefined;
    const reloj = window.setInterval(() => setAhora(Date.now()), 1000);
    return () => window.clearInterval(reloj);
  }, [esperando, recuperacion.enviadoEn]);

  const comprobar = (escrito) => {
    const fallo = comprobarRecuperar(escrito);
    if (!fallo) {
      avisar('Código correcto. Escribe tu contraseña nueva.');
      return;
    }
    flushSync(() => setError(fallo));
    const primera = { current: casillas.current[0] };
    senalar(primera, avisar, fallo);
  };

  const alCambiar = (nuevo, llenas) => {
    setCifras(nuevo);
    if (error) setError('');
    if (llenas) comprobar(nuevo.join(''));
  };

  const alReenviar = async () => {
    if (ocupado) return;
    setAviso('');
    setOcupado(true);
    const problema = await reenviarRecuperar();
    setOcupado(false);
    if (problema) { setAviso(problema); return; }
    setCifras(VACIAS);
    setError('');
    setAhora(Date.now());
    casillas.current[0]?.focus();
    avisar('Te enviamos un código nuevo.');
  };

  let textoReenviar = 'Enviar otro código';
  if (ocupado) textoReenviar = 'Enviando…';
  else if (esperando) textoReenviar = `Enviar otro código en ${quedan}s`;

  return (
    <div className="cuenta-formulario recuperar-paso recuperar-paso-codigo">
      <div className="cuenta-cuerpo">
        <p className="codigo-dicho recuperar-dicho">
          Escribe el código de 6 cifras que enviamos a <strong className="codigo-correo">{recuperacion.correo}</strong>.
          Caduca a los 10 minutos.
        </p>
        <CasillasCodigo
          cifras={cifras}
          onCambio={alCambiar}
          onEnter={() => comprobar(cifras.join(''))}
          casillasRef={casillas}
          idError="cuenta-recuperar-codigo-error"
          mal={Boolean(error)}
        />
        <p className="cuenta-campo-error codigo-error" id="cuenta-recuperar-codigo-error" hidden={!error}><TextoSuave texto={error} /></p>
        <button className="codigo-reenviar" type="button" disabled={esperando || ocupado} onClick={alReenviar}>
          {textoReenviar}
        </button>
      </div>
      <div className="cuenta-pie">
        <p className="cuenta-aviso" role="alert" hidden={!aviso}><TextoSuave texto={aviso} /></p>
        <button className="button button-yellow cuenta-recuperar" type="button" onClick={() => comprobar(cifras.join(''))}>
          Comprobar el código
        </button>
        <button className="cuenta-cambiar" type="button" onClick={olvidarRecuperar}>
          Cambiar el correo
        </button>
      </div>
    </div>
  );
}

function PasoClave({ enfocar }) {
  const { cambiarClave } = useSesion();
  const avisar = useAvisos();
  const terminar = useTerminarEntrada();
  const [clave, setClave] = useState('');
  const [repite, setRepite] = useState('');
  const [intentado, setIntentado] = useState(false);
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const claveRef = useRef(null);
  const repiteRef = useRef(null);

  useEffect(() => { if (enfocar) claveRef.current?.focus(); }, [enfocar]);

  // Como en crear: la contrasena se marca solo al intentar (la lista ya dice
  // lo que falta); la repeticion mientras se escribe, callada si esta vacia.
  const malClave = REGLAS.some((r) => !r.cumple(clave)) ? 'A la contraseña le falta algo de la lista.' : '';
  const malRepite = repite !== clave ? 'Las dos no son iguales.' : '';
  const errorClave = intentado ? malClave : '';
  const errorRepite = intentado || repite ? malRepite : '';

  const alCambiar = async () => {
    if (ocupado) return;
    setAviso('');
    flushSync(() => setIntentado(true));
    if (malClave) { senalar(claveRef, avisar, malClave); return; }
    if (malRepite) { senalar(repiteRef, avisar, malRepite); return; }
    setOcupado(true);
    const r = await cambiarClave(clave);
    setOcupado(false);
    if (r.aviso) { setAviso(r.aviso); return; }
    terminar(r, `Contraseña cambiada. Iniciaste sesión como ${r.nombre}.`);
  };

  const alTeclear = useEnterAvanza([claveRef, repiteRef], alCambiar);

  return (
    <div className="cuenta-formulario recuperar-paso recuperar-paso-clave" onKeyDown={alTeclear}>
      <div className="cuenta-cuerpo">
        <p className="recuperar-dicho">Código correcto. Escribe tu contraseña nueva: la de antes deja de valer.</p>
        <CampoCuenta
          id="recuperar-clave"
          etiqueta="Contraseña nueva"
          clave
          autoComplete="new-password"
          maxLength={40}
          describe="recuperar-clave-reglas"
          value={clave}
          error={errorClave}
          campoRef={claveRef}
          onChange={(e) => setClave(e.target.value)}
        >
          <ul className="cuenta-reglas" id="recuperar-clave-reglas">
            {REGLAS.map((r) => {
              const hecha = r.cumple(clave);
              return (
                <li key={r.id} data-regla={r.id} className={hecha ? 'is-hecha' : undefined}>
                  <MarcaRegla hecha={hecha} />
                  {r.texto}
                  <span className="sr-only cuenta-regla-estado">{hecha ? ', cumplido' : ', falta'}</span>
                </li>
              );
            })}
          </ul>
        </CampoCuenta>
        <CampoCuenta
          id="recuperar-repite"
          etiqueta="Repite la contraseña nueva"
          clave
          autoComplete="new-password"
          maxLength={40}
          value={repite}
          error={errorRepite}
          campoRef={repiteRef}
          onChange={(e) => setRepite(e.target.value)}
        />
      </div>
      <div className="cuenta-pie">
        <p className="cuenta-aviso" role="alert" hidden={!aviso}><TextoSuave texto={aviso} /></p>
        <button className="button button-yellow cuenta-recuperar" type="button" onClick={alCambiar} aria-disabled={ocupado}>
          Cambiar la contraseña
        </button>
      </div>
    </div>
  );
}

export default Recuperar;
