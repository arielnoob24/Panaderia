// ---- #/cuenta/verificar ---------------------------------------------------
// El codigo de 6 cifras que se manda al correo, "Enviar otro codigo" cada 60 s
// y, si EmailJS no esta o falla, el recuadro que imita el correo con el codigo
// dentro: asi el registro no se queda tapiado (secciones 7 y 9 del plan).
// Sin una cuenta esperando su codigo no hay nada que verificar: a entrar.
//
// El error del codigo va debajo de las casillas, unido con aria-describedby,
// y el foco vuelve a la primera: al llegar ahi el lector lo lee. No va ademas
// en el role="alert" del pie, que lo haria oir dos veces; aqui no hay errores
// que no sean del codigo, asi que el pie no lleva ese renglon.
import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSesion } from '../estado/SesionProvider.jsx';
import { useAvisos } from '../comun/Avisos.jsx';
import { REENVIO, MOTIVO_SIN_CORREO, AVISO_SIN_CORREO, avisoDelCodigo } from '../servicios/cuenta.js';
import MarcoCuenta from './MarcoCuenta.jsx';
import CasillasCodigo from './CasillasCodigo.jsx';
import TextoSuave from './TextoSuave.jsx';
import { Desvio, vieneDePagar } from './Desvio.jsx';
import { useTerminarEntrada } from './useTerminarEntrada.js';

const VACIAS = ['', '', '', '', '', ''];

function Verificar() {
  const { pendiente } = useSesion();
  // Se mira al llegar y no despues (vease Desvio.jsx). Al verificar, la
  // cuenta deja de estar pendiente y la vista se queda hasta que llega la
  // siguiente: mientras, ensena la ultima que hubo.
  const [habia] = useState(Boolean(pendiente));
  const [ultima, setUltima] = useState(pendiente);
  if (pendiente && pendiente !== ultima) setUltima(pendiente);
  if (!habia) return <Desvio a="/cuenta/entrar" />;
  return <PasoCodigo pendiente={pendiente || ultima} />;
}

function PasoCodigo({ pendiente }) {
  const { verificar, reenviar } = useSesion();
  const avisar = useAvisos();
  const navegar = useNavigate();
  const location = useLocation();
  const terminar = useTerminarEntrada();
  const [cifras, setCifras] = useState(VACIAS);
  const [error, setError] = useState('');
  const casillas = useRef([]);

  // La espera para reenviar se cuenta desde que salio el ultimo codigo, que
  // vive en la sesion: salir de la vista y volver no la reinicia.
  const [ahora, setAhora] = useState(() => Date.now());
  const quedan = Math.min(REENVIO, REENVIO - Math.floor((ahora - pendiente.enviadoEn) / 1000));
  const esperando = quedan > 0;
  useEffect(() => {
    if (!esperando) return undefined;
    const reloj = window.setInterval(() => setAhora(Date.now()), 1000);
    return () => window.clearInterval(reloj);
  }, [esperando, pendiente.enviadoEn]);

  // El correo responde despues de salir el codigo: si no llego, la pantalla
  // pasa a ensenar el codigo, y el lector tiene que saberlo tambien. Solo
  // cuando cambia, no al llegar a la vista (eso ya lo dijo quien la abrio).
  const envioAntes = useRef(pendiente.envio);
  useEffect(() => {
    if (pendiente.envio === envioAntes.current) return;
    envioAntes.current = pendiente.envio;
    if (pendiente.envio === 'fallo') avisar(AVISO_SIN_CORREO);
  }, [pendiente.envio, avisar]);

  // El codigo lo comprueba Supabase: mientras contesta no se vuelve a
  // mandar (Enter dos veces, o la sexta cifra y Enter).
  const [ocupado, setOcupado] = useState(false);
  const comprobar = async (escrito) => {
    if (ocupado) return;
    const { nombre, direccion } = pendiente;
    setOcupado(true);
    const fallo = await verificar(escrito);
    setOcupado(false);
    if (fallo) {
      // El error tiene que estar escrito antes de mover el foco: lo que se
      // lee al llegar a la casilla es su aria-describedby. Si el foco ya
      // estaba en ella (Enter en la primera), no se mueve y no se leeria:
      // entonces se dice por la region de avisos.
      flushSync(() => setError(fallo));
      const primera = casillas.current[0];
      if (primera && document.activeElement === primera) avisar(fallo);
      else primera?.focus();
      return;
    }
    terminar({ direccion }, nombre ? `Correo verificado. Iniciaste sesión como ${nombre}.` : 'Correo verificado. Iniciaste sesión.');
  };

  // Mientras se escribe no se riñe: el error se va al tocar una casilla y
  // solo vuelve al comprobar.
  const alCambiar = (nuevo, llenas) => {
    setCifras(nuevo);
    if (error) setError('');
    if (llenas) comprobar(nuevo.join(''));
  };

  const alReenviar = () => {
    reenviar().then(() => setAhora(Date.now()));
    setCifras(VACIAS);
    setError('');
    setAhora(Date.now());
    casillas.current[0]?.focus();
    avisar(avisoDelCodigo('Te enviamos un código nuevo.'));
  };

  // Si el correo no salio, se dice; el codigo no se puede ensenar, porque
  // la pagina no lo conoce (lo genera Supabase).
  let estadoEnvio = 'Código enviado. Si no lo ves, mira en la carpeta de spam.';
  if (pendiente.envio === 'fallo') estadoEnvio = MOTIVO_SIN_CORREO.fallo;
  else if (ocupado) estadoEnvio = 'Comprobando el código…';

  return (
    <MarcoCuenta paso="verificar" titulo="Verificar tu correo">
      <div className="cuenta-formulario">
        <div className="cuenta-cuerpo">
          <p className="codigo-dicho">
            Escribe el código de 6 cifras que enviamos a <strong className="codigo-correo">{pendiente.correo}</strong>.
          </p>
          <p className="codigo-estado" role="status" hidden={!estadoEnvio}>{estadoEnvio}</p>
          <CasillasCodigo
            cifras={cifras}
            onCambio={alCambiar}
            onEnter={() => comprobar(cifras.join(''))}
            casillasRef={casillas}
            idError="cuenta-codigo-error"
            mal={Boolean(error)}
          />
          <p className="cuenta-campo-error codigo-error" id="cuenta-codigo-error" hidden={!error}><TextoSuave texto={error} /></p>
          <button className="codigo-reenviar" type="button" disabled={esperando} onClick={alReenviar}>
            {esperando ? `Enviar otro código en ${quedan}s` : 'Enviar otro código'}
          </button>
        </div>
        <div className="cuenta-pie">
          <button className="button button-yellow cuenta-verificar" type="button" onClick={() => comprobar(cifras.join(''))}>
            Verificar el correo
          </button>
          <button
            className="cuenta-cambiar"
            type="button"
            onClick={() => navegar('/cuenta/crear', { state: { pagar: vieneDePagar(location) } })}
          >
            Cambiar el correo
          </button>
        </div>
      </div>
    </MarcoCuenta>
  );
}

export default Verificar;
