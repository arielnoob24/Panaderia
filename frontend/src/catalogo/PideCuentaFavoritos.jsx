// "Inicia sesion para guardar favoritos": la hoja que sube al tocar el
// corazon sin una sesion abierta. Misma hoja que la de pagar (PideCuenta), pero
// sobre la pagina entera. Escape, tocar lo oscuro o "Ahora no" la cierran y el
// foco vuelve al corazon que se toco. Mientras esta abierta, lo de detras queda
// inert (apagarDetras).
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSesion } from '../estado/SesionProvider.jsx';
import { useAtraparFoco, apagarDetras } from '../comun/useAtraparFoco.js';
import { IconoCorazon } from '../comun/iconos.jsx';

function PideCuentaFavoritos({ pide, onCerrar }) {
  const { hayCuenta } = useSesion();
  const navegar = useNavigate();
  const cajaRef = useRef(null);
  const principalRef = useRef(null);
  const abierta = Boolean(pide);
  const origen = useRef(null);
  if (pide) origen.current = pide.origen;

  useEffect(() => {
    if (!abierta) return undefined;
    const caja = cajaRef.current;
    apagarDetras(caja, true);
    principalRef.current?.focus();
    return () => {
      // Se enciende antes de devolver el foco: a lo apagado no se le puede dar.
      apagarDetras(caja, false);
      origen.current?.focus?.();
    };
  }, [abierta]);

  useAtraparFoco(abierta, [cajaRef], onCerrar);

  const ir = (paso) => {
    origen.current = null;
    onCerrar();
    navegar(`/cuenta/${paso}`);
  };
  return (
    <div
      ref={cajaRef}
      className="pide-cuenta pide-cuenta-fija"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="pide-favoritos-titulo"
      aria-describedby="pide-favoritos-dicho"
      hidden={!abierta}
      onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}
    >
      <div className="pide-cuenta-hoja">
        <span className="pide-cuenta-dibujo" aria-hidden="true"><IconoCorazon /></span>
        <h3 id="pide-favoritos-titulo">Inicia sesión para guardar favoritos</h3>
        <p id="pide-favoritos-dicho">
          Tus favoritos se guardan en tu cuenta, para que los tengas a mano la próxima vez.
        </p>
        <button ref={principalRef} className="button button-yellow pide-cuenta-principal" type="button" onClick={() => ir(hayCuenta ? 'entrar' : 'crear')}>
          {hayCuenta ? 'Iniciar sesión' : 'Crear una cuenta'}
        </button>
        <button className="button button-otro pide-cuenta-otra" type="button" onClick={() => ir(hayCuenta ? 'crear' : 'entrar')}>
          {hayCuenta ? 'No tengo cuenta, crear una' : 'Ya tengo cuenta, iniciar sesión'}
        </button>
        <button className="pide-cuenta-volver" type="button" onClick={onCerrar}>Ahora no</button>
      </div>
    </div>
  );
}

export default PideCuentaFavoritos;
