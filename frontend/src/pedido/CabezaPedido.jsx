// La cabeza de #/confirmar y #/comprobante: "Volver a la tienda" y el titulo
// de la vista, que es su h1. Con sus propias clases (styles.css): la cabeza
// de la tienda cambio de aspecto y el pago no (va en la segunda vuelta).
// Lleva la barra de pasos corta (27 de octubre de 2026): confirmar y pagar es
// el paso 1, el pedido hecho es el paso 2.
import { Chevron } from '../comun/iconos.jsx';

const PASOS = ['Confirmar y pagar', 'Pedido listo'];

function CabezaPedido({ titulo, tituloRef, onVolver, paso = 1 }) {
  return (
    <div className="checkout-cabeza">
      <button className="checkout-volver" type="button" onClick={onVolver}>
        <Chevron izquierda />Volver a la tienda
      </button>
      <ol className="checkout-pasos" aria-label="Pasos del pedido">
        {PASOS.map((nombre, i) => {
          const n = i + 1;
          const estado = n < paso ? 'is-hecho' : n === paso ? 'is-actual' : '';
          return (
            <li key={nombre} className={estado || undefined} aria-current={n === paso ? 'step' : undefined}>
              <span className="checkout-paso-num" aria-hidden="true">{n < paso ? '✓' : n}</span>
              <span>{nombre}<span className="sr-only">{n < paso ? ' (hecho)' : n === paso ? ' (paso actual)' : ''}</span></span>
            </li>
          );
        })}
      </ol>
      <h1 ref={tituloRef} className="checkout-titulo" tabIndex={-1}>{titulo}</h1>
    </div>
  );
}

export default CabezaPedido;
