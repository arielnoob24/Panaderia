// "¿Vaciar la canasta?": la hoja que sube sobre la canasta al pulsar "Vaciar
// la canasta" (27 de octubre de 2026; antes era una pregunta en el mismo
// sitio). Es hermana de PideCuenta.jsx y comparte su CSS (con clases propias,
// para que no se confundan al buscarlas): atrapa el foco,
// lo de detras queda inert (lo hace Canasta), Escape o tocar lo oscuro es
// "Cancelar". El foco empieza en "Cancelar": lo seguro es lo que se ofrece
// primero. Quitar una sola linea sigue con su pregunta de al lado y Deshacer.
import { Basurero } from './iconosPedido.jsx';

function ConfirmarVaciar({ abierta, cuantos, cancelarRef, onSi, onNo }) {
  const alTeclear = (e) => {
    if (e.key !== 'Escape') return;
    e.stopPropagation();
    onNo();
  };
  return (
    <div
      className="confirmar-vaciar"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirmar-vaciar-titulo"
      aria-describedby="confirmar-vaciar-dicho"
      hidden={!abierta}
      onKeyDown={alTeclear}
      onClick={(e) => { if (e.target === e.currentTarget) onNo(); }}
    >
      <div className="confirmar-vaciar-hoja">
        <span className="confirmar-vaciar-dibujo" aria-hidden="true"><Basurero /></span>
        <h3 id="confirmar-vaciar-titulo">¿Vaciar la canasta?</h3>
        <p id="confirmar-vaciar-dicho">
          Se va a quitar todo lo que llevas ({cuantos}). Tendrás unos segundos para deshacerlo.
        </p>
        <button ref={cancelarRef} className="button button-yellow canasta-vaciar-no" type="button" onClick={onNo}>Cancelar</button>
        <button className="button button-otro canasta-vaciar-si" type="button" onClick={onSi}>Sí, vaciar</button>
      </div>
    </div>
  );
}

export default ConfirmarVaciar;
