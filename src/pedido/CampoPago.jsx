// Un campo de la tarjeta o de la factura: etiqueta, entrada y su error debajo,
// con el HTML de piezasDePago() en checkout.js. El error esta siempre en el
// DOM (aria-describedby apunta a el) y se ve solo cuando hay algo que decir;
// la entrada lleva aria-invalid. Cuando sale lo decide quien lo usa: al dejar
// el campo o al intentar confirmar.
function CampoPago({ id, etiqueta, error, marcarMal = false, campoRef, ...entrada }) {
  const idError = `${id}-error`;
  return (
    <div className="pago-campo">
      <label htmlFor={id}>{etiqueta}</label>
      <input
        ref={campoRef}
        id={id}
        type="text"
        autoComplete="off"
        aria-describedby={idError}
        aria-invalid={Boolean(error)}
        className={marcarMal && error ? 'is-mal' : undefined}
        {...entrada}
      />
      <p className="pago-campo-error" id={idError} hidden={!error}>{error || ''}</p>
    </div>
  );
}

export default CampoPago;
