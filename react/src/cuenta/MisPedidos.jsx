// ---- #/cuenta/pedidos: Mis pedidos -----------------------------------------
// Todo el historial de IndexedDB (eltradicional/pedidos), el mas nuevo
// arriba. Cada pedido es un <details>, como pintarHistorial() de
// js/cuenta/account.js: cerrado ensena numero, total, fecha y cuantas cosas
// llevaba; abierto, lo que llevaba linea a linea y como se pago y se recibio.
// El navegador ya sabe abrirlo y cerrarlo con raton, dedo y teclado, y el
// lector de pantalla dice si esta abierto o cerrado. Sin sesion, a entrar.
//
// Los nombres de los productos vienen del registro guardado: JSX los escapa.
// Las clases son las del sitio actual (cuenta-historial, cuenta-pedido...),
// para que frontend anime la apertura sobre ellas.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { dinero } from '@raiz/js/comun/state.js';
import { marcaBonita } from '@raiz/js/comun/storage.js';
import { useSesion } from '../estado/SesionProvider.jsx';
import MarcoCuenta from './MarcoCuenta.jsx';
import { Desvio } from './Desvio.jsx';
import { usePedidosGuardados } from './usePedidosGuardados.js';

function MisPedidos() {
  // Se mira al llegar y no despues (vease Desvio.jsx).
  const [conSesion] = useState(useSesion().dentro);
  if (!conSesion) return <Desvio a="/cuenta/entrar" />;
  return <Historial />;
}

function Pedido({ p }) {
  const lineas = Array.isArray(p.lineas) ? p.lineas : [];
  const cuantos = lineas.reduce((s, l) => s + (Number(l.cantidad) || 0), 0);
  return (
    <details className="cuenta-pedido">
      {/* En el orden en que se leen: numero y total arriba, cuando y que
          llevaba debajo. Es tambien el orden en que los dice un lector. */}
      <summary>
        <span className="cuenta-pedido-numero">{p.numero}</span>
        <strong>{dinero(Number(p.total) || 0)}</strong>
        <span className="cuenta-pedido-fecha">{marcaBonita(new Date(p.fecha))}</span>
        <span className="cuenta-pedido-detalle">
          {`${cuantos} ${cuantos === 1 ? 'unidad' : 'unidades'}`}
          {p.modo === 'domicilio' ? ' · a domicilio' : ' · para retirar'}
        </span>
      </summary>
      <div className="cuenta-pedido-cuerpo">
        <ul className="cuenta-pedido-lineas">
          {lineas.map((l, i) => (
            // Un registro ya cerrado: sus lineas no cambian de orden.
            <li key={i}>
              <span>{`${l.cantidad} × ${l.nombre}`}</span>
              <span>{dinero((Number(l.precio) || 0) * (Number(l.cantidad) || 0))}</span>
            </li>
          ))}
        </ul>
        <dl className="cuenta-pedido-cuentas">
          <div><dt>Subtotal</dt><dd>{dinero(Number(p.subtotal) || 0)}</dd></div>
          <div><dt>Envío</dt><dd>{Number(p.envio) ? dinero(Number(p.envio)) : 'Gratis'}</dd></div>
          <div><dt>Total</dt><dd>{dinero(Number(p.total) || 0)}</dd></div>
          {p.metodo ? <div><dt>Pago</dt><dd>{p.metodo}</dd></div> : null}
          <div>
            <dt>Entrega</dt>
            <dd>{p.modo === 'domicilio' ? (p.direccion || 'A domicilio') : 'Retiro en el local'}</dd>
          </div>
        </dl>
      </div>
    </details>
  );
}

function Historial() {
  const pedidos = usePedidosGuardados();
  return (
    <MarcoCuenta paso="pedidos" titulo="Mis pedidos">
      <div className="cuenta-formulario">
        <div className="cuenta-cuerpo">
          {pedidos && !pedidos.length ? (
            <p className="cuenta-historial-vacio">
              Todavía no has hecho ningún pedido desde este navegador. Cuando pagues uno, aparecerá aquí.
            </p>
          ) : null}
          <ul className="cuenta-historial">
            {(pedidos || []).map((p) => <li key={p.numero}><Pedido p={p} /></li>)}
          </ul>
          <p className="cuenta-nota">
            Quedan guardados en este navegador y en ninguna otra parte: desde otro equipo no se ven.
          </p>
        </div>
        <div className="cuenta-pie">
          <Link className="cuenta-salir cuenta-volver-datos" to="/cuenta">Volver a mis datos</Link>
        </div>
      </div>
    </MarcoCuenta>
  );
}

export default MisPedidos;
