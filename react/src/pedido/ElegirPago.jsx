// "¿Como quieres pagar?": efectivo o tarjeta, con el HTML de piezasDePago()
// en checkout.js. La tarjeta es de mentira y lo dice: vive solo en el estado
// de Confirmar, no se guarda ni se envia, y se pierde al salir de la vista.
import { textoEfectivo } from '@raiz/js/pedido/cobro.js';
import CampoPago from './CampoPago.jsx';

function ElegirPago({ metodo, onMetodo, modo, tarjeta, onTarjeta, onTarjetaSalir, errores, refs }) {
  const campo = (clave) => ({
    campoRef: refs[clave],
    value: tarjeta[clave],
    error: errores[clave],
    marcarMal: true,
    onChange: (e) => onTarjeta(clave, e.target),
    onBlur: () => onTarjetaSalir(clave),
  });
  return (
    <>
      <fieldset className="canasta-entrega pago-metodos">
        <legend>¿Cómo quieres pagar?</legend>
        <div className="canasta-opciones">
          <label><input type="radio" name="canasta-metodo" value="efectivo" checked={metodo === 'efectivo'} onChange={() => onMetodo('efectivo')} /><span>Efectivo</span></label>
          <label><input type="radio" name="canasta-metodo" value="tarjeta" checked={metodo === 'tarjeta'} onChange={() => onMetodo('tarjeta')} /><span>Tarjeta</span></label>
        </div>
      </fieldset>
      <div className="pago-detalle" data-detalle="efectivo" hidden={metodo !== 'efectivo'}>
        <p className="pago-dato pago-efectivo">{textoEfectivo(modo)}</p>
      </div>
      <div className="pago-detalle" data-detalle="tarjeta" hidden={metodo !== 'tarjeta'}>
        <p className="pago-prueba">
          Tarjeta de prueba: <strong>4242 4242 4242 4242</strong>, cualquier vencimiento futuro y CVV 123.
          No escribas una tarjeta de verdad.
        </p>
        <CampoPago id="pago-numero" etiqueta="Número de la tarjeta" inputMode="numeric" placeholder="4242 4242 4242 4242" maxLength={19} {...campo('numero')} />
        <div className="pago-fila">
          <CampoPago id="pago-vence" etiqueta="Vencimiento" inputMode="numeric" placeholder="MM/AA" maxLength={5} {...campo('vence')} />
          <CampoPago id="pago-cvv" etiqueta="CVV" inputMode="numeric" placeholder="123" maxLength={3} {...campo('cvv')} />
        </div>
        <CampoPago id="pago-titular" etiqueta="Nombre del titular" placeholder="Como aparece en la tarjeta" maxLength={60} {...campo('titular')} />
      </div>
    </>
  );
}

export default ElegirPago;
