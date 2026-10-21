// "Inicia sesion para pagar" en pantallas bajas (el telefono tumbado): la
// hoja no se sale por arriba, se desplaza dentro de la canasta y el foco
// sigue dando la vuelta dentro de ella.
import { espera, esperaQue } from '../arranque.mjs';

export const descripcion = 'la hoja de "Inicia sesion para pagar" cabe en 640x360 y 844x390';
export const limite = 90;

const BAJAS = { '640x360': { width: 640, height: 360 }, '844x390': { width: 844, height: 390 } };

export default async function hojaPagarBaja(t) {
  for (const [sitio, base, ruta] of [['react', t.REACT, '#/tienda-catalogo']]) {
    for (const [nv, viewport] of Object.entries(BAJAS)) {
      const ctx = await t.contexto({ viewport, hasTouch: true, isMobile: true, reducedMotion: 'reduce' }, { nombre: `${sitio}-${nv}` });
      const p = await ctx.newPage();
      const ok = (c, q) => t.ok(c, `[${sitio} ${nv}] ${q}`);
      await p.goto(base + ruta);
      await p.waitForSelector('.product-card:not([hidden]) .card-mas');
      await p.locator('.product-card:not([hidden]) .card-mas').first().click();
      await p.click('.floating-whatsapp.is-canasta');
      await p.waitForSelector('.canasta-panel.is-open .canasta-enviar');
      await espera(300);
      await p.click('.canasta-enviar');
      const salio = await esperaQue(() => p.isVisible('.pide-cuenta-hoja'));
      ok(salio, 'no salio la hoja de iniciar sesion');
      if (!salio) { await ctx.close(); continue; }
      await espera(300);
      const m = await p.evaluate(() => {
        const r = (s) => document.querySelector(s).getBoundingClientRect();
        return { alto: innerHeight, hoja: r('.pide-cuenta-hoja').top, titulo: r('.pide-cuenta-hoja h3').top };
      });
      ok(m.hoja >= 0 && m.titulo >= 0, `la hoja empieza en ${Math.round(m.hoja)} y su titulo en ${Math.round(m.titulo)}`);
      // Tabulando, cada boton de la hoja se ve entero y el foco no sale de ella.
      const vistos = new Set();
      for (let k = 0; k < 8; k += 1) {
        await p.keyboard.press('Tab');
        await espera(120);
        const f = await p.evaluate(() => {
          const a = document.activeElement;
          const r = a.getBoundingClientRect();
          return { dentro: Boolean(a.closest('.pide-cuenta-hoja')), texto: a.textContent.trim().slice(0, 30), arriba: r.top, abajo: r.bottom, alto: innerHeight };
        });
        ok(f.dentro, `el foco salio de la hoja: "${f.texto}"`);
        ok(f.arriba >= 0 && f.abajo <= f.alto + 1, `"${f.texto}" queda fuera de la pantalla (${Math.round(f.arriba)}..${Math.round(f.abajo)})`);
        vistos.add(f.texto);
      }
      ok(vistos.size >= 3, `el tabulador solo pasa por ${vistos.size} cosas de la hoja`);
      await ctx.close();
    }
  }
}
