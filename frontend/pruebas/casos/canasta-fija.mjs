// Mi canasta predeterminada (solo React): se arma desde la canasta normal
// ("Guardar como mi canasta predeterminada") o en su pagina, se ajusta, y
// "Pedir mi canasta" la suma a la canasta con el precio de hoy y la abre.
// Sin sesion, la pagina lleva a entrar.
import { VENTANAS, crearCuenta, espera } from '../arranque.mjs';

export const descripcion = 'canasta predeterminada: guardar desde la canasta, editar, pedirla y sin sesion';
export const limite = 120;

const PAN = '.product-card:has(h3:text-is("Pan redondo"))';

export default async function canastaFija(t) {
  for (const [nv, ventana] of Object.entries({ escritorio: VENTANAS.escritorio, movil: VENTANAS.movil })) {
    const ok = (c, q) => t.ok(c, `[${nv}] ${q}`);
    const lineas = (p) => p.$$eval('.canasta-lista .canasta-linea', (l) => l.map((li) => [
      li.querySelector('h3')?.textContent.trim(), li.querySelector('output')?.textContent.trim(),
    ].join(' | ')).join(' ; '));
    const vaciarPedido = (p) => p.evaluate(() => { try { localStorage.removeItem('eltradicional-pedido'); } catch (e) { /* nada */ } });

    // Sin sesion: la pagina lleva a entrar.
    const anonimo = await t.contexto(ventana, { nombre: `${nv}-anonimo` });
    const a = await anonimo.newPage();
    await a.goto(t.REACT + '#/cuenta/canasta'); await a.reload();
    await espera(900);
    ok(!a.url().includes('canasta-fija'), `sin sesion: la pagina no llevo a entrar (${a.url()})`);

    // Con sesion: dos panes a la canasta y guardarla como predeterminada.
    const ctx = await t.contexto(ventana, { nombre: nv });
    const p = await ctx.newPage();
    await crearCuenta(p, t.REACT);
    await vaciarPedido(p);
    await p.goto(t.REACT + '#/tienda-catalogo'); await p.reload();
    await p.waitForSelector('.product-card', { timeout: 5000 });
    await p.click(`${PAN} .card-mas, ${PAN} [aria-label*="Sumar"], ${PAN} [aria-label*="Agregar"]`, { timeout: 3000 });
    await espera(400);
    await p.click('.floating-whatsapp.is-canasta'); await espera(600);
    const enCanasta = await lineas(p);
    ok(enCanasta.startsWith('Pan redondo'), `canasta: ${enCanasta}`);
    ok(await p.locator('.canasta-guardar-fija').count() === 1, 'falta el boton de guardar como predeterminada');
    await p.click('.canasta-guardar-fija'); await espera(300);
    const guardada = await p.evaluate(() => JSON.parse(localStorage.getItem(Object.keys(localStorage).find((k) => k.startsWith('tradicional:canasta-fija:'))) || '[]'));
    ok(guardada.length === 1 && guardada[0].nombre === 'Pan redondo', `guardar: ${JSON.stringify(guardada)}`);
    ok((await p.textContent('.canasta-guardar-fija')).includes('Reemplazar'), 'guardar: no cambio a Reemplazar');
    await p.keyboard.press('Escape'); await espera(400);

    // La pagina: se ve, se ajusta y se anade otro producto.
    await p.goto(t.REACT + '#/cuenta/canasta'); await p.reload();
    await p.waitForSelector('.cuenta-vista-canasta', { timeout: 5000 });
    await espera(400);
    const filas = await p.$$eval('.cuenta-fija-linea strong', (e) => e.map((x) => x.textContent.trim()));
    ok(filas.join(',') === 'Pan redondo', `pagina: ${filas.join(',')}`);
    await p.click('button[aria-label="Sumar una unidad de Pan redondo"]'); await espera(200);
    const cant = Number((await p.textContent('.cuenta-fija-cantidad output')).trim());
    ok(cant === guardada[0].cantidad + 1, `ajustar: ${cant}`);
    await p.selectOption('#fija-producto', { index: 1 });
    await p.click('.cuenta-fija-boton'); await espera(200);
    ok(await p.locator('.cuenta-fija-linea').count() === 2, 'anadir: no hay dos lineas');

    // Pedirla con la canasta vacia: entra todo y la canasta se abre.
    await vaciarPedido(p);
    await p.reload(); await p.waitForSelector('.cuenta-vista-canasta', { timeout: 5000 }); await espera(300);
    await p.click('.cuenta-fija-acciones .button'); await espera(600);
    ok(await p.locator('.canasta-panel.is-open').count() === 1, 'pedir: la canasta no se abrio');
    const puestas = await lineas(p);
    ok(puestas.startsWith(`Pan redondo | ${cant}`) && puestas.includes(' ; '), `pedir: ${puestas}`);
    await p.keyboard.press('Escape'); await espera(300);

    // Quitar todo deja el mensaje de vacia.
    for (const n of await p.$$eval('.cuenta-fija-quitar', (b) => b.map((x) => x.getAttribute('aria-label')))) {
      await p.click(`button[aria-label="${n}"]`); await espera(150);
    }
    ok(await p.locator('.cuenta-fija-vacio').count() === 1, 'quitar: no salio el mensaje de vacia');
  }
}
