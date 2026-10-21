// La forma de pago preferida, dentro de Mis datos (secciones 7 y 15 del plan):
// Efectivo o Tarjeta, con el mismo dibujo y la misma frase que METODOS_CUENTA
// de account.js del sitio presentado y las clases de su fieldset en styles.css. Es una
// preferencia y nada mas: #/confirmar empieza con ella y ahi se puede cambiar.
// Se guarda con el resto de Mis datos, con el mismo boton.
//
// Numeros de tarjeta no se guardan: sin un servidor seguro no hay donde
// tenerlos bien guardados, y el aviso lo dice al lado.
const trazo = {
  className: 'cuenta-icono', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: '1.5', strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true', focusable: 'false',
};
const METODOS_CUENTA = [
  {
    valor: 'efectivo', nombre: 'Efectivo', dicho: 'Al retirar en el local o al recibir en tu puerta.',
    icono: <svg {...trazo}><rect x="2.8" y="6.5" width="18.4" height="11" rx="1.8" /><circle cx="12" cy="12" r="2.6" /><path d="M6 9.5v5M18 9.5v5" /></svg>,
  },
  {
    valor: 'tarjeta', nombre: 'Tarjeta', dicho: 'Crédito o débito. La escribes al pagar.',
    icono: <svg {...trazo}><rect x="3" y="5.5" width="18" height="13" rx="2.2" /><path d="M3 10h18" /><path d="M6.5 15h3.5" /></svg>,
  },
];

function FormaDePago({ metodo, onMetodo }) {
  return (
    <div className="cuenta-forma-pago">
      <fieldset className="cuenta-metodos" aria-describedby="cuenta-pagos-dicho">
        <legend className="cuenta-metodos-leyenda">Forma de pago preferida</legend>
        <p className="cuenta-pagos-dicho" id="cuenta-pagos-dicho">
          Lo dejamos marcado en cada pedido, y al confirmarlo puedes cambiarlo.
        </p>
        {METODOS_CUENTA.map((m) => (
          <label key={m.valor} className="cuenta-metodo">
            <input
              type="radio"
              name="cuenta-metodo"
              value={m.valor}
              checked={metodo === m.valor}
              onChange={() => onMetodo(m.valor)}
            />
            <span className="cuenta-metodo-caja">
              {m.icono}
              <span><strong>{m.nombre}</strong><small>{m.dicho}</small></span>
            </span>
          </label>
        ))}
      </fieldset>
      <p className="cuenta-maqueta">
        <strong>No guardamos tarjetas.</strong> Sin un servidor seguro no hay dónde tenerlas bien
        guardadas, así que la tarjeta se escribe en cada pago y se borra al terminar.
      </p>
    </div>
  );
}

export default FormaDePago;
