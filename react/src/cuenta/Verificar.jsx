// ---- #/cuenta/verificar ---------------------------------------------------
// El codigo de 6 cifras que se manda al correo, "Enviar otro codigo" cada 45 s
// y, si EmailJS no esta o falla, el recuadro que imita el correo con el codigo
// dentro: asi el registro no se queda tapiado (secciones 7 y 9 del plan).
// Sin una cuenta esperando su codigo no hay nada que verificar: a entrar.
//
// El error va por dos sitios, como en el sitio actual: debajo de las casillas,
// unido con aria-describedby, y en el renglon con role="alert" del pie, que
// se canta al momento: quien escribio el codigo espera respuesta ahora.
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSesion } from '../estado/SesionProvider.jsx';
import { useAvisos } from '../comun/Avisos.jsx';
import { REENVIO, MOTIVO_SIN_CORREO } from '../servicios/cuenta.js';
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

  const comprobar = (escrito) => {
    const { nombre, direccion } = pendiente;
    const fallo = verificar(escrito);
    if (fallo) {
      setError(fallo);
      casillas.current[0]?.focus();
      return;
    }
    terminar({ direccion }, `Correo verificado. Entraste como ${nombre}.`);
  };

  // Mientras se escribe no se riñe: el error se va al tocar una casilla y
  // solo vuelve al comprobar.
  const alCambiar = (nuevo, llenas) => {
    setCifras(nuevo);
    if (error) setError('');
    if (llenas) comprobar(nuevo.join(''));
  };

  const alReenviar = () => {
    reenviar();
    setCifras(VACIAS);
    setError('');
    setAhora(Date.now());
    casillas.current[0]?.focus();
    avisar('Te enviamos un código nuevo.');
  };

  const sinCorreo = MOTIVO_SIN_CORREO[pendiente.envio];
  let estadoEnvio = '';
  if (pendiente.envio === 'enviando') estadoEnvio = 'Enviando el código a tu correo…';
  else if (pendiente.envio === 'enviado') estadoEnvio = 'Código enviado. Si no lo ves, mira en la carpeta de spam.';

  return (
    <MarcoCuenta paso="verificar" titulo="Verificar tu correo">
      <div className="cuenta-formulario">
        <div className="cuenta-cuerpo">
          {sinCorreo ? (
            <p className="cuenta-maqueta cuenta-maqueta-codigo">
              <strong>Maqueta académica.</strong> {sinCorreo} El código se muestra aquí abajo para que
              puedas seguir.
            </p>
          ) : null}
          <p className="codigo-dicho">
            Escribe el código de 6 cifras que enviamos a <strong className="codigo-correo">{pendiente.correo}</strong>.
          </p>
          <p className="codigo-estado" role="status" hidden={!estadoEnvio}>{estadoEnvio}</p>
          {sinCorreo ? (
            <div className="codigo-falso">
              <p className="codigo-falso-de">Correo de El Tradicional</p>
              <p className="codigo-falso-texto">
                Tu código es <b className="codigo-valor">{pendiente.codigo}</b>. No lo compartas con nadie.
              </p>
            </div>
          ) : null}
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
          <p className="cuenta-aviso" role="alert" hidden={!error}><TextoSuave texto={error} /></p>
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
