// ---- Panel, Resumen: como va el dia ---------------------------------------
// Ventas de hoy y del mes (sin los pedidos cancelados), cuantos faltan por
// entregar y lo mas vendido en los ultimos 30 dias. Todo lo suma la base.
import { dinero } from '../servicios/state.js';
import { useCarga } from './useCarga.js';
import Cargando from './Cargando.jsx';

const cuantos = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

function Resumen() {
  const carga = useCarga('/admin/resumen', null);
  if (carga.fase !== 'listo') return <Cargando carga={carga} que="el resumen" />;
  const r = carga.datos;
  return (
    <section aria-labelledby="admin-resumen-titulo">
      <h2 id="admin-resumen-titulo" className="admin-titulo">Cómo va el día</h2>
      <dl className="admin-cifras">
        <div><dt>Ventas de hoy</dt><dd>{dinero(Number(r.hoy.ventas))}</dd><small>{cuantos(r.hoy.pedidos, 'pedido', 'pedidos')}</small></div>
        <div><dt>Ventas del mes</dt><dd>{dinero(Number(r.mes.ventas))}</dd><small>{cuantos(r.mes.pedidos, 'pedido', 'pedidos')}</small></div>
        <div><dt>Por entregar</dt><dd>{r.pendientes}</dd><small>{r.pendientes === 1 ? 'pedido sin cerrar' : 'pedidos sin cerrar'}</small></div>
      </dl>
      <h3 className="admin-subtitulo">Lo más vendido en 30 días</h3>
      {r.masVendidos.length ? (
        <ol className="admin-lista">
          {r.masVendidos.map((p) => (
            <li key={p.nombre}><span>{p.nombre}</span><strong>{cuantos(p.unidades, 'unidad', 'unidades')}</strong></li>
          ))}
        </ol>
      ) : <p className="admin-vacio">Todavía no hay ventas en los últimos 30 días.</p>}
    </section>
  );
}

export default Resumen;
