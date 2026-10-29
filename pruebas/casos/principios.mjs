// Los principios de Nosotros a 320 px con el texto espaciado (WCAG 1.4.12):
// siguen en una fila de tres (seccion 10 del plan) y ningun nombre se sale
// ni se recorta: la palabra se parte antes. Y #/contacto, que se lleva lo
// del pie quitado: los contactos con la nota de que son de ejemplo y si esta
// abierto.
import { VENTANAS, espera } from '../arranque.mjs';

export const descripcion = 'principios de Nosotros a 320 px con texto espaciado, y contactos con la nota de ejemplo en #/contacto';
export const limite = 60;

const ESPACIADO = '*:not(svg *){line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important} p{margin-bottom:2em!important}';

export default async function principios(t) {
  for (const [sitio, base, ruta] of [['react', t.REACT, '#/nosotros']]) {
    const ctx = await t.contexto({ ...VENTANAS.m320, reducedMotion: 'reduce' }, { nombre: sitio });
    const p = await ctx.newPage();
    await p.goto(base + ruta);
    await p.waitForSelector('.principios > li');
    await p.addStyleTag({ content: ESPACIADO });
    await espera(300);
    const m = await p.evaluate(() => {
      const caja = document.querySelector('.principios');
      const c = caja.getBoundingClientRect();
      const tarjetas = [...caja.children].map((d) => {
        const r = d.getBoundingClientRect();
        const desborda = [...d.querySelectorAll('h3, p')].some((e) => e.scrollWidth > e.clientWidth + 1);
        return { izq: r.left, der: r.right, desborda };
      });
      return { columnas: getComputedStyle(caja).gridTemplateColumns.split(' ').length, ancho: [c.left, c.right], tarjetas, pagina: document.documentElement.scrollWidth };
    });
    t.ok(m.columnas === 3, `[${sitio}] los principios van en ${m.columnas} columnas a 320 px`);
    m.tarjetas.forEach((x, i) => {
      t.ok(x.izq >= 0 && x.der <= 320, `[${sitio}] el principio ${i + 1} se sale: ${Math.round(x.izq)}..${Math.round(x.der)}`);
      t.ok(!x.desborda, `[${sitio}] el texto del principio ${i + 1} no cabe`);
    });
    t.ok(m.pagina <= 320, `[${sitio}] la pagina mide ${m.pagina} px de ancho`);
    await ctx.close();
  }

  // #/contacto: WhatsApp y si esta abierto. La ayuda que esta en el mismo sitio en todas
  // las vistas (3.2.6) es Contactanos en el menu.
  const ctx = await t.contexto(VENTANAS.escritorio, { nombre: 'contacto' });
  const p = await ctx.newPage();
  await p.goto(t.REACT + '#/contacto');
  await p.waitForSelector('.contacto-escribir');
  const c = await p.evaluate(() => {
    const escribir = document.querySelector('.contacto-escribir');
    return {
      contactos: escribir.querySelectorAll('.contacto-lista a').length,
      estado: Boolean(document.querySelector('.contacto-horario .open-label')),
      menu: Boolean(document.querySelector('#main-nav a[href="#/contacto"]')),
      pie: document.querySelectorAll('footer, .site-footer').length,
    };
  });
  t.ok(c.contactos >= 1 && c.estado, `#/contacto no trae los contactos (${c.contactos}) o el estado`);
  t.ok(c.menu && c.pie === 0, `Contactanos no esta en el menu o queda un pie (${JSON.stringify(c)})`);
  await ctx.close();
}
