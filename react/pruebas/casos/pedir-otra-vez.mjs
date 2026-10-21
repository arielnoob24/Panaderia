// "Pedir otra vez" en Mis pedidos (solo React): lo que sigue en el catalogo y
// disponible vuelve a la canasta con el precio de hoy y el mismo tamano,
// sumado a lo que hubiera con el tope de 100; lo que no, se dice por su
// nombre. Si no entra nada, la canasta no se abre y solo queda el aviso.
import { VENTANAS, crearCuenta, espera, meterPedidos } from '../arranque.mjs';

export const descripcion = 'pedir otra vez: todo entra, algo agotado, nada entra, tope de 100 y precio de hoy';
export const limite = 120;

const BASE = { modo: 'retiro', direccion: '', metodo: 'Efectivo', subtotal: 1, envio: 0, total: 1, correo: 'ana@correo.com' };
// Precios de entonces a proposito distintos de los de hoy (0,25 y 2,00).
const PEDIDOS = [
  { ...BASE, numero: 'ET-TODO', lineas: [{ nombre: 'Pan redondo', cantidad: 2, precio: 0.1 }, { nombre: 'Coca-Cola 2 L', cantidad: 1, precio: 1.5 }] },
  { ...BASE, numero: 'ET-AGOT', haceMs: 1000, lineas: [{ nombre: 'Palanqueta', cantidad: 3, precio: 0.5 }, { nombre: 'Galletas', cantidad: 1, precio: 1 }, { nombre: 'Powerade 1 L', cantidad: 1, precio: 1.75 }] },
  { ...BASE, numero: 'ET-NADA', haceMs: 2000, lineas: [{ nombre: 'Suspiros', cantidad: 2, precio: 0.75 }] },
  { ...BASE, numero: 'ET-TOPE', haceMs: 3000, lineas: [{ nombre: 'Galletas', cantidad: 60, precio: 1 }] },
];

export default async function pedirOtraVez(t) {
  for (const [nv, ventana] of Object.entries({ escritorio: VENTANAS.escritorio, movil: VENTANAS.movil })) {
    const ok = (c, q) => t.ok(c, `[${nv}] ${q}`);
    const ctx = await t.contexto(ventana, { nombre: nv });
    const p = await ctx.newPage();
    await crearCuenta(p, t.REACT);
    await meterPedidos(p, PEDIDOS);

    // Cada escena empieza con la canasta vacia y Mis pedidos recien cargado.
    const empezar = async () => {
      await p.evaluate(() => { try { localStorage.removeItem('eltradicional-pedido'); } catch (e) { /* nada */ } });
      await p.goto(t.REACT + '#/cuenta/pedidos'); await p.reload();
      await p.waitForSelector('.cuenta-vista-pedidos', { timeout: 5000 });
      await espera(400);
    };
    const pedir = async (numero) => {
      const detalle = p.locator(`details:has(.cuenta-pedido-numero:text-is("${numero}"))`);
      if (!(await detalle.getAttribute('open').catch(() => null) !== null)) {
        await detalle.locator('summary').click(); await espera(450);
      }
      await p.click(`button[aria-label="Pedir otra vez lo del ${numero}"]`, { timeout: 3000 });
      await espera(600);
      return (await detalle.locator('.cuenta-pedido-nota').textContent({ timeout: 2000 }).catch(() => '')).trim();
    };
    const abierta = () => p.locator('.canasta-panel.is-open').count().then((n) => n > 0);
    const enCanasta = () => p.$$eval('.canasta-lista .canasta-linea', (l) => l.map((li) => [
      li.querySelector('h3')?.textContent.trim(),
      li.querySelector('output')?.textContent.trim(),
      li.querySelector('.canasta-precio')?.textContent.trim(),
    ].join(' | ')).join(' ; '));
    const anunciado = () => p.textContent('[role="status"][aria-live="polite"]').then((s) => s.trim());
    const cerrar = async () => { await p.keyboard.press('Escape'); await espera(400); };

    // Todo entra, con el precio de hoy y el tamano de entonces.
    await empezar();
    let nota = await pedir('ET-TODO');
    ok(await abierta(), 'todo entra: la canasta no se abrio');
    let lineas = await enCanasta();
    ok(lineas === 'Pan redondo | 2 | $0.25 c/u ; Coca-Cola 2 L | 1 | $2.00 c/u', `todo entra: ${lineas}`);
    ok(nota === 'Pusimos en tu canasta 2 × Pan redondo y 1 × Coca-Cola 2 L, con el precio de hoy.', `todo entra, nota: ${nota}`);
    ok((await anunciado()) === nota, 'todo entra: no se anuncio lo mismo');
    await cerrar();

    // Algo agotado (Palanqueta) o agotado en ese tamano (Powerade).
    await empezar();
    nota = await pedir('ET-AGOT');
    ok(await abierta(), 'agotado: la canasta no se abrio');
    lineas = await enCanasta();
    ok(lineas === 'Galletas | 1 | $1.00 c/u', `agotado: ${lineas}`);
    ok(nota === 'Pusimos en tu canasta 1 × Galletas, con el precio de hoy. Ya no tenemos Palanqueta y Powerade 1 L.', `agotado, nota: ${nota}`);
    await cerrar();

    // Nada entra: la canasta sigue cerrada y vacia, solo el aviso.
    await empezar();
    nota = await pedir('ET-NADA');
    ok(!(await abierta()), 'nada entra: la canasta se abrio');
    ok((await enCanasta()) === '', 'nada entra: hay algo en la canasta');
    ok(nota === 'Ya no tenemos Suspiros. No pusimos nada en tu canasta.', `nada entra, nota: ${nota}`);
    ok((await anunciado()) === nota, 'nada entra: no se anuncio');

    // Se suma a lo que hay, con el tope de 100: 1 + 60, luego hasta 100, luego nada.
    await empezar();
    await pedir('ET-AGOT'); await cerrar();
    nota = await pedir('ET-TOPE'); await cerrar();
    ok((await enCanasta()).startsWith('Galletas | 61 |'), `suma: ${await enCanasta()}`);
    nota = await pedir('ET-TOPE');
    lineas = await enCanasta();
    ok(lineas === 'Galletas | 100 | $1.00 c/u', `tope: ${lineas}`);
    ok(nota === 'Pusimos en tu canasta 39 × Galletas, con el precio de hoy. Galletas ya llega al máximo de 100 por producto.', `tope, nota: ${nota}`);
    await cerrar();
    nota = await pedir('ET-TOPE');
    ok(!(await abierta()), 'en el tope: la canasta se abrio');
    ok(nota === 'Galletas ya llega al máximo de 100 por producto. No pusimos nada en tu canasta.', `en el tope, nota: ${nota}`);
    await ctx.close();
  }
}
