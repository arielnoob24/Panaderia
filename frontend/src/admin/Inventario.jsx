// ---- Panel, Inventario: lo que hay en bodega ------------------------------
// Solo lectura. Materiales con lo que queda y una alerta si bajaron del
// minimo (los que estan mal, primero), los lotes caducados o que caducan en
// 30 dias, y producido contra vendido de cada producto. Cada material abre sus
// movimientos (el kardex). Los valores y costos solo los trae la API para quien
// tiene reportes.ver: sin ellos, esas lineas no se pintan.
import { useState } from 'react';
import { dinero } from '../servicios/state.js';
import { marcaBonita } from '../servicios/storage.js';
import { useAvisos } from '../comun/Avisos.jsx';
import { useCarga } from './useCarga.js';
import Seccion from './Seccion.jsx';
import Cargando from './Cargando.jsx';

const numero = new Intl.NumberFormat('es-EC', { maximumFractionDigits: 2 });
const con = (n, unidad) => `${numero.format(Number(n))} ${unidad}`;

// Los movimientos de un material, que se piden al abrirlo.
function Movimientos({ codigo, nombre, costos }) {
  const carga = useCarga(`/admin/inventario/${codigo}`, 'movimientos');
  if (carga.fase !== 'listo') return <Cargando carga={carga} que={`los movimientos de ${nombre}`} alReintentar={carga.recargar} />;
  if (!carga.datos.length) return <p className="admin-vacio">{nombre} todavía no tiene movimientos.</p>;
  return (
    <ul className="admin-movimientos" aria-label={`Movimientos de ${nombre}`}>
      {carga.datos.map((m, i) => (
        // El kardex no cambia de orden mientras se mira.
        <li key={i}>
          <span className="admin-mov-quien">{m.tipo} · {m.documento}<small>{marcaBonita(new Date(m.fecha))}</small></span>
          <span className="admin-mov-cifras">
            {Number(m.cantidad) > 0 ? '+' : ''}{numero.format(Number(m.cantidad))}
            <small>queda {numero.format(Number(m.saldo))}{costos && m.valor !== null ? ` · ${dinero(Number(m.valor))}` : ''}</small>
          </span>
        </li>
      ))}
    </ul>
  );
}

function Material({ m, costos }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <li className="admin-material">
      <div className="admin-material-cabeza">
        <strong>{m.nombre}</strong>
        {m.bajoMinimo ? <span className="admin-estado is-abierto">Bajo el mínimo</span> : null}
      </div>
      <p className="admin-material-datos">
        Hay {con(m.existencia, m.unidad)}
        {Number(m.existencia) > 0 ? ` (${con(m.existenciaCompra, m.unidadCompra)})` : ''}
        {' · '}mínimo {con(m.minimo, m.unidad)}
        {costos && m.valor !== null ? ` · vale ${dinero(Number(m.valor))}` : ''}
      </p>
      <button
        className="admin-ver-mov" type="button" aria-expanded={abierto}
        aria-label={`${abierto ? 'Ocultar' : 'Ver'} los movimientos de ${m.nombre}`}
        onClick={() => setAbierto((a) => !a)}
      >
        {abierto ? 'Ocultar movimientos' : 'Ver movimientos'}
      </button>
      {abierto ? <Movimientos codigo={m.codigo} nombre={m.nombre} costos={costos} /> : null}
    </li>
  );
}

function Inventario() {
  const avisar = useAvisos();
  const carga = useCarga('/admin/inventario', null);
  const [ver, setVer] = useState('todos');
  const d = carga.datos;
  const bajos = d ? d.materiales.filter((m) => m.bajoMinimo) : [];
  const sinNada = d ? d.materiales.every((m) => Number(m.existencia) === 0) : false;
  const lista = d ? (ver === 'bajos' ? bajos : d.materiales) : [];
  const elegir = (cual) => {
    setVer(cual);
    const n = cual === 'bajos' ? bajos.length : d.materiales.length;
    avisar(`Mostrando ${n} ${n === 1 ? 'material' : 'materiales'}.`);
  };

  return (
    <Seccion id="admin-inventario" titulo="Inventario" que="el inventario" carga={carga}>
      {d ? (
        <>
          {sinNada ? <p className="admin-nota">Todavía no se ha recibido ninguna compra: las existencias están en cero.</p> : null}
          <h3 className="admin-subtitulo">Materiales</h3>
          <div className="admin-filtros" role="group" aria-label="Qué materiales ver">
            <button type="button" className="admin-filtro" aria-pressed={ver === 'todos'} onClick={() => elegir('todos')}>Todos ({d.materiales.length})</button>
            <button type="button" className="admin-filtro" aria-pressed={ver === 'bajos'} onClick={() => elegir('bajos')}>Bajo el mínimo ({bajos.length})</button>
          </div>
          {lista.length ? (
            <ul className="admin-materiales">{lista.map((m) => <Material key={m.codigo} m={m} costos={d.costos} />)}</ul>
          ) : <p className="admin-vacio">Ningún material está bajo el mínimo.</p>}

          {d.caducan.length ? (
            <>
              <h3 className="admin-subtitulo">Caducados o por caducar en 30 días</h3>
              <ul className="admin-lista admin-caducan">
                {d.caducan.map((l) => (
                  <li key={l.lote}>
                    <span>{l.material}<small>{con(l.saldo, l.unidad)} · lote {l.lote}</small></span>
                    <strong>{l.caducado ? 'Caducó el ' : 'Caduca el '}{new Date(`${l.caduca}T12:00:00`).toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          <h3 className="admin-subtitulo">Productos: producido y vendido</h3>
          {d.productos.length ? (
            <ul className="admin-lista admin-productos-inv">
              {d.productos.map((x) => (
                <li key={`${x.nombre}-${x.tamano}`}>
                  <span>{x.nombre}{x.tamano === 'Único' ? '' : ` ${x.tamano}`}
                    <small>
                      {Number(x.producido) > 0 ? `producido ${x.producido}` : 'sin producción registrada'} · vendido {x.vendido}
                      {d.costos && x.costo !== null ? ` · costo ${dinero(Number(x.costo))}` : ''}
                    </small>
                  </span>
                  <strong>{Number(x.producido) > 0 ? `${x.existencia} en existencia` : `${dinero(Number(x.precio))}`}</strong>
                </li>
              ))}
            </ul>
          ) : <p className="admin-vacio">Todavía no hay producción ni ventas.</p>}
        </>
      ) : null}
    </Seccion>
  );
}

export default Inventario;
