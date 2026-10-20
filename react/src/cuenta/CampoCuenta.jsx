// Un campo de la cuenta: etiqueta, entrada y su error debajo, con el HTML de
// campoHtml() en js/cuenta/account.js. El error esta siempre en el DOM
// (aria-describedby apunta a el) y se ve solo cuando hay algo que decir; la
// entrada lleva aria-invalid. Cuando sale lo decide quien lo usa: al dejar el
// campo o al intentar enviar.
//
// Las de contrasena llevan el boton "Mostrar" dentro del propio campo: escribir
// a ciegas es donde mas se equivoca uno, sobre todo en el telefono. El foco se
// queda en el boton, y con un Tab hacia atras se sigue escribiendo.
import { useState } from 'react';
import TextoSuave from './TextoSuave.jsx';

function CampoCuenta({
  id, etiqueta, error = '', opcional = false, prefijo = '', clave = false, describe = '',
  campoRef, children, ...entrada
}) {
  const [ver, setVer] = useState(false);
  const idCampo = `cuenta-${id}`;
  const idError = `${idCampo}-error`;
  const campo = (
    <input
      ref={campoRef}
      id={idCampo}
      aria-describedby={describe ? `${describe} ${idError}` : idError}
      aria-invalid={Boolean(error)}
      className={error ? 'is-mal' : undefined}
      {...entrada}
      type={clave ? (ver ? 'text' : 'password') : entrada.type}
    />
  );
  let caja = campo;
  if (prefijo) {
    caja = <div className="cuenta-conprefijo"><span className="cuenta-prefijo">{prefijo}</span>{campo}</div>;
  } else if (clave) {
    caja = (
      <div className="cuenta-conclave">
        {campo}
        <button
          className="ver-clave"
          type="button"
          aria-controls={idCampo}
          aria-label={ver ? 'Ocultar la contraseña' : 'Mostrar la contraseña'}
          onClick={() => setVer((v) => !v)}
        >
          {ver ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>
    );
  }
  return (
    <div className="cuenta-campo">
      <label htmlFor={idCampo}>
        {etiqueta}
        {opcional ? <> <span className="cuenta-campo-opcional">(opcional)</span></> : null}
      </label>
      {caja}
      {children}
      <p className="cuenta-campo-error" id={idError} hidden={!error}><TextoSuave texto={error} /></p>
    </div>
  );
}

export default CampoCuenta;
