// "Entra a tu cuenta para pagar": la hoja que sube sobre la canasta al pulsar
// "Ir a pagar" sin una cuenta con el correo verificado (seccion 5 del plan).
// Mientras esta arriba, lo de detras del panel queda inert (lo hace Canasta).
// Escape o tocar lo oscuro es "Seguir viendo la canasta".
//
// Sus dos botones llevan a la cuenta (#/cuenta/entrar o #/cuenta/crear,
// seccion 15 del plan, fase 5) recordando que se venia de pagar: al entrar con
// el correo verificado, o al verificarlo, se va directo a #/confirmar con la
// canasta. La canasta se cierra al cambiar de vista (CanastaProvider), y la
// vista de la cuenta se lleva el foco a su titulo.
import { useNavigate } from 'react-router-dom';
import { IconoPersona } from './iconosPedido.jsx';
import { useCanasta } from './CanastaProvider.jsx';

function PideCuenta({ pide, principalRef, onVolver }) {
  // Quien llega aqui casi nunca tiene cuenta, asi que la puerta grande es
  // crearla; si en este navegador ya hay una guardada, la grande es entrar.
  const tiene = Boolean(pide?.tiene);
  const { cerrar } = useCanasta();
  const navegar = useNavigate();
  const ir = (paso) => {
    cerrar();
    navegar(`/cuenta/${paso}`, { state: { pagar: true } });
  };
  const alTeclear = (e) => {
    if (e.key !== 'Escape') return;
    e.stopPropagation();
    onVolver();
  };
  return (
    <div
      className="pide-cuenta"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="pide-cuenta-titulo"
      aria-describedby="pide-cuenta-dicho"
      hidden={!pide}
      onKeyDown={alTeclear}
      onClick={(e) => { if (e.target === e.currentTarget) onVolver(); }}
    >
      <div className="pide-cuenta-hoja">
        <span className="pide-cuenta-dibujo" aria-hidden="true"><IconoPersona /></span>
        <h3 id="pide-cuenta-titulo">Entra a tu cuenta para pagar</h3>
        <p id="pide-cuenta-dicho">
          El comprobante del pedido te llega al correo, así que necesitas una cuenta con el correo
          verificado. <strong>Tu canasta se queda tal como está.</strong>
        </p>
        <button ref={principalRef} className="button button-yellow pide-cuenta-principal" type="button" data-va={tiene ? 'entrar' : 'crear'} onClick={() => ir(tiene ? 'entrar' : 'crear')}>
          {tiene ? 'Iniciar sesión' : 'Crear una cuenta'}
        </button>
        <button className="pide-cuenta-otra" type="button" data-va={tiene ? 'crear' : 'entrar'} onClick={() => ir(tiene ? 'crear' : 'entrar')}>
          {tiene ? 'No tengo cuenta, crear una' : 'Ya tengo cuenta, iniciar sesión'}
        </button>
        <button className="pide-cuenta-volver" type="button" onClick={onVolver}>Seguir viendo la canasta</button>
      </div>
    </div>
  );
}

export default PideCuenta;
