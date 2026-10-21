// La barra de deshacer no tapa lo que tiene el foco (WCAG 2.4.11): en el
// telefono, mientras se ve, la pagina guarda su sitio por abajo, tambien al
// final del pie.
import { VENTANAS, espera, esperaQue } from '../arranque.mjs';

export const descripcion = 'la barra de deshacer no tapa el foco en el telefono (320 y 390 px)';
export const limite = 120;

export default async function barraDeshacer(t) {
  for (const [sitio, base, ruta] of [['react', t.REACT, '#/tienda-catalogo']]) {
    for (const nv of ['m320', 'movil']) {
      const ctx = await t.contexto({ ...VENTANAS[nv], reducedMotion: 'reduce' }, { nombre: `${sitio}-${nv}` });
      const p = await ctx.newPage();
      await p.goto(base + ruta);
      await p.waitForSelector('.product-card:not([hidden]) .card-mas');
      await espera(400);
      // Una unidad y fuera: sale la barra.
      await p.locator('.product-card:not([hidden]) .card-mas').nth(3).click();
      await p.locator('.product-card:not([hidden]) .card-menos:not([hidden])').first().click();
      const hay = await esperaQue(() => p.isVisible('.deshacer-barra'));
      t.ok(hay, `[${sitio} ${nv}] no salio la barra de deshacer`);
      if (!hay) { await ctx.close(); continue; }
      // Se recorre con el foco lo de la pagina mientras la barra sigue ahi.
      const res = await p.evaluate(async () => {
        const barra = document.querySelector('.deshacer-barra');
        const lista = [...document.querySelectorAll('main a[href], main button, main input:not([type=radio]), main select, footer a')]
          .filter((e) => e.getClientRects().length && !e.closest('[hidden]'));
        const tapados = [];
        let vistos = 0;
        for (const e of lista) {
          if (barra.hidden) break;
          e.focus();
          await new Promise((r) => { setTimeout(r, 20); });
          vistos += 1;
          const r = e.getBoundingClientRect();
          const b = barra.getBoundingClientRect();
          const ix = Math.max(0, Math.min(r.right, b.right) - Math.max(r.left, b.left));
          const iy = Math.max(0, Math.min(r.bottom, b.bottom) - Math.max(r.top, b.top));
          if (ix * iy > 0) tapados.push((e.getAttribute('aria-label') || e.textContent).trim().slice(0, 30));
        }
        return { tapados, vistos, total: lista.length, sigue: !barra.hidden };
      });
      t.ok(res.sigue, `[${sitio} ${nv}] la barra se fue antes de acabar (${res.vistos} de ${res.total})`);
      t.ok(res.tapados.length === 0, `[${sitio} ${nv}] la barra tapa: ${res.tapados.join(' ; ')}`);
      await ctx.close();
    }
  }
}
