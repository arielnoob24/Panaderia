// ---- Tu resumen, arriba de Mis pedidos ---------------------------------
// Cuantos pedidos, cuanto se ha gastado y lo que mas se pide, calculado con
// SQL sobre una base SQLite en el navegador (servicios/sqlite.js, sql.js).
// Y dos descargas: los pedidos en CSV (servicios/csv.js), para una hoja de
// calculo, y la base .sqlite entera. Todo sale de los pedidos que ya se
// enseñan abajo: no pide nada nuevo a la API.
import { useEffect, useState } from 'react';
import { dinero } from '../servicios/state.js';
import { pedidosACsv } from '../servicios/csv.js';
import { resumenDePedidos, baseComoArchivo } from '../servicios/sqlite.js';
import { descargar } from '../comun/descargar.js';

// La marca de orden de bytes (U+FEFF) que dice a Excel que el CSV es UTF-8.
const BOM = String.fromCharCode(0xfeff);

// El nombre del archivo con el dia: mis-pedidos-2026-11-24.csv
const conFecha = (base, ext) => `${base}-${new Date().toISOString().slice(0, 10)}.${ext}`;

function ResumenPedidos({ pedidos }) {
  // undefined mientras se calcula; null si sql.js no se pudo cargar.
  const [resumen, setResumen] = useState(undefined);

  useEffect(() => {
    let vigente = true;
    setResumen(undefined);
    resumenDePedidos(pedidos)
      .then((r) => { if (vigente) setResumen(r); })
      .catch(() => { if (vigente) setResumen(null); });
    return () => { vigente = false; };
  }, [pedidos]);

  // El BOM (U+FEFF) delante es para que Excel lea bien las tildes.
  const bajarCsv = () => descargar(conFecha('mis-pedidos', 'csv'), BOM + pedidosACsv(pedidos), 'text/csv;charset=utf-8');
  const bajarBase = async () => {
    descargar(conFecha('mis-pedidos', 'sqlite'), await baseComoArchivo(pedidos), 'application/vnd.sqlite3');
  };

  return (
    <section className="cuenta-resumen" aria-labelledby="cuenta-resumen-titulo">
      <h2 id="cuenta-resumen-titulo" className="cuenta-resumen-titulo">Tu resumen</h2>
      {resumen === undefined ? <p className="cuenta-resumen-nota" role="status">Calculando tu resumen…</p> : null}
      {resumen === null ? <p className="cuenta-resumen-nota" role="status">No se pudo calcular el resumen ahora. Tus pedidos siguen abajo.</p> : null}
      {resumen ? (
        <>
          <dl className="cuenta-pedido-cuentas cuenta-resumen-cifras">
            <div><dt>Pedidos</dt><dd>{resumen.pedidos}</dd></div>
            <div><dt>En total</dt><dd>{dinero(resumen.gastado)}</dd></div>
            <div><dt>Por pedido, en promedio</dt><dd>{dinero(resumen.promedio)}</dd></div>
          </dl>
          {resumen.masPedidos.length ? (
            <>
              <h3 className="cuenta-resumen-sub">Lo que más pides</h3>
              <ol className="cuenta-resumen-lista">
                {resumen.masPedidos.map((x) => (
                  <li key={x.nombre}>
                    <span>{x.nombre}</span>
                    <span>{`${x.unidades} ${x.unidades === 1 ? 'unidad' : 'unidades'}`}</span>
                  </li>
                ))}
              </ol>
            </>
          ) : null}
        </>
      ) : null}
      <p className="cuenta-resumen-acciones">
        <button className="cuenta-pedido-otra cuenta-resumen-csv" type="button" onClick={bajarCsv}>Descargar en CSV</button>
        {resumen ? (
          <button className="cuenta-pedido-otra cuenta-resumen-sqlite" type="button" onClick={bajarBase}>Descargar la base SQLite</button>
        ) : null}
      </p>
    </section>
  );
}

export default ResumenPedidos;
