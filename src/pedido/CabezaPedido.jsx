// La cabeza de #/confirmar y #/comprobante: "Volver a la tienda" y el titulo
// de la vista, que es su h1. Con sus propias clases (styles.css): la cabeza
// de la tienda cambio de aspecto y el pago no (va en la segunda vuelta).
import { Chevron } from '../comun/iconos.jsx';

function CabezaPedido({ titulo, tituloRef, onVolver }) {
  return (
    <div className="checkout-cabeza">
      <button className="checkout-volver" type="button" onClick={onVolver}>
        <Chevron izquierda />Volver a la tienda
      </button>
      <h1 ref={tituloRef} className="checkout-titulo" tabIndex={-1}>{titulo}</h1>
    </div>
  );
}

export default CabezaPedido;
