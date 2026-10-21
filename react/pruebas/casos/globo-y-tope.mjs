// Dentro de la canasta, Escape con el globo de ayuda a la vista solo quita
// el globo (WCAG 1.4.13); el siguiente cierra la canasta. Y el "+" en el tope
// de 100 se ve apagado, en la ficha y en la linea. En los dos sitios.
import { VENTANAS, espera, esperaQue } from '../arranque.mjs';

export const descripcion = 'Escape con el globo en la canasta solo lo quita; el + en el tope se ve apagado (los dos sitios)';
export const limite = 90;

const globoVisible = (p) => p.evaluate(() => {
  const g = document.querySelector('.globo');
  return Boolean(g && !g.hidden && g.classList.contains('is-open'));
});
const fondo = (p, sel) => p.evaluate((s) => getComputedStyle(document.querySelector(s)).backgroundColor, sel);

export default async function globoYTope(t) {
  for (const [sitio, base, ruta] of [['react', t.REACT, '#/tienda-catalogo'], ['actual', t.ACTUAL, '#tienda-catalogo']]) {
    const ctx = await t.contexto(VENTANAS.escritorio, { nombre: sitio });
    const p = await ctx.newPage();
    const ok = (c, q) => t.ok(c, `[${sitio}] ${q}`);
    await p.goto(base + ruta);
    await p.waitForSelector('.product-card:not([hidden]) .card-mas');
    const ficha = p.locator('.product-card:not([hidden])').filter({ has: p.locator('.card-mas') }).first();
    const masNormal = await ficha.locator('.card-mas').evaluate((b) => getComputedStyle(b).backgroundColor);
    await ficha.locator('.card-mas').click();
    // Al tope, escribiendo la cantidad.
    await ficha.locator('.card-numero').fill('100');
    await ficha.locator('.card-numero').press('Enter');
    await esperaQue(async () => (await ficha.locator('.card-mas').getAttribute('aria-disabled')) === 'true');
    await espera(300);
    const masTope = await ficha.locator('.card-mas').evaluate((b) => getComputedStyle(b).backgroundColor);
    ok(masTope !== masNormal, `el + de la ficha en el tope se ve igual (${masTope})`);

    // La canasta, con el teclado.
    await p.focus('.floating-whatsapp.is-canasta');
    await p.keyboard.press('Enter');
    await p.waitForSelector('.canasta-panel.is-open .canasta-linea');
    await espera(400);
    const masLinea = await fondo(p, '.canasta-panel.is-open [data-mas]');
    ok(masLinea === masTope, `el + de la linea en el tope (${masLinea}) no se ve como el de la ficha (${masTope})`);
    // Al primer boton con data-tip de la canasta, tabulando.
    let conGlobo = false;
    for (let k = 0; k < 15 && !conGlobo; k += 1) {
      await p.keyboard.press('Tab');
      await espera(60);
      conGlobo = await p.evaluate(() => Boolean(document.activeElement?.dataset?.tip)) && await globoVisible(p);
    }
    ok(conGlobo, 'tabulando en la canasta no salio el globo');
    await p.keyboard.press('Escape');
    await espera(250);
    ok(!(await globoVisible(p)), 'Escape no quito el globo');
    ok(await p.isVisible('.canasta-panel.is-open'), 'Escape con el globo cerro tambien la canasta');
    await p.keyboard.press('Escape');
    await esperaQue(async () => !(await p.isVisible('.canasta-panel.is-open')), 10);
    ok(!(await p.isVisible('.canasta-panel.is-open')), 'el segundo Escape no cerro la canasta');
    await ctx.close();
  }
}
