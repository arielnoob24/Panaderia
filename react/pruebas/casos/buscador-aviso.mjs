// El buscador de la tienda habla una vez, cuando se deja de escribir, y por
// una sola region: antes cada tecla decia la cuenta y, sin resultados, dos
// role="status" hablaban a la vez (WCAG 4.1.3).
import { VENTANAS, espera } from '../arranque.mjs';

export const descripcion = 'el buscador de la tienda anuncia una vez tras dejar de escribir, por una sola region';
export const limite = 60;

export default async function buscadorAviso(t) {
  for (const nv of ['escritorio', 'movil']) {
    const ctx = await t.contexto(VENTANAS[nv], { nombre: nv });
    const ok = (c, q) => t.ok(c, `[${nv}] ${q}`);
    // Lo que cambia en cualquier region que habla, con su hora.
    await ctx.addInitScript(() => {
      window.__dicho = [];
      document.addEventListener('keydown', () => { window.__tecla = performance.now(); }, true);
      document.addEventListener('DOMContentLoaded', () => {
        new MutationObserver((cambios) => {
          for (const c of cambios) {
            const nodo = c.target.nodeType === 1 ? c.target : c.target.parentElement;
            const region = nodo?.closest('[aria-live],[role=status],[role=alert]');
            if (!region || region.closest('[hidden]')) continue;
            const texto = region.textContent.trim();
            if (texto) window.__dicho.push({ texto, cuando: performance.now(), clase: region.className });
          }
        }).observe(document.body, { childList: true, subtree: true, characterData: true });
      });
    });
    const p = await ctx.newPage();
    await p.goto(t.REACT + '#/tienda-catalogo');
    await p.waitForSelector('.vista-busca');
    await espera(800);
    await p.click('.vista-busca');
    await p.evaluate(() => { window.__dicho = []; });
    const empezo = await p.evaluate(() => performance.now());
    await p.keyboard.type('zzzz', { delay: 120 });
    const acabo = await p.evaluate(() => window.__tecla);
    await espera(900);
    const dicho = await p.evaluate(() => [...new Map(window.__dicho.map((d) => [d.texto + d.clase, d])).values()]);
    ok(dicho.length === 1, `se anuncio ${dicho.length} veces: ${dicho.map((d) => d.texto).join(' | ')}`);
    const d = dicho[0];
    if (d) {
      ok(d.cuando >= acabo + 300, `hablo ${Math.round(d.cuando - acabo)} ms despues de la ultima tecla (escribir duro ${Math.round(acabo - empezo)} ms)`);
      ok(/No encontramos nada que se llame «zzzz»/.test(d.texto) && /Mostrando 0 de/.test(d.texto), `el aviso no junta la cuenta y el por que: ${d.texto}`);
    }
    ok(await p.locator('.vista-vacio[role]').count() === 0, 'el texto de "no hay" sigue con role');
    ok(await p.isVisible('.vista-vacio'), 'el texto de "no hay" no se ve');
    // Borrar: vuelve a hablar una vez, con la cuenta entera.
    await p.evaluate(() => { window.__dicho = []; });
    await p.keyboard.press('Control+A');
    await p.keyboard.press('Backspace');
    await espera(900);
    const otra = await p.evaluate(() => [...new Set(window.__dicho.map((x) => x.texto))]);
    ok(otra.length === 1 && /^Mostrando \d+ de \d+ productos?\./.test(otra[0]), `al borrar dijo: ${otra.join(' | ')}`);
    await ctx.close();
  }
}
