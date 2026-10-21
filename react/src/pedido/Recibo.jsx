// Lo que ensena #/comprobante, con el HTML de comprobanteHtml() en
// checkout.js: el numero (con "Copiar"), lo que cuesta, como se paga y se
// recibe, a nombre de quien va la factura, lo que se pidio, el correo que se
// mando y como fue el envio. Todo sale del recibo armado al aprobar
// (armarRecibo de servicios/cobro.js), el mismo del correo y del historial.
import { useState } from 'react';
import { dinero } from '../servicios/state.js';
import { textoModo, textoEnvio, saludoComprobante, textoCorreo } from '../servicios/cobro.js';
import { useVistaPedido } from './useVistaPedido.js';
import CabezaPedido from './CabezaPedido.jsx';

// Sin permiso de portapapeles (o sin HTTPS) queda el camino de siempre.
const copiarAMano = (texto) => {
  const temporal = document.createElement('textarea');
  temporal.value = texto;
  temporal.setAttribute('readonly', '');
  temporal.style.cssText = 'position:fixed;top:-100px;opacity:0';
  document.body.append(temporal);
  temporal.select();
  let hecho;
  try { hecho = document.execCommand('copy'); } catch (e) { hecho = false; }
  temporal.remove();
  return hecho;
};

function Recibo({ recibo: r }) {
  const { tituloRef, salir } = useVistaPedido('Pedido confirmado');
  const [copiado, setCopiado] = useState('');

  const copiar = async () => {
    let hecho;
    try {
      if (!navigator.clipboard) throw new Error('sin portapapeles');
      await navigator.clipboard.writeText(r.numero);
      hecho = true;
    } catch (e) {
      hecho = copiarAMano(r.numero);
    }
    setCopiado(hecho ? `Número ${r.numero} copiado.` : `No se pudo copiar; apunta el ${r.numero} a mano.`);
  };

  return (
    <section id="confirmar" className="checkout section-pad">
      <div className="container">
        <CabezaPedido titulo="Pedido confirmado" tituloRef={tituloRef} onVolver={salir} />
        <div className="checkout-paso" data-checkout="comprobante">
          <div className="checkout-recibo">
            <div className="recibo-cuerpo">
              <p className="recibo-sello"><span aria-hidden="true">✓</span> Pedido registrado</p>
              <p className="recibo-simulado">
                Pedido simulado. Es una demostración académica: no se realizó ningún cobro y la
                panadería todavía no ha recibido nada.
              </p>
              <dl className="recibo-datos">
                <div>
                  <dt>Número de pedido</dt>
                  <dd><span className="recibo-numero">{r.numero}</span><button className="recibo-copiar" type="button" onClick={copiar}>Copiar</button></dd>
                </div>
                <div><dt>Subtotal</dt><dd className="recibo-subtotal">{dinero(r.subtotal)}</dd></div>
                <div><dt>Envío</dt><dd className="recibo-envio">{textoEnvio(r.envio)}</dd></div>
                <div><dt>Total</dt><dd className="recibo-total">{dinero(r.total)}</dd></div>
                <div><dt>Pago</dt><dd className="recibo-metodo">{r.detalle}</dd></div>
                <div><dt>Entrega</dt><dd className="recibo-modo">{textoModo(r.modo)}</dd></div>
                <div><dt>Factura</dt><dd className="recibo-factura">{r.factura}</dd></div>
                <div className="recibo-linea-dir" hidden={r.modo !== 'domicilio'}><dt>Dirección</dt><dd className="recibo-direccion">{r.direccion}</dd></div>
                {/* Las indicaciones solo salen si hay alguna. */}
                <div className="recibo-linea-notas" hidden={!r.notas}><dt>Indicaciones</dt><dd className="recibo-notas">{r.notas}</dd></div>
              </dl>
              <h2 className="recibo-titulo">Lo que pediste</h2>
              <ul className="recibo-lista">
                {r.lineas.map((l) => (
                  <li key={l.id}><span>{`${l.cantidad} × ${l.nombre}`}</span><span>{dinero(l.precio * l.cantidad)}</span></li>
                ))}
              </ul>
            </div>
            {/* El correo que se mando, o el que habria llegado. */}
            <div className="codigo-falso recibo-enviado">
              <p className="codigo-falso-de recibo-enviado-de">{`Correo de El Tradicional · para ${r.correo}`}</p>
              <p className="codigo-falso-texto recibo-enviado-texto">{saludoComprobante(r)}</p>
            </div>
            <p className={r.envioCorreo === 'enviado' ? 'recibo-simulado recibo-envio-estado is-bien' : 'recibo-simulado recibo-envio-estado'} role="status">
              {textoCorreo(r.envioCorreo, r)}
            </p>
            <div className="recibo-pie">
              <p className="recibo-copiado" role="status" hidden={!copiado}>{copiado}</p>
              <button className="button button-yellow canasta-listo" type="button" onClick={salir}>Listo, cerrar</button>
              {/* En React la canasta se vacia al aprobar, no al cerrar (el
                  sitio actual si la vacia al cerrar, y alli la nota es otra). */}
              <p className="canasta-nota">
                Tu canasta ya está vacía. El pedido queda en Mis pedidos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Recibo;
