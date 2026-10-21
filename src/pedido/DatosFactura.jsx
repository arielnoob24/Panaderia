// "Datos para la factura": a mi nombre (lo normal, nada que rellenar) o a
// nombre de otra persona, con el HTML de piezasDePago() en checkout.js. Lo que
// se acepta lo dice fallosFactura() de servicios/cobro.js.
//
// El nombre, el correo y la direccion no se controlan (se guardan recortados,
// como en ElegirEntrega). La cedula si: solo admite cifras, y al ser
// controlada React deshace lo que no lo sea.
import CampoPago from './CampoPago.jsx';

function DatosFactura({ factura, sesion, onAOtro, onCampo, onSalir, errores, refs }) {
  const al = (campo, tope) => (e) => onCampo(campo, e.target.value.trim().slice(0, tope));
  return (
    <fieldset className="canasta-entrega factura-bloque">
      <legend>Datos para la factura</legend>
      <div className="canasta-opciones">
        <label><input type="radio" name="canasta-factura" value="mi" checked={!factura.aOtro} onChange={() => onAOtro(false)} /><span>A mi nombre</span></label>
        <label><input type="radio" name="canasta-factura" value="otro" checked={factura.aOtro} onChange={() => onAOtro(true)} /><span>A nombre de otra persona</span></label>
      </div>
      <div className="factura-mia" hidden={factura.aOtro}>
        <p className="factura-dato">
          <strong className="factura-mi-nombre">{sesion.nombre || 'Tu nombre'}</strong><br />
          <span className="factura-mi-correo">{sesion.correo}</span>
        </p>
        <p className="factura-nota">Son los datos de tu cuenta. Si te falta la cédula o el RUC, elige la otra opción y escríbelos.</p>
      </div>
      <div className="factura-otra" hidden={!factura.aOtro}>
        <CampoPago
          id="factura-nombre"
          etiqueta="Nombre o razón social"
          maxLength={80}
          placeholder="A quién se le factura"
          campoRef={refs.nombre}
          defaultValue={factura.nombre}
          error={errores.nombre}
          onChange={al('nombre', 80)}
          onBlur={() => onSalir('nombre')}
        />
        <CampoPago
          id="factura-ident"
          etiqueta="Cédula o RUC"
          inputMode="numeric"
          maxLength={13}
          placeholder="10 dígitos, o 13 si es RUC"
          campoRef={refs.ident}
          value={factura.ident}
          error={errores.ident}
          onChange={(e) => onCampo('ident', e.target.value.replace(/\D/g, '').slice(0, 13))}
          onBlur={() => onSalir('ident')}
        />
        <div className="pago-campo">
          <label htmlFor="factura-correo">Correo para enviarle la factura <small>(opcional)</small></label>
          <input ref={refs.correo} id="factura-correo" type="email" autoComplete="off" maxLength={120} placeholder="Si se la quieres hacer llegar a esa persona" defaultValue={factura.correo} onChange={al('correo', 120)} />
        </div>
        <div className="pago-campo">
          <label htmlFor="factura-dir">Dirección <small>(opcional)</small></label>
          <input ref={refs.direccion} id="factura-dir" type="text" autoComplete="off" maxLength={160} placeholder="La que debe constar en la factura" defaultValue={factura.direccion} onChange={al('direccion', 160)} />
        </div>
        <p className="factura-nota">El comprobante del pedido sigue llegando a tu correo; esto es solo a nombre de quién sale la factura.</p>
      </div>
    </fieldset>
  );
}

export default DatosFactura;
