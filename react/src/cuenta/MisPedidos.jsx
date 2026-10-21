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
//
// Dentro de cada pedido, "Pedir otra vez" (seccion 15 del plan, fase 6): lo
// que siga en el catalogo y disponible va a la canasta con el precio de hoy,
// sumado a lo que ya hubiera (pedido/pedirOtraVez.js). Si entra algo se abre
// la canasta; siempre se dice que entro y que no. Clases: cuenta-pedido-otra
// (el boton) y cuenta-pedido-acciones (su renglon).
import { useState } from 'react';
import { m, useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';
import { dinero } from '@raiz/js/comun/state.js';
import { marcaBonita } from '@raiz/js/comun/storage.js';
import { useSesion } from '../estado/SesionProvider.jsx';
import { usePedido } from '../estado/PedidoProvider.jsx';
import { useCanasta } from '../pedido/CanastaProvider.jsx';
import { useAvisos } from '../comun/Avisos.jsx';
import { catalogo } from '../servicios/catalogo.js';
import { pedirOtraVez } from '../pedido/pedirOtraVez.js';
import MarcoCuenta from './MarcoCuenta.jsx';
import { Desvio } from './Desvio.jsx';
import { usePedidosGuardados } from './usePedidosGuardados.js';

function MisPedidos() {
  // Se mira al llegar y no despues (vease Desvio.jsx).
  const [conSesion] = useState(useSesion().dentro);
  if (!conSesion) return <Desvio a="/cuenta/entrar" />;
  return <Historial />;
}

// Al desplegarse, el detalle crece desde la fila en vez de aparecer de golpe,
// y la flecha gira a la vez (seccion 15 del plan, "Movimiento de la cuenta",
// punto 4). Sigue siendo un <details>: el lector dice si esta abierto, y
// Enter y Espacio sobre la fila llegan aqui como un clic. Lo unico que cambia
// es que el clic no lo abre ni lo cierra en el acto: abrir pone 'open' y la
// altura crece; cerrar encoge la altura y quita 'open' al acabar, para que
// lo de dentro no desaparezca antes de verse plegar.
const DESPLIEGA = { duration: 0.28, ease: [0.2, 0, 0, 1] };
const ABIERTO = { height: 'auto', opacity: 1 };
const CERRADO = { height: 0, opacity: 0 };

function Pedido({ p }) {
  const lineas = Array.isArray(p.lineas) ? p.lineas : [];
  const cuantos = lineas.reduce((s, l) => s + (Number(l.cantidad) || 0), 0);
  const reducido = useReducedMotion();
  const { lineas: enCanasta, hacer } = usePedido();
  const { abrir } = useCanasta();
  const avisar = useAvisos();
  // El aviso va por la region de avisos (para el lector de pantalla, que la
  // oye aunque la canasta se abra encima) y se queda escrito bajo el boton:
  // la region es invisible, y si no entra nada no habria nada que ver.
  const [nota, setNota] = useState('');
  const otraVez = () => {
    const r = pedirOtraVez(p, catalogo.productos, enCanasta);
    if (r.entro) {
      hacer({ tipo: 'sumar', lineas: r.lineas });
      abrir();
    }
    avisar(r.aviso);
    setNota(r.aviso);
  };
  // abierto: lo que se ve (la altura y la flecha); desplegado: el 'open' del
  // <details>, que se queda puesto mientras se pliega.
  const [abierto, setAbierto] = useState(false);
  const [desplegado, setDesplegado] = useState(false);
  const alPulsar = (e) => {
    e.preventDefault();
    if (abierto) { setAbierto(false); return; }
    setDesplegado(true);
    setAbierto(true);
  };
  // Si lo abre el navegador por su cuenta (buscar en la pagina), se sigue.
  const alCambiar = (e) => {
    if (e.currentTarget.open && !abierto) { setDesplegado(true); setAbierto(true); }
  };
  return (
    <details className={abierto ? 'cuenta-pedido is-abierto' : 'cuenta-pedido'} open={desplegado} onToggle={alCambiar}>
      {/* En el orden en que se leen: numero y total arriba, cuando y que
          llevaba debajo. Es tambien el orden en que los dice un lector. */}
      <summary onClick={alPulsar}>
        <span className="cuenta-pedido-numero">{p.numero}</span>
        <strong>{dinero(Number(p.total) || 0)}</strong>
        <span className="cuenta-pedido-fecha">{marcaBonita(new Date(p.fecha))}</span>
        <span className="cuenta-pedido-detalle">
          {`${cuantos} ${cuantos === 1 ? 'unidad' : 'unidades'}`}
          {p.modo === 'domicilio' ? ' · a domicilio' : ' · para retirar'}
        </span>
      </summary>
      <m.div
        className="cuenta-pedido-despliegue"
        initial={false}
        animate={abierto ? ABIERTO : CERRADO}
        transition={reducido ? { duration: 0 } : DESPLIEGA}
        onAnimationComplete={() => { if (!abierto) setDesplegado(false); }}
      >
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
          <p className="cuenta-pedido-acciones">
            {/* El nombre dice de que pedido: con varios abiertos, "Pedir otra vez" solo no basta. */}
            <button className="cuenta-pedido-otra" type="button" onClick={otraVez} aria-label={`Pedir otra vez lo del ${p.numero}`}>
              Pedir otra vez
            </button>
          </p>
          {nota ? <p className="cuenta-pedido-nota">{nota}</p> : null}
        </div>
      </m.div>
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
