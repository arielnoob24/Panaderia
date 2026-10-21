// El sitio actual (js/), no React: crear una cuenta y verificarla con el
// codigo del recuadro (sale de crypto.getRandomValues), por HTTP y con doble
// clic (file://, que carga js/sin-servidor.js). Vive aqui porque el codigo al
// azar es de js/cuenta/guardada.js, que comparten los dos sitios.
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { VENTANAS, espera } from '../arranque.mjs';

export const descripcion = 'el sitio actual: crear y verificar una cuenta por HTTP y con doble clic';
export const limite = 45;

export default async function codigoSitioActual(t) {
  for (const [como, base] of [['http', t.ACTUAL], ['doble clic', pathToFileURL(join(t.RAIZ, 'index.html')).href]]) {
    const ctx = await t.contexto(VENTANAS.escritorio, { nombre: `actual ${como}` });
    const p = await ctx.newPage();
    await p.goto(base); await p.waitForSelector('.nav-cuenta');
    await p.click('.nav-cuenta'); await p.click('.cuenta-menu [data-va="crear"]');
    await p.fill('#cuenta-nombre', 'Ana Pérez'); await p.fill('#cuenta-correo', 'ana@correo.com');
    await p.fill('#cuenta-telefono', '991234567'); await p.fill('#cuenta-clave', 'Clave123'); await p.fill('#cuenta-repite', 'Clave123');
    await p.click('.cuenta-crear');
    await p.waitForSelector('.cuenta-paso[data-paso="verificar"] .codigo-falso:not([hidden])', { state: 'attached' });
    const c = (await p.textContent('.cuenta-paso[data-paso="verificar"] .codigo-valor')).trim();
    t.ok(/^[1-9]\d{5}$/.test(c), `[${como}] codigo raro: ${c}`);
    await p.fill('#cuenta-codigo', c); await p.click('.cuenta-verificar'); await espera(800);
    const v = await p.evaluate(() => JSON.parse(localStorage.getItem('eltradicional-cuenta') || '{}').verificado);
    t.ok(v === true, `[${como}] la cuenta no quedo verificada`);
    await ctx.close();
  }
}
