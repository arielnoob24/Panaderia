// La hoja que sube sobre la canasta para preguntar antes de borrar: "¿Vaciar
// la canasta?" (ConfirmarVaciar, 27 de octubre de 2026) y "¿Quitar <producto>?".
// Es hermana de PideCuenta.jsx y comparte su CSS (con clases propias, para que
// no se confundan al buscarlas): atrapa el foco, lo de detras queda inert (lo
// hace Canasta), Escape o tocar lo oscuro es "Cancelar". El foco empieza en
// "Cancelar": lo seguro es lo que se ofrece primero.
import { Basurero } from './iconosPedido.jsx';

function ConfirmarCanasta({ id, abierta, titulo, dicho, si, claseSi, claseNo, cancelarRef, onSi, onNo }) {
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
      aria-labelledby={`${id}-titulo`}
      aria-describedby={`${id}-dicho`}
      hidden={!abierta}
      onKeyDown={alTeclear}
      onClick={(e) => { if (e.target === e.currentTarget) onNo(); }}
    >
      <div className="confirmar-vaciar-hoja">
        <span className="confirmar-vaciar-dibujo" aria-hidden="true"><Basurero /></span>
        <h3 id={`${id}-titulo`}>{titulo}</h3>
        <p id={`${id}-dicho`}>{dicho} Tendrás unos segundos para deshacerlo.</p>
        <button ref={cancelarRef} className={`button button-yellow ${claseNo}`} type="button" onClick={onNo}>Cancelar</button>
        <button className={`button button-otro ${claseSi}`} type="button" onClick={onSi}>{si}</button>
      </div>
    </div>
  );
}

export default ConfirmarCanasta;
