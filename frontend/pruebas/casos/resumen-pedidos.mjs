// "Tu resumen" de Mis pedidos (src/cuenta/ResumenPedidos.jsx): las cifras
// salen de SQL sobre SQLite en el navegador (sql.js), y se descargan los
// pedidos en CSV y la base .sqlite. Con dos pedidos de la Supabase de
// mentira, en escritorio y en el telefono:
// - 2 pedidos, $9.00 en total, $4.50 de promedio, y "Pan de yuca" primero
//   en lo que mas se pide (5 unidades entre los dos);
// - el CSV trae la cabecera y una fila por cosa pedida, con las comas y
//   comillas del nombre bien puestas;
// - el .sqlite empieza por "SQLite format 3" (es una base de verdad).
import { readFileSync } from 'node:fs';
import { VENTANAS, crearCuenta, llegar } from '../arranque.mjs';
import { pedidosDe } from '../supabaseFalso.mjs';

export const descripcion = 'Mis pedidos: resumen con SQLite (sql.js) y descargas en CSV y .sqlite';
export const limite = 90;

const pedido = (numero, haceDias, lineas, envio = 0) => {
  const subtotal = lineas.reduce((s, l) => s + l.cantidad * l.precio, 0);
  return {
    numero, fecha: new Date(Date.now() - haceDias * 86400000).toISOString(), estado: 'Pagado',
    modo: envio ? 'domicilio' : 'retiro', direccion: envio ? 'Calle 1' : '', metodo: 'Efectivo al retirar',
    subtotal, envio, total: subtotal + envio, lineas,
  };
};

export default async function resumenPedidos(t) {
  for (const [nv, ventana] of Object.entries({ escritorio: VENTANAS.escritorio, movil: VENTANAS.movil })) {
    const ok = (c, q) => t.ok(c, `[${nv}] ${q}`);
    const ctx = await t.contexto(ventana, { nombre: nv });
    const p = await ctx.newPage();
    await crearCuenta(p, t.REACT);

    // $3.75 + $5.25 = $9.00. Pan de yuca: 3 + 2 = 5 unidades.
    pedidosDe('ana@correo.com').push(
      pedido('ET-AAAA', 2, [{ nombre: 'Pan de yuca', cantidad: 3, precio: 1.25 }]),
      pedido('ET-BBBB', 1, [{ nombre: 'Pan de yuca', cantidad: 2, precio: 1.25 }, { nombre: 'Torta "de la casa", grande', cantidad: 1, precio: 1.25 }], 1.5),
    );
    await llegar(p, '#/cuenta/pedidos');
    await p.waitForSelector('.cuenta-resumen-cifras', { timeout: 10000 }).catch(() => {});
    const cifras = await p.$$eval('.cuenta-resumen-cifras dd', (l) => l.map((e) => e.textContent.trim()));
    ok(cifras.join('|') === '2|$9.00|$4.50', `cifras del resumen: ${cifras.join('|')}`);
    const primero = await p.textContent('.cuenta-resumen-lista li:first-child').catch(() => '');
    ok(/Pan de yuca\s*5 unidades/.test(primero), `lo que mas se pide: ${primero}`);

    // El CSV.
    const [csv] = await Promise.all([p.waitForEvent('download'), p.click('.cuenta-resumen-csv')]);
    ok(/^mis-pedidos-\d{4}-\d{2}-\d{2}\.csv$/.test(csv.suggestedFilename()), `nombre del CSV: ${csv.suggestedFilename()}`);
    const texto = readFileSync(await csv.path(), 'utf8').replace(/^\uFEFF/, '');
    const filas = texto.trim().split('\r\n');
    ok(filas[0] === 'numero,fecha,estado,entrega,pago,producto,cantidad,precio_unitario,importe,total_pedido', `cabecera: ${filas[0]}`);
    ok(filas.length === 4, `filas del CSV (cabecera + 3 lineas): ${filas.length}`);
    ok(texto.includes(',"Torta ""de la casa"", grande",1,1.25,1.25,5.25'), 'el nombre con comillas y coma no va bien escapado');

    // La base .sqlite.
    const [base] = await Promise.all([p.waitForEvent('download'), p.click('.cuenta-resumen-sqlite')]);
    const bytes = readFileSync(await base.path());
    ok(bytes.subarray(0, 15).toString('latin1') === 'SQLite format 3', `el .sqlite no es una base SQLite: ${bytes.subarray(0, 15).toString('latin1')}`);
    await ctx.close();
  }
}
