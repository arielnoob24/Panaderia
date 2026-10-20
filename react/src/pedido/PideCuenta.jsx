// "Entra a tu cuenta para pagar": la hoja que sube sobre la canasta al pulsar
// "Ir a pagar" sin una cuenta con el correo verificado (seccion 5 del plan).
// Mientras esta arriba, lo de detras del panel queda inert (lo hace Canasta).
// Escape o tocar lo oscuro es "Seguir viendo la canasta".
//
// FASE 4: React ya lee la cuenta del sitio actual (estado/SesionProvider.jsx)
// y con ella deja pagar; sin ella sale esta hoja. Pero todavia no sabe crear
// cuentas ni entrar en ellas (fase 5), asi que sus dos botones grandes no
// hacen nada aun. Cuando llegue la cuenta, abriran el panel en 'crear' o en
// 'entrar' como en cart.js.
import { IconoPersona } from './iconosPedido.jsx';

function PideCuenta({ pide, principalRef, onVolver }) {
  // Quien llega aqui casi nunca tiene cuenta, asi que la puerta grande es
  // crearla; si en este navegador ya hay una guardada, la grande es entrar.
  const tiene = Boolean(pide?.tiene);
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
        {/* Sin efecto hasta la fase 5 (la cuenta). */}
        <button ref={principalRef} className="button button-yellow pide-cuenta-principal" type="button" data-va={tiene ? 'entrar' : 'crear'}>
          {tiene ? 'Iniciar sesión' : 'Crear una cuenta'}
        </button>
        <button className="pide-cuenta-otra" type="button" data-va={tiene ? 'crear' : 'entrar'}>
          {tiene ? 'No tengo cuenta, crear una' : 'Ya tengo cuenta, iniciar sesión'}
        </button>
        <button className="pide-cuenta-volver" type="button" onClick={onVolver}>Seguir viendo la canasta</button>
      </div>
    </div>
  );
}

export default PideCuenta;
