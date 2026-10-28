// ---- Panel, Pedidos: los de todos los clientes -----------------------------
// El mas nuevo arriba. "Por atender" (lo de siempre) o "Todos". Cada pedido
// ensena quien lo hizo, que lleva y como se entrega, y un boton para pasarlo
// al estado siguiente: Pendiente de pago -> Pagado -> En preparacion -> Listo
// para retirar (o En camino, si es a domicilio) -> Entregado. Cancelar pide
// confirmar con un segundo toque. Las reglas las vuelve a poner la base
// (FN_ADMIN_PEDIDO_ESTADO): aqui solo se ofrece lo que tiene sentido.
import { useState } from 'react';
import { dinero } from '../servicios/state.js';
import { marcaBonita } from '../servicios/storage.js';
import { pedirApi } from '../servicios/api.js';
import { useAvisos } from '../comun/Avisos.jsx';
import { useCarga, textoDeFallo } from './useCarga.js';
import Cargando from './Cargando.jsx';

const FINALES = ['Entregado', 'Cancelado'];

// El estado que sigue, o '' si el pedido ya esta cerrado.
function siguiente(p) {
  switch (p.estado) {
    case 'Pendiente de pago': return 'Pagado';
    case 'Pagado': return 'En preparación';
    case 'En preparación': return p.modo === 'domicilio' ? 'En camino' : 'Listo para retirar';
    case 'Listo para retirar':
    case 'En camino': return 'Entregado';
    default: return '';
  }
}

function Pedido({ p, alCambiar }) {
  const avisar = useAvisos();
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState('');
  const [segura, setSegura] = useState(false);
  const sigue = siguiente(p);

  const cambiar = async (estado) => {
    setTrabajando(true);
    setError('');
    setSegura(false);
    try {
      const nuevo = await pedirApi(`/admin/pedidos/${p.numero}`, { metodo: 'PUT', cuerpo: { estado }, sesion: true, espera: 10000 });
      alCambiar({ ...p, ...nuevo });
      avisar(`El pedido ${p.numero} pasó a ${estado}.`);
    } catch (e) {
      setError(textoDeFallo(e));
    }
    setTrabajando(false);
  };

  const unidades = p.lineas.reduce((s, l) => s + l.cantidad, 0);
  return (
    <li className="admin-pedido">
      <div className="admin-pedido-cabeza">
        <strong>{p.numero}</strong>
        <span className={`admin-estado is-${FINALES.includes(p.estado) ? 'cerrado' : 'abierto'}`}>{p.estado}</span>
        <span className="admin-pedido-total">{dinero(Number(p.total))}</span>
      </div>
      <p className="admin-pedido-quien">
        {p.cliente} · <a href={`tel:${p.celular}`}>{p.celular}</a> · {marcaBonita(new Date(p.fecha))}
      </p>
      <p className="admin-pedido-entrega">
        {p.modo === 'domicilio' ? `A domicilio: ${p.direccion || 'sin dirección'}` : 'Para retirar en el local'} · {p.metodo}
      </p>
      <ul className="admin-pedido-lineas" aria-label={`Lo que lleva el pedido ${p.numero}, ${unidades} unidades`}>
        {p.lineas.map((l) => <li key={l.nombre}><span>{l.cantidad} × {l.nombre}</span><span>{dinero(Number(l.precio) * l.cantidad)}</span></li>)}
      </ul>
      {sigue ? (
        <div className="admin-acciones">
          <button className="cuenta-pedido-otra admin-avanzar" type="button" disabled={trabajando} onClick={() => cambiar(sigue)}>
            Pasar a «{sigue}»
          </button>
          {segura ? (
            <button className="admin-cancelar is-segura" type="button" disabled={trabajando} onClick={() => cambiar('Cancelado')}>
              Sí, cancelar el {p.numero}
            </button>
          ) : (
            <button className="admin-cancelar" type="button" disabled={trabajando} onClick={() => setSegura(true)}>
              Cancelar pedido
            </button>
          )}
        </div>
      ) : null}
      {error ? <p className="admin-error" role="alert">{error}</p> : null}
    </li>
  );
}

function Pedidos() {
  const carga = useCarga('/admin/pedidos', 'pedidos');
  const [ver, setVer] = useState('atender');
  if (carga.fase !== 'listo') return <Cargando carga={carga} que="los pedidos" />;

  const todos = carga.datos;
  const lista = ver === 'todos' ? todos : todos.filter((p) => !FINALES.includes(p.estado));
  const cambiado = (nuevo) => carga.ponerDatos(todos.map((p) => (p.numero === nuevo.numero ? nuevo : p)));

  return (
    <section aria-labelledby="admin-pedidos-titulo">
      <h2 id="admin-pedidos-titulo" className="admin-titulo">Pedidos</h2>
      <div className="admin-filtros" role="group" aria-label="Qué pedidos ver">
        <button type="button" className="admin-filtro" aria-pressed={ver === 'atender'} onClick={() => setVer('atender')}>Por atender</button>
        <button type="button" className="admin-filtro" aria-pressed={ver === 'todos'} onClick={() => setVer('todos')}>Todos (últimos 100)</button>
      </div>
      {lista.length ? (
        <ul className="admin-pedidos">
          {lista.map((p) => <Pedido key={p.numero} p={p} alCambiar={cambiado} />)}
        </ul>
      ) : (
        <p className="admin-vacio">{ver === 'todos' ? 'Todavía no hay pedidos.' : 'No hay pedidos por atender.'}</p>
      )}
    </section>
  );
}

export default Pedidos;
