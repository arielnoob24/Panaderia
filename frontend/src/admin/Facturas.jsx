// ---- Panel, Facturas y clientes ----------------------------------------------
// Solo el Administrador (facturas.anular). Las ultimas 100 facturas, la mas
// nueva arriba, y debajo los clientes con lo que se les ha facturado (las
// anuladas no cuentan). Anular una factura no se deshace y la base crea sola
// el asiento contrario de la venta, asi que pide confirmar: aparecen "Sí" y
// "No, dejarlo", el foco va al "Sí", Escape lo deja como estaba y el foco
// vuelve al boton que lo armo.
import { useEffect, useRef, useState } from 'react';
import { dinero } from '../servicios/state.js';
import { marcaBonita } from '../servicios/storage.js';
import { pedirApi } from '../servicios/api.js';
import { useAvisos } from '../comun/Avisos.jsx';
import { useCarga, textoDeFallo } from './useCarga.js';
import Seccion from './Seccion.jsx';

function Factura({ f, alCambiar }) {
  const avisar = useAvisos();
  const [pregunta, setPregunta] = useState(false);
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState('');
  const anularRef = useRef(null);
  const confirmarRef = useRef(null);
  const devolver = useRef(false);

  useEffect(() => {
    if (pregunta) { confirmarRef.current?.focus(); return; }
    if (devolver.current) { devolver.current = false; anularRef.current?.focus(); }
  }, [pregunta]);

  const armar = () => {
    if (trabajando) return;
    devolver.current = false;
    setPregunta(true);
    avisar(`¿Anular la factura ${f.numero}? Pulsa «Sí» para confirmar o Escape para dejarla.`);
  };
  const dejar = () => { devolver.current = true; setPregunta(false); };
  const alTeclear = (ev) => { if (ev.key === 'Escape') { ev.stopPropagation(); dejar(); } };
  const alSalir = (ev) => { if (!ev.currentTarget.contains(ev.relatedTarget)) setPregunta(false); };
  const anular = async () => {
    if (trabajando) return;
    setTrabajando(true);
    setError('');
    setPregunta(false);
    try {
      alCambiar(await pedirApi(`/admin/facturas/${f.codigo}/anular`, { metodo: 'POST', sesion: true, espera: 10000, cuerpo: {} }));
      avisar(`Anulaste la factura ${f.numero}.`);
    } catch (err) {
      setError(textoDeFallo(err));
    }
    setTrabajando(false);
  };

  return (
    <li className="admin-material">
      <div className="admin-material-cabeza">
        <h4 className="admin-proveedor-nombre">Factura {f.numero}</h4>
        {f.anulada ? <span className="admin-agotado">Anulada</span> : null}
      </div>
      <p className="admin-material-datos">
        {f.cliente} · {f.ident}<br />
        Pedido {f.pedido} · {dinero(Number(f.total))} · <span className="admin-fecha">{marcaBonita(new Date(f.fecha))}</span>
      </p>
      {f.anulada ? null : (
        <div className="admin-acciones">
          <button ref={anularRef} className="admin-cancelar" type="button" aria-disabled={trabajando || undefined} aria-label={`Anular la factura ${f.numero}`} onClick={armar}>Anular</button>
        </div>
      )}
      {pregunta ? (
        <div className="admin-confirma" role="group" aria-label={`Confirmar la anulación de la factura ${f.numero}`} onKeyDown={alTeclear} onBlur={alSalir}>
          <p>¿Anular la factura {f.numero}? No se puede deshacer y queda el asiento contrario de la venta.</p>
          <button ref={confirmarRef} type="button" className="admin-confirmar is-cancelar" aria-disabled={trabajando || undefined} onClick={anular}>Sí, anular</button>
          <button type="button" className="admin-no" onClick={dejar}>No, dejarla</button>
        </div>
      ) : null}
      {error ? <p className="admin-error" role="alert">{error}</p> : null}
    </li>
  );
}

function Facturas() {
  const carga = useCarga('/admin/facturas', null);
  const d = carga.datos;
  const reemplazar = (f) => carga.ponerDatos({ ...d, facturas: d.facturas.map((x) => (x.codigo === f.codigo ? f : x)) });

  return (
    <Seccion id="admin-facturas" titulo="Facturas" que="las facturas" carga={carga}>
      {d ? (
        <>
          <h3 className="admin-subtitulo">Últimas facturas</h3>
          {d.facturas.length ? (
            <ul className="admin-materiales">
              {d.facturas.map((f) => <Factura key={f.codigo} f={f} alCambiar={reemplazar} />)}
            </ul>
          ) : <p className="admin-vacio">Todavía no hay facturas.</p>}
          <h3 className="admin-subtitulo">Clientes</h3>
          <ul className="admin-materiales">
            {d.clientes.map((c) => (
              <li key={c.codigo} className="admin-material">
                <h4 className="admin-proveedor-nombre">{c.nombre}</h4>
                <p className="admin-material-datos">
                  {c.tipo} {c.ident}{c.correo ? ` · ${c.correo}` : ''}{c.telefono ? ` · ${c.telefono}` : ''}<br />
                  {c.facturas} {c.facturas === 1 ? 'factura vigente' : 'facturas vigentes'} · {dinero(Number(c.facturado))} facturados
                </p>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </Seccion>
  );
}

export default Facturas;
