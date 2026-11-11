// ---- #/cuenta/pago: Forma de pago -------------------------------------------
// La forma de pago preferida de la cuenta (Efectivo o Tarjeta), que antes iba
// dentro de Mis datos. Es una preferencia: #/confirmar empieza con ella y ahi
// se puede cambiar. Se guarda con sesion.editar, igual que Mis datos, mandando
// de nuevo el resto de los datos tal como estan. Sin sesion, a entrar.
import { useEffect, useState } from 'react';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useSesion } from '../estado/SesionProvider.jsx';
import { useAvisos } from '../comun/Avisos.jsx';
import { CURVA, DURACION } from '../comun/movimiento.js';
import MarcoCuenta from './MarcoCuenta.jsx';
import TextoSuave from './TextoSuave.jsx';
import FormaDePago from './FormaDePago.jsx';
import { Desvio } from './Desvio.jsx';

const GUARDADO_MS = 2000;
const CAMBIA = { duration: DURACION.rapida, ease: CURVA.ui };
const SE_VA = { opacity: 0, y: -4, transition: { duration: DURACION.rapida / 2, ease: CURVA.salida } };

function MiFormaDePago() {
  const [conSesion] = useState(useSesion().dentro);
  if (!conSesion) return <Desvio a="/cuenta/entrar" />;
  return <Formulario />;
}

function Formulario() {
  const sesion = useSesion();
  const avisar = useAvisos();
  const reducido = useReducedMotion();
  const [metodo, setMetodo] = useState(sesion.metodo);
  const [aviso, setAviso] = useState('');
  const [guardado, setGuardado] = useState(0);
  const [ocupado, setOcupado] = useState(false);
  useEffect(() => {
    if (!guardado) return undefined;
    const reloj = window.setTimeout(() => setGuardado(0), GUARDADO_MS);
    return () => window.clearTimeout(reloj);
  }, [guardado]);

  const alMetodo = (valor) => { setMetodo(valor); setAviso(''); setGuardado(0); };
  const alGuardar = async () => {
    if (ocupado) return;
    setOcupado(true);
    const problema = await sesion.editar({
      nombre: sesion.nombre, telefono: sesion.telefono, direccion: sesion.direccion, metodo,
    });
    setOcupado(false);
    if (problema) { setAviso(problema); return; }
    setAviso('');
    setGuardado((n) => n + 1);
    avisar('Guardamos tu forma de pago.');
  };

  return (
    <MarcoCuenta paso="pago" titulo="Forma de pago">
      <div className="cuenta-formulario">
        <div className="cuenta-cuerpo">
          <FormaDePago metodo={metodo} onMetodo={alMetodo} />
        </div>
        <div className="cuenta-pie">
          <p className="cuenta-aviso" role="alert" hidden={!aviso}><TextoSuave texto={aviso} /></p>
          <button className={guardado ? 'button button-yellow cuenta-guardar is-guardado' : 'button button-yellow cuenta-guardar'} type="button" onClick={alGuardar} aria-disabled={ocupado}>
            <AnimatePresence mode="wait" initial={false}>
              <m.span
                key={guardado ? 'guardado' : 'guardar'}
                className="cuenta-guardar-rotulo"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducido ? { opacity: 0, transition: { duration: 0 } } : SE_VA}
                transition={reducido ? { duration: 0 } : CAMBIA}
              >
                {guardado ? 'Guardado ✓' : 'Guardar los cambios'}
              </m.span>
            </AnimatePresence>
          </button>
          <Link className="cuenta-salir cuenta-volver-datos" to="/cuenta">Volver a mis datos</Link>
        </div>
      </div>
    </MarcoCuenta>
  );
}

export default MiFormaDePago;
