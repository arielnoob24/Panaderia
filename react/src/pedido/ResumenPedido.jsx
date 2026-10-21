// La columna de la derecha de #/confirmar, pegada al desplazar (styles.css):
// lo que llevas, de solo lectura, con "Editar la canasta" al lado; subtotal,
// envio y total; a que correo llega el comprobante, y el boton de confirmar
// justo debajo del total, con el aviso de lo que falta encima.
//
// Editar se hace en la canasta: si se pudiera cambiar la cantidad aqui, el
// total cambiaria por debajo mientras alguien escribe los datos de la tarjeta.
import { dinero } from '../servicios/state.js';
import { textoEnvio } from '../servicios/cobro.js';
import { productos } from '../estado/pedido.js';

function ResumenPedido({
  lineas, unidades, sumas, correo, onEditar,
  errorPago, textoPagar, procesando, vacia, onPagar, pagarRef,
}) {
  const apagado = procesando || vacia;
  return (
    // div y no aside: es una columna de la vista, no contenido aparte.
    <div className="checkout-resumen">
      <div className="pedido-resumen">
        {/* h2: cuelgan del h1 de la vista, sin saltarse un nivel. */}
        <div className="resumen-cabeza">
          <h2 className="recibo-titulo">Tu pedido</h2>
          <p className="resumen-cuenta">{productos(unidades)}</p>
        </div>
        <ul className="recibo-lista resumen-lista">
          {lineas.map(([id, l]) => (
            <li key={id}><span>{`${l.cantidad} × ${l.nombre}`}</span><span>{dinero(l.precio * l.cantidad)}</span></li>
          ))}
        </ul>
        <button className="resumen-editar" type="button" onClick={onEditar}>Editar la canasta</button>
      </div>
      <dl className="canasta-desglose">
        <div><dt>Subtotal</dt><dd className="desglose-subtotal">{dinero(sumas.subtotal)}</dd></div>
        <div><dt>Envío</dt><dd className="desglose-envio">{textoEnvio(sumas.envio)}</dd></div>
        <div className="desglose-suma"><dt>Total</dt><dd className="desglose-total">{dinero(sumas.total)}</dd></div>
      </dl>
      <div className="pago-canal">
        <h2 className="pago-canal-titulo">Dónde te llega el comprobante</h2>
        <p className="pago-canal-dato">A <strong className="pago-canal-correo">{correo}</strong>, el correo verificado de tu cuenta.</p>
      </div>
      <div className="canasta-pie">
        <p className="canasta-aviso pago-error" role="alert" hidden={!errorPago}>{errorPago}</p>
        <button
          ref={pagarRef}
          className="button button-yellow canasta-pagar"
          type="button"
          disabled={apagado}
          aria-disabled={apagado}
          onClick={onPagar}
        >
          {procesando
            ? <><span className="pago-girando" aria-hidden="true"></span> Procesando el pago…</>
            : textoPagar}
        </button>
        <p className="canasta-nota">Simulación académica: no se cobra ni un centavo.</p>
      </div>
    </div>
  );
}

export default ResumenPedido;
